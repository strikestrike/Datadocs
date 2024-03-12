<script lang="ts">
  import { getContext } from "svelte";
  import { CLOSE_DROPDOWN_CONTEXT_NAME } from "../../../../common/dropdown";
  import ConditionalFormattingElement from "./ConditionalFormattingElement.svelte";
  import type { ConditionalFormattingIcons } from "@datadocs/canvas-datagrid-ng";
  import { conditionalFormattingIconsList } from "@datadocs/canvas-datagrid-ng/lib/data/conditional-formatting";
  import { changeConditionalFormattingIconSet } from "../../../../../app/store/store-toolbar";

  const closeDropdown: () => void = getContext(CLOSE_DROPDOWN_CONTEXT_NAME);
  let isProcessing = false;

  async function handleSelectItem(iconSet: ConditionalFormattingIcons) {
    if (isProcessing) return;
    isProcessing = true;
    await changeConditionalFormattingIconSet(iconSet);
    closeDropdown();
  }
</script>

{#if conditionalFormattingIconsList}
  <div class="dropdown" class:disabled={isProcessing}>
    {#each conditionalFormattingIconsList as iconSet}
      <ConditionalFormattingElement {iconSet} {handleSelectItem} />
    {/each}
  </div>
{/if}

<style lang="postcss">
  .dropdown {
    @apply relative bg-white rounded py-1.5 h-[inherit] overflow-y-auto overflow-x-hidden;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }

  .disabled :global(*) {
    @apply pointer-event-none;
  }
</style>
