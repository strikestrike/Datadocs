<script lang="ts">
  import {
    AddRemoveFcn,
    GridHTMLElement,
    GridItemHTMLElement,
    GridStack,
    GridStackNode,
    GridStackOptions,
    GridStackWidget,
  } from "gridstack";
  import { onMount, beforeUpdate, afterUpdate, getAllContexts } from "svelte";
  // import { getId } from "../../../../../layout/main/panels-layout/core/utils";
  import type { Pane } from "src/layout/types/pane";
  import TiledContainerItem from "./TiledContainerItem.svelte";
  import { Drop } from "src/layout/components/DragDrop";
  import { appManager } from "src/app/core/global/app-manager";
  import {
    ContainerTabPreview,
    ContainerTabPreviewIndicator,
  } from "src/layout/components/Container";
  import MoveBar from "src/layout/pages/sheet/components/MoveBar.svelte";
  import { useLayoutSheet } from "src/layout/store/pane";

  /**
   *The Pane to be rendered
   * @type {Pane}
   */
  export let pane: Pane = null;
  /**
   *The index of pane
   * @type {number}
   */
  export let paneIndex: number = -1;
  /**
   *The Pane Component to be rendered  as children
   * @type {any}
   */
  export let paneComponent: any = null;
  /**
   *Custom Pane Component to render  children
   * @type {any}
   */
  export let customPaneComponent: any = null;
  /**
   *The Component to be rendered in a Pane
   * @type {any}
   */
  export let component: any = null;

  /**
   *The Component to be rendered in a Pane
   * @type {any}
   */
  export let children: Pane[] = null;

  /**
   *Type of group
   * @type {any}
   */
  export let groupType: string = "";

  /**
   * Update parent Pane
   * @type {Function}
   *
   */
  export let updateParent: Function = null;

  let gridstack: GridStack;
  let options: GridStackOptions;
  let gridElement: GridHTMLElement;
  let gridItemsCount: number = 0;

  let allContexts = getAllContexts();

  $: activeDND = appManager.activeDND;
  $: dragPane = $activeDND?.data?.pane;

  const { insert } = useLayoutSheet();

  function addToStack(child, index) {
    const tileDiv: HTMLElement = document.createElement("div");
    // gridstack.addWidget({ w: 3, h: 3, x: 0, content: `<p>Hello ${i}</p>` });

    gridstack.addWidget(tileDiv, {
      w: 3,
      h: 3,
    });

    const tiledContainerItem: TiledContainerItem = new TiledContainerItem({
      target: tileDiv,
      props: {
        paneComponent,
        customPaneComponent,
        component,
        pane: child,
        paneIndex: index,
        updateParent,
      },
      context: allContexts,
    });
  }

  function removeFromStack() {}

  function updateGridstack() {
    if (gridElement) {
      const opts: GridStackOptions = options || {
        cellHeight: 156,
      };

      gridItemsCount = children.length;

      if (gridstack === undefined) {
        gridstack = GridStack.init(opts, gridElement);
      } else {
        gridstack.removeAll();
      }

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        addToStack(child, i);
      }
    }
  }

  function onDrop() {
    insert({
      targetId: pane.id,
      newPane: dragPane,
    });
  }

  onMount(async () => {
    updateGridstack();
  });

  afterUpdate(async () => {
    if (gridItemsCount !== children.length) {
      addToStack(children[children.length - 1], gridItemsCount);
      gridItemsCount++;
    }
  });

  $: {
    if (gridElement) {
      updateGridstack();
    }
  }
</script>

{#key pane.id}
  <div class="tiled-container" bind:this={gridElement}>
    <!-- preview tab area -->
    <ContainerTabPreview {pane} zIndex={121}>
      <ContainerTabPreviewIndicator>
        <div
          class="absolute top-4 w-[90%] z-51 h-[80px] left-[50%] transform -translate-x-1/2"
        />
      </ContainerTabPreviewIndicator>
    </ContainerTabPreview>
    <!-- embedded area -->
    <Drop on:drop={onDrop} zIndex={120}>
      <div
        class="absolute z-120 w-[95%] h-[calc(100%-40px)] top-[40px] left-[50%] transform -translate-x-1/2"
      />
    </Drop>
    <!-- Could drag it by move bar when it in V-Group or H-Group -->
    <MoveBar {pane} />
  </div>
{/key}

<style lang="postcss">
  .tiled-container {
    @apply w-full h-full bg-white;
  }
</style>
