/// <reference types="mocha" />

import { equal } from 'assert';
import type { CellBooleanFormat } from '../../../types/data-format';
import type { ParserCellData } from '../../../types';
import type { List } from '../../../types/column-types';
import { DataType } from '../../../types/column-types';
import { formatFormulaData, formatTableCellValue } from '../../data-format';

const testData: {
  input: ParserCellData;
  output: string;
  format: CellBooleanFormat['format'];
}[] = [
  {
    input: {
      dataType: 'boolean[]',
      value: [
        { value: true, dataType: 'boolean' },
        { value: false, dataType: 'boolean' },
      ],
    },
    format: 'true|false',
    output: '[ true, false ]',
  },
  {
    input: {
      dataType: 'boolean[]',
      value: [
        { value: true, dataType: 'boolean' },
        { value: false, dataType: 'boolean' },
      ],
    },
    format: 'true|false',
    output: '[ true, false ]',
  },
  {
    input: {
      dataType: 'boolean[]',
      value: [
        { value: true, dataType: 'boolean' },
        { value: false, dataType: 'boolean' },
        { value: null, dataType: 'boolean' },
      ],
    },
    format: 'TRUE|FALSE',
    output: '[ TRUE, FALSE, null ]',
  },
  {
    input: {
      dataType: 'boolean[]',
      value: [
        { value: true, dataType: 'boolean' },
        { value: null, dataType: 'boolean' },
        { value: false, dataType: 'boolean' },
      ],
    },
    format: 'True|False',
    output: '[ True, null, False ]',
  },
  {
    input: {
      dataType: 'boolean[]',
      value: [
        { value: null, dataType: 'boolean' },
        { value: true, dataType: 'boolean' },
        { value: false, dataType: 'boolean' },
      ],
    },
    format: 'yes|no',
    output: '[ null, yes, no ]',
  },
  {
    input: {
      dataType: 'boolean[]',
      value: [
        { value: true, dataType: 'boolean' },
        { value: true, dataType: 'boolean' },
        { value: true, dataType: 'boolean' },
      ],
    },
    format: 'YES|NO',
    output: '[ YES, YES, YES ]',
  },
  {
    input: {
      dataType: 'boolean[]',
      value: [
        { value: false, dataType: 'boolean' },
        { value: false, dataType: 'boolean' },
        { value: false, dataType: 'boolean' },
      ],
    },
    format: 'Yes|No',
    output: '[ No, No, No ]',
  },
  {
    input: {
      dataType: 'boolean[]',
      value: [
        { value: false, dataType: 'boolean' },
        { value: false, dataType: 'boolean' },
        { value: false, dataType: 'boolean' },
      ],
    },
    format: '1|0',
    output: '[ 0, 0, 0 ]',
  },
  {
    input: {
      dataType: 'boolean[]',
      value: [{ value: null, dataType: 'boolean' }],
    },
    format: '1|0',
    output: '[ null ]',
  },
  {
    input: {
      dataType: 'boolean[]',
      value: [],
    },
    format: '1|0',
    output: '[ ]',
  },
];

const testTableData: {
  input: Array<boolean | null>;
  output: string;
  format: CellBooleanFormat['format'];
}[] = [
  {
    input: [true, false, null],
    format: 'true|false',
    output: '[ true, false, null ]',
  },
  {
    input: [true, false, null],
    format: 'TRUE|FALSE',
    output: '[ TRUE, FALSE, null ]',
  },
  {
    input: [true, null, false],
    format: 'True|False',
    output: '[ True, null, False ]',
  },
  {
    input: [null, true, false],
    format: 'yes|no',
    output: '[ null, yes, no ]',
  },
  {
    input: [true, true, true],
    format: 'YES|NO',
    output: '[ YES, YES, YES ]',
  },
  {
    input: [false, false],
    format: 'Yes|No',
    output: '[ No, No ]',
  },
  {
    input: [false, false],
    format: '1|0',
    output: '[ 0, 0 ]',
  },
  {
    input: [null],
    format: '1|0',
    output: '[ null ]',
  },
  {
    input: [],
    format: '1|0',
    output: '[ ]',
  },
];

describe('test data format for boolean list', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, output, format } = testData[i];
    it(`free form boolean ${input} with format ${format} should be ${output}`, () => {
      const result = formatFormulaData(
        input,
        {
          type: 'boolean',
          format,
        },
        { isRoot: true },
      );
      equal(result, output);
    });
  }

  const booleanListType: List = {
    typeId: DataType.List,
    child: { name: 'f', type: 'boolean' },
  };
  for (let i = 0; i < testTableData.length; i++) {
    const { input, output, format } = testTableData[i];
    it(`table boolean ${input} with format ${format} should be ${output}`, () => {
      const result = formatTableCellValue(
        input,
        booleanListType,
        {
          type: 'boolean',
          format,
        },
        { isRoot: true },
      );
      equal(result, output);
    });
  }
});
