import type {
  GridPrivateProperties,
  OrderDirection,
  GridHeader,
  TableDescriptor,
} from '../types';
import { columnTypeToShortFormString } from '../utils/column-types';
import type { CellLinkedNode } from '../types/drawing';
import type { DrawUtils } from './util';
import { getColumnHeaderIconImage } from './icons/column-header-icon';
import { getColumnTypeIconImage } from './icons/column-type-icon';
import { getGenericIcon } from './icons/generic-icon';

/**
 * Draw the dropdown button of the given table header cell.
 * @param node That contains the cell.
 */
export function drawTableProps(
  self: GridPrivateProperties,
  utils: DrawUtils,
  node: CellLinkedNode,
) {
  const { cell } = node;
  if (
    !cell.table ||
    cell.table.isSpilling ||
    !(
      cell.isTableHeader ||
      cell.tableContext?.groupContext?.isHeaderColumn ||
      cell.tableContext?.isTotalRow ||
      cell.tableContext?.isSubtotalRow
    )
  ) {
    return;
  }
  self.ctx.save();
  utils.radiusRect(cell.x, cell.y, cell.width, cell.height, 0);
  self.ctx.clip();

  if (cell.isTableHeader && !cell.tableContext?.groupContext?.isHeaderColumn) {
    const { tableHeader: header } = cell;
    const {
      tableDropdownButtonBorderWidth: borderWidth,
      tableDropdownButtonRadius: buttonRadius,
      tableDropdownIconHeight: iconHeight,
      tableDropdownIconWidth: iconWidth,
    } = self.style.scaled;
    const {
      tableDropdownButtonBackgroundColor: bgColor,
      tableDropdownButtonBorderColor: borderColor,
      tableHeaderCellTypeIconBackgroundColor: typeIconBgColor,
    } = self.style;

    self.ctx.lineWidth = borderWidth;
    self.ctx.fillStyle = bgColor;
    self.ctx.strokeStyle = borderColor;

    if (cell.tableButton) {
      const { x, y, width, height } = cell.tableButton;

      const hovered = cell.hoverContext === 'table-dropdown-button';
      const isActive =
        hovered ||
        (self.activeTableFieldDropdown &&
          cell.table === self.activeTableFieldDropdown.table &&
          cell.header === self.activeTableFieldDropdown.header);

      // Draw button background
      utils.radiusRect(x, y, width, height, buttonRadius);
      self.ctx.fillStyle = isActive
        ? self.style.tableDropdownButtonHoverBackgroundColor
        : self.style.tableDropdownButtonBackgroundColor;
      self.ctx.fill();

      // Draw header button icon image
      const iconPaddingX = Math.round((width - iconWidth) / 2);
      const iconPaddingY = Math.round((height - iconHeight) / 2);
      const state = getSortFilterState(cell.table, cell.tableHeader);
      const image = getColumnHeaderIconImage(
        state.sortOrder,
        state.hasFilter,
        isActive,
      );
      self.ctx.drawImage(
        image,
        x + iconPaddingX,
        y + iconPaddingY,
        iconWidth,
        iconHeight,
      );
    }

    const typeImage = getColumnTypeIconImage(
      columnTypeToShortFormString(header.type),
    );
    // Only draw type icon on table header if there is icon for it
    if (cell.tableTypeButton && typeImage) {
      const { x, y, width, height } = cell.tableTypeButton;

      utils.radiusRect(x, y, width, height, buttonRadius);
      self.ctx.fillStyle = typeIconBgColor;
      self.ctx.fill();
      self.ctx.drawImage(typeImage, x, y, width, height);
    }
  }

  if (cell.tableContext?.groupContext?.isTopHeaderColumn) {
    const layersIcon = getGenericIcon('layers');
    if (layersIcon) {
      const {
        tableGroupHeaderIconHeight: iconHeight,
        tableGroupHeaderIconWidth: iconWidth,
        tableGroupHeaderIconPadding: paddingX,
      } = self.style.scaled;
      const iconX = cell.x + paddingX;
      const iconY = cell.y + Math.max((cell.height - iconHeight) / 2, 0);
      self.ctx.drawImage(layersIcon, iconX, iconY, iconWidth, iconHeight);
    }
  }

  if (
    !cell.tableContext?.groupContext?.isTopHeaderColumn &&
    cell.subtargets?.groupToggleButton
  ) {
    const { groupToggleButton: button } = cell.subtargets;
    const layersIcon = getGenericIcon(button.collapsed ? 'expand' : 'collapse');
    if (layersIcon) {
      self.ctx.drawImage(
        layersIcon,
        button.x,
        button.y,
        button.width,
        button.height,
      );
    }
  }

  if (cell.subtargets.aggregationOptsButton) {
    cell.subtargets.aggregationOptsButton.draw();
  }

  self.ctx.restore();
}

function getSortFilterState(
  table: TableDescriptor,
  columnHeader: GridHeader,
): {
  sortOrder: OrderDirection;
  hasFilter: boolean;
} {
  const currentSorter = table.dataSource.getSorter(columnHeader.id);
  const currentFilter = table.dataSource.getFilter(columnHeader.id);
  const sorter =
    currentSorter?.type === 'preset' &&
    currentSorter.columnId === columnHeader.id
      ? currentSorter
      : undefined;
  const hasFilter = !!currentFilter;
  return { sortOrder: sorter?.dir, hasFilter };
}
