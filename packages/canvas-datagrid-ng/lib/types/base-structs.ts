/**
 * This type file is used for some basic types that don't related to any business logic.
 * For example, we can put definitions for linked list, simple descriptor(x&y, row&column) in here.
 *
 * And DON'T put some specific enum, html related types, cell/grid related types in here.
 */

/**
 * The both border is inclusive.
 */
export type IntervalDescriptor = [startIndex: number, endIndex: number];

/**
 * The descriptor for a cells range.
 * For example: `{startRow: 1, startCol: 1, endRow: 2, endColumn: 2}` is a range with four cells.
 * And `{startRow: 1, endRow: 2}` is a range with two rows.
 * - For the cells block, four properties are required.
 * - For the rows, `startRow` and `endRow` are required.
 * - For the columns, `startCol` and `endColumn` are required.
 */
export type RangeDescriptor<MetaType = unknown> = {
  startRow: number;
  startColumn: number;
  endRow: number;
  endColumn: number;
  meta?: MetaType;
};

export type SkippedRangeDescriptor<MetaType = unknown> =
  RangeDescriptor<MetaType> & {
    skippedColumns?: IntervalDescriptor[];
    skippedRows?: IntervalDescriptor[];
  };

/**
 * The descriptor for a location based on view indexes
 */
export type ViewLocationDescriptor<MetaType = unknown> = {
  row: number;
  column: number;
  meta?: MetaType;
};

/**
 * Linked node that can has four links to four direction
 */
export type DoublyLinkedNode<T = any> = {
  prevSibling?: DoublyLinkedNode<T>;
  nextSibling?: DoublyLinkedNode<T>;
  upperSibling?: DoublyLinkedNode<T>;
  lowerSibling?: DoublyLinkedNode<T>;
} & T;

export type AnyFunction = (...args: any) => any;

/**
 * Please use this type for pixel postion ONLY,
 * DON'T use it for row&column position
 */
export type PixelPosition = {
  x: number;
  y: number;
};

export type PixelBoundingRect = {
  x: number;
  y: number;
  height: number;
  width: number;
};

export type RectangleObject = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};
