import type { GridPrivateProperties } from '../types/grid';
import { MergeDirection } from '../types/cell';
import type { GroupData } from '../groups/types';
import {
  SelectionType,
  hasMultipleOfSelectionType,
  isMultiColumnsSelected,
  isMultiRowsSelected,
  isSelectionSingular,
} from '../selections/util';
import { integerToAlpha } from '../util';
import {
  GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
  GRID_CONTEXT_MENU_ITEM_TYPE_DIVIDER,
  GRID_CONTEXT_MENU_ITEM_TYPE_SUBMENU,
} from './constants';
import type {
  GridContextMenuData,
  GridContextMenuItem,
  GridContextMenuActionItem,
} from './types';
import type { TableDescriptor } from '../data/data-source/spec/table';
import type { GridHeader, RangeDescriptor } from '../types';

export class GridContextMenuItems {
  constructor(private readonly self: GridPrivateProperties) {}

  populate = (e: GridContextMenuData) => {
    if (this.populateWithPrimaryItems(e)) return;
    this.populateWithEditingItems(e);
    this.populateWithHidingItems(e);
    this.populateWithTableItems(e);
    this.populateWithGroupingItems(e);
  };

  private populateWithPrimaryItems = (e: GridContextMenuData): boolean => {
    const { self } = this;
    const currentGroup =
      self.getRowGroupAt(e.pos.x, e.pos.y) ??
      self.getColumnGroupAt(e.pos.x, e.pos.y);
    if (currentGroup) {
      e.items.push({
        type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
        title: currentGroup.collapsed
          ? self.attributes.showGroupExpand
          : self.attributes.showGroupCollapse,
        action: function () {
          if (self.toggleGroup(currentGroup)) {
            self.refresh();
          }
        },
      });
      e.items.push({
        type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
        title: self.attributes.showRemoveGroup,
        action: function () {
          if (currentGroup.type === 'r') {
            self.removeGroupRows(currentGroup.from, currentGroup.to);
          } else {
            self.removeGroupColumns(currentGroup.from, currentGroup.to);
          }
          self.refresh();
        },
      });
      if (currentGroup.type === 'c') {
        e.items.push({
          type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
          title: self.isColumnGroupToggleButtonMovedToEnd
            ? self.attributes.showMoveGroupToggleButtonToLeft
            : self.attributes.showMoveGroupToggleButtonToRight,
          action: function () {
            self.isColumnGroupToggleButtonMovedToEnd =
              !self.isColumnGroupToggleButtonMovedToEnd;
            self.requestRedraw('all');
            self.redrawCommit();
          },
        });
      } else {
        e.items.push({
          type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
          title: self.isRowGroupToggleButtonMovedToEnd
            ? self.attributes.showMoveGroupToggleButtonToTop
            : self.attributes.showMoveGroupToggleButtonToBottom,
          action: function () {
            self.isRowGroupToggleButtonMovedToEnd =
              !self.isRowGroupToggleButtonMovedToEnd;
            self.requestRedraw('all');
            self.redrawCommit();
          },
        });
      }
    } else {
      return false;
    }

    return true;
  };

  private populateWithEditingItems = (e: GridContextMenuData) => {
    const { self } = this;

    if (self.attributes.showCopy && self.canSelectionsBeCopied()) {
      e.items.push({
        type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
        title: self.attributes.copyText,
        prefixIcon: 'copy',
        action: function () {
          document.execCommand('copy');
        },
      });
    }
    if (self.attributes.showPaste) {
      e.items.push({
        type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
        title: self.attributes.pasteText,
        prefixIcon: 'paste',
        action: function () {
          self.paste();
        },
      });
    }
  };

  /**
   * @param column A column view index or a GridHeader object.
   */
  private getColumnTitle = (column: number | GridHeader): string => {
    if (column === null || column === undefined) return '';
    let fallback = '';
    if (typeof column === 'number') {
      fallback = integerToAlpha(column);
      column = this.self.dataSource.getHeader(column);
    }
    if (!column) return fallback;
    if (column.title) return column.title;
    if (column.dataKey) return String(column.dataKey);
    return fallback;
  };

