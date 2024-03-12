/**
 * @module SQLString
 * @see https://github.com/mysqljs/sqlstring/blob/master/lib/SqlString.js
 * @see https://duckdb.org/docs/sql/introduction.html
 */

const ID_QUOTE = '"';
const ID_ESCAPED_QUOTE = '""';
const ID_GLOBAL_REGEXP = /"/g;
const QUAL_GLOBAL_REGEXP = /\./g;
// eslint-disable-next-line no-useless-escape, no-control-regex
const CHARS_GLOBAL_REGEXP = /[\']/g;
const CHARS_ESCAPE_MAP: Record<string, string> = {
  "'": "''",
};

export type RawSQLString = { toSqlString: () => string };

/**
 * @todo docs
 * @param val
 * @param forbidQualified (TODO) set default value of it to `true`
 * @returns
 */
export function escapeId(
  val: string | string[] | { toString(): string },
  forbidQualified?: boolean,
): string {
  if (Array.isArray(val)) {
    let sql = '';
    for (let i = 0; i < val.length; i++) {
      sql += (i === 0 ? '' : ', ') + escapeId(val[i], forbidQualified);
    }
    return sql;
  } else if (forbidQualified) {
    return (
      ID_QUOTE +
      String(val).replace(ID_GLOBAL_REGEXP, ID_ESCAPED_QUOTE) +
      ID_QUOTE
    );
  } else {
    return (
      ID_QUOTE +
      String(val)
        .replace(ID_GLOBAL_REGEXP, ID_ESCAPED_QUOTE)
        .replace(QUAL_GLOBAL_REGEXP, ID_QUOTE + '.' + ID_QUOTE) +
      ID_QUOTE
    );
  }
}

/**
 * @todo docs
 * @param val
 * @returns
 */
export function escape(val?: string | null | RawSQLString): string {
  if (val === undefined || val === null) {
    return 'NULL';
  }
  if (typeof val === 'object')
    if (typeof val.toSqlString === 'function') return String(val.toSqlString());
  return escapeString(String(val));
}

function escapeString(val: string) {
  let chunkIndex = (CHARS_GLOBAL_REGEXP.lastIndex = 0);
  let escapedVal = '';
  let match: RegExpMatchArray | null;

  while ((match = CHARS_GLOBAL_REGEXP.exec(val))) {
    escapedVal +=
      val.slice(chunkIndex, match.index) + CHARS_ESCAPE_MAP[match[0]];
    chunkIndex = CHARS_GLOBAL_REGEXP.lastIndex;
  }

  if (chunkIndex === 0) {
    // Nothing was escaped
    return "'" + val + "'";
  }
  if (chunkIndex < val.length) {
    return "'" + escapedVal + val.slice(chunkIndex) + "'";
  }
  return "'" + escapedVal + "'";
}

export function raw(sql: string) {
  if (typeof sql !== 'string')
    throw new TypeError('argument sql must be a string');
  return {
    toSqlString: function toSqlString() {
      return sql;
    },
  };
}

/**
 * format column name for double quote inside column name
 * @param colname
 * @returns
 */
export function doubleUpDoubleQuote(colname: string): string {
  return colname.replace(/"/g, '""');
}
