import type { NamedRangeDescriptor, NamedRangeManager } from './spec';
import type { NamespaceController } from '../types';
import { getSelectionFromRange } from './util';

type StringMap = Map<string, string>;

/**
 * Converts the cell range specified by the string like 'A10B20' to CellDescriptor
 */
export class DefaultNamedRangeManager implements NamedRangeManager {
  /** All registered Ranges */
  ranges: StringMap = new Map<string, string>();
  /**
   * A list where one Range references another Range
   *
   * parent -> children
   */
  rangeRefs = new Map<string, Array<string>>();
  /**
   * A list where one Range is referenced by another Range
   *
   * child -> parent
   */
  rangeReverseRefs = new Map<string, Array<string>>();

  constructor(init?: StringMap | { [x: string]: string }) {
    if (!init) return;
    if (init instanceof Map) {
      this.ranges = new Map(init);
    } else if (typeof init === 'object') {
      this.ranges = new Map(Object.entries(init));
    }
  }

  has(name: string): boolean {
    return this.ranges.has(name);
  }

  add(namespace: NamespaceController, name: string, range: string): boolean {
    if (!namespace.checkName(name)) return false;
    if (!this.isValidRange(range)) {
      console.warn(
        "a cell range must be written in the format 'A1:B2' or 'C3'",
      );
      return false;
    }
    try {
      const children = [];
      const rangeSplitted = range.split(',').map((aRange) => {
        if (!this.has(aRange)) {
          return aRange.toLocaleUpperCase();
        }
        if (this.rangeRefs.has(aRange)) {
          const parents = this.rangeRefs.get(aRange);
          parents.every((parent) => {
            if (name == parent) {
              throw `current range "${range}" refers to itself`;
            }
            if (this.rangeRefs.has(parent)) {
              this.rangeRefs.get(parent).forEach((p) => parents.push(p));
            }
          });
        }
        children.push(aRange);
        return aRange;
      });
      // Since the cell range may be entered in lowercase, convert it to
      // uppercase and register it (Range name is not converted)
      this.ranges.set(name, rangeSplitted.join(','));
      if (children) {
        this.rangeRefs.set(name, children);
        children.forEach((child) => {
          const childrefs = this.rangeReverseRefs.has(child)
            ? this.rangeReverseRefs.get(child)
            : [];
          childrefs.push(name);
          this.rangeReverseRefs.set(child, childrefs);
        });
      }
      return true;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }

  remove(name: string): boolean {
    if (!this.ranges.has(name)) {
      console.warn(`range '${name}' is not registered`);
      return false;
    }
    if (this.rangeReverseRefs.has(name)) {
      const children = this.rangeReverseRefs.get(name).join(',');
      console.warn(`range '${name}' is referenced by others(${children})`);
      return false;
    }
    // Delete the reference relationship between Ranges
    if (this.rangeRefs.has(name)) {
      this.rangeRefs.get(name).forEach((child) => {
        this.rangeReverseRefs.delete(child);
      });
      this.rangeRefs.delete(name);
    }

    return this.ranges.delete(name);
  }

  get(name: string): NamedRangeDescriptor | null {
    if (!name) {
      console.warn(`name must not be empty`);
      return null;
    }
    const range = this.ranges.has(name) ? this.ranges.get(name) : name;
    return this.getCellRange(range, name);
  }

  getByRange = (range: string) => {
    for (const name of this.ranges.keys()) {
      const value = this.ranges.get(name);
      if (value === range) {
        return this.getCellRange(value, name);
      }
    }
  };

  forEach(fn: (range: string, name: string) => any) {
    this.ranges.forEach(fn);
  }

  isValidRange(range: string): boolean {
    const rangeSplitted = range.split(',');
    const checkResult = rangeSplitted.every((rangetoken) => {
      if (this.ranges.has(rangetoken)) {
        return true;
      }
      return getSelectionFromRange(rangetoken);
    });
    return checkResult;
  }

  getCellRange(range: string, name: string): NamedRangeDescriptor | null {
    const cellRange: NamedRangeDescriptor = {
      name: name,
      range: range,
      selections: [],
    };
    range.split(',').forEach((aRange) => {
      if (this.has(aRange)) {
        const childRange = this.getCellRange(this.ranges.get(aRange), aRange);
        if (!childRange) {
          return null;
        }
        childRange.selections.forEach((sel) => {
          cellRange.selections.push(sel);
        });
        return;
      }
      const selection = getSelectionFromRange(aRange);
      if (!selection) {
        return null;
      }
      cellRange.selections.push(selection);
    });
    return cellRange;
  }
}
