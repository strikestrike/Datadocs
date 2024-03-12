<script lang="ts">
  import { useLayoutWorkBook } from "src/layout/store/pane";
  import { PaneSingleType, PaneType } from "src/layout/enums/pane";
  import type { Pane } from "src/layout/types/pane";
  import PaneGroup from "./Group.svelte";
  import PaneSingle from "./Single.svelte";
  import SplitEdge from "src/layout/components/SplitEdge.svelte";
  import PaneDivider from "src/layout/components/PaneDivider.svelte";
  import { DND } from "src/layout/enums/dnd";
  import { useTab } from "src/layout/components/Container/src/ContainerTab/useTab";
  import { Orientation } from "src/layout/enums/divider";
  import Collapse from "../Collapse.svelte";

  export let pane: Pane = null;

  const { isRoot } = useLayoutWorkBook();

  $: {
    // console.log(pane.id, parent);
  }
</script>

{#if pane.type === PaneType.PANE}
  <SplitEdge {pane} allowDrop={[DND.WORKBOOK_TAB]}>
    <PaneSingle {pane} />
  </SplitEdge>
{:else if pane.type === PaneType.GROUP}
  <SplitEdge {pane} allowDrop={[DND.WORKBOOK_TAB]} disabled={isRoot(pane)}>
    <PaneGroup {pane} />
    <Collapse {pane} />
  </SplitEdge>
{/if}

<!-- {#if getNextById(pane.id) && (isHGroup(parent) || isVGroup(parent))}
  <PaneDivider
    {pane}
    data-dndtype="after-group"
    orientation={isHGroup(parent)
      ? Orientation.VERTICAL
      : Orientation.HORIZONTAL}
    allowDrop={[DND.WORKBOOK_TAB]}
  />
{/if} -->

<style lang="postcss">
</style>
