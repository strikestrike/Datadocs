import type { DataNodeBase } from "../../../../components/common/file-system/fileSystemStateManager";

// Default name for collection views and tables
export const DB_COLLECTION_TABLE_NAME = "Tables";
export const DB_COLLECTION_VIEW_NAME = "Views";
export const DB_DATABASE_ROOT_DUCKDB_NAME = "Local";
export const DB_DATABASE_FOLDER_NAME = "Managed Files";

type DatabaseBaseItem = DataNodeBase & {
  created?: Date;
};

export type DatabaseTableItem = DatabaseBaseItem & {
  type: "dbtable";
};

export type DatabaseViewItem = DatabaseBaseItem & {
  type: "dbview";
};

export type ManagedFileTableItem = DatabaseBaseItem & {
  type: "mftable";
  fileName?: string;
};

export type ManagedFileViewItem = DatabaseBaseItem & {
  type: "mfview";
  fileName?: string;
};

export type DatabaseCollectionItem = DatabaseBaseItem & {
  type: "dbcollection";
};

export type DatabaseSchemaItem = DatabaseBaseItem & {
  type: "dbschema";
};

export type DatabaseItem = DatabaseBaseItem & {
  type: "databaseroot";
  source: string;
  dbManagerId?: string;
  isActive: boolean;
};

export type ManagedFiles = DatabaseBaseItem & {
  type: "managedfiles";
};

export type DatabaseNodeItem =
  | DatabaseBaseItem
  | DatabaseTableItem
  | DatabaseViewItem
  | ManagedFileTableItem
  | ManagedFileViewItem
  | DatabaseCollectionItem
  | DatabaseSchemaItem
  | DatabaseItem
  | ManagedFiles;

type FileSystemBaseItem = DataNodeBase & {
  storedName?: string;
};

export type FileSystemFolderItem = FileSystemBaseItem & {
  type: "folder";
};

export type FileSystemExcelItem = FileSystemBaseItem & {
  type: "excel";
};

export type FileSystemSheetItem = FileSystemBaseItem & {
  type: "sheet";
};

export type FileSystemCsvItem = FileSystemBaseItem & {
  type: "csv";
  tableId: string;
};

export type FileSystemJsonItem = FileSystemBaseItem & {
  type: "json";
  tableId: string;
};

export type FileSystemNodeItem =
  | FileSystemBaseItem
  | FileSystemFolderItem
  | FileSystemExcelItem
  | FileSystemSheetItem
  | FileSystemCsvItem
  | FileSystemJsonItem;

export type RemoteFileStorageItem = FileSystemBaseItem & {
  type: "remote-storage";
  isActive: boolean;
};

export type RemoteFileSystemItem = FileSystemNodeItem | RemoteFileStorageItem;

export type SourceNodeItem =
  | FileSystemNodeItem
  | DatabaseNodeItem
  | RemoteFileSystemItem;
