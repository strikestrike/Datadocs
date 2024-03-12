<script lang="ts">
  import { afterUpdate, getContext } from "svelte";
  import type { Writable } from "svelte/store";
  import { appManager } from "../../../../app/core/global/app-manager";
  import type { Pane } from "../../../../layout/main/panels-layout/types";
  import Icon from "../../../common/icons/Icon.svelte";
  // import {

  import type {
    LayersContext,
    LayerItem,
  } from "../../../../app/core/layers/layers-types";
  import LayerActions from "./LayerActions.svelte";
  import LayerItemIcon from "./LayerItemIcon.svelte";

  const PADDING_LEFT = 6;

  // let containerElement: HTMLElement = null;

  let layerElement: HTMLElement = null;
  let layerActionsElement: HTMLElement = null;

  const childCount = 0;
  let isOpen = true;

  const isGrid = false;

  let isDragging = false;
  let isReordering: Writable<boolean> = null;
  const isDragSource = false;
  const isDroppingAbove = false;
  const isDroppingBelow = false;

  const layersContext: LayersContext = getContext("layersContext");

  export let layerItem: LayerItem = null;

  export let padding = 0;

  export let index = -1;

  function toggleGroup() {
    isOpen = !isOpen;
  }

  function onLayerItemClick(event: Event) {
    console.groupCollapsed("LayerItem");
    console.log("onLayerItemClick " + isDragging);
    console.groupEnd();
    if (!isDragging) {
      event.stopPropagation();
      toggleGroup();
    }
    isDragging = false;
  }

  function onItemMouseEnter(event: Event) {
    (event.target as HTMLElement).classList.add("layer-hover");
  }

  function onItemMouseLeave(event: Event) {
    (event.target as HTMLElement).classList.remove("layer-hover");
  }

  function layerToggle(event) {
    event.stopPropagation();
  }

  function layerLock(event) {
    event.stopPropagation();
  }

  function layerDelete(event) {
    // event.stopPropagation();
    // const props = {
    //   mainMessage: `Are you sure you want to delete “${layerItem.label}” ?`,
    //   sideMessages: [
    //     "Please be 100% sure about your decision as you will no longer be",
    //     `able to recover ${layerItem.label} after deleting it.`,
    //   ],
    //   title: `Delete “${layerItem.label}”`,
    //   executeOnYes: () => {
    //     const pane: Pane = appManager.worksheetLayout.panesContext.getPane(
    //       layerItem.props.nodeId
    //     );
    //     if (
    //       layerItem.type === LAYER_VIEW ||
    //       layerItem.type === LAYER_TABGROUP
    //     ) {
    //       appManager.worksheetLayout.panesContext.removePane(pane);
    //     } else if (layerItem.type === LAYER_TAB) {
    //       appManager.worksheetLayout.panesContext.removeTabByIndex(
    //         pane,
    //         layerItem.props.tabIndex
    //       );
    //     } else if (layerItem.type === LAYER_OBJECT) {
    //       // appManager.send(APP_SHEET_CONTENT, {
    //       //   message: WS_DELETE_OBJECT,
    //       //   data: {
    //       //     id: layerItem.parent.id,
    //       //     index: layerItem.props.listIndex,
    //       //   },
    //       // });
    //     }
    //   },
    // };
    // const modalElement = bind(DeleteConfirmationModal, props);
    // const config: ModalConfigType = {
    //   component: modalElement,
    //   isMovable: false,
    //   isResizable: false,
    //   minWidth: 400,
    //   minHeight: 300,
    //   preferredWidth: 500,
    // };
    // openModal(config);
  }

  function layerReorder() {
    // appManager.send(APP_SHEET_CONTENT, {
    //   message: WS_LAYER_REORDER,
    //   data: {
    //     id:
    //       layerItem.type === LAYER_OBJECT
    //         ? layerItem.parent.id
    //         : layerItem.props.id,
    //     drag: {
    //       ...layersContext.drag,
    //     },
    //   },
    // });
  }

  function handlerDrag() {
    // return {
    //   onDragStart(dragInfo: DragInfo, isAfter: boolean) {
    //     if (isAfter) {
    //     } else {
    //       if (
    //         layerItem.type !== LAYER_WORKSHEET &&
    //         !layersContext.drag.active
    //       ) {
    //         layersContext.isReordering.set(true);
    //         layersContext.drag.active = true;
    //         layersContext.drag.sourceIndex = layerItem.props.listIndex;
    //         layersContext.drag.sourceId = layerItem.props.id;
    //         layersContext.drag.source = layerItem;
    //         isDragging = false;
    //       } else {
    //         return false;
    //       }
    //     }
    //   },
    //   onDrag(dragInfo: DragInfo, isAfter) {
    //     dragInfo.event.stopPropagation();
    //     if (isAfter) {
    //     } else {
    //       if (
    //         layersContext.drag.active &&
    //         layersContext.drag.sourceId === layerItem.props.id
    //       ) {
    //         isDragging = true;
    //         isDragSource = true;
    //         console.groupCollapsed("LayerItem");
    //         console.log("Layer Moving.... ", layerItem.label, isDragging);
    //         console.groupEnd();
    //       } else {
    //         return false;
    //       }
    //     }
    //   },
    //   onDragEnd(dragInfo: DragInfo, isAfter: boolean) {
    //     if (isAfter) {
    //     } else {
    //       console.groupCollapsed("LayerItem");
    //       console.log(
    //         "onWindowMouseUp .... ",
    //         layersContext.drag.sourceIndex,
    //         layersContext.drag.targetIndex
    //       );
    //       console.groupEnd();
    //       if (isDragging) {
    //         layerReorder();
    //         isDroppingAbove = false;
    //         isDroppingBelow = false;
    //       }
    //       if (layersContext.drag.active) {
    //         layersContext.resetDrag();
    //       }
    //       isDragSource = false;
    //       isDragging = false;
    //     }
    //   },
    // };
  }

  function layerDetailsElementHandler(layerDetailsElement: HTMLElement) {
    // function onMouseMove(event: MouseEvent) {
    //   if (layersContext.drag.active) {
    //     const id = layerItem.props.id;
    //     let bounds = layerDetailsElement.getBoundingClientRect();
    //     console.group("LayerItem");
    //     console.log("layersContext.drag.active", layersContext.drag.active);
    //     console.log(
    //       "Drag",
    //       layerItem.label,
    //       layersContext.drag.sourceId,
    //       id,
    //       event.clientY,
    //       bounds.top + bounds.height / 2
    //     );
    //     if (
    //       (layersContext.drag.source.parent.id === layerItem.parent.id ||
    //         (layersContext.drag.source.type === layerItem.type &&
    //           layerItem.type === LAYER_TABGROUP)) &&
    //       layersContext.drag.sourceId !== id
    //     ) {
    //       if (event.clientY < bounds.top + bounds.height / 2) {
    //         isDroppingAbove = true;
    //         isDroppingBelow = false;
    //         if (layerItem.type === LAYER_OBJECT) {
    //           layersContext.drag.targetIndex = layerItem.props.listIndex + 1;
    //         } else if (
    //           layerItem.type === LAYER_VIEW ||
    //           layerItem.type === LAYER_TAB ||
    //           layerItem.type === LAYER_TABGROUP
    //         ) {
    //           layersContext.drag.targetIndex = layerItem.props.listIndex;
    //         }
    //         layersContext.drag.targetId = id;
    //         layersContext.drag.target = layerItem;
    //         console.log("Setting To " + layersContext.drag.targetIndex);
    //       } else if (event.clientY > bounds.top + bounds.height / 2) {
    //         isDroppingAbove = false;
    //         isDroppingBelow = true;
    //         if (layerItem.type === LAYER_OBJECT) {
    //           layersContext.drag.targetIndex = layerItem.props.listIndex;
    //         } else if (
    //           layerItem.type === LAYER_VIEW ||
    //           layerItem.type === LAYER_TAB ||
    //           layerItem.type === LAYER_TABGROUP
    //         ) {
    //           layersContext.drag.targetIndex = layerItem.props.listIndex + 1;
    //         }
    //         layersContext.drag.targetId = id;
    //         layersContext.drag.target = layerItem;
    //         console.log("Setting To " + layersContext.drag.targetIndex);
    //       } else {
    //         // isDroppingAbove = false;
    //         // isDroppingBelow = false;
    //         // layersContext.drag.targetIndex = -1;
    //         // layersContext.drag.targetId = null;
    //       }
    //     } else {
    //       console.log(
    //         "NOOO ",
    //         `[${layersContext.drag.source.parent.id}, ${layerItem.parent.id}] ${
    //           layersContext.drag.source.parent.id === layerItem.parent.id
    //         }`,
    //         `[${layersContext.drag.source.type}, ${layerItem.type}] ${
    //           layerItem.type === LAYER_TABGROUP
    //         }`,
    //         `[${layersContext.drag.sourceId}, ${id}] ${
    //           layersContext.drag.sourceId !== id
    //         }`
    //       );
    //     }
    //     console.groupEnd();
    //   }
    // }
    // function onMouseLeave() {
    //   isDroppingAbove = false;
    //   isDroppingBelow = false;
    // }
    // layerDetailsElement.addEventListener("mousemove", onMouseMove);
    // layerDetailsElement.addEventListener("mouseleave", onMouseLeave);
    // return {
    //   destroy() {
    //     layerDetailsElement.removeEventListener("mousemove", onMouseMove);
    //     layerDetailsElement.removeEventListener("mouseleave", onMouseLeave);
    //   },
    // };
  }

  afterUpdate(async () => {
    console.groupCollapsed("LayerItem");
    console.log("Data " + isGrid);
    console.log(layerItem);
    console.groupEnd();
  });

  $: {
    isReordering = layersContext.isReordering;
  }
  $: isDroppingAbove;
  $: isDroppingBelow;
