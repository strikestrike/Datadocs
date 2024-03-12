/// <reference types="mocha" />

import { ColumnManager } from '..';
import {
  eq,
  assertCount,
  defaultSchemaGetter,
  assertColumnSchemas,
} from './_utils';
import { ok } from 'assert';
import { assertNode } from '../linked-node/tests/_utils';

describe('Test ColumnManager (kintchen sink)', () => {
  it('kintchen sink', () => {
    const columns = new ColumnManager(defaultSchemaGetter);

    eq(columns.llist.toArray(), [-1, 0]);

    // The indexes in the range [0, 99] are reserved for inserted nodes/columns
    eq(columns.reserveIndexes(100), true);
    eq(columns.llist.toArray(), [-1, 100]);

    // Reserve failed because reserved already
    eq(columns.reserveIndexes(200), false);

    // when the user adjust size,
    // exlcuding the user's unlimited scrolling to the right
    // touch viewIndex 3
    columns.touch(3, false);

    // nothing change in the llist
    eq(columns.llist.toArray(), [-1, 100]);
    assertCount(columns.count, 4, 4);

    const result = columns.updateSchema(
      {
        fields: {
          title: 'HAHA',
        },
      },
      2,
      false,
    );
    ok(result.ok);

    // console.log(result.result);
    // nothing change in the llist
    eq(columns.llist.toArray(), [-1, 100]);
    assertCount(columns.count, 4, 4);

    assertColumnSchemas(
      columns,
      ['A', 'B', 'HAHA', 'D', 'E'],
      [100, 101, 102, 103, 104],
    );

    const result2 = columns.hide(1, 2);
    eq(result2.ok, true);
    eq(result2.result.count, 2);
    eq(result2.result.schemaIndexes, [101, 102]);

    assertCount(columns.count, 4, 2);
    // logLList(columns.llist);

    assertColumnSchemas(columns, ['A', 'D', 'E', 'F', 'G']);

    const firstSchema = columns.getSchema(0);
    eq(firstSchema.viewIndex, 0);
    eq(firstSchema.schemaIndex, 100);

    const result3 = columns.unhide(firstSchema.schemaIndex, 1);
    eq(result3.result.count, 2);
    eq(result3.result.schemaIndexes, [101, 102]);
    assertColumnSchemas(
      columns,
      ['A', 'B', 'HAHA', 'D', 'E'],
      [100, 101, 102, 103, 104],
    );

    // touching a touched column doesn't change anything
    eq(columns.touch(3, false).ok, false);
    assertCount(columns.count, 4, 4);

    const result4 = columns.hide(1, 3);
    eq(result4.ok, true);
    eq(result4.result.count, 3);
    eq(result4.result.schemaIndexes, [101, 102, 103]);
    assertCount(columns.count, 4, 1);

    const result5 = columns.unhide(102, 1);
    eq(result5.ok, true);
    eq(result5.result.count, 1);
    eq(result5.result.schemaIndexes, [102]);
    assertCount(columns.count, 4, 2);
    assertColumnSchemas(columns, ['A', 'HAHA', 'E', 'F'], [100, 102, 104, 105]);

    eq(columns.remove(-1, true).ok, false);
    eq(columns.remove(-1, false).ok, false);
    eq(columns.remove(0, true).ok, false);

    // remove the first column
    const result6 = columns.remove(0, false);
    eq(result6.ok, true);
    eq(result6.result.schemaIndex, 100);
    eq(result6.result.viewIndex, 0);
    eq(result6.result.hidden, false);
    ok(!result6.result.schema); // because the column A was not changed
    eq(result6.result.defaultSchema.title, 'A');
    assertCount(columns.count, 3, 1);
    assertNode(columns.llist, -1, 'head', [101]);

    // remove a hidden column
    const result7 = columns.remove(101, true);
    eq(result7.ok, true);
    eq(result7.result.schemaIndex, 101);
    eq(result7.result.viewIndex, -1);
    eq(result7.result.hidden, true);
    assertCount(columns.count, 2, 1);
    eq(columns.llist.toJSON(), [
      -1,
      { head: 1 },
      102,
      { hide: [103] },
      104,
      { rest: 1 },
    ]);
  });
});
