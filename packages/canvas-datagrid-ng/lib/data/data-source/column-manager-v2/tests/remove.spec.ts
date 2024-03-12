/// <reference types="mocha" />

import { deepStrictEqual } from 'assert';
import { ColumnManager } from '..';

describe('Test ColumnManager', () => {
  it('remove', () => {
    const columns = new ColumnManager((schemaIndex, viewIndex) => {
      return { id: schemaIndex };
    });
    deepStrictEqual(columns.count.all, 0);

    // 0+
    deepStrictEqual(columns.remove(5).ok, false);
    deepStrictEqual(columns.count.all, 0);
    deepStrictEqual(columns.llist.toArray(), [-1, 0]);

    // 0, 1, 2, 3, 4, [5], 6+
    // 0, 1, 2, 3, 4, 6+
    columns.touch(9);
    deepStrictEqual(columns.remove(5).ok, true);
    deepStrictEqual(columns.count.all, 9);
    deepStrictEqual(columns.llist.toArray(), [-1, 0, 1, 2, 3, 4, 6]);

    // 0, 1, 2, 3, 4, [5], 6+
    // 0, 1, 2, 4, 6+
    deepStrictEqual(columns.remove(3).ok, true);
    deepStrictEqual(columns.count.all, 8);
    deepStrictEqual(columns.llist.toArray(), [-1, 0, 1, 2, 4, 6]);

    // schemaIndex: 0, 1, 2, 4, 6+
    // schemaIndex: 0, 1, 2, 4, 6, 7, 8, 9
    //   viewIndex: 0, 1, 2, 3, 4, 5, 6, 7
    console.log(columns.getSchema(7).id);
  });
});
