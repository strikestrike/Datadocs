import type {
  DatabaseRoot,
  DatabaseNode,
  DBSchema,
  DBCollection,
  DBTable,
  ColumnTreeRoot,
  StructColumnNode,
  FSFolderNode,
  FSExcelNode,
  DBTableType,
  ColumnType,
  NormalColumnNode,
  FileSystemNode,
  FSCsvNode,
  TableViewInfo,
  FSJsonNode,
  TreeViewStateManager,
} from "../../../components/panels/Sources/components/tree-view";
import {
  DatabaseTreeStateManager,
  FileSystemTreeStateManager,
  ColumnTypeTreeStateManager,
  TreeGroupManager,
} from "../../../components/panels/Sources/components/tree-view";
import type { DuckDBManager } from "../db-manager";
import type {
  List,
  Struct,
} from "@datadocs/canvas-datagrid-ng/lib/types/column-types";
import {
  DataType,
  type ColumnType as GridColumnType,
} from "@datadocs/canvas-datagrid-ng/lib/types/column-types";
import {
  getCurrentActiveSchema,
  getCurrentDatabaseManagerId,
  getDuckDBManagerInstance,
} from "../store-db";
import { getFileExtension } from "../db-manager/utils";
import { batchesToObjects, escape } from "@datadocs/duckdb-utils";
import { getGridTypeFromDatabaseType } from "@datadocs/datasource-duckdb";
import {
  DB_COLLECTION_TABLE_NAME,
  DB_COLLECTION_VIEW_NAME,
  ManagedFileTableItem,
  type DatabaseCollectionItem,
  type DatabaseItem,
  type DatabaseNodeItem,
  type DatabaseSchemaItem,
  type DatabaseTableItem,
  type DatabaseViewItem,
  ManagedFileViewItem,
  DB_DATABASE_ROOT_DUCKDB_NAME,
  FileSystemNodeItem,
  RemoteFileSystemItem,
} from "./sources/type";
import DatabaseStore from "./sources/database";
import UploadedFileStore from "./sources/uploaded-file";
import { getDatabaseStateManager } from "../../../components/panels/Sources/manager/databaseStateManager";
import { getUploadedFilesStateManager } from "../../../components/panels/Sources/manager/uploadedFileStateManager";
import RemoteFileSystemStore from "./sources/remote-file-system";
import { getRemoteFileSystemStateManager } from "../../../components/panels/Sources/manager/remoteFileSystemManager";

let exampleCounter = 1;
export function generateExampleCounter(): number {
  const idx = exampleCounter;
  exampleCounter++;
  return idx;
}

export const databaseStoreInstance: DatabaseStore = new DatabaseStore([]);
export const uploadedFileStoreInstance: UploadedFileStore =
  new UploadedFileStore([]);
export const remoteFileStorageInstance: RemoteFileSystemStore =
  new RemoteFileSystemStore([]);

/**
 * Function to create database schema item
 */
export function createDatabaseSchemaItem(
  name: string,
  parentId: string
): DatabaseSchemaItem {
  return {
    id: `${generateExampleCounter()}`,
    type: "dbschema",
    name: name,
    parent: parentId,
    created: new Date(),
  };
}

/**
 * Create Database item for store to local
 * @param name
 * @param source
 * @returns
 */
export function createDatabaseItem(
  name: string,
  source: string,
  dbManagerId: string
): DatabaseItem {
  return {
    id: `${generateExampleCounter()}`,
    type: "databaseroot",
    name: name,
    source: source,
    parent: undefined,
    dbManagerId: dbManagerId,
    isActive: true,
    created: new Date(),
  };
}

/**
 * Function to create database collection items (TABLE/VIEW/FUNCTION)
 * @param schemaIdMap
 * @returns
 */
export function createDatabaseCollectionItems(schemaIdMap: {
  [key: string]: string;
}): DatabaseCollectionItem[] {
  const collectionItems: DatabaseCollectionItem[] = [];
  for (let name in schemaIdMap) {
    collectionItems.push(
      createDatabaseCollectionItem(DB_COLLECTION_TABLE_NAME, schemaIdMap[name])
    );
    collectionItems.push(
      createDatabaseCollectionItem(DB_COLLECTION_VIEW_NAME, schemaIdMap[name])
    );
  }
  return collectionItems;
}

