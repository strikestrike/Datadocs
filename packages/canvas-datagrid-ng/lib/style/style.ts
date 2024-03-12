import type {
  GridPrivateProperties,
  CellStyleDeclaration,
  CellBorderStyle,
  CellBorder,
  RangeDescriptor,
  EditCellDescriptor,
  GridHeader,
  TableDescriptor,
  NormalCellDescriptor,
  StyleRun,
  CellDataFormat,
  MetaRun,
} from '../types';
import { copyMethods } from '../util';
import { dehyphenateProperty } from '../web-component/utils';
import type { GridPosition } from '../position';
import type { SelectionDescriptor } from '../selections/types';
import type { defaultStandardZIndex } from './z-index';
import { ensureAsync } from '../data/data-source/await';
import { getUndoRedoCellKey, undoRedoKeyToIndex } from '../utils/undo-redo';
import {
  getTableCellStringValue,
  getFormulaCellLinkRuns,
  getLinkDisplayContent,
  isFormulaCell,
} from '../utils/hyperlink';
import { mergeStyleRuns } from '../utils/style-runs';
import { isHyperlinkDataFormat } from '../data/formatters';
import { formatFormulaData } from '../data/data-format';

export default function loadGridStylesHelper(self: GridPrivateProperties) {
  copyMethods(new GridStylesHelper(self), self);
}

export type EditBordersOperation =
  | 'all_borders'
  | 'inner_borders'
  | 'horizontal_borders'
  | 'vertical_borders'
  | 'outer_borders'
  | 'left_border'
  | 'top_border'
  | 'right_border'
  | 'bottom_border'
  | 'clear_borders';

/**
 * A way to lookup for the adjacent cell border position
 * and relative distance from an individual cell border
 */
const adjCellBorderLookup: Record<
  GridPosition,
  { position: GridPosition; deltaX: number; deltaY: number }
> = {
  top: { position: 'bottom', deltaX: 0, deltaY: -1 },
  bottom: { position: 'top', deltaX: 0, deltaY: 1 },
  left: { position: 'right', deltaX: -1, deltaY: 0 },
  right: { position: 'left', deltaX: 1, deltaY: 0 },
};

const borderStylePriority: Partial<Record<CellBorderStyle, number>> = {
  empty: -1,
  dotted: 1,
  dashed: 2,
  thin: 3,
  medium: 4,
  thick: 5,
  double: 6,
};

export class GridStylesHelper {
  /**
   * In the process of changing cells borders, @currentBorders acts as a temporarily
   * store for those changes without commiting changes to data source
   */
  private currentBorders: Record<string, CellStyleDeclaration['borders']> = {};

  constructor(private readonly grid: GridPrivateProperties) {}

  getStyleProperty = (key: string) => {
    const self = this.grid;
    if (self.styleKeys.indexOf(key) === -1) return self.parentNodeStyle[key];
    return self.style[key];
  };

  getZIndex = (key: keyof typeof defaultStandardZIndex) =>
    String(this.grid.style.standardZIndex[key] || 0);
  getZIndexInt = (key: keyof typeof defaultStandardZIndex) =>
    this.grid.style.standardZIndex[key];

  /**
   * Update a style property.
   *
   * If the given {@link key} is present in the default styles, the new value
   * overrides the default value. If it is not, the value applied to the canvas
   * that the grid manages internally.
   *
   * If the given {@link key} is a dimension, it will trigger a resize, which
   * can be suppressed using {@link suppressUpdates}.
   * @param key To set.
   * @param value The new value.
   * @param suppressUpdates Avoid drawing or resizing.  If the given {@link key}
   *  is a dimension, and updates are suppressed,
   *  {@link resize} must be called manually.
   */
  setStyleProperty = (key: string, value: any, suppressUpdates?: boolean) => {
    const self = this.grid;
    const isDim =
      [
        'height',
        'width',
        'minHeight',
        'minWidth',
        'maxHeight',
        'maxWidth',
      ].indexOf(key) !== -1;
    if (key === 'gridBackgroundColor') {
      if (self.canvas) self.canvas.style.background = value;
    }
    if (self.styleKeys.indexOf(key) === -1) {
      self.parentNodeStyle[key] = value;
    } else {
      if (/-/.test(key)) {
        key = dehyphenateProperty(key);
      }
      self.style[key] = value;
    }
    if (!suppressUpdates) {
      if (isDim) self.resize();
      self.draw(true);
      self.dispatchEvent('stylechanged', { name: 'style', value: value });
    }
  };

