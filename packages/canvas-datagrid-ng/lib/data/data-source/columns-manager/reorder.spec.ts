/// <reference types="mocha" />

import { assertWithName } from '../../../spec-util';
import { ColumnsManager } from '.';
import { guessColumnSchemas } from '../guess-schema';

/**
 * 0 1 2 3 4 5 6 7 8
 * A B C D E F G H I
 */
const sample = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  E: 'E',
  F: 'F',
  G: 'G',
  H: 'H',
  I: 'I',
};

describe('Test ColumnsManager', () => {
  it('reset', () => {
    const columns = new ColumnsManager(guessColumnSchemas([sample]));
    const initColumnIds = columns.map((it) => it.id);
    columns.hide(0, 5);
    columns.reset();
    assertWithName(
      'columns after reset',
      columns.getAll().map((it) => it.id),
      initColumnIds,
    );
  });

  it('reorder (simple)', () => {
    const columns = new ColumnsManager(guessColumnSchemas([sample]));
    // move the column B after the column `C`
    let result = columns.reorder(1, 1, 2);
    assertWithName('reorder result', result, { newIndex: 2 });
    assertWithName(
      'columns after reorder',
      columns.getAll().map((it) => it.id),
      'ACBDEFGHI'.split(''),
    );

    // move the column B back to original position
    result = columns.reorder(2, 1, 0);
    assertWithName('reorder result', result, { newIndex: 1 });
    assertWithName(
      'columns after reorder',
      columns.getAll().map((it) => it.id),
      'ABCDEFGHI'.split(''),
    );
  });

  it('reorder', () => {
    const columns = new ColumnsManager(guessColumnSchemas([sample]));
    // move CD to the beginning
    columns.reorder(columns.getViewIndex('C'), 2, -1);
    assertWithName(
      'columns after reorder',
      columns.getAll().map((it) => it.id),
      'CDABEFGHI'.split(''),
    );

    // move AB after the 'C'
    columns.reorder(columns.getViewIndex('A'), 2, 0);
    assertWithName(
      'columns after reorder',
      columns.getAll().map((it) => it.id),
      'CABDEFGHI'.split(''),
    );

    columns.reset();
    assertWithName(
      'columns after reset',
      columns.getAll().map((it) => it.id),
      'ABCDEFGHI'.split(''),
    );
  });
});
