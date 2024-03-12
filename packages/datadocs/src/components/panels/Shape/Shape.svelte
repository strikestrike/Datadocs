<script lang="ts">
  import { onMount } from "svelte";
  import type { Pane, View } from "src/layout/types/pane";
  import { get, set } from "lodash-es";
  import { useLayoutSheet } from "src/layout/store/pane";

  export let pane: Pane;
  export let view: View;

  const { sync } = useLayoutSheet();

  let randomColor = get(pane, "content.view.config.color");

  const colors = [
    "bg-slate-400",
    "bg-green-400",
    "bg-red-400",
    "bg-yellow-400",
  ];
  onMount(() => {
    randomColor = get(pane, "content.view.config.color");
    if (!randomColor) {
      randomColor = colors[Math.floor(Math.random() * colors.length)];
      set(pane, "content.view.config.color", randomColor);
      sync();
    }
  });
</script>

<div class="object-shape {randomColor}" />

<style lang="postcss">
  .object-shape {
    @apply w-full h-full relative;
  }
</style>
