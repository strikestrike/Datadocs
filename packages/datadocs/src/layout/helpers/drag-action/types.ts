export type PointerPosition = {
  x: number;
  y: number;
};

export type DragActionOptions = {
  /**
   * Invoked when the drag starts.
   * @param pos The pointer position when the drag started.
   * @returns False to cancel the operation.
   */
  onDragStartedCallback?: (pos: PointerPosition) => boolean | any;
  /**
   * Invoked when the pointer position changes.
   * @param pos The pointer position when the drag started.
   * @returns False to cancel the operation.
   */
  onDragCallback?: (pos: PointerPosition) => boolean | undefined;
  /**
   * Invoked when the drag ends.
   */
  onDragEndedCallback?: () => any;
};
