import { escapeId } from "@datadocs/duckdb-utils";
import type { SchemaChildrenItemResult } from "../../../../app/store/db-manager";
import {
  DB_COLLECTION_TABLE_NAME,
  DB_COLLECTION_VIEW_NAME,
  DB_DATABASE_FOLDER_NAME,
  DB_DATABASE_ROOT_DUCKDB_NAME,
  DatabaseCollectionItem,
  ManagedFileTableItem,
  type DatabaseItem,
  type DatabaseNodeItem,
  type SourceNodeItem,
} from "../../../../app/store/panels/sources/type";
import {
  addDatabaseStateManager,
  createDatabaseCollectionItem,
  createDatabaseItem,
  createDatabaseTableViewItem,
  databaseStoreInstance,
  generateExampleCounter,
} from "../../../../app/store/panels/store-sources-panel";
import {
  getDuckDBManagerInstance,
  getTablesViewsBySchema,
} from "../../../../app/store/store-db";
import { getDateString, getTimeDifference } from "../../../../utils/dateTime";
import type {
  Node,
  SearchNodeData,
} from "../../../common/file-system/fileSystemStateManager";
import type {
  NodeDetailButton,
  NodeDetailColumn,
  NodeDetailItem,
} from "../components/node-detail/type";
import {
  DEFAULT_DATABASE_SCHEMA_NAME,
  FILE_SYSTEM_VIEW_ALL_FILES_ID,
  MANAGED_FILE_DATABASE_SCHEMA_NAME,
} from "../constant";
import { SourceStateManager } from "./sourceStateManager";
import { fetchSchemaInformationTable } from "@datadocs/datasource-duckdb";

export function isDatabaseNode(node: Node<SourceNodeItem>): boolean {
  return (
    node &&
    (node.type === "dbtable" ||
      node.type === "dbview" ||
      node.type === "dbcollection" ||
      node.type === "dbschema" ||
      node.type === "databaseroot" ||
      node.type === "managedfiles")
  );
}

export class DatabaseStateManager<
  DataNode extends DatabaseNodeItem
