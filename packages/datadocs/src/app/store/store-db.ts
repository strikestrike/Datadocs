/**
 * @packageDocumentation
 * @module app/store-db
 */
import type { GridHeader } from "@datadocs/canvas-datagrid-ng";

import { get } from "svelte/store";

import { DuckDB } from "../../lib/DuckDB";
import { duckdbDatabaseManagerId, DuckDBManager } from "./db-manager";

import type { AsyncDuckDB } from "@datadocs/duckdb-wasm";
import type { OptimizedType, SchemaChildrenItemResult } from "./db-manager";
import {
  activeWorkbookStore,
  duckDBManager,
  optimizedType,
  queryConflictStrategy,
} from "./writables";
import { columnTypeToFullString } from "@datadocs/canvas-datagrid-ng/lib/utils/column-types";
import { MANAGED_FILE_DATABASE_SCHEMA_NAME } from "../../components/panels/Sources/constant";
import { createTemporarySourcePanelDatabase } from "./db-manager/uploaded-files";
import { getFileExtension } from "./db-manager/utils";

export { duckDBManager, optimizedType, queryConflictStrategy };

/**
 * Load duckDB database if not exist
 * @type Function
 */
export async function loadDuckDB() {
  if (getDuckDBManagerInstance()) {
    return;
  }
  const db: AsyncDuckDB = await DuckDB();
  const dbManager: DuckDBManager = new DuckDBManager(db);
  duckDBManager.set(dbManager);

  if (get(activeWorkbookStore)) {
    createTemporarySourcePanelDatabase();
  }

  // Create sleep macro for 1 second, 5 seconds, 10 seconds
  //   await measureElapsedTime(conn);
  //   await createSleepMacro(1, conn);
  //   await createSleepMacro(5, conn);
  //   await createSleepMacro(10, conn);
}

// Subscribe workbook for init Source Panel database
activeWorkbookStore.subscribe((wb) => {
  if (wb && getDuckDBManagerInstance()) {
    createTemporarySourcePanelDatabase();
  }
});

/**
 * Function to create connection from database manager
 * @returns
 */
export async function createConnection(): Promise<string> {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager) {
    return;
  }
  return dbManager.createConnection();
}

/**
 * Function to close connection from database manager
 * @param connID
 * @returns
 */
export async function closeConnection(connID: string) {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager) {
    return;
  }
  return await dbManager.closeConnection(connID);
}

/**
 * Get DuckDBManager instance
 * @returns DuckDBManager
 */
export function getDuckDBManagerInstance(): DuckDBManager {
  return get(duckDBManager);
}

/**
 * Update Optimized type
 * @param value
 * @returns
 */
export function updateOptimizedType(value: OptimizedType) {
  optimizedType.set(value);
}

/**
 * get header text from name and type
 * @param field
 * @returns object of header text
 */
export function getHeaderValue(field: GridHeader): string {
  const title = field.title || field.dataKey;
  return `${title}-${columnTypeToFullString(field.type)}`;
}

/**
 * Ingest/import a file
 * @type Function
 */
export async function ingestOrImportFile(
  file: File,
  tableName: string,
  type: "ingest" | "import" = "ingest"
) {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager) {
    return;
  }
  const connID: string = await dbManager.createConnection();
  const managedFileName = `${MANAGED_FILE_DATABASE_SCHEMA_NAME}.${tableName}`;

  const useDatadocsExtensionToImportFile = type === "ingest";
  const escapedName = await dbManager.importFile(
    file,
    managedFileName,
    connID,
    useDatadocsExtensionToImportFile
  );
  console.log(`Imported file: ${escapedName}`);
  await dbManager.closeConnection(connID);
}

/**
 * Function for ingest or import From Uploaded file in duckdb storage file
 * @param fileName
 * @param tableName
 * @param type
 * @returns
 */
export async function ingestOrImportFromUploadedFile(
  fileName: string,
  tableName: string,
  type: "ingest" | "import" = "ingest"
): Promise<boolean> {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager) {
    return false;
  }
  const connID: string = await dbManager.createConnection();
  const managedFileName = `${MANAGED_FILE_DATABASE_SCHEMA_NAME}.${tableName}`;

  const useDatadocsExtensionToImportFile = type === "ingest";
  const escapedName = await dbManager.importFileFromUploadedFile(
    fileName,
    managedFileName,
    connID,
    useDatadocsExtensionToImportFile
  );
  console.log(`Imported file From Uploaded File: ${escapedName}`);
  await dbManager.closeConnection(connID);

  if (escapedName) return true;
  return false;
}

/**
 * Function to save file to duckdb
 * @param file
 * @param paths
 */
export async function uploadedFile(file: File): Promise<string> {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager) {
    return;
  }
  // const fullName = (paths ? paths + "/" : "") + file.name;
  const fullName = `uploadedfiles__${crypto.randomUUID()}.${getFileExtension(
    file
  )}`;
  const res = await dbManager.createFile(file, fullName);
  if (!res) {
    return null;
  }
  return fullName;
}

export async function dropFile(fileName: string): Promise<boolean> {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager) {
    return;
  }
  const res = await dbManager.dropFile(fileName);
  return res;
}

/**
 * Get Current Schema
 * @returns
 */
export async function getCurrentActiveSchema(): Promise<string> {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager) {
    return null;
  }
  const connID: string = await dbManager.createConnection();
  const currentSchema = await dbManager.getCurrentSchema(connID);
  await dbManager.closeConnection(connID);
  return currentSchema;
}

/**
 * Function to create new schema
 * @param schemaName
 */
export async function createSchema(schemaName: string): Promise<void> {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager) {
    return null;
  }
  const connID: string = await dbManager.createConnection();
  await dbManager.createSchema(connID, schemaName);
  dbManager.closeConnection(connID);
}

/**
 * Function to get all tables and views of schema
 * @param schemaName
 * @returns
 */
export async function getTablesViewsBySchema(
  schemaName: string
): Promise<SchemaChildrenItemResult[]> {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager) {
    return null;
  }
  const connID: string = await dbManager.createConnection();
  const items = await dbManager.getTablesViewsBySchema(connID, schemaName);
  await dbManager.closeConnection(connID);
  return items;
}

export async function changeDatabaseItemName(
  schemaName: string,
  type: "TABLE" | "VIEW",
  oldName: string,
  newName: string
): Promise<boolean> {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager || oldName === newName) {
    return false;
  }
  const connID: string = await dbManager.createConnection();
  const res = await dbManager.changeDatabaseItemName(
    connID,
    schemaName,
    type,
    oldName,
    newName
  );
  await dbManager.closeConnection(connID);
  return res;
}

export async function dropDatabaseItem(
  schemaName: string,
  type: "TABLE" | "VIEW",
  name: string
): Promise<boolean> {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager) {
    return false;
  }
  const connID: string = await dbManager.createConnection();
  const res = await dbManager.dropDatabaseItem(connID, schemaName, type, name);
  await dbManager.closeConnection(connID);
  return res;
}

/**
 * Get Current Id for database manager.
 * Currently getting default duckdb from local
 * Future todo: base on active database to get id
 * @returns
 */
export function getCurrentDatabaseManagerId(): string {
  return duckdbDatabaseManagerId;
}
