/// <reference types="mocha" />

import { deepStrictEqual } from 'assert';
import { ColumnManager } from '..';
import { ColumnManagerSerializer } from '../serializer';
import type { ActionResultWithUndoDescriptor } from '../types';
import {
  actionFail,
  actionOK,
  assertCount,
  defaultSchemaGetter,
  eq,
  eqArray,
  sequence,
} from './_utils';

describe('Test ColumnManager', () => {
  it('hide', () => {
    const columns = new ColumnManager(defaultSchemaGetter);
    let result: ActionResultWithUndoDescriptor<'hide', 'unhide'>;

    // no enough columns to hide now
    result = actionFail(columns.hide(0, 1));

    // 0 -> 5
    actionOK(columns.touch(4));
    assertCount(columns.count, 5, 5);

    // hide the first column
    result = actionOK(columns.hide(0, 1));
    eq(result.result.count, 1);
    eqArray(result.result.schemaIndexes, [0]);
    assertCount(columns.count, 5, 4);
    eqArray(columns.count.details, [[-1, 1]]);
    eqArray(columns.llist.toJSON(), [
      -1,
      { head: 1, hide: [0] },
      1,
      { rest: 1 },
    ]);

    result = actionOK(columns.hide(0, 2));
    eq(result.result.count, 2);
    eqArray(result.result.schemaIndexes, [1, 2]);
    assertCount(columns.count, 5, 2);
    eqArray(columns.count.details, [[-1, 3]]);
    eqArray(columns.llist.toJSON(), [
      -1,
      { head: 1, hide: [0, 1, 2] },
      3,
      { rest: 1 },
    ]);
  });

  it('hide and unhide', () => {
    const columns = new ColumnManager(defaultSchemaGetter);
    let result: ActionResultWithUndoDescriptor<'hide', 'unhide'>;

    // 0 -> 5
    actionOK(columns.touch(4));
    assertCount(columns.count, 5, 5);

    result = actionOK(columns.hide(4, 1));
    eq(result.result.count, 1);
    eqArray(result.result.schemaIndexes, [4]);
    assertCount(columns.count, 5, 4);
    eqArray(columns.count.details, [[3, 1]]);
    eqArray(columns.llist.toJSON(), [
      -1,
      { head: 1 },
      ...sequence(0, 3),
      { hide: [4] },
      5,
      { rest: 1 },
    ]);

    result = actionOK(columns.hide(0, 2));
    eq(result.result.count, 2);
    eqArray(result.result.schemaIndexes, [0, 1]);
    assertCount(columns.count, 5, 2);
    eqArray(columns.count.details, [
      [-1, 2],
      [1, 1],
    ]);
    eqArray(columns.llist.toJSON(), [
      -1,
      { head: 1, hide: [0, 1] },
      2,
      3,
      { hide: [4] },
      5,
      { rest: 1 },
    ]);

    const result2 = actionOK(columns.unhide(0, 2));
    eq(result2.result.count, 2);
    eqArray(result2.result.schemaIndexes, [0, 1]);
    assertCount(columns.count, 5, 4);
    eqArray(columns.count.details, [[3, 1]]);
    eqArray(columns.llist.toJSON(), [
      -1,
      { head: 1 },
      ...sequence(0, 3),
      { hide: [4] },
      5,
      { rest: 1 },
    ]);

    const result3 = actionOK(columns.unhide(3, 1));
    eq(result3.result.count, 1);
    eqArray(result3.result.schemaIndexes, [4]);
    assertCount(columns.count, 5, 5);
    eqArray(columns.count.details, []);
    eqArray(columns.llist.toJSON(), [
      -1,
      { head: 1 },
      ...sequence(0, 5),
      { rest: 1 },
    ]);
  });

  it('unhide all', () => {
    const columns = new ColumnManager(defaultSchemaGetter);

    // 0 -> 20
    actionOK(columns.touch(19));
    columns.hide(0, 1); // hide 0
    eqArray(columns.llist.toJSON(), [
      -1,
      { head: 1, hide: [0] },
      1,
      { rest: 1 },
    ]);

    columns.hide(1, 2); // hide 2, 3
    eqArray(columns.llist.toJSON(), [
      -1,
      { head: 1, hide: [0] },
      1,
      { hide: [2, 3] },
      4,
      { rest: 1 },
    ]);

    columns.hide(2, 3); // hide 5, 6, 7
    eqArray(columns.llist.toJSON(), [
      -1,
      { head: 1, hide: [0] },
      1,
      { hide: [2, 3] },
      4,
      { hide: [5, 6, 7] },
      8,
      { rest: 1 },
    ]);
    eqArray(columns.count.details, [
      [-1, 1],
      [0, 2],
      [1, 3],
    ]);

    //
    // start unhide test
    //
    // unhide all columns
    const { result, undo } = actionOK(columns.unhide(-1, 100));
    const schemaIndexes = [0, 2, 3, 5, 6, 7];
    eq(result.count, 6);
    eqArray(result.schemaIndexes, schemaIndexes);
    eqArray(undo.args.schemaIndexes, schemaIndexes);
    eqArray(columns.count.details, []);
  });
});
