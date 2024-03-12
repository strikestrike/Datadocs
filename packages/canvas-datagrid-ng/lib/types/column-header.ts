import type { FormatterFn } from './base';
import type {
  CellBorder,
  CellStyleDeclaration,
  HeaderCellBaseStyleName,
  NormalCellDescriptor,
} from './cell';
import type { GridSchemaItem } from './column-schema';

type EnumResult = Array<[string, string]>;

/**
 * This type is designed as a transformed type based on the type `GridSchemaItem`.
 *
 * And this type contains some runtime state of the column.
 * The column objects in data-source classes are marked as this type.
 */
export type GridHeader = Omit<GridSchemaItem, 'formatter'> & {
  // Extending the type of the property `formatter` from
  // `FormatterFn<GridSchemaItem>`
  formatter?: FormatterFn<GridHeader>;

  /**
   * The position of the header excluding the hidden ones that come before it,
   * which is used for representing the column on the grid for viewing.
   */
  columnViewIndex?: number;
  /**
   * The position of the header unaffected by hidden ones.
   */
  columnIndex?: number;
  /**
   * It is similar with the old property `boundColumnIndex`,
   * But it is not useful for the most situation in the grid core code.
   */
  originalColumnIndex?: number;

  /**
   * Store column-level style, include data format for the whole column
   */
  columnStyle?: Partial<CellStyleDeclaration>;

  /**
   * Column borders style.
   */
  borderStyle?: Partial<{
    /**
     * Top border of first value cell
     */
    top: CellBorder;
    /**
     * Bottom border of last value cell
     */
    bottom: CellBorder;
    /**
     * Left border of all value cell
     */
    left: CellBorder;
    /**
     * Right border of all value cells
     */
    right: CellBorder;
    /**
     * Inner border of cells in column
     */
    inner: CellBorder;
  }>;

  style?: HeaderCellBaseStyleName;
  isColumnHeaderCell?: boolean;
  isColumnHeaderCellCap?: boolean;
  enum?: EnumResult | ((e: { cell: NormalCellDescriptor }) => EnumResult);
};
