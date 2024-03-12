/* eslint-disable */
//@ts-check
const { appendFileSync } = require("fs");

// const { fileURLToPath } = require("url");
// const targetFile = fileURLToPath(new URL('dist/esm/index.js', import.meta.url));
const targetFile = __dirname + "/dist/esm/index.js";
appendFileSync(
  targetFile,
  `
export const esm = 'esm';
`
);
