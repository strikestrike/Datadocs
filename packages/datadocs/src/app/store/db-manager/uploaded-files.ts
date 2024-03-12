import { batchesToObjects, escape } from "@datadocs/duckdb-utils";
import {
  INTERNAL_SCHEMA_NAME,
  MANAGED_FILE_DATABASE_SCHEMA_NAME,
} from "../../../components/panels/Sources/constant";
import type { FileSystemNodeItem } from "../panels/sources/type";
import { createSchema, getDuckDBManagerInstance } from "../store-db";
import {
  getGridTypeFromDatabaseType,
  transformDuckDBValue,
} from "@datadocs/datasource-duckdb";
import { getDuckDBFile } from "./opfs";
import {
  generateRemoteFileSystems,
  // importRemoteFileSystemStoreToSourceManager,
} from "../../../components/panels/Sources/manager/remoteFileSystemManager";
import {
  generateDuckdbDatabaseNodeData,
  generateManagedFiles,
  importDatabaseStoreToSourceManager,
} from "../../../components/panels/Sources/manager/databaseStateManager";
import { importUploadedFileStoreToSourceManager } from "../../../components/panels/Sources/manager/uploadedFileStateManager";
import { initialSourcePanel } from "../writables";
import { createTemporaryTables } from "./dummy";

export const uploadedFilesTableName = "uploadedFiles";

// Table Uploaded File
// const create_uploaded_files_table_query_str = `CREATE TABLE ${INTERNAL_SCHEMA_NAME}.${uploadedFilesTableName}
// (
//   id UUID PRIMARY KEY,
//   type VARCHAR,
//   createdAt DATETIME,
//   name VARCHAR,
//   storedFileName VARCHAR,
//   parentID UUID REFERENCES ${INTERNAL_SCHEMA_NAME}.${uploadedFilesTableName}(id)
// );`;

const create_uploaded_files_table_query_str = `CREATE TABLE ${INTERNAL_SCHEMA_NAME}.${uploadedFilesTableName}
(
  id UUID PRIMARY KEY,
  type VARCHAR,
  createdAt DATETIME,
  name VARCHAR,
  storedFileName VARCHAR,
  parentID UUID
);`;

// Sample insert query
// INSERT INTO uploadedFiles VALUES (gen_random_uuid(), get_current_timestamp(), 'test1.csv', 'd2ee03c2-0b53-44f2-88a3-a824ca67fecd');

type UploadedFilesRow = {
  id: string;
  name: string;
  type: string;
  parentID: string;
  createdAt: Date;
  storedFileName: string;
};

/**
 * Function to create table uploadedFiles
 */
export async function createTableUploadedFiles(connID: string) {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager) {
    return null;
  }

  let currentConnID = connID;
  if (!connID) {
    currentConnID = await dbManager.createConnection();
  }
  await dbManager.query(create_uploaded_files_table_query_str, currentConnID);
  if (!connID) {
    await dbManager.closeConnection(currentConnID);
  }
}

/**
 * Get current Database name
 * @param connID
 * @returns
 */
export async function showCurrentDatabase(connID: string) {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager) {
    return null;
  }
  let currentConnID = connID;
  if (!connID) {
    currentConnID = await dbManager.createConnection();
  }
  const records = await (
    await dbManager.query("show databases;", currentConnID)
  ).readAll();
  let databaseName = null;
  for (const record of records) {
    const field = record.schema.fields[0];
    const field_name = field.name;
    for (const v of record) {
      databaseName = transformDuckDBValue(
        v[field_name],
        getGridTypeFromDatabaseType("VARCHAR")
      );
      console.log("databaseName", databaseName);
    }
  }
  if (!connID) {
    await dbManager.closeConnection(currentConnID);
  }
  return databaseName;
}

/**
 * Function to get list of all files Items
 * @returns
 */
export async function getUploadedFilesItems(): Promise<FileSystemNodeItem[]> {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager) {
    return [];
  }

  const queryStr = `SELECT * FROM ${INTERNAL_SCHEMA_NAME}.${uploadedFilesTableName};`;
  const connID = await dbManager.createConnection();
  const filesItems = batchesToObjects<UploadedFilesRow>(
    await dbManager.all(queryStr, connID)
  );
  await dbManager.closeConnection(connID);
  const items: FileSystemNodeItem[] = [];
  for (const item of filesItems) {
    items.push({
      id: item.id,
      name: item.name,
      parent: item.parentID,
      type: item.type,
    });
  }
  return items;
}