> extends SourceStateManager<DataNode> {
  constructor(nodes: Array<DataNode>) {
    super(nodes);
  }

  /**
   * Overide function to create Database Ui node expanded is true
   * @param node
   * @returns
   */
  createUINode = (node: DataNode): Node<DataNode> => {
    return {
      id: this.generateNodeId(node),
      type: node.type,
      name: node.name,
      parent: null,
      children: [],
      dataNode: node,
      selected: false,
      expanded: true,
    };
  };

  toggleCollapseNode = (id: string, dispatch = true) => {
    const node = this.getNodeById(id);
    if (node) {
      node.expanded = !node.expanded;
    }

    if (dispatch) {
      this.dispatchEvent("datachange", { type: "toggle" });
    }
  };

  canOpenNode = (node: Node<DataNode>): boolean => {
    return (
      !node ||
      node.dataNode.type === "databaseroot" ||
      node.dataNode.type === "managedfiles"
    );
  };

  getNodeIcon = (id: string): string => {
    const node = this.getNodeById(id);
    if (node) {
      switch (node.type) {
        case "databaseroot": {
          return (node.dataNode as DatabaseItem).isActive
            ? "tw-database-active"
            : "tw-database-inactive";
        }
        case "managedfiles": {
          return "tw-database-folder";
        }
        case "databaseroot": {
          return "tw-database";
        }
        case "dbschema": {
          return "tw-dbschema";
        }
        case "dbtable":
        case "mftable": {
          return "tw-dbtable";
        }
        case "dbview": {
          return "tw-dbtable";
        }
        default:
          return "";
      }
    }
    return "";
  };

  getNodeDetail = (id: string): NodeDetailItem[] => {
    const node = this.getNodeById(id);
    if (node) {
      if (node.type === "databaseroot") {
        return [
          {
            name: "Added at",
            type: "info",
            value: getDateString(node.dataNode?.created.getTime()),
          },
          {
            name: "Engine",
            type: "info",
            value: (node.dataNode as DatabaseItem).source,
          },
          {
            name: "Status",
            type: "status",
            value: (node.dataNode as DatabaseItem).isActive
              ? "CONNECTED"
              : "DISABLE",
          },
        ];
      } else if (node.type === "dbtable" || node.type === "dbview") {
        return [
          {
            name: "Reference Tables",
            type: "reference",
            children: [
              {
                name: "table-23",
                type: "uitable",
              },
            ],
          },
        ];
      } else if (node.type === "mftable") {
        return [
          {
            name: "Created from",
            type: "info",
            children: [
              {
                name: (node.dataNode as ManagedFileTableItem)?.fileName,
                type: "file",
                tooltip:
                  "You don't currently have the ability to access this file.",
              },
            ],
          },
          {
            name: "Created At",
            type: "info",
            value: getTimeDifference(node.dataNode?.created),
          },
          {
            name: "Reference Tables",
            type: "reference",
            children: [
              {
                name: "Tb",
                type: "uitable",
              },
              {
                name: "Tb2",
                type: "uitable",
              },
              {
                name: "products",
                type: "uitable",
              },
            ],
          },
        ];
      }
    }
    return [];
  };

  getNodeDetailButton = (id: string): NodeDetailButton => {
    const node = this.getNodeById(id);
    if (node) {
      if (node.type === "databaseroot") {
        return {
          name: "Open",
          action: () => {},
        };
      }
    }
  };

  getNodeDetailColumns = async (id: string): Promise<NodeDetailColumn[]> => {
    const node = this.getNodeById(id);
    if (node) {
      if (
        node.type === "dbtable" ||
        node.type === "mftable" ||
        node.type === "dbview"
      ) {
        const schemaName =
          node.type === "mftable"
            ? MANAGED_FILE_DATABASE_SCHEMA_NAME
            : DEFAULT_DATABASE_SCHEMA_NAME;
        const tableInfo = await fetchSchemaInformationTable(
          schemaName,
          node.dataNode.name,
          getDuckDBManagerInstance().queryProvider
        );
        const columns: NodeDetailColumn[] = [];
        for (let col of tableInfo.columns) {
          columns.push({
            name: col.name,
            type: col.type,
          });
        }
        return columns;
      }
    }
  };

  getOpenableChildNodesById = (id: string) => {
    const childNodes = this.getChildNodesById(id) || [];
    return childNodes.filter(
      (v) => v.type === "databaseroot" || v.type === "managedfiles"
    );
  };

  searchSourceNodes = (
    searchValue: string,
    rootId: string
  ): SearchNodeData<Node<DataNode>>[] => {
    const searchNodes: SearchNodeData<Node<DataNode>>[] = [];
    searchValue = searchValue.toLowerCase();
    const rootNode = this.getNodeById(rootId);
    const rootPath =
      "/" +
      (rootNode && rootNode.id !== FILE_SYSTEM_VIEW_ALL_FILES_ID
        ? this.getNodePath(rootId).join("/")
        : ""
      ).toLowerCase();

    for (const [id, node] of this.nodeMap) {
      if (node.type === "dbcollection") {
        continue;
      }
      const path = this.getNodePath(id);
      const pathUrl = "/" + this.getNodePath(id).join("/");
      const isRoot = path.length === 1;

      if (
        node.name.toLocaleLowerCase().includes(searchValue) &&
        pathUrl.toLowerCase().startsWith(rootPath)
      ) {
        searchNodes.push({ node, path: isRoot ? "" : pathUrl });
      }
    }

    return searchNodes.sort((a, b) => {
      if (a.path == b.path) {
        return a.node.name > b.node.name ? 1 : -1;
      } else {
        return a.path > b.path ? 1 : -1;
      }
    });
  };

  buildQueryString = (id: string): string => {
    const node = this.getNodeById(id);
    if (node) {
      if (node.type === "mftable" || node.type === "mfview") {
        return `SELECT * FROM ${
          escapeId(MANAGED_FILE_DATABASE_SCHEMA_NAME) +
          "." +
          escapeId(node.dataNode.name)
        }`;
      } else if (node.type === "dbtable" || node.type === "dbview") {
        return `SELECT * FROM ${escapeId(node.dataNode.name)}`;
      }
    }
    return null;
  };
}

/**
 * database state manager for UI
 */
const databaseStateManager = new DatabaseStateManager([]);

export function getDatabaseStateManager(): DatabaseStateManager<DatabaseNodeItem> {
  return databaseStateManager;
}

let managedFileId: string = null;

/**
 * Function to hardcode to generate Managed Files
 */
