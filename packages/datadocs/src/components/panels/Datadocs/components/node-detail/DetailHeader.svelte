<script lang="ts">
  import type { DataNodeBase, Node } from "../../../../common/file-system/fileSystemStateManager";
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

  export let nodeId: string;
  export let nodeName: string;
  export let nodeType: string;

  const fileSystemActions: FlatFileSystemActions<DataNodeBase> = getContext(
    FILE_SYSTEM_ACTION_CONTEXT,
  );
  let editing: boolean;

  async function handleEditNodeName(name: string) {
    await fileSystemActions.renameNode(nodeId, name);
  }

  function handleMoreOptionsButtonClick(event: MouseEvent) {
    event.stopPropagation();
    fileSystemActions.selectNode(nodeId, true);
  }

  // More options
  let triggerEdit: () => void;
  const moreButtonItems: MenuItemType[] = [
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
        fileSystemActions.deleteNode(nodeId);
      },
    },
  ];
</script>

<div class="w-full">
  <PanelNodeElement
    bind:triggerEdit
    label={nodeName}
    {handleEditNodeName}
    moreButtonItems={[]}
    contextMenuItems={moreButtonItems}
    onMoreOptionsButtonClick={handleMoreOptionsButtonClick}
    bind:editing
  >
    <div slot="icon">
      <Icon icon={nodeType === "wb" ? "panel-file" : "panel-folder"} size="20px" />
    </div>
  </PanelNodeElement>
</div>

<style lang="postcss">
  div :global(.panel-node-element) {
    background-color: inherit!important;
  }

  div :global(.panel-more-button) {
    visibility: visible!important;
  }
</style>
