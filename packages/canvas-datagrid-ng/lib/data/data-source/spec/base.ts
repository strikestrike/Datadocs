import type { ClipboardBase } from '../../../clipboard/spec';
import type { DataEventTargetInterface } from '../../event-target/spec';
import type { UnhiddenRange } from '../types/hidden-range-store';
import type { PositionHelper } from '../types/position-helper';
import type {
  RequestDataFrameInput,
  RequestDataFrameOutput,
} from './data-frame';
import type { EditCellDescriptor } from './edit';
import type { FilterDescriptor } from '../filters/spec';
import type { GridSort, SortDescriptor } from '../sorters/spec';
import type { DataSourceState } from './state';
import type { HiddenColumnsInfo } from './hide';
import type { NamespaceController } from './namespace';
import type {
  GridHeader,
  GridSchemaItem,
  SizeMapping,
  MergedCellsManager,
  FilterableValues,
  RangeDescriptor,
  TableDescriptor,
  TableSpillBehavior,
  TableStyle,
  CellClearMode,
  GetFilterableValuesOptions,
  FilterableColors,
  GridJsonTypeMap,
  GridStructPathType,
  GridFilterTarget,
  CellStyleDeclaration,
  CellBorder,
  GridSavedFilter,
  DataGroup,
  TableGroupHeader,
  GridFilterValue,
  TableGroupSummary,
} from '../../../types';
import type { NamedRangeManager } from '../../../named-ranges/spec';
import type { DataEvent } from './events';
import type { PreloadOptions, PreloadResult } from './preload';
import type { DataSourceSettings } from './settings';

export type AllowAsync<T> = T | Promise<T>;

export interface CellMeta {
  [key: string]: any;
}

/**
 * @version 2023-11-14
 *
 * @todo provide a method for detecting the loading status of the area
 */
export interface DataSourceBase extends DataEventTargetInterface<DataEvent> {
  //#region public fields
  /** The name of this data source */
  readonly name?: string;
  readonly mergedCells: MergedCellsManager;
  readonly namedRanges: NamedRangeManager;
  readonly namespace: NamespaceController;
  readonly state: DataSourceState;
  readonly sizes: SizeMapping;
  readonly positionHelper: PositionHelper;
  /** Providing this field can be used for supporting virtual clipboard or remote clipboard */
  readonly clipboard?: ClipboardBase;
  //#endregion public fields

  /**
   * The data source class can know the grid instance by this method.
   * So the data source can access the method of the grid for some necessary operation.
   * For example, showing the modal to know the user decision.
   * And the reason why the type of the `grid` parameter in here is any is that:
   *
   * The data source should be a separate component from the grid. So its point of view,
   * the data source class may be created not for the purpose of providing data for the grid.
   * {@link GridPublicAPI.GridPublicAPI}
   */
  bind?(grid: any): void;
  /**
   * Remove the relationship between the grid instance and the data source instance
   * @see bind
   */
  unbind?(grid: any): void;

  /**
   * This API is used to preload data to reduce the time the grid is without data.
   * @see PreloadResult
   */
  preload?(options?: PreloadOptions): PreloadResult;

  /**
   * REQUIRED method for the database
   * @param request
   */
  getDataFrame(request: RequestDataFrameInput): RequestDataFrameOutput;

  /**
   * Abort internal request to remote API or database
   * @param abortToken from the result of `getDataFrame`
   */
  abort?(abortToken: number | string): boolean;

  getCellValue(rowViewIndex: number, columnViewIndex: number): any;

  /**
   * Get cell value by using columnId and rowViewIndex
   */
  getCellValueByColumnId?(columnId: string, rowViewIndex: number): any;

  /**
   * Get a table cell value by using columnId and rowViewIndex
   */
  getTableCellValueByColumnId?(
    table: TableDescriptor,
    columnId: string,
    rowViewIndex: number,
  ): any;

  getCellStyle?(rowViewIndex: number, columnViewIndex: number): any;

