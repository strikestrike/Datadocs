#!/usr/bin/env node

const { execSync, projectDir } = require('./uitl');

execSync(['rollup', '--config', 'rollup.config.js', ...process.argv.slice(2)], {
  cwd: projectDir,
});
