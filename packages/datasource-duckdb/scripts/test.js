#!/usr/bin/env node

const { createServer } = require('vite');
const puppeteer = require('puppeteer');

const port = 20571;
const url = `http://localhost:${port}/mocha.html?reporter=dot`;
const timeout = 60 * 1000;

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
async function main() {
  console.log(`[test] creating vite bundling server at the port ${port} ...`);
  const server = await createServer();
  await server.listen(port);

  console.log(`[test] launching puppeteer ...`);
  const browser = await puppeteer.launch({ headless: 'new' });
  const timer = setTimeout(() => closeAll('timeout', 1), timeout);
  const page = await browser.newPage();
  page.setCacheEnabled(false);
  page.on('console', async (msg) => {
    const args = msg.args().map((arg) => {
      const remoteObject = arg.remoteObject();
      if (['object', 'function'].includes(remoteObject.type)) {
        return arg.jsonValue();
      } else {
        return Promise.resolve(remoteObject.value);
      }
    });
    const resolved = await Promise.all(args);
    console.log.apply(console, resolved);
  });

  console.log(`[test] going to '${url}' ...`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  console.log(`[test] waiting for the result ...`);
  const element = await page.waitForSelector('.mocha-status');

  const result = await element.evaluate((el) => el.textContent);
  let exitCode = parseInt(result.trim(), 10);
  if (isNaN(exitCode)) exitCode = 1;

  console.log('[test] result: ' + result);
  closeAll(null, result);

  function closeAll(reason, exit) {
    browser.close();
    server.close();
    clearTimeout(timer);

    if (exit !== 0)
      console.error(`[test] exit with the code ${exit} ${reason || ''}`);
    process.exit(exit);
  }
}
