<script lang="ts">
  import { getContext, tick } from "svelte";
  import Icon from "../../../../../common/icons/Icon.svelte";
  import { DropdownWrapper } from "../../../../../common/dropdown";
  import Dropdown from "./Dropdown.svelte";
  import {
    CHILD_DROPDOWN_STATE_CHANGE,
    CHILD_DROPDOWN_CLASS_NAME,
  } from "../../default";
  import type {
    GridKeyControlActionOptions,
    RegisterElementOptions,
  } from "../../../../../common/key-control/gridKeyControl";
  import { registerElement } from "../../../../../common/key-control/gridKeyControl";
  import { scrollVerticalToVisible } from "../../../../../common/key-control/scrolling";

  export let ridx: number;
  export let cidx: number;
  export let gridKeyControlOptions: GridKeyControlActionOptions;
  export let scrollContainer: HTMLElement;

  const handleChildDropdownChange: () => void = getContext(
    CHILD_DROPDOWN_STATE_CHANGE
  );
  let buttonElement: HTMLButtonElement;
  let show = false;
  let isSelected = false;

  function toggleOpenDropdown() {
    show = !show;
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

  $: show, handleDropdownStateChange();
</script>

<DropdownWrapper bind:show>
  <button
    slot="button"
    bind:this={buttonElement}
    class="w-full h-8 p-1 flex flex-row rounded border border-solid border-light-100 outline-none"
    class:selected={show || isSelected}
    on:click={toggleOpenDropdown}
    use:registerElement={options}
    tabindex={-1}
  >
    <div
      class="flex-grow flex-shrink h-full flex flex-row items-center text-center pl-1.5 text-11px font-medium capitalize rounded-sm"
    >
      Border Style
    </div>
    <div class="h-full w-6 pl-2.5 flex flex-row items-center text-dark-50">
      <Icon icon="toolbar-arrow-dropdown" width="8px" />
    </div>
  </button>

  <div slot="content" class="dropdown {CHILD_DROPDOWN_CLASS_NAME}">
    <Dropdown />
  </div>
</DropdownWrapper>

<style lang="postcss">
  button.selected {
    box-shadow: 0px 4px 6px rgba(55, 84, 170, 0.16);
  }
</style>
