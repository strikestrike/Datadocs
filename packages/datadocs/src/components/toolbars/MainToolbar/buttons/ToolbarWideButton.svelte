<script lang="ts">
  import Icon from "../../../common/icons/Icon.svelte";
  import tooltipAction from "../../../common/tooltip/index";
  import {
    CLOSE_DROPDOWN_CONTEXT_NAME,
    DropdownWrapper,
  } from "../../../common/dropdown";
  import { setContext, type SvelteComponent } from "svelte";

  setContext(CLOSE_DROPDOWN_CONTEXT_NAME, closeDropdown);

  export let active = false;
  export let icon: string;
  export let tooltip = "";
  export let disabledTooltipOnActive = false;
  export let dropdownComponent: typeof SvelteComponent = null;
  export let dropdownProps = {};
  export let disabled = false;
  /**
   * The number to display in a badge at the end of the button.
   */
  export let counter: number = 0;
  /**
   * Always display the counter even if it is "0".
   */
  export let alwaysShowCounter = false;

  let element: HTMLElement;
  let onFocus = false;
  let onHover = false;
  let isMouseDown = false;

  $: hasIcon = !!icon;
  $: activeStyle = active || onFocus;
  $: showCounter = alwaysShowCounter || counter > 0;
  $: isTooltipDisabled = !onHover || (activeStyle && disabledTooltipOnActive);
  $: withText = !!$$slots.default;

  function toggleDropdownOpen() {
    active = !active;
  }

  function closeDropdown() {
    active = false;
  }

  function handleClick() {
    if (disabled) return;

    isMouseDown = true;
    onFocus = true;

    // in case button control a dropdown
    toggleDropdownOpen();
  }

  function handleMouseEnter() {
    if (isMouseDown) onFocus = true;
  }

  function handleMouseOver() {
    onHover = true;
  }

  function handleMouseLeave() {
    onHover = false;
    if (isMouseDown) onFocus = false;
  }

  function handleMouseUp() {
    if (!isMouseDown) return;
    isMouseDown = false;
    onFocus = false;
  }
</script>

<svelte:document on:mouseup={handleMouseUp} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<DropdownWrapper bind:show={active} {...$$restProps}>
  <div
    bind:this={element}
    class="toolbar-button {hasIcon ? 'p-0.5' : 'py-0.5 pl-2 pr-[3px]'}"
    class:active={activeStyle}
    class:bg-light-100={onHover}
    class:with-badge={showCounter}
    class:with-text={withText}
    class:disabled
    use:tooltipAction={{
      content: tooltip,
      disabled: isTooltipDisabled,
    }}
    on:mouseenter={handleMouseEnter}
    on:mouseover={handleMouseOver}
    on:mouseleave={handleMouseLeave}
    on:click={handleClick}
    on:focus
    slot="button"
    data-grideditorcompanion="true"
  >
    <Icon {icon} size="18px" />
    <slot />

    {#if showCounter}
      <span class="badge">{counter}</span>
    {/if}
  </div>

  <svelte:component
    this={dropdownComponent}
    {...dropdownProps}
    slot="content"
  />
</DropdownWrapper>

<style lang="postcss">
  .toolbar-button {
    @apply flex flex-row items-center justify-center rounded font-medium cursor-pointer text-13px text-toolbar-button-normal-color py-1 px-1;
    column-gap: 4px;

    &.with-text {
      @apply pr-2.5;
    }

    .badge {
      @apply text-10px font-medium text-white bg-primary-indigo-blue ml-0.5 rounded-[50%] min-w-1.5em min-h-1.5em text-center;
    }
  }

  .toolbar-button.with-badge {
    @apply pr-1;
  }

  .toolbar-button.active {
    background-color: rgba(59, 199, 255, 0.1) !important;
    @apply text-toolbar-button-active-color;
  }

  .toolbar-button.disabled {
    background-color: transparent !important;
    color: #a7b0b5 !important;
  }
</style>
