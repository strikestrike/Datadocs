#!/usr/bin/env node
/// <reference types="node" />
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable prettier/prettier */

const { resolve } = require("path");
const { rimrafSync } = require("rimraf");
const patterns = [
  "deploy/build",
  "scripts/temp",

  "packages/datadocs/dist",
  "packages/duckdb-utils/dist",

  "packages/datadocs/.stats",
  "**/node_modules/.vite",
  "**/node_modules/.cache",
];

process.chdir(resolve(__dirname, ".."));
console.log(`$ chdir '${process.cwd()}'`);

for (const pattern of patterns) {
  console.log(`$ rimraf '${pattern}'`);
  rimrafSync(pattern, { glob: true });
}
