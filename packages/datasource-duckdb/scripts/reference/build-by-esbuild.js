#!/usr/bin/env node
//@ts-check

const glob = require('glob');
const fs = require('fs-extra');
const esbuild = require('esbuild');
const { resolve, dirname, relative } = require('path');

const projectDir = resolve(__dirname, '../..');
const srcDir = resolve(projectDir, 'lib');

const files = glob.sync('**/*.ts', { cwd: srcDir });
// console.log(`found ${files.length} src files`);

const mkdirs = new Set();
const mkdir = async (path) => {
  if (mkdirs.has(path)) return;
  await fs.mkdirp(path);
  mkdirs.add(path);
};

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  if (file.startsWith('dev/')) continue;
  if (file.endsWith('.spec.ts')) continue;

  const filePath = resolve(srcDir, file);
  const outName = file.replace(/\.ts$/i, '.js');
  (async () => {
    const cjsOut = resolve(projectDir, 'dist/cjs', outName);
    const esmOut = resolve(projectDir, 'dist/esm', outName);
    const code = await fs.readFile(filePath, 'utf-8');

    const sourcefile = relative(cjsOut, filePath);
    const cjsResult = await esbuild.transform(code, {
      sourcefile,
      sourcemap: true,
      target: 'es2022',
      format: 'cjs',
      loader: 'ts',
    });
    await mkdir(dirname(cjsOut));
    await fs.writeFile(cjsOut, cjsResult.code);
    await fs.writeFile(cjsOut + '.map', cjsResult.map);

    const esmResult = await esbuild.transform(code, {
      sourcefile,
      sourcemap: true,
      target: 'es2022',
      format: 'esm',
      loader: 'ts',
    });
    await mkdir(dirname(esmOut));
    await fs.writeFile(esmOut, esmResult.code);
    await fs.writeFile(esmOut + '.map', esmResult.map);

    // console.log(`${file}`);
  })();
}
