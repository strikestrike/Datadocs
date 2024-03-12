/// <reference types="node" />
// 2023-07-19

const { platform } = require('os');
const { existsSync } = require('fs');
const { resolve, basename } = require('path');
const { spawn, spawnSync } = require('child_process');

const useYarn = isTrue(process.env.USE_YARN);
const isFromYarn = /yarn\/bin/.test(process.env.npm_execpath);
const preferYarn = useYarn || isFromYarn;

const isWin32 = platform() === 'win32';
const projectDir = resolve(__dirname, '..');
exports.preferYarn = preferYarn;
exports.projectDir = projectDir;

/** @see https://stackoverflow.com/questions/14031763 */
const cleanupCallbacks = [];
function cleanup(code) {
  while (cleanupCallbacks.length > 0) cleanupCallbacks.pop()();
  if (typeof code === 'number') process.exit(code);
}
function addCleanupCallback(callback) {
  if (cleanupCallbacks.length === 0) {
    process.on('exit', cleanup.bind(null));
    process.on('SIGINT', cleanup.bind(null, 0));
    process.on('SIGUSR1', cleanup.bind(null, 1));
    process.on('SIGUSR2', cleanup.bind(null, 1));
    process.on('uncaughtException', cleanup.bind(null, 1));
  }
  cleanupCallbacks.push(callback);
}

/**
 * @param {string[]} command
 * @param {{ env?:{[x:string]:string}; cwd?:string }} [opts]
 */
function execSync(command, opts) {
  const env = { ...process.env };
  let cwd = projectDir;
  if (opts) {
    if (opts.env) Object.assign(env, opts.env);
    if (opts.cwd) cwd = opts.cwd;
  }

  const { name, bin, args } = parseCommand(command, cwd);
  console.error(`+ (sync) ${name} ${args.join(' ')}`);

  const ret = spawnSync(bin, args, {
    cwd,
    env,
    stdio: ['inherit', 'inherit', 'inherit'],
  });

  if (ret.status !== 0) {
    console.error(`${name} exit with code ${ret.status}`);
    process.exit(ret.status);
  }
}

/**
 * @param {string[]} command
 * @param {{ env?:{[x:string]:string}; cwd?: string; silent?:boolean }} [opts]
 */
function exec(command, opts) {
  const env = { ...process.env };
  let stdout = 'inherit';
  let cwd = projectDir;
  if (opts) {
    if (opts.silent) stdout = 'ignore';
    if (opts.env) Object.assign(env, opts.env);
    if (opts.cwd) cwd = opts.cwd;
  }

  const { name, bin, args } = parseCommand(command, cwd);
  console.error(`+ ${name} ${args.join(' ')}`);

  const child = spawn(bin, args, {
    cwd,
    env,
    stdio: [stdout, 'inherit', 'inherit'],
  });
  /** @type {Promise<number>} */
  const promise = new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code) => {
      console.error(`${name} exit with code ${code}`);
      return resolve(code);
    });
  });
  const kill = () => {
    console.error(`kill ${name} ...`);
    try {
      child.kill();
    } catch (error) {
      // noop
    }
  };
  addCleanupCallback(kill);
  return { child, promise, kill };
}

/**
 * @param {string[]} command
 * @param {string} cwd
 */
function parseCommand(command, cwd) {
  let bin = command[0];
  const args = command.slice(1);
  if (bin === 'npm') {
    if (!preferYarn) return { name: bin, bin, args };
    bin = 'yarn';
  }
  if (bin === 'yarn' || bin === 'node') return { name: bin, bin, args };

  /** @type {string} */
  let realBin;
  if (!useYarn) {
    realBin = resolve(cwd || projectDir, `node_modules/.bin/${bin}`);
    if (isWin32) realBin += '.cmd';
  }
  if (!realBin || !existsSync(realBin)) {
    realBin = useYarn || isFromYarn ? 'yarn' : 'npm';
    args.unshift('exec', bin, '--silent', '--');
  }
  return { name: basename(realBin), bin: realBin, args };
}

function isTrue(str) {
  return typeof str === 'string' && /^(1|on|yes|true)$/i.test(str);
}
function isFalse(str) {
  return typeof str === 'string' && /^(0|off|no|false)$/i.test(str);
}

exports.exec = exec;
exports.execSync = execSync;
exports.isTrue = isTrue;
exports.isFalse = isFalse;
