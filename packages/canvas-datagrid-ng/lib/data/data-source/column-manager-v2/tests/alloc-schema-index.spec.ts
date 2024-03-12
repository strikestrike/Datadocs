import { ColumnManager } from '..';
import { assertNode } from '../linked-node/tests/_utils';
import { assertCount, defaultSchemaGetter, eq } from './_utils';

describe('Test ColumnManager', () => {
  it('alloc schema index', () => {
    const columns = new ColumnManager(defaultSchemaGetter);
    assertCount(columns.count, 0, 0);

    columns.touch(9);
    assertCount(columns.count, 10, 10);

    const result = columns.allocSchemaIndex();
    eq(result.index, 10);
    // alloc schema index doesn't affect the actual count
    assertCount(columns.count, 10, 10);
    assertNode(columns.tail, 11, 'rest');
  });

  it('alloc schema index from removed', () => {
    const columns = new ColumnManager(defaultSchemaGetter);
    assertCount(columns.count, 0, 0);

    columns.touch(9);
    assertCount(columns.count, 10, 10);

    const removeResult = columns.remove(4);
    eq(removeResult.ok, true);
    eq(removeResult.result.schemaIndex, 4);
    eq(removeResult.result.viewIndex, 4);
    assertCount(columns.count, 9, 9);
    eq(columns.llist.toArray(), [-1, 0, 1, 2, 3, 5]);

    const result = columns.allocSchemaIndex();
    eq(result.index, 4);
    eq(result.reused, true);
    // alloc schema index doesn't affect the actual count
    assertCount(columns.count, 9, 9);
    eq(columns.llist.toArray(), [-1, 0, 1, 2, 3, 5]);
  });

  it('alloc schema index from reserved indexes', () => {
    const columns = new ColumnManager(defaultSchemaGetter);
    assertCount(columns.count, 0, 0);

    const totalReservedIndexes = 1;
    columns.reserveIndexes(totalReservedIndexes);

    columns.touch(9);
    assertCount(columns.count, 10, 10);
    eq(columns.llist.toJSON(), [-1, { head: 1 }, 1, { rest: 1 }]);

    const result = columns.allocSchemaIndex();
    eq(result.index, 0);
    eq(result.reserved, true);
    // alloc schema index doesn't affect the actual count
    assertCount(columns.count, 10, 10);
    eq(columns.llist.toJSON(), [-1, { head: 1 }, 1, { rest: 1 }]);

    const result2 = columns.allocSchemaIndex();
    eq(result2.index, 10 + totalReservedIndexes);
    // alloc schema index doesn't affect the actual count
    assertCount(columns.count, 10, 10);
    assertNode(columns.llist.tail, result2.index + 1, 'rest');
  });
});
