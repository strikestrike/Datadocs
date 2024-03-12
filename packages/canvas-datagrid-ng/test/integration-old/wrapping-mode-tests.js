import { assertPxColorP, g, c } from './util.js';

// We use unicode blocks for testing row wrapping because
// for ordinary text it gets superhard to pinpoint pixels
// for testing, and results in flaky tests because
// font rendering subtly differs between platforms.
const block =
  '████████████████████████████████████████████████████████████████████████';

export default function () {
  const data = [
    {
      col1: 'A really really really really long line to test wrapping',
      col2: null,
      col3: 'foo',
    },
    {
      col1:
        'Another really really really really long line to test absence of wrapping',
      col2: 0,
      col3: 'foo',
    },
    { col1: 'baz', col2: 2, col3: 'c' },
  ];

  it('can be configured through schema', async function () {
    const grid = g({
      test: this.test,
      autoResizeRows: true,
      data: [
        {
          // For text wrapping we need multiple worlds
          col1: block.slice(0, 5) + ' ' + block.slice(0, 10) + ' ' + block,
          col2: 0,
          col3: 100,
        },
        {
          col1: block.slice(0, 3) + ' ' + block.slice(0, 5) + ' ' + block,
          col3: 100,
        },
      ],
      schema: [
        {
          name: 'col1',
          wrapMode: 'multi-line',
        },
        {
          name: 'col2',
        },
        {
          name: 'col3',
        },
      ],
    });
    await assertPxColorP(grid, 65, 55, c.black, false); // First row, first line
    await assertPxColorP(grid, 65, 85, c.black, false); // First row, second line (wrapped)
    await assertPxColorP(grid, 65, 100, c.black, false); // Second row, first line
    await assertPxColorP(grid, 65, 125, c.black, false); // Second row, second line (wrapped)

    grid.schema[0].wrapMode = 'overflowing';
    grid.draw();
    await assertPxColorP(grid, 360, 95, c.black, false); // Second row overflow
  });

  it('enables wrapping specific cells into multiple lines', async function () {
    const grid = g({
      test: this.test,
      autoResizeRows: true,
      data,
    });
    grid.addEventListener('rendercell', (e) => {
      if (e.cell.rowIndex === 0 && e.cell.columnIndex === 0) {
        e.ctx.fillStyle = c.y;
      }
      if (e.cell.rowIndex === 1 && e.cell.columnIndex === 0) {
        e.ctx.fillStyle = c.b;
      }
    });
    grid.draw();

    await assertPxColorP(grid, 280, 31, c.y, false);
    await assertPxColorP(grid, 280, 51, c.b, false);

    grid.addEventListener('formattext', (e) => {
      if (e.cell.rowIndex === 0 && e.cell.columnIndex === 0) {
        e.cell.wrapMode = 'multi-line';
      }
    });

    for (let frozenColumn = 0; frozenColumn <= 2; frozenColumn++) {
      for (let frozenRow = 0; frozenRow <= 2; frozenRow++) {
        grid.frozenColumn = frozenColumn;
        grid.frozenRow = frozenRow;
        grid.draw();
        await assertPxColorP(grid, 280, 31, c.y, false);
        await assertPxColorP(grid, 280, 31, c.y, false);
        await assertPxColorP(grid, 280, 51, c.y, false);
        await assertPxColorP(grid, 280, 71, c.b, false);
      }
    }
  });

  it('enables text to overflow to adjacent cells', async function () {
    const gridData = [...data];
    gridData[0] = {
      ...gridData[0],
      col1: block,
    };
    const grid = g({
      test: this.test,
      autoResizeRows: true,
      data: gridData,
    });

    grid.addEventListener('formattext', (e) => {
      if (e.cell.rowIndex === 0 && e.cell.columnIndex === 0) {
        e.cell.wrapMode = 'overflowing';
      }
    });

    grid.draw();

    await assertPxColorP(grid, 320, 40, c.black);
  });
}
