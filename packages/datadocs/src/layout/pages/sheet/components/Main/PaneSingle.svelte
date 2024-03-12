<script lang="ts">
  import type { Pane } from "src/layout/types/pane";
  import {
    DIVIDER_SIZE,
    PANE_CLOSED_SIZE,
    PANE_MIN_HEIGHT,
    PANE_MIN_WIDTH,
  } from "src/layout/constants/size";
  import { getContext } from "svelte";
  import clsx from "clsx";
  import {
    ContainerTabPreview,
    ContainerTabPreviewIndicator,
  } from "src/layout/components/Container";
  import type { Writable } from "svelte/store";
  import { objectHoverStatus } from "src/layout/store/object";
  import { BorderActive } from "src/layout/components/Border";
  import MoveBar from "src/layout/pages/sheet/components/MoveBar.svelte";
  import { Drop } from "src/layout/components/DragDrop";
  import WorkSheetPanel from "src/components/dashboard/Dashboard/containers/WorkSheetPanel.svelte";
  import { useLayoutSheet } from "src/layout/store/pane";
  import { DND } from "src/layout/enums/dnd";
  import { PaneType, Placement } from "src/layout/enums/pane";

  export let pane: Pane;

  const {
    activePaneId,
    getParentById,
    isHGroup,
    isVGroup,
    isTiledGroup,
    isEmbeddedGroup,
    isFixedGroup,
    isTabsGroup,
    getNextById,
    getSizeById,
  } = useLayoutSheet();

  let paneSize;
  let dropEdge;
  let splitDataParent = getContext<Writable<any>>("splitData");
  let elementRoot: HTMLElement = null;
  let isDragOver = false;

  $: props = pane.props;
  $: parent = getParentById(pane.id);
  $: parentProps = parent?.props || {};
  // $: isClosed =
  //   props.isClosed ||
  //   (parent?.type === PANE_TYPE_GROUP && parentProps.isClosed === true);
  $: borderAdjust = 0;
  $: paneMinSize = isHGroup(parent) ? PANE_MIN_WIDTH : PANE_MIN_HEIGHT;
  $: minWidth = `${PANE_MIN_WIDTH}px`;
  // ? "unset"
  // : props.minWidth !== undefined && paneMinSize <= props.minWidth
  // ? `${props.minWidth}px`
  // : `${isVGroup(pane) ? PANE_MIN_WIDTH : paneMinSize}px`;
  $: minHeight = `${PANE_MIN_HEIGHT}px`;
  // ? "unset"
  // : props.minHeight !== undefined && paneMinSize <= props.minHeight
  // ? `${props.minHeight}px`
  // : `${isHGroup(pane) ? PANE_MIN_HEIGHT : paneMinSize}px`;
  $: paneOrientation = (() => {
    const vRegExp = new RegExp(
      `${Placement.CONTAINER_LEFT}|${Placement.CONTAINER_RIGHT}`,
    );
    const hRegExp = new RegExp(`${Placement.CONTAINER_CENTER}`);
    if (vRegExp.test(pane.placement)) {
      return "vertical";
    } else if (hRegExp.test(pane.placement)) {
      return "horizontal";
    }
    return "";
  })();
  // $: isAutosize =
  //   pane.props.hasAutosize ||
  //   pane.size === "auto" ||
  //   !parent ||
  //   (parent.placement !== Placement.CONTAINER &&
  //     parent.placement !== Placement.CONTAINER_CENTER);
  $: isLeft = pane.placement === Placement.CONTAINER_LEFT;
  $: isRight = pane.placement === Placement.CONTAINER_RIGHT;
  $: isLeftOrRight = isLeft || isRight;

  $: isLeftInner = pane.placement === Placement.CONTAINER_LEFT_INNER;
  $: isRightInner = pane.placement === Placement.CONTAINER_RIGHT_INNER;
  $: isLeftOrRightInner = isLeftInner || isRightInner;

  $: isContainer = pane.placement === Placement.CONTAINER;
  $: isContainerCenter = pane.placement === Placement.CONTAINER_CENTER;
  $: isContainerCenterMain = pane.placement === Placement.CONTAINER_CENTER_MAIN;
  $: isContainerCenterBottom =
    pane.placement === Placement.CONTAINER_CENTER_BOTTOM;
  $: isContainerCenterBottomInner =
    pane.placement === Placement.CONTAINER_CENTER_BOTTOM + Placement.INNER;
  $: isInner = /:inner/.test(pane.placement);

  $: {
    if (parent && parent.children && parent.children.length > 0) {
      borderAdjust =
        ((parent.children.length - 1) * DIVIDER_SIZE) / parent.children.length;
    }
  }
  $: {
    // if (pane.size === "auto" || pane.size === undefined) {
    //     paneSize = "100%";
    //   } else {
    //     if (pane.size !== undefined && pane.size !== "auto") {
    //       paneSize = `calc(${pane.size}px - ${borderAdjust}px)`;
    //     }
    //     if (/%$/.test(pane.size as string)) {
    //       paneSize = `calc(${pane.size} - ${borderAdjust}px)`;
    //     }
    //   }
    paneSize = getSizeById(pane.id);
  }

  $: {
    if (
      isTiledGroup(parent) ||
      isEmbeddedGroup(parent) ||
      isFixedGroup(parent)
    ) {
      minWidth = "";
      minHeight = "";
    }
  }

  function getStyle() {
    return clsx(
      `pane ${paneOrientation}`,
      isTabsGroup(parent) && "pane-tabbed",
      // isClosed && "closed",
      // isAutosize && (!isClosed || parentProps?.isClosed)
      //   ? "auto-size"
      //   : "normal-size",
      isInner && "inner",
      isLeftOrRight && "no-top-bottom-border",
      isContainerCenter && "no-left-right-border",
      isContainerCenterBottom && "pane-center-bottom",
      isContainerCenterMain && "pane-container-center-main",
      getNextById(pane.id) === null && "last-pane",
      // props.noBorder === true && "no-border",
      // props.isMovedPane && "zero-size",
      // props.noOverflow && "no-overflow",
      "w-full",
      "h-full",
    );
  }

  function onClick() {
    // appManager.setActivePane(pane, elementRoot);
    $activePaneId = pane.id;
  }

  function onmouseenter(onDragIn) {
    onDragIn();
    isDragOver = true;
  }

  function onmouseleave(onDragOut) {
    onDragOut();
    isDragOver = false;
  }

  $: {
  }
