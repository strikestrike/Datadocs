<script lang="ts">
  import { tick } from "svelte";
  import {
    registerElement,
  } from "../../../common/key-control/listKeyControl";
  import type { RegisterElementOptions ,
    KeyControlConfig} from "../../../common/key-control/listKeyControl";
  import { scrollVerticalToVisible } from "../../../common/key-control/scrolling";
  import { integerToAlpha } from "@datadocs/canvas-datagrid-ng/lib/util";
  import type { ComponentDescriptor } from "@datadocs/canvas-datagrid-ng";

  export let value: ComponentDescriptor;
  export let index: number;
  export let keyControlList: KeyControlConfig[];
  export let handleSelectItem: (item: ComponentDescriptor) => void;
  export let scrollContainer: HTMLElement;

  let isSelected = false;
  let element: HTMLElement;

  const options: RegisterElementOptions = {
    config: {
      isSelected: false,
      index,
      onSelectCallback,
      onDeselectCallback,
    },
    configList: keyControlList,
    index,
  };

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

  function handleItemClick() {
    handleSelectItem(value);
  }

  function getItemNamespace(value: ComponentDescriptor) {
    const ns = value.controller.getNamespace();
    const nsAsPrefix = ns ? ns + "." : "";
    switch (value.type) {
      case "table":
        return (
          nsAsPrefix +
          integerToAlpha(value.item.startColumn).toUpperCase() +
          (value.item.startRow + 1)
        );
      case "range":
        return nsAsPrefix + value.item;
      default:
        return "";
    }
  }
</script>

<div
  bind:this={element}
  class="item"
  class:selected={isSelected}
  use:registerElement={options}
  on:click={handleItemClick}
>
  <div class="leading-5">{value.name}</div>
  <div class="text-gray-400 text-10px">
    {#if value.type === "table"}
      Table · {getItemNamespace(value)}
    {:else if value.type === "range"}
      Range · {getItemNamespace(value)}
    {/if}
  </div>
</div>

<style lang="postcss">
  .item {
    @apply mx-1.5 px-3.5 py-1.5 cursor-pointer rounded-sm;
  }

  .selected {
    @apply bg-dropdown-item-hover-bg;
  }
</style>
