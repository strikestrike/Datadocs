#!/usr/bin/env node

const { execSync } = require('./uitl');

execSync(['rimraf', 'dist']);
execSync(['webpack'], { env: { WEBPACK_DEV_ONLY: '1' } });
require('./tsc-build');
