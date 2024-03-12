import type { ColumnManager } from '.';
import { ACTION_FAILED } from './const';
import { expandRestNode } from './linked-node/expand';
import { findLinkedNode } from './linked-node/find';
import type { ActionResultWithUndoDescriptor } from './types';

/**
 * Elementary action: remove
 */
export function remove(
  this: ColumnManager<any>,
  index: number,
  isSchemaIndex?: boolean,
): ActionResultWithUndoDescriptor<'remove', 'restore'> {
  if (index < 0) return ACTION_FAILED;

  let schemaIndex: number;
  if (isSchemaIndex) schemaIndex = index;
  else {
    schemaIndex = this.viewIndex.resolve(index);
    if (schemaIndex < 0) return ACTION_FAILED;
  }

  if (this.removed.has(schemaIndex)) return ACTION_FAILED;

  const resolved = findLinkedNode(schemaIndex, this.llist, -1);
  if (!resolved) return ACTION_FAILED;

  let viewIndex: number;
  let afterSchemaIndex: number;
  const isHidden = resolved.parent ? true : false;
  if (isHidden) {
    viewIndex = resolved.parentOffset;
    afterSchemaIndex = resolved.parent.schemaIndex;
  } else {
    viewIndex = resolved.offset + (resolved.restOffset ?? 0);
    afterSchemaIndex = resolved.node.prev.schemaIndex;
  }
  if (viewIndex >= this.count.visible) return ACTION_FAILED;

  let removeNode = resolved.node;

  if (resolved.node.isRest) {
    const offset = schemaIndex - resolved.node.schemaIndex;
    const { tail } = expandRestNode(resolved.node, offset + 1);
    removeNode = tail.prev;
  }

  const schema = this.schemas[schemaIndex];
  const [defaultSchema] = this.generateDefaultSchemas([schemaIndex, viewIndex]);

  if (isHidden && !removeNode.prev) {
    // it is the first hidden node
    const newFirstHiddenNode = removeNode.next;
    resolved.parent.hide = newFirstHiddenNode;
    if (newFirstHiddenNode) delete newFirstHiddenNode.prev;
  } else {
    removeNode.unlink();
  }
  this.viewIndex.reset();
  this.removed.add(schemaIndex);
  this.schemas[schemaIndex] = null;
  this.count.remove(viewIndex, isHidden);
  return {
    ok: true,
    result: {
      schemaIndex,
      viewIndex,
      hidden: isHidden,
      schema,
      defaultSchema,
    },
    undo: {
      type: 'restore',
      args: {
        schemaIndex,
        afterSchemaIndex,
        hidden: isHidden,
        schema,
      },
    },
  };
}
