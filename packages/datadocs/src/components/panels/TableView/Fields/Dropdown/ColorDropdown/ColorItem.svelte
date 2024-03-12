<script lang="ts">
  import { getContext, tick } from "svelte";
  import { registerElement } from "../../../../../common/key-control/listKeyControl";
  import type {
    KeyControlActionOptions,
    RegisterElementOptions,
  } from "../../../../../common/key-control/listKeyControl";
  import { scrollVerticalToVisible } from "../../../../../common/key-control/scrolling";
  import type { ColorFilter } from "./types";
  import Icon from "../../../../../common/icons/Icon.svelte";
  import { getConditionalFormattingIcon } from "../../../../../toolbars/MainToolbar/dropdowns/ConditionalFormattingDropdown/utils";
  import { CLOSE_ROOT_MENU_CONTEXT_NAME } from "../../../../../common/menu";

  const closeContextMenu = getContext(
    CLOSE_ROOT_MENU_CONTEXT_NAME
  ) as () => any;

  export let color: ColorFilter = undefined;
  export let usageCount: number;

  export let onChoose: (filter: ColorFilter) => any;

  export let keyControlActionOptions: KeyControlActionOptions;
  export let index: number;
  export let scrollContainer: HTMLElement = null;

  let element: HTMLElement;
  let selected = false;

  function assignColor() {
    onChoose(color);
    closeContextMenu();
  }

  function onEnterKeyCallback(event: KeyboardEvent) {
    if (event.key === "Enter" && selected) {
      assignColor();
    }
  }

  async function onSelectCallback(byKey: boolean = true) {
    selected = true;
    if (!byKey) {
      return;
    }
    await tick();
    scrollVerticalToVisible(scrollContainer, element);
  }

  function onDeselectCallback() {
    selected = false;
  }

  let options: RegisterElementOptions = {
    config: {
      isSelected: selected,
      index,
      onSelectCallback,
      onDeselectCallback,
      onEnterKeyCallback,
    },
    configList: keyControlActionOptions.configList,
    index,
  };
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={element}
  use:registerElement={options}
  class="item-container"
  class:selected
  on:click={(e) => {
    assignColor();
    e.preventDefault();
  }}
>
  {#if color.type === "icon" && color.code}
    <Icon icon={getConditionalFormattingIcon(color.code.split(":")[1])} />
  {:else if color.code && color.code.startsWith("#")}
    <div class="color-preview" style:background-color={color.code} />
  {/if}
  {#if color.type !== "icon" || !color.code}
    <span class="color-code">
      {#if color.code}
        {color.code}
      {:else if color.type === "cell"}
        No Fill
      {:else if color.type === "text"}
        Automatic
      {:else}
        No Icon
      {/if}
    </span>
  {/if}
  <span class="usage-count">{usageCount} results</span>
</div>

<style lang="postcss">
  .item-container {
    @apply rounded flex flex-row cursor-pointer mx-1.5 pl-2.5 pr-2 py-1;
    column-gap: 4px;
    align-items: center;
  }

  .item-container.selected {
    @apply bg-dropdown-item-hover-bg;
  }

  .color-preview {
    @apply rounded-sm flex-grow-0 w-[13px] h-[13px];
  }

  .color-code {
    @apply text-dark-200 text-[11px] font-normal;
    line-height: 16.5px;
  }

  .usage-count {
    @apply text-dark-50 text-[11px] ml-auto font-normal;
    line-height: 16.5px;
  }
</style>
