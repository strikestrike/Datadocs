---
date: 2022-07-31
tags:
  - build
  - guide
---
# How to build the grid component

This project contains 4 building flows:

1. Bundling source code to JavaScript files for normal browser usage
  - The command to execute this flow: `webpack`
  - This flow contains two output files: `dist/canvas-datagrid.debug.js` and `dist/canvas-datagrid.js`
  - You can speed up your development by exporting a environment variable `WEBPACK_DEV_ONLY` with the value `yes`. The webpack will only generate the file `dist/canvas-datagrid.debug.js` if you do it.
2. Bundling source code to a JavaScript ES6 module file
  - The command to execute this flow: `npm run build:module`
  - The behavior of this command can be customized with a few environment variables: 
    - `MINIFICATION_ENABLED=false` disables minification
    - `SOURCE_MAP_ENABLED=false` disables source maps
  - The output file of this flow is `canvas-datagrid.module.js`
3. Transforming TypeScript files to corresponding JavaScript files for unit tests
  - `./scripts/tsc-build.js`
4. Generating type definition files from source code.
  - `tsc emitDeclarationOnly`

``` bash
# Here are commands for daily work
# The command `yarn` in the following commands can be replaced to `npm`

export WEBPACK_DEV_ONLY=yes
# Windows OS: SET WEBPACK_DEV_ONLY=yes

yarn run start

# Testing after the feature is complete:
# Open http://localhost:9876/ in your browser after the following command
yarn run test:watch
```

