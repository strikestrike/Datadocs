import type { GridAddEventListenerMethod } from '../types/events';
import type { GridPrivateProperties } from '../types/grid';
import { alphaToInteger, integerToAlpha } from '../util';

export class GridPublicMethods {
  constructor(private self: GridPrivateProperties) {}

  /**
   * Removes focus from the grid.
   */
  blur = () => this.self.controlInput.blur();

  /**
   * Focuses on the grid.
   */
  focus = () => this.self.controlInput.focus();

  //
  //#region copy methods from private modules directly
  //
  addEventListener: GridAddEventListenerMethod = this.self.addEventListener;
  removeEventListener = this.self.removeEventListener;
  dispatchEvent = this.self.dispatchEvent;

  /**
   * Releases grid resources and removes grid elements.
   */
  dispose = this.self.dispose;

  moveSelection = this.self.moveSelection;
  deleteSelectedData = this.self.deleteSelectedData;
  moveTo = this.self.moveTo;

  /**
   * Appends the grid to another element later.  Not implemented.
   */
  appendTo = this.self.appendTo;
  getVisibleCellByIndex = this.self.getVisibleCellByIndex;
  autosize = this.self.autosize;
  beginEditAt = this.self.beginEditAt;
  endEdit = this.self.endEdit;
  inputKeydown = this.self.inputKeydown;
  getInputValue = this.self.getInputValue;
  getInputFormattedValue = this.self.getInputFormattedValue;
  setInputValue = this.self.setInputValue;
  execEditorAction = this.self.execEditorAction;
  getEditorCellStyle = this.self.getEditorCellStyle;
  getSelectedHyperlink = this.self.getSelectedHyperlink;
  editLinkAt = this.self.editLinkAt;
  applyLinkRunChange = this.self.applyLinkRunChange;
  changeFormulaLinkRun = this.self.changeFormulaLinkRun;
  insertLink = this.self.insertLink;
  updateEditorSelection = this.self.updateEditorSelection;
  selectLinkAt = this.self.selectLinkAt;
  removeEditorLinkAt = this.self.removeEditorLinkAt;
  getLinkDefaultStyle = this.self.getLinkDefaultStyle;
  setActiveCell = this.self.setActiveCell;
  editCellsStyle = this.self.editCellsStyle;
  editCellsBorders = this.self.editCellsBorders;
  editCellsDataFormat = this.self.editCellsDataFormat;
  increaseNumberOfDecimalPlaces = this.self.increaseNumberOfDecimalPlaces;
  getSelectionDataTypeList = this.self.getSelectionDataTypeList;
  getCellDataFormatByIndex = this.self.getCellDataFormatByIndex;
  clearCells = this.self.clearCells;
  getStandardColors = this.self.getStandardColors;
  getZoomingValue = this.self.getZoomingValue;
  setZoomingValue = this.self.setZoomingValue;
  getCellStyleByIndex = this.self.getCellStyleByIndex;
  addStylePreview = this.self.addStylePreview;
  removeStylePreview = this.self.removeStylePreview;
  forEachSelectedCell = this.self.forEachSelectedCell;
  scrollIntoView = this.self.scrollIntoView;
  gotoCell = this.self.gotoCell;
  gotoRow = this.self.gotoRow;
  addButton = this.self.addButton;
  // toggleCellCollapseTree = this.self.toggleCellCollapseTree;
  // expandCollapseCellTree = this.self.expandCollapseCellTree;
  getHeaderById = this.self.getHeaderById;
  fitColumnToValues = this.self.fitColumnToValues;
  findColumnMaxTextLength = this.self.findColumnMaxTextLength;
  disposeContextMenu = this.self.disposeContextMenu;
  getContextMenuItems = this.self.getContextMenuItems;
  getCellAt = this.self.getCellAt;
  groupColumns = this.self.groupColumns;
  groupRows = this.self.groupRows;
  removeGroupColumns = this.self.removeGroupColumns;
  removeGroupRows = this.self.removeGroupRows;
  toggleGroupColumns = this.self.toggleGroupColumns;
  toggleGroupRows = this.self.toggleGroupRows;
  getGroupsColumnBelongsTo = this.self.getGroupsColumnBelongsTo;
  getGroupsRowBelongsTo = this.self.getGroupsRowBelongsTo;
  isCellVisible = this.self.isCellVisible;
  isRowVisible = this.self.isRowVisible;
  isColumnVisible = this.self.isColumnVisible;
  draw = this.self.draw;
  refresh = this.self.refresh;
  selectArea = this.self.selectArea;
  requestSelection = this.self.requestSelection;
  hasPendingSelectionRequest = this.self.hasPendingSelectionRequest;
  setFilter = this.self.setFilter;
  insertRow = this.self.insertRow;
  deleteRow = this.self.deleteRow;
  addRow = this.self.addRow;
  insertColumn = this.self.insertColumn;
  deleteColumn = this.self.deleteColumn;
  addColumn = this.self.addColumn;
  getClippingRect = this.self.getClippingRect;
  setRowHeight = this.self.setRowHeight;
  setColumnWidth = this.self.setColumnWidth;
  resetColumnWidths = this.self.resetColumnWidths;
  resetRowHeights = this.self.resetRowHeights;
  resize = this.self.resize;
  selectColumn = this.self.selectColumn;
  selectRow = this.self.selectRow;
  selectAll = this.self.selectAll;
  selectCell = this.self.selectCell;
  selectNone = this.self.selectNone;
  updateCustomHighlights = this.self.updateCustomHighlights;
  getCustomHighlights = this.self.getCustomHighlights;
  integerToAlpha = integerToAlpha;
  alphaToInteger = alphaToInteger;
  copy = this.self.copy;
  cut = this.self.cut;
  paste = this.self.paste;
  setStyleProperty = this.self.setStyleProperty;
  hideColumns = this.self.hideColumns;
  unhideColumns = this.self.unhideColumns;
  hideRows = this.self.hideRows;
  unhideRows = this.self.unhideRows;
  containsMergedCells = this.self.containsMergedCells;
  getMergedCellBounds = this.self.getMergedCellBounds;
  mergeCells = this.self.mergeCells;
  unmergeCells = this.self.unmergeCells;
  getLastSelection = this.self.getLastSelection;
  updateSchema = this.self.updateSchema;
  goToName = this.self.goToName;
  nameSelectedRanges = this.self.nameSelectedRanges;
  getNameBoxState = this.self.getNameBoxState;
  getSelectedCellState = this.self.getSelectedCellDataType;
  getActiveCellTypeData = this.self.getActiveCellTypeData;
  getCellStructTypeDataByIndex = this.self.getCellStructTypeDataByIndex;
  getCellDataTypeByIndex = this.self.getDataTypeByIndex;
  getNameActiveCell = this.self.getNameActiveCell;
  getNameSelections = this.self.getNameSelections;
  getSelections = this.self.getSelections;
  getSelectionsCellValue = this.self.getSelectionsCellValue;
  getActiveCellValue = this.self.getActiveCellValue;
  getCurrentMergedCells = this.self.getCurrentMergedCells;
  undoCellsStyle = this.self.undoCellsStyle;
  redoCellsStyle = this.self.redoCellsStyle;
  undoCellsDataFormat = this.self.undoCellsDataFormat;
  redoCellsDataFormat = this.self.redoCellsDataFormat;
  undoRedoCellsValue = this.self.undoRedoCellsValue;
  redoClearCell = this.self.redoClearCell;
  undoCellsBorders = this.self.undoCellsBorders;
  redoCellsBorders = this.self.redoCellsBorders;
  undoRedoMergedCell = this.self.undoRedoMergedCell;
  getDataTypeByIndex = this.self.getDataTypeByIndex;
  addSelection = this.self.addSelection;
  clearSelections = this.self.clearSelections;
  setGridLocale = this.self.setGridLocale;
  checkTableOnSelection = this.self.checkTableOnSelection;
  getTableAt = this.self.getTableAt;
  getTableCellValueByColumnId = this.self.getTableCellValueByColumnId;
  getTableColumnsAt = this.self.getTableColumnsAt;

  getZIndex = this.self.getZIndex;
  getZIndexInt = this.self.getZIndexInt;

  getMergeCellsState = this.self.getMergeCellsState;
  mergeCurrentSelectedCells = this.self.mergeCurrentSelectedCells;
  unmergeCurrentSelectedCells = this.self.unmergeCurrentSelectedCells;

  openConfirmDialog = this.self.openConfirmDialog;
  onUserHideCellPreview = this.self.onUserHideCellPreview;
  hideCellError = this.self.hideCellError;
  hideCellPreview = this.self.hideCellPreview;
  showCellPreview = this.self.showCellPreview;
  getCellPreviewMessage = this.self.getCellPreviewMessage;
  setCellPreviewMessage = this.self.setCellPreviewMessage;

  previewFormat = this.self.previewFormat;
  getFormatEditCellValue = this.self.getFormatEditCellValue;
  setPassive = this.self.setPassive;

  //
  //#endregion copy methods from private modules directly
  //
}
