// vite.config.js
import * as fs from "fs";
import * as path from "path";
import { optimizeLodashImports } from "@optimize-lodash/rollup-plugin";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import sourceMaps from "rollup-plugin-sourcemaps";
import { visualizer } from "rollup-plugin-visualizer";
import sveltePreprocess from "svelte-preprocess";
import { typescript as svelteEsbuild } from "svelte-preprocess-esbuild";
import svelteWindi from "svelte-windicss-preprocess";
import { fileURLToPath } from "url";
import {
  defineConfig,
  normalizePath,
  splitVendorChunkPlugin,
  loadEnv,
} from "vite";
import windi from "vite-plugin-windicss";
import environment from "vite-plugin-environment";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { writables } from "./scripts/rollup-plugin-hoist-svelte-writables.mjs";

/**
 * @template ItemType
 * @param {Array<ItemType|boolean|null|undefined>} values
 * @returns {ItemType[]}
 */
const filterValues = (values) => values.filter((x) => x);

/**
 * @param {string[]} parts
 * @returns {string}
 */
const getPath = (...parts) =>
  normalizePath(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), ...parts)
  );

// const choosePathFrom = (...paths) =>
//  paths.map((it) => getPath(it)).find((it) => fs.existsSync(it)) ?? undefined;
// const resolveDependency = (dep) =>
//  choosePathFrom(`./node_modules/${dep}`, `../../node_modules/${dep}`);

export default defineConfig(({ mode, command }) => {
  const envVars = ["MOCK_API_ENDPOINT", "GOOGLE_MAPS_API_KEY"];
  const env = {
    // load .env file at the sub-module project
    ...loadEnv(mode, getPath("."), envVars),
    // load .env file at the root of the mono repo
    ...loadEnv(mode, getPath("../.."), envVars),
    ...process.env,
  };

  const production = mode === "production";
  const dev = mode === "development" || (command === "serve" && !production);
  const enableSourceMaps = !production;

  let { MOCK_API_ENDPOINT, GOOGLE_MAPS_API_KEY } = env;
  if (MOCK_API_ENDPOINT) {
    MOCK_API_ENDPOINT = JSON.stringify(MOCK_API_ENDPOINT);
    console.warn(`Mock API server is enabled: ${MOCK_API_ENDPOINT}`);
  } else {
    MOCK_API_ENDPOINT = "undefined";
  }

  if (GOOGLE_MAPS_API_KEY) {
    GOOGLE_MAPS_API_KEY = JSON.stringify(GOOGLE_MAPS_API_KEY);
  }

  let isAntlr4tsESM = false;
  const antlr4Index = getPath("../../node_modules/antlr4ts/esm/index.js");
  if (fs.existsSync(antlr4Index)) {
    isAntlr4tsESM = true;
    console.warn(`Using the ESM version of antlr4ts for building`);
  }

  /**
   * Output files into individual subfolders if current mode is not `production`.
   * Because of vite screwing up and getting mixed with dev/production files.
   * It does weird things when you run `yarn build` while the dev server is up.
   */
  const outDir = getPath(path.join("./dist"), !production ? mode : "");
  return {
    root: getPath("./src"),
    publicDir: getPath("./public"),
    // base: env.DATADOCS_BASE_PATH ?? "/",
    clearScreen: false,
    define: {
      MOCK_API_ENDPOINT,
      GOOGLE_MAPS_API_KEY,
      DATADOCS_BASE_PATH: JSON.stringify(env.DATADOCS_BASE_PATH),
    },
    experimental: dev
      ? {
          hmrPartialAccept: true,
        }
      : undefined,
    resolve: {
      extensions: [".ts", ".js", ".svelte", ".html"],
      dedupe: ["svelte", "windicss"],
      alias: {
        lodash: "lodash-es",
        src: getPath("./src"),
      },
    },
    esbuild: {
      define: {
        // global: "window",
        // Buffer: "window.Buffer",
      },
    },
    build: {
      watch:
        command === "serve"
          ? {
              include: [getPath("./src/styles/**/*.css")],
            }
          : false,
      /**
       * The default filename `manifest.json` is ambiguous with
       * PWA's manifest.json file. So we rename it with a prefix `.`
       */
      manifest: ".manifest.json",
      outDir,
      sourcemap: enableSourceMaps,
      emptyOutDir: true,
      commonjsOptions: {
        include: [/node_modules/],
        exclude: filterValues([/@datadocs\/.*/, isAntlr4tsESM && /antlr4ts/]),
      },
      rollupOptions: {
        plugins: [...(enableSourceMaps ? [sourceMaps()] : [])],
      },
    },
    optimizeDeps: {
      link: ["@datadocs/canvas-datagrid-ng", "@datadocs/ddc"],
      exclude: filterValues([
        "svelte-navigator",
        "@datadocs/duckdb-wasm",
        isAntlr4tsESM && "antlr4ts",
      ]),
    },
    server: {
      host: "localhost",
      port: 8080,
    },
    assetsInclude: [
      "**/*.map",
      "**/*.wasm",
      "**/*.png",
      "**/*.jp(e)?g",
      "**/*.gif",
      "**/*.webp",
    ],
    plugins: [
      writables({
        exclude: ["./src/utils/permanent-store.ts"],
        sourceMap: enableSourceMaps,
      }),
      nodePolyfills({
        protocolImports: true,
      }),
      environment({
        NODE_ENV: mode,
        DEBUG: "",
        DATADOCS_BASE_PATH: ".",
      }),
      windi({
        config: getPath("windi.config.mjs"),
        transformCSS: "pre",
        scan: {
          include: [getPath("./src/styles/**/*.css")],
        },
      }),
      svelte({
        onwarn: (warning, handler) => {
          if (warning.code === "css-unused-selector") return;
          if (production) return handler(warning);
          // disable a11y warnings
          if (
            warning.code.startsWith("a11y-") ||
            warning.code === "unused-export-let"
          )
            return;
          handler(warning);
        },
        preprocess: [
          svelteWindi({
            silent: false,
            mode: production ? "production" : "development",
            configPath: getPath("windi.config.mjs"),
            preflights: true,
            devTools: dev
              ? {
                  enabled: true,
                  completions: true,
                }
              : undefined,
          }),
          svelteEsbuild({
            sourcemap: enableSourceMaps,
          }),
          sveltePreprocess({
            postcss: false,
            typescript: false,
          }),
        ],
        emitCss: true,
        compilerOptions: {
          dev,
        },
        hot: dev,
      }),
      optimizeLodashImports({
        include: ["**/*.{ts,js,svelte}", /node_modules/],
        useLodashEs: true,
      }),
      splitVendorChunkPlugin(),
      ...(production
        ? [
            visualizer({
              projectRoot: getPath("../.."),
              template: "network",
              filename: getPath(".stats/network.html"),
            }),
            visualizer({
              projectRoot: getPath(".."),
              template: "treemap",
              filename: getPath(".stats/map.html"),
            }),
          ]
        : []),
    ],
    test: {
      watch: false,
      include: ["../**/*.{test,spec}.{js,mjs,cjs,ts}"],
    },
  };
});