/**
 * Function to create database collection item like "TABLES" "VIEWS" "FUNCTIONS"
 * @param name
 * @param parent
 * @returns
 */
export function createDatabaseCollectionItem(
  name: string,
  parent: string
): DatabaseCollectionItem {
  return {
    id: `${generateExampleCounter()}`,
    type: "dbcollection",
    name: name,
    parent: parent,
    created: new Date(),
  };
}

/**
 * Function to create table or view for database
 * @param name
 * @param parentId
 * @param type
 * @returns
 */
export function createDatabaseTableViewItem(
  name: string,
  parentId: string,
  type: "dbtable" | "dbview" | "mftable" | "mfview",
  fileName?: string
):
  | DatabaseTableItem
  | DatabaseViewItem
  | ManagedFileTableItem
  | ManagedFileViewItem {
  return {
    id: `${generateExampleCounter()}`,
    name: name,
    parent: parentId,
    type: type,
    created: new Date(),
    fileName: fileName,
  };
}

/**
 * Add Table/View to Database tree by tree paths
 * @param name
 * @param type
 * @param paths
 */
export function addTableOrViewToDBTreeByPaths(
  name: string,
  type: "dbtable" | "dbview",
  paths: string[]
) {
  const parentId = databaseStoreInstance.getNodeIdByPaths(paths);
  const item = createDatabaseTableViewItem(name, parentId, type);
  databaseStoreInstance.insertNodeItemToArray([item]);
}

const viewsCollection: DBCollection = {
  id: "3",
  name: "Views",
  type: "dbcollection",
  isOpen: true,
  children: [
    { id: "4", name: "Applicable_Roles", type: "dbtable" },
    { id: "5", name: "Customers", type: "dbtable" },
  ],
};

const exampleCollection: DBCollection = {
  id: "11",
  name: "Views",
  type: "dbcollection",
  isOpen: true,
  children: [{ id: "12", name: "Applicable_Roles", type: "dbtable" }],
};

const infomationSchema: DBSchema = {
  id: "2",
  name: "Information_Schema",
  type: "dbschema",
  isOpen: true,
  children: [viewsCollection],
};

const exampleCloseSchema: DBSchema = {
  id: "7",
  name: "Example_Schema",
  type: "dbschema",
  isOpen: false,
  children: [exampleCollection],
};

const exampleDB: DatabaseRoot = {
  id: "1",
  name: "Avails",
  type: "databaseroot",
  isOpen: true,
  children: [infomationSchema, exampleCloseSchema],
  hint: "MySQL",
};

function getExampleDB(host: string, source: string): DatabaseRoot {
  exampleCounter++;
  return {
    id: `${exampleCounter}`,
    name: host,
    type: "databaseroot",
    isOpen: false,
    hint: source,
    children: [structuredClone(exampleCloseSchema)],
  };
}

/**
 * Function to create data of table or view
 * @param tbname
 * @param tbtype
 * @returns
 */
export function createDBTableOrView(
  name: string,
  tbtype: DBTableType
): DBTable {
  exampleCounter++;
  return { id: `${exampleCounter}`, name: name, type: tbtype };
}

/**
 * Funciton to convert form Grid field to database field
 * @param idx
 * @param name
 * @param gridType
 * @returns
 */
