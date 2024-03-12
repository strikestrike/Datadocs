import { DrawingStatus } from '../../types/drawing';
import type { CellLinkedNode, CellSource } from '../../types/drawing';
import type { GridPrivateProperties } from '../../types/grid';
import { getSingleRowDataForRendering } from '../get-data';
import { CellCreator } from '../cell-creator';
import type { CellCreationContext } from '../cell-creator/context';
import type { DrawFrameCache } from '../frame-cache';
import { CellDerivedPropsCreator } from '../cell-creator/derived-props-creator';
import { CellTextUtils } from '../cell-creator/cell-text';
import type { CellStyleDeclaration } from '../../types';

export class CellListCreator {
  readonly minRows = 50;
  readonly minColumns = 50;
  /**
   * Number of column to check text overflowing
   */
  readonly maxOverflowingColumns = 10;

  readonly cellCreator: CellCreator;
  readonly derivedPropsCreator: CellDerivedPropsCreator;
  constructor(
    readonly self: GridPrivateProperties,
    readonly frameCache: DrawFrameCache,
  ) {
    this.cellCreator = new CellCreator(self, frameCache);

    const cellTextUtils = new CellTextUtils(self, frameCache, this.cellCreator);
    this.derivedPropsCreator = new CellDerivedPropsCreator(cellTextUtils);
  }

  /**
   * Create a cell list for a given row in a given context and link the cells
   * inside of it as siblings.
   *
   * The last cell on the row will either be the first one that exceeds the
   * canvas width, or the one that comes before.
   * {@link CellCreationContext.untilColumnIndex}.
   *
   * If the `upperNode` is provided, it will be iterated over and its cells
   * will be assigned as upper siblings to individual cells.
   * @param context
   * @param rowIndex
   * @param rowOrderIndex
   * @param [upperNode] The previous row to link as upper sibling.
   * @returns The first node of the row.
   */
  readonly createCellListForRow = (
    context: CellCreationContext,
    rowIndex: number,
    rowOrderIndex: number,
    upperNode?: CellLinkedNode,
  ): CellLinkedNode => {
    const { self } = this;
    let rootNode: CellLinkedNode | undefined;
    let curNode: CellLinkedNode | undefined;

    const rowHeight = self.dp(self.getRowHeight(rowOrderIndex));
    const startX = context.nextX;
    const startY = context.nextY;

    let partialRow = getSingleRowDataForRendering(
      self.dataSource,
      rowOrderIndex,
      context.startColumnIndex,
      Math.min(
        context.startColumnIndex + this.minColumns,
        context.untilColumnIndex - 1,
      ),
    );
    for (
      let columnOrderIndex = context.startColumnIndex;
      columnOrderIndex < context.untilColumnIndex;
      columnOrderIndex += 1
    ) {
      if (partialRow.values.length === 0) {
        const startColumn = columnOrderIndex;
        let endColumn = Math.min(
          columnOrderIndex + this.minColumns,
          context.untilColumnIndex - 1,
        );
        if (endColumn < startColumn) endColumn = startColumn;
        partialRow = getSingleRowDataForRendering(
          self.dataSource,
          rowOrderIndex,
          startColumn,
          endColumn,
        );
      }
      const { tables, mergedCells } = partialRow;
      const headerIndex = columnOrderIndex;
      const header = partialRow.columns.shift();
      const cellValue = partialRow.values.shift();
      const customStyle = partialRow.styles.shift();
      const cellMeta = partialRow.meta.shift();

      const columnWidth = self.dp(self.getColumnWidth(headerIndex));
      const table = tables?.get(rowOrderIndex, header.columnIndex);
      const tableGroupHeader = table && partialRow.tableGroups[table.name]?.[0];
      const tableSummaryContext =
        table && partialRow.tableSummaryData[table.name]?.shift();

      const nextCell: CellLinkedNode = {
        source: {
          cellValue,
          cellMeta,
          customStyle,
          rowOrderIndex,
          rowIndex,
          header,
          headerIndex,
          columnOrderIndex,
          rowHeight,
          columnWidth,
          mergedCell: mergedCells?.get(rowOrderIndex, header.columnIndex),
          table,
          tableGroupHeader,
          tableSummaryContext,
        },
        prevSibling: curNode,
        upperSibling: upperNode,
      };
      if (upperNode) {
        upperNode.lowerSibling = nextCell;
        upperNode = upperNode.nextSibling;
      }
      this.cellCreator.createCell(context, nextCell);
      if (!rootNode) {
        // Get the first overflowing cell and assign it as the first node if the
        // cell has not content, and there is a possible overflowing cell.
        const { startOverflowNode, endOverflowNode } =
          this.getLeftCellsWithOverflowingText(
            rowIndex,
            columnOrderIndex,
            startX,
            startY,
          );
        if (startOverflowNode && endOverflowNode) {
          endOverflowNode.nextSibling = nextCell;
          nextCell.prevSibling = endOverflowNode;
          rootNode = startOverflowNode;
        }

        // The content has content, or there wasn't an overflowing cell, so just
        // assign the default cell as the first node.
        if (!rootNode) rootNode = nextCell;
      }
      if (curNode) {
        curNode.nextSibling = nextCell;
      }
      curNode = nextCell;

      if (context.nextX > self.width) {
        const { startOverflowNode, endOverflowNode } =
          this.getRightCellsWithOverflowingText(
            rowIndex,
            columnOrderIndex + 1,
            context.nextX,
            context.nextY,
          );
        if (startOverflowNode && endOverflowNode) {
          startOverflowNode.prevSibling = nextCell;
          nextCell.nextSibling = startOverflowNode;
        }
        break;
      }
    }

    // Format the cell texts.  We are doing this here because the contents of
    // the cells may be in relation with other cells, so we generate the cells
    // first.
    this.derivedPropsCreator.calculateRelationalCellDataList(rootNode);

    context.nextY += rowHeight;

    rootNode.source.rowHeaderText = partialRow.rowHeader?.toString() || '-';
    return rootNode;
  };

