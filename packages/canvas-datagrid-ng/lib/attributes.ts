import type { GridEasingFunctions } from './animation';
import type { DragResizeConfig, LoadingIndicatorRenderer } from './types/base';
import type { BorderDragBehavior } from './types/behaviour-enum';

export type GridAttributes = typeof defaultGridAttributes;
export const defaultGridAttributes = {
  allowColumnReordering: true,
  allowColumnResize: true,
  allowColumnResizeFromCell: false,
  allowFreezingRows: true,
  allowFreezingColumns: true,
  allowMovingSelection: true,
  allowRowHeaderResize: true,
  allowRowReordering: true,
  allowRowResize: true,
  allowRowResizeFromCell: false,
  allowSorting: true,
  allowGroupingRows: true,
  allowGroupingColumns: true,
  allowMergingCells: true,
  animationDurationShowContextMenu: 50,
  animationDurationHideContextMenu: 50,
  autoGenerateSchema: false,
  autoResizeColumns: false,
  autoResizeRows: true,
  autoScrollOnMousemove: true,
  autoScrollMargin: 20,
  blanksText: '(Blanks)',
  borderDragBehavior: 'move' as BorderDragBehavior,
  borderResizeZone: 5,
  clearCellsWhenShrinkingSelection: false,
  columnHeaderClickBehavior: 'select' as 'sort' | 'select',
  columnSelectorHiddenText: '&nbsp;&nbsp;&nbsp;',
  columnSelectorText: 'Add/Remove columns',
  columnSelectorVisibleText: '\u2713',
  contextHoverScrollAmount: 2,
  contextHoverScrollRateMs: 5,
  copyHeadersOnSelectAll: true,
  copyText: 'Copy',
  drawSynchronously: false,
  debug: false,
  editable: true,
  ellipsisText: '…',
  zeroWidthNoBreakSpace: '\uFEFF',
  enableInternalContextMenu: false,
  filterTextPrefix: '(filtered) ',
  filterFrozenRows: true,
  globalRowResize: false,
  showUnhideColumnsIndicator: true,
  showUnhideRowsIndicator: true,
  showUnhideColumns: 'Unhide Columns',
  showUnhideRows: 'Unhide Rows',
  showHideColumn: 'Hide column',
  showHideColumnRange: 'Hide columns %s-%s',
  showHideColumns: 'Hide columns',
  showHideRow: 'Hide row',
  showHideRowRange: 'Hide rows %s-%s',
  showHideRows: 'Hide rows',
  showHideTableColumns: 'Hide columns from %s',
  showHideColumnMenu: 'Hide columns',
  showUnhideTableColumns: 'Unhide all columns from %s',
  showUnhideColumnMenu: 'Unhide columns',
  hoverMode: 'cell',
  keepFocusOnMouseOut: true,
  locale: 'en-US',
  maxAutoCompleteItems: 200,
  multiLine: false,
  name: '',
  pageUpDownOverlap: 1,
  pasteText: 'Paste',
  persistantSelectionMode: false,
  reorderDeadZone: 3,
  resizeAfterDragged: 'when-multiple-selected' as DragResizeConfig,
  resizeScrollZone: 20,
  resizeAutoFitColumnCount: 10000,
  /**
   * Max number of samples to collect, essentially bypassing the
   * {@link resizeAutoFitMinInvalidSampleCount}.
   */
  resizeAutoFitMaxSampleCount: 1000,
  /**
   * The value to reach before giving up on collecting more samples.  Invalid
   * sample counter resets every time a cell value exceeds the previous largest
   * value.
   */
  resizeAutoFitMinInvalidSampleCount: 100,
  /**
   * This will become obsolete since, since we are now following Google Sheets
   * behavior where only selected rows can be grabbed and that doesn't need a
   * grab area.
   */
  rowGrabZoneSize: 5,
  /* Obsolete: read the desc. above 'rowGrabZoneSize'. */
  columnGrabZoneSize: 30,
  scrollRepeatRate: 75,
  selectionHandleBehavior: 'none',
  selectionMode: 'cell',
  selectionScrollIncrement: 20,
  selectionScrollZone: 20,

  /**
   * The minimum number of digits the row label column should assume it's
   * displaying. This is to give it a minimum width, which is similar to what
   * Excel does.
   */
  rowLabelMinDigits: 3,

  /**
   * The amount of time (ms) that should pass before starting to auto-scroll.
   * This is in place to avoid auto-scrolling when the user just wants to
   * click and scroll only once.
   */
  scrollBoxAutoScrollStartThreshold: 400,
  /**
   * The amount of scroll to apply every time the scroll box auto-scrolls, e.g.,
   * when the user is holding down `MOUSE0`.
   */
  scrollBoxAutoScrollIncrementRatio: 0.65,
  /**
   * The maximum amount of room to leave out as room (its size ratio to the
   * track.)
   */
  scrollBoxInfiniteScrollMaxSpace: 1.2,

  showColumnHeaders: true,
  showColumnSelector: true,
  showCopy: true,
  showFilterInCell: false,
  showNewRow: false,
  showOrderByOption: true,
  showOrderByOptionTextAsc: 'Order by %s ascending',
  showOrderByOptionTextDesc: 'Order by %s descending',
  //#region grouping
  showGroup: 'Group',
  showGroupCollapse: 'Collapse group',
  showGroupExpand: 'Expand group',
  showGroupColumns: 'Group columns %s',
  showGroupRows: 'Group rows %s',
  showRemoveGroup: 'Remove group',
  showMoveGroupToggleButtonToLeft: 'Move +/- button to the left',
  showMoveGroupToggleButtonToRight: 'Move +/- button to the right',
  showMoveGroupToggleButtonToTop: 'Move +/- button to the top',
  showMoveGroupToggleButtonToBottom: 'Move +/- button to the bottom',
  showRemoveGroupColumns: 'Remove group %s',
  showRemoveGroupRows: 'Remove group %s',
  showRemoveAllGroupColumns: 'Remove all column groups',
  showRemoveAllGroupRows: 'Remove all row groups',
  showExpandAllGroupColumns: 'Expand all column groups',
  showExpandAllGroupRows: 'Expand all row groups',
  showCollapseAllGroupColumns: 'Collapse all column groups',
  showCollapseAllGroupRows: 'Collapse all row groups',
  showZooming: true,
  showRange: true,
  //#endregion grouping
  //#region merging
  showMergeCells: 'Merge cells',
  showMergeAllCells: 'Merge all',
  showMergeCellsHorizontally: 'Merge horizontally',
  showMergeCellsVertically: 'Merge vertically',
  showUnmergeCells: 'Unmerge cells',
  //#endregion merging
  showPaste: true,
  showPerformance: false,
  showRowHeaders: true,
  showRowNumbers: true,
  showRowNumberGaps: true,
  singleSelectionMode: false,
  snapToRow: false,
  sortFrozenRows: true,
  touchDeadZone: 5,
  touchEasingMethod: 'easeOutQuad' as keyof GridEasingFunctions,
  touchScrollAnimationTotalIteration: 64,
  /**
   * The minimum speed that the slower axis of the scrolling operation should
   * reach before it can be used as a valid change.
   */
  touchScrollMinimumSpeedLimit: 15,
  touchScrollZone: 20,
  touchSelectHandleZone: 20,
  touchZoomSensitivity: 0.005,
  touchZoomMin: 0.5,
  touchZoomMax: 1.75,
  maxPixelRatio: 5,
  tree: false,
  treeHorizontalScroll: false,
  rowTree: [] as { begin: number; end: number }[],
  rowTreeColIndex: 0,
  columnTree: [] as { begin: number; end: number; row: number; child: any }[],
  columnTreeRowStartIndex: 0,
  columnTreeRowEndIndex: 0,
  zooming: 'Zooming',
  zoomingGroup: [0.5, 0.75, 0.9, 1.0, 1.25, 1.5, 2.0],
  saveRange: 'Add a new Range',
  loadRange: 'Select cells of the Range',

  fillCellCallback: null as (cell: any) => string,
  loadingRenderer: null as LoadingIndicatorRenderer,
};
export const defaultGridAttributeKeys = Object.keys(defaultGridAttributes);
