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
import { DatabaseQueryProvider } from '../db-manager-spec';
import { PersistentDuckDBQueryProvider } from '../db-manager-persistent';

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

  let querying: Promise<void> | undefined;
  const logs = new LogsWriter(document.getElementById('txtLogs')!);
  getButton('btnCleanOPFS').addEventListener('click', cleanOPFS);
  getButton('btnQuery').addEventListener('click', queryDB);

  let duckdb: AsyncDuckDB;
  try {
    logs.addText('initializing DuckDB ...');
    duckdb = await DuckDB();
    logs.addText('DuckDB is initialized');
  } catch (error: any) {
    console.error(error);
    logs.addText(error.message, 'e');
    return;
  }
  const dbQuery = new PersistentDuckDBQueryProvider(duckdb, undefined, {});
  await dbQuery.useDatabase('/dd-local-storage/test.db');

  async function cleanOPFS() {
    await dbQuery.closeDBFiles();
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

  async function queryDB() {
    if (querying) return logs.addText(`another query is running ...`, 'e');
    const safeQueryDB = errorToLogs(_queryDB);
    querying = safeQueryDB().then(() => (querying = undefined));
  }

  async function _queryDB() {
    logs.addText('querying duckdb ...');
    const safeRunSQL = errorToLogs(runSQL);

    const connId = await dbQuery.createConnection();
    // await safeRunSQL('SHOW DATABASES', conn);
    const tables = (await safeRunSQL('SHOW TABLES', true, connId))!.map(
      (it) => it[0],
    );
    if (tables.indexOf('testtable') < 0)
      await safeRunSQL(
        'CREATE TABLE testtable (val_int INT64, val_str VARCHAR);',
        false,
        connId,
      );

    await safeRunSQL(
      `INSERT INTO testtable VALUES (${Date.now()}, '${new Date().toJSON()}')`,
      false,
      connId,
    );
    const sleep = 5000;
    logs.addText(`Sleeping ${sleep} for simulating a long time query ...`);
    await new Promise<void>((resolve) => setTimeout(resolve, sleep));
    await safeRunSQL(
      `SELECT * FROM testtable ORDER BY val_int DESC`,
      true,
      connId,
    );
    await dbQuery.closeConnection(connId);
  }

  async function runSQL(sql: string, showResult: boolean, connId?: string) {
    logs.addText(`run: ${sql}`);

    const batches = await dbQuery.queryAll(sql, connId, 11);
    let headers: string[] | undefined;
    const rows: any[] = [];
    for (const batch of batches) {
      if (!headers) headers = batch.schema.fields.map((it) => it.name);
      for (const row of batch) rows.push(row.toArray());
    }
    if (showResult) {
      const code: string[] = headers
        ? [headers.join('\t'), '=================']
        : [];
      for (const row of rows) code.push(row.join('\t'));
      logs.addCode(code.join('\n'));
    }
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
}
