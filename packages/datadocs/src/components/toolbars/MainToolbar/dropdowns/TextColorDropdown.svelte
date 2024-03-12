<script lang="ts">
  import { getContext, onDestroy, setContext, tick } from "svelte";
  import ColorPicker from "./ColorPicker/ColorPicker.svelte";
  import ColorMenu from "./ColorMenu/ColorMenu.svelte";
  import {
    SELECT_COLOR_CONTEXT_NAME,
    RESET_COLOR_CONTEXT_NAME,
    GET_CURRENT_ACTIVE_COLOR,
    OPEN_COLOR_PICKER_MENU,
    RETURN_TO_MAIN_MENU,
    HOVER_ON_COLOR_CONTEXT_NAME,
  } from "./default";
  import {
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME,
    CLOSE_DROPDOWN_CONTEXT_NAME,
  } from "../../../common/dropdown";
  import {
    changeTextColorValue,
    resetTextColorValue,
    getTextColorValue,
    getColorFromValue,
    previewTextColor,
  } from "../../../../app/store/store-toolbar";
  import { gridKeyControlAction } from "../../../common/key-control/gridKeyControl";
  import type {
    GridKeyControlConfig,
    GridKeyControlActionOptions,
  } from "../../../common/key-control/gridKeyControl";

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);
  const updateDropdownStyle: () => void = getContext(
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME
  );

  let showColorPickerMenu = false;
  const hexColor = getCurrentActiveColor();
  let element: HTMLElement = null;
  let isProcessing = false;

  function hoverOnColor(value: string) {
    previewTextColor(value);
  }

  function getCurrentActiveColor() {
    return getTextColorValue();
  }

  async function openColorPickerMenu() {
    showColorPickerMenu = true;
    await tick();
    updateDropdownStyle();
  }

  async function returnToMainMenu() {
    showColorPickerMenu = false;
    await tick();
    updateDropdownStyle();
  }

  function cancelPickColor() {
    closeDropdown();
  }

  async function submitPickColor(color: string) {
    if (isProcessing) return;
    isProcessing = true;
    await changeTextColorValue(color);
    closeDropdown();
    isProcessing = false;
  }

  async function handleReset() {
    if (isProcessing) return;
    isProcessing = true;
    await resetTextColorValue();
    closeDropdown();
    isProcessing = false;
  }

  setContext(SELECT_COLOR_CONTEXT_NAME, submitPickColor);
  setContext(HOVER_ON_COLOR_CONTEXT_NAME, hoverOnColor);
  setContext(RESET_COLOR_CONTEXT_NAME, handleReset);
  setContext(GET_CURRENT_ACTIVE_COLOR, getCurrentActiveColor);
  setContext(OPEN_COLOR_PICKER_MENU, openColorPickerMenu);
  setContext(RETURN_TO_MAIN_MENU, returnToMainMenu);

  // key control
  const startRowIndex = 0;
  const configList: GridKeyControlConfig[][] = [];
  const options: GridKeyControlActionOptions = {
    configList: configList,
  };

  $: if (element) {
    setTimeout(() => element.focus());
  }

  onDestroy(() => {
    previewTextColor();
  });
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  class="dropdown relative bg-white rounded h-[inherit] border-none outline-none overflow-y-auto overflow-x-hidden"
  class:disabled={isProcessing}
  use:gridKeyControlAction={options}
  bind:this={element}
  tabindex={-1}
>
  {#if !showColorPickerMenu}
    <ColorMenu
      {startRowIndex}
      gridKeyControlOptions={options}
      scrollContainer={element}
    />
  {:else}
    <ColorPicker
      {cancelPickColor}
      {submitPickColor}
      hexColor={getColorFromValue(hexColor)}
      scrollContainer={element}
    />
  {/if}
</div>

<style lang="postcss">
  .dropdown {
    @apply min-w-0;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }

  .disabled :global(*) {
    @apply pointer-event-none;
  }
</style>
