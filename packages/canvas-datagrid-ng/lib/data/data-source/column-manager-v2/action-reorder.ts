import type { ColumnManager } from '.';
import { ACTION_FAILED } from './const';
import { expandRestNode } from './linked-node/expand';
import type { ActionResultWithUndoDescriptor } from './types';

/**
 * Elementary action: reorder
 * @todo reorder can increase the size
 */
export function reorder(
  this: ColumnManager<any>,
  viewIndex: number,
  count: number,
  afterViewIndex: number,
): ActionResultWithUndoDescriptor<'reorder', 'reorder'> {
  if (count <= 0 || viewIndex < 0) return ACTION_FAILED;

  const endViewIndex = viewIndex + count - 1;
  if (afterViewIndex >= viewIndex - 1 && afterViewIndex <= endViewIndex)
    // or we can set `endViewIndex + 1` as the value of `endViewIndex`
    // when the condition is true
    return ACTION_FAILED;

  //  0  1  2  3  4  5  6
  // +-------------------+
  //  A  B  C  D  E  F  G
  // [A  B  C] D  E* F  G
  //  D  E  A  B  C  F  G
  // +-------------------+
  // *A  B [C  D  E] F  G
  //  C  D  E  A  B  F  G
  // +-------------------+
  // newViewIndex = 4 - ( 3 - 1 ) = 2
  //
  const isForward = afterViewIndex > endViewIndex;
  const newViewIndex = isForward
    ? afterViewIndex - (count - 1)
    : afterViewIndex + 1;
  const undoViewIndex = isForward ? viewIndex - 1 : viewIndex - 1 + count;

  const { visible } = this.count;

  // virtual reordering without any actual changes.
  if (viewIndex >= visible && afterViewIndex >= viewIndex) {
    const resolved = this.viewIndex.resolveNode(viewIndex);
    const undoSchemaIndex = resolved.node.prev.schemaIndex;
    return {
      ok: true,
      result: {
        virtual: true,
        beginSchemaIndex: resolved.schemaIndex,
        count,
        newViewIndex,
      },
      undo: {
        type: 'reorder',
        args: {
          viewIndex: newViewIndex,
          count,
          afterViewIndex: undoViewIndex,
          afterSchemaIndex: undoSchemaIndex,
        },
      },
    };
  }

  const largestViewIndex = Math.max(endViewIndex, afterViewIndex);
  let resolved = this.viewIndex.resolveNode(largestViewIndex);
  if (resolved.node.isRest) expandRestNode(resolved.node, largestViewIndex + 1);

  resolved = this.viewIndex.resolveNode(viewIndex);
  if (!resolved) ACTION_FAILED;

  const resolved2 = this.viewIndex.resolveNode(afterViewIndex);
  if (!resolved2) ACTION_FAILED;

  const undoSchemaIndex = resolved.node.prev.schemaIndex;
  const subseq = resolved.node.prev.takeOutNext(count);
  if (subseq.length === 0) ACTION_FAILED;

  let incr: number;
  if (afterViewIndex >= visible) {
    incr = afterViewIndex - visible + 1;
  } else if (endViewIndex >= visible) {
    incr = endViewIndex - visible + 1;
    if (viewIndex >= visible) incr -= viewIndex - visible;
  }

  if (typeof incr === 'number') this.count.add(incr);
  resolved2.node.insert(subseq.node);
  this.viewIndex.reset();

  return {
    ok: true,
    result: {
      beginSchemaIndex: resolved.schemaIndex,
      count,
      newViewIndex,
    },
    undo: {
      type: 'reorder',
      args: {
        viewIndex: newViewIndex,
        count,
        afterViewIndex: undoViewIndex,
        afterSchemaIndex: undoSchemaIndex,
        sub: incr,
      },
    },
  };
}
