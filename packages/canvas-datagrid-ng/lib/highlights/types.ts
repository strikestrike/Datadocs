import type { RangeDescriptor } from '../types/base-structs';

export type HighlightMeta = {
  color?: string;
  userId?: string;
};
export type HighlightDescriptor = RangeDescriptor<HighlightMeta> & {
  type: number;
};
