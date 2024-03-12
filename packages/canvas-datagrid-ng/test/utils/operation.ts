type Element = HTMLElement | Window;

export function dispatchEvent(el: Element, event: string, args?: any) {
  const e = new Event(event);
  if (args) {
    Object.keys(args).forEach((key) => {
      e[key] = args[key];
    });
  }
  el.dispatchEvent(e);
}

export function keydown(el: Element, key, args) {
  args = args || {};
  args.key = key;
  dispatchEvent(el, 'keydown', args);
}

export function getBoundingClientRect(el: Element) {
  if (typeof el['getBoundingClientRect'] === 'function') {
    const rect = (el as HTMLElement).getBoundingClientRect();
    return rect;
  }
}

export function mouseup(el: Element, x: number, y: number, bbEl?: Element) {
  const p = getBoundingClientRect(bbEl || el);
  dispatchEvent(el, 'mouseup', { clientX: x + p.left, clientY: y + p.top });
}

export function mousemove(el: Element, x: number, y: number, bbEl?: Element) {
  const p = getBoundingClientRect(bbEl || el);
  dispatchEvent(el, 'mousemove', { clientX: x + p.left, clientY: y + p.top });
}

export function mousedown(
  el: Element,
  x: number,
  y: number,
  bbEl?: Element,
  ev?: any,
) {
  const p = getBoundingClientRect(bbEl || el);
  ev = ev ?? {};
  dispatchEvent(el, 'mousedown', {
    ...ev,
    clientX: x + p.left,
    clientY: y + p.top,
  });
}

export function contextmenu(el: Element, x: number, y: number, bbEl?: Element) {
  const p = getBoundingClientRect(bbEl || el);
  dispatchEvent(el, 'contextmenu', { clientX: x + p.left, clientY: y + p.top });
}

export function touchstart(el: Element, x: number, y: number, bbEl?: Element) {
  const p = getBoundingClientRect(bbEl || el);
  dispatchEvent(el, 'touchstart', {
    touches: [{ clientX: x + p.left, clientY: y + p.top }],
    changedTouches: [{ x: 0, y: 0 }],
  });
}

export function touchend(el: Element, x: number, y: number, bbEl?: Element) {
  const p = getBoundingClientRect(bbEl || el);
  dispatchEvent(el, 'touchend', {
    touches: [{ clientX: x + p.left, clientY: y + p.top }],
    changedTouches: [{ x: 0, y: 0 }],
  });
}

export function touchcancel(el: Element, x: number, y: number, bbEl?: Element) {
  const p = getBoundingClientRect(bbEl || el);
  dispatchEvent(el, 'touchcancel', {
    touches: [{ clientX: x + p.left, clientY: y + p.top }],
    changedTouches: [{ x: 0, y: 0 }],
  });
}

export function touchmove(el: Element, x: number, y: number, bbEl?: Element) {
  const p = getBoundingClientRect(bbEl || el);
  dispatchEvent(el, 'touchmove', {
    touches: [{ clientX: x + p.left, clientY: y + p.top }],
    changedTouches: [{ x: 0, y: 0 }],
  });
}

export function handlemove(grid: any, dx: number, dy: number) {
  const handle = grid.visibleCells.find(
    (cell) => cell.style === 'selection-handle-br',
  );

  handle.x += handle.width / 2;
  handle.y += handle.height / 2;
  dx += handle.x;
  dy += handle.y;

  mousemove(window, handle.x, handle.y, grid.canvas);
  mousedown(grid.canvas, handle.x, handle.y);
  mousemove(window, dx, dy, grid.canvas);
  mouseup(window, dx, dy, grid.canvas);
}

export function click(
  el: Element,
  x: number,
  y: number,
  bbEl?: Element,
  ev?: any,
) {
  const p = getBoundingClientRect(bbEl || el);
  ev = ev || {};
  ev.clientX = x + p.left;
  ev.clientY = y + p.top;
  dispatchEvent(el, 'click', ev);
}

export function dblclick(el: Element, x: number, y: number, bbEl?: Element) {
  const p = getBoundingClientRect(bbEl || el);
  dispatchEvent(el, 'dblclick', { clientX: x + p.left, clientY: y + p.top });
}
