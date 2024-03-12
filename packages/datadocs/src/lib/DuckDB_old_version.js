const libraryVersion = "0.0.41-dev427.0"; //"0.1.12-dev54.0";
const distURL = `https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@${libraryVersion}/dist/`;

const DUCKDB_BUNDLES = {
  asyncDefault: {
    mainModule: new URL("duckdb.wasm", distURL).toString(),
    mainWorker: new URL("duckdb-browser-async.worker.js", distURL).toString(),
  },
  asyncNext: {
    mainModule: new URL(`duckdb-next.wasm`, distURL).toString(),
    mainWorker: new URL(
      "duckdb-browser-async-next.worker.js",
      distURL
    ).toString(),
  },
  asyncNextCOI: {
    mainModule: new URL("duckdb-next-coi.wasm", distURL).toString(),
    mainWorker: new URL(
      "duckdb-browser-async-next-coi.worker.js",
      distURL
    ).toString(),
    pthreadWorker: new URL(
      "duckdb-browser-async-next-coi.pthread.worker.js",
      distURL
    ).toString(),
  },
};

export async function DuckDB() {
  const duckdb = await import(
    `https://cdn.skypack.dev/@duckdb/duckdb-wasm@${libraryVersion}`
  );
  const bundle = await duckdb.selectBundle(DUCKDB_BUNDLES);

  // download worker script
  const workerReq = await fetch(bundle.mainWorker);
  const workerScript = await workerReq.text();
  const workerScriptBlob = new Blob([workerScript], {
    type: "application/javascript",
  });
  const workerURL = URL.createObjectURL(workerScriptBlob);

  // download WASM
  const wasmReq = await fetch(bundle.mainModule);
  const wasmURL = URL.createObjectURL(await wasmReq.blob());

  let pThreadURL;

  // download Wasm
  if (!bundle.pthreadWorker) {
    pThreadURL = undefined;
  } else {
    const pthreadReq = await fetch(bundle.pthreadWorker);
    pThreadURL = URL.createObjectURL(await pthreadReq.blob());
  }

  const logger = new duckdb.ConsoleLogger();
  const worker = new Worker(workerURL);
  const duck_db = new duckdb.AsyncDuckDB(logger, worker);
  await duck_db.instantiate(wasmURL, pThreadURL);

  console.log(duck_db.getVersion());

  return duck_db;
}
