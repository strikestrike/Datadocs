import type { GridPrivateProperties } from '../../types';
import type { CellLinkedNode } from '../../types/drawing';

export function defineIndicators(
  self: GridPrivateProperties,
  node: CellLinkedNode,
) {
  const { cell, source } = node;

  if (cell.isColumnHeader && self.attributes.showUnhideColumnsIndicator) {
    const hiddenInfo = self.dataSource.getHiddenColumns(
      source.columnOrderIndex,
    );
    if (hiddenInfo?.before && !hiddenInfo.beforeGroup) {
      cell.containsUnhideIndicatorAtStart = true;
    }
    if (hiddenInfo?.after && !hiddenInfo.afterGroup) {
      cell.containsUnhideIndicatorAtEnd = true;
    }
  } else if (cell.isRowHeader && self.attributes.showUnhideRowsIndicator) {
    const { positionHelper } = self.dataSource;
    const end = positionHelper.getHidingRange(cell.rowIndex + 1);
    if (end && !end.isGroup) {
      cell.containsUnhideIndicatorAtEnd = true;
    }
    const start = positionHelper.getHidingRange(cell.rowIndex - 1);
    if (start && start.end >= cell.rowIndex - 1 && !start.isGroup) {
      cell.containsUnhideIndicatorAtStart = true;
    }
  }
}
