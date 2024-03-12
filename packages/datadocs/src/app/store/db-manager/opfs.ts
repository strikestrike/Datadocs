// OPFS: Origin private file system
// https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system

import { get } from "svelte/store";
import { activeWorkbookStore } from "../store-workbooks";

import { dumpOPFS } from "@datadocs/local-storage";
// export this method for debugging
// @todo remove it from the release version
window["dumpOPFS"] = dumpOPFS;

/**
 * user${number}: for storing user data
 * meta: for storaing view options/grid metadata
 */
export type InBrowserDuckDBFileType = `user${number}` | `meta`;
export function getDuckDBFile(
  type: InBrowserDuckDBFileType = "user0",
  workbook?: { id: string }
) {
  let guid: string | undefined;
  if (!workbook || !workbook.id) {
    const activeWorkbook = get(activeWorkbookStore);
    if (activeWorkbook) guid = activeWorkbook.id;
  }
  if (!guid)
    throw new Error(`Can not resolve the file path for unknown workbook`);
  return `duckdb/${guid}/${type}.db`;
}
