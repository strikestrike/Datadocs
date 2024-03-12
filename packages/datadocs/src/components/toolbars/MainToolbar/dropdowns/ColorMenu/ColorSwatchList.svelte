<script lang="ts">
  import { COLOR_SWATCH_LIST } from "../../../../../app/store/colors";
  import type { GridKeyControlActionOptions } from "../../../../common/key-control/gridKeyControl";
  import ColorElement from "./ColorElement.svelte";

  export let gridKeyControlOptions: GridKeyControlActionOptions;
  export let scrollContainer: HTMLElement = null;
  export let startRowIndex: number;

  function getRowIndex(idx: number) {
    return idx + startRowIndex;
  }
</script>

<div class="color-swatch-grid">
  {#each COLOR_SWATCH_LIST as colors, i}
    {#each colors as color, j}
      <ColorElement
        {color}
        ridx={getRowIndex(i)}
        cidx={j}
        {gridKeyControlOptions}
        {scrollContainer}
      />
    {/each}
  {/each}
</div>

<style lang="postcss">
  .color-swatch-grid {
    @apply grid;
    grid-template-columns: repeat(10, 16px);
    gap: 3px;
  }
</style>
