<!-- @component
@packageModule(layout/FlexTab)
-->
<script lang="ts">
  import clsx from "clsx";

  import { getContext } from "svelte";
  import { GLOBAL_CONTEXT } from "../core/constants";
  import type { GlobalContext } from "../types";
  import Icon from "src/components/common/icons/Icon.svelte";

  let tabElement = null;

  const clickAllowed = false;

  export let pane;

  export let tab;
  export let tabIndex = -1;
  export let activeIndex = -1;

  export let tabClass = "";

  export let tabLabelClass = "";

  export let iconSize;
  export let showIcon = false;
  export let showLabel = true;
  export let showLabelAlso = false;

  export let isActive = false;

  export let activeFillColor = "";

  export let dragHandlers = null;

  export let dragSource = null;

  export let data = {};

  export let title = "";
  export let paneOrientation = "";

  const globalContext: GlobalContext = getContext(GLOBAL_CONTEXT);

  const dndContext: any = globalContext.dndContext;

  const activeDrag = dndContext.drag;

  $: zIndexVariable = `--left-active-tab-zindex: ${
    tabIndex + 1
  };--right-active-tab-zindex: ${100 - tabIndex};`;

  $: flexTabStyle =
    isActive && dragSource !== tabElement
      ? "color: var(--tabs-active-color);"
      : zIndexVariable;

  $: {
    if (dragHandlers === null) {
      dragHandlers = () => {};
    }
  }

  $: {
    console.log(pane);
  }
</script>

