#!/usr/bin/env node
// https://swc.rs/docs/usage/cli

const { execSync, exec } = require('../../canvas-datagrid-ng/scripts/uitl');
const { resolve } = require('path');
const { buildGrammar } = require('./build-grammar');

const [action, ...restArgs] = process.argv.slice(2);
const cwd = resolve(__dirname, '..');

const testFiles = ['dist/cjs/**/*.spec.js'];

const swcCommonArgs = [
  'swc',
  'lib',
  '--no-swcrc',
  '--source-maps',
  '-C',
  'jsc.parser.syntax=typescript',
  '-C',
  'jsc.target=es2022',
];

const minify = !/^(0|off|no|false)$/i.test(process.env.MINIFICATION_ENABLED);
if (!minify) console.warn('Minification is disabled');
swcCommonArgs.push('-C', `minify=${String(minify)}`);

const swcCJS = [
  ...swcCommonArgs,
  '--out-dir',
  'dist/cjs',
  '-C',
  'module.type=commonjs',
];
const swcESM = [
  ...swcCommonArgs,
  '--out-dir',
  'dist/esm',
  '--config',
  'module.type=es6',
];

function clean(all = false) {
  const files = ['dist'];
  if (all) files.push('lib/antlr');
  execSync(['rimraf', ...files], { cwd });
}
function execTest(watch = false) {
  const args = ['mocha', '--timeout', '5000'];
  if (watch) args.push('--watch');
  args.push(restArgs.length > 0 ? restArgs : testFiles);
  exec(args, { cwd });
}
function bundleESM(restArgs = []) {
  return execSync(['rollup', '--config', 'rollup.config.js', ...restArgs], {
    cwd,
  });
}

(async function main() {
  if (action === 'cjs') return execSync([...swcCJS, ...restArgs], { cwd });
  if (action === 'esm') return execSync([...swcESM, ...restArgs], { cwd });
  if (action === 'grammar') return buildGrammar();
  if (action === 'clean') return clean(true);
  if (action === 'test') {
    execSync(swcCJS, { cwd });
    return execTest();
  }
  if (action === 'test:watch') {
    exec([...swcCJS, '--watch'], { cwd });
    return setTimeout(() => execTest(true), 100);
  }
  // build all
  clean();
  const wait = buildGrammar();
  if (wait) await wait.promise;
  exec(swcCJS, { cwd });
  exec([...swcESM, ...restArgs], { cwd });
})();
