//@ts-nocheck
import type { IDBPDatabase } from 'idb';
import { deleteDB } from 'idb';
import type {
  LocalDuckDBEntry,
  LocalDuckDBEntrySource,
  LocalDatabaseSchema,
  LocalDuckDBWAL,
  AddDuckDBWALPayload,
} from './idb';
import { initLocalDatabaseIDB, localDatabaseIDBName } from './idb-init';
import { boundKeyRange, listAllFromCursor } from './idb-utils';

export class DuckDBLocalPersistence {
  private static _defaults: DuckDBLocalPersistence;
  static defaults() {
    const This = DuckDBLocalPersistence;
    if (!This._defaults) This._defaults = new This();
    return This._defaults;
  }
  static getDirNameFromDBId(dbId: number | string) {
    return 'db-' + String(dbId).padStart(4, '0');
  }
  static getRangeForLogs(dbId: number, firstLogId: number) {
    return boundKeyRange<LocalDatabaseSchema, 'walV1'>(
      [dbId, firstLogId],
      [dbId + 1, 0],
      false, // close
      true, //  open
    );
  }

  private idb: IDBPDatabase<LocalDatabaseSchema>;
  private opfs: FileSystemDirectoryHandle;
  private _initialzingIDB: boolean;
  private _initialzingOPFS: boolean;
  private _inited: boolean;

  async cleanAllForDev() {
    if (this.idb) {
      try {
        this.idb.close();
      } catch (error) {
        console.error(error);
      }
      delete this.idb;
    }
    this._initialzingIDB = false;
    try {
      await deleteDB(localDatabaseIDBName);
    } catch (error) {
      console.error(error);
    }
    await this.cleanOPFS();
    delete this.opfs;
    this._initialzingOPFS = false;
    this._inited = false;
  }

  private async _initIDB() {
    if (this.idb || this._initialzingIDB) return;
    this._initialzingIDB = true;
    this.idb = await initLocalDatabaseIDB();
    if (this.idb || this.opfs) this._inited = true;
  }
  private async _initOPFS() {
    if (this.opfs || this._initialzingOPFS) return;
    this._initialzingOPFS = true;
    this.opfs = await navigator.storage.getDirectory();
    if (this.idb || this.opfs) this._inited = true;
  }
  async init() {
    if (this._inited) return;
    await Promise.all([this._initIDB(), this._initOPFS()]);
  }

  async cleanOPFS(): Promise<string[]> {
    await this._initOPFS();
    const files = this.opfs.keys();
    const removed: string[] = [];
    for await (const file of files) {
      try {
        await this.opfs.removeEntry(file, { recursive: true });
        removed.push(file);
      } catch (error) {
        console.error(error);
      }
    }
    return removed;
  }

  async listIDB() {
    await this._initIDB();
    const tx = this.idb.transaction('localdbV1', 'readonly');
    return listAllFromCursor(await tx.store.openCursor());
  }

  async _updateDatabaseEntry(dbId: number, partial: Partial<LocalDuckDBEntry>) {
    const tx = this.idb.transaction('localdbV1', 'readwrite');
    const entry = await tx.store.get(dbId);
    if (entry) {
      delete partial.dbId;
      Object.assign(entry, partial);
      await tx.store.put(entry);
    }
    await tx.done;
    return entry;
  }

  async listWALogs(dbId: number, firstLogId = 1) {
    await this._initIDB();
    const keyRange = DuckDBLocalPersistence.getRangeForLogs(dbId, firstLogId);
    const tx = this.idb.transaction('walV1', 'readonly');
    const logs = await tx.store.openCursor(keyRange);
    return listAllFromCursor(logs);
  }

  async initOPFSDatabase(dbName: string) {
    // 1. generate database entry in idb
    await this._initIDB();
    const ctime = Date.now();
    const dbPayload: LocalDuckDBEntry = {
      dbName,
      sources: [],
      ctime,
      mtime: ctime,
      atime: ctime,
      version: 0,
      maxLogId: 0,
      mergedLogId: 0,
      currLogId: 0,
      totalSize: 0,
    };
    const dbId = await this.idb.put('localdbV1', dbPayload);
    dbPayload.dbId = dbId;
    console.log(`initialized db: ${dbId}`);

    // 2. mkdir base directory in OPFS
    await this._initOPFS();
    const baseDir = DuckDBLocalPersistence.getDirNameFromDBId(dbId);
    const dir = await this.opfs.getDirectoryHandle(baseDir, { create: true });

    return { dir, db: dbPayload };
  }

  async initOPFSDatabaseFromParquet(
    dbName: string,
    parquetBuffer: Uint8Array,
    tableName: string,
  ) {
    const { dir, db } = await this.initOPFSDatabase(dbName);
    const { file } = await this._updateParquetInOPFSDatabase(
      parquetBuffer,
      tableName,
      dir,
      db,
    );
    return { file, dir, db };
  }

