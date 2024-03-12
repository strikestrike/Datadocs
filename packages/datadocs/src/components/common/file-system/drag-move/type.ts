export type MousePosition = { x: number; y: number };

export type DragActionOptions = {
  handleDragStart?: (p: MousePosition) => boolean;
  handleDragging?: (p: MousePosition) => void;
  handleDragEnd?: (p: MousePosition) => void;
};