  private populateWithHidingItems = (e: GridContextMenuData) => {
    const { self } = this;
    const selection = self.getPrimarySelection();
    // const currentSorters = self.dataSource.getCurrentSorters();
    const children: GridContextMenuItem[] = [];
    const gridHideColumnItems: GridContextMenuItem[] = [];
    const gridUnhideColumnItems: GridContextMenuItem[] = [];
    if (
      self.attributes.showColumnSelector &&
      selection.type === SelectionType.Columns
    ) {
      const hasMultiSelections = hasMultipleOfSelectionType(
        self.selections,
        SelectionType.Columns,
      );

      let hasHiddenRanges = false;
      let totalIterations = 0;
      for (const selection of self.selections) {
        if (selection.type !== SelectionType.Columns) continue;
        let stop = false;
        for (
          let i = selection.startColumn;
          i <= selection.endColumn;
          i++, totalIterations++
        ) {
          if (self.dataSource.getHiddenColumns(i)) {
            hasHiddenRanges = true;
            break;
          }
          if (totalIterations >= 1000) {
            stop = true;
            break;
          }
        }
        if (hasHiddenRanges || stop) break;
      }

      let title = self.attributes.showHideColumn;
      if (hasMultiSelections) {
        title = self.attributes.showHideColumns;
      } else if (isMultiColumnsSelected(selection)) {
        title = self.attributes.showHideColumnRange
          .replace('%s', this.getColumnTitle(selection.startColumn))
          .replace('%s', this.getColumnTitle(selection.endColumn));
      }
      gridHideColumnItems.push({
        type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
        title,
        prefixIcon: 'hide',
        action: function () {
          // After each hide, the indexes that the selections point to will
          // become invalid, so we cache the column names before hiding any
          // columns.
          const hidingColumnsIdPairs = [] as [string, string][];
          const columnSelections = self.selections.filter(
            (selection) => selection.type === SelectionType.Columns,
          );

          for (const selection of columnSelections) {
            const from = self.dataSource.getHeader(selection.startColumn);
            const to = self.dataSource.getHeader(selection.endColumn);
            if (!from || !to) continue;

            hidingColumnsIdPairs.push([from.id, to.id]);
          }

          if (hidingColumnsIdPairs.length > 0) {
            self.clearSelections(false, true);
            for (const [fromId, toId] of hidingColumnsIdPairs) {
              const from = self.dataSource.getHeaderById(fromId);
              const to = self.dataSource.getHeaderById(toId);

              if (!from || !to) continue;
              self.hideColumns(
                from.columnViewIndex,
                to.columnViewIndex,
                false,
                true,
                true,
              );
            }
            self.dispatchSelectionChangedEvent();
          }
        },
      });

      if (hasHiddenRanges) {
        gridUnhideColumnItems.push({
          type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
          title: self.attributes.showUnhideColumns,
          prefixIcon: 'unhide',
          action: function () {
            const columnSelections = self.selections.filter(
              (selection) => selection.type === SelectionType.Columns,
            );
            self.clearSelections(false, true);
            for (const sel of columnSelections) {
              self.unhideColumns(sel.startRow, false, true, false);
            }
            self.dispatchSelectionChangedEvent();
          },
        });
      }
    }

    //#region hide rows
    if (selection.type === SelectionType.Rows) {
      const hasMultiSelections = hasMultipleOfSelectionType(
        self.selections,
        SelectionType.Rows,
      );
      const { positionHelper } = self.dataSource;

      let hasHiddenRanges = false;
      for (const sel of self.selections) {
        if (sel.type !== SelectionType.Rows) continue;
        if (positionHelper.hasHiddenRows(sel.startRow, sel.endRow)) {
          hasHiddenRanges = true;
          break;
        }
      }

      let title = self.attributes.showHideRow;
      if (hasMultiSelections) {
        title = self.attributes.showHideRows;
      } else if (isMultiRowsSelected(selection)) {
        title = self.attributes.showHideRowRange
          .replace('%s', (selection.startRow + 1).toString())
          .replace('%s', (selection.endRow + 1).toString());
      }
      children.push({
        type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
        title,
        prefixIcon: 'hide',
        action: function () {
          const rowSelections = self.selections.filter(
            (selection) => selection.type === SelectionType.Rows,
          );
          if (rowSelections.length > 0) {
            self.clearSelections(false, true);
            for (const sel of rowSelections) {
              self.hideRows(sel.startRow, sel.endRow, false, true, true);
            }
            self.dispatchSelectionChangedEvent();
          }
        },
      });

      if (hasHiddenRanges) {
        children.push({
          type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
          title: self.attributes.showUnhideRows,
          prefixIcon: 'unhide',
          action: function () {
            const rowSelections = self.selections.filter(
              (selection) => selection.type === SelectionType.Rows,
            );
            self.clearSelections(false, true);
            for (const sel of rowSelections) {
              self.unhideRows(sel.startRow, sel.endRow, false, true, false);
            }
            self.dispatchSelectionChangedEvent();
          },
        });
      }
    }

    //#region hide/unhide table columns
    if (self.selections.length > 0) {
      const affectedTablesSet = new Set<TableDescriptor>();
      const selectionRanges: RangeDescriptor[] = [];

      self.selections.forEach((selection) => {
        selectionRanges.push({
          startColumn: selection.startColumn ?? 0,
          endColumn: selection.endColumn ?? self.dataSource.state.cols - 1,
          startRow: selection.startRow ?? 0,
          endRow: selection.endRow ?? self.dataSource.state.rows - 1,
        });
      });

      for (const range of selectionRanges) {
        const tables = self.dataSource.getTablesInRange(range);
        tables.forEach((table) => affectedTablesSet.add(table));
      }
      const affectedTablesList = Array.from(affectedTablesSet);

      affectedTablesList.forEach((table) => {
        const hideTitle = self.attributes.showHideTableColumns.replace(
          '%s',
          table.name,
        );
        const unhideTitle = self.attributes.showUnhideTableColumns.replace(
          '%s',
          table.name,
        );
        gridHideColumnItems.push({
          type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
          title: hideTitle,
          prefixIcon: 'hide',
          action: function () {
            self.hideTableColumns(table.id, selectionRanges);
          },
        });

        if (table.getHiddenColumnCount() > 0) {
          gridUnhideColumnItems.push({
            type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
            title: unhideTitle,
            prefixIcon: 'unhide',
            action: function () {
              self.unhideAllTableColumns(table.id);
            },
          });
        }
      });
    }

    if (
      gridHideColumnItems.length > 0 ||
      gridUnhideColumnItems.length > 0 ||
      children.length > 0
    ) {
      e.items.push({ type: GRID_CONTEXT_MENU_ITEM_TYPE_DIVIDER });
      if (gridHideColumnItems.length > 0) {
        e.items.push({
          type: GRID_CONTEXT_MENU_ITEM_TYPE_SUBMENU,
          title: self.attributes.showHideColumnMenu,
          children: () => gridHideColumnItems,
        });
      }
      if (gridUnhideColumnItems.length > 0) {
        e.items.push({
          type: GRID_CONTEXT_MENU_ITEM_TYPE_SUBMENU,
          title: self.attributes.showUnhideColumnMenu,
          children: () => gridUnhideColumnItems,
        });
      }
      if (children.length > 0) children.forEach((item) => e.items.push(item));
    }
  };

