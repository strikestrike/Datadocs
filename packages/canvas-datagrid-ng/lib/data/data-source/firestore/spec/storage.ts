/**
 * This file is the specification about how the data be stored on Firestore.
 *
 * Because Firestore has many limitation on for documents. Eg: the size of each Firestore document.
 * @see https://cloud.google.com/firestore/quotas
 *
 * So a whole user database/document in the app needs many Firestore documents.
 * But these Firestore documents have a common field: `format`
 * The type of this field is a string. And it is used for identifing the major version of the storage specification
 *
 * Because of the naming length and avoiding potential ambiguity.
 * We named all types about the Firestore document with the keyword `FDoc`. (Eg: `FDocBasicInfo`)
 * And user database/document in the app can be just named the keyword `Doc`. (Eg: `UserDoc`)
 */

export type AbstractFDoc = {
  format: string;
};

export const FDOC_BASE_PATH = '/user-docs';

/**
 * @version 2023-02-14
 *
 * This Firestore document is used for storing the basic info of the user document
 */
export type FDocBasicInfoV1 = {
  format: '1';
  docName: string;

  /** Total rows */
  rows: number;
  /** Total columns */
  cols: number;
};
export const defaultFDocBasicInfoV1: FDocBasicInfoV1 = {
  format: '1',
  docName: 'Unamed Document',
  rows: 100000,
  cols: 1000,
};

export type FDocMetaNames = 'rows' | 'sync';

/**
 * This Firestore document is used for indexing rows in a user document.
 * The data source can know which rows contain the data and which rows need to be fetched.
 *
 * RangeExpression := `${BeginRowIndex}~${EndRowIndex}` (inclusive)
 * @example: `{ "0~9": true }` means the first 10 rows contain data
 */
export type FDocRowRangesV1 = {
  format: '1';
  [rangeExpression: string]: string | boolean;
};

/**
 * This Firestore document is used for synchronizing state for different users.
 *
 * The data source can inform the grid about the state information of other users
 * through this document, and it can subscribe to this document to receive real-time updates
 * on changes made by other users.
 *
 * Eg: showing/updating other user's selection.
 */
export type FDocSyncUserStatesV1 = {
  format: '1';
  [appId: string]: string | SyncUserState;
};
export type FDocSyncUserStatesOmitFormatV1 = {
  [appId: string]: SyncUserState;
};

/**
 * The state information is from different active users.
 */
export type SyncUserState = {
  userId: string;
  selections: any;
  editIndex: number;
  lastEdit: { row0: number; col0: number; row1: number; col1: number };
  lastEditAt: number;
  lastPingAt: number;
};

/**
 * Data block Firestore document.
 */
export type FDocDataBlockV2 = {
  format: '2';

  /** Real row index */
  r: number;

  /** Updated at (timestamp) */
  u: number;

  /**
   * Raw Data.
   * Each value can be formula, string, object or any other types ...
   */
  d: { [columnId: string]: any };

  /**
   * Types patch. It is generally used for free form grid
   * It is used for overwriting the default column type
   */
  t?: { [columnId: string]: number };

  /** User defined style */
  s?: { [columnId: string]: any };

  /**
   * This field is optional for the document that enabled offline editing feature
   * Each column's version(can be timestamp) it is used for merging
   */
  v?: { [columnId: string]: number };
};
