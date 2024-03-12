<script lang="ts">
  import Dropdown from "../../common/dropdown/Dropdown.svelte";
  import HyperlinkCard from "./hyperlink-card/HyperlinkCard.svelte";
  import { selectedHyperlinkStore } from "../../../app/store/writables";
  import { hasGridEditor } from "../../../app/store/store-toolbar";
  import type {
    GridPublicAPI,
    MetaRun,
    NormalCellDescriptor,
  } from "@datadocs/canvas-datagrid-ng";
  import { CLOSE_LAYOVER_MENU_CONTEXT } from "../layover-menus/constant";
  import { setContext, onDestroy } from "svelte";
  import { getGridStore } from "../../../app/store/grid/base";
  import type { DropdownTriggerRect } from "../../common/dropdown/type";
  import UpdateHyperlink from "./update-hyperlink/UpdateHyperlink.svelte";
  import SelectedTextOverlay from "./SelectedTextOverlay.svelte";
  import { calculateTextOverlayRects } from "./utils";

  const gridStore = getGridStore();
  let oldGrid: GridPublicAPI;
  let wrapperElement: HTMLElement;
  let data: NormalCellDescriptor;
  let linkRun: MetaRun;
  let triggerRect: DropdownTriggerRect;
  let textContent: string;
  let showEditLinkMenu = false;
  let overlayRects: DropdownTriggerRect[];
  let isFormulaCellHyperlink: boolean;

  setContext(CLOSE_LAYOVER_MENU_CONTEXT, () => {
    grid?.input?.focus();
    grid?.input?.reSelectOffset();
    selectedHyperlinkStore.set({});
  });

  function updateOverlayMenu() {
    triggerRect = selectedHyperlink?.rect;
    data = selectedHyperlink?.cell;
    linkRun = selectedHyperlink?.run;
    isFormulaCellHyperlink = selectedHyperlink.isFormulaCellHyperlink;
    showEditLinkMenu = selectedHyperlink?.type === "update-link";
    textContent = selectedHyperlink?.value;
    overlayRects = getTextOverlayRects();
  }

  function onLinkPositionChanged(event: any) {
    if (triggerRect && event.detail?.rect) {
      triggerRect = event.detail.rect;
      overlayRects = getTextOverlayRects();
    }
  }

  function getTextOverlayRects() {
    if (triggerRect && grid?.input) {
      return calculateTextOverlayRects(
        grid.input,
        linkRun.startOffset,
        linkRun.endOffset
      );
    }

    return null;
  }

  function onGridChanged() {
    if (oldGrid) {
      oldGrid.removeEventListener("linkpositionchanged", onLinkPositionChanged);
    }
    if (grid) {
      grid.addEventListener("linkpositionchanged", onLinkPositionChanged);
    }
    oldGrid = grid;
  }

  onDestroy(() => {
    grid.removeEventListener("linkpositionchanged", onLinkPositionChanged);
  });

  $: selectedHyperlink = $selectedHyperlinkStore;
  $: selectedHyperlink, updateOverlayMenu();
  $: grid = $gridStore;
  $: grid, onGridChanged();
</script>

<div
  bind:this={wrapperElement}
  class="editor-link-layover-menu fixed w-0 h-0 z-999999"
  data-grideditorcompanion="true"
>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  {#if data && triggerRect && hasGridEditor()}
    {#if !showEditLinkMenu}
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
          <HyperlinkCard
            gridCellRowIndex={data.rowIndex}
            gridCellColumnIndex={data.columnIndex}
            {linkRun}
          />
        </div>
      </Dropdown>
    {:else}
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
          <UpdateHyperlink
            {linkRun}
            value={textContent}
            {isFormulaCellHyperlink}
          />
        </div>
      </Dropdown>
    {/if}
  {/if}

  {#if showEditLinkMenu && overlayRects}
    <SelectedTextOverlay {overlayRects} />
  {/if}

  <!-- {#if showEditLinkMenu && triggerRect}
    {@const top = Math.floor(triggerRect.top)}
    {@const left = Math.floor(triggerRect.left)}
    {@const width = Math.ceil(triggerRect.right) - Math.floor(triggerRect.left)}
    {@const height =
      Math.ceil(triggerRect.bottom) - Math.floor(triggerRect.top)}

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
</div>

<style lang="postcss">
  .layover-menu {
    @apply px-3 py-1 bg-white rounded;
    box-shadow: 0px 5px 20px rgba(55, 84, 170, 0.16);
  }

  /* .insert-link-selection-overlay {
    background-color: rgba(140, 196, 116, 0.25);
    pointer-events: none;
  } */
</style>
