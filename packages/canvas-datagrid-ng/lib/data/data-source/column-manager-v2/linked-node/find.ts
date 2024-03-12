import type { LinkedColumnNode } from '.';

/**
 * @see findLinkedNode
 */
export type FindLinkedNodeResult = {
  /** target Node that matches the given `schemaIndex`. */
  node: LinkedColumnNode;
  /**
   * The position of the matched node in the linked list,
   * taking into account the `baseOffset` parameter.
   * So it is equivalent to realOffset plus `baseOffset` parameter
   */
  offset: number;
  /**
   * The parent Node if the matched node is inside a hidden node.
   */
  parent?: LinkedColumnNode;
  /**
   * The position of the parent node in the linked list,
   * taking into account the `baseOffset` parameter.
   * @see FindLinkedNodeResult.offset
   */
  parentOffset?: number;
  /**
   * The difference between the `schemaIndex` and the matched rest node's `schemaIndex`.
   * This field is present only when the matched node is a rest node.
   * If you want to use `findLinkedNode` function to resolve the visible view index,
   * then the view index can be calculated as `offset + restOffset ?? 0`
   */
  restOffset?: number;
};

/**
 * @param schemaIndex The expected schema index to search for in the linked list.
 * @param from The Node representing the linked list to search.
 * @param baseOffset This parameter will affecr the `offset` in the result.
 * Set this value to `-1` to ignore the first node of the linked-list
 * (Because the first node is the header in real grid case)
 * @param onlyVisible If true, the search will skip hidden nodes.
 * @returns {FindLinkedNodeResult}, or `null` if the given `schemaIndex` is not found
 */
export function findLinkedNode(
  schemaIndex: number,
  from: LinkedColumnNode,
  baseOffset = 0,
  onlyVisible = false,
): FindLinkedNodeResult | null {
  let ptr = from;
  let offset = baseOffset;
  while (ptr) {
    if (ptr.isRest && schemaIndex >= ptr.schemaIndex)
      return { node: ptr, offset, restOffset: schemaIndex - ptr.schemaIndex };
    if (ptr.schemaIndex === schemaIndex) return { node: ptr, offset };
    if (ptr.hide && !onlyVisible) {
      const result = findLinkedNode(schemaIndex, ptr.hide);
      if (result) {
        result.parent = ptr;
        result.parentOffset = offset;
        return result;
      }
    }
    ptr = ptr.next;
    offset++;
  }
  return null;
}
