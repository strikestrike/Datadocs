import {
  mouseup,
  mousedown,
  mousemove,
  assertPxColor,
  g,
  smallData,
  c,
  doAssert,
  dblclick,
} from './util.js';

export default function () {
  it('Resize a column from a column header.', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
      style: {
        cellWidth: 50,
      },
    });
    grid.addEventListener('rendercell', function (e) {
      if (e.cell.columnIndex === 0) {
        e.ctx.fillStyle = c.b;
      }
    });
    grid.focus();
    mousemove(window, 94, 10, grid.canvas);
    mousedown(grid.canvas, 94, 10);
    mousemove(window, 190, 10, grid.canvas);
    mouseup(document.body, 190, 10, grid.canvas);
    setTimeout(function () {
      assertPxColor(grid, 100, 36, c.b, done);
    }, 10);
  });
  it('Resizes selected columns.', function () {
    var grid = g({
      test: this.test,
      data: smallData(),
      style: {
        cellWidth: 50,
      },
    });
    grid.focus();
    grid.selectColumn(0);
    grid.selectColumn(1, false, true);

    const columnSizes = Object.keys(grid.sizes.columns);
    doAssert(
      columnSizes.length === 1 && columnSizes[0] === '-1',
      'No column widths set',
    );

    mousemove(window, 94, 10, grid.canvas);
    mousedown(grid.canvas, 94, 10);
    mousemove(window, 190, 10, grid.canvas);
    // When multiple columns are selected sizes are set
    // only after mouseup
    doAssert(
      columnSizes.length === 1 && columnSizes[0] === '-1',
      'No column widths set',
    );
    mouseup(window, 190, 10, grid.canvas);

    doAssert(
      grid.sizes.columns[0].size === grid.sizes.columns[1].size,
      'Columns have same width',
    );

    mousemove(window, 188, 10, grid.canvas);
    mousedown(grid.canvas, 188, 10);
    mousemove(window, 95, 10, grid.canvas);
    mouseup(window, 95, 10, grid.canvas);

    doAssert(
      grid.sizes.columns[0].size === 50 && grid.sizes.columns[1].size === 50,
      'Columns have been set back to original width',
    );
  });

  it('Resizes selected rows.', function () {
    var grid = g({
      test: this.test,
      data: smallData(),
      style: {
        cellHeight: 25,
      },
    });
    grid.focus();
    grid.selectRow(0);
    grid.selectRow(1, false, true);

    const rowSizes = Object.keys(grid.sizes.rows);
    doAssert(rowSizes.length === 0, 'No row heights set');

    mousemove(window, 10, 48, grid.canvas);
    mousedown(grid.canvas, 10, 48);
    mousemove(window, 10, 60, grid.canvas);
    mouseup(window, 10, 60, grid.canvas);

    doAssert(
      grid.sizes.rows[0].size === grid.sizes.rows[1].size,
      'Rows have same height',
    );

    mousemove(window, 10, 58, grid.canvas);
    mousedown(grid.canvas, 10, 58);
    mousemove(window, 10, 50, grid.canvas);
    mouseup(window, 10, 50, grid.canvas);

    doAssert(
      grid.sizes.rows[0].size === 25 && grid.sizes.rows[1].size === 25,
      'Rows have been set back to original height',
    );
  });
  it('Resizes row and column after the handle is dropped.', function () {
    var grid = g({
      test: this.test,
      data: smallData(),
      resizeAfterDragged: true,
      style: {
        cellHeight: 26,
        cellWidth: 50,
        rowHeaderCellWidth: 57,
      },
    });
    grid.focus();

    const rowSizes = Object.keys(grid.sizes.rows);
    doAssert(rowSizes.length === 0, 'No row heights set');

    mousemove(window, 10, 48, grid.canvas);
    mousedown(grid.canvas, 10, 48);
    mousemove(window, 10, 60, grid.canvas);
    mouseup(window, 10, 60, grid.canvas);

    doAssert(grid.sizes.rows[0].size === 35, 'The row height should be 35');
    
    mousemove(window, 10, 58, grid.canvas);
    mousedown(grid.canvas, 10, 58);
    mousemove(window, 10, 50, grid.canvas);
    mouseup(window, 10, 50, grid.canvas);

    doAssert(
      grid.sizes.rows[0].size === 25,
      'The row height have been set back to the original',
    );

    mousemove(window, 92, 10, grid.canvas);
    mousedown(grid.canvas, 92, 10);
    mousemove(window, 190, 10, grid.canvas);
    mouseup(window, 190, 10, grid.canvas);

    doAssert(
      grid.sizes.columns[0].size === 145,
      'The column width should be 146',
    );

    mousemove(window, 188, 10, grid.canvas);
    mousedown(grid.canvas, 188, 10);
    mousemove(window, 95, 10, grid.canvas);
    mouseup(window, 95, 10, grid.canvas);

    doAssert(
      grid.sizes.columns[0].size === 50,
      'The column height have been set back to the original',
    );
  });
  it('Resize a column by double clicking a column header.', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
      style: {
        cellWidth: 50,
      },
    });

    grid.addEventListener('resizecolumn', function (e) {
      doAssert(
        e.x === grid.sizes.columns[0].size,
        'x matches width of column 0',
      );
      done();
    });
    grid.focus();
    mousemove(window, 94, 10, grid.canvas);
    dblclick(grid.canvas, 94, 10);
  });
  it('Resize selected columns by double clicking a column header.', function () {
    var grid = g({
      test: this.test,
      data: smallData(),
      style: {
        cellWidth: 50,
      },
    });

    grid.selectColumn(0);
    grid.selectColumn(1, true);

    chai.assert.deepStrictEqual(
      Object.keys(grid.sizes.columns),
      ['-1'],
      'No column widths set',
    );

    mousemove(window, 94, 10, grid.canvas);
    dblclick(grid.canvas, 94, 10);

    chai.assert.deepStrictEqual(Object.keys(grid.sizes.columns), [
      '0',
      '1',
      '-1',
    ]);
  });
  it('Resize a column from a cell.', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
      borderDragBehavior: 'resize',
      allowColumnResizeFromCell: true,
      style: {
        cellHeight: 24,
        cellWidth: 50,
        rowHeaderCellWidth: 57,
      },
    });
    grid.addEventListener('rendercell', function (e) {
      if (e.cell.columnIndex === 0) {
        e.ctx.fillStyle = c.b;
      }
    });
    setTimeout(function () {
      grid.focus();
      mousemove(window, 94, 36, grid.canvas);
      mousedown(grid.canvas, 94, 36);
      mousemove(window, 190, 36, grid.canvas);
      mouseup(window, 190, 36, grid.canvas);
      assertPxColor(grid, 110, 36, c.b, done);
    }, 1);
  });
  it('Resize a row.', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
      style: {
        cellHeight: 24,
        cellWidth: 50,
      },
    });
    grid.addEventListener('rendercell', function (e) {
      if (e.cell.columnIndex === -1 && e.cell.rowIndex === 0) {
        e.ctx.fillStyle = c.b;
      }
    });
    setTimeout(function () {
      grid.focus();
      mousemove(window, 10, 48, grid.canvas);
      mousedown(grid.canvas, 10, 48);
      mousemove(window, 10, 100, grid.canvas);
      mouseup(window, 10, 100, grid.canvas);
      assertPxColor(grid, 10, 90, c.b, done);
    }, 1);
  });
  it('Resize a row from a cell.', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
      allowRowResizeFromCell: true,
      borderDragBehavior: 'resize',
      style: {
        cellHeight: 24,
        cellWidth: 50,
      },
    });
    grid.addEventListener('rendercell', function (e) {
      if (e.cell.columnIndex === -1 && e.cell.rowIndex === 0) {
        e.ctx.fillStyle = c.b;
      }
    });
    setTimeout(function () {
      grid.focus();
      mousemove(window, 40, 48, grid.canvas);
      mousedown(grid.canvas, 40, 48);
      mousemove(window, 40, 100, grid.canvas);
      mouseup(window, 40, 100, grid.canvas);
      assertPxColor(grid, 10, 90, c.b, done);
    }, 1);
  });
}
