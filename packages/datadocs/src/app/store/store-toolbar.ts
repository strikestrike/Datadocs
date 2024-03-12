/**
 * @packageDocumentation
 * @module app/store-toolbar
 */
import escapeHTML from "escape-html";
import { get } from "svelte/store";
import { convertParserResultToGridData, getParserResult } from "./parser";

import { bind } from "../../components/common/modal/modalBind";
import { openModal } from "../../components/common/modal/store-modal";
import { normalizeHexColor } from "../../components/toolbars/MainToolbar/dropdowns/utils/colorUtils";
import DeleteConfirmationModal from "../../components/top-menu/components/modals/DeleteConfirmationModal.svelte";
import { COLOR_SWATCH_LIST_FLAT, standardColorKeys } from "./colors";
import { getGridStore, updateGridLocale } from "./grid/base";
import { activeWorkbookStore, switchWorkbook } from "./store-workbooks";
import {
  selectedTable,
  activeView,
  backgroundColorValue,
  borderState,
  childToolbarValue,
  documentTitleStore,
  fontFamilyValue,
  fontSizeValue,
  formatValue,
  formulaBarValue,
  horizontalAlignValue,
  isBoldStyle,
  isItalicStyle,
  isStrikethroughStyle,
  mergeCellsStateStore,
  nameBoxState,
  selectedCellDatatype,
  activeCellTypeData,
  activeCellStructArrayTypeData,
  textColorValue,
  textWrappingValue,
  verticalAlignValue,
  zoomValue,
  BACKGROUND_COLOR_DEFAULT,
  localeStore,
  tableFieldTooltipDataStore,
  cellLayoverDataStore,
  MIN_FONT_SIZE,
  MAX_FONT_SIZE,
  tableOnSelectionStore,
  textRotationValue,
  tableInUse,
  selectedHyperlinkStore,
  isUnderlineStyle,
  addLinkDataStore,
} from "./writables";

import type {
  CellDataFormat,
  CellWrapMode,
  ConditionalFormattingIcons,
  EditCellDescriptor,
  GridPublicAPI,
  MergeDirection,
  TableFieldTypeTooltipEvent,
  CellDataLayoverEvent,
  CellDetailTypeData,
  SelectionDataTypeListInformation,
  MetaRun,
  CellMeta,
} from "@datadocs/canvas-datagrid-ng";
import type {
  CellClearMode,
  CellStyleDeclaration,
  CellStyleDeclarationKey,
} from "@datadocs/canvas-datagrid-ng/lib/types/cell";
import type { ModalConfigType } from "../../components/common/modal/type";
import type {
  BorderStyle,
  BorderValue,
  FontFamilyDataItem,
  HorizontalAlignValue,
  TextWrappingValue,
  VerticalAlignValue,
} from "../../components/toolbars/MainToolbar/dropdowns/default";

import type { StandardColors } from "./colors";
import { errorToHtml } from "./parser/explain";
import showFieldDropdown from "../../components/panels/TableView/Fields/Dropdown/showFieldDropdown";

import { changeWorkbookName } from "../../api";
import type { WorkbookData } from "../../api";
import {
  addHistoryAction,
  createClearAllGridAction,
  createGridStyleAction,
  createGridValueAction,
  createMergeCellAction,
  handlRefreshGridAndToolbars,
  redoHistoryAction,
  redoMultipleActions,
  undoHistoryAction,
  undoMultipleActions,
} from "./panels/store-history-panel";
import { HISTORY_ACTION_TYPE_REDO } from "../../components/panels/History/types/constants";
import { parseStringToGridData } from "./parser/grid-value";
import { supportedLocaleList } from "./parser/freeform/constants";
import type { LocaleInfo } from "./parser/freeform/types";
import { Locale } from "./parser/freeform/locale";
import { ensureAsync } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/await";
import type { StyleUndoState } from "../../components/panels/History/types/history/actions/grid/style-actions";
import {
  checkApplyEntireColumnWithKey,
  removeStylePreview,
} from "./grid-style-preview";
import type { DataEvent } from "@datadocs/canvas-datagrid-ng/lib/data/data-source/spec/events";
import { createCellsSelection } from "@datadocs/canvas-datagrid-ng/lib/selections/util";
import { cellEditorStyleKeys } from "@datadocs/canvas-datagrid-ng/lib/editor/utils";
import { getUndoRedoCellKey } from "@datadocs/canvas-datagrid-ng/lib/utils/undo-redo";
import { CombineAction } from "../../components/panels/History/types/history/actions/combine-action";
import { isHyperlinkDataFormat } from "@datadocs/canvas-datagrid-ng/lib/data/formatters/util";
import { getValidHyperlink } from "@datadocs/canvas-datagrid-ng/lib/utils/hyperlink";
import showAggregationOptionsDropdown from "../../components/panels/TableView/Summary/showAggregationOptionsDropdown";

export * from "./grid-style-preview";

export { BACKGROUND_COLOR_DEFAULT };

export let standardColors: StandardColors = {
  st1: "#000000",
  st2: "#FFFFFF",
  st3: "#4285F4",
  st4: "#EA4336",
  st5: "#FABD05",
  st6: "#34A852",
  st7: "#FF6D01",
  st8: "#46BDC6",
};

let gridWithEditor: GridPublicAPI;
let valueMapBeforeDelete: Map<string, any>;
let styleMapBeforeDelete: Map<string, Partial<CellStyleDeclaration>>;

/**
 * An object that maps canvas data grid CellWrapMode to ui text wrapping value
 */
const gridWrapModeToTextWrapping: { [key: string]: TextWrappingValue } = {
  overflowing: "overflow",
  "multi-line": "wrap",
  truncated: "clip",
};

let grid: GridPublicAPI;

