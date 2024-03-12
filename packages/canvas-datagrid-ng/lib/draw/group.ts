import type { DrawUtils } from './util';
import type { GridPrivateProperties } from '../types/grid';
import type { GroupDescriptorResult } from '../groups/types';
import type { NormalCellDescriptor } from '../types';

export class DrawGroupArea {
  rowGroupsAreaWidth: number;
  columnGroupsAreaHeight: number;
  rowHeaderCellWidth: number;
  columnHeaderCellHeight: number;

  constructor(
    private readonly self: GridPrivateProperties,
    private readonly utils: DrawUtils,
  ) {
    this.rowGroupsAreaWidth = self.dp(self.getRowGroupAreaWidth());
    this.columnGroupsAreaHeight = self.dp(self.getColumnGroupAreaHeight());
    this.rowHeaderCellWidth = self.dp(self.getRowHeaderCellWidth());
    this.columnHeaderCellHeight = self.dp(self.getColumnHeaderCellHeight());
  }

  /**
   * Clear the group area pixels altogether if the given area has groups.
   */
  private _clearGroupAreaPixels = () => {
    const { self } = this;
    const { cellBorderWidth } = self.style.scaled;
    if (this.rowGroupsAreaWidth > 0) {
      const x0 =
        this.rowGroupsAreaWidth - cellBorderWidth / 2 + self.canvasOffsetLeft;
      self.ctx.beginPath();
      self.ctx.moveTo(0, 0);
      self.ctx.lineTo(x0, 0);
      self.ctx.lineTo(x0, self.height);
      self.ctx.lineTo(0, self.height);
      self.ctx.closePath();
      self.ctx.fillStyle = self.style.groupingAreaBackgroundColor;
      self.ctx.fill();
    }

    if (this.columnGroupsAreaHeight > 0) {
      const y0 =
        this.columnGroupsAreaHeight -
        cellBorderWidth / 2 +
        self.canvasOffsetTop;
      self.ctx.beginPath();
      self.ctx.moveTo(0, 0);
      self.ctx.lineTo(self.width, 0);
      self.ctx.lineTo(self.width, y0);
      self.ctx.lineTo(0, y0);
      self.ctx.closePath();
      self.ctx.fillStyle = self.style.groupingAreaBackgroundColor;
      self.ctx.fill();
    }
  };

