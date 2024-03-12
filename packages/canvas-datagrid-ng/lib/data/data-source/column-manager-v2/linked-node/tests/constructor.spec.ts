/// <reference types="mocha" />

import { LinkedColumnNode as Node } from '..';
import { assertNode, assertSchemaIndexes } from './_utils';

describe('Test LinkedColumnNode', () => {
  it('init', () => {
    const n = Node.init();
    assertSchemaIndexes(n, [-1, 0]);
    assertNode(n, -1, 'head');
    assertNode(n.next, 0, 'rest');
  });
});
