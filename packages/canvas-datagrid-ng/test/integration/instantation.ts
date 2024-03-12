import { debug, g } from '../utils/base.js';
import { doAssert } from '../utils/assert.js';
import { assertPxColor, colors } from '../utils/color.js';

export default function () {
  const canvasDatagrid = window['canvasDatagrid'];

  it('Should be callable without arguments.', function () {
    canvasDatagrid();
  });

  it('Should create an instance of datagrid', async function () {
    const grid = g({ test: this.test });
    doAssert(grid, 'Expected a grid instance, instead got something false');
    grid.style.gridBackgroundColor = colors.yellow;
    await assertPxColor(grid, 80, 32, colors.yellow);
  });

  it('Should create, then completely annihilate the grid.', function () {
    const grid = g({ test: this.test });
    grid.dispose();
    doAssert(grid.parentNode, 'Expected to see the grid gone, it is not.');
  });
}
