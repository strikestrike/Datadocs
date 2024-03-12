import {
  createOPFSFileHandle,
  type AsyncDuckDB,
  type DuckDBConfig,
  DuckDBDataProtocol,
  DuckDBAccessMode,
} from '@datadocs/duckdb-wasm';
import { SimpleDuckDBQueryProvider } from '@datadocs/local-storage';
import { LocalDatabaseLock } from './local-db-lock';

const logPrefix = '[PersistentDuckDB]';

export type ConnectionExtraInfo = {
  closed?: Promise<void>;
  close?: () => void;
};

export class PersistentDuckDBQueryProvider extends SimpleDuckDBQueryProvider {
  readonly lock: LocalDatabaseLock;
  readonly connExtra: Map<string, ConnectionExtraInfo>;

  /**
   * `undefined` or an empty string represents in-memory database.
   * TODO: we need to add one more field for tracking attached database file if
   * we need to support attach persistent database in DuckDB
   */
  private dbName: string | undefined;
  private openedFile = false;
  readonly baseConfig: Readonly<DuckDBConfig>;

  constructor(
    store: AsyncDuckDB,
    prefix = 'conn',
    baseConfig: Readonly<DuckDBConfig> = {},
  ) {
    super(store, prefix);
    this.baseConfig = baseConfig;
    this.connExtra = new Map();

    /** Implemetation for Releasing Database  */
    const releaseImpl: typeof this.releaseDatabase =
      this.releaseDatabase.bind(this);
    this.lock = new LocalDatabaseLock(releaseImpl);
  }

  async closeDBFiles() {
    const { dbName, store, openedFile } = this;
    if (!openedFile || !dbName) return;

    const dbPath = dbName;
    const walPath = dbName + '.wal';
    await store.closeFile(dbPath);
    console.log(`${logPrefix} closed file ${dbPath}`);

    await store.closeFile(walPath);
    console.log(`${logPrefix} closed file ${walPath}`);

    this.openedFile = false;
  }

  /**
   * We don't need to call this method manullay, this method is used for the lock.
   * @see LocalDatabaseLock
   */
  async releaseDatabase(dbName: string) {
    const currentDBName = this.dbName;
    if (!currentDBName || dbName !== currentDBName) return;
    if (!this.openedFile) return;

    const { connExtra, store } = this;
    // console.log('connExtra =', connExtra.entries());

    if (connExtra.size > 0) {
      const allConns = Array.from(connExtra.entries());
      const connIds = allConns.map((it) => it[0]);
      console.log(`waiting for connections to be closed: ${connIds} ...`);
      const promises: Promise<unknown>[] = [];
      allConns.forEach((it) => {
        if (it[1].closed) promises.push(it[1].closed);
      });
      await Promise.all(promises);
      connExtra.clear();
    }
    await store.flushFiles();
    await store.open({ ...this.baseConfig });
    await this.closeDBFiles();
    this.dbName = undefined;
    // because current database is in-memory
    // we don't have to open again
    this.openedFile = true;
    console.log(`${logPrefix} released database`);
    // todo: bug: we need to re-open database file when the ownership is changed to other tab
  }

  async useDatabase(dbName?: string) {
    const prevDBName = this.dbName || '';
    const nextDBName = dbName || '';

    // console.log(
    //   [
    //     `${logPrefix} useDatabase(${nextDBName})`,
    //     `this.dbName=${prevDBName}`,
    //     `openedFile=${this.openedFile}`,
    //   ].join(' '),
    // );
    if (prevDBName === nextDBName) return;
    if (prevDBName) {
      const numOfConns = this.connExtra.size;
      if (numOfConns > 0) {
        const errMsg = `Failed to use db "${dbName}", because there are still ${numOfConns} conns to the old db "${prevDBName}"`;
        throw new Error(errMsg);
      }
      await this.closeDBFiles();
    }
    // the new database file needs to be open
    if (nextDBName) this.openedFile = false;
    this.dbName = nextDBName;
  }

  override async closeConnection(connId: string): Promise<void> {
    try {
      await super.closeConnection(connId);
    } finally {
      const connExtra = this.connExtra.get(connId);
      // console.log(`closeConnection`, connId, connExtra);
      // console.log(`resolving the promise of the connection ${connId}`);
      if (connExtra) {
        this.connExtra.delete(connId);
        connExtra.close?.();
      }
    }
  }

  override async createConnection(): Promise<string> {
    const currentDBName = this.dbName;
    // console.log(`createConnection (${currentDBName}, ${this.openedFile}) ...`);
    if (currentDBName) {
      await this.lock.acquire(currentDBName);
      if (!this.openedFile) {
        // TODO: add lock for simultaneously creating connection
        const dbPath = currentDBName;
        const walPath = currentDBName + '.wal';
        let dirHandle = await navigator.storage.getDirectory();

        const dirNames = dbPath.split('/').filter(Boolean);
        dirNames.pop(); // remove file name
        while (dirNames.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const dirName = dirNames.shift()!;
          dirHandle = await dirHandle.getDirectoryHandle(dirName, {
            create: true,
          });
        }

        const dbHandle = await createOPFSFileHandle(dbPath, dirHandle, {
          create: true,
          emptyAsAbsent: true,
        });
        const walHandle = await createOPFSFileHandle(walPath, dirHandle, {
          create: true,
          emptyAsAbsent: true,
        });

        const { store } = this;
        await store.registerFileHandle(
          dbPath,
          dbHandle,
          DuckDBDataProtocol.BROWSER_FSACCESS,
          true,
        );
        await store.registerFileHandle(
          walPath,
          walHandle,
          DuckDBDataProtocol.BROWSER_FSACCESS,
          true,
        );
        console.log(`registerd files ${dbPath} and ${walPath} for DuckDB`);
        this.openedFile = true;

        console.log(`duckdb.open(${dbPath}) ...`);
        await store.open({
          accessMode: DuckDBAccessMode.READ_WRITE,
          ...this.baseConfig,
          path: dbPath,
        });
      }
    }
    const connID = await super.createConnection();
    const extraInfo: ConnectionExtraInfo = {};
    extraInfo.closed = new Promise<void>((resolve) => {
      extraInfo.close = resolve;
    });
    this.connExtra.set(connID, extraInfo);
    return connID;
  }

  getAllConnectionIds() {
    return Array.from(this.connExtra.keys());
  }
}
