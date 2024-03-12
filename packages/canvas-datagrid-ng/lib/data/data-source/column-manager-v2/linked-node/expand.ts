import { LinkedColumnNode } from '.';

/**
 * E.g., the `node` is `12+`, the `length` is `2`, then the result will be:
 * ``` text
 * ... ->      12    -> 13  -> 14+
 * ... ->      new   -> new -> the original `node`
 * ... -> (expanded) -> ....
 * ... -> (length = 2)      -> ...
 * ```
 * @param length the number of nodes that are going to be expanded.
 * @returns
 * - `expanded`: The first new node that was expanded, which is node `12` in the example.
 * - `tail`: The rest node after expanding, which is the same object as the parameter `node`.
 */
export function expandRestNode(node: LinkedColumnNode, length: number) {
  if (typeof length !== 'number' || length < 1) return;

  // 0, 1, 4, 3, 5+
  // expandRestNode(ref{node{5+}}, 2)
  // 0, 1, 4, 3, (5, 6), 7+
  // new nodes (5,6) length = 2
  let nextData = node.schemaIndex;
  const splitIndexes = new Array(length);
  for (let i = 0; i < length; i++, nextData++) splitIndexes[i] = nextData;

  const expanded = LinkedColumnNode.from(splitIndexes);
  if (node.prev) node.prev.insert(expanded);
  node.schemaIndex = nextData;
  return { expanded, tail: node };
}

/**
 * Expand the rest node and take out a portion of the new nodes.
 * @param range The range of nodes that would be taken out,
 * which is represented by the `piece` field of the result.
 * @returns
 * - `prev`: The node that precedes the first node that was taken out.
 * - `next`: The node that follows the last node that was taken out,
 * which is the same object as the parameter `node`.
 */
export function expandRestNodeAndTakeOut(
  node: LinkedColumnNode,
  range: [beginOffset: number, endOffset: number],
) {
  if (range[0] < 0 || range[1] < range[0]) return;

  const base = node.schemaIndex;
  const firstCut = expandRestNode(node, range[1] + 1);
  if (!firstCut) return;

  const indexes = [base + range[0], base + range[1]];
  const from = firstCut.expanded;
  const begin =
    from.schemaIndex === indexes[0] ? from : from.nextUntil(indexes[0]);
  if (!begin) return;

  const end =
    begin.schemaIndex === indexes[1] ? begin : begin.nextUntil(indexes[1]);
  if (!end) return;

  if (begin.prev) begin.prev.next = end.next;
  end.next.prev = begin.prev;

  const prev = begin.prev;
  const next = node;
  delete begin.prev;
  delete end.next;

  return { piece: begin, prev, next };
}
