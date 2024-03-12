import type { DuckDBManager } from "../../../../../app/store/db-manager";

export type TreeViewType = "DATABASE" | "FILE_SYSTEM" | "COLUMN_TYPE";

// database tree view
export type DatabaseRoot = {
  id: string;
  name: string;
  type: "databaseroot";
  children: DatabaseNode[];
  isOpen: boolean;
  parentId?: string;
  hint?: string;
  // FIXME: use SimpleDuckDBQueryProvider
  dbManager?: DuckDBManager;
};

export type DBSchema = {
  id: string;
  name: string;
  type: "dbschema";
  children: DatabaseNode[];
  isOpen: boolean;
  parentId?: string;
};

export type DBCollection = {
  id: string;
  name: string;
  type: "dbcollection";
  children: DatabaseNode[];
  isOpen: boolean;
  parentId?: string;
};

export type DBTableType = "dbtable" | "dbview";

export type DBTable = {
  id: string;
  name: string;
  type: DBTableType;
  isOpen?: boolean;
  children?: (NormalColumnNode | StructColumnNode)[];
  parentId?: string;
};

export type DatabaseNode = DatabaseRoot | DBSchema | DBCollection | DBTable;

// Table or view information for getting table structure from file system
export type TableViewInfo = {
  managerId: string;
  schema: string;
  tableViewName: string;
};

// file system tree view, use for excel/csv, can add another types as well
export type FSFolderNode = {
  id: string;
  name: string;
  type: "fsfolder";
  children: (FSExcelNode | FSCsvNode)[];
  isOpen: boolean;
  parentId?: string;
};

export type FSExcelNode = {
  id: string;
  name: string;
  type: "fsexcel";
  children: (FSSheetNode | FSCsvNode)[];
  isOpen: boolean;
  parentId?: string;
};

export type FSSheetNode = {
  id: string;
  name: string;
  type: "fssheet";
  isOpen?: boolean;
  children?: null;
  parentId?: string;
};

export type FSCsvNode = {
  id: string;
  name: string;
  type: "fscsv";
  isOpen?: boolean;
  children?: null;
  parentId?: string;
  tableViewInfo?: TableViewInfo;
};

export type FSJsonNode = {
  id: string;
  name: string;
  type: "fsjson";
  isOpen?: boolean;
  children?: null;
  parentId?: string;
  tableViewInfo?: TableViewInfo;
};

export type FileSystemNode =
  | FSFolderNode
  | FSExcelNode
  | FSSheetNode
  | FSCsvNode
  | FSJsonNode;

// column tree view of database table tree view
export type ColumnType =
  | "Boolean"
  | "BooleanArr"
  | "Integer"
  | "IntegerArr"
  | "Float"
  | "FloatArr"
  | "Decimal"
  | "DecimalArr"
  | "String"
  | "StringArr"
  | "Binary"
  | "BinaryArr"
  | "Date"
  | "DateArr"
  | "Time"
  | "TimeArr"
  | "Datetime"
  | "DatetimeArr"
  | "Interval"
  | "IntervalArr"
  | "Geography"
  | "GeographyArr"
  | "Json"
  | "JsonArr"
  | "Variant"
  | "VariantArr";

export type ColumnTreeRoot = {
  id: string;
  name: string;
  type: "columnstreeroot";
  children: (NormalColumnNode | StructColumnNode)[];
  isOpen: boolean;
  parentId?: string;
};

export type NormalColumnNode = {
  id: string;
  name: string;
  type: ColumnType;
  isOpen?: boolean;
  children?: null;
  parentId?: string;
};

export type StructColumnNode = {
  id: string;
  name: string;
  type: "Struct";
  children: (NormalColumnNode | StructColumnNode)[];
  isOpen: boolean;
  parentId?: string;
};

export type StructArrColumnNode = {
  id: string;
  name: string;
  type: "Struct";
  children: StructColumnNode[];
  isOpen: boolean;
  parentId?: string;
};

export type ColumnTreeNode =
  | ColumnTreeRoot
  | NormalColumnNode
  | StructColumnNode
  | StructArrColumnNode;

// tree view context
export const TREE_VIEW_CONTEXT_NAME = "treeviewcontext::name";

export type TreeViewContext = {
  toggleCollapse: (id: string) => void;
  selectComponent: (id: string) => void;
  registerComponent: (id: string, value: TreeNodeComponent) => void;
  deregisterComponent: (id: string) => void;
  isNodeSelected: (id: string) => boolean;
};

export type TreeNodeComponent = {
  selectNode: () => void;
  deselectNode: () => void;
};

export type TreeViewNode = DatabaseNode | ColumnTreeNode | FileSystemNode;
