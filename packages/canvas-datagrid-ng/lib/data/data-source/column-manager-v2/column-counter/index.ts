import type { LinkedColumnNode } from '../linked-node';
import { HiddenNumLRUCache } from './lru-cache';

/**
 * This type represents a serialized format of ColumnCounter.
 * It can be stringified to JSON and restore a ColumnCounter by any one of the following ways:
 * 1. Calling the method `fromJSON` with a serialized data with `details`.
 * 2. Calling the method `fromJSON` and the method `init` with a column linked list
 * @see ColumnCounter
 */
export type SerializedColumnCounter = [
  /** Total number of columns (visible + hidden) */
  all: number,
  /** Number of visible columns */
  visible: number,
  /** Details of ranges for hidden columns. */
  details?: ColumnCounterDetails,
];

/**
 * This type represents details of ranges for hidden columns.
 * Each item in this array type represents how many hidden columns after a column.
 * For example: `[-1, 5]` means there are 5 hidden columns in the front of the row.
 */
export type ColumnCounterDetails = Array<
  [afterViewIndex: number, hiddenNum: number]
>;

/** A simple utility function to copy an 2D number array */
const copyDetails = (details: ColumnCounterDetails): ColumnCounterDetails =>
  details.map((it) => [...it]);

export class ColumnCounter {
  /**
   * A threshold value for the query cache.
   * The caching feature will be enabled if the number of hidden ranges is
   * greater than or equal to this value.
   * @see getHiddenNumBefore
   */
  static CACHE_MIN = 50;

  /**
   * Total number of columns (visible + hidden).
   * *Please note that this value will not affect the infinite scrolling feature of the table.*
   */
  all = 0;

  /**
   * Number of visible columns
   * *Please note that this value will not affect the infinite scrolling feature of the table.*
   */
  visible = 0;

  /** Total number of hidden columns */
  hidden = 0;

  /**
   * An ordered list of detailed hidden ranges.
   * In other words, the `afterViewIndex` of each item is in ascending order (-1 -> Inf)
   */
  details: ColumnCounterDetails = [];
  /**
   * A LRU cache for the method `getHiddenNumBefore`
   * @see getHiddenNumBefore
   */
  hiddenNumCache = new HiddenNumLRUCache();

  /**
   * @override
   */
  valueOf() {
    return this.all;
  }

  /**
   * Serialize current ColumnCounter
   * @override
   * @param withDetails Also serialize detailed hidden ranges
   */
  toJSON(withDetails = false): SerializedColumnCounter {
    if (withDetails) return [this.all, this.visible, copyDetails(this.details)];
    return [this.all, this.visible];
  }

  /**
   * Deserialize/Parse serialized data and load them into current ColumnCounter
   * @returns `true` if successful, `false` otherwise
   */
  fromJSON(json: SerializedColumnCounter): boolean {
    if (!Array.isArray(json) || json.length < 2) return false;
    const [all, visible] = json;
    if (!Number.isInteger(all) || all < 0) return false;
    if (!Number.isInteger(visible) || visible < 0) return false;

    this.all = all;
    this.visible = Math.min(all, visible);
    this.hidden = Math.max(all - this.visible, 0);
    this.details = Array.isArray(json[2]) ? copyDetails(json[2]) : [];
    this.hiddenNumCache.reset();
    return true;
  }

  /**
   * Initializes current ColumnCounter from a linked list of column headers.
   * This method can rebuild detailed hidden ranges and visible/hidden count.
   */
  init(header: LinkedColumnNode) {
    let visible = 0;
    let hidden = 0;
    const { all: size } = this;
    const details: ColumnCounterDetails = [];
    // E.g., size=0, linked-list: -1 -> 0+
    if (size > 0) {
      let viewIndex = -1;
      let ptr = header;
      while (ptr.next) {
        ptr = ptr.next;
        visible++;
        if (ptr.hide) {
          const count = ptr.hide.count();
          hidden += count;
          details.push([viewIndex, count]);
        }
        viewIndex++;
      }
      const all = visible + hidden;
      if (all < size) {
        // E.g., size=5, linked-list: -1 -> 0+
        visible += size - all;
      }
    }

    this.visible = visible;
    this.hidden = hidden;
    this.details = details;
    this.hiddenNumCache.reset();
  }

  /**
   * Append visible columns at the end
   * @returns The number of visible columns that are appended
   */
  add(num = 1) {
    this.all += num;
    this.visible += num;
    return num;
  }

