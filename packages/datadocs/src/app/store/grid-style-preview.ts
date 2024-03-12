import { get } from "svelte/store";
import type { StylePreviewType } from "@datadocs/canvas-datagrid-ng/lib/style/preview/base";
import { getGridStore } from "./grid/base";
import type {
  CellDataFormat,
  GridPublicAPI,
} from "@datadocs/canvas-datagrid-ng";
import { MAX_FONT_SIZE, MIN_FONT_SIZE } from "./writables";

const KEY_LIST = ["ctrlKey", "metaKey", "shiftKey"] as const;
const keysState: Record<(typeof KEY_LIST)[number], boolean> = {
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
};

let currentPreviewData: { type: StylePreviewType; data: any } = null;

function getGrid() {
  return get(getGridStore());
}

function isEditing(grid: GridPublicAPI) {
  return !!grid?.input;
}

function setCurrentStylePreview(value: typeof currentPreviewData) {
  currentPreviewData = value ? { ...value } : null;
}

function onWindowKeyStateChange(event: KeyboardEvent) {
  for (const key of KEY_LIST) {
    keysState[key] = event[key];
  }

  if (!currentPreviewData?.type || !currentPreviewData?.data) {
    removeStylePreview();
    return;
  }

  addStylePreviewWithKey(currentPreviewData.type, currentPreviewData.data);
}

// Init all style preview event
(function () {
  window.addEventListener("keydown", onWindowKeyStateChange, true);
  window.addEventListener("keyup", onWindowKeyStateChange, true);
})();

/**
 * Check if the style should be apply to entire column or not
 *
 * @returns
 */
export function checkApplyEntireColumnWithKey() {
  return keysState.metaKey ?? keysState.ctrlKey;
}

export function addStylePreview(
  type: StylePreviewType,
  data: any,
  applyEntireColumn: boolean
) {
  // Make sure to remove current style preview befor adding a new one
  removeStylePreview();

  const grid = getGrid();
  if (!grid || isEditing(grid) || !data || typeof data !== "object") {
    return;
  }

  grid.addStylePreview(type, { ...data, applyEntireColumn });
  setCurrentStylePreview({ type, data });
}

/**
 * Add style preview. It check which key is press to control how to
 * apply style to preview area.
 *
 * @param type
 * @param data
 */
export function addStylePreviewWithKey(type: StylePreviewType, data: any) {
  const applyEntireColumn = checkApplyEntireColumnWithKey();
  addStylePreview(type, data, applyEntireColumn);
}

/**
 * Remove current style preview
 */
export function removeStylePreview() {
  const grid = getGrid();
  grid?.removeStylePreview();
  setCurrentStylePreview(null);
}

/**
 * Add grid zoom preview
 * @param v
 * @returns
 */
export function previewZoomStyle(v: number | string) {
  let value: number;
  if (typeof v === "string") {
    v = v.split("%")[0];
    value = parseInt(v);
    if (isNaN(value)) return;
  } else {
    value = v;
  }
  addStylePreviewWithKey("zoom", { zoom: value / 100 });
}

/**
 * Add text color preview to grid, if no `value` is provided, remove current
 * style preview
 *
 * @param value
 * @returns
 */
export function previewTextColor(value?: string) {
  if (value) {
    addStylePreviewWithKey("static-style", { data: { textColor: value } });
  } else {
    removeStylePreview();
  }
}

/**
 * Add background color preview to grid, if no `value` is provided, remove current
 * style preview
 *
 * @param value
 * @returns
 */
export function previewBackgroundColor(value?: string) {
  if (value) {
    addStylePreviewWithKey("static-style", {
      data: { backgroundColor: value },
    });
  } else {
    removeStylePreview();
  }
}

/**
 * Add font family preview
 * @param value
 */
export function previewFontFamily(value: string) {
  if (value && typeof value === "string") {
    addStylePreviewWithKey("static-style", { data: { fontFamily: value } });
  }
}

/**
 * Add font size preview
 * @param value
 */
export function previewFontSize(value: string | number) {
  let fontSize: number;
  let isValid = true;

  if (typeof value === "string") {
    fontSize = parseInt(value);
    isValid = !isNaN(fontSize);
  } else {
    fontSize = value;
  }

  if (
    fontSize != null &&
    (fontSize < MIN_FONT_SIZE || fontSize > MAX_FONT_SIZE)
  ) {
    isValid = false;
  }

  if (isValid) {
    addStylePreviewWithKey("static-style", { data: { fontSize } });
  } else {
    removeStylePreview();
  }
}

/**
 * Add data format preview
 * @param dataFormat
 * @param dataType
 * @param multipleType
 */
export function previewCellsDataFormat(
  dataFormat: CellDataFormat,
  dataType: string,
  multipleType = false
) {
  addStylePreviewWithKey("data-format", {
    dataFormat,
    dataType,
    multipleType,
  });
}

/**
 * Add preview data format for increase/decrease decimal places
 * @param delta
 */
export function previewIncreaseDecreaseDecimalPlaces(delta: number) {
  const dataFormat = getGrid().increaseNumberOfDecimalPlaces(delta);
  previewCellsDataFormat(dataFormat, "number", false);
}