</script>

<div
  id={pane.id}
  class={clsx(getStyle())}
  data-type={PaneType.PANE}
  data-dndtype={PaneType.PANE}
  data-placement={pane.placement}
  bind:this={elementRoot}
  on:click|stopPropagation={onClick}
>
  <WorkSheetPanel
    pane={{
      ...pane,
    }}
  />
  <!-- show active state when hover object -->
  <BorderActive
    show={$objectHoverStatus && pane.id === $activePaneId}
    color="gray"
  />
  <!-- preview tab -->
  <ContainerTabPreview {pane} let:onDragIn let:onDragOut let:onDrop>
    <!-- When drag in top of object, shows tab preview -->
    <ContainerTabPreviewIndicator>
      <div
        class="absolute w-[95%] h-[80px] left-[50%] top-[5%] transform -translate-x-1/2 z-10"
      />
    </ContainerTabPreviewIndicator>
    <!-- Otherwise, just show a active state -->
    <Drop
      on:dragin={() => onmouseenter(onDragIn)}
      on:dragout={() => onmouseleave(onDragOut)}
      on:drop={onDrop}
    >
      <div
        class="absolute w-[95%] h-[calc(95%-80px)] left-[50%] top-[calc(5%+80px)] transform -translate-x-1/2 z-10"
      />
    </Drop>
  </ContainerTabPreview>
  <BorderActive show={isDragOver} />

  <!-- Could drag it by move bar when it in V-Group or H-Group -->
  <MoveBar {pane} />
</div>

<style lang="postcss">
  .pane {
    @apply max-h-full max-w-full relative;
    /* @apply border default-border; */

    /* new design remove all border */
    border: 0px;
    &.auto-size {
      @apply flex-auto;
    }

    .drop-edge {
      @apply absolute pointer-events-none bg-[#3bc7ff] opacity-0 z-50 transition-opacity;
      &.west {
        @apply opacity-100 left-0 top-0 w-1 h-full;
      }
      &.east {
        @apply opacity-100 right-0 top-0 w-1 h-full;
      }
      &.north {
        @apply opacity-100 left-0 top-0 w-full h-1;
      }
      &.south {
        @apply opacity-100 left-0 bottom-0 w-full h-1;
      }
    }
  }
</style>
