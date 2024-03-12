'use strict';

import { DrawUtils } from './draw/util';
import { isDraggedItemAutoScrollable } from './events/util';
import type { GridPosition } from './position';
import type { RangeDescriptor } from './types/base-structs';
import { SELECTION_CONTEXT_TYPE_TABLE } from './selections/constants';
import { isInSelection, SelectionType } from './selections/util';
import type {
  CellDescriptor,
  Cursor,
  CursorTarget,
  GridHeader,
  GridPrivateProperties,
  CellStyleDeclaration,
  CellBorderStyle,
  NormalCellDescriptor,
  PixelBoundingRect,
  CellClearMode,
  SelectionDescriptor,
  CellStyleDeclarationKey,
  MergedCellDescriptor,
  DragContext,
  CellMoveTarget,
  CellDataFormat,
  CellNumberFormat,
  TableDescriptor,
  StyleRun,
  ClearStyleRun,
  ParserCellData,
  CellDetailTypeData,
  ColumnType,
  Struct,
  List,
  SelectionDataTypeListInformation,
  StructDetailTypeData,
  EditCellDescriptor,
  CellBorder,
  DataSourceBase,
  CellMeta,
} from './types';
import { DataType } from './types';
import { MergeDirection } from './types';
import {
  columnTypeToString,
  columnTypeToShortFormString,
  columnTypeToLongFormString,
  getBaseType,
  transformNumberType,
} from './utils/column-types';
import { copyMethods, isCoordsInBounds } from './util';
import type { ScrollTarget } from './data/data-source/types/position-helper';
import type { EditBordersOperation } from './style/style';
import type { StylePreviewType } from './style/preview/base';
import { formatFormulaData, validateCellDataFormat } from './data/data-format';
import { getDefaultDataFormat } from './data/formatters';
import { ensureAsync } from './data/data-source/await';
import {
  addCellDefaultStyle,
  addColumnStyle,
} from './draw/cell-creator/cell-style';
import { getUndoRedoCellKey, undoRedoKeyToIndex } from './utils/undo-redo';
import { formatTableCellValue } from './data/data-format';
import { getTableFieldOrGroupHeader } from './data/table/util';

export default function loadGridMiscMethods(self: GridPrivateProperties) {
  copyMethods(new GridMiscMethods(self), self);
}

/**
 * Grid miscellaneous methods
 */
export class GridMiscMethods {
  constructor(private readonly grid: GridPrivateProperties) {}

  getColumnHeaderCellHeight = () => {
    const self = this.grid;
    if (!self.attributes.showColumnHeaders) {
      return 0;
    }
    return this.getRowHeight(-1);
  };

  getRowHeaderCellWidth = () => {
    const self = this.grid;
    if (!self.attributes.showRowHeaders) {
      return 0;
    }
    return self.rowNumberColumnWidth;
  };

  /**
   * This is the combination of {@link getColumnHeaderCellHeight} and
   * {@link DrawGroupArea.getColumnGroupAreaHeight}, which is then can be used
   * as the offset when doing cell related calculations.
   * @return The height of the top area.
   */
  getTopAreaHeight = () => {
    const self = this.grid;
    return self.getColumnGroupAreaHeight() + self.getColumnHeaderCellHeight();
  };

  /**
   * This is the combination of {@link getRowHeaderCellWidth} and
   * {@link DrawGroupArea.getRowGroupAreaWidth()}, which is then can be used
   * as the offset when doing cell related calculations.
   * @return The width of the top area.
   */
  getLeftAreaWidth = () => {
    const self = this.grid;
    return self.getRowGroupAreaWidth() + self.getRowHeaderCellWidth();
  };

  applyDefaultValue = (row: any, header: GridHeader, rowIndex: number) => {
    const self = this.grid;
    let d = header.defaultValue || '';
    if (typeof d === 'function') d = d.apply(self.intf, [header, rowIndex]);
    row[header.dataKey] = d;
  };
  createNewRowData = () => {
    const self = this.grid;
    self.newRow = {};

    // The third argument of applyDefaultValue is the row index
    // of the row for which to apply the default value. In this
    // case, we're creating a new row but not yet appending it
    // to self.originalData, so no row index exists
    const newRowIndex = undefined;

    self.getSchema().forEach(function forEachHeader(header) {
      self.applyDefaultValue(self.newRow, header, newRowIndex);
    });
  };
  refresh = () => {
    const self = this.grid;
    // const { viewData, boundRowIndexMap } = self.getFilteredAndSortedViewData(
    //   self.originalData,
    // );

    // self.viewData = viewData;

    self.resize();
    self.draw(true);
  };

  /**
   * Check and trigger an auto-scroll event if the cursor coordinates are in
   * auto-scroll boundaries, and there is an item that is being dragged (that
   * is auto-scrollable).
   *
   * When the conditions above are met, this sets up a frame callback using
   * {@link requestAnimationFrame} and call the given callback.
   *
   * The caller of this function must ensure that it calls this function again
   * so that another set auto-scroll event can be set up.
   * @param {number} x Axis coordinate (e.g, of a cursor).
   * @param {number} y Axis coordinate (e.g, of a cursor).
   * @param {boolean} ctrl Whether Control/Command modifier is being pressed (if so, skips setting up the event).
   * @param {FrameRequestCallback} callback Listener to invoke when the next auto-scroll event is ready.
   */
  autoScrollZone = (
    x: number,
    y: number,
    ctrl: boolean,
    callback: FrameRequestCallback,
  ) => {
    const self = this.grid;

    // Cancel the previous request if one exists.
    if (self.autoScrollContext) {
      cancelAnimationFrame(self.autoScrollContext.frameRequestHandle);
      self.autoScrollContext = undefined;
    }

    if (!isDraggedItemAutoScrollable(self)) {
      return;
    }

    let disallowVertical = false,
      disallowHorizontal = false;

    if (self.fillOverlay) {
      // Disallow auto-scroll to the direction that overlay is not
      // moving towards.
      if (self.fillOverlay.direction === 'y') {
        disallowHorizontal = true;
      } else if (self.fillOverlay.direction === 'x') {
        disallowVertical = true;
      }
    } else if (self.selecting) {
      const sel = self.getPrimarySelection();

      // Do not allow vertical scrolling if it is a column selection, or
      // horizontal scrolling if it is a row selection.
      if (sel.type === SelectionType.Rows) {
        disallowHorizontal = true;
      } else if (sel.type === SelectionType.Columns) {
        disallowVertical = true;
      } else if (
        sel.type === SelectionType.Cells &&
        sel.context?.type === SELECTION_CONTEXT_TYPE_TABLE
      ) {
        const { target } = sel.context;
        const isTable = target === 'table';
        if (isTable || target === 'row') disallowHorizontal = true;
        if (isTable || target === 'column') disallowVertical = true;
      }
    } else if (self.dragMode === 'column-reorder') {
      disallowVertical = true;
    } else if (self.dragMode === 'row-reorder') {
      disallowHorizontal = true;
    }

    const { horizontalTrack: hTrack, verticalTrack: vTrack } =
      self.scrollBox.entities;
    const { horizontalTrackVisible, verticalTrackVisible } = self.scrollBox;
    const { autoScrollMargin } = self.attributes;

    let vx = 0,
      vy = 0;

    if (horizontalTrackVisible && !disallowHorizontal) {
      if (
        x < hTrack.x + autoScrollMargin &&
        (self.frozenColumn === 0 ||
          self.draggingItem.columnIndex >= self.frozenColumn ||
          x >= hTrack.x)
      ) {
        vx = Math.max(x - (hTrack.x + autoScrollMargin), -20);
      } else if (x > hTrack.x + hTrack.width - autoScrollMargin) {
        vx = Math.min(x - (hTrack.x + hTrack.width - autoScrollMargin), 20);
      }
    }
    if (verticalTrackVisible && !disallowVertical) {
      if (
        y < vTrack.y + autoScrollMargin &&
        (self.frozenRow === 0 ||
          self.draggingItem.rowIndex >= self.frozenRow ||
          y >= vTrack.y)
      ) {
        vy = Math.max(y - (vTrack.y + autoScrollMargin), -20);
      } else if (y > vTrack.y + vTrack.height - autoScrollMargin) {
        vy = Math.min(y - (vTrack.y + vTrack.height - autoScrollMargin), 20);
      }
    }

    if ((vx !== 0 || vy !== 0) && !ctrl) {
      self.autoScrollContext = {
        frameRequestHandle: requestAnimationFrame((time) => {
          self.scrollBox.scrollBy(vx, vy);
          // We draw early here because we are already in an animation frame,
          // and we need to sync the scroll box changes first to avoid invalid
          // data.
          self.redrawNow('scroll');
          callback(time);
        }),
      };
    }
  };
  autosize = (columnId?: string) => {
    const self = this.grid;
    self.getVisibleSchema().forEach(function (col, colIndex) {
      if (col.id === columnId || columnId === undefined) {
        self.setColumnWidth(
          colIndex,
          Math.max(
            self.findColumnMaxTextLength(col.id),
            self.style.minColumnWidth,
          ),
        );
      }
    });
    self.setColumnWidth(-1, self.findColumnMaxTextLength('cornerCell'));
    // todo: make the following two lines better (check if any size is changed)
    // the following line let self.resize refresh whole canvas
    self.canvas.width = 0;
    self.resize(false);
  };
  dispose = () => {
    const self = this.grid;
    if (self.canvas && self.canvas.parentNode) {
      self.canvas.parentNode.removeChild(self.canvas);
    }
    if (self.controlInput.parentNode) {
      self.controlInput.removeChild(self.controlInput);
    }
    self.eventParent.removeEventListener('mousedown', self.mousedown, false);
    self.eventParent.removeEventListener('dblclick', self.dblclick, false);
    self.eventParent.removeEventListener('click', self.click, false);
    self.eventParent.removeEventListener(
      'mousemove',
      self.mousemoveOnEventParent,
    );
    self.eventParent.removeEventListener('mouseup', self.mouseupOnEventParent);
    self.eventParent.removeEventListener('wheel', self.scrollWheel, false);
    self.eventParent.removeEventListener(
      'contextmenu',
      self.contextmenuEvent,
      false,
    );
    self.eventParent.removeEventListener('touchmove', self.touchmove, {
      //@ts-ignore
      passive: false,
    });
    self.eventParent.removeEventListener('touchend', self.touchend, false);
    self.eventParent.removeEventListener(
      'touchcancel',
      self.touchcancel,
      false,
    );
    self.controlInput.removeEventListener('copy', self.copy);
    self.controlInput.removeEventListener('cut', self.cut);
    self.controlInput.removeEventListener('paste', self.paste);
    self.controlInput.removeEventListener('keypress', self.keypress, false);
    self.controlInput.removeEventListener('keyup', self.keyup, false);
    self.controlInput.removeEventListener('keydown', self.keydown, false);
    window.removeEventListener('mouseup', self.mouseupOnWindow, false);
    window.removeEventListener('mousemove', self.mousemoveOnWindow);
    window.removeEventListener('resize', self.resize as any);
    if (self.observer && self.observer.disconnect) {
      self.observer.disconnect();
    }
  };

