<script lang="ts">
  import type { DataNodeBase, Node } from "../fileSystemStateManager";
  import Icon from "../../../common/icons/Icon.svelte";
  import PanelNodeElement from "../../../common/panel/PanelNodeElement.svelte";
  import type { FlatFileSystemActions } from "./flatFileSystemActions";
  import {
    MENU_DATA_ITEM_STATE_ENABLED,
    MENU_DATA_ITEM_TYPE_ELEMENT,
    type MenuItemType,
  } from "../../../common/menu";
  import { getContext } from "svelte";
  import {
    FILE_SYSTEM_ACTION_CONTEXT,
    FILE_SYSTEM_STATE_MANAGER_CONTEXT,
  } from "./constant";
  import FileSystemNode from "./FileSystemNode.svelte";
  import type { FlatFileSystemManager } from "./flatFileSystemManager";

  export let node: Node<DataNodeBase>;
  export let isParentPath = false;
  export let triggerEdit: () => void = null;
  export let moreButtonItems: MenuItemType[] = [
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "View Info",
      state: MENU_DATA_ITEM_STATE_ENABLED,
      action: () => {
        fileSystemActions.showNodeDetails(node.id);
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

  const fileSystemActions: FlatFileSystemActions<DataNodeBase> = getContext(
    FILE_SYSTEM_ACTION_CONTEXT,
  );
  const stateManager: FlatFileSystemManager<DataNodeBase> = getContext(
    FILE_SYSTEM_STATE_MANAGER_CONTEXT,
  );

  let nodeElement: HTMLElement;
  let editing: boolean;
  let selected = false;
  let nodeId = isParentPath ? node.parent ?? null : node.id;

  async function handleNodeDblClick(event: MouseEvent) {
    if (editing) return;
    const target =
      event.target instanceof HTMLSpanElement &&
      event.target.classList.contains("panel-node-label-text")
        ? "label"
        : "node";
    await fileSystemActions.handleNodeDoubleClick(nodeId, target);
  }

  async function handleEditNodeName(name: string) {
    await fileSystemActions.renameNode(node.id, name);
  }

  function handleMoreOptionsButtonClick(event: MouseEvent) {
    event.stopPropagation();
    fileSystemActions.selectNode(node.id, true);
  }

  $: if (node) {
    selected = stateManager.checkNodeSelected(nodeId);
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<FileSystemNode
  bind:fsNodeElement={nodeElement}
  on:dblclick={handleNodeDblClick}
  {nodeId}
  draggable={!editing}
>
  <PanelNodeElement
    bind:triggerEdit
    label={isParentPath ? ".." : node.name}
    editable={isParentPath ? false : true}
    {handleEditNodeName}
    moreButtonItems={isParentPath ? [] : moreButtonItems}
    {selected}
    onMoreOptionsButtonClick={handleMoreOptionsButtonClick}
    on:panel-node-click={(event) => {
      fileSystemActions.handleNodeClick(
        nodeId,
        event?.detail?.target === "label" ? "label" : "node",
      );
    }}
    bind:editing
  >
    <div slot="icon">
      <Icon icon="panel-folder" size="20px" />
    </div>
  </PanelNodeElement>
</FileSystemNode>
