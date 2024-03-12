<script lang="ts">
  import type { Pane } from "src/layout/types/pane";
  import {} from "lodash-es";
  import { onMount, getContext, tick } from "svelte";
  import { appManager } from "src/app/core/global/app-manager";
  import { Drop } from "src/layout/components/DragDrop";
  import Tab from "./Tab.svelte";
  import clsx from "clsx";
  import {
    APP_EVENT_LAYOUT_RESIZE_END,
    APP_EVENT_LAYOUT_RESIZE_START,
  } from "src/app/core/global/app-manager-events";
  import { appDnd } from "src/app/core/global/app-dnd";
  import Drag from "src/layout/components/DragDrop/src/Drag.svelte";
  import Phantom from "./Phantom.svelte";
  import { BorderActive } from "../../../Border";
  import { objectHoverStatus } from "src/layout/store/object";
  import { useLayoutSheet, useLayoutWorkBook } from "src/layout/store/pane";
  import type { Type } from "src/layout/types/context";
  import { CONTEXT_TYPE } from "src/layout/constants/context";
  import { ContextType } from "src/layout/enums/context";
  import { useTab } from "./useTab";
  import { DND } from "src/layout/enums/dnd";

  export let pane: Pane = null;
  export let isShowContent = true;
  export let action: DND = DND.SHEET_TAB;
  export let canLeaveOneTab = false;

  let previewLeft = "";
  let isDragOver = false;
  let isDragOverTop = false;

  const type = getContext<Type>(CONTEXT_TYPE);

  const {
    getById,
    sortByIds,
    removeById,
    getParentById,
    isTabsGroup,
    update,
    insert,
    setById,
    moveTo,
  } = type === ContextType.SHEET ? useLayoutSheet() : useLayoutWorkBook();

  const { addTab, convertTabToPane } = useTab();

  let childrenBounds = {};
  let elementIndicators = null;
  let elementDrag = null;
  let children: Pane[] = [];
  let elementRoot = null;

  $: activeId = pane?.props?.activeId || "";
  $: dragId = $appDnd?.data?.pane?.id || "";
  $: dragPane = $appDnd?.data?.pane;
  $: isNewTab = !!$appDnd?.action && isNewDrag;
  $: activeIndex = children.findIndex((child) => child.id === activeId);
  $: isNewDrag = !children.some((child) => child.id === dragId);

  function onDragStart(event, id: Pane["id"]) {
    const bounds = elementIndicators.getBoundingClientRect();
    previewLeft = `${childrenBounds[id].x - bounds.x}px`;
    setActiveId(id);
  }

  export function onDragOver({ detail }: { detail: MouseEvent }) {
    let left = 0;
    let dragLeft = 0;
    let dragRight = 0;
    if ($appDnd && elementIndicators && elementDrag) {
      const bounds = elementIndicators.getBoundingClientRect();
      const boundsDrag = elementDrag.getBoundingClientRect();
      left = $appDnd.event.clientX - $appDnd.data.offsetLeft - bounds.left;
      left = Math.max(4, left);
      left = Math.min(left, bounds.width - boundsDrag.width - 4);
      previewLeft = `${left}px`;
      dragLeft = bounds.x + left;
      dragRight = dragLeft + boundsDrag.width;
    }
    Object.keys(childrenBounds)
      .filter((id) => id !== dragId)
      .forEach((id) => {
        const bounds = childrenBounds[id];
        if (
          (dragLeft > bounds.left &&
            dragLeft < bounds.left + bounds.width / 3) ||
          (dragRight < bounds.right &&
            dragRight > bounds.right - bounds.width / 3)
        ) {
          moveTo({
            sourceId: id,
            targetId: dragId,
          });
        }
      });
    isDragOverTop = true;
  }

  function onDrop() {
    isDragOver = false;
    isDragOverTop = false;
    previewLeft = "";
    if (!isNewDrag) {
      setActiveId(dragId);
    }
    if (!pane.children.some((child) => child.id === dragId)) {
      const index = children.findIndex((child) => child.id === dragId);
      children = [...children.filter((item) => item.id !== dragId)];
      if (isTabsGroup(dragPane)) {
        dragPane?.children?.forEach((child, i) => {
          addTab({
            targetId: pane.id,
            pane: child,
            index: index + i,
          });
        });
        setActiveId(dragPane?.children?.[0]?.id);
      } else {
        addTab({
          targetId: pane.id,
          pane: dragPane,
          index,
        });
      }
    } else {
      sortByIds(children.map((child) => child.id));
    }
  }

  function onDragIn({ detail }: { detail: MouseEvent }) {
    if (isNewDrag) {
      const minLeft = Math.min(
        ...Object.values(childrenBounds).map((item: any) => item.left),
      );
      const maxRight = Math.max(
        ...Object.values(childrenBounds).map((item: any) => item.right),
      );
      let index = 0;
      if (detail.clientX < minLeft) {
        index = 0;
      } else if (detail.clientX > maxRight) {
        index = children.length;
      } else {
        Object.keys(childrenBounds).forEach((id) => {
          const bounds = childrenBounds[id];
          if (detail.clientX > bounds.left && detail.clientX < bounds.right) {
            index = children.findIndex((child) => child.id === id);
          }
        });
      }
      // insert({
      //   targetId: pane.id,
      //   newPane: dragPane,
      //   index,
      // });
      if (!isTabsGroup(dragPane)) {
        addTab({
          targetId: pane.id,
          pane: dragPane,
          index,
        });
        setActiveId(dragId);
      }
    }
  }

  function onDragOut() {
    isDragOverTop = false;
    removeById(dragId);
  }

  function onDragOverBody(event) {
    isDragOver = true;
  }

  function onDragOutBody() {
    onDragOut();
    isDragOver = false;
  }

  function useBounds(element: HTMLElement, paneChild: Pane) {
    function updateBounds() {
      tick().then(() => {
        const bounds = element.getBoundingClientRect();
        childrenBounds[paneChild.id] = bounds;
      });
    }
    updateBounds();
    return {
      update() {
        updateBounds();
      },
      destroy() {
        delete childrenBounds[paneChild.id];
      },
    };
  }

  function setActiveId(id: Pane["id"]) {
    setById(pane.id, "props.activeId", id);
  }

  function onDragTab({ detail }) {
    const { event, drawPhantom } = detail;
    const parent = getParentById(pane.id);
    appDnd.update((val) => {
      return {
        ...val,
        action,
        data: {
          ...val.data,
          offsetLeft: 40,
          offsetRight: 40,
          offsetTop: 20,
          offsetBottom: 20,
          pane: getById(pane.id),
        },
      };
    });
    removeById(pane.id);
    drawPhantom(event);
  }

  let isLayoutResizing = false;
  function setupAppManager() {
    appManager.listen(APP_EVENT_LAYOUT_RESIZE_START, (eventData) => {
      isLayoutResizing = true;
    });
    appManager.listen(APP_EVENT_LAYOUT_RESIZE_END, (eventData) => {
      isLayoutResizing = false;
    });
  }

  onMount(() => {
    setupAppManager();
  });

  export function getChildren() {
    return children;
  }

  $: {
    // set drag pane style left;
    if (elementDrag?.style) {
      elementDrag.style.left = previewLeft;
    }
    if (children.length === 0) {
      removeById(pane.id);
    } else {
      // if there is no activeId, set activeId to first child
      if (!activeId || !children.some((child) => child.id === activeId)) {
        setActiveId(children[0]?.id);
      }
      // if children length equal to 1, convert tab to pane
      if (children.length === 1 && !canLeaveOneTab) {
        convertTabToPane(pane.id);
      }
    }
  }
  $: {
    // sync children
    children = [...pane.children];
    childrenBounds = {};
  }

  $: {
    // console.log(childrenBounds);
  }
