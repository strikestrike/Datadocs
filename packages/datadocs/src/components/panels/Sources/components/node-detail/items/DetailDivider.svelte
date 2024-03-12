<script lang="ts">
  import clsx from "clsx";
  import { DIVIDER_SIZE } from "src/layout/constants/size";

  /**
   * Internal variable for additional css classes
   */

  let className = "";

  /**
   * Orientatiion of the divider
   * @type {"horizontal" | "vertical"}
   */
  export let orientation = "horizontal";

  /**
   * This flag turns true when dragging touches is border
   * @type {boolean}
   */
  export let isDropping = false;

  /**
   * This flag decides whether Resizing is allowed or not
   * @type {boolean}
   */
  export let isNoResize = false;

  /**
   * Side on which a tab or Pane will be dropped
   * @type { string }
   */
  export let dropSide = "none";

  $: isVertical = orientation === "vertical";
  $: isHorizontal = orientation === "horizontal";
</script>

<div
  class={clsx("detail-divider", className)}
  class:horizontal={orientation === "horizontal"}
  class:vertical={orientation === "vertical"}
  class:resize-horizontal={!isDropping &&
    !isNoResize &&
    orientation === "horizontal"}
  class:resize-vertical={!isDropping &&
    !isNoResize &&
    orientation === "vertical"}
  class:dropping={isDropping}
  style={`width: ${isVertical ? `${DIVIDER_SIZE}px` : "100%"}; height: ${
    isHorizontal ? `${DIVIDER_SIZE}px` : "100%"
  }`}
  on:mousedown
  on:mousemove
  on:dblclick
  {...$$restProps}
>
  {#if true}
    <div class="divider-proxy" />
  {/if}
  <div class={`drop-area ${dropSide}`} />
</div>

<style lang="postcss">
  .detail-divider {
    @apply flex-grow-0 flex-shrink-0 relative;
    z-index: 1111;
  }

  .detail-divider.horizontal {
  }

  .detail-divider.vertical {
  }

  .detail-divider.resize-horizontal {
    cursor: n-resize;
  }

  .detail-divider.resize-vertical {
    cursor: w-resize;
  }

  .detail-divider.dropping {
    cursor: default;
  }

  .divider-proxy {
    @apply absolute left-0 right-0 top-0 bottom-0;
  }

  .detail-divider.horizontal .divider-proxy {
    @apply -top-0.5 -bottom-0.5;
  }
</style>
