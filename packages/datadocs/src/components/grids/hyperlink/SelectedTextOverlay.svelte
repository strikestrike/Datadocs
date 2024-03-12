<script lang="ts">
  import type { DropdownTriggerRect } from "../../common/dropdown/type";

  export let overlayRects: DropdownTriggerRect[];
</script>

{#if overlayRects && overlayRects.length > 0}
  {#each overlayRects as overlayRect}
    {@const top = Math.floor(overlayRect.top)}
    {@const left = Math.floor(overlayRect.left)}
    {@const width = Math.ceil(overlayRect.right) - Math.floor(overlayRect.left)}
    {@const height =
      Math.ceil(overlayRect.bottom) - Math.floor(overlayRect.top)}

    <div
      class="hyperlink-selection-overlay"
      style={`
          position: fixed;
          top: ${top}px;
          left: ${left}px;
          width: ${width}px;
          height: ${height}px;`}
    />
  {/each}
{/if}

<style lang="postcss">
  .hyperlink-selection-overlay {
    background-color: rgba(140, 196, 116, 0.25);
    pointer-events: none;
  }
</style>
