import { getGridTypeFromDatabaseType } from './transformDuckDBTypes';
import type { Field as GridField } from '@datadocs/canvas-datagrid-ng/lib/types/column-types';
import type { DatabaseQueryProvider } from '@datadocs/local-storage';
import type { InfoSchemaColumns } from '@datadocs/duckdb-utils';
import { batchesToObjects, escape } from '@datadocs/duckdb-utils';

/**
 * fetch table schema from database
 * @param tbname
 * @param conn
 * @returns
 */
export async function fetchSchemaInformationTable(
  this: unknown,
  schemaName: string,
  tbname: string,
  db: DatabaseQueryProvider,
  connID?: string,
) {
  const queryStr =
    `SELECT column_name, data_type FROM information_schema.columns` +
    ` WHERE table_name=${escape(tbname)} AND table_schema=${escape(
      schemaName,
    )}`;
  const batches = await db.queryAll(queryStr, connID);
  const columnInfoRows =
    batchesToObjects<Pick<InfoSchemaColumns, 'column_name' | 'data_type'>>(
      batches,
    );

  const columnFields: GridField[] = [];
  // const structPrefix = "duckdb__nested__";
  // let idx = 0;
  for (const row of columnInfoRows) {
    const databaseType = getGridTypeFromDatabaseType(row.data_type);
    // const displayname =
    //   typeof databaseType === "object" &&
    //   (databaseType.typeId === GridDataType.Struct ||
    //     databaseType.typeId === GridDataType.List ||
    //     databaseType.typeId === GridDataType.Map)
    //     ? `${structPrefix}${idx}`
    //     : row["column_name"];
    // idx++;
    columnFields.push({
      name: row.column_name,
      displayname: row.column_name,
      type: databaseType,
    });
  }
  return { tbname, columns: columnFields, raw: columnInfoRows };
}
