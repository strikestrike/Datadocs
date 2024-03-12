import type { Writable } from "svelte/store";
import { writable } from "svelte/store";
import type { DNDStatus, DragDropOptions, DragInfo } from "./drag-drop-types";

export type DNDStatusExtended = DNDStatus & {
  data: any;
};

export const dndStatus: Writable<DNDStatusExtended | null> = writable(null);

export function dragDrop(element: HTMLElement, options: DragDropOptions = {}) {
  const dndDefault: DNDStatus = {
    container: null,
    containerBounds: null,
    containerStyle: {
      position: "",
    },

    element: null,
    elementBounds: null,
    elementStyle: {
      position: "",
      left: "",
      top: "",
      transform: {
        x: 0,
        y: 0,
      },
    },

    started: false,
    isProxy: false,

    startX: 0,
    startY: 0,

    offX: 0,
    offY: 0,

    changeX: 0,
    changeY: 0,
  };

  let dnd: DNDStatus = {
    ...dndDefault,
  };

  const hasOnDragStart: boolean = options.onDragStart instanceof Function;
  const hasOnDrag: boolean = options.onDrag instanceof Function;
  const hasOnDragEnd: boolean = options.onDragEnd instanceof Function;

  function init() {
    options = {
      useTranslate: false,
      onOverflowX: () => options.overflow,
      onOverflowY: () => options.overflow,
      ...options,
    };
    dnd.element = element;
    element.addEventListener("mousedown", onMouse.down, options.useCapture);
  }

  function destroy() {
    dragStop();
    element.removeEventListener("mousedown", onMouse.down);
  }

  function update({ useTranslate, onDragStart, onDragEnd, data }) {
    options.onDragStart = onDragStart;
    options.onDragEnd = onDragEnd;
    options.data = data;
  }

  function dragStart(startX: number, startY: number) {
    const bounds: DOMRect = element.getBoundingClientRect();

    if (options.container instanceof HTMLElement) {
      dnd.container = options.container;
    } else {
      dnd.container = element.parentNode as HTMLElement;
    }

    if (dnd.container instanceof HTMLElement) {
      dnd.containerBounds = dnd.container.getBoundingClientRect();
      if (!options.useTranslate) {
        dnd.containerStyle.position = dnd.container.style.position;
        dnd.container.style.position = "relative";
      }
    }

    if (options.withProxy instanceof Function) {
      const proxy = options.withProxy(element);
      if (proxy instanceof HTMLElement) {
        dnd.element = proxy;
        dnd.isProxy = true;
      }
    }
    if (!dnd.isProxy && element instanceof HTMLElement) {
      dnd.element = element;
    }
    if (dnd.element !== null) {
      dnd.startX = startX;
      dnd.startY = startY;

      dnd.offX = startX - bounds.x;
      dnd.offY = startY - bounds.y;

      window.addEventListener("mouseup", onWindowMouse.up);
      window.addEventListener("mousemove", onWindowMouse.move);
    }
    if (dnd.element instanceof HTMLElement) {
      dnd.elementBounds = element.getBoundingClientRect();
      if (dnd.element.style.transform) {
        const match = /(translate3d|translate)\((.+)\)/.exec(
          dnd.element.style.transform
        );
        const values = match[2]?.split(", ") || [];

        const x = parseFloat(values[0] || "0");
        const y = parseFloat(values[1] || "0");
        dnd.elementStyle.transform = { x, y };
      }
    }

    dndStatus.set({
      ...dnd,
      data: options.data,
    });
  }

  function dragStop() {
    if (dnd.element !== null) {
      if (dnd.isProxy && dnd.element.parentNode === dnd.container) {
        if (dnd.container instanceof HTMLElement) {
          dnd.container.removeChild(dnd.element);
        }
      }
      if (options.useTranslate) {
        dnd.element.style.transform = ``;
      }
    }

    if (!options.useTranslate) {
      if (dnd.container instanceof HTMLElement) {
        dnd.container.style.position = dnd.containerStyle.position;
        dnd.element.style.position = dnd.elementStyle.position;

        !options.xLocked && (dnd.element.style.left = dnd.elementStyle.left);
        !options.yLocked && (dnd.element.style.top = dnd.elementStyle.top);
      }
    }

    dnd = {
      ...dndDefault,
    };
    dnd.containerStyle.position = "";
    dnd.elementStyle.position = "";

    window.removeEventListener("mouseup", onWindowMouse.up);
    window.removeEventListener("mousemove", onWindowMouse.move);

    dndStatus.set(null);
  }

  function drag(x: number, y: number, cx: number, cy: number) {
    if (!dnd.started) {
      if (dnd.element !== null) {
        if (dnd.isProxy && dnd.element.parentNode !== dnd.container) {
          if (dnd.container instanceof HTMLElement) {
            dnd.container.appendChild(dnd.element);
          }
        }

        if (!options.useTranslate) {
          dnd.elementStyle.position = dnd.element.style.position;
          !options.xLocked && (dnd.elementStyle.left = dnd.element.style.left);
          !options.yLocked && (dnd.elementStyle.top = dnd.element.style.top);
          dnd.element.style.position = "absolute";
        }
      }

      dnd.started = true;
    }

    if (dnd.element !== null) {
      if (options.useTranslate) {
        let transform = `translateX(${cx}px) translateY(${cy}px)`;
        if (dnd.element.style.transform) {
          transform = `translate3d(${dnd.elementStyle.transform.x + cx}px,
            ${dnd.elementStyle.transform.y + cy}px, 0)`;
        }
        dnd.element.style.transform = transform;
      } else {
        dnd.element.style.left = `${x - dnd.containerBounds.x - dnd.offX}px`;
        dnd.element.style.top = `${y - dnd.containerBounds.y - dnd.offY}px`;
      }
    }
  }

  function preventOverflowX(change) {
    if (
      dnd.containerBounds &&
      dnd.elementBounds &&
      !options.onOverflowX({ data: options.data })
    ) {
      if (
        dnd.elementBounds.x + dnd.elementBounds.width + change >=
        dnd.containerBounds.x + dnd.containerBounds.width
      ) {
        change =
          dnd.containerBounds.x +
          dnd.containerBounds.width -
          (dnd.elementBounds.x + dnd.elementBounds.width);
      } else if (dnd.elementBounds.x + change <= dnd.containerBounds.x) {
        change = dnd.containerBounds.x - dnd.elementBounds.x;
      }
    }
    return change;
  }

  function preventOverflowY(change) {
    if (
      dnd.containerBounds &&
      dnd.elementBounds &&
      !options.onOverflowY({ data: options.data })
    ) {
      if (
        dnd.elementBounds.y + dnd.elementBounds.height + change >
        dnd.containerBounds.y + dnd.containerBounds.height
      ) {
        change =
          dnd.containerBounds.y +
          dnd.containerBounds.height -
          (dnd.elementBounds.y + dnd.elementBounds.height);
      } else if (dnd.elementBounds.y + change < dnd.containerBounds.y) {
        change = dnd.containerBounds.y - dnd.elementBounds.y;
      }
    }
    return change;
  }

  const onMouse = {
    down: (event: MouseEvent) => {
      const dragInfo: DragInfo = {
        event,
        element: dnd.element,
        container: dnd.container,
        isPoxy: dnd.isProxy,
        startX: event.clientX,
        startY: event.clientY,
        x: event.clientX,
        y: event.clientY,
        changeX: 0,
        changeY: 0,
        data: options.data,
      };

      let allow = true;
      if (hasOnDragStart) {
        allow = options.onDragStart(dragInfo, false) !== false ? true : false;
      }
      if (allow !== false) {
        dragStart(event.clientX, event.clientY);
        if (hasOnDragStart) {
          options.onDragStart(dragInfo, true);
        }
      }
    },
  };

  const onWindowMouse = {
    up: (event: MouseEvent) => {
      let changeX = event.clientX - dnd.startX;
      let changeY = event.clientY - dnd.startY;

      if (options.overflow === false) {
        changeX = preventOverflowX(changeX);
      }

      if (options.overflow === false) {
        changeY = preventOverflowY(changeY);
      }

      const dragInfo: DragInfo = {
        event,
        element: dnd.element,
        container: dnd.container,
        isPoxy: dnd.isProxy,
        startX: dnd.startX,
        startY: dnd.startY,
        x: event.clientX,
        y: event.clientY,
        changeX,
        changeY,
        data: options.data,
      };

      let allow = true;

      if (hasOnDragEnd) {
        allow = options.onDragEnd(dragInfo, false) !== false ? true : false;
      }
      if (allow !== false) {
        dragStop();
        if (hasOnDragEnd) {
          options.onDragEnd(dragInfo, true);
        }
      }
    },
    move: (event: MouseEvent) => {
      let changeX = event.clientX - dnd.startX;
      let changeY = event.clientY - dnd.startY;

      if (options.overflow === false) {
        changeX = preventOverflowX(changeX);
      }

      if (options.overflow === false) {
        changeY = preventOverflowY(changeY);
      }

      const dragInfo: DragInfo = {
        event,
        element: dnd.element,
        container: dnd.container,
        isPoxy: dnd.isProxy,
        startX: dnd.startX,
        startY: dnd.startY,
        x: event.clientX,
        y: event.clientY,
        changeX,
        changeY,
        data: options.data,
      };

      let allow = true;
      if (hasOnDrag) {
        allow = options.onDrag(dragInfo, false) !== false ? true : false;
      }
      if (allow) {
        drag(event.clientX, event.clientY, changeX, changeY);
        if (hasOnDrag) {
          options.onDrag(dragInfo, true);
        }
      }
    },
  };

  init();

  return {
    update,
    destroy,
  };
}
