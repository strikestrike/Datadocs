<script lang="ts">
  import {
    getStandardColorKeys,
    getStandardColors,
  } from "../../../../../app/store/store-toolbar";
  import ColorElement from "./ColorElement.svelte";
  import type { GridKeyControlActionOptions } from "../../../../common/key-control/gridKeyControl";

  export let gridKeyControlOptions: GridKeyControlActionOptions;
  export let startRowIndex: number;
  export let scrollContainer: HTMLElement = null;

  const standardColorKeys = getStandardColorKeys();
  const standardColors = getStandardColors();
</script>

<div class="standard-colors">
  {#each standardColorKeys as key, i}
    <ColorElement
      color={standardColors[key]}
      value={key}
      ridx={startRowIndex}
      cidx={i}
      {gridKeyControlOptions}
      {scrollContainer}
    />
  {/each}
</div>

<style lang="postcss">
  .standard-colors {
    @apply grid;
    grid-template-columns: repeat(10, 16px);
    gap: 3px;
  }
</style>
