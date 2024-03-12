/**
 * How `intervals` works:
 *
 * Initialized state: [[0,]]
 * Re-order the row 100 and row 101 (their rowId are 99 and 100) after the first row:
 * 1. we treat the rows as 4 parts: [0,0] [1,98], [99,100], [101,]
 * 2. we move the 3rd intervals after the first intervals: [0,0] [99, 100], [1, 98], [101, ]
 * So the current state is: [[0,0] [99, 100], [1, 98], [101, ]]
 */
type ClosedInterval = [begin: number, end: number];

type CutSingleIntervalResult = {
  intervals: ClosedInterval[];
  /** new offset value after cutting */
  offset: number;
  /** new count value after cutting */
  count: number;
};

const getDefaultInterval = () => [0, Infinity] as ClosedInterval;

/**
 * This class is used for managing the order of the large data.
 */
export class OrderInLargeData {
  intervals = [getDefaultInterval()];
  reset = () => (this.intervals = [getDefaultInterval()]);

  getViewIndex = (realIndex: number) => {
    if (realIndex < 0) return realIndex;
    let viewIndex = 0;
    const { intervals } = this;
    for (let i = 0; i < intervals.length; i++) {
      const [begin, end] = intervals[i];
      if (realIndex < begin || realIndex > end) {
        viewIndex += end - begin + 1;
        continue;
      }
      return viewIndex + realIndex - begin;
    }
    return -1;
  };

  /**
   * @param viewIndex It can be less than 0, but the result is the same as viewIndex.
   * (This situation is used for the compatiable with existing API)
   */
  getRealIndex = (viewIndex: number) => {
    if (viewIndex < 0) return viewIndex;

    const { intervals } = this;
    if (intervals.length <= 1) return viewIndex;

    for (let i = 0; i < intervals.length; i++) {
      const [begin, end] = intervals[i];
      // it is a finite interval, so the input view index may not in this interval.
      if (end !== Infinity) {
        const size = end - begin + 1;
        if (viewIndex >= size) {
          viewIndex -= size;
          continue;
        }
      }
      return begin + viewIndex;
    }
    return viewIndex;
  };

  /**
   * @param offset Aka. viewIndex
   */
  getRealIndexes = (offset: number, count = 1): ClosedInterval[] => {
    const { intervals } = this;
    if (count < 1) return [];
    if (intervals.length <= 1) return [[offset, offset + count - 1]];

    const result: ClosedInterval[] = [];
    for (let i = 0; i < intervals.length; i++) {
      const [begin, end] = intervals[i];
      // touch the end
      if (end === Infinity) {
        const newBegin = begin + offset;
        result.push([newBegin, newBegin + count - 1]);
        break;
      }

      const size = end - begin + 1;
      if (offset >= size) {
        offset -= size;
        continue;
      }

      const subBegin = offset;
      let subEnd = offset + count - 1;
      if (subEnd >= size) subEnd = size - 1;

      offset = 0;
      count -= subEnd - subBegin + 1;
      result.push([begin + subBegin, begin + subEnd]);
      if (count <= 0) break;
    }

    // merge intervals
    return OrderInLargeData.mergeNearbyIntervals(result);
  };