getGridStore().subscribe((value) => {
  if (grid) {
    // End the ongoing edit operation if there is one.
    endEdit(true);

    grid.removeEventListener("activecellchanged", handleActiveCellChanged);
    grid.removeEventListener("selectionchanged", handleSelectionChanged);
    grid.removeEventListener("beginedit", handleBeginEdit);
    grid.removeEventListener("endedit", handleEndEdit);
    grid.removeEventListener("activecellchanged", updateToolbarButtons);
    grid.removeEventListener("editorselectionchange", updateToolbarButtons);
    grid.removeEventListener("editorvaluechange", handleEditorValueChanged);
    grid.removeEventListener("tablefielddropdown", showFieldDropdown);
    grid.removeEventListener("tablefieldtypetooltip", updateTableFieldTooltip);
    grid.removeEventListener(
      "tableaggregationoptionsdropdown",
      showAggregationOptionsDropdown
    );
    grid.removeEventListener("confirmationmodal", handleConfirmationModal);
    grid.removeEventListener("beforedelete", handleBeforeDelete);
    grid.removeEventListener("afterdelete", handleAfterDelete);
    grid.removeEventListener("celldatalayover", handleCellDataLayoverChange);
    grid.dataSource?.removeListener(handleDataSourceEvent);
    grid.removeEventListener("showupdatelinkmenu", openUpdateLinkMenu);
    grid.removeEventListener("showaddhyperlinkmenu", openAddLinkMenu);

    if (grid !== value) {
      // Reset tooltip data on switching grid
      updateTableFieldTooltip({});
    }
  }

  if (value) {
    grid = value;
    grid.addEventListener("activecellchanged", handleActiveCellChanged);
    // grid.addEventListener("formatcellvalue", handleFormatCellValue);
    grid.addEventListener("selectionchanged", handleSelectionChanged);
    grid.addEventListener("beginedit", handleBeginEdit);
    grid.addEventListener("endedit", handleEndEdit);
    grid.addEventListener("activecellchanged", updateToolbarButtons);
    grid.addEventListener("editorselectionchange", updateToolbarButtons);
    grid.addEventListener("editorvaluechange", handleEditorValueChanged);
    grid.addEventListener("tablefielddropdown", showFieldDropdown);
    grid.addEventListener("tablefieldtypetooltip", updateTableFieldTooltip);
    grid.addEventListener(
      "tableaggregationoptionsdropdown",
      showAggregationOptionsDropdown
    );
    grid.addEventListener("confirmationmodal", handleConfirmationModal);
    grid.addEventListener("beforedelete", handleBeforeDelete);
    grid.addEventListener("afterdelete", handleAfterDelete);
    grid.addEventListener("celldatalayover", handleCellDataLayoverChange);
    grid.dataSource?.addListener(handleDataSourceEvent);
    grid.addEventListener("showupdatelinkmenu", openUpdateLinkMenu);
    grid.addEventListener("showaddhyperlinkmenu", openAddLinkMenu);
    // make sure the UI update when switching among different grids
    handleActiveCellChanged();
    handleSelectionChanged();
    updateToolbarButtons();
    // make sure current standardColors in grid is the same as in UI
    setStandardColors(grid.getStandardColors());
    // init grid zooming value on switching
    handleGridZoomValueChanged();
  }
});

/**
 * A listener to update toolbar button style if active cell is changed
 */
export function updateToolbarButtons() {
  if (!grid) return;

  // Only update when the change is coming from outside the grid.
  let editorStyle: Partial<CellStyleDeclaration> = null;
  if (gridWithEditor) {
    editorStyle = gridWithEditor.getEditorCellStyle();
    const link = gridWithEditor.getSelectedHyperlink();
    selectedHyperlinkStore.set(link);
  }

  const { rowIndex, columnIndex } = grid.activeCell;
  const style = grid.getCellStyleByIndex(columnIndex, rowIndex);
  if (!style && !editorStyle) return;

  // update bold style
  isBoldStyle.set(editorStyle ? editorStyle.isBold : style.isBold);

  // update italic style
  isItalicStyle.set(editorStyle ? editorStyle.isItalic : style.isItalic);

  // update strikethrough
  isStrikethroughStyle.set(
    editorStyle ? editorStyle.isStrikethrough : style.isStrikethrough
  );

  // update underline
  isUnderlineStyle.set(
    editorStyle ? editorStyle.isUnderline : style.isUnderline
  );

  // update font size
  fontSizeValue.set({
    value:
      editorStyle && editorStyle.fontSize
        ? editorStyle.fontSize
        : style.fontSize,
  });

  // update zoom value
  handleGridZoomValueChanged();

  // update font family
  fontFamilyValue.set({
    value:
      editorStyle && editorStyle.fontFamily
        ? editorStyle.fontFamily
        : style.fontFamily,
  });

  // update text color
  // parse to convert any rgba color in the grid to hex color
  // because the color dropdown is using hex color system
  // const textColor = isStandardColorKey(style.textColor)
  //   ? style.textColor
  //   : parseToHex(style.textColor);
  // textColorValue.set({ value: textColor });

  // backgroundColorValue.update((value) => {
  //   return { type: "cellcolor", value: style.backgroundColor };
  // });

  // update horizontal align
  horizontalAlignValue.set(style.horizontalAlignment as any);

  // update vertical align
  verticalAlignValue.set(style.verticalAlignment as any);

  textRotationValue.set({ value: style.textRotation ?? 0 });

  // update text wrapping
  // const textWrapping: TextWrappingValue =
  //   gridWrapModeToTextWrapping[style.wrapMode];
  // textWrappingValue.set(textWrapping);

  selectedCellDatatype.set(grid.getSelectedCellState());
  activeCellTypeData.set(grid.getActiveCellTypeData());
  activeCellStructArrayTypeData.set(grid.getCellStructTypeDataByIndex());
}

function updateTableFieldTooltip(event: Partial<TableFieldTypeTooltipEvent>) {
  tableFieldTooltipDataStore.set({
    table: event.table ?? null,
    header: event.header ?? null,
    buttonPos: event.buttonPos ?? null,
    tooltipData: event.tooltipData ?? null,
  });
}

function handleCellDataLayoverChange(event: Partial<CellDataLayoverEvent>) {
  if (event.cell && !hasGridEditor()) {
    cellLayoverDataStore.set({
      cell: event.cell ?? null,
      cellPos: event.cellPos ?? null,
    });
  } else {
    cellLayoverDataStore.set({});
  }
}

function handleDataSourceEvent(e: DataEvent) {
  if (e.name == "table" && e.tableEvent.type === "datasource") {
    updateSelectedTable();
  } else if (e.name == "data") {
    switch (e.type) {
      case "clear":
      case "tableAdd":
      case "tableDelete":
        updateSelectedTable();
    }
  }
}

function openUpdateLinkMenu(event: any) {
  if (event?.detail) {
    selectedHyperlinkStore.set({
      ...event.detail,
      type: "update-link",
    });
  }
}

