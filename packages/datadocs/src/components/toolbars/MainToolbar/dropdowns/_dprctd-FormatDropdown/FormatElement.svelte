<script lang="ts">
  import Icon from "../../../../common/icons/Icon.svelte";
  import type { FormatValue } from "../../../../../app/store/store-toolbar";
  import type { FormatItem } from "./constant";
  import { registerElement } from "../../../../common/key-control/listKeyControl";
  import type {
    RegisterElementOptions,
    KeyControlConfig,
  } from "../../../../common/key-control/listKeyControl";
  import { scrollVerticalToVisible } from "../../../../common/key-control/scrolling";
  import { onMount, tick } from "svelte";

  export let handleSelectItem: (value: string) => void;
  export let item: FormatItem;
  export let activeValue: FormatValue;
  export let configList: KeyControlConfig[];
  export let index: number;
  export let scrollContainer: HTMLElement;

  const normalIconColor = "#A7B0B5";
  const activeIconColor = "#3BC7FF";
  const iconSize = "20px";
  let isSelected = false;
  let element: HTMLElement;

  async function onSelectCallback(byKey = true) {
    isSelected = true;

    if (!byKey) {
      return;
    }

    await tick();
    scrollVerticalToVisible(scrollContainer, element);
  }

  function onDeselectCallback() {
    isSelected = false;
  }

  const options: RegisterElementOptions = {
    config: {
      isSelected: false,
      index,
      onSelectCallback,
      onDeselectCallback,
    },
    configList: configList,
    index,
  };

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" && isSelected) {
      selectItem();
    }
  }

  function selectItem() {
    handleSelectItem(item.value);
  }

  onMount(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={element}
  class="item"
  class:active={isSelected}
  use:registerElement={options}
  on:click={selectItem}
>
  <div class="flex flex-row justify-between w-full h-5">
    {#if activeValue === item.value}
      <div class="flex flex-row flex-nowrap text-[#3BC7FF]">
        {#if item.icon}
          <div class="inline-block mr-3">
            <Icon
              icon={item.activeIcon || item.icon}
              size={iconSize}
              fill={activeIconColor}
            />
          </div>
        {/if}

        <div class="inline-block whitespace-nowrap">
          {item.label}
        </div>
      </div>
    {:else}
      <div class="flex flex-row flex-nowrap">
        {#if item.icon}
          <div class="inline-block mr-3">
            <Icon icon={item.icon} size={iconSize} fill={normalIconColor} />
          </div>
        {/if}

        <div class="inline-block whitespace-nowrap">
          {item.label}
        </div>
      </div>
    {/if}

    {#if item.hint}
      <div
        class="ml-4 text-[#A7B0B5] text-opacity-0 whitespace-nowrap"
        class:text-opacity-100={isSelected}
      >
        {item.hint}
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  .item {
    @apply block px-3.5 py-1.5 mx-1.5 rounded-sm cursor-pointer;
  }

  .active {
    @apply bg-dropdown-item-hover-bg;
  }
</style>
