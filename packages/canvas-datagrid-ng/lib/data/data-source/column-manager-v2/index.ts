import { ColumnCounter } from './column-counter';
import { hide, unhide } from './action-hide';
import { LinkedColumnNode } from './linked-node';
import { ViewIndexResolver } from './linked-node/view-index';
import { remove } from './action-remove';
import { reorder } from './action-reorder';
import { touch } from './action-touch';
import type { ColumnManagerConfig, DefaultColumnSchemaGetter } from './types';
import { allocSchemaIndex, insert } from './action-insert';
import { updateSchema } from './action-update-schema';
import { generateDefaultSchemas, getSchemas } from './get-schemas';

/**
 * This is version 2 of column manager.
 *
 * Its core states are composed of the following:
 * - `size`: A integer
 * - `schemas`: An array
 * - `removed`: A schema indexes set
 * - `llist`: A linked list
 * - `defaultColumnGetter`: A function that returns a default schema
 */
export class ColumnManager<SchemaItem extends { id: any }> {
  //#region all basic state of the manager

  /**
   * This indicates the current number of columns being used by the grid.
   *
   * However, this number does not necessarily represent the total number of columns visible
   * to the user in the grid. Because some of the columns that are not close to the front
   * have not been modified.
   *
   * This state is also an important part of borderless/freeform grid support.
   */
  readonly count = new ColumnCounter();

  readonly config: Readonly<ColumnManagerConfig> = {
    reduceConflicts: false,
    reservedIndexes: 0,
  };

  /**
   * These are all the reusable schema indexes that were recycled from removed schemas
   */
  readonly removed = new Set<number>();

  /**
   * @todo
   */
  nextReserved = -1;

  /**
   * In-memory schemas storage list.
   * It may not be complete, but contains schemas for partial columns
   */
  readonly schemas: SchemaItem[] = [];

  /**
   * A linked list in UI order
   */
  readonly llist = LinkedColumnNode.init();

  /**
   * @param defaultColumnGetter A getter function for
   * columns with schemas haven't been resolved
   */
  constructor(
    readonly defaultColumnGetter: DefaultColumnSchemaGetter<SchemaItem>,
  ) {}
  //#endregion all basic state of the manager

  /**
   * A shortcut to access the tail of the `llist`
   */
  get tail() {
    return this.llist.tail;
  }
  get lastVisible() {
    const visibleColumns = this.count.visible;
    if (visibleColumns <= 0) return { schemaIndex: -1, viewIndex: -1 };
    const nodes = this.llist.next.count();
    const columnWithoutNode = visibleColumns - nodes;
    const tailSchemaIndex = this.tail.schemaIndex;
    return {
      schemaIndex: tailSchemaIndex + columnWithoutNode,
      viewIndex: visibleColumns - 1,
    };
  }

  /**
   * A util class for looking up the node by a given view index
   */
  readonly viewIndex = new ViewIndexResolver(this.llist);

  /**
   * Resolve the schema for the column manager.
   * This method is different from `updateSchema`, it cannot be undone.
   * @see updateSchema
   */
  readonly bindColumnSchema = (schemaIndex: number, schema: SchemaItem) => {
    this.schemas[schemaIndex] = schema;
  };

  /**
   * Get schemas that has an extra field `schemaIndex` for sequential columns
   */
  readonly getSchemas = getSchemas<SchemaItem>;
  readonly getSchema = (viewIndex: number) => this.getSchemas(viewIndex, 1)[0];
  readonly generateDefaultSchemas = generateDefaultSchemas<SchemaItem>;

  readonly allocSchemaIndex = allocSchemaIndex;

  reserveIndexes(count: number) {
    // reserved already
    if (this.nextReserved >= 0) return false;
    const tail = this.tail;
    this.nextReserved = tail.schemaIndex;
    tail.schemaIndex += count;
    Object.assign(this.config, { reservedIndexes: tail.schemaIndex });
    return true;
  }

  //
  //#region Elementary actions
  //
  /**
   * Elementary action: update schema (E.g.; update title, ...)
   */
  readonly updateSchema = updateSchema;
  readonly touch = touch;
  readonly insert = insert;
  readonly remove = remove;
  readonly hide = hide;
  readonly unhide = unhide;
  readonly reorder = reorder;
  //#endregion
}
