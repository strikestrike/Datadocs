/// <reference types="mocha" />

import { performance } from 'perf_hooks';
import { OrderInLargeData } from './large-data';
import { assertWithName } from '../../spec-util';

describe('Test OrderInLargeData#reorder', () => {
  it('reorder (simple)', () => {
    const order = new OrderInLargeData();
    order.reorder(10, 1, -1);
    assertWithName('order.intervals (after 1 time reorder)', order.intervals, [
      [10, 10],
      [0, 9],
      [11, Infinity],
    ]);

    order.reorder(10, 1, -1);
    assertWithName('order.intervals (after 2 times reorder)', order.intervals, [
      [9, 10],
      [0, 8],
      [11, Infinity],
    ]);

    order.reorder(12, 2, -1);
    assertWithName('order.intervals (after 3 times reorder)', order.intervals, [
      [12, 13],
      [9, 10],
      [0, 8],
      [11, 11],
      [14, Infinity],
    ]);
  });

  it('reorder (simple 2)', () => {
    const order = new OrderInLargeData();
    let expected: number[];
    const validate = (comment: any) => {
      expected.forEach((realIndex, viewIndex) => {
        const actual = order.getRealIndex(viewIndex);
        assertWithName(
          `${comment} getRealIndex(${viewIndex})`,
          actual,
          realIndex,
        );
      });
    };

    order.reorder(5, 2, 10);
    expected = [0, 1, 2, 3, 4 /*, 5, 6 */, 7, 8, 9, 10, 5, 6, 11, 12];
    validate('after 1 time reorder');

    order.reorder(3, 11, 1);
    // [0, 1, 2, 3, 4, 7, 8, 9, 10, 5, 6, 11, 12, 13];
    // [0, 1,<insert to here> 2, {3, 4, 7, 8, 9, 10, 5, 6, 11, 12, 13}];
    expected = [0, 1, 3, 4, 7, 8, 9, 10, 5, 6, 11, 12, 13, 2, 14, 15, 16];
    validate('after 2 times reorder');

    order.reorder(5, 1, 5);
    // [0, 1, 3, 4, 7, 8, 9, 10, 5, 6, 11, 12, 13, 2, 14, 15, 16]
    // [0, 1, 3, 4, 7, {8},<insert to here> 9, 10, 5, 6, 11, 12, 13, 2, 14, 15, 16]
    expected = [0, 1, 3, 4, 7, 8, 9, 10, 5, 6, 11, 12, 13, 2, 14, 15, 16];
    validate('after 3 times reorder(in-situ)');

    order.reorder(2, 3, 1);
    // [0, 1, 3, 4, 7, 8, 9, 10, 5, 6, 11, 12, 13, 2, 14, 15, 16]
    // [0, 1,<insert to here> {3, 4, 7}, 8, 9, 10, 5, 6, 11, 12, 13, 2, 14, 15, 16]
    expected = [0, 1, 3, 4, 7, 8, 9, 10, 5, 6, 11, 12, 13, 2, 14, 15, 16];
    validate('after 4 times reorder(in-situ)');

    order.reorder(2, 3, 0);
    // [0, 1, 3, 4, 7, 8, 9, 10, 5, 6, 11, 12, 13, 2, 14, 15, 16]
    // [0,<insert to here> 1, {3, 4, 7}, 8, 9, 10, 5, 6, 11, 12, 13, 2, 14, 15, 16]
    expected = [0, 3, 4, 7, 1, 8, 9, 10, 5, 6, 11, 12, 13, 2, 14, 15, 16];
    validate('after 5 times reorder');
  });

  [100, 1000].forEach(function (times) {
    it(`reorder (${times} times reorder on the large dataset)`, function () {
      // this.slow(times * 0.2);
      // this.timeout(times * 0.5);

      const order = new OrderInLargeData();
      const maxItems = 1000 * 1000 * 1000 * 1000; // 1000B (1T)

      const offsetArray = getIntArray(times, 0, maxItems);
      const countArray = getIntArray(times, 0, maxItems / 2);
      const afterArray = getIntArray(times, -1, maxItems);
      const now = performance.now();
      for (let i = 0; i < times; i++)
        order.reorder(offsetArray[i], countArray[i], afterArray[i]);

      const ms = (performance.now() - now).toFixed(2);
      console.log(`reorder ${times} times: ${ms}ms (large dataset)`);
    });
    it(`reorder (${times} times reorder on the small dataset)`, function () {
      // this.slow(times * 0.2);
      // this.timeout(times * 0.5);

      const order = new OrderInLargeData();
      const maxItems = 1000; // 1K

      const offsetArray = getIntArray(times, 0, maxItems);
      const countArray = getIntArray(times, 0, maxItems / 2);
      const afterArray = getIntArray(times, -1, maxItems);
      const now = performance.now();
      for (let i = 0; i < times; i++)
        order.reorder(offsetArray[i], countArray[i], afterArray[i]);

      const ms = (performance.now() - now).toFixed(2);
      console.log(`reorder ${times} times: ${ms}ms`);
    });
  });

  function getIntArray(length: number, min: number, max: number) {
    return new Array(length).fill(0).map(() => getInt(min, max));
  }
  function getInt(min: number, max: number) {
    const count = max - min + 1;
    return Math.floor(Math.random() * count + min);
  }
});
