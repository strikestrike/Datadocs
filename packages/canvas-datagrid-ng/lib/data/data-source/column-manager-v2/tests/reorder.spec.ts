/// <reference types="mocha" />

import { deepStrictEqual } from 'assert';
import { ColumnManager } from '..';
import {
  actionOK,
  assertCount,
  defaultSchemaGetter,
  eq,
  eqArray,
} from './_utils';

describe('Test ColumnManager', () => {
  it('reorder', () => {
    const columns = new ColumnManager(defaultSchemaGetter);
    assertCount(columns.count, 0, 0);

    // 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
    // 0+
    actionOK(columns.touch(9));
    assertCount(columns.count, 10, 10);
    eqArray(columns.llist.toArray(), [-1, 0]);

    // 0, 1,  2, 3,  [4, 5], 6, 7, 8, 9
    // 0, 1, [4, 5],  2, 3,  6, 7, 8, 9
    // 0, 1, [4, 5],  2, 3,  6+
    let result = actionOK(columns.reorder(4, 2, 1));
    eq(result.result.count, 2);
    eq(result.result.newViewIndex, 2);
    assertCount(columns.count, 10, 10);
    deepStrictEqual(columns.llist.toArray(), [-1, 0, 1, 4, 5, 2, 3, 6]);

    //  0, 1,  4, 5, [2, 3], 6, 7, 8, 9
    // [2, 3], 0, 1,  4, 5,  6, 7, 8, 9
    result = actionOK(columns.reorder(4, 2, -1));
    eq(result.result.count, 2);
    eq(result.result.newViewIndex, 0);
    assertCount(columns.count, 10, 10);
    deepStrictEqual(columns.llist.toArray(), [-1, 2, 3, 0, 1, 4, 5, 6]);
  });

  it('reorder (increase size automatically)', () => {
    const columns = new ColumnManager(defaultSchemaGetter);
    assertCount(columns.count, 0, 0);

    const RESERVED = 100;
    columns.reserveIndexes(RESERVED);

    // 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
    //[0, 1],2, 3<-
    let result = actionOK(columns.reorder(0, 2, 3));
    eq(result.result.virtual, true);
    eq(result.result.beginSchemaIndex, RESERVED + 0);
    eq(result.result.count, 2);
    eq(result.result.newViewIndex, 2);

    let undoArgs = result.undo.args;
    eq(undoArgs.viewIndex, 2);
    eq(undoArgs.afterViewIndex, -1);
    eq(undoArgs.afterSchemaIndex, -1);

    eqArray(columns.llist.toArray(), [-1, 100]);
    assertCount(columns.count, 0, 0);

    // 100, 101, 102 | 103, 104, 105
    actionOK(columns.touch(2));
    assertCount(columns.count, 3, 3);
    eqArray(columns.llist.toArray(), [-1, 100]);

    // 100, 101,[102 | 103, 104], 105
    // 102, 103, 104,  100, 101, 105
    result = actionOK(columns.reorder(2, 3, -1));
    eq(result.result.beginSchemaIndex, RESERVED + 2);
    eq(result.result.count, 3);
    eq(result.result.newViewIndex, 0);

    // size is increased
    assertCount(columns.count, 5, 5);

    undoArgs = result.undo.args;
    eq(undoArgs.sub, 2); // 2 columns is added
    eq(undoArgs.viewIndex, 0);
    eq(undoArgs.count, 3);
    eq(undoArgs.afterViewIndex, 4);
    eq(undoArgs.afterSchemaIndex, 101);

    eqArray(columns.llist.toArray(), [-1, 102, 103, 104, 100, 101, 105]);

    // undo
    result = actionOK(
      columns.reorder(
        undoArgs.viewIndex,
        undoArgs.count,
        undoArgs.afterViewIndex,
      ),
    );
    assertCount(columns.count, 5, 5);
    eqArray(columns.llist.toArray(), [-1, 100, 101, 102, 103, 104, 105]);

    columns.count.decr(undoArgs.sub);
    assertCount(columns.count, 3, 3);
  });
});
