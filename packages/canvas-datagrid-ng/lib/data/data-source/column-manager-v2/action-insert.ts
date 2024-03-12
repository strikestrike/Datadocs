import type { ColumnManager } from '.';
import { ACTION_FAILED } from './const';
import { LinkedColumnNode } from './linked-node';
import { expandRestNode } from './linked-node/expand';
import { findLinkedNode } from './linked-node/find';
import type { ActionResultWithUndoDescriptor } from './types';

export type AllocSchemaIndexResult = {
  /** Allocated schema index */
  index: number;
  reused?: boolean;
  reserved?: boolean;
};

export type InsertResult = {
  schemaIndex: number;
  /**
   * If a hidden column is inserted,
   * this field will be set to the view index of the first visible column that
   * precedes the inserted column.
   */
  viewIndex: number;
};

/**
 * Allocates a schema index for a new column that will be inserted into the columns.
 *
 * However, this method does not change the count of the columns.
 * This method only allocates the index from removed indexes, reserved indexes, or
 * the last schema index plus 1. Then, it modifies schema indexes in the linked list.
 */
export function allocSchemaIndex(
  this: ColumnManager<any>,
): AllocSchemaIndexResult {
  const { reduceConflicts, reservedIndexes } = this.config;

  // Firstly, attempt to reuse a removed schema index
  // if the user hasn't enabled the flag `reduceConflicts`
  if (!reduceConflicts) {
    const used = this.removed.values().next();
    if (!used.done) {
      this.removed.delete(used.value);
      return { index: used.value, reused: true };
    }
  }

  // Then, allocate the index from reserved indexes if there are still available indexes
  if (this.nextReserved < reservedIndexes && this.nextReserved >= 0) {
    const index = this.nextReserved++;
    return { index, reserved: true };
  }

  // Finally, extract a schema index from those larger than the schema index currently in use.
  // For example:
  // If the largest schema index in use is`5`,
  // then the result will be `6` and the tail of the linked list will be update to `7`+

  // Calculate the new schema index and the number of the nodes that need to be expanded
  const nodes = this.llist.next.count();
  const columnWithoutNode = this.count.visible - nodes;
  const tailSchemaIndex = this.tail.schemaIndex;
  const newSchemaIndex = tailSchemaIndex + columnWithoutNode + 1;
  expandRestNode(this.tail, columnWithoutNode + 1);

  // Add 1 to the last schemaIndex to avoid conflicts with the new schemaIndex
  this.tail.schemaIndex = newSchemaIndex + 1;
  return { index: newSchemaIndex };
}

/**
 * Elementary action: insert
 * @param afterIndex
 * @param isSchemaIndex
 * @returns
 */
export function insert<SchemaItem extends { id: any }>(
  this: ColumnManager<SchemaItem>,
  afterSchemaIndex: number,
  schema?: SchemaItem,
): ActionResultWithUndoDescriptor<'insert', 'undoInsert'> {
  const schemas = this.schemas;
  const visibleColumns = this.count.visible;

  let isHidden = false;
  let afterViewIndex: number;
  let afterNode: LinkedColumnNode;
  let addImplicitly = 0;
  let needAllocate = true;
  let needInsertNode = true;
  let newSchemaIndex: number;

  if (afterSchemaIndex < 0) {
    // insert in the front of the row
    afterSchemaIndex = -1;
    afterViewIndex = -1;
    afterNode = this.llist;
  } else {
    const result = findLinkedNode(afterSchemaIndex, this.llist, -1);
    if (!result) return ACTION_FAILED;
    afterNode = result.node;
    if (result.parent) {
      // insert in a hidden range
      isHidden = true;
      afterViewIndex = result.parentOffset;
    } else {
      afterViewIndex = result.offset + (result.restOffset ?? 0);
      if (afterViewIndex >= visibleColumns - 1) {
        needAllocate = needInsertNode = false;
      }
    }
    const _addImplicitly = afterViewIndex - visibleColumns + 1;
    if (_addImplicitly > 0) addImplicitly = _addImplicitly;
  }

  if (!needAllocate) {
    newSchemaIndex = afterSchemaIndex + 1;
  } else {
    const result = this.allocSchemaIndex();
    newSchemaIndex = result.index;
  }

  if (addImplicitly > 0) this.count.add(addImplicitly);
  if (!this.count.insert(afterViewIndex, isHidden)) return ACTION_FAILED;
  if (needInsertNode) {
    if (afterNode.isRest) {
      if (afterNode.schemaIndex <= afterSchemaIndex) {
        const len = afterSchemaIndex - afterNode.schemaIndex + 1;
        const expanded = expandRestNode(afterNode, len);
        afterNode = expanded.tail;
      }
      let ptr = afterNode;
      while (ptr) {
        if (ptr.schemaIndex === afterSchemaIndex) {
          afterNode = ptr;
          break;
        }
        ptr = ptr.prev;
      }
    }
    if (afterNode) afterNode.insert(new LinkedColumnNode(newSchemaIndex));
  }
  schemas[newSchemaIndex] = schema;

  return {
    ok: true,
    result: {
      schemaIndex: newSchemaIndex,
      viewIndex: isHidden ? afterViewIndex : afterViewIndex + 1,
      hidden: isHidden,
    },
    undo: {
      type: 'undoInsert',
      args: {
        schemaIndex: newSchemaIndex,
      },
    },
  };
}
