<script lang="ts">
  import type { GridSheet } from "../../../app/store/store-sheets";
  import Icon from "../../common/icons/Icon.svelte";
  import createGridTabContextMenuItems from "./createContextMenuItems";
  import type { ContextMenuOptionsType} from "../../common/context-menu";
import { contextMenuAction } from "../../common/context-menu";
  import type { TooltipOptions } from "../../common/tooltip/warningTooltipAction";
import tooltipAction from "../../common/tooltip/warningTooltipAction";
  import { isDraggingReorderTab, isTabNameUnique } from "../../common/tabs";
  import { getContext } from "svelte";
  import { PANEL_TAB_CONTEXT } from "../constants";

  export let tabs: GridSheet[];
  export let data: GridSheet;

  let inputElement: HTMLInputElement;
  let inputValue: string = data.name;
  let hideInput = false;
  let isInputFocus = false;
  let isNameValid = true;
  let errorMessage = "";
  let contextMenuOptions: ContextMenuOptionsType;
  const tabContext: any = getContext(PANEL_TAB_CONTEXT);

  function handleInputFocus() {
    isInputFocus = true;
  }

  function handleInputBlur() {
    handleNameChange();
    if (!isNameValid) {
      setTimeout(() => inputElement.focus());
      return;
    }
    isInputFocus = false;
  }

  function startEdit() {
    inputElement.focus();
    inputElement.setSelectionRange(0, inputElement.value.length);
  }

  function handleInputChange() {
    validateName(inputValue);
    closeTooltip();
  }

  function validateName(name: string) {
    let message = "";

    if (!name) {
      message = "Name cannot be empty.";
    } else if (!isTabNameUnique(tabs, inputValue, data.id)) {
      message = "Name already exist.";
    } else if (name.length > 80) {
      message = "Name cannot be greater than 80 characters.";
    }

    isNameValid = !message;
    errorMessage = message;
  }

  function handleNameChange() {
    validateName(inputValue);

    if (!isNameValid) {
      openToolip();
      return;
    }

    data.name = inputValue;
    tabContext.updateData(tabs);
  }

  function handleInputKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      inputElement.blur();
    } else if (event.key === "Escape") {
      event.preventDefault();
      resetRename();
      inputElement.blur();
    }
  }

  function resetRename() {
    inputValue = data.name; // reset name
    tabContext.updateData(tabs);
  }

  // context menu
  $: contextMenuOptions = {
    menuItems: createGridTabContextMenuItems({inputElement, tabs, id: data.id, tabContext}),
    closeFromOutside: () => {},
    disabled: false,
    menuClass: "tab-contextmenu",
  };

  function closeContextMenu() {
    contextMenuOptions.closeFromOutside();
  }

  // tooltip
  const tooltipOptions: TooltipOptions = {
    get content(): string {
      return errorMessage;
    },
    distance: 4,
    closeFromOutside: () => {},
    openFromOutside: () => {},
  };

  function closeTooltip() {
    tooltipOptions.closeFromOutside();
  }

  function openToolip() {
    tooltipOptions.openFromOutside();
  }

  /** In case of getting rename error, not allow to do other actions */
  const eventNames = ["mousedown", "mouseup", "click", "dblclick", "contextmenu"];
  function stopMouseEventOnRenameError(event: MouseEvent) {
    const target: HTMLElement = event.target as HTMLElement;
    if (target !== inputElement) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openToolip();
    }
  }
  $: if (!isNameValid) {
    eventNames.forEach((name) => {
      document.addEventListener(name, stopMouseEventOnRenameError, true);
    });
  } else {
    eventNames.forEach((name) => {
      document.removeEventListener(name, stopMouseEventOnRenameError, true);
    });
  }

  $: hideInput = !isInputFocus;
  $: isActive = data.isActive;
  $: if (isInputFocus) closeContextMenu();
  $: if (data) {
    // close all context menu/tooltip when data is changed
    closeContextMenu();
    closeTooltip();
  }
  $: if ($isDraggingReorderTab) closeContextMenu();
</script>

<div
  class="tab"
  class:active={isActive}
  use:contextMenuAction={contextMenuOptions}
