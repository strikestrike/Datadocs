import { DuckDBSQLLexer } from './antlr/DuckDBSQLLexer.js';
import { DuckDBSQLParser } from './antlr/DuckDBSQLParser.js';
import { CharStreams, CommonTokenStream } from 'antlr4ts';

export { DuckDBSQLLexer as Lexer } from './antlr/DuckDBSQLLexer.js';
export { DuckDBSQLParser as Parser } from './antlr/DuckDBSQLParser.js';
export { Token } from 'antlr4ts';

export type ParseDuckDBSQLResult = Readonly<{
  lexer: DuckDBSQLLexer;
  parser: DuckDBSQLParser;
}>;

/**
 * Create lexer and parser from a DuckDB SQL
 */
export function parseDuckDBSQL(sql: string): ParseDuckDBSQLResult {
  const inputStream = CharStreams.fromString(sql);
  let lexer: DuckDBSQLLexer;
  let parser: DuckDBSQLParser;
  const result: ParseDuckDBSQLResult = {
    get lexer() {
      if (!lexer) lexer = new DuckDBSQLLexer(inputStream);
      return lexer;
    },
    get parser() {
      if (!parser) {
        const tokenStream = new CommonTokenStream(result.lexer);
        parser = new DuckDBSQLParser(tokenStream);
      }
      return parser;
    },
  };
  return result;
}
