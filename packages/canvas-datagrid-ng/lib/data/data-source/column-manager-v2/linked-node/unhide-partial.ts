import type { LinkedColumnNode } from '.';

export type UnhidePartialNodesResult = {
  /** The actual number of unhidden nodes */
  count: number;
  /**
   * This field represents the **first** node of the unhidden nodes.
   * It will not exist if the `count` is `0`
   */
  begin?: LinkedColumnNode;
  /**
   * This field represents the **last** node of the unhidden nodes.
   * It will not exist if the `count` is `0`
   */
  end?: LinkedColumnNode;
};

const NOOP: UnhidePartialNodesResult = Object.freeze({
  count: 0,
});

/**
 * Unhides a specific range of hidden nodes.
 * @param hideOffset The offset of the first node in the hide list that needs to be unhidden.
 * @param count The number of nodes that need to be unhidden.
 * @returns The number of nodes actually unhidden.
 */
export function unhidePartialNodes(
  baseNode: LinkedColumnNode,
  hideOffset = 0,
  count = 1,
): UnhidePartialNodesResult {
  // There is not any hidden columns after this node
  if (!baseNode.hide) return NOOP;

  let begin = baseNode.hide;
  let offset = 0;
  while (offset++ < hideOffset) {
    if (!begin.next) return NOOP;
    begin = begin.next;
  }

  let end = begin;
  let pickedCount = 1;
  while (pickedCount < count) {
    if (!end.next) break;
    end = end.next;
    pickedCount++;
  }

  baseNode.hide.resetTailCache();

  // remove hidden linked list from this node if the user
  // unhides the beginning of hidden columns
  if (begin.prev) delete begin.prev.next;
  else delete baseNode.hide;

  // Move the remaining hidden columns to the last unhidden column.
  if (end.next) {
    delete end.next.prev;
    end.hide = end.next;
  }

  delete begin.prev;
  delete end.next;

  baseNode.insert(begin);
  return {
    count: pickedCount,
    begin,
    end,
  };
}
