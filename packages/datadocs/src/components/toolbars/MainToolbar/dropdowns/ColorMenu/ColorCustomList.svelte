<script lang="ts">
  import ColorElement from "./ColorElement.svelte";
  import { getCustomColors } from "../../../../../app/store/store-toolbar";
  import type { GridKeyControlActionOptions } from "../../../../common/key-control/gridKeyControl";
  import AddCustomColorButton from "./AddCustomColorButton.svelte";

  export let gridKeyControlOptions: GridKeyControlActionOptions;
  export let startRowIndex: number;
  export let scrollContainer: HTMLElement = null;

  const numberOfColumn = 10;
  const customColors: string[] = getCustomColors();
  const customLength = customColors.length;

  function getRowIndex(idx: number): number {
    return startRowIndex + Math.floor(idx / numberOfColumn);
  }

  function getColumnIndex(idx: number): number {
    return idx % numberOfColumn;
  }
</script>

<div class="standard-colors">
  {#each customColors as color, i}
    <ColorElement
      {color}
      value={color}
      ridx={getRowIndex(i)}
      cidx={getColumnIndex(i)}
      {gridKeyControlOptions}
      {scrollContainer}
    />
  {/each}

  <AddCustomColorButton
    ridx={getRowIndex(customLength)}
    cidx={getColumnIndex(customLength)}
    {gridKeyControlOptions}
    {scrollContainer}
  />
</div>

<style lang="postcss">
  .standard-colors {
    @apply grid;
    grid-template-columns: repeat(10, 16px);
    gap: 3px;
  }
</style>