  /**
   * Create column headers using the normal cells.
   * @param cellNode The normal cells tied together as siblings
   * @returns The resulting columns headers.
   * @see createColumnHeadersWithCache
   */
  readonly createColumnHeaders = (cellNode: CellLinkedNode): CellLinkedNode => {
    if (!cellNode) return undefined;
    let rootNode: CellLinkedNode | undefined;
    let curNode: CellLinkedNode | undefined;

    while (cellNode) {
      const prevNode = curNode;
      curNode = this.cellCreator.createColumnHeader(cellNode);
      if (!rootNode) {
        rootNode = curNode;
      }
      if (prevNode) {
        prevNode.nextSibling = curNode;
        curNode.prevSibling = prevNode;
      }

      cellNode = cellNode.nextSibling;
    }
    this.derivedPropsCreator.calculateRelationalCellDataList(rootNode);
    return rootNode;
  };

  /**
   * Create row headers using normal cells.
   * @param {CellLinkedNode[]} rows Whose first nodes are used to create row headers.
   * @returns {CellLinkedNode[]} The resulting row headers.
   * @see createRowHeadersWithCache
   */
  readonly createRowHeaders = (rows: CellLinkedNode[]) => {
    if (!rows || !rows.length) return [];
    let upperNode: CellLinkedNode | undefined;
    const nodes = rows.map((row) => {
      const header = this.cellCreator.createRowHeader(row);
      if (upperNode) {
        upperNode.lowerSibling = header;
        header.upperSibling = upperNode;
      }
      upperNode = header;
      return header;
    });
    for (const node of nodes) {
      this.derivedPropsCreator.calculateRelationalCellDataList(node);
    }
    return nodes;
  };

