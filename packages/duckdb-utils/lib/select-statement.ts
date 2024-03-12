import {
  SelectItemListContext,
  IdentifierContext,
  TableAliasColumnLabelsContext,
  TableItemContext,
  TableAliasContext,
  SelectStarContext,
  SelectOneContext,
  AliasContext,
  SimplePathContext,
  SimpleSelectContext,
} from './antlr/DuckDBSQLParser.js';
import type { SelectStatementContext } from './antlr/DuckDBSQLParser.js';
import { FromClauseContext } from './antlr/DuckDBSQLParser.js';
import {
  astToString,
  bfsDescendants,
  dfsDescendants,
  matchChild,
} from './ast-utils';
import { parseDuckDBSQL } from './parser.js';
import { TerminalNode } from 'antlr4ts/tree/TerminalNode';
import { ParserRuleContext } from 'antlr4ts';

type SelectItem = {
  allOf?: true | string;
  name?: string;
  expr?: string;
};

type TreeNode = {
  depth: number;
  /** null if this node is the root */
  node: ParserRuleContext;
  list: SelectItemListContext;
  items: SelectItem[];
  table?: string;

  alias?: string;
  colNames?: string[];
  from: TreeNode[];

  getParent(): TreeNode;
};

const intiTreeNode = (
  parent: TreeNode | null,
  partial: Partial<TreeNode>,
): TreeNode => {
  return {
    depth: 0,
    node: null,
    list: null,
    items: [],
    from: [],
    ...partial,
    getParent: () => parent,
  } as any;
};

const DO_NOT_ENTER_FROM_CLAUSE = (node: unknown) =>
  node instanceof FromClauseContext;
const NODES_JSON_REPLACER = (key: string, value: any) => {
  if (value instanceof ParserRuleContext) return astToString(value);
  return value;
};

export class ParseSelectStatement {
  static fromSQL(sql: string) {
    return new ParseSelectStatement(
      parseDuckDBSQL(sql).parser.selectStatement(),
    );
  }

  readonly selects: TreeNode[];
  constructor(private root: SelectStatementContext) {
    this.selects = bfsDescendants(root, SimpleSelectContext).map((node) =>
      intiTreeNode(null, { node }),
    );
    const queue = [...this.selects];
    while (queue.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const job = queue.pop()!;
      const fromStatements = bfsDescendants(job.node, FromClauseContext);
      const nextDepth = job.depth + 1;

      for (let i = 0; i < fromStatements.length; i++) {
        const from = fromStatements[i];
        const list = bfsDescendants(
          from.parent,
          SelectItemListContext,
          DO_NOT_ENTER_FROM_CLAUSE,
          1,
        )[0];
        // console.log(debugAST(list));
        job.list = list;

        const starItems = bfsDescendants(list, SelectStarContext);
        const items = bfsDescendants(list, SelectOneContext);
        starItems.forEach((it) => {
          const idNode = matchChild(it, IdentifierContext);
          job.items.push({ allOf: idNode?.text || true });
        });
        items.forEach((it) => {
          // TODO: `COLUMNS` syntax
          const firstTerm = dfsDescendants(it as any, TerminalNode, null, 1)[0];
          const expr = astToString(it.children[0]);
          let name = matchChild(
            matchChild(it, AliasContext),
            IdentifierContext,
          )?.text;
          if (!name) name = firstTerm.text || '';
          job.items.push({ expr, name });
        });

        const tableItems = bfsDescendants(
          from,
          TableItemContext,
          DO_NOT_ENTER_FROM_CLAUSE,
          1,
        );
        if (tableItems.length === 0) {
          console.warn(`Invalid 'FROM' node: ${from.text}`);
          continue;
        }

        let alias: string;
        let colNames: string[];
        const aliasNode = matchChild(tableItems[0].parent, TableAliasContext);
        if (aliasNode) {
          const idNode = matchChild(aliasNode, IdentifierContext);
          const colsNode = matchChild(
            aliasNode[0],
            TableAliasColumnLabelsContext,
          );
          alias = idNode.text;
          if (colsNode) {
            const cols = bfsDescendants(colsNode, IdentifierContext);
            colNames = cols.map((it) => it.text);
          }
        }

        const childNode = intiTreeNode(job, {
          depth: nextDepth,
          node: from,
          alias,
          colNames,
        });
        job.from.push(childNode);
        // console.log(debugAST(tableItems[0]));
        if (tableItems[0] instanceof SimplePathContext)
          childNode.table = astToString(tableItems[0]);
        else queue.push(childNode);
      }
    }
  }
  debug(sub?: any) {
    const debug = JSON.stringify(sub || this.selects, NODES_JSON_REPLACER, 2);
    console.log(debug);
  }

  get deepestNodes(): TreeNode[] {
    const nodes: TreeNode[] = [];
    const queue = [...this.selects].reverse();
    while (queue.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const node = queue.pop()!;
      if (node.from.length === 0) {
        nodes.push(node);
        continue;
      }
      for (let i = node.from.length - 1; i >= 0; i--) queue.push(node.from[i]);
    }
    return nodes;
  }

  addSelectItem(items: Array<{ expr: string; alias: string }>) {
    let added = false;
    let ptr = this.deepestNodes[0];
    while (ptr) {
      if (ptr.list) {
        if (added) {
          let sql: string | undefined;
          const fromAlias = ptr.from[0].alias;
          let hasAll = ptr.items.find((it) => it.allOf === true);
          if (!hasAll && fromAlias)
            hasAll = ptr.items.find((it) => it.allOf == fromAlias);
          if (!hasAll) {
            sql = items
              .map((it) => {
                return fromAlias
                  ? `${fromAlias}.${it.alias}, `
                  : `${it.alias}, `;
              })
              .join('');
          }
          if (sql) ptr.list.children.unshift({ text: sql } as any);
        } else {
          // !added
          const sql = items.map((it) => `${it.expr} AS ${it.alias}, `).join('');
          ptr.list.children.unshift({ text: sql } as any);
          added = true;
        }
      }
      ptr = ptr.getParent();
    }
  }

  toString() {
    return astToString(this.root);
  }
}
