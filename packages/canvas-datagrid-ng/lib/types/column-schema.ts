import type { GridStructPathType } from '.';
import type { AggregationFnType } from '../data/table/summary';
import type { FilterFn, FormatterFn, SorterFnGenerator } from './base';
import type { CellWrapMode } from './cell';
import type { ColumnType } from './column-types';

/**
 * This type is used to define how a column should be rendered within the grid.
 * This type is used as the input parameter type in most cases.
 *
 * For example, the methods for initializing/adding columns refer this type.
 *
 * Under the hood, the grid/data-source transform each schema item to `GridHeader` object based on the contextual config. The grid/data-source then stores `GridHeader` in the memory instead of the original `GridSchemaItem` item.
 */
export type GridSchemaItem = {
  /**
   * The property name of the row data.
   * The data source class uses its value as the key to pick up the value for this column from the data.
   *
   * For example:
   * The value of this property is `details`, and the row data is `{name:"A",details:{price:100}}`.
   * Then the column in this row will be rendered from the value `{price:100}`
   */
  dataKey: string | number;

  /**
   * A unique id string for the column.
   * This value will be used for identifing/locating a column
   */
  id: string;

  /**
   * The default type of the column.
   * The data source class will infer the type from the samples if this property is not provided
   */
  type?: ColumnType;

  /**
   * The title of the column.
   * E.g., `A`, `B`, `C`, `Name`, ...
   */
  title?: string;

  /**
   * Custom width for this column
   * @deprecated
   */
  width?: number;

  /**
   * This property is only used when the current item is used for the parameter of setSchema function.
   */
  hidden?: boolean;

  /**
   * Custom filter funtcion for this column
   */
  filter?: FilterFn;

  /**
   * The target to be used with the struct/JSON type fields for filtering and
   * sorting which can be formatted as `Address.Primary.ZipCode` where `Address`
   * and `Primary` are the nested structs, and `ZipCode` is the number value.
   */
  structFilterPath?: string;
  /**
   * The type to cast to the path that is used for filtering.  This is mainly
   * for JSON type fields.
   */
  structFilterPathType?: GridStructPathType;

  formatter?: FormatterFn<GridSchemaItem>;

  /**
   * Custom sorting generator for this column
   */
  sorter?: SorterFnGenerator;

  /**
   * The function to use to aggregate the data on the column this represents.
   *
   * When undefined, the default one for the column type should be used.
   *
   * When null, the column should not produce a summary, and 'None' should be
   * shown as the active option.
   */
  aggregationFn?: string | null;

  defaultValue?:
    | string
    | ((this: void, schema: GridSchemaItem, rowIndex: number) => string);

  /**
   * Whether ellipsis should be used when cell content
   * does not fit the cell. Defaults to true.
   */
  truncateWithEllipsis?: boolean;

  /**
   * Specifies how the content should wrap when it
   * does not fit in the cell. Refer the documentation of
   * CellWrapMode for details and possible values.
   */
  wrapMode?: CellWrapMode;

  /**
   * Whether cells of this columns are read-only.
   */
  isReadOnly?: boolean;
};