function openAddLinkMenu(event: any) {
  const detail = event.detail ?? null;
  addLinkDataStore.set(detail);
}

export function handleSelectionChanged() {
  updateMergeCellsState();
  nameBoxState.set(grid.getNameBoxState(true));
  tableOnSelectionStore.set(grid.checkTableOnSelection());
}

export function handleEditorValueChanged() {
  if (gridWithEditor) {
    const editorValue = gridWithEditor.getInputValue();
    formulaBarValue.set(editorValue);
  }
}

function handleConfirmationModal(event: any) {
  const props = {
    title: event.title,
    mainMessage: event.message,
    executeOnYes: event.yesAction,
    isMovable: false,
  };

  const modalElement = bind(DeleteConfirmationModal, props);
  const config: ModalConfigType = {
    component: modalElement,
    isMovable: false,
    isResizable: false,
    minWidth: 400,
    minHeight: 300,
    preferredWidth: 500,
  };

  openModal(config);

  event.preventDefault();
}

export function handleActiveCellChanged() {
  if (!grid) return;
  const { rowIndex, columnIndex } = grid.activeCell;
  // const value = grid.dataSource.getCellValue(rowIndex, columnIndex);
  const value = grid.getFormatEditCellValue(rowIndex, columnIndex);
  formulaBarValue.set(value ?? "");
  updateSelectedTable();
}

function updateSelectedTable() {
  if (!grid) return;
  if (get(tableInUse)) {
    if (get(selectedTable) != get(tableInUse)) {
      selectedTable.set(get(tableInUse));
    }
  } else {
    const { rowIndex, columnIndex } = grid.activeCell;
    const table = grid.dataSource.getTableByIndex(rowIndex, columnIndex);
    selectedTable.set(table);
  }
}

function updateFormulaCellMetaData() {
  if (!grid?.input || grid.input?.editCell?.table) {
    return;
  }

  const { rowIndex, columnIndex } = grid.input.editCell;
  let value = grid.dataSource.getCellValue(rowIndex, columnIndex);
  const meta = grid.dataSource.getCellMeta(rowIndex, columnIndex) ?? {};
  const existingAst = meta.expressionAst;
  delete meta.cellError;
  delete meta.expressionAst;
  delete meta.parserData;
  if (value && typeof value === "string" && value.startsWith("=")) {
    if (value !== existingAst?.sql) grid.hideCellError();
    const expr = value.substring(1);
    try {
      const expressionAst = getParserResult(expr);
      if (expressionAst.sql !== expr) {
        value = `=${expressionAst.sql}`;
      }
      let errors: string[] = [];
      try {
        if (expressionAst.errors?.syntaxErrors?.length) {
          errors.push(
            ...expressionAst.errors.syntaxErrors.map((e) => errorToHtml(e))
          );
        }
        if (expressionAst.errors?.astErrors?.length) {
          errors.push(
            ...expressionAst.errors.astErrors.map((e) => errorToHtml(e))
          );
        }
        if (expressionAst.errors?.pipelineErrors?.length) {
          errors.push(
            ...expressionAst.errors.pipelineErrors.map((e) => errorToHtml(e))
          );
        }
        if (expressionAst.ast.root?.metadata?.valueErrors) {
          errors.push(
            ...expressionAst.ast.root.metadata.valueErrors.map((e) =>
              errorToHtml(e)
            )
          );
        }
        errors = errors.map((e) => e.replace(/\n/g, "<br />"));
        errors = [...new Set(errors)]; // remove duplicates
      } catch (e) {
        console.error(e);
      }
      if (!errors.length) {
        meta.expressionAst = expressionAst;
        meta.parserData = convertParserResultToGridData(expressionAst.ast.root);
      } else {
        delete meta.expressionAst;
        delete meta.parserData;
        meta.cellError = errors;
      }
      // console.log(errors);
    } catch (e) {
      console.error(e);
      meta.cellError = escapeHTML(e.message);
    }
    grid.dataSource.editCells([
      {
        row: rowIndex,
        column: columnIndex,
        meta,
        value,
      },
    ]);
  } else if (value && typeof value === "string") {
    const meta = grid.dataSource.getCellMeta(rowIndex, columnIndex) ?? {};
    const local = getCurrentLocale();
    const freeformCellData = parseStringToGridData(value, local);
    meta.parserData = freeformCellData.data;
    const cellInfo: EditCellDescriptor = {
      row: rowIndex,
      column: columnIndex,
      meta,
      value,
    };

    if (freeformCellData.format) {
      cellInfo.style = { dataFormat: freeformCellData.format };
    }

    grid.dataSource.editCells([cellInfo]);
  }
}

/**
 * Get all columns of a table that contains cell at (rowIndex , columnIndex)
 * @param rowIndex
 * @param columnIndex
 * @returns
 */
export function getTableColumnsAt(rowIndex: number, columnIndex: number) {
  return grid ? grid.getTableColumnsAt(rowIndex, columnIndex) : null;
}

export function updateFormulaPreview() {
  const editCell = grid.input?.editCell;
  if (!editCell || editCell.table) {
    return;
  }

  // const { rowIndex, columnIndex } = editCell;
  // const meta = editCell.meta ?? {};
  let text = grid.getInputFormattedValue();

  if (text.startsWith("=")) {
    text = text.substring(1);
    try {
      const { ast, errors } = getParserResult(text);
      if (!errors) {
        // meta.preview = {
        //   value: ast.root?.metadata?.canonical,
        //   dataType: ast.root?.typeName,
        // };
        // meta.preview = grid.previewFormat(
        //   convertParserResultToGridData(ast.root)
        // );
        grid.setCellPreviewMessage(
          grid.previewFormat(convertParserResultToGridData(ast.root))
        );
      } else {
        grid.setCellPreviewMessage(null);
      }
    } catch (e) {
      console.error(e);
    }
  } else {
    grid.setCellPreviewMessage(null);
  }

  // grid.dataSource.editCells([
  //   {
  //     row: rowIndex,
  //     column: columnIndex,
  //     meta,
  //   },
  // ]);

  if (document.activeElement === grid.input) {
    grid.showCellPreview();
  } else {
    grid.hideCellPreview();
  }
}

function handleGridZoomValueChanged() {
  const gridZoomingValue = Math.floor(grid.getZoomingValue() * 100);
  zoomValue.set({ value: gridZoomingValue });
}

