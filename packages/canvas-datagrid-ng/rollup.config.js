const path = require('path');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const swc = require('rollup-plugin-swc').default;
const commonjs = require('@rollup/plugin-commonjs');
const replace = require('@rollup/plugin-replace');

const outputDir = 'dist';
const swcConfig = getSwcConfig();
module.exports = [
  getRollupOptions('lib/main.ts'),
  isTrueString(process.env.BUILD_POLYFILLS) &&
    getRollupOptions('lib/polyfills.ts'),
].filter((it) => it);

/**
 * @param {string} input
 * @returns {import('rollup').RollupOptions}
 */
function getRollupOptions(input) {
  const output = path.join(
    outputDir,
    path.basename(input).replace(/\.\w+$/, '.mjs'),
  );
  return {
    input,
    plugins: getRollupPlugins(),
    output: {
      file: output,
      sourcemap: swcConfig.sourceMaps ? true : false,
    },
    watch: {
      clearScreen: false,
    },
  };
}

/** @returns {import('rollup'.Plugin[])} */
function getRollupPlugins() {
  return [
    commonjs({
      include: [/node_modules/],
    }),
    nodeResolve({
      preferBuiltins: false,
      extensions: ['.ts', '.js'],
    }),
    swc(swcConfig),
    replace({
      preventAssignment: true,
      'window.EXCLUDE_GLOBAL': 'true',
    }),
  ];
}

function getSwcConfig() {
  /**
   * @see https://swc.rs/docs/configuration/compilation
   * @type {import('@swc/core').Options}
   */
  const swcConfig = {
    minify: true,
    sourceMaps: true,
    jsc: {
      target: 'es2020',
      externalHelpers: false,
      parser: {
        syntax: 'typescript',
      },
      loose: false,
      minify: {
        compress: {
          unused: true,
        },
        mangle: true,
      },
    },
  };
  if (isFalseString(process.env.MINIFICATION_ENABLED)) {
    console.warn('Minification is disabled');
    swcConfig.minify = false;
    swcConfig.jsc.minify.compress = false;
    swcConfig.jsc.minify.mangle = false;
  }
  if (isFalseString(process.env.SOURCE_MAP_ENABLED)) {
    console.warn('Sourcemap is disabled');
    delete swcConfig.sourceMaps;
  }
  return swcConfig;
}

function isFalseString(str) {
  return /^(0|off|no|false)$/i.test(str);
}
function isTrueString(str) {
  return /^(1|on|yes|true)$/i.test(str);
}