export function columnFieldFromDatabaseField(
  idx: number,
  name: string,
  gridType: GridColumnType
): NormalColumnNode | StructColumnNode {
  const colNode: NormalColumnNode = {
    id: `${idx}`,
    name: name,
    type: "String",
  };
  if (typeof gridType === "string") {
    if (gridType === "string") {
      colNode.type = "String";
    } else if (gridType === "int") {
      colNode.type = "Integer";
    } else if (gridType === "boolean") {
      colNode.type = "Boolean";
    } else if (gridType === "date") {
      colNode.type = "Date";
    } else if (gridType === "bytes") {
      colNode.type = "Binary";
    } else if (gridType === "float") {
      colNode.type = "Float";
    } else if (gridType === "number") {
      colNode.type = "Decimal";
    } else {
      colNode.type = "String";
    }
  } else if (typeof gridType === "object") {
    switch (gridType.typeId) {
      case DataType.Float:
        colNode.type = "Float";
        break;
      case DataType.Bytes:
        colNode.type = "Binary";
        break;
      case DataType.Decimal:
        colNode.type = "Decimal";
        break;
      case DataType.Date:
        colNode.type = "Date";
        break;
      case DataType.Time:
        colNode.type = "Time";
        break;
      case DataType.DateTime:
        colNode.type = "Datetime";
        break;
      case DataType.Interval:
        colNode.type = "Interval";
        break;
      case DataType.Json:
        colNode.type = "Json";
        break;
      case DataType.Geography:
        colNode.type = "Geography";
        break;
      case DataType.Variant:
        colNode.type = "Variant";
        break;
      case DataType.Timestamp:
        colNode.type = "Datetime";
        break;
      case DataType.List:
        {
          const listType = gridType as List;
          const childColNode = columnFieldFromDatabaseField(
            idx,
            name,
            listType.child.type
          );
          if (childColNode.type != "Struct") {
            colNode.type = (childColNode.type + "Arr") as ColumnType;
          } else {
            const col_struct_node: StructColumnNode = {
              id: `${idx}`,
              name: name,
              type: "Struct",
              children: childColNode.children,
              isOpen: false,
            };
            return col_struct_node;
          }
        }
        break;
      case DataType.Struct:
        {
          const structType = gridType as Struct;
          const colStructNode: StructColumnNode = {
            id: `${idx}`,
            name: name,
            type: "Struct",
            children: [],
            isOpen: false,
          };

          for (const child of structType.children) {
            const id = generateExampleCounter();
            colStructNode.children.push(
              columnFieldFromDatabaseField(id, child.name, child.type)
            );
          }
          return colStructNode;
        }
        break;
    }
  }
  return colNode;
}

export const databasesSectionManager = new TreeGroupManager([
  // new DatabaseTreeStateManager(exampleDB),
]);

/**
 * Build database tree for source panel
 * @param parentId
 * @param parentToChildrenMap
 * @param databaseNodeItemMap
 * @returns
 */
function buildDatabaseTree(
  parentId: string,
  parentToChildrenMap: { [key: string]: string[] },
  databaseNodeItemMap: { [key: string]: DatabaseNodeItem },
  dbParentId: string
): DatabaseNode[] {
  const dbNodes: DatabaseNode[] = [];
  for (const id of parentToChildrenMap[parentId] || []) {
    const dbNodeItem = databaseNodeItemMap[id];
    let dbItem: DatabaseNode;
    if (dbNodeItem.type === "databaseroot") {
      dbItem = {
        id: `${generateExampleCounter()}`,
        type: "databaseroot",
        name: dbNodeItem.name,
        source: (dbNodeItem as DatabaseItem).source,
        children: [],
        isOpen: false,
        parentId: dbParentId,
        dbManagerId: (dbNodeItem as DatabaseItem).dbManagerId,
      } as DatabaseRoot;
    } else if (
      dbNodeItem.type === "dbschema" ||
      dbNodeItem.type === "dbcollection" ||
      dbNodeItem.type === "dbtable" ||
      dbNodeItem.type === "dbview"
    ) {
      dbItem = {
        id: `${generateExampleCounter()}`,
        type: dbNodeItem.type,
        children: [],
        name: dbNodeItem.name,
        parentId: dbParentId,
        isOpen: false,
      };
    }
    if (dbItem) {
      dbItem.children = buildDatabaseTree(
        dbNodeItem.id,
        parentToChildrenMap,
        databaseNodeItemMap,
        dbItem.id
      );
      dbNodes.push(dbItem);
    }
  }
  return dbNodes;
}

/**
 * Add Database tree base on source and host with example db
 * @param value
 */
export function addDatabaseTree(value: { source: string; host: string }) {
  const example = getExampleDB(value.host, value.source);
  const manager = new DatabaseTreeStateManager(example);
  databasesSectionManager.addNewTreeView(manager);
}

/**
 * Add database tree to database manager base on tree data (database root)
 * @param dbRoot
 * @returns
 */
export function addDatabaseTreeByDatabaseRoot(dbRoot: DatabaseRoot): string {
  const manager = new DatabaseTreeStateManager(dbRoot);
  databasesSectionManager.addNewTreeView(manager);
  return manager.id;
}

/**
 * Build database tree from database node items
 * @param databaseNodeItems
 */
