/// <reference types="mocha" />

import { assertWithName } from '../../spec-util';
import { reorderInArray } from './array';

describe('Test reorderInArray', () => {
  it('reorder 1', () => {
    const getArray = () => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    let array: number[];

    array = getArray();
    reorderInArray(array, [1, 3, 5, 6, 9], 5);
    assertWithName('after 1st reorder', array, [0, 2, 4, 5, 1, 3, 6, 9, 7, 8]);

    array = getArray();
    reorderInArray(array, [1, 3, 5, 6, 9], -1);
    assertWithName('after 2nd reorder', array, [1, 3, 5, 6, 9, 0, 2, 4, 7, 8]);
  });
});