function handleBeginEdit() {
  if (!grid || !grid.input || gridWithEditor) return;
  gridWithEditor = grid;
  gridWithEditor.input.addEventListener("input", () => {
    formulaBarValue.set(gridWithEditor.getInputValue());
  });

  grid.input.addEventListener("input", updateFormulaPreview);
  grid.input.addEventListener("focus", updateFormulaPreview);
  grid.input.addEventListener("blur", updateFormulaPreview);
  updateFormulaPreview();

  handleCellDataLayoverChange({});
}

function handleEndEdit(event) {
  updateFormulaCellMetaData();

  // make sure there is no selected hyperlink when end editing
  selectedHyperlinkStore.set({});

  grid.input?.removeEventListener("input", updateFormulaPreview);
  grid.input?.removeEventListener("focus", updateFormulaPreview);
  grid.input?.removeEventListener("blur", updateFormulaPreview);
  grid.hideCellPreview();

  gridWithEditor = undefined;
  handleActiveCellChanged();

  // If there is no changes apply at the end of editing cell, don't add new
  // action for undo/redo
  if (!event.isEdited) {
    return;
  }

  const { rowIndex, columnIndex } = event.cell;
  const { oldCellContent, oldCellStyle: oldCellStyleMap } = event;
  const editCellSelection = createCellsSelection(
    rowIndex,
    rowIndex,
    columnIndex,
    columnIndex
  );
  const customSelections = [editCellSelection];
  const editCell = { rowIndex, columnIndex };
  const oldCellStyle =
    oldCellStyleMap.get(getUndoRedoCellKey(rowIndex, columnIndex)) || {};
  const newCellStyle = grid
    .getSelectionsCellValue(cellEditorStyleKeys, customSelections)
    .get(getUndoRedoCellKey(rowIndex, columnIndex));
  const newCellContent = grid.getSelectionsCellValue(
    "content",
    customSelections
  );
  const valueAfterEdit = grid.dataSource.getCellValue(rowIndex, columnIndex);
  const changedKeys: typeof cellEditorStyleKeys = [];

  for (const key of cellEditorStyleKeys) {
    if (oldCellStyle?.[key] != null || newCellStyle?.[key] != null) {
      changedKeys.push(key);
    }
    if (newCellStyle && newCellStyle[key] == null) {
      delete newCellStyle[key];
    }
  }

  addHistoryAction(
    new CombineAction(
      "Edit cell",
      [
        createGridStyleAction(
          customSelections,
          editCell,
          changedKeys,
          oldCellStyleMap,
          newCellStyle ?? {}
        ),
        createGridValueAction(
          customSelections,
          editCell,
          "ENTER_VALUE",
          oldCellContent,
          newCellContent,
          valueAfterEdit
        ),
        // createGridValueAction(
        //   grid.getSelections(),
        //   grid.activeCell,
        //   "ENTER_VALUE",
        //   null,
        //   null,
        //   valueAfterEdit
        // ),
      ],
      null,
      [],
      false
    )
  );
}

/**
 * Check if there is opened grid editor
 * @returns
 */
export function hasGridEditor() {
  return !!grid?.input;
}

/**
 * Check if there is an editor open for cell at @rowIndex and @columnIndex
 * @param rowIndex
 * @param columnIndex
 */
export function checkCellOnEditting(rowIndex: number, columnIndex: number) {
  if (!hasGridEditor()) {
    return false;
  }

  return (
    rowIndex === grid.input.editCell?.rowIndex &&
    columnIndex === grid.input.editCell?.columnIndex
  );
}

function handleBeforeDelete() {
  getValueBeforeDelete("content");
}

function getValueBeforeDelete(mode: CellClearMode) {
  if (!grid) return;

  if (mode === "content" || mode === "all") {
    valueMapBeforeDelete = grid.getSelectionsCellValue("content");
  }

  if (mode === "format" || mode === "all") {
    styleMapBeforeDelete = grid.getSelectionsCellValue("format");
  }
}

function handleAfterDelete() {
  handleHistoryClearCell("content");
}

function handleHistoryClearCell(mode: CellClearMode) {
  if (!grid) return;
  if (mode === "content") {
    addHistoryAction(
      createGridValueAction(
        grid.getSelections(),
        grid.activeCell,
        "CLEAR_VALUE",
        valueMapBeforeDelete,
        null,
        ""
      ),
      true
    );
  } else if (mode === "format") {
    addHistoryAction(
      createGridStyleAction(
        grid.getSelections(),
        grid.activeCell,
        "CLEAR_STYLE",
        styleMapBeforeDelete,
        {}
      ),
      true
    );
  } else if (mode === "all") {
    addHistoryAction(
      createClearAllGridAction(
        grid.getSelections(),
        grid.activeCell,
        [
          createGridStyleAction(
            grid.getSelections(),
            grid.activeCell,
            "CLEAR_STYLE",
            styleMapBeforeDelete,
            {}
          ),
          createGridValueAction(
            grid.getSelections(),
            grid.activeCell,
            "CLEAR_VALUE",
            valueMapBeforeDelete,
            null,
            ""
          ),
        ],
        ["style", "content"]
      ),
      true
    );
  }
}

async function handleEditCellStyle(
  cellStyle: Partial<CellStyleDeclaration>,
  applyEntireColumn?: boolean
) {
  if (!grid) return;

  applyEntireColumn = applyEntireColumn ?? false;
  const keys = Object.keys(cellStyle) as CellStyleDeclarationKey[];
  const shouldClearStyleRun = !keys.includes("styleRuns");

  const { valueMap: oldValue, columnsState } = await ensureAsync(
    grid.editCellsStyle(cellStyle, shouldClearStyleRun, applyEntireColumn)
  );

  const styleAction = createGridStyleAction(
    grid.getSelections(),
    grid.activeCell,
    [...keys],
    oldValue,
    cellStyle,
    keys,
    { applyEntireColumn }
  );

  (styleAction.undoState as StyleUndoState).setColumnState(columnsState);
  addHistoryAction(styleAction, true);
}

/**
 * Begin cell edit at (rowIndex, columnIndex), if there is no index
 * provided, fallback to use activeCell.
 *
 * @param rowIndex
 * @param columnIndex
 * @param noFocus
 * @returns
 */
