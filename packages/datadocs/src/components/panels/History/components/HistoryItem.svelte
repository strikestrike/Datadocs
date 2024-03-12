<script lang="ts">
  import {
    redoMultipleActions,
    undoMultipleActions,
  } from "../../../../app/store/panels/store-history-panel";
  import { activeHistoryManager } from "../../../../app/store/panels/writables";
  import { HISTORY_ACTION_TYPE_UNDO } from "../types/constants";
  import type HistoryAction from "../types/history/actions/history-action";
  import HistoryActions from "./HistoryActions.svelte";

  const PADDING_LEFT = 6;

  export let historyItem: HistoryAction = null;

  export let padding = 0;

  export let actionType: string = HISTORY_ACTION_TYPE_UNDO;

  let active = false;
  let isSelect = false;

  function onItemMouseEnter(event: Event) {
    (event.target as HTMLElement).classList.add("history-hover");
  }

  function onItemMouseLeave(event: Event) {
    (event.target as HTMLElement).classList.remove("history-hover");
  }

  function onItemMouseClick(event: Event) {
    if (historyItem.hidden) {
      return;
    }
    if (actionType === HISTORY_ACTION_TYPE_UNDO) {
      undoMultipleActions(
        historyManager.getUndoActionBeforeAction(historyItem.id).id
      );
    } else {
      redoMultipleActions(historyItem.id);
    }
  }

  function handleSelect(event: Event) {
    historyManager.toggleSelected(historyItem.id);
  }

  $: historyManager = $activeHistoryManager;
  $: historyManager,
    (() => {
      if (!historyManager) {
        return;
      }
      active = historyManager.isActive(historyItem.id);
      isSelect = historyManager.isSelected(historyItem.id);
    })();
  $: selectedArrayStore = historyManager.selectedArrayStore;
  $: $selectedArrayStore,
    (() => {
      isSelect = historyManager.isSelected(historyItem.id);
    })();
</script>

{#if historyItem !== null}
  <div
    class={`history-item history-item-history`}
    class:disabled={historyItem.hidden}
    class:active
    class:is-select={isSelect}
  >
    <!-- use:dragDrop={{ useTranslate: true, ...handlerDrag() }} -->
    <div
      class="history-history-details"
      on:mouseenter={onItemMouseEnter}
      on:mouseleave={onItemMouseLeave}
      style={`padding-left:${padding * PADDING_LEFT}px`}
    >
      <div class="history-label" on:click={onItemMouseClick}>
        <span class="arrow-space-filler" />
        <span class={`type-icon ${historyItem.actionType}`}>
          <!-- <LayerItemIcon layerType={layerItem.type} pane={layerItem.pane} /> -->
        </span>
        <span class="history-label-text">
          {historyItem.displayName + " by "}
          <span class="history-owner-name">{historyItem.ownerName}</span>
        </span>
      </div>
      <div class="history-actions-holder">
        <HistoryActions historySelect={handleSelect} />
      </div>
    </div>
  </div>
{/if}

<style lang="postcss">
  .history-item {
    @apply flex flex-col;
    border-top: solid 1px transparent;
    border-bottom: solid 1px transparent;
  }

  .history-item > .history-history-details {
    @apply flex flex-row justify-between items-center;
    height: 28px;
  }

  .history-item.is-select > .history-history-details {
    background: #5d89ff1a;
    border-radius: 2px;
  }

  .history-item > .history-history-details:hover {
    background: #5f89ff1a;
    border-radius: 2px;
  }

  .history-item > .history-history-details .history-label {
    @apply flex flex-row justify-start items-center pl-2 space-x-1;
  }

  .history-item
    > .history-history-details
    .history-label
    > .arrow-space-filler {
    @apply w-2 h-2;
  }

  .history-item > .history-history-details > .history-label > .type-icon {
    /* @apply px-0.5; */
  }

  .history-item > .history-history-details .history-label .history-label-text {
    @apply text-[11px] leading-4 font-normal text-black;
  }

  .history-item
    > .history-history-details
    .history-label
    .history-label-text
    .history-owner-name {
    @apply ellipsis h-5 text-13px font-semibold;
  }

  .history-item > .history-history-details .history-actions-holder {
    @apply hidden flex-row justify-start items-center pr-1;
  }

  .history-item
    > :global(
      .history-history-details.history-hover > .history-actions-holder
    ) {
    display: flex !important;
  }

  .disabled {
    color: #a7b0b5;
    opacity: 0.6;
    /* pointer-events: none; */
  }

  .history-item.active > .history-history-details .history-label {
    pointer-events: none;
  }

  .history-item.active
    > .history-history-details
    .history-label
    .history-label-text {
    color: #3bc7ff;
  }
</style>
