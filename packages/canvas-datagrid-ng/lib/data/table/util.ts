import { getSelectionFromRange } from '../../named-ranges/util';
import { getSkipsFromArray, getSkipsFromNumbers } from '../../range/util';
import { SelectionType } from '../../selections/util';
import type {
  CellIndex,
  CellSource,
  CellStyleDeclaration,
  CellTableContext,
  CellTableGroupContext,
  ColumnType,
  DataGroup,
  DataSourceBase,
  EditCellDescriptor,
  GridHeader,
  RangeDescriptor,
  RequestDataFrameInput,
  RequestDataFrameOutput,
  SkippedRangeDescriptor,
  TableDescriptor,
  TableGroupHeader,
  TableSummaryFn,
  TableSummaryContext,
} from '../../types';
import { DataType } from '../../types';
import { integerToAlpha } from '../../util';
import { formatTableCellValue } from '../data-format';
import { ensureAsync } from '../data-source/await';
import {
  type AggregationFnType,
  getAggregationFnByName,
  TABLE_SUMMARY_FN_NUMB_SUM,
  TABLE_SUMMARY_FN_BOOL_PERCENT_TRUE,
} from './summary';

type TableRange = SkippedRangeDescriptor & {
  offset: {
    row: number;
    rowEnd: number;
    col: number;
  };
  dataOffset: {
    row: number;
    col: number;
  };
  visibleColumnCount: number;
  visibleRowCount: number;
  loadSummary: boolean;

  visibility: {
    headerRow: boolean;
    totalRow: boolean;
    groupHeaderColumn: boolean;
  };
};

const applySkippedRanges = (
  range: SkippedRangeDescriptor,
  table: TableDescriptor,
  tableRange: TableRange,
  isRow: boolean,
) => {
  const skippedRanges = isRow ? range.skippedRows : range.skippedColumns;
  const skippedTableRanges = isRow
    ? tableRange.skippedRows
    : tableRange.skippedColumns;
  for (const [start, end] of skippedRanges) {
    const tableEnd = isRow ? table.endRow : table.endColumn;
    if (end > tableEnd) break;

    if (isRow) {
      const { indexes } = table;
      if (start <= indexes.headerRow && end >= indexes.headerRow) {
        tableRange.visibility.headerRow = false;
      }
      if (start <= indexes.totalRow && end >= indexes.totalRow) {
        tableRange.visibility.totalRow = false;
        tableRange.loadSummary = false;
      }
    } else {
      const { indexes } = table;
      if (
        start <= indexes.groupHeaderColumn &&
        end >= indexes.groupHeaderColumn
      ) {
        tableRange.visibility.groupHeaderColumn = false;
      }
    }

    const tableDataStart = isRow ? table.firstRowIndex : table.firstColumnIndex;
    const tableDataEnd = isRow ? table.lastRowIndex : table.endColumn;
    if (start <= tableDataEnd) {
      if (start < tableDataStart) {
        const diff = Math.min(end, tableDataStart - 1) - start + 1;
        if (isRow) {
          tableRange.dataOffset.row -= diff;
        } else {
          tableRange.dataOffset.col -= diff;
        }
      }
      if (end >= tableDataStart) {
        const skipStart = Math.max(start, tableDataStart) - tableDataStart;
        const skipEnd = Math.min(end, tableDataEnd) - tableDataStart;
        const count = skipEnd - skipStart + 1;
        skippedTableRanges.push([skipStart, skipEnd]);

        if (isRow) {
          tableRange.visibleRowCount -= count;
        } else {
          tableRange.visibleColumnCount -= count;
        }
      }
    }
  }
};

export const getSkipsFromHeaders = (columns: GridHeader[]) => {
  return getSkipsFromArray(columns, (header) => header.columnIndex);
};

export const getTableRangeInRange = (
  range: RangeDescriptor,
  table: TableDescriptor,
  dataRowOnly = false,
) => {
  const rowIndex = dataRowOnly ? table.firstRowIndex : table.startRow;
  const startRow = Math.max(range.startRow - rowIndex, 0);
  const startColumn = Math.max(range.startColumn - table.startColumn, 0);
  return {
    startRow,
    startColumn,
    endRow: Math.min(
      Math.max(range.endRow - rowIndex + startRow, 0),
      Math.max(table.rowCount - 1, 0),
    ),
    endColumn: Math.min(
      Math.max(range.endColumn - range.startColumn + startColumn, 0),
      Math.max(table.columnCount - 1, 0),
    ),
  } as RangeDescriptor;
};

