#!/usr/bin/env node

const { resolve } = require('path');
const { exec } = require('./uitl');

require('./before-test');
const processes = [
  exec(['webpack', 'watch'], { env: { WEBPACK_DEV_ONLY: '1' } }),
  exec([
    'swc',
    'lib',
    '--out-dir',
    'dist/cjs',
    '--no-swcrc',
    '--config-file',
    resolve(__dirname, 'tsc-build.swcrc'),
    '--config',
    'minify=false',
    '--watch',
  ]),
  exec(['karma', 'start', '--no-single-run']),
];
const killAll = () => processes.forEach((it) => it.kill());

Promise.all(processes.map((its) => its.promise))
  .catch((error) => console.error(error))
  .then(() => killAll());
process.on('SIGINT', () => {
  killAll();
  process.exit(0);
});
