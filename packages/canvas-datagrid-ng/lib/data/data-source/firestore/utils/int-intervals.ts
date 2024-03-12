/**
 * https://github.com/hangxingliu/intervals-js
 */

import Tree from 'sorted-btree';

type TreeInst = InstanceType<typeof Tree>;
type TreeNode<T = any> = {
  hi: number;
  meta?: T;
};

export type ClosedInterval<T = any> = [lo: number, hi: number, meta?: T];

export type IntervalSubtractResult = [
  ClosedInterval<never>?,
  ClosedInterval<never>?,
];

export type IntervalSubtractFn = (
  a: ClosedInterval<any>,
  b: ClosedInterval<any>,
) => IntervalSubtractResult;

export class IntIntervals<T = any> {
  private intervals = new Tree<number, TreeNode<T>>();

  get size() {
    return this.intervals.size;
  }
  clear: TreeInst['clear'] = this.intervals.clear.bind(this.intervals);

  add = (interval: ClosedInterval<T>): number => {
    const [lo, hi, meta] = interval;
    const hasMeta = meta !== undefined;

    let baseKey = lo;
    let affected = 0;
    const lowerInterval = this.intervals.nextLowerPair(lo + 1);
    if (lowerInterval) {
      const cmpHi = lowerInterval[1].hi;
      // there is an interval that can contain new interval
      if (cmpHi >= hi) {
        if (hasMeta) {
          lowerInterval[1].meta = meta;
          return 1;
        }
        return 0;
      }

      // this interval is the neighbor of the new interval
      // or this interval has the intersection of the new interval
      if (cmpHi >= lo - 1) {
        baseKey = lowerInterval[0];
        affected = 1;
      }
    }

    let highest = hi;
    this.intervals.editRange(baseKey + 1, hi + 1, true, (k, v) => {
      if (v.hi > highest) highest = v.hi;
      affected++;
      return { delete: true };
    });
    const node: TreeNode<T> = { hi: highest };
    if (hasMeta) node.meta = meta;
    this.intervals.set(baseKey, node);
    return affected;
  };

  remove = (interval: ClosedInterval<any>) => {
    const sub = (from: [number, TreeNode<T>]) => {
      const fromLo = from[0];
      const fromHi = from[1].hi;
      const fromMeta = from[1].meta;
      const subResult = IntIntervals.unsafeStract([fromLo, fromHi], interval);
      if (subResult.length === 0) {
        this.intervals.delete(fromLo);
      } else {
        const [a, b] = subResult;
        if (a[0] !== fromLo) this.intervals.delete(fromLo);
        this.intervals.set(a[0], { hi: a[1], meta: fromMeta });
        if (b) this.intervals.set(b[0], { hi: b[1], meta: fromMeta });
      }
      return subResult.length;
    };

    const [lo, hi] = interval;
    let baseKey = lo;
    const lowerInterval = this.intervals.nextLowerPair(lo + 1);
    if (lowerInterval) {
      const cmpHi = lowerInterval[1].hi;
      // remove part of a large interval
      if (cmpHi >= hi) {
        sub(lowerInterval);
        return 1;
      }
      // this interval is the neighbor of the new interval
      // or this interval has the intersection of the new interval
      if (cmpHi >= lo) baseKey = lowerInterval[0];
    }
    const intervals = this.intervals.getRange(baseKey, hi, true);
    for (let i = 0; i < intervals.length; i++) sub(intervals[i]);
    return intervals.length;
  };

  has = (value: number | ClosedInterval<any>): boolean => {
    let lo: number;
    let hi: number;
    if (Array.isArray(value)) {
      // range
      [lo, hi] = value;
    } else {
      // value
      lo = value;
      hi = value;
    }
    const lowerInterval = this.intervals.nextLowerPair(lo + 1);
    if (lowerInterval) {
      const cmpHi = lowerInterval[1].hi;
      if (cmpHi >= hi) return true;
    }
    return false;
  };

  /** Complement/Difference */
  diff = (interval: ClosedInterval<any>): ClosedInterval<never>[] => {
    const [lo, hi] = interval;

    let baseKey = lo;
    const lowerInterval = this.intervals.nextLowerPair(lo + 1);
    if (lowerInterval) {
      const cmpHi = lowerInterval[1].hi;
      // there is an interval that can contain new interval
      if (cmpHi >= hi) return [];

      // this interval is the neighbor of the new interval
      // or this interval has the intersection of the new interval
      if (cmpHi >= lo) baseKey = lowerInterval[0];
    }

    let diffFrom = lo;
    const result: ClosedInterval<never>[] = [];
    this.intervals.forRange(baseKey, hi, true, (k, v) => {
      if (k > diffFrom) result.push([diffFrom, k - 1]);
      diffFrom = v.hi + 1;
    });
    if (diffFrom <= hi) result.push([diffFrom, hi]);
    return result;
  };

  getAll = (): ClosedInterval<T>[] => {
    const result: ClosedInterval<T>[] = [];
    this.intervals.forEach((v, k) =>
      result.push(v.meta !== undefined ? [k, v.hi, v.meta] : [k, v.hi]),
    );
    return result;
  };

  static subtract: IntervalSubtractFn = (a, b) => {
    if (b[1] < a[0] || b[0] > a[1]) return [a.map((it) => it) as any];
    return IntIntervals.unsafeStract(a, b);
  };

  static unsafeStract: IntervalSubtractFn = (a, b) => {
    const result: ReturnType<IntervalSubtractFn> = [];
    const addResult = (l: number, h: number) => result.push([l, h]);
    if (b[0] > a[0]) addResult(a[0], b[0] - 1);
    if (b[1] < a[1]) addResult(b[1] + 1, a[1]);
    return result;
  };
}
export default IntIntervals;
