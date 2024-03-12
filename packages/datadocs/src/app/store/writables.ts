import type {
  GridHeader,
  NameBoxState,
  PixelBoundingRect,
  TableDescriptor,
  TableSpillBehavior,
  CellDetailTypeData,
  NormalCellDescriptor,
  MetaRun,
} from "@datadocs/canvas-datagrid-ng/lib/types";
import type { Readable, Writable } from "svelte/store";
import { writable, readable } from "svelte/store";
import type {
  BackgroundColorValueType,
  FormatValue,
  MergeCellsState,
} from "./store-toolbar";
import type {
  HorizontalAlignValue,
  VerticalAlignValue,
  TextWrappingValue,
  BorderStyle,
  ChildToolbar,
} from "../../components/toolbars/MainToolbar/dropdowns/default";
import { normalizeHexColor } from "../../components/toolbars/MainToolbar/dropdowns/utils/colorUtils";
import { DEFAULT_THEME } from "../../styles/themes/themes";
import type { WorkspaceConfig } from "src/layout/types/pane";
import { getStorageKey, permanentWritable } from "../../utils/permanent-store";
import type {
  ActiveContainer,
  ActivePane,
  ActiveView,
  Workbook,
  WorkbookSheet,
  WorkbookParamsState,
} from "./types";
import type { FirestoreDocsOverview } from "../../api/firestore";
import type { DuckDBManager, OptimizedType } from "./db-manager";
import { supportedLocaleList } from "./parser/freeform/constants";
import { Locale } from "./parser/freeform/locale";
import type { DropdownTriggerRect } from "../../components/common/dropdown/type";
import type {
  DatadocsObjectNodeDetails,
  DatadocsPanelFileSystemData,
  DatadocsPanelListDirSort,
  DatadocsSearchData,
} from "../../api";
import { DatadocsFileSystemManager } from "../../components/panels/Datadocs/components/file-system/datadocsFileSystemManager";

/// main

/**
 * File selected by user to open in the application
 * @type {Writable<File>}
 */
export const selectedFile: Writable<File> = writable(null);

export const testCounter: Writable<number> = writable(50);

/// app-version

export type AppVersion = {
  major: string;
  build: string;
};
const emptyAppVersion: AppVersion = {
  major: "",
  build: "",
};

export const localAppVersion = writable<AppVersion>({ ...emptyAppVersion });
export const latestAppVersion = writable<AppVersion>({ ...emptyAppVersion });

/// store-toolbar

export const documentTitleStore: Writable<string> = writable("");
export const nameBoxState: Writable<NameBoxState> = writable({ value: "A1" });
export const selectedCellDatatype: Writable<string> = writable("variant");
export const activeCellTypeData: Writable<CellDetailTypeData> = writable(null);
export const activeCellStructArrayTypeData: Writable<CellDetailTypeData> =
  writable(null);
export const formulaBarValue: Writable<string> = writable("");
export const selectedTable = writable<TableDescriptor>();
export const tableInUse = writable<TableDescriptor>();
export const isBoldStyle: Writable<boolean> = writable(false);
export const isItalicStyle: Writable<boolean> = writable(false);
export const isStrikethroughStyle: Writable<boolean> = writable(false);
export const isUnderlineStyle: Writable<boolean> = writable(false);
export const zoomValue: Writable<{ value: number }> = writable({ value: 100 });
export const MIN_FONT_SIZE = 1;
export const MAX_FONT_SIZE = 400;
export const fontSizeValue: Writable<{ value: number }> = writable({
  value: 10,
});
export const formatValue: Writable<{ value: FormatValue }> = writable({
  value: "automatic",
});
export const fontFamilyValue: Writable<{ value: string }> = writable({
  value: "Poppins",
});

// default value of text color should be the same as in grid
export const textColorValue: Writable<{ value: string }> = writable({
  value: "#0E0121",
});

export const BACKGROUND_COLOR_DEFAULT: BackgroundColorValueType = {
  value: "#FFFFFF",
  type: "cellcolor",
};
export const backgroundColorValue: Writable<BackgroundColorValueType> =
  writable({ ...BACKGROUND_COLOR_DEFAULT });

export const borderState: Writable<{ color: string; style: BorderStyle }> =
  writable({ color: normalizeHexColor("#000000"), style: "thick" });

export const mergeCellsStateStore: Writable<MergeCellsState> = writable({
  canMergeAll: false,
  canMergeDirectionally: false,
  canUnmerge: false,
});

export const horizontalAlignValue: Writable<HorizontalAlignValue> =
  writable("left");
export const verticalAlignValue: Writable<VerticalAlignValue> = writable("top");

