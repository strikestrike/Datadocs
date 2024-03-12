import {
  IdentifierSymbolNode,
  SelectNode,
  StarSymbolNode,
} from '@datadocs/ast';
import { SqlParser } from '@datadocs/ast';

/**
 * @deprecated
 * This function is used for development purpose only.
 * Because the input SQL may contain `JOIN` or `UNION`
 */
export function getTableFromQuery(sql: string): string | undefined {
  if (!sql || typeof sql !== 'string') return;
  const parser = new SqlParser(sql, { mode: 'lax' });

  const rootAstNode = parser.toAst().root;
  if (!(rootAstNode instanceof SelectNode)) return;
  if (!rootAstNode.from) return;

  const children = [...rootAstNode.from.children];
  while (children.length > 0) {
    const child = children.shift();
    if (child instanceof StarSymbolNode) {
      children.push(child.parent);
      continue;
    }
    if (child instanceof IdentifierSymbolNode) return child.identifier;
    if (child instanceof SelectNode) {
      if (child.from) children.push(...child.from.children);
      continue;
    }
  }
}
