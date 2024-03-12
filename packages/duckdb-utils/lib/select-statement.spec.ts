/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { deepStrictEqual, equal } from 'assert';
import { ParseSelectStatement } from './select-statement.js';

const eq = <T>(actual: T, expected: T) => deepStrictEqual(actual, expected);

describe('ParseSelectStatement', () => {
  it('# simple', () => {
    const sql =
      'SELECT b.*, y_ + 1 as y FROM (SELECT *, x_, random() FROM a a_alias) b';
    const utils = ParseSelectStatement.fromSQL(sql);
    const { selects: nodes } = utils;
    eq(nodes.length, 1);

    const [node] = nodes;
    eq(node.items.length, 2);
    eq(node.items[0], { allOf: 'b' });
    eq(node.items[1], { expr: 'y_ + 1', name: 'y' });

    const child = node.from[0];
    eq(child.items[0], { allOf: true });
    eq(child.items[1], { expr: 'x_', name: 'x_' });
    eq(child.items[2], { expr: 'random()', name: 'random' });
    eq(child.alias, 'b');

    const grandchild = child.from[0];
    eq(grandchild.table, 'a');
    eq(grandchild.alias, 'a_alias');

    equal(grandchild.getParent(), child);
    equal(child.getParent(), node);
  });
  it('# COLUMNS', () => {
    const sql =
      "SELECT random() as rid, COLUMNS('(first|last)_name') FROM b b_alias";
    const utils = ParseSelectStatement.fromSQL(sql);
  });
  it('# VALUES', () => {
    const sql = 'SELECT random() as rid FROM (values(1,2),(3,4)) values_alias';
    const utils = ParseSelectStatement.fromSQL(sql);
  });
  it('# VALUES 2', () => {
    const sql =
      'SELECT random() as rid FROM (values(1,2),(3,4)) values_alias(id,age) LEFT JOIN a ON a.id = values_alias.id';
    const utils = ParseSelectStatement.fromSQL(sql);
  });
  it('# add select item 1', () => {
    const sql = 'SELECT random() as randomid, x.* FROM (SELECT * FROM a) x';
    const utils = ParseSelectStatement.fromSQL(sql);
    utils.addSelectItem([{ expr: 'rowid', alias: '__dd_rowid' }]);
    // console.log(utils.toString());
  });
  it('# add select item 2', () => {
    const sql =
      'SELECT randomid FROM (SELECT random() as randomid, x.* FROM (SELECT * FROM a) x)';
    const utils = ParseSelectStatement.fromSQL(sql);
    utils.debug();
    utils.addSelectItem([{ expr: 'rowid', alias: '__dd_rowid' }]);
    console.log(utils.toString());
  });
});
