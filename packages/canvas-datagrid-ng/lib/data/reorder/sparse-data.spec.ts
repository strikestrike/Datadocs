/// <reference types="mocha" />

import { assertShape } from '../../spec-util';
import {
  extractFromSparseData,
  insertIntoSparseData,
  reorderInSparseData,
} from './sparse-data';

describe('Test reorderSparseData', () => {
  const shuffle = (arr: number[]) => {
    let ptr = arr.length;
    while (ptr != 0) {
      const ri = Math.floor(Math.random() * ptr--);
      [arr[ptr], arr[ri]] = [arr[ri], arr[ptr]];
    }
  };
  const createObject = (...indexes: number[]) => {
    // shuffle, make sure the object keys are not ordered
    shuffle(indexes);
    const obj: { [x: string]: number } = {};
    indexes.forEach((index) => (obj[index] = index));
    return obj;
  };

  it('reorder 1', () => {
    // kv:  1  3  6  9 11  20
    const obj = createObject(1, 3, 6, 9, 11, 20);
    const result = reorderInSparseData(obj, [9, 10, 11], 5);
    //  k:  1  3  6  8  9  20
    //  v:  1  3  9 11  6  20
    assertShape('reorder result', result, { afterIndex: 5, reordered: 3 });
    assertShape('reordered object', obj, {
      1: 1,
      3: 3,
      6: 9,
      8: 11,
      9: 6,
      20: 20,
    });
  });

  it('reorder 2', () => {
    // kv: 1  3  6  9 11 15 16 20 22
    const obj = createObject(1, 3, 6, 9, 11, 15, 16, 20, 22);
    const result = reorderInSparseData(obj, [1, 6, 15], 13);
    //  k:  2  7 <11> 12 13 14 16 20 22
    //  v:  3  9 <13>  1  6 15 16 20 22
    assertShape('reorder result', result, { afterIndex: 11, reordered: 3 });
    assertShape('reordered object', obj, {
      2: 3,
      7: 9,
      12: 1,
      13: 6,
      14: 15,
      16: 16,
      20: 20,
      22: 22,
    });
  });

  it('reorder 3', () => {
    // kv: 1  3  6  9 11 15 16 20 22
    const obj = createObject(1, 3, 6, 9, 11, 15, 16, 20, 22);
    const result = reorderInSparseData(obj, [1, 6, 15], -1);
    //  k:  0  1  2  5 10 12 16 20 22
    //  v:  1  6 15  3  9 11 16 20 22
    assertShape('reorder result', result, { afterIndex: -1, reordered: 3 });
    assertShape('reordered object', obj, {
      0: 1,
      1: 6,
      2: 15,
      5: 3,
      10: 9,
      12: 11,
      16: 16,
      20: 20,
      22: 22,
    });
  });

  it('reorder 4', () => {
    // kv: 1  3  6  9 11 15 16 20 22
    const obj = createObject(1, 3, 6, 9, 11, 15, 16, 20, 22);
    const result = reorderInSparseData(obj, [1, 6, 7], 25);
    //  k:  2  6  8 12 13 17 19 <22> 23 24
    //  v:  3  9 11 15 16 20 22 <25>  1  6
    assertShape('reorder result', result, { afterIndex: 22, reordered: 3 });
    assertShape('reordered object', obj, {
      2: 3,
      6: 9,
      8: 11,
      12: 15,
      13: 16,
      17: 20,
      19: 22,
      23: 1,
      24: 6,
    });
  });

  it('extract 1', () => {
    // kv: 1  3  6  9 11 15 16 20 22
    const obj = createObject(1, 3, 6, 9, 11, 15, 16, 20, 22);
    const result = extractFromSparseData(obj, [1, 6, 10, 15]);
    assertShape('extracted result', result, [
      [1, 1],
      [6, 6],
      [15, 15],
    ]);
    assertShape('after extract', obj, {
      2: 3,
      7: 9,
      8: 11,
      12: 16,
      16: 20,
      18: 22,
    });
  });

  it('insert 1', () => {
    // kv: 1  3  6  9 11 15 16 20 22
    const obj = createObject(1, 3, 6, 9, 11, 15, 16, 20, 22);
    const result = insertIntoSparseData(
      obj,
      [3, [1999, 2000]],
      [10, [2001, 2002, 2003]],
    );
    result.sort((a, b) => a[0] - b[0]);
    assertShape('insert result', result, [
      [4, 1999],
      [5, 2000],
      [13, 2001],
      [14, 2002],
      [15, 2003],
    ]);
    // console.log(obj);
    assertShape('after inserted', obj, {
      1: 1,
      3: 3,
      4: 1999,
      5: 2000,
      8: 6,
      11: 9,
      13: 2001,
      14: 2002,
      15: 2003,
      16: 11,
      20: 15,
      21: 16,
      25: 20,
      27: 22,
    });
  });

  it('insert 2', () => {
    const obj = createObject();
    const result = insertIntoSparseData(obj, [0, [999]]);
    result.sort((a, b) => a[0] - b[0]);
    assertShape('insert result', result, [[1, 999]]);
    assertShape('after inserted', obj, { 1: 999 });
  });

  it('insert 3', () => {
    const obj = createObject();
    const result = insertIntoSparseData(obj, [-1, [999]]);
    result.sort((a, b) => a[0] - b[0]);
    assertShape('insert result', result, [[0, 999]]);
    assertShape('after inserted', obj, { 0: 999 });
  });
});
