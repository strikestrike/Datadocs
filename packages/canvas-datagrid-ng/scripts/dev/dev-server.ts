import { existsSync, readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';
import type { Config } from '@swc/core';
import { transformSync } from '@swc/core';
import express from 'express';

const swcConfigForDemoTs: Config = {
  sourceMaps: false,
  minify: false,
  module: { type: 'es6' },
  jsc: {
    target: 'es2020',
    parser: {
      syntax: 'typescript',
    },
  },
};

export function getPort(defaultPort: string | number): string | number {
  if (process.env.PORT) {
    const portString = process.env.PORT;
    const port = parseInt(portString, 10);
    if (isNaN(port)) return portString;
    return port;
  }
  return defaultPort;
}

export function getServer(projectRoot: string) {
  const distDir = resolve(projectRoot, 'dist');
  const compiledDir = resolve(projectRoot, 'dist/cjs');
  const demoDir = resolve(projectRoot, 'demo');

  const server = express();
  server.use((req, res, next) => {
    console.log(req.method + ' ' + req.originalUrl);
    next();
  });
  server.get('/', (req, res) => res.redirect('/demo'));
  server.get('/demo', (req, res) => {
    res.status(200);
    res.header('Content-Type', 'text/html;charset=UTF-8');
    res.end(getDemoIndexHtml());
  });
  server.use('/demo/**/*.ts', tsCompiler);
  server.use('/demo/**/*.js', tsCompiler);
  server.use('/demo', express.static(demoDir));

  server.use('/lib', resolveESM);
  server.use((req, res) => res.status(404).end());
  return server;

  function normalizeReqPath(reqPath: string) {
    const qIndex = reqPath.indexOf('?');
    if (qIndex >= 0) reqPath = reqPath.slice(0, qIndex);
    if (!reqPath) return;

    const pathParts = reqPath.replace(/^\//, '').split('/');
    const normalizedParts: string[] = [];
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      if (part.startsWith('.')) continue;
      normalizedParts.push(part);
    }

    const normalizedPath = normalizedParts.join('/');
    return normalizedPath;
  }

  function tsCompiler(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) {
    let reqFile = normalizeReqPath(req.originalUrl);
    if (!reqFile) return next();

    reqFile = reqFile.replace(/^demo\//, '').replace(/\.js$/, '.ts');
    if (!reqFile) return next();

    let script: string;
    let result: ReturnType<typeof transformSync>;
    console.log(resolve(demoDir, reqFile));
    try {
      script = readFileSync(resolve(demoDir, reqFile), 'utf8');
    } catch (error) {
      return next();
    }
    console.log(`[typescript] ${req.path}`);
    try {
      result = transformSync(script, swcConfigForDemoTs);
    } catch (error) {
      console.error(error);
      res.status(500).send(error.message);
      return;
    }
    res.status(200);
    res.header('Content-Type', 'application/javascript;charset=UTF-8');
    res.write(result.code);
    res.end();
  }

  function getDemoIndexHtml() {
    const files = readdirSync(demoDir, { withFileTypes: true });
    const html = [`<h1>Demo</h1>`, `<ul>`];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.name.startsWith('.')) continue;
      if (!file.isDirectory()) continue;
      const url = encodeURI(`/demo/${file.name}/index.html`);
      html.push(`<li><a href="${url}">${file.name}</a></li>`);
    }
    html.push('</ul>');
    return html.join('\n');
  }

  function resolveESM(
    request: express.Request,
    response: express.Response,
    next: any,
  ) {
    const normalizedPath = normalizeReqPath(request.path);
    if (!normalizedPath) return next();

    if (responseFile(normalizedPath, distDir)) return;
    if (responseFileWithDiffExtName(normalizedPath, '.js', distDir)) return;
    if (responseFileWithDiffExtName(normalizedPath, '.mjs', distDir)) return;

    if (responseFile(normalizedPath, compiledDir)) return;
    if (responseFileWithDiffExtName(normalizedPath, '.js', compiledDir)) return;

    const tryFile = normalizedPath + '/index.js';
    if (existsSync(resolve(distDir, tryFile)))
      return response.redirect(302, tryFile);

    return next();

    function responseFile(filePath: string, baseDir?: string) {
      if (baseDir) filePath = resolve(baseDir, filePath);
      if (existsSync(filePath)) {
        response.sendFile(filePath);
        return true;
      }
      return false;
    }
    function responseFileWithDiffExtName(
      filePath: string,
      newExtName: string,
      baseDir?: string,
    ) {
      const newFilePath = filePath.replace(/(\.\w+)?$/, newExtName);
      if (newFilePath === filePath) return false;
      return responseFile(newFilePath, baseDir);
    }
  }
}
