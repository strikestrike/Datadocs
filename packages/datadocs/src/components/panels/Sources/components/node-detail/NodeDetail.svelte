<script lang="ts">
  import { getContext } from "svelte";
  import type { SourceNodeItem } from "../../../../../app/store/panels/sources/type";
  import type { Node } from "../../../../common/file-system/fileSystemStateManager";
  import NodeColumn from "./items/NodeColumn.svelte";
  import NodeTitle from "./items/NodeTitle.svelte";
  import NodeItem from "./items/NodeItem.svelte";
  import type {
    DetailTransformContext,
    NodeDetailButton,
    NodeDetailColumn,
    NodeDetailItem,
  } from "./type";
  import type { SourcePanelAction } from "../../manager/action";
  import {
    DATABASE_SOURCE_PANEL_ACTION_CONTEXT,
    DATABASE_STATE_MANAGER_CONTEXT,
    DETAIL_TRANSFORM_CONTEXT,
    UPLOADED_FILES_SOURCE_PANEL_ACTION_CONTEXT,
    UPLOADED_FILES_STATE_MANAGER_CONTEXT,
  } from "../../constant";
  import type { SourceStateManager } from "../../manager/sourceStateManager";
  import NodeButton from "./items/NodeButton.svelte";
  import type { ContextMenuOptionsType } from "../../../../common/context-menu";
  import {
    MENU_DATA_ITEM_STATE_ENABLED,
    MENU_DATA_ITEM_TYPE_ELEMENT,
    type MenuItemType,
  } from "../../../../common/menu";
  import { isFileSystemFileNode } from "../../manager/uploadedFileStateManager";
  import DetailDivider from "./items/DetailDivider.svelte";

  export let data: Node<SourceNodeItem>;
  export let rootType: string;

  const databaseManager: SourceStateManager<SourceNodeItem> = getContext(
    DATABASE_STATE_MANAGER_CONTEXT,
  );
  const databaseActions: SourcePanelAction = getContext(
    DATABASE_SOURCE_PANEL_ACTION_CONTEXT,
  );
  const uploadedFilesManager: SourceStateManager<SourceNodeItem> = getContext(
    UPLOADED_FILES_STATE_MANAGER_CONTEXT,
  );
  const uploadedFileActions: SourcePanelAction = getContext(
    UPLOADED_FILES_SOURCE_PANEL_ACTION_CONTEXT,
  );
  let actions: SourcePanelAction = getSourceAction();
  let manager: SourceStateManager<SourceNodeItem> = getSourceStateManager();
  let nodeName: string;
  let nodeIcon: string;
  let nodeButton: NodeDetailButton = null;
  let items: NodeDetailItem[];
  let columnItems: NodeDetailColumn[];
  const transformContext: DetailTransformContext = getContext(
    DETAIL_TRANSFORM_CONTEXT,
  );
  let resizeTimeout: NodeJS.Timeout;

  function updateNodeData() {
    nodeName = data.name;
    nodeIcon = manager.getNodeIcon(data.id);
    items = manager.getNodeDetail(data.id);
    nodeButton = manager.getNodeDetailButton(data.id);
    manager.getNodeDetailColumns(data.id).then((columns) => {
      columnItems = columns;
    });
  }

  async function handleEditNodeName(name: string) {
    actions = getSourceAction();
    await actions.renameNode(data.id, name);
  }

  function onResize(event: MouseEvent) {
    const { clientX: x, clientY: y, currentTarget: divider } = event;

    transformContext.startResize(
      x,
      y,
      divider as HTMLElement,
      "horizontal",
      false,
      () => {
        clearTimeout(resizeTimeout);
      },
    );
  }

  // More options
  let triggerEdit: () => void;
  function getMoreButtonOptions(): ContextMenuOptionsType {
    let menuItems: MenuItemType[] = [];
    if (data.type === "databaseroot") {
      menuItems = [
        {
          type: MENU_DATA_ITEM_TYPE_ELEMENT,
          label: "Edit Connection",
          state: MENU_DATA_ITEM_STATE_ENABLED,
          action: () => {},
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
          label: "Remove Connection",
          state: MENU_DATA_ITEM_STATE_ENABLED,
          status: "warning",
          action: () => {
            actions.deleteNode(data.id);
          },
        },
      ];
    } else if (
      isFileSystemFileNode(data) ||
      data.type === "dbtable" ||
      data.type === "mftable" ||
      data.type === "dbview"
    ) {
      menuItems = [
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
          label: "Remove",
          state: MENU_DATA_ITEM_STATE_ENABLED,
          status: "warning",
          action: () => {
            actions.deleteNode(data.id);
          },
        },
      ];
    }
    if (menuItems.length > 0) {
      return {
        menuItems: menuItems,
        disabled: false,
        useClickEvent: true,
      };
    }
    return null;
  }

  function getSourceAction(): SourcePanelAction {
    return rootType === "database" ? databaseActions : uploadedFileActions;
  }

  function getSourceStateManager(): SourceStateManager<SourceNodeItem> {
    return rootType === "database" ? databaseManager : uploadedFilesManager;
  }

  function getShowReload(): boolean {
    return (
      rootType === "database" &&
      (data.type === "dbtable" ||
        data.type === "dbview" ||
        data.type === "mftable" ||
        data.type === "mfview")
    );
  }

  function handleReloadColumns() {
    manager = getSourceStateManager();
    manager.getNodeDetailColumns(data.id).then((columns) => {
      columnItems = columns;
    });
  }

  $: if (data) {
    manager = getSourceStateManager();
    actions = getSourceAction();
    // moreButtonOptions = getMoreButtonOptions();
    updateNodeData();
  }
</script>

{#if data}
  <div class="source-node-detail-container pb-2 flex flex-col h-full">
    <DetailDivider on:mousedown={onResize} />
    <div class="flex flex-col gap-4 h-full">
      <NodeTitle
        {nodeIcon}
        {nodeName}
        {actions}
        showReload={getShowReload()}
        {handleEditNodeName}
        {handleReloadColumns}
        bind:triggerEdit
      />
      {#if items && items.length > 0}
        <div class="flex flex-col pl-3 pr-3 gap-2">
          {#each items as item}
            <NodeItem
              items={item.children}
              name={item.name}
              type={item.type}
              value={item.value}
            />
          {/each}
          <div class="border w-full border-gray-100" />
        </div>
      {/if}
      <div class="gap-4 h-full overflow-y-auto">
        {#if columnItems && columnItems.length > 0}
          <div class="gap-1">
            {#each columnItems as item}
              <NodeColumn name={item.name} type={item.type} />
            {/each}
          </div>
        {/if}
        {#if nodeButton}
          <NodeButton name={nodeButton.name} action={nodeButton.action} />
        {/if}
      </div>
    </div>
  </div>
{/if}

<style lang="postcss">
  .source-node-detail-container {
    box-shadow: 0px -3px 8px -3px rgba(55, 84, 170, 0.16);
  }

  /* .source-node-detail-container :global(*) {
    @apply select-text;
  } */
</style>
