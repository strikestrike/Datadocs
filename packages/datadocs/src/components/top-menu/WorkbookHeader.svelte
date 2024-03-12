<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import {
    setDocumentName,
  } from "../../app/store/store-toolbar";
  import { documentTitleStore } from "../../app/store/writables";
  import Icon from "../common/icons/Icon.svelte";

  export let isMobile = false;

  let inputElement: HTMLInputElement;
  let workbookHeaderElement: HTMLElement;
  let isInputFocus = false;
  let nameMaxWidth = 400;
  $: workbookName = $documentTitleStore;
  $: inputValue = workbookName;

  function handleInputFocus() {
    isInputFocus = true;
    inputElement.select();
  }

  function handleInputBlur() {
    isInputFocus = false;
  }

  function handleMouseDown(event: MouseEvent) {
    if (isInputFocus) {
      return;
    }

    event.preventDefault();
    inputElement.focus();
    window.addEventListener("mouseup", handleWindownMouseUp);
  }

  function handleWindownMouseUp(event: MouseEvent) {
    // prevent mouse up to deselect the selection in input
    event.preventDefault();
    window.removeEventListener("mouseup", handleWindownMouseUp);
  }

  let isChangingWorkbookName: boolean = false;
  async function handleNameChange() {
    if (isChangingWorkbookName) return;
    isChangingWorkbookName = true;
    if (!inputValue || !inputValue.trim()) {
      inputValue = get(documentTitleStore);
    }

    const success = await setDocumentName(inputValue);
    if (!success) inputValue = workbookName;
    inputElement.blur();
    isChangingWorkbookName = false;
  }

  function handleResetName() {
    inputValue = workbookName;
    inputElement.blur();
  }

  function handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case "Enter": {
        handleNameChange();
        break;
      }
      case "Escape": {
        handleResetName();
        break;
      }
      default: {
        break;
      }
    }
  }

  function handleWindowResize() {
    const filledSpace = isMobile ? 120 : 450;
    const containerWidth =
      workbookHeaderElement.parentElement.getBoundingClientRect().width;

    nameMaxWidth = containerWidth - filledSpace;
  }

  onMount(() => {
    handleWindowResize();
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  });
</script>

<div
  class="h-full justify-center flex flex-row items-center mx-2"
  bind:this={workbookHeaderElement}
>
  {#if !isMobile}
    <div class="mr-1">
      <Icon icon="workbook-header" width="14px" height="18px" />
    </div>
  {/if}

  <div class="wb-container" class:focus={isInputFocus}>
    <div
      class="wb-label"
      class:hide-label={isInputFocus}
      style="max-width: {nameMaxWidth}px"
    >
      <span>{inputValue}</span>
    </div>

    <div class="wb-input-container" class:hide-input={!isInputFocus}>
      <input
        bind:this={inputElement}
        bind:value={inputValue}
        type="text"
        spellcheck="false"
        on:focus={handleInputFocus}
        on:blur={handleInputBlur}
        on:change={handleNameChange}
        on:keydown={handleKeyDown}
        on:mousedown={handleMouseDown}
      />
    </div>
  </div>
</div>

<style lang="postcss">
  .wb-container {
    @apply text-13px text-white font-semibold rounded-sm;
    position: relative;
    height: 22px;
    box-sizing: border-box;
    color: #f1f1f1;
    border: 1px solid transparent;
  }

  .wb-container.focus {
    border-color: #f1f1f1;
  }

  .wb-label {
    @apply h-full px-1 whitespace-nowrap pointer-events-none;
    min-width: 20px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .wb-label span {
    @apply h-full;
    white-space: pre;
    line-height: 20px;
  }

  .hide-label {
    @apply opacity-0;
  }

  .wb-input-container {
    @apply absolute top-0 bottom-0 left-0 right-0;
  }

  .hide-input {
    @apply opacity-0;
  }

  .wb-input-container input {
    @apply w-full h-full px-1 text-13px text-white font-semibold text-left border-none outline-none;
    line-height: 20px;
    background-color: inherit;
    color: #f1f1f1;
  }
</style>
