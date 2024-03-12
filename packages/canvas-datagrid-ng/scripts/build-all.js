#!/usr/bin/env node

const { exec, execSync } = require('./uitl');

execSync(['rimraf', 'dist']);
exec(['node', 'scripts/build-esm']);
exec(['node', 'scripts/bundle-esm']);
exec(['node', 'scripts/build-cjs']);
