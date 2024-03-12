<script lang="ts">
  import { onMount, tick } from "svelte";

  export let isDragTarget = false;
  export let verticalMargin = 0;
  export let dimensions: { width: number; height: number } = undefined;

  $: style = dimensions
    ? `width: ${dimensions.width}px; height: ${dimensions.height}px`
    : "";
  $: dimensions, updateHeight();

  $: marginTop = verticalMargin;
  $: marginBottom = verticalMargin;

  let container: HTMLElement;
  let targetElement: HTMLElement;

  async function updateHeight() {
    await tick();
    if (!container || !targetElement) return;

    container.style.height =
      targetElement.offsetHeight + marginTop + marginBottom + "px";
  }

  onMount(() => {
    updateHeight();
  });
</script>

<div
  bind:this={container}
  class="target-container"
  class:drag-target={isDragTarget}
>
  <div
    bind:this={targetElement}
    class="target"
    {style}
    class:h-32px={!dimensions}
    style:margin-top="{marginTop}px"
    style:margin-bottom="{marginBottom}px"
  >
    &nbsp;
  </div>
</div>

<style lang="postcss">
  .target-container {
    @apply flex-shrink-0;

    .target {
      @apply flex border border-solid rounded;
      border: 1px solid rgba(59, 199, 255, 0.5);
      background: rgba(59, 199, 255, 0.1);
    }

    &.drag-target {
      .target {
        @apply border-light-200 bg-light-200 bg-opacity-[0.1];
      }
    }
  }
</style>
