import { deepStrictEqual, ok } from 'assert';
import type { LinkedColumnNode } from '..';

export function assertSchemaIndexes(
  node: LinkedColumnNode,
  schemaIndexes: number[],
) {
  deepStrictEqual(node.toArray(), schemaIndexes);
}

export function assertTail(
  node: LinkedColumnNode,
  expectedTailSchemaIndex: number,
) {
  let ptr = node;
  while (ptr) {
    deepStrictEqual(ptr.tail.schemaIndex, expectedTailSchemaIndex);
    ptr = ptr.next;
  }
}

export function assertNode(
  node: LinkedColumnNode,
  schemaIndex: number | null,
  type?: 'head' | 'rest' | boolean | null | undefined,
  hide?: number[],
) {
  if (schemaIndex === null || schemaIndex === undefined) {
    ok(!node);
    return;
  }

  deepStrictEqual(
    node.schemaIndex,
    schemaIndex,
    `node.schemaIndex ${node.schemaIndex} !== ${schemaIndex}`,
  );
  if (type === 'head') {
    deepStrictEqual(node.isHead, true, `node.isHead !== true`);
  } else if (type === 'rest') {
    deepStrictEqual(node.isRest, true, `node.isRest !== true`);
  }
  if (Array.isArray(hide)) {
    if (hide.length === 0) {
      ok(
        !node.hide,
        `node.hide should be empty but ${JSON.stringify(node.hide.toJSON())}`,
      );
      return;
    }
    deepStrictEqual(node.hide.toArray(), hide);
  }
}
