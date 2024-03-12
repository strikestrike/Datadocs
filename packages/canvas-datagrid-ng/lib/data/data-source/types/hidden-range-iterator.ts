import type { HiddenRange } from './hidden-range-store';

export interface HiddenRangeIterator {
  getHidingRange(index: number): HiddenRange;

  isHidden(index: number): boolean;
}