  async updateParquetInOPFSDatabase(
    dbId: number,
    parquetBuffer: Uint8Array,
    tableName: string,
  ) {
    await this.init();
    const db = await this.idb.get('localdbV1', dbId);
    if (!db) throw new Error(`Local DuckDB entry "${dbId}" can't be found`);

    const baseDir = DuckDBLocalPersistence.getDirNameFromDBId(dbId);
    const dir = await this.opfs.getDirectoryHandle(baseDir, { create: true });
    return this._updateParquetInOPFSDatabase(parquetBuffer, tableName, dir, db);
  }

  private async _updateParquetInOPFSDatabase(
    parquetBuffer: Uint8Array,
    tableName: string,
    dir: FileSystemDirectoryHandle,
    db: LocalDuckDBEntry,
  ) {
    let oldSize = 0;
    let oldSource: LocalDuckDBEntrySource;
    db.sources = db.sources.filter((it) => {
      if (it.table !== tableName) return true;
      oldSource = it;
      return false;
    });
    if (oldSource) {
      oldSize = oldSource.size;
      if (oldSource.opfs) {
        // remove old parquet file
        await dir.removeEntry(oldSource.opfs);
      }
    }

    const now = Date.now();
    const normalizedTableName = tableName.replace(/[\W_]+/g, '_');
    const fileName = `${normalizedTableName}-${now}.parquet`;

    // write file into OPFS
    const fileHandle = await dir.getFileHandle(fileName, { create: true });
    const writer = await fileHandle.createWritable();
    await writer.write(parquetBuffer);
    await writer.close();

    const newFile = await fileHandle.getFile();
    const source: LocalDuckDBEntrySource = {
      size: newFile.size,
      mtime: now,
      table: tableName,
      opfs: fileName,
    };
    const diffSize = newFile.size - oldSize;
    db.mtime = now;
    db.totalSize += diffSize;
    db.version++;
    db.sources.push(source);
    await this.idb.put('localdbV1', db);
    return { file: newFile, db };
  }

  async accessDatabase(dbId: number) {
    return await this._updateDatabaseEntry(dbId, { atime: Date.now() });
  }

  async getParquetFileFromOPFS(dbId: number, fileName: string) {
    await this._initOPFS();

    const baseDir = DuckDBLocalPersistence.getDirNameFromDBId(dbId);
    const dir = await this.opfs.getDirectoryHandle(baseDir);
    return dir.getFileHandle(fileName);
  }

  async removeDatabase(dbId: number) {
    await this._initIDB();
    // delete item
    const db = await this.idb.get('localdbV1', dbId);
    const Self = DuckDBLocalPersistence;

    // delete logs
    const tx = this.idb.transaction('walV1', 'readwrite');
    let deletedLogs = 0;
    let cursor = await tx.store.openCursor(Self.getRangeForLogs(dbId, 1));
    while (cursor) {
      await cursor.delete();
      deletedLogs++;
      cursor = await cursor.continue();
    }

    // delete files
    await this._initOPFS();
    const baseDir = Self.getDirNameFromDBId(dbId);
    let deletedOPFS = false;
    try {
      await this.opfs.removeEntry(baseDir, { recursive: true });
      deletedOPFS = true;
    } catch (error) {
      // noop
    }
    return { db, deletedLogs, deletedOPFS };
  }

  async addWAL(db: LocalDuckDBEntry, payload: AddDuckDBWALPayload) {
    await this._initIDB();
    const logId = db.currLogId + 1;
    const wal: LocalDuckDBWAL = {
      dbId: db.dbId,
      logId,
      dbVersion: db.version,
      ctime: Date.now(),
      sql: payload.sql,
      execTime: payload.execTime,
      tables: payload.tables,
      undo: payload.undo,
    };

    const updatePayload: Partial<LocalDuckDBEntry> = {
      currLogId: db.currLogId,
    };
    if (logId > db.maxLogId) updatePayload.maxLogId = logId;
    await this.idb.put('walV1', wal);
    const newDB = await this._updateDatabaseEntry(db.dbId, updatePayload);
    return { db: newDB, wal };
  }

  async rollbackWAL(db: LocalDuckDBEntry, logId: number) {
    if (logId < db.mergedLogId || logId < 0)
      throw new Error(`The database can't be rolled back to the log ${logId}`);
    await this._initIDB();
    let log: LocalDuckDBWAL;
    if (logId > 0) {
      log = await this.idb.get('walV1', [db.dbId, logId]);
      if (!log) throw new Error(`The database log ${logId} can't be found`);
    }
    const newDB = await this._updateDatabaseEntry(db.dbId, {
      currLogId: logId,
    });
    return { db: newDB, log };
  }
}
