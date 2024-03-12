import { writable } from "svelte/store";
import { openModal } from "../../common/modal";
import ExecSQLModal from "./ExecSQLModal.svelte";
import type { RecordBatch } from "apache-arrow";
import type { DuckDBManager } from "../../../app/store/db-manager";

/**
 * This function is used for executing any non-DQL SQL in TestQuery.svelte
 */
export async function execSQL(db: DuckDBManager, connID: string, sql: string) {
  const result = writable<{ elapsed?: number; error?: string }>({});
  const resultData = writable<string>();
  const executing = writable<boolean>(true);
  openModal({
    component: ExecSQLModal,
    props: { sql, executing, result, resultData },
    isMovable: false,
    isResizable: false,
    preferredWidth: 450,
  });
  const from = Date.now();
  let execResult: RecordBatch[];
  try {
    execResult = await db.all(sql, connID);
  } catch (error) {
    console.error(error);
    result.set({ error: error.message });
    return executing.set(false);
  }
  // create table a(id int, name varchar);
  result.set({ elapsed: Date.now() - from });
  let header: string | undefined;
  const data = [];
  for (const batch of execResult) {
    if (!header) header = batch.schema.names.join(", ");
    for (const row of batch) data.push(row.toArray().join(", "));
  }
  if (data.length === 0 && (!header || header === "Count")) data.push("OK");
  else data.unshift(header);
  resultData.set(data.join("\n"));
  return executing.set(false);
}
