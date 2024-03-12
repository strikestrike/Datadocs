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
  import { BorderActive } from "src/layout/components/Border";
  import { useLayoutWorkBook } from "src/layout/store/pane";
  import Panel from "src/components/panels/Panel.svelte";
  import { PaneType, Placement } from "src/layout/enums/pane";

  export let pane: Pane;

  const { getParentById, isHGroup, isTabsGroup, getNextById, getSizeById } =
    useLayoutWorkBook();

  let paneSize;
  let dropEdge;
  let splitDataParent = getContext<Writable<any>>("splitData");
  let elementRoot: HTMLElement = null;
  let isDragOver = false;

  $: props = pane.props;
  $: parent = getParentById(pane.id);
  $: parentProps = parent?.props || {};
  $: borderAdjust = 0;
  $: paneMinSize = isHGroup(parent) ? PANE_MIN_WIDTH : PANE_MIN_HEIGHT;
  $: minHeight = `${PANE_MIN_HEIGHT}px`;
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
  // $: isLeftOrRight = isLeft || isRight;

  // $: isLeftInner = pane.placement === PLACEMENT_CONTAINER_LEFT_INNER;
  // $: isRightInner = pane.placement === PLACEMENT_CONTAINER_RIGHT_INNER;
  // $: isLeftOrRightInner = isLeftInner || isRightInner;

  // $: isContainer = pane.placement === PLACEMENT_CONTAINER;
  // $: isContainerCenter = pane.placement === PLACEMENT_CONTAINER_CENTER;
  // $: isContainerCenterMain = pane.placement === PLACEMENT_CONTAINER_CENTER_MAIN;
  // $: isContainerCenterBottom =
  //   pane.placement === PLACEMENT_CONTAINER_CENTER_BOTTOM;
  // $: isContainerCenterBottomInner =
  //   pane.placement === PLACEMENT_CONTAINER_CENTER_BOTTOM + PLACEMENT_INNER;
  $: isInner = /:inner/.test(pane.placement);

  $: {
    if (parent && parent.children && parent.children.length > 0) {
      borderAdjust =
        ((parent.children.length - 1) * DIVIDER_SIZE) / parent.children.length;
    }
  }
  $: {
    paneSize = getSizeById(pane.id);
  }

  // $: {
  //   if (
  //     isCustomGroup(parent) ||
  //     isEmbeddedGroup(parent) ||
  //     isFixedGroup(parent)
  //   ) {
  //     minWidth = "";
  //     minHeight = "";
  //   }
  // }

  function getStyle() {
    return clsx(
      `pane ${paneOrientation}`,
      isTabsGroup(parent) && "pane-tabbed",
      // isClosed && "closed",
      // isAutosize && (!isClosed || parentProps?.isClosed)
      //   ? "auto-size"
      //   : "normal-size",
      isInner && "inner",
      // isLeftOrRight && "no-top-bottom-border",
      // isContainerCenter && "no-left-right-border",
      // isContainerCenterBottom && "pane-center-bottom",
      // isContainerCenterMain && "pane-container-center-main",
      getNextById(pane.id) === null && "last-pane",
      // props.noBorder === true && "no-border",
      // props.isMovedPane && "zero-size",
      // props.noOverflow && "no-overflow",
      "w-full",
      "h-full",
    );
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
    // console.log($splitDataParent, pane);
  }
</script>

<div
  id={pane.id}
  class={clsx(getStyle())}
  data-type={PaneType.PANE}
  data-dndtype={PaneType.PANE}
  data-placement={pane.placement}
  bind:this={elementRoot}
>
  <Panel
    pane={{
      ...pane,
    }}
  />
  <!-- preview tab -->
  <ContainerTabPreview {pane}>
    <!-- When drag in top of object, shows tab preview -->
    <ContainerTabPreviewIndicator>
      <div
        class="absolute w-[95%] h-[80px] left-[50%] top-[5%] transform -translate-x-1/2 z-10"
      />
    </ContainerTabPreviewIndicator>
  </ContainerTabPreview>
  <BorderActive show={isDragOver} />
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