  /**
   * @deprecated Draw merged cells together with other cells to preserve the
   * layout order.
   *
   * Create merged cells that visible but are not so due to scroll position,
   * meaning this will look for merged cells that are partly visible create
   * the list that contains the intermediate so that they are drawable.
   * @param rows To find the invisible merged base cells for.
   * @returns The array of rows with base cells or undefined if there is no base cell needing drawing.
   */
  readonly createInvisibleMergedCells = (rows: CellLinkedNode[]) => {
    const { self } = this;
    if (rows.length <= 0 || !rows[0]) return;

    const firstNode = rows[0];
    let lastNode = rows[rows.length - 1];
    while (lastNode.nextSibling) {
      lastNode = lastNode.nextSibling;
    }

    const firstCell = firstNode.cell;
    const lastCell = lastNode.cell;
    const startX = firstCell.x;
    const startY = firstCell.y;
    let startRowIndex = firstCell.rowIndex;
    let startColumnIndex = firstCell.columnIndex;

    const updateIndexes = (targetNode: CellLinkedNode) => {
      const { source, cell } = targetNode;
      const { mergedCell } = source;
      if (!mergedCell) return;

      if (mergedCell.startRow < cell.rowIndex) {
        startRowIndex = Math.min(startRowIndex, mergedCell.startRow);
      }
      if (mergedCell.startColumn < cell.columnIndex) {
        startColumnIndex = Math.min(startColumnIndex, mergedCell.startColumn);
      }
    };

    let node = rows[0];
    while (node) {
      updateIndexes(node);
      node = node.nextSibling;
    }
    for (const node of rows) {
      updateIndexes(node);
    }

    // If there is no descrease in the start indexes, consider that there is
    // not unvisible merged cell that should be and return.
    if (
      startRowIndex >= firstCell.rowIndex &&
      startColumnIndex >= firstCell.columnIndex
    ) {
      return;
    }

    const hexpand = startColumnIndex < firstCell.columnIndex;
    const vexpand = startRowIndex < firstCell.rowIndex;
    let xOffset = 0;
    let yOffset = 0;

    // Find the offsets the merged base cells that need drawing.
    if (vexpand) {
      for (let row = startRowIndex; row < firstCell.rowIndex; row++) {
        yOffset += self.dp(this.frameCache.getCellHeight(row));
      }
    }
    if (hexpand) {
      for (let col = startColumnIndex; col < firstCell.columnIndex; col++) {
        xOffset += self.dp(this.frameCache.getCellWidth(col));
      }
    }

    // Create a context for the base cells to be drawn and offset them so that
    // they end up in the right place.
    //
    // If both rows and column need expanding, set the last index to the
    // indexes of the last node. If only one of the sides needs expanding use
    // the start indexes instead.
    const expandingContext: CellCreationContext = {
      startRowIndex: startRowIndex,
      startColumnIndex: startColumnIndex,
      untilRowIndex: hexpand ? lastCell.rowIndex : firstCell.rowIndex,
      untilColumnIndex: vexpand ? lastCell.columnIndex : firstCell.columnIndex,
      nextX: startX - xOffset,
      nextY: startY - yOffset,
    };

    const expandingNodes = this.createCellList(expandingContext);
    if (expandingNodes.length <= 0 || !expandingNodes[0]) return;

    for (let node of expandingNodes) {
      while (node) {
        const { cell } = node;
        // Skip the drawing of cells that are not merged or are inside the
        // visible area.
        if (
          !cell.mergedCell ||
          !cell.isBaseMergedCell ||
          cell.x + cell.width < startX ||
          cell.y + cell.height < startY ||
          (cell.rowIndex >= firstCell.rowIndex &&
            cell.columnIndex >= firstCell.columnIndex)
        ) {
          node.cell.drawingStatus = DrawingStatus.SkipNotDrawn;
        } else {
          node.cell.drawingStatus = DrawingStatus.PendingRedraw;
        }

        node = node.nextSibling;
      }
    }
    return expandingNodes;
  };

