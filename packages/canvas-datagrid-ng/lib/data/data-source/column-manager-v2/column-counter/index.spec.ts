/// <reference types="mocha" />

import { ok } from 'assert';
import { ColumnCounter } from '.';
import { assertCount, eq } from '../tests/_utils';

describe('Test ColumnCounter', () => {
  it('hide', () => {
    const counter = new ColumnCounter();
    counter.fromJSON([10, 10]);
    assertCount(counter, 10, 10);

    ok(counter.hide(-1, 3));
    assertCount(counter, 10, 7);
    eq(counter.details, [[-1, 3]]);

    // invalid
    ok(counter.hide(7, 1) < 0);

    ok(counter.hide(5, 1));
    assertCount(counter, 10, 6);
    eq(counter.details, [
      [-1, 3],
      [5, 1],
    ]);

    ok(counter.hide(-1, 1));
    assertCount(counter, 10, 5);
    eq(counter.details, [
      [-1, 4],
      [4, 1],
    ]);

    ok(counter.hide(0, 1));
    assertCount(counter, 10, 4);
    eq(counter.details, [
      [-1, 4],
      [0, 1],
      [3, 1],
    ]);
    eq(counter.getHiddenNumBefore(0), 4);
    eq(counter.getHiddenNumBefore(1), 5);
    eq(counter.getHiddenNumBefore(2), 5);
    eq(counter.getHiddenNumBefore(3), 5);
    eq(counter.getHiddenNumBefore(4), 6);
    eq(counter.getHiddenNumBefore(100000), 6);

    ok(counter.hide(-1, 4));
    assertCount(counter, 10, 0);
    eq(counter.details, [[-1, 10]]);

    ok(counter.hide(-1, 1) === -1);
  });

  it('unhide', () => {
    const counter = new ColumnCounter();
    counter.fromJSON([10, 10]);
    assertCount(counter, 10, 10);

    ok(counter.unhide(-1, 0, 3) < 0);

    ok(counter.hide(-1, 5));
    assertCount(counter, 10, 5);

    // -1 -> 0 -> 1 -> 2
    //  |-> A, B, C, D, E
    //      0, 1, 2, 3, 4
    //        [B]
    // -1    -> B -> 0 -> 2
    //  |-> A   |-> C, D, E
    ok(counter.unhide(-1, 1, 1));
    assertCount(counter, 10, 6);
    eq(counter.details, [
      [-1, 1],
      [0, 3],
    ]);

    ok(counter.unhide(-1, 0, 10));
    assertCount(counter, 10, 7);
    eq(counter.details, [[1, 3]]);

    // unhide all hidden that are behind the column with a viewIndex of 1
    ok(counter.unhide(1));
    assertCount(counter, 10, 10);
    eq(counter.details, []);
  });

  it('reorder', () => {
    const counter = new ColumnCounter();
    counter.fromJSON([20, 20]);
    assertCount(counter, 20, 20);

    ok(counter.hide(-1, 1));
    ok(counter.hide(0, 2));
    ok(counter.hide(2, 2));
    ok(counter.hide(4, 1));
    // -1   ->  0  -> 1 -> 2 -> 3 -> 4
    //  |-> A   |->  B,C   |-> D,E   |-> F
    eq(counter.details, [
      [-1, 1],
      [0, 2],
      [2, 2],
      [4, 1],
    ]);

    // move {0,1,2,3} after {4}
    // -1   ->  4   -> 0 -> 1 -> 2 -> 3
    //  |-> A   |-> F  |-> B,C   |-> D,E
    counter.reorder(0, 4, 4);
    eq(counter.details, [
      [-1, 1],
      [0, 1],
      [1, 2],
      [3, 2],
    ]);

    // -1   ->  0   -> 1 -> 2 -> 3 -> 4
    //  |-> A   |-> F  |-> B,C   |-> D,E
    // move {1,2,3} after {-1}
    // -1 ->  1 -> 2 -> 3   ->   0 -> 4
    //  |-> A |-> B,C   |-> D,E  |->F
    counter.reorder(1, 3, -1);
    eq(counter.details, [
      [-1, 1],
      [0, 2],
      [2, 2],
      [3, 1],
    ]);
  });

  it('reorder 2', () => {
    const counter = new ColumnCounter();
    counter.fromJSON([1000, 1000]);
    assertCount(counter, 1000, 1000);

    counter.hide(-1, 100);
    counter.hide(0, 3);
    counter.hide(1, 4);
    counter.hide(2, 5);
    counter.hide(3, 6);
    counter.hide(4, 7);
    eq(counter.details, [
      [-1, 100],
      [0, 3],
      [1, 4],
      [2, 5],
      [3, 6],
      [4, 7],
    ]);
    const serialized = counter.toJSON(true);
    {
      ok(counter.fromJSON(serialized));
      // -1  ->  0  ->  1  ->  2  ->  3  ->  4
      // |->100  |->3   |->4   |->5   |->6   |->7
      // {0,1,2} after {4}
      ok(counter.reorder(0, 3, 4));
      eq(counter.details, [
        [-1, 100],
        [0, 6],
        [1, 7],
        [2, 3],
        [3, 4],
        [4, 5],
      ]);
    }
    {
      ok(counter.fromJSON(serialized));
      // -1  ->  0  ->  1  ->  2  ->  3  ->  4
      // |->100  |->3   |->4   |->5   |->6   |->7
      // {0,1,2} after {4}
      ok(counter.reorder(2, 3, 0));
      eq(counter.details, [
        [-1, 100],
        [0, 3],
        [1, 5],
        [2, 6],
        [3, 7],
        [4, 4],
      ]);
    }
    {
      ok(counter.fromJSON(serialized));
      // -1  ->  0  ->  1  ->  2  ->  3  ->  4
      // |->100  |->3   |->4   |->5   |->6   |->7
      // {0,1,2} after {4}
      ok(counter.reorder(2, 3, -1));
      eq(counter.details, [
        [-1, 100],
        [0, 5],
        [1, 6],
        [2, 7],
        [3, 3],
        [4, 4],
      ]);
    }
  });

  it('remove', () => {
    const counter = new ColumnCounter();
    counter.fromJSON([100, 100]);
    assertCount(counter, 100, 100);

    counter.hide(-1, 10);
    counter.hide(0, 10);
    counter.hide(3, 10);
    assertCount(counter, 100, 70);
    eq(counter.details, [
      [-1, 10],
      [0, 10],
      [3, 10],
    ]);

    counter.remove(0);
    assertCount(counter, 99, 69);
    eq(counter.details, [
      [-1, 20],
      [2, 10],
    ]);

    counter.remove(3);
    assertCount(counter, 98, 68);
    eq(counter.details, [
      [-1, 20],
      [2, 10],
    ]);

    counter.remove(2, true);
    assertCount(counter, 97, 68);
    eq(counter.details, [
      [-1, 20],
      [2, 9],
    ]);

    counter.remove(-1, true);
    assertCount(counter, 96, 68);
    eq(counter.details, [
      [-1, 19],
      [2, 9],
    ]);

    for (let i = 0; i < 9; i++) counter.remove(2, true);
    assertCount(counter, 87, 68);
    eq(counter.details, [[-1, 19]]);

    for (let i = 0; i < 19; i++) counter.remove(-1, true);
    assertCount(counter, 68, 68);
    eq(counter.details, []);
  });

  it('insert', () => {
    const counter = new ColumnCounter();
    counter.insert(-1, false);
    assertCount(counter, 1, 1);

    counter.insert(-1, true);
    assertCount(counter, 2, 1);
    eq(counter.details, [[-1, 1]]);

    // re-init
    counter.fromJSON([0, 0, []]);
    counter.insert(-1, true);
    assertCount(counter, 1, 0);
    eq(counter.details, [[-1, 1]]);

    // re-init
    counter.fromJSON([100, 100, []]);
    assertCount(counter, 100, 100);

    counter.hide(-1, 10);
    counter.hide(0, 10);
    counter.hide(3, 10);
    assertCount(counter, 100, 70);
    eq(counter.details, [
      [-1, 10],
      [0, 10],
      [3, 10],
    ]);

    counter.insert(-1);
    assertCount(counter, 101, 71);
    eq(counter.details, [
      [-1, 10],
      [1, 10],
      [4, 10],
    ]);

    counter.insert(-1, true);
    assertCount(counter, 102, 71);
    eq(counter.details, [
      [-1, 11],
      [1, 10],
      [4, 10],
    ]);

    ok(!counter.insert(71));

    ok(counter.insert(70));
    assertCount(counter, 103, 72);
    eq(counter.details, [
      [-1, 11],
      [1, 10],
      [4, 10],
    ]);

    ok(counter.insert(6, true));
    assertCount(counter, 104, 72);
    eq(counter.details, [
      [-1, 11],
      [1, 10],
      [4, 10],
      [6, 1],
    ]);
  });

  it('getHiddenNumBefore', () => {
    ColumnCounter.CACHE_MIN = 0;
    const counter = new ColumnCounter();
    counter.fromJSON([1000, 1000]);
    assertCount(counter, 1000, 1000);

    counter.hide(-1, 100);
    counter.hide(0, 1);
    counter.hide(1, 1);
    counter.hide(2, 1);
    counter.hide(3, 1);
    counter.hide(4, 1);
    counter.hide(10, 1);
    counter.hide(20, 1);

    eq(counter.getHiddenNumBefore(-1), 0);
    eq(counter.getHiddenNumBefore(-1), 0);
    eq(counter.getHiddenNumBefore(0), 100);
    eq(counter.getHiddenNumBefore(0), 100);
    eq(counter.getHiddenNumBefore(1), 101);
    eq(counter.getHiddenNumBefore(1), 101);
    eq(counter.getHiddenNumBefore(3), 103);

    eq(counter.getHiddenNumBefore(2), 102);
    eq(counter.getHiddenNumBefore(2), 102);

    eq(counter.getHiddenNumBefore(3), 103);
    eq(counter.getHiddenNumBefore(3), 103);

    eq(counter.getHiddenNumBefore(5), 105);
    eq(counter.getHiddenNumBefore(5), 105);

    eq(counter.getHiddenNumBefore(11), 106);
    eq(counter.getHiddenNumBefore(10), 105);
    eq(counter.getHiddenNumBefore(11), 106);

    eq(counter.getHiddenNumBefore(20), 106);
    eq(counter.getHiddenNumBefore(21), 107);

    eq(counter.getHiddenNumBefore(15), 106);
    eq(counter.getHiddenNumBefore(18), 106);
    eq(counter.getHiddenNumBefore(14), 106);

    eq(counter.getHiddenNumBefore(14), 106);
    eq(counter.getHiddenNumBefore(13), 106);
    eq(counter.getHiddenNumBefore(11), 106);
    eq(counter.getHiddenNumBefore(10), 105);
  });
});
