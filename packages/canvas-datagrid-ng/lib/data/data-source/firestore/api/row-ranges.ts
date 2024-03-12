import type { FDocRowRangesV1 } from '../spec/storage';
import { FirestoreDebugLogger } from '../utils/debug-logger';
import { IntIntervals } from '../utils/int-intervals';

const console = new FirestoreDebugLogger('row-ranges');

export type BlockInfoDescriptor = {
  /** Data Block ids (Firestore Document ID) */
  id: string[];
  /** time in ms */
  updatedAt: number;
};

export type MarkRowResult = {
  /** Inclusive */
  rowIndexes: [number, number];
  isNew?: boolean;
};

/**
 * Because the data source does not know which rows in the user document contain data,
 * we need this manager to store the information in memory,
 * as well as to load it from the upstream and save it back after modification.
 *
 * @see FDocRowRangesV1
 */
export class RowRangesManager {
  range = new IntIntervals();

  /**
   * Its subscripting is real row index
   * @todo: optimize this property by idb when the user document is very large
   */
  rowIndexToBlock: BlockInfoDescriptor[] = [];

  readonly encodeForSave = (base?: FDocRowRangesV1): FDocRowRangesV1 => {
    if (!base) base = { format: '1' };

    const ranges = this.range.getAll();
    for (let i = 0; i < ranges.length; i++) {
      const [lo, hi] = ranges[i];
      base[`${lo}~${hi}`] = true;
    }
    return base;
  };

  readonly loadFromUpstream = (meta: FDocRowRangesV1): false | number => {
    if (meta.format !== '1') {
      console.warn(`Unsupported version ${JSON.stringify(meta.format)}`);
      return false;
    }
    const newRange = new IntIntervals();

    const keys = Object.keys(meta);
    for (let i = 0; i < keys.length; i++) {
      const _range = keys[i];
      if (_range === 'format') continue;

      const v = meta[_range];
      if (!v) continue;

      const range: [number, number] = _range
        .split('~')
        .map((it) => parseInt(it, 10)) as any;
      if (range.length !== 2 || isNaN(range[0]) || isNaN(range[1])) {
        console.warn(`Invalid range: ${JSON.stringify(_range)}`);
        continue;
      }
      newRange.add(range);
    }

    this.range = newRange;
    return this.range.size;
  };

  /** Mark a row that contains data */
  readonly markRow = (rowIndex: number): MarkRowResult => {
    if (this.range.has(rowIndex)) return { rowIndexes: [rowIndex, rowIndex] };
    this.range.add([rowIndex, rowIndex]);
    return { rowIndexes: [rowIndex, rowIndex], isNew: true };
  };
  /** Mark rows(inclusive) that contains data */
  readonly markRows = (begin: number, end: number): MarkRowResult => {
    if (this.range.has([begin, end])) return { rowIndexes: [begin, end] };
    this.range.add([begin, end]);
    return { rowIndexes: [begin, end], isNew: true };
  };

  /**
   * Call this method to know which rows in the view port need to be fetched,
   * so we don't need to fetch all rows in the view port every time.
   *
   * @returns An inclusive range. `null` means all rows in the view port don't contain data.
   */
  readonly checkWhichRowsNeedToBeFetched = (
    viewPortRange: [number, number],
  ) => {
    const result = this.range.diff(viewPortRange);
    if (result.length === 0) return null;
    if (result.length === 1) return result[0];
    return viewPortRange;
  };

  readonly getBlocksInfoByRowIndex = (rowIndex: number) =>
    this.rowIndexToBlock[rowIndex];

  readonly setBlocksInfo = (
    rowIndex: number,
    blockInfo: BlockInfoDescriptor,
  ) => {
    this.rowIndexToBlock[rowIndex] = blockInfo;
  };
  readonly setBlockId = (
    rowIndex: number,
    blockId: string,
    updatedAt: number,
  ) => {
    this.rowIndexToBlock[rowIndex] = {
      id: [blockId],
      updatedAt,
    };
  };

  /** This method is used for the firestore subscriber */
  onUpstreamMetaChanges = async (data: any, isLocalChange: boolean) => {
    if (isLocalChange) return;
    const count = this.loadFromUpstream(data as any);
    console.log(`update ${count} row ranges from the Firestore`);
  };
}