export const convertRequestOutputToRange = (output: RequestDataFrameOutput) => {
  const { columns, rowHeaders } = output;
  return {
    startRow: rowHeaders[0],
    endRow: rowHeaders[rowHeaders.length - 1],
    startColumn: columns[0].columnIndex,
    endColumn: columns[columns.length - 1].columnIndex,
    // fixme: Pass the correct number array that contains the row indexes (pk).
    skippedRows: getSkipsFromNumbers(output.rowHeaders as number[]),
    skippedColumns: getSkipsFromHeaders(output.columns),
  } as SkippedRangeDescriptor;
};

export const applyTableRowData = (
  table: TableDescriptor,
  rowIndex: number,
  requestStartColumn: number,
  requestEndColumn: number,
  cells: any[],
  style: any[],
) => {
  if (
    rowIndex > table.endRow ||
    requestStartColumn > table.endColumn ||
    rowIndex < table.startRow ||
    requestEndColumn < table.startColumn
  ) {
    return;
  }
  const targetRow = Math.max(rowIndex - table.startRow, 0);
  const startColumn = Math.max(requestStartColumn - table.startColumn, 0);
  const endColumn = Math.min(
    Math.max(requestEndColumn - requestStartColumn + startColumn, 0),
    Math.max(table.columnCount - 1, 0),
  );

  const rowOffset = table.startRow - rowIndex;
  const colOffset = Math.max(table.startColumn - requestStartColumn, 0);
  if (rowOffset < 0) {
    return;
  } else if (rowOffset >= 0) {
    for (let i = 0; i < endColumn - startColumn + 1; i++) {
      const col = colOffset + i;
      const header = getTableFieldOrGroupHeader(table, startColumn + i);
      if (!header) break;
      cells[col] = header.dataKey;
      if (style) delete style[col];
    }
  } else {
    const tableResult = table.dataSource.getDataFrame({
      startRow: targetRow,
      endRow: targetRow,
      startColumn,
      endColumn,
    });

    for (let i = 0; i < tableResult.cells.length; i++) {
      const cells = tableResult.cells[i];
      const styles = tableResult.style[i];
      for (let j = 0; j < cells.length; j++) {
        const col = colOffset + j;
        const style = styles?.[j];

        cells[col] = cells[j];
        if (style && style) {
          const parentStyle = style[col];
          if (parentStyle) {
            Object.assign(parentStyle, style);
          } else {
            style[col] = style;
          }
        }
      }
    }
  }
};

/**
 * Load the table data and apply it to the frame result.
 * @param table To load.
 * @param request The original data frame request.
 * @param output The result of the original request.
 */
export const loadTableDataForFrame = async (
  table: TableDescriptor,
  request: RequestDataFrameInput,
  output: RequestDataFrameOutput,
) => {
  if (
    request.startRow > table.endRow ||
    request.startColumn > table.endColumn ||
    request.endRow < table.startRow ||
    request.endColumn < table.startColumn
  ) {
    return;
  }

  const startColumn = Math.max(request.startColumn - table.startColumn, 0);
  const endColumn = Math.min(
    Math.max(request.endColumn - request.startColumn + startColumn, 0),
    Math.max(table.columnCount - 1, 0),
  );
  const rowOffset = table.startRow - request.startRow;
  const colOffset = Math.max(table.startColumn - request.startColumn, 0);

  // Apply the data of the column headers to the start of the table.
  if (rowOffset >= 0 && table.style.showHeaderRow) {
    const row = rowOffset;
    const parentStyle = output.style[row];
    for (let i = 0; i < endColumn - startColumn + 1; i++) {
      const col = colOffset + i;
      const header = getTableFieldOrGroupHeader(table, startColumn + i, true);
      if (!header) break;
      output.cells[row][col] = header.dataKey;
      if (parentStyle) delete parentStyle[col];
    }
  }
  loadTableCellDataForFrame(table, request, output);
};

