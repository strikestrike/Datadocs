#!/usr/bin/env node

const { resolve } = require('path');
const { execSync, projectDir } = require('./uitl');

const siteDir = resolve(projectDir, 'typedoc');

// build docs site
execSync(['http-server', 'out'], { cwd: siteDir });
