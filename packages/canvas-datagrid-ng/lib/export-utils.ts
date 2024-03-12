import * as baseUtils from './util';
import * as reorderArrayUtils from './data/reorder/array';
import * as reorderLargeDataUtils from './data/reorder/large-data';
import * as reorderSparseDataUtils from './data/reorder/sparse-data';

export function getAllUtils() {
  return {
    ...baseUtils,
    ...reorderArrayUtils,
    ...reorderLargeDataUtils,
    ...reorderSparseDataUtils,
  };
}
