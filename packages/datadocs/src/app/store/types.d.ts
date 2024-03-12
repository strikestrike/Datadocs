/**
 * @packageDocumentation
 * @module app/store-types
 */
import type { GridPublicAPI } from "@datadocs/canvas-datagrid-ng/lib/types/grid";
import type { WorkspaceConfig } from "../../layout/_dprctd/types";
import type { TableDescriptor } from "@datadocs/canvas-datagrid-ng";
import type { DatadocsPanelObjectData } from "../../api";

/**
 * Utility type to create key:boolean index object
 */
export type FlagIndex = {
  [key?: string]: boolean;
};

/**
 * Workspace preset. User can load the predefined/saved Workspace
 */
export type WorkspaceItem = {
  /**
   * Workspace preset unique id
   */
  id: string;
  /**
   * Workspace preset name
   */
  name: string;
  /**
   * Workspace preset type. "default" - predefined. "custom" - created and save by the User.
   */
  type: "default" | "custom";
  /**
   * Current Workspace configuration
   */
  data?: WorkspaceConfig;
  /**
   * Initial Workspace configuration, will be used in reseting
   */
  initData: WorkspaceConfig;
  /**
   * Whether is Workspace is active or not
   */
  isActive: boolean;
};

/**
 * Statis of the active Pane in Worksheet
 */
export type ActiveContainer = {
  id: string;
  type: string;
};

/**
 * Statis of the active Pane in Worksheet
 */
export type ActivePane = {
  id: string;
  element: HTMLElement;
};

/**
 * Statis of the active View in Worksheet
 */
export type ActiveView = {
  id: string;
  type: string;
};

/**
 * Workbook sheet data
 */
export type WorkbookSheet = {
  /**
   * Worksheet id
   */
  id: string;
  /**
   * Id of parent workbook
   */
  workbookId: string;
  /**
   * Worksheet name
   */
  name: string;
  /**
   * True if worksheet is currently opened
   */
  isActive: boolean;
  /**
   * Type of workbook sheet
   */
  type: WorkbookSheetType;
  data: {
    id: string;
  };
  /**
   * Worksheet configuration
   * TODO: It has the same data type with @WorkspaceConfig but should use
   * other name to prevent confusion
   */
  config?: WorkspaceConfig;
  /**
   * Position of the Worksheet among its siblings
   */
  position: number;
};

export type WorkbookSheetType = "SPREADSHEET" | "BLANK_CANVAS" | "GRAPH";

/**
 * Workbook item data
 */
export type Workbook = {
  /**
   * Workbook id
   */
  id: string;
  /**
   * Workbook name
   */
  name: string;
  /**
   * The last time workbook is opened
   */
  lastOpened?: number;
  /**
   * Point in time that the workbook was created
   */
  createdAt?: number;

  updatedAt?: number;
  /**
   * List of sheets in the workbook
   */
  config?: Array<{ worksheetId: string }>;
  /**
   * Workbook slug that use to navigate to workbook
   */
  vanitySlug: string;

  ownerId?: string;
  creatorId?: string;
};

/**
 * The workbook that is currently open
 * It will contain information about which workbook is currently
 * opened by user. There are two type according to two formats
 * we have
 * 1. Google Sheet like path: /<guid>
 * 2. Github like path: /<user_vanity_name>/<workbook_vanity_slug>
 */
export type WorkbookParamsState =
  | {
      type: "GUID";
      guid: string;
    }
  | {
      type: "VANITY_NAME";
      owner: string;
      vanitySlug: string;
    };
