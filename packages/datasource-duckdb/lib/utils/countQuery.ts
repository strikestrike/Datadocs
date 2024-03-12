import { escapeId, batchesToObjects } from '@datadocs/duckdb-utils';
import type { DatabaseQueryProvider } from '@datadocs/local-storage';

export type CountQueryBaseArgs = {
  db: DatabaseQueryProvider;
  connID: string;
  max?: number;
};
export type CountQueryFromRaw = { from: string };
export type CountQueryFromTable = { tbname: string };
export type CountQueryFromSQL = { sql: string };

function isString(v: any): v is string {
  return typeof v === 'string';
}

export async function countQuery(
  args: CountQueryBaseArgs &
    (CountQueryFromRaw | CountQueryFromTable | CountQueryFromSQL),
): Promise<number> {
  const needLimit = typeof args.max === 'number' && args.max >= 0;
  let querySQL = `SELECT COUNT(1) n`;
  let source: string;
  if ('from' in args && isString(args.from)) {
    source = args.from;
  } else if ('tbname' in args && isString(args.tbname)) {
    source = escapeId(args.tbname);
  } else if ('sql' in args && isString(args.sql)) {
    /** @todo optimize sql in here */
    source = `(${args.sql})`;
  }

  if (source) {
    if (needLimit) source = `(SELECT 1 FROM ${source} LIMIT ${args.max})`;
    querySQL += ' FROM ' + source;
  } else if (needLimit) {
    querySQL += ` LIMIT ${args.max}`;
  }

  const result = await args.db.queryAll(querySQL, args.connID, 1);
  const [row] = batchesToObjects<{ n: number }>(result);
  return Number(row.n);
}
