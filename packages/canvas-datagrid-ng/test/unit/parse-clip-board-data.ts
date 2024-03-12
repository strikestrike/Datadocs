/// <reference types="chai" />

'use strict';

import {
  parseHtmlTable,
  parseHtmlText,
  parseText,
  sanitizeRowsData,
  GuessMergingCellStrategy,
} from '../../lib/events/util.js';

export default function () {
  it('parse html table', function () {
    const htmlTable = `<html>
      <body>
        <table border=0 cellpadding=0 cellspacing=0 width=101 style='border-collapse: collapse;width:76pt'>
          <col width=101 style='mso-width-source:userset;mso-width-alt:3242;width:76pt'>
          <col width=101 style='mso-width-source:userset;mso-width-alt:3242;width:76pt'>
          <!--StartFragment-->
          <tr height=23 style='mso-height-source:userset;height:17.0pt'>
              <td height=23 class=xl65 width=101 style='height:17.0pt;width:76pt'>First cell</td>
              <td height=23 class=xl65 width=101 style='height:17.0pt;width:76pt'>Second cell</td>
          </tr>
          <!--EndFragment-->
      </table>
      </body>
    </html>`;

    const result = parseHtmlTable(htmlTable);

    chai.assert.deepStrictEqual(result, [
      [
        { value: [{ value: 'First cell' }], rowSpan: 1, columnSpan: 1 },
        { value: [{ value: 'Second cell' }], rowSpan: 1, columnSpan: 1 },
      ],
    ]);
    // doAssert(
    //   JSON.stringify(result) === expectedResultString,
    //   'get expected html table values',
    // );
  });

  it('parse html text', function () {
    const htmlTable = `<meta charset='utf-8'>
      <div style="color: #d4d4d4;background-color: #1e1e1e;font-family: Menlo, Monaco, 'Courier New', monospace;font-weight: normal;font-size: 12px;line-height: 18px;white-space: pre;">
        <div>
        <span style="color: #4fc1ff;">Paste value</span>
        </div>
      </div>`;

    const result = parseHtmlText(htmlTable);

    chai.assert.deepStrictEqual(result, [
      [{ value: [{ value: 'Paste value' }], columnSpan: 1, rowSpan: 1 }],
    ]);
  });

  it('parse plain text', function () {
    const result = parseText('Single value');

    chai.assert.deepStrictEqual(result, [
      [{ value: [{ value: 'Single value' }], columnSpan: 1, rowSpan: 1 }],
    ]);
  });

  it('parse multiple plain text', function () {
    const result = parseText('First value\nSecond value');

    chai.assert.deepStrictEqual(result, [
      [{ value: [{ value: 'First value' }], columnSpan: 1, rowSpan: 1 }],
      [{ value: [{ value: 'Second value' }], columnSpan: 1, rowSpan: 1 }],
    ]);
  });

  it('parse plain text with multiple empty cells', function () {
    const data = ['1,,2', ',,3', ',,4'].join('\n').replace(/,/g, '\t');

    const parsed = parseText(data);
    assertWithName('parsed.length', parsed.length, 3);
    assertWithName('parsed[0]', parsed[0], [
      { value: [{ value: '1' }], rowSpan: 1, columnSpan: 1 },
      { value: [{ value: '' }], rowSpan: 1, columnSpan: 1 },
      { value: [{ value: '2' }], rowSpan: 1, columnSpan: 1 },
    ]);
    assertWithName('parsed[1]', parsed[1], [
      { value: [{ value: '' }], rowSpan: 1, columnSpan: 1 },
      { value: [{ value: '' }], rowSpan: 1, columnSpan: 1 },
      { value: [{ value: '3' }], rowSpan: 1, columnSpan: 1 },
    ]);
    assertWithName('parsed[2]', parsed[2], [
      { value: [{ value: '' }], rowSpan: 1, columnSpan: 1 },
      { value: [{ value: '' }], rowSpan: 1, columnSpan: 1 },
      { value: [{ value: '4' }], rowSpan: 1, columnSpan: 1 },
    ]);

    const result = sanitizeRowsData(parsed);
    assertWithName('parsed.rowsOffset', result.rowsOffset, 0);
    assertWithName('parsed.colsSpannedLength', result.colsSpannedLength, 3);
  });

  it('parse plain text with multiple empty cells (GuessMergingCellStrategy.ColumnSpanFirst)', function () {
    const data = ['1,,2', ',,3', ',,4'].join('\n').replace(/,/g, '\t');

    const parsed = parseText(data, GuessMergingCellStrategy.ColumnSpanFirst);
    assertWithName('parsed.length', parsed.length, 3);
    assertWithName('parsed[0]', parsed[0], [
      { value: [{ value: '1' }], rowSpan: 3, columnSpan: 2 },
      null,
      { value: [{ value: '2' }], rowSpan: 1, columnSpan: 1 },
    ]);
    assertWithName('parsed[1]', parsed[1], [
      null,
      null,
      { value: [{ value: '3' }], rowSpan: 1, columnSpan: 1 },
    ]);
    assertWithName('parsed[2]', parsed[2], [
      null,
      null,
      { value: [{ value: '4' }], rowSpan: 1, columnSpan: 1 },
    ]);

    const result = sanitizeRowsData(parsed);
    assertWithName('parsed.rowsOffset', result.rowsOffset, 0);
    assertWithName('parsed.colsSpannedLength', result.colsSpannedLength, 3);
  });

  it('parse plain text with multiple empty cells (GuessMergingCellStrategy.RowSpanFirst)', function () {
    const data = ['1,x,2', ',,3', ',,4'].join('\n').replace(/,/g, '\t');

    const parsed = parseText(data, GuessMergingCellStrategy.RowSpanFirst);
    assertWithName('parsed.length', parsed.length, 3);
    assertWithName('parsed[0]', parsed[0], [
      { value: [{ value: '1' }], rowSpan: 3, columnSpan: 1 },
      { value: [{ value: 'x' }], rowSpan: 3, columnSpan: 1 },
      { value: [{ value: '2' }], rowSpan: 1, columnSpan: 1 },
    ]);
    assertWithName('parsed[1]', parsed[1], [
      null,
      null,
      { value: [{ value: '3' }], rowSpan: 1, columnSpan: 1 },
    ]);
    assertWithName('parsed[2]', parsed[2], [
      null,
      null,
      { value: [{ value: '4' }], rowSpan: 1, columnSpan: 1 },
    ]);

    const result = sanitizeRowsData(parsed);
    assertWithName('parsed.rowsOffset', result.rowsOffset, 0);
    assertWithName('parsed.colsSpannedLength', result.colsSpannedLength, 3);
  });

  it('parse multispan plain text', function () {
    // 1, , ,2
    //  , , ,6
    //  , , ,7
    //  , , ,
    //  , , ,
    // 3,4,5,
    const data = [
      '1\t\t\t2',
      '\t\t\t6',
      '\t\t\t7',
      '\t\t\t',
      '\t\t\t',
      '3\t4\t5\t',
    ].join('\n');
    const result = sanitizeRowsData(
      parseText(data, GuessMergingCellStrategy.ColumnSpanFirst),
    );

    chai.assert.deepStrictEqual(result, {
      rowsOffset: 2,
      colsSpannedLength: 4,
      data: [
        [
          {
            value: [{ value: '1' }],
            columnSpan: 3,
            rowSpan: 5,
            columnOffset: 0,
            rowOffset: 0,
          },
          {
            value: [{ value: '2' }],
            columnSpan: 1,
            rowSpan: 1,
            columnOffset: 2,
            rowOffset: 0,
          },
        ],
        [
          {
            value: [{ value: '6' }],
            columnSpan: 1,
            rowSpan: 1,
            columnOffset: 3,
            rowOffset: 0,
          },
        ],
        [
          {
            value: [{ value: '7' }],
            columnSpan: 1,
            rowSpan: 4,
            columnOffset: 3,
            rowOffset: 0,
          },
        ],
        [
          {
            value: [{ value: '3' }],
            columnSpan: 1,
            rowSpan: 1,
            columnOffset: 0,
            rowOffset: 2,
          },
          {
            value: [{ value: '4' }],
            columnSpan: 1,
            rowSpan: 1,
            columnOffset: 0,
            rowOffset: 2,
          },
          {
            value: [{ value: '5' }],
            columnSpan: 2,
            rowSpan: 1,
            columnOffset: 0,
            rowOffset: 2,
          },
        ],
      ],
    });
  });

  it('parse multispan html table', function () {
    const htmlTable = `<html>
        <body>
            <table width=314 style='border-collapse:collapse;width:236pt'>
                <!--StartFragment-->
                <col width=61 style='width:46pt' span=2>
                <col width=64 style='width:48pt' span=3>
                <tr height=20 style='height:15.0pt'>
                    <td colspan=2 rowspan=4 width=122 height=80 class=xl51 dir=LTR style='width:92pt;height:60.0pt'>One</td>
                    <td width=64 class=xl19 dir=LTR style='width:48pt'>Two</td>
                    <td rowspan=2 width=64 height=40 class=xl119 dir=LTR style='width:48pt;height:30.0pt'>Three</td>
                    <td width=64 style='width:48pt'>Four</td>
                </tr>
                <tr height=20 style='height:15.0pt'>
                    <td class=xl21 dir=LTR>Five</td>
                    <td rowspan=2 width=64 height=40 class=xl123 dir=LTR style='width:48pt;height:30.0pt'>Six</td>
                </tr>
                <tr height=20 style='height:15.0pt'>
                    <td rowspan=2 width=64 height=40 class=xl57 dir=LTR style='width:48pt;height:30.0pt'>Seven</td>
                    <td class=xl17 dir=LTR>Eight</td>
                </tr>
                <tr height=20 style='height:15.0pt'>
                    <td class=xl17 dir=LTR>Nine</td>
                    <td class=xl17 dir=LTR>Ten</td>
                </tr>
                <!--EndFragment-->
            </table>
        </body>
      </html>`;
    const result = sanitizeRowsData(parseHtmlTable(htmlTable));

    chai.assert.deepStrictEqual(result, {
      rowsOffset: 0,
      colsSpannedLength: 5,
      data: [
        [
          {
            value: [{ value: 'One' }],
            columnSpan: 2,
            rowSpan: 4,
            columnOffset: 0,
            rowOffset: 0,
          },
          {
            value: [{ value: 'Two' }],
            columnSpan: 1,
            rowSpan: 1,
            columnOffset: 1,
            rowOffset: 0,
          },
          {
            value: [{ value: 'Three' }],
            columnSpan: 1,
            rowSpan: 2,
            columnOffset: 1,
            rowOffset: 0,
          },
          {
            value: [{ value: 'Four' }],
            columnSpan: 1,
            rowSpan: 1,
            columnOffset: 1,
            rowOffset: 0,
          },
        ],
        [
          {
            value: [{ value: 'Five' }],
            columnSpan: 1,
            rowSpan: 1,
            columnOffset: 2,
            rowOffset: 0,
          },
          {
            value: [{ value: 'Six' }],
            columnSpan: 1,
            rowSpan: 2,
            columnOffset: 3,
            rowOffset: 0,
          },
        ],
        [
          {
            value: [{ value: 'Seven' }],
            columnSpan: 1,
            rowSpan: 2,
            columnOffset: 2,
            rowOffset: 0,
          },
          {
            value: [{ value: 'Eight' }],
            columnSpan: 1,
            rowSpan: 1,
            columnOffset: 2,
            rowOffset: 0,
          },
        ],
        [
          {
            value: [{ value: 'Nine' }],
            columnSpan: 1,
            rowSpan: 1,
            columnOffset: 3,
            rowOffset: 0,
          },
          {
            value: [{ value: 'Ten' }],
            columnSpan: 1,
            rowSpan: 1,
            columnOffset: 3,
            rowOffset: 0,
          },
        ],
      ],
    });
  });
}

function assertWithName(objectName, obj, expected) {
  try {
    chai.assert.deepStrictEqual(obj, expected);
  } catch (error) {
    const message = [
      `${objectName} should deeply equal`,
      `  ${JSON.stringify(expected)}`,
      `But its actual value is`,
      `  ${JSON.stringify(obj)}`,
    ].join('\n');
    throw new Error(message);
  }
}
