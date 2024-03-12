/// <reference types="mocha" />

import { deepStrictEqual } from 'assert';
import { LinkedColumnNode as Node } from '..';
import type { SerializedLinkedColumnNode } from '../serialize';

describe('Test serialization for LinkedColumnNode', () => {
  it('to json', () => {
    const n = Node.head();
    const expected: SerializedLinkedColumnNode = [-1, { head: 1 }];
    deepStrictEqual(JSON.stringify(n), JSON.stringify(expected));
  });
  it('serialize and restore', () => {
    const n = Node.head();
    const t = Node.rest(3);
    const mid = Node.from([0, 1, 2]);
    n.append(mid).append(t);
    mid.appendHide(Node.from([4, 5]));

    const serialized = n.serialize();
    const expected: SerializedLinkedColumnNode = [
      -1,
      { head: 1 },
      0,
      { hide: [4, 5] },
      1,
      2,
      3,
      { rest: 1 },
    ];
    deepStrictEqual(serialized, expected);

    {
      const newNode = Node.restore(expected);
      deepStrictEqual(newNode.schemaIndex, -1);
      deepStrictEqual(newNode.isHead, true);

      let ptr = newNode.next;
      deepStrictEqual(ptr.schemaIndex, 0);
      deepStrictEqual(ptr.hide.toArray(), [4, 5]);

      const tail = ptr.tail;
      deepStrictEqual(tail.schemaIndex, 3);
      deepStrictEqual(tail.isRest, true);

      ptr = ptr.next;
      deepStrictEqual(ptr.schemaIndex, 1);
    }
  });
});
