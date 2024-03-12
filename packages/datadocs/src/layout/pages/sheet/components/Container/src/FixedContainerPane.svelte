<script lang="ts">
  import clsx from "clsx";
  import { PaneGroupType } from "src/layout/enums/pane";
  import type { Pane } from "src/layout/types/pane";
  import {
    ContainerEmbeddedObject,
    ContainerEmbeddedPhantom,
  } from "./ContainerEmbedded";
  import { getContext, onDestroy, onMount, setContext } from "svelte";
  import type { Writable } from "svelte/store";
  import { writable } from "svelte/store";
  import { Drop } from "src/layout/components/DragDrop";
  import {
    ContainerTabPreview,
    ContainerTabPreviewIndicator,
  } from "src/layout/components/Container";
  import { appDnd } from "src/app/core/global/app-dnd";
  import { BorderActive } from "src/layout/components/Border";
  import { objectHoverStatus } from "src/layout/store/object";
  import MoveBar from "../../MoveBar.svelte";
  import { useLayoutSheet } from "src/layout/store/pane";
  import { DND } from "src/layout/enums/dnd";

  /**
   *The Pane to be rendered
   * @type {Pane}
   */
  export let pane: Pane = null;
  /**
   *The index of pane
   * @type {number}
   */
  export let paneIndex = -1;

  /**
   *The Component to be rendered in a Pane
   * @type {any}
   */
  export let children: Pane[] = null;

  /**
   *Type of group
   * @type {any}
   */
  export let groupType = "";

  /**
   * Update parent Pane
   * @type {Function}
   *
   */
  export let updateParent: Function = null;

  const { activePaneId, insert } = useLayoutSheet();

  let focusPaneParent = getContext<Writable<Pane>>("focusPane");
  let focusPauseParent = getContext<Writable<boolean>>("focusPause");
  let hoverPaneParent = getContext<Writable<Pane>>("hoverPane");

  const focusPane = writable<Pane>(null);
  const focusPause = writable<boolean>(false);
  const hoverPane = writable<Pane>(null);
  if (!focusPaneParent) {
    setContext("focusPane", focusPane);
  }
  if (!focusPauseParent) {
    setContext("focusPause", focusPause);
  }
  if (!hoverPaneParent) {
    setContext("hoverPane", hoverPane);
  }

  const hasSize = false;
  const width = 0;
  const height = 0;

  let panes: Record<
    string,
    InstanceType<typeof ContainerEmbeddedObject & Pane>
  > = {};
  let elementRoot: HTMLElement = null;

  $: dragPane = $appDnd?.data?.pane;

  function onUpdate({ detail }) {
    // appManager.worksheetLayout.panesContext.updatePane(detail, true);
  }

  function onMouseLeave() {
    focusPause.set(true);
  }

  function onMouseEnter() {
    focusPause.set(false);
  }

  // function onFocus(e?: MouseEvent) {
  //   focusPane?.set(pane);
  // }

  function onUnFocus(e: MouseEvent) {
    focusPane.set(null);
  }

  function onDrop({ detail }) {
    dragPane.content.view.config.dropEvent = detail;
    insert({
      targetId: pane.id,
      newPane: dragPane,
    });
  }

  function onClick() {
    $activePaneId = pane.id;
  }

  onMount(() => {
    document.addEventListener("mousedown", onUnFocus, true);
  });
  onDestroy(() => {
    document.removeEventListener("mousedown", onUnFocus);
  });

  $: {
    console.groupCollapsed("FixedContainerPane");
    console.log(pane);
    console.groupEnd();
  }
</script>

<div
  bind:this={elementRoot}
  class="fixed-container"
  on:click|stopPropagation={onClick}
>
  <div
    class={clsx("fixed-objects z-130")}
    style={hasSize ? `width:${width}px; height: ${height}px` : ""}
    on:mouseleave={onMouseLeave}
    on:mouseenter={onMouseEnter}
  >
    {#if children instanceof Array && children.length > 0}
      {#if groupType === PaneGroupType.FIXED}
        {#each pane.children as innerPane, i (innerPane.id)}
          <ContainerEmbeddedObject
            bind:this={panes[innerPane.id]}
            pane={innerPane}
            paneIndex={i}
            {updateParent}
            on:update={onUpdate}
          />
        {/each}
      {/if}
    {/if}
  </div>
  <!-- active status when hover object -->
  <BorderActive
    show={$objectHoverStatus && pane.id === $activePaneId}
    color="gray"
  />
  <!-- preview tab area -->
  <ContainerTabPreview {pane} zIndex={121}>
    <ContainerTabPreviewIndicator>
      <div
        class="absolute top-4 w-[90%] z-51 h-[80px] left-[50%] transform -translate-x-1/2"
      />
    </ContainerTabPreviewIndicator>
  </ContainerTabPreview>
  <!-- embedded area -->
  <Drop
    zIndex={120}
    phantom={$appDnd?.action === DND.INSERT_OBJECT ? "slot" : null}
    on:drop={onDrop}
  >
    <div
      class="absolute z-120 w-[95%] h-[calc(100%-40px)] top-[40px] left-[50%] transform -translate-x-1/2"
    />
    <ContainerEmbeddedPhantom slot="phantom" pane={dragPane} />
  </Drop>
  <!-- Could drag it by move bar when it in V-Group or H-Group -->
  <MoveBar {pane} />
</div>

<style lang="postcss">
  .fixed-container {
    @apply w-full h-full bg-white overflow-hidden;
  }

  .fixed-objects {
    @apply w-full h-full bg-transparent absolute overflow-hidden top-0 left-0 pointer-events-none;
  }

  .fixed-objects > :global(*) {
    @apply pointer-events-auto;
  }

  /* .fixed-container>:global(*) {
    @apply pointer-events-auto;
  } */

  .fixed-object {
    @apply absolute p-2;
  }

  .fixed-object.default-size {
    width: 400px;
    height: 300px;
  }

  .fixed-object-item {
    @apply w-full h-full;
  }

  .fixed-object-item.passive {
    @apply pointer-events-none;
  }

  .fixed-object-item.passive :global(*) {
    @apply pointer-events-none !important;
  }

  .fixed-object-grip {
    @apply w-full h-full absolute top-0 left-0 z-0 pointer-events-none bg-white transition-all duration-300;
  }

  .fixed-object.active:hover .fixed-object-grip {
    @apply bg-gray-200;
  }
</style>
