import type { ColumnType } from "@datadocs/canvas-datagrid-ng";

export type ReferenceItem = {
  name: string;
  type: "uitable" | "dbtable" | "file";
  tooltip?: string;
};

export type NodeDetailItem = {
  name: string;
  type: "reference" | "info" | "status" | "button";
  children?: ReferenceItem[];
  value?: string;
};

export type NodeDetailColumn = {
  name: string;
  type: ColumnType;
};

export type NodeDetailButton = {
  name: string;
  action: Function;
};

export type DetailTransformContext = {
  isResizing: boolean;
  /**
   * Start resing Panes when mouse pointer holds a divider
   *
   */
  startResize(
    x: number,
    y: number,
    divider: HTMLElement,
    type: string,
    equal: boolean,
    onResize: () => void
  ): void;
  /**
   * Calculate new sizes of the Detail as the divider is dragged
   *
   */
  doResize(event: MouseEvent): void;
  /**
   * Stop the Resize operation
   *
   */
  stopResize(): void;
};
