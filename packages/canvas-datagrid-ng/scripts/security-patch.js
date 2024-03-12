#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const file = path.resolve(
  __dirname,
  '../node_modules/karma-html-reporter/index.js',
);
if (fs.existsSync(file)) {
  /**
   * @see https://github.com/dtabuenc/karma-html-reporter/commit/5308c817d19ecd374d9c8f1117da4f13a88c77a5
   */
  fs.writeFileSync(
    file,
    fs.readFileSync(file, 'utf8').replace('_.any', '_.some'),
  );
  console.log(`patched 'karma-html-reporter'`);
}
