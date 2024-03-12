import {
  changeWorksheetName,
  createNewWorksheet,
  deleteWorksheet,
  duplicateWorksheet,
  generateNewWorksheetList,
  handleError,
} from "../../../../../../api";
import {
  createChangeSheetNameAction,
  createDeleteSheetAction,
  createDuplicateSheetAction,
  createNewSheetAction,
  createReorderSheetAction,
} from "../../../../../../app/store/panels/store-history-panel";
import {
  changeSheetsData,
  getSheetsData,
} from "../../../../../../app/store/store-worksheets";
import {
  MACRO_ERROR_CODE_ACTIVATE_SHEET,
  MACRO_ERROR_CODE_CHANGE_SHEET_NAME,
  MACRO_ERROR_CODE_DELETE_SHEET,
  MACRO_ERROR_CODE_DUPLICATE_SHEET,
  MACRO_ERROR_CODE_NEW_SHEET,
  MACRO_ERROR_CODE_REORDER_SHEET,
} from "../../constants";
import type HistoryAction from "../../history/actions/history-action";
import { MacroError } from "../../type";
import { delay } from "../../utils";
import MacroAction, { MacroState } from "./macro-action";
import { reorderWorksheet as reorderWorksheetApi } from "../../../../../../api";
import { switchTab } from "../../../../../common/tabs";
import {
  ActivateSheetAction,
  ActivateSheetState,
} from "../../history/actions/sheet/activate-sheet-action";

export class NewSheetMacroState extends MacroState {
  position: number;
  constructor(position: number) {
    super("ADD_SHEET");
    this.position = position;
  }
}

export class ChangeSheetNameMacroState extends MacroState {
  sheetName: string;
  constructor(sheetName: string) {
    super("CHANGE_SHEET_NAME");
    this.sheetName = sheetName;
  }
}

export class ReorderSheetMacroState extends MacroState {
  position: number;
  constructor(position: number) {
    super("REORDER_SHEET");
    this.position = position;
  }
}

export class ActivateSheetMacroState extends MacroState {
  name: string;
  constructor(name: string) {
    super("ACTIVATE_SHEET");
    this.name = name;
  }
}

export class SheetMacroAction extends MacroAction {
  constructor(sheetState: MacroState) {
    super("PANEL", sheetState);
  }

  async toHistoryAction(): Promise<HistoryAction | MacroError> {
    throw new Error("Method not implemented.");
  }
}

export class NewSheetMacroAction extends SheetMacroAction {
  constructor(sheetState: NewSheetMacroState) {
    super(sheetState);
  }

  async toHistoryAction(): Promise<HistoryAction | MacroError> {
    let res: HistoryAction | MacroError = null;
    const newSheetState = this.macroState as NewSheetMacroState;
    const sheetsData = getSheetsData();
    const index = Math.max(
      0,
      Math.min(newSheetState.position - 1, sheetsData.length - 1)
    );
    const currentSheet = sheetsData[index];
    await createNewWorksheet(currentSheet.workbookId, currentSheet.id, {
      onSuccess: async (data) => {
        if (data) {
          const newWorksheetList = generateNewWorksheetList(data.worksheets);
          const newWorksheetId = data.worksheet.worksheetId;
          newWorksheetList.forEach(
            (ws) => (ws.isActive = newWorksheetId === ws.id)
          );
          changeSheetsData(newWorksheetList);
          const worksheet = newWorksheetList.find(
            (ws) => ws.id === newWorksheetId
          );
          res = createNewSheetAction(worksheet, worksheet.position);
          delay(10);
        }
      },
      onError: async (error) => {
        handleError(error, {
          onRequestError: (error) => {
            res = new MacroError(MACRO_ERROR_CODE_NEW_SHEET);
          },
        });
      },
    });

    return res;
  }
}

export class DuplicateSheetMacroAction extends SheetMacroAction {
  constructor(sheetState: MacroState) {
    super(sheetState);
  }

  async toHistoryAction(): Promise<HistoryAction | MacroError> {
    let res: HistoryAction | MacroError = null;
    const sheetsData = getSheetsData();
    const worksheet = sheetsData.find((ws) => ws.isActive);
    await duplicateWorksheet(worksheet, {
      onSuccess: async (data) => {
        const newWorksheetList = generateNewWorksheetList(data.worksheets);
        const newWorksheetId = data.worksheet.worksheetId;
        newWorksheetList.forEach(
          (ws) => (ws.isActive = newWorksheetId === ws.id)
        );
        const newWorkSheet = newWorksheetList.find(
          (ws) => ws.id === newWorksheetId
        );
        changeSheetsData(newWorksheetList);
        res = createDuplicateSheetAction(newWorkSheet, worksheet.name);
        delay(10);
      },
      onError: async (error) => {
        handleError(error, {
          onRequestError: (error) => {
            res = new MacroError(MACRO_ERROR_CODE_DUPLICATE_SHEET);
          },
        });
      },
    });
    return res;
  }
}

export class ChangeSheetNameMacroAction extends SheetMacroAction {
  constructor(sheetState: ChangeSheetNameMacroState) {
    super(sheetState);
  }

