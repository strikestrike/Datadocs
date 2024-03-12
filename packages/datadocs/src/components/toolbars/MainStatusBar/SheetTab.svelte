<script lang="ts">
  import Icon from "../../common/icons/Icon.svelte";
  import {
    getSheetsData,
    isDraggingToReorderSheet,
    getWorkbookSheetIcon,
  } from "../../../app/store/store-worksheets";
  import type { WorkbookSheet } from "../../../app/store/types";
  import {
    changeSheetName,
    switchSheet,
    duplicateSheet,
    deleteSheet,
    CONTEXT_MENU_CLASSNAME,
  } from "./utils";
  import type {
    ContextMenuOptionsType} from "../../common/context-menu";
import {
  contextMenuAction
} from "../../common/context-menu";
  import type {
    MenuItemType,
    MenuElementType} from "../../common/menu";
import {
  MENU_DATA_ITEM_TYPE_ELEMENT,
  MENU_DATA_ITEM_STATE_ENABLED,
  MENU_DATA_ITEM_STATE_DISABLED,
} from "../../common/menu";
  import { tick } from "svelte";
  import type { ModalConfigType} from "../../common/modal";
import { openModal, bind } from "../../common/modal";
  import DeleteConfirmationModal from "../../top-menu/components/modals/DeleteConfirmationModal.svelte";
  import type {
    TooltipOptions,
  } from "../../common/tooltip/warningTooltipAction";
import tooltipAction from "../../common/tooltip/warningTooltipAction";
  import checkMobileDevice from "../../common/is-mobile";

  export let data: WorkbookSheet;
  export let scrollActiveSheetIntoview: () => void;

  let isInputFocus = false;
  let inputElement: HTMLInputElement;
  let inputValue: string = data.name;
  let isNameValid = true;
  let errorMessage = "";
  let existedNames: string[] = [];

  $: if (data) {
    handlePropsChange();
  }
  $: inputValue, handleInputChange();

  function handlePropsChange() {
    inputValue = data.name;
    existedNames = getSheetsData()
      .filter((d) => d.id !== data.id)
      .map((d) => d.name);
  }

  function handleInputChange() {
    validateName(inputValue);
    closeTooltip();
  }

  function validateName(name: string) {
    let message = "";

    if (!name) {
      message = "Name cannot be empty.";
    } else if (existedNames.indexOf(name) !== -1) {
      message = "Name already exist.";
    } else if (name.length > 80) {
      message = "Name cannot be greater than 80 characters.";
    }

    isNameValid = !message;
    errorMessage = message;
  }

  async function handleLabelChange() {
    closeContextMenu();
    validateName(inputValue);

    if (!isNameValid) {
      openToolip();
      return;
    }

    if (data.name !== inputValue) {
      errorMessage = await changeSheetName(data.id, inputValue);
      isNameValid = !errorMessage;
      if (!isNameValid) {
        openToolip();
        return;
      } else {
        closeTooltip();
      }
    }

    await tick();
    scrollActiveSheetIntoview();
  }

  function handleResetLabel() {
    inputValue = data.name;
  }

  function handleInputKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      inputElement.blur();
    } else if (event.key === "Escape") {
      handleResetLabel();
      inputElement.blur();
    }
  }

  function handleInputBlur() {
    handleLabelChange();

    if (!isNameValid) {
      setTimeout(() => {
        inputElement.focus();
      });
      return;
    }

    isInputFocus = false;
  }

  function handleInputFocus() {
    isInputFocus = true;
  }

  function handleDbclick() {
    if (!isNameValid || isInputFocus) {
      return;
    }

    inputElement.focus();
    if (!checkMobileDevice()) {
      inputElement.setSelectionRange(0, inputValue.length);
    } else {
      inputElement.selectionStart = inputElement.selectionEnd;
    }
  }

  async function handleTabSwitch() {
    if (!isNameValid || isInputFocus) {
      return;
    }

    switchSheet(data.id);
    await tick();
    scrollActiveSheetIntoview();
  }

  function renameSheet() {
    setTimeout(() => {
      inputElement.focus();
      inputElement.setSelectionRange(0, inputValue.length);
    });
  }

  function isSheetDeletable(): boolean {
    const sheetLength = getSheetsData().length;
    return sheetLength > 1;
  }

  // rename sheet
  const RENAME_SHEET: MenuElementType = {
    type: MENU_DATA_ITEM_TYPE_ELEMENT,
    label: "Rename",
    state: MENU_DATA_ITEM_STATE_ENABLED,
    action: renameSheet,
  };

  // Duplicate sheet
  const DUPLICATE_SHEET: MenuElementType = {
    type: MENU_DATA_ITEM_TYPE_ELEMENT,
    label: "Duplicate",
    state: MENU_DATA_ITEM_STATE_ENABLED,
    action: async () => {
      await duplicateSheet(data);
      await tick();
      scrollActiveSheetIntoview();
    },
  };

  // delete sheet
  function handleDeleteSheet() {
    const isMovable = false;
    const isResizable = false;
    const props = {
      mainMessage: `Are you sure you want to delete “${data.name}” ?`,
      sideMessages: [
        "Please be 100% sure about your decision as you will no longer be",
        "able to recover this sheet after deleting it.",
      ],
      title: `Delete “${data.name}”`,
      executeOnYes: async () => {
        await deleteSheet(data);
        await tick();
        scrollActiveSheetIntoview();
      },
      isMovable: isMovable,
    };

    const modalElement = bind(DeleteConfirmationModal, props);
    const config: ModalConfigType = {
      component: modalElement,
      isMovable: isMovable,
      isResizable: isResizable,
      minWidth: 400,
      minHeight: 300,
      preferredWidth: 500,
    };

    openModal(config);
  }

  const DELETE_SHEET: MenuElementType = {
    type: MENU_DATA_ITEM_TYPE_ELEMENT,
    get label(): string {
      return `<div style="width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">Delete "${data.name}"</div>`;
    },
    status: "warning",
    get state() {
      return isSheetDeletable()
        ? MENU_DATA_ITEM_STATE_ENABLED
        : MENU_DATA_ITEM_STATE_DISABLED;
    },
    action: handleDeleteSheet,
  };

  const sheetMenuItems: MenuItemType[] = [
    RENAME_SHEET,
    DUPLICATE_SHEET,
    DELETE_SHEET,
  ];

  const contextMenuOptions: ContextMenuOptionsType = {
    menuItems: sheetMenuItems,
    closeFromOutside: () => {},
    disabled: false,
    menuClass: CONTEXT_MENU_CLASSNAME,
    preferPosition: "top",
  };

  function closeContextMenu() {
    contextMenuOptions.closeFromOutside();
  }

  $: if ($isDraggingToReorderSheet) closeContextMenu();
  $: contextMenuOptions.disabled = isInputFocus || !isNameValid;

  // tooltip
  const tooltipOptions: TooltipOptions = {
    get content(): string {
      return errorMessage;
    },
    position: "top",
    distance: 6,
    closeFromOutside: () => {},
    openFromOutside: () => {},
    parentSelector: ".left-status-bar .bar-tabs",
  };

  function closeTooltip() {
    tooltipOptions.closeFromOutside();
  }

  function openToolip() {
    closeContextMenu();
    tooltipOptions.openFromOutside();
  }

  function stopEventOnRenameError(event: MouseEvent) {
    const navigationButtonClass = "sheets-navigation-button";
    const target: HTMLElement = event.target as HTMLElement;

    if (target.classList.contains(navigationButtonClass)) {
      // allow navigation working while there's rename error
      return;
    }

    if (target !== inputElement) {
      event.stopImmediatePropagation();
      event.stopPropagation();
      event.preventDefault();
      openToolip();
    }
  }

  function stopEventAfterNavigationButton(event: MouseEvent) {
    const target: HTMLElement = event.target as HTMLElement;
    if (target !== inputElement) {
      event.preventDefault();
      handleLabelChange();
    }
  }

  const eventNames = [
    "mousedown",
    "mouseup",
    "click",
    "dblclick",
    "contextmenu",
  ]; // in case name is invalid, need to disable these event
  $: if (!isNameValid) {
    eventNames.forEach((name) => {
      document.addEventListener(name, stopEventOnRenameError, true);
      document.addEventListener(name, stopEventAfterNavigationButton);
    });
  } else {
    eventNames.forEach((name) => {
      document.removeEventListener(name, stopEventOnRenameError, true);
      document.removeEventListener(name, stopEventAfterNavigationButton);
    });
  }
