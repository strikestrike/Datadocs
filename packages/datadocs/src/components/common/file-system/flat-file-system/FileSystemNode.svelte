<script lang="ts">
  import { getContext, onMount } from "svelte";
  import type {
    DragActionOptions,
    MousePosition,
  } from "../drag-move/type";
  import { dragAction } from "../drag-move/dragAction";
  import {
    addProxyElement,
    getCloneProxyElement,
    removeProxyElement,
  } from "../drag-move/dragProxy";
  import {
    FILE_SYSTEM_ACTION_CONTEXT,
    FILE_SYSTEM_STATE_MANAGER_CONTEXT,
  } from "./constant";
  import type { FlatFileSystemActions } from "./flatFileSystemActions";
  import type { FlatFileSystemManager } from "./flatFileSystemManager";
  import type { DataNodeBase } from "../fileSystemStateManager";

  export let fsNodeElement: HTMLElement = null;
  export let nodeId: string;
  export let draggable = true;

  const fileSystemActions: FlatFileSystemActions<DataNodeBase> = getContext(
    FILE_SYSTEM_ACTION_CONTEXT
  );
  const stateManager: FlatFileSystemManager<DataNodeBase> = getContext(
    FILE_SYSTEM_STATE_MANAGER_CONTEXT
  );

  let dropStatus: "success" | "warning" | "" = "";
  let dragProxy: HTMLElement = null;
  let deltaX = 0;
  let deltaY = 0;

  function updateProxyPosition(position: MousePosition) {
    if (!dragProxy) return;
    Object.assign(dragProxy.style, {
      left: position.x - deltaX + "px",
      top: position.y - deltaY + "px",
    });
  }

  function handleMouseEnter() {
    if (stateManager.isDragging() && !stateManager.isNodeDragging(nodeId)) {
      fileSystemActions.setDragTarget(nodeId);
      dropStatus = fileSystemActions.checkNodeDroppable(nodeId)
        ? "success"
        : "warning";
    } else {
      dropStatus = "";
    }
  }

  function handleMouseLeave() {
    if (stateManager.isDragging()) {
      fileSystemActions.removeDragTarget();
    }
    dropStatus = "";
  }

  function handleDataChange(event: { type: string }) {
    if (event.type === "dragend") {
      dropStatus = "";
    }
  }

  const dragOptions: DragActionOptions = {
    handleDragStart: (position) => {
      if (!draggable || !fileSystemActions.startDrag(nodeId)) {
        return false;
      }

      // Generate drag proxy element. If not provided, use default one.
      const proxyData = stateManager.getDragProxyElement(
        nodeId,
        fsNodeElement,
        position
      );

      if (!proxyData) {
        const boundingRect = fsNodeElement.getBoundingClientRect();
        getCloneProxyElement(fsNodeElement);
        deltaX = position.x - boundingRect.x;
        deltaY = position.y - boundingRect.y;
      } else {
        dragProxy = proxyData?.proxy;
        deltaX = proxyData?.deltaX ?? 0;
        deltaY = proxyData?.deltaY ?? 0;
      }

      // Add proxy element
      dragProxy.classList.add("fs-drag-proxy");
      addProxyElement(dragProxy);

      updateProxyPosition(position);
      // console.log("debug here ====== start dragging");
      return true;
    },
    handleDragging: (position) => {
      updateProxyPosition(position);
      // console.log("debug here ====== dragging");
    },
    handleDragEnd: (position) => {
      if (dragProxy) {
        removeProxyElement(dragProxy);
      }

      dragProxy = null;
      deltaX = 0;
      deltaY = 0;
      // console.log("debug here ====== end dragging");
      fileSystemActions.stopDrag();
    },
  };

  function selectNode(event: MouseEvent) {
    const { shiftKey, metaKey, ctrlKey } = event;

    if (shiftKey) {
      fileSystemActions.selectTo(nodeId);
    } else if (metaKey || ctrlKey) {
      fileSystemActions.toggleSelectNode(nodeId);
    } else {
      fileSystemActions.selectNode(nodeId, true);
    }
  }

  onMount(() => {
    stateManager.addListener("datachange", handleDataChange);
    return () => {
      stateManager.removeListener("datachange", handleDataChange);
    };
  });
</script>

<div
  bind:this={fsNodeElement}
  class="fs-node-container relative {dropStatus}"
  use:dragAction={dragOptions}
  on:click={selectNode}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
  on:click
  on:dblclick
>
  <slot />
</div>

<style lang="postcss">
  :global(.fs-drag-proxy) {
    @apply bg-white rounded;
    box-shadow: 1px 2px 6px 0px rgba(55, 84, 170, 0.16);
  }

  :global(.fs-drag-proxy .fs-node-container .panel-node-element) {
    @apply !bg-white;
  }

  :global(.fs-drag-proxy .fs-node-container .panel-more-button) {
    visibility: hidden !important;
  }

  .fs-node-container.success::after,
  .fs-node-container.warning::after {
    @apply absolute top-0 bottom-0 left-0 right-0 pointer-events-none;
    @apply rounded border border-solid;
    box-shadow: 1px 2px 6px 0px rgba(55, 84, 170, 0.16);
    content: "";
  }

  .fs-node-container.success::after {
    @apply border-primary-datadocs-blue border-opacity-40;
  }

  .fs-node-container.success :global(.panel-node-element) {
    @apply !bg-primary-datadocs-blue !bg-opacity-[0.08];
  }

  .fs-node-container.warning::after {
    @apply border-tertiary-error border-opacity-50;
  }

  .fs-node-container.warning :global(.panel-node-element) {
    @apply !bg-white;
  }
</style>