  /**
   * Inserts a new column before the specified index into the schema.
   * @param {column} c The column to insert into the schema.
   * @param {number} index The index of the column to insert before.
   */
  insertColumn = (c, index) => {
    const self = this.grid;
    var s = self.getSchema();
    if (s.length < index) {
      throw new Error('Index is beyond the length of the schema.');
    }
    self.validateColumn(c, s as any);
    s.splice(index, 0, c);

    // self.originalData.forEach(function (row, rowIndex) {
    //   self.applyDefaultValue(row, c, rowIndex);
    // });
    self.setSchema(s);

    self.refresh();
  };
  /**
   * Deletes a column from the schema at the specified index.
   * @param {number} index The index of the column to delete.
   */
  deleteColumn = (index) => {
    const self = this.grid;
    var schema = self.getSchema();

    // remove data matching this column name from data
    // self.originalData.forEach(function (row) {
    //   delete row[schema[index].name];
    // });

    schema.splice(index, 1);
    self.setSchema(schema);

    self.refresh();
  };
  /**
   * Adds a new column into the schema.
   * @param {column} c The column to add to the schema.
   */
  addColumn = (c) => {
    const self = this.grid;
    var s = self.getSchema();
    self.validateColumn(c, s as any);
    s.push(c);
    // self.originalData.forEach(function (row, rowIndex) {
    //   self.applyDefaultValue(row, c, rowIndex);
    // });
    self.setSchema(s);

    self.refresh();
  };
  /**
   * Deletes a row from the dataset at the specified index.
   * @param {number} index The index of the row to delete.
   */
  deleteRow = (index) => {
    const self = this.grid;
    // self.originalData.splice(index, 1);
    self.setFilter();
    self.resize(true);
  };
  /**
   * Inserts a new row into the dataset before the specified index.
   * @param {object} d data.
   * @param {number} index The index of the row to insert before.
   */
  insertRow = (d, index) => {
    const self = this.grid;
    // if (self.originalData.length < index) {
    //   throw new Error('Index is beyond the length of the dataset.');
    // }
    // self.originalData.splice(index, 0, d);
    // self.getSchema().forEach(function (c) {
    //   if (d[c.name] === undefined) {
    //     self.applyDefaultValue(self.originalData[index], c, index);
    //   }
    // });

    // setFilter calls .refresh(), so we need not call it again:
    self.setFilter();

    self.resize(true);
  };
  /**
   * Adds a new row into the dataset.
   * @param {object} d data.
   */
  addRow = (d) => {
    const self = this.grid;
    // self.originalData.push(d);
    // self.getSchema().forEach(function (c) {
    //   if (d[c.name] === undefined) {
    //     self.applyDefaultValue(
    //       self.originalData[self.originalData.length - 1],
    //       c,
    //       self.originalData.length - 1,
    //     );
    //   }
    // });

    // setFilter calls .refresh(), so we need not call it again:
    self.setFilter();

    self.resize(true);
  };
  /**
   * Sets the height of a given row by index number.
   * @param {number} rowIndex The index of the row to set.
   * @param {number} height Height to set the row to.
   * @param {boolean} [auto] True if this is set by the grid, or false if it is the user.
   * @param {number} [endIndex] The last row index to resize or undefined to only resize the given row index.
   * @returns {boolean} True if resized successfully, or false if the row has a custom size set by the user.
   */
  setRowHeight = (
    rowIndex: number,
    height: number,
    auto?: boolean,
    endIndex?: number,
  ) => {
    const self = this.grid;
    return self.sizes.setRowHeight(rowIndex, height, auto, endIndex);
  };
  /**
   * Sets the width of a given column by index number.
   * @param {number} colIndex The index of the column to set.
   * @param {number} width Width to set the column to.
   * @param {boolean} [auto] True if this is set by the grid, or false if it is the user.
   * @param {number} [endIndex] The column index to resize or undefined to only resize the given column index.
   * @returns {boolean} True if resized successfully, or false if the column has a custom size set by the user.
   */
  setColumnWidth = (
    colIndex: number,
    width: number,
    auto?: boolean,
    endIndex?: number,
  ) => {
    const self = this.grid;
    return self.sizes.setColumnWidth(colIndex, width, auto, endIndex);
  };
  /**
   * Removes any changes to the width of the columns due to user or api interaction, setting them back to the schema or style default.
   * @method
   */
  resetColumnWidths = () => {
    const self = this.grid;
    self.sizes.clearColumnWidths();
    self.requestRedraw('all');
  };
  /**
   * Removes any changes to the height of the rows due to user or api interaction, setting them back to the schema or style default.
   */
  resetRowHeights = () => {
    const self = this.grid;
    self.sizes.clearRowHeights();
    self.requestRedraw('all');
  };
  /**
   * Scrolls to the cell at columnIndex x, and rowIndex y.  If you define both rowIndex and columnIndex additional calculations can be made to center the cell using the target cell's height and width.  Defining only one rowIndex or only columnIndex will result in simpler calculations.
   * @param {number} columnIndex The column index of the cell to scroll to.
   * @param {number} rowIndex The row index of the cell to scroll to.
   * @param {number} [offsetX=0] Percentage offset the cell should be from the left edge (not including headers).  The default is 0, meaning the cell will appear at the left edge. Valid values are 0 through 1. 0 = Left, 1 = Right, 0.5 = Center.
   * @param {number} [offsetY=0] Percentage offset the cell should be from the top edge (not including headers).  The default is 0, meaning the cell will appear at the top edge. Valid values are 0 through 1. 0 = Bottom, 1 = Top, 0.5 = Center.
   * @param {boolean} [skipDraw=false] Skip drawing.
   * @return True if given x or y indexes were values and scrolled.
   */
  gotoCell = (
    columnIndex: number,
    rowIndex: number,
    offsetX?: number,
    offsetY?: number,
    skipDraw?: boolean,
  ): boolean => {
    if (columnIndex === undefined && rowIndex == undefined) return false;
    const self = this.grid;
    const { horizontalTrack, verticalTrack } = self.scrollBox.entities;

    self.scrollBox.markState();

    if (columnIndex !== undefined) {
      self.scrollBox.setHorizontalScroll(columnIndex, 0, true);
      offsetX = Math.max(Math.min(offsetX ?? 0, 1), 0);

      if (offsetX > 0) {
        const width = self.getColumnWidth(columnIndex);
        const maxWidth = Math.max(horizontalTrack.width - width, width);

        self.scrollBox.scrollBy(maxWidth * offsetY, 0, true);
      }
    }
    if (rowIndex !== undefined) {
      rowIndex = self.dataSource.positionHelper.getVisibleRowIndex(
        self.scrollBox.scrollIndexTop,
        rowIndex - self.scrollBox.scrollIndexTop,
      );
      self.scrollBox.setVerticalScroll(rowIndex, 0, true);
      offsetY = Math.max(Math.min(offsetY ?? 0, 1), 0);

      if (offsetY > 0) {
        const height = self.getRowHeight(rowIndex);
        const maxHeight = Math.max(verticalTrack.height - height, height);

        self.scrollBox.scrollBy(0, maxHeight * offsetY, true);
      }
    }

    if (self.scrollBox.updateState()) {
      if (!skipDraw) self.redrawCommit();
      return true;
    }

    return false;
  };
  /**
   * Scrolls the row y.
   * @param  y The row index of the cell to scroll to.
   * @param  skipDraw Skip drawing.
   * @returns True if the row wasn't visible and is now visible.
   */
  gotoRow = (y: number, skipDraw?: boolean): boolean => {
    return this.gotoCell(0, y, 0, 0, skipDraw);
  };

  /**
   * Scrolls the cell at cell x, row y into view if it is not already.
   * @param {number} columnIndex The column index of the cell to scroll into view.
   * @param {number} rowIndex The row index of the cell to scroll into view.
   * @param {boolean} [skipDraw=false] Skip drawing.
   * @returns True if the given cell wasn't visible and is now visible.
   */
  scrollIntoView = (
    columnIndex: number,
    rowIndex: number,
    skipDraw?: boolean,
  ): boolean => {
    if (columnIndex === undefined && rowIndex === undefined) return false;

    const self = this.grid;
    const viewport = self.viewport;
    const { horizontalTrack, verticalTrack } = self.scrollBox.entities;

    self.scrollBox.markState();

    if (rowIndex !== undefined && rowIndex >= self.frozenRow) {
      let set = false;
      let offset = 0;

      if (rowIndex < self.scrollIndexTop) {
        set = true;
      } else {
        const cell = viewport.getRowHeader(rowIndex);

        if (!cell) {
          const height = self.getRowHeight(rowIndex);
          offset = -(self.px(verticalTrack.height) - height);
          set = true;
        } else if (cell.y < verticalTrack.y) {
          set = true;
        } else if (
          cell.y + cell.height >
          verticalTrack.y + verticalTrack.height
        ) {
          offset = -self.px(verticalTrack.height - cell.height);
          set = true;
        }
      }

      if (set) {
        if (!offset) {
          self.scrollBox.setVerticalScroll(rowIndex, 0, true);
        } else {
          self.scrollBox.setVerticalScrollExact(rowIndex, 0);
        }
        if (offset !== 0) self.scrollBox.scrollBy(0, offset, true);
      }
    }

    if (columnIndex !== undefined && columnIndex >= self.frozenColumn) {
      let set = false;
      let offset = 0;

      if (columnIndex < self.scrollIndexLeft) {
        set = true;
      } else {
        const cell = viewport.getColumnHeader(columnIndex);

        if (!cell) {
          const width = self.getColumnWidth(columnIndex);
          offset = -(self.px(horizontalTrack.width) - width);
          set = true;
        } else if (cell.x < horizontalTrack.x) {
          set = true;
        } else if (
          cell.x + cell.width >
          horizontalTrack.x + horizontalTrack.width
        ) {
          offset = -self.px(horizontalTrack.width - cell.width);
          set = true;
        }
      }

      if (set) {
        if (!offset) {
          self.scrollBox.setHorizontalScroll(columnIndex, 0, true);
        } else {
          self.scrollBox.setHorizontalScrollExact(columnIndex, 0);
        }
        if (offset !== 0) self.scrollBox.scrollBy(offset, 0, true);
      }
    }

    if (self.scrollBox.updateState()) {
      if (!skipDraw) self.redrawCommit();
      return true;
    }

    return false;
  };

  /**
   * Sets the active cell. Requires redrawing.
   * @method
   * @param {number} columnIndex The column index of the cell to set active.
   * @param {number} rowIndex The row index of the cell to set active.
   */
  setActiveCell = (columnIndex: number, rowIndex?: number) => {
    if (typeof columnIndex === 'undefined') return;
    columnIndex = Math.max(columnIndex, 0);
    rowIndex = Math.max(rowIndex, 0);
    this.grid.activeCell = {
      rowIndex: rowIndex,
      columnIndex: columnIndex,
    };
    this.grid.dispatchEvent('activecellchanged', { rowIndex, columnIndex });
  };

  /**
   * Get custom styles that need to be removed in cells' style-runs
   * @param shouldClearStyleRun
   * @param customStyle
   * @returns
   */
  getClearStyleRun = (
    shouldClearStyleRun: boolean,
    customStyle: Partial<CellStyleDeclaration>,
  ): ClearStyleRun => {
    const clearStyleRun: ClearStyleRun = {
      clearBold: false,
      clearItalic: false,
      clearStrikethrough: false,
      clearUnderline: false,
      clearFontSize: false,
      clearFontFamily: false,
      clearTextColor: false,
    };

    if (shouldClearStyleRun) {
      const customStyleKeys = Object.keys(customStyle);
      if (customStyleKeys.includes('isBold')) {
        clearStyleRun.clearBold = true;
      }
      if (customStyleKeys.includes('isItalic')) {
        clearStyleRun.clearItalic = true;
      }
      if (customStyleKeys.includes('isStrikethrough')) {
        clearStyleRun.clearStrikethrough = true;
      }
      if (customStyleKeys.includes('isUnderline')) {
        clearStyleRun.clearUnderline = true;
      }
      if (customStyleKeys.includes('fontSize')) {
        clearStyleRun.clearFontSize = true;
      }
      if (customStyleKeys.includes('fontFamily')) {
        clearStyleRun.clearFontFamily = true;
      }
      if (customStyleKeys.includes('textColor')) {
        clearStyleRun.clearTextColor = true;
      }
    }

    return clearStyleRun;
  };

