<script lang="ts">
  import ColorSwatchList from "./ColorSwatchList.svelte";
  import ColorStandardList from "./ColorStandardList.svelte";
  import ColorCustomList from "./ColorCustomList.svelte";
  import ColorReset from "./ColorReset.svelte";
  import type { GridKeyControlActionOptions } from "../../../../common/key-control/gridKeyControl";

  export let startRowIndex = 2;
  export let gridKeyControlOptions: GridKeyControlActionOptions;
  export let scrollContainer: HTMLElement = null;
  export let hasResetColor = true;

  const swatchStartRowIndex = startRowIndex;
  const resetStartRowIndex = swatchStartRowIndex + 8;
  const standardStartRowIndex = resetStartRowIndex + 1;
  const customStartRowIndex = standardStartRowIndex + 1;
</script>

<div>
  <div class="px-4 pt-4">
    <ColorSwatchList
      startRowIndex={swatchStartRowIndex}
      {gridKeyControlOptions}
      {scrollContainer}
    />
  </div>

  {#if hasResetColor}
    <div class="mx-4 mt-3">
      <ColorReset
        startRowIndex={resetStartRowIndex}
        {gridKeyControlOptions}
        {scrollContainer}
      />
    </div>
  {:else}
    <div>
      <div class="border-b border-separator-line-color h-1px my-3" />
    </div>
  {/if}

  <div class="mx-4 mt-3 text-11px text-[#A7B0B5] font-semibold uppercase">
    STANDARD
  </div>

  <div class="mx-4 mt-1.5">
    <ColorStandardList
      startRowIndex={standardStartRowIndex}
      {gridKeyControlOptions}
      {scrollContainer}
    />
  </div>

  <div>
    <div class="border-b border-separator-line-color h-1px my-3" />
  </div>

  <div class="mx-4 text-11px text-[#A7B0B5] font-semibold uppercase">
    CUSTOM
  </div>

  <div class="mx-4 mb-4 mt-1.5">
    <ColorCustomList
      startRowIndex={customStartRowIndex}
      {gridKeyControlOptions}
      {scrollContainer}
    />
  </div>
</div>
