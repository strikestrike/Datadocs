<script lang="ts">
  import Icon from "../../../common/icons/Icon.svelte";
  import tooltipAction from "../../../common/tooltip/index";
  import { DropdownWrapper } from "../../../common/dropdown";
  import type { SvelteComponent } from "svelte";
  import { openStyleProTipMenu } from "../dropdowns/ApplyStyleProTip";

  export let value: string;
  export let isDropdownChild = false;
  export let changeValue: (value: any, reset?: boolean) => void;
  export let inputWidth = 36;
  export let tooltip = "";
  export let disabledTooltipOnActive = true;
  export let dropdownComponent: typeof SvelteComponent = null;
  export let showApplyStyleProTip = false;

  let inputElement: HTMLInputElement;
  let buttonElement: HTMLElement;
  let previousInputFocus = false;
  let active = false;
  let onHover = false;

  $: isTooltipDisabled =
    showApplyStyleProTip || !onHover || (active && disabledTooltipOnActive);

  function toggleActive(value?: boolean) {
    if (!isDropdownChild) {
      return;
    }

    if (typeof value === "boolean") {
      active = value;
    } else {
      active = !active;
    }
  }

  function handleMouseDown(event: Event) {
    if (event.target === inputElement) {
      toggleActive(true);
    } else {
      toggleActive();
    }
  }

  function focus() {
    if (!inputElement) {
      return;
    }

    if (!previousInputFocus) {
      previousInputFocus = true;
    }
  }

  function blur() {
    if (!inputElement) {
      return;
    }

    previousInputFocus = false;
    inputElement.blur();
  }

  function handleInputBlur(event: Event) {
    if (active) {
      inputElement.focus();
    } else {
      resetInputValue();
    }
  }

  function resetInputValue() {
    changeValue("__invalid_value__", true);
  }

  function changeInputValue() {
    changeValue(value);
    toggleActive(false);
  }

  function handleInputKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case "Enter": {
        changeInputValue();
        break;
      }
      case "ArrowUp":
      case "ArrowDown": {
        event.preventDefault();
        break;
      }
      default: {
        break;
      }
    }
  }

  function handleMouseOver() {
    onHover = true;

    if (showApplyStyleProTip) {
      openStyleProTipMenu(buttonElement?.getBoundingClientRect());
    }
  }

  function handleMouseLeave() {
    onHover = false;
  }

  function updateInputValue(v: string) {
    value = v;
  }

  $: if (active) {
    focus();
  } else {
    blur();
  }
</script>

<DropdownWrapper bind:show={active}>
  <div
    bind:this={buttonElement}
    class="toolbar-input hover:bg-light-100"
    class:active
    use:tooltipAction={{
      content: tooltip,
      disabled: isTooltipDisabled,
    }}
    on:mousedown={handleMouseDown}
    on:mouseover={handleMouseOver}
    on:mouseleave={handleMouseLeave}
    on:focus
    slot="button"
    data-grideditorcompanion="true"
  >
    <div class="inline-block h-5">
      <input
        bind:this={inputElement}
        on:blur={handleInputBlur}
        on:keydown={handleInputKeyDown}
        bind:value
        data-grideditorcompanion="true"
        type="text"
        class="inline-block w-9 h-5 p-0 m-0 border-none outline-none text-center font-medium text-13px"
        style="width: {inputWidth}px;"
      />
    </div>

    <div class="ml-2 pointer-events-none">
      <Icon
        icon="toolbar-arrow-dropdown"
        width="7px"
        height="4px"
        fill="currentColor"
      />
    </div>
  </div>

  <svelte:component
    this={dropdownComponent}
    {updateInputValue}
    slot="content"
  />
</DropdownWrapper>

<style lang="postcss">
  input {
    background-color: inherit;
  }

  .toolbar-input {
    @apply text-toolbar-button-normal-color;
  }

  .toolbar-input.active {
    @apply text-toolbar-button-active-color;
    background-color: rgba(59, 199, 255, 0.1) !important;
  }

  .toolbar-input {
    @apply flex items-center pl-2 pr-[3px] py-0.5 rounded-sm cursor-pointer;
    margin: 0px 1px;
  }
</style>