  draw = () => {
    if (this.rowGroupsAreaWidth <= 0 && this.columnGroupsAreaHeight <= 0) {
      return;
    }

    const self = this.self;
    const { fillRect, drawLines, strokeRect, radiusRect } = this.utils;

    // We clear here because the cells might overflow under beyond the headers
    // when they are long in size.
    this._clearGroupAreaPixels();

    const ctx = self.ctx;
    /**
     * This temporary type is to prevent the header array from being modified
     * (You can add method in `state/viewport.ts` for modifying header array but not in here)
     */
    type HeaderList = Readonly<NormalCellDescriptor[]>;
    const columns: HeaderList = self.viewport.columnHeaders;
    const rows: HeaderList = self.viewport.rowHeaders;

    const rowGroupWidth = self.style.scaled.rowGroupColumnWidth;
    const columnGroupHeight = self.style.scaled.columnGroupRowHeight;
    const buttonSize = self.style.scaled.groupIndicatorButtonSize;
    const isColumnButtonAtEnd = self.isColumnGroupToggleButtonMovedToEnd;
    const isRowButtonAtEnd = self.isRowGroupToggleButtonMovedToEnd;

    ctx.fillStyle = self.style.groupIndicatorBackgroundColor;
    ctx.strokeStyle = self.style.groupIndicatorColor;
    ctx.lineWidth = self.style.scaled.groupIndicatorPathWidth;

    // We draw the toggle buttons on the cells that come before the actual
    // `from` index, so we request the data related to a group early and keep
    // the data for later use on the visible cell that is part of that group.
    const columnGroupCache: GroupDescriptorResult[][] = [];
    const rowGroupCache: GroupDescriptorResult[][] = [];

    let clipFrozenArea = false;

    //#region Columns Grouping
    const drawColumnGroup = (
      groups: GroupDescriptorResult[],
      column: NormalCellDescriptor,
    ) => {
      // Clip the parts of the drawings if the columns draws above the
      // frozen area but is not frozen.
      if (
        column.header.columnIndex >= self.frozenColumn &&
        column.x < self.lastFrozenColumnPixel
      ) {
        clipFrozenArea = true;
        ctx.save();
        radiusRect(
          self.lastFrozenColumnPixel,
          0,
          column.width,
          this.columnGroupsAreaHeight,
          0,
        );
        ctx.clip();
      }

      for (let j = 0; j < groups.length; j++) {
        const group = groups[j];
        const y = columnGroupHeight * group.level;
        const centerY = Math.floor(y + columnGroupHeight / 2);
        const isButton = isColumnButtonAtEnd
          ? group.to === column.header.columnIndex - 1
          : group.from === column.header.columnIndex + 1;
        const isTail = isColumnButtonAtEnd
          ? column.header.columnIndex === group.from
          : column.header.columnIndex === group.to;
        const end = column.x + column.width;
        const endHalf = Math.floor(column.x + column.width / 2);

        if (!isButton || !group.collapsed) {
          if (isTail) {
            const x = column.x + (isColumnButtonAtEnd ? column.width : 0);
            const y = centerY + buttonSize / 2;
            drawLines([x, centerY, endHalf, centerY, endHalf, y]);
          } else if (isButton) {
            const target = isColumnButtonAtEnd ? column.x : end;
            drawLines([endHalf, centerY, target, centerY]);
          } else {
            drawLines([column.x, centerY, end, centerY]);
          }
        }
        if (isButton) {
          const dynamicButtonSize = Math.min(buttonSize, column.width);
          drawGroupHandle(
            Math.floor(column.x + (column.width - dynamicButtonSize) / 2),
            Math.floor(centerY - buttonSize / 2),
            dynamicButtonSize,
            buttonSize,
            group.collapsed,
          );
        }

        const existingGroup = self.visibleGroups.find((item) => {
          return (
            item.type === 'c' &&
            item.row === group.level &&
            item.from === group.from &&
            item.to === group.to
          );
        });

        if (existingGroup) {
          existingGroup.x = Math.min(column.x, existingGroup.x);
          existingGroup.x2 = Math.max(
            column.x + column.width,
            existingGroup.x2,
          );
        } else {
          self.visibleGroups.push({
            type: 'c',
            collapsed: group.collapsed,
            from: group.from,
            to: group.to,
            row: group.level,
            x: column.x,
            y,
            x2: column.x + column.width,
            y2: y + columnGroupHeight,
          });
        }
      }

      if (clipFrozenArea) {
        clipFrozenArea = false;
        ctx.restore();
      }
    };

    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];

