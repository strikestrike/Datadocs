/**
 * This a rollup plugin that provide virtual imports via: `import storeName from "virtual:writable/storeName`
 * and generates stand-alone virtual modules on a per-store basis during compilation.
 * This allows for better store stability and a much better HMR experience.
 * All svelte `writable(...)` calls are transplied to virtual modules.
 */

import {
  attachScopes,
  createFilter,
  makeLegalIdentifier,
} from "@rollup/pluginutils";

import { walk } from "estree-walker";
import MagicString from "magic-string";
import * as path from "path";

const virtualModuleId = "virtual:writable/";
const writableModuleId = "\0" + virtualModuleId;

export function writables(options = {}) {
  const filter = createFilter(
    options.include ?? ["**/*.{ts,js,svelte}"],
    options.exclude ?? ["node_modules"]
  );
  const { sourceMap = true, transform = true } = options;
  /** @type {import('vite').Plugin} */
  return {
    name: "svelte-auto-writables",
    transform(code, id) {
      if (!transform || !filter(id)) return null;
      if (id.startsWith(writableModuleId)) return null;
      const fileName = path.basename(id);
      let ast = null;
      try {
        ast = this.parse(code);
      } catch (err) {
        this.warn({
          code: "PARSE_ERROR",
          message: `svelte-auto-writables: failed to parse ${id}. Consider restricting the plugin to particular files via options.include`,
        });
      }
      if (!ast) {
        return null;
      }
      const magicString = new MagicString(code);
      const newImports = new Map();
      const imports = new Set();

      ast.body.forEach((node) => {
        if (node.type === "ImportDeclaration") {
          if (node.source.value === "svelte/store")
            node.specifiers.forEach((specifier) => {
              if (specifier.imported.name === "writable")
                imports.add(specifier.local.name);
            });
        }
      });

      if (imports.size) {
        let scope = attachScopes(ast, "scope");

        walk(ast, {
          enter(node, parent) {
            if (node.type === "FunctionDeclaration") {
              this.skip();
              return;
            }

            if (node.scope) {
              scope = node.scope;
            }

            if (
              node.type === "CallExpression" &&
              parent.type === "VariableDeclarator" &&
              imports.has(node.callee.name) &&
              !scope.contains(node.callee.name)
            ) {
              if (sourceMap) {
                magicString.addSourcemapLocation(node.start);
                magicString.addSourcemapLocation(node.end);
              }

              const moduleId = `${fileName}:${parent.id.name}`;
              const importdName = `${virtualModuleId}${moduleId}`;
              const localName = makeLegalIdentifier(
                `$__writable_${parent.id.name}`
              );
              newImports.set(
                importdName,
                `import ${localName}, { init as ${localName}_init } from '${importdName}';`
              );
              magicString.overwrite(node.start, node.end, localName, {
                storeName: true,
              });
              if (node.arguments.length) {
                const initStr = `;\n${localName}_init(${code.substring(
                  node.arguments[0].start,
                  node.arguments[0].end
                )})`;
                magicString.addSourcemapLocation(node.end + initStr.length);
                magicString.appendRight(node.end, initStr);
              }
              this.skip();
            }
          },
          leave(node) {
            if (node.scope) {
              scope = scope.parent;
            }
          },
        });
      }

      if (newImports.size === 0) {
        return {
          code,
          ast,
          map: sourceMap ? magicString.generateMap({ hires: true }) : null,
        };
      }

      const importBlock = Array.from(newImports.values()).join("\n\n");

      magicString.prepend(`${importBlock}\n\n`);

      return {
        code: magicString.toString(),
        map: sourceMap ? magicString.generateMap({ hires: true }) : null,
      };
    },
    resolveId(id, importer, options) {
      if (id.startsWith(virtualModuleId)) {
        const ident = [
          writableModuleId,
          id.substring(virtualModuleId.length),
        ].join("");
        return {
          id: ident,
          moduleSideEffects: false,
        };
      }
      return null;
    },
    load(id) {
      if (id.startsWith(writableModuleId)) {
        return `
          import { writable, get } from "svelte/store";
          const store = writable();
          let didInit = false;
          if (import.meta.hot) {
            import.meta.hot.accept(({__didInit, __get, __store}) => {
              didInit = __didInit;
              store.set(__get(__store));
            });
            import.meta.hot.dispose(() => {
              store.set(null);
            });
          }
          export function init(value) {
            if (!didInit) {
              store.set(value);
              didInit = true;
            }
          }
          export {get as __get, store as __store, didInit as __didInit};
          export default store;
        `;
      }
    },
  };
}