const loadTableCellDataForFrame = (
  table: TableDescriptor,
  request: RequestDataFrameInput,
  output: RequestDataFrameOutput,
) => {
  // The row index excluding the headers.
  if (
    request.startRow > table.endRow ||
    request.startColumn > table.endColumn ||
    request.endRow < table.firstRowIndex ||
    request.endColumn < table.startColumn
  ) {
    return;
  }
  const startRow = Math.max(request.startRow - table.firstRowIndex, 0);
  const startColumn = Math.max(request.startColumn - table.startColumn, 0);
  const tableRequest: RequestDataFrameInput = {
    abortAfter: request.abortAfter,
    startRow,
    endRow: Math.min(
      Math.max(request.endRow - request.startRow + startRow, 0),
      Math.max(table.rowCount - 1, 0),
    ),
    startColumn,
    endColumn: Math.min(
      Math.max(request.endColumn - request.startColumn + startColumn, 0),
      Math.max(table.columnCount - 1, 0),
    ),
  };
  const tableResult = table.dataSource.getDataFrame(tableRequest);
  const rowOffset = Math.max(table.firstRowIndex - request.startRow, 0);
  const colOffset = Math.max(table.startColumn - request.startColumn, 0);
  for (let i = 0; i < tableResult.cells.length; i++) {
    const row = rowOffset + i;
    const cells = tableResult.cells[i];
    const styles = tableResult.style[i];
    for (let j = 0; j < cells.length; j++) {
      const col = colOffset + j;
      const style = styles?.[j];

      output.cells[row][col] = cells[j];
      if (style) {
        if (!output.style[row]) output.style[row] = [];
        const parentStyle = output.style[row][col];
        if (parentStyle) {
          Object.assign(parentStyle, style);
        } else {
          output.style[row][col] = style;
        }
      }
    }
  }
};

const shiftTableEditCell = (
  table: TableDescriptor,
  desc: EditCellDescriptor,
) => {
  if (
    desc.row < table.firstRowIndex ||
    desc.row > table.lastRowIndex ||
    desc.column < table.firstColumnIndex
  ) {
    return false;
  }

  desc.column -= table.firstColumnIndex;
  desc.row -= table.firstRowIndex;
  return true;
};

export const editTableCell = async (
  table: TableDescriptor,
  desc: EditCellDescriptor,
  replace = false,
) => {
  if (!shiftTableEditCell(table, desc)) return;
  await ensureAsync(table.dataSource.editCells([desc], replace));
};

export const editTableCells = async (
  table: TableDescriptor,
  descs: EditCellDescriptor[],
  replace = false,
) => {
  descs = descs.filter((desc) => shiftTableEditCell(table, desc));
  if (descs.length == 0) return;
  table.dataSource.editCells(descs, replace);
};

export const getCellStyleFromTable = (
  table: TableDescriptor,
  rowIndex: number,
  columnIndex: number,
) => {
  const targetRowIndex = rowIndex - table.startRow;
  const targetColumnIndex = columnIndex - table.startColumn;
  if (targetRowIndex === 0 && table.style.showHeaderRow) return;

  return table.dataSource.getCellStyle(
    targetRowIndex - (table.style.showHeaderRow ? 1 : 0),
    targetColumnIndex,
  );
};

export const getCellValueFromTable = (
  table: TableDescriptor,
  rowIndex: number,
  columnIndex: number,
) => {
  const targetRowIndex = rowIndex - table.startRow;
  const targetColumnIndex = columnIndex - table.startColumn;
  if (targetRowIndex === 0 && table.style.showHeaderRow) {
    if (targetColumnIndex === 0 && table.hasGroupsColumn) {
      return 'Groups';
    }
    return getTableFieldOrGroupHeader(table, columnIndex).dataKey;
  }
  return table.dataSource.getCellValue(
    targetRowIndex - (table.style.showHeaderRow ? 1 : 0),
    targetColumnIndex - (table.hasGroupsColumn ? 1 : 0),
  );
};

export const getCellValueFromTableById = (
  table: TableDescriptor,
  columnId: string,
  rowIndex: number,
) => {
  const targetRowIndex = rowIndex - table.startRow;
  return table.dataSource.getCellValueByColumnId?.(
    columnId,
    targetRowIndex - (table.style.showHeaderRow ? 1 : 0),
  );
};

export const getTableGroupHeader = (
  table: TableDescriptor,
  rowIndex: number,
) => {
  return table.dataSource.getTableGroupHeader(rowIndex - table.firstRowIndex);
};

