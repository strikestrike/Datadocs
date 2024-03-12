#!/usr/bin/env node

// usage: build-docs.js ...arguments for typedoc
// example: build-docs.js --watch

const { existsSync } = require('fs');
const { resolve } = require('path');
const { execSync, projectDir, preferYarn } = require('./uitl');

const siteDir = resolve(projectDir, 'typedoc');
const depsDir = resolve(siteDir, 'node_modules');

// install dependencies
if (!existsSync(depsDir))
  execSync([preferYarn ? 'yarn' : 'npm', 'install'], { cwd: siteDir });

// build theme
// execSync(['node', 'theme-oxide/scripts/retrieve-assets.js'], {
//   cwd: siteDir,
// });
// execSync(['tsc', '-p', 'tsconfig.theme.json'], { cwd: siteDir });

// build docs site
const typedocArgs = process.argv.slice(2);
typedocArgs.push('--options', 'typedoc.js');
execSync(['typedoc', ...typedocArgs], { cwd: siteDir });
// execSync(['typedoc', '--options', 'typedoc.theme.json'], { cwd: siteDir });
