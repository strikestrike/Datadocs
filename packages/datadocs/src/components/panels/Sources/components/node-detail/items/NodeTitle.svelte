<script lang="ts">
  import { tick } from "svelte";
  // import {
  //   contextMenuAction,
  //   type ContextMenuOptionsType,
  // } from "../../../../../common/context-menu";
  import Icon from "../../../../../common/icons/Icon.svelte";
  import type { SourcePanelAction } from "../../../manager/action";

  export let nodeIcon: string;
  export let nodeName: string;
  export let actions: SourcePanelAction;
  // export let moreButtonOptions: ContextMenuOptionsType;
  export let showReload: boolean = false;
  export let inputElement: HTMLInputElement = null;
  /**
   * Whether node name is editable or not
   */
  export let editable = true;
  export const triggerEdit = () => {
    if (!editable) return;
    startEdit();
  };
  export let handleEndEdit = (name: string) => {};
  /**
   * Edit node name logic
   */
  export let handleEditNodeName = async (name: string) => {};
  export let handleReloadColumns = () => {};

  export let editing = false;
  let resetNodeName = () => {};
  async function startEdit() {
    if (!editable) return;

    const currentName = nodeName;
    resetNodeName = () => {
      nodeName = currentName;
    };

    await tick();
    editing = true;

    setTimeout(() => {
      inputElement.focus();
      inputElement.select();
    });
  }

  function endEdit(abort = false) {
    if (!editing) return;

    // a callback is called with the latest value before reseting
    // the node name
    handleEndEdit(inputElement.value);

    if (abort && typeof resetNodeName === "function") {
      resetNodeName();
      resetNodeName = null;
    }

    editing = false;
  }

  async function submitChangeNodeName(name: string) {
    try {
      await handleEditNodeName(name);
      nodeName = name;
    } catch (e) {
      if (resetNodeName && typeof resetNodeName === "function") {
        resetNodeName();
      }
    } finally {
      resetNodeName = null;
      endEdit();
    }
  }

  function onInputKeydown(event: KeyboardEvent) {
    if (event.code === "Enter") {
      if (inputElement?.value) {
        submitChangeNodeName(inputElement?.value);
      } else {
        endEdit(true);
      }
    }
  }

  function handlePanelClose() {
    actions.showDetail(null);
  }

  function handlePanelReload() {
    if (showReload && handleReloadColumns) {
      handleReloadColumns();
    }
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="flex flex-row items-center px-3 py-2 bg-light-50">
  <div class="pr-1">
    <Icon icon={nodeIcon} size="20px" fill="none" />
  </div>
  <div class="w-full relative" style="max-width: calc(100% - 66px);">
    <div
      class="whitespace-nowrap overflow-hidden overflow-ellipsis"
      class:opacity-0={editing}
    >
      {nodeName}
    </div>
    {#if editing}
      <div class="input-container absolute top-0 bottom-0 left-0 right-0">
        <input
          bind:this={inputElement}
          value={nodeName}
          type="text"
          spellcheck="false"
          on:blur={() => endEdit(true)}
          on:keydown={onInputKeydown}
          class="w-full outline-none bg-transparent caret-primary-indigo-blue"
        />
      </div>
    {/if}
  </div>

  <div
    class="flex flex-row float-right w-full justify-end"
    style="max-width: 44px;"
  >
    <!-- {#if moreButtonOptions}
    <div
      class="pl-1 text-dark-100 cursor-pointer"
      use:contextMenuAction={moreButtonOptions}
    >
      <Icon icon="panel-more" size="20px" />
    </div>
  {/if} -->
    {#if showReload}
      <div
        class="pl-1 text-dark-100 cursor-pointer"
        on:click={handlePanelReload}
      >
        <Icon icon="panel-reload" size="20px" />
      </div>
    {/if}
    <div class="pl-1 text-dark-100 cursor-pointer" on:click={handlePanelClose}>
      <Icon icon="panel-close" size="20px" />
    </div>
  </div>
</div>
