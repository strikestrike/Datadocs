// // /// <reference types="mocha" />

import { equal } from 'assert';
import type { CellGeographyFormat } from '../../../types/data-format';
import type { ParserCellData } from '../../../types';
import { formatFormulaData } from '../../data-format';
import { getGeographyData } from './util';

const geographyArrayData = {
  dataType: 'geography[]',
  value: [
    { value: getGeographyData('POINT EMPTY'), dataType: 'geography' },
    { value: getGeographyData('POINT(0.24 0)'), dataType: 'geography' },
    {
      value: getGeographyData('LINESTRING(1.23 3,4 4.56,7.89 9.1)'),
      dataType: 'geography',
    },
  ],
};

const testData: {
  input: ParserCellData;
  output: string;
  format: CellGeographyFormat;
}[] = [
  {
    input: geographyArrayData,
    format: { type: 'geography', format: 'WKT' },
    output: `[ POINT EMPTY, POINT(0.24 0), LINESTRING(1.23 3, 4 4.56, 7.89 9.1) ]`,
  },
  {
    input: geographyArrayData,
    format: { type: 'geography', format: 'JSON' },
    output: `[ { "type": "Point", "coordinates": [ ] }, { "type": "Point", "coordinates": [0.24, 0] }, { "type": "LineString", "coordinates": [ [1.23, 3], [4, 4.56], [7.89, 9.1] ] } ]`,
  },
];

describe('test data format for geography list', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, output, format } = testData[i];
    it(`geography ${input} with format ${format} should be ${output}`, () => {
      const result = formatFormulaData(input, format, { isRoot: true });
      equal(result, output);
    });
  }
});
