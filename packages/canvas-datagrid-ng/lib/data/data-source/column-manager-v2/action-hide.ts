import type { ColumnManager } from '.';
import { ACTION_FAILED } from './const';
import { expandRestNode } from './linked-node/expand';
import { findLinkedNode } from './linked-node/find';
import { unhidePartialNodes } from './linked-node/unhide-partial';
import type { ActionResultWithUndoDescriptor } from './types';

/**
 * Elementary action: hide
 */
export function hide(
  this: ColumnManager<any>,
  viewIndex: number,
  count = 1,
): ActionResultWithUndoDescriptor<'hide', 'unhide'> {
  const allVisible = this.count.visible;
  const maxCount = allVisible - viewIndex;
  if (count > maxCount) count = maxCount;
  if (count < 1) return ACTION_FAILED;
  if (viewIndex < 0) return ACTION_FAILED;

  const resolved = this.viewIndex.resolveNode(viewIndex);
  if (!resolved) return ACTION_FAILED;

  const resolvedNode = resolved.node;
  let baseNode = resolved.node;
  if (resolvedNode.isRest) {
    const expResult = expandRestNode(resolvedNode, resolved.restOffset + 1);
    baseNode = expResult.tail.prev;
  }

  const resolved2 = this.viewIndex.resolveNode(viewIndex + count);
  if (!resolved2) return ACTION_FAILED;
  if (resolved2.node.isRest)
    expandRestNode(resolved2.node, resolved2.restOffset);

  const schemaIndexes: number[] = [];
  const endSchemaIndex = resolved2.node.schemaIndex;
  let ptr = baseNode;
  while (ptr) {
    if (ptr.schemaIndex === endSchemaIndex) break;
    schemaIndexes.push(ptr.schemaIndex);
    ptr = ptr.next;
  }

  const actualCount = baseNode.prev.hideNext(count);
  this.count.hide(viewIndex - 1, actualCount);
  return {
    ok: true,
    result: {
      count: actualCount,
      schemaIndexes,
    },
    undo: {
      type: 'unhide',
      args: {
        schemaIndexes,
      },
    },
  };
}

/**
 *Elementary action: unhide
 */
export function unhide(
  this: ColumnManager<any>,
  schemaIndex: number,
  count: number,
): ActionResultWithUndoDescriptor<'unhide', 'hide'> {
  const found = findLinkedNode(schemaIndex, this.llist, -1);
  if (!found) return ACTION_FAILED;

  let actualCount: number;
  const schemaIndexes: number[] = [];
  const getResult = (): ActionResultWithUndoDescriptor<'unhide', 'hide'> => ({
    ok: true,
    result: {
      count: actualCount,
      schemaIndexes,
    },
    undo: {
      type: 'hide',
      args: {
        schemaIndexes,
      },
    },
  });

  if (found.parent) {
    const unhideResult = unhidePartialNodes(found.parent, found.offset, count);
    actualCount = unhideResult.count;
    let ptr = unhideResult.begin;
    while (ptr) {
      schemaIndexes.push(ptr.schemaIndex);
      if (ptr === unhideResult.end) break;
      ptr = ptr.next;
    }
    this.count.unhide(found.parentOffset, found.offset, actualCount);
    return getResult();
  }

  actualCount = 0;
  let ptr = found.node;
  let offset = found.offset;
  while (ptr && count-- > 0) {
    const next = ptr.next;
    if (ptr.hide) {
      let num = 0;
      let ptr2 = ptr.hide;
      do {
        num++;
        actualCount++;
        schemaIndexes.push(ptr2.schemaIndex);
        ptr2 = ptr2.next;
      } while (ptr2);
      this.count.unhide(offset, 0, num);
      ptr.unhideAll();
      offset += num;
    }
    offset++;
    ptr = next;
  }
  return getResult();
}
