<script lang="ts">
  import type { ConditionalFormattingIcons } from "@datadocs/canvas-datagrid-ng";
  import { getConditionalFormattingIcon } from "./utils";
  import Icon from "../../../../common/icons/Icon.svelte";

  export let iconSet: ConditionalFormattingIcons;
  export let handleSelectItem: (iconSet: ConditionalFormattingIcons) => void;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="icon-set m-1 px-2 py-1 cursor-pointer"
  on:click={() => handleSelectItem(iconSet)}
>
  <div class="flex flex-row space-x-1 rounded-sm">
    {#each iconSet.icons as icon}
      <div class="w-4 h-4">
        <Icon icon={getConditionalFormattingIcon(icon)} size="16px" />
      </div>
    {/each}
  </div>
</div>

<style lang="postcss">
  .icon-set:hover {
    background-color: #f7f9fa;
  }
</style>