  getNewCustomStyle = (
    customStyle: Partial<CellStyleDeclaration>,
    isClearStyleRun: boolean,
    clearStyleRun: ClearStyleRun,
    row: number,
    column: number,
  ): Partial<CellStyleDeclaration> => {
    const grid = this.grid;
    const newCustomStyle = { ...customStyle };

    if (isClearStyleRun) {
      const cellCustomStyle = grid.dataSource.getCellStyle(row, column);
      if (
        cellCustomStyle &&
        cellCustomStyle.styleRuns &&
        cellCustomStyle.styleRuns.length > 0
      ) {
        const newStyleRuns: StyleRun[] = [];
        for (const styleRun of cellCustomStyle.styleRuns) {
          if (!styleRun.style) {
            continue;
          }
          const style = { ...styleRun.style };
          if (clearStyleRun.clearBold) {
            delete style.isBold;
          }
          if (clearStyleRun.clearItalic) {
            delete style.isItalic;
          }
          if (clearStyleRun.clearStrikethrough) {
            delete style.isStrikethrough;
          }
          if (clearStyleRun.clearUnderline) {
            delete style.isUnderline;
          }
          if (clearStyleRun.clearFontSize) {
            delete style.fontSize;
          }
          if (clearStyleRun.clearFontFamily) {
            delete style.fontFamily;
          }
          if (clearStyleRun.clearTextColor) {
            delete style.textColor;
          }
          if (Object.keys(style).length !== 0) {
            newStyleRuns.push({
              startOffset: styleRun.startOffset,
              endOffset: styleRun.endOffset,
              style: style,
            });
          }
        }
        cellCustomStyle.styleRuns = newStyleRuns;
      }
    }

    return newCustomStyle;
  };

  /**
   * Edit cells style in the current selections area
   *
   * @param customStyle The style needs to be added.
   * @param shouldClearStyleRun
   * @param applyEntireColumn
   * @param customSelections
   * @param repaint
   * @returns
   */
  editCellsStyle = async (
    customStyle: Partial<CellStyleDeclaration>,
    shouldClearStyleRun = false,
    applyEntireColumn = false,
    customSelections?: SelectionDescriptor[],
    repaint = true,
  ) => {
    const grid = this.grid;
    const dataSource = grid.dataSource;
    const selections = customSelections ?? grid.selections;
    const clearStyleRun = this.getClearStyleRun(
      shouldClearStyleRun,
      customStyle,
    );
    const gridHeaderMap: Map<GridHeader, TableDescriptor> = new Map();
    const edit: EditCellDescriptor[] = [];

    selections.forEach((sel) => {
      for (let row = sel.startRow; row <= sel.endRow; row++) {
        for (let column = sel.startColumn; column <= sel.endColumn; column++) {
          const table = dataSource.getTableByIndex(row, column);
          if (table) {
            if (applyEntireColumn) {
              const header = this.getTableHeaderByColumnViewIndex(
                table,
                column,
              );
              gridHeaderMap.set(header, table);
            } else {
              const newCustomStyle = this.getNewCustomStyle(
                customStyle,
                shouldClearStyleRun,
                clearStyleRun,
                row,
                column,
              );
              edit.push({ row, column, style: newCustomStyle });
            }
          } else {
            const newCustomStyle = this.getNewCustomStyle(
              customStyle,
              shouldClearStyleRun,
              clearStyleRun,
              row,
              column,
            );
            edit.push({ row, column, style: newCustomStyle });
          }
        }
      }
    });

    const valueMap: Map<string, any> = new Map();
    const oldState: Record<string, any> = {};

    for (const [header, table] of gridHeaderMap) {
      const { columnViewIndex } = header;
      const oldColumnState = {
        column: null,
        cells: null,
        dataSource: null,
      };

      await ensureAsync(
        table.dataSource.editColumnStyle?.(
          columnViewIndex,
          customStyle,
          false,
          oldColumnState,
        ),
      );

      oldState[header.id] = oldColumnState;
    }

    if (edit.length > 0) {
      const keys = Object.keys(customStyle) as CellStyleDeclarationKey[];
      if (shouldClearStyleRun) {
        keys.push('styleRuns');
      }

      edit.forEach((value) => {
        const { row, column } = value;
        const oldStyle = this.getUndoCellStyleByIndex(row, column, keys);
        valueMap.set(getUndoRedoCellKey(row, column), oldStyle);
      });

      await ensureAsync(dataSource.editCells(edit));
    }

    // End edit if editor is running to commit value to datasource
    if (grid.input) grid.endEdit();

    if (repaint) {
      grid.requestRedraw('all');
    }

    return {
      valueMap,
      columnsState: oldState,
    };
  };

  clearCells = (mode: CellClearMode) => {
    const grid = this.grid;
    const { dataSource, selections } = grid;
    selections.forEach((sel) => {
      const range: RangeDescriptor = {
        startRow: sel.startRow,
        endRow: sel.endRow,
        startColumn: sel.startColumn,
        endColumn: sel.endColumn,
      };
      if (dataSource.clearCells) dataSource.clearCells(range, mode);
    });
    // End edit if editor is running to commit value to datasource
    if (grid.input) grid.endEdit();
    grid.redrawNow('all');
  };

  /**
   * Add borders to the current selected cells
   * @param style
   * @param color
   * @param type Specify what kind of borders will be added
   * @param applyEntireColumn Should apply to entire column or not
   * @param customSelections The area that new border style is applied to
   */
  editCellsBorders = async (
    style: CellBorderStyle,
    color: string,
    type: EditBordersOperation,
    applyEntireColumn = false,
    customSelections?: SelectionDescriptor[],
  ) => {
    const grid = this.grid;
    const undoState = await grid.editCustomBorders(
      style,
      color,
      type,
      applyEntireColumn,
      customSelections,
    );

    // End edit if editor is running to commit value to datasource
    if (grid.input) {
      grid.endEdit();
    }
    grid.redrawNow('all');

    return undoState;
  };

  /**
   * Edit cells data format
   *
   * we have data format for only portion of it (multiple types data format)
   * or data-format for cells not in selection (entire column data-format).
   * So it is quite wasteful/incorrect to do undo/redo on selection. We should
   * retrieve undo/redo state here.
   *
   * @param dataFormat New data format
   * @param applyEntireColumn Should data format apply for entire column table
   * or not
   * @param clearLinkRuns Whether the link-runs should be removed or not
   * @param customSelections The selections to apply new data format, current
   * grid selections will be used by default.
   * @param repaint
   */
  editCellsDataFormat = async (
    dataFormat: CellDataFormat,
    applyEntireColumn = false,
    clearLinkRuns = false,
    customSelections?: SelectionDescriptor[],
    repaint = true,
  ) => {
    const grid = this.grid;
    const dataSource = grid.dataSource;
    const selections = customSelections ?? grid.selections;

    const gridHeaderMap: Map<GridHeader, TableDescriptor> = new Map();
    const edit: EditCellDescriptor[] = [];

    selections.forEach((sel) => {
      for (let row = sel.startRow; row <= sel.endRow; row++) {
        for (let column = sel.startColumn; column <= sel.endColumn; column++) {
          const table = dataSource.getTableByIndex(row, column);

          if (table) {
            const dataType = this.getTableDataTypeByIndex(table, row, column);
            if (applyEntireColumn) {
              if (validateCellDataFormat(dataType, dataFormat)) {
                const header = this.getTableHeaderByColumnViewIndex(
                  table,
                  column,
                );
                gridHeaderMap.set(header, table);
              }
            } else {
              if (validateCellDataFormat(dataType, dataFormat)) {
                edit.push(
                  clearLinkRuns
                    ? {
                        row,
                        column,
                        style: { dataFormat },
                        meta: { linkData: null },
                      }
                    : { row, column, style: { dataFormat } },
                );
              }
            }
          } else {
            const dataType = this.getDataTypeByIndex(row, column);
            if (validateCellDataFormat(dataType, dataFormat)) {
              edit.push(
                clearLinkRuns
                  ? {
                      row,
                      column,
                      style: { dataFormat },
                      meta: { linkData: null },
                    }
                  : { row, column, style: { dataFormat } },
              );
            }
          }
        }
      }
    });

    const valueMap: Map<string, any> = new Map();
    const oldState: Record<string, any> = {};

    for (const [header, table] of gridHeaderMap) {
      const { columnViewIndex } = header;
      const oldColumnState = {
        column: null,
        cells: null,
        dataSource: null,
      };

      await ensureAsync(
        table.dataSource.editColumnStyle?.(
          columnViewIndex,
          { dataFormat },
          clearLinkRuns,
          oldColumnState,
        ),
      );

      oldState[header.id] = oldColumnState;
    }

    if (edit.length > 0) {
      edit.forEach((value) => {
        const { row, column } = value;
        const oldStyle: Partial<CellStyleDeclaration> =
          dataSource.getCellStyle?.(row, column);
        let oldLinkData: CellMeta['linkData'];

        if (
          clearLinkRuns &&
          (oldLinkData = dataSource.getCellMeta?.(row, column)?.linkData)
        ) {
          valueMap.set(getUndoRedoCellKey(row, column), {
            dataFormat: oldStyle?.dataFormat ?? null,
            linkData: oldLinkData,
          });
        } else {
          valueMap.set(getUndoRedoCellKey(row, column), {
            dataFormat: oldStyle?.dataFormat ?? null,
          });
        }
      });

      await ensureAsync(dataSource.editCells(edit));
    }

    if (grid.input) grid.endEdit();

    if (repaint) {
      grid.requestRedraw('all');
    }

    return {
      valueMap,
      columnsState: oldState,
    };
  };

