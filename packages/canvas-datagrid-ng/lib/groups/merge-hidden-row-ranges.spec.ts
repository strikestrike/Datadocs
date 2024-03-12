/// <reference types="mocha" />

import { deepStrictEqual } from 'assert';
import BTree from 'sorted-btree';
import { mergeHiddenRowRanges } from './util';

function assertEntries(btree: BTree, entries: any[]) {
  let actual;
  try {
    actual = Array.from(btree.entries());
    deepStrictEqual(actual, entries);
  } catch (error) {
    console.error('actual:', actual);
    console.error('expected:', entries);
    throw error;
  }
}

describe('mergeHiddenRowRanges', () => {
  it('invalid ranges can not be merged', function () {
    const ranges = new BTree([]);
    deepStrictEqual(mergeHiddenRowRanges(ranges, [10, 5]), false);
    assertEntries(ranges, []);
  });

  it('merge range only contains one row', function () {
    const ranges = new BTree([]);
    deepStrictEqual(mergeHiddenRowRanges(ranges, [1, 1]), true);
    assertEntries(ranges, [[1, 1]]);

    deepStrictEqual(mergeHiddenRowRanges(ranges, [2, 2]), true);
    assertEntries(ranges, [[1, 2]]);

    deepStrictEqual(mergeHiddenRowRanges(ranges, [5, 5]), true);
    assertEntries(ranges, [
      [1, 2],
      [5, 5],
    ]);

    deepStrictEqual(mergeHiddenRowRanges(ranges, [1, 5]), true);
    assertEntries(ranges, [[1, 5]]);
  });

  it('merge ranges', function () {
    const ranges = new BTree([]);
    deepStrictEqual(mergeHiddenRowRanges(ranges, [5, 10]), true);
    assertEntries(ranges, [[5, 10]]);

    deepStrictEqual(mergeHiddenRowRanges(ranges, [5, 11]), true);
    assertEntries(ranges, [[5, 11]]);

    deepStrictEqual(mergeHiddenRowRanges(ranges, [12, 15]), true);
    assertEntries(ranges, [[5, 15]]);
  });

  it('merge independent intervals', function () {
    const ranges = new BTree([[5, 15]]);
    deepStrictEqual(mergeHiddenRowRanges(ranges, [20, 30]), true);
    assertEntries(ranges, [
      [5, 15],
      [20, 30],
    ]);

    deepStrictEqual(mergeHiddenRowRanges(ranges, [1, 3]), true);
    assertEntries(ranges, [
      [1, 3],
      [5, 15],
      [20, 30],
    ]);
  });

  it('new range spans two existed ranges', function () {
    let ranges = new BTree([
      [1, 3],
      [5, 15],
      [20, 30],
    ]);
    deepStrictEqual(mergeHiddenRowRanges(ranges, [7, 25]), true);
    assertEntries(ranges, [
      [1, 3],
      [5, 30],
    ]);

    ranges = new BTree([
      [1, 3],
      [5, 15],
      [20, 30],
    ]);
    deepStrictEqual(mergeHiddenRowRanges(ranges, [7, 35]), true);
    assertEntries(ranges, [
      [1, 3],
      [5, 35],
    ]);
  });

  it('new range wraps all existed ranges', function () {
    const ranges = new BTree([
      [1, 3],
      [5, 15],
      [20, 30],
    ]);
    deepStrictEqual(mergeHiddenRowRanges(ranges, [1, 50]), true);
    assertEntries(ranges, [[1, 50]]);
  });
});
