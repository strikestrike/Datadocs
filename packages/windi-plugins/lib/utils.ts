import * as fs from "node:fs";
import * as path from "node:path";

import { Processor } from "windicss/lib";
import plugin from "windicss/plugin";
import { CSSParser } from "windicss/utils/parser";
import type { StyleSheet } from "windicss/utils/style";

export type Options = {
  include: string[];
  watch?: false | true | "persistent";
  onChange?: () => any;
};
export type CompiledStyle = {
  [ruleName: string]: {
    [prop: string]: string;
  };
};

export const utilsPlugin = plugin.withOptions(function (options: Options) {
  const { onChange } = options;
  const processor = new Processor(options);
  const doWatch = options.watch !== false;
  const persistentWatch = options.watch === "persistent";

  return function ({ addBase, addComponents, addUtilities, addDynamic }) {
    for (let i = 0; i < options.include.length; i++) {
      const file = options.include[i];
      applyFile(file);
      if (doWatch) watchFile(file);
    }

    function watchFile(file: string) {
      let timer: any;
      const watcher = fs.watch(file, { persistent: persistentWatch });
      watcher.on("change", (ev, filename) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          clearTimeout(timer);
          if (applyFile(file) && typeof onChange === "function") onChange();
        }, 100);
      });
    }

    function applyFile(file: string) {
      if (!fs.existsSync(file)) return false;
      let styleSheet: StyleSheet;
      try {
        const parser = new CSSParser(fs.readFileSync(file, "utf-8"), processor);
        styleSheet = parser.parse();
      } catch (e) {
        console.error(`ERROR in ${file}:`, e);
        return false;
      }
      const split = styleSheet.split();
      addComponents(compileStyle(split.components));
      addUtilities(compileStyle(split.utilities));
      addBase(compileStyle(split.base));
      dump(file, styleSheet);
      return true;
    }
  };
});

function dump(file: string, styleSheet: StyleSheet) {
  const c1 = styleSheet.layer("components").children.length ?? 0;
  const c2 = styleSheet.layer("utilities").children.length ?? 0;
  const c3 = styleSheet.layer("base").children.length ?? 0;
  const fileName =
    path.basename(path.dirname(file)) + "/" + path.basename(file);

  console.log(
    `Imported ${c1} component(s), ${c2} utilities, and ${c3} base style(s) from ${fileName}`
  );
}

function compileStyle(sheet: StyleSheet): CompiledStyle {
  const result: CompiledStyle = {};
  sheet.children.forEach((style) => {
    const props = {} as any;
    style.property.forEach((prop) => {
      if (!prop.name) return;
      if (Array.isArray(prop.name)) {
        prop.name.forEach((name) => (props[name] = prop.value));
        return;
      }
      props[prop.name] = prop.value;
    });
    result[style.rule] = props;
  });
  return result;
}
