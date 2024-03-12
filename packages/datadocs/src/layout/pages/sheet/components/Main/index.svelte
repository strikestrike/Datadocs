<!-- @component
@packageModule(layout/FlexPane)
-->
<script lang="ts">
  import clsx from "clsx";
  import {
    afterUpdate,
    beforeUpdate,
    getContext,
    onMount,
    setContext,
  } from "svelte";
  import type { Pane, PaneProps, PaneContent } from "src/layout/types/pane";

  import {
    DIVIDER_SIZE,
    PANE_CLOSED_SIZE,
    PANE_MIN_HEIGHT,
    PANE_MIN_WIDTH,
  } from "src/layout/constants/size";
  import {
    PaneType,
    PaneSingleType,
    PaneGroupType,
    Placement,
  } from "src/layout/enums/pane";

  import PaneDivider from "src/layout/components/PaneDivider.svelte";
  import PaneSingle from "./PaneSingle.svelte";
  import PaneGroup from "./PaneGroup.svelte";
  import SplitEdge from "../../../../components/SplitEdge.svelte";
  import { writable } from "svelte/store";
  import type { Writable } from "svelte/store";
  import { useLayoutSheet } from "src/layout/store/pane";
  import { DND } from "src/layout/enums/dnd";
  import { Orientation } from "src/layout/enums/divider";

  let allowChildUpdates = false;
  let childUpdates = 0;
  let calculatedMinSize = 0;

  export let paneElement: HTMLElement = null;

  /**
   *The Pane to be rendered
   * @type {Pane}
   */
  export let pane: Pane = null;

  export let allowSplit: boolean | null = null;

  export let allowDrop: boolean | null = null;

  let allowSplitContextParent = getContext<Writable<boolean>>("allowSplit");
  const allowSplitContext = writable(
    allowSplit !== null ? allowSplit : $allowSplitContextParent || null,
  );
  setContext("allowSplit", allowSplitContext);

  let allowDropContextParent = getContext<Writable<boolean>>("allowDrop");
  const allowDropContext = writable(
    allowDrop !== null ? allowDrop : $allowDropContextParent || null,
  );
  setContext("allowDrop", allowDropContext);

  /** Handle component events */
  /*******************************/

  onMount(() => {});

  beforeUpdate(() => {
    if (hasChildren) {
      childUpdates = 0;
      calculatedMinSize = 0;
      allowChildUpdates = true;
    }
  });

  // afterUpdate(() => {
  //   // console.groupCollapsed("ContainerPane");
  //   // console.log(
  //   //   "Pane updated :::",
  //   //   pane.id,
  //   //   pane.props.paneType,
  //   //   pane.props.groupType,
  //   //   pane.placement,
  //   //   pane
  //   // );
  //   // console.groupEnd();
  //   if (
  //     props.isMovedPane &&
  //     paneElement &&
  //     paneElement.classList.contains("zero-size") &&
  //     paneOpenTimeOut === null
  //   ) {
  //     paneOpenTimeOut = setTimeout(() => {
  //       paneElement.classList.add("moved-pane");
  //       paneElement.classList.remove("zero-size");
  //       paneOpenTimeOut = null;
  //     }, 10);
  //     setTimeout(() => {
  //       panesContext.clearMovedPane(pane);
  //     }, 300);
  //   }
  // });

  const {
    getParentById,
    isHGroup,
    isVGroup,
    isTiledGroup,
    isEmbeddedGroup,
    isFixedGroup,
    getNextById,
    getPrevById,
  } = useLayoutSheet();
  /** Reactive Variables */
  /*******************************/

  // let parent: PaneConfig;

  let props: PaneProps;
  let content: PaneContent;

  let parentProps: PaneProps;

  let children: Pane[] = [];
  let hasChildren = false;
  let childCount = 0;

  let panesList: Pane[] = [];
  let hasTabs = false;
  let activeIndex = 0;

  let prev: Pane;
  let next: Pane;

  let prevProps: PaneProps;
  let nextProps: PaneProps;

  let dividerOrientation: Orientation;

  let isClosed: boolean;

  let paneSize: string;
  let paneMinSize: number;

  let borderAdjust: number;

  let paneOrientation: string;

  let isLeft: boolean;
  let isRight: boolean;
  let isLeftOrRight: boolean;

  let isLeftInner: boolean;
  let isRightInner: boolean;
  let isLeftOrRightInner: boolean;

  let isContainer: boolean;
  let isContainerCenter: boolean;
  let isContainerCenterMain: boolean;
  let isContainerCenterBottom: boolean;
  let isContainerCenterBottomInner: boolean;
  let isInner: boolean;

  let isAutosize: boolean;

  let paneWidth: string;
  let paneHeight: string;

  let minWidth: string;
  let minHeight: string;

  let marginLeft: string;
  let marginRight: string;

  let showGrip: boolean;

  let dropArea: string;
  let dropZone: string;
  let dropAreaHidden: boolean;

  // let dropAllowed: FlagIndex;
  let hasDropAllowed: boolean;

  // let dropDenined: FlagIndex;
  let hasDropDenied: boolean;

  let dropAllowedAll: boolean;

  let dividerDrop: boolean;
  let dividerDropSide: string;

  let insertDropNo: boolean;

  let isWindowResizing: boolean;
  let paneSizeNow;

  $: props = pane.props;

  $: children = pane.children;
  $: hasChildren = children && children.length > 0;
  $: childCount = hasChildren ? children.length : 0;

  $: panesList = props?.groupType === PaneGroupType.TABS ? pane.children : [];
  $: hasTabs = panesList !== undefined && panesList.length > 1;

  $: parent = getParentById(pane.id);

  $: parentProps = {};
  $: {
    if (parent && parent.props !== undefined) {
      parentProps = parent.props;
    }
  }

  $: prev = getPrevById(pane.id);
  $: next = getNextById(pane.id);

  $: prevProps = prev ? prev.props : null;
  $: nextProps = next ? next.props : null;

  $: dividerOrientation = isHGroup(parent)
    ? Orientation.VERTICAL
    : Orientation.HORIZONTAL;

  // $: isClosed =
  //   props.isClosed ||
  //   (parent?.type === PANE_TYPE_GROUP && parentProps.isClosed === true);

  $: borderAdjust = 0;
  $: {
    if (parent && parent.children && parent.children.length > 0) {
      borderAdjust =
        ((parent.children.length - 1) * DIVIDER_SIZE) / parent.children.length;
    }
  }

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

  // $: isAutosize =
  //   pane.props.hasAutosize ||
  //   pane.size === "auto" ||
  //   !parent ||
  //   (parent.placement !== Placement.CONTAINER &&
  //     parent.placement !== Placement.CONTAINER_CENTER);

  $: {
    paneSize = `${isHGroup(parent) ? PANE_MIN_WIDTH : PANE_MIN_HEIGHT}px`;
    // if (isClosed && !parentProps.isClosed) {
    //   paneSize = `${PANE_CLOSED_SIZE}px`;
    // } else {
    if (pane.size === "auto" || pane.size === undefined) {
      // paneSize = "auto";
    } else {
      if (pane.size !== undefined && pane.size !== "auto") {
        paneSize = `calc(${pane.size}px - ${borderAdjust}px)`;
      }
      if (/%$/.test(pane.size as string)) {
        paneSize = `calc(${pane.size} - ${borderAdjust}px)`;
      }
    }
    // }
  }
  $: paneMinSize = isHGroup(parent) ? PANE_MIN_WIDTH : PANE_MIN_HEIGHT;

  $: paneWidth = isHGroup(parent) ? paneSize : `100%`;
  $: paneHeight = isVGroup(parent) ? paneSize : "100%";

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

  $: marginLeft = `0px`;
  $: marginRight = `0px`;

  $: showGrip = false;

  $: dropArea = dropArea || "none";
  $: dropZone = "none";
  $: dropAreaHidden = false;

  // $: dropAllowed = props.dropAllowed || {};
  // $: dropDenined = props.dropDenied || {};

  // $: hasDropAllowed = typeof props.dropAllowed === "object";
  // $: hasDropDenied = !hasDropAllowed && typeof props.dropDenied === "object";

  $: dropAllowedAll = !hasDropAllowed && !hasDropDenied;

  $: dividerDrop = false;
  $: dividerDropSide = "none";

  $: {
    if (isHGroup(parent)) {
      dividerDropSide = "left-after";
    } else if (isVGroup(parent)) {
      dividerDropSide = "bottom-before";
    }
  }

  $: isWindowResizing = false;
  $: paneSizeNow = null;

  $: {
    // console.log($allowSplitContext, pane.id);
  }
