import type { WorkspaceConfig } from "../layout/types/pane";
import type { DatadocsPanelObjectData } from "./datadocs-panel/type";

export * from "./datadocs-panel/type";

type APICallback = (data?: any) => Promise<any>;
type AnyFunction = (...args: any) => void;

export type APIConfig = {
  onSuccess?: APICallback;
  onError?: APICallback;
};

export type APIError = {
  key: string;
  message: string;
};

export type ErrorHandlerConfig = {
  /**
   * The request was made and the server responded with a status code
   * that falls out of the range of 2xx
   */
  onRequestError?: AnyFunction;
  /**
   * The request was made but no response was received
   */
  onNoResponseError?: AnyFunction;
  /**
   * Something happened in setting up the request that triggered an Error
   */
  otherError?: AnyFunction;
  /**
   * Server return error code 429 when there are too many request has been made
   */
  onTooManyRequest?: AnyFunction;
};

/**
 * Workspace data type is returned from server
 */
export type WorkspaceData = {
  workspaceId: string;
  name: string;
  config: WorkspaceConfig;
  createdAt: string;
  lastModifiedTimestamp: string;
};

/**
 * Workbook data type return from server
 */
export type WorkbookData = DatadocsPanelObjectData;

/**
 * Worksheet data type return from server
 */
export type WorksheetData = {
  objectId: string;
  worksheetId: string;
  name: string;
  position: number;
};