  getBorderPriority = (style: CellBorderStyle) => {
    return borderStylePriority[style] || 0;
  };

  /**
   * Check if a border style is higher priority compare to others
   */
  isHigherPriorityBorder = (
    style: CellBorderStyle,
    others: CellBorderStyle[],
    countEqual?: boolean,
  ): boolean => {
    const priority = this.getBorderPriority(style);
    const otherPriorities = others.map((v) => this.getBorderPriority(v));
    return otherPriorities.every((p) =>
      countEqual ? priority >= p : priority > p,
    );
  };

  /**
   * Get width of a border
   */
  getBorderWidth = (border: CellBorder) => {
    const self = this.grid;
    if (border?.style) return self.style.scaled[border.style + 'BorderWidth'];
    return self.style.scaled.cellBorderWidth;
  };

  /**
   * Check are two borders the same
   */
  isSameBorderStyle = (style1: CellBorder, style2: CellBorder) => {
    return style1?.style === style2?.style && style1?.color === style2?.color;
  };

  /**
   * Check if a cell index is in grid
   * @param rowIndex
   * @param columnIndex
   */
  private isCellInvalid = (rowIndex: number, columnIndex: number) => {
    const dataSource = this.grid.dataSource;
    if (
      !dataSource ||
      rowIndex < 0 ||
      rowIndex >= dataSource.state.rows ||
      columnIndex < 0 ||
      columnIndex >= dataSource.state.cols
    )
      return true;
    return false;
  };

  /**
   * Get adjacent cell border style if it has different CellBorder from its
   * neighbor.
   * @param rowIndex
   * @param columnIndex
   * @param cellBorder
   * @param position
   */
  cleanUpAdjBorder = (
    rowIndex: number,
    columnIndex: number,
    cellBorder: CellBorder,
    position: string,
  ) => {
    const adjPosition = adjCellBorderLookup[position].position;
    const adjRowIndex = rowIndex + adjCellBorderLookup[position].deltaY;
    const adjColumnIndex = columnIndex + adjCellBorderLookup[position].deltaX;

    if (this.isCellInvalid(adjRowIndex, adjColumnIndex)) return;

    const { borders: adjBorders, isOld } = this.getCurrentBorders(
      adjRowIndex,
      adjColumnIndex,
    );

    if (
      adjBorders &&
      adjBorders[adjPosition] &&
      (!cellBorder ||
        !this.isSameBorderStyle(cellBorder, adjBorders[adjPosition]))
    ) {
      const newAdjBorders = { ...adjBorders, [adjPosition]: null };
      return {
        row: adjRowIndex,
        column: adjColumnIndex,
        hasOldState: isOld,
        oldBorders: adjBorders,
        newBorders: newAdjBorders,
      };
    }
  };

  /**
   * Edit a cell border and keep other borders intact
   * @param rowIndex
   * @param columnIndex
   * @param cellBorder
   * @param position
   * @param cleanAdjacentBorder Should adjacent border be cleaned up
   * @returns
   */
  editCellBorder = (
    rowIndex: number,
    columnIndex: number,
    cellBorder: CellBorder,
    position: string,
    cleanAdjacentBorder = false,
  ) => {
    const dataSource = this.grid.dataSource;
    if (this.isCellInvalid(rowIndex, columnIndex)) return;
    const cellStyle: Partial<CellStyleDeclaration> = dataSource.getCellStyle?.(
      rowIndex,
      columnIndex,
    );
    const borders = cellStyle?.borders || {};
    const newBorders = { ...borders, [position]: cellBorder };
    dataSource.editCells([
      {
        row: rowIndex,
        column: columnIndex,
        style: { borders: newBorders },
      },
    ]);

    if (cleanAdjacentBorder) {
      const change = this.cleanUpAdjBorder(
        rowIndex,
        columnIndex,
        cellBorder,
        position,
      );
      if (change) {
        dataSource.editCells([
          {
            row: change.row,
            column: change.column,
            style: { borders: change.newBorders },
          },
        ]);
      }
    }
  };

