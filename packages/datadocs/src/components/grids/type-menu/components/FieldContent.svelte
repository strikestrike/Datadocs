<script lang="ts">
  import { convertDataTypeToDisplayName } from "../utils";

  export let key: string;
  export let dataType: string;
  export let indentLevel: number;

  const displayType = convertDataTypeToDisplayName(dataType);
  const keyPartWidth = 100;
  const width = Math.max(0, keyPartWidth - 8 * indentLevel);
</script>

<div class="flex flex-row items-center mb-0.5">
  <div class="type-key" style="width: {width}px; max-width: {width}px;">
    {key}
  </div>
  <div class="type-tag">{displayType}</div>
</div>

<style lang="postcss">
  .type-key {
    @apply flex-shrink-0 py-0.5;
    overflow: hidden;
    text-overflow: ellipsis;
    text-transform: uppercase;
  }
  .type-tag {
    @apply flex-shrink-0 p-0.5 px-1.5 font-normal h-full ml-0.5;
    @apply bg-dark-100 bg-opacity-70;
    border-radius: 8px;
  }
</style>
