import BTree from 'sorted-btree';
import type { HiddenRangeIterator } from './types/hidden-range-iterator';
import type {
  HiddenRange,
  HiddenRangeData,
  HiddenRangeStore,
} from './types/hidden-range-store';

const pairToObject = (pair: [number, HiddenRangeData]): HiddenRange => {
  return {
    start: pair[0],
    end: pair[1].end,
    isGroup: pair[1].isGroup,
  };
};

export class InMemoryHiddenRangeStore implements HiddenRangeStore {
  readonly records = new BTree<number, HiddenRangeData>();

  get size() {
    return this.records.size;
  }

  clear = () => {
    this.records.clear();
  };

  count = (start: number, end: number) => {
    let count = 0;

    const startRange = this.records.getPairOrNextLower(start);
    this.records.forRange(
      startRange?.[1]?.end >= start ? startRange[0] : start,
      end,
      true,
      (rangeStart, data, _) => {
        count += Math.min(data.end, end) - Math.max(rangeStart, start) + 1;
      },
    );

    return count;
  };

  entries = this.records.entries.bind(this.records);

  entriesReversed = this.records.entriesReversed.bind(this.records);

  forEach = (
    callback: (start: number, end: number, isGroup: boolean) => void,
  ) => {
    this.records.forEach((data, start, _) =>
      callback(start, data.end, data.isGroup),
    );
  };

  forRange = (
    start: number,
    end: number,
    includeEnd: boolean,
    callback: (start: number, end: number, isGroup?: boolean) => void,
  ) => {
    this.records.forRange(start, end, includeEnd, (start, data) =>
      callback(start, data.end, data.isGroup),
    );
  };

  getHiddenIndexCount = (until?: number) => {
    let count = 0;
    if (until) {
      for (const [start, data] of this.records.entries()) {
        if (start > until) break;
        count += Math.min(until, data.end) - start + 1;
      }
    } else {
      this.records.forEach((data, start, _) => {
        count += data.end - start + 1;
      });
    }
    return count;
  };

  getHidingRange = (index: number) => {
    const pair = this.records.getPairOrNextLower(index);
    if (pair && pair[1].end >= index) return pairToObject(pair);
  };

  get = (index: number) => {
    return this.records.get(index);
  };

  getVisibleIndex = (index: number, change: number, max?: number) => {
    if (!change) return index;

    let result = index;
    let remaining = change;
    while (remaining !== 0) {
      let start = result + (remaining > 0 ? 0 : remaining);
      const end = result + (remaining > 0 ? remaining : 0);

      const container = this.records.getPairOrNextLower(start);
      if (container && container[0] <= start && container[1].end >= start) {
        start = container[0];
      }

      let hadHidden = false;
      if (remaining > 0) {
        this.records.forRange(start, end, true, (from, data) => {
          hadHidden = true;
          if (!remaining) return;
          const consumed = Math.max(result, from) - result;
          if (max === undefined || data.end + 1 <= max) {
            result = data.end + 1;
            remaining -= consumed;
          } else {
            result = from - 1;
            remaining = 0;
          }
        });
      } else {
        // We are doing reversing separately because btree library doesn't
        // support reverse iteration with `forRange`
        const reusedArray = [];
        const entries = this.records.entriesReversed(end, reusedArray);

        for (const [from, data] of entries) {
          if (data.end < start) break;
          hadHidden = true;
          if (!remaining) break;

          const consumed = result - Math.min(result, data.end);
          if (from - 1 >= 0) {
            result = from - 1;
            remaining += consumed;
          } else {
            result = data.end + 1;
            remaining = 0;
          }
        }
      }

      if (!hadHidden) {
        result += remaining;
        remaining = 0;
        if (max !== undefined) result = Math.min(result, max);
      }
    }

    return result;
  };

  getOrNextHigher = (index: number) => {
    const pair = this.records.getPairOrNextHigher(index);
    if (pair) return pairToObject(pair);
  };

  getOrNextLower = (index: number) => {
    const pair = this.records.getPairOrNextLower(index);
    if (pair) return pairToObject(pair);
  };

  isHidden = (index: number) => {
    const range = this.records.getPairOrNextLower(index);
    return range && range[0] <= index && range[1].end >= index;
  };

  iterator = (reverse?: boolean) => new IteratorImpl(this, !!reverse);

  hasHidden = (beginIndex: number, endIndex: number) => {
    let containsHiddenRanges = false;
    this.records.forEachPair((start, data) => {
      if (!(start > endIndex || data.end < beginIndex)) {
        containsHiddenRanges = true;
        return { break: true };
      }
    });

    return containsHiddenRanges;
  };