  /**
   * Create cell list for a given context.
   *
   * The last column and row will be the first ones that exceed the canvas
   * width and height if the context is not already limiting or limited
   * indexes are beyond the canvas width or height.
   *
   * The resulting cells will be tied together as upper, lower, previous, and
   * next siblings.
   * @param {CellCreationContext} context
   * @returns {CellLinkedNode[]} The array of rows.
   * @see createCellListWithCache
   * @see drawCellList
   */
  createCellList = (context: CellCreationContext) => {
    if (context.untilRowIndex <= 0 || context.untilColumnIndex <= 0) {
      return [];
    }

    const { self } = this;
    const { dataSourceState } = this.frameCache;
    const { rows: rowsCount, cols: colsCount } = dataSourceState;
    const resultLists = [] as CellLinkedNode[];

    if (!context.untilRowIndex || context.untilRowIndex > rowsCount) {
      context.untilRowIndex = rowsCount;
    }
    if (!context.untilColumnIndex || context.untilColumnIndex > colsCount) {
      context.untilColumnIndex = colsCount;
    }

    const initialX = context.nextX;
    let upperNode: CellLinkedNode | undefined;

    for (
      let rowIndex = context.startRowIndex;
      rowIndex < context.untilRowIndex;
      rowIndex++
    ) {
      const rowOrderIndex = rowIndex;
      const hiddenRange =
        self.dataSource.positionHelper.getHidingRange(rowIndex);
      if (hiddenRange) {
        rowIndex = Math.min(hiddenRange.end, context.untilRowIndex);
        continue;
      }
      if (
        self.cellTree.rows.length > 0 &&
        Object.keys(self.cellTree.rows[rowOrderIndex]).length > 0 &&
        self.cellTree.rows[rowOrderIndex].hide
      ) {
        continue;
      }

      context.nextX = initialX;
      const node = this.createCellListForRow(
        context,
        rowIndex,
        rowOrderIndex,
        upperNode,
      );
      upperNode = node;
      // Shift the upper node if its first node is invisible so that we don't
      // disrupt the order of the cells.
      if (upperNode?.source?.isLeftOverflowingInvisibleCell) {
        upperNode = upperNode.nextSibling;
      }
      if (node) resultLists.push(node);

      if (context.nextY >= this.frameCache.height) break;
    }

    return resultLists;
  };

  /**
   * Finds and returns cells on the right with overflowing text. It could be the
   * fist overflowing cell or multiple text-rotation cell
   * @param rowIndex To look for the cell.
   * @param columnIndex To start going left from.
   * @param startX Where to start offsetting the new cell on X-axis.
   * @param startY Where the new cell going to reside on Y-axis.
   * @returns
   */
  private readonly getLeftCellsWithOverflowingText = (
    rowIndex: number,
    columnIndex: number,
    startX: number,
    startY: number,
  ) => {
    const { self } = this;
    if (columnIndex <= 0) {
      return { startOverflowNode: undefined, endOverflowNode: undefined };
    }

    // Rotation text content can be drawn on other cells without knowing
    // if the cell is empty or not, so we need to get all rotation cells
    // on the left
    let startNode: CellLinkedNode;
    let endNode: CellLinkedNode;
    let findOverflowCell = true;

    function addPrevNode(node: CellLinkedNode) {
      if (endNode) {
        node.nextSibling = startNode;
        startNode.prevSibling = node;
        startNode = node;
      } else {
        startNode = endNode = node;
      }
    }

    // Look for a cell with overflowing text on the left.
    for (
      let i = 0, index = columnIndex - 1;
      i <= this.maxOverflowingColumns && index >= 0;
      i++, index--
    ) {
      const rowData = self.dataSource.getCellValue(rowIndex, index);
      if (!rowData || rowData.length <= 0) {
        // The cell is empty, ignore it
        continue;
      }

      const header = self.dataSource.getHeader(index);
      const mode = header.wrapMode ?? self.style.cellWrapMode;
      const cellCustomStyle: CellStyleDeclaration =
        self.dataSource.getCellStyle(rowIndex, index);
      const textRotation = cellCustomStyle?.textRotation;

      if (textRotation) {
        if (self.checkCellStackVerticallyStyle(textRotation)) {
          // Stack vertically style is part of Text-rotation style but its text
          // never goes outside the cell area. So it's safe to ignore those cells.
          continue;
        }

        let x = startX;
        for (let i = index; i < columnIndex; i++) {
          x -= self.dp(this.frameCache.getCellWidth(i));
        }

        // Create a singular cell if this cell possibly overflowing.
        const newNode = this.cellCreator.createSingularCell(
          rowIndex,
          index,
          x,
          startY,
          { isLeftOverflowingInvisibleCell: true },
        );

        const cell = newNode.cell;
        if (!cell.isEmpty) {
          // No need find other overflow cells on the left if already found non-empty cell
          findOverflowCell = false;

          if (
            cell.horizontalAlignment === 'left' ||
            cell.horizontalAlignment === 'center'
          ) {
            // Rotation text can be overflowed on neighbor cells
            addPrevNode(newNode);
          }
        }
      } else if (findOverflowCell && mode === 'overflowing') {
        // Offset the X-axis.
        const originalColumnWidth = self.dp(
          this.frameCache.getCellWidth(index),
        );
        let x = startX;
        for (let i = index; i < columnIndex; i++) {
          x -= self.dp(this.frameCache.getCellWidth(i));
        }

        // Expand the width since the intermediate cells may not be present.
        const extras: Partial<CellSource> = {
          columnWidth: startX - x,
          originalColumnWidth,
          isLeftOverflowingInvisibleCell: true,
        };

        // Create a singular cell if this cell possibly overflowing.
        const newNode = this.cellCreator.createSingularCell(
          rowIndex,
          index,
          x,
          startY,
          extras,
        );

        if (!newNode.cell.isEmpty) {
          // No need find other overflow cells on the left if already found it
          findOverflowCell = false;
          addPrevNode(newNode);
        }
      }
    }

    return { startOverflowNode: startNode, endOverflowNode: endNode };
  };

