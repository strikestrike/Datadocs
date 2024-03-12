import Tooltip from "./Tooltip.svelte";
import type { TooltipOptions } from "./type";

export * from "./constant";
export * from "./type";

export default function tooltipAction(
  triggerElement: HTMLElement,
  options: TooltipOptions
) {
  let tooltipComponent: Tooltip;
  let isAttached = false;
  let tooltipOptions = options;

  function attach() {
    if (isAttached || !tooltipOptions.content) {
      return;
    }

    tooltipComponent = new Tooltip({
      props: {
        content: tooltipOptions.content,
        triggerElement: triggerElement,
        position: tooltipOptions.position,
        distance: tooltipOptions.distance || 0,
        backgroundStyle: "background-color: #EA4821; padding: 4px 8px;",
        textStyle:
          "color: white; font-size: 10px; font-weight: 500; line-height: 15px;",
        arrowColor: "#E6451F",
        parentSelector: tooltipOptions.parentSelector,
      },
      target: document.body,
    });

    isAttached = true;
  }

  function remove() {
    if (!isAttached) {
      return;
    }

    tooltipComponent.$destroy();
    tooltipComponent = null;
    isAttached = false;
  }

  function addCbFunction() {
    tooltipOptions.closeFromOutside = () => {
      remove();
    };

    tooltipOptions.openFromOutside = () => {
      attach();
    };
  }

  addCbFunction();

  return {
    update(options: TooltipOptions) {
      tooltipOptions = options;
      addCbFunction();
    },
    destroy() {
      remove();
    },
  };
}
