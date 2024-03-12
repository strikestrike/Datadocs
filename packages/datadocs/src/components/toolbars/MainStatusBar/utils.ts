import {
  getSheetsData,
  changeSheetsData,
} from "../../../app/store/store-worksheets";
import type { WorkbookSheet } from "../../../app/store/types";
import { switchTab } from "../../common/tabs";
import {
  changeWorksheetName,
  createNewWorksheet,
  deleteWorksheet,
  reorderWorksheet as reorderWorksheetApi,
  duplicateWorksheet,
  generateNewWorksheetList,
  handleError,
  recoverWorksheet,
} from "../../../api";
import {
  addHistoryAction,
  createChangeSheetNameAction,
  createDeleteSheetAction,
  createDuplicateSheetAction,
  createNewSheetAction,
  createReorderSheetAction,
} from "../../../app/store/panels/store-history-panel";
import { scrollHorizontal } from "../../../utils/scroll";

export const CONTEXT_MENU_CLASSNAME = "status-bar-context-menu";

export function switchSheet(id: string) {
  const sheetsData = getSheetsData();
  console.log(sheetsData);
  switchTab(sheetsData, id);
  changeSheetsData(sheetsData);
}

export async function addNewSheet() {
  const sheetsData = getSheetsData();
  const activeSheet = sheetsData.find((s) => s.isActive === true);
  await createNewWorksheet(activeSheet.workbookId, activeSheet.id, {
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
        addHistoryAction(
          createNewSheetAction(worksheet, worksheet.position),
          true
        );
      }
    },
    onError: async (error) => {
      handleError(error, {
        onRequestError: (error) => {
          if (error.response.status === 403) {
            alert(error.response.data["message"]);
          }
        },
      });
    },
  });
}

let isChangingSheetName = false;
export async function changeSheetName(
  id: string,
  name: string,
  includeHistory = true
) {
  if (!name) return "Name cannot be empty."; // prevent empty name
  let errorMessage = "";
  const sheetsData = getSheetsData();
  const sheetIdx = sheetsData.findIndex((d) => d.id === id);
  const newSheet = structuredClone(sheetsData[sheetIdx]);

  if (newSheet.name === name || isChangingSheetName) return;
  isChangingSheetName = true;
  newSheet.name = name;
  const oldName = sheetsData[sheetIdx].name;
  await changeWorksheetName(newSheet, {
    onSuccess: async () => {
      // update worksheet data
      sheetsData[sheetIdx].name = name;
      changeSheetsData(sheetsData);
      if (includeHistory) {
        addHistoryAction(
          createChangeSheetNameAction(sheetsData[sheetIdx].id, oldName, name),
          true
        );
      }
    },
    onError: async (error) => {
      errorMessage = "Couldn't change sheet name. Please try again.";
    },
  });
  isChangingSheetName = false;
  return errorMessage;
}

export async function duplicateSheet(worksheet: WorkbookSheet) {
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
      addHistoryAction(
        createDuplicateSheetAction(newWorkSheet, worksheet.name),
        true
      );
    },
    onError: async (error) => {
      handleError(error, {
        onRequestError: (error) => {
          if (error.response.status === 403) {
            alert(error.response.data["message"]);
          }
        },
      });
    },
  });
}

/**
 * Delete a worksheet
 * It will call to server, if there is an error occur such as
 * network error, the sheet won't be removed in UI.
 * TODO: Should have a kind of notification when error occur
 * @param worksheet
 */
export async function deleteSheet(
  worksheet: WorkbookSheet,
  includeHistory = true
) {
  const { workbookId, id: worksheetId } = worksheet;
  await deleteWorksheet(workbookId, worksheetId, {
    onSuccess: async (data) => {
      const sheetsData = getSheetsData();
      const removeIndex = sheetsData.findIndex((s) => {
        return s.workbookId === workbookId && s.id === worksheetId;
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
        if (includeHistory) {
          addHistoryAction(createDeleteSheetAction(worksheet), true);
        }
      }
    },
  });
}

/**
 * Reorder worksheets, turn it back to previous state if there is an
 * error occur
 * @param oldIndex
 * @param newIndex
 */
export async function reorderWorksheet(
  oldIndex: number,
  newIndex: number,
  includeHistory = true
) {
  if (newIndex === oldIndex) return;
  const sheetsData = getSheetsData();
  const oldSheetsData = JSON.stringify(sheetsData);
  const sheet = sheetsData[oldIndex];
  sheetsData.splice(oldIndex, 1);
  sheetsData.splice(newIndex, 0, sheet);
  const previousWorksheetId = newIndex > 0 ? sheetsData[newIndex - 1].id : "";
  changeSheetsData(sheetsData);
  await reorderWorksheetApi(sheet.workbookId, sheet.id, previousWorksheetId, {
    onSuccess: async (data) => {
      const newWorksheetList = generateNewWorksheetList(data.worksheets);
      const newWorksheetId = data.worksheet.worksheetId;
      newWorksheetList.forEach(
        (ws) => (ws.isActive = newWorksheetId === ws.id)
      );
      changeSheetsData(newWorksheetList);
      if (includeHistory) {
        addHistoryAction(
          createReorderSheetAction(newWorksheetId, oldIndex, newIndex),
          true
        );
      }
    },
    onError: async (error) => {
      // console.log("Reorder worksheet Error: ", error);
      changeSheetsData(JSON.parse(oldSheetsData));
    },
  });
}

/**
 * Recover a deleted worksheet
 * It will call to server, if there is an error occur such as
 * network error, the sheet won't be recover in UI.
 * TODO: Should have a kind of notification when error occur
 * @param worksheet
 */
export async function recoverSheet(
  workbookId: string,
  worksheetId: string,
  position: number,
  worksheet: WorkbookSheet = null
) {
  await recoverWorksheet(workbookId, worksheetId, position, {
    onSuccess: async (data) => {
      const newWorksheetList = generateNewWorksheetList(data.worksheets);
      const newWorksheetId = data.worksheet.worksheetId;
      if (worksheet) {
        const worksheetIndex = newWorksheetList.findIndex(
          (ws) => ws.id === newWorksheetId
        );
        if (worksheetIndex !== -1) {
          newWorksheetList[worksheetIndex] = worksheet;
        }
      }
      newWorksheetList.forEach(
        (ws) => (ws.isActive = newWorksheetId === ws.id)
      );
      changeSheetsData(newWorksheetList);
    },
  });
}

export type ScrollDirection = "left" | "right";

export function handleElementScroll(
  elem: HTMLElement,
  delta: number,
  direction: ScrollDirection
) {
  scrollHorizontal(elem, delta, direction);
}
