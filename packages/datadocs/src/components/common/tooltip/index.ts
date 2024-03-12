import Tooltip from "./Tooltip.svelte";
import type { TooltipPostionType, TooltipOptions } from "./type";

export * from "./constant";
export * from "./type";

const SHOW_TOOLTIP_DELAY_LONG = 300; // 300
const SHOW_TOOLTIP_DELAY_SHORT = 30; // 30
const RESET_TOOLTIP_DELAY_TIME = 500; // 500
const REMOVE_TOOLTIP_DELAY = 200;
const TOOLTIP_CONTAINER_ID = "tooltip_container";
const DEFAULT_TOOLTIP_POSITION: TooltipPostionType = "bottom";
const DEFAULT_TOOLTIP_ARROW_SIZE = 6;

let showTooltipDelay = SHOW_TOOLTIP_DELAY_LONG;
let lastTimeShowToolipTimeout = null;
let removeActiveTooltip: () => void = null;

export default function tooltipAction(
  triggerElement: HTMLElement,
  options: TooltipOptions
) {
  let tooltipOptions: TooltipOptions = options;
  let tooltipComponent: Tooltip;
  let tooltipContent = tooltipOptions.content;
  let tooltipContentComponent = tooltipOptions.contentComponent;
  let isAttached = false;
  let isDisabled = !!tooltipOptions.disabled;
  let position: TooltipPostionType =
    options.position || DEFAULT_TOOLTIP_POSITION;
  let arrowSize: number = options.arrowSize || DEFAULT_TOOLTIP_ARROW_SIZE;
  let disabledTooltipOnMousedown =
    options.disabledTooltipOnMousedown === undefined
      ? true
      : options.disabledTooltipOnMousedown;
  let hasMouseDown = false; // don't show tooltip if the trigger element already has mouse down event
  let attachTooltipTimeout = null;
  let removeTooltipTimeout = null;
  let isFromTouchEvent = false;

  const target = document.getElementById(TOOLTIP_CONTAINER_ID) || document.body;

  function attach() {
    if (isAttached) {
      return;
    }

    // make sure only one tooltip is show at once
    if (typeof removeActiveTooltip === "function") {
      removeActiveTooltip();
      removeActiveTooltip = null;
    }

    tooltipComponent = new Tooltip({
      props: {
        content: tooltipContent,
        contentComponent: tooltipContentComponent,
        triggerElement: triggerElement,
        triggerRect: tooltipOptions.triggerRect,
        position: position,
        arrowSize: arrowSize,
        backgroundStyle: tooltipOptions.backgroundStyle,
        textStyle: tooltipOptions.textStyle,
        arrowColor: tooltipOptions.arrowColor,
      },
      target,
    });

    isAttached = true;
  }

  function remove() {
    if (!isAttached) {
      return;
    }
    try {
      tooltipComponent.$destroy();
    } catch (e) {
      // FIXME: $destroy can be buggy and throws sometimes.
      if (target !== document.body)
        target.innerHTML = '';
    }
    tooltipComponent = null;
    isAttached = false;
  }

  function attachTooltip() {
    if (removeTooltipTimeout) {
      clearTimeout(removeTooltipTimeout);
      removeTooltipTimeout = null;
    }

    if (attachTooltipTimeout) {
      return;
    }

    attachTooltipTimeout = setTimeout(() => {
      if (shouldAttachTooltip()) {
        attach();

        showTooltipDelay = SHOW_TOOLTIP_DELAY_SHORT;
        if (lastTimeShowToolipTimeout) {
          clearTimeout(lastTimeShowToolipTimeout);
          lastTimeShowToolipTimeout = null;
        }
      }

      attachTooltipTimeout = null;
    }, showTooltipDelay);
  }

  function removeTooltip(immediate = false) {
    if (attachTooltipTimeout) {
      clearTimeout(attachTooltipTimeout);
      attachTooltipTimeout = null;
    }

    if (removeTooltipTimeout && !immediate) {
      return;
    }

    if (isAttached) {
      removeActiveTooltip = () => {
        remove();
        removeActiveTooltip = null;
      };

      if (immediate) {
        removeActiveTooltip();
        if (removeTooltipTimeout) {
          clearTimeout(removeTooltipTimeout);
        }
        return;
      }

      removeTooltipTimeout = setTimeout(() => {
        if (typeof removeActiveTooltip === "function") {
          removeActiveTooltip();
        }
      }, REMOVE_TOOLTIP_DELAY);
    }

    resetShowTooltipDelay();
  }

  function resetShowTooltipDelay() {
    if (lastTimeShowToolipTimeout) {
      clearTimeout(lastTimeShowToolipTimeout);
    }

    lastTimeShowToolipTimeout = setTimeout(() => {
      showTooltipDelay = SHOW_TOOLTIP_DELAY_LONG;
      lastTimeShowToolipTimeout = null;
    }, RESET_TOOLTIP_DELAY_TIME);
  }

  function shouldAttachTooltip(): boolean {
    return (
      (!disabledTooltipOnMousedown || !hasMouseDown) &&
      !isAttached &&
      !isDisabled &&
      (!!tooltipContent || !!tooltipContentComponent)
    );
  }

  function handleMouseLeave() {
    hasMouseDown = false;
    removeTooltip();
  }

  function handleMouseEnter() {
    hasMouseDown = false;

    if (!isFromTouchEvent) {
      attachTooltip();
    }
  }

  function handleMouseDown() {
    hasMouseDown = true;
    removeTooltip(true);
  }

  function handleTouchStart() {
    isFromTouchEvent = true;
  }

  function handleClick() {
    if (isFromTouchEvent) {
      isFromTouchEvent = false;
    }
  }

  if (!tooltipOptions.auto) {
    triggerElement.addEventListener("mouseenter", handleMouseEnter);
    triggerElement.addEventListener("mouseleave", handleMouseLeave);
    triggerElement.addEventListener("mousedown", handleMouseDown, true);
    triggerElement.addEventListener("touchstart", handleTouchStart, {
      capture: true,
      passive: true,
    });
    triggerElement.addEventListener("click", handleClick);
  } else if (!isDisabled) {
    attachTooltip();
  }

  function addCbFunction() {
    tooltipOptions.closeFromOutside = (immediate = false) => {
      removeTooltip(immediate);
    };

    tooltipOptions.openFromOutside = () => {
      attachTooltip();
    };
  }
  addCbFunction();

  return {
    update(options: TooltipOptions) {
      tooltipOptions = options;
      isDisabled = !!tooltipOptions.disabled;
      disabledTooltipOnMousedown =
        tooltipOptions.disabledTooltipOnMousedown === undefined
          ? disabledTooltipOnMousedown
          : tooltipOptions.disabledTooltipOnMousedown;
      position = tooltipOptions.position || position;
      arrowSize = tooltipOptions.arrowSize || arrowSize;
      tooltipContent = tooltipOptions.content;
      tooltipContentComponent = tooltipOptions.contentComponent;

      addCbFunction();

      if (isDisabled) {
        removeTooltip();
      } else if (tooltipOptions.auto) {
        if (typeof removeActiveTooltip === "function") {
          removeActiveTooltip();
          removeActiveTooltip = null;
        }
        attachTooltip();
      }
    },
    destroy() {
      removeTooltip(true);
      if (!tooltipOptions.auto) {
        triggerElement.removeEventListener("mouseenter", handleMouseEnter);
        triggerElement.removeEventListener("mouseleave", handleMouseLeave);
        triggerElement.removeEventListener("mousedown", handleMouseDown, true);
        triggerElement.removeEventListener(
          "touchstart",
          handleTouchStart,
          true
        );
        triggerElement.removeEventListener("click", handleClick);
      }
    },
  };
}