</script>

<div
  class="sheet-tab h-full flex flex-row items-center flex-nowrap px-3.5 cursor-pointer"
  class:active={data.isActive}
  on:mousedown|capture={handleTabSwitch}
  use:contextMenuAction={contextMenuOptions}
>
  {#if data.type}
    <div>
      <Icon
        icon={getWorkbookSheetIcon(data.type)}
        size="12px"
        fill="currentColor"
      />
    </div>
  {/if}

  <div
    class="label-container"
    class:focus={isInputFocus}
    class:name-invalid={!isNameValid}
    on:dblclick={handleDbclick}
    use:tooltipAction={tooltipOptions}
  >
    <div class="label" class:hide-label={isInputFocus || !isNameValid}>
      <span>{inputValue}</span>
    </div>

    <div
      class="input-container"
      class:hide-input={!isInputFocus && isNameValid}
    >
      <input
        bind:this={inputElement}
        bind:value={inputValue}
        class={!isInputFocus && isNameValid
          ? "cursor-pointer pointer-events-none"
          : ""}
        tabindex={-1}
        type="text"
        spellcheck="false"
        on:focus={handleInputFocus}
        on:blur={handleInputBlur}
        on:change={handleLabelChange}
        on:keydown={handleInputKeyDown}
      />
    </div>
  </div>
</div>

<style lang="postcss">
  .sheet-tab {
    @apply text-tabs-normal-color;
  }

  .sheet-tab.active {
    @apply text-tabs-active-color;
  }

  :global(.statusbar-tab-source) .sheet-tab {
    color: rgb(80, 88, 93, 0.2);
  }

  .label-container {
    @apply rounded box-border flex flex-row items-center;
    position: relative;
    height: 24px;
    font-size: 13px;
    font-weight: 500;
    border: 2px solid transparent;
  }

  .label-container.focus:not(.name-invalid) {
    @apply border-tabs-active-color;
  }

  .label-container.name-invalid {
    border-color: #ea4821;
  }

  .label {
    @apply h-full px-0.5 whitespace-nowrap pointer-events-none;
    line-height: 20px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .label span {
    @apply h-full;
    white-space: pre;
    line-height: 20px;
    font-size: 13px;
  }

  .hide-label {
    @apply opacity-0;
  }

  .input-container {
    @apply absolute rounded top-0 bottom-0 left-0 right-0 z-10;
  }

  .hide-input {
    @apply opacity-0;
    z-index: -1;
  }

  .input-container input {
    @apply w-full h-full px-0.5 text-left border-none outline-none;
    line-height: 20px;
    background-color: inherit;
    font-size: 13px;
    font-weight: 500;
    /* color: #a7b0b5; */
  }

  .input-container:not(.hide-input) input {
    color: #454450;
  }
</style>
