// // /// <reference types="mocha" />

import { equal } from 'assert';
import type { CellGeographyFormat } from '../../../types/data-format';
import { DataType, type ParserCellData } from '../../../types';
import { formatFormulaData, formatTableCellValue } from '../../data-format';
import { getGeographyData } from './util';

const geographyPoint = getGeographyData('POINT(0.24 0)');
const geographyLine = getGeographyData('LINESTRING(1.23 3,4 4.56,7.89 9.1)');

const testData: {
  input: ParserCellData;
  output: string;
  format: CellGeographyFormat;
}[] = [
  {
    input: { dataType: 'geography', value: geographyPoint },
    format: { type: 'geography', format: 'WKT' },
    output: `POINT(0.24 0)`,
  },
  {
    input: { dataType: 'geography', value: geographyLine },
    format: { type: 'geography', format: 'JSON' },
    output: `{ "type": "LineString", "coordinates": [ [1.23, 3], [4, 4.56], [7.89, 9.1] ] }`,
  },
];

const columnType = { typeId: DataType.Geography };
const testTableData: {
  input: ReturnType<typeof getGeographyData>;
  output: string;
  columnType: any;
  format: CellGeographyFormat;
}[] = [
  {
    input: geographyPoint,
    format: { type: 'geography', format: 'WKT' },
    columnType,
    output: `POINT(0.24 0)`,
  },
  {
    input: geographyLine,
    format: { type: 'geography', format: 'JSON' },
    columnType,
    output: `{ "type": "LineString", "coordinates": [ [1.23, 3], [4, 4.56], [7.89, 9.1] ] }`,
  },
];

describe('test data format for geography', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, output, format } = testData[i];
    it(`geography ${input} with format ${format} should be ${output}`, () => {
      const result = formatFormulaData(input, format, { isRoot: true });
      equal(result, output);
    });
  }

  for (let i = 0; i < testTableData.length; i++) {
    const { input, output, format, columnType } = testTableData[i];
    it(`table datetime ${input} with format ${format} should be ${output}`, () => {
      const result = formatTableCellValue(input, columnType, format, {
        isRoot: true,
      });
      equal(result, output);
    });
  }
});