  private populateWithGroupingItems = (e: GridContextMenuData) => {
    const { self } = this;
    const isSingleSelection = self.selections.length === 1;
    const primarySelection = self.getPrimarySelection();
    const groupAreaHeight = self.getColumnGroupAreaHeight();
    const groupAreaWidth = self.getRowGroupAreaWidth();
    const children: GridContextMenuItem[] = [];

    const setCollapseStateForAllGroups = (
      allGroups: GroupData[],
      collapsed: boolean,
    ) => {
      if (allGroups.length === 0) return;
      for (let i = 0; i < allGroups.length; i++) {
        const groups = allGroups[i];
        groups.forEach((descriptor) => {
          descriptor.collapsed = collapsed;
        });
      }
      self.refresh();
    };
    if (e.pos && e.pos.y < groupAreaHeight) {
      children.push({
        type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
        title: self.attributes.showExpandAllGroupColumns,
        action: function () {
          setCollapseStateForAllGroups(self.groupedColumns, false);
        },
      });
      children.push({
        type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
        title: self.attributes.showCollapseAllGroupColumns,
        action: function () {
          setCollapseStateForAllGroups(self.groupedColumns, true);
        },
      });
      children.push({
        type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
        title: self.attributes.showRemoveAllGroupColumns,
        action: function () {
          self.groupedColumns = [];
          self.refresh();
        },
      });
    }
    if (e.pos && e.pos.x < groupAreaWidth) {
      children.push({
        type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
        title: self.attributes.showExpandAllGroupRows,
        action: function () {
          setCollapseStateForAllGroups(self.groupedRows, false);
        },
      });
      children.push({
        type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
        title: self.attributes.showCollapseAllGroupRows,
        action: function () {
          setCollapseStateForAllGroups(self.groupedRows, true);
        },
      });
      children.push({
        type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
        title: self.attributes.showRemoveAllGroupRows,
        action: function () {
          self.groupedRows = [];
          self.refresh();
        },
      });
    }

    // If there is only only one selection, and its type is column, show the
    // group column option.
    if (
      self.attributes.allowGroupingColumns &&
      isSingleSelection &&
      primarySelection.type === SelectionType.Columns
    ) {
      const { startColumn, endColumn } = primarySelection;
      const from = self.dataSource.getHeader(startColumn);
      const to = self.dataSource.getHeader(endColumn);
      const canGroup = self.isNewGroupRangeValid(
        self.groupedColumns,
        from.columnIndex,
        to.columnIndex,
      );
      if (from && to && canGroup) {
        // show group options
        children.push({
          type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
          title: self.attributes.showGroupColumns.replace(
            '%s',
            integerToAlpha(from.columnIndex).toUpperCase() +
              '-' +
              integerToAlpha(to.columnIndex).toUpperCase(),
          ),
          action: function () {
            self.groupColumns(from.columnIndex, to.columnIndex);
          },
        });
      }

      const groups =
        e.cell.isHeader || e.cell.isNormal
          ? self.getGroupsColumnBelongsTo(e.cell.header.columnIndex)
          : [];
      for (let i = 0; i < groups.length; i++) {
        const { from, to } = groups[i];
        const cell0 = self.dataSource.getHeader(from);
        const cell1 = self.dataSource.getHeader(to);
        if (cell0 && cell1) {
          const formatArgs =
            integerToAlpha(cell0.columnIndex).toUpperCase() +
            '-' +
            integerToAlpha(cell1.columnIndex).toUpperCase();
          children.push({
            type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
            title: self.attributes.showRemoveGroupColumns.replace(
              '%s',
              formatArgs,
            ),
            action: function () {
              self.removeGroupColumns(cell0.columnIndex, cell1.columnIndex);
            },
          });
        } else {
          console.warn(`Cannot find column ${from} or column ${to}`);
        }
      }
    }

    // If there is only only one selection, and its type is row, show the group
    // rows option.
    if (
      self.attributes.allowGroupingRows &&
      isSingleSelection &&
      primarySelection.type === SelectionType.Rows
    ) {
      const { startRow, endRow } = primarySelection;
      if (self.isNewGroupRangeValid(self.groupedRows, startRow, endRow)) {
        children.push({
          type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
          title: self.attributes.showGroupRows.replace(
            '%s',
            `${startRow + 1}-${endRow + 1}`,
          ),
          action: function () {
            self.groupRows(startRow, endRow);
          },
        });
      }

      const rowIndex = e.cell.rowIndex;
      const groups = self.getGroupsRowBelongsTo(rowIndex);
      for (let i = 0; i < groups.length; i++) {
        const { from, to } = groups[i];
        children.push({
          type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
          title: self.attributes.showRemoveGroupRows.replace(
            '%s',
            `${from + 1}-${to + 1}`,
          ),
          action: function () {
            self.removeGroupRows(from, to);
          },
        });
      }
    }

    if (children.length > 0) {
      e.items.push({ type: GRID_CONTEXT_MENU_ITEM_TYPE_DIVIDER });
      children.forEach((item) => e.items.push(item));
    }
  };

