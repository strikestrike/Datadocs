import { deserialize, dumpValues, fromValues, serialize } from './serialize';
export type { SerializedLinkedColumnNode } from './serialize';

/**
 * An extended linked list implementation to control the order of columns for the UI.
 *
 * * There are three types of node
 * 1. Normal node, each node contains a schema index, which represents the schema in this position
 * 2. Header node, its `isHead` property is true, representing the column for row header,
 * and its `schemaIndex` is usually set to `-1`.
 * 3. Rest node: It indicates that the `schemaIndex` for this column and subsequent columns
 * is incremented by one. For example, if the schemaIndex of a Rest node is 3, the schemaIndex of the next column is 4.
 * 3. Rest node, it indicates that the schemaIndex for this node and subsequent columns
 * is incremented by one. For example: if the `schemaIndex` of a Rest node is 3, the `schemaIndex` of the next column is 4.
 *
 * @see https://en.wikipedia.org/wiki/Doubly_linked_list
 */
export class LinkedColumnNode {
  /**
   * Create a linked list that contains two nodes:
   * one for the head and another for the rest (starting from 0).
   */
  static init(): LinkedColumnNode {
    return LinkedColumnNode.head().append(LinkedColumnNode.rest(0));
  }
  /**
   * Create a node and mark it as head
   */
  static head(schemaIndex = -1): LinkedColumnNode {
    return new LinkedColumnNode(schemaIndex).as('head');
  }
  /**
   * Create a node and mark it as rest
   */
  static rest(schemaIndex?: number): LinkedColumnNode {
    return new LinkedColumnNode(schemaIndex).as('rest');
  }
  /**
   * Create a linked-list from static values and return the first node of this list
   */
  static readonly from = fromValues;
  /**
   * Restore serialized linked-list
   */
  static readonly restore = deserialize;

  //#region core data of the data
  isHead?: boolean;
  isRest?: boolean;
  schemaIndex?: number;
  //#endregion

  //#region links
  /** Link to nodes for hidden columns */
  hide?: LinkedColumnNode;
  /** Link to the previous column */
  prev?: LinkedColumnNode;
  /** Link to the next column */
  next?: LinkedColumnNode;
  //#endregion

  constructor(schemaIndex?: number) {
    this.schemaIndex = schemaIndex;
  }

  /**
   * Mark this node as `head` or `rest`
   */
  as(type: 'head' | 'rest'): this {
    if (type) {
      if (type[0] === 'h') this.isHead = true;
      else this.isRest = true;
    }
    return this;
  }

  /**
   * A link CACHE to the last node in the linked list that this node is a part of
   */
  private _tail?: LinkedColumnNode;

  /**
   * The last node in the linked list
   *
   * **Ω(1) ~ O(n)** `n` represents the number of subsequent nodes.
   */
  get tail(): LinkedColumnNode {
    let node = this._tail || this;
    /** For avoding endless loop */
    let max = 1_000_000_000;
    while (node.next && max-- > 0) node = node.next;
    this._tail = node;
    return node;
  }
  /**
   * Save the tail node in the cache.
   * This will prevent having to search again when accessing the `tail` next time.
   */
  setTailCache(tail: LinkedColumnNode) {
    this._tail = tail;
  }
  /**
   * Clear/Reset the cache for the link to the last node
   * in the current linked list from this node.
   *
   * **O(n)** `n` represents the number of subsequent nodes.
   *
   * @returns The number of nodes that are either this node or behind this node,
   * excluding hidden nodes.
   */
  resetTailCache(tail?: LinkedColumnNode) {
    let ptr = this as LinkedColumnNode;
    let count = 0;
    do {
      count++;
      if (tail) delete ptr._tail;
      else ptr._tail = tail;
      ptr = ptr.next;
    } while (ptr);
    return count;
  }

  /**
   * Find the next node with the given `schemaIndex`.
   */
  nextUntil(schemaIndex: number): LinkedColumnNode | null {
    let ptr = this.next;
    while (ptr) {
      if (ptr.schemaIndex === schemaIndex) return ptr;
      ptr = ptr.next;
    }
    return null;
  }

