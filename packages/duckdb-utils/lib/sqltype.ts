import { Lexer } from './parser.js';
import type { Token } from 'antlr4ts';

const IGNORED_TOKEN_TYPES = new Set([
  Lexer.COMMENT,
  Lexer.White_Space,
  Lexer.Single_Line_Comment,
  Lexer.Multi_Line_Comment,
  Lexer.Semi,
  Lexer.OpenParen,
]);
const DQL_TOKEN_TYPES = new Set([
  //
  Lexer.SELECT,
  Lexer.VALUES,
  Lexer.WITH,
]);

/**
 * Check if the input SQL is used for querying database data. (DQL: Data Query Language)
 * @returns
 */
export function isDQLQuery(tokens: Lexer | Token[]): boolean {
  if (!Array.isArray(tokens)) tokens = tokens.getAllTokens();
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (IGNORED_TOKEN_TYPES.has(token.type)) continue;
    if (DQL_TOKEN_TYPES.has(token.type)) return true;

    //
    // SELECT * FROM test
    // WITH cte AS (SELECT 42 AS x) SELECT * FROM cte
    // VALUES (1,2), (3,4)
    //
    const textLC = (token.text || '').toLowerCase();
    if (textLC === 'select' || textLC === 'values' || textLC === 'with')
      return true;
    return false;
  }
  return false;
}
