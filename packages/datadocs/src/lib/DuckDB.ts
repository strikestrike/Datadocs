/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  selectBundle,
  ConsoleLogger,
  VoidLogger,
  AsyncDuckDB,
} from "@datadocs/duckdb-wasm";
import type { DuckDBBundles } from "@datadocs/duckdb-wasm";

// import duckdb_wasm from "@datadocs/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import duckdb_wasm_eh from "@datadocs/duckdb-wasm/dist/duckdb-eh.wasm?url";
// import duckdb_wasm_coi from "@datadocs/duckdb-wasm/dist/duckdb-coi.wasm?url";
// import duckdb_worker from "@datadocs/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import duckdb_worker_eh from "@datadocs/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";
// import duckdb_worker_coi from "@datadocs/duckdb-wasm/dist/duckdb-browser-coi.worker.js?url";
// import duckdb_worker_coi_pthread from "@datadocs/duckdb-wasm/dist/duckdb-browser-coi.pthread.worker.js?url";

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

export const DuckDB = async () => {
  // Select a bundle based on browser checks
  const bundle = await selectBundle(DUCKDB_BUNDLES);

  // Instantiate the asynchronus version of DuckDB-wasm
  const worker = new Worker(bundle.mainWorker);

  const logger = new ConsoleLogger();
  // const logger = new VoidLogger();
  const db = new AsyncDuckDB(logger, worker);

  await db.instantiate(bundle.mainModule);

  console.log("init db success ==================== ");
  return db;
};
