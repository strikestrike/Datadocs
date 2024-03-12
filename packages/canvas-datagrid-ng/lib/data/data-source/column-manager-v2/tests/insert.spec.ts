/// <reference types="mocha" />

import { ColumnManager } from '..';
import type { SerializedLinkedColumnNode } from '../linked-node';
import {
  assertCount,
  defaultSchemaGetter,
  eq,
  eqArray,
  sequence,
} from './_utils';

const newColumns = [
  {
    id: 'i_am_a_new_one',
    title: 'NEW',
    dataKey: 'new',
  },
  {
    id: 'i_am_another_new_one',
    title: 'NEW',
    dataKey: 'new2',
  },
  {
    id: 'i_am_another_new_one2',
    title: 'NEW',
    dataKey: 'new3',
  },
];

describe('Test ColumnManager', () => {
  it('insert with reserved indexes', () => {
    const columns = new ColumnManager(defaultSchemaGetter);
    columns.reserveIndexes(50);

    assertCount(columns.count, 0, 0);
    columns.touch(10 - 1);

    assertCount(columns.count, 10, 10);
    eq(columns.llist.toJSON(), [-1, { head: 1 }, 50, { rest: 1 }]);
    eq(columns.lastVisible, { schemaIndex: 59, viewIndex: 9 });

    const schemaIndex = columns.viewIndex.resolve(5);
    eq(schemaIndex, 55);

    const inserted = columns.insert(schemaIndex, newColumns[0]);
    eq(inserted.ok, true);
    eq(inserted.result.schemaIndex, 0);
    eq(inserted.result.viewIndex, 6);
    eq(inserted.result.hidden, false);

    assertCount(columns.count, 11, 11);
    // console.log(columns.llist.toJSON());
    eqArray(columns.llist.toJSON(), [
      -1,
      { head: 1 },
      ...sequence(50, 55),
      0,
      56,
      { rest: 1 },
    ]);
  });

  it('insert', () => {
    const columns = new ColumnManager(defaultSchemaGetter);
    assertCount(columns.count, 0, 0);
    columns.touch(10 - 1);

    assertCount(columns.count, 10, 10);
    eq(columns.llist.toJSON(), [-1, { head: 1 }, 0, { rest: 1 }]);
    eq(columns.lastVisible, { schemaIndex: 9, viewIndex: 9 });

    const schemaIndex = columns.viewIndex.resolve(5);
    eq(schemaIndex, 5);

    const inserted = columns.insert(schemaIndex, newColumns[0]);
    eq(inserted.ok, true);
    eq(inserted.result.schemaIndex, 10);
    eq(inserted.result.viewIndex, 6);
    eq(inserted.result.hidden, false);

    assertCount(columns.count, 11, 11);
    // console.log(columns.llist.toJSON());
    const expectedLList: SerializedLinkedColumnNode = [
      -1,
      { head: 1 },
      ...sequence(0, 5),
      10,
      ...sequence(6, 9),
      11,
      { rest: 1 },
    ];
    eqArray(columns.llist.toJSON(), expectedLList);

    columns.touch(12 - 1);
    assertCount(columns.count, 12, 12);
    // the linked list is not changed
    eqArray(columns.llist.toJSON(), expectedLList);

    {
      const schemaIndex = columns.viewIndex.resolve(19);
      eq(schemaIndex, 19);

      const inserted = columns.insert(schemaIndex, newColumns[1]);
      eq(inserted.ok, true);
      eq(inserted.result.schemaIndex, 20);
      eq(inserted.result.viewIndex, 20);
      eq(inserted.result.hidden, false);

      assertCount(columns.count, 21, 21);
      eqArray(columns.llist.toJSON(), expectedLList);
    }

    {
      const schemaIndex = columns.viewIndex.resolve(14);
      eq(schemaIndex, 14);

      const inserted = columns.insert(schemaIndex, newColumns[2]);
      eq(inserted.ok, true);
      eq(inserted.result.schemaIndex, 21);
      eq(inserted.result.viewIndex, 15);
      eq(inserted.result.hidden, false);

      assertCount(columns.count, 22, 22);
      // console.log(columns.llist.toJSON());
      eqArray(columns.llist.toJSON(), [
        -1,
        { head: 1 },
        ...sequence(0, 5),
        10,
        ...sequence(6, 9),
        ...sequence(11, 14),
        21,
        ...sequence(15, 20),
        22,
        { rest: 1 },
      ]);
    }
  });

  it('insert from scratch', () => {
    const columns = new ColumnManager(defaultSchemaGetter);
    assertCount(columns.count, 0, 0);

    const inserted = columns.insert(-1, newColumns[0]);
    eq(inserted.ok, true);
    eq(inserted.result.schemaIndex, 0);
    eq(inserted.result.viewIndex, 0);
    eq(inserted.result.hidden, false);

    assertCount(columns.count, 1, 1);
    eqArray(columns.llist.toJSON(), [-1, { head: 1 }, 0, 1, { rest: 1 }]);

    const inserted2 = columns.insert(0, newColumns[0]);
    eq(inserted2.ok, true);
    eq(inserted2.result.schemaIndex, 1);
    eq(inserted2.result.viewIndex, 1);
    eq(inserted2.result.hidden, false);

    assertCount(columns.count, 2, 2);
    eqArray(columns.llist.toJSON(), [-1, { head: 1 }, 0, 1, { rest: 1 }]);
  });

  it('insert hidden column', () => {
    const columns = new ColumnManager(defaultSchemaGetter);
    assertCount(columns.count, 0, 0);

    columns.touch(4, false);
    eqArray(columns.llist.toJSON(), [-1, { head: 1 }, 0, { rest: 1 }]);

    columns.hide(0, 2);
    console.log(columns.llist.toJSON());

    // columns.hide(0, 2);
    // eqArray(columns.llist.toJSON(), [
    //   -1,
    //   { head: 1, hide: [0, 1] },
    //   2,
    //   { rest: 1 },
    // ]);
  });
});
