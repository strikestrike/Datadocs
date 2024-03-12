import type { AsyncDuckDB } from '@datadocs/duckdb-wasm';

export function injectSQLRunnerToWindow(db: AsyncDuckDB, injectName = 'sql') {
  window[injectName] = async function runSQL(sql: string, max = 50) {
    const conn = await db.connect();
    try {
      const cursor = await conn.send(sql);
      let loadedRows = 0;
      for await (const batch of cursor) {
        for (const row of batch) {
          console.log(row.toArray());
          if (++loadedRows >= max) {
            console.log('...');
            await cursor.cancel();
            break;
          }
        }
        if (cursor.closed) break;
      }
    } finally {
      await conn.close();
    }
  };
  console.log(
    `DuckDB SQL runner function: window.${injectName}(sql: string, max = 50)`,
  );
}
