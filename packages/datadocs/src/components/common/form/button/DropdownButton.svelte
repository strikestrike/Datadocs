<script lang="ts">
  import { setContext, tick } from "svelte";
  import { DropdownWrapper } from "../../dropdown";
  import Icon from "../../icons/Icon.svelte";
  import type { MenuItemType } from "../../menu";
  import { CLOSE_ROOT_MENU_CONTEXT_NAME, Menu } from "../../menu";
  import type { Placement } from "./type";

  /**
   * Menu list to display or undefined if something other than a menu is going
   * to be displayed.
   */
  export let data: MenuItemType[] | undefined = undefined;
  /**
   * Match the dropdown with to the button width.
   *
   * If the dropdown has a minumum width that is wider than the button width,
   * this will NOT be effective.
   */
  export let autoWidth: boolean = true;
  /**
   * When using with menus, allow the menu elements to have the minimum width
   * possible matching its content.
   *
   * Note that if "autoWidth" is set to true, it will still be respected.
   */
  export let allowMinimalWidth = false;

  /**
   * Short for size="small".
   */
  export let smaller = false;
  /**
   * Short for buttonType="dropdownSecondary".
   */
  export let secondary = false;
  export let disabled = false;
  export let buttonClass = "";
  /**
   * dropdown: The default where the button make it obvious that pressing it
   *  will show a dropdown.
   *
   * dropdownSecondary: The dropdown button inside another dropdown button.
   *
   * action: It will look more like a button.
   *
   * container: It will have less padding on the left.
   */
  export let buttonType:
    | "dropdown"
    | "dropdownSecondary"
    | "action"
    | "container" = secondary ? "dropdownSecondary" : "dropdown";
  /**
   * The icon to display instead of the default dropdown button.
   */
  export let icon: string | undefined = undefined;
  /**
   * Which sides of the dropdown button should be rounded, e.g., the "start"
   * option will round the top and bottom left corners.
   */
  export let placement: Placement = "none";
  /**
   * Hide the label. Only effective when the "label" slot is set.
   */
  export let hideLabel = false;
  /**
   * The size of the dropdown button.
   */
  export let size: "small" | "normal" | "large" = smaller ? "small" : "normal";
  /**
   * If the value is going to be a block element instead of text, set this to
   * true to to reduce the vertical padding.
   */
  export let blockContainer = false;

  /**
   * Override the default button click behavior. When undefined or when the
   * method returns false, the button will perform the default behavior.
   */
  export let onClick: () => boolean = undefined;

  let className: string = "";
  export { className as class };

  let element: HTMLElement;

  let selected = false;
  let show = false;

  $: hasLabel = $$slots.label && !hideLabel;

  async function toggle(e?: Event) {
    if (disabled || onClick?.()) return;
    const { target } = e;
    await tick();
    if (
      e?.defaultPrevented ||
      (target instanceof HTMLElement &&
        target.dataset.ddDropdownToggleHandler &&
        element != target)
    ) {
      show = false;
      return;
    }
    e?.preventDefault();
    show = !show;
  }

  function hide() {
    setTimeout(() => (show = false));
  }

  setContext(CLOSE_ROOT_MENU_CONTEXT_NAME, hide);
</script>

<DropdownWrapper
  distanceToDropdown={4}
  class={className}
  closeOnEscapeKey
  closeOnMouseDownOutside
  {autoWidth}
  bind:show
  {...$$restProps}