  /**
   * Combine old borders with edit style to create new borders
   * for cells. Those new one will be stored in `currentBorders`.
   * We also add the old style to @oldValueMap for undo process.
   *
   * @param rowIndex
   * @param columnIndex
   * @param cellBorder
   * @param positions
   * @param cleanAdjacentBorder Should clean neighbour or not
   * @param oldValueMap
   * @returns
   */
  getNewCellBorders = (
    rowIndex: number,
    columnIndex: number,
    cellBorder: CellBorder,
    positions: string[],
    cleanAdjacentBorder = false,
    oldValueMap: Map<string, Partial<CellStyleDeclaration>>,
  ) => {
    if (this.isCellInvalid(rowIndex, columnIndex)) return;

    const { borders: oldBorders, isOld } =
      this.getCurrentBorders(rowIndex, columnIndex) ?? {};
    const cellKey = getUndoRedoCellKey(rowIndex, columnIndex);
    const newBorders = { ...oldBorders };

    for (const position of positions) {
      newBorders[position] = cellBorder;
    }

    this.currentBorders[cellKey] = newBorders;
    if (isOld) {
      oldValueMap.set(cellKey, { borders: oldBorders });
    }

    if (cleanAdjacentBorder) {
      for (const position of positions) {
        const change = this.cleanUpAdjBorder(
          rowIndex,
          columnIndex,
          cellBorder,
          position,
        );
        if (change) {
          const adjCellKey = getUndoRedoCellKey(change.row, change.column);
          this.currentBorders[adjCellKey] = change.newBorders;
          if (change.hasOldState) {
            oldValueMap.set(adjCellKey, { borders: change.oldBorders });
          }
        }
      }
    }
  };

  /**
   * Get the latest borders state. First get from @currentBorders then
   * fallback to data source if not exist
   *
   * @param rowIndex
   * @param columnIndex
   * @returns
   */
  getCurrentBorders = (
    rowIndex: number,
    columnIndex: number,
  ): {
    /**
     * Latest borders style
     */
    borders: CellStyleDeclaration['borders'];
    /**
     * Indicate if borders have been modified in editing borders process or not
     * */
    isOld: boolean;
  } => {
    const dataSource = this.grid.dataSource;
    const key = getUndoRedoCellKey(rowIndex, columnIndex);
    const currentBorders = this.currentBorders;
    if (key in currentBorders) {
      return { borders: currentBorders[key], isOld: false };
    } else {
      const cellStyle: Partial<CellStyleDeclaration> =
        dataSource.getCellStyle?.(rowIndex, columnIndex);
      return { borders: cellStyle?.borders, isOld: true };
    }
  };

  /**
   * Change merged cells border style after merging
   * @param range Merged cells block
   */
  editMergedCellBorder = (range: RangeDescriptor) => {
    const self = this.grid;
    const dataSource = self.dataSource;
    const { startRow, startColumn, endRow, endColumn } = range;
    const topLeftCellStyle = dataSource.getCellStyle?.(startRow, startColumn);
    let topLeftCellBorder = topLeftCellStyle?.borders;
    topLeftCellBorder = topLeftCellBorder
      ? structuredClone(topLeftCellBorder)
      : {};

    // infer right borders from merged cells
    const listRightBorder: CellBorder[] = [];
    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      const style: Partial<CellStyleDeclaration> = dataSource.getCellStyle?.(
        rowIndex,
        endColumn,
      );
      listRightBorder.push(style?.borders?.right);
    }
    const firstRightBorder = listRightBorder[0];
    if (
      firstRightBorder &&
      listRightBorder.every((border) =>
        this.isSameBorderStyle(border, firstRightBorder),
      )
    )
      topLeftCellBorder.right = firstRightBorder;

    // infer bottom borders form merged cells
    const listBottomBorder: CellBorder[] = [];
    for (
      let columnIndex = startColumn;
      columnIndex <= endColumn;
      columnIndex++
    ) {
      const style: Partial<CellStyleDeclaration> = dataSource.getCellStyle?.(
        endRow,
        columnIndex,
      );
      listBottomBorder.push(style?.borders?.bottom);
    }
    const firstBottomBorder = listBottomBorder[0];
    if (
      firstBottomBorder &&
      listBottomBorder.every((border) =>
        this.isSameBorderStyle(border, firstBottomBorder),
      )
    )
      topLeftCellBorder.bottom = firstBottomBorder;

