#!/usr/bin/env node

const { exec, projectDir } = require('./uitl');
const { getServer, getPort } = require('./dev');

const port = getPort(8081);
const server = getServer(projectDir);
server.listen(port, () => {
  console.log('');
  console.log(`+ dev server is listening at the port ${port}`);
  if (typeof port === 'number') console.log(`+ http://127.0.0.1:${port}`);
  console.log('');

  const p = exec(
    ['node', 'scripts/bundle-esm.js', '--watch', ...process.argv.slice(2)],
    {
      cwd: projectDir,
      env: { BUILD_POLYFILLS: 'true' },
    },
  );

  process.on('SIGINT', () => {
    p.kill();
    process.exit(0);
  });
});
