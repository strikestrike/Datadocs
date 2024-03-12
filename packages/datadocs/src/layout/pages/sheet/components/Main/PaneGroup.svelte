<script lang="ts">
  import type { Pane, PaneProps } from "src/layout/types/pane";
  import {
    DIVIDER_SIZE,
    PANE_MIN_HEIGHT,
    PANE_MIN_WIDTH,
  } from "src/layout/constants/size";
  import clsx from "clsx";
  import { getContext, setContext } from "svelte";
  import {
    FixedContainerPane,
    ContainerEmbedded,
    ContainerSpreadsheet,
    ContainerTiled,
  } from "../Container";
  import { ContainerTab } from "src/layout/components/Container";
  import { writable } from "svelte/store";
  import type { Writable } from "svelte/store";
  // import CustomContainerPane from "src/components/dashboard/Dashboard/containers/CustomContainerPane.svelte";
  import ContainerPane from "./index.svelte";
  import { useLayoutSheet } from "src/layout/store/pane";
  import { PaneType } from "src/layout/enums/pane";
  import Plus from "src/layout/components/Container/src/ContainerTab/Plus.svelte";

  /**
   *The Pane to be rendered
   * @type {Pane}
   */
  export let pane: Pane = null;

  const {
    isVGroup,
    isHGroup,
    getParentById,
    isTabsGroup,
    isFixedGroup,
    isEmbeddedGroup,
    isSpreadSheetGroup,
    isTiledGroup,
    getNextById,
    getSizeById,
  } = useLayoutSheet();

  let focusPause = writable<boolean>(false);
  if (pane.placement === "container:center") {
    setContext("focusPause", focusPause);
  }

  let splitDataParent = getContext<Writable<any>>("splitData");

  let paneSize: string;
  let parentProps: PaneProps;
  let elementRoot: HTMLElement = null;

  $: borderAdjust = 0;
  $: props = pane.props;
  $: parent = getParentById(pane.id);
  $: parentProps = {};
  $: {
    if (parent && parent.props !== undefined) {
      parentProps = parent.props;
    }
  }
  // $: isAutosize =
  //   pane.props.hasAutosize ||
  //   pane.size === "auto" ||
  //   !parent ||
  //   (parent.placement !== PLACEMENT_CONTAINER &&
  //     parent.placement !== PLACEMENT_CONTAINER_CENTER);
  $: {
    // paneSize = `${parentProps.isHGroup ? PANE_MIN_WIDTH : PANE_MIN_HEIGHT}px`;
    // if (pane.size === "auto" || pane.size === undefined) {
    //   // paneSize = "100%";
    // } else {
    //   if (pane.size !== undefined && pane.size !== "auto") {
    //     paneSize = `calc(${pane.size}px - ${borderAdjust}px)`;
    //   }
    //   if (/%$/.test(pane.size as string)) {
    //     paneSize = `calc(${pane.size} - ${borderAdjust}px)`;
    //   }
    // }
    paneSize = getSizeById(pane.id);
  }
  $: {
    if (parent && parent.children && parent.children.length > 0) {
      borderAdjust =
        ((parent.children.length - 1) * DIVIDER_SIZE) / parent.children.length;
    }
  }
  $: paneWidth = isHGroup(parent) ? paneSize : `100%`;
  $: paneHeight = isVGroup(parent) ? paneSize : "100%";
  // $: panesList = props?.groupType === PANE_GROUP_TABS ? pane.children : [];
  // $: activeIndex = props.activeChild;
  // $: isInner = /:inner/.test(pane.placement);
  // $: paneContent = pane.content;

  function getStyle() {
    return clsx(
      `pane pane-group box-border`,
      // parentProps.isTabsGroup && "pane-tabbed",
      // isClosed && "closed",
      isHGroup(pane) && "h-group",
      isVGroup(pane) && "v-group",
      isHGroup(parent) && isTabsGroup(pane) && "vertical-tabs",
      // parentProps.isVGroup && isTabsGroup(pane) && "horizontal-tabs",
      isFixedGroup(pane) && "fixed-group",
      isTiledGroup(pane) && "custom-group",
      // parentProps.isFixedGroup && "fixed-item",
      // props.isMovedPane && "zero-size",
      // isAutosize ? "auto-size" : "normal-size",
      // isContainerCenterBottom && "pane-center-bottom",
      getNextById(pane.id) === null && "last-pane",
      "w-full",
      "h-full",
      // paneElement != null && paneElement === activeDrag.source && "dnd-source"
    );
  }

  function onMouseLeave() {
    focusPause.set(true);
  }

  function onMouseEnter() {
    focusPause.set(false);
  }

  $: {
  }