  async toHistoryAction(): Promise<HistoryAction | MacroError> {
    let res: HistoryAction | MacroError = null;
    const newSheetState = this.macroState as ChangeSheetNameMacroState;
    const sheetsData = getSheetsData();
    const sheetIdx = sheetsData.findIndex((ws) => ws.isActive);
    const newSheet = structuredClone(sheetsData[sheetIdx]);

    if (newSheet.name === newSheetState.sheetName)
      return new MacroError(MACRO_ERROR_CODE_CHANGE_SHEET_NAME);
    newSheet.name = newSheetState.sheetName;
    const oldName = sheetsData[sheetIdx].name;
    await changeWorksheetName(newSheet, {
      onSuccess: async () => {
        // update worksheet data
        sheetsData[sheetIdx].name = newSheetState.sheetName;
        changeSheetsData(sheetsData);

        res = createChangeSheetNameAction(
          sheetsData[sheetIdx].id,
          oldName,
          newSheetState.sheetName
        );
      },
      onError: async (error) => {
        res = new MacroError(MACRO_ERROR_CODE_CHANGE_SHEET_NAME);
      },
    });

    return res;
  }
}

export class DeleteSheetMacroAction extends SheetMacroAction {
  constructor(sheetState: MacroState) {
    super(sheetState);
  }

  async toHistoryAction(): Promise<HistoryAction | MacroError> {
    let res: HistoryAction | MacroError = null;
    const sheetsData = getSheetsData();
    if (sheetsData.length === 1) {
      return new MacroError(MACRO_ERROR_CODE_DELETE_SHEET);
    }
    const worksheet = sheetsData.find((ws) => ws.isActive);
    await deleteWorksheet(worksheet.workbookId, worksheet.id, {
      onSuccess: async (data) => {
        const sheetsData = getSheetsData();
        const removeIndex = sheetsData.findIndex((s) => {
          return s.workbookId === worksheet.workbookId && s.id === worksheet.id;
        });
        const currentActiveId = sheetsData.find((s) => s.isActive)?.id;
        if (removeIndex !== -1) {
          const nextActiveIndex = Math.max(removeIndex - 1, 0);
          let nextActiveId = "";
          const deletedSheets = sheetsData.splice(removeIndex, 1);
          if (deletedSheets[0].isActive && sheetsData[nextActiveIndex]) {
            nextActiveId = sheetsData[nextActiveIndex].id;
          } else {
            nextActiveId = currentActiveId || "";
          }
          const newWorksheetList = generateNewWorksheetList(data.worksheets);
          newWorksheetList.forEach(
            (ws) => (ws.isActive = nextActiveId === ws.id)
          );
          changeSheetsData(newWorksheetList);

          res = createDeleteSheetAction(worksheet);
          delay(10);
        }
      },
    });

    return res;
  }
}

export class ReorderSheetMacroAction extends SheetMacroAction {
  constructor(sheetState: ReorderSheetMacroState) {
    super(sheetState);
  }

  async toHistoryAction(): Promise<HistoryAction | MacroError> {
    let res: HistoryAction | MacroError = null;
    const reorderSheetState = this.macroState as ReorderSheetMacroState;
    const sheetsData = getSheetsData();
    if (sheetsData.length <= reorderSheetState.position) {
      return new MacroError(MACRO_ERROR_CODE_REORDER_SHEET);
    }
    const oldIndex = sheetsData.findIndex((ws) => ws.isActive);
    const newIndex = reorderSheetState.position;
    if (oldIndex === newIndex) {
      return null;
    }
    const sheet = sheetsData.find((ws) => ws.isActive);
    sheetsData.splice(oldIndex, 1);
    sheetsData.splice(newIndex, 0, sheet);
    const previousWorksheetId = newIndex > 0 ? sheetsData[newIndex - 1].id : "";
    await reorderWorksheetApi(sheet.workbookId, sheet.id, previousWorksheetId, {
      onSuccess: async (data) => {
        const newWorksheetList = generateNewWorksheetList(data.worksheets);
        const newWorksheetId = data.worksheet.worksheetId;
        newWorksheetList.forEach(
          (ws) => (ws.isActive = newWorksheetId === ws.id)
        );
        changeSheetsData(newWorksheetList);
        res = createReorderSheetAction(newWorksheetId, oldIndex, newIndex);
      },
      onError: async (error) => {
        res = new MacroError(MACRO_ERROR_CODE_REORDER_SHEET);
      },
    });
    return res;
  }
}

export class ActivateSheetMacroAction extends SheetMacroAction {
  constructor(sheetState: ActivateSheetMacroState) {
    super(sheetState);
  }

  async toHistoryAction(): Promise<HistoryAction | MacroError> {
    const activateSheetState = this.macroState as ActivateSheetMacroState;
    const sheetsData = getSheetsData();
    const sheet = sheetsData.find((s) => s.name === activateSheetState.name);
    if (!sheet) {
      return new MacroError(MACRO_ERROR_CODE_ACTIVATE_SHEET);
    }
    if (!sheet.isActive) {
      const sheetsData = getSheetsData();
      switchTab(sheetsData, sheet.id);
      changeSheetsData(sheetsData);
      await delay(10);
      return new ActivateSheetAction(
        sheet.id,
        new ActivateSheetState(sheet.name),
        null,
        []
      );
    }
    return null;
  }
}
