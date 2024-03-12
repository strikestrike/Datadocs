#!/usr/bin/env node
//@ts-check

const fs = require("fs");
const path = require("path");
const pkgFile = path.resolve(__dirname, "../packages/ddc/packages/ddc/package.json");
const indent = "  ";

if (fs.existsSync(pkgFile)) {
  const pkg = require(pkgFile);
  {
    //#region 1. Remove unused dependencies
    if (pkg.dependencies) delete pkg.dependencies.duckdb;
    if (pkg.devDependencies) delete pkg.devDependencies.duckdb;
    if (pkg.optionalDependencies) delete pkg.optionalDependencies.duckdb;
    //#endregion
  }

  // {
  //   //#region 2. Remove unnecessary building steps
  //   const scriptName = "generate-all-parsers";
  //   if (pkg.scripts && scriptName in pkg.scripts) {
  //     pkg.scripts["generate-all-parsers"] = "true";
  //   }
  //   //#endregion
  // }
  fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, indent));
  console.log(`Optimized '${pkgFile}'`);
}
