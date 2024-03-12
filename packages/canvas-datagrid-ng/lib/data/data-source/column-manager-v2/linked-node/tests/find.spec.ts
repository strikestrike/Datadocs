/// <reference types="mocha" />

import { deepStrictEqual, ok } from 'assert';
import { LinkedColumnNode as Node } from '..';
import { expandRestNode } from '../expand';
import { findLinkedNode } from '../find';
import { assertNode, assertSchemaIndexes } from './_utils';

describe('Test LinkedColumnNode#find', () => {
  it('find', () => {
    const header = Node.init();
    // -1, 0+
    // -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
    expandRestNode(header.tail, 10);
    assertSchemaIndexes(header, [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

    let result = findLinkedNode(6, header, -1);
    const node6 = result.node;
    assertNode(result.node, 6);
    assertNode(result.parent, undefined);
    deepStrictEqual(result.offset, 6);
    deepStrictEqual(result.parentOffset, undefined);

    // hide [7,8]
    result.node.hideNext(2);
    result = findLinkedNode(7, header, -1, true);
    ok(!result);

    result = findLinkedNode(7, header, -1);
    assertNode(result.node, 7);
    assertNode(result.parent, 6, null, [7, 8]);
    deepStrictEqual(result.offset, 0);
    deepStrictEqual(result.parentOffset, 6);

    result = findLinkedNode(9, node6, 6);
    assertNode(result.node, 9);
    assertNode(result.parent, undefined);
    deepStrictEqual(result.offset, 7);
    deepStrictEqual(result.parentOffset, undefined);

    result = findLinkedNode(10, header, -1);
    assertNode(result.node, 10, 'rest');
    assertNode(result.parent, undefined);
    deepStrictEqual(result.offset, 8);
    deepStrictEqual(result.restOffset, 0);
    deepStrictEqual(result.parentOffset, undefined);

    result = findLinkedNode(14, header, -1);
    assertNode(result.node, 10, 'rest');
    assertNode(result.parent, undefined);
    deepStrictEqual(result.offset, 8);
    deepStrictEqual(result.restOffset, 4);
    deepStrictEqual(result.parentOffset, undefined);
  });
});
