<script lang="ts">
  import { getContext } from "svelte";
  import type {
    RemoteFileStorageItem,
    RemoteFileSystemItem,
  } from "../../../../../../app/store/panels/sources/type";
  import type { Node } from "../../../../../common/file-system/fileSystemStateManager";
  import Icon from "../../../../../common/icons/Icon.svelte";
  import {
    MENU_DATA_ITEM_STATE_ENABLED,
    MENU_DATA_ITEM_TYPE_ELEMENT,
    type MenuItemType,
  } from "../../../../../common/menu";
  import PanelNodeElement from "../../../../../common/panel/PanelNodeElement.svelte";
  import type { SourceStateManager } from "../../../manager/sourceStateManager";
  import SourceNode from "../../SourceNode.svelte";
  import {
    REMOTE_FILES_SOURCE_PANEL_ACTION_CONTEXT,
    REMOTE_FILES_SYSTEM_MANAGER_CONTEXT,
  } from "../../../constant";
  import type { SourcePanelAction } from "../../../manager/action";

  const stateManager: SourceStateManager<RemoteFileSystemItem> = getContext(
    REMOTE_FILES_SYSTEM_MANAGER_CONTEXT,
  );
  const actions: SourcePanelAction = getContext(
    REMOTE_FILES_SOURCE_PANEL_ACTION_CONTEXT,
  );

  async function handleEditNodeName(name: string) {
    actions.renameNode(node.id, name);
  }

  // Editing name
  let editingName: boolean;
  function handleClick(event: Event) {
    event.stopPropagation();
    if (!editingName) {
      //   databasePanelActions.openNode(node.id);
      if ((node.dataNode as RemoteFileStorageItem).isActive) {
        actions.openNode(node.id);
      }
    }
  }

  // More buttons
  let triggerEdit: () => void;
  const moreButtonItems: MenuItemType[] = [
    {
      type: MENU_DATA_ITEM_TYPE_ELEMENT,
      label: "Info",
      state: MENU_DATA_ITEM_STATE_ENABLED,
      action: () => {
        actions.showDetail(node.id);
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
        actions.deleteNode(node.id);
      },
    },
  ];

  function getNodeIcon(): string {
    return stateManager.getNodeIcon(node.id);
  }

  export let node: Node<RemoteFileSystemItem>;
</script>

<SourceNode {handleClick}>
  <PanelNodeElement
    bind:triggerEdit
    bind:editing={editingName}
    label={node.name}
    {handleEditNodeName}
    {moreButtonItems}
  >
    <div slot="icon">
      <Icon icon={getNodeIcon()} size="20px" />
    </div>
  </PanelNodeElement>
</SourceNode>
