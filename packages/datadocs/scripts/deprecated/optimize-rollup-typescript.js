//@ts-check
// const { transformSync: transformBySwc } = require("@swc/core");
const { transformSync: transformByEsbuild } = require("esbuild");
// const { transform: transformBySucrase } = require("sucrase");

/**
 * @typedef {{sourceMaps?:boolean}} Opts
 * @typedef {{
 *   content: string;
 *   map: any;
 *   filename: string;
 *   attributes: {[x:string]: string}
 * }} TransformContext
 */
module.exports = class OptimizedRollupTypescriptLoader {
  /** @type {Opts} */
  opts;

  /** @param {Opts} [opts] */
  constructor(opts) {
    this.opts = Object.assign({ sourceMaps: true }, opts || {});
  }

  /**
   * @deprecated
   * `swc` doesn't provide a configuration for keeping unused import statement.
   * So its generated code can't work well with other part of svelte code.
   * For example, you import a component in ts segment
   * but this component is only used in html segment.
   *
   * @param {TransformContext} context
   * @returns {{code: string;map?: string}}
   */
  transformBySwc = (context) => {
    try {
      const { code, map } = transformBySwc(context.content, {
        swcrc: false,
        filename: context.filename,
        sourceMaps: this.opts.sourceMaps ? true : false,
        minify: false,
        jsc: {
          keepClassNames: true,
          preserveAllComments: true,
          minify: {
            compress: false,
            mangle: false,
          },
          transform: {
            /**
             * Turn off optimizer for keeping "unused imports and variables"
             * @type {any}
             */
            optimizer: undefined,
          },
          parser: {
            syntax: "typescript",
          },
        },
      });
      return { code, map };
    } catch (error) {
      console.error(
        `compile TypeScript in ${context.filename} failed: ${error.message}`
      );
      return { code: "", map: "" };
    }
  };

  /**
   * @param {TransformContext} context
   * @returns {{code: string;map?: string}}
   */
  transformByEsbuild = (context) => {
    try {
      const { code, map } = transformByEsbuild(context.content, {
        sourcefile: context.filename,
        sourcemap: this.opts.sourceMaps ? true : false,
        loader: "ts",
        minify: false,
        treeShaking: false,
        tsconfigRaw: {
          /**
           * @see https://github.com/evanw/esbuild/issues/1525
           * @see https://github.com/evanw/esbuild/issues/604
           */
          compilerOptions: {
            importsNotUsedAsValues: 'preserve',
            preserveValueImports: true,
          },
        },
      });
      // if (context.filename.indexOf("ModalContentWrapper.svelte") >= 0) {
      //   console.log(context.content);
      //   console.log("====>");
      //   console.log(code);
      // }
      return { code, map };
    } catch (error) {
      console.error(
        `compile TypeScript in ${context.filename} failed: ${error.message}`
      );
      return { code: "", map: "" };
    }
  };

  /**
   * @deprecated
   * `sucrase` also drops all unused imports like what `swc` does
   * @param {TransformContext} context
   * @returns {{code: string;map?: any}}
   */
  transformBySucrase = (context) => {
    try {
      const { code, sourceMap } = transformBySucrase(context.content, {
        filePath: context.filename,
        transforms: ["typescript"],
        preserveDynamicImport: true,
      });
      return { code, map: sourceMap };
    } catch (error) {
      console.error(
        `compile TypeScript in ${context.filename} failed: ${error.message}`
      );
      return { code: "", map: "" };
    }
  };
};
