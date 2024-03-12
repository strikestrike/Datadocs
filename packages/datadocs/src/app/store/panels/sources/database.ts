import type { Writable } from "svelte/store";
import SourceBaseStore from "./base";
import type { DatabaseNodeItem, SourceNodeItem } from "./type";
import {
  changeDatabaseItemName,
  dropDatabaseItem,
  getTablesViewsBySchema,
} from "../../store-db";
import { MANAGED_FILE_DATABASE_SCHEMA_NAME } from "../../../../components/panels/Sources/constant";
import { reloadDuckdbDatabaseNodeData, reloadManagedFiles } from "../../../../components/panels/Sources/manager/databaseStateManager";

class DatabaseStore extends SourceBaseStore {
  readonly treeStore: Writable<DatabaseNodeItem[]>;

  constructor(data: DatabaseNodeItem[]) {
    super(data);
  }

  async handleRenameNode(nodeId: string, name: string): Promise<boolean> {
    const node = this.getNodeById(nodeId);

    let res = true;
    if (
      node.type === "dbtable" ||
      node.type === "dbview" ||
      node.type === "mftable" ||
      node.type === "mfview"
    ) {
      const schemaName =
        node.type === "mftable" || node.type === "mfview"
          ? MANAGED_FILE_DATABASE_SCHEMA_NAME
          : null;
      const tbType =
        node.type === "dbtable" || node.type === "mftable" ? "TABLE" : "VIEW";
      res = await changeDatabaseItemName(schemaName, tbType, node.name, name);
    }

    if (res) {
      return this.renameNode(nodeId, name);
    }

    return false;
  }

  async handleDeleteNode(nodeId: string): Promise<boolean> {
    const node = this.getNodeById(nodeId);
    let deleteEmptyChildrenNode = false;
    let res = true;
    if (
      node.type === "dbtable" ||
      node.type === "dbview" ||
      node.type === "mftable" ||
      node.type === "mfview"
    ) {
      const schemaName =
        node.type === "mftable" || node.type === "mfview"
          ? MANAGED_FILE_DATABASE_SCHEMA_NAME
          : null;
      const tbType =
        node.type === "dbtable" || node.type === "mftable" ? "TABLE" : "VIEW";
      res = await dropDatabaseItem(schemaName, tbType, node.name);
      deleteEmptyChildrenNode = true;
    }

    if (res) {
      const delRes = this.deleteNode(nodeId);

      if (deleteEmptyChildrenNode) {
        const parentId = node.parent;
        const parent = this.getNodeById(parentId);
        if (parent) {
          const childNodes = this.getChildNodesById(parentId);
          if (!childNodes || childNodes.length === 0) {
            this.deleteNode(parentId);
          }
        }
      }

      return delRes;
    }

    return false;
  }

  handleAddNode(
    parentId: string,
    name: string,
    storageFileName: string,
    type: string
  ): Promise<SourceNodeItem> {
    throw new Error("Method not implemented.");
  }

  handleMoveNode(targetId: string, sourceIds: string[]): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  async handleSearchNodes(
    searchValue: string,
    rootId: string
  ): Promise<string[]> {
    return [];
  }

  async handleRefreshNode(nodeId: string): Promise<SourceNodeItem[]> {
    const node = this.getNodeById(nodeId);
    if (!node) return null;

    if (node.type === "managedfiles") {
      return reloadManagedFiles();
    } else if (node.type === "databaseroot") {
      return reloadDuckdbDatabaseNodeData();
    }
  }
}

export default DatabaseStore;
