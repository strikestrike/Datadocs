<script lang="ts">
  import type {
    DataNodeBase,
    Node,
  } from "../../../../common/file-system/fileSystemStateManager";
  import Icon from "../../../../common/icons/Icon.svelte";
  import PanelNodeElement from "../../../../common/panel/PanelNodeElement.svelte";
  import type { FlatFileSystemActions } from "../../../../common/file-system/flat-file-system/flatFileSystemActions";
  import {
    MENU_DATA_ITEM_STATE_ENABLED,
    MENU_DATA_ITEM_TYPE_ELEMENT,
    type MenuItemType,
  } from "../../../../common/menu";
  import { getContext } from "svelte";
  import { FILE_SYSTEM_ACTION_CONTEXT } from "../../../../common/file-system/flat-file-system/constant";
  import FileSystemNode from "../../../../common/file-system/flat-file-system/FileSystemNode.svelte";

  export let node: Node<DataNodeBase>;

  const fileSystemActions: FlatFileSystemActions<DataNodeBase> = getContext(
    FILE_SYSTEM_ACTION_CONTEXT,
  );
  let nodeElement: HTMLElement;
  let editing: boolean;

  async function handleEditNodeName(name: string) {
    await fileSystemActions.renameNode(node.id, name);
  }

  async function handleNodeDblClick(event: MouseEvent) {
    if (editing) return;
    const target =
      event.target instanceof HTMLSpanElement &&
      event.target.classList.contains("panel-node-label-text")
        ? "label"
        : "node";
    await fileSystemActions.handleNodeDoubleClick(node.id, target);
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
</script>

<FileSystemNode
  bind:fsNodeElement={nodeElement}
  nodeId={node.id}
  draggable={!editing}
  on:dblclick={handleNodeDblClick}
>
  <PanelNodeElement
    bind:triggerEdit
    label={node.name}
    {handleEditNodeName}
    {moreButtonItems}
    selected={node.selected}
    onMoreOptionsButtonClick={handleMoreOptionsButtonClick}
    on:panel-node-click={(event) => {
      fileSystemActions.handleNodeClick(
        node.id,
        event?.detail?.target === "label" ? "label" : "node",
      );
    }}
    bind:editing
  >
    <div slot="icon">
      <Icon icon="panel-file" size="20px" />
    </div>
  </PanelNodeElement>
</FileSystemNode>