>
  <button
    bind:this={element}
    slot="button"
    class:show
    class:selected
    class:size-small={size === "small"}
    class:size-large={size === "large"}
    class:disabled
    class:action-button={buttonType === "action"}
    class:container-button={buttonType === "container"}
    class:secondary-button={buttonType === "dropdownSecondary"}
    class:with-label={hasLabel}
    class={`dropdown-button placement-${placement} ${buttonClass}`}
    on:click={toggle}
  >
    {#if hasLabel}
      <div class="label">
        <slot name="label" />
      </div>
    {/if}
    {#if buttonType === "action"}
      <div class="icon left">
        <Icon
          icon={icon ? icon : "toolbar-arrow-dropdown"}
          size="16px"
          fill="currentColor"
        />
      </div>
    {/if}
    <div class="text">
      <slot name="value" />
    </div>

    {#if buttonType != "action"}
      <div class="icon">
        <Icon
          icon={icon ? icon : "toolbar-arrow-dropdown"}
          size="8px"
          fill="currentColor"
        />
      </div>
    {/if}
  </button>
  <div class="p-0 m-0 h-[inherit]" slot="content">
    <slot name="dropdown">
      {#if data}
        <Menu {data} {allowMinimalWidth} isRoot />
      {/if}
    </slot>
  </div>
</DropdownWrapper>

<style lang="postcss">
  .dropdown-button {
    @apply flex flex-1 text-left border border-solid border-light-100 outline-none bg-white pl-2.5 pr-1.5 h-32px items-stretch m-0 min-w-0;
    justify-content: stretch;
    box-sizing: border-box;

    > .label {
      @apply relative flex flex-row rounded-tl rounded-bl px-2 text-13px text-dark-200 bg-white border-r border-light-100 self-stretch items-center font-normal;
      box-shadow: 1px 0px 4px 0px rgba(55, 84, 170, 0.12);
      clip-path: inset(0px -4px 0px 0px);
      line-height: normal;
    }

    > .text {
      @apply flex justify-start items-center whitespace-nowrap overflow-x-hidden overflow-ellipsis text-13px font-medium;
      line-height: normal;
    }

    &:not(.action-button) {
      > .text {
        @apply flex-1;
      }
    }

    > .icon {
      @apply flex flex-shrink-0 items-center text-dark-50 ml-1;

      &.left {
        @apply ml-0 mr-1;
      }
    }

    &.size-large {
      @apply h-36px;

      &.block-container {
        @apply pl-3;
      }
    }

    &.size-small {
      @apply h-25px;

      > .text,
      > .label {
        @apply text-11px;
        line-height: normal;
      }

      &.container-button {
        @apply pl-2;
      }
    }

    &.secondary-button {
      @apply bg-light-50 border-0;
    }

    &.container-button {
      @apply pl-1.5 items-center;

      > .text {
        @apply py-1.5;
      }
    }

    &.action-button {
      @apply bg-light-50 border-light-50 text-dark-50 px-4 justify-center;

      &.size-large {
        @apply px-5;
      }

      &.size-small {
        @apply px-3;
      }
    }

    &.with-label {
      @apply pl-0 border-light-100 bg-light-50;

      > .text {
        @apply pl-2;
      }

      > .text,
      > .label {
        @apply font-normal;
      }
    }

    &.placement-none {
      @apply rounded;
    }

    &.placement-start {
      @apply rounded-tl rounded-bl border-r-0;
    }

    &.placement-middle {
      @apply rounded-0 border-r-0;
    }

    &.placement-end {
      @apply rounded-tr rounded-br;
    }

    &.placement-top {
      @apply rounded-tl rounded-tr border-b-0;
    }

    &.placement-bottom {
      @apply rounded-bl rounded-br;
    }

    &.disabled {
      @apply border-light-100 cursor-default;
      opacity: 0.8;
    }

    &:hover:not(.disabled),
    &:focus-within:not(.disabled),
    &:focus-visible,
    &.show,
    &.selected {
      &:not(.action-button) {
        @apply border-light-200;
      }

      > .icon {
        @apply text-dark-200;
      }

      &.action-button {
        > .icon {
          @apply text-dark-100;
        }
      }

      &.secondary-button {
        @apply text-primary-datadocs-blue;
        background-color: rgba(59, 199, 255, 0.1);
        box-shadow: none;

        > .icon {
          @apply text-primary-datadocs-blue;
        }
      }

      &.action-button {
        @apply border-light-100 text-dark-100;
      }
    }
  }
</style>
