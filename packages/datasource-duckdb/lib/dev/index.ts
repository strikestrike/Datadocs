import { datagrid } from '@datadocs/canvas-datagrid-ng';
import { SimpleDuckDBQueryProvider } from '@datadocs/local-storage';
import { DuckDB } from './duckdb-loader';
import { createTemporaryTables } from './temp-table';
import { Tick } from '../utils';
import { FromDuckDb } from '..';
import { ParsedDuckDBQuery } from '../ParsedDuckDBQuery';
import { parseDuckDBSQL } from '@datadocs/duckdb-utils';

main().catch((error) => console.error(error));
async function main() {
  const gridContainer = document.getElementById('gridContainer');
  const grid = datagrid({
    parentNode: gridContainer,
    allowMovingSelection: true,
    allowFreezingRows: true,
    allowFreezingColumns: true,
    allowRowReordering: true,
    allowColumnReordering: true,
    allowGroupingColumns: true,
    debug: false,
    enableInternalContextMenu: true,
    selectionHandleBehavior: 'single',
    resizeAfterDragged: 'when-multiple-selected',
    allowMergingCells: true,
  });
  window['grid'] = grid;

  const containerDataSource = new datagrid.DataSources.Empty({
    cols: 10000,
    rows: 10000,
  });
  grid.dataSource = containerDataSource;

  const duckdb = await DuckDB();
  const db = new SimpleDuckDBQueryProvider(duckdb);
  const connId = await db.createConnection();
  console.log(`Connection ID: ${connId}`);
  await createTemporaryTables(db, connId);

  const originalTbName = 'test';
  const magnitude = 10_000_000;
  const originalQuerySQL = `
SELECT * FROM (
  SELECT
    generate_series i,
    (generate_series % 10) + 1 i2
  FROM
    generate_series(0, ${magnitude})
) AS indexes
JOIN
  ${originalTbName} data
ON
  (indexes.i2 = data.id)
`;
  debugSQL(originalQuerySQL);

  const tbName = 'test_view';
  const querySQL = `SELECT * FROM ${tbName} `;

  const logs: string[] = [];
  const t = new Tick();
  t.pipe(logs);

  const connID = await db.createConnection();
  {
    await db.query(`CREATE VIEW ${tbName} AS (${originalQuerySQL})`, connID);
    console.log(`Created view ${tbName}`);
  }
  t.tick('creating view');

  const internalSchema = 'internals';
  {
    await db.query(`CREATE SCHEMA ${internalSchema}`, connID);
    console.log(`Created schema ${internalSchema}`);
  }
  t.tick('creating internal schema');

  const getContextId = (sql: string) =>
    ParsedDuckDBQuery.genContextId(parseDuckDBSQL(sql).lexer.getAllTokens());
  const dataSource = new FromDuckDb({
    schemaName: internalSchema,
    db,
    contextId: getContextId(querySQL),
    query: { sql: querySQL },
  });

  // reserve name for metadata table
  await dataSource.setMetadataTableName(
    internalSchema,
    tbName + '_meta',
    tbName + '_meta_ref',
  );
  console.log('initialized meta table');

  const preload = dataSource.preload();
  if (preload.wait) await preload.wait;
  t.tick('preload');

  containerDataSource.createTable(
    'table1',
    0,
    0,
    dataSource,
    undefined,
    'fail',
  );
  if (preload.idle) {
    t.tick();
    await preload.idle();
    t.tick('preload (IDLE)');
  }
  console.log(logs.join('\n'));
}

function debugSQL(sql: string) {
  const el = document.getElementById('debugSQL');
  if (!el) return;
  sql = sql.replace(/\n/g, ' ').replace(/\s+/g, ' ');
  el.innerText = sql;
}