</script>

<div
  id={pane.id}
  data-type={PaneType.GROUP}
  data-dndtype="pane-group"
  data-placement={pane.placement}
  class={clsx(getStyle())}
  style={!pane.placement.includes("main")
    ? `width: ${paneWidth};height: ${paneHeight};`
    : ""}
  bind:this={elementRoot}
  on:mouseleave={onMouseLeave}
  on:mouseenter={onMouseEnter}
>
  {#if isHGroup(pane) || isVGroup(pane)}
    {#each pane.children as innerPane, i (innerPane.id)}
      <ContainerPane pane={innerPane} />
    {/each}
  {:else if isTabsGroup(pane)}
    <ContainerTab {pane} let:item>
      <ContainerPane pane={item} />
      <Plus slot="extra" {pane} />
    </ContainerTab>
  {:else if isFixedGroup(pane)}
    <FixedContainerPane
      {pane}
      children={pane.children}
      groupType={props.groupType}
    />
  {:else if isEmbeddedGroup(pane)}
    <ContainerEmbedded {pane} />
  {:else if isSpreadSheetGroup(pane)}
    <ContainerSpreadsheet {pane} />
  {:else if isTiledGroup(pane)}
    <ContainerTiled {pane} />
  {/if}
</div>

<style lang="postcss">
  .pane {
    @apply max-h-full max-w-full relative;
    /* @apply border default-border; */

    /* new design remove all border */
    border: 0px;
  }

  /*
    Pane should have box shadow around them but not pane-group,
    because they will stack on each other and make box shadow
    around pane have darker color
  */
  :global(.workbook-sheets) .pane:not(.pane-group) {
    box-shadow: 0px 1px 6px rgba(55, 84, 170, 0.16);
  }

  /* Vertical and horizontal tabs should have box-shadow as well */
  .pane.horizontal-tabs,
  .pane.vertical-tabs {
    box-shadow: 0px 1px 6px rgba(55, 84, 170, 0.16) !important;
  }

  .pane:not(.pane-container-center-main):not(.pane-group):not(.pane-tabbed) {
    box-shadow: 0px 1px 6px rgba(55, 84, 170, 0.16);
  }

  .pane-group.fixed-item {
    box-shadow: 0px 1px 6px rgba(55, 84, 170, 0.16);
  }

  .pane.pane-group {
    @apply flex relative border-none pointer-events-auto;
  }

  /* .pane.pane-group * {
    @apply pointer-events-auto;
  } */

  .pane.h-group {
    @apply flex-row;
  }

  .pane.v-group {
    @apply flex-col;
  }

  .pane.fixed-group,
  .pane.tiled-group {
    @apply bg-white;
  }

  .pane.auto-size {
    @apply flex-auto;
  }

  .pane.auto-size-grow {
    @apply flex-none;
    @apply flex-grow;
  }

  .pane.auto-size-shrink {
    @apply flex-none;
    @apply flex-shrink;
  }

  /* .pane.pane-group.auto-size {
    @apply flex-auto;
    /* @apply flex-shrink-0;
  } */

  .pane.no-border {
    border-style: none;
  }

  .pane.no-top-bottom-border {
    @apply border-t-0 border-b-0;
  }

  .pane.no-left-right-border {
    @apply border-l-0 border-r-0;
  }

  .pane.pane-center-bottom {
    /* @apply border-l-0 border-r-0; */
    z-index: 999;
    max-width: none;
  }

  .pane.pane-center-bottom.last-pane {
    @apply border-b-0;
  }

  /* .pane.pane-center-bottom:last-child {

  } */

  .pane.horizontal-tabs.moved-pane,
  .pane.horizontal.moved-pane,
  .pane.vertical.inner.moved-pane {
    -webkit-transition: height 250ms ease;
    -moz-transition: height 250ms ease;
    -o-transition: height 250ms ease;
    transition: height 250ms ease;
  }

  .pane.horizontal-tabs.is-closing,
  .pane.horizontal.is-closing {
    -webkit-transition: height 50ms ease;
    -moz-transition: height 50ms ease;
    -o-transition: height 50ms ease;
    transition: height 50ms ease;
  }

  .pane.horizontal-tabs.zero-size,
  .pane.horizontal.zero-size,
  .pane.vertical.inner.zero-size {
    height: 4px !important;
    min-height: 0px !important;
  }

  .pane.vertical-tabs.moved-pane,
  .pane.vertical.moved-pane,
  .pane.horizontal.inner.moved-pane {
    -webkit-transition: width 250ms ease;
    -moz-transition: width 250ms ease;
    -o-transition: width 250ms ease;
    transition: width 250ms ease;
  }

  .pane.vertical-tabs.is-closing,
  .pane.vertical.is-closing {
    -webkit-transition: width 50ms ease;
    -moz-transition: width 50ms ease;
    -o-transition: width 50ms ease;
    transition: width 50ms ease;
  }

  .pane.vertical-tabs.zero-size,
  .pane.vertical.zero-size,
  .pane.horizontal.inner.zero-size {
    width: 4px !important;
    min-width: 0px !important;
  }

  .pane.closed:not(.inner) {
    flex-shrink: 0;
  }

  .pane.closed.horizontal {
    @apply flex flex-row justify-start items-center;
  }

  .pane.closed.vertical {
    @apply flex flex-col justify-start items-center;
  }

  .pane.closed.horizontal.hidden,
  .pane.closed.vertical.hidden {
    display: none;
  }

  .pane.closed .empty-space {
  }

  .pane.closed.horizontal .empty-space {
    @apply w-0 h-full;
    -webkit-transition: width 150ms ease-out;
    -moz-transition: width 150ms ease-out;
    -o-transition: width 150ms ease-out;
    transition: width 150ms ease-out;
  }

  .pane.closed.horizontal .empty-space.show {
    @apply w-1/2;
    -webkit-transition: width 250ms ease-out 500ms;
    -moz-transition: width 250ms ease-out 500ms;
    -o-transition: width 250ms ease-out 500ms;
    transition: width 250ms ease-out 500ms;
  }

  .pane.closed.vertical .empty-space {
    @apply w-full h-0;
    -webkit-transition: height 150ms ease-out;
    -moz-transition: height 150ms ease-out;
    -o-transition: height 150ms ease-out;
    transition: height 150ms ease-out;
  }

  .pane.closed.vertical .empty-space.show {
    @apply h-1/2;
    -webkit-transition: height 250ms ease-out 500ms;
    -moz-transition: height 250ms ease-out 500ms;
    -o-transition: height 250ms ease-out 500ms;
    transition: height 250ms ease-out 500ms;
  }

  .panel-settings {
    @apply w-6;
    height: 14px;
    padding-left: 5px;
    padding-right: 5px;
  }

  .closed-pane {
    @apply bg-white overflow-hidden flex flex-auto;
  }

  .closed-pane.horizontal {
    @apply w-auto h-full flex-row justify-start items-center border-r-0 pr-8;
  }

  .closed-pane.vertical {
    @apply w-full h-auto flex-col justify-start items-center border-b-0 pb-8;
  }

  /* This is now handled by FlexTabs */
  /* .closed-pane .icons {
    @apply flex w-full;
  }

  .closed-pane .icons.horizontal {
    @apply flex-row justify-start items-center;
  }

  .closed-pane .icons.vertical {
    @apply flex-col justify-start items-center;
  }

  .closed-pane .icons .tabs-list {
    @apply flex justify-start items-center;
  }

  .closed-pane .icons .tabs-list.horizontal {
    @apply h-full flex-row pl-2 mr-1;
  }

  .closed-pane .icons .tabs-list.vertical {
    @apply w-full flex-col pt-2 mb-1;
  }

  .closed-pane .icons .view {
    @apply flex flex-row justify-center;
  }

  .closed-pane .icons .view .view-label {
    @apply ml-1 text-13px leading-6;
  } */

  .closed-pane-filler {
    /* @apply flex-auto bg-white overflow-hidden; */
    @apply hidden;
  }

  .closed-pane-filler.vertical {
    /* @apply w-full flex-row justify-start items-center; */
  }

  .closed-pane-filler.horizontal {
    /* @apply h-full flex-col justify-start items-center; */
  }

  .pane.dnd-source {
    background: rgba(80, 88, 93, 0.06);
    border: 1px solid transparent;
    /* border: 1px dashed rgba(80, 88, 93, 0.2); */
  }

  .tabs-open-grip,
  .view-open-grip {
    @apply absolute left-0 top-0 w-full z-50 pointer-events-none;
    -webkit-transition: opacity 250ms ease-out 250ms;
    -moz-transition: opacity 250ms ease-out 250ms;
    -o-transition: opacity 250ms ease-out 250ms;
    transition: opacity 250ms ease-out 250ms;
  }

  .tabs-open-grip.show-grip,
  .view-open-grip.show-grip {
    @apply pointer-events-auto opacity-100;
  }

  :global(.dnd-source-proxy) {
    opacity: 1;
    pointer-events: none;
    position: absolute;
    /* margin-left: calc(width / 2);
    margin-top: calc(height / 2); */
  }

  :global(.dnd-source-copy) {
    position: absolute;
    left: 0;
    top: 0;
  }

  :global(.pane.dnd-source-copy) {
    z-index: 999;
  }

  :global(.active-drag) {
  }

  :global(.active-drag-item) {
  }

  :global(.dnd-item) {
  }

  .active-drag
    :not(.dnd-target):not(.dnd-item):not(.drop-zone):not(.closed-pane) {
    pointer-events: none;
  }

  .active-drag :global(.dnd-target),
  .active-drag :global(.dnd-item) {
    pointer-events: all;
  }

  /* .closed-pane.horizontal.dnd-source {
    @apply bg-panels-bg;
    background: rgba(80, 88, 93, 0.06);
    border: 1px dashed rgba(80, 88, 93, 0.2);
  }

  .closed-pane.vertical.dnd-source {
    @apply bg-panels-bg;
    background: rgba(80, 88, 93, 0.06);
    border: 1px dashed rgba(80, 88, 93, 0.2);
  }

  .closed-pane.dnd-source > :global(*) {
    visibility: hidden;
  } */

  :global(.pane-closed.dnd-source-proxy),
  :global(.pane-open.dnd-source-proxy) {
    /* @apply bg-white;
    box-shadow: 1px 2px 4px rgba(55, 84, 170, 0.12);
    border-radius: 3px; */
  }

  /* :global(.closed-pane.dnd-source-proxy)
    :global(.dnd-source-copy)
    :global(.pane-grip) {
    visibility: hidden;
  } */

  /* :global(.closed-pane.dnd-source-proxy)
    :global(.dnd-source-copy)
    :global(.open-box) {
    visibility: hidden;
  } */

  /* :global(.closed-pane.dnd-source-proxy) :global(.dnd-source-copy),
  :global(.closed-pane.dnd-source-proxy)
    :global(.dnd-source-copy)
    :global(.tabs-list) {
    background-color: transparent;
  } */

  :global(.dnd-source-copy) :global(.tabs-list) {
    -webkit-transition: all 100ms ease-out;
    -moz-transition: all 100ms ease-out;
    -o-transition: all 100ms ease-out;
    transition: all 100ms ease-out;
    background-color: transparent;
  }

  :global(.pane.dnd-source-copy) :global(.tabs-list) {
    -webkit-transition:
      transform 100ms ease-out,
      opacity 100ms ease-out;
    -moz-transition:
      transform 100ms ease-out,
      opacity 100ms ease-out;
    -o-transition:
      transform 100ms ease-out,
      opacity 100ms ease-out;
    transition:
      transform 100ms ease-out,
      opacity 100ms ease-out;
  }

  :global(.pane.dnd-source-copy) :global(.tab-active-content) {
    -webkit-transition: height 100ms ease-out 40ms;
    -moz-transition: height 100ms ease-out 40ms;
    -o-transition: height 100ms ease-out 40ms;
    transition: height 100ms ease-out 40ms;
  }

  :global(.pane.dnd-source-copy) :global(.pane-options),
  :global(.pane.dnd-source-copy) :global(.panel-open-box),
  :global(.pane.dnd-source-copy) :global(.closed-pane) {
    opacity: 0;
  }

  /* :global(.closed-pane.dnd-source-proxy.picked) {
  }

  :global(.closed-pane.dnd-source-proxy.vertical.picked) :global(.tabs-list) {
    transform: translateY(-40px);
    opacity: 0;
  }

  :global(.closed-pane.dnd-source-proxy.horizontal.picked) :global(.tabs-list) {
    transform: translateX(-40px);
    opacity: 0;
  } */

  :global(.pane.dnd-source-copy.picked) :global(.tabs-list) {
    transform: translateX(40px);
    opacity: 0;
  }

  :global(.pane.dnd-source-copy.picked) :global(.tab-active-content) {
    flex-grow: 0;
    flex-shrink: 1;
    height: 0;
  }

  :global(.pane-open.dnd-source-proxy.picked)
    :global(.drag-pane-dummy-open)
    :global(.drag-pane-dummy-tab.dummy-tab-2),
  :global(.pane-closed.dnd-source-proxy.picked)
    :global(.drag-pane-dummy-closed)
    :global(.drag-pane-dummy-tab.dummy-tab-2) {
    transform: translateY(0px);
  }
  :global(.pane-open.dnd-source-proxy.picked)
    :global(.drag-pane-dummy-open)
    :global(.drag-pane-dummy-tab.dummy-tab-3),
  :global(.pane-closed.dnd-source-proxy.picked)
    :global(.drag-pane-dummy-closed)
    :global(.drag-pane-dummy-tab.dummy-tab-3) {
    transform: translateY(0px);
  }

  .pane-closed.dnd-source-proxy.removed,
  .pane-open.dnd-source-proxy.removed,
  :global(.dnd-source-proxy.drag-pane-dummy-main.removed) {
    -webkit-transition: all 100ms ease-out;
    -moz-transition: all 100ms ease-out;
    -o-transition: all 100ms ease-out;
    transition: all 100ms ease-out;
    opacity: 0.4;
  }

  .pane.dnd-source > :global(*) {
    visibility: hidden;
  }

  .pane.dnd-source-proxy {
    @apply border default-border;
    -webkit-transition:
      transform 60ms ease-out,
      opacity 60ms ease-out;
    -moz-transition:
      transform 60ms ease-out,
      opacity 60ms ease-out;
    -o-transition:
      transform 60ms ease-out,
      opacity 60ms ease-out;
    transition:
      transform 60ms ease-out,
      opacity 60ms ease-out;
  }

  .pane.dnd-source-proxy :global(*) {
    pointer-events: none;
  }

  .pane.dnd-source-proxy .tabs-open-grip,
  .pane.dnd-source-proxy .view-open-grip {
    @apply pointer-events-none opacity-100;
  }

  .drop-zone {
    @apply absolute pointer-events-none bg-transparent;
    z-index: 999999;
    -webkit-transition: all 250ms ease-out;
    moz-transition: all 250ms ease-out;
    -o-transition: all 250ms ease-out;
    transition: all 250ms ease-out;
    /* background: rgba(80, 88, 93, 1); */
  }
  .drop-zone.none {
    @apply opacity-0 bg-transparent;
    -webkit-transition: none;
    moz-transition: none;
    -o-transition: none;
    transition: none;
  }
  /*
    North dropzone is not required. This
    will be handled by FlexTabs
  */
  .drop-zone.north {
    @apply opacity-100 pointer-events-auto;
    top: 0px;
    left: 0px;
    right: 0px;
    height: var(--drop-size-north);
  }
  .drop-zone.south {
    @apply opacity-100 pointer-events-auto;
    bottom: 0px;
    left: 0px;
    right: 0px;
    height: var(--drop-size);
  }
  .drop-zone.west {
    @apply opacity-100 pointer-events-auto;
    left: 0px;
    top: 0px;
    bottom: 0px;
    width: var(--drop-size);
  }
  .drop-zone.east {
    @apply opacity-100 pointer-events-auto;
    right: 0px;
    top: 0px;
    bottom: 0px;
    width: var(--drop-size);
  }

  .drop-area {
    @apply absolute pointer-events-none bg-transparent opacity-0 z-50;
    border: 4px solid transparent;
    z-index: 9999;
    /* width 250ms ease-out, height 250ms ease-out,
      top 250ms ease-out, left 250ms ease-out, */
    -webkit-transition: opacity 300ms ease-out;
    moz-transition: opacity 300ms ease-out;
    -o-transition: opacity 300ms ease-out;
    transition: opacity 300ms ease-out;
  }
  .drop-area.none {
    border: 4px solid transparent;
    /* -webkit-transition: none;
    moz-transition: none;
    -o-transition: none;
    transition: none; */
  }
  .drop-area.north {
    @apply opacity-100;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 4px;
    /* max-height: 30px; */
    min-height: 4px;
    border: 2px solid #3bc7ff;
    /* background: rgba(80, 88, 93, 0.1); */
  }
  .drop-area.south {
    @apply opacity-100;
    top: calc(100% - 4px);
    left: 0px;
    width: 100%;
    height: 4px;
    /* max-height: 30px; */
    min-height: 4px;
    border: 2px solid #3bc7ff;
    /* background: rgba(80, 88, 93, 0.1); */
  }
  .drop-area.west {
    @apply opacity-100;
    top: 0px;
    left: 0px;
    width: 4px;
    height: 100%;
    min-width: 4px;
    border: 2px solid #3bc7ff;
    /* background: rgba(80, 88, 93, 0.1); */
  }
  .drop-area.east {
    @apply opacity-100;
    top: 0px;
    left: calc(100% - 4px);
    width: 4px;
    height: 100%;
    min-width: 4px;
    border: 2px solid #3bc7ff;
    /* background: rgba(80, 88, 93, 0.1); */
  }
  .drop-area.center {
    @apply opacity-100;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    border: 4px solid #3bc7ff;
    /* background: rgba(80, 88, 93, 0); */
  }

  .drop-area.north-edge {
    @apply opacity-100 border-none;
    top: 0;
    left: 0px;
    width: 100%;
    height: 4px;
    background: #3bc7ff;
  }
  .drop-area.south-edge {
    @apply opacity-100 border-none;
    bottom: 0;
    left: 0px;
    width: 100%;
    height: 4px;
    background: #3bc7ff;
  }
  .drop-area.west-edge {
    @apply opacity-100 border-none;
    top: 0px;
    left: 0;
    width: 4px;
    height: 100%;
    background: #3bc7ff;
  }
  .drop-area.east-edge {
    @apply opacity-100 border-none;
    top: 0px;
    right: 0;
    width: 4px;
    height: 100%;
    background: #3bc7ff;
  }

  .drop-area.no-drop {
    border-color: #ea4821;
  }

  /* .drop-area.drop-limited.north,
  .drop-area.drop-limited.south {
    top: -36px;
    height: 36px;
  }
  .drop-area.drop-limited.south {
    top: 100%;
  }

  .drop-area.drop-limited.west,
  .drop-area.drop-limited.east {
    left: -36px;
    width: 36px;
  }
  .drop-area.drop-limited.east {
    left: 100%;
  }

  .pane.closed .drop-area.drop-limited.north,
  .pane.closed .drop-area.drop-limited.south {
    top: -18px;
    height: 18px;
  }
  .pane.closed .drop-area.drop-limited.south {
    top: 100%;
  }

  .pane.closed .drop-area.drop-limited.west,
  .pane.closed .drop-area.drop-limited.east {
    left: -18px;
    width: 18px;
  }
  .pane.closed .drop-area.drop-limited.east {
    left: 100%;
  } */

  .drop-area.hide {
    @apply opacity-0;
  }

  .size-info {
    @apply absolute left-0 top-0 w-full h-full flex justify-center items-center pointer-events-none;
    z-index: 100000;
  }

  .size-info-text {
    @apply text-sm p-2 opacity-0;
    -webkit-transition: opacity 250ms ease-out;
    moz-transition: opacity 250ms ease-out;
    -o-transition: opacity 250ms ease-out;
    transition: opacity 250ms ease-out;
  }

  .size-info-text.info-shown {
    @apply opacity-100;
  }

  .pane.dnd-source :global(.size-info) {
    display: none;
  }

  .panel-collapse-box {
    @apply w-3 h-3 flex flex-row justify-center items-start pointer-events-auto;
    /* padding: 0 1px; */
  }

  .panel-collapse-box.bottom {
    @apply justify-end;
  }

  :global(.collapse-left) {
    transform: rotate(-180deg);
  }

  :global(.collapse-bottom) {
    /* transform: translate(-2px, 0px) rotate(90deg); */
    transform: rotate(90deg);
  }

  .panel-open-box {
    display: flex;
    background-color: transparent;
    pointer-events: none;
  }

  .panel-open-box.hidden {
    display: none;
  }

  .pane-options-hidden :global(*),
  .panel-open-box-hidden :global(*) {
    opacity: 0;
    -webkit-transition: opacity 200ms ease;
    -moz-transition: opacity 200ms ease;
    -o-transition: opacity 200ms ease;
    transition: opacity 200ms ease;
  }

  .pane-options-hidden:hover :global(*),
  .panel-open-box-hidden:hover :global(*) {
    opacity: 100;
  }

  .panel-open-box-left-right {
    width: 100%;
    flex-direction: row;
    position: absolute;
    @apply top-0 left-0 right-0 h-3;
  }

  .panel-open-box-bottom {
    height: 100%;
    flex-direction: column;
    justify-content: flex-start;
    position: absolute;
    top: 0px;
    bottom: 0px;
    right: 0px;
  }

  .panel-open-box-left {
    justify-content: flex-end;
  }

  .panel-open-box-right {
    justify-content: flex-end;
  }

  .panel-collapse-icon {
    @apply w-3 h-3 p-0.5 cursor-pointer;
    /* background-color: transparent; */
    background-color: white;

    /* -webkit-filter: drop-shadow(0px 0px 10px rgba(0, 0, 0, 0.3));
    filter: drop-shadow(0px 0px 10px rgba(0, 0, 0, 0.3)); */

    box-shadow: 0px 0px 10px 0 0 10px rgba(55, 84, 170, 0.2);
    -webkit-box-shadow: 0 0 10px rgba(55, 84, 170, 0.2);
  }

  .panel-collapse-icon:hover {
    /* box-shadow: 0px 1px 6px rgba(55, 84, 170, 0.12); */

    /* -webkit-filter: drop-shadow(0px 0px 5px rgba(0, 0, 0, 0.4));
    filter: drop-shadow(0px 0px 5px rgba(0, 0, 0, 0.4)); */
    /* background-color: white; */

    box-shadow: 0 0 5px rgba(55, 84, 170, 0.3);
    -webkit-box-shadow: 0 0 5px rgba(55, 84, 170, 0.3);
  }

  :global(.open-left) {
    /* margin-left: 3px; */
  }

  :global(.open-right) {
    transform: rotate(-180deg);
    /* margin-right: 3px; */
  }

  :global(.open-bottom) {
    transform: rotate(-90deg);
  }

  .hidden-holder {
    display: none;
  }
</style>