export function addDatabaseTreeByDatabaseNodeItems(
  databaseNodeItems: DatabaseNodeItem[]
) {
  const databaseNodeItemMap: { [key: string]: DatabaseNodeItem } = {};
  const parentToChildrenMap: { [key: string]: string[] } = {};
  for (const item of databaseNodeItems) {
    databaseNodeItemMap[item.id] = item;
    const parentId: string = item.parent ? item.parent : "-1";
    if (!parentToChildrenMap[parentId]) {
      parentToChildrenMap[parentId] = [];
    }
    parentToChildrenMap[parentId].push(item.id);
  }

  const databaseRoots: DatabaseRoot[] = buildDatabaseTree(
    "-1",
    parentToChildrenMap,
    databaseNodeItemMap,
    undefined
  ) as DatabaseRoot[];
  for (const dbRoot of databaseRoots) {
    addDatabaseTreeByDatabaseRoot(dbRoot);
  }
}

/**
 * Add new table/view to current active database
 * @param tableViewInfo
 */
function addTableViewToDatabase(
  tableViewInfo: TableViewInfo,
  type: DBTableType
) {
  const databaseTree = databasesSectionManager.listTreeViewManager.find(
    (tree) => tree.id === tableViewInfo.managerId
  );
  if (databaseTree && databaseTree.type === "DATABASE") {
    for (const database of databaseTree.treeData.children) {
      if (
        database.name === tableViewInfo.schema &&
        database.type === "dbschema"
      ) {
        for (const collection of database.children) {
          if (
            collection.type === "dbcollection" &&
            ((collection.name === DB_COLLECTION_TABLE_NAME &&
              type === "dbtable") ||
              (collection.name === DB_COLLECTION_VIEW_NAME &&
                type === "dbview"))
          ) {
            if (!collection.children) {
              collection.children = [];
            }
            (collection.children as DBTable[]).push(
              createDBTableOrView(tableViewInfo.tableViewName, type)
            );
          }
        }
      }
    }
    // Create Node data map and notify changing tree data for tree data store
    databaseTree.createNodeDataMap(databaseTree.treeData);
    databaseTree.notifyTreeDataChange();
  }
}

// file system example
const fileSystem1: FSFolderNode = {
  id: "1",
  name: "Document",
  type: "fsfolder",
  isOpen: false,
  children: [
    {
      id: "2",
      name: "MyExcel",
      type: "fsexcel",
      isOpen: true,
      children: [
        { id: "3", name: "Sheet 1", type: "fssheet" },
        { id: "4", name: "Sheet 2", type: "fssheet" },
        { id: "5", name: "Sales.csv", type: "fscsv" },
        { id: "6", name: "Sales2.csv", type: "fscsv" },
      ],
    },
    { id: "7", name: "Info.csv", type: "fscsv" },
    { id: "8", name: "Expense.csv", type: "fscsv" },
  ],
};

const fileSystem2: FSExcelNode = {
  id: "2",
  name: "Example",
  type: "fsexcel",
  isOpen: false,
  children: [
    { id: "3", name: "Sheet 1", type: "fssheet" },
    { id: "4", name: "Sheet 2", type: "fssheet" },
    { id: "5", name: "Sales.csv", type: "fscsv" },
    { id: "6", name: "Sales2.csv", type: "fscsv" },
  ],
};

export const fileSystemSectionManager = new TreeGroupManager([
  new FileSystemTreeStateManager(fileSystem1),
  new FileSystemTreeStateManager(fileSystem2),
]);

/**
 * Create File Csv Node base on file name and table/view info
 * @param name
 * @param tableViewInfo
 * @returns
 */
export function createFileCsvOrJsonNode(
  name: string,
  tableViewInfo: TableViewInfo,
  fileExt: string
): FSCsvNode | FSJsonNode {
  if (fileExt === "json") {
    return {
      id: `${generateExampleCounter()}`,
      name: name,
      type: "fsjson",
      tableViewInfo: tableViewInfo,
    };
  }
  return {
    id: `${generateExampleCounter()}`,
    name: name,
    type: "fscsv",
    tableViewInfo: tableViewInfo,
  };
}

export function addFileSystem(fileSystem: FileSystemNode) {
  const fileSystemTree = new FileSystemTreeStateManager(fileSystem);
  fileSystemSectionManager.addNewTreeView(fileSystemTree);
}