  private populateWithMergingItems = (e: GridContextMenuData) => {
    const { self } = this;
    const selection = self.getPrimarySelection();
    if (
      self.selections.length !== 1 ||
      selection.type !== SelectionType.Cells
    ) {
      return;
    }

    const selectionRect = self.convertSelectionToRange(selection);
    const canMergeCells =
      self.attributes.allowMergingCells && !isSelectionSingular(selection);
    const canUnmergeCells =
      self.attributes.allowMergingCells && self.containsMergedCells(selection);

    const children: GridContextMenuItem[] = [];

    if (canMergeCells) {
      children.push({
        type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
        title: self.attributes.showMergeAllCells,
        action: function () {
          self.mergeCells(selectionRect);
          self.requestRedraw('all');
          self.redrawCommit();
        },
      });
    }
    if (canMergeCells && selection.startColumn !== selection.endColumn) {
      children.push({
        type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
        title: self.attributes.showMergeCellsHorizontally,
        action: function () {
          self.mergeCells(selectionRect, MergeDirection.Horizontal);
          self.requestRedraw('all');
          self.redrawCommit();
        },
      });
    }
    if (canMergeCells && selection.startRow !== selection.endRow) {
      children.push({
        type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
        title: self.attributes.showMergeCellsVertically,
        action: function () {
          self.mergeCells(selectionRect, MergeDirection.Vertical);
          self.requestRedraw('all');
          self.redrawCommit();
        },
      });
    }
    if (canUnmergeCells) {
      children.push({
        type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
        title: self.attributes.showUnmergeCells,
        action: function () {
          self.unmergeCells(selectionRect);
          self.requestRedraw('all');
          self.redrawCommit();
        },
      });
    }

    if (children.length > 0) {
      e.items.push({
        type: GRID_CONTEXT_MENU_ITEM_TYPE_SUBMENU,
        title: self.attributes.showMergeCells,
        prefixIcon: 'merge-cell',
        children: () => children,
      });
    }
  };

