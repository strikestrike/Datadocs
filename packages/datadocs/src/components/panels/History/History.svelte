<script lang="ts">
  import { tick } from "svelte";
  import type { Writable } from "svelte/store";
  import { activeHistoryManager } from "../../../app/store/panels/writables";
  import Icon from "../../common/icons/Icon.svelte";
  import { bind, openModal, closeModal } from "../../common/modal";
  import type { ModalConfigType } from "../../common/modal";
  import AddMacroModal from "./components/add-macro-modal/AddMacroModal.svelte";
  import HistoryItem from "./components/HistoryItem.svelte";
  import {
    HISTORY_ACTION_TYPE_REDO,
    HISTORY_ACTION_TYPE_UNDO,
  } from "./types/constants";
  import type HistoryAction from "./types/history/actions/history-action";
  import { DropdownWrapper } from "../../common/dropdown";
  import MacroDropdown from "./components/dropdown/MacroDropdown.svelte";

  let undoActionStore: Writable<HistoryAction[]>;
  let redoActionStore: Writable<HistoryAction[]>;
  let showHidden: Writable<boolean>;
  let undoActions: HistoryAction[] = [];
  let redoActions: HistoryAction[] = [];
  export let dropdownActive = false;

  let handleHistoryToggle = () => {
    historyManager.updateShowHidden(!$showHidden);
  };

  let handleMacroDropdown = () => {
    dropdownActive = !dropdownActive;
  };

  async function handleAddNewMacro() {
    if (historyManager.selectedArrs.length === 0) {
      alert("Please select at least one action");
      return;
    }
    const isMovable = false;
    const isResizable = false;
    const modalElement = bind(AddMacroModal);
    const modalConfig: ModalConfigType = {
      component: modalElement,
      isMovable: isMovable,
      isResizable: isResizable,
      minWidth: 375,
      minHeight: 200,
      preferredWidth: Math.min(window.innerWidth - 20, 720),
    };
    closeModal(); // close current modal
    await tick();
    openModal(modalConfig);
  }

  $: historyManager = $activeHistoryManager;
  $: historyManager,
    (() => {
      if (!historyManager) {
        return;
      }
      showHidden = historyManager.showHiddenStore;
      undoActionStore = historyManager.undoStackStore;
      redoActionStore = historyManager.redoStackStore;
    })();
  $: undoActions = $undoActionStore
    ? $showHidden
      ? $undoActionStore
      : $undoActionStore.filter((a) => !a.hidden)
    : [];
  $: redoActions = $undoActionStore
    ? $showHidden
      ? $redoActionStore
      : $redoActionStore.filter((a) => !a.hidden)
    : [];
</script>

<div class="panel-history">
  <div class="history-options">
    <div class="history-options-left">
      <div class="headers-list">
        <div class="flex flex-row justify-start items-center space-x-1 mx-1">
          <div class="history-label">History</div>
        </div>
      </div>
    </div>
    <div class="history-options-right">
      <div>
        <DropdownWrapper bind:show={dropdownActive}>
          <div on:click={(event) => handleMacroDropdown()} slot="button">
            <Icon icon="status-bar-more" size="18" />
          </div>
          <MacroDropdown slot="content" />
        </DropdownWrapper>
      </div>
      <div on:click={(event) => handleHistoryToggle()}>
        <Icon icon="layer-action-toggle" size="18" />
      </div>
      <div class="text-pink-100" on:click={(event) => handleAddNewMacro()}>
        <Icon icon="plus-sign" size="18" />
      </div>
    </div>
  </div>
  <div class="relative h-full">
    <div class="history-items-container">
      <div class="history-items">
        {#if redoActions.length && redoActions.length > 0}
          {#each redoActions as action}
            <HistoryItem
              historyItem={action}
              actionType={HISTORY_ACTION_TYPE_REDO}
            />
          {/each}
        {/if}
        {#if undoActions.length && undoActions.length > 0}
          {#each [...undoActions].reverse() as action}
            <HistoryItem
              historyItem={action}
              actionType={HISTORY_ACTION_TYPE_UNDO}
            />
          {/each}
        {/if}
        {#if undoActions.length == 0 && redoActions.length == 0}
          <div>No actions yet...</div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style lang="postcss">
  .panel-history {
    @apply flex flex-col justify-start h-full;
  }

  .history-options {
    @apply flex flex-row justify-between items-center px-2;
    height: 30px;
    box-shadow: 0px 2px 4px rgba(55, 84, 170, 0.1);
  }

  .history-options-left {
    @apply flex flex-row min-w-0 justify-start items-center px-1;
  }
  .history-options-right {
    @apply flex flex-row justify-end items-center space-x-2;
  }

  .history-options-left .headers-list {
    @apply flex flex-row justify-start items-center overflow-hidden;
  }
  .history-options-left .headers-list .history-label {
    @apply flex flex-grow-0 min-w-0 text-[11px] font-medium leading-[16px] whitespace-nowrap overflow-ellipsis;
  }

  .history-items-container {
    @apply absolute top-0 bottom-0 left-0 right-0 my-1;
  }

  .history-items {
    @apply h-full max-h-full flex flex-col overflow-y-auto;
  }
</style>