{#if tab !== undefined}
  <div
    {...$$restProps}
    class={clsx(
      "flex-tab",
      showLabel && "show-label",
      showLabelAlso && "show-label-also",
      showIcon && "show-icon",
      isActive && "tab-active",
      tabElement !== null && dragSource === tabElement && "dnd-source",
      tabClass,
      $$restProps.class
    )}
    style={flexTabStyle}
    bind:this={tabElement}
    use:dragHandlers
    use:globalContext.actions.tabAction={[
      pane,
      tab,
      tabIndex,
      paneOrientation,
      title || tab.label,
      $activeDrag.isMouseDown,
      showIcon,
    ]}
    on:mousedown
    {...data}
  >
    <div class="tab-icon w-full h-full relative">
      <div class="tab-icon-container">
        <Icon
          icon={tab.icon}
          size={iconSize}
          fill={"#0E0121"}
          class="tab-icon-svg"
        />
      </div>
      <div class="tab-icon-mask" />
    </div>

    <div class="tab-label {tabLabelClass}">
      <div class="tab-label-inner">
        {tab.label}
      </div>

      <div class="corner-container">
        <div class="left-corner">
          <svg
            width="4px"
            height="4px"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 100 0 A 100 100, 0, 0, 1, 0 100 L 100 100 Z"
              fill="white"
            />

            <path
              d="M 100 0 A 100 100, 0, 0, 1, 0 100 L 100 100 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        <div class="right-corner">
          <svg
            width="4px"
            height="4px"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 100 0 A 100 100, 0, 0, 1, 0 100 L 100 100 Z"
              fill="white"
              transform="scale(-1,1) translate(-100,0)"
            />

            <path
              d="M 100 0 A 100 100, 0, 0, 1, 0 100 L 100 100 Z"
              fill="currentColor"
              transform="scale(-1,1) translate(-100,0)"
            />
          </svg>
        </div>
      </div>

      <div class="label-box-shadow-border" />
    </div>
  </div>
{/if}

<style lang="postcss">
  .flex-tab {
    @apply inline-flex flex-row justify-center items-center flex-shrink-0 flex-grow-0 h-full;
  }

  .flex-tab > :global(*) {
    pointer-events: none;
  }

  .flex-tab.show-label {
    @apply flex flex-row flex-grow-0 justify-start items-center h-full border-transparent flex-shrink whitespace-nowrap text-tabs-normal-color;
    /* color: #a7b0b5; */
  }

  .flex-tab.show-label:not(.tab-active) {
    min-width: 10px;
    z-index: var(--left-active-tab-zindex);
  }

  /* .flex-tab.show-label.show-border {
    @apply default-border;
    border-left-color: transparent;
    border-top-color: transparent;
    border-bottom-color: transparent;
  } */

  .flex-tab.show-label.tab-active {
    @apply flex-shrink-0 justify-center z-10 text-tabs-active-color;
    margin-top: -4px;
    height: 29px;
    z-index: 999;
  }

  .flex-tab.show-label .tab-label {
    @apply h-full;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    background-color: white;
  }

  .flex-tab.show-label:not(:last-child) .tab-label {
    margin-right: 1px;
  }

  .flex-tab.show-label .tab-label-inner {
    @apply flex flex-row items-center align-middle px-3 w-full h-full;
    border-top-left-radius: 4px !important;
    border-top-right-radius: 4px !important;
    background-color: #f7f9fa;
    border-bottom: none;
    font-weight: 500;
  }

  .flex-tab.show-label.tab-active .tab-label-inner {
    @apply bg-white;
    box-shadow: 0px 0px 4px rgba(55, 84, 170, 0.16);
    font-weight: 600;
    margin-bottom: -2px;
    padding-bottom: 2px;
    height: calc(100% + 2px);
    clip-path: inset(-10px -15px 2px -15px);
  }

  .flex-tab.show-label.tab-active .tab-label {
    @apply font-medium;
  }

  .tab-label .left-corner {
    position: absolute;
    width: 4px;
    height: 4px;
    bottom: 0px;
    left: -4px;
    z-index: 10;
  }

  .tab-label .right-corner {
    position: absolute;
    width: 4px;
    height: 4px;
    bottom: 0px;
    right: -4px;
    z-index: 10;
  }

  .tab-label .left-corner svg {
    filter: drop-shadow(-0.4px -0.4px 0.2px rgb(55 84 170 / 2%));
  }

  .tab-label .right-corner svg {
    filter: drop-shadow(0.6px -0.4px 0.2px rgb(55 84 170 / 2%));
  }

  .flex-tab.show-label .corner-container {
    opacity: 1;
    color: #f7f9fa;
  }

  .flex-tab.show-label:not(.tab-active):not(.active-drag-item):hover
    .corner-container {
    color: rgba(80, 88, 93, 0.12);
  }

  .flex-tab.show-label.tab-active .corner-container {
    color: white;
  }

  .flex-tab.show-label:not(.tab-active) .label-box-shadow-border {
    position: absolute;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    background-color: transparent;
    top: 0px;
    bottom: 0px;
    right: 0px;
    left: 0px;
    box-shadow: 0px 0px 4px rgba(55, 84, 170, 0.16);
  }

  :global(.flex-tab.show-label.tab-active)
    ~ .flex-tab.show-label:not(.tab-active) {
    direction: rtl;
    z-index: var(--right-active-tab-zindex);
  }

  :global(.drag-pane-dummy-tab) .flex-tab.show-label.tab-active {
    margin: 0;
  }

  :global(.drag-pane-dummy-tab) .flex-tab.show-label .corner-container {
    /* not show corner on pane dummy tab */
    opacity: 0;
  }

  :global(.drag-pane-dummy-tab) .flex-tab.show-label .tab-label-inner {
    box-shadow: none;
  }

  .flex-tab.show-icon {
    background: transparent;
    /* Datadocs Blue */
    border: 1px solid transparent;
    border-radius: 3px;
    -webkit-transition: border 250ms ease-out, background 250ms ease-out,
      opacity 250ms ease-out;
    -moz-transition: border 250ms ease-out, background 250ms ease-out,
      opacity 250ms ease-out;
    -o-transition: border 250ms ease-out, background 250ms ease-out,
      opacity 250ms ease-out;
    transition: border 250ms ease-out, background 250ms ease-out,
      opacity 250ms ease-out;
  }

  .flex-tab.show-icon:not(.active-drag-item):hover {
    /* @apply icon-hover-bg; */
    background: rgba(80, 88, 93, 0.06);
    border-radius: 3px;
  }

  .flex-tab.show-label:not(.tab-active):not(.active-drag-item):hover
    .tab-label-inner {
    /* background: #e6e6e6; */
    background: rgba(80, 88, 93, 0.12);
  }

  .flex-tab.show-label:not(.tab-active):not(.active-drag-item):hover
    .tab-label-inner {
    color: #a7b0b5;
  }

  /* .flex-tab.with-padding {
    @apply px-2;
  } */

  .tab-icon {
    @apply justify-center items-center;
    /* border: 1px dashed rgba(80, 88, 93, 0.2); */
    /* box-sizing: border-box; */
    border-radius: 3px;
  }

  .tab-icon,
  .tab-label {
    display: none;
  }

  .tab-icon .tab-icon-container {
    display: inline-flex;
  }

  .flex-tab.active .tab-label {
    font-weight: 500;
  }

  .flex-tab.dnd-source {
    background: rgba(80, 88, 93, 0.06);
    border-radius: 3px;
  }

  .flex-tab.dnd-source.show-icon {
    background: transparent;
  }

  .flex-tab.dnd-source .tab-icon-container {
    visibility: hidden;
  }

  .flex-tab.dnd-source.show-label {
    /* visibility: hidden; */
    background: rgba(80, 88, 93, 0.06);
    color: rgb(80, 88, 93, 0.2);
  }

  .flex-tab.dnd-source.off-tabs.show-label {
    visibility: visible;
  }

  .flex-tab.dnd-source.off-tabs.show-label {
    visibility: visible;
    height: 25px;
    width: auto;
    margin: 0;
    background: rgba(80, 88, 93, 0.06);
    opacity: 1;
  }

  .flex-tab.tab-active.dnd-source.off-tabs.show-label {
    height: 29px;
    margin-top: -4px;
  }

  .flex-tab.dnd-source.off-tabs.show-label .tab-label {
    @apply font-medium;
    color: rgb(80, 88, 93, 0.2);
  }

  .flex-tab.dnd-source.show-icon.off-tabs .tab-icon-mask {
    background: rgba(80, 88, 93, 0.06);
    border: 1px solid rgba(80, 88, 93, 0.2);
    box-sizing: border-box;
    border-radius: 3px;
  }

  .flex-tab.dnd-source.show-icon.off-tabs .tab-icon-container {
    opacity: 0;
  }

  .flex-tab.dnd-source-proxy.show-icon,
  .flex-tab.dnd-source-proxy.show-label {
    -webkit-transition: transform 250ms ease-out, opacity 250ms ease-out,
      width 4250ms ease-out;
    -moz-transition: transform 250ms ease-out, opacity 250ms ease-out,
      width 4250ms ease-out;
    -o-transition: transform 250ms ease-out, opacity 250ms ease-out,
      width 4250ms ease-out;
    transition: transform 250ms ease-out, opacity 250ms ease-out,
      width 4250ms ease-out;
  }

  :global(.flex-tab) :global(.dnd-source-proxy) {
    pointer-events: none;
    /* z-index: 99999; */
  }

  .flex-tab.dnd-source-proxy.show-label {
    @apply text-tabs-active-color;
  }

  .flex-tab.dnd-source-proxy.off-tabs.show-label {
    @apply text-tabs-active-color;
  }

  .flex-tab.dnd-source-proxy.show-label.picked {
    height: 25px;
    white-space: nowrap;
  }

  .flex-tab.tab-active.dnd-source-proxy.show-label.picked {
    height: 29px;
    margin-top: 0px;
  }

  .flex-tab.dnd-source-proxy.show-label.removed {
    -webkit-transition: all 100ms ease-out;
    -moz-transition: all 100ms ease-out;
    -o-transition: all 100ms ease-out;
    transition: all 100ms ease-out;
    opacity: 0.4;
  }

  .flex-tab.dnd-source-proxy.show-label.removed-alt {
    -webkit-transition: left 100ms ease-out, top 100ms ease-out;
    -moz-transition: left 100ms ease-out, top 100ms ease-out;
    -o-transition: left 100ms ease-out, top 100ms ease-out;
    transition: left 100ms ease-out, top 100ms ease-out;
    /* opacity: 0.4; */
  }

  .flex-tab.dnd-source-proxy.show-icon {
    /* New Style */
    background: #ffffff;
    box-shadow: 1px 2px 6px rgba(55, 84, 170, 0.16);
    border-radius: 3px;
  }

  :global(.flex-tab.dnd-source.show-icon.dummy) {
    /* New Style */
    background: rgba(80, 88, 93, 0.06);
    border-radius: 3px;
  }

  :global(.flex-tab.dnd-source.show-label.dummy) {
    background: rgba(80, 88, 93, 0.06);
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    border-bottom-left-radius: 0px;
    border-bottom-right-radius: 0px;
  }

  :global(.flex-tab.dnd-source.show-icon.dummy) .tab-icon-mask {
    background: rgba(59, 199, 255, 0.1);
    border: 1px solid rgba(59, 199, 255, 0.5);
    border-radius: 3px;
  }

  :global(.flex-tab.dnd-source.show-label.dummy) .tab-label {
    @apply text-tabs-normal-color;
  }

  :global(.flex-tab.dnd-source.tab-active.show-label.dummy) .tab-label {
    color: rgb(80, 88, 93, 0.2);
    font-weight: 600;
  }

  .flex-tab.dnd-source-proxy.show-icon.picked {
    /* transform: rotate(-8deg); */
  }

  .flex-tab.dnd-source-proxy.show-icon.removed {
    -webkit-transition: all 100ms ease-out;
    -moz-transition: all 100ms ease-out;
    -o-transition: all 100ms ease-out;
    transition: all 100ms ease-out;
    opacity: 0.4;
  }

  .flex-tab.dnd-source-proxy.show-icon.removed-alt {
    -webkit-transition: left 100ms ease-out, top 100ms ease-out;
    -moz-transition: left 100ms ease-out, top 100ms ease-out;
    -o-transition: left 100ms ease-out, top 100ms ease-out;
    transition: left 100ms ease-out, top 100ms ease-out;
    /* opacity: 0; */
  }

  .flex-tab.dnd-source-proxy.show-icon {
    width: 26px;
    height: 26px;
    z-index: 99;
  }

  .flex-tab.dnd-source-proxy.show-icon.on-tabs {
    opacity: 0.6 !important;
  }

  .flex-tab.dnd-source-proxy.show-label {
    z-index: 99;
  }

  .flex-tab.dnd-source-proxy.show-label:not(.on-tabs):not(.removed-alt):not(
      .removed
    ) {
    border-radius: 4px;
    box-shadow: 1px 2px 6px rgb(55 84 170 / 16%);
    min-width: 90px;
    padding: 0px 4px;
    background-color: white;
  }

  .flex-tab.dnd-source-proxy.show-label:not(.on-tabs):not(.removed-alt):not(
      .removed
    )
    .tab-label-inner,
  .flex-tab.dnd-source-proxy.show-label:not(.on-tabs):not(.removed-alt):not(
      .removed
    )
    .tab-label {
    box-shadow: none;
    border-radius: 4px;
    margin-bottom: 0px;
    padding-bottom: 0px;
  }

  .flex-tab.dnd-source-proxy.show-label:not(.on-tabs):not(.removed-alt):not(
      .removed
    )
    .corner-container {
    opacity: 0;
  }

  .show-label-also:not(.dnd-source):not(.dnd-source-proxy):not(:first-child) {
    margin-left: 10px;
  }

  .flex-tab.show-label-also .tab-label,
  .flex-tab.show-label .tab-label {
    display: inline-block;
  }

  .flex-tab.show-label-also .tab-label > * {
    display: none;
  }

  .flex-tab.show-label-also .tab-label > .tab-label-inner {
    display: block;
  }

  .flex-tab.show-icon .tab-icon {
    display: flex;
  }

  .flex-tab:not(.dnd-source-proxy).show-icon {
    @apply box-border;
    width: 26px;
    height: 26px;
  }

  .flex-tab:not(.dnd-source-proxy).show-icon.show-label-also {
    width: auto;
  }

  .tab-label {
    @apply font-medium;
    font-size: 11px;
    position: relative;
    white-space: nowrap;
  }

  .show-label-also .tab-label {
    margin-left: 6px;
  }

  .flex-tab.dnd-source.show-label-also .tab-icon {
    width: 24px;
    height: 24px;
  }

  .flex-tab.dnd-source .tab-icon-mask {
    @apply absolute top-0 bottom-0 left-0 right-0 box-border;
    background: rgba(80, 88, 93, 0.06);
    /* border: 1px dashed rgba(80, 88, 93, 0.2); */
    border: 1px solid rgba(80, 88, 93, 0.2);
    border-radius: 3px;
  }

  .flex-tab.dnd-source.show-label-also .tab-label {
    display: none;
  }
</style>
