import { DrawingStatus } from '../../types';
import type { CellLinkedNode } from '../../types';
import type { CellTextUtils } from './cell-text';

export class CellDerivedPropsCreator {
  constructor(private readonly textUtils: CellTextUtils) {}
  /**
   * Calculate the cell data after its siblings are created and tied up with it.
   * @param cellNode To calculate.
   */
  readonly calculateRelationalCellData = (cellNode: CellLinkedNode) => {
    const { cell } = cellNode;

    this.textUtils.formatCellText(cellNode);
    this.defineOverflowingStatus(cellNode);

    // Sometimes headers might be hidden by a group, hiding the top indicator,
    // so check if the next header contains an indicator and assign one for this
    // one.
    if (
      (cell.isRowHeader &&
        cellNode.lowerSibling?.cell?.containsUnhideIndicatorAtStart) ||
      (cell.isColumnHeader &&
        cellNode.nextSibling?.cell?.containsUnhideIndicatorAtStart)
    ) {
      cell.containsUnhideIndicatorAtEnd = true;
    }

    if (cell.containsUnhideIndicatorAtStart) {
      const target = cell.isRowHeader
        ? cellNode.upperSibling
        : cellNode.prevSibling;
      if (target) target.cell.drawingStatus = DrawingStatus.PendingRedraw;
    }
    if (cell.containsUnhideIndicatorAtEnd) {
      const target = cell.isRowHeader
        ? cellNode.lowerSibling
        : cellNode.nextSibling;
      if (target) target.cell.drawingStatus = DrawingStatus.PendingRedraw;
    }

    cell.onReady.formattedValue.forEach((callback) => callback());
  };

  /**
   * Batch calculate the relational data of the linked cells.
   * @param cellNode Linked cells.
   * @see calculateRelationalCellData
   */
  readonly calculateRelationalCellDataList = (cellNode: CellLinkedNode) => {
    let curNode = cellNode;
    while (curNode) {
      this.calculateRelationalCellData(curNode);
      curNode = curNode.nextSibling;
    }
  };

  /**
   * Update the state cells that are overflowing and tie them together so that
   * the grid can draw and update them accordingly.
   */
  private defineOverflowingStatus = (node: CellLinkedNode) => {
    const { cell } = node;

    if (cell.subsumedLeftCellCount > 0) {
      let curNode = node.prevSibling;
      for (let i = 0; i < cell.subsumedLeftCellCount; i++) {
        if (curNode?.cell) {
          curNode.cell.subsumedByRightNeighbor = true;
          curNode = curNode.prevSibling;
        } else {
          break;
        }
      }
    }

    if (cell.subsumedRightCellCount > 0) {
      let curNode = node.nextSibling;
      for (let i = 0; i < cell.subsumedRightCellCount; i++) {
        if (curNode?.cell) {
          curNode.cell.subsumedByLeftNeighbor = true;
          curNode = curNode.nextSibling;
        } else {
          break;
        }
      }
    }
  };

  /**
   * Define overflowing status for cells inside a row
   * @param node
   */
  readonly defineOverflowStatusForRow = (node: CellLinkedNode) => {
    let curNode = node.prevSibling;
    while (curNode) {
      this.defineOverflowingStatus(curNode);
      curNode = curNode.prevSibling;
    }

    curNode = node;
    while (curNode) {
      this.defineOverflowingStatus(curNode);
      curNode = curNode.nextSibling;
    }
  };
}