export async function generateManagedFiles() {
  managedFileId = `${generateExampleCounter()}`;
  const databaseNodeItems = [
    {
      id: managedFileId,
      type: "managedfiles",
      name: DB_DATABASE_FOLDER_NAME,
      parent: undefined,
    },
  ];
  const tableViewList = await getTablesViewsBySchema(
    MANAGED_FILE_DATABASE_SCHEMA_NAME
  );
  if (tableViewList && tableViewList.length > 0) {
    const tablesCollection = createDatabaseCollectionItem(
      DB_COLLECTION_TABLE_NAME,
      managedFileId
    );
    const viewsCollection = createDatabaseCollectionItem(
      DB_COLLECTION_VIEW_NAME,
      managedFileId
    );
    let hasTable = false;
    let hasView = false;
    const childItems = [];
    for (const item of tableViewList) {
      if (item.type === "table") {
        hasTable = true;
        childItems.push(
          createDatabaseTableViewItem(
            item.name,
            tablesCollection.id,
            "mftable",
            item.fileName
          )
        );
      } else if (item.type === "view") {
        hasView = true;
        childItems.push(
          createDatabaseTableViewItem(
            item.name,
            viewsCollection.id,
            "mfview",
            item.fileName
          )
        );
      }
    }
    if (hasTable) databaseNodeItems.push(tablesCollection);
    if (hasView) databaseNodeItems.push(viewsCollection);
    databaseNodeItems.push(...childItems);
  }
  databaseStoreInstance.insertNodeItemToArray(databaseNodeItems);
}

export async function insertTableViewToManagedFiles(
  mfitem: SchemaChildrenItemResult
) {
  const managedFileChildren =
    databaseStateManager.getChildNodesById(managedFileId) || [];
  let hasTable = false;
  let hasView = false;
  let tablesCollection: DatabaseCollectionItem = null;
  let viewsCollection: DatabaseCollectionItem = null;
  for (let item of managedFileChildren) {
    if (item.name === DB_COLLECTION_TABLE_NAME) {
      hasTable = true;
      tablesCollection = item.dataNode as DatabaseCollectionItem;
    } else if (item.name === DB_COLLECTION_VIEW_NAME) {
      hasView = true;
      viewsCollection = item.dataNode as DatabaseCollectionItem;
    }
  }
  if (mfitem.type === "table") {
    if (!hasTable) {
      tablesCollection = createDatabaseCollectionItem(
        DB_COLLECTION_TABLE_NAME,
        managedFileId
      );
      databaseStoreInstance.addNode(managedFileId, tablesCollection);
      databaseStateManager.addNode(tablesCollection, managedFileId);
    }
    const tableItem = createDatabaseTableViewItem(
      mfitem.name,
      tablesCollection.id,
      "mftable",
      mfitem.fileName
    );
    databaseStoreInstance.addNode(tablesCollection.id, tableItem);
    databaseStateManager.addNode(tableItem, tablesCollection.id);
  }
}

export async function reloadManagedFiles(): Promise<SourceNodeItem[]> {
  const tableViewList = await getTablesViewsBySchema(
    MANAGED_FILE_DATABASE_SCHEMA_NAME
  );
  // Delete child nodes for store
  databaseStoreInstance.deleteChildNodes(managedFileId);

  const databaseNodeItems = [];
  if (tableViewList && tableViewList.length > 0) {
    const tablesCollection = createDatabaseCollectionItem(
      DB_COLLECTION_TABLE_NAME,
      managedFileId
    );
    const viewsCollection = createDatabaseCollectionItem(
      DB_COLLECTION_VIEW_NAME,
      managedFileId
    );
    let hasTable = false;
    let hasView = false;
    const childItems = [];
    for (const item of tableViewList) {
      if (item.type === "table") {
        hasTable = true;
        childItems.push(
          createDatabaseTableViewItem(
            item.name,
            tablesCollection.id,
            "mftable",
            item.fileName
          )
        );
      } else if (item.type === "view") {
        hasView = true;
        childItems.push(
          createDatabaseTableViewItem(
            item.name,
            viewsCollection.id,
            "mfview",
            item.fileName
          )
        );
      }
    }
    if (hasTable) databaseNodeItems.push(tablesCollection);
    if (hasView) databaseNodeItems.push(viewsCollection);
    databaseNodeItems.push(...childItems);
  }
  databaseStoreInstance.insertNodeItemToArray(databaseNodeItems);
  return databaseNodeItems;
}

/**
 * Generate new name in Managed File base on current Name
 * @param name
 * @returns
 */
export function generateNewValidManagedFileName(name: string): string {
  const childNodes = databaseStoreInstance.getChildNodesById(
    managedFileId,
    true
  );

  const isValidChildName = (checkName: string): boolean => {
    const v = childNodes.find((n) => n.name === checkName);
    return v ? false : true;
  };

  let updatedName = name;
  let index = 0;
  while (!isValidChildName(updatedName)) {
    updatedName = `${name}_${index}`;
    index++;
  }

  return updatedName;
}

