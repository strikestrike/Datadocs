/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { deepStrictEqual as eq } from 'assert';
import {
  FromClauseContext,
  SelectItemListContext,
} from './antlr/DuckDBSQLParser.js';
import { astToString, bfsDescendants, debugAST } from './ast-utils.js';
import { parseDuckDBSQL } from './parser.js';

describe('ast-utils', () => {
  it('#astToString', () => {
    const sql =
      "WITH tableA AS (VALUES(1,'2')) SELECT id FROM (SELECT * FROM test2) AS test UNION ALL SELECT * FROM tableA";
    const { parser } = parseDuckDBSQL(sql);
    const selectNode = parser.selectStatement();
    const sql2 = astToString(selectNode);
    // console.log(sql2);
    eq(sql.replace(/\s+/g, ''), sql2.replace(/\s+/g, ''));
  });

  it('#astToString 2', () => {
    const sql = 'SELECT * FROM (SELECT * FROM a) b';
    const { parser } = parseDuckDBSQL(sql);
    const selectNode = parser.selectStatement();
    // console.log(debugAST(selectNode));

    const fromTree: FromClauseContext[] = [];
    let newFrom = bfsDescendants(selectNode, FromClauseContext);
    while (newFrom.length > 0) {
      const from = newFrom[0];
      fromTree.push(from);
      newFrom = bfsDescendants(from, FromClauseContext);
    }
    let inserted = false;
    const uniqueName = '__dd_rowid';
    for (let i = fromTree.length - 1; i >= 0; i--) {
      const from = fromTree[i];
      const select = from.parent;
      const itemList = bfsDescendants(select, SelectItemListContext)[0];
      if (itemList) {
        const text = (inserted ? '' : 'rowid AS ') + uniqueName;
        itemList.children?.unshift({ text, childCount: 0 } as any);
        inserted = true;
      }
      console.log(i, debugAST(select));
    }
    console.log(astToString(selectNode));
  });
});
