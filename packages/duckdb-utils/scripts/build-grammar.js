const fs = require('fs');
const crypto = require('crypto');
const { exec } = require('../../canvas-datagrid-ng/scripts/uitl');
const { resolve, relative } = require('path');

const cwd = resolve(__dirname, '..');

const src = resolve(__dirname, '../grammar');
const dest = resolve(__dirname, '../lib/antlr');
const lastBuildInfoFile = resolve(dest, '.lastbuildinfo');

/**
 * @main
 * The core logic of this building script
 */
const execAntlr4ts = (absPathOfFiles = []) =>
  // antlr4ts -Xexact-output-dir -o /path/to/dir -visitor .../path/to/files
  exec(
    [
      'antlr4ts',
      '-Xexact-output-dir',
      '-o',
      relative(cwd, dest),
      // '-visitor',
      ...absPathOfFiles.map((absPath) => relative(cwd, absPath)),
    ],
    { cwd },
  );
const getFileSHA1 = (filePath) =>
  crypto.createHash('sha1').update(fs.readFileSync(filePath)).digest('hex');

exports.buildGrammar = function buildGrammar() {
  const srcFiles = fs
    .readdirSync(src, { withFileTypes: true })
    .filter(
      (it) => it.isFile() && !it.name.startsWith('.') && it.name.match(/\.g4$/),
    );
  const srcPaths = srcFiles.map((it) => resolve(src, it.name));

  const currBuildInfo = srcFiles
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((it, i) => {
      const absPath = srcPaths[i];
      const stat = fs.statSync(absPath);
      let sha1 = '';
      return {
        name: it.name,
        size: stat.size,
        mtime: stat.mtime,
        get sha1() {
          if (!sha1) sha1 = getFileSHA1(absPath);
          return sha1;
        },
      };
    });

  if (fs.existsSync(dest)) {
    /** @type {typeof currBuildInfo} */
    let lastInfo;
    try {
      lastInfo = JSON.parse(fs.readFileSync(lastBuildInfoFile, 'utf-8'));
      const notmatch = lastInfo.find((last, i) => {
        const curr = currBuildInfo[i];
        if (!curr) return true;
        if (curr.name !== last.name || curr.size !== last.size) return true;
        if (curr.mtime !== last.mtime) if (curr.sha1 !== last.sha1) return true;
        return false;
      });
      // all files is same the with last build
      if (!notmatch) return;
    } catch (error) {
      // noop
    }
  } else {
    fs.mkdirSync(dest);
  }

  const result = execAntlr4ts(srcPaths);
  result.promise = result.promise.then((code) => {
    if (code !== 0) return;
    fs.writeFileSync(lastBuildInfoFile, JSON.stringify(currBuildInfo, null, 2));
  });
  return result;
};
