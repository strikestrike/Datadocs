const { sveld } = require("sveld");
const fg = require("fast-glob");
const path = require("path");
const TypeDoc = require("typedoc");
const fs = require("fs");
const fsExtra = require("fs-extra");
const pkg = require("../package.json");
const pages = require("./docs-pages");

function copySource() {
  fsExtra.copySync("src", "docs/code/src", {
    filter: (file, a, b) => {
      if (
        fs.lstatSync(file).isDirectory() ||
        /\.ts$/.test(file) ||
        /\.d\.ts$/.test(file) ||
        /\.js$/.test(file)
      ) {
        return true;
      }
      return false;
    },
  });
}

function generateSvelteDocs() {
  const dir = "src";

  let svelteComponents = "";

  fg.sync([`${dir}/**/*.svelte`]).forEach((file) => {
    const moduleName = path.parse(file).name.replace(/\-/g, "");
    // let source = normalizeSeparators("./" + path.relative(dir, file));

    svelteComponents += `import ${moduleName}$$${Math.round(
      Math.random() * 99999
    )}$$ from "./${file}";\n`;

    // console.log(moduleName, source);
  });

  try {
    fs.writeFileSync(pkg.svelte, svelteComponents);
  } catch (err) {
    if (err) {
      console.log(err);
    }
  }

  return sveld({
    typesOptions: {
      outDir: "docs/code",
    },
  });
}

function cleanSveld() {
  const dir = "docs/code/src";
  console.log("clean-sveld");
  fg.sync([`${dir}/**/*.svelte.d.ts`]).forEach((file) => {
    let code = fs.readFileSync(file, "utf-8");
    let packageTagMatches;

    code = code.replace(/\$\$\d*\$\$/g, "");

    packageTagMatches = code.match(/@packageModule\((.*?)\)/);

    if (packageTagMatches !== null) {
      code = code.replace(/ \* @packageModule\(app\/Panel\)/, " *");
      code = code.replace(
        '/// <reference types="svelte" />',
        `/// <reference types="svelte" />
/**
* @packageDocumentation
* @module ${packageTagMatches[1]}
*/
      `
      );
    }

    fs.writeFileSync(file, code);
    fs.renameSync(file, file.replace(".svelte", ""));
  });
}

function rollupTypedoc() {
  const typedocOptions = {
    tsconfig: "tsconfig.docs.json",
    entryPoints: [
      "docs/code/src/layout/main/PanelsLayout",
      "docs/code/src/app/store",
      "docs/code/src/components/panels/panels.ts",
    ],
    entryPointStrategy: "expand",
    exclude: ["**/*+(.spec|.e2e).ts"],
    // excludeExternals: true,
    // categorizeByGroup: false,
    // excludePrivate: true,

    cleanOutputDir: true,
    name: "Panels Layout",
    readme: "./docs/pages/panels/panels.md",
    plugin: [
      "typedoc-plugin-rename-defaults",
      "@knodes/typedoc-plugin-pages",
      "@knodes/typedoc-plugin-code-blocks",
      // "typedoc-theme-hierarchy",
      "typedoc-plugin-merge-modules",
    ],
    sort: ["static-first", "required-first", "visibility", "source-order"],

    // theme: "oxide",
    // theme: "hierarchy",
    // theme: "categorized-hierarchy",
    pluginPages: pages,
    customCss: "./docs/pages/custom.css",

    // excludeInternal: false,

    media: "docs/media",

    out: "docs/web",

    disableSources: true,

    mergeModulesMergeMode: "module",
  };

  generateTypeDocs(typedocOptions).catch(console.error);
}

async function generateTypeDocs(options) {
  const app = new TypeDoc.Application();

  app.options.addReader(new TypeDoc.TSConfigReader());
  app.options.addReader(new TypeDoc.TypeDocReader());
  app.bootstrap(options);
  const project = app.convert();

  if (project) {
    if (options.json) {
      console.log("Generating typedoc json");
      await app.generateJson(project, options.json);
    } else {
      console.log("Generating updated typedocs");
      await app.generateDocs(project, options.out);
    }
  }
}

fsExtra.emptyDirSync("docs/code");
fsExtra.emptyDirSync("docs/web");

copySource();

generateSvelteDocs().then(() => {
  console.log("Generated Svelte Components imports!");
  setTimeout(() => {
    cleanSveld();
    rollupTypedoc();
  }, 5000);
});