  /**
   * This is used for binding meta info to special cell.
   * This meta info can be used for rendering custom cell UI, like:
   * `getStyle(cell) => Object.assign(cell.customStyle, getStyleFromMeta(cell.meta))`
   * Example meta: `{ conflict: { upstream: {value: 'NEW', time: ....} }}`
   */
  getCellMeta?(rowViewIndex: number, columnViewIndex: number): CellMeta;

  /** Get all columns, include hidden ones */
  getAllColumns?(): GridHeader[];

  //#region Value filters
  /**
   * EXPERIMENTAL
   *
   * @param columnId The column for which this will return the previously
   *  applied filters.
   * @returns The currently applied filter to this data source.
   */
  getFilter?(columnId: string): GridFilterTarget | undefined;
  /**
   * @returns All the applied filters for each column, or the advanced filter,
   *  or undefined if no filter has previously been set.
   */
  getFilters?(): GridSavedFilter | undefined;
  /**
   * EXPERIMENTAL
   *
   * Changes the filter applied to this data source.
   * @param target That contains where to and the filter to apply, or undefined
   *  to remove the current filter.
   * @param columnId When provided, the given filter target will be applied as
   *  simple filter, or otherwise, it is going to be applied as an advanced
   *  filter.
   * @returns True when the filter is successfully appplied and saved.
   */
  setFilterNg?(
    target: GridFilterTarget,
    columnId?: string,
  ): AllowAsync<boolean>;
  /**
   * EXPERIMENTAL
   *
   * @param columnId
   * @returns The currently applied sort, or undefined.
   */
  getSorter?(columnId: string): GridSort | undefined;
  /**
   * EXPERIMENTAL
   *
   * @returns The applied list of sorters or an empty list if there is none.
   */
  getSorters?(): GridSort[];
  /**
   * EXPERIMENTAL
   *
   * Sets the sort, or removes when an undefined value is given.
   * @param sort Sort, or list of sorts to replace all.
   * @return True when the sort is successfully applied.
   */
  setSorter?(sort: GridSort | GridSort[]): AllowAsync<boolean>;
  /**
   * Remove an existing sort.
   * @param columnId The column id or undefined to clear all.
   */
  removeSorter?(columnId?: string): AllowAsync<boolean>;
  /**
   * Sets how the data returned by the source will be grouped.
   *
   * The groups will be nested by the ones coming before inside the array.
   *
   * Note that this is not the same as row or column group.
   * @param groups To be applied (empty array or undefined removes all.)
   * @returns True after the groups are successfully set and the data source
   *  successfully applies the change.
   */
  setGroups?(groups: DataGroup[] | undefined): AllowAsync<boolean>;
  /**
   * Returns the previously set groups.
   * @returns The groups array.
   * @see setGroups
   */
  getGroups?(): DataGroup[];
  /**
   * Produces the summary for a group.
   * @param columnId The column for which this will produce the summary.
   * @param groupLookupValues The lookup values for each group in the order they
   *  appear.
   */
  getGroupSummary?(
    columnId: string,
    groupLookupValues: GridFilterValue[],
  ): AllowAsync<TableGroupSummary[]>;
  setAggregationFn?(
    columnId: string,
    fnName?: string | null,
  ): AllowAsync<boolean>;
  /**
   * Compiles the list of background, text, or icon colors that can be used for
   * filtering or sort.
   *
   * The items in the lists should not exceed the limit in number.
   * @param columndId
   * @param limit The upper limit for the number of total items in the lists.
   */
  getFilterableColorsForColumn?(
    columndId: string,
    limit: number,
  ): AllowAsync<FilterableColors>;
  /**
   * Returns the filterable values-list or the chunk of it for the given column
   * ID.
   * @param columnId
   * @param options Query options.
   */
  getFilterableValuesForColumn?(
    columnId: string,
    options?: GetFilterableValuesOptions,
  ): AllowAsync<FilterableValues>;
  /**
   * Get the target field to filter and sort a struct type column.
   * @param columnId Of the struct type column.
   */
  getStructFilterPath?(columnId: string): string | undefined;
  /**
   * Set the target field to filter and sort a struct type column.
   * @param columnId Of the struct type column.
   * @param target The target field name with it is namespace
   *  (e.g., Address.Main.ZipCode).
   */
  setStructFilterPath?(
    columnId: string,
    target: string | undefined,
  ): AllowAsync<boolean>;
  /**
   * Get the type to cast JSON path to.
   * @param columnId Of the JSON type field.
   * @returns The type or undefined nothing is set yet.
   * @see GridStructPathType
   */
  getStructFilterPathType?(columnId: string): GridStructPathType | undefined;
  /**
   * Set the type to cast JSON path to.
   * @param columnId Of the JSON field.
   * @param pathType To cast, or undefined to remove the previous value.
   * @see GridStructPathType
   */
  setStructFilterPathType?(
    columnId: string,
    pathType: GridStructPathType | undefined,
  );
  //#endregion Value filters

