import {
  mouseup,
  mousedown,
  dblclick,
  click,
  mousemove,
  doAssert,
  g,
  smallData,
  assertIf,
  handlemove,
  makeData,
} from './util.js';

const fakeClipboardEvent = {
  clipboardData: {
    data: {},
    setData: function (mime, data) {
      this.data[mime] = data;
    },
  },
  preventDefault: () => null, // noop so the call in addCellValue doesn't cause an error
};

export default function () {
  it('Begin editing, end editing', function (done) {
    var ev,
      err,
      grid = g({
        test: this.test,
        data: [{ d: '' }],
      });
    grid.beginEditAt(0, 0);
    err = assertIf(
      !grid.input.parentNode,
      'Expected an input to have appeared',
    );
    if (err) {
      return done(err);
    }
    ev = new Event('keydown');
    ev.key = 'Escape';

    grid.addEventListener('endedit', function () {
      done();
    });
    grid.input.dispatchEvent(ev);
  });
  it('Begin editing, enter a value, end editing', function (done) {
    var ev,
      grid = g({
        test: this.test,
        data: [{ d: '' }],
      });
    grid.beginEditAt(0, 0);
    ev = new Event('keydown');
    ev.key = 'Enter';
    grid.input.value = 'blah';
    grid.addEventListener('endedit', function () {
      done(
        assertIf(grid.viewData[0].d !== 'blah', 'Expected value to be in data'),
      );
    });
    grid.input.dispatchEvent(ev);
  });
  it('Begin editing, enter a value, end editing, abort before ending.', function (done) {
    var ev,
      grid = g({
        test: this.test,
        data: [{ d: '' }],
      });
    grid.beginEditAt(0, 0);
    ev = new Event('keydown');
    ev.key = 'Enter';
    grid.input.value = 'blah';
    grid.addEventListener('beforeendedit', function (e) {
      e.abort();
      done(
        assertIf(grid.viewData[0].d === 'blah', 'Expected value to be in data'),
      );
    });
    grid.input.dispatchEvent(ev);
  });
  it('Begin editing a select with short definition.', function (done) {
    var grid = g({
      test: this.test,
      data: [{ d: '' }],
      schema: [{ name: 'd', enum: ['a', 'b', 'c'] }],
    });
    grid.beginEditAt(0, 0);
    done(
      assertIf(
        grid.input.childNodes.length === 3 && grid.input.tagName !== 'SELECT',
        'Expected an input to have appeared',
      ),
    );
    grid.endEdit();
  });
  it('Begin editing a select with standard definition.', function (done) {
    var grid = g({
      test: this.test,
      data: [{ d: '' }],
      schema: [
        {
          name: 'd',
          enum: [
            ['a', 'A'],
            ['b', 'B'],
            ['c', 'C'],
          ],
        },
      ],
    });
    grid.beginEditAt(0, 0);
    done(
      assertIf(
        grid.input.childNodes[0].innerHTML === 'A' &&
          grid.input.childNodes.length === 3 &&
          grid.input.tagName !== 'SELECT',
        'Expected an input to have appeared',
      ),
    );
    grid.endEdit();
  });
  it('Begin editing by double clicking a cell.', function (done) {
    var grid = g({
      test: this.test,
      data: [{ d: '' }],
    });
    mousemove(window, 65, 37, grid.canvas);
    mousedown(grid.canvas, 65, 37);
    mouseup(grid.canvas, 65, 37);
    mousedown(grid.canvas, 65, 37);
    mouseup(grid.canvas, 65, 37);
    dblclick(grid.canvas, 65, 37);
    done(
      assertIf(
        grid.input.tagName !== 'INPUT',
        'Expected an input to have appeared',
      ),
    );
    grid.endEdit();
  });
  it('Scrolls partially visible cells into view', function (done) {
    const data = [];
    for (let i = 0; i < 100; i++) {
      data.push({
        i,
        col1: Math.random() * 1000,
        col2: Math.random() * 1000,
        col2: Math.random() * 1000
      });
    }
    const grid = g({
      test: this.test,
      style: {
        cellHeight: 24,
        cellWidth: 253,
      },
      data
    })
    doAssert(grid.scrollLeft === 0, 'horizontal scrollbar is at initial position');
    doAssert(grid.scrollTop === 0, 'vertical scrollbar is at initial position');
    grid.beginEditAt(1, 0)
    doAssert(grid.scrollLeft >= 162 && grid.scrollLeft <= 168, 'horizontal scrollbar is shifted to show cell completely');
    doAssert(grid.scrollTop === 0, 'vertical scrollbar is at initial position');
    grid.beginEditAt(1, 4)
    doAssert(grid.scrollTop >= 37 && grid.scrollTop <= 43, 'vertical scrollbar is shifted to show cell completely');
    done();
  });
  describe('copy', function () {
    it('neatly selected data onto simulated clipboard', function (done) {
      const data = [
        {
          d: 'Text with, a comma 1',
          e: 'Text that has no comma in in 1',
        },
        {
          d: 'Text with, a comma 2',
          e: 'Text that has no comma in in 2',
        },
      ];

      const grid = g({
        test: this.test,
        data,
      });

      grid.selectAll();
      grid.focus();

      const textResult = `Text with, a comma 1\tText that has no comma in in 1\nText with, a comma 2\tText that has no comma in in 2`;
      const htmlResult =
        '<table><tr><td rowspan=1 colspan=1>Text with, a comma 1</td><td rowspan=1 colspan=1>Text that has no comma in in 1</td></tr><tr><td rowspan=1 colspan=1>Text with, a comma 2</td><td rowspan=1 colspan=1>Text that has no comma in in 2</td></tr></table>';
      const jsonResult = JSON.stringify(data);

      grid.copy(new Object(fakeClipboardEvent));
      const { clipboardData } = fakeClipboardEvent;

      doAssert(
        clipboardData.data['text/plain'] === textResult,
        'Expected plain text to be copied',
      );
      doAssert(
        clipboardData.data['text/html'] === htmlResult,
        'Expected html to be copied',
      );
      doAssert(
        clipboardData.data['text/csv'] === textResult,
        'Expected csv text to be copied',
      );
      doAssert(
        clipboardData.data['application/json'] === jsonResult,
        'Expected json to be copied',
      );

      done();
    });
    it('untidy selected data onto simulated clipboard', function (done) {
      const data = [
        {
          d: 'Text with, a comma 1',
          e: 'Text that has no comma in in 1',
        },
        {
          d: 'Text with, a comma 2',
          e: 'Text that has no comma in in 2',
        },
      ];

      const grid = g({
        test: this.test,
        data,
      });

      grid.selectArea({ top: 0, left: 0, bottom: 0, right: 0 });
      grid.selectArea({ top: 1, left: 1, bottom: 1, right: 1 }, true); // ctrl = true, adds to previous selection
      grid.focus();

      const textResult = `Text with, a comma 1Text that has no comma in in 2`;
      const htmlResult = textResult;
      const jsonResult = JSON.stringify([
        {
          d: 'Text with, a comma 1',
        },
        {
          e: 'Text that has no comma in in 2',
        },
      ]);

      grid.copy(new Object(fakeClipboardEvent));
      const { clipboardData } = fakeClipboardEvent;

      doAssert(
        clipboardData.data['text/plain'] === textResult,
        'Expected plain text to be copied',
      );
      doAssert(
        clipboardData.data['text/html'] === htmlResult,
        'Expected html to be copied',
      );
      doAssert(
        clipboardData.data['text/csv'] === textResult,
        'Expected csv text to be copied',
      );
      doAssert(
        clipboardData.data['application/json'] === jsonResult,
        'Expected json to be copied',
      );

      done();
    });
    it('null value is not cast to `null`', function () {
      const data = [
        {
          d: null,
        },
      ];

      const grid = g({
        test: this.test,
        data,
      });

      grid.selectAll();
      grid.focus();

      const textResult = ``;
      const htmlResult = '<table><tr><td></td></tr></table>';

      grid.copy(new Object(fakeClipboardEvent));
      const { clipboardData } = fakeClipboardEvent;

      doAssert(
        clipboardData.data['text/plain'] === textResult,
        'Expected plain text to be copied',
      );
      doAssert(
        clipboardData.data['text/html'] === htmlResult,
        'Expected html text to be copied',
      );
    });
  });
  it('Should paste a value from the clipboard into a cell', function (done) {
    var grid = g({
      test: this.test,
      data: [{ 'Column A': 'Original value' }],
    });

    grid.focus();
    grid.setActiveCell(0, 0);
    grid.selectArea({ top: 0, left: 0, bottom: 0, right: 0 });

    grid.paste({
      clipboardData: {
        items: [
          {
            type: 'text/plain',
            getAsString: function (callback) {
              callback('Paste buffer value');
            },
          },
        ],
      },
    });

    setTimeout(function () {
      var cellData = grid.viewData[0]['Column A'];
      done(
        assertIf(
          cellData !== 'Paste buffer value',
          'Value has not been replaced with clipboard data: ' + cellData,
        ),
      );
    }, 10);
  });
  it('Should paste an HTML table value from the clipboard into a cell', function (done) {
    var grid = g({
      test: this.test,
      data: [{ 'Column A': 'Original value' }],
    });

    grid.focus();
    grid.setActiveCell(0, 0);
    grid.selectArea({ top: 0, left: 0, bottom: 0, right: 0 });

    grid.paste({
      clipboardData: {
        items: [
          {
            type: 'text/html',
            getAsString: function (callback) {
              callback(
                "<meta charset='utf-8'><table><tr><td>Paste buffer value</td></tr></table>",
              );
            },
          },
        ],
      },
    });

    setTimeout(function () {
      var cellData = grid.viewData[0]['Column A'];
      done(
        assertIf(
          cellData !== 'Paste buffer value',
          'Value has not been replaced with clipboard data: ' + cellData,
        ),
      );
    }, 10);
  });
  it('paste a Google Sheets table with table body from the clipboard into a cell', function (done) {
    var grid = g({
      test: this.test,
      data: [{ 'Column A': 'Original value' }],
    });

    grid.focus();
    grid.setActiveCell(0, 0);
    grid.selectArea({ top: 0, left: 0, bottom: 0, right: 0 });

    grid.paste({
      clipboardData: {
        items: [
          {
            type: 'text/html',
            getAsString: function (callback) {
              callback(
                `<meta charset='utf-8'><google-sheets-html-origin><style type="text/css"><!--td {border: 1px solid #ccc;}br {mso-data-placement:same-cell;}--></style><table xmlns="http://www.w3.org/1999/xhtml" cellspacing="0" cellpadding="0" dir="ltr" border="1" style="table-layout:fixed;font-size:10pt;font-family:arial,sans,sans-serif;width:0px;border-collapse:collapse;border:none"><colgroup><col width="181"/><col width="17"/><col width="85"/></colgroup><tbody><tr style="height:21px;"><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:middle;font-size:18pt;font-weight:bold;text-align:right;" data-sheets-value="{&quot;1&quot;:3,&quot;3&quot;:2022}">Paste buffer value</td><td style="overflow:hidden;padding:2px 3px 2px 3px;vertical-align:middle;" data-sheets-numberformat="{&quot;1&quot;:4,&quot;2&quot;:&quot;[$€]#,##0.00&quot;}"></td><td style="border-right:1px solid transparent;overflow:visible;padding:2px 0px 2px 0px;vertical-align:middle;font-size:18pt;font-weight:bold;" data-sheets-value="{&quot;1&quot;:2,&quot;2&quot;:&quot;Cash flow forecast&quot;}"><div style="white-space:nowrap;overflow:hidden;position:relative;width:224px;left:3px;"><div style="float:left;">Paste buffer value</div></div></td></tr></tbody></table>`,
              );
            },
          },
        ],
      },
    });

    setTimeout(function () {
      var cellData = grid.viewData[0]['Column A'];
      done(
        assertIf(
          cellData !== 'Paste buffer value',
          'Value has not been replaced with clipboard data: ' + cellData,
        ),
      );
    }, 10);
  });
  it('paste a Excel table with multiple rows from the clipboard', function (done) {
    var grid = g({
      test: this.test,
      data: [
        {
          d: 'Text with, a comma 1',
          e: 'Text that has no comma in in 1',
        },
        {
          d: 'Text with, a comma 2',
          e: 'Text that has no comma in in 2',
        },
      ],
    });

    grid.focus();
    grid.setActiveCell(0, 0);
    grid.selectArea({ top: 0, left: 0, bottom: 0, right: 0 });

    grid.paste({
      clipboardData: {
        items: [
          {
            type: 'text/html',
            getAsString: function (callback) {
              callback(
                `<html>
                  <body>
                      <table>
                        <!--StartFragment-->
                          <col width=412 style='mso-width-source:userset;mso-width-alt:13184;width:309pt'>
                          <col width=340 style='mso-width-source:userset;mso-width-alt:10880;width:255pt'>
                          <tr>
                            <td>Paste buffer value</td>
                            <td>Paste buffer value</td>
                          </tr>
                          <tr>
                            <td>Paste buffer value</td>
                            <td>Paste buffer value</td>
                          </tr>
                        <!--EndFragment-->
                      </table>
                    </body>
                  </html>`,
              );
            },
          },
        ],
      },
    });

    setTimeout(function () {
      const cellData = [
        ...new Set(grid.viewData.map((row) => Object.values(row)).flat()),
      ];
      done(
        doAssert(
          cellData[0] === 'Paste buffer value' && cellData.length === 1,
          'Value has not been replaced with clipboard data: ' + cellData,
        ),
      );
    }, 10);
  });
  it('paste a Excel table single row / single cell value from the clipboard into a cell', function (done) {
    var grid = g({
      test: this.test,
      data: [{ 'Column A': 'Original value' }],
    });

    grid.focus();
    grid.setActiveCell(0, 0);
    grid.selectArea({ top: 0, left: 0, bottom: 0, right: 0 });

    grid.paste({
      clipboardData: {
        items: [
          {
            type: 'text/html',
            getAsString: function (callback) {
              callback(
                `<html>
                  <body>
                    <table border=0 cellpadding=0 cellspacing=0 width=101 style='border-collapse: collapse;width:76pt'>
                      <col width=101 style='mso-width-source:userset;mso-width-alt:3242;width:76pt'>
                      <tr height=23 style='mso-height-source:userset;height:17.0pt'>
                        <!--StartFragment-->
                          <td height=23 class=xl65 width=101 style='height:17.0pt;width:76pt'>Paste buffer value</td>
                        <!--EndFragment-->
                      </tr>
                  </table>
                  </body>
                </html>`,
              );
            },
          },
        ],
      },
    });

    setTimeout(function () {
      var cellData = grid.viewData[0]['Column A'];
      done(
        assertIf(
          cellData !== 'Paste buffer value',
          'Value has not been replaced with clipboard data: ' + cellData,
        ),
      );
    }, 10);
  });
  it('paste a HTML div value from the clipboard into a cell', function (done) {
    var grid = g({
      test: this.test,
      data: [{ 'Column A': 'Original value' }],
    });

    grid.focus();
    grid.setActiveCell(0, 0);
    grid.selectArea({ top: 0, left: 0, bottom: 0, right: 0 });

    grid.paste({
      clipboardData: {
        items: [
          {
            type: 'text/html',
            getAsString: function (callback) {
              callback(
                `<meta charset='utf-8'>
                  <div style="color: #d4d4d4;background-color: #1e1e1e;font-family: Menlo, Monaco, 'Courier New', monospace;font-weight: normal;font-size: 12px;line-height: 18px;white-space: pre;">
                    <div>
                    <span style="color: #4fc1ff;">Paste buffer value</span>
                    </div>
                  </div>`,
              );
            },
          },
        ],
      },
    });

    setTimeout(function () {
      var cellData = grid.viewData[0]['Column A'];
      done(
        assertIf(
          cellData !== 'Paste buffer value',
          'Value has not been replaced with clipboard data: ' + cellData,
        ),
      );
    }, 10);
  });
  it('paste data and fill it down/over', function (done) {
    const grid = g({
      test: this.test,
      data: [
        {
          field1: 'Value 1',
          field2: 'Value 2',
          field3: 'Value 3',
        },
        {},
        {},
      ],
    });

    grid.focus();
    grid.selectRow(0, false, false, false);
    grid.selectRow(2, false, true, false);

    grid.paste({
      clipboardData: {
        items: [
          {
            type: 'text/plain',
            getAsString: function (callback) {
              callback('New value');
            },
          },
        ],
      },
    });

    setTimeout(function () {
      try {
        doAssert(grid.viewData.length == 3, 'Should have 3 rows exactly');
        doAssert(
          Object.keys(grid.viewData[0]).length == 3,
          'Should have 3 columns exactly',
        );

        for (let i = 0; i < grid.viewData.length; i++) {
          for (const columnKey in grid.viewData[i]) {
            const currentValue = grid.viewData[i][columnKey];
            doAssert(
              currentValue === 'New value',
              `Value for "${columnKey}" should be "New value", but got "${currentValue}"`,
            );
          }
        }

        done();
      } catch (error) {
        done(error);
      }
    }, 10);
  });
  it('paste data with a custom fill down/over function', function (done) {
    const grid = g({
      test: this.test,
      data: [
        {
          field1: 'Value 1',
          field2: 'Value 2',
          field3: 'Value 3',
        },
        {},
      ],
      fillCellCallback: function (args) {
        let counter = 0;

        if (args.fillingColumnPosition > -1)
          counter = args.fillingColumnPosition + 1;
        if (args.fillingRowPosition > -1)
          counter += args.fillingRowPosition + 1;
        return args.newCellData + ' ' + counter;
      },
    });

    grid.focus();
    grid.selectRow(0, false, false, false);
    grid.selectRow(1, false, true, false);

    grid.paste({
      clipboardData: {
        items: [
          {
            type: 'text/plain',
            getAsString: function (callback) {
              callback('New value');
            },
          },
        ],
      },
    });
    setTimeout(function () {
      try {
        doAssert(grid.viewData.length == 2, 'Should have 2 rows exactly');
        doAssert(
          Object.keys(grid.viewData[0]).length == 3,
          'Should have 3 columns exactly',
        );

        const expectedResult = [
          {
            field1: 'New value',
            field2: 'New value 1',
            field3: 'New value 2',
          },
          {
            field1: 'New value 1',
            field2: 'New value 2',
            field3: 'New value 3',
          },
        ];

        for (let i = 0; i < grid.viewData.length; i++) {
          for (const columnKey in grid.viewData[i]) {
            const expectedValue = expectedResult[i][columnKey];
            const currentValue = grid.viewData[i][columnKey];
            doAssert(
              currentValue === expectedValue,
              `Value for "${columnKey}" should be "${expectedValue}", but got "${currentValue}"`,
            );
          }
        }

        done();
      } catch (error) {
        done(error);
      }
    }, 10);
  });
  it('Should fire a beforepaste event', function (done) {
    var grid = g({
      test: this.test,
      data: [{ 'Column A': 'Original value' }],
    });

    grid.focus();
    grid.setActiveCell(0, 0);

    grid.addEventListener('beforepaste', function (event) {
      event.preventDefault();
      done();
    });

    // Event can be empty, because beforepaste should fire immediately,
    // and return from paste function (because preventDefault):
    grid.paste({});
  });
  it('Should fire an afterpaste event', function (done) {
    var grid = g({
      test: this.test,
      data: [{ 'Column A': 'Original value' }],
    });

    grid.focus();
    grid.setActiveCell(0, 0);
    grid.selectArea({ top: 0, left: 0, bottom: 0, right: 0 });

    grid.addEventListener('afterpaste', function (event) {
      try {
        doAssert(!!event.cells, 'event has cells property');
        doAssert(event.cells.length === 1, 'one row has been pasted ');
        doAssert(event.cells[0][0] === 0, 'pasted column == 0');
        doAssert(event.cells[0][2] === 0, 'pasted bound column == 0');
      } catch (error) {
        done(error);
      }

      done();
    });

    grid.paste({
      clipboardData: {
        items: [
          {
            type: 'text/plain',
            getAsString: function (callback) {
              callback('Paste buffer value');
            },
          },
        ],
      },
    });
  });
  it('Begin editing, tab to next cell', function (done) {
    var ev,
      editedCell,
      grid = g({
        test: this.test,
        data: smallData(),
      });
    grid.beginEditAt(0, 0);
    ev = new Event('keydown');
    ev.key = 'Tab';
    grid.addEventListener('endedit', function (e) {
      editedCell = e.cell;
    });
    grid.input.dispatchEvent(ev);

    try {
      doAssert(
        editedCell.columnIndex === 0 && editedCell.rowIndex === 0,
        "The edited cell should match"
      );
      doAssert(
        grid.activeCell.rowIndex == 0 && grid.activeCell.columnIndex == 1,
        'The active should move to the right after pressing Tab',
      );
      done();
    } catch (error) {
      done(error);
    }
  });
  it('Begin editing, shift + tab to previous cell', function (done) {
    var ev,
      editedCell,
      grid = g({
        test: this.test,
        data: smallData(),
      });
    grid.focus();
    grid.setActiveCell(1, 1);
    grid.beginEditAt(1, 1);

    ev = new Event('keydown');
    ev.shiftKey = true;
    ev.key = 'Tab';
    grid.addEventListener('endedit', function (e) {
      editedCell = e.cell;
    });
    grid.input.dispatchEvent(ev);

    try {
      doAssert(
        editedCell.columnIndex === 1 && editedCell.rowIndex === 1,
        "The edited cell should match"
      );
      doAssert(
        grid.activeCell.rowIndex == 1 && grid.activeCell.columnIndex == 0,
        'The active should move to the left after pressing Shift + Tab',
      );
      done();
    } catch (error) {
      done(error);
    }
  });
  it('Begin editing, press enter to move to the cell below', function (done) {
    var ev,
      editedCell,
      grid = g({
        test: this.test,
        data: smallData(),
      });
    grid.focus();
    grid.beginEditAt(0, 0);

    ev = new Event('keydown');
    ev.shiftKey = false;
    ev.key = 'Enter';
    grid.addEventListener('endedit', function (e) {
      editedCell = e.cell;
    });
    grid.input.dispatchEvent(ev);
    try {
      doAssert(
        editedCell.columnIndex === 0 && editedCell.rowIndex === 0,
        "The edited cell should match"
      );
      doAssert(
        grid.activeCell.rowIndex == 1 && grid.activeCell.columnIndex == 0,
        'The active cell should move to the cell below',
      );
      done();
    } catch (error) {
      done(error);
    }
  });
  it('Begin editing, press shift + enter to move to the cell above', function (done) {
    var ev,
      editedCell,
      grid = g({
        test: this.test,
        data: smallData(),
      });
    grid.focus();
    grid.beginEditAt(0, 1);
    grid.setActiveCell(0, 1);

    ev = new Event('keydown');
    ev.shiftKey = true;
    ev.key = 'Enter';
    grid.addEventListener('endedit', function (e) {
      editedCell = e.cell;
    });
    grid.input.dispatchEvent(ev);
    try {
      doAssert(
        editedCell.columnIndex === 0 && editedCell.rowIndex === 1,
        "The edited cell should match"
      );
      doAssert(
        grid.activeCell.rowIndex == 0 && grid.activeCell.columnIndex == 0,
        'The active cell should move to the cell below',
      );
      done();
    } catch (error) {
      done(error);
    }
  });

  it('Begin editing next cell after Enter is pressed while in edit mode', function (done) {
    const ev = new Event('keydown'),
      grid = g({
        test: this.test,
        data: smallData(),
      });
    ev.key = 'Enter';
    grid.beginEditAt(0, 0);
    grid.addEventListener('beginedit', function (e) {
      if (e.cell.columnIndex === 0 && e.cell.rowIndex === 1) {
        done();
      }
    });
    document.body.lastChild.dispatchEvent(ev);
  });

  it ('Begin editing after Enter is pressed only if the cell has data', function (done) {
    const ev = new Event('keydown'),
    grid = g({
      test: this.test,
      data: [
        { col1: 'Cell data' },
        { col1: '' },
        { col1: 'Cell data' },
      ],
    });
    ev.key = 'Enter';
    grid.beginEditAt(0, 0);
    grid.addEventListener('beginedit', function (e) {
      if (e.cell.columnIndex === 0) {
        if (e.cell.rowIndex === 1) {
          done(new Error('Should not enter the cell on the second row, as it doesn\'t have data'));
        } else if (e.cell.rowIndex === 2) {
          done();
        }
      }
    });
    document.body.lastChild.dispatchEvent(ev);
    document.body.lastChild.dispatchEvent(ev);
    document.body.lastChild.dispatchEvent(ev);
  });

  it('Begin editing, tab to next row by hitting tab three times', function (done) {
    var ev,
      grid = g({
        test: this.test,
        data: smallData(),
      });
    grid.beginEditAt(0, 0);
    grid.addEventListener('endedit', function (e) {
      if (e.cell.columnIndex === 0 && e.cell.rowIndex === 0) {
        done();
      }
    });
    ev = new Event('keydown');
    ev.key = 'Tab';
    document.body.lastChild.dispatchEvent(ev);
    document.body.lastChild.dispatchEvent(ev);
    document.body.lastChild.dispatchEvent(ev);
    grid.endEdit();
  });
  describe('cut', function () {
    it('fires a aftercut event with affected cells', function (done) {
      var grid = g({
        test: this.test,
        data: [{ 'Column A': 'Original value' }],
      });

      grid.focus();
      grid.setActiveCell(0, 0);
      grid.selectArea({ top: 0, left: 0, bottom: 0, right: 0 });

      grid.addEventListener('aftercut', function (event) {
        try {
          doAssert(!!event.cells, 'event has cells property');
          doAssert(event.cells.length === 1, 'one row has been pasted ');
          doAssert(event.cells[0][0] === 0, 'pasted column == 0');
          doAssert(event.cells[0][2] === 0, 'pasted bound column == 0');
        } catch (error) {
          done(error);
        }

        done();
      });

      grid.cut(fakeClipboardEvent);
    });
  });

  it('Clicking outside the input element while editing ends edit, giving the focus back to grid', function () {
    const grid = g({
      test: this.test,
      data: smallData(),
      style: {
        cellHeight: 20,
        cellWidth: 40,
      }
    });

    grid.focus();

    // Double click on the first cell.
    mousemove(window, 70, 35, grid.canvas);
    mousedown(grid.canvas, 70, 35);
    mouseup(window, 10, 10, grid.canvas);
    click(grid.canvas, 70, 35);
    mousedown(grid.canvas, 70, 35);
    mouseup(window, 10, 10, grid.canvas);
    dblclick(grid.canvas, 70, 35);

    const { editCell } = grid.input;
    doAssert(
      editCell.rowIndex === 0 && editCell.columnIndex === 0,
      'The first cell should start being edited after we double click on it.',
    );

    // Click on another cell while still editing.
    mousemove(window, 145, 55, grid.canvas);
    mousedown(grid.canvas, 145, 55);
    mouseup(window, 145, 55, grid.canvas);

    doAssert(grid.input === undefined, 'Editing should have ended after click.');
    doAssert(grid.selectionList.length === 1, 'There should only be one selection.');

    const { rowIndex, columnIndex } = grid.activeCell;
    doAssert(
      rowIndex === 1 && columnIndex === 2,
      'The correct cell should become after the clicking on it while editing another cell',
    );
  });

  it('Clearing selection fires `afterdelete` event', function (done) {
    var grid = g({
      test: this.test,
      data: [{ 'Column A': 'Original value' }],
    });

    grid.focus();
    grid.selectArea({ top: 0, left: 0, bottom: 0, right: 0 });

    grid.addEventListener('afterdelete', function (event) {
      event.preventDefault();
      doAssert(
        event.cells[0].length == 4,
        'first affected cell is [rowIndex, columnIndex, boundRowIndex, boundColumnIndex] tuple',
      );
      chai.assert.deepStrictEqual(event.cells[0], [0, 0, 0, 0]);
      done();
    });

    grid.deleteSelectedData();
  });
  it('Moving handle on desktop fills the overlay region with selection data', function (done) {
    const grid = g({
      test: this.test,
      data: [{ field1: 'value1' }, { field1: 'value2' }, { field1: 'value3' }],
      fillCellCallback: (args) =>
        `${args.newCellData} ${args.fillingRowPosition + 1}`,
      selectionHandleBehavior: 'single',
    });
    let handled = false;

    grid.addEventListener('afterdraw', function (ev) {
      if (handled) return;
      handled = true;
      handlemove(grid, 0, 30);

      try {
        const expectedResult = [
          { field1: 'value1' },
          { field1: 'value1 1' },
          { field1: 'value1 2' },
        ];

        for (let i = 0; i < grid.viewData.length; i++) {
          for (const columnKey in grid.viewData[i]) {
            const expectedValue = expectedResult[i][columnKey];
            const currentValue = grid.viewData[i][columnKey];
            doAssert(
              currentValue === expectedValue,
              `Value for "${columnKey}" should be "${expectedValue}", but got "${currentValue}"`,
            );
          }
        }

        done();
      } catch (error) {
        done(error);
      }
    });

    grid.focus();
    grid.selectArea({ top: 0, left: 0, bottom: 0, right: 0 });
  });

  it('Merges cells', function (done) {
    const grid = g({
      test: this.test,
      data: [
        { field1: 'value1', field2: 'value1' },
        { field1: 'value2', field2: 'value2' },
        { field1: 'value3', field2: 'value3' },
      ],
    });

    const wholeArea = {
      left: 0,
      top: 0,
      right: grid.schema.length - 1,
      bottom: grid.viewData.length - 1,
    };

    const mergeBounds = { left: 0, top: 0, right: 0, bottom: 1 };
    grid.mergeCells(mergeBounds);
    chai.assert.deepStrictEqual(
      grid.getMergedCellBounds(0, 0),
      mergeBounds,
      'Merged cell bounds should be the same as the original',
    );
    grid.unmergeCells(mergeBounds);
    doAssert(
      !grid.containsMergedCells(wholeArea),
      'There should be no merged cells after unmerging',
    );

    grid.mergeCells(wholeArea, 'horizontal');
    chai.assert.deepStrictEqual(
      grid.getMergedCellBounds(0, 0),
      { left: 0, right: 1, top: 0, bottom: 0 },
      'Horizontal merging should generate three horizontally merged cells',
    );
    chai.assert.deepStrictEqual(
      grid.getMergedCellBounds(1, 0),
      { left: 0, right: 1, top: 1, bottom: 1 },
      'Horizontal merging should generate three horizontally merged cells',
    );
    chai.assert.deepStrictEqual(
      grid.getMergedCellBounds(2, 0),
      { left: 0, right: 1, top: 2, bottom: 2 },
      'Horizontal merging should generate three horizontally merged cells',
    );
    grid.unmergeCells(wholeArea);
    doAssert(
      !grid.containsMergedCells(wholeArea),
      'There should be no merged cells after unmerging horizontally merged cells',
    );

    grid.mergeCells(wholeArea, 'vertical');
    chai.assert.deepStrictEqual(
      grid.getMergedCellBounds(0, 0),
      { left: 0, right: 0, top: 0, bottom: 2 },
      'Vertical merging should generate two vertically merged cells',
    );
    chai.assert.deepStrictEqual(
      grid.getMergedCellBounds(0, 1),
      { left: 1, right: 1, top: 0, bottom: 2 },
      'Vertical merging should generate two vertically merged cells',
    );
    grid.unmergeCells(wholeArea);
    doAssert(
      !grid.containsMergedCells(wholeArea),
      'There should be no merged cells after unmerging horizontally merged cells',
    );

    done();
  });
  it('Moving handle on desktop on merged cells replicates them', function (done) {
    const grid = g({
      test: this.test,
      data: [
        { field1: 'value1', field2: 'value1' },
        { field1: 'value2', field2: 'value2' },
        { field1: 'value3', field2: 'value3' },
      ],
      fillCellCallback: (args) =>
        `${args.newCellData} ${args.fillingPosition + 1}`,
      selectionHandleBehavior: 'single',
    });

    let handled = false;
    grid.addEventListener('afterdraw', function (ev) {
      if (handled) return;
      handled = true;
      handlemove(grid, 10, 0);

      chai.assert.deepStrictEqual(
        grid.getMergedCellBounds(0, 1),
        { top: 0, left: 1, bottom: 2, right: 1 },
        'Handle move on merged cell should copy it onto the fill area',
      );

      try {
        const expectedResult = [
          { field1: 'value1', field2: 'value1 1' },
          { field1: undefined, field2: undefined },
          { field1: undefined, field: undefined },
        ];

        for (let i = 0; i < grid.viewData.length; i++) {
          for (const columnKey in grid.viewData[i]) {
            const expectedValue = expectedResult[i][columnKey];
            const currentValue = grid.viewData[i][columnKey];
            doAssert(
              currentValue === expectedValue,
              `Value for "${columnKey}" should be "${expectedValue}", but got "${currentValue}"`,
            );
          }
        }

        done();
      } catch (error) {
        done(error);
      }
    });

    grid.focus();
    grid.selectArea({ top: 0, left: 0, bottom: 1, right: 0 });
    grid.mergeCells({ top: 0, left: 0, bottom: 2, right: 0 });
    grid.selectArea({ top: 0, left: 0, bottom: 0, right: 0 });
    grid.draw();
    chai.assert.deepStrictEqual(
      grid.getMergedCellBounds(0, 0),
      { top: 0, left: 0, bottom: 2, right: 0 },
      'Merging cells as 1x3 should succeed',
    );
  });

  it('Frozen row marker should not move beyond limits', function () {
    const grid = g({
      test: this.test,
      data: makeData(100, 100),
      allowFreezingRows: true,
      allowFreezingColumns: true,
      style: {
        cellHeight: 18,
        cellWidth: 50,
        columnHeaderCellHeight: 18,
      },
    });
    grid.focus();
    grid.draw();

    mousemove(window, 10, 16, grid.canvas);
    mousedown(grid.canvas, 10, 16);
    mousemove(window, 10, 200, grid.canvas);
    mouseup(window, 10, 200, grid.canvas);

    doAssert(grid.frozenRow === 5, 'Frozen row should be set to 5');
  });

  it('Frozen column marker should not move beyond limits', function () {
    const grid = g({
      test: this.test,
      data: makeData(100, 100),
      allowFreezingRows: true,
      allowFreezingColumns: true,
      style: {
        cellHeight: 18,
        cellWidth: 50,
        columnHeaderCellHeight: 18,
      },
    });
    grid.focus();
    grid.draw();

    mousemove(window, 43, 10, grid.canvas);
    mousedown(grid.canvas, 43, 10);
    mousemove(window, 500, 10, grid.canvas);
    mouseup(window, 500, 10, grid.canvas);

    doAssert(grid.frozenColumn === 6, 'Frozen column should be set to 6');
  });
}