  /**
   * Finds and returns cells on the right with overflowing text. It could be the
   * fist overflowing cell or multiple text-rotation cell
   * @param rowIndex To look for the cell.
   * @param columnIndex To start going right from.
   * @param startX Where to start offsetting the new cell on X-axis.
   * @param startY Where the new cell going to reside on Y-axis.
   * @returns
   */
  private readonly getRightCellsWithOverflowingText = (
    rowIndex: number,
    columnIndex: number,
    startX: number,
    startY: number,
  ) => {
    const { self } = this;

    // Rotation text content can be drawn on other cells without knowing
    // if the cell is empty or not, so we need to get all rotation cells
    // on the left
    let startNode: CellLinkedNode;
    let endNode: CellLinkedNode;
    let findOverflowCell = true;

    function addNextNode(node: CellLinkedNode) {
      if (startNode) {
        node.prevSibling = endNode;
        endNode.nextSibling = node;
        endNode = node;
      } else {
        startNode = endNode = node;
      }
    }

    // Look for a cell with overflowing text on the right.
    for (
      let i = 0, index = columnIndex;
      i <= this.maxOverflowingColumns && index >= 0;
      i++, index++
    ) {
      const rowData = self.dataSource.getCellValue(rowIndex, index);

      if (!rowData || rowData.length <= 0) {
        // The cell is empty, ignore it
        continue;
      }

      const header = self.dataSource.getHeader(index);
      const mode = header.wrapMode ?? self.style.cellWrapMode;
      const cellCustomStyle: CellStyleDeclaration =
        self.dataSource.getCellStyle(rowIndex, index);
      const textRotation = cellCustomStyle?.textRotation;

      if (textRotation) {
        if (self.checkCellStackVerticallyStyle(textRotation)) {
          // Stack vertically style is part of Text-rotation style but its text
          // never goes outside the cell area. So it's safe to ignore those cells.
          continue;
        }

        let x = startX;
        for (let i = columnIndex; i < index; i++) {
          x += self.dp(this.frameCache.getCellWidth(i));
        }

        // Create a singular cell if this cell possibly overflowing.
        const newNode = this.cellCreator.createSingularCell(
          rowIndex,
          index,
          x,
          startY,
          { isRightOverflowingInvisibleCell: true },
        );

        const cell = newNode.cell;
        if (!cell.isEmpty) {
          // No need find other overflow cells on the left if already found non-empty cell
          findOverflowCell = false;

          if (
            cell.horizontalAlignment === 'center' ||
            cell.horizontalAlignment === 'right'
          ) {
            // Rotation text can be overflowed on neighbor cells
            addNextNode(newNode);
          }
        }
      } else if (findOverflowCell && mode === 'overflowing') {
        // Offset the X-axis.
        let x = startX;
        const originalColumnWidth = self.dp(
          this.frameCache.getCellWidth(index),
        );
        for (let i = columnIndex; i <= index; i++) {
          x += self.dp(this.frameCache.getCellWidth(i));
        }

        // Expand the width since the intermediate cells may not be present.
        const extras: Partial<CellSource> = {
          columnWidth: x - startX,
          originalColumnWidth,
          isRightOverflowingInvisibleCell: true,
        };

        // Create a singular cell if this cell possibly overflowing.
        const newNode = this.cellCreator.createSingularCell(
          rowIndex,
          index,
          startX,
          startY,
          extras,
        );

        if (!newNode.cell.isEmpty) {
          // No need find other overflow cells on the left if already found it
          findOverflowCell = false;
          addNextNode(newNode);
        }
      }
    }

    return { startOverflowNode: startNode, endOverflowNode: endNode };
  };
}
