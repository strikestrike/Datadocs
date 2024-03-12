<script lang="ts">
  import { getContext } from "svelte";
  import type { FormatValue } from "../../../../../app/store/store-toolbar";
  import {
    changeFormatValue,
  } from "../../../../../app/store/store-toolbar";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../../common/dropdown";
  import { formatMenuItems as items } from "./constant";
  import { keyControlAction } from "../../../../common/key-control/listKeyControl";
  import type {
    KeyControlConfig,
    KeyControlActionOptions,
  } from "../../../../common/key-control/listKeyControl";
  import Custom from "./Custom.svelte";
  import FormatElement from "./FormatElement.svelte";
  import { formatValue } from "../../../../../app/store/writables";

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);
  let element: HTMLElement = null;
  const configList: KeyControlConfig[] = [];
  const keyControlOptions: KeyControlActionOptions = {
    configList: configList,
  };

  const horizontalSeparator = `
    <div class="block">
      <div class="border-b border-separator-line-color h-1px my-1.5"/>
    </div>
  `;

  function handleSelectItem(value: FormatValue) {
    changeFormatValue(value);
    closeDropdown();
  }

  $: activeValue = $formatValue.value;
</script>

<div
  bind:this={element}
  class="format-dropdown"
  use:keyControlAction={keyControlOptions}
>
  <div class="flex flex-col text-13px font-medium">
    {#each items as item, index}
      {#if item.type === "separator"}
        {@html horizontalSeparator}
      {:else}
        <FormatElement
          {handleSelectItem}
          {item}
          {activeValue}
          {configList}
          {index}
          scrollContainer={element}
        />
      {/if}
    {/each}

    {@html horizontalSeparator}

    <Custom index={items.length} {configList} scrollContainer={element} />
  </div>
</div>

<style lang="postcss">
  .format-dropdown {
    @apply relative bg-white rounded py-1.5 h-[inherit] overflow-y-auto overflow-x-hidden;
    min-width: 250px;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }
</style>
