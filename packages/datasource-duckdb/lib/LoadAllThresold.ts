/**
 * This type represents the threshold limits for loading all rows into memory
 * at the beginning. Each field specifies a maximum value.
 *
 * The relationship between each field in this type is AND
 */
export type LoadAllThreshold = {
  rows?: number;
  columns?: number;
  /** rows * columns */
  totals?: number;
};

export const defaultLoadAllThreshold: LoadAllThreshold = {
  rows: 20000,
  columns: 1000,
  /** 50 * 60,000  */
  totals: 3000000,
};

export function isLoadingAllSatisfied(
  threshold: LoadAllThreshold,
  dataSize: { columns: number; rows: number },
) {
  if (!threshold || Object.keys(threshold).length === 0)
    threshold = defaultLoadAllThreshold;

  if (typeof threshold.rows === 'number')
    if (dataSize.rows > threshold.rows) return false;

  if (typeof threshold.columns === 'number')
    if (dataSize.columns > threshold.columns) return false;

  if (typeof threshold.totals === 'number') {
    const totals = dataSize.columns * dataSize.rows;
    if (totals > threshold.totals) return false;
  }
  return true;
}
