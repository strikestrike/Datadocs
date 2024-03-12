import type { AsyncDuckDB } from '@datadocs/duckdb-wasm';
import type { DatabaseQueryProvider } from '@datadocs/local-storage';
import type { ParseDuckDBSQLResult } from '@datadocs/duckdb-utils';
import { ArrowAsyncRowReader } from '@datadocs/duckdb-utils';
import { ParsedDuckDBQuery } from '../ParsedDuckDBQuery';
import {
  escapeId,
  parseDuckDBSQL,
  Lexer,
  escape,
} from '@datadocs/duckdb-utils';
import { guessDBTypeFromArrowType } from '../utils/transformArrowTypes';

export const enum CreateOptimizedType {
  TEMP_VIEW = 0,
  VIEW = 1,
  TEMP_TABLE = 2,
  TABLE = 3,
  COPY_TO_TABLE = 4,
}

/**
 * Options for creating an entity for given SQL
 */
export type CreateOptimizedEntityOptions = {
  type?: CreateOptimizedType;
  prefix: string;
  db?: string;
  schema?: string;
  salt?: string;
  connId?: string;
};

export type CreateOptimizedEntityResult = {
  /** @example "table" */
  name: string;
  /** @example "'db1'.'table1'" */
  escaped: string;
  parsed: ReturnType<typeof parseDuckDBSQL>;
  /** for copying to table only */
  copied?: number;
  db?: string;
  schema?: string;
};

/**
 * Creates an optimized entity(table/view) in the database based on the provided query
 * @param query - The query string or parsed DuckDB SQL
 * @param queryProvider - The database query provider
 * @param opts - The options for creating the optimized entity
 * @returns An object containing information about the created entity (db name, schema name,
 * entity name and parsed SQL)
 */
export async function createOptimized(
  query: string | ParseDuckDBSQLResult,
  queryProvider: DatabaseQueryProvider<AsyncDuckDB>,
  opts: CreateOptimizedEntityOptions,
): Promise<CreateOptimizedEntityResult> {
  const parsedQuery = typeof query === 'string' ? parseDuckDBSQL(query) : query;

  const allTokens = parsedQuery.lexer.getAllTokens();
  const entityNameBase = ParsedDuckDBQuery.genContextId(allTokens, opts.salt);
  const entityName = `${opts.prefix}${entityNameBase}`;

  let sanitizedSQL = '';
  for (const token of allTokens) {
    // console.log(token.type, JSON.stringify(token.text));
    if (token.type === Lexer.Semi) {
      if (!sanitizedSQL.trim()) continue;
      break;
    }
    if (
      token.type === Lexer.COMMENT ||
      token.type === Lexer.Single_Line_Comment ||
      token.type === Lexer.Multi_Line_Comment
    )
      continue;
    sanitizedSQL += token.text;
  }

  let escapedName = escapeId(entityName, true);
  const { schema, type, db } = opts;
  if (schema) escapedName = `${escapeId(schema, true)}.${escapedName}`;
  if (db) escapedName = `${escapeId(db, true)}.${escapedName}`;

  const result: CreateOptimizedEntityResult = {
    db,
    schema,
    name: entityName,
    escaped: escapedName,
    parsed: parsedQuery,
  };

  //#region copy mode
  if (type === CreateOptimizedType.COPY_TO_TABLE) {
    const stream = await queryProvider.query(sanitizedSQL, opts.connId);
    const reader = new ArrowAsyncRowReader(stream);
    const schema = await reader.getSchema();
    const fields = schema.fields.map((field) => {
      const type = guessDBTypeFromArrowType(field.type);
      return `${escapeId(field.name, true)} ${type}`;
    });

    let copied = 0;
    const conn2 = await queryProvider.createConnection();
    try {
      const ddl = `CREATE TABLE ${escapedName} (${fields.join(', ')});`;
      const insertPrefix = `INSERT INTO ${escapedName} VALUES`;
      await queryProvider.query(ddl, conn2);

      let row = await reader.read();
      while (row) {
        const values = row.toArray().map((it) => escape(it));
        const insertSQL = `${insertPrefix} (${values.join(',')});`;
        await queryProvider.query(insertSQL, opts.connId);
        copied++;
        row = await reader.read();
      }
    } finally {
      await queryProvider.closeConnection(conn2);
    }
    result.copied = copied;
    return result;
  }
  //#endregion copy mode

  let creationSQL = `CREATE OR REPLACE `;
  switch (type) {
    case CreateOptimizedType.TABLE:
      creationSQL += 'TABLE ';
      break;
    case CreateOptimizedType.TEMP_TABLE:
      creationSQL += 'TEMP TABLE ';
      break;
    case CreateOptimizedType.VIEW:
      creationSQL += 'VIEW ';
      break;
    default: // TEMP_VIEW
      creationSQL += 'TEMP VIEW ';
  }
  creationSQL += `${escapedName} AS (${sanitizedSQL})`;
  await queryProvider.query(creationSQL, opts.connId);
  return result;
}