  hide = (beginIndex: number, endIndex: number, isGroup?: boolean) => {
    if (endIndex < beginIndex) return false;

    let start = beginIndex;
    let end = endIndex;

    const applyRange = (range: [number, HiddenRangeData]) => {
      if (!range || range[1].end < beginIndex - 1 || range[0] > endIndex + 1) {
        return;
      }
      if (range[0] < start) {
        start = range[0];
      }
      if (range[1].end > end) {
        // If it is a group, keep the out-of-bound indexes hidden.
        if (isGroup && !range[1].isGroup) {
          this.records.set(end + 1, {
            isGroup: false,
            end: range[1].end,
          });
        } else {
          end = range[1].end;
        }
      }
    };

    // Apply possible range on the left.
    applyRange(this.records.getPairOrNextLower(beginIndex));
    // Apply possible range on the right.
    applyRange(this.records.getPairOrNextLower(endIndex));

    // Delete hidden ranges that are in between.
    this.records.deleteRange(start, end, true);
    this.records.set(start, { end, isGroup });

    return true;
  };

  unhide = (beginIndex: number, endIndex: number, isGroup?: boolean) => {
    // Delete the pair containing the start index.
    const pair = this.records.getPairOrNextLower(beginIndex);
    const lastPair = this.records.getPairOrNextLower(endIndex);
    if (pair && pair[0] <= beginIndex && pair[1].end >= beginIndex) {
      this.records.delete(pair[0]);
    }

    // Assume that we are deleting more than one range, so delete here.
    this.records.deleteRange(beginIndex, endIndex, true);

    // Return the range that became visible.
    return {
      start: pair?.[0] ?? beginIndex,
      end: Math.max(lastPair?.[1]?.end ?? pair?.[1]?.end ?? 0, endIndex),
    };
  };

  reorder = (startIndex: number, endIndex: number, afterViewIndex: number) => {
    const total = 1 + (endIndex ?? startIndex) - startIndex;
    if (total < 1 || afterViewIndex === startIndex) return false;

    const movingRanges = this.records
      .getRange(startIndex, endIndex, true)
      .map((pair, _, __) => pair);

    const isAscending = afterViewIndex > startIndex;
    const isAddition = !isAscending;
    // We don't touch the data that is behind the target or start index,
    // that is why you are seeing a bunch of `+1`s or `-1`s.
    const startPos = isAscending ? endIndex + 1 : afterViewIndex + 1;
    const endPos = isAscending ? afterViewIndex : startIndex - 1;

    const reorderingData = this.records.getRange(startPos, endPos, true);
    for (let i = 0; i < reorderingData.length; i++) {
      const [start, data] =
        reorderingData[isAscending ? i : reorderingData.length - 1 - i];
      this.records.delete(start);
      data.end = data.end + total;
      this.records.set(isAddition ? start + total : start - total, data);
    }

    const diff = isAddition
      ? afterViewIndex - startIndex + 1
      : afterViewIndex - (endIndex - startIndex) - startIndex;
    for (let i = 0; i < movingRanges.length; i++) {
      const pair = movingRanges[i];
      const data = pair[1];
      this.records.delete(pair[0]);

      data.end = data.end + diff;
      this.records.set(pair[0] + diff, data);
    }
  };
}

const isHidden = (range: HiddenRange, index: number) => {
  return range && range.start <= index && range.end >= index;
};

class IteratorImpl implements HiddenRangeIterator {
  private currentRange: HiddenRange;
  private noHiddenRangeLeft = false;

  constructor(
    private readonly store: InMemoryHiddenRangeStore,
    private readonly reverse: boolean,
  ) {}

  private loadRange = (index: number) => {
    if (this.noHiddenRangeLeft) return undefined;

    // First time looking up and not in reverse, so find the (maybe) containing
    // range first.
    if (!this.currentRange && !this.noHiddenRangeLeft && !this.reverse) {
      this.currentRange = this.store.getOrNextLower(index);
    }

    // Get rid of the cached range if it is no longer usable.
    if (
      this.currentRange &&
      ((this.reverse && this.currentRange.start > index) ||
        (!this.reverse && this.currentRange.end < index))
    ) {
      this.currentRange = undefined;
    }

    // Find the next range.
    if (!this.currentRange) {
      this.currentRange = this.reverse
        ? this.store.getOrNextLower(index)
        : this.store.getOrNextHigher(index);
      if (!this.currentRange) this.noHiddenRangeLeft = true;
    }

    return this.currentRange;
  };

  getHidingRange = (index: number) => {
    const range = this.loadRange(index);
    return isHidden(range, index) ? range : undefined;
  };

  isHidden = (index: number) => {
    if (this.noHiddenRangeLeft) return false;
    return isHidden(this.loadRange(index), index);
  };
}