    // Remove inner borders and add outer borders for cell block
    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      for (
        let columnIndex = startColumn;
        columnIndex <= endColumn;
        columnIndex++
      ) {
        const cellPosition = {
          top: rowIndex === startRow,
          bottom: rowIndex === endRow,
          left: columnIndex === startColumn,
          right: columnIndex === endColumn,
        };
        for (const [position, value] of Object.entries(cellPosition)) {
          if (!value)
            this.editCellBorder(rowIndex, columnIndex, undefined, position);
          else
            this.editCellBorder(
              rowIndex,
              columnIndex,
              topLeftCellBorder[position],
              position,
              !!topLeftCellBorder[position],
            );
        }
      }
    }
  };

  /**
   * Get new borders for a selection
   *
   * @param selection
   * @param cellBorder
   * @param type
   */
  getSelectionBorders = (
    selection: SelectionDescriptor,
    cellBorder: CellBorder,
    type: EditBordersOperation,
    oldValueMap: Map<string, Partial<CellStyleDeclaration>>,
    tableColumnsMap: Map<TableDescriptor, Set<GridHeader>>,
    applyEntireColumn: boolean,
  ) => {
    const self = this.grid;
    const dataSource = self.dataSource;
    const { startRow, endRow, startColumn, endColumn } =
      self.convertSelectionToRange(selection);

    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      for (
        let columnIndex = startColumn;
        columnIndex <= endColumn;
        columnIndex++
      ) {
        if (
          applyEntireColumn &&
          dataSource.getTableByIndex(rowIndex, columnIndex)
        ) {
          continue;
        }

        const cellPosition = {
          top: rowIndex === startRow,
          bottom: rowIndex === endRow,
          left: columnIndex === startColumn,
          right: columnIndex === endColumn,
        };
        const merge = self.getMergedCell(rowIndex, columnIndex),
          isMerged = merge !== undefined,
          mergedCellPosition = {
            top: isMerged && merge.startRow === rowIndex,
            bottom: isMerged && merge.endRow === rowIndex,
            left: isMerged && merge.startColumn === columnIndex,
            right: isMerged && merge.endColumn === columnIndex,
          };

        switch (type) {
          case 'all_borders': {
            if (!isMerged) {
              const borders = {
                top: cellBorder,
                bottom: cellBorder,
                left: cellBorder,
                right: cellBorder,
              };

              this.getNewCellBorders(
                rowIndex,
                columnIndex,
                cellBorder,
                ['top', 'bottom', 'left', 'right'],
                false,
                oldValueMap,
              );

              for (const [position, value] of Object.entries(cellPosition)) {
                if (value) {
                  const change = this.cleanUpAdjBorder(
                    rowIndex,
                    columnIndex,
                    borders[position],
                    position,
                  );
                  if (change) {
                    const adjCellKey = getUndoRedoCellKey(
                      change.row,
                      change.column,
                    );
                    this.currentBorders[adjCellKey] = change.newBorders;
                    if (change.hasOldState) {
                      oldValueMap.set(adjCellKey, {
                        borders: change.oldBorders,
                      });
                    }
                  }
                }
              }
            } else {
              const positions: string[] = [];
              for (const [position, value] of Object.entries(
                mergedCellPosition,
              )) {
                if (value) positions.push(position);
              }
              if (positions.length > 0) {
                this.getNewCellBorders(
                  rowIndex,
                  columnIndex,
                  cellBorder,
                  positions,
                  true,
                  oldValueMap,
                );
              }
            }
            break;
          }
          case 'inner_borders': {
            const positions: string[] = [];
            for (const [position, value] of Object.entries(cellPosition)) {
              if (
                (!isMerged && !value) ||
                (isMerged && !value && mergedCellPosition[position])
              ) {
                positions.push(position);
              }
            }
            if (positions.length > 0) {
              this.getNewCellBorders(
                rowIndex,
                columnIndex,
                cellBorder,
                positions,
                false,
                oldValueMap,
              );
            }
            break;
          }
          case 'horizontal_borders': {
            const positions: string[] = [];
            if (
              (!isMerged && !cellPosition.top) ||
              (isMerged && !cellPosition.top && mergedCellPosition.top)
            ) {
              positions.push('top');
            }
            if (
              (!isMerged && !cellPosition.bottom) ||
              (isMerged && !cellPosition.bottom && mergedCellPosition.bottom)
            ) {
              positions.push('bottom');
            }
            if (positions.length > 0) {
              this.getNewCellBorders(
                rowIndex,
                columnIndex,
                cellBorder,
                positions,
                false,
                oldValueMap,
              );
            }
            break;
          }
          case 'vertical_borders': {
            const positions: string[] = [];
            if (
              (!isMerged && !cellPosition.left) ||
              (isMerged && !cellPosition.left && mergedCellPosition.left)
            ) {
              positions.push('left');
            }
            if (
              (!isMerged && !cellPosition.right) ||
              (isMerged && !cellPosition.right && mergedCellPosition.right)
            ) {
              positions.push('right');
            }
            if (positions.length > 0) {
              this.getNewCellBorders(
                rowIndex,
                columnIndex,
                cellBorder,
                positions,
                false,
                oldValueMap,
              );
            }
            break;
          }
          case 'outer_borders': {
            const positions: string[] = [];
            for (const [position, value] of Object.entries(cellPosition)) {
              if (
                (!isMerged && value) ||
                (isMerged && value && mergedCellPosition[position])
              ) {
                positions.push(position);
              }
            }
            if (positions.length > 0) {
              this.getNewCellBorders(
                rowIndex,
                columnIndex,
                cellBorder,
                positions,
                true,
                oldValueMap,
              );
            }
            break;
          }
          case 'left_border': {
            if (
              (!isMerged && cellPosition.left) ||
              (isMerged && cellPosition.left && mergedCellPosition.left)
            ) {
              this.getNewCellBorders(
                rowIndex,
                columnIndex,
                cellBorder,
                ['left'],
                true,
                oldValueMap,
              );
            }
            break;
          }
          case 'top_border': {
            if (
              (!isMerged && cellPosition.top) ||
              (isMerged && cellPosition.top && mergedCellPosition.top)
            ) {
              this.getNewCellBorders(
                rowIndex,
                columnIndex,
                cellBorder,
                ['top'],
                true,
                oldValueMap,
              );
            }
            break;
          }
          case 'right_border': {
            if (
              (!isMerged && cellPosition.right) ||
              (isMerged && cellPosition.right && mergedCellPosition.right)
            ) {
              this.getNewCellBorders(
                rowIndex,
                columnIndex,
                cellBorder,
                ['right'],
                true,
                oldValueMap,
              );
            }
            break;
          }
          case 'bottom_border': {
            if (
              (!isMerged && cellPosition.bottom) ||
              (isMerged && cellPosition.bottom && mergedCellPosition.bottom)
            ) {
              this.getNewCellBorders(
                rowIndex,
                columnIndex,
                cellBorder,
                ['bottom'],
                true,
                oldValueMap,
              );
            }
            break;
          }
          case 'clear_borders': {
            this.getNewCellBorders(
              rowIndex,
              columnIndex,
              null,
              ['top', 'bottom', 'left', 'right'],
              false,
              oldValueMap,
            );

            for (const [position, value] of Object.entries(cellPosition)) {
              if (value) {
                const change = this.cleanUpAdjBorder(
                  rowIndex,
                  columnIndex,
                  null,
                  position,
                );
                if (change) {
                  const adjCellKey = getUndoRedoCellKey(
                    change.row,
                    change.column,
                  );
                  this.currentBorders[adjCellKey] = change.newBorders;
                  if (change.hasOldState) {
                    oldValueMap.set(adjCellKey, { borders: change.oldBorders });
                  }
                }
              }
            }
            break;
          }
          default:
            break;
        }
      }
    }
  };

  /**
   * Set @currentBorders to empty, use at start/end of editing multiple selections
   * border style
   */
  resetCurrentBorders = () => {
    this.currentBorders = {};
  };

  /**
   * Change border style for columns
   */
  editCustomColumnBorders = async (
    selections: SelectionDescriptor[],
    cellBorder: CellBorder,
    type: EditBordersOperation,
  ) => {
    type ColumnBorderPosition = keyof GridHeader['borderStyle'];

    const oldColumnsState: Record<string, any> = {};
    const self = this.grid;
    const tableColumnHeaders: Map<
      TableDescriptor,
      Array<Set<ColumnBorderPosition>>
    > = new Map();
    if (type === 'clear_borders') {
      // The cell border should be null when clearing borders
      cellBorder = null;
    }

    for (const selection of selections) {
      const range = self.convertSelectionToRange(selection);
      const tables = self.dataSource.getTablesInRange(range);

      for (const table of tables) {
        if (!tableColumnHeaders.has(table)) {
          tableColumnHeaders.set(table, []);
        }
        const columnHeaders = tableColumnHeaders.get(table);
        const posibleBorder = {
          top: table.startRow <= range.startRow,
          bottom: table.endRow >= range.endRow,
          left: table.startColumn <= range.startColumn,
          right: table.endColumn >= range.endColumn,
        };
        const startColumnIndex = Math.max(range.startColumn, table.startColumn);
        const endColumnIndex = Math.min(range.endColumn, table.endColumn);

        const addBorders = (
          columnIndex: number,
          positions: ColumnBorderPosition[],
        ) => {
          columnHeaders[columnIndex] =
            columnHeaders[columnIndex] ??
            (new Set() as Set<ColumnBorderPosition>);
          positions.forEach((position) => {
            columnHeaders[columnIndex].add(position);
          });
        };

        for (
          let columnIndex = startColumnIndex;
          columnIndex <= endColumnIndex;
          columnIndex++
        ) {
          switch (type) {
            case 'all_borders': {
              addBorders(columnIndex, [
                'top',
                'bottom',
                'left',
                'right',
                'inner',
              ]);
              break;
            }
            case 'inner_borders': {
              if (columnIndex !== startColumnIndex) {
                addBorders(columnIndex, ['left']);
              }
              if (columnIndex !== endColumnIndex) {
                addBorders(columnIndex, ['right']);
              }
              addBorders(columnIndex, ['inner']);
              break;
            }
            case 'horizontal_borders': {
              addBorders(columnIndex, ['inner']);
              break;
            }
            case 'vertical_borders': {
              if (columnIndex !== startColumnIndex) {
                addBorders(columnIndex, ['left']);
              }
              if (columnIndex !== endColumnIndex) {
                addBorders(columnIndex, ['right']);
              }
              break;
            }
            case 'outer_borders': {
              if (posibleBorder.top) {
                addBorders(columnIndex, ['top']);
              }
              if (posibleBorder.bottom) {
                addBorders(columnIndex, ['bottom']);
              }
              if (posibleBorder.left && columnIndex === startColumnIndex) {
                addBorders(columnIndex, ['left']);
              }
              if (posibleBorder.right && columnIndex === endColumnIndex) {
                addBorders(columnIndex, ['right']);
              }
              break;
            }
            case 'top_border': {
              if (posibleBorder.top) {
                addBorders(columnIndex, ['top']);
              }
              break;
            }
            case 'bottom_border': {
              if (posibleBorder.bottom) {
                addBorders(columnIndex, ['bottom']);
              }
              break;
            }
            case 'left_border': {
              if (posibleBorder.left && columnIndex === startColumnIndex) {
                addBorders(columnIndex, ['left']);
              }
              break;
            }
            case 'right_border': {
              if (posibleBorder.right && columnIndex === endColumnIndex) {
                addBorders(columnIndex, ['right']);
              }
              break;
            }
            case 'clear_borders': {
              addBorders(columnIndex, [
                'top',
                'bottom',
                'left',
                'right',
                'inner',
              ]);
              break;
            }
            default:
              break;
          }
        }
      }
    }

    for (const [table, columnHeaders] of tableColumnHeaders) {
      const columnIndexes: number[] = [];
      columnHeaders.forEach((_, index) => columnIndexes.push(index));

      for (const columnIndex of columnIndexes) {
        const borderChange = columnHeaders[columnIndex];
        const header = self.getTableHeaderByColumnViewIndex(table, columnIndex);
        const positions = Array.from(borderChange);
        const oldColumnState = {
          column: null,
          cells: null,
          dataSource: null,
        };

        await table.dataSource.editColumnBorders(
          header.columnViewIndex,
          positions,
          cellBorder,
          'add',
          oldColumnState,
        );
        oldColumnsState[header.id] = oldColumnState;

        if (
          positions.includes('left') &&
          (!columnHeaders[columnIndex - 1] ||
            !columnHeaders[columnIndex - 1].has('right'))
        ) {
          const leftColumn = this.grid.getTableHeaderByColumnViewIndex(
            table,
            columnIndex - 1,
          );
          if (leftColumn) {
            const oldColumnState = {
              column: null,
              cells: null,
              dataSource: null,
            };
            await table.dataSource.editColumnBorders(
              leftColumn.columnViewIndex,
              ['right'],
              cellBorder,
              'clear',
              oldColumnState,
            );
            oldColumnsState[leftColumn.id] = oldColumnState;
          }
        }

        if (
          positions.includes('right') &&
          (!columnHeaders[columnIndex + 1] ||
            !columnHeaders[columnIndex + 1].has('left'))
        ) {
          const rightColumn = this.grid.getTableHeaderByColumnViewIndex(
            table,
            columnIndex + 1,
          );
          if (rightColumn) {
            const oldColumnState = {
              column: null,
              cells: null,
              dataSource: null,
            };
            await table.dataSource.editColumnBorders(
              rightColumn.columnViewIndex,
              ['left'],
              cellBorder,
              'clear',
              oldColumnState,
            );
            oldColumnsState[rightColumn.id] = oldColumnState;
          }
        }
      }
    }

    return oldColumnsState;
  };

  /**
   * Edit border style for multiple selections, change one after another
   *
   * The idea is group changes in to one `EditCellDescriptor[]`, so that we only
   * need to call `editCells` one, and prevent changing one cell borders multiple
   * times. It's also helpful for future improvement, that can apply bulk changes
   * to dataSource.
   *
   * NOTE: Sometimes user selects multiple overlapped areas, we need to have up-to-date
   * state of borders from previous changed selection without commit these changes.
   * @currentBorders is also used for that purpose.
   *
   * @param style
   * @param color
   * @param type
   * @param customSelections
   */
  editCustomBorders = async (
    style: CellBorderStyle,
    color: string,
    type: EditBordersOperation,
    applyEntireColumn: boolean,
    customSelections?: SelectionDescriptor[],
  ) => {
    this.resetCurrentBorders();

    const { selections: activeSelections, dataSource } = this.grid;
    const selections = customSelections ?? activeSelections;
    const oldValueMap: Map<string, Partial<CellStyleDeclaration>> = new Map();
    const tableColumnsMap: Map<TableDescriptor, Set<GridHeader>> = new Map();
    let oldColumnsState: Record<string, any>;

    for (const selection of selections) {
      this.getSelectionBorders(
        selection,
        { style, color },
        type,
        oldValueMap,
        tableColumnsMap,
        applyEntireColumn,
      );
    }

    if (applyEntireColumn) {
      oldColumnsState = await this.editCustomColumnBorders(
        selections,
        { style, color },
        type,
      );
    }

    const edit: EditCellDescriptor[] = [];
    for (const [key, borders] of Object.entries(this.currentBorders)) {
      const [rowIndex, columnIndex] = undoRedoKeyToIndex(key);
      edit.push({
        row: rowIndex,
        column: columnIndex,
        style: { borders },
      });
    }

    await ensureAsync(dataSource.editCells(edit));

    this.resetCurrentBorders();
    return {
      valueMap: oldValueMap,
      columnsState: oldColumnsState ?? {},
    };
  };

  /**
   * expand adj selection for border
   * @param sel
   * @returns
   */
  expandSelectionToAdjBorder = (sel: SelectionDescriptor): RangeDescriptor => {
    const self = this.grid;
    const range = self.convertSelectionToRange(sel);
    return {
      startRow: Math.max(range.startRow + adjCellBorderLookup.top.deltaY, 0),
      startColumn: Math.max(
        range.startColumn + adjCellBorderLookup.left.deltaX,
        0,
      ),
      endRow: range.endRow + adjCellBorderLookup.bottom.deltaY,
      endColumn: range.endColumn + adjCellBorderLookup.right.deltaX,
    };
  };

  /**
   * Get drawable value of a color
   * A color can be color string or a key inside standardColors
   * @param color
   * @returns A drawable value of color or empty string
   */
  getDrawableColorValue = (color: string) => {
    const self = this.grid;
    return self.style.standardColors[color] || color || '';
  };

  /**
   * Check if a rotation angle is stack vertically style (part of Text-rotation style)
   * @param textRotation
   * @returns
   */
  checkCellStackVerticallyStyle = (textRotation: number) => {
    return textRotation && (textRotation > 90 || textRotation < -90);
  };

  /**
   * Get defautl link style
   */
  getLinkDefaultStyle = (): Partial<CellStyleDeclaration> => {
    return {
      textColor: this.grid.style.linkColor,
      isUnderline: true,
    };
  };

  /**
   * Combine cell style and link style together. Cell style should have higher
   * priority than default link style.
   * @param cell
   * @returns
   */
  getLinkStyleForCell = (cell?: NormalCellDescriptor) => {
    const defaultStyle = this.getLinkDefaultStyle();

    return {
      textColor: cell?.textColor ? cell.textColor : defaultStyle.textColor,
      isUnderline: cell?.isUnderline ?? defaultStyle.isUnderline,
    };
  };

  /**
   * Add link-runs style to create the final style runs for drawing cell's text
   * @param cell
   * @returns
   */
  addLinkRuns = (cell: NormalCellDescriptor) => {
    if (
      (!cell.isNormal ||
        isHyperlinkDataFormat(cell.dataFormat) ||
        (cell.table &&
          !cell.table.isSpilling &&
          !(cell.tableHeader.type === 'string') &&
          !getTableCellStringValue(cell.value)) ||
        (cell.meta?.parserData &&
          cell.meta?.parserData.dataType !== 'string')) &&
      !cell.inferLink
    ) {
      cell.drawStyleRuns = null;
      return;
    }

    // const linkRuns = cell.explicitLink
    //   ? cell.linkRuns
    //   : getImplicitHyperlinkRuns(cell.formattedValue);
    let linkRuns: MetaRun[];
    let cellValue: string = cell.value;

    if (cell.inferLink) {
      linkRuns = cell.linkRuns;
    } else if (isFormulaCell(cell)) {
      linkRuns = getFormulaCellLinkRuns(cell);
      cellValue = cell.meta.parserData.value;
      cell.explicitLink = false;
    } else {
      linkRuns = cell.explicitLink ? cell.linkRuns : null;
    }

    const linkStyle = this.getLinkStyleForCell(cell);
    const styleRuns: StyleRun[] = [];

    if (linkRuns?.length > 0 && !cell.inferLink) {
      const { displayText, displayLinkRuns } = getLinkDisplayContent(
        getTableCellStringValue(cellValue),
        linkRuns,
      );

      // make sure the display text have the right data format apply
      cell.formattedValue = formatFormulaData(
        {
          dataType: 'string',
          value: displayText,
        },
        cell.dataFormat,
        { isRoot: true },
      ) as string;

      for (const run of displayLinkRuns) {
        styleRuns.push({
          startOffset: run.startOffset,
          endOffset: run.endOffset,
          style: linkStyle,
        });
      }
    } else if (cell.inferLink) {
      for (const run of linkRuns) {
        styleRuns.push({
          startOffset: run.startOffset,
          endOffset: run.endOffset,
          style: linkStyle,
        });
      }
    }

    cell.linkRuns = linkRuns;
    cell.drawStyleRuns = mergeStyleRuns(cell.drawStyleRuns, styleRuns);

    // In case we have Quote wrap the text value (from data-format), the
    // draw style run need to be shifted.
    if (
      cell.drawStyleRuns?.length > 0 &&
      cell.dataFormat?.type === 'string' &&
      (cell.dataFormat.format === 'SingleQuote' ||
        cell.dataFormat.format === 'DoubleQuote')
    ) {
      for (const run of cell.drawStyleRuns) {
        run.startOffset += 1;
        run.endOffset += 1;
      }
    }
  };
}

