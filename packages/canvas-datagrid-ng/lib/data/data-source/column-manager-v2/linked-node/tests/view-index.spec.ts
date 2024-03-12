/* eslint-disable prefer-const */
/// <reference types="mocha" />

import { deepStrictEqual, ok } from 'assert';
import { LinkedColumnNode as Node } from '..';
import { ViewIndexResolver } from '../view-index';
import { assertNode } from './_utils';

const benchmark = process.env.RUN_BENCHMARK === '1' ? it : it.skip;

describe('Test ViewIndexResolver', () => {
  it('simple', () => {
    const header = Node.head();
    const resolver = new ViewIndexResolver(header);
    for (let i = 0; i < 1000; i++) header.append(new Node(i));

    ok(!resolver.lru, 'There is no LRU cache at initialization');
    ok(!resolver.lruViewIndex, 'There is no LRU cache at initialization');

    for (let i = 0; i < 1000; i++) deepStrictEqual(resolver.resolve(i), i);

    deepStrictEqual(resolver.resolve(-1), -1);
    deepStrictEqual(resolver.resolve(1000), -1);

    let viewIndex: number;
    let resolved: number;

    viewIndex = 409;
    resolved = resolver.resolve(viewIndex);
    deepStrictEqual(resolved, viewIndex);
    deepStrictEqual(resolver.lru.schemaIndex, resolved);
    deepStrictEqual(resolver.lruViewIndex, viewIndex);

    viewIndex = 400;
    resolved = resolver.resolve(viewIndex);
    deepStrictEqual(resolved, viewIndex);
    deepStrictEqual(resolver.lru.schemaIndex, resolved);
    deepStrictEqual(resolver.lruViewIndex, viewIndex);

    viewIndex = 600;
    resolved = resolver.resolve(viewIndex);
    deepStrictEqual(resolved, viewIndex);
    deepStrictEqual(resolver.lru.schemaIndex, resolved);
    deepStrictEqual(resolver.lruViewIndex, viewIndex);
  });

  it('test for the rest node', () => {
    const header = Node.head(-1);
    const resolver = new ViewIndexResolver(header);
    for (let i = 0; i < 100; i++) header.append(new Node(i));
    header.append(Node.rest(100));

    assertNode(header.tail, 100, 'rest');
    assertNode(header.tail.prev, 99);

    let result = resolver.resolveNode(200);
    assertNode(result.node, 100, 'rest');
    deepStrictEqual(result.schemaIndex, 200);
    deepStrictEqual(result.restOffset, 100);

    result = resolver.resolveNode(60);
    assertNode(result.node, 60);
    deepStrictEqual(result.schemaIndex, 60);
    deepStrictEqual(result.restOffset, undefined);

    result = resolver.resolveNode(201);
    assertNode(result.node, 100, 'rest');
    deepStrictEqual(result.schemaIndex, 201);
    deepStrictEqual(result.restOffset, 101);

    result = resolver.resolveNode(180);
    assertNode(result.node, 100, 'rest');
    deepStrictEqual(result.schemaIndex, 180);
    deepStrictEqual(result.restOffset, 80);

    result = resolver.resolveNode(101);
    assertNode(result.node, 100, 'rest');
    deepStrictEqual(result.schemaIndex, 101);
    deepStrictEqual(result.restOffset, 1);

    result = resolver.resolveNode(100);
    assertNode(result.node, 100, 'rest');
    deepStrictEqual(result.schemaIndex, 100);
    deepStrictEqual(result.restOffset, 0);

    result = resolver.resolveNode(99);
    assertNode(result.node, 99);
    deepStrictEqual(result.schemaIndex, 99);
    deepStrictEqual(result.restOffset, undefined);

    result = resolver.resolveNode(98);
    assertNode(result.node, 98);
    deepStrictEqual(result.schemaIndex, 98);
    deepStrictEqual(result.restOffset, undefined);
  });

  benchmark('benchmark', () => {
    const head = Node.head();

    const size = 1000_0000;
    const node = Node.from([], size);
    head.append(node);

    let ptr = node;
    let i = 0;
    while (ptr) {
      ptr.schemaIndex = i++;
      ptr = ptr.next;
    }

    const resolver = new ViewIndexResolver(head);
    let viewIndex: number;
    let result: number;

    viewIndex = 0;
    while (viewIndex < size) {
      result = resolver.resolve(viewIndex);
      deepStrictEqual(result, viewIndex); // `resolve(${viewIndex})`);
      viewIndex += 50 + Math.floor(Math.random() * 20);
    }

    viewIndex = size - 1;
    while (viewIndex >= 0) {
      result = resolver.resolve(viewIndex);
      deepStrictEqual(result, viewIndex); // `resolve(${viewIndex})`);
      viewIndex -= 50 + Math.floor(Math.random() * 20);
    }
  });

  benchmark('benchmark (isRest)', () => {
    const head = Node.head();
    head.append(new Node(1));
    head.append(new Node(0));
    // we suppose column #2 is removed
    head.append(Node.rest(3));
    // so the columns are: 1, 0, 3, 4, 5, 6, ....

    const resolver = new ViewIndexResolver(head);
    let viewIndex: number;
    let expected: number;
    let result: number;

    viewIndex = 0;
    expected = 1;
    result = resolver.resolve(viewIndex);
    deepStrictEqual(result, expected);

    viewIndex = 1;
    expected = 0;
    result = resolver.resolve(viewIndex);
    deepStrictEqual(result, expected);

    viewIndex = 2;
    expected = 3;
    result = resolver.resolve(viewIndex);
    deepStrictEqual(result, expected);

    viewIndex = 1_000_000;
    expected = 1_000_001;
    result = resolver.resolve(viewIndex);
    deepStrictEqual(result, expected);

    {
      const count = 10;
      const result = resolver.resolveMulti(0, count);
      const expected = new Array(count).fill(0).map((_, index) => index + 1);
      expected[0] = 1;
      expected[1] = 0;
      expected[2] = 3;
      deepStrictEqual(result, expected);
    }
  });
});
