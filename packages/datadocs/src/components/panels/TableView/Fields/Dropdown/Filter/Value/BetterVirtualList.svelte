<script lang="ts" generics="T">
  import { createEventDispatcher, onMount, tick } from "svelte";

  const dispatch = createEventDispatcher<{
    refreshed: { top: number; bottom: number; start: number; end: number };
  }>();

  // props
  export let items: T[];
  export let clazz = "";
  export let defaultItemHeight: number;
  export let customItemHeightDict: Record<string, number> = {};
  export let itemSpacing = 0;
  export let paddingTop = 0;
  export let paddingBottom = 0;

  // read-only, but visible to consumers via bind:start
  export let start = 0;
  export let end = 0;

  // local state
  let rows: HTMLCollectionOf<HTMLElement>;
  let viewport: HTMLElement;
  let contents: HTMLElement;
  let viewportHeight = 0;
  let visible: { index: number; height: number; data: T }[];
  let mounted = false;

  let top = 0;
  let bottom = 0;

  $: visible = items.slice(start, end).map((data, i) => {
    return { index: i + start, height: getItemHeight(i + start), data };
  });

  /* $: customHeightKeys = Object.keys(customItemHeightDict)
    .map(parseInt)
    .sort((a, b) => a - b); */

  $: totalHeight = getTotalHeight(
    items.length,
    defaultItemHeight,
    customItemHeightDict,
    itemSpacing,
  );

  $: if (mounted) refresh(items, viewportHeight, totalHeight);

  async function refresh(
    items: T[],
    viewportHeight: number,
    totalHeight: number,
  ) {
    const { scrollTop } = viewport;

    await tick(); // wait until the DOM is up to date

    let contentHeight = top - scrollTop;
    let i = start;

    while (contentHeight < viewportHeight && i < items.length) {
      contentHeight += getItemHeight(i, true);
      i += 1;
    }

    end = i;
    bottom = totalHeight - (top + contentHeight);

    dispatch("refreshed", { top, bottom, start, end });
  }

  async function handleScroll() {
    const { scrollTop } = viewport;

    let i = 0;
    let y = 0;

    while (i < items.length) {
      const rowHeight = getItemHeight(i, true);
      if (y + rowHeight > scrollTop - paddingTop) {
        start = i;
        top = y;

        break;
      }

      y += rowHeight;
      i += 1;
    }

    while (i < items.length) {
      y += getItemHeight(i, true);
      i += 1;

      if (y > scrollTop + viewportHeight) break;
    }

    end = i;
    bottom = totalHeight - y;
  }

  function getTotalHeight(
    count: number,
    defaultHeight: number,
    customHeightDict: Record<string, number>,
    itemSpacing: number,
  ) {
    const customHeights = Object.values(customHeightDict);
    const defaultCount = count - Math.min(customHeights.length, count);

    return (
      Math.max(count - 1, 0) * itemSpacing +
      customHeights.reduce(
        (prev, curr) => prev + curr,
        defaultHeight * defaultCount,
      )
    );
  }

  function getItemHeight(index: number, withSpacing = false) {
    return (
      (customItemHeightDict[index] ?? defaultItemHeight) +
      (withSpacing && index > 0 ? itemSpacing : 0)
    );
  }

  // trigger initial refresh
  onMount(() => {
    rows = contents.getElementsByTagName(
      "svelte-virtual-list-row",
    ) as HTMLCollectionOf<HTMLElement>;
    mounted = true;
  });
</script>

<svelte-virtual-list-viewport
  bind:this={viewport}
  bind:offsetHeight={viewportHeight}
  on:scroll={handleScroll}
  class={clazz}
>
  <svelte-virtual-list-contents
    bind:this={contents}
    style:padding-top="{top + paddingTop}px"
    style:padding-bottom="{bottom + paddingBottom}px"
    style:row-gap="{itemSpacing}px"
  >
    {#each visible as row (row.index)}
      <svelte-virtual-list-row style:height="{row.height}px">
        <slot item={row.data}>Missing template</slot>
      </svelte-virtual-list-row>
    {/each}
  </svelte-virtual-list-contents>
</svelte-virtual-list-viewport>

<style>
  svelte-virtual-list-viewport {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  svelte-virtual-list-contents {
    display: flex;
    flex-direction: column;
  }

  svelte-virtual-list-row {
    display: flex;
    flex-direction: row;
    overflow-y: hidden;
  }
</style>
