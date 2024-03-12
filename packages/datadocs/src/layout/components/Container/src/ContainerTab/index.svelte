<script lang="ts">
  import type { Pane } from "src/layout/types/pane";
  import TabsCollapse from "./TabsCollapse.svelte";
  import Tabs from "./Tabs.svelte";

  export let pane: Pane = null;

  $: {
  }
</script>

{#if pane?.props?.collapse}
  <TabsCollapse {pane} />
{:else}
  <Tabs {pane} {...$$props} let:item>
    <slot {item} />
  </Tabs>
{/if}
