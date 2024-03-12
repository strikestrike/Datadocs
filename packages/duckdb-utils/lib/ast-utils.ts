import type { ParserRuleContext } from 'antlr4ts';
import type { ParseTree } from 'antlr4ts/tree/ParseTree';

type ClassType<T> = { new (...args: any): T };
const addSpaceBeforeOpenParen = new Set(['from', 'values', 'as', ',']);

export function matchChild<T extends ParseTree>(
  node: ParserRuleContext,
  ChildType: ClassType<T>,
): T | null {
  if (!node || !node.children || node.children.length === 0) return null;
  return node.children.find((it) => it instanceof ChildType) as any;
}

export function matchChildren<T extends ParseTree>(
  node: ParserRuleContext,
  ChildType: ClassType<T>,
): T[] {
  if (!node || !node.children || node.children.length === 0) return [];
  return node.children.filter((it) => it instanceof ChildType) as any[];
}

export function bfsDescendants<T extends ParseTree>(
  node: ParserRuleContext | null | undefined,
  MatchType: ClassType<T>,
  pruningFn?: (node: any) => boolean,
  limit?: number,
): T[] {
  const queue: Array<ParserRuleContext | null | undefined> = [node];
  const matched: T[] = [];
  if (!pruningFn) pruningFn = () => false;

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) continue;
    const childCount = node.childCount;
    for (let i = 0; i < childCount; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const child = node.children![i];
      if (!child || pruningFn(child)) continue;
      if (child instanceof MatchType) {
        matched.push(child);
        if (typeof limit === 'number' && queue.length >= limit) return matched;
        continue;
      }
      queue.push(child as any);
    }
  }
  return matched;
}

export function dfsDescendants<T extends ParseTree>(
  node: ParserRuleContext | null | undefined,
  MatchType: ClassType<T>,
  pruningFn?: (node: any) => boolean,
  limit?: number,
): T[] {
  if (!node || node.childCount === 0) return [];
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const queue: ParserRuleContext[] = [...node.children!].reverse() as any[];
  const matched: T[] = [];
  if (!pruningFn) pruningFn = () => false;

  while (queue.length > 0) {
    const node = queue.pop();
    if (!node) continue;
    if (node instanceof MatchType) {
      matched.push(node);
      if (typeof limit === 'number' && queue.length >= limit) return matched;
      continue;
    }
    const childCount = node.childCount;
    for (let i = childCount - 1; i >= 0; i--) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const child = node.children![i];
      if (!child || pruningFn(child)) continue;
      queue.push(child as any);
    }
  }
  return matched;
}

// export function astSelectByPath<T extends ParseTree>(
//   node: ParserRuleContext,
//   matchPaths: [...ClassType<any>[], ClassType<T>],
// ): ClassType<T>[] {
// }

export function astToString(node: { text: string; children?: any[] }): string {
  const stack = [node];
  const result: string[] = [];
  let lastTextLC: string | undefined;
  let lastIndex = -1;
  while (stack.length > 0) {
    const currNode = stack.pop();
    if (!currNode) continue;
    const { children } = currNode;
    if (children && children.length > 0) {
      for (let i = children.length - 1; i >= 0; i--)
        stack.push(children[i] as any);
      continue;
    }
    const thisText = currNode.text;
    if (lastIndex >= 0) {
      if (thisText === '.') {
        result[lastIndex] += thisText;
        lastTextLC = thisText;
        continue;
      }
      if (!lastTextLC) continue;
      if (thisText === '(' && !addSpaceBeforeOpenParen.has(lastTextLC)) {
        result[lastIndex] += thisText;
        lastTextLC = thisText;
        continue;
      }
      if (thisText === ')' && lastTextLC === '(') {
        result[lastIndex] += thisText;
        lastTextLC = thisText;
        continue;
      }
      if (lastTextLC.endsWith('.')) {
        result[lastIndex] += thisText;
        lastTextLC = thisText.toLowerCase();
        continue;
      }
    }
    lastIndex = result.push(thisText) - 1;
    lastTextLC = thisText.toLowerCase();
  }
  return result.join(' ');
}

export function debugAST(
  ast: ParserRuleContext | undefined | null,
  indent = '',
  isLast = true,
  color = true,
): string {
  if (!ast) return '';

  const { childCount } = ast;
  let result = indent + '+- ' + String(ast.constructor.name);
  if (color) result = '\x1b[2m' + result + '\x1b[0m';
  if (childCount === 0) {
    result += ' ' + JSON.stringify(ast.text);
  } else {
    const lastIndex = childCount - 1;
    ast.children?.forEach((child, i) => {
      const last = i === lastIndex;
      const newIndent = isLast ? indent + '  ' : indent + '| ';
      result += '\n' + debugAST(child as any, newIndent, last, color);
    });
  }
  return result;
}