</script>

{#if layerItem !== null}
  {#if layerItem.isGroup}
    <div
      class={`layer-item layer-item-group item-at-${layerItem.index}`}
      class:is-open={isOpen}
      class:drop-above={isDroppingAbove}
      class:drop-below={isDroppingBelow}
      class:is-drag-source={isDragSource}
      bind:this={layerElement}
    >
      <!-- use:dragDrop={{ useTranslate: true, ...handlerDrag() }} -->
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        class="layer-group-details hover:bg-sky-700"
        on:mouseenter={onItemMouseEnter}
        on:mouseleave={onItemMouseLeave}
        style={`padding-left:${padding * PADDING_LEFT}px`}
        on:click={onLayerItemClick}
        use:layerDetailsElementHandler
      >
        <div class="layer-label">
          <span class="group-arrow">
            <Icon icon={"layer-action-group-arrow"} width="6px" height="4px" />
          </span>
          <span class={`type-icon ${layerItem.type}`}>
            <LayerItemIcon layerType={layerItem.type} pane={layerItem.pane} />
          </span>
          <span class="layer-label-text">
            {layerItem.label}
          </span>
        </div>
        {#if !$isReordering}
          <div class="layer-actions-holder">
            <LayerActions
              bind:node={layerActionsElement}
              isHidden={layerItem.settings.isHidden}
              isLocked={layerItem.settings.isLocked}
              layerToggle={!layerItem.settings.noHide ? layerToggle : null}
              layerLock={!layerItem.settings.noLock ? layerLock : null}
              layerDelete={!layerItem.settings.noDelete ? layerDelete : null}
            />
          </div>
        {/if}
      </div>
      {#if layerItem.children && layerItem.children.length > 0}
        {#if isOpen}
          <div class="layer-children">
            {#each layerItem.children as layerChild, index}
              <svelte:self
                layerItem={layerChild}
                itemIndex={index}
                itemsCount={childCount}
                padding={padding + 2}
              />
            {/each}
          </div>
        {/if}
      {:else}
        <svelte:self
          layerItem={{
            label: "Empty",
            settings: {}
          }}
          index={-1}
          padding={padding + 2}
        />
      {/if}
    </div>
  {:else}
    <div
      class={`layer-item layer-item-layer item-at-${layerItem.index}`}
      class:drop-above={isDroppingAbove}
      class:drop-below={isDroppingBelow}
      class:is-drag-source={isDragSource}
      bind:this={layerElement}
    >
      <!-- use:dragDrop={{ useTranslate: true, ...handlerDrag() }} -->
      <div
        class="layer-layer-details"
        on:mouseenter={onItemMouseEnter}
        on:mouseleave={onItemMouseLeave}
        style={`padding-left:${padding * PADDING_LEFT}px`}
        use:layerDetailsElementHandler
      >
        <div class="layer-label">
          <span class="arrow-space-filler" />
          <span class={`type-icon ${layerItem.type}`}>
            <LayerItemIcon layerType={layerItem.type} pane={layerItem.pane} />
          </span>
          <span class="layer-label-text">
            {layerItem.label}
          </span>
        </div>
        {#if !$isReordering}
          <div class="layer-actions-holder">
            <LayerActions
              bind:node={layerActionsElement}
              isHidden={layerItem.settings.isHidden}
              isLocked={layerItem.settings.isLocked}
              layerToggle={!layerItem.settings.noHide ? layerToggle : null}
              layerLock={!layerItem.settings.noLock ? layerLock : null}
              layerDelete={!layerItem.settings.noDelete ? layerDelete : null}
            />
          </div>
        {/if}
      </div>
    </div>
  {/if}
{/if}

<style lang="postcss">
  .layer-item {
    @apply flex flex-col;
    border-top: solid 1px transparent;
    border-bottom: solid 1px transparent;
  }

  .layer-item.drop-below {
    border-bottom-color: #b5b5b5;
  }

  .layer-item.drop-above {
    border-top-color: #b5b5b5;
  }

  .layer-item.is-drag-source {
    pointer-events: none !important;
  }

  .layer-item.layer-item-group {
  }

  .layer-item.layer-item-group > .layer-group-details {
    @apply flex flex-row justify-between items-center;
    height: 28px;
  }

  .layer-item.layer-item-group > .layer-group-details:hover {
    background: #5f89ff1a;
    border-radius: 2px;
  }

  .layer-item.layer-item-group > .layer-group-details .layer-label {
    @apply flex flex-row justify-start items-center pl-2 space-x-1;
  }

  .layer-item.layer-item-group
    > .layer-group-details
    > .layer-label
    > .group-arrow {
    @apply -rotate-90 w-1.5 h-1 mr-0.5 inline-block;
  }

  .layer-item.layer-item-group.is-open
    > .layer-group-details
    > .layer-label
    > .group-arrow {
    @apply rotate-0;
  }

  .layer-item.layer-item-group.is-open
    > .layer-group-details
    > .layer-label
    > .type-icon {
    /* @apply px-0.5; */
  }

  .layer-item.layer-item-group > .layer-group-details .layer-actions-holder {
    @apply hidden flex-row justify-start items-center pr-1;
  }

  .layer-item.layer-item-group
    > :global(.layer-group-details.layer-hover > .layer-actions-holder) {
    display: flex !important;
  }

  .layer-item.layer-item-group
    > .layer-group-details
    > .layer-label
    .layer-label-text {
    @apply text-11px leading-4 font-normal text-black;
  }

  .layer-item > .layer-layer-details {
    @apply flex flex-row justify-between items-center;
    height: 28px;
  }

  .layer-item > .layer-layer-details:hover {
    background: #5f89ff1a;
    border-radius: 2px;
  }

  .layer-item > .layer-layer-details .layer-label {
    @apply flex flex-row justify-start items-center pl-2 space-x-1;
  }

  .layer-item > .layer-layer-details .layer-label > .arrow-space-filler {
    @apply w-2 h-2;
  }

  .layer-item > .layer-layer-details > .layer-label > .type-icon {
    /* @apply px-0.5; */
  }

  .layer-item > .layer-layer-details .layer-label .layer-label-text {
    @apply text-11px leading-4 font-normal text-black;
  }

  .layer-item > .layer-layer-details .layer-actions-holder {
    @apply hidden flex-row justify-start items-center pr-1;
  }

  .layer-item
    > :global(.layer-layer-details.layer-hover > .layer-actions-holder) {
    display: flex !important;
  }

  .layer-item.layer-item-group > .layer-children {
    @apply flex flex-col justify-end;
  }

  .layer-item.layer-item-layer {
  }
</style>
