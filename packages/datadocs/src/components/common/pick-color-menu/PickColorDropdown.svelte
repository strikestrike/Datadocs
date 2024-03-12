<script lang="ts">
  import { getContext, setContext, tick } from "svelte";
  import ColorPicker from "../../toolbars/MainToolbar/dropdowns/ColorPicker/ColorPicker.svelte";
  import ColorMenu from "../../toolbars/MainToolbar/dropdowns/ColorMenu/ColorMenu.svelte";
  import { getColorFromValue } from "../../../app/store/store-toolbar";
  import {
    SELECT_COLOR_CONTEXT_NAME,
    RESET_COLOR_CONTEXT_NAME,
    GET_CURRENT_ACTIVE_COLOR,
    OPEN_COLOR_PICKER_MENU,
    RETURN_TO_MAIN_MENU,
  } from "../../toolbars/MainToolbar/dropdowns/default";
  import {
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME,
    CLOSE_DROPDOWN_CONTEXT_NAME,
  } from "../dropdown";
  import { gridKeyControlAction } from "../key-control/gridKeyControl";
  import type {
    GridKeyControlConfig,
    GridKeyControlActionOptions,
  } from "../key-control/gridKeyControl";

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);
  const updateDropdownStyle: () => void = getContext(
    UPDATE_DROPDOWN_STYLE_CONTEXT_NAME
  );

  /**
   * a hex color or standard value in standard color list
   */
  export let hexOrStandardColor: string;
  export let selectColorCb = (color: string) => {};
  export let resetColorCb = () => {};
  export let cancelCb = () => {};
  let showColorPickerMenu = false;
  let element: HTMLElement = null;

  function handleSelectColor(value: string) {
    selectColorCb(value);
    closeDropdown();
  }

  function handleReset() {
    resetColorCb();
    closeDropdown();
  }

  function getCurrentActiveColor() {
    return hexOrStandardColor;
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
    cancelCb();
    closeDropdown();
  }

  function submitPickColor(color: string) {
    selectColorCb(color);
    closeDropdown();
  }

  setContext(SELECT_COLOR_CONTEXT_NAME, handleSelectColor);
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
</script>

<div
  class="dropdown relative bg-white rounded h-[inherit] border-none outline-none overflow-y-auto overflow-x-hidden"
  use:gridKeyControlAction={options}
  bind:this={element}
  tabindex={-1}
>
  {#if !showColorPickerMenu}
    <ColorMenu
      {startRowIndex}
      gridKeyControlOptions={options}
      scrollContainer={element}
      hasResetColor={false}
    />
  {:else}
    <ColorPicker
      {cancelPickColor}
      {submitPickColor}
      hexColor={getColorFromValue(hexOrStandardColor)}
      scrollContainer={element}
    />
  {/if}
</div>
