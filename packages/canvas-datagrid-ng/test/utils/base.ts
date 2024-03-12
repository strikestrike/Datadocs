/// <reference types="mocha" />

export function debug() {
  if (this) {
    const thiz: Mocha.Context = this as any;
    if (typeof thiz.timeout === 'function') thiz.timeout(60 * 1000);
    if (typeof thiz.slow === 'function') thiz.slow(60 * 1000);
  }
  // eslint-disable-next-line no-debugger
  debugger;
}

export function g(args) {
  let grid;
  const i = document.getElementById('grid');
  const a = document.createElement('div');
  const t = document.createElement('div');
  const d = document.createElement('div');
  a.className = 'test-container';
  d.className = 'grid-container';
  t.className = 'grid-test-title';
  t.innerHTML = args.test.title;
  args.drawSynchronously = true;

  function poll() {
    setTimeout(function () {
      if (args.test.state === 'failed') {
        t.classList.add('grid-test-failed');
        grid.draw();
      } else if (args.test.state === 'passed') {
        t.classList.add('grid-test-passed');
        grid.draw();
      } else {
        poll();
      }
    }, 10);
  }
  poll();
  delete args.testTitle;
  a.appendChild(t);
  a.appendChild(d);
  // i.appendChild(a);
  i.insertBefore(a, i.firstChild);
  args = args || {};
  args.parentNode = d;
  if (args.component) {
    grid = document.createElement('canvas-datagrid');
    d.appendChild(grid);
    Object.keys(args).forEach(function (arg) {
      if (arg === 'parentNode') {
        return;
      }
      grid[arg] = args[arg];
    });
  } else {
    //@ts-ignore
    grid = canvasDatagrid(args);
  }

  grid.style.height = '100%';
  grid.style.width = '100%';
  args.test.grid = grid;
  return grid;
}

/**
 * Reset test environment
 */
export function cleanup() {
  const m = document.getElementById('mocha');
  m.scrollTop = m.scrollHeight;
  if (this.currentTest && this.currentTest.grid) {
    this.currentTest.grid.disposeContextMenu();
  }
}

/**
 * Delay implemented by Promise
 * @param done provide it for callback usage. otherwise, return a promise
 */
export function delay(ms = 0, done?: () => any) {
  // The following condition is used for avoiding "timeout" error from the Mocha test framework
  if (ms > 1000 && this && typeof this.timeout === 'function')
    this.timeout(ms * 2);
  if (typeof done === 'function') return void setTimeout(done, ms);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Convert part image of the grid to string to debug
 */
export function savePartOfCanvasToString(
  grid,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const tmpCanvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio;
  const dw = 200 * dpr;
  const dh = ((200 * h) / w) * dpr;
  x = x * dpr;
  y = y * dpr;
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  tmpCanvas.width = dw;
  tmpCanvas.height = dh;
  tmpCanvas.getContext('2d').drawImage(grid.canvas, x, y, w, h, 0, 0, dw, dh);
  return tmpCanvas.toDataURL('image/png');
}
