import {
  doAssert,
  g,
  marker,
  mousedown,
  mousemove,
  mouseup,
  smallData,
} from './util.js';

export default function () {
  it('Moves a cell to bottom after user starts dragging it', function () {
    const grid = g({
      test: this.test,
      data: smallData(),
      allowMovingSelection: true,
      borderDragBehavior: 'move',
      style: {
        cellHeight: 25,
        cellWidth: 50,
      },
    });

    grid.focus();

    doAssert(
      grid.viewData[0]['col1'] === 'foo',
      'The cell should have an initial data',
    );

    marker(grid, 70, 40);
    mousemove(window, 70, 48, grid.canvas);
    mousedown(grid.canvas, 70, 48);
    mousemove(window, 70, 60, grid.canvas);
    mouseup(window, 70, 60, grid.canvas);
    grid.draw();

    doAssert(
      grid.viewData[0]['col1'] === undefined,
      'After move, the cell we moved FROM should have no data',
    );

    doAssert(
      grid.viewData[1]['col1'] === 'foo',
      'After move, the cell we moved TO should have "foo" as the data',
    );
  });

  it('Moves a cell range to bottom after user starts dragging', function () {
    const grid = g({
      test: this.test,
      data: smallData(),
      allowMovingSelection: true,
      borderDragBehavior: 'move',
      style: {
        cellHeight: 25,
        cellWidth: 50,
      },
    });

    grid.focus();

    doAssert(
      grid.viewData[0]['col1'] === 'foo' && grid.viewData[0]['col2'] === 0,
      'The cell should have an initial data',
    );

    grid.selectArea({ top: 0, left: 0, bottom: 0, right: 1 });

    marker(grid, 70, 40);
    mousemove(window, 70, 48, grid.canvas);
    mousedown(grid.canvas, 70, 48);
    mousemove(window, 70, 60, grid.canvas);
    mouseup(window, 70, 60, grid.canvas);
    grid.draw();

    doAssert(
      grid.viewData[0]['col1'] === undefined &&
        grid.viewData[0]['col2'] === undefined,
      'After move, the cells we moved FROM should have no data',
    );

    doAssert(
      grid.viewData[1]['col1'] === 'foo' && grid.viewData[1]['col2'] === '0',
      'After move, the cells we moved TO should have "foo" and "0" as the data',
    );
  });

  it('Moves a cell range including a merged cell to bottom after user starts dragging', function () {
    const grid = g({
      test: this.test,
      data: smallData(),
      allowMovingSelection: true,
      borderDragBehavior: 'move',
      style: {
        cellHeight: 25,
        cellWidth: 50,
      },
    });

    grid.focus();
    grid.mergeCells({ top: 0, left: 0, bottom: 1, right: 0 });
    grid.selectArea({ top: 0, left: 0, bottom: 2, right: 0 });

    grid.draw();

    doAssert(
      grid.viewData[0]['col1'] === 'foo' && grid.viewData[2]['col1'] === 'baz',
      'The cell should have an initial data',
    );

    marker(grid, 92, 40);
    mousemove(window, 92, 40, grid.canvas);
    mousedown(grid.canvas, 92, 40);
    mousemove(window, 120, 40, grid.canvas);
    mouseup(window, 120, 40, grid.canvas);
    grid.draw();

    doAssert(
      grid.viewData[0]['col1'] === undefined &&
        grid.viewData[2]['col1'] === undefined,
      'After move, the cells we moved FROM should have no data',
    );

    doAssert(
      grid.viewData[0]['col2'] === 'foo' && grid.viewData[2]['col2'] === 'baz',
      'After move, the cells we moved TO should have "foo" and "0" as the data',
    );
    doAssert(
      grid.containsMergedCells(undefined, {
        top: 0,
        left: 1,
        bottom: 1,
        right: 1,
      }),
      'Should not contain any merged cells in the col1 after move',
    );
  });
}
