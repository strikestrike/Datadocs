<script lang="ts">
  import type { DropdownTriggerRect } from "../../common/dropdown/type";
  import Dropdown from "../../common/dropdown/Dropdown.svelte";
  import { getGrid } from "../../../app/store/grid/base";
  import { addLinkDataStore } from "../../../app/store/writables";
  import InsertHyperlink from "./add-hyperlink/InsertHyperlink.svelte";
  import { setContext } from "svelte";
  import { CLOSE_LAYOVER_MENU_CONTEXT } from "../layover-menus/constant";
  import type { MetaRun } from "@datadocs/canvas-datagrid-ng";
  import { calculateTextOverlayRects } from "./utils";
  import SelectedTextOverlay from "./SelectedTextOverlay.svelte";

  let wrapperElement: HTMLElement;
  let triggerRect: DropdownTriggerRect;
  let linkRun: MetaRun;
  let overlayRects: DropdownTriggerRect[];

  function updateMenuPosition() {
    const editor = getGrid()?.input;
    if (!editor || !linkData) {
      return;
    }
    triggerRect = editor.getBoundingClientRect();
    if (!linkData.updatePosition) {
      linkRun = linkData.run;
    }
    if (linkRun && triggerRect) {
      overlayRects = calculateTextOverlayRects(
        editor,
        linkRun.startOffset,
        linkRun.endOffset
      );
    }
  }

  function reset() {
    triggerRect = null;
    linkRun = null;
    overlayRects = null;
  }

  $: linkData = $addLinkDataStore;
  $: if (linkData) {
    if (!linkData.updatePosition) {
      updateMenuPosition();
    } else if (triggerRect) {
      updateMenuPosition();
    } else {
      reset();
    }
  } else {
    reset();
  }

  setContext(CLOSE_LAYOVER_MENU_CONTEXT, () => {
    addLinkDataStore.set(null);
  });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  bind:this={wrapperElement}
  class="add-link-layover-menu fixed w-0 h-0 z-999999"
  data-grideditorcompanion="true"
>
  {#if triggerRect && linkRun}
    <Dropdown
      {wrapperElement}
      {triggerRect}
      position="top-bottom"
      distanceToDropdown={4}
    >
      <div
        class="layover-menu h-full max-h-full overflow-hidden"
        slot="content"
        on:click|stopPropagation
        on:mousedown|stopPropagation
        on:mouseup|stopPropagation
      >
        <InsertHyperlink {linkRun} />
      </div>
    </Dropdown>

    {#if overlayRects}
      <SelectedTextOverlay {overlayRects} />
    {/if}

    <!-- {#if overlayRect}
      {@const top = Math.floor(overlayRect.top)}
      {@const left = Math.floor(overlayRect.left)}
      {@const width =
        Math.ceil(overlayRect.right) - Math.floor(overlayRect.left)}
      {@const height =
        Math.ceil(overlayRect.bottom) - Math.floor(overlayRect.top)}

      <div
        class="insert-link-selection-overlay"
        style={`
        position: fixed;
        top: ${top}px;
        left: ${left}px;
        width: ${width}px;
        height: ${height}px;`}
      />
    {/if} -->
  {/if}
</div>

<style lang="postcss">
  .layover-menu {
    @apply bg-white rounded;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }

  /* .insert-link-selection-overlay {
    background-color: rgba(140, 196, 116, 0.25);
    pointer-events: none;
  } */
</style>
