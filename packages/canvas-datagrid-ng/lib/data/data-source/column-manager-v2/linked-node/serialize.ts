import { LinkedColumnNode } from '.';

/**
 * The type of serialized linked list,
 * and the value with this type is compatible with the `JSON.stringify` method.
 */
export type SerializedLinkedColumnNode = Array<
  | number
  | {
      head?: 1;
      rest?: 1;
      hide?: SerializedLinkedColumnNode;
    }
>;

/**
 * Restore a serialized linked-list
 * @returns A linked-list, or `null` if the input is invalid
 */
export function deserialize(
  savedState: SerializedLinkedColumnNode,
): LinkedColumnNode | null {
  if (savedState.length < 1) return;

  let firstNode: LinkedColumnNode;
  let lastNode: LinkedColumnNode;
  for (let i = 0; i < savedState.length; i++) {
    const state = savedState[i];
    if (typeof state === 'number') {
      const newNode = new LinkedColumnNode(state);
      if (lastNode) lastNode.append(newNode);
      else firstNode = newNode;
      lastNode = newNode;
      continue;
    }
    if (!lastNode) continue; // saved state is broken
    if (state.head) lastNode.isHead = true;
    if (state.rest) lastNode.isRest = true;
    if (state.hide) lastNode.hide = LinkedColumnNode.restore(state.hide);
  }
  return firstNode;
}

/**
 * Serialize a linked list into a simple format
 */
export function serialize(node: LinkedColumnNode): SerializedLinkedColumnNode {
  const result = [];
  let ptr: LinkedColumnNode = node;
  while (ptr) {
    result.push(ptr.schemaIndex);
    if (ptr.isHead || ptr.isRest || ptr.hide) {
      const info: any = {};
      if (ptr.isHead) info.head = 1;
      if (ptr.isRest) info.rest = 1;
      if (ptr.hide) info.hide = ptr.hide.toArray();
      result.push(info);
    }
    ptr = ptr.next;
  }
  return result;
}

/**
 * Dump all schema indexes of a node and its subsequent nodes into an array.
 *
 * @param limit - An optional number parameter to limit the traversal of nodes.
 */
export function dumpValues(node: LinkedColumnNode, limit?: number): number[] {
  const result: number[] = [node.schemaIndex];
  let ptr = node.next;
  if (typeof limit === 'number') {
    let i = 0;
    while (ptr && ++i < limit) {
      result.push(ptr.schemaIndex);
      ptr = ptr.next;
    }
  } else {
    while (ptr) {
      result.push(ptr.schemaIndex);
      ptr = ptr.next;
    }
  }
  return result;
}

/**
 * Creates a linked list from an array of schema indexes.
 * @param length - An optional number parameter to specify the number of nodes to create.
 * This value can be greater than the length of the parameter `schemaIndexes`
 */
export function fromValues(
  schemaIndexes: number[],
  length?: number,
): LinkedColumnNode {
  if (typeof length !== 'number') length = schemaIndexes.length;
  if (length <= 0) return null;

  const head = new LinkedColumnNode(schemaIndexes[0]);
  let prev: LinkedColumnNode = head;
  for (let i = 1; i < length; i++) {
    const node = new LinkedColumnNode(schemaIndexes[i]);
    if (prev) {
      node.prev = prev;
      prev.next = node;
    }
    prev = node;
  }

  head.setTailCache(prev);
  return head;
}