/**
 * Function to get item of file systems by id
 * @param id
 * @returns
 */
export async function getUploadedFilesItemById(
  id: string
): Promise<FileSystemNodeItem> {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager) {
    return null;
  }
  const queryStr = `SELECT * FROM ${INTERNAL_SCHEMA_NAME}.${uploadedFilesTableName}
                    WHERE id=${escape(id)};`;
  const connID = await dbManager.createConnection();
  const filesItems = batchesToObjects<UploadedFilesRow>(
    await dbManager.all(queryStr, connID)
  );
  await dbManager.closeConnection(connID);
  if (filesItems.length === 1) {
    const item = filesItems[0];
    return {
      id: item.id,
      name: item.name,
      parent: item.parentID,
      type: item.type,
      storedName: item.storedFileName,
    };
  }
  return null;
}

/**
 * Function to add file system item to duckdb
 * @param name
 * @param storageFileName
 * @param type
 * @param parentId
 * @returns
 */
export async function addUploadedFilesItem(
  name: string,
  storageFileName: string,
  type: string,
  parentId: string
): Promise<FileSystemNodeItem> {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager) {
    return null;
  }

  const queryStr = `INSERT INTO ${INTERNAL_SCHEMA_NAME}.${uploadedFilesTableName}
                    VALUES(gen_random_uuid(), ${escape(
                      type
                    )},  get_current_timestamp(), ${escape(name)}, ${escape(
    storageFileName
  )}, ${escape(parentId)}) RETURNING *;`;
  const connID = await dbManager.createConnection();
  const items = batchesToObjects<UploadedFilesRow>(
    await (await dbManager.query(queryStr, connID)).readAll()
  );
  await dbManager.closeConnection(connID);

  if (items.length === 1) {
    const item = items[0];
    return {
      id: item.id,
      name: item.name,
      parent: item.parentID,
      type: item.type,
      storedName: storageFileName,
    };
  }

  return null;
}

/**
 * Function to edit an file system name to duckdb
 * @param id
 * @param name
 * @returns
 */
export async function editUploadedFileName(
  id: string,
  name: string
): Promise<boolean> {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager) {
    return false;
  }

  let queryStr = `UPDATE ${INTERNAL_SCHEMA_NAME}.${uploadedFilesTableName} SET name=${escape(
    name
  )} WHERE id=${escape(id)};`;

  const connID = await dbManager.createConnection();
  const items = batchesToObjects<any>(
    await (await dbManager.query(queryStr, connID)).readAll()
  );
  await dbManager.closeConnection(connID);

  if (items.length > 0 && items[0].Count > 0) return true;
  return false;
}

/**
 * Delete single updated files
 * @param id
 * @returns
 */
export async function deleteUploadedFileItem(id: string): Promise<boolean> {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager) {
    return false;
  }

  const queryStr = `DELETE FROM ${INTERNAL_SCHEMA_NAME}.${uploadedFilesTableName} WHERE id=${escape(
    id
  )};`;
  const connID = await dbManager.createConnection();
  const items = batchesToObjects<any>(
    await (await dbManager.query(queryStr, connID)).readAll()
  );
  await dbManager.closeConnection(connID);

  if (items.length > 0 && items[0].Count > 0) return true;
  return false;
}

/**
 * Delete multiple uploaded files
 * @param ids
 * @returns
 */
export async function deleteUploadedFileItems(ids: string[]): Promise<boolean> {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager) {
    return false;
  }

  if (ids.length === 0) {
    return false;
  }

  let queryStr = `DELETE FROM ${INTERNAL_SCHEMA_NAME}.${uploadedFilesTableName} WHERE id IN (`;
  for (let id of ids) {
    queryStr += `${escape(id)} ,`;
  }
  queryStr += ");";
  const connID = await dbManager.createConnection();
  const items = batchesToObjects<any>(
    await (await dbManager.query(queryStr, connID)).readAll()
  );
  await dbManager.closeConnection(connID);

  if (items.length > 0 && items[0].Count > 0) return true;
  return false;
}

