import type { FromDuckDbThis } from './internal-types';
// import type { TableField } from './types/db-state';
import type { PreloadOptions } from '@datadocs/canvas-datagrid-ng';
import { expandRowsRange, Tick } from './utils';
import { countQuery } from './utils/countQuery';
// import { getGridTypeFromArrowType } from './utils/transformArrowTypes';
import { getTableInformationSchema } from './utils/getTableInformationSchema';
import { DuckDbQueryOptimization } from './types/init-options';
import {
  createOptimized,
  CreateOptimizedType,
} from './query-optimaztion/create-optimized';

const FIRST_COUNTING_LIMIT = 200;

export async function initDuckDBState(this: FromDuckDbThis) {
  const { dbState, dbManager: db, contextId, columns, parsedQuery } = this;
  if (dbState.init) return dbState.init === true ? undefined : dbState.init;

  /** This connection will be closed in `cleanup` function if it is created */
  let connID: string | undefined;
  let tick: Tick | undefined;
  console.log(`Initializing DuckDB '${contextId.slice(0, 4)}'`, this.rawQuery);

  const initConnection = async () => {
    tick = new Tick(`Init DuckDB ${contextId.slice(0, 4)}`);
    connID = await db.createConnection();
  };

  //
  //#region the core logic of initializing optimized table/view
  const initOptimizedEntity = async () => {
    const { optimizationType, sql, isDQL } = parsedQuery;
    if (optimizationType === DuckDbQueryOptimization.NONE) return;

    let type: CreateOptimizedType;
    if (optimizationType === DuckDbQueryOptimization.CREATE_TABLE) {
      if (isDQL) type = CreateOptimizedType.TABLE;
      else type = CreateOptimizedType.COPY_TO_TABLE;
    } else {
      // CREATE_VIEW
      type = CreateOptimizedType.VIEW;
    }

    const res = await createOptimized(sql, db, {
      prefix: '__dd',
      type,
      // TODO: schema and db
      schema: this.schemaName,
      connId: connID,
    });
    let log = `createOptimized: ${res.escaped}`;
    if (typeof res.copied === 'number') log += ` copied ${res.copied} rows`;
    dbState.setSelectionSource(`SELECT * FROM ${res.escaped}`);
    tick.tick(log);
  };
  //#endregion the core logic of initializing optimized table/view
  //

  //
  //#region the core logic of initializing DuckDB data source
  const init = async () => {
    const numPartialRows = await countQuery({
      db,
      connID,
      max: FIRST_COUNTING_LIMIT + 1,
      from: dbState.selectionSource,
    });
    dbState.numPartialRows = numPartialRows;
    if (numPartialRows >= FIRST_COUNTING_LIMIT) {
      // need to count the query again after the grid is idle
      tick.tick(`count: numPartialRows=${numPartialRows}`);
    } else {
      dbState.numRows = numPartialRows;
      tick.tick(`count: numRows=${numPartialRows}`);
    }

    if (!dbState.fields) {
      const sql = `SELECT * FROM ${dbState.selectionSource} LIMIT 1`;
      const result = await db.queryAll(sql, connID);
      // const fields: TableField[] = [];
      if (result.length > 0) {
        // const batch = result[0];
        // for (const field of batch.schema.fields) {
        //   fields.push({
        //     name: field.name,
        //     type: getGridTypeFromArrowType(field.type),
        //   });
        // }
        const fields = await getTableInformationSchema(db, sql, connID);
        dbState.fields = fields;
        columns.set(
          fields.map((field) => ({
            id: field.name,
            dataKey: field.name,
            title: field.name,
            type: field.type,
          })),
        );
      }
    }
    // init metadata table
    await this.metadataTable.init();
    tick.tick(`sample row: fields.length=${dbState.fields?.length}`);

    // Update the state lazily to initiate the summary row view table.
    setTimeout(this.rowsLoader.updateState);
  };
  //#endregion the core logic of initializing DuckDB data source
  //

  const cleanup = async () => {
    if (!connID) return;
    try {
      await db.closeConnection(connID);
    } catch (error) {
      console.error(`Uncought Error in cleaup:`, error);
    }
  };

  dbState.init = initConnection()
    .then(() => initOptimizedEntity())
    .then(() => init());
  try {
    await dbState.init;
    dbState.init = true;
  } catch (error) {
    console.error(error);
    dbState.init = false;
  }
  /* await */ cleanup();
}

export function preload(this: FromDuckDbThis, options?: PreloadOptions) {
  let waitForInit: Promise<any>;
  const init = this.dbState.init;
  if (init === false) {
    const args: Parameters<typeof initDuckDBState> = [];
    waitForInit = initDuckDBState.apply(this, args);
  } else if (init !== true && typeof init?.then === 'function') {
    waitForInit = init;
  }

  let range = options?.rowsRange;
  if (!range && this.currentGrid) {
    const viewPortRows = this.currentGrid.viewport.rowsRange;
    range = expandRowsRange(viewPortRows, 50);
  }

  const preloadResult = this.rowsLoader.init(range);
  if (preloadResult.wait) {
    const then = preloadResult.wait;
    if (waitForInit) preloadResult.wait = waitForInit.then(() => then);
  } else if (waitForInit) {
    preloadResult.wait = waitForInit;
  }
  return preloadResult;
}