  /**
   * Populate the context menu with secondary items that we display when the
   * grid context menu event is not handled/suppressed by Datadocs UI.
   *
   * This is for development purposes only.
   */
  populateWithSecondaryItems = (e: GridContextMenuData) => {
    const { self } = this;

    e.items.push({ type: GRID_CONTEXT_MENU_ITEM_TYPE_DIVIDER });
    this.populateWithMergingItems(e);

    if (self.attributes.showZooming) {
      e.items.push({
        type: GRID_CONTEXT_MENU_ITEM_TYPE_SUBMENU,
        title: self.attributes.zooming,
        children: () => {
          const { zoomingGroup } = self.attributes;
          const subItems = zoomingGroup.map(function (zoom) {
            return {
              type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
              title: `${zoom * 100}%`,
              active: zoom == self.userScale,
              action: function toggleZoomLevel() {
                self.userScale = zoom;
                self.resize(true);
              },
            } as GridContextMenuActionItem;
          });
          return subItems;
        },
      });
    }
    if (self.attributes.showRange) {
      // Add the currently selected cell range to grid.range
      e.items.push({
        type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
        title: self.attributes.saveRange,
        action: function () {
          const name = self.dataSource.namespace.nextName('range');
          self.nameSelectedRanges(name);
        },
      });
      // Reflect the range selected in the menu to the cell selection cursor
      e.items.push({
        type: GRID_CONTEXT_MENU_ITEM_TYPE_SUBMENU,
        title: self.attributes.loadRange,
        children: () => {
          const children = [] as GridContextMenuItem[];
          self.range.forEach(function (name, key) {
            children.push({
              type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
              title: `${key} (${name})`,
              action: function selectRange() {
                const cellRange = self.range.get(name);
                if (cellRange) {
                  self.clearSelections();
                  self.replaceAllSelections(cellRange.selections);
                  self.dispatchSelectionChangedEvent();
                  self.draw(true);
                }
              },
            });
          });
          return children;
        },
      });
    }
    if (
      self.attributes.allowSorting &&
      self.attributes.showOrderByOption &&
      e.cell.isNormal
    ) {
      const title = this.getColumnTitle(e.cell.header);
      e.items.push({
        type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
        title: self.attributes.showOrderByOptionTextAsc.replace('%s', title),
        action: function () {
          self.order(e.cell.header.dataKey, 'asc');
        },
      });
      e.items.push({
        type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
        title: self.attributes.showOrderByOptionTextDesc.replace('%s', title),
        action: function () {
          self.order(e.cell.header.dataKey, 'desc');
        },
      });
    }
  };

  private populateWithTableItems = (e: GridContextMenuData) => {
    if (!e.cell.table) return;
    e.items.push({ type: GRID_CONTEXT_MENU_ITEM_TYPE_DIVIDER });
    e.items.push({
      type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
      title: 'Insert column left',
      action() {
        console.log('add column left');
      },
    });
    e.items.push({
      type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
      title: 'Insert column right',
      action() {
        console.log('add column right');
      },
    });
    e.items.push({
      type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
      title: 'Insert row above',
      action() {
        console.log('add row above');
      },
    });
    e.items.push({
      type: GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
      title: 'Insert column below',
      action() {
        console.log('add row below');
      },
    });
  };
}
