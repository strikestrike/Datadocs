import { reorderInSparseData } from '../reorder/sparse-data';

type PlainDict = { [prop: string]: any };

export type RowDataInput<BaseType extends PlainDict> = Omit<
  BaseType,
  'loadedAt' | 'lastReadAt' | 'expAt'
>;

export type InMemRowCache<BaseType extends PlainDict> =
  RowDataInput<BaseType> & {
    expAt?: number;
    /** `loadedAt` and `lastReadAt` are used for cache cleaning */
    loadedAt: number;
    /** @see loadedAt */
    lastReadAt: number;
  };

export type InMemRowIndex = number | 'total';

/**
 * This class is used to store transformed data from
 * data backends (e.g., duckdb/firestore/http api) for the grid
 * so that the grid can render the data/style from the "rows" property in this class directly.
 *
 * @todo Add methods for cleaning caches
 */
export class InMemRowsCacheManager<BaseType extends PlainDict> {
  private outdated: {
    [realRowIndex: string]: InMemRowCache<BaseType>;
  } = null;
  private rows: {
    [realRowIndex: string]: InMemRowCache<BaseType>;
  } = {};

  /** Each value is real row index */
  queue: InMemRowIndex[] = [];

  readonly getDefault: (rowIndex: InMemRowIndex) => RowDataInput<BaseType>;
  constructor(
    defaults:
      | RowDataInput<BaseType>
      | ((rowIndex: number) => RowDataInput<BaseType>),
  ) {
    this.getDefault =
      typeof defaults === 'function'
        ? defaults
        : // `{ ...defaults }` means cloning the object shallowly
          () => ({ ...defaults });
  }

  readonly reorderRows = (
    beginViewIndex: number,
    count: number,
    afterViewIndex: number,
  ) => {
    const rowIndexes: number[] = [];
    for (let i = 0; i < count; i++) rowIndexes.push(beginViewIndex + i);
    reorderInSparseData(this.rows, rowIndexes, afterViewIndex);
  };

  readonly add = (rowIndex: InMemRowIndex, row: RowDataInput<BaseType>) => {
    const now = Date.now();
    this.rows[rowIndex] = {
      ...row,
      loadedAt: now,
      lastReadAt: 0,
      expAt: 0,
    };
    this.queue.push(rowIndex);
  };

  readonly clear = () => {
    this.outdated =
      (this.outdated && Object.assign(this.outdated, this.rows)) ?? this.rows;
    this.rows = {};
  };
  readonly clearOutdated = () => {
    this.outdated = null;
  };

  readonly isRowLoaded = (
    rowIndex: InMemRowIndex,
    includedOutdated?: boolean,
  ) => {
    if (this.rows[rowIndex]) return true;
    if (includedOutdated && this.outdated) return !!this.outdated[rowIndex];
    return false;
  };

  /**
   * @todo docs
   */
  readonly get = (
    rowIndex: InMemRowIndex,
  ): InMemRowCache<BaseType> | undefined => {
    let row = this.rows[rowIndex];
    if (!row && this.outdated) row = this.outdated[rowIndex];
    return row;
  };

  readonly getForEdit = (rowIndex: InMemRowIndex): InMemRowCache<BaseType> => {
    let row = this.rows[rowIndex];
    if (!row) {
      row = {
        ...this.getDefault(rowIndex),
        loadedAt: 0,
        lastReadAt: Date.now(),
        expAt: 0,
      };
      this.rows[rowIndex] = row;
    }
    return row;
  };
}
