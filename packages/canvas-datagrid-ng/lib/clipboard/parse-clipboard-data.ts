import { fillArray, findConsequentEmptyItemInArray } from '../utils/array';

type ParsedTableItem = {
  value: { value: string }[];
  rowSpan: number;
  columnSpan: number;
};
export type ParsedTableData = ParsedTableItem[][];

export type SanitizedRowItem = ParsedTableItem & {
  rowOffset: number;
  columnOffset: number;
};
export type SanitizedRowsData = {
  data: SanitizedRowItem[][];
  rowsOffset: number;
  colsSpannedLength: number;
};

export enum GuessMergingCellStrategy {
  None = 0,
  ColumnSpanFirst = 1,
  RowSpanFirst = 2,
}

/**
 * Explanation of nodeType here:
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
 */
const IGNORE_NODETYPES = [8, 3]; // '#text' and '#comment'

function isHtmlTable(pasteValue: string) {
  return /(?:<table[^>]*>)|(?:<tr[^]*>)/i.test(pasteValue);
}

function sanitizeElementData(htmlNode) {
  // It is not entirely clear if this check on nodeType is required.
  const elementData =
    htmlNode.nodeType === 1 ? htmlNode.innerText : htmlNode.data;
  return String(elementData).replace(/\s+/g, ' ').trim();
}

export const parseClipboardData = function (
  data: string,
  mimeType: string,
): ParsedTableData {
  if (mimeType === 'text/html' && isHtmlTable(data)) {
    return parseHtmlTableFromClipboard(data);
  } else if (mimeType === 'text/html') {
    return parseHtmlTextFromClipboard(data);
  }

  // Default data format is string, so split on new line,
  // and then enclose in an array (a row with one cell):
  return parseText(data);
};

/**
 * Parse Tab-separated values
 * @param guessMergingCell Guess merging cells from their neighbor cells
 */
const parseText = function (
  data: string,
  guessMergingCell = GuessMergingCellStrategy.None,
): ParsedTableData {
  const rows = data.split('\n').map((row) => row.split('\t'));

  const result: ParsedTableData = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++)
    result[rowIndex] = [];

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const rowInResult = result[rowIndex];

    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      // If it is null it means this cell has been handle
      // This situation happens after handled the cell with more than 1 row span
      if (rowInResult[colIndex] === null) continue;

      const cellText = row[colIndex];

      const cell: ParsedTableItem = {
        value: [{ value: cellText }],
        rowSpan: 1,
        columnSpan: 1,
      };
      rowInResult[colIndex] = cell;
      if (!guessMergingCell) continue;

      // guess the column span from the current row
      let finalColumnSpan =
        findConsequentEmptyItemInArray(row, colIndex + 1) + 1;
      for (let rowIndex2 = rowIndex + 1; rowIndex2 < rows.length; rowIndex2++) {
        const columnSpan = findConsequentEmptyItemInArray(
          rows[rowIndex2],
          colIndex,
        );
        if (columnSpan <= 0) break;
        if (columnSpan < finalColumnSpan) {
          if (guessMergingCell === GuessMergingCellStrategy.RowSpanFirst)
            finalColumnSpan = columnSpan;
          else break;
        }
        cell.rowSpan++;
      }
      cell.columnSpan = finalColumnSpan;

      if (cell.columnSpan > 1 || cell.rowSpan > 1) {
        for (
          let rowIndexOffset = 0;
          rowIndexOffset < cell.rowSpan;
          rowIndexOffset++
        ) {
          fillArray(
            result[rowIndex + rowIndexOffset],
            null,
            colIndex,
            finalColumnSpan,
          );
        }
        rowInResult[colIndex] = cell;
        colIndex += cell.columnSpan - 1;
      }
    }
  }
  return result;
};

export const parseHtmlTextFromClipboard = function (data: string) {
  const doc = new DOMParser().parseFromString(data, 'text/html');
  const element = doc.querySelector('div') || doc.querySelector('span');
  const elementData = sanitizeElementData(element);

  return parseText(elementData);
};

export const parseHtmlTableFromClipboard = function (
  data: string,
): ParsedTableData {
  const doc = new DOMParser().parseFromString(data, 'text/html');
  const trs = Array.from(doc.querySelectorAll('table tr'));
  const rows: ParsedTableItem[][] = [];

  let rowIndex = 0,
    columnsLength = 0,
    columnIndex = 0;

  for (const tr of trs) {
    const children = tr.children;
    let rowHasValidChild = false;

    for (const child of Array.from(children)) {
      if (!child || IGNORE_NODETYPES.includes(child.nodeType)) continue;
      rowHasValidChild = true;

      const col: ParsedTableItem = { value: [], rowSpan: 1, columnSpan: 1 };
      const value = sanitizeElementData(child);

      if (child.hasAttribute('colspan'))
        col.columnSpan = parseInt(child.getAttribute('colspan'));

      if (child.hasAttribute('rowspan'))
        col.rowSpan = parseInt(child.getAttribute('rowspan'));

      if (rowIndex === 0) columnsLength += col.columnSpan;

      for (let i = 0; i < col.rowSpan; i++) {
        if (rows[rowIndex + i] === undefined) rows[rowIndex + i] = [];

        if (rows[rowIndex][columnIndex] === null) {
          for (let k = columnIndex; rows[rowIndex][k] !== undefined; k++) {
            columnIndex++;
          }
        }

        for (let j = 0; j < col.columnSpan; j++) {
          rows[rowIndex + i][columnIndex + j] = i === 0 && j === 0 ? col : null;
        }
      }

      columnIndex += col.columnSpan;

      if (value) col.value.push({ value });
    }

    while (
      rows[rowIndex] !== undefined &&
      rows[rowIndex].length >= columnsLength
    ) {
      if (rowHasValidChild) rowIndex++;
      columnIndex = 0;

      let found = false;
      if (rows[rowIndex] !== undefined) {
        for (let col = 0; col < columnsLength; col++) {
          if (rows[rowIndex][col] === undefined) {
            columnIndex = col;
            found = true;
            break;
          }
        }
      }

      if (found) break;
    }
  }
  return rows;
};
