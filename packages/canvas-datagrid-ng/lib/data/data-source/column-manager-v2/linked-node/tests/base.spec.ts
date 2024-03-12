/// <reference types="mocha" />

import { deepStrictEqual } from 'assert';
import { LinkedColumnNode as Node } from '..';
import { assertNode, assertSchemaIndexes } from './_utils';

describe('Test LinkedColumnNode', () => {
  it('init', () => {
    const n = Node.init();
    assertSchemaIndexes(n, [-1, 0]);
    assertNode(n, -1, 'head');
    assertNode(n.next, 0, 'rest');
  });

  it('simple', () => {
    const n = Node.head();
    n.append(new Node(4)).append(new Node(5));

    const n1 = new Node(1);
    const n3 = new Node(3);
    n1.append(n3);
    deepStrictEqual(n1.toArray(), [1, 3]);

    n1.insert(new Node(2));
    deepStrictEqual(n1.toArray(), [1, 2, 3]);

    n.insert(n1);
    deepStrictEqual(n.toArray(), [-1, 1, 2, 3, 4, 5]);

    n3.unlink();
    deepStrictEqual(n1.toArray(), [1, 2, 4, 5]);

    n.tail.unlink();
    deepStrictEqual(n.toArray(), [-1, 1, 2, 4]);

    n.append(new Node(6));
    deepStrictEqual(n.toArray(), [-1, 1, 2, 4, 6]);
  });
});
