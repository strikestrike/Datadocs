type ExclusiveRange = [number, number, unknown?];

/**
 * Loader interface for the rows loading queue
 */
export type RowsLoaderForQueue = {
  /**
   * The queue class will call this method before loading rows.
   * Any falsy result (e.g., null, undefined) will be interpreted as a sign that
   * loading rows from this range should be canceled.
   */
  transformRange(range: ExclusiveRange): ExclusiveRange | null | undefined;
  /**
   * The core method of the loader.
   * The queue class will call this method when a range needs to be loaded.
   */
  load(range: ExclusiveRange): Promise<void>;
};

/**
 * A task descriptor input for the queue class.
 * The queue class can create a task item based on this input internally
 */
export type AddRowsLoadingTask<MetaType = any> = {
  range: ExclusiveRange;
  meta?: MetaType;
  /** in ms */
  timeout?: number;
};

export type RowsLoadingTask<MetaType = any> = {
  /** Request id, the user can use this id to cancel special request */
  id: number;
  /** Exclusive range */
  range: ExclusiveRange;
  /** expire at */
  exp: number;

  meta?: MetaType;

  waiting?: boolean;
  cancellable?: boolean;
  end?: 'completed' | 'cancelled' | 'failed';
};

export type RowsLoadingQueueOptions = {
  /** The max rows would be fetched for each task */
  maxRows: number;
  /** The max parallel tasks */
  parallel: number;
  /**
   * First In first out
   * https://en.wikipedia.org/wiki/Stack_(abstract_data_type)
   */
  fifo: boolean;
  /**
   * unit: ms
   * see `wait` in https://lodash.com/docs/#debounce
   */
  throttle: number;
  /** Default timeout in ms */
  timeout: number;
  /** Enable printing console logs for debugging  */
  debug?: boolean;
};
