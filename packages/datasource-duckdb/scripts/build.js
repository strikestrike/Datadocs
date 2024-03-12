#!/usr/bin/env node
// https://swc.rs/docs/usage/cli

const { execSync } = require('../../canvas-datagrid-ng/scripts/uitl');
const { resolve } = require('path');

const [action, ...restArgs] = process.argv.slice(2);
const cwd = resolve(__dirname, '..');

const swcCommonArgs = [
  '--no-swcrc',
  '--source-maps',
  '--config',
  'jsc.parser.syntax=typescript',
  '--config',
  'jsc.target=es2022',
];
const minify = !/^(0|off|no|false)$/i.test(process.env.MINIFICATION_ENABLED);
if (!minify) console.warn('Minification is disabled');
swcCommonArgs.push('--config', `minify=${String(minify)}`);

if (action === 'cjs') {
  buildCJS();
} else if (action === 'esm') {
  buildESM();
} else if (action === 'clean') {
  clean();
} else {
  clean();
  buildCJS();
  buildESM();
}

function clean() {
  execSync(['rimraf', 'dist'], { cwd });
}

function buildCJS() {
  execSync(
    [
      'swc',
      'lib',
      '--out-dir',
      'dist/cjs',
      '--config',
      'module.type=commonjs',
      ...swcCommonArgs,
    ],
    { cwd },
  );
}

function buildESM() {
  execSync(
    [
      'swc',
      'lib',
      '--out-dir',
      'dist/esm',
      '--config',
      'module.type=es6',
      ...swcCommonArgs,
      ...restArgs,
    ],
    { cwd },
  );
}
