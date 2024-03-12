'use strict';

import type {
  NamespaceController,
  TableDescriptor,
} from '../data/data-source/spec';
import type { SelectionDescriptor } from '../selections/types';
import type { ColumnType } from '../types';

/**
 * The value that can be shown in the name box UI of the app.
 */
export type NameBoxState = {
  /**
   * The current value of the name box.
   */
  value: string;
  /**
   * If the name box can suggest a type, e.g., when there is only one selection,
   * the column the active cell will be suggested as the type in the name box.
   */
  type?: ColumnType;
  /**
   * The item (if one available) that the current selection perfectly covers,
   * and can be used as the context.
   */
  item?: TableDescriptor | NamedRangeDescriptor;
};

/**
 * Preserve cell range with string and SelectionDescriptor
 */
export type NamedRangeDescriptor = {
  /**
   * The unique name (in its namespace) of the range.
   */
  name: string;
  /**
   * The text representation of the named range.
   */
  range: string;
  /**
   * The selections described by this named range.
   */
  selections: SelectionDescriptor[];
};

/**
 * Database of named cell ranges
 *
 * There are two ways to get the cell range.
 * 1. Excel-style cell range notation.
 *    For example, if you specify `range.get('A1: B2')`,
 *    it will be `[{a1, b1}, {a2, b2}]` returned.
 * 2. Name the cell range specified in [1] with an arbitrary character string,
 *    and get it with that name. For example,
 *    if you register as `range.add('products', 'B2:C3')`,
 *    range.get ('products') will return the same range as `range.get('B2:C3')`.
 */
export interface NamedRangeManager {
  /**
   * Check if a range exists for the given name.
   * @param name The name to check.
   * @return True if there is a range with the given name.
   */
  has(name: string): boolean;

  /**
   * Add a new named range.
   * @param namespace The controller to use to check if the name is available.
   * @param name The unique name for the range, e.g., `Named Range 1`.
   * @param range The string representation of the range, e.g., `E1:F12`.
   * @returns True if the name was available and the range was valid.
   */
  add(namespace: NamespaceController, name: string, range: string): boolean;

  /**
   * Remote the range using its unique name.
   * @param name The unique name of the named range.
   * @return True if the range existed and was removed.
   */
  remove(name: string): boolean;

  /**
   * Get the named range descriptor using its unique name.
   * @param name The unique name of the range.
   * @returns The named range descriptor if there is a range with the given name.
   */
  get(name: string): NamedRangeDescriptor;

  /**
   * Find and return the named range using its string representaion.
   * @param range The name range descriptor or undefined if nothing was found.
   */
  getByRange(range: string): NamedRangeDescriptor | undefined;

  /**
   * Iterate over the existing named ranges.
   * @param fn To call.
   */
  forEach(fn: (range: string, name: string) => any);
}
