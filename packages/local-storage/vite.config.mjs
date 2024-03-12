// vite.config.js
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import sourceMaps from 'rollup-plugin-sourcemaps';
import { defineConfig, normalizePath, splitVendorChunkPlugin } from 'vite';
import environment from 'vite-plugin-environment';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const getPath = (...parts) =>
  normalizePath(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), ...parts),
  );

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
  };

  return {
    root: getPath('./lib'),
    clearScreen: false,
    experimental: dev ? { hmrPartialAccept: true } : undefined,
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
    server: {
      host: 'localhost',
      port: 8083,
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
      nodePolyfills({ protocolImports: true }),
      environment({
        NODE_ENV: mode,
        DEBUG: '',
      }),
      splitVendorChunkPlugin(),
      addRedirect,
    ],
  };
});
