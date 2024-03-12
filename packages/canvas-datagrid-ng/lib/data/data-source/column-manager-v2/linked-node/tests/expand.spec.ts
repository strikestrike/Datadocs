/// <reference types="mocha" />

import { deepStrictEqual, ok } from 'assert';
import { LinkedColumnNode as Node } from '..';
import { expandRestNode, expandRestNodeAndTakeOut } from '../expand';
import { assertNode, assertTail } from './_utils';

describe('Test LinkedColumnNode#expand', () => {
  it('expandRestNode', () => {
    // -1 -> 0+
    const node = Node.init();
    const tail = node.tail;

    const result0 = expandRestNode(tail, 0);
    ok(!result0);

    // -1 -> 0 -> 1+
    const result = expandRestNode(tail, 1);
    assertNode(result.expanded, 0);
    assertNode(result.tail, 1, 'rest');
    ok(result.tail === tail);
  });

  it('simple', () => {
    const node = Node.head(-1)
      .append(Node.from([0, 1, 2, 3]))
      .append(Node.rest(4));

    deepStrictEqual(node.serialize(), [
      -1,
      { head: 1 },
      0,
      1,
      2,
      3,
      4,
      { rest: 1 },
    ]);

    {
      const result = expandRestNodeAndTakeOut(node.tail, [0, 1]);
      deepStrictEqual(result.piece.serialize(), [4, 5]);
      deepStrictEqual(node.toArray(), [-1, 0, 1, 2, 3, 6]);
      assertTail(node, 6);
      assertTail(result.piece, 5);
      node.resetTailCache();

      node.nextUntil(2).insert(result.piece);
      deepStrictEqual(node.toArray(), [-1, 0, 1, 2, 4, 5, 3, 6]);
      assertTail(node, 6);
      assertTail(result.piece, 6);
    }

    {
      const result = expandRestNodeAndTakeOut(node.tail, [1, 1]);
      deepStrictEqual(result.piece.serialize(), [7]);
      deepStrictEqual(node.toArray(), [-1, 0, 1, 2, 4, 5, 3, 6, 8]);
    }
  });
});
