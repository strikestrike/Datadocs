/** https://mochajs.org/#command-line-usage */
const booleanArgs = new Set(['--parallel', '--watch', '--dry-run']);

/**
 * @param {string} distDir
 * @param {string[]} argv
 */
exports.transformMochaArgs = function transformMochaArgs(distDir, argv) {
  distDir = distDir.replace(/\/+$/, '');

  /** @type {string[]} */
  const nodeArgs = ['--enable-source-maps'];

  /** @type {string[]} */
  const mochaArgs = [];

  /** @type {string[]} */
  const restArgs = [];

  for (let i = 0; i < argv.length; i++) {
    const args = argv[i];
    if (args.startsWith('--inspect')) {
      nodeArgs.push(args);
      continue;
    }
    if (args.startsWith('-')) {
      if (!args.startsWith('--') || booleanArgs.has(args)) mochaArgs.push(args);
      else mochaArgs.push(args, argv[++i]);
      continue;
    }
    restArgs.push(transformArgs(args));
  }
  return { node: nodeArgs, mocha: mochaArgs, rest: restArgs };

  /** Transform file path (E.g., from `lib/.../...` to `dist/.../...`) */
  function transformArgs(args = '') {
    // check if match any source file
    let mtx = args.match(/^(?:\.\/)?lib(\/.+)\.ts$/);
    if (mtx) return `${distDir}${mtx[1]}.js`;
    // check if match any source directory
    mtx = args.match(/^(?:\.\/)?lib(\/.+)$/);
    if (mtx) return `${distDir}${mtx[1]}/**/*.js`;
    return args;
  }
};
