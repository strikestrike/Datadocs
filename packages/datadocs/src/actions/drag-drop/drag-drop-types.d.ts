export type DragDropOptions = {
  container?: HTMLElement;
  useTranslate?: boolean;
  useCapture?: boolean;
  xLocked?: boolean;
  yLocked?: boolean;
  overflow?: boolean;
  data?: any;
  withProxy?: (element: HTMLElement) => HTMLElement;
  onDragStart?: (dragInfo: DragInfo, isAfter: boolean) => void | boolean;
  onDrag?: (dragInfo: DragInfo, isAfter: boolean) => void | boolean;
  onDragEnd?: (dragInfo: DragInfo, isAfter: boolean) => void | boolean;
  onOverflowX?: (info: Pick<DragInfo, "data">) => boolean;
  onOverflowY?: (info: Pick<DragInfo, "data">) => boolean;
};

export type DNDStatus = {
  container: HTMLElement;
  containerBounds: DOMRect;
  containerStyle: {
    position: string;
  };

  element: HTMLElement;
  elementBounds: DOMRect;
  elementStyle: {
    position: string;
    left: string;
    top: string;
    transform: {
      x: number;
      y: number;
    };
  };

  started: boolean;
  isProxy: boolean;

  startX: number;
  startY: number;

  offX: number;
  offY: number;

  changeX: number;
  changeY: number;
};

export type DragInfo = {
  event: MouseEvent;

  element: HTMLElement;
  container: HTMLElement;

  isPoxy: boolean;

  startX: number;
  startY: number;

  x: number;
  y: number;

  changeX: number;
  changeY: number;

  data: any;
};
