<script lang="ts">
  import { getDataTypeIcon } from "../../../../../../common/icons/utils";
  import Icon from "../../../../../../common/icons/Icon.svelte";
  import type { FieldData } from "./type";

  export let item: FieldData;
  export let selectItem: (item: FieldData) => void;

  let icon: string = "";

  $: if (item) {
    icon = getDataTypeIcon(item.type);
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="item" on:click={() => selectItem(item)}>
  <div class="flex flex-row items-center gap-1">
    <div><Icon {icon} width="34px" height="18px" /></div>
    <div
      style="width: calc(100% - 38px);max-width: calc(100% - 38px);"
      class="overflow-hidden overflow-ellipsis"
    >
      {item.key}
    </div>
  </div>
</div>

<style lang="postcss">
  .item {
    @apply pl-2.5 pr-3.5 py-1.5 mx-1.5 text-13px font-medium rounded-sm cursor-pointer;
  }

  .item:hover {
    @apply bg-dropdown-item-hover-bg;
  }

  .item :global(*) {
    @apply pointer-event-none;
  }
</style>
