import { LinkedColumnNode } from './linked-node';
import type { ColumnManager } from '.';
import type { SerializedLinkedColumnNode } from './linked-node';
import type { ColumnManagerSavedState } from './types';

export class ColumnManagerSerializer<SchemaItem extends { id: any }> {
  constructor(private readonly manager: ColumnManager<SchemaItem>) {}

  save(): ColumnManagerSavedState<SchemaItem> {
    const { manager } = this;
    return {
      count: manager.count.toJSON(),
      removed: Array.from(manager.removed),
      llist: manager.llist.serialize(),
    };
  }

  restoreLinkedList(savedState: SerializedLinkedColumnNode) {
    const newLinkedList = LinkedColumnNode.restore(savedState);
    if (!newLinkedList) return false;

    const { llist, viewIndex } = this.manager;
    llist.replaceWith(newLinkedList);
    viewIndex.reset();
    return true;
  }

  restore(savedState: ColumnManagerSavedState<SchemaItem>) {
    const { manager } = this;
    const { schemas, count, removed, llist } = savedState;
    manager.removed.clear();
    removed.forEach((it) => manager.removed.add(it));
    this.restoreLinkedList(llist);
    manager.count.fromJSON(count);
    manager.count.init(manager.llist);
    if (Array.isArray(schemas)) {
      schemas.forEach((schema, schemaIndex) =>
        manager.bindColumnSchema(schemaIndex, schema),
      );
    } else {
      manager.schemas.length = 0;
    }
  }
}