  /**
   * Append nodes behind the column that this node represents.
   */
  appendHide(node: LinkedColumnNode) {
    if (this.hide) {
      this.hide.append(node);
    } else {
      this.hide = node;
      delete node.prev;
    }
    return this;
  }

  /**
   * Append nodes to the current linked list
   */
  append(node: LinkedColumnNode) {
    const tail = this.tail;
    tail.next = node;
    node.prev = tail;
    this._tail = node.tail;
    return this;
  }

  /**
   * Insert nodes behind this node
   */
  insert(node: LinkedColumnNode) {
    if (!this.next) return this.append(node);
    node.resetTailCache(this.tail);

    const { next } = this;
    const nodeTail = node.tail;

    next.prev = nodeTail;
    this.next = node;
    node.prev = this;
    nodeTail.next = next;
    return this;
  }

  /**
   * Unlink this node from the linked list
   * They will be append to previous node's hide list if there is any hidden nodes behind it
   *
   * @returns `false` indicates that this node is not a part of any linked list.
   */
  unlink() {
    const { prev, next, hide } = this;
    if (!prev && !next) return false;

    if (prev) {
      prev.next = next;
      if (hide) prev.appendHide(hide);
    }

    if (next) {
      next.prev = prev;
    } else {
      // This node is the last node of the linked list
      const newTail = prev;
      let ptr = newTail;
      while (ptr) {
        ptr._tail = newTail;
        ptr = ptr.prev;
      }
    }
    return true;
  }

  /**
   * Unhides all hidden nodes directly attached to the current node.
   * Note that this method does not recursively unhide all nodes in the entire linked list.
   * It only unhides the nodes that are directly hidden by the current node.
   */
  unhideAll() {
    if (!this.hide) return;
    this.insert(this.hide);
    delete this.hide;
    return this;
  }

  /**
   * Take out some nodes that are behind this node
   * @param count the number of nodes that need to be took out
   */
  takeOutNext(count = 1): { length: number; node: LinkedColumnNode } {
    if (!this.next) return { length: 0, node: null };
    const { next } = this;
    let ptr = next;
    let result = 0;
    while (++result < count) {
      delete ptr._tail;
      if (!ptr.next) break;
      ptr = ptr.next;
    }
    this.next = ptr.next;

    if (ptr.next) {
      ptr.next.prev = this;
      delete ptr.next;
    } else {
      // all following columns are took out
      this._tail = this;
    }
    return { length: result, node: next };
  }

  /**
   * Hides the next `count` nodes after the current node.
   * @param count The number of nodes to hide.
   * @returns The number of nodes actually hidden.
   */
  hideNext(count = 1): number {
    const sub = this.takeOutNext(count);
    if (sub.length === 0) return 0;

    // Flatten the sub linked list, in case there are hidden nodes within it.
    let ptr = sub.node;
    while (ptr) {
      if (ptr.hide) {
        sub.length += ptr.hide.count();
        ptr.unhideAll();
      }
      ptr = ptr.next;
    }
    this.appendHide(sub.node);
    return sub.length;
  }

  /**
   * @returns the number of nodes that are either this node or behind this node,
   * excluding hidden nodes.
   */
  count() {
    let count = 1;
    let ptr = this as LinkedColumnNode;
    while (ptr.next) {
      ptr = ptr.next;
      count++;
    }
    return count;
  }

  /**
   * Replace all states in this node with a new node
   */
  replaceWith(node: LinkedColumnNode) {
    this.isHead = node.isHead;
    this.isRest = node.isRest;
    this.schemaIndex = node.schemaIndex;
    this.prev = node.prev;
    this.next = node.next;
    this.hide = node.hide;
    this._tail = node._tail;
    return this;
  }

  /**
   * Dump all `schemaIndex` that in either this node or behind this node,
   * excluding hidden nodes.
   */
  toArray(limit?: number): number[] {
    return dumpValues(this, limit);
  }
  /**
   * @see LinkedColumnNode.restore
   * @returns a saved state that can be restored by the method `restore`
   */
  serialize() {
    return serialize(this);
  }
  /**
   * @see serialize
   */
  toJSON() {
    return serialize(this);
  }
}