  /**
   * Sample and return the JSON field structure.
   * @param columnId Of the JSON field.
   * @param limit For the amount of rows to use as sample.
   * @returns The type map of the JSON type field.
   */
  getJsonFieldStructure?(
    columnId: string,
    limit: number,
  ): AllowAsync<GridJsonTypeMap>;

  deprecated_getAllSchema?(): GridHeader[];
  deprecated_getRowData?(rowViewIndex: number): any;

  setSchema?(schema: GridSchemaItem[]): AllowAsync<boolean>;

  getHeader(viewIndex: number): GridHeader;
  getHeaderById(columnId: string): GridHeader;
  /**
   * TODO:
   * 1. Any difference on usage between this API and `deprecated_getAllSchema`, exlcuded AllowAsync.
   * 2. The place where this API will have an effect and be used.
   */
  getHeaders?(search?: string): AllowAsync<GridHeader[]>;

  /**
   * The fields used to uniquely describe a row.  These can be manually selected
   * by the user, and we can also have the PK fields assigned automatically.
   * @return The column IDs used as primary keys.
   */
  getPrimaryKeys?(): string[];
  /**
   * Set the fields that are going to be used to uniquely describe rows.
   * @param pks The array of column IDs to use as the primary keys.
   */
  setPrimaryKeys?(pks: string[]): boolean;

  createRows?(afterRowViewIndex: number, count: number): AllowAsync<boolean>;
  deleteRows?(rowViewIndex: number, count: number): AllowAsync<boolean>;

  /**
   * @todo We need to allow this method to receive more information about the new columns
   * @param count Number of columns or the EXPERIMENTAL name and the formula.
   */
  createColumns?(
    afterColumnViewIndex: number,
    count: number | { name?: string; formula: string },
  ): AllowAsync<boolean>;
  deleteColumns?(columnViewIndex: number, count: number): AllowAsync<boolean>;

  containsDataInRange?(
    range: RangeDescriptor,
    options?: { skipTableWithName?: string },
  ): boolean;
  clearRange?(
    range: RangeDescriptor,
    options?: { skipTables?: boolean },
  ): AllowAsync<boolean>;
  expandRange?(range: RangeDescriptor): AllowAsync<boolean>;

  editCells?(
    edit: EditCellDescriptor[],
    replace?: boolean,
  ): AllowAsync<boolean>;

  /**
   * Edit style for entire column. @clearLinkRuns is used to indicate whether link-runs
   * should be removed or not. E.g. If we add Hyperlink data-format to a cell, its link
   * data should also be emptied.
   * @param viewIndex Column view index
   * @param style Style to edit
   * @param clearLinkRuns Whether the link data should be cleared or not
   * @param oldState
   */
  editColumnStyle?(
    viewIndex: number,
    style: Partial<CellStyleDeclaration>,
    clearLinkRuns: boolean,
    oldState: {
      column: Partial<CellStyleDeclaration>;
      cells: any;
      dataSource: DataSourceBase;
    },
  ): AllowAsync<boolean>;

  editColumnBorders?(
    viewIndex: number,
    positions: Array<keyof GridHeader['borderStyle']>,
    border: CellBorder,
    type: 'add' | 'clear',
    oldState?: {
      column: GridHeader['borderStyle'];
      cells: any;
      dataSource: DataSourceBase;
    },
  ): AllowAsync<boolean>;

