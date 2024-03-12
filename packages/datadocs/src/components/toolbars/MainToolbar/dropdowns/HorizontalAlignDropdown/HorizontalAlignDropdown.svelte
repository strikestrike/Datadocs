<script lang="ts">
  import { getContext } from "svelte";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../../common/dropdown";
  import { keyControlAction } from "../../../../common/key-control/listKeyControl";
  import type {
    KeyControlConfig,
    KeyControlActionOptions,
  } from "../../../../common/key-control/listKeyControl";
  import { horizontalAlignValue } from "../../../../../app/store/writables";
  import { changeHorizontalAlignValue } from "../../../../../app/store/store-toolbar";
  import { HORIZONTAL_ALIGN_VALUES } from "../default";
  import type { HorizontalAlignValue } from "../default";
  import HorizontalAlignItem from "./HorizontalAlignItem.svelte";

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);
  let isProcessing = false;

  async function handleSelectItem(value: HorizontalAlignValue) {
    if (isProcessing) {
      return;
    }
    isProcessing = true;
    await changeHorizontalAlignValue(value);
    closeDropdown();
  }

  let element: HTMLElement = null;
  const keyControlList: KeyControlConfig[] = [];
  const keyControlOptions: KeyControlActionOptions = {
    configList: keyControlList,
    controlOrientation: "horizontal",
  };

  $: activeValue = $horizontalAlignValue;
</script>

<div
  bind:this={element}
  class="dropdown"
  class:disabled={isProcessing}
  use:keyControlAction={keyControlOptions}
>
  <div class="flex flex-row">
    {#each HORIZONTAL_ALIGN_VALUES as value, index}
      {@const active = activeValue === value}
      <HorizontalAlignItem
        {value}
        {active}
        {index}
        {handleSelectItem}
        {keyControlList}
      />
    {/each}
  </div>
</div>

<style lang="postcss">
  .dropdown {
    @apply relative bg-white rounded p-1.5 h-[inherit];
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }

  .disabled :global(*) {
    @apply pointer-event-none;
  }
</style>