export function beginEdit(
  rowIndex?: number,
  columnIndex?: number,
  noFocus = true
) {
  if (!grid) return;

  if (rowIndex == null || columnIndex == null) {
    rowIndex = grid.activeCell.rowIndex;
    columnIndex = grid.activeCell.columnIndex;
  } else if (rowIndex < 0 || columnIndex < 0) {
    return;
  } else {
    // Set active cell if cell index is provided
    // grid.setActiveCell(columnIndex, rowIndex);
    // grid.clearSelections(false, false);
    grid.selectCell(rowIndex, columnIndex);
  }
  grid.beginEditAt(columnIndex, rowIndex, undefined, false, noFocus);
}

export function endEdit(aborted?: boolean) {
  gridWithEditor?.endEdit(aborted);
}

/**
 * The table that contains the active cell on the currently focused grid.
 */

formulaBarValue.subscribe((value: string) => {
  // Only update when the change is coming from outside the grid.
  if (!gridWithEditor || document.activeElement == gridWithEditor.input) {
    return;
  }
  gridWithEditor.setInputValue(value);
});

export function handleEditorSelection() {
  if (
    gridWithEditor &&
    (document.activeElement as HTMLElement).dataset.formulainput
  ) {
    const range = document.getSelection().getRangeAt(0);
    gridWithEditor?.updateEditorSelection({
      startOffset: range.startOffset,
      endOffset: range.endOffset,
    });
  }
}

/**
 * Select a link at text offset. It is used to select a specific link when open
 * editor for editing.
 * @param offset
 */
export function selectLinkAt(offset: number) {
  if (gridWithEditor) {
    gridWithEditor.selectLinkAt(offset);
  }
}

/**
 * Remove a link at text offset.
 * @param offset
 */
export function removeEditorLinkAt(offset: number) {
  if (gridWithEditor) {
    gridWithEditor.removeEditorLinkAt(offset);
  }
}

/**
 * Edit a cell meta (remove hyperlink)
 *
 * Note: The changed cell can be outside of selection area. So we need to
 * make sure after undo/redo selections and active cell need to be intact.
 * Two additional actions are added for that reason.
 * @param rowIndex
 * @param columnIndex
 * @param meta
 */
export async function editCellMeta(
  rowIndex: number,
  columnIndex: number,
  meta: CellMeta
) {
  const customSelection = createCellsSelection(
    rowIndex,
    rowIndex,
    columnIndex,
    columnIndex
  );
  const getCellState = () => {
    return grid.getSelectionsCellValue("content", [customSelection]);
  };

  const oldState = getCellState();
  await ensureAsync(
    grid.dataSource.editCells([
      {
        row: rowIndex,
        column: columnIndex,
        meta,
      },
    ])
  );
  const newState = getCellState();

  const valueAfterEdit = await ensureAsync(
    grid.dataSource.getCellValue(rowIndex, columnIndex)
  );

  addHistoryAction(
    new CombineAction(
      "Edit cell meta",
      [
        createGridValueAction(
          grid.getSelections(),
          grid.activeCell,
          "ENTER_VALUE",
          null,
          null,
          valueAfterEdit
        ),
        createGridValueAction(
          [customSelection],
          grid.activeCell,
          "ENTER_VALUE",
          oldState,
          newState,
          valueAfterEdit
        ),
        createGridValueAction(
          grid.getSelections(),
          grid.activeCell,
          "ENTER_VALUE",
          null,
          null,
          valueAfterEdit
        ),
      ],
      null,
      [],
      false
    )
  );
}

/**
 * Start edit hyperlink
 * @param index
 */
export function editLinkAt(index: number) {
  if (gridWithEditor) {
    gridWithEditor.editLinkAt();
  }
}

export function applyLinkRunChange(run: MetaRun, label: string, ref: string) {
  if (gridWithEditor) {
    gridWithEditor.applyLinkRunChange(run, label, ref);
  }
}

export function onFormulaBarKeydown(e: KeyboardEvent) {
  handleEditorSelection();
  gridWithEditor?.inputKeydown(e, false, true);
}

export function onFormulaBarMouseUp(e: MouseEvent) {
  handleEditorSelection();
}

// Undo history action
export async function handleUndo() {
  await undoHistoryAction();
  handlRefreshGridAndToolbars();
}

// Redo history action
export async function handleRedo() {
  await redoHistoryAction();
  handlRefreshGridAndToolbars();
}

// Undo/Redo many actions in history
export function handleUndoRedoMutlipleActions(type: string, actionId: string) {
  if (type === HISTORY_ACTION_TYPE_REDO) {
    redoMultipleActions(actionId);
  } else {
    undoMultipleActions(actionId);
  }
}

/**
 * Change font bold style
 * @param isBold
 * @param applyEntireColumn
 */
export async function changeBoldStyle(
  isBold: boolean,
  applyEntireColumn: boolean
) {
  // Only update when the change is coming from outside the grid.
  if (gridWithEditor && document.activeElement != gridWithEditor.input) {
    handleEditorSelection();
    gridWithEditor.execEditorAction("bold");
  } else {
    await handleEditCellStyle({ isBold: isBold }, applyEntireColumn);
    isBoldStyle.set(isBold);
  }
}

/**
 * Change font italic style
 * @param isItalic
 * @param applyEntireColumn
 */
export async function changeItalicStyle(
  isItalic: boolean,
  applyEntireColumn: boolean
) {
  if (gridWithEditor && document.activeElement != gridWithEditor.input) {
    handleEditorSelection();
    gridWithEditor.execEditorAction("italic");
  } else {
    await handleEditCellStyle({ isItalic: isItalic }, applyEntireColumn);
    isItalicStyle.set(isItalic);
  }
}

/**
 * Change font strikethrough style
 * @param isStrikethrough
 * @param applyEntireColumn
 */
export async function changeStrikethroughStyle(
  isStrikethrough: boolean,
  applyEntireColumn: boolean
) {
  if (gridWithEditor && document.activeElement != gridWithEditor.input) {
    handleEditorSelection();
    gridWithEditor.execEditorAction("strikethrough");
  } else {
    await handleEditCellStyle(
      { isStrikethrough: isStrikethrough },
      applyEntireColumn
    );
    isStrikethroughStyle.set(isStrikethrough);
  }
}

/**
 * Change text underline style
 * @param isUnderline
 * @param applyEntireColumn
 */