  /**
   * Decrease/Remove some columns from the tail.
   * This method is usually used as the undo operation of `add`.
   * @see add
   * @returns The number of visible columns that are decreased and also
   * the number of hidden columns that are removed
   */
  decr(num = 1): { visible: number; hidden: number } | undefined {
    if (this.all < num) return;
    if (this.visible < num) return;

    let decrHidden = 0;
    const effectViewIndex = this.visible - num;
    for (let i = this.details.length - 1; i >= 0; i--) {
      const it = this.details[i];
      if (it[0] < effectViewIndex) break;
      decrHidden += it[1];
      this.details.pop();
    }

    this.hidden -= decrHidden;
    this.visible -= num;
    this.all -= num + decrHidden;
    this.hiddenNumCache.reset({ gte: effectViewIndex });
    return { visible: num, hidden: decrHidden };
  }

  /**
   * Hide some columns after the specified view index
   * @returns The number of hidden columns that were added by this method.
   * `-1` means the input arguments are invalid.
   */
  hide(afterViewIndex: number, num: number): number {
    if (afterViewIndex < 0) afterViewIndex = -1;

    const maxNum = this.visible - afterViewIndex - 1;
    num = Math.min(maxNum, num);
    if (num <= 0) return -1;

    this.visible -= num;
    this.hidden += num;
    this.hiddenNumCache.reset({ gte: afterViewIndex });

    /**
     * Find the first hidden range with a larger afterViewIndex value
     * to use as the location for inserting the new hidden range.
     */
    let index = this.details.findIndex((it) => it[0] >= afterViewIndex);
    if (index < 0) {
      this.details.push([afterViewIndex, num]);
      return num;
    }

    let item = this.details[index];
    const untilViewIndex = afterViewIndex + num;
    if (item[0] === afterViewIndex) {
      item[1] += num;
    } else {
      item = [afterViewIndex, num];
      this.details.splice(index, 0, item);
    }
    // Scan and modify all ranges after this hidden range.
    index++;
    let reducedIndexes = num;
    for (; index < this.details.length; index++) {
      const iterate = this.details[index];
      // Merge all hidden ranges that are in the new hidden range
      if (iterate[0] <= untilViewIndex) {
        item[1] += iterate[1];
        reducedIndexes += iterate[1];
        this.details.splice(index, 1);
        index--;
        continue;
      }
      // Adjust view indexes that are after this new hidden range
      iterate[0] -= reducedIndexes;
    }
    return num;
  }

  /**
   * Unhide all/partial columns after the specified view index.
   * @param offset The offset in the hidden range
   * @param num The number of columns that need to be unhidden
   * @returns The actual number of columns that were unhidden by this method.
   * `-1` means the input arguments are invalid.
   */
  unhide(afterViewIndex: number, offset?: number, num?: number): number {
    let index = this.details.findIndex((it) => it[0] >= afterViewIndex);
    // There are no hidden columns after the `afterViewIndex`
    if (index < 0) return -1;

    const item = this.details[index];
    // There are no hidden columns that immediately follow by the `afterViewIndex`
    if (item[0] !== afterViewIndex) return -1;

    if (typeof offset !== 'number' || offset < 0) offset = 0;

    const maxNum = item[1] - offset;
    if (typeof num !== 'number') num = maxNum;
    else num = Math.min(maxNum, num);

    if (num <= 0) return -1;

    this.hiddenNumCache.reset({ gte: afterViewIndex });
    /** The number of hidden columns that will be followed by a new column */
    const restNum = maxNum - num;
    /** The number of new visible columns that will be inserted after this method  */
    const increasedIndexes = num;
    if (offset === 0) {
      if (restNum > 0) {
        // All other hidden columns will be moved to the new column.
        item[0] += increasedIndexes;
        item[1] = restNum;
        index++;
      } else {
        // All hidden columns will be unhidden.
        this.details.splice(index, 1);
      }
    } else {
      item[1] = offset;
      const nextViewIndex = item[0] + num;
      const insert: [number, number] = [nextViewIndex, restNum];
      this.details.splice(index + 1, 0, insert);
      index += 2;
    }

    for (; index < this.details.length; index++)
      this.details[index][0] += increasedIndexes;

    this.visible += num;
    this.hidden -= num;
    return num;
  }

  /**
   * Insert one column.
   * If the parameter `hidden` is not true,
   * this method add the visible column with the given `viewIndex`.
   * Otherwise, this method removes a hidden column after the given `viewIndex`.
   */
  insert(afterViewIndex: number, hidden?: boolean) {
    const { details } = this;
    if (afterViewIndex >= this.visible) return false;
    if (hidden) {
      const index = details.findIndex((it) => it[0] >= afterViewIndex);
      if (index < 0) {
        details.push([afterViewIndex, 1]);
      } else {
        const item = details[index];
        if (item[0] !== afterViewIndex) return false;
        item[1]++;
      }
      this.hidden++;
    } else {
      let index = details.findIndex((it) => it[0] > afterViewIndex);
      if (index >= 0)
        for (; index < details.length; index++) details[index][0]++;
      this.visible++;
    }
    this.all++;
    return true;
  }

