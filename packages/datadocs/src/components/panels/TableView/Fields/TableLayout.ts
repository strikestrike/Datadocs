import type {
  GridPublicAPI,
  TableDescriptor,
} from "@datadocs/canvas-datagrid-ng";
import { ensureAsync } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/await";
import { getAnchorCellIndexFromTable } from "@datadocs/canvas-datagrid-ng/lib/data/table/util";

export async function setTableAnchorCell(
  grid: GridPublicAPI,
  table: TableDescriptor,
  inputValue: string,
  noScroll = false
) {
  const anchoredCell = getAnchorCellIndexFromTable(inputValue);
  if (!anchoredCell) return false;

  const { rowIndex, columnIndex } = anchoredCell;
  if (rowIndex === table.startRow && columnIndex === table.startColumn) {
    return true;
  }
  try {
    if (!(await ensureAsync(table.move(rowIndex, columnIndex)))) {
      throw new Error();
    }
    if (!noScroll) grid.gotoCell(columnIndex, rowIndex);
    grid.selectArea({
      top: table.startRow,
      left: table.startColumn,
      bottom: table.endRow,
      right: table.endColumn,
    });
    grid.draw();
    return true;
  } catch {
    // Do nothing
  }
  return false;
}