export const textWrappingValue: Writable<TextWrappingValue> =
  writable("overflow");

export const textRotationValue: Writable<{ value: number }> = writable({
  value: 0,
});

export const childToolbarValue: Writable<ChildToolbar> = writable("home");
/// store-ui

/**
 * Theme
 * @type {Writable<string>}
 */
export const theme: Writable<string> = writable(DEFAULT_THEME);

export const workspaceConfig: Writable<WorkspaceConfig> = writable(null);
export const sheetConfig: Writable<WorkspaceConfig> = writable(null);

export const showQueryToolbarStore: Writable<boolean> = writable(false);

/**
 * Test Query Datagrid
 * @type {Writable<boolean>}
 */
export const isTestQuery: Writable<boolean> = writable(false);

/**
 * Toggle menu item for developers on the menu bar
 */
export const enableDevMenu = permanentWritable(getStorageKey("devmenu"), false);

export const activeContainer: Writable<ActiveContainer> = writable({
  type: "",
  id: "",
});

export const activePane: Writable<ActivePane> = writable({
  id: "",
  element: null,
});

export const activeView: Writable<ActiveView> = writable({
  type: "",
  id: "",
});

/// store-worksheets
export const sheetsDataStore: Writable<WorkbookSheet[]> = writable([]);
export const isDraggingToReorderSheet: Writable<boolean> = writable(false);

/// store-workbooks
export const workbookListStore: Writable<Workbook[]> = writable([]);
export const activeWorkbookStore: Writable<Workbook> = writable(null);

// datadocs panel store
export const initialSourcePanel: Writable<boolean> = writable(false);
export const datadocsPanelFileSystemStore: Writable<
  Partial<Record<DatadocsPanelListDirSort, DatadocsPanelFileSystemData>>
> = writable({});
export const datadocsObjectDetailsMapStore: Writable<
  Map<string, DatadocsObjectNodeDetails>
> = writable(new Map<string, DatadocsObjectNodeDetails>());

export const datadocsSearchDataStore: Writable<DatadocsSearchData> =
  writable(null);

export const datadocsFileSystemManagerStore: Readable<DatadocsFileSystemManager> =
  readable(new DatadocsFileSystemManager([]));

/// firestore-docs

export const firestoreDocs: Writable<{
  loading: boolean;
  data: FirestoreDocsOverview[];
}> = writable({
  loading: false,
  data: [],
});

export const temporaryFileForIngesting = writable<FileSystemFileHandle>(null);
export const ingestedTableName = writable<string>(null);
export const persistentStorageUsage = writable<number>(-1);

export const loading = writable(true);

export const duckDBManager: Writable<DuckDBManager> = writable(null);
export const optimizedType: Writable<OptimizedType> = writable("VIEW");
export const queryConflictStrategy: Writable<"ask" | TableSpillBehavior> =
  writable("spill");

export const routeBasePathStore: Writable<string> = writable(null);
export const workbookParamsStateStore: Writable<WorkbookParamsState> =
  writable(null);

// locale
export const localeStore: Writable<Locale> = writable(
  new Locale(supportedLocaleList["en"])
);

// field dropdown
export const autoApplyFilter: Writable<boolean> = writable(true);

// field type tooltip
export const tableFieldTooltipDataStore: Writable<{
  table?: TableDescriptor;
  header?: GridHeader;
  buttonPos?: PixelBoundingRect;
  tooltipData?: CellDetailTypeData;
}> = writable({});

export const cellLayoverDataStore: Writable<{
  cell?: NormalCellDescriptor;
  cellPos?: PixelBoundingRect;
}> = writable({});

/**
 * Indicate if there is table inside selection area
 */
export const tableOnSelectionStore: Writable<boolean> = writable(false);

// apply entire column
// export const applyEntireColumnStore: Writable<boolean> = writable(true);

/**
 * Store selected Hyperlink information in grid editor and its position
 * (use for displaying the Hyperlink menu)
 */
export const selectedHyperlinkStore: Writable<{
  cell?: NormalCellDescriptor;
  /**
   * Link run data
   */
  run?: MetaRun;
  /**
   * Link bouding rect, use for calculating layover menu position
   */
  rect?: DropdownTriggerRect;
  /**
   * Current text content of editor
   */
  value?: string;
  /**
   * Indicate if we want to show update hyperlink menu or just a normal
   * layover menu
   */
  type?: "normal" | "update-link";
  /**
   * Indicate if the selected link is auto generated by formula cell
   */
  isFormulaCellHyperlink?: boolean;
}> = writable({});

export const addLinkDataStore: Writable<any> = writable({});
