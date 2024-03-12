import type { RangeDescriptor } from '../types';

export const checkRange = (range: RangeDescriptor) =>
  range.startColumn >= 0 &&
  range.startRow >= 0 &&
  range.startColumn <= range.endColumn &&
  range.startRow <= range.endRow;
