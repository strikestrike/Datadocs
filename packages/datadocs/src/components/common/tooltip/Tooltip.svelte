<script lang="ts">
  import { onMount } from "svelte";
  import type { TooltipPostionType, TooltipTriggerRect } from "./type";
  import { TOOLTIP_POSITION_CHANGE_EVENT_NAME } from "./constant";
  import type { ComponentType } from "svelte";

  /**
   * Using Svelte component as tooltip content
   * @type { ComponentType }
   */
  export let contentComponent: ComponentType = null;
  /**
   * Text content of tooltip, only show if there isn't @contentComponent
   * @type { string }
   */
  export let content: string = "";
  /**
   * Html element that tooltip will be shown around
   * @type { HTMLElement }
   */
  export let triggerElement: HTMLElement;
  /**
   * Custom rect that tooltip will be shown around
   * It will be used instead of triggerElement bound if provided
   */
  export let triggerRect: TooltipTriggerRect = null;
  /**
   * Tooltip position
   */
  export let position: TooltipPostionType = "bottom";
  /**
   * Size of arrow
   */
  export let arrowSize = 6;
  /**
   * Distance from triggerElement or triggerRect to tooltip
   */
  export let distance = 0;
  /**
   * Tooltip background style
   */
  export let backgroundStyle = "";
  /**
   * Text content style
   */
  export let textStyle = "";
  /**
   * Color of arrow
   */
  export let arrowColor = "#454450";
  /**
   * The parent element that tooltip should not go over horizontally
   */
  export let parentSelector = "";

  let tooltipElement: HTMLElement;
  let arrowElement: HTMLElement;
  let triggerBound: TooltipTriggerRect;
  let tooltipBound: DOMRect;

  onMount(() => {
    updateTooltipStyle();
    document.addEventListener(
      TOOLTIP_POSITION_CHANGE_EVENT_NAME,
      updateTooltipStyle,
      true
    );

    return () => {
      document.removeEventListener(
        TOOLTIP_POSITION_CHANGE_EVENT_NAME,
        updateTooltipStyle,
        true
      );
    };
  });

  function updateTooltipStyle() {
    let pos: TooltipPostionType;
    triggerBound = triggerRect ?? triggerElement.getBoundingClientRect();
    tooltipBound = tooltipElement.getBoundingClientRect();

    if (position === "vertical") {
      const triggerTop: number = triggerBound.top;
      const triggerBottom: number = triggerBound.bottom;
      const windowHeight: number = window.innerHeight;
      pos = triggerTop > windowHeight - triggerBottom ? "top" : "bottom";
    } else if (position === "horizontal") {
      const triggerLeft: number = triggerBound.left;
      const triggerRight: number = triggerBound.right;
      const windowWidth: number = window.innerWidth;
      pos = triggerLeft > windowWidth - triggerRight ? "left" : "right";
    } else {
      pos = position;
    }

    switch (pos) {
      case "top": {
        setTooltipTop();
        break;
      }
      case "bottom": {
        setTooltipBottom();
        break;
      }
      case "left": {
        setTooltipLeft();
        break;
      }
      case "right": {
        setTooltipRight();
        break;
      }
    }
  }

  function getXLimit(): [number, number] {
    let minX = 0;
    let maxX = 1000000;
    let parentElement: HTMLElement;

    if (parentSelector) {
      parentElement = document.querySelector(parentSelector);
    }

    if (parentElement) {
      const bound = parentElement.getBoundingClientRect();
      minX = bound.left;
      maxX = bound.right;
    }

    return [minX, maxX];
  }

  function setTooltipTop() {
    const [minX, maxX] = getXLimit();
    const windowWidth = window.innerWidth;
    let xCenter = (triggerBound.left + triggerBound.right) / 2;
    xCenter = Math.min(Math.max(xCenter, minX), maxX);
    const tooltipWidth = Math.min(tooltipBound.width, windowWidth);
    const top = Math.round(
      triggerBound.top - arrowSize - tooltipBound.height - distance
    );
    const left = Math.round(
      Math.min(
        Math.max(xCenter - tooltipWidth / 2, 0),
        windowWidth - tooltipWidth
      )
    );
    const arrowLeft = xCenter - left - arrowSize;

    Object.assign(tooltipElement.style, {
      top: top + "px",
      left: left + "px",
      maxWidth: tooltipWidth + "px",
    });

    Object.assign(arrowElement.style, {
      left: arrowLeft + "px",
      top: "100%",
      borderLeft: `${arrowSize}px solid transparent`,
      borderRight: `${arrowSize}px solid transparent`,
      borderTop: `${arrowSize}px solid ${arrowColor}`,
    });
  }

  function setTooltipBottom() {
    const [minX, maxX] = getXLimit();
    const windowWidth = window.innerWidth;
    let xCenter = (triggerBound.left + triggerBound.right) / 2;
    xCenter = Math.min(Math.max(xCenter, minX), maxX);
    const tooltipWidth = Math.min(tooltipBound.width, windowWidth);
    const top = Math.round(triggerBound.bottom + arrowSize + distance);
    const left = Math.round(
      Math.min(
        Math.max(xCenter - tooltipWidth / 2, 0),
        windowWidth - tooltipWidth
      )
    );
    const arrowLeft = xCenter - left - arrowSize;

    Object.assign(tooltipElement.style, {
      top: top + "px",
      left: left + "px",
      maxWidth: tooltipWidth + "px",
    });

    Object.assign(arrowElement.style, {
      left: arrowLeft + "px",
      bottom: "100%",
      borderLeft: `${arrowSize}px solid transparent`,
      borderRight: `${arrowSize}px solid transparent`,
      borderBottom: `${arrowSize}px solid ${arrowColor}`,
    });
  }

  function setTooltipLeft() {
    const tooltipWidth = tooltipBound.width;
    const yCenter = (triggerBound.top + triggerBound.bottom) / 2;
    const top = yCenter - tooltipBound.height / 2;
    const left = triggerBound.left - tooltipBound.width - arrowSize - distance;
    const arrowTop = yCenter - top - arrowSize;

    Object.assign(tooltipElement.style, {
      top: top + "px",
      left: left + "px",
      maxWidth: tooltipWidth + "px",
    });

    Object.assign(arrowElement.style, {
      top: arrowTop + "px",
      left: "100%",
      borderTop: `${arrowSize}px solid transparent`,
      borderBottom: `${arrowSize}px solid transparent`,
      borderLeft: `${arrowSize}px solid ${arrowColor}`,
    });
  }

  function setTooltipRight() {
    const tooltipWidth = tooltipBound.width;
    const yCenter = (triggerBound.top + triggerBound.bottom) / 2;
    const top = yCenter - tooltipBound.height / 2;
    const left = triggerBound.right + arrowSize + distance;
    const arrowTop = yCenter - top - arrowSize;

    Object.assign(tooltipElement.style, {
      top: top + "px",
      left: left + "px",
      maxWidth: tooltipWidth + "px",
    });

    Object.assign(arrowElement.style, {
      top: arrowTop + "px",
      right: "100%",
      borderTop: `${arrowSize}px solid transparent`,
      borderBottom: `${arrowSize}px solid transparent`,
      borderRight: `${arrowSize}px solid ${arrowColor}`,
    });
  }
</script>

<div bind:this={tooltipElement} class="tooltip" style={backgroundStyle}>
  {#if contentComponent}
    <svelte:component this={contentComponent} />
  {:else}
    <div class="whitespace-nowrap pointer-events-none" style={textStyle}>
      {content}
    </div>
  {/if}

  <div bind:this={arrowElement} class="absolute w-0 h-0 pointer-events-none" />
</div>

<style lang="postcss">
  .tooltip {
    @apply fixed text-center font-medium py-2 px-2.5 rounded-[3px];
    background-color: #454450;
    color: white;
    font-size: 12px;
    line-height: 14px;

    /* tooltip can be showed in any components, its z-index should be the highest */
    z-index: 9999999;
  }
</style>