export async function changeUnderlineStyle(
  isUnderline: boolean,
  applyEntireColumn: boolean
) {
  if (gridWithEditor && document.activeElement != gridWithEditor.input) {
    handleEditorSelection();
    gridWithEditor.execEditorAction("underline");
  } else {
    await handleEditCellStyle({ isUnderline }, applyEntireColumn);
    isUnderlineStyle.set(isUnderline);
  }
}

// zoom style

export function changeZoomValue(v: string | number, reset?: boolean) {
  const ZOOM_VALUE_MIN = 50;
  const ZOOM_VALUE_MAX = 200;

  let value: number;
  let newZoomValue: number;

  function resetZoomValue() {
    zoomValue.update((prev) => prev);
  }

  if (reset) {
    resetZoomValue();
    return;
  }

  if (typeof v === "string") {
    v = v.split("%")[0];
    value = parseInt(v);

    if (isNaN(value)) {
      resetZoomValue();
      return;
    }
  } else {
    value = v;
  }

  if (value <= ZOOM_VALUE_MIN) {
    newZoomValue = ZOOM_VALUE_MIN;
  } else if (value >= ZOOM_VALUE_MAX) {
    newZoomValue = ZOOM_VALUE_MAX;
  } else {
    newZoomValue = value;
  }

  removeStylePreview();
  grid.setZoomingValue(newZoomValue / 100);
  handleGridZoomValueChanged();
}

/**
 * Change font size style
 * @param v
 * @param reset
 * @returns
 */
export async function changeFontSizeValue(v: string | number, reset?: boolean) {
  let value: number;
  let newFontSizeValue: number;

  function resetFontSizeValue() {
    fontSizeValue.update((prev) => {
      return { value: prev.value };
    });
  }

  if (reset) {
    resetFontSizeValue();
    return;
  }

  if (typeof v === "string") {
    value = parseInt(v);

    if (isNaN(value)) {
      resetFontSizeValue();
      return;
    }
  } else {
    value = v;
  }

  if (value < MIN_FONT_SIZE) {
    resetFontSizeValue();
    return;
  } else if (value >= MAX_FONT_SIZE) {
    newFontSizeValue = MAX_FONT_SIZE;
  } else {
    newFontSizeValue = value;
  }

  if (gridWithEditor && document.activeElement != gridWithEditor.input) {
    handleEditorSelection();
    gridWithEditor.execEditorAction("fontSize", newFontSizeValue.toString());
  } else {
    const applyEntireColumn = checkApplyEntireColumnWithKey();
    fontSizeValue.set({ value: newFontSizeValue });
    await handleEditCellStyle(
      { fontSize: newFontSizeValue },
      applyEntireColumn
    );
  }
}

// format style
export type FormatValue =
  | "automatic"
  | "plain_text"
  | "number"
  | "percentage"
  | "scientific"
  | "accounting"
  | "financial"
  | "currency"
  | "currency_rounded"
  | "date"
  | "time"
  | "date_time"
  | "duration";

export function changeFormatValue(v: FormatValue) {
  formatValue.set({ value: v });
}

// font family
export const GRID_DEFAULT_FONT_FAMILY = "Arial, sans-serif";

let recentlyUsedFonts: FontFamilyDataItem[] = [];

export async function changeFontFamilyValue(v: string) {
  const isDefaultFont = v === GRID_DEFAULT_FONT_FAMILY;
  fontFamilyValue.set({ value: v });
  // set custom font family to null to use grid default font
  v = isDefaultFont ? null : v;

  if (gridWithEditor && document.activeElement != gridWithEditor.input) {
    handleEditorSelection();
    gridWithEditor.execEditorAction("fontName", v);
  } else {
    const applyEntireColumn = checkApplyEntireColumnWithKey();
    await handleEditCellStyle({ fontFamily: v }, applyEntireColumn);
  }
}

export function getRecentlyUsedFonts(): FontFamilyDataItem[] {
  return recentlyUsedFonts;
}

export function setRecentlyUsedFonts(fonts: FontFamilyDataItem[]) {
  recentlyUsedFonts = fonts;
}

export function setStandardColors(colors: StandardColors) {
  standardColors = colors;
}

export function getStandardColors() {
  return standardColors;
}

/**
 * Get key list of standard color, the key list should be in specific order to
 * show in color menu
 */
export function getStandardColorKeys() {
  return standardColorKeys;
}

/**
 *
 * @param keyOrColor color/key in standard colors
 * @returns return true if the @keyOrColor is key in standard color, otherwise
 *     fale
 */
export function isStandardColorKey(keyOrColor: string): boolean {
  return (
    standardColors && Object.hasOwnProperty.call(standardColors, keyOrColor)
  );
}

/**
 * Get actual color value from color key in standard colors or return the color
 * itself
 * @param keyOrColor color/key in standard colors
 * @returns the actual color that value indicate
 */
export function getColorFromValue(keyOrColor: string): string {
  return isStandardColorKey(keyOrColor)
    ? standardColors[keyOrColor]
    : keyOrColor;
}

// text color
export function getTextColorValue(): string {
  return get(textColorValue).value;
}

/**
 * Set text-color style for cells or style runs
 * @param value
 */
export async function changeTextColorValue(value: string) {
  if (gridWithEditor && document.activeElement != gridWithEditor.input) {
    gridWithEditor.execEditorAction("foreColor", value);
  } else {
    const applyEntireColumn = checkApplyEntireColumnWithKey();
    textColorValue.set({ value });
    await handleEditCellStyle({ textColor: value }, applyEntireColumn);
  }
}

export async function resetTextColorValue() {
  // await handleEditCellStyle({ textColor: "" });
  // updateToolbarButtons();
  await changeTextColorValue("");
}

// background color
export type BackgroundColorValueType = {
  type: "cellcolor" | "textbg";
  value: string;
};

export function getBackgroundColorValue(): BackgroundColorValueType {
  return get(backgroundColorValue);
}

export async function changeBackgroundColorValue(v: BackgroundColorValueType) {
  if (v.value && !standardColors[v.value]) {
    v.value = normalizeHexColor(v.value);
  }
  backgroundColorValue.set({ ...v });
  if (v.type === "cellcolor") {
    const applyEntireColumn = checkApplyEntireColumnWithKey();
    await handleEditCellStyle({ backgroundColor: v.value }, applyEntireColumn);
  }
}

