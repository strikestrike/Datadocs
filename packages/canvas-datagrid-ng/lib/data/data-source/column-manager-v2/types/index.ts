import type { SerializedColumnCounter } from '../column-counter';
import type { SerializedLinkedColumnNode } from '../linked-node';
export * from './action-result';

export type ColumnManagerConfig = {
  /**
   * Set this flag to `true` to reduce conflicts in redo/undo actions.
   * This flag is useful for remote synchronization.
   * @default false
   */
  reduceConflicts: boolean;

  /**
   * @todo docs
   * @default 0
   */
  reservedIndexes: number;
};

/**
 * A default schema getter function type.
 * It is designed for getting schema for columns that have not been modified.
 * @param schemaIndex This index/subscript indicates where
 * the schema should be stored in the `schemas` list.
 * @param viewIndex The view index that this schema will be used at
 */
export type DefaultColumnSchemaGetter<GridSchemaItem> = (
  schemaIndex: number,
  viewIndex: number,
) => GridSchemaItem;

export type ColumnManagerSavedState<SchemaItem> = {
  /** version of this saved state */
  v: 1;
  config: ColumnManagerConfig;
  count: SerializedColumnCounter;
  removed: number[];
  llist: SerializedLinkedColumnNode;
  schemas?: SchemaItem[];
};

export type SchemaItemWithIndex<SchemaItem> = Omit<
  SchemaItem,
  'schemaIndex' | 'viewIndex'
> & {
  schemaIndex: number;
  viewIndex: number;
};