// column type example
const exampleStuctColumn: StructColumnNode = {
  id: "12",
  name: "Emplyee",
  type: "Struct",
  isOpen: true,
  children: [
    { id: "13", name: "Employee Name", type: "String" },
    { id: "14", name: "Salary", type: "Decimal" },
    { id: "15", name: "Address", type: "Geography" },
  ],
};

const bigColumnTypeTree: ColumnTreeRoot = {
  id: "1",
  name: "name",
  type: "columnstreeroot",
  isOpen: true,
  children: [
    { id: "2", name: "Product Name", type: "String" },
    { id: "3", name: "Purchased Time", type: "Time" },
    { id: "4", name: "Product Cost", type: "Integer" },
    { id: "5", name: "Purchased Date", type: "Date" },
    // { id: "6", name: "Number Array", type: "IntegerArr" },
    // { id: "7", name: "In Stock", type: "Boolean" },
  ],
};

const smallColumnTypeTree: ColumnTreeRoot = {
  id: "12",
  name: "name",
  type: "columnstreeroot",
  isOpen: true,
  children: [
    { id: "8", name: "DateTime Array", type: "DatetimeArr" },
    { id: "9", name: "Related Products", type: "StringArr" },
    exampleStuctColumn,
    { id: "10", name: "Binary Number", type: "Binary" },
    { id: "11", name: "JSON", type: "Json" },
  ],
};

let idCount = 1;
// a hardcode function to get column tree depend on which table is select on databases part
export function getColumnTree(tb: DBTable): ColumnTypeTreeStateManager {
  let data: ColumnTreeRoot;
  const tbName = tb.name;
  if (tb.children) {
    data = {
      id: `${generateExampleCounter()}`,
      name: tbName,
      type: "columnstreeroot",
      children: structuredClone(tb.children),
      isOpen: true,
      parentId: tb.id,
    };
  } else if (tbName.toLowerCase() === "Applicable_Roles".toLowerCase()) {
    data = structuredClone(bigColumnTypeTree);
  } else {
    data = structuredClone(smallColumnTypeTree);
  }
  data.id = "column_type__" + idCount++;
  data.name = tbName;
  return new ColumnTypeTreeStateManager(data);
}

/**
 * dispatch event for change active node
 * @param activeTable
 */
function fireSourcesPanelActiveNodeChanged(activeTable: DBTable) {
  databasesSectionManager.dispatchEvent("sourcesPanelActiveNodeChanged", {
    activeTable: activeTable,
  });
}

async function createDbTable(
  db: DuckDBManager,
  schema_name: string,
  tbname: string,
  tbtype: DBTableType
): Promise<DBTable> {
  const dbtable: DBTable = {
    id: "12",
    name: tbname,
    type: tbtype,
    isOpen: true,
    children: [],
  };
  const connID: string = await db.createConnection();
  // We can't use PRAGMA table_info(...) in here, because Duckdb translate this PRAGMA with
  // incorrect string escapes
  const escapedName = escape(schema_name + "." + tbname);
  const sql = `select * from pragma_table_info(${escapedName})`;

  type PragmaRow = {
    /** int32 */
    cid: number;
    name: string;
    type: string;
    notnull: boolean;
    dflt_value: string;
    pk: boolean;
  };
  const columns = batchesToObjects<PragmaRow>(await db.all(sql, connID));
  if (columns.length > 0) {
    for (const row of columns) {
      const databaseType = getGridTypeFromDatabaseType(row.type);

      dbtable.children.push(
        columnFieldFromDatabaseField(
          generateExampleCounter(),
          row.name,
          databaseType
        )
      );
    }
  }
  await db.closeConnection(connID);
  return structuredClone(dbtable);
}

/**
 * Function for update active table from select on tree view
 * @param reload
 */