export const getCellMetaFromTable = (
  table: TableDescriptor,
  rowIndex: number,
  columnIndex: number,
) => {
  const targetRowIndex = rowIndex - table.startRow;
  const targetColumnIndex = columnIndex - table.startColumn;
  return table.dataSource.getCellMeta(
    targetRowIndex - (table.style.showHeaderRow ? 1 : 0),
    targetColumnIndex,
  );
};

export const moveTableData = (
  baseDataSource: DataSourceBase,
  table: TableDescriptor,
  range: RangeDescriptor,
  baseRowOffset: number,
  baseColumnOffset: number,
) => {
  const rowIndex = table.startRow + (table.style.showHeaderRow ? 1 : 0);
  const startRow = Math.max(range.startRow - rowIndex, 0);
  const startColumn = Math.max(range.startColumn - table.startColumn, 0);
  const tableRequest: RequestDataFrameInput = {
    startRow,
    endRow: Math.min(
      Math.max(range.endRow - range.startRow + startRow, 0),
      Math.max(table.rowCount - 1, 0),
    ),
    startColumn,
    endColumn: Math.min(
      Math.max(range.endColumn - range.startColumn + startColumn, 0),
      Math.max(table.columnCount - 1, 0),
    ),
  };
  const tableResult = table.dataSource.getDataFrame(tableRequest);
  const rowOffset =
    Math.max(table.startRow - range.startRow, 0) + baseRowOffset;
  const columnOffset =
    Math.max(table.startColumn - range.startColumn, 0) + baseColumnOffset;
  const editCellDescriptors: EditCellDescriptor[] = [];

  table.dataSource.clearRange(tableRequest);
  for (let i = 0; i < tableResult.cells.length; i++) {
    const row = range.startRow + rowOffset + i;
    const cells = tableResult.cells[i];
    const styles = tableResult.style[i];
    for (let j = 0; j < cells.length; j++) {
      const column = range.startColumn + columnOffset + j;
      const style = styles?.[j];

      editCellDescriptors.push({
        row,
        column,
        value: cells[j],
        style: style,
      });
    }
  }

  if (editCellDescriptors.length > 0) {
    baseDataSource.editCells(editCellDescriptors);
  }
};

export const getTableRangeFromOutput = (
  output: RequestDataFrameOutput,
  table: TableDescriptor,
) => {
  const { range } = output;
  const tableRowIndex = table.firstRowIndex;
  const tableEndRowIndex = table.lastRowIndex;
  const tableColIndex = table.firstColumnIndex;
  const tableEndColIndex = table.endColumn;

  const startRow = Math.max(range.startRow - tableRowIndex, 0);
  const startColumn = Math.max(range.startColumn - tableColIndex, 0);
  const tableRange: TableRange = {
    startRow,
    endRow: Math.min(
      Math.max(range.endRow - range.startRow + startRow, 0),
      Math.max(tableEndRowIndex - tableRowIndex, 0),
    ),
    startColumn,
    endColumn: Math.min(
      Math.max(range.endColumn - range.startColumn + startColumn, 0),
      Math.max(tableEndColIndex - tableColIndex, 0),
    ),
    skippedRows: [],
    skippedColumns: [],
    loadSummary: table.style.showTotalRow && range.endRow >= table.endRow,
    dataOffset: {
      row: Math.max(table.firstRowIndex - range.startRow, 0),
      col: Math.max(table.firstColumnIndex - range.startColumn, 0),
    },
    offset: {
      row: Math.max(table.startRow - range.startRow, 0),
      rowEnd: Math.max(table.startRow - range.endRow, 0),
      col: Math.max(table.startColumn - range.startColumn, 0),
    },
    visibleRowCount: 0,
    visibleColumnCount: 0,
    visibility: {
      headerRow:
        range.startRow <= table.indexes.headerRow &&
        range.endRow >= table.indexes.headerRow,
      totalRow:
        range.startRow <= table.indexes.totalRow &&
        range.endRow >= table.indexes.totalRow,
      groupHeaderColumn:
        range.startColumn <= table.indexes.groupHeaderColumn &&
        range.endColumn >= table.indexes.groupHeaderColumn,
    },
  };

  tableRange.visibleRowCount =
    range.startRow > tableEndRowIndex || range.endRow < tableRowIndex
      ? 0
      : tableRange.endRow - tableRange.startRow + 1;
  tableRange.visibleColumnCount =
    range.startColumn > tableEndColIndex || range.endColumn < tableColIndex
      ? 0
      : tableRange.endColumn - tableRange.startColumn + 1;

  applySkippedRanges(range, table, tableRange, true);
  applySkippedRanges(range, table, tableRange, false);

  return tableRange;
};

