<script lang="ts">
  import { getContext, onDestroy } from "svelte";
  import {
    changeZoomValue,
    removeStylePreview,
  } from "../../../../../app/store/store-toolbar";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../../common/dropdown";
  import { ZOOM_DROPDOWN_VALUES } from "../default";
  import ZoomElement from "./ZoomElement.svelte";
  import { keyControlAction } from "../../../../common/key-control/listKeyControl";
  import type {
    KeyControlConfig,
    KeyControlActionOptions,
  } from "../../../../common/key-control/listKeyControl";
  import { zoomValue } from "../../../../../app/store/writables";

  export let updateInputValue: (v: string) => void;

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);

  function handleSelectItem(value: number) {
    changeZoomValue(value);
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

  $: activeValue = $zoomValue.value;
</script>

<div
  bind:this={element}
  class="dropdown"
  use:keyControlAction={keyControlOptions}
>
  <div class="flex flex-col text-13px font-medium">
    {#each ZOOM_DROPDOWN_VALUES as value, i}
      <ZoomElement
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
</style>
