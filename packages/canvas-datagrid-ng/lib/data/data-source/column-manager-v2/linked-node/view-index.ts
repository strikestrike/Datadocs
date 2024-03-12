import type { LinkedColumnNode } from '.';

export type ResolvedNode = {
  /**
   * The schema index for the given view index.
   * Please use this value as the correct schemaIndex rather than `node.schemaIndex`,
   * because the `node` may be a rest node.
   */
  schemaIndex: number;
  /**
   * The resolved Node for the given view index
   */
  node: LinkedColumnNode;
  /**
   * This field only exists if the resolved node is a rest node.
   * It represents the `offset` from the beginning `viewIndex` to the input `viewIndex`.
   *
   * For example, if the input `viewIndex` is `10`,
   * and the `viewIndex` of the first column represented by the resolved rest node is also `10`,
   * then the value of this field will be `10 - 10 = 0`.
   */
  restOffset?: number;
};

/**
 * A lookup utility with cache mechanism, used to find linked node or schema index
 * in a linked-list through view index
 */
export class ViewIndexResolver {
  /** The view index of LRU (Least Recently Used) cache */
  lruViewIndex: number;
  /** The LRU cache */
  lru: ResolvedNode;

  /**
   * @param header The header(first node) of the linked list
   */
  constructor(private header: LinkedColumnNode) {}

  /**
   * Clear the LRU cache and reset other attributes if needed in the future.
   */
  reset() {
    delete this.lru;
  }

  /**
   * Set a new linked list header for this resolver
   */
  setHeader(header: LinkedColumnNode) {
    this.header = header;
    delete this.lru;
  }

  /**
   * Look up a node and the schema index by given `viewIndex`
   * @returns Return `null` if this linked list is invalid or
   * if there is an internal fatal error.
   * Please report the issue if this occurs
   */
  resolveNode(viewIndex: number): ResolvedNode | null {
    const { header } = this;
    if (viewIndex < 0) return { node: header, schemaIndex: -1 };

    const first = header.next;
    if (!first) return null;
    if (first.isRest) {
      // all columns are in order and didn't hide
      // return first.data + viewIndex;
      const schemaIndex = first.schemaIndex + viewIndex;
      return { schemaIndex, node: first, restOffset: viewIndex };
    }

    let searchPtr = first;
    let searchSteps = viewIndex;

    const { lru, lruViewIndex } = this;
    // Check if the LRU cache exists and the viewIndex is greater than 50,
    // to determine if the cache should be utilized for better performance
    if (lru && viewIndex > 50) {
      const lruNode = lru.node;
      const lruSchemaIndex = lru.schemaIndex;
      let diff = viewIndex - lruViewIndex;
      if (diff === 0) return { ...lru };
      if (lruNode.isRest) {
        const inThisNode = lru.restOffset + diff;
        if (inThisNode >= 0) {
          return {
            node: lruNode,
            schemaIndex: lruSchemaIndex + diff,
            restOffset: lru.restOffset + diff,
          };
        }
        diff = inThisNode;
      }

      let step = Math.abs(diff);
      if (step < viewIndex) {
        searchPtr = lruNode;
        searchSteps = step;

        const rev = diff < 0;
        // reverse search
        if (rev) {
          while (step-- > 0) {
            searchPtr = searchPtr.prev;
            if (!searchPtr) return null;
          }
          const result: ResolvedNode = {
            schemaIndex: searchPtr.schemaIndex,
            node: searchPtr,
          };
          this.lru = result;
          this.lruViewIndex = viewIndex;
          return result;
        }
      }
    }

    while (searchSteps-- > 0) {
      if (searchPtr.isRest) break;
      if (!searchPtr.next) return null;
      searchPtr = searchPtr.next;
    }
    const result: ResolvedNode = {
      node: searchPtr,
      schemaIndex: searchPtr.schemaIndex,
    };
    if (searchPtr.isRest) {
      result.restOffset = searchSteps + 1;
      result.schemaIndex = result.restOffset + searchPtr.schemaIndex;
    }
    this.lru = result;
    this.lruViewIndex = viewIndex;
    return result;
  }

  /**
   * Look up the `schemaIndex` for a given `viewIndex`
   * @returns `schemaIndex`
   */
  resolve(viewIndex: number): number {
    const resolved = this.resolveNode(viewIndex);
    if (!resolved) return -1;
    return resolved.schemaIndex;
  }

  /**
   * Look up the sequential `schemaIndex` for a given starting `viewIndex` and `count`
   * @returns `schemaIndex[]`
   */
  resolveMulti(viewIndex: number, count = 1): number[] {
    if (count < 1) return [];
    if (viewIndex < 0) viewIndex = 0;
    const resolved = this.resolveNode(viewIndex);
    if (!resolved) return [];

    const result: number[] = [];
    if (resolved.node.isRest) {
      for (let i = 0; i < count; i++) result.push(resolved.schemaIndex + i);
      return result;
    }

    let ptr = resolved.node;
    while (ptr && count > 0) {
      if (ptr.isRest) {
        for (let i = 0; i < count; i++) result.push(ptr.schemaIndex + i);
        break;
      }
      result.push(ptr.schemaIndex);
      count--;
      ptr = ptr.next;
    }
    return result;
  }
}
