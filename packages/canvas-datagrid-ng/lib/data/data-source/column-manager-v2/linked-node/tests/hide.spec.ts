/// <reference types="mocha" />

import { deepStrictEqual } from 'assert';
import { LinkedColumnNode as Node } from '..';
import type { UnhidePartialNodesResult } from '../unhide-partial';
import { unhidePartialNodes } from '../unhide-partial';
import { assertSchemaIndexes } from './_utils';

describe('Test LinkedColumnNode', () => {
  it('hide', () => {
    const n1 = new Node(1);
    const n3 = new Node(3);
    n1.append(n3);
    n1.insert(new Node(2));
    assertSchemaIndexes(n1, [1, 2, 3]);

    n1.appendHide(new Node(4));
    n1.appendHide(new Node(5));
    assertSchemaIndexes(n1, [1, 2, 3]);

    n1.unhideAll();
    assertSchemaIndexes(n1, [1, 4, 5, 2, 3]);

    let count: number;
    count = n1.next.hideNext();
    deepStrictEqual(count, 1);
    assertSchemaIndexes(n1, [1, 4, 2, 3]);
    deepStrictEqual(n1.serialize(), [1, 4, { hide: [5] }, 2, 3]);

    count = n1.hideNext(10);
    deepStrictEqual(count, 3 + 1); // +1 hidden node
    deepStrictEqual(n1.toArray(), [1]);
    deepStrictEqual(n1.tail.schemaIndex, 1);

    const n0 = new Node(0);
    n0.append(n1);
    count = n0.hideNext(10);
    deepStrictEqual(count, 1 + 4); // +4 hidden node
    deepStrictEqual(n0.toArray(), [0]);

    n0.unhideAll();
    deepStrictEqual(n0.toArray(), [0, 1, 4, 5, 2, 3]);
  });

  it('unhide partial columns', () => {
    let unhide: UnhidePartialNodesResult;
    const n0 = Node.from([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    const n2 = n0.nextUntil(2);
    deepStrictEqual(n2.schemaIndex, 2);
    n2.hideNext(4);
    // 0,1,2,7,8
    deepStrictEqual(n0.serialize(), [0, 1, 2, { hide: [3, 4, 5, 6] }, 7, 8]);
    // 3,4,5,6
    unhide = unhidePartialNodes(n2, 1, 2); // unhide 4,5
    deepStrictEqual(unhide.count, 2);
    deepStrictEqual(unhide.begin.schemaIndex, 4);
    deepStrictEqual(unhide.end.schemaIndex, 5);

    // console.log(JSON.stringify(n0.serialize()));
    deepStrictEqual(n0.serialize(), [
      0,
      1,
      2,
      { hide: [3] },
      4,
      5,
      { hide: [6] },
      7,
      8,
    ]);

    const n5 = n0.nextUntil(5);
    deepStrictEqual(n5.schemaIndex, 5);

    unhide = unhidePartialNodes(n5, 1, 2); // unhide nothing
    deepStrictEqual(unhide.count, 0);

    unhide = unhidePartialNodes(n5, 0, 2); // unhide 6
    deepStrictEqual(unhide.count, 1);
    deepStrictEqual(unhide.begin.schemaIndex, 6);
    deepStrictEqual(unhide.end.schemaIndex, 6);

    deepStrictEqual(n0.serialize(), [0, 1, 2, { hide: [3] }, 4, 5, 6, 7, 8]);
  });
});