export let duckdbDatabaseId: string = null;

export async function generateDuckdbDatabaseNodeData() {
  let databaseNodeItems: DatabaseNodeItem[] = [];
  const databaseItem = createDatabaseItem(
    DB_DATABASE_ROOT_DUCKDB_NAME,
    "Duckdb",
    null
  );
  duckdbDatabaseId = databaseItem.id;
  databaseNodeItems.push(databaseItem);

  const tableViewList = await getTablesViewsBySchema(
    DEFAULT_DATABASE_SCHEMA_NAME
  );
  if (tableViewList && tableViewList.length > 0) {
    const tablesCollection = createDatabaseCollectionItem(
      DB_COLLECTION_TABLE_NAME,
      duckdbDatabaseId
    );
    const viewsCollection = createDatabaseCollectionItem(
      DB_COLLECTION_VIEW_NAME,
      duckdbDatabaseId
    );
    let hasTable = false;
    let hasView = false;
    const childItems = [];
    for (const item of tableViewList) {
      if (item.type === "table") {
        hasTable = true;
        childItems.push(
          createDatabaseTableViewItem(
            item.name,
            tablesCollection.id,
            "dbtable",
            item.fileName
          )
        );
      } else if (item.type === "view") {
        hasView = true;
        childItems.push(
          createDatabaseTableViewItem(
            item.name,
            viewsCollection.id,
            "dbview",
            item.fileName
          )
        );
      }
    }
    if (hasTable) databaseNodeItems.push(tablesCollection);
    if (hasView) databaseNodeItems.push(viewsCollection);
    databaseNodeItems.push(...childItems);
  }
  databaseStoreInstance.insertNodeItemToArray(databaseNodeItems);
}

export async function reloadDuckdbDatabaseNodeData(): Promise<
  SourceNodeItem[]
> {
  const tableViewList = await getTablesViewsBySchema(
    DEFAULT_DATABASE_SCHEMA_NAME
  );

  // Getting database node and child nodes
  const databaseNodeItems = [];
  if (tableViewList && tableViewList.length > 0) {
    const collectionNodes =
      databaseStateManager.getChildNodesById(duckdbDatabaseId) || [];
    let tablesCollection = createDatabaseCollectionItem(
      DB_COLLECTION_TABLE_NAME,
      duckdbDatabaseId
    );
    let viewsCollection = createDatabaseCollectionItem(
      DB_COLLECTION_VIEW_NAME,
      duckdbDatabaseId
    );
    const nodeItemMap = {};
    for (const node of collectionNodes) {
      if (node.name === DB_COLLECTION_TABLE_NAME) {
        tablesCollection = node.dataNode;
      } else if (node.name === DB_COLLECTION_VIEW_NAME) {
        viewsCollection = node.dataNode;
      }
      const items = databaseStateManager.getChildNodesById(node.id) || [];
      for (let item of items) {
        nodeItemMap[item.name] = item.dataNode;
      }
    }
    // Delete child nodes for store
    databaseStoreInstance.deleteChildNodes(duckdbDatabaseId);

    const childItems = [];
    let mustAddTable = false;
    let mustAddView = false;
    for (const item of tableViewList) {
      let sitem = nodeItemMap[item.name];
      if (!sitem) {
        if (item.type === "table") {
          sitem = createDatabaseTableViewItem(
            item.name,
            tablesCollection.id,
            "dbtable"
          );
        } else if (item.type === "view") {
          sitem = createDatabaseTableViewItem(
            item.name,
            viewsCollection.id,
            "dbview"
          );
        }
      }
      if (!sitem) continue;
      if (item.type === "table") {
        mustAddTable = true;
      } else if (item.type === "view") {
        mustAddView = true;
      }
      childItems.push(sitem);
    }
    if (mustAddTable) databaseNodeItems.push(tablesCollection);
    if (mustAddView) databaseNodeItems.push(viewsCollection);
    databaseNodeItems.push(...childItems);
  } else {
    // Delete child nodes for store
    databaseStoreInstance.deleteChildNodes(duckdbDatabaseId);
  }
  databaseStoreInstance.insertNodeItemToArray(databaseNodeItems);
  return databaseNodeItems;
}

/**
 * Transfer current database to UI
 */
export async function importDatabaseStoreToSourceManager() {
  const databaseNodeItems = databaseStoreInstance.cloneTreeArray();
  addDatabaseStateManager(databaseNodeItems);
}

export default DatabaseStateManager;
