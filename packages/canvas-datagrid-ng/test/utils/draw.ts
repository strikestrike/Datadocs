/**
 * Marker colors, for visually identifying test points
 */
export var markerColors = [
  '#a50026',
  '#d73027',
  '#f46d43',
  '#fdae61',
  '#fee090',
  '#e0f3f8',
  '#abd9e9',
  '#74add1',
  '#4575b4',
  '#313695',
];

// Draws a 'crosshairs' marker at coordinates (x,y).
// The marker includes:
//  - A 1px vertical line at x
//  - A 1px horizontal line at y
//  - A 3px central marker centered at (x,y)
// Note: markerColors[...] selection ensures contrast between lines and
//  central marker
export function marker(grid, x: number, y: number) {
  grid.markerCount = grid.markerCount || 0;
  grid.markerCount += 1;
  grid.addEventListener('afterdraw', function () {
    grid.ctx.fillStyle =
      markerColors[
        (grid.markerCount + markerColors.length / 2) % markerColors.length
      ];
    grid.ctx.fillRect(0, y, grid.canvas.width, 1);
    grid.ctx.fillRect(x, 0, 1, grid.canvas.height);
    grid.ctx.fillStyle = markerColors[grid.markerCount % markerColors.length];
    grid.ctx.fillRect(x - 1, y - 1, 3, 3);
  });
}
