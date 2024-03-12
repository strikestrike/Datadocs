<script lang="ts">
  import { getContext } from "svelte";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../../common/dropdown";
  import { keyControlAction } from "../../../../common/key-control/listKeyControl";
  import type {
    KeyControlConfig,
    KeyControlActionOptions,
  } from "../../../../common/key-control/listKeyControl";
  import { changeVerticalAlignValue } from "../../../../../app/store/store-toolbar";
  import { verticalAlignValue } from "../../../../../app/store/writables";
  import { VERTICAL_ALIGN_VALUES } from "../default";
  import type { VerticalAlignValue } from "../default";
  import VerticalAlignItem from "./VerticalAlignItem.svelte";

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);
  let isProcessing = false;

  async function handleSelectItem(value: VerticalAlignValue) {
    if (isProcessing) {
      return;
    }
    isProcessing = true;
    await changeVerticalAlignValue(value);
    closeDropdown();
  }

  let element: HTMLElement = null;
  const keyControlList: KeyControlConfig[] = [];
  const keyControlOptions: KeyControlActionOptions = {
    configList: keyControlList,
    controlOrientation: "horizontal",
  };

  $: activeValue = $verticalAlignValue;
</script>

<div
  bind:this={element}
  class="dropdown"
  class:disabled={isProcessing}
  use:keyControlAction={keyControlOptions}
>
  <div class="flex flex-row">
    {#each VERTICAL_ALIGN_VALUES as value, index}
      {@const active = activeValue === value}
      <VerticalAlignItem
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
