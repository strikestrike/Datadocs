import type { RangeDescriptor } from '../types';
import { isInRange } from './util';

export class RangeResult<T extends RangeDescriptor> {
  constructor(readonly results: T[]) {}

  get size() {
    return this.results.length;
  }

  get = (rowIndex: number, columnIndex: number): T | undefined => {
    for (const result of this.results) {
      if (isInRange(result, rowIndex, columnIndex)) {
        return result;
      }
    }
  };
}