      if (isColumnButtonAtEnd) {
        const groups = self.getGroupsColumnBelongsTo(column.header.columnIndex);
        columnGroupCache[column.header.columnIndex] = groups;
        if (groups?.length > 0) {
          drawColumnGroup(groups, column);
        }

        const buttonGroups =
          columnGroupCache[column.header.columnIndex - 1] ??
          self.getGroupsColumnBelongsTo(column.header.columnIndex - 1);
        if (buttonGroups?.length > 0) {
          drawColumnGroup(buttonGroups, column);
        }
      } else {
        const buttonGroups = self.getGroupsColumnBelongsTo(
          column.header.columnIndex + 1,
        );
        columnGroupCache[column.header.columnIndex + 1] = buttonGroups;
        if (buttonGroups?.length > 0) {
          drawColumnGroup(buttonGroups, column);
        }

        const groups =
          columnGroupCache[column.header.columnIndex] ??
          self.getGroupsColumnBelongsTo(column.header.columnIndex);
        if (groups?.length > 0) {
          drawColumnGroup(groups, column);
        }
      }
    }
    //#endregion Columns Grouping

    //#region Rows Grouping
    const drawRowGroup = (
      groups: GroupDescriptorResult[],
      row: NormalCellDescriptor,
    ) => {
      // Clip the parts of the drawings if the columns draws above the
      // frozen area but is not frozen.
      if (row.rowIndex >= self.frozenRow && row.y < self.lastFrozenRowPixel) {
        clipFrozenArea = true;
        ctx.save();
        radiusRect(
          0,
          self.lastFrozenRowPixel,
          this.rowGroupsAreaWidth,
          row.height,
          0,
        );
        ctx.clip();
      }

      for (let j = 0; j < groups.length; j++) {
        const group = groups[j];
        const x = rowGroupWidth * group.level;
        const centerX = Math.floor(x + rowGroupWidth / 2);
        const isButton = isRowButtonAtEnd
          ? group.to === row.rowIndex - 1
          : group.from === row.rowIndex + 1;
        const isTail = isRowButtonAtEnd
          ? row.rowIndex === group.from
          : row.rowIndex === group.to;
        const end = row.y + row.height;
        const endHalf = Math.floor(row.y + row.height / 2);

        if (!isButton || !group.collapsed) {
          if (isTail) {
            const x = centerX + buttonSize / 2;
            const y = row.y + (isRowButtonAtEnd ? row.height : 0);
            drawLines([centerX, y, centerX, endHalf, x, endHalf]);
          } else if (isButton) {
            const target = isRowButtonAtEnd ? row.y : end;
            drawLines([centerX, endHalf, centerX, target]);
          } else {
            drawLines([centerX, row.y, centerX, end]);
          }
        }
        if (isButton) {
          const dynamicButtonSize = Math.min(buttonSize, row.height);
          drawGroupHandle(
            Math.floor(centerX - buttonSize / 2),
            Math.floor(row.y + (row.height - dynamicButtonSize) / 2),
            buttonSize,
            dynamicButtonSize,
            group.collapsed,
          );
        }

        const existingGroup = self.visibleGroups.find((item) => {
          return (
            item.type === 'r' &&
            item.col === group.level &&
            item.from === group.from &&
            item.to === group.to
          );
        });

        if (existingGroup) {
          existingGroup.y = Math.min(row.y, existingGroup.y);
          existingGroup.y2 = Math.max(row.y + row.height, existingGroup.y2);
        } else {
          self.visibleGroups.push({
            type: 'r',
            collapsed: group.collapsed,
            from: group.from,
            to: group.to,
            col: group.level,
            x,
            y: row.y,
            x2: x + rowGroupWidth,
            y2: row.y + row.height,
          });
        }
      }

      if (clipFrozenArea) {
        clipFrozenArea = false;
        ctx.restore();
      }
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (isRowButtonAtEnd) {
        const groups = self.getGroupsRowBelongsTo(row.rowIndex);
        rowGroupCache[row.rowIndex] = groups;
        if (groups?.length > 0) {
          drawRowGroup(groups, row);
        }

        const buttonGroups =
          rowGroupCache[row.rowIndex - 1] ??
          self.getGroupsRowBelongsTo(row.rowIndex - 1);
        if (buttonGroups?.length > 0) {
          drawRowGroup(buttonGroups, row);
        }
      } else {
        const buttonGroups = self.getGroupsRowBelongsTo(row.rowIndex + 1);
        rowGroupCache[row.rowIndex + 1] = buttonGroups;
        if (buttonGroups?.length > 0) {
          drawRowGroup(buttonGroups, row);
        }

        const groups =
          rowGroupCache[row.rowIndex] ??
          self.getGroupsRowBelongsTo(row.rowIndex);
        if (groups?.length > 0) {
          drawRowGroup(groups, row);
        }
      }
    }
    //#endregion Rows Grouping

    /**
     * @param {number} x based-X (left-top)
     * @param {number} y based-Y (left-top)
     * @param {number} width
     * @param {number} height
     * @param {boolean} collapsed true: '+'; false: '-'
     */
    function drawGroupHandle(
      x: number,
      y: number,
      width: number,
      height: number,
      collapsed: boolean,
    ) {
      const { groupIndicatorButtonIconSize: iconSize } = self.style.scaled;
      fillRect(x, y, width, height);
      strokeRect(x, y, width, height);
      const cx = Math.floor(x + width * 0.5);
      const cy = Math.floor(y + height * 0.5);

      // Allow the size of the size icon to shrink (happens when the cell is
      // short), hence the use of `Math.min()`.
      const dynamicIconSizeX = Math.min(width, iconSize);
      const paddingX = Math.floor((width - dynamicIconSizeX) / 2);
      drawLines([
        x + paddingX,
        cy,
        x + Math.min(paddingX + dynamicIconSizeX, width),
        cy,
      ]);
      if (collapsed) {
        // Allow the size of the size icon to shrink (happens when the cell is
        // short), hence the use of `Math.min()`.
        const dynamicIconSizeY = Math.min(height, iconSize);
        const paddingY = Math.floor((height - dynamicIconSizeY) / 2);
        drawLines([
          cx,
          y + paddingY,
          cx,
          y + Math.min(paddingY + dynamicIconSizeY, height),
        ]);
      }
    }
  };
}