// custom colors
let customColors: string[] = []; // ["#4285F4", "#EA4336"];

export function getCustomColors() {
  return customColors;
}

export function setCustomColors(v: string[]) {
  customColors = v;
}

/**
 * Add new custom color into custom colors if not in color swatch list or
 * current custom color list
 * @param color color hex string
 */
export function addCustomColor(color: string) {
  color = normalizeHexColor(color);
  const customColorList = getCustomColors();
  const isInColorSwatchList = !!COLOR_SWATCH_LIST_FLAT.find(
    (v) => normalizeHexColor(color) === normalizeHexColor(v)
  );
  const isInCustomColorList = !!customColorList.find(
    (v) => normalizeHexColor(color) === normalizeHexColor(v)
  );

  if (!isInColorSwatchList && !isInCustomColorList) {
    const newCustomColorList = [...customColorList, color];
    setCustomColors(newCustomColorList);
  }
}

// borders style

/**
 * Update border color that will be used for cell border style
 * @param color
 */
export function changeBorderColor(color: string) {
  color = normalizeHexColor(color);
  borderState.update((state) => {
    return color ? { ...state, color } : state;
  });
}

/**
 * Update border style that will be used for cell border style
 * @param style
 */
export function changeBorderStyle(style: BorderStyle) {
  borderState.update((state) => {
    return { ...state, style };
  });
}

/**
 * Change to grid cells borders style
 */
export async function editCellsBorderStyle(type: BorderValue) {
  const state = get(borderState);
  const { style } = state;
  let { color } = state;
  if (!color || !style) return;

  if (!standardColors[color]) {
    color = normalizeHexColor(color);
  } else {
    color = normalizeHexColor(standardColors[color]);
  }

  const applyEntireColumn = checkApplyEntireColumnWithKey();
  const undoState = await grid.editCellsBorders(
    style,
    color,
    type,
    applyEntireColumn
  );

  const styleAction = createGridStyleAction(
    grid.getSelections(),
    grid.activeCell,
    ["borders"],
    undoState.valueMap,
    { style, color, type },
    ["borders"],
    { applyEntireColumn }
  );

  (styleAction.undoState as StyleUndoState).setColumnState(
    undoState.columnsState
  );

  addHistoryAction(styleAction, true);
}

// cell style
let activeCellStyle = "";

export function setActiveCellStyle(value: string) {
  activeCellStyle = value;
}

export function getActiveCellStyle() {
  return activeCellStyle;
}

// merge cells
export type MergeCellsDirection = "center" | "horizontal" | "vertical";
export type MergeCellsState = {
  canMergeAll: boolean;
  canMergeDirectionally: boolean;
  canUnmerge: boolean;
};

function updateMergeCellsState() {
  const state: MergeCellsState = grid.getMergeCellsState();
  mergeCellsStateStore.set(state);
}

export function mergeCells(direction: MergeCellsDirection) {
  const state = get(mergeCellsStateStore);
  if (
    (direction === "center" && state.canMergeAll) ||
    (direction === "horizontal" && state.canMergeDirectionally) ||
    (direction === "vertical" && state.canMergeDirectionally)
  ) {
    const oldMergedCells = grid.getCurrentMergedCells();
    grid.mergeCurrentSelectedCells(direction as MergeDirection);
    addHistoryAction(
      createMergeCellAction(
        "MERGE_CELL",
        grid.getSelections(),
        grid.activeCell,
        oldMergedCells,
        grid.getCurrentMergedCells(),
        direction
      ),
      true
    );
    updateMergeCellsState();
  }
}

export function unmergeCells() {
  const state = get(mergeCellsStateStore);
  if (state.canUnmerge) {
    const oldMergedCells = grid.getCurrentMergedCells();
    grid.unmergeCurrentSelectedCells();
    addHistoryAction(
      createMergeCellAction(
        "UNMERGE_CELL",
        grid.getSelections(),
        grid.activeCell,
        oldMergedCells,
        [],
        "center"
      ),
      true
    );
    updateMergeCellsState();
  }
}

// horizontal align
export async function changeHorizontalAlignValue(value: HorizontalAlignValue) {
  // const oldValue = get(horizontalAlignValue);
  // if (value === oldValue) return;
  const applyEntireColumn = checkApplyEntireColumnWithKey();
  await handleEditCellStyle({ horizontalAlignment: value }, applyEntireColumn);
  horizontalAlignValue.set(value);
}

// vertical align
export async function changeVerticalAlignValue(value: VerticalAlignValue) {
  // const oldValue = get(verticalAlignValue);
  // if (value === oldValue) return;
  const applyEntireColumn = checkApplyEntireColumnWithKey();
  await handleEditCellStyle({ verticalAlignment: value }, applyEntireColumn);
  verticalAlignValue.set(value);
}

// text wrapping
export async function changeTextWrappingValue(value: TextWrappingValue) {
  // const oldValue = get(textWrappingValue);
  // if (value === oldValue) return;
  let wrapMode: CellWrapMode;
  for (const [k, v] of Object.entries(gridWrapModeToTextWrapping)) {
    if (value === v) {
      wrapMode = k as CellWrapMode;
      break;
    }
  }
  const applyEntireColumn = checkApplyEntireColumnWithKey();
  await handleEditCellStyle({ wrapMode }, applyEntireColumn);
  textWrappingValue.set(value);
}

export async function changeTextRotationValue(
  value: number | string,
  reset?: boolean
) {
  const TEXT_ROTATION_MIN = -90;
  const TEXT_ROTATION_MAX = 90;

  function resetTextRotation() {
    textRotationValue.update((prev) => {
      return { value: prev.value };
    });
  }

  if (reset) {
    resetTextRotation();
    return;
  }

  if (typeof value === "string") {
    value = value.split("°")[0];
    value = parseInt(value);

    if (isNaN(value)) {
      resetTextRotation();
      return;
    }
  }

  if (value < TEXT_ROTATION_MIN || value > TEXT_ROTATION_MAX) {
    resetTextRotation();
    return;
  }

  const applyEntireColumn = checkApplyEntireColumnWithKey();
  await handleEditCellStyle({ textRotation: value }, applyEntireColumn);
  textRotationValue.set({ value });
}

