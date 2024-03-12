import type { HiddenRangeIterator } from './hidden-range-iterator';

export interface HiddenRangeData {
  isGroup: boolean;
  end: number;
}

export interface HiddenRange extends HiddenRangeData {
  start: number;
}

export type UnhiddenRange = {
  start: number;
  end: number;
};

export interface HiddenRangeStore {
  readonly size: number;

  clear(): void;

  count(fromIndex: number, toIndex: number): number;

  entries(start: number): IterableIterator<[number, HiddenRangeData]>;

  entriesReversed(end: number): IterableIterator<[number, HiddenRangeData]>;

  forEach(callback: (start: number, end: number, isGroup: boolean) => void);

  forRange(
    start: number,
    end: number,
    includeEnd: boolean,
    callback: (start: number, end: number, isGroup?: boolean) => void,
  );

  getHiddenIndexCount(until?: number): number;

  getHidingRange(index: number): HiddenRange | undefined;

  getVisibleIndex(baseIndex: number, change: number, max?: number): number;

  isHidden(index: number): boolean;

  iterator(reversed?: boolean): HiddenRangeIterator;

  hasHidden(fromIndex: number, toIndex: number): boolean;

  hide(beginIndex: number, endIndex: number, isGroup?: boolean): boolean;

  unhide(beginIndex: number, endIndex: number): UnhiddenRange;

  reorder(beginIndex: number, endIndex: number, afterViewIndex: number);
}
