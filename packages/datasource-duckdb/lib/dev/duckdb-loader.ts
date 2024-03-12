import {
  selectBundle,
  ConsoleLogger,
  AsyncDuckDB,
} from '@datadocs/duckdb-wasm';
import type { DuckDBBundles } from '@datadocs/duckdb-wasm';

// import duckdb_wasm from '@datadocs/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import duckdb_wasm_eh from '@datadocs/duckdb-wasm/dist/duckdb-eh.wasm?url';
// import duckdb_wasm_coi from '@datadocs/duckdb-wasm/dist/duckdb-coi.wasm?url';
// import duckdb_worker from '@datadocs/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_worker_eh from '@datadocs/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';
// import duckdb_worker_coi from '@datadocs/duckdb-wasm/dist/duckdb-browser-coi.worker.js?url';
// import duckdb_worker_coi_pthread from '@datadocs/duckdb-wasm/dist/duckdb-browser-coi.pthread.worker.js?url';

import { injectSQLRunnerToWindow } from '../RunSQL';

const DUCKDB_BUNDLES: DuckDBBundles = {
  mvp: {
    mainModule: duckdb_wasm_eh,
    mainWorker: duckdb_worker_eh,
  },
  eh: {
    mainModule: duckdb_wasm_eh,
    mainWorker: duckdb_worker_eh,
  },
  // coi: {
  //   mainModule: duckdb_wasm_coi,
  //   mainWorker: duckdb_worker_coi,
  //   pthreadWorker: duckdb_worker_coi_pthread,
  // },
};

const cacheKey = '__loaded_duckdb';
export const DuckDB = async (): Promise<AsyncDuckDB> => {
  if (window[cacheKey]) return window[cacheKey];

  // Select a bundle based on browser checks
  const bundle = await selectBundle(DUCKDB_BUNDLES);

  // Instantiate the asynchronus version of DuckDB-wasm
  const worker = new Worker(bundle.mainWorker);

  const logger = new ConsoleLogger();
  logger.log = (entry) => {
    const sql = String(entry.value || '');
    const head =
      sql.length > 48 ? sql.replaceAll('\n', ' ').slice(0, 48) + '...' : sql;
    console.groupCollapsed(`Query: ${head}`);
    console.trace(entry.value);
    console.groupEnd();
  };

  const db = new AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule);
  window[cacheKey] = db;
  injectSQLRunnerToWindow(db);
  console.log('init db success ==================== ');
  return db;
};
