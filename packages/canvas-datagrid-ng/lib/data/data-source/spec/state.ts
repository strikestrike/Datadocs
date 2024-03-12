/**
 * @version 2022-12-25
 */
export type DataSourceState = {
  /**
   * Is this data source initialized,
   * The grid can render the large loading overlay if this value is `false`
   */
  initialized: boolean;

  /**
   * Is this data source loading any data asynchronizely.
   * The grid can render a small loading badge(icon) if this value is `true`
   */
  loading: boolean;

  /** How many rows in total */
  rows: number;

  /** How many columns in total */
  cols: number;

  /**
   * Last internal error
   */
  lastError?: Error;
};