/**
 * Function to move items in/out of folder
 * @param targetId
 * @param sourceIds
 * @returns
 */
export async function moveUploadedFileItems(
  targetId: string,
  sourceIds: string[]
): Promise<boolean> {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager) {
    return false;
  }

  if (sourceIds.length === 0) {
    return false;
  }

  let queryStr = `UPDATE ${INTERNAL_SCHEMA_NAME}.${uploadedFilesTableName} SET parentID=${
    targetId ? escape(targetId) : null
  } WHERE id IN (`;
  for (let id of sourceIds) {
    queryStr += `${escape(id)} ,`;
  }
  queryStr += ");";
  const connID = await dbManager.createConnection();
  const items = batchesToObjects<any>(
    await (await dbManager.query(queryStr, connID)).readAll()
  );
  await dbManager.closeConnection(connID);

  if (items.length > 0 && items[0].Count > 0) return true;
  return false;
}

/**
 * Check uploaded file exist in database
 * @param fileName
 * @param parentId
 * @returns
 */
export async function uploadedFileExist(
  fileName: string,
  parentId: string
): Promise<boolean> {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager) {
    return false;
  }

  let queryStr = `SELECT * FROM ${INTERNAL_SCHEMA_NAME}.${uploadedFilesTableName}
                    WHERE name=${escape(fileName)}`;
  if (parentId) {
    queryStr += ` AND parentID=${escape(parentId)};`;
  } else {
    queryStr += ` AND parentID IS NULL;`;
  }
  const connID = await dbManager.createConnection();
  const items = batchesToObjects<UploadedFilesRow>(
    await (await dbManager.query(queryStr, connID)).readAll()
  );
  await dbManager.closeConnection(connID);

  return items.length > 0;
}

/**
 * Searching file system for search value inside a folder
 * @param searchValue
 * @param parentList
 * @returns
 */
export async function searchUploadedFileItems(
  searchValue: string,
  parentList: string[]
): Promise<string[]> {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager) {
    return null;
  }

  if (!searchValue) {
    return null;
  }

  searchValue = searchValue.toLowerCase();

  let queryStr = `SELECT id FROM ${INTERNAL_SCHEMA_NAME}.${uploadedFilesTableName}
                    WHERE contains(lower(name), ${escape(searchValue)})`;
  if (parentList && parentList.length > 0) {
    queryStr += ` AND parentID IN (`;
    for (let id of parentList) {
      queryStr += `${escape(id)} ,`;
    }
    queryStr += ")";
  }

  queryStr += ";";

  const connID = await dbManager.createConnection();
  const items = batchesToObjects<UploadedFilesRow>(
    await (await dbManager.query(queryStr, connID)).readAll()
  );
  await dbManager.closeConnection(connID);

  return items.map((item) => item.id);
}

/**
 * Function to create temporary for Source Panel
 * @returns
 */
export async function createTemporarySourcePanelDatabase() {
  const dbManager = getDuckDBManagerInstance();
  if (!dbManager) {
    return null;
  }

  const dbFile = getDuckDBFile();
  await dbManager.queryProvider.useDatabase(dbFile);

  const connID = await dbManager.createConnection();

  await createTemporaryTables(dbManager, connID);

  const currentDBName = await showCurrentDatabase(connID);
  const schemaList = await dbManager.getSchemasList(connID, currentDBName);

  if (!schemaList.includes(INTERNAL_SCHEMA_NAME)) {
    await createSchema(INTERNAL_SCHEMA_NAME);
  }

  if (!schemaList.includes(MANAGED_FILE_DATABASE_SCHEMA_NAME)) {
    await createSchema(MANAGED_FILE_DATABASE_SCHEMA_NAME);

    await createTableUploadedFiles(connID);
    await generateRemoteFileSystems();
    await generateManagedFiles();
    await generateDuckdbDatabaseNodeData();
    await importDatabaseStoreToSourceManager();
    await importUploadedFileStoreToSourceManager();
    // await importRemoteFileSystemStoreToSourceManager();
  }

  // notify generate database successfully for Source Panel
  initialSourcePanel.set(true);
}