  setColumnStyleState?(
    columnId: string,
    columnStyle: Partial<CellStyleDeclaration>,
    columnCellsStype: Record<number, number>,
  ): AllowAsync<boolean>;

  setColumnBorderState?(
    columnId: string,
    columnBorder: GridHeader['borderStyle'],
    cellsStyle: Record<number, number>,
  ): AllowAsync<boolean>;

  //#region tables
  createTable?(
    name: string,
    rowViewIndex: number,
    columnViewIndex: number,
    dataSource: DataSourceBase,
    style?: Partial<TableStyle>,
    spillBehavior?: TableSpillBehavior,
  ): TableDescriptor;
  deleteTable?(name: string): boolean;
  getTable?(name: string): TableDescriptor;
  getTableByIndex?(
    rowViewIndex: number,
    columnViewIndex: number,
  ): TableDescriptor | undefined;
  getTablesInRange?(range: RangeDescriptor): TableDescriptor[];
  getTableGroupHeader?(rowViewIndex: number): TableGroupHeader | undefined;
  isInTableRange?(
    table: TableDescriptor,
    rowViewIndex: number,
    columnViewIndex: number,
  ): boolean;
  setHeaderVisibility?(
    columnId: string,
    visible: boolean | 'replace',
  ): AllowAsync<boolean>;
  hideTableColumns?(tableId: string, ranges: RangeDescriptor[]): boolean;
  unhideAllTableColumns?(tableId: string): boolean;
  //#endregion tables
  clearCells?(range: RangeDescriptor, mode: CellClearMode): AllowAsync<boolean>;

  //#region filters and sorters
  setFilter?(filters: FilterDescriptor[]): AllowAsync<boolean>;
  sort?(sortRules: SortDescriptor[]): AllowAsync<boolean>;

  getCurrentFilters?(): Array<[GridHeader, FilterDescriptor]>;
  getCurrentSorters?(): Array<{
    column: GridHeader;
    dir: 'desc' | 'asc';
  }>;
  //#endregion filters and sorters

  //#region move
  /**
   * Move the data in the given range.
   * @param range The target range to move.
   * @param rowOffset Change in row order.
   * @param columnOffset Change in column order.
   * @param replace When false, instead of replacing, exit with error.
   */
  move?(
    range: RangeDescriptor,
    rowOffset: number,
    columnOffset: number,
    replace?: boolean,
  ): AllowAsync<boolean>;
  //#endregion move

  //#region hide and unhide
  hideColumns?(
    columnViewIndex: number,
    count: number,
    isGroup?: boolean,
  ): boolean;
  /** @returns the view indexes of restored columns */
  unhideColumns?(afterColumnViewIndex: number, isGroup?: boolean): number[];
  unhideAllColumns?(): boolean;

  hideRows?(beginIndex: number, endIndex: number, isGroup?: boolean): boolean;
  unhideRows?(
    beginIndex: number,
    endIndex: number,
    isGroup?: boolean,
  ): UnhiddenRange;

  getHiddenColumns?(viewIndex: number): HiddenColumnsInfo | undefined;
  getHiddenColumnCount?(): number;
  getHiddenRowCount?(): number;
  //#endregion hide and unhide

  allowReorderColumns?(
    beginViewIndex: number,
    count: number,
    afterViewIndex?: number,
  ): boolean | number;
  reorderField?(columnId: string, afterColumnId: string): AllowAsync<boolean>;
  reorderColumns?(
    beginViewIndex: number,
    count: number,
    afterViewIndex: number,
  ): AllowAsync<boolean>;

  allowReorderRows(
    beginViewIndex: number,
    count: number,
    afterViewIndex?: number,
  ): boolean | number;
  reorderRows?(
    beginViewIndex: number,
    count: number,
    afterViewIndex: number,
  ): AllowAsync<boolean>;

  getSettings?(): DataSourceSettings;
  updateSettings?(settings: Partial<DataSourceSettings>): AllowAsync<boolean>;
}