  /**
   * Increase number of decimal places for number type data format
   *
   * Find the first cell with number/number[] type and take data format
   * and number of decimal places from it. If there is no specific decimal
   * places from type, we will extract it from the display value.
   * @param delta Number of decimal places to increase
   * @returns New @CellNumberFormat
   */
  increaseNumberOfDecimalPlaces = (delta: number) => {
    const MIN_DECIMAL_PLACES = 0;
    const MAX_DECIMAL_PLACES = 30;
    const grid = this.grid;
    const { selections, dataSource } = grid;

    // find the first cell have number type in selection
    const findFirstNumberCell = () => {
      for (const sel of selections) {
        for (let row = sel.startRow; row <= sel.endRow; row++) {
          for (
            let column = sel.startColumn;
            column <= sel.endColumn;
            column++
          ) {
            const type = this.getDataTypeByIndex(row, column);
            const baseType = getBaseType(transformNumberType(type));
            if (baseType === 'number') {
              return { rowIndex: row, columnIndex: column };
            }
          }
        }
      }
      return { rowIndex: null, columnIndex: null };
    };

    const { rowIndex, columnIndex } = findFirstNumberCell();
    if (rowIndex == null || columnIndex == null) {
      // couldn't find cell with number style
      return;
    }

    let newDataFormat: CellNumberFormat = null;
    let newDecimalPlaces: number;
    const cellStyle = dataSource.getCellStyle?.(
      rowIndex,
      columnIndex,
    ) as Partial<CellStyleDeclaration>;
    let dataFormat = cellStyle?.dataFormat;
    const table = dataSource.getTableByIndex(rowIndex, columnIndex);
    let columnHeader: GridHeader;

    if (table) {
      columnHeader = this.getTableHeaderByColumnViewIndex(table, columnIndex);
      // table column can have data-format, so merge them together
      dataFormat = addColumnStyle(cellStyle, columnHeader)?.dataFormat;
    }

    if (
      dataFormat?.type === 'number' &&
      typeof dataFormat.decimalPlaces === 'number'
    ) {
      newDecimalPlaces = dataFormat.decimalPlaces + delta;
    } else {
      let formattedValue: string;

      if (table) {
        const value = dataSource.getCellValue?.(rowIndex, columnIndex);
        formattedValue = formatTableCellValue(
          value,
          columnHeader.type,
          dataFormat,
          {
            isRoot: true,
            locale: grid.attributes.locale,
            formatString: true,
            isArrayChild: false,
          },
        ) as string;
      } else {
        const parserData = dataSource.getCellMeta?.(
          rowIndex,
          columnIndex,
        )?.parserData;

        formattedValue = formatFormulaData(parserData, dataFormat, {
          isRoot: true,
          locale: grid.attributes.locale,
          formatString: true,
        }) as string;
      }

      const decimalNumberRegex =
        /(?:[^\d,]|^)(\d+(?:(?:,\d+)*,\d{3})?(\.\d+)?)/;
      const matches = formattedValue.match(decimalNumberRegex);
      if (matches && matches[1]) {
        const numberPart = matches[1];
        if (numberPart.indexOf('.') !== -1) {
          newDecimalPlaces = numberPart.split('.')[1].length + delta;
        } else {
          newDecimalPlaces = delta;
        }
      } else {
        newDecimalPlaces = delta;
      }
    }

    newDecimalPlaces = Math.min(
      Math.max(newDecimalPlaces, MIN_DECIMAL_PLACES),
      MAX_DECIMAL_PLACES,
    );

    if (dataFormat?.type === 'number') {
      newDataFormat = {
        ...dataFormat,
        decimalPlaces: newDecimalPlaces,
      };
    } else {
      newDataFormat = {
        type: 'number',
        format: 'default',
        decimalPlaces: newDecimalPlaces,
      };
    }

    return newDataFormat;
  };

  /**
   * Get table header by using column view index
   *
   * @param table
   * @param columnViewIndex
   * @returns
   */
  getTableHeaderByColumnViewIndex = (
    table: TableDescriptor,
    columnViewIndex: number,
  ) => {
    return getTableFieldOrGroupHeader(table, columnViewIndex);
  };

  getTableDataTypeByIndex = (
    table: TableDescriptor,
    rowIndex: number,
    columnIndex: number,
  ) => {
    const tableColumn = this.getTableHeaderByColumnViewIndex(
      table,
      columnIndex,
    );

    if (tableColumn) {
      // Header cell of table should be string
      if (rowIndex === table.startRow) return 'string';

      const dataType = columnTypeToShortFormString(tableColumn.type);
      if (dataType === 'variant') {
        const cellValue = this.grid.dataSource.getCellValue(
          rowIndex,
          columnIndex,
        );
        return cellValue?.dataType ?? dataType;
      }

      return dataType;
    }
  };

  getFreeFormDataTypeByIndex = (rowIndex: number, columnIndex: number) => {
    const { dataSource } = this.grid;
    const cellMeta = dataSource?.getCellMeta?.(rowIndex, columnIndex);

    if (cellMeta?.parserData) {
      return cellMeta.parserData.dataType;
    } else {
      const cellValue = dataSource?.getCellValue?.(rowIndex, columnIndex);
      return cellValue === undefined || cellValue === null
        ? 'variant'
        : 'string';
    }
  };

  /**
   * Get data type of a cell at (rowIndex, columnIndex)
   * @param rowIndex
   * @param columnIndex
   * @returns
   */
  getDataTypeByIndex = (rowIndex: number, columnIndex: number): string => {
    const table = this.grid.dataSource.getTableByIndex(rowIndex, columnIndex);
    if (table) {
      return this.getTableDataTypeByIndex(table, rowIndex, columnIndex);
    } else {
      return this.getFreeFormDataTypeByIndex(rowIndex, columnIndex);
    }
  };

  /**
   * Get data type list in current selection
   */
  getSelectionDataTypeList = (): SelectionDataTypeListInformation => {
    let firstStruct: SelectionDataTypeListInformation['firstStruct'];
    let firstString: SelectionDataTypeListInformation['firstString'];
    const types = new Set<string>();
    const firstCells: SelectionDataTypeListInformation['firstCells'] = {};
    const { dataSource } = this.grid;

    this.grid.selections.forEach((sel) => {
      for (let row = sel.startRow; row <= sel.endRow; row++) {
        for (let column = sel.startColumn; column <= sel.endColumn; column++) {
          const type = this.getDataTypeByIndex(row, column);
          // if (type === 'variant') type = 'string';
          types.add(type);

          // int|float|decimal use the same data format
          const baseType = getBaseType(transformNumberType(type));
          if (!firstCells[baseType]) {
            firstCells[baseType] = { rowIndex: row, columnIndex: column };
          }

          // Get the first selected struct cell
          if (!firstStruct && (type === 'struct' || type === 'struct[]')) {
            firstStruct = {
              rowIndex: row,
              columnIndex: column,
              typeData: this.getCellStructTypeDataByIndex(row, column),
            };
          }

          // Get the first selected string cell
          if (!firstString && type === 'string') {
            const table = this.grid.dataSource.getTableByIndex(row, column);
            let value = '';
            if (!table) {
              const cellMeta = dataSource?.getCellMeta?.(row, column);
              if (cellMeta?.parserData) {
                value = cellMeta.parserData.value;
              } else {
                value = dataSource.getCellValue(row, column);
              }
            } else {
              const tableCellValue = dataSource.getCellValue(row, column);
              if (tableCellValue && typeof tableCellValue === 'object') {
                // Variant string cell
                value = tableCellValue.value;
              } else {
                value = tableCellValue;
              }
            }

            firstString = {
              rowIndex: row,
              columnIndex: column,
              value,
            };
          }
        }
      }
    });
    return {
      types: Array.from(types),
      firstCells,
      firstStruct,
      firstString,
    };
  };

  /**
   * Get cell data format by index, if indexes are not provided,
   * use indexes of active cell by default
   */
  getCellDataFormatByIndex = (
    rowIndex = -1,
    columnIndex = -1,
  ): CellDataFormat => {
    const { activeCell, dataSource } = this.grid;
    if (rowIndex < 0 || columnIndex < 0) {
      rowIndex = activeCell.rowIndex;
      columnIndex = activeCell.columnIndex;
    }

    const table = dataSource.getTableByIndex(rowIndex, columnIndex);
    let dataType: string;
    let dataFormat: CellDataFormat;

    if (table) {
      dataType = this.getTableDataTypeByIndex(table, rowIndex, columnIndex);
      if (rowIndex !== table.startRow) {
        const header = this.getTableHeaderByColumnViewIndex(table, columnIndex);

        let activeCellStyle = dataSource?.getCellStyle?.(
          rowIndex,
          columnIndex,
        ) as Partial<CellStyleDeclaration>;
        if (header?.columnStyle) {
          activeCellStyle = addColumnStyle(activeCellStyle, header);
        }
        dataFormat = activeCellStyle?.dataFormat;
      }
    } else {
      dataType = this.getFreeFormDataTypeByIndex(rowIndex, columnIndex);
      const activeCellStyle = dataSource?.getCellStyle?.(
        rowIndex,
        columnIndex,
      ) as Partial<CellStyleDeclaration>;
      dataFormat = activeCellStyle?.dataFormat;
    }

    const defaultFormat = getDefaultDataFormat(dataType);
    if (
      !dataFormat ||
      !defaultFormat ||
      dataFormat.type !== defaultFormat.type
    ) {
      return defaultFormat;
    } else {
      return dataFormat;
    }
  };

  /**
   * Return the current type of selected cell
   */
  getSelectedCellDataType = (): string => {
    const activeCell = this.grid.activeCell;
    if (!activeCell) return '';
    return this.getDataTypeByIndex(activeCell.rowIndex, activeCell.columnIndex);
  };

