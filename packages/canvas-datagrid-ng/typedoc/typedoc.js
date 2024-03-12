//@ts-check
/** @typedef {Partial<import('typedoc').TypeDocOptions>} TypeDocOptions **/

const { resolve } = require('path');
const modDir = './modules';
const mods = require('fs')
  .readdirSync(modDir)
  .filter((it) => !it.startsWith('.') && it.endsWith('.ts'))
  .map((it) => resolve(modDir, it));

/**
 * @type {TypeDocOptions}
 * @see https://typedoc.org/guides/options/
 */
const config = {
  /** HTML output directory */
  out: 'out',
  cleanOutputDir: true,

  /** TypeDoc JSON output */
  // json: 'typedoc.json',

  /** Link to source code */
  sourceLinkTemplate: `https://github.com/datadocs/datadocs/blob/{gitRevision}/{path}#L{line}`,
  gitRevision: 'design',

  /** Customize */
  customCss: './typedoc.css',
  name: 'Datadocs Grid',
  readme: './README.md',
  // cname: 'docs.xxx.xxx',
  categorizeByGroup: false,
  excludePrivate: true,

  /**
   * Please remember to config the module name by jsDoc `@module` in the following files
   */
  entryPoints: mods,
  tsconfig: './tsconfig.doc.json',

  plugin: ['typedoc-plugin-mdn-links'],
  sort: ['static-first', 'required-first', 'visibility', 'source-order'],
};
module.exports = config;
