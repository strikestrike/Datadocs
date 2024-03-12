import type { AsyncDuckDBConnection } from "@datadocs/duckdb-wasm";

const countMax = 1000000000;
let elapsedCount = 0;
/**
 * Function to measure elapsed time
 * @param conn
 * @returns
 */
export async function measureElapsedTime(conn: AsyncDuckDBConnection) {
  if (!conn) {
    return;
  }
  // measure elapsed time
  let query_str =
    "CREATE MACRO elapsedtime() AS (SELECT count(1) FROM range(" +
    countMax +
    "));";
  await conn.query(query_str);
  query_str = "SELECT elapsedtime();";
  const t1: number = new Date().getTime();
  await conn.query(query_str);
  let t2: number = new Date().getTime();
  query_str = "DROP MACRO elapsedtime;";
  await conn.query(query_str);
  if (t2 <= t1) {
    t2 = t1 + 1;
  }
  elapsedCount = parseInt(((countMax * 1000) / (t2 - t1)).toFixed(), 10);
  console.log("Elapsed time : ", t2 - t1, "ms, count : ", elapsedCount);
}

/**
 * Function to create sleep macro function
 * @param interval
 * @param conn
 * @returns
 */
export async function createSleepMacro(
  interval: number,
  conn: AsyncDuckDBConnection
) {
  if (!conn) {
    return;
  }
  // create macro
  const query_str =
    "CREATE MACRO sleep" +
    interval +
    "() AS (SELECT count(1) FROM range(" +
    elapsedCount * interval +
    "));";
  console.log(query_str);
  await conn.query(query_str);
}
