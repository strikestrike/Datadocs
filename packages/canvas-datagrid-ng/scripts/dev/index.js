const fs = require('fs');
const path = require('path');
const swc = require('@swc/core');

const files = fs.readdirSync(__dirname);
const cache = path.resolve(__dirname, '.cache');
if (!fs.existsSync(cache)) fs.mkdirSync(cache);

const exp = {};
for (let i = 0; i < files.length; i++) {
  const file = files[i];
  if (file.startsWith('.')) continue;
  if (file.endsWith('.d.ts')) continue;
  if (!file.endsWith('.ts')) continue;

  const filePath = path.resolve(__dirname, file);
  const output = file.replace(/\.ts$/, '.js');
  const outputPath = path.resolve(cache, output);
  const outputContent = swc.transformFileSync(filePath, {
    module: { type: 'commonjs' },
    jsc: { target: 'es2020' },
  });
  fs.writeFileSync(outputPath, outputContent.code);
  Object.assign(exp, require(outputPath));
  // console.log(`${file} => ${output}`);
}
module.exports = exp;
