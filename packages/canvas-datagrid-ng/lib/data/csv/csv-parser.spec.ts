/// <reference types="mocha" />
// https://en.wikipedia.org/wiki/Comma-separated_values

import { parseCSV } from './csv-parser';
import { assertWithName } from '../../spec-util';

describe('Test CSV Parser', () => {
  it('single row csv', () => {
    const csv = '1997,Ford,E350';
    const result = parseCSV(csv);
    assertWithName(csv, result.rows, [['1997', 'Ford', 'E350']]);
    assertWithName(csv, result.lastRow, csv);
  });
  it('single row csv with quoted cell', () => {
    let csv = '"1997","Ford","E350"';
    let result = parseCSV(csv);
    assertWithName(csv, result.rows, [['1997', 'Ford', 'E350']]);
    assertWithName(csv, result.lastRow, csv);

    //                  | here is a blank character after the quote
    csv = '"1997","Ford" ,"E350"';
    result = parseCSV(csv);
    assertWithName(csv, result.rows, [['1997', 'Ford', 'E350']]);
    assertWithName(csv, result.lastRow, csv);
  });

  it('single row csv with escape quote character', () => {
    const csv = '1997,Ford,E350,"Super, ""luxurious"" truck"';
    const result = parseCSV(csv);
    assertWithName(csv, result.rows, [
      ['1997', 'Ford', 'E350', 'Super, "luxurious" truck'],
    ]);
    assertWithName(csv, result.lastRow, csv);
  });

  it('single row csv with new line character', () => {
    const csv = '1997,Ford,E350,"Go get one now\nthey are going fast"';
    const result = parseCSV(csv);
    assertWithName(csv, result.rows, [
      ['1997', 'Ford', 'E350', 'Go get one now\nthey are going fast'],
    ]);
    assertWithName(csv, result.lastRow, csv);
  });

  it('RFC 4180', () => {
    const csv = '1997, Ford, E350    ';
    const result = parseCSV(csv);
    assertWithName(csv, result.rows, [['1997', ' Ford', ' E350    ']]);
    assertWithName(csv, result.lastRow, csv);
  });

  it('RFC 793, section 2.10', () => {
    const csv = '1997, "Ford" ,E350';
    const result = parseCSV(csv);
    assertWithName(csv, result.rows, [['1997', ' "Ford" ', 'E350']]);
    assertWithName(csv, result.lastRow, csv);
  });

  it('double quote processing need only apply if the field starts with a double quote', () => {
    const csv =
      'Los Angeles,34°03′N,118°15′W\n' +
      'New York City,40°42′46″N,74°00′21″W\n' +
      'Paris,48°51′24″N,2°21′03″E';
    const result = parseCSV(csv);
    const rows = [
      ['Los Angeles', '34°03′N', '118°15′W'],
      ['New York City', '40°42′46″N', '74°00′21″W'],
      ['Paris', '48°51′24″N', '2°21′03″E'],
    ];
    assertWithName('result.rows', result.rows, rows);
    assertWithName(
      'result.lastRow',
      result.lastRow,
      'Paris,48°51′24″N,2°21′03″E',
    );

    const csv2 = csv + '\n';
    const result2 = parseCSV(csv2);
    assertWithName('result2.rows', result2.rows, rows);
    assertWithName('result2.lastRow', result2.lastRow, '');
  });

  it('example', () => {
    const csv =
      `Year,Make,Model,Description,Price\n` +
      `1997,Ford,E350,"ac, abs, moon",3000.00\n` +
      `1999,Chevy,"Venture ""Extended Edition""","",4900.00\n` +
      `1999,Chevy,"Venture ""Extended Edition, Very Large""","",5000.00\n` +
      `1996,Jeep,Grand Cherokee,"MUST SELL!\n` +
      `air, moon roof, loaded",4799.00`;
    const rows = [
      [`Year`, `Make`, `Model`, `Description`, `Price`],
      [`1997`, `Ford`, `E350`, `ac, abs, moon`, `3000.00`],
      [`1999`, `Chevy`, `Venture "Extended Edition"`, ``, `4900.00`],
      [
        `1999`,
        `Chevy`,
        `Venture "Extended Edition, Very Large"`,
        ``,
        `5000.00`,
      ],
      [
        `1996`,
        `Jeep`,
        `Grand Cherokee`,
        `MUST SELL!\nair, moon roof, loaded`,
        `4799.00`,
      ],
    ];
    const result = parseCSV(csv);
    for (let i = 0; i < rows.length; i++)
      assertWithName(`result.rows[${i}]`, result.rows[i], rows[i]);
    assertWithName(
      'result.lastRow',
      result.lastRow,
      '1996,Jeep,Grand Cherokee,"MUST SELL!\nair, moon roof, loaded",4799.00',
    );
  });
});
