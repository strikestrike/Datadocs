import {
  mouseup,
  mousedown,
  contextmenu,
  makeData,
  keydown,
  mousemove,
  assertPxColor,
  assertPxColorFn,
  g,
  smallData,
  assertIf,
  c,
  marker,
  click,
} from './util.js';

export default function () {
  it('Should have one row in cell if text-wrapping enabled but rows are not auto resized', function (done) {
    var grid = g({
      test: this.test,
      data: [
        {
          col1:
            'This is a very long value which we expect to be wrapped on multiple lines',
        },
      ],
      style: {
        cellWhiteSpace: 'normal',
      },
    });
    var cell = grid.getVisibleCellByIndex(0, 0);

    var lineCount = cell.text.lines.length;
    done(assertIf(lineCount !== 1, 'Expected 1 wrapped lines, got', lineCount));
  });
  it('Should have multiple rows in cell after resize', function (done) {
    var grid = g({
      test: this.test,
      data: [
        {
          col1:
            'This is a very long value which we expect to be wrapped on multiple lines',
        },
      ],
      style: {
        activeCellFont: '16px sans-serif',
        cellHeight: 24,
        cellWhiteSpace: 'normal',
      },
    });
    setTimeout(function () {
      grid.focus();
      mousemove(window, 10, 48, grid.canvas);
      mousedown(grid.canvas, 10, 48);
      mousemove(window, 10, 160, grid.canvas);
      mouseup(window, 10, 160, grid.canvas);

      var cell = grid.getVisibleCellByIndex(0, 0);
      var lineCount = cell.text.lines.length;

      done(
        assertIf(
          lineCount !== 3,
          'Expected 3 wrapped lines after resize, got %s',
          lineCount,
        ),
      );
    }, 10);
  });

  it('Should auto resize row if text-wrapping is enabled', function (done) {
    var grid = g({
      test: this.test,
      data: [
        {
          col1:
            'This is a very long row which we expect to be wrapped on multiple lines',
        },
      ],
      style: {
        cellWhiteSpace: 'normal',
        activeCellFont: '16px sans-serif',
      },
      autoResizeRows: true,
    });
    var cell = grid.getVisibleCellByIndex(0, 0);
    var lineCount = cell.text.lines.length;

    done(
      assertIf(lineCount !== 3, 'Expected 3 wrapped lines, got %s', lineCount),
    );
  });

  it.skip('Should render a cell grid.', function (done) {
    var grid = g({
      test: this.test,
      schema: [{ name: 'a', type: 'canvas-datagrid' }],
      data: [{ a: [{ b: 'c' }] }],
      cellGridAttributes: {
        style: {
          activeCellBackgroundColor: c.b,
        },
      },
    });
    setTimeout(function () {
      assertPxColor(grid, 130, 60, c.b, done);
    }, 30);
  });
  it('Should display a new row', function (done) {
    var grid = g({
      test: this.test,
      showNewRow: true,
      data: [{ a: 'a' }],
    });
    grid.style.cellBackgroundColor = c.y;
    assertIf(grid.viewData.length !== 1, 'Expected there to be exactly 1 row.');
    assertPxColor(grid, 60, 60, c.y, done);
  });
  it('Should insert data into the new row', function (done) {
    var ev,
      grid = g({
        test: this.test,
        showNewRow: true,
        data: [{ a: 'a' }],
        style: {
          cellHeight: 24,
          rowHeaderCellWidth: 57,
        },
      });
    ev = new Event('keydown');
    ev.key = 'Enter';
    grid.style.cellBackgroundColor = c.y;
    grid.beginEditAt(0, 1);
    grid.input.value = 'abcd';
    grid.input.dispatchEvent(ev);
    assertPxColor(grid, 60, 90, c.y, function (err) {
      if (err) {
        return done(err);
      }
      done(
        assertIf(
          grid.viewData.length !== 2,
          'expected there to be exactly 3 row.',
        ),
      );
    });
  });
  it('Selection should follow active cell', function (done) {
    var grid = g({
      test: this.test,
      data: [{ a: 'a' }, { a: 'b' }],
    });
    grid.style.cellSelectedBackgroundColor = c.y;
    grid.focus();
    // select cell 0:0
    click(grid.canvas, 60, 37);
    keydown(grid.controlInput, 'ArrowDown');
    done(
      assertIf(
        grid.selectedRows[1].a !== 'b',
        'Expected selection to follow active cell',
      ),
    );
  });
  it('Should use a textarea to edit when multiLine is true', function (done) {
    var grid = g({
      test: this.test,
      multiLine: true,
      data: smallData(),
    });
    grid.beginEditAt(0, 0);
    done(
      assertIf(grid.input.tagName !== 'TEXTAREA', 'Expected a textarea here'),
    );
    grid.endEdit();
  });
  it('Should use an input to edit when multiLine is false', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
    });
    grid.beginEditAt(0, 0);
    done(assertIf(grid.input.tagName !== 'INPUT', 'Expected an input here'));
    grid.endEdit();
  });
  it('Should not be editable when editable is false', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
      editable: false,
    });
    click(grid.canvas, 60, 37);
    keydown(grid.controlInput, 'Enter');
    done(
      assertIf(
        grid.input !== undefined,
        'Expected no input when UI enters edit mode.',
      ),
    );
  });
  it('Should be editable when editable is true', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
    });
    click(grid.canvas, 60, 37);
    keydown(grid.controlInput, 'Enter');
    done(
      assertIf(
        grid.input === undefined,
        'Expected an input when UI enters edit mode.',
      ),
    );
    grid.endEdit();
  });
  it('Should allow column reordering when allowColumnReordering is true', function (done) {
    var grid = g({
      test: this.test,
      data: makeData(3, 3, function (y, x) {
        return x + ':' + y;
      }),
      allowRowReordering: true,
      style: {
        cellHeight: 24,
        cellWidth: 50,
      },
    });
    setTimeout(function () {
      grid.focus();
      marker(grid, 87, 10);
      mousemove(window, 87, 10, grid.canvas);
      mousedown(grid.canvas, 87, 10);
      mouseup(window, 87, 10, grid.canvas);
      mousemove(window, 87, 10, grid.canvas);
      mousedown(grid.canvas, 87, 10);
      mousemove(window, 140, 10, grid.canvas);
      mouseup(window, 140, 10, grid.canvas);
      grid.draw();
      grid.addEventListener('click', function (e) {
        done(
          assertIf(
            e.cell.value !== '1:0',
            'Expected to see the value from column 2 here, instead saw %n.',
            e.cell.value,
          ),
        );
      });
      // lib intentionally ignoring next click - required to make the ux work as desired
      click(grid.canvas, 60, 37);
      click(grid.canvas, 60, 37);
    }, 1);
  });
  it('Should reverse column reordering when allowColumnReordering is true and clicked twice', function (done) {
    var n = 'a' + new Date().getTime(),
      a = {
        test: this.test,
        data: smallData(),
        name: n,
      },
      grid = g(a);
    setTimeout(function () {
      grid.focus();
      marker(grid, 67, 10);
      mousemove(grid.canvas, 67, 10);
      mousedown(grid.canvas, 67, 10);
      mouseup(document.body, 67, 10, grid.canvas);
      click(grid.canvas, 67, 10);
      setTimeout(function () {
        mousemove(grid.canvas, 67, 10);
        mousedown(grid.canvas, 67, 10);
        mouseup(document.body, 67, 10, grid.canvas);
        click(grid.canvas, 67, 10);
        setTimeout(function () {
          setTimeout(function () {
            done(
              assertIf(
                grid.viewData[0].col1 !== 'foo',
                'Expected data to be ordered when new grid is created',
              ),
            );
          }, 1);
        }, 1);
      });
    }, 1);
  });
  it.skip('Should draw column reorder markers when allowColumnReordering is true and reordering', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
      style: {
        cellWidth: 50,
        reorderMarkerBackgroundColor: c.r,
        reorderMarkerBorderWidth: 4,
        reorderMarkerBorderColor: c.y,
        reorderMarkerIndexBorderColor: c.b,
        reorderMarkerIndexBorderWidth: 4,
      },
    });
    setTimeout(function () {
      grid.focus();
      mousemove(grid.canvas, 67, 10);
      mousedown(grid.canvas, 67, 10);
      mousemove(grid.canvas, 180, 10, grid.canvas);
      mousemove(document.body, 180, 10, grid.canvas);
      grid.draw();
      setTimeout(function () {
        async.parallel(
          [
            assertPxColorFn(grid, 178, 30, c.r),
            assertPxColorFn(grid, 159, 10, c.y),
            assertPxColorFn(grid, 195, 50, c.b),
          ],
          function (err) {
            done(err);
          },
        );
      }, 10);
    }, 10);
  });
  it('Should allow row reordering when allowRowReordering is true', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
      allowRowReordering: true,
      style: {
        cellHeight: 24,
        cellWidth: 50,
        rowHeaderCellWidth: 57,
      },
    });
    setTimeout(function () {
      grid.focus();
      marker(grid, 10, 32);
      mousemove(window, 10, 29, grid.canvas);
      mousedown(grid.canvas, 10, 29);
      mouseup(window, 10, 29, grid.canvas);
      mousemove(window, 10, 29, grid.canvas);
      mousedown(grid.canvas, 10, 29);
      mousemove(window, 10, 90, grid.canvas);
      mouseup(window, 10, 90, grid.canvas);
      grid.draw();
      grid.addEventListener('click', function (e) {
        done(
          assertIf(
            e.cell.value !== 'bar',
            'Expected to see the value from row 2 here.',
          ),
        );
      });
      // lib intentionally ignoring next click - required to make the ux work as desired
      click(grid.canvas, 60, 29);
      click(grid.canvas, 60, 29);
    }, 1);
  });
  it('Should draw row reorder markers when allowRowReordering is true and reordering', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
      allowRowReordering: true,
      style: {
        cellHeight: 24,
        cellWidth: 50,
        reorderMarkerBackgroundColor: c.y,
        reorderMarkerBorderWidth: 4,
        reorderMarkerBorderColor: c.fu,
        reorderMarkerIndexBorderColor: c.b,
        reorderMarkerIndexBorderWidth: 4,
      },
    });
    setTimeout(function () {
      grid.focus();
      mousemove(window, 10, 29, grid.canvas);
      mousedown(grid.canvas, 10, 29);
      mouseup(window, 10, 29, grid.canvas);
      mousemove(window, 10, 29, grid.canvas);
      mousedown(grid.canvas, 10, 29);
      mousemove(window, 10, 90, grid.canvas);
      setTimeout(function () {
        assertPxColor(grid, 10, 98, c.b, function (err) {
          if (err) {
            return done(err);
          }
          assertPxColor(grid, 10, 86, c.fu, function (err) {
            if (err) {
              return done(err);
            }
            assertPxColor(grid, 30, 91, c.y, done);
          });
        });
      }, 10);
      grid.draw();
    }, 10);
  });
  it('The context menu filter should not show up when showFilter is false', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
      showFilter: false,
    });
    grid.addEventListener('contextmenu', function (e) {
      setTimeout(function () {
        var menus = [
          'Hide col1',
          'Zooming',
          'Add a new Range',
          'Select cells of the Range',
          'Order by col1 ascending',
          'Order by col1 descending',
        ];
        done(
          assertIf(
            e.items.length !== menus.length,
            'Expected to only see two items in the context menu at this point.',
          ),
        );
      }, 1);
    });
    contextmenu(grid.canvas, 60, 37);
  });
  it('The context menu filter should show up when showFilter is true', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
      showFilter: true,
    });
    grid.addEventListener('contextmenu', function (e) {
      var menus = [
        'Hide col1',
        'Zooming',
        'Add a new Range',
        'Select cells of the Range',
        'Order by col1 ascending',
        'Order by col1 descending',
      ];
      setTimeout(function () {
        done(
          assertIf(
            e.items.length !== menus.length,
            'Expected to only see two items in the context menu at this point.',
          ),
        );
      }, 1);
    });
    contextmenu(grid.canvas, 60, 37);
  });
  it('Clicking the corner cell will select all.', function (done) {
    var d = makeData(10, 10, function (x) {
        return x;
      }),
      grid = g({
        test: this.test,
        data: d,
        style: {
          cellHeight: 25,
          rowHeaderCellWidth: 57,
        },
        columnHeaderClickBehavior: 'sort',
      });
    marker(grid, 60, 12);
    mousemove(window, 60, 12, grid.canvas);
    mousedown(grid.canvas, 60, 12);
    mouseup(grid.canvas, 60, 12);
    click(grid.canvas, 60, 12);
    setTimeout(function () {
      marker(grid, 12, 12);
      mousemove(window, 12, 12, grid.canvas);
      mousedown(grid.canvas, 12, 12);
      mouseup(grid.canvas, 12, 12);
      click(grid.canvas, 12, 12);
      done(
        assertIf(
          grid.selectedRows.length !== d.length,
          'Expected data to be selected.',
        ),
      );
    }, 1);
  });
  it('Clicking a header cell with columnHeaderClickBehavior set to sort should sort the column asc', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
      columnHeaderClickBehavior: 'sort',
    });
    marker(grid, 60, 12);
    mousemove(grid.canvas, 60, 12);
    click(grid.canvas, 60, 12);
    done(
      assertIf(grid.viewData[0].col1 !== 'bar', 'Expected data to be sorted.'),
    );
  });
  it('Clicking a header cell with columnHeaderClickBehavior set to select should select the column', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
      columnHeaderClickBehavior: 'select',
    });
    marker(grid, 60, 12);
    mousemove(window, 60, 12, grid.canvas);
    mousedown(grid.canvas, 60, 12);
    mouseup(window, 60, 12, grid.canvas);
    done(
      assertIf(
        grid.selectedRows.length !== 3 ||
          grid.selectedCells[0].col2 !== undefined,
        'Expected every row to be selected.',
      ),
    );
  });
  it('Clicking a header cell with columnHeaderClickBehavior set to select then clicking another with ctrl held should add to the selection', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
      columnHeaderClickBehavior: 'select',
      style: {
        cellWidth: 50,
      },
    });
    marker(grid, 60, 12);
    mousemove(window, 60, 12, grid.canvas);
    mousedown(grid.canvas, 60, 12);
    mouseup(window, 60, 12, grid.canvas);
    mousemove(window, 175, 12, grid.canvas);
    mousedown(grid.canvas, 175, 12, null, { ctrlKey: true });
    mouseup(window, 175, 12, grid.canvas);
    done(
      assertIf(
        grid.selectedRows.length !== 3 ||
          grid.selectedCells[0].col2 !== undefined ||
          grid.selectedCells[0].col3 !== 'a',
        'Expected every row to be selected and column 2 to not be selected.',
      ),
    );
  });
  it('Clicking a header cell with columnHeaderClickBehavior set to select then clicking another with shift held should add a range to the selection', function (done) {
    var grid = g({
      test: this.test,
      data: makeData(3, 3, function (y, x) {
        return x + ':' + y;
      }),
      columnHeaderClickBehavior: 'select',
      style: {
        cellWidth: 50,
      },
    });
    marker(grid, 75, 12);
    mousemove(window, 75, 12, grid.canvas);
    mousedown(grid.canvas, 75, 12);
    mouseup(grid.canvas, 75, 12);
    mousemove(window, 175, 12, grid.canvas);
    mousedown(grid.canvas, 175, 12, null, { shiftKey: true });
    mouseup(grid.canvas, 175, 12);
    done(
      assertIf(
        grid.selectedRows.length !== 3 ||
          grid.selectedCells[0].c !== '2:0' ||
          grid.selectedCells[0].b !== '1:0',
        'Expected everything to be selected.',
      ),
    );
  });
}