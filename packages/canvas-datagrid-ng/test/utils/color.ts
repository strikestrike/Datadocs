import { marker } from './draw.js';

export const colors = {
  blue: 'rgb(0, 0, 255)',
  yellow: 'rgb(255, 255, 0)',
  red: 'rgb(255, 0, 0)',
  magenta: 'rgb(255, 0, 255)',
  white: 'rgb(255, 255, 255)',
  black: 'rgb(0, 0, 0)',
};
const colorNames = Object.keys(colors);

/**
 * @see {colors}
 */
export function getColorName(v: string) {
  for (let i = 0; i < colorNames.length; i++) {
    const colorName = colorNames[i];
    if (colors[colorName] === v) return colorName;
  }
  return v;
}

export function assertPxColor(
  grid,
  x: number,
  y: number,
  expected: string,
  drawMarker = true,
): Promise<void> {
  // let d, d2, match, e;
  x = x * window.devicePixelRatio;
  y = y * window.devicePixelRatio;
  return new Promise<void>((resolve, reject) => {
    const data: Uint8ClampedArray = grid.ctx.getImageData(x, y, 1, 1).data;
    let d: string, d2: string;
    if (data['3'] === 0) {
      d = grid.canvas.style.background;
    } else {
      d2 = 'rgba(' + [d['0'], d['1'], d['2'], '1'].join(', ') + ')';
      d = 'rgb(' + [d['0'], d['1'], d['2']].join(', ') + ')';
    }

    if (drawMarker) marker(grid, x, y);
    if (expected) {
      const match = d === expected || d2 === expected;
      if (!match) {
        const message = [
          `Expected color ${getColorName(expected)} `,
          `at (${x}, ${y}). But actual color is ${getColorName(d)}`,
        ].join('');
        console.error(message);
        return reject(new Error(message));
      }
    }
    requestAnimationFrame(grid.draw);
    return resolve();
  });
}
