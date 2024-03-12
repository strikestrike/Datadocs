<script lang="ts">
  import { getContext } from "svelte";
  import type { DatabaseNodeItem } from "../../../../../../../app/store/panels/sources/type";
  import type { Node } from "../../../../../../common/file-system/fileSystemStateManager";
  import PanelNodeElement from "../../../../../../common/panel/PanelNodeElement.svelte";
  import type { SourcePanelAction } from "../../../../manager/action";
  import SourceNode from "../../../SourceNode.svelte";
  import {
    DATABASE_SOURCE_PANEL_ACTION_CONTEXT,
    DATABASE_STATE_MANAGER_CONTEXT,
  } from "../../../../constant";
  import type DatabaseStateManager from "../../../../manager/databaseStateManager";
  import Icon from "../../../../../../common/icons/Icon.svelte";
  import type { MenuItemType } from "../../../../../../common/menu";
  import { activeView } from "../../../../../../../app/store/store-ui";
  import { get } from "svelte/store";
  import {
    createTable,
    getStartPoint,
  } from "../../../../../../../app/store/grid/base";
  import { optimizedType } from "../../../../../../../app/store/store-db";

  export let node: Node<DatabaseNodeItem>;

  const databaseSourcePanelActions: SourcePanelAction = getContext(
    DATABASE_SOURCE_PANEL_ACTION_CONTEXT,
  );
  const databaseStateManager: DatabaseStateManager<DatabaseNodeItem> =
    getContext(DATABASE_STATE_MANAGER_CONTEXT);
  const expandArrowIcon = "tw-expand-arrow";
  const prefixIcon = getPrefixSvgIcon();
  let selected = databaseStateManager.checkNodeSelected(node.id);
  const className = "database-node";

  function getPrefixSvgIcon(): string {
    return databaseStateManager.getNodeIcon(node.id);
  }

  function handleClick(event: Event) {
    event.stopPropagation();
    databaseSourcePanelActions.selectNode(node.id);
    databaseSourcePanelActions.showDetail(node.id);
  }

  function handleDoubleClick(event: Event) {
    event.stopPropagation();
    console.log("Double click on item ", node);
    const viewId = get(activeView).id;
    const buildQuery = databaseStateManager.buildQueryString(node.id);
    let optimizedTypeVal = get(optimizedType);
    createTable(viewId, getStartPoint(viewId), buildQuery, optimizedTypeVal);
  }

  // More buttons
  let moreButtonItems: MenuItemType[] = [];

  $: if (node) {
    selected = databaseStateManager.checkNodeSelected(node.id);
  }
</script>

<div class="relative flex flex-row items-center w-full">
  {#if node && node.type === "dbcollection"}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      class="flex-grow-0 flex-shrink-0 w-2.5 h-2.5 mr-0.5 cursor-pointer transform"
      class:-rotate-90={!node.expanded}
      on:click={() => databaseSourcePanelActions.toggleCollapseNode(node)}
    >
      <Icon icon={expandArrowIcon} size="10px" />
    </div>
  {/if}
  <SourceNode {className} {handleClick} {handleDoubleClick}>
    <PanelNodeElement label={node.name} {moreButtonItems} {selected}>
      <div slot="icon">
        {#if prefixIcon}
          <Icon icon={prefixIcon} size="20px" fill="none" />
        {/if}
      </div>
    </PanelNodeElement>
  </SourceNode>
</div>
{#if node.expanded && node.children && node.children.length > 0}
  <div class="flex pl-3 flex-col">
    {#each node.children as childId}
      <svelte:self node={databaseStateManager.getNodeById(childId)} />
    {/each}
  </div>
{/if}

<style lang="postcss">
  :global {
    .database-node {
      @apply w-full;
    }
  }
</style>
