import type { DBSchema } from 'idb';

export type LocalDuckDBEntrySource = {
  table: string;
  /** The file name in OPFS */
  opfs?: string;
  /** The file name in local file system */
  file?: string;
  /** TODO (leave a room for remote API) */
  remote?: any;
  size: number;
  mtime: number;
};

export interface LocalDatabaseSchema extends DBSchema {
  localdbV1: {
    key: number;
    value: {
      /** The auto incr id for the db */
      dbId?: number;
      /** The name of the db */
      dbName: string;
      remark?: string;
      sources: LocalDuckDBEntrySource[];
      ctime: number;
      mtime: number;
      atime: number;
      version: number;
      maxLogId: number;
      mergedLogId: number;
      currLogId: number;
      totalSize?: number;
    };
    indexes: {
      byName: string;
    };
  };
  /** Write Ahead Logging */
  walV1: {
    key: [dbId: number, logId: number];
    value: {
      dbId: number;
      logId: number;
      dbVersion: number;
      ctime: number;
      sql: string;
      execTime: number;

      tables?: string[];
      mergeTime?: number;
      undo?: string;
    };
  };
}

export type LocalDuckDBEntry = LocalDatabaseSchema['localdbV1']['value'];
export type LocalDuckDBWAL = LocalDatabaseSchema['walV1']['value'];
export type AddDuckDBWALPayload = Pick<
  LocalDuckDBWAL,
  'sql' | 'execTime' | 'tables' | 'undo'
>;