  /**
   * Get free form cell type data, with struct type always have its' children
   * type in detail
   *
   * @param parserData
   * @returns
   */
  getFreeFormCellTypeData = (
    parserData: ParserCellData,
  ): CellDetailTypeData => {
    if (parserData.dataType !== 'struct') {
      return parserData.dataType;
    } else {
      const value = parserData.value;
      const typeList = [];
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          typeList.push({
            key,
            dataType: this.getFreeFormCellTypeData(value[key]),
          });
        }
      }
      return { type: 'struct', children: typeList };
    }
  };

  /**
   * Get table cell type data, with struct type always have its' children
   * type in detail
   *
   * @param columnType
   * @returns
   */
  getTableCellTypeData = (columnType: ColumnType): CellDetailTypeData => {
    if (typeof columnType === 'string') {
      return columnType;
    } else {
      if (columnType.typeId === DataType.Struct) {
        const colType = columnType as Struct;
        const typeList = [];
        for (const child of colType.children) {
          typeList.push({
            key: child.name,
            dataType: this.getTableCellTypeData(child.type),
          });
        }
        return { type: 'struct', children: typeList };
      } else {
        return columnTypeToLongFormString(columnType);
      }
    }
  };

  /**
   * Return full type object of active cell
   * @returns
   */
  getActiveCellTypeData = (): CellDetailTypeData => {
    const grid = this.grid;
    const { rowIndex, columnIndex } = grid.activeCell;
    const table = grid.dataSource.getTableByIndex(rowIndex, columnIndex);

    if (table) {
      // Header cell of table should be string
      if (rowIndex === table.startRow) return 'string';

      const tableColumn = this.getTableHeaderByColumnViewIndex(
        table,
        columnIndex,
      );

      const dataType = columnTypeToLongFormString(tableColumn.type);
      if (dataType === 'variant') {
        const cellValue = grid.dataSource.getCellValue(rowIndex, columnIndex);
        return this.getFreeFormCellTypeData(cellValue);
      } else {
        return this.getTableCellTypeData(tableColumn.type);
      }
    }

    const cellValue = grid.dataSource.getCellValue(rowIndex, columnIndex);
    const cellMeta = grid.dataSource.getCellMeta(rowIndex, columnIndex);
    if (!cellMeta?.parserData) {
      return cellValue === undefined ? 'variant' : 'string';
    } else {
      return this.getFreeFormCellTypeData(cellMeta?.parserData);
    }
  };

  /**
   * Get cell struct/struct[] type data in detail. If rowIndex or
   * columnIndex aren't defined, active cell will be used.
   */
  getCellStructTypeDataByIndex = (
    rowIndex = -1,
    columnIndex = -1,
  ): StructDetailTypeData => {
    const { activeCell, dataSource } = this.grid;
    if (rowIndex < 0 || columnIndex < 0) {
      rowIndex = activeCell.rowIndex;
      columnIndex = activeCell.columnIndex;
    }
    const table = dataSource.getTableByIndex(rowIndex, columnIndex);

    if (table) {
      if (rowIndex === table.startRow) return null;
      const tableColumn = this.getTableHeaderByColumnViewIndex(
        table,
        columnIndex,
      );

      const dataType = columnTypeToLongFormString(tableColumn.type);
      if (dataType === 'struct[]') {
        return this.getTableCellTypeData(
          (tableColumn.type as List).child.type,
        ) as StructDetailTypeData;
      } else if (dataType === 'struct') {
        return this.getTableCellTypeData(
          tableColumn.type,
        ) as StructDetailTypeData;
      } else {
        if (dataType === 'variant') {
          const cellValue = dataSource.getCellValue(rowIndex, columnIndex);
          if (cellValue?.dataType === 'struct[]') {
            return this.getFreeFormCellTypeData(
              cellValue.value[0],
            ) as StructDetailTypeData;
          } else if (cellValue?.dataType === 'struct') {
            return this.getFreeFormCellTypeData(
              cellValue,
            ) as StructDetailTypeData;
          }
        }
        return null;
      }
    }

    const cellMeta = dataSource.getCellMeta(rowIndex, columnIndex);
    const dataType = cellMeta?.parserData?.dataType;
    if (dataType === 'struct[]') {
      return this.getFreeFormCellTypeData(
        cellMeta.parserData.value[0],
      ) as StructDetailTypeData;
    } else if (dataType === 'struct') {
      return this.getFreeFormCellTypeData(
        cellMeta.parserData,
      ) as StructDetailTypeData;
    } else {
      return null;
    }
  };

  setGridLocale = (locale: string) => {
    this.grid.attributes.locale = locale;
    this.grid.requestRedraw('all');
  };

  /**
   * Check if there is table inside selection area
   */
  checkTableOnSelection = () => {
    const selections = this.getSelections();
    const self = this.grid;

    for (const selection of selections) {
      const range = self.convertSelectionToRange(selection);
      const tables = self.dataSource.getTablesInRange(range);
      if (tables && tables.length > 0) {
        return true;
      }
    }
    return false;
  };

  /**
   * Add new style preview
   * @param type
   * @param data
   */
  addStylePreview = (type: StylePreviewType, data: any) => {
    const self = this.grid;
    self.stylePreviewManager.addStylePreview(type, data);
    self.requestRedraw('all');
  };

  /**
   * Remove current style preview if exist
   */
  removeStylePreview = () => {
    const self = this.grid;
    self.stylePreviewManager.removeStylePreview();
    self.requestRedraw('all');
  };

  /**
   * Get current standard colors
   * @returns StandardColors or an empty object
   */
  getStandardColors = () => {
    return this.grid.getStyleProperty('standardColors') || {};
  };

  /**
   * Get current zooming value
   * @returns Zooming value
   */
  getZoomingValue = () => {
    return this.grid.userScale;
  };

  /**
   * Set new zooming value for grid and trigger resize
   * @param value New zooming value
   */
  setZoomingValue = (value: number) => {
    const grid = this.grid;
    if (value === grid.getZoomingValue()) return;
    grid.userScale = value;
    grid.resize(true);
  };

  /**
   * Resizes a column to fit the longest value in the column. Call without a value to resize all columns.
   * Warning, can be slow on very large record sets (1m records ~3-5 seconds on an i7).
   * @param name The name of the column to resize.
   * @param auto True if this is set by the user, or false it is the grid doing it automatically.
   */
  fitColumnToValues = (columnId: string, auto?: boolean) => {
    const self = this.grid;
    if (!self.canvas) {
      return;
    }

    const columnIndex = self.getHeaderById(columnId).columnViewIndex;

    const newSize = Math.max(
      self.findColumnMaxTextLength(columnId),
      self.style.minColumnWidth,
    );

    self.setColumnWidth(columnIndex, newSize, auto);

    self.dispatchEvent('resizecolumn', {
      x: newSize,
      y: self.resizingStartingHeight,
      draggingItem: self.currentCell,
    });
  };
  /**
   * Checks if a cell is currently visible.
   * @returns {boolean} when true, the cell is visible, when false the cell is not currently drawn.
   * @param {number} columnIndex The column index of the cell to check.
   * @param {number} rowIndex The row index of the cell to check.
   */
  isCellVisible = (
    cell: { x: number; y: number },
    rowIndex?: number,
  ): boolean => {
    const self = this.grid;
    // overload
    if (rowIndex !== undefined) {
      return (
        self.visibleCells.filter(function (c) {
          // wip: fix this:
          //@ts-ignore
          return c.columnIndex === cell && c.rowIndex === rowIndex;
        }).length > 0
      );
    }
    var x,
      l = self.visibleCells.length;
    for (x = 0; x < l; x += 1) {
      if (
        cell.x === self.visibleCells[x].x &&
        cell.y === self.visibleCells[x].y
      ) {
        return true;
      }
    }
    return false;
  };

  /**
   * Moves the data in the given range to the its offset location.
   * @param range To move.
   * @param rowOffset The row offset relative to the current range position.
   * @param columnOffset The column offset relative to the current selection
   *  position.
   * @param replace Replaces any data contained in the target range when true.
   * @param suppressEvent Do not fire the `aftermove` event.
   * @returns True if the data has successfully been moved, or false the target
   *  contains data and replacing is now allowed.
   */
  moveTo = async (
    range: RangeDescriptor,
    rowOffset: number,
    columnOffset: number,
    replace?: boolean,
    suppressEvent?: boolean,
  ) => {
    const self = this.grid;
    const result = await ensureAsync(
      self.dataSource.move(range, rowOffset, columnOffset, replace),
    );
    if (!result) return false;

    if (!suppressEvent) {
      self.dispatchEvent('aftermove', {
        from: range,
        to: { ...self.getPrimarySelection() },
        rowOffset,
        columnOffset,
      });
    }

    return true;
  };

  /**
   * Checks if a given column is visible.
   * @returns {boolean} When true, the column is visible.
   * @param {number} columnIndex Column index.
   */
  isColumnVisible = (columnIndex) => {
    const self = this.grid;
    return (
      self.visibleCells.filter(function (c) {
        return c.columnIndex === columnIndex;
      }).length > 0
    );
  };
  /**
   * Checks if a given row is visible.
   * @returns {boolean} When true, the row is visible.
   * @param {number} rowIndex Row index.
   */
  isRowVisible = (rowIndex) => {
    const self = this.grid;
    return (
      self.visibleCells.filter(function (c) {
        return c.rowIndex === rowIndex;
      }).length > 0
    );
  };
  /**
   * Gets the cell at columnIndex and rowIndex.
   * @returns cell at the selected location.
   * @param columnIndex Column index.
   * @param rowIndex Row index.
   */
  getVisibleCellByIndex = (
    columnIndex: number,
    rowIndex: number,
  ): NormalCellDescriptor | undefined => {
    const self = this.grid;
    for (const cell of self.visibleCells) {
      if (
        cell.nodeType === 'canvas-datagrid-cell' &&
        (cell.isNormal || cell.isHeader) &&
        cell.columnIndex === columnIndex &&
        cell.rowIndex === rowIndex
      ) {
        return cell;
      }
    }
  };
  /**
   * Gets style at columnIndex and rowIndex by merging default style and custom style
   * It shouldn't depend on if the cell is visible or not
   * @param columnIndex Column index
   * @param rowIndex Row index
   * @returns Cell style at columnIndex and rowIndex
   */
  getCellStyleByIndex = (
    columnIndex: number,
    rowIndex: number,
  ): Omit<CellStyleDeclaration, 'borders'> => {
    const dataSource = this.grid.dataSource;
    const style = this.grid.style;
    const gridHeader = dataSource.getHeader(columnIndex);
    const table = dataSource.getTableByIndex(rowIndex, columnIndex);
    const cellMeta = dataSource.getCellMeta(rowIndex, columnIndex);
    let customStyle: Partial<CellStyleDeclaration> =
      dataSource.getCellStyle?.(rowIndex, columnIndex) || {};
    let tableHeader: GridHeader;
    let tableCellValue: any;

    // Add in table column style
    if (table && rowIndex !== table.startRow) {
      tableHeader = this.getTableHeaderByColumnViewIndex(table, columnIndex);
      tableCellValue = dataSource.getCellValue(rowIndex, columnIndex);
      if (tableHeader?.columnStyle) {
        customStyle = addColumnStyle(customStyle, tableHeader);
      }
    }

    customStyle = addCellDefaultStyle(
      customStyle,
      cellMeta,
      tableHeader ?? null,
      tableCellValue,
      this.grid.getLinkDefaultStyle(),
    );

    return {
      isBold: customStyle.isBold || false,
      isItalic: customStyle.isItalic || false,
      isStrikethrough: customStyle.isStrikethrough || false,
      isUnderline: customStyle.isUnderline || false,
      fontSize: customStyle.fontSize || style.cellFontSize,
      fontFamily: customStyle.fontFamily || style.cellFontFamily,
      horizontalAlignment:
        customStyle.horizontalAlignment || style.cellHorizontalAlignment,
      verticalAlignment:
        customStyle.verticalAlignment || style.cellVerticalAlignment,
      textColor: customStyle.textColor || style.cellColor,
      textRotation: customStyle.textRotation,
      wrapMode:
        customStyle.wrapMode || (gridHeader.wrapMode ?? style.cellWrapMode),
      backgroundColor: customStyle.backgroundColor || '#FFFFFF',
      isReadOnly: customStyle.isReadOnly || false,
      isImmovable: customStyle.isImmovable || false,
    };
  };
  /**
   * Find the visible cell that the given coordinates are pointing to.
   *
   * If the multiple items are stacked over each other, returns the one that is
   * on top.
   * @param x Number of pixels from the left.
   * @param y Number of pixels from the top.
   * @param filter Additional filter to apply (useful when looking for a certain type of item).
   * @param useTouchScrollZones Increase surface area of the items to match them more easily.
   * @returns The cell at the given location.
   */
  getCellAt = (
    x: number,
    y: number,
    filter?: (cell: any) => boolean,
    useTouchScrollZones?: boolean,
  ): CursorTarget => {
    const self = this.grid;
    const getAsResult = (
      cursor: Cursor,
      dragContext: DragContext,
      cell: CellDescriptor,
    ) => {
      return { cursor, dragContext, cell };
    };

    function getBorder(entity, cell: CellDescriptor): GridPosition {
      const { borderResizeZone: resizeZone } = self.attributes;
      const { resizeMarkerHeaderSize: markerSize } = self.style.scaled;
      const offsetX = cell.isColumnHeader ? markerSize : 0;
      const offsetY = cell.isRowHeader ? markerSize : 0;
      if (
        entity.x + entity.width - resizeZone - offsetX < x &&
        entity.x + entity.width + resizeZone > x
      ) {
        return 'right';
      }
      if (entity.x - resizeZone < x && entity.x + resizeZone > x) {
        return 'left';
      }
      if (
        entity.y + entity.height - resizeZone - offsetY < y &&
        entity.y + entity.height + resizeZone > y
      ) {
        return 'bottom';
      }
      if (entity.y - resizeZone < y && entity.y + resizeZone > y) {
        return 'top';
      }
    }
    if (!self.visibleCells) {
      return;
    }

    if (self.dragStartObject !== undefined) {
      if (x <= 0) x = 1;
      if (x >= self.width) x = self.width - 1;
      if (y <= 0) y = 1;
      if (y >= self.height) y = self.height - 1;
    }

    if (!self.visibleCells || !self.visibleCells.length) {
      return;
    }
    if (!(y < self.height && y > 0 && x < self.width && x > 0)) {
      return getAsResult('inherit', 'inherit', {
        nodeType: 'inherit',
        x,
        y,
        width: 0,
        height: 0,
      });
    }

    const tsz = useTouchScrollZones ? self.attributes.touchScrollZone : 0,
      borderBehavior = self.attributes.borderDragBehavior === 'move',
      visibleCellsLength = self.visibleCells.length,
      xBorderBehavior = borderBehavior ? self.cursorGrab : 'e-resize',
      yBorderBehavior = borderBehavior ? self.cursorGrab : 'n-resize',
      { verticalThumb, horizontalThumb } = self.scrollBox.entities;
    let border: GridPosition,
      moveBorder = false,
      cell: CellDescriptor,
      entity: PixelBoundingRect;

    for (let i = 0; i < visibleCellsLength; i += 1) {
      cell = self.visibleCells[i];
      // interactive dimensions of the cell.  used for touch "over size" zones
      entity = {
        x: cell.x,
        y: cell.y,
        height: cell.height,
        width: cell.width,
      };
      if (useTouchScrollZones && cell.nodeType === 'scrollbar') {
        entity.x -= tsz;
        entity.y -= tsz;
        entity.height += tsz;
        entity.width += tsz;
      }
      if (cell.isColumnHeader) {
        entity.width += self.style.resizeMarkerHeaderSize;
      }
      if (cell.isRowHeader) {
        entity.height += self.style.resizeMarkerHeaderSize;
      }
      if (cell.isNormal || cell.isHeader) {
        // If the cell is a non-frozen one and is clipped, offset the clipped
        // region from its coordinates so that we don't return the wrong cell
        // when the cursor is moving over the clipped area.
        if (
          self.frozenRow > 0 &&
          self.frozenRow < cell.rowIndex &&
          self.lastFrozenRowPixel > entity.y
        ) {
          entity.y = Math.max(self.lastFrozenRowPixel, entity.y);
        }
        if (
          self.frozenColumn > 0 &&
          self.frozenColumn < cell.columnIndex &&
          self.lastFrozenColumnPixel > entity.x
        ) {
          entity.x = Math.max(self.lastFrozenColumnPixel, entity.x);
        }
      }
      if (
        entity.x - self.style.cellBorderWidth < x &&
        entity.x + entity.width + self.style.cellBorderWidth > x &&
        entity.y - self.style.cellBorderWidth < y &&
        entity.y + entity.height + self.style.cellBorderWidth > y
      ) {
        if (filter && !filter(cell)) continue;
        if (cell.nodeType === 'frozen-marker') {
          if (cell.style === 'frozen-row-marker') {
            if (self.dragMode === 'frozen-column-marker') continue;
            return getAsResult('grab', cell.style, cell);
          } else {
            if (self.dragMode === 'frozen-row-marker') continue;
            return getAsResult('grab', cell.style, cell);
          }
        } else if (cell.nodeType === 'selection-handle') {
          return getAsResult('crosshair', cell.style, cell);
        } else if (cell.nodeType === 'scrollbar') {
          if (/vertical-scroll-(bar|box)/.test(cell.style)) {
            if (y > verticalThumb.y + verticalThumb.height) {
              return getAsResult('default', 'vertical-scroll-bottom', cell);
            } else if (y < verticalThumb.y) {
              return getAsResult('default', 'vertical-scroll-top', cell);
            }
            return getAsResult('default', 'vertical-scroll-box', cell);
          }

          if (/horizontal-scroll-(bar|box)/.test(cell.style)) {
            if (x > horizontalThumb.x + horizontalThumb.width) {
              return getAsResult('default', 'horizontal-scroll-right', cell);
            } else if (x < horizontalThumb.x) {
              return getAsResult('default', 'horizontal-scroll-left', cell);
            }
            return getAsResult('default', 'horizontal-scroll-box', cell);
          }
        }
        border = getBorder(entity, cell);
        // check if the border of this cell is the border of the selection and if so show move cursor in move mode
        if (cell.nodeType === 'canvas-datagrid-cell') {
          moveBorder =
            borderBehavior && cell.borders?.[border]?.style === 'selection';
          if (cell.tableButton && isCoordsInBounds(cell.tableButton, x, y)) {
            return getAsResult('pointer', 'table-dropdown-button', cell);
          } else if (
            cell.tableTypeButton &&
            isCoordsInBounds(cell.tableTypeButton, x, y)
          ) {
            return getAsResult('pointer', 'table-type-icon-button', cell);
          }

          if (
            cell.subtargets.groupToggleButton &&
            isCoordsInBounds(cell.subtargets.groupToggleButton, x, y)
          ) {
            return getAsResult('pointer', 'table-group-toggle-button', cell);
          }

          if (
            cell.subtargets.aggregationOptsButton &&
            isCoordsInBounds(cell.subtargets.aggregationOptsButton, x, y)
          ) {
            return getAsResult(
              'pointer',
              'table-aggregation-opts-button',
              cell,
            );
          }

          if (
            ['left', 'right'].indexOf(border) !== -1 &&
            (self.attributes.allowColumnResize || moveBorder) &&
            ((self.attributes.allowColumnResizeFromCell && cell.isNormal) ||
              !cell.isNormal ||
              moveBorder) &&
            ((self.attributes.allowRowHeaderResize &&
              (cell.isRowHeader || cell.isCorner)) ||
              !(cell.isRowHeader && cell.isCorner))
          ) {
            // Let the cell on the left use the left border for resizing, however,
            // do not do so if the current cell is the start of the non-frozen
            // area, or it is too short for the user to resize it.
            if (
              cell.isColumnHeader &&
              border === 'left' &&
              self.frozenColumn !== cell.columnIndex &&
              cell.width >= self.style.resizeMarkerHeaderSize * 2
            ) {
              continue;
            }
            if (
              (cell.isColumnHeader ||
                cell.isCorner ||
                (self.attributes.allowColumnResizeFromCell && cell.isNormal)) &&
              border === 'right'
            ) {
              return getAsResult('e-resize', 'column-resize', cell);
            }
            if (
              !cell.isColumnHeader &&
              !cell.isRowHeader &&
              !cell.isCorner &&
              moveBorder
            ) {
              return getAsResult(
                xBorderBehavior,
                (border + '-move') as CellMoveTarget,
                cell,
              );
            }
          }
          if (
            ['top', 'bottom'].indexOf(border) !== -1 &&
            cell.rowIndex > -1 &&
            (self.attributes.allowRowResize || moveBorder) &&
            ((self.attributes.allowRowResizeFromCell && cell.isNormal) ||
              !cell.isNormal ||
              moveBorder) &&
            !cell.isColumnHeader
          ) {
            // Let the cell at the top use the top border for resizing, however,
            // do not do so if the current cell is the start of the non-frozen
            // area, or it is too short for the user to resize it.
            if (
              cell.isRowHeader &&
              border === 'top' &&
              self.frozenRow !== cell.rowIndex &&
              cell.height >= self.style.resizeMarkerHeaderSize * 1
            ) {
              continue;
            }
            if (
              (cell.isRowHeader ||
                cell.isCorner ||
                (self.attributes.allowRowResizeFromCell && cell.isNormal)) &&
              border === 'bottom'
            ) {
              return getAsResult('n-resize', 'row-resize', cell);
            }
            if (!(cell.isRowHeader || cell.isCorner) && moveBorder) {
              return getAsResult(
                yBorderBehavior,
                (border + '-move') as CellMoveTarget,
                cell,
              );
            }
          }
          /** @todo Remove the following line after the table feature is completed */
          //@ts-ignore
          const { tableSelectionAreaSize: areaSize } = self.style.scaled;
          if (
            cell.tableContext?.hasResizeHandle &&
            x >= cell.x + cell.width - areaSize &&
            x <= cell.x + cell.width &&
            y >= cell.y + cell.height - areaSize &&
            y <= cell.y + cell.height
          ) {
            return getAsResult('nwse-resize', 'resize-table', cell);
          }
          if (cell.table && !cell.table.isSpilling) {
            const canSelectRow =
              cell.columnIndex === cell.table.startColumn &&
              x >= cell.x &&
              x < cell.x + areaSize;
            const canSelectColumn =
              cell.rowIndex === cell.table.startRow &&
              y >= cell.y &&
              y < cell.y + areaSize;

            if (canSelectRow && canSelectColumn) {
              return getAsResult('se-resize', 'select-table', cell);
            } else if (canSelectRow) {
              return getAsResult('e-resize', 'select-table-row', cell);
            } else if (canSelectColumn) {
              return getAsResult('s-resize', 'select-table-column', cell);
            }
          }
          if (
            cell.containsUnhideIndicatorAtEnd ||
            cell.containsUnhideIndicatorAtStart
          ) {
            const indicator = self.getUnhideIndicator(x, y);
            if (indicator) {
              const context =
                ['l', 't'].indexOf(indicator.dir) !== -1
                  ? 'unhide-indicator-end'
                  : 'unhide-indicator-start';
              return getAsResult('pointer', context, cell);
            }
          }
          if (cell.isColumnHeader) {
            const primary = self.getPrimarySelection();
            if (
              cell.selected &&
              primary.type === SelectionType.Columns &&
              isInSelection(primary, undefined, cell.columnIndex)
            ) {
              if (cell.isNonReorderable) {
                return getAsResult('not-allowed', 'cell', cell);
              } else {
                return getAsResult(self.cursorGrab, 'column-reorder', cell);
              }
            }
            return getAsResult('default', 'cell', cell);
          }
          if (cell.isRowHeader) {
            const primary = self.getPrimarySelection();
            if (
              cell.selected &&
              primary.type === SelectionType.Rows &&
              isInSelection(primary, cell.rowIndex)
            ) {
              if (cell.isNonReorderable) {
                return getAsResult('not-allowed', 'cell', cell);
              } else {
                return getAsResult(self.cursorGrab, 'row-reorder', cell);
              }
            }
            return getAsResult('default', 'cell', cell);
          }
        }
        if (cell.isGrid) {
          return getAsResult('default', 'cell-grid', cell);
        }
        if (cell.nodeType === 'tree-grid') {
          return getAsResult('default', 'tree', cell);
        }

        return getAsResult('default', 'cell', cell);
      }
    }
    return getAsResult('default', 'background', {
      nodeType: 'background',
      x,
      y,
      width: self.width,
      height: self.height,
    });
  };

  checkMouseOnTableTypeButton = (
    cell: NormalCellDescriptor,
    mouseX: number,
    mouseY: number,
  ) => {
    return (
      cell.tableTypeButton &&
      cell.tableTypeButton.x <= mouseX &&
      cell.tableTypeButton.y <= mouseY &&
      cell.tableTypeButton.x + cell.tableTypeButton.width >= mouseX &&
      cell.tableTypeButton.y + cell.tableTypeButton.height >= mouseY
    );
  };

  updateActiveTableFieldDropdown = (cell?: NormalCellDescriptor) => {
    if (!cell) {
      this.grid.activeTableFieldDropdown = undefined;
    } else {
      this.grid.activeTableFieldDropdown = {
        table: cell.table,
        header: cell.header,
      };
    }
    this.grid.requestRedraw('all');
  };

  updateActiveAggregationOptsDropdown = (cell?: NormalCellDescriptor) => {
    this.grid.activeAggregationOptsDropdown?.closeHandle?.onClose();
    if (
      cell &&
      (!this.grid.activeAggregationOptsDropdown ||
        this.grid.activeAggregationOptsDropdown?.table != cell.table ||
        this.grid.activeAggregationOptsDropdown?.header != cell.tableHeader)
    ) {
      this.grid.activeAggregationOptsDropdown = {
        table: cell.table,
        header: cell.tableHeader,
        rowIndex: cell.rowIndex,
        closeHandle: {},
      };
    } else {
      this.grid.activeAggregationOptsDropdown = undefined;
    }
    this.grid.requestRedraw('all');

    return this.grid.activeAggregationOptsDropdown?.closeHandle;
  };

  calcRowHeaderWidth = (digits: number) => {
    const self = this.grid;
    const drawUtils = new DrawUtils(self);

    drawUtils.applyCellFontStyles({ style: 'rowHeaderCell' }, true);
    const max =
      self.ctx.measureText('0'.repeat(digits)).width +
      self.style.rowHeaderCellPaddingRight +
      self.style.rowHeaderCellPaddingLeft +
      (self.rowNumberShowingUnhideButtons
        ? self.style.unhideIndicatorSize * 1.5
        : 0) +
      (self.attributes.tree
        ? self.style.treeArrowWidth +
          self.style.treeArrowMarginLeft +
          self.style.treeArrowMarginRight
        : 0);

    self.rowNumberColumnDigitCount = digits;
    self.rowNumberColumnWidth = Math.floor(
      Math.max(max, self.style.minColumnWidth),
    );
  };

  /**
   * Check if the user is actively dragging an item.
   * @returns True if an item is being dragged.
   */
  isDraggingItem = () => !!this.grid.draggingItem;

  /**
   * Returns the maximum text width for a given column by column name.
   * @returns The number of pixels wide the maximum width value in the selected column.
   * @param columnId The name of the column to calculate the value's width of.
   */
  findColumnMaxTextLength = (columnId: string): number => {
    const self = this.grid;
    const header = self.dataSource.getHeaderById(columnId);
    if (!header) return self.style.cellWidth;

    const utils = new DrawUtils(self);
    utils.applyCellFontStyles({ style: 'columnHeaderCell' }, true);

    const text = String(header.title || header.dataKey);
    const t =
      self.ctx.measureText(text).width +
      self.style.columnHeaderCellPaddingRight +
      self.style.columnHeaderCellPaddingLeft +
      self.style.cellAutoResizePadding;
    /**
     * @todo Formatter requires {@link CellDescriptor}
     */
    const formatter = self.formatters[columnTypeToString(header.type)] as any;
    const len = Math.min(
      self.dataSource.state.rows,
      self.attributes.resizeAutoFitMaxSampleCount,
    );
    let max = t > -Infinity ? t : -Infinity;
    let noMaxCount = 0;

    utils.applyCellFontStyles({ style: 'cell' }, true);

    for (let i = 0; i < len; i++) {
      /**
       * @todo This will become a bottleneck once the grid is able to
       * communicate with a data source.  Right now, however, using this should
       * suffice.
       */
      let text = self.dataSource.getCellValue(i, header.columnViewIndex);
      if (!text || text.length < 1) continue;
      if (formatter) {
        text = formatter({ cell: { value: text } });
      }
      const t =
        self.ctx.measureText(text).width +
        self.style.cellPaddingRight +
        self.style.cellPaddingLeft +
        self.style.cellAutoResizePadding;
      if (t > max) {
        max = t;
        noMaxCount = 0;
      } else {
        noMaxCount++;
        if (noMaxCount >= self.attributes.resizeAutoFitMinInvalidSampleCount) {
          break;
        }
      }
    }

    return Math.floor(max);
  };

  /**
   * Gets the total width of all header columns.
   */
  getHeaderWidth = () => {
    const self = this.grid;
    return self.getVisibleSchema().reduce(function (total, header) {
      return total + Math.floor(header.width || self.style.cellWidth);
    }, 0);
  };
  /**
   * Gets the height of a row by index.
   * @param {number} rowIndex The row index to lookup.
   */
  getRowHeight = (rowIndex: number) => {
    const self = this.grid;
    return self.sizes.getRowHeight(
      rowIndex,
      rowIndex === -1
        ? self.style.columnHeaderCellHeight
        : self.style.cellHeight,
    );
  };
  /**
   * Gets the width of a column by index.
   * @param {number} columnIndex The column index to lookup.
   */
  getColumnWidth = (columnIndex: number): number => {
    const self = this.grid;
    return self.dataSource.sizes.getColumnWidth(
      columnIndex,
      columnIndex === -1 ? self.style.rowHeaderCellWidth : self.style.cellWidth,
    );
  };

  /**
   * Get lastest selection in grid
   */
  getLastSelection = () => {
    const grid = this.grid;
    return grid.getPrimarySelection();
  };

  /**
   * Get selections in grid
   * @returns
   */
  getSelections = (): SelectionDescriptor[] => {
    return this.grid.selections;
  };

  /**
   * Get undo style key before appling new style into cells
   *
   * @param row
   * @param column
   * @param keys
   * @returns
   */
  getUndoCellStyleByIndex = (
    row: number,
    column: number,
    keys: CellStyleDeclarationKey[],
  ) => {
    if (Array.isArray(keys)) {
      const { dataSource } = this.grid;
      const cellStyle: Partial<CellStyleDeclaration> =
        dataSource.getCellStyle?.(row, column);

      if (!cellStyle) return;

      let shouldAdd = false;
      const storedStyle: Partial<CellStyleDeclaration> = {};
      for (const key of keys) {
        if (cellStyle[key] != null) {
          storedStyle[key as string] = cellStyle[key];
          shouldAdd = true;
        } else {
          storedStyle[key as string] = undefined;
        }
      }
      if (shouldAdd) return storedStyle;
    }
  };

  getSelectionCellValue = (
    mode: CellStyleDeclarationKey[] | CellClearMode,
    sel: SelectionDescriptor,
    hasBeforeValue = false,
    beforeValue: any = undefined,
  ): Map<string, Partial<CellStyleDeclaration | any>> => {
    const grid = this.grid;
    const { dataSource } = grid;
    const valueMap: Map<string, Partial<CellStyleDeclaration> | any> =
      new Map();
    for (let row = sel.startRow; row <= sel.endRow; row++) {
      for (let column = sel.startColumn; column <= sel.endColumn; column++) {
        if (mode === 'content') {
          const cellContent: any = dataSource.getCellValue?.(row, column);
          const cellMeta = dataSource.getCellMeta?.(row, column);
          if (
            hasBeforeValue ||
            cellContent ||
            (cellMeta &&
              (cellMeta.cellError || cellMeta.parserData || cellMeta.linkData))
          ) {
            valueMap.set(getUndoRedoCellKey(row, column), {
              text: hasBeforeValue ? beforeValue : cellContent,
              cellError: cellMeta?.cellError,
              parserData: cellMeta?.parserData,
              linkData: cellMeta?.linkData,
            });
          }
        } else if (mode === 'format') {
          const cellStyle: Partial<CellStyleDeclaration> =
            dataSource.getCellStyle?.(row, column);
          if (cellStyle) {
            valueMap.set(getUndoRedoCellKey(row, column), cellStyle);
          }
        } else {
          const cellStyle: Partial<CellStyleDeclaration> =
            dataSource.getCellStyle?.(row, column) || {};
          if (Array.isArray(mode)) {
            let shouldAdd = false;
            const storedStyle: Partial<CellStyleDeclaration> = {};
            for (const key of mode) {
              if (cellStyle[key]) {
                storedStyle[key as string] = cellStyle[key];
                shouldAdd = true;
              } else {
                storedStyle[key as string] = undefined;
              }
            }
            if (shouldAdd) {
              valueMap.set(getUndoRedoCellKey(row, column), storedStyle);
            }
          }
        }
      }
    }
    return valueMap;
  };

  /**
   * Get cell style/content for key with selection range
   * If there is no @customSelections provided, use grid selections
   * @param mode
   * @param customSelections
   * @param hasBeforeValue
   * @param beforeValue
   * @returns
   */
  getSelectionsCellValue = (
    mode: CellStyleDeclarationKey[] | CellClearMode,
    customSelections: SelectionDescriptor[] = null,
    hasBeforeValue = false,
    beforeValue: any = undefined,
  ): Map<string, Partial<CellStyleDeclaration | any>> => {
    const grid = this.grid;
    const selections = customSelections ?? grid.selections;
    let valueMap: Map<string, Partial<CellStyleDeclaration> | any>;

    selections.forEach((sel) => {
      const childMap = this.getSelectionCellValue(
        mode,
        sel,
        hasBeforeValue,
        beforeValue,
      );
      valueMap = valueMap
        ? new Map([...valueMap.entries(), ...childMap.entries()])
        : childMap;
    });
    return valueMap;
  };

  /**
   * Get cell style/content for key with active cell
   * @param mode
   * @returns
   */
  getActiveCellValue = (
    mode: CellStyleDeclarationKey[] | CellClearMode,
    hasBeforeValue = false,
    beforeValue: any = undefined,
  ): Map<string, Partial<CellStyleDeclaration | any>> => {
    const grid = this.grid;
    const sel: SelectionDescriptor = {
      type: SelectionType.Cells,
      startRow: grid.activeCell.rowIndex,
      endRow: grid.activeCell.rowIndex,
      startColumn: grid.activeCell.columnIndex,
      endColumn: grid.activeCell.columnIndex,
    };
    const childMap = this.getSelectionCellValue(
      mode,
      sel,
      hasBeforeValue,
      beforeValue,
    );

    return childMap;
  };

  /**
   * Get Cell borders of current selections
   * @returns
   */
  getSelectionsCellBorderStyle = (): Map<
    string,
    Partial<CellStyleDeclaration>
  > => {
    const grid = this.grid;
    const { dataSource, selections } = grid;
    const borderStyleMap: Map<
      string,
      Partial<CellStyleDeclaration>
    > = new Map();
    selections.forEach((sel) => {
      const range = grid.expandSelectionToAdjBorder(sel);
      for (let row = range.startRow; row <= range.endRow; row++) {
        for (
          let column = range.startColumn;
          column <= range.endColumn;
          column++
        ) {
          const cellStyle: Partial<CellStyleDeclaration> =
            dataSource.getCellStyle?.(row, column) || {};
          if (cellStyle['borders']) {
            borderStyleMap.set(getUndoRedoCellKey(row, column), {
              borders: cellStyle['borders'],
            });
          }
        }
      }
    });
    return borderStyleMap;
  };

  /**
   * Get Merged cells of current primary selections
   * @returns
   */
  getCurrentMergedCells = (): MergedCellDescriptor[] => {
    const grid = this.grid;
    const range = grid.convertSelectionToRange(grid.getPrimarySelection());

    return grid.getMergedCellsForRange(range);
  };

  /**
   * Perform undo cell style actions
   *
   * Note: Undo/redo for normal styles (not `CLEAR_STYLE`) will be implemented
   * differently because we introduce in new column style for table. We may have
   * it for `CLEAR_STYLE` in the future but not now.
   * @param styleKey
   * @param selections
   * @param activeCell
   * @param valueMap
   * @param repaint
   */
  undoCellsStyle = async (
    styleKey: CellStyleDeclarationKey[] | 'CLEAR_STYLE',
    selections: SelectionDescriptor[],
    activeCell: any,
    valueMap: Map<string, Partial<CellStyleDeclaration>>,
    columnsState: Record<string, any>,
    repaint: boolean,
  ) => {
    const grid = this.grid;

    if (selections && styleKey === 'CLEAR_STYLE') {
      for (let idx = 0; idx < selections.length; idx++) {
        const selection = selections[idx];
        for (let row = selection.startRow; row <= selection.endRow; row++) {
          for (
            let column = selection.startColumn;
            column <= selection.endColumn;
            column++
          ) {
            const updateStyle = valueMap.get(getUndoRedoCellKey(row, column));
            grid.dataSource.editCells([
              {
                row,
                column,
                style: updateStyle ? updateStyle : {},
              },
            ]);
          }
        }
      }
    } else if (Array.isArray(styleKey)) {
      for (const columnId in columnsState) {
        const state = columnsState[columnId];
        await state.dataSource.setColumnStyleState(
          columnId,
          state.column,
          state.cells,
        );
      }

      if (valueMap) {
        const emptyValue = {};
        for (const key of styleKey) {
          emptyValue[key as string] = undefined;
        }

        const edit: EditCellDescriptor[] = [];
        for (const [key, value] of valueMap) {
          const [row, column] = undoRedoKeyToIndex(key);
          edit.push({ row, column, style: value ?? emptyValue });
        }

        await grid.dataSource.editCells(edit);
      }
    }

    if (repaint) {
      for (let idx = 0; idx < selections.length; idx++) {
        grid.addSelection(selections[idx], idx === 0 ? false : true, true);
      }
      grid.setActiveCell(activeCell.columnIndex, activeCell.rowIndex);
      grid.redrawNow('all');
    }
  };

  /**
   * Perform redo cell style action
   * @param selections
   * @param activeCell
   * @param cellStyle
   * @param repaint
   */
  redoCellsStyle = async (
    selections: SelectionDescriptor[],
    activeCell: any,
    cellStyle: Partial<CellStyleDeclaration>,
    applyEntireColumn: boolean,
    repaint: boolean,
  ) => {
    const grid = this.grid;
    const shouldClearStyleRun =
      cellStyle?.styleRuns === undefined || cellStyle?.styleRuns === null;

    await this.editCellsStyle(
      cellStyle,
      shouldClearStyleRun,
      applyEntireColumn,
      selections,
      repaint,
    );

    if (repaint) {
      for (let idx = 0; idx < selections.length; idx++) {
        grid.addSelection(selections[idx], idx === 0 ? false : true, true);
      }
      grid.setActiveCell(activeCell.columnIndex, activeCell.rowIndex);
      grid.redrawNow('all');
    }
  };

  /**
   * Perform undo cell data format action
   * @param styleKey
   * @param selections
   * @param activeCell
   * @param valueMap
   * @param repaint
   */
  undoCellsDataFormat = async (
    styleKey: CellStyleDeclarationKey[] | 'CLEAR_STYLE',
    selections: SelectionDescriptor[],
    activeCell: any,
    valueMap: Map<
      string,
      Partial<{
        dataFormat: CellStyleDeclaration['dataFormat'];
        linkData?: CellMeta['linkData'];
      }>
    >,
    columnsState: Record<string, any>,
    repaint: boolean,
  ) => {
    const grid = this.grid;
    const dataSource = grid.dataSource;

    for (const columnId in columnsState) {
      const state = columnsState[columnId];
      await state.dataSource.setColumnStyleState(
        columnId,
        state.column,
        state.cells,
      );
    }

    if (valueMap) {
      const edit: EditCellDescriptor[] = [];
      for (const [key, value] of valueMap) {
        const [row, column] = undoRedoKeyToIndex(key);
        if ('linkData' in value) {
          edit.push({
            row,
            column,
            style: { dataFormat: value.dataFormat },
            meta: { linkData: value.linkData },
          });
        } else {
          edit.push({ row, column, style: value });
        }
      }

      await dataSource.editCells(edit);
    }

    if (repaint) {
      for (let idx = 0; idx < selections.length; idx++) {
        grid.addSelection(selections[idx], idx === 0 ? false : true, true);
      }
      grid.setActiveCell(activeCell.columnIndex, activeCell.rowIndex);
      grid.redrawNow('all');
    }
  };

  /**
   * Perform redo cell data format action
   * @param selections The selections to apply changes
   * @param activeCell
   * @param cellStyle
   * @param applyEntireColumn Should the data-format applies to entire column or not
   * @param clearLinkRuns Whether the link-runs should be cleared or not
   * @param repaint
   */
  redoCellsDataFormat = async (
    selections: SelectionDescriptor[],
    activeCell: any,
    cellStyle: Partial<CellStyleDeclaration>,
    applyEntireColumn: boolean,
    clearLinkRuns: boolean,
    repaint: boolean,
  ) => {
    const grid = this.grid;
    await this.editCellsDataFormat(
      cellStyle.dataFormat,
      applyEntireColumn,
      clearLinkRuns,
      selections,
      repaint,
    );

    if (repaint) {
      for (let idx = 0; idx < selections.length; idx++) {
        grid.addSelection(selections[idx], idx === 0 ? false : true, true);
      }
      grid.setActiveCell(activeCell.columnIndex, activeCell.rowIndex);
      grid.redrawNow('all');
    }
  };

  /**
   * Perform undo/redo cells borders
   * @param selections
   * @param activeCell
   * @param valueMap
   * @param repaint
   */
  undoCellsBorders = async (
    selections: SelectionDescriptor[],
    activeCell: any,
    valueMap: Map<string, Partial<CellStyleDeclaration>>,
    columnsState: Record<string, any>,
    repaint: boolean,
  ) => {
    const grid = this.grid;

    for (const columnId in columnsState) {
      const state = columnsState[columnId];
      await (state.dataSource as DataSourceBase).setColumnBorderState(
        columnId,
        state.column,
        state.cells,
      );
    }

    if (valueMap) {
      const edit: EditCellDescriptor[] = [];
      for (const [key, value] of valueMap) {
        const [row, column] = undoRedoKeyToIndex(key);
        edit.push({ row, column, style: value });
      }

      await grid.dataSource.editCells(edit);
    }

    if (repaint) {
      for (let idx = 0; idx < selections.length; idx++) {
        grid.addSelection(selections[idx], idx === 0 ? false : true, true);
      }
      grid.setActiveCell(activeCell.columnIndex, activeCell.rowIndex);
      grid.redrawNow('all');
    }
  };

  redoCellsBorders = async (
    selections: SelectionDescriptor[],
    activeCell: any,
    style: CellBorderStyle,
    color: string,
    type: EditBordersOperation,
    applyEntireColumn: boolean,
    repaint: boolean,
  ) => {
    const grid = this.grid;

    await this.editCellsBorders(
      style,
      color,
      type,
      applyEntireColumn,
      selections,
    );

    if (repaint) {
      for (let idx = 0; idx < selections.length; idx++) {
        grid.addSelection(selections[idx], idx === 0 ? false : true, true);
      }
      grid.setActiveCell(activeCell.columnIndex, activeCell.rowIndex);
      grid.redrawNow('all');
    }
  };

  /**
   * Perform undo/redo for cell values
   * @param selections
   * @param activeCell
   * @param valueMap
   * @param repaint
   */
  undoRedoCellsValue = async (
    selections: SelectionDescriptor[],
    activeCell: any,
    valueMap: Map<string, any>,
    repaint: boolean,
  ) => {
    const grid = this.grid;
    if (selections && valueMap) {
      for (let idx = 0; idx < selections.length; idx++) {
        const selection = selections[idx];
        for (let row = selection.startRow; row <= selection.endRow; row++) {
          for (
            let column = selection.startColumn;
            column <= selection.endColumn;
            column++
          ) {
            const key = getUndoRedoCellKey(row, column);
            if (valueMap.has(key)) {
              const updatedValue = valueMap.get(key);
              if (
                updatedValue !== undefined &&
                updatedValue.text !== undefined
              ) {
                await ensureAsync(
                  grid.dataSource.editCells([
                    {
                      row,
                      column,
                      value: updatedValue.text,
                      meta: {
                        cellError: updatedValue.cellError,
                        parserData: updatedValue.parserData,
                        linkData: updatedValue.linkData,
                      },
                    },
                  ]),
                );
              } else {
                const range: RangeDescriptor = {
                  startRow: row,
                  endRow: row,
                  startColumn: column,
                  endColumn: column,
                };
                if (grid.dataSource.clearCells)
                  grid.dataSource.clearCells(range, 'content');
              }
            }
          }
        }
      }
    }
    if (repaint) {
      for (let idx = 0; idx < selections.length; idx++) {
        grid.addSelection(selections[idx], idx === 0 ? false : true, true);
      }
      grid.setActiveCell(activeCell.columnIndex, activeCell.rowIndex);
      grid.redrawNow('all');
    }
  };

  undoRedoMergedCell = (
    selections: SelectionDescriptor[],
    activeCell: any,
    mergedCells: MergedCellDescriptor[],
    repaint: boolean,
  ) => {
    const grid = this.grid;
    if (selections) {
      const range = grid.convertSelectionToRange(selections[0]);
      grid.unmergeCells(range);
      for (const mergedCell of mergedCells) {
        const mergedCellRange: RangeDescriptor = {
          startRow: mergedCell.startRow,
          startColumn: mergedCell.startColumn,
          endRow: mergedCell.endRow,
          endColumn: mergedCell.endColumn,
        };
        grid.mergeCells(mergedCellRange, MergeDirection.Center);
      }
    }

    if (repaint) {
      for (let idx = 0; idx < selections.length; idx++) {
        grid.addSelection(selections[idx], idx === 0 ? false : true, true);
      }
      grid.setActiveCell(activeCell.columnIndex, activeCell.rowIndex);
      grid.redrawNow('all');
    }
  };

  /**
   * Perform redo clear cell action
   * @param selections
   * @param activeCell
   * @param mode
   * @param repaint
   */
  redoClearCell = (
    selections: SelectionDescriptor[],
    activeCell: any,
    mode: CellClearMode,
    repaint: boolean,
  ) => {
    const grid = this.grid;
    if (selections) {
      for (const sel of selections) {
        const range: RangeDescriptor = {
          startRow: sel.startRow,
          endRow: sel.endRow,
          startColumn: sel.startColumn,
          endColumn: sel.endColumn,
        };
        if (grid.dataSource.clearCells) grid.dataSource.clearCells(range, mode);
      }
    }

    if (repaint) {
      for (let idx = 0; idx < selections.length; idx++) {
        grid.addSelection(selections[idx], idx === 0 ? false : true, true);
      }
      grid.setActiveCell(activeCell.columnIndex, activeCell.rowIndex);
      grid.redrawNow('all');
    }
  };

  /**
   * Update name and type to grid schema
   * @param startCol
   * @param fields
   * @param refresh
   */
  updateSchema = (
    startCol: number,
    fields: Partial<GridHeader>[],
    refresh = true,
  ) => {
    const grid = this.grid;
    var s = grid.getSchema();

    const schemaSize = s.length;
    const fieldSize = fields.length;

    for (let i = startCol; i < startCol + fieldSize; i++) {
      if (i >= schemaSize) {
        break;
      }

      const field: Partial<GridHeader> = { ...fields[i - startCol] };

      s[i] = { ...s[i], ...field };
    }

    grid.setSchema(s);

    if (refresh) {
      grid.refresh();
    }
  };

  getTreeHeight = (rowIndex: number) => {
    const self = this.grid;
    return self.sizes.getTreeHeight(rowIndex);
  };

  findHorizontalScrollTargetForPixel = (
    scrollLeft: number,
  ): { index: number; pixel: number } => {
    const self = this.grid;
    return self.dataSource.positionHelper.getHorizontalScrollTargetForPixel(
      self.style.cellWidth,
      self.frozenColumn,
      scrollLeft,
    );
  };

  findVerticalScrollTargetForPixel = (scrollTop: number): ScrollTarget => {
    const self = this.grid;
    return self.dataSource.positionHelper.getVerticalScrollTargetForPixel(
      self.style.cellHeight,
      self.frozenRow,
      scrollTop,
    );
  };

  /**
   * Toggle passive flag
   * @method
   * @param {boolean} passive
   */
  setPassive = (passive: boolean) => {
    this.grid.passive = passive;
    this.grid.refresh();
  };

  /**
   * Get all columns of a table that contains cell at (rowIndex , columnIndex)
   * @param rowIndex
   * @param columnIndex
   * @returns
   */
  getTableColumnsAt = (rowIndex: number, columnIndex: number) => {
    const table = this.getTableAt(rowIndex, columnIndex);

    if (table) {
      return table.dataSource.getAllColumns?.();
    }
  };

  getTableAt = (rowIndex: number, columnIndex: number) => {
    return this.grid.dataSource.getTableByIndex(rowIndex, columnIndex);
  };

  getTableCellValueByColumnId = (
    table: TableDescriptor,
    columnId: string,
    rowViewIndex: number,
  ) => {
    return this.grid.dataSource.getTableCellValueByColumnId(
      table,
      columnId,
      rowViewIndex,
    );
  };
}
