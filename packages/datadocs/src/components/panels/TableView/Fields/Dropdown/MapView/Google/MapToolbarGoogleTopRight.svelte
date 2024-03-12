<script lang="ts">
  import Checkbox from "../../../../../../common/form/Checkbox.svelte";
  import type { MapViewMode } from "../MapView";
  import type { Writable } from "svelte/store";

  export let map: google.maps.Map;
  export let modeStore: Writable<MapViewMode>;
  export let toggle: (rectMode: boolean) => any;
</script>

<div class="main-container">
  <div class="toolbar-item">
    <Checkbox
      checked={$modeStore.type === "rect"}
      id="searchAfterMove"
      size="15px"
      on:checked={({ detail }) => {
        toggle(detail.value);
      }}
    />
    <label for="searchAfterMove" class="label">Search as I move map</label>
  </div>
</div>

<style lang="postcss">
  .main-container {
    @apply h-[28px] m-1 py-0.5 w-[150px];
  }

  .toolbar-item {
    @apply flex flex-row rounded-[3px] bg-white p-1;
    backdrop-filter: blur(22px);
    box-shadow: 1px 2px 6px rgba(55, 84, 170, 0.16);
    column-gap: 5px;
  }

  .toolbar-item .label {
    @apply text-dark-300 text-[10px] font-normal cursor-pointer;
    line-height: 15px;
  }
</style>
