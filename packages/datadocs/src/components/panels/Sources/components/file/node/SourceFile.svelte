<script lang="ts">
  import type { Node } from "../../../../../common/file-system/fileSystemStateManager";
  import Icon from "../../../../../common/icons/Icon.svelte";
  import PanelNodeElement from "../../../../../common/panel/PanelNodeElement.svelte";
  import {
    MENU_DATA_ITEM_STATE_ENABLED,
    MENU_DATA_ITEM_TYPE_ELEMENT,
    type MenuItemType,
  } from "../../../../../common/menu";
  import { getContext } from "svelte";
  import {
    FILE_SYSTEM_ACTION_CONTEXT,
    FILE_SYSTEM_STATE_MANAGER_CONTEXT,
  } from "../../../../../common/file-system/flat-file-system/constant";
  import FileSystemNode from "../../../../../common/file-system/flat-file-system/FileSystemNode.svelte";
  import type { SourcePanelAction } from "../../../manager/action";
  import type { SourceStateManager } from "../../../manager/sourceStateManager";
  import type {
    FileSystemNodeItem,
    SourceNodeItem,
  } from "../../../../../../app/store/panels/sources/type";
  import { get } from "svelte/store";
  import { activeView } from "../../../../../../app/store/store-ui";
  import uploadedFileStateManager from "../../../manager/uploadedFileStateManager";
  import {
    createTable,
    getStartPoint,
  } from "../../../../../../app/store/grid/base";
  import {
    ingestOrImportFromUploadedFile,
    optimizedType,
  } from "../../../../../../app/store/store-db";
  import {
    generateNewValidManagedFileName,
    insertTableViewToManagedFiles,
  } from "../../../manager/databaseStateManager";

  export let node: Node<any>;

  const fileSystemActions: SourcePanelAction = getContext(
    FILE_SYSTEM_ACTION_CONTEXT,
  );
  const fileSystemStateManager: SourceStateManager<SourceNodeItem> = getContext(
    FILE_SYSTEM_STATE_MANAGER_CONTEXT,
  );
  let nodeElement: HTMLElement;
  let editing: boolean;

  async function handleEditNodeName(name: string) {
    await fileSystemActions.renameNode(node.id, name);
  }

  function handleMoreOptionsButtonClick(event: MouseEvent) {
    event.stopPropagation();
    fileSystemActions.selectNode(node.id, true);
  }

  // More options
  let triggerEdit: () => void;
  const moreButtonItems: MenuItemType[] = [
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "Query item",
      state: MENU_DATA_ITEM_STATE_ENABLED,
      action: () => {
        const viewId = get(activeView).id;
        const buildedQuery = uploadedFileStateManager.buildQueryString(node.id);
        if (buildedQuery) {
          let optimizedTypeVal = get(optimizedType);
          createTable(
            viewId,
            getStartPoint(viewId),
            buildedQuery,
            optimizedTypeVal,
          );
        }
      },
    },
    // {
    //   type: MENU_DATA_ITEM_TYPE_ELEMENT,
    //   label: "Ingest file",
    //   state: MENU_DATA_ITEM_STATE_ENABLED,
    //   action: async () => {
    //     const tableName = generateNewValidManagedFileName(
    //       node.name.replace(/\..+?$/, "").replace(/\W+/, "_"),
    //     );
    //     const res = await ingestOrImportFromUploadedFile(
    //       (node.dataNode as FileSystemNodeItem).storedName,
    //       tableName,
    //       "ingest",
    //     );
    //     if (res) {
    //       await insertTableViewToManagedFiles({
    //         name: tableName,
    //         type: "table",
    //         fileName: node.name,
    //       });
    //     }
    //   },
    // },
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "Info",
      state: MENU_DATA_ITEM_STATE_ENABLED,
      action: () => {
        fileSystemActions.showDetail(node.id);
      },
    },
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "Rename",
      state: MENU_DATA_ITEM_STATE_ENABLED,
      action: () => {
        triggerEdit();
      },
    },
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "Delete",
      state: MENU_DATA_ITEM_STATE_ENABLED,
      status: "warning",
      action: () => {
        fileSystemActions.deleteNode(node.id);
      },
    },
  ];

  function getNodeIcon(): string {
    return fileSystemStateManager.getNodeIcon(node.id);
  }
</script>

<FileSystemNode
  bind:fsNodeElement={nodeElement}
  nodeId={node.id}
  draggable={true}
>
  <PanelNodeElement
    bind:triggerEdit
    label={node.name}
    {handleEditNodeName}
    {moreButtonItems}
    selected={node.selected}
    onMoreOptionsButtonClick={handleMoreOptionsButtonClick}
    bind:editing
  >
    <div slot="icon">
      <Icon icon={getNodeIcon()} size="20px" />
    </div>
  </PanelNodeElement>
</FileSystemNode>
