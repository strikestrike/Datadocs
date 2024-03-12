import type { ColumnType } from '@datadocs/canvas-datagrid-ng/lib/types/column-types';

export type TableField = {
  name: string;
  type: ColumnType;
};

/**
 * This state type is designed for DuckDB data source internal use only.
 * It contains all necessary state information for querying/manipulating DuckDB.
 */
export interface DuckDBStateBase {
  /**
   * This field indicates whether it has been initialized.
   * - `true`: It has already been initialized.
   * - `false`: Initialization has not started.
   * - A Promise object: It is currently initializing. Waiting for this promise by using `await`
   * ensures that initialization is completed for the further logic.
   */
  init: boolean | Promise<void>;

  /**
   * Can the data be editable
   */
  editable: boolean;

  /**
   * The primary key that is used for modifying the data and locating the row.
   * For `RAW` mode and read only mode, this primary key field can be empty.
   */
  primaryKey: string[];

  /**
   * A escaped tbname or a nested select `(SELECT ....)`.
   * It can be directly inserted into the SQL statement, as it has already been escaped.
   */
  selectionSource: string;

  /**
   * The number of partial rows in the table/view without any filter.
   *
   * The reason why we need this field is: The table may contain a very large number of rows,
   * and counting its rows can take a considerable amount of time.
   * In this case, we first count its rows with a limit to determine whether the size of
   * the table is small or larger than a limit. After the rows in the current viewport
   * are loaded and rendered, we count its rows without any blocks for user actions.
   */
  numPartialRows: number;

  /**
   * The number of rows in the table/view without any filter
   */
  numRows: number;

  /**
   * All fields info in the table/view
   */
  fields: TableField[];
}

/**
 * `DuckDBState := DuckDBStateBase & getterFunctions & setterFunctions`
 *
 * This class consists only of `DuckDBStateBase` and getter/setter methods.
 * DON'T add methods that have complex logic rather than simple getter/setter methods in it.
 */
export class DuckDBState implements DuckDBStateBase {
  init: boolean | Promise<void> = false;
  editable = false;
  primaryKey: string[];
  selectionSource: string;
  numPartialRows: number;
  numRows: number;
  fields: TableField[];

  getNumRows() {
    if (typeof this.numRows === 'number') return this.numRows;
    if (typeof this.numPartialRows === 'number') return this.numPartialRows;
    return 0;
  }

  setSelectionSource(sql: string) {
    sql = sql.split(';')[0];
    this.selectionSource = '(' + sql + ')';
  }
}
