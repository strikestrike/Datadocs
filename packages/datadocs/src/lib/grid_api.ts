import { escape, escapeId } from "@datadocs/duckdb-utils";
import type { AsyncDuckDBConnection } from "@datadocs/duckdb-wasm";

const type_map = {
  INTEGER: "number",
  VARCHAR: "string",
  DATE: "date",
  DOUBLE: "number",
};
export function creates_schema(t_schema: any[]) {
  return t_schema.map((v) => {
    return {
      name: v["column_name"],
      type: type_map[v["data_type"]],
    };
  });
}

export function generates_empty_data(schema: any[], num_rows: number) {
  // Generate header row
  const header_item = {
    loaded: true,
  };
  for (const column of schema) {
    header_item[column.name] = column.name;
  }
  const data = [header_item];
  for (let i = 0; i < num_rows; i++) {
    const item = {
      loaded: false,
    };
    for (const column of schema) {
      item[column.name] = "";
    }
    data.push(item);
  }
  return data;
}

export function update_local_cache(
  data: any[],
  offset: number,
  cache: any[],
  schema: any[],
  fixed_row_count = 0
) {
  var d: any, x: number;
  for (x = 0; x < data.length; x += 1) {
    d = cache[x + offset + fixed_row_count];
    d.loaded = true;
    for (const column of schema) {
      const col_name: string = column.name;
      d[col_name] = data[x][col_name];
    }
  }
}

export async function create_table(
  conn: AsyncDuckDBConnection,
  file_name: string,
  file: File
) {
  const table_name = file_name.split(".")[0];
  const escaped_name = escapeId(table_name, true);
  const query =
    `CREATE TABLE IF NOT EXISTS ${escaped_name} AS` +
    ` (SELECT * FROM ${escape(file.name)})`;
  await conn.query(query);
  return table_name;
}

export async function run_query(
  conn: AsyncDuckDBConnection,
  query_str: string
) {
  const query_result = await conn.query(query_str);

  const field_names = [];
  for (const field of query_result.schema.fields) {
    field_names.push(field.name);
  }

  const data = [];
  if (query_result.numRows > 0) {
    for (const row of query_result) {
      const r = {};
      for (const f of field_names) {
        r[f] = row[f];
      }
      data.push(r);
    }
  }

  return data;
}

export interface TableData {
  fields: string[];
  rows: Object[];
}

export async function send_query(
  conn: AsyncDuckDBConnection,
  query_str: string
) {
  const result = await (await conn.send(query_str)).readAll();
  // console.log("send_query: ", result);

  const tableData: TableData = { fields: [], rows: [] };
  for (const batch of result) {
    for (const field of batch.schema.fields) {
      tableData.fields.push(field.name);
    }

    if (batch.numRows > 0) {
      for (const row of batch) {
        const r = {};
        for (const f of tableData.fields) {
          r[f] = row[f];
        }
        tableData.rows.push(r);
      }
    }

    break;
  }

  return tableData;
}

export async function cancel_query(conn: AsyncDuckDBConnection) {
  return await conn.cancelSent();
}
