<script lang="ts">
  import Icon from "../../../common/icons/Icon.svelte";
  import ColorIndicatorIcon from "./ColorIndicatorIcon.svelte";
  import tooltipAction from "../../../common/tooltip/index";
  import { DropdownWrapper } from "../../../common/dropdown";
  import type { SvelteComponent } from "svelte";
  import { openStyleProTipMenu } from "../dropdowns/ApplyStyleProTip";

  export let active = false;
  export let icon = "";
  export let activeIcon: string = icon;
  export let iconSize = "20px";
  export let buttonHeight = iconSize;
  export let hasArrow = false; // is postfix arrow dropdown needed
  export let isDropdownChild = false;
  export let tooltip = "";
  export let disabledTooltipOnActive = false;
  export let indicatorColor = "";
  export let fillColor = "";
  export let dropdownComponent: typeof SvelteComponent = null;
  export let dropdownProps = {};
  export let disabled = false;
  export let showApplyStyleProTip = false;

  let className = "";
  export { className as class };

  let element: HTMLElement;
  let onFocus = false;
  let onHover = false;

  $: hasIcon = !!icon;
  $: activeStyle = active || onFocus;
  $: isTooltipDisabled =
    showApplyStyleProTip ||
    !onHover ||
    (activeStyle && disabledTooltipOnActive);

  function toggleDropdownOpen() {
    if (!isDropdownChild) return;
    active = !active;
  }

  function handleMouseDown() {
    if (disabled) return;

    function handleMouseEnter() {
      onFocus = true;
    }

    function handleMouseLeave() {
      onFocus = false;
    }

    function handleMouseUp() {
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseup", handleMouseUp);
      onFocus = false;
    }

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseup", handleMouseUp);
    onFocus = true;

    // in case button control a dropdown
    toggleDropdownOpen();
  }

  function handleMouseOver() {
    onHover = true;

    if (showApplyStyleProTip) {
      openStyleProTipMenu(element?.getBoundingClientRect());
    }
  }

  function handleMouseLeave() {
    onHover = false;
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if dropdownComponent}
  <DropdownWrapper bind:show={active}>
    <div
      bind:this={element}
      class="toolbar-button {className} {hasIcon
        ? 'p-0.5'
        : 'py-0.5 pl-2 pr-[3px]'}"
      class:active={activeStyle}
      class:bg-light-100={onHover}
      class:disabled
      use:tooltipAction={{
        content: tooltip,
        disabled: isTooltipDisabled,
      }}
      on:mousedown={handleMouseDown}
      on:mouseover={handleMouseOver}
      on:mouseleave={handleMouseLeave}
      on:mouseover
      on:mouseleave
      on:focus
      on:click
      slot="button"
      data-grideditorcompanion="true"
    >
      <div
        class="flex items-center pointer-events-none"
        style="height: {buttonHeight};"
      >
        {#if hasIcon}
          {#if indicatorColor === ""}
            <Icon
              icon={activeStyle ? activeIcon : icon}
              size={iconSize}
              fill={fillColor ? fillColor : "currentColor"}
            />
          {:else}
            <ColorIndicatorIcon
              {icon}
              size={iconSize}
              isActive={activeStyle}
              {indicatorColor}
            />
          {/if}
        {:else}
          <slot />
        {/if}
      </div>

      <div class="pointer-events-none">
        {#if hasArrow}
          <div
            class="flex flex-row items-center justify-center w-[11px] {hasIcon
              ? 'ml-0'
              : 'ml-1'}"
          >
            <Icon
              icon="toolbar-arrow-dropdown"
              width="7px"
              height="4px"
              fill="currentColor"
            />
          </div>
        {/if}
      </div>
    </div>

    <svelte:component
      this={dropdownComponent}
      {...dropdownProps}
      slot="content"
    />
  </DropdownWrapper>
{:else}
  <div
    bind:this={element}
    class="toolbar-button {className} {hasIcon
      ? 'p-0.5'
      : 'py-0.5 pl-2 pr-[3px]'}"
    class:active={activeStyle}
    class:bg-light-100={onHover}
    class:disabled
    use:tooltipAction={{
      content: tooltip,
      disabled: isTooltipDisabled,
    }}
    on:mousedown={handleMouseDown}
    on:mouseover={handleMouseOver}
    on:mouseleave={handleMouseLeave}
    on:mouseover
    on:mouseleave
    on:focus
    on:click
    data-grideditorcompanion="true"
  >
    <div class="flex items-center pointer-events-none">
      {#if hasIcon}
        {#if indicatorColor === ""}
          <Icon
            icon={activeStyle ? activeIcon : icon}
            size={iconSize}
            fill={fillColor ? fillColor : "currentColor"}
          />
        {:else}
          <ColorIndicatorIcon
            {icon}
            size={iconSize}
            isActive={activeStyle}
            {indicatorColor}
          />
        {/if}
      {:else}
        <slot />
      {/if}
    </div>

    <div class="pointer-events-none">
      {#if hasArrow}
        <div
          class="flex flex-row items-center justify-center w-[11px] {hasIcon
            ? 'ml-0'
            : 'ml-1'}"
        >
          <Icon
            icon="toolbar-arrow-dropdown"
            width="7px"
            height="4px"
            fill="currentColor"
          />
        </div>
      {/if}
    </div>
  </div>
{/if}

<style lang="postcss">
  .toolbar-button {
    @apply text-toolbar-button-normal-color;
  }

  .toolbar-button.active {
    background-color: rgba(59, 199, 255, 0.1) !important;
    @apply text-toolbar-button-active-color;
  }

  .toolbar-button.disabled {
    background-color: transparent !important;
    color: #a7b0b5 !important;
  }

  .toolbar-button {
    @apply flex flex-row items-center justify-center rounded-sm font-medium cursor-pointer;
    margin: 0px 1px;
  }
</style>