/**
 * Get default style for each data type and also depend on cell's value or
 * data format (hyperlink)
 * @param dataTypeString
 * @param value
 * @param format
 * @param linkStyle
 * @returns
 */
export const getDefaultStyleForDataType = (
  dataTypeString: string,
  value?: string,
  format?: CellDataFormat,
  linkStyle?: Partial<CellStyleDeclaration>,
): Partial<CellStyleDeclaration> => {
  switch (dataTypeString) {
    case 'boolean':
      return { horizontalAlignment: 'center' };
    case 'int':
    case 'float':
    case 'decimal':
      return { horizontalAlignment: 'right' };
    case 'string': {
      let result = { horizontalAlignment: 'left' };

      // If the cell has hyperlink data format, it should have link default
      // style at the beginning
      if (isHyperlinkDataFormat(format)) {
        linkStyle = linkStyle ?? {};
        result = { ...result, ...linkStyle };
      }
      return result;
    }
    case 'bytes':
      return { horizontalAlignment: 'left' };
    case 'date':
    case 'time':
    case 'datetime':
    case 'timestamp':
    case 'interval':
      return { horizontalAlignment: 'right' };
    case 'json': {
      switch (typeof value) {
        case 'boolean': {
          return {
            horizontalAlignment: 'center',
            isItalic: true,
          };
        }
        case 'number': {
          return {
            horizontalAlignment: 'right',
            isItalic: true,
          };
        }
        default: {
          return {
            horizontalAlignment: 'left',
            isItalic: true,
          };
        }
      }
    }
    default: {
      return {};
    }
  }
};
