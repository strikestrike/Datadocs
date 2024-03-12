<script lang="ts">
  import { getContext, tick } from "svelte";
  import type { MenuElementType } from "./constant";
  import { MENU_DATA_ITEM_STATE_DISABLED } from "./constant";
  import Icon from "../icons/Icon.svelte";
  import { CLOSE_ROOT_MENU_CONTEXT_NAME } from "./constant";
  import type {
    RegisterElementOptions,
    KeyControlActionOptions,
  } from "../key-control/listKeyControl";
  import { registerElement } from "../key-control/listKeyControl";
  import { scrollVerticalToVisible } from "../key-control/scrolling";

  export let data: MenuElementType;
  export let isContextMenu: boolean;
  export let keyControlActionOptions: KeyControlActionOptions;
  export let index: number;
  export let scrollContainer: HTMLElement = null;

  const activeIconColor = "#3BC7FF";
  const inactiveIconColor = "currentColor";
  const inactivecontextMenuIconColor = "#A7B0B5";

  let element: HTMLElement;
  const labelProps = data.labelProps || {};
  const executeAction = data.action;
  const isActive = data.active;
  const isDisabled = data.state === MENU_DATA_ITEM_STATE_DISABLED;
  const closeRootMenu: Function = getContext(CLOSE_ROOT_MENU_CONTEXT_NAME);
  let iconFillColor: string;
  let isSelected = false;

  $: if (isActive) {
    iconFillColor = activeIconColor;
  } else {
    iconFillColor = isContextMenu
      ? inactivecontextMenuIconColor
      : inactiveIconColor;
  }

  function handleMenuElementSelect(e: Event) {
    if (isDisabled) {
      return;
    }
    e.preventDefault();
    setTimeout(() => {
      // make sure key down event not accidentally trigger on newly created component such as modal
      executeAction();
    });
    closeRootMenu();
  }

  function onEnterKeyCallback(event: KeyboardEvent) {
    if (event.key === "Enter" && isSelected) {
      handleMenuElementSelect(event);
    }
  }

  async function onSelectCallback(byKey = true) {
    isSelected = true;
    if (!isDisabled && typeof data.enterAction === "function") {
      data.enterAction();
    }
    if (!byKey) {
      return;
    }
    await tick();
    scrollVerticalToVisible(scrollContainer, element);
  }

  function onDeselectCallback() {
    isSelected = false;
    if (!isDisabled && typeof data.leaveAction === "function") {
      data.leaveAction();
    }
  }

  const options: RegisterElementOptions = {
    config: {
      isSelected,
      index,
      onSelectCallback,
      onDeselectCallback,
      onEnterKeyCallback,
    },
    configList: keyControlActionOptions.configList,
    index,
    disabled: isDisabled,
  };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={element}
  class="menu-element flex flex-row items-center mx-1.5 cursor-pointer rounded"
  class:active={isActive}
  class:disabled={isDisabled}
  class:warning={data.status === "warning"}
  class:success={data.status === "success"}
  class:selected={isSelected}
  data-grideditorcompanion="true"
  style={data.style ?? ""}
  on:click={handleMenuElementSelect}
  use:registerElement={options}
>
  {#if typeof data.label === "string"}
    <div class="flex flex-row items-center px-3.5 py-1.5">
      {#if data.prefixIcon}
        <div class="mr-1">
          <Icon
            class={data.prefixIconClass}
            icon={data.prefixIcon}
            size={isContextMenu ? "14px" : "20px"}
            fill={iconFillColor}
          />
        </div>
      {/if}

      <div
        class="flex flex-1 font-medium overflow-hidden leading-5 text-13px"
        data-grideditorcompanion="true"
      >
        {@html data.label}
      </div>
    </div>
  {:else}
    <svelte:component this={data.label} {...labelProps} />
  {/if}
</div>

<style lang="postcss">
  .active:not(.disabled) {
    color: #3bc7ff;
  }

  .menu-element:not(.disabled).selected {
    @apply bg-dropdown-item-hover-bg;
  }

  .menu-element.warning:not(.disabled).selected {
    @apply bg-tertiary-error bg-opacity-[0.06];
    background-color: rgba(230, 69, 31, 0.06);
  }

  .menu-element.success:not(.disabled).selected {
    @apply text-primary-datadocs-blue bg-primary-datadocs-blue bg-opacity-[0.06];
  }

  .warning:not(.disabled) {
    @apply text-tertiary-error;
  }

  .disabled {
    cursor: default;
    color: #a7b0b5;
  }
</style>
