/**
 * This is used to specify options for preloading data
 */
export type PreloadOptions = {
  /**
   * It defines an exclusive range of rows to preload.
   * The default value is the current view port of the bound grid.
   *
   * This option is useful for calling the preload API before binding
   * a data source to a grid. We use this option to tell the data source
   * which rows should be given priority to preload.
   */
  rowsRange?: [number, number];
};

/**
 * This is the result object returned by a preload API.
 */
export type PreloadResult = {
  /**
   * It represents the ongoing preloading process,
   * you can use `await` keyword to wait it after you got the result of the `preload` API.
   */
  wait?: Promise<void>;

  /**
   * It is a function to preload some related rows after the app
   * becomes idle, and it sometimes takes a long time to complete
   * in a large data set.
   *
   * Typically, you can call it after you have bound the data source
   * to the grid or updated the data in the current viewport of the grid.
   */
  idle: () => Promise<void>;
};