>
  <div class="tab-content h-full flex flex-row items-center">
    <div class="ltr-icon">
      <Icon icon={data.icon} size="12px" fill="currentColor" />
    </div>

    <div class="whitespace-nowrap" style="direction: ltr;">
      <div
        class="label-container"
        class:editting-name={isInputFocus}
        class:invalid={!isNameValid}
        use:tooltipAction={tooltipOptions}
        on:dblclick={startEdit}
      >
        <div class="label" class:opacity-0={!hideInput}>
          <span>{inputValue}</span>
        </div>

        <div class="input-container" class:hide-input={hideInput}>
          <input
            bind:this={inputElement}
            bind:value={inputValue}
            tabindex={-1}
            type="text"
            spellcheck="false"
            on:focus={handleInputFocus}
            on:blur={handleInputBlur}
            on:input={handleInputChange}
            on:change={handleNameChange}
            on:keydown={handleInputKeyDown}
          />
        </div>
      </div>
    </div>

    <div class="rtl-icon">
      <Icon icon={data.icon} size="12px" fill="currentColor" />
    </div>
  </div>

  <div class="corner-container">
    <div class="left-corner">
      <svg width="4px" height="4px" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M 100 0 A 100 100, 0, 0, 1, 0 100 L 100 100 Z" fill="white" />
        <path d="M 100 0 A 100 100, 0, 0, 1, 0 100 L 100 100 Z" fill="currentColor" />
      </svg>
    </div>
    <div class="right-corner">
      <svg width="4px" height="4px" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" >
        <path d="M 100 0 A 100 100, 0, 0, 1, 0 100 L 100 100 Z" fill="white" transform="scale(-1,1) translate(-100,0)" />
        <path d="M 100 0 A 100 100, 0, 0, 1, 0 100 L 100 100 Z" fill="currentColor" transform="scale(-1,1) translate(-100,0)" />
      </svg>
    </div>
  </div>
</div>

<style lang="postcss">
  .tab {
    @apply relative mt-1 font-medium text-dark-50;
    height: 25px;
    font-size: 11px;
  }

  .tab.active {
    @apply mt-0 font-semibold text-primary-indigo-blue;
    height: 29px;
  }

  :global(.tab-source) .tab.active {
    color: rgb(80, 88, 93, 0.2);
  }

  .tab-content {
    @apply relative rounded-tl rounded-tr px-3 overflow-hidden;
    background-color: #f7f9fa;
    box-shadow: 0px 0px 4px rgba(55, 84, 170, 0.16);
    width: fit-content;
  }

  .tab-content::before {
    @apply absolute left-0 right-0 top-0 bottom-0 rounded-tl rounded-tr bg-white;
    z-index: -1;
    content: "";
  }

  .tab:not(.active):hover .tab-content {
    background-color: rgba(80, 88, 93, 0.12);
  }

  .tab.active .tab-content {
    @apply bg-white;
  }

  /* rounded corner */
  .tab .corner-container {
    color: #f7f9fa;
  }

  .tab:not(.active):hover .corner-container {
    color: rgba(80, 88, 93, 0.12);
  }

  .tab.active .corner-container {
    color: white;
  }

  .left-corner {
    @apply absolute w-1 h-1 bottom-0 -left-1 z-10;
  }

  .right-corner {
    @apply absolute w-1 h-1 bottom-0 -right-1 z-10;
  }

  .left-corner svg {
    filter: drop-shadow(-0.4px -0.4px 0.2px rgb(55 84 170 / 2%));
  }

  .right-corner svg {
    filter: drop-shadow(0.6px -0.4px 0.2px rgb(55 84 170 / 2%));
  }

  /* show icon depend on relative position with active tab */
  .rtl-icon {
    @apply hidden;
  }

  :global(.tab-container.active) ~ :global(.tab-container:not(.active)) .ltr-icon {
    @apply hidden;
  }

  :global(.tab-container.active) ~ :global(.tab-container:not(.active)) .rtl-icon {
    @apply block;
  }

  /* input container style */
  .label-container {
    @apply relative;
    min-width: 8px;
    height: 21px;
  }

  .label {
    @apply px-1 py-0.5 overflow-hidden overflow-ellipsis;
    max-width: 200px;
    white-space: pre;
  }

  .input-container {
    @apply absolute rounded top-0 bottom-0 left-0 right-0 z-10 border-2 border-primary-indigo-blue border-solid pointer-events-auto;
  }

  .hide-input.input-container {
    @apply opacity-0 cursor-pointer pointer-events-none;
    z-index: -1;
  }

  .invalid .input-container {
    @apply border-tertiary-error;
  }

  input {
    @apply w-full h-full px-0.5 text-left font-semibold border-none outline-none select-text;
  }

  .input-container:not(.hide-input) input {
    @apply text-dark-300;
  } .label-container {
    @apply relative;
  }

  .input-container {
    @apply absolute rounded top-0 bottom-0 left-0 right-0 z-10 border-2 border-primary-indigo-blue border-solid pointer-events-auto;
  }

  .hide-input.input-container {
    @apply opacity-0 cursor-pointer pointer-events-none;
    z-index: -1;
  }

  .invalid .input-container {
    @apply border-tertiary-error;
  }

  input {
    @apply w-full h-full px-0.5 text-left font-semibold border-none outline-none select-text;
  }

  .input-container:not(.hide-input) input {
    @apply text-dark-300;
  }
</style>
