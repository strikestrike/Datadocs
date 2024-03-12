<script lang="ts">
  import Icon from "../../../common/icons/Icon.svelte";
  import ColorIndicatorIcon from "./ColorIndicatorIcon.svelte";
  import tooltipAction from "../../../common/tooltip/index";
  import { DropdownWrapper } from "../../../common/dropdown";
  import type { SvelteComponent } from "svelte";
  import { createEventDispatcher } from "svelte";
  import UnimplementedDropdown from "../dropdowns/UnimplementedDropdown/UnimplementedDropdown.svelte";
  import { openStyleProTipMenu } from "../dropdowns/ApplyStyleProTip";

  export let icon: string;
  export let iconSize = "20px";
  export let tooltip = "";
  export let dropdownComponent: typeof SvelteComponent = UnimplementedDropdown;
  export let dropdownProps = {};
  export let indicatorColor = "";
  export let disabled = false;
  export let showApplyStyleProTip = false;

  const dispatch = createEventDispatcher();
  let showDropdown = false;
  let isIconButtonTooltipDisabled = false;
  let isArrowDropdownTooltipDisabled = false;
  let customTriggerElement: HTMLElement = null;

  function toggleDrodownOpen() {
    showDropdown = !showDropdown && !disabled;
  }

  function onMouseOverIconButton() {
    dispatch("mouseOverIconButton");
    if (showApplyStyleProTip) {
      openStyleProTipMenu(customTriggerElement?.getBoundingClientRect());
    }
  }

  function onMouseOverArrowButton() {
    if (showApplyStyleProTip) {
      openStyleProTipMenu(customTriggerElement?.getBoundingClientRect());
    }
  }

  function onMouseLeaveIconButton() {
    dispatch("mouseLeaveIconButton");
  }

  $: isIconButtonTooltipDisabled = showApplyStyleProTip || showDropdown;
  $: isArrowDropdownTooltipDisabled = showApplyStyleProTip || showDropdown;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="split-button text-dark-300 flex flex-row items-center h-6 w-[35px] mx-1px rounded-sm cursor-pointer"
  class:active={showDropdown}
  class:disabled
  bind:this={customTriggerElement}
>
  <div
    class="icon-button h-6 w-6 flex flex-row items-center justify-center"
    use:tooltipAction={{
      content: tooltip,
      disabled: isIconButtonTooltipDisabled,
    }}
    on:click
    on:mouseover={onMouseOverIconButton}
    on:mouseleave={onMouseLeaveIconButton}
  >
    {#if !indicatorColor}
      <Icon
        {icon}
        size={iconSize}
        fill="currentColor"
        data-grideditorcompanion="true"
      />
    {:else}
      <ColorIndicatorIcon
        {icon}
        size={iconSize}
        isActive={showDropdown}
        {indicatorColor}
      />
    {/if}
  </div>

  <DropdownWrapper bind:show={showDropdown} {customTriggerElement}>
    <div
      class="arrow-dropdown h-6 w-[11px] flex flex-row items-center justify-center"
      use:tooltipAction={{
        content: tooltip,
        disabled: isArrowDropdownTooltipDisabled,
      }}
      on:mousedown={toggleDrodownOpen}
      on:mouseover={onMouseOverArrowButton}
      slot="button"
      data-grideditorcompanion="true"
    >
      <Icon
        icon="toolbar-arrow-dropdown"
        width="7px"
        height="4px"
        fill="currentColor"
        data-grideditorcompanion="true"
      />
    </div>

    <svelte:component
      this={dropdownComponent}
      {...dropdownProps}
      slot="content"
    />
  </DropdownWrapper>
</div>

<style lang="postcss">
  .icon-button {
    @apply rounded-tl-sm rounded-bl-sm border-transparent;
    border: 1px solid transparent;
  }

  .arrow-dropdown {
    @apply rounded-tr-sm rounded-br-sm border-transparent;
    border: 1px solid transparent;
  }

  .split-button:not(.active):hover .icon-button,
  .split-button:not(.active):hover .arrow-dropdown {
    @apply border-light-100;
  }

  .split-button:not(.active):hover .icon-button:hover,
  .split-button:not(.active):hover .arrow-dropdown:hover {
    @apply bg-light-100;
  }

  .split-button.active .icon-button {
    @apply bg-primary-datadocs-blue bg-opacity-10;
  }

  .split-button.active .arrow-dropdown {
    @apply bg-primary-datadocs-blue bg-opacity-20;
  }

  .split-button.active .icon-button,
  .split-button.active .arrow-dropdown {
    @apply !text-primary-datadocs-blue;
  }

  .split-button.disabled * {
    @apply !bg-transparent !text-dark-50 !border-transparent;
  }
</style>
