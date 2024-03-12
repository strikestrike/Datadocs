<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Icon from "../../../../../../common/icons/Icon.svelte";
  import { getDataTypeIcon } from "../../../../../../common/icons/utils";
  import { getTypePreviewColor } from "@datadocs/canvas-datagrid-ng/lib/style/preview/data-format-preview";

  export let type: string;
  export let selected: boolean;

  const bgColor = getTypePreviewColor(type, 'border');
  const dispatch = createEventDispatcher();

  function getTypeIcon(type: string) {
    type = type === "number" ? "int" : type;
    return getDataTypeIcon(type);
  }

  function onClick() {
    dispatch("selected", { type });
  }
</script>

<button
  class="chip flex flex-row items-center gap-0.5"
  class:selected
  style="background-color: {bgColor};"
  on:click={onClick}
>
  <Icon icon={getTypeIcon(type)} width="26px" height="14px" />

  <span class="capitalize text-11px text-black">{type}</span>

  <div class="tick-sign-container">
    <Icon icon="sort-tick-sign" size="5px" />
  </div>
</button>

<style lang="postcss">
  .chip {
    @apply relative border border-[2px] border-white;
    padding: 3px 8px 3px 3px;
    border-radius: 5px;
  }

  .chip:hover {
    @apply border-primary-indigo-blue;
  }

  .chip.selected {
    @apply border-primary-indigo-blue;
  }

  .tick-sign-container {
    @apply flex flex-row items-center justify-center opacity-0 pointer-event-none;
    @apply absolute w-2.5 h-2.5 rounded-full bg-primary-indigo-blue;
    z-index: 100;
    top: -5px;
    right: -5px;
  }

  .selected .tick-sign-container {
    @apply opacity-100;
  }
</style>
