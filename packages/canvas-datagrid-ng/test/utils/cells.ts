import { doAssert } from './assert.js';

/**
 * Find the cell from the grid by text
 */
export function findCell(grid, text: string) {
  return grid.visibleCells.find(
    (it) =>
      (it.style === 'cell' || it.style === 'activeCell') &&
      it.formattedValue === text,
  );
}

export function shouldContainCell(grid, text: string) {
  const cell = findCell(grid, text);
  doAssert(cell, `the grid should contain cell with text "${text}"`);
}

export function shouldNotContainCell(grid, text: string) {
  const cell = findCell(grid, text);
  doAssert(!cell, `the grid should not contain cell with text "${text}"`);
}