</script>

{#if pane !== undefined}
  {#if pane.type === PaneType.PANE}
    <SplitEdge
      {pane}
      disabled={!$allowSplitContext}
      allowDrop={[DND.INSERT_OBJECT, DND.SHEET_TAB]}
    >
      <PaneSingle {pane} />
    </SplitEdge>
  {:else if pane.type === PaneType.GROUP}
    <SplitEdge
      {pane}
      disabled={!$allowSplitContext}
      allowDrop={[DND.INSERT_OBJECT, DND.SHEET_TAB]}
    >
      <PaneGroup {pane} />
    </SplitEdge>
  {/if}

  {#if getNextById(pane.id) && (isHGroup(parent) || isVGroup(parent))}
    <PaneDivider
      {pane}
      isDropping={dividerDrop}
      orientation={dividerOrientation}
      dropSide={dividerDrop ? dividerDropSide : "none"}
      dropNotAllowed={insertDropNo}
      class={clsx("after-group")}
      data-dndtype="after-group"
      allowDrop={[DND.INSERT_OBJECT, DND.SHEET_TAB]}
      size={3}
    />

    <!--
      isPaneClosed={props.isClosed}
      isPrevClosed={prevProps && prevProps.isClosed}
      isNextClosed={nextProps && nextProps.isClosed}
      isNoResize={isInner && props.isClosed} -->
    <!-- {dividerHandlers} -->
  {/if}
{/if}

<style lang="postcss">
</style>