export const loadTableDataOnToOuput = (
  abortAfter: number,
  output: RequestDataFrameOutput,
  table: TableDescriptor,
) => {
  const { range } = output;
  if (
    range.startRow > table.endRow ||
    range.startColumn > table.endColumn ||
    range.endRow < table.startRow ||
    range.endColumn < table.startColumn
  ) {
    return;
  }

  const tableRange = getTableRangeFromOutput(output, table);
  if (
    (tableRange.visibleRowCount <= 0 || tableRange.visibleColumnCount <= 0) &&
    !tableRange.visibility.headerRow &&
    !tableRange.visibility.totalRow &&
    !tableRange.visibility.groupHeaderColumn
  ) {
    return;
  }

  const result = table.dataSource.getDataFrame(tableRange);

  if (result.groups) {
    if (!output.tableGroups) output.tableGroups = {};
    output.tableGroups[table.name] = [...result.groups];
  }

  // Load the total row and the table header row if they are visible.
  if (
    tableRange.visibleColumnCount > 0 &&
    (tableRange.visibility.headerRow || tableRange.visibility.totalRow)
  ) {
    if (tableRange.visibility.headerRow) {
      // Apply the data of the column headers to the start of the table.
      const parentStyle = output.style[tableRange.offset.row];
      const { offset } = tableRange;
      for (let i = 0; i < result.columns.length; i++) {
        const col = tableRange.dataOffset.col + i;
        const header = result.columns[i];

        output.cells[offset.row][col] = header.title || header.dataKey;
        if (parentStyle) delete parentStyle[col];
      }
    }

    if (tableRange.visibility.totalRow) {
      const { offset } = tableRange;
      const targetIndex = range.endRow - range.startRow;
      let outputPos = offset.rowEnd + targetIndex;
      for (const [start, end] of range.skippedRows) {
        if (start > targetIndex) break;
        outputPos -= Math.min(targetIndex, end) - start + 1;
      }
      const targetValues = output.cells[outputPos];
      let targetStyles = output.style[outputPos];
      if (!targetStyles) {
        targetStyles = [];
        output.style[outputPos] = [];
      }

      // Make the summary data available to the parent data source.
      if (!output.tableSummaryData) output.tableSummaryData = {};
      output.tableSummaryData[table.name] = result.summaryData;

      for (let i = 0; i < result.columns.length; i++) {
        const targetColumnPos = tableRange.dataOffset.col + i;
        targetValues[targetColumnPos] = result.summaryData[i]?.data;
      }
    }
  }

  // If the range is displaying data from table, load it.
  if (tableRange.visibleRowCount > 0 && tableRange.visibleColumnCount > 0) {
    const { dataOffset: offset } = tableRange;

    for (let i = 0; i < result.cells.length; i++) {
      const row = offset.row + i;
      const cells = result.cells[i];
      const styles = result.style[i];
      const meta = result.meta[i];
      const group = result.groups?.[i];

      for (let j = 0; j < result.columns.length; j++) {
        const col = offset.col + j;
        if (group?.hasSummaryData) {
          output.cells[row][col] =
            group.summaryData[result.columns[j].id]?.data;
          continue;
        }

        let parentStyle: Partial<CellStyleDeclaration> | undefined;
        const style = styles?.[j];

        if (cells[j] !== undefined) output.cells[row][col] = cells[j];
        if (meta[j] !== undefined) output.meta[row][col] = meta[j];
        if (parentStyle || style) {
          if (!output.style[row]) output.style[row] = [];
          // INFO: Don't apply the parent style. At least not from the cell
          // that is being covered.

          // Make sure parent style is always an object. Fix the error
          // when there is custom style but not parentStyle
          parentStyle = parentStyle || {};

          //const parentStyle = output.style[row][col];
          output.style[row][col] = Object.assign(parentStyle, style);
        }
      }
    }
  }

  if (
    table.hasGroupsColumn &&
    tableRange.visibility.headerRow &&
    tableRange.visibility.groupHeaderColumn
  ) {
    output.cells[tableRange.offset.row][tableRange.offset.col] =
      table.dataSource
        .getGroups()
        .map((group) => table.dataSource.getHeaderById(group.columnId).title)
        .join(' > ');
  }

  // Load the group header if the groups are enabled.
  if (
    tableRange.visibility.groupHeaderColumn &&
    tableRange.visibleRowCount > 0 &&
    result.groups
  ) {
    const groups = result.groups;
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      if (!group) continue;

      const row = tableRange.dataOffset.row + i;
      const col = tableRange.offset.col;

      if (group.rowType !== 'data' && group.rowType !== 'total') {
        const { dataType } = group;
        let formattingType = dataType;
        if (
          typeof formattingType === 'object' &&
          (formattingType.typeId === DataType.Timestamp ||
            formattingType.typeId === DataType.DateTime)
        ) {
          formattingType = 'date';
        }
        const formattedValue = formatTableCellValue(
          group.data,
          formattingType,
          undefined,
          { isRoot: true },
        );
        output.cells[row][col] =
          formattedValue + ` (${group.rowCount.toLocaleString('en-US')})`;
      } else {
        output.cells[row][col] = '';
      }
    }
  }
};

