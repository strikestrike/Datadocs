import type { AsyncDuckDBConnection } from '@datadocs/duckdb-wasm';
import {
  DuckDBDataProtocol,
  type AsyncDuckDB,
  createOPFSFileHandle,
  DuckDBAccessMode,
} from '@datadocs/duckdb-wasm';
import { LogsWriter } from './logs';
import { DuckDB } from './duckdb-loader';
import { LocalDatabaseLock } from '../local-db-lock';

main().catch((error) => {
  console.error(error);
});
async function main() {
  const testPath = {
    db: '/test-duckdb.db',
    wal: '/test-duckdb.db.wal',
  };
  const getButton = (id: string) =>
    document.getElementById(id) as HTMLButtonElement;

  let duckdb: AsyncDuckDB;
  let querying: Promise<void> | undefined;
  let openedFile = false;

  const logs = new LogsWriter(document.getElementById('txtLogs')!);
  const lock = new LocalDatabaseLock(async (dbName: string) => {
    if (!openedFile) return;
    if (querying) await querying;

    await duckdb.flushFiles();
    await duckdb.open({});

    const dbPath = dbName;
    const walPath = dbName + '.wal';
    await duckdb.closeFile(dbPath);
    logs.addText(`closed file ${dbPath}`);

    await duckdb.closeFile(walPath);
    logs.addText(`closed file ${walPath}`);

    openedFile = false;
  });
  lock.bindLogger(logs.addText.bind(logs));
  logs.addText(`the client id of the tab: ${lock.clientId}`);

  getButton('btnCleanOPFS').addEventListener('click', cleanOPFS);
  getButton('btnQuery').addEventListener('click', queryDB);

  initDuckDB().catch((error) => {
    console.error(error);
    logs.addText(error.message, 'e');
  });

  async function cleanOPFS() {
    await lock.release(testPath.db);
    const opfs = await navigator.storage.getDirectory();
    for await (const fileName of opfs.keys()) {
      logs.addText(`removing ${fileName} from opfs ...`);
      try {
        await opfs.removeEntry(fileName, { recursive: true });
      } catch (error) {
        console.error(error);
        logs.addText((error as Error).message, 'e');
      }
    }
  }

  async function initDuckDB() {
    logs.addText('initializing DuckDB ...');
    duckdb = await DuckDB();
    logs.addText('DuckDB is initialized');
  }

  async function queryDB() {
    if (querying) return logs.addText(`another query is running ...`, 'e');
    const safeQueryDB = errorToLogs(_queryDB);
    querying = safeQueryDB().then(() => (querying = undefined));
  }

  async function _queryDB() {
    const { db, wal } = testPath;
    const ok = await lock.acquire(db);
    if (!ok) return;

    if (!openedFile) {
      const dirHandle = await navigator.storage.getDirectory();
      const dbHandle = await createOPFSFileHandle(db, dirHandle, {
        create: true,
        emptyAsAbsent: true,
      });
      const walHandle = await createOPFSFileHandle(wal, dirHandle, {
        create: true,
        emptyAsAbsent: true,
      });

      await duckdb.registerFileHandle(
        db,
        dbHandle,
        DuckDBDataProtocol.BROWSER_FSACCESS,
        true,
      );
      await duckdb.registerFileHandle(
        wal,
        walHandle,
        DuckDBDataProtocol.BROWSER_FSACCESS,
        true,
      );
      logs.addText(`registerd files ${db} and ${wal} into DuckDB`);
      openedFile = true;

      logs.addText(`duckdb.open(${db}) ...`);
      await duckdb.open({
        path: db,
        accessMode: DuckDBAccessMode.READ_WRITE,
      });
    }
    logs.addText('querying duckdb ...');
    const safeRunSQL = errorToLogs(runSQL);

    const conn = await duckdb.connect();
    // await safeRunSQL('SHOW DATABASES', conn);
    const tables = (await safeRunSQL('SHOW TABLES', true, conn))!.map(
      (it) => it[0],
    );
    if (tables.indexOf('testtable') < 0)
      await safeRunSQL(
        'CREATE TABLE testtable (val_int INT64, val_str VARCHAR);',
        false,
        conn,
      );

    await safeRunSQL(
      `INSERT INTO testtable VALUES (${Date.now()}, '${new Date().toJSON()}')`,
      false,
      conn,
    );
    const sleep = 5000;
    logs.addText(`Sleeping ${sleep} for simulating a long time query ...`);
    await new Promise<void>((resolve) => setTimeout(resolve, sleep));
    await safeRunSQL(
      `SELECT * FROM testtable ORDER BY val_int DESC`,
      true,
      conn,
    );
    await conn.close();
  }

  async function runSQL(
    sql: string,
    showResult: boolean,
    conn?: AsyncDuckDBConnection,
  ) {
    logs.addText(`run: ${sql}`);
    let needToCloseConn = false;
    if (!conn) {
      needToCloseConn = true;
      conn = await duckdb.connect();
    }
    const { headers, rows } = await execSQLAndReadAllRows(conn, sql, 11);
    if (showResult) {
      const code: string[] = [headers.join('\t'), '================='];
      for (const row of rows) code.push(row.join('\t'));
      logs.addCode(code.join('\n'));
    }
    if (needToCloseConn) await conn.close();
    return rows;
  }
  function errorToLogs<ParamType extends any[], ResultType>(
    fn: (...args: ParamType) => Promise<ResultType>,
    fnName?: string,
  ) {
    if (!fnName) fnName = fn.name || 'anonymous function';
    return async function wrapFn(
      ...args: ParamType
    ): Promise<ResultType | undefined> {
      try {
        return await fn(...args);
      } catch (error) {
        console.error(error);
        logs.addText(
          `failed to execute ${fnName}: ${(error as Error).message}`,
          'e',
        );
      }
    };
  }

  async function execSQLAndReadAllRows(
    conn: AsyncDuckDBConnection,
    sql: string,
    limit?: number,
  ) {
    if (typeof limit !== 'number') limit = Infinity;
    const rows: any[][] = [];
    let headers: string[] | undefined;
    const stream = await conn.send(sql);
    const recordsInBatch = await stream.readAll();

    for (const records of recordsInBatch) {
      if (!headers) headers = records.schema.fields?.map((it) => it.name) || [];
      for (const record of records) {
        if (rows.length >= limit) break;
        rows.push(record.toArray());
      }
    }

    if (!headers) headers = [];
    return { headers, rows };
  }
}