  reorder = (offset: number, count: number, afterViewIndex: number) => {
    if (count <= 0) return false;

    const realBeginIndex = this.getRealIndex(offset);
    if (realBeginIndex < 0) return false;

    // split intervals
    const newIntervals: ClosedInterval[] = [];
    const { intervals } = this;
    let cutArgs = { offset, count };
    for (let i = 0; i < intervals.length; i++) {
      const afterCut = OrderInLargeData.cutSingleInterval(
        intervals[i],
        cutArgs.offset,
        cutArgs.count,
      );
      newIntervals.push(...afterCut.intervals);
      cutArgs = afterCut;
    }

    const extractFromNewIntervals = () => {
      const result: ClosedInterval[] = [];
      for (let i = 0; i < newIntervals.length; i++) {
        const interval = newIntervals[i];
        if (interval[0] !== realBeginIndex) continue;
        while (count > 0) {
          const [removed] = newIntervals.splice(i, 1);
          count -= removed[1] - removed[0] + 1;
          result.push(removed);
        }
        i--;
      }
      return result;
    };

    // move to the begining
    if (afterViewIndex < 0) {
      const extracted = extractFromNewIntervals();
      this.intervals = extracted.concat(newIntervals);
      OrderInLargeData.mergeNearbyIntervals(this.intervals);
      return true;
    }

    const afterRealIndex = this.getRealIndex(afterViewIndex);
    const extracted = extractFromNewIntervals();
    for (let i = 0; i < newIntervals.length; i++) {
      const [begin, end] = newIntervals[i];
      if (afterRealIndex === end) {
        newIntervals.splice(i + 1, 0, ...extracted);
        this.intervals = OrderInLargeData.mergeNearbyIntervals(newIntervals);
        return true;
      }
      if (afterRealIndex >= begin && afterRealIndex < end) {
        newIntervals.splice(i, 1, [begin, afterRealIndex], ...extracted, [
          afterRealIndex + 1,
          end,
        ]);
        this.intervals = OrderInLargeData.mergeNearbyIntervals(newIntervals);
        return true;
      }
    }
    return false;
  };

  static mergeNearbyIntervals = (intervals: ClosedInterval[]) => {
    for (let i = 1; i < intervals.length; i++) {
      // interval.begin === lastInterval.end + 1
      const thisInterval = intervals[i];
      if (thisInterval[0] === intervals[i - 1][1] + 1) {
        intervals[i - 1][1] = thisInterval[1];
        intervals.splice(i, 1);
        i--;
      }
    }
    return intervals;
  };

  static cutSingleInterval = (
    interval: ClosedInterval,
    offset: number,
    count: number,
  ): CutSingleIntervalResult => {
    if (count <= 0) return { intervals: [interval], offset: 0, count: 0 };

    const [begin, end] = interval;
    if (end === Infinity) {
      if (offset > 0) {
        const cutPoint = begin + offset;
        const cutPoint2 = cutPoint + count;
        return {
          intervals: [
            [begin, cutPoint - 1],
            [cutPoint, cutPoint2 - 1],
            [cutPoint2, Infinity],
          ],
          offset: 0,
          count: 0,
        };
      }

      const cutPoint = begin + count;
      return {
        intervals: [
          [begin, cutPoint - 1],
          [cutPoint, Infinity],
        ],
        offset: 0,
        count: 0,
      };
    }

    const size = end - begin + 1;
    if (offset >= size) {
      return {
        intervals: [interval],
        offset: offset - size,
        count,
      };
    }

    const cutPoint = begin + offset;
    const cutPoint2 = cutPoint + count;
    if (cutPoint2 <= end) {
      const intervals: ClosedInterval[] = [
        [begin, cutPoint - 1],
        [cutPoint, cutPoint2 - 1],
      ];
      if (cutPoint2 < end) intervals.push([cutPoint2, end]);
      return { intervals, offset: 0, count: 0 };
    }

    const intervals: ClosedInterval[] = [
      [begin, cutPoint - 1],
      [cutPoint, end],
    ];
    const newCount = count - (end - cutPoint + 1);
    return { intervals, offset: 0, count: newCount };
  };

  static getIntervalsFromIndexes(indexes: number[]) {
    indexes.sort((a, b) => a - b);
    const intervals: ClosedInterval[] = [];

    let last: ClosedInterval;
    for (let i = 0; i < indexes.length; i++) {
      const index = indexes[i];
      if (last) {
        if (last[1] + 1 === index) {
          last[1] = index;
          continue;
        }
        intervals.push(last);
      }
      last = [index, index];
    }
    if (last) intervals.push(last);
    return intervals;
  }
}
