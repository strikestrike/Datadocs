import type { AnyFunction } from "@datadocs/canvas-datagrid-ng";
import { setCursor, setPointerEvents } from "../../../../layout/core/ui-utils";
import type { DetailTransformContext } from "../components/node-detail/type";
import { DETAIL_MIN_HEIGHT, DETAIL_MIN_WIDTH } from "../constant";

export function getDetailTransformContext(
  getMaxSize: AnyFunction,
  getElement: () => HTMLElement
): DetailTransformContext {
  let transformParams = {
    startX: null,
    startY: null,
    startHeight: null,
    startWidth: null,
    currentX: null,
    currentY: null,
    divider: null,
    type: "horizontal",
    onResize: null,
  };
  const transformContext: DetailTransformContext = {
    isResizing: false,
    startResize: function (x, y, divider, type, onResize) {
      if (transformContext.isResizing) {
        return;
      }
      const element = getElement();
      transformParams = {
        startX: x,
        startY: y,
        startHeight: element.offsetHeight,
        startWidth: element.offsetWidth,
        currentX: x,
        currentY: y,
        divider,
        type,
        onResize,
      };

      window.addEventListener("mousemove", transformContext.doResize);
      window.addEventListener("mouseup", transformContext.stopResize);

      transformContext.isResizing = true;

      setCursor(type === "horizontal" ? "n-resize" : "w-resize");
      setPointerEvents("none");
    },
    doResize: function (event: MouseEvent) {
      const { clientX, clientY } = event;
      if (!transformContext.isResizing) {
        return;
      }

      const changeX = clientX - transformParams.currentX;
      const changeY = clientY - transformParams.currentY;

      const type = transformParams.type;

      let property: string;
      let change = 0;
      let mouseChange = 0;
      let minSize: number;
      let maxSize: number;
      const element = getElement();

      if (transformParams.type === "horizontal") {
        change = clientY - transformParams.startY;
        mouseChange = changeY;
        property = "height";
        minSize = DETAIL_MIN_HEIGHT;
        maxSize = getMaxSize();
      } else if (transformParams.type === "vertical") {
        change = clientX - transformParams.startX;
        mouseChange = changeX;
        property = "width";
        minSize = DETAIL_MIN_WIDTH;
        maxSize = getMaxSize();
      }

      if (mouseChange < -5) {
        // console.log("OK");
      }

      if (change !== 0) {
        if (property === "height") {
          let updatedSize = transformParams.startHeight - change;
          if (updatedSize < minSize) {
            updatedSize = minSize;
          }
          if (updatedSize > maxSize) {
            updatedSize = maxSize;
          }
          element.style.height = `${updatedSize}px`;
        } else if (property === "width") {
          let updatedSize = transformParams.startWidth - change;
          if (updatedSize < minSize) {
            updatedSize = minSize;
          }
          if (updatedSize > maxSize) {
            updatedSize = maxSize;
          }
          element.style.width = `${updatedSize}px`;
        }
      }
      transformParams.currentX = clientX;
      transformParams.currentY = clientY;

      if (transformParams.onResize) {
        transformParams.onResize();
      }
    },
    stopResize: function () {
      window.removeEventListener("mousemove", transformContext.doResize);
      window.removeEventListener("mouseup", transformContext.stopResize);

      transformContext.isResizing = false;
      setCursor();
      setPointerEvents();
    },
  };

  return transformContext;
}