  /**
   * Remove one column.
   * If the parameter `hidden` is not true,
   * this method removes the visible column with the given `viewIndex`.
   * Otherwise, this method removes a hidden column after the given `viewIndex`.
   */
  remove(viewIndex: number, hidden?: boolean) {
    const { details } = this;
    if (hidden) {
      const index = details.findIndex((it) => it[0] >= viewIndex);
      if (index < 0) return false;
      const item = details[index];
      if (item[0] !== viewIndex || item[1] < 1) return false;
      if (item[1] === 1) {
        details.splice(index, 1);
      } else {
        item[1]--;
      }
      this.hidden--;
    } else {
      if (viewIndex < 0 || viewIndex >= this.visible) return false;
      let index = details.findIndex((it) => it[0] >= viewIndex);
      if (index >= 0) {
        if (index > 0) {
          const item = details[index];
          const prevItem = details[index - 1];
          // merge
          if (item[0] === prevItem[0] + 1) {
            prevItem[1] += item[1];
            details.splice(index, 1);
          }
        }
        for (; index < details.length; index++) details[index][0]--;
      }
      this.visible--;
    }
    this.all--;
    return true;
  }

  /**
   * Move some columns after a column with the same view index as the given `afterViewIndex`.
   * @returns A boolean value that indicates whether the move was successful.
   */
  reorder(viewIndex: number, count: number, afterViewIndex: number) {
    if (afterViewIndex < 0) afterViewIndex = -1;
    if (viewIndex < 0) viewIndex = 0;

    const maxCount = this.visible - viewIndex;
    count = Math.min(maxCount, count);
    if (count <= 0) return false;

    this.hiddenNumCache.reset({
      gte: Math.min(afterViewIndex, viewIndex),
      lte: Math.max(afterViewIndex, viewIndex + count),
    });

    /**
     * The hidden ranges that located in the columns that need to be moved.
     * Take out them from the list while iterating.
     * They will be inserted back into the list at the end.
     */
    const takeout: ColumnCounterDetails = [];
    /** The last view index of the columns that need to be moved */
    const endViewIndex = viewIndex + count - 1;
    // move to right
    if (afterViewIndex > endViewIndex) {
      let index = this.details.findIndex((it) => it[0] >= viewIndex);
      // no effects
      if (index < 0) return true;

      const offset = afterViewIndex - endViewIndex;
      for (; index < this.details.length; index++) {
        const it = this.details[index];
        if (it[0] <= endViewIndex) {
          takeout.push([it[0] + offset, it[1]]);
          this.details.splice(index, 1);
          index--;
          continue;
        }
        if (it[0] > afterViewIndex) break;
        it[0] -= count;
      }
      if (takeout.length > 0) this.details.splice(index, 0, ...takeout);
      return true;
    } else if (afterViewIndex >= viewIndex - 1) {
      // invalid move action, you can move columns into itself
      return false;
    }

    // move to left
    let index = this.details.findIndex((it) => it[0] > afterViewIndex);
    // no effects
    if (index < 0) return true;

    const initIndex = index;
    const offset = viewIndex - afterViewIndex - 1;
    for (; index < this.details.length; index++) {
      const it = this.details[index];
      if (it[0] < viewIndex) {
        it[0] += count;
        continue;
      }
      if (it[0] > endViewIndex) break;
      it[0] -= offset;
      takeout.push(...this.details.splice(index, 1));
      index--;
    }
    if (takeout.length > 0) this.details.splice(initIndex, 0, ...takeout);
    return true;
  }

  /**
   * This method is used for getting the number of all hidden columns
   * before the specified view index
   */
  getHiddenNumBefore(viewIndex: number) {
    if (viewIndex < 0) return 0;
    if (viewIndex >= this.visible) return this.hidden;

    const details = this.details;
    if (details.length === 0) return 0;

    let i = 0;
    let count = 0;
    //#region using caching
    if (details.length >= ColumnCounter.CACHE_MIN) {
      const cache = this.hiddenNumCache.get();
      if (cache) {
        const [lastViewIndex, lastIndex, lastCount] = cache;
        if (viewIndex === lastViewIndex) return lastCount;
        if (viewIndex > lastViewIndex) {
          const nextItem = details[lastIndex + 1];
          if (!nextItem || nextItem[0] >= viewIndex) return lastCount;

          i = lastIndex + 1;
          count = lastCount;
        } else if (lastIndex > 0) {
          const prevItem = details[lastIndex - 1];
          if (viewIndex > prevItem[0]) return lastCount - details[lastIndex][1];
        }
      }
    }
    //#endregion using caching

    for (; i < details.length; i++) {
      const it = details[i];
      if (it[0] < viewIndex) {
        count += it[1];
        continue;
      }
      this.hiddenNumCache.set(viewIndex, i - 1, count);
      break;
    }
    return count;
  }
}