</script>

<div
  bind:this={elementRoot}
  class={clsx(
    "relative container-tab w-full h-full flex flex-col",
    { "pointer-events-none": isLayoutResizing }
  )}
  on:click|stopPropagation
  on:keypress
>
  <Drag on:dragstart={onDragTab}>
    <div
      bind:this={elementIndicators}
      class="tab-indicators flex items-end pt-1 h-9 px-2.5 relative flex-shrink-0 bg-panels-bg"
    >
      {#each children as child, i (child.id)}
        <div
          class={clsx(
            child.id === activeId ? "flex-shrink-0" : "",
            "tab-item min-w-[10px]",
            i > activeIndex && child.id !== dragId ? "rtl" : "",
          )}
          style:z-index={`${100 - Math.abs(activeIndex - i)}`}
          style:left={`-${i}px`}
          use:useBounds={child}
          on:keypress
        >
          <Tab
            pane={child}
            actived={activeId === child.id}
            dragged={dragId === child.id && isDragOverTop}
            {action}
            on:dragstart={(event) => onDragStart(event, child.id)}
          />
        </div>
      {/each}
      <slot name="extra" />
      {#if dragId && isDragOverTop}
        <div
          id={dragId}
          bind:this={elementDrag}
          class="absolute z-109"
          style:left={previewLeft}
        >
          <Tab pane={dragPane} actived={activeId === dragPane.id} />
        </div>
      {/if}
    </div>
    <Phantom slot="phantom" {pane} />
  </Drag>

  <div class="h-1 bg-white z-110" />
  <div
    class={clsx(
      "tab-content flex-1 overflow-hidden",
      isShowContent ? "bg-white" : "bg-transparent",
    )}
  >
    {#if isShowContent}
      {#each children as child, i (child.id)}
        {#if child.id === activeId}
          <div class={clsx("w-full h-full overflow-hidden")}>
            <slot item={child} />
          </div>
        {/if}
      {/each}
    {/if}
  </div>

  <BorderActive show={isNewTab && (isDragOver || isDragOverTop)} />
  <!-- active status when hover object -->
  <BorderActive
    show={$objectHoverStatus && pane.id === appManager.activePane.id}
    color="gray"
  />
  <Drop
    phantom="none"
    on:dragover={onDragOver}
    on:drop={onDrop}
    on:dragout={onDragOut}
    on:dragin={onDragIn}
    zIndex={110}
  >
    <div class="absolute w-full h-[80px] top-0 left-0" />
  </Drop>
  <Drop
    on:dragover={onDragOverBody}
    on:drop={onDrop}
    on:dragout={onDragOutBody}
    zIndex={110}
  >
    <div class="absolute w-full h-[calc(100%-80px)] top-[80px]" />
  </Drop>
</div>

<style lang="postcss">
  .rtl {
    direction: rtl;
  }
</style>
