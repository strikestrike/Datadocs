import { RowsLoadingQueue } from '../../rows-loader/queue';
import { getDataForViewPort } from './api/get-data';
import type { FirestoreContext } from './base/context';

export function createQueueForGettingData(context: FirestoreContext) {
  return new RowsLoadingQueue({
    transformRange: (range) => {
      const optimizedRanges = context.fetchedRanges.diff(range);
      if (optimizedRanges.length === 0) return;
      if (optimizedRanges.length === 1) range = optimizedRanges[0] as any;
      return range;
    },
    load: async (range) => {
      const loaded = await getDataForViewPort(context, range);
      if (loaded) context.events.dispatch();
    },
  });
}
