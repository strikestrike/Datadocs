// vite.config.js
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import sourceMaps from 'rollup-plugin-sourcemaps';
import { defineConfig, normalizePath, splitVendorChunkPlugin } from 'vite';
import environment from 'vite-plugin-environment';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const getPath = (...parts) =>
  normalizePath(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), ...parts),
  );

const copyStaticAssets = () => {
  const require = createRequire(import.meta.url);
  const mochaDir = path.dirname(require.resolve('mocha'));
  const file = 'mocha.css';
  fs.copyFileSync(path.resolve(mochaDir, file), getPath('lib/dev', file));
  console.log(`copied '${file}'`);
};

/** @type {import('vite').Plugin} */
const addRedirect = {
  name: 'add-redirect',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.method !== 'GET' || req.url !== '/') return next();
      res.writeHead(302, {
        Location: '/dev/index.html',
      });
      res.end();
    });
  },
};

export default defineConfig(({ mode, command }) => {
  const production = mode === 'production';
  const dev = mode === 'development' || (command === 'serve' && !production);
  const enableSourceMaps = !production;

  const outDir = getPath(path.join('./dist'), 'dev');
  const input = {
    index: getPath('./lib/dev/index.html'),
    mocha: getPath('./lib/dev/mocha.html'),
  };

  try {
    copyStaticAssets();
  } catch (e) {
    console.error(e);
  }

  return {
    root: getPath('./lib'),
    // publicDir: getPath('./public'),
    clearScreen: false,
    experimental: dev
      ? {
          hmrPartialAccept: true,
        }
      : undefined,
    resolve: {
      extensions: ['.ts', '.js', '.html'],
      // dedupe: ['svelte', 'windicss'],
    },
    esbuild: {
      define: {
        // global: "window",
        // Buffer: "window.Buffer",
      },
    },
    build: {
      /**
       * The default filename `manifest.json` is ambiguous with
       * PWA's manifest.json file. So we rename it with a prefix `.`
       */
      manifest: '.manifest.json',
      outDir,
      sourcemap: enableSourceMaps,
      emptyOutDir: true,
      commonjsOptions: {
        include: [/node_modules/],
        exclude: [/@datadocs\/.*/],
      },
      rollupOptions: {
        plugins: [...(enableSourceMaps ? [sourceMaps()] : [])],
        input,
      },
    },
    optimizeDeps: {
      link: ['@datadocs/canvas-datagrid-ng', '@datadocs/ddc'],
    },
    server: {
      host: 'localhost',
      port: 8080,
    },
    assetsInclude: [
      '**/*.map',
      '**/*.wasm',
      '**/*.png',
      '**/*.jp(e)?g',
      '**/*.gif',
      '**/*.webp',
    ],
    plugins: [
      nodePolyfills({
        protocolImports: true,
      }),
      environment({
        NODE_ENV: mode,
        DEBUG: '',
        DATADOCS_BASE_PATH: '.',
      }),
      splitVendorChunkPlugin(),
      addRedirect,
    ],
  };
});
