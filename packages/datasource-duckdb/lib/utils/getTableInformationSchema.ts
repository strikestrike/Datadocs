import type { DatabaseQueryProvider } from '@datadocs/local-storage';
import type { TableField } from '../types/db-state';
import { getGridTypeFromDatabaseType } from './transformDuckDBTypes';
import { batchesToObjects } from '@datadocs/duckdb-utils';

/**
 * Get columns information from a sql query. It will create a temporary view,
 * get column types and then remove the view.
 * @param db
 * @param sql
 * @param connID
 * @returns
 */
export async function getTableInformationSchema(
  db: DatabaseQueryProvider,
  sql: string,
  connID: string,
) {
  let viewName = `__get_schema_view_${crypto.randomUUID()}__`;
  viewName = viewName.replaceAll('-', '');
  const createViewSql = `CREATE VIEW ${viewName} AS (${sql})`;
  const dropViewSql = `DROP VIEW ${viewName}`;
  const getSchemaSql = `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='${viewName}'`;

  await db.query(createViewSql, connID);

  const batches = await db.queryAll(getSchemaSql, connID);
  const rows = batchesToObjects<{ data_type: string; column_name: string }>(
    batches,
  );
  const columnFields: TableField[] = [];
  for (const row of rows) {
    const databaseType = getGridTypeFromDatabaseType(row.data_type);
    columnFields.push({
      name: row.column_name,
      type: databaseType,
    });
  }

  await db.query(dropViewSql, connID);
  return columnFields;
}