export const getDefaultAggreationFnForColumnType = (
  columnType: ColumnType,
): AggregationFnType | undefined => {
  if (
    columnType === 'number' ||
    columnType === 'int' ||
    columnType === 'float'
  ) {
    return 'Sum';
  }
};

/**
 * Returns the string version of the table's anchor cell, e.g., B10 for a table
 * on row 9 and column 1 indexes.
 * @param table
 * @returns The string representation of the anchor cell of the table.
 */
export const getAnchorCellStringFromTable = (table: TableDescriptor) => {
  return integerToAlpha(table.startColumn).toUpperCase() + (table.startRow + 1);
};

/**
 * Parses the range input and returns the cell index if it can be used for
 * table anchor cell value, e.g., B10 will produce:
 *
 * ```
 * { rowIndex: 9, columnIndex: 1 }
 * ```
 * @param value Similar to 'C22'.
 * @returns The cell index or undefined if the parse operation fails.
 */
export const getAnchorCellIndexFromTable = (
  value: string,
): CellIndex | undefined => {
  const selection = getSelectionFromRange(value?.trim().toUpperCase(), true);
  if (
    !selection ||
    selection.type !== SelectionType.Cells ||
    selection.startRow !== selection.endRow ||
    selection.startColumn !== selection.endColumn
  ) {
    return;
  }

  return { rowIndex: selection.startRow, columnIndex: selection.startColumn };
};

/**
 * Returns the header describing a field or a pseudo-header describing the
 * group(s) when enabled.
 * @param table
 * @param columnViewIndex
 * @param isTableIndex When true, uses the column index as the table index
 *  instead of where the table is on the data source.
 * @returns The field/group header or undefined if the index is out of bounds.
 */
export const getTableFieldOrGroupHeader = (
  table: TableDescriptor,
  columnViewIndex: number,
  isTableIndex = false,
): GridHeader | undefined => {
  if (
    table.hasGroupsColumn &&
    columnViewIndex - (isTableIndex ? 0 : table.startColumn) === 0
  ) {
    const groupsTitle = table.dataSource
      .getGroups()
      .map((group) => table.dataSource.getHeaderById(group.columnId).dataKey)
      .join(' > ');
    return {
      type: 'string',
      dataKey: '__dd_table_group_header',
      id: '__dd_table_group_header',
      columnViewIndex: 0,
      columnIndex: 0,
      originalColumnIndex: 0,
      title: groupsTitle,
    };
  }

  return table.dataSource.getHeader(
    columnViewIndex -
      (table.hasGroupsColumn ? 1 : 0) -
      (isTableIndex ? 0 : table.startColumn),
  );
};

/**
 * @todo Check for the column type and produce the result accordingly.
 *
 * @param header That defines what type of summary function is being used.
 * @returns The summary function.
 */
export const getTableSummaryFn = (
  header: GridHeader,
): TableSummaryFn | undefined => {
  if (header.aggregationFn === null) {
    return;
  } else if (header.aggregationFn === undefined) {
    if (typeof header.type === 'string') {
      switch (header.type) {
        case 'int':
        case 'float':
        case 'number':
          return TABLE_SUMMARY_FN_NUMB_SUM;
        case 'boolean':
          return TABLE_SUMMARY_FN_BOOL_PERCENT_TRUE;
      }
    } else if (typeof header.type === 'object') {
      switch (header.type.typeId) {
        case DataType.Decimal:
        case DataType.Float:
          return TABLE_SUMMARY_FN_NUMB_SUM;
      }
    }
    return;
  }

  return getAggregationFnByName(header.aggregationFn);
};

