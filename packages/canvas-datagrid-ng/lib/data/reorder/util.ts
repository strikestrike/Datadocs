import { OccupancyGraph } from './occupancy-graph';

export const checkReorder = (
  isRow: boolean,
  beginIndex: number,
  count: number,
  afterIndex?: number,
  ...callbacks: {
    checkBeforeReorder: (
      isRow: boolean,
      beginIndex: number,
      count: number,
      afterIndex?: number,
      occupancyGraph?: OccupancyGraph,
    ) => boolean | number;
  }[]
): boolean | number => {
  const occupancyGraph = new OccupancyGraph();

  let result: number | boolean | undefined;
  for (const callback of callbacks) {
    const currentResult = callback.checkBeforeReorder(
      isRow,
      beginIndex,
      count,
      afterIndex,
      occupancyGraph,
    );

    if (currentResult === false) return false;
    if (currentResult === true) continue;
    if (typeof result === 'number') {
      result =
        afterIndex > beginIndex
          ? Math.min(result, currentResult)
          : Math.max(result, currentResult);
    } else {
      result = currentResult;
    }
  }

  if (typeof result === 'number' && occupancyGraph.size > 0) {
    const entries =
      afterIndex > beginIndex
        ? occupancyGraph.entriesReversed()
        : occupancyGraph.entries();
    for (const [start, end] of entries) {
      if (!(result > start && result < end)) continue;
      result =
        afterIndex > beginIndex
          ? Math.min(result, start - 1)
          : Math.max(result, end + 1);
    }
    if (
      (afterIndex > beginIndex && result < beginIndex) ||
      (afterIndex < beginIndex && result > beginIndex)
    ) {
      return false;
    }
  }
  return result ?? true;
};
