/**
 * This module is designed for the following purposes:
 *
 * 1. Tokenizing and parsing SQL string
 * 2. Generating some information from the tokens/AST that came from the parser
 * 3. Storing them as fields for future uses.
 */

import type { ParseDuckDBSQLResult, Token } from '@datadocs/duckdb-utils';
import { isDQLQuery } from '@datadocs/duckdb-utils';
import { Lexer, parseDuckDBSQL } from '@datadocs/duckdb-utils';
import {
  DuckDbQueryType,
  type DuckDbQuery,
  DuckDbQueryOptimization,
} from './types/init-options';
import { createHash } from 'crypto';

const IGNORED_TOKEN_TYPES = new Set([
  Lexer.COMMENT,
  Lexer.Single_Line_Comment,
  Lexer.Multi_Line_Comment,
  Lexer.White_Space,
  Lexer.Semi,
  Lexer.AS,
]);

const md5 = (str: string) => createHash('md5').update(str).digest('hex');

export class ParsedDuckDBQuery {
  static genContextId(tokens?: Token[], salt = ''): string {
    salt += ':';
    if (!tokens || tokens.length === 0) return md5(salt);
    // console.log(tokens.map((it) => [it.type, it.text]));
    const parts = [];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (IGNORED_TOKEN_TYPES.has(token.type)) continue;
      if (token.type === Lexer.String_Literal) {
        parts.push(token.text);
        continue;
      }
      parts.push((token.text || '').toLowerCase());
    }
    const sanitized = parts.join(' ').trim();
    return md5(salt + sanitized);
  }

  private readonly parsed: ParseDuckDBSQLResult;
  get lexer() {
    return this.parsed.lexer;
  }
  get parser() {
    return this.parsed.parser;
  }
  private _allTokens: Token[];
  get allTokens() {
    if (!this._allTokens) this._allTokens = this.lexer.getAllTokens();
    return this._allTokens;
  }

  private _contextId: string;
  get contextId() {
    if (!this._contextId)
      this._contextId = ParsedDuckDBQuery.genContextId(this.allTokens);
    return this._contextId;
  }

  /** is the SQL "SELECT ..."  */
  readonly isDQL: boolean;
  readonly editable: boolean;
  readonly sql: string;
  readonly optimizationType: DuckDbQueryOptimization;

  constructor(readonly query: Readonly<DuckDbQuery>) {
    this.parsed = parseDuckDBSQL(query.sql);
    this.sql = query.sql;

    let optimizationType = query.opt;
    let isDQL = isDQLQuery(this.allTokens);
    switch (query.type) {
      case DuckDbQueryType.DQL:
        if (!isDQL)
          throw new Error(
            `Can not set query.type to DQL because the query SQL is not a DQL query`,
          );
        isDQL = true;
        break;
      case DuckDbQueryType.RAW:
        isDQL = false;
        break;
    }
    this.isDQL = isDQL;

    if (typeof optimizationType !== 'number') {
      optimizationType = isDQL
        ? DuckDbQueryOptimization.CREATE_VIEW
        : DuckDbQueryOptimization.CREATE_TABLE;
    }

    if (!isDQL && optimizationType === DuckDbQueryOptimization.CREATE_VIEW)
      throw new Error(`Optimization CREATE_VIEW can not work with raw query`);

    if (optimizationType === DuckDbQueryOptimization.CREATE_TABLE) {
      this.editable = true;
    } else if (isDQL) {
      this.editable = true;
    } else {
      this.editable = false;
    }

    this.optimizationType = optimizationType;
  }
}
