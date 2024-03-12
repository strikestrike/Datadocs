<script lang="ts">
  import { setContext } from "svelte";
  import BorderItem from "./BorderItem.svelte";
  import PickColorButton from "../common/PickColorButton.svelte";
  import BorderStyle from "./BorderStyle/BorderStyle.svelte";
  import type { BorderValue } from "../default";
  import {
    BORDER_VALUES,
    CHILD_DROPDOWN_STATE_CHANGE,
    CHILD_DROPDOWN_CLASS_NAME,
  } from "../default";
  import { borderState } from "../../../../../app/store/writables";
  import { gridKeyControlAction } from "../../../../common/key-control/gridKeyControl";
  import type {
    GridKeyControlConfig,
    GridKeyControlActionOptions,
  } from "../../../../common/key-control/gridKeyControl";
  import { editCellsBorderStyle } from "../../../../../app/store/store-toolbar";

  const elementsPerRow = 5;
  let isKeyControlDisabled = false;
  let dropdownElement: HTMLElement;
  let isDisableScroll = false;
  let activeValue: BorderValue = null;
  const wheelEvent =
    "onwheel" in document.createElement("div") ? "wheel" : "mousewheel";
  const disabledMenuEvents = [
    wheelEvent,
    "touchmove",
    "mouseenter",
    "mouseleave",
    "mouseover",
  ];
  const configList: GridKeyControlConfig[][] = [];
  const options: GridKeyControlActionOptions = {
    configList: configList,
    disabled: isKeyControlDisabled,
  };
  let isProcessing = false;

  function onDisableMenuEvent(event: MouseEvent) {
    const childDropdown = dropdownElement.querySelector(
      `.${CHILD_DROPDOWN_CLASS_NAME}`
    );
    const target = event.target as HTMLElement;
    if (target && childDropdown.contains(target)) return;
    event.preventDefault();
    event.stopPropagation();
  }

  function disableMenu() {
    isKeyControlDisabled = true;
    if (isDisableScroll) return;
    isDisableScroll = true;
    disabledMenuEvents.forEach((eventName) => {
      dropdownElement.addEventListener(eventName, onDisableMenuEvent, true);
    });
  }

  function enableMenu() {
    isKeyControlDisabled = false;
    if (!isDisableScroll) return;
    isDisableScroll = false;
    disabledMenuEvents.forEach((eventName) => {
      dropdownElement.removeEventListener(eventName, onDisableMenuEvent, true);
    });
  }

  function handleChildDropdownChange() {
    if (!dropdownElement) return;
    const hasChildDropdown = dropdownElement.querySelector(
      `.${CHILD_DROPDOWN_CLASS_NAME}`
    );
    if (hasChildDropdown) disableMenu();
    else enableMenu();
  }

  async function handleSelectItem(value: BorderValue) {
    if (isProcessing) {
      return;
    }
    isProcessing = true;
    activeValue = value;
    await editCellsBorderStyle(value);
    isProcessing = false;
  }

  $: isKeyControlDisabled, (options.disabled = isKeyControlDisabled);
  setContext(CHILD_DROPDOWN_STATE_CHANGE, handleChildDropdownChange);
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  bind:this={dropdownElement}
  class="dropdown"
  class:disabled={isProcessing}
  use:gridKeyControlAction={options}
  tabindex={-1}
>
  <div class="borders-item-list" style="--elements-per-row: {elementsPerRow};">
    {#each BORDER_VALUES as value, index}
      {@const ridx = Math.floor(index / elementsPerRow)}
      {@const cidx = index % elementsPerRow}
      <BorderItem
        {value}
        {activeValue}
        {cidx}
        {ridx}
        gridKeyControlOptions={options}
        scrollContainer={dropdownElement}
        {handleSelectItem}
      />
    {/each}
  </div>

  <div class="grid grid-cols-2 gap-1 pt-3.5">
    <div class="pick-color h-8 w-full">
      <PickColorButton
        label="Border color"
        bind:color={$borderState.color}
        ridx={3}
        cidx={1}
        gridKeyControlOptions={options}
        scrollContainer={dropdownElement}
      />
    </div>
    <div class="h-8 w-full">
      <BorderStyle
        ridx={3}
        cidx={2}
        gridKeyControlOptions={options}
        scrollContainer={dropdownElement}
      />
    </div>
  </div>
</div>

<style lang="postcss">
  .dropdown {
    @apply relative bg-white rounded p-5 h-[inherit] outline-none overflow-x-hidden overflow-y-auto;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }

  .borders-item-list {
    @apply grid gap-x-5 gap-y-1.5;
    grid-template-columns: repeat(var(--elements-per-row), 32px);
  }

  .pick-color :global(.color-indicator) {
    @apply pl-1.5 text-11px font-medium capitalize;
  }

  .disabled :global(*) {
    @apply pointer-event-none;
  }
</style>
