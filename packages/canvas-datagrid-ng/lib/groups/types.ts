import type BTree from 'sorted-btree';

/**
 * The state and the range of the grouped items (rows or columns).
 * @see GroupData
 */
export type GroupDescriptor = {
  /**
   * The last index that this descriptor covers.
   */
  to: number;
  /**
   * Whether or not the items covered by this descriptor are collapsed.
   */
  collapsed: boolean;
};

/**
 * A descriptor that also contains the `from` value of the group.
 */
export type GroupDescriptorResult = {
  /**
   * The index that group starts at.
   */
  from: number;
  /**
   * The order in nested groups.
   */
  level: number;
} & GroupDescriptor;

/**
 * An array of grouped items (mainly columns or rows).
 *
 * The {@type number} is the key and it denotes the start index of an grouped
 * item, and the value {@link GroupDescriptor} denotes the last index covered
 * by that entry, and whether the items contained by it are collapsed.
 *
 * We are using a btree implementation {@link BTree} for fast and sorted access.
 * @see GroupDescriptor
 */
export type GroupData = BTree<number, GroupDescriptor>;

export type VisibleGroupItem = {
  x: number;
  y: number;
  x2: number;
  y2: number;
  collapsed: boolean;
  from: number;
  to: number;
} & (
  | {
      type: 'c';
      row: number;
    }
  | {
      type: 'r';
      col: number;
    }
);