export const toggleTableGroup = async (
  table: TableDescriptor,
  groupHeader: TableGroupHeader,
) => {
  const groups = table.dataSource.getGroups();
  const data = groups[groupHeader.level];
  if (!data) {
    console.error('Group not found at level', groupHeader.level);
    return;
  }

  const index = findTableGroupFilterIndex(groups, groupHeader);
  if (index === -1) {
    data.collapsedValues.push([...groupHeader.filterValues]);
    // Remove the subgroups that were previously collapsed.
    for (let i = groupHeader.level + 1; i < groups.length; i++) {
      const subgroup = groups[i];
      subgroup.collapsedValues = subgroup.collapsedValues.filter(
        (collapsed) => {
          for (let i = 0; i < groupHeader.filterValues.length; i++) {
            if (collapsed[i] !== groupHeader.filterValues[i]) {
              return true;
            }
          }
          return false;
        },
      );
    }
  } else {
    data.collapsedValues.splice(index, 1);
  }

  await table.dataSource.setGroups(groups);
};

const findTableGroupFilterIndex = (
  groupData: DataGroup[],
  groupHeader: TableGroupHeader,
): number => {
  const data = groupData[groupHeader.level];
  if (data) {
    let matches = false;
    for (let i = 0; i < data.collapsedValues.length; i++) {
      const collapsedValues = data.collapsedValues[i];
      if (collapsedValues.length !== groupHeader.filterValues.length) continue;
      matches = true;
      for (let j = 0; j < collapsedValues.length; j++) {
        if (collapsedValues[j] !== groupHeader.filterValues[j]) {
          matches = false;
          break;
        }
      }
      if (matches) return i;
    }
  }

  return -1;
};

export const isTableGroupFiltered = (
  groupData: DataGroup[],
  groupHeader: TableGroupHeader,
) => {
  return findTableGroupFilterIndex(groupData, groupHeader) !== -1;
};

export const createTableContext = (
  source: CellSource,
): CellTableContext | undefined => {
  const { table } = source;
  if (!table || table.isSpilling) return;

  const header = getTableFieldOrGroupHeader(table, source.header.columnIndex);
  const rowIndex = source.rowOrderIndex;
  const columnIndex = source.columnOrderIndex;

  let isTotalRow =
    !table.hasGroupsColumn &&
    table.style.showTotalRow &&
    table.endRow === rowIndex;
  let isSubtotalRow = false;
  let groupContext: CellTableGroupContext | undefined;
  let summaryContext: TableSummaryContext | undefined;
  if (table.hasGroupsColumn) {
    const { tableGroupHeader } = source;
    const isHeaderColumn = table.indexes.groupHeaderColumn === columnIndex;
    const isTopHeaderColumn =
      table.indexes.groupHeaderColumn === columnIndex &&
      (table.indexes.headerRow === rowIndex ||
        source.header.style === 'columnHeaderCell') &&
      table.style.showHeaderRow;
    groupContext = {
      header: tableGroupHeader,
      isTopHeaderColumn,
      isHeaderColumn,
    };

    isSubtotalRow =
      !isHeaderColumn &&
      table.indexes.headerRow !== rowIndex &&
      tableGroupHeader?.hasSummaryData;
    isTotalRow =
      !isHeaderColumn &&
      !isTopHeaderColumn &&
      (isTotalRow ||
        (tableGroupHeader?.rowType === 'total' && !isHeaderColumn));

    if (isTotalRow || isSubtotalRow) {
      const summaryData = tableGroupHeader.summaryData[header.id];
      if (summaryData) {
        summaryContext = summaryData;
      }
    }
  } else if (isTotalRow && source.tableSummaryContext) {
    summaryContext = source.tableSummaryContext;
  }

  return {
    header,
    hasResizeHandle:
      !table.isSpilling &&
      !table.isReadOnly &&
      table.endRow === rowIndex &&
      table.endColumn === columnIndex,
    isTotalRow,
    isSubtotalRow,
    summaryContext,
    groupContext,
  };
};