export async function setTextRotationStackVertically() {
  const applyEntireColumn = checkApplyEntireColumnWithKey();
  await handleEditCellStyle({ textRotation: 180 }, applyEntireColumn);
  textRotationValue.set({ value: 180 });
}

/**
 * Change data format for cell, when CMD/CTRL key is pressed, apply
 * to entire column is used
 * @param format
 * @param firstString
 * @returns
 */
export async function changeCellsDataFormat(
  format: CellDataFormat,
  firstString?: SelectionDataTypeListInformation["firstString"]
) {
  if (!grid) return;
  const applyEntireColumn = checkApplyEntireColumnWithKey();

  // When apply hyperlink data format to cell, we need to make sure that all
  // link-runs must be removed as well.
  let clearLinkRuns = false;

  if (isHyperlinkDataFormat(format)) {
    const isLinkValue = !!getValidHyperlink(firstString?.value ?? "");
    format.style = isLinkValue ? "lempty" : "rempty";
    clearLinkRuns = true;
  }

  await handleEditCellDataFormat(format, applyEntireColumn, clearLinkRuns);
}

export async function updateHyperlinkDataFormat(format: CellDataFormat) {
  if (!grid) return;
  const applyEntireColumn = checkApplyEntireColumnWithKey();

  if (isHyperlinkDataFormat(format)) {
    await handleEditCellDataFormat(format, applyEntireColumn);
  }
}

/**
 * Edit cell data format.
 * @param format
 * @param applyEntireColumn Whether the format is applied to entire column or not
 * @param clearLinkRuns Whether the link-runs should be cleared or not
 */
async function handleEditCellDataFormat(
  format: CellDataFormat,
  applyEntireColumn: boolean,
  clearLinkRuns = false
) {
  // const keys: CellStyleDeclarationKey[] = ["dataFormat"];
  // const oldValue = grid.getSelectionsCellValue(keys);
  const cellStyle: Partial<CellStyleDeclaration> = { dataFormat: format };

  const { valueMap: oldValue, columnsState } = await ensureAsync(
    grid.editCellsDataFormat(format, applyEntireColumn, clearLinkRuns)
  );

  const styleAction = createGridStyleAction(
    grid.getSelections(),
    grid.activeCell,
    ["dataFormat"],
    oldValue,
    cellStyle,
    ["dataFormat"],
    { applyEntireColumn, clearLinkRuns }
  );

  (styleAction.undoState as StyleUndoState).setColumnState(columnsState);
  addHistoryAction(styleAction, true);
}

export async function increaseNumberOfDecimalPlaces(delta: number) {
  const dataFormat = grid.increaseNumberOfDecimalPlaces(delta);
  await changeCellsDataFormat(dataFormat);
  // const keys: CellStyleDeclarationKey[] = ["dataFormat"];
  // const beforeValue = grid.getSelectionsCellValue(keys);
  // const dataFormat = grid.increaseNumberDecimalPlaces(delta);

  // if (dataFormat) {
  //   const cellStyle: Partial<CellStyleDeclaration> = { dataFormat };
  //   addHistoryAction(
  //     createGridStyleAction(
  //       grid.getSelections(),
  //       grid.activeCell,
  //       [...keys],
  //       beforeValue,
  //       cellStyle,
  //       keys,
  //       { applyPartial: false }
  //     ),
  //     true
  //   );
}

export function getFormatDataTypeList(): SelectionDataTypeListInformation {
  return grid.getSelectionDataTypeList();
}

export function getActiveCellDataFormat(): CellDataFormat {
  return grid.getCellDataFormatByIndex();
}

export function getCellDataFormatByIndex(
  rowIndex: number,
  columnIndex: number
) {
  return grid.getCellDataFormatByIndex(rowIndex, columnIndex);
}

export function getActiveCellStructTypeData(): CellDetailTypeData {
  return grid.getCellStructTypeDataByIndex();
}

// Child toolbar
export type ChildToolbar = "home" | "image";

export function switchChildToolbar(value: ChildToolbar) {
  const currentToolbar = get(childToolbarValue);
  if (value === currentToolbar) return;
  childToolbarValue.set(value);
}

// Subscribe to active view change and switch child toolbar
// depend on the type of active view
activeView.subscribe((view) => {
  if (view.type === "image") {
    switchChildToolbar("image");
  } else {
    switchChildToolbar("home");
  }
});

// conditional formatting icon set
export async function changeConditionalFormattingIconSet(
  value: ConditionalFormattingIcons
) {
  const iconSet = value.iconSet;
  await handleEditCellStyle({ iconSet });
}

// Cell modification clear
export function clearCells(mode: CellClearMode) {
  getValueBeforeDelete(mode);
  grid.clearCells(mode);
  handleHistoryClearCell(mode);
}

// document title
export const DEFAULT_DOCUMENT_NAME = "Datadoc-Database";

export function getDocumentName(): string {
  return get(documentTitleStore);
}

/**
 * Change active workbook name
 * @param title
 * @returns true if success, otherwise false
 */
export async function setDocumentName(title: string) {
  if (title === get(activeWorkbookStore).name) {
    // name hasn't changed, do nothing and return as success
    return true;
  }
  let success = false;

  await changeWorkbookName(title, {
    onSuccess: async (data) => {
      const workbook: WorkbookData = data.object;
      const activeWorkbook = get(activeWorkbookStore);
      activeWorkbook.name = workbook.name;
      activeWorkbook.vanitySlug = workbook.vanitySlug;
      switchWorkbook(activeWorkbook.id);
      success = true;
    },
  });

  return success;
}

activeWorkbookStore.subscribe((wb) => {
  if (wb && wb.name) documentTitleStore.set(wb.name);
});

/**
 * setting for locale
 * @param localeStr
 */
export function changeLocale(localeStr: string) {
  const locale = new Locale(supportedLocaleList[localeStr]);
  updateGridLocale(locale.locale);
  localeStore.set(locale);
}

/**
 * Getting current locale
 * @returns
 */
export function getCurrentLocale(): Locale {
  let locale = get(localeStore);
  if (!locale) {
    locale = new Locale(supportedLocaleList["en"]);
    localeStore.set(locale);
  }
  return locale;
}

// export function shouldApplyEntireColumn() {
//   return get(applyEntireColumnStore);
// }

// export function setApplyEntireColumn(value: boolean) {
//   applyEntireColumnStore.set(value ?? false);
// }