export function sourcesPanelUpdateActiveTable(reload: boolean) {
  let activeTree: TreeViewStateManager | undefined;
  if (databasesSectionManager)
    activeTree = databasesSectionManager.listTreeViewManager.find(
      (tree) => tree.isSelected
    );
  const node =
    activeTree && activeTree.getNodeById(activeTree.selectedTreeNode);
  if (node && (node.type === "dbtable" || node.type === "dbview")) {
    const dbRoot = activeTree.treeData as DatabaseRoot;
    if (dbRoot && reload) {
      const paths = activeTree.getPath(node.id);
      const items = activeTree
        ? activeTree
            .getPath(activeTree.selectedTreeNode)
            .map((id) => activeTree.getNodeById(id))
        : [];
      const dbManager = getDuckDBManagerInstance();
      if (paths.length > 2 && dbManager) {
        const schema = activeTree.getNodeById(paths[1]);
        dbManager
          .createDbTable(schema.name, node.name, node.type)
          .then((dbtable: DBTable) => {
            fireSourcesPanelActiveNodeChanged(dbtable);
          });
      } else {
        fireSourcesPanelActiveNodeChanged(node);
      }
    } else {
      fireSourcesPanelActiveNodeChanged(node);
    }
  } else {
    fireSourcesPanelActiveNodeChanged(null);
  }
}

/**
 * Handle for click file system node on sources panel
 * @param reload
 */
export function sourcesPanelActiveFileSystem(reload: boolean) {
  let activeTree: TreeViewStateManager | undefined;
  if (fileSystemSectionManager)
    activeTree = fileSystemSectionManager.listTreeViewManager.find(
      (tree) => tree.isSelected
    );
  const node =
    activeTree && activeTree.getNodeById(activeTree.selectedTreeNode);
  if (node && (node.type === "fscsv" || node.type === "fsjson")) {
    const tableViewInfo = node.tableViewInfo;
    if (tableViewInfo) {
      let databaseTree: TreeViewStateManager | undefined;
      if (databasesSectionManager)
        databaseTree = databasesSectionManager.listTreeViewManager.find(
          (tree) => tree.id === tableViewInfo.managerId
        );
      if (databaseTree && reload) {
        const dbRoot = databaseTree.treeData as DatabaseRoot;
        if (dbRoot) {
          const dbManager = getDuckDBManagerInstance();
          if (dbManager) {
            dbManager
              .createDbTable(
                tableViewInfo.schema,
                tableViewInfo.tableViewName,
                "dbtable"
              )
              .then((dbtable: DBTable) => {
                fireSourcesPanelActiveNodeChanged(dbtable);
              });
            return;
          }
        }
      }
    }
  }
  fireSourcesPanelActiveNodeChanged(null);
}

/**
 * Function for adding file to File System after importing or ingesting to duckdb
 * @param fileName
 * @param tbname
 */
export async function addImportedOrIngestedDuckdbFileToFileSystem(
  file: File,
  tbname: string
) {
  const fileName = file.name;
  // Get current active schema from active database
  const activeSchema = await getCurrentActiveSchema();
  // Get current active database manager id
  const currentManagerId = getCurrentDatabaseManagerId();
  // Create table view information
  const tableViewInfo: TableViewInfo = {
    managerId: currentManagerId,
    schema: activeSchema,
    tableViewName: tbname,
  };
  const databasePaths = [
    DB_DATABASE_ROOT_DUCKDB_NAME,
    activeSchema,
    DB_COLLECTION_TABLE_NAME,
  ];
  addTableOrViewToDBTreeByPaths(tbname, "dbtable", databasePaths);

  const ext = getFileExtension(file);
  // Create File csv Node
  const fileSystem = createFileCsvOrJsonNode(fileName, tableViewInfo, ext);
  // Add file system node to File System in Source Panel
  addFileSystem(fileSystem);
  // Add table to active database in source panel
  addTableViewToDatabase(tableViewInfo, "dbtable");
}

/**
 * Build database tree from database node items
 * @param databaseNodeItems
 */
export function addDatabaseStateManager(databaseNodeItems: DatabaseNodeItem[]) {
  const databaseStateManager = getDatabaseStateManager();
  databaseStateManager.init(databaseNodeItems);
}

/**
 * Build uploaded file tree from uploaded API
 * @param fsNodeItems
 */
export function addUploadedFilesManager(fsNodeItems: FileSystemNodeItem[]) {
  const uploadedFileStateManager = getUploadedFilesStateManager();
  uploadedFileStateManager.init(fsNodeItems);
}

/**
 * Build remote file system from uploaded API
 * @param remoteFsNodeItems
 */
export function addRemoteFileSystemManager(
  remoteFsNodeItems: RemoteFileSystemItem[]
) {
  const remoteFileSystemManager = getRemoteFileSystemStateManager();
  remoteFileSystemManager.init(remoteFsNodeItems);
}
