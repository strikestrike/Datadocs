<script lang="ts">
  import { getContext, tick } from "svelte";
  import Icon from "../../../../common/icons/Icon.svelte";
  import PickColorMenu from "../../../../common/pick-color-menu/PickColorDropdown.svelte";
  import { DropdownWrapper } from "../../../../common/dropdown";
  import { getColorFromValue } from "../../../../../app/store/store-toolbar";
  import {
    CHILD_DROPDOWN_STATE_CHANGE,
    CHILD_DROPDOWN_CLASS_NAME,
  } from "../default";
  import type {
    GridKeyControlActionOptions,
    RegisterElementOptions,
  } from "../../../../common/key-control/gridKeyControl";
  import { registerElement } from "../../../../common/key-control/gridKeyControl";
  import { scrollVerticalToVisible } from "../../../../common/key-control/scrolling";

  /**
   * color can be hex color or a value in standard list
   */
  export let color: string;
  export let label = "";
  export let ridx: number;
  export let cidx: number;
  export let gridKeyControlOptions: GridKeyControlActionOptions;
  export let scrollContainer: HTMLElement;

  let isSelected = false;
  let buttonElement: HTMLButtonElement;
  let show = false;
  const handleChildDropdownChange: () => void = getContext(
    CHILD_DROPDOWN_STATE_CHANGE
  );

  function handleButtonClick() {
    show = !show;
  }

  function changeColor(value: string) {
    color = value;
  }

  async function onSelectCallback(byKey = true) {
    isSelected = true;
    if (buttonElement) buttonElement.focus();
    if (!byKey) return;
    await tick();
    scrollVerticalToVisible(scrollContainer, buttonElement);
  }

  function onDeselectCallback() {
    isSelected = false;
    if (buttonElement && document.activeElement === buttonElement)
      buttonElement.blur();
  }

  async function handleDropdownStateChange() {
    await tick();
    if (typeof handleChildDropdownChange === "function") {
      handleChildDropdownChange();
    }
    // refocus button element after close dropdown
    if (!show && isSelected && buttonElement) buttonElement.focus();
  }

  const options: RegisterElementOptions = {
    gridKeyControlOptions,
    ridx,
    cidx,
    config: {
      ridx,
      cidx,
      isSelected,
      onDeselectCallback,
      onSelectCallback,
    },
  };

  $: showColor = getColorFromValue(color);
  $: show, handleDropdownStateChange();
</script>

<DropdownWrapper bind:show>
  <button
    slot="button"
    bind:this={buttonElement}
    class="dropdown-button w-full h-8 p-1 flex flex-row rounded border border-solid border-light-100 outline-none"
    class:selected={isSelected || show}
    on:click={handleButtonClick}
    use:registerElement={options}
  >
    <div
      class="color-indicator flex-grow flex-shrink h-full pl-2.5 flex flex-row items-center text-center text-10px font-semibold rounded-sm uppercase"
      style="background-color: {showColor};"
    >
      {label}
    </div>
    <div class="h-full w-6 pl-2.5 flex flex-row items-center text-dark-50">
      <Icon icon="toolbar-arrow-dropdown" width="8px" />
    </div>
  </button>

  <div slot="content" class="dropdown {CHILD_DROPDOWN_CLASS_NAME}">
    <PickColorMenu hexOrStandardColor={color} selectColorCb={changeColor} />
  </div>
</DropdownWrapper>

<style lang="postcss">
  .dropdown {
    @apply relative bg-white rounded h-[inherit] border-none outline-none overflow-y-auto overflow-x-hidden;
    box-shadow: 0px 4px 6px rgba(55, 84, 170, 0.16);
  }

  button.selected {
    box-shadow: 0px 4px 6px rgba(55, 84, 170, 0.16);
  }
</style>
