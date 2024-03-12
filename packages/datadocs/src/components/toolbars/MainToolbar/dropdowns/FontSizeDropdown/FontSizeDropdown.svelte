<script lang="ts">
  import { getContext, onDestroy } from "svelte";
  import {
    changeFontSizeValue,
    removeStylePreview,
  } from "../../../../../app/store/store-toolbar";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../../common/dropdown";
  import { FONT_SIZE_DROPDOWN_VALUES } from "../default";
  import FontSizeElement from "./FontSizeElement.svelte";
  import { keyControlAction } from "../../../../common/key-control/listKeyControl";
  import type {
    KeyControlConfig,
    KeyControlActionOptions,
  } from "../../../../common/key-control/listKeyControl";
  import { fontSizeValue } from "../../../../../app/store/writables";

  export let updateInputValue: (v: string) => void;

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);
  let isProcessing = false;

  async function handleSelectItem(value: number) {
    if (isProcessing) {
      return;
    }
    isProcessing = true;
    await changeFontSizeValue(value);
    closeDropdown();
  }

  onDestroy(() => {
    removeStylePreview();
  });

  let element: HTMLElement = null;
  const keyControlList: KeyControlConfig[] = [];
  const keyControlOptions: KeyControlActionOptions = {
    configList: keyControlList,
  };

  $: activeValue = $fontSizeValue.value;
</script>

<div
  bind:this={element}
  class="dropdown"
  class:disabled={isProcessing}
  use:keyControlAction={keyControlOptions}
>
  <div class="flex flex-col text-13px font-medium">
    {#each FONT_SIZE_DROPDOWN_VALUES as value, i}
      <FontSizeElement
        index={i}
        {keyControlList}
        {updateInputValue}
        {handleSelectItem}
        {activeValue}
        {value}
        scrollContainer={element}
      />
    {/each}
  </div>
</div>

<style lang="postcss">
  .dropdown {
    @apply relative bg-white rounded py-1.5 h-[inherit] overflow-y-auto overflow-x-hidden;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }

  .disabled :global(*) {
    @apply pointer-event-none;
  }
</style>
