/// <reference types="mocha" />

import { deepStrictEqual } from 'assert';
import type {
  ParserCellData,
  Struct,
  CellStructFormat,
  CellStructChipFormatResult,
  DataFormatWithHyperlinkResult,
  DataFormatOptions,
} from '../../../types';
import { DataType } from '../../../types/column-types';
import { formatFormulaData, formatTableCellValue } from '../../data-format';

const freeFormStructData: ParserCellData = {
  dataType: 'struct',
  value: {
    name: { dataType: 'string', value: 'Example Name' },
    address: {
      dataType: 'struct',
      value: {
        street: { dataType: 'string', value: '789 Oak St' },
        city: { dataType: 'string', value: 'Auckland' },
        state: { dataType: 'string', value: 'North Island' },
        zip: { dataType: 'int', value: 1010 },
      },
    },
    contact: { dataType: 'string', value: '+1 (782) 783-1298' },
    email: { dataType: 'string', value: 'johnsmith@gmail.com' },
    age: { dataType: 'int', value: 34 },
  },
};

const testData: {
  input: ParserCellData;
  output: string | CellStructChipFormatResult | DataFormatWithHyperlinkResult;
  // isRoot: boolean;
  format?: CellStructFormat;
  options: DataFormatOptions;
}[] = [
  // at root
  {
    input: {
      dataType: 'struct',
      value: {},
    },
    output: '{ }',
    options: { isRoot: true },
  },
  {
    input: {
      dataType: 'struct',
      value: {
        x: { dataType: 'int', value: { a: 125n, b: 0 } },
        y: { dataType: 'string', value: 'hello' },
      },
    },
    output: '{ "x": 125, "y": "hello" }',
    options: { isRoot: true },
  },
  {
    input: {
      dataType: 'struct',
      value: {
        x: { dataType: 'boolean', value: true },
        y: { dataType: 'date', value: Date.UTC(2022, 10, 11) },
      },
    },
    output: '{ "x": true, "y": 11/11/2022 }',
    options: { isRoot: true },
  },
  {
    input: {
      dataType: 'struct',
      value: {
        x: {
          dataType: 'struct',
          value: {
            y: { dataType: 'decimal', value: { a: 1234567888n, b: 9 } },
            z: { dataType: 'boolean', value: false },
          },
        },
      },
    },
    output: '{ "x": {"y": 1.23456789, "z": false} }',
    options: { isRoot: true },
  },
  // not at root
  {
    input: {
      dataType: 'struct',
      value: {},
    },
    output: '{}',
    options: { isRoot: false },
  },
  {
    input: {
      dataType: 'struct',
      value: {
        x: { dataType: 'int', value: { a: 125n, b: 0 } },
        y: { dataType: 'string', value: 'hello' },
      },
    },
    output: '{"x": 125, "y": "hello"}',
    options: { isRoot: false },
  },
  {
    input: {
      dataType: 'struct',
      value: {
        x: { dataType: 'boolean', value: true },
        y: { dataType: 'date', value: Date.UTC(2022, 10, 11) },
      },
    },
    output: '{"x": true, "y": 11/11/2022}',
    options: { isRoot: false },
  },
  {
    input: {
      dataType: 'struct',
      value: {
        x: {
          dataType: 'struct',
          value: {},
        },
      },
    },
    output: '{"x": {}}',
    options: { isRoot: false },
  },

  // chip format
  {
    // Use first leaf field as display field if not defined
    input: freeFormStructData,
    format: { type: 'struct', format: 'chip' },
    output: { type: 'chip', value: ['Example Name'], chipsCount: 1 },
    options: { isRoot: true },
  },
  {
    // Use path to first leaf field as display field
    input: freeFormStructData,
    format: { type: 'struct', format: 'chip', display: ['name'] },
    output: { type: 'chip', value: ['Example Name'], chipsCount: 1 },
    options: { isRoot: true },
  },
  {
    // Use nested leaf field as display field
    input: freeFormStructData,
    format: { type: 'struct', format: 'chip', display: ['address', 'state'] },
    output: { type: 'chip', value: ['North Island'], chipsCount: 1 },
    options: { isRoot: true },
  },
  {
    // Use nested leaf field as display field
    input: freeFormStructData,
    format: { type: 'struct', format: 'chip', display: ['address', 'zip'] },
    output: { type: 'chip', value: ['1010'], chipsCount: 1 },
    options: { isRoot: true },
  },
  {
    // Use invalid leaf field as display field
    input: freeFormStructData,
    format: { type: 'struct', format: 'chip', display: ['address'] },
    output: { type: 'chip', value: ['Example Name'], chipsCount: 1 },
    options: { isRoot: true },
  },
  {
    // Use invalid leaf field as display field
    input: freeFormStructData,
    format: { type: 'struct', format: 'chip', display: ['invalid'] },
    output: { type: 'chip', value: ['Example Name'], chipsCount: 1 },
    options: { isRoot: true },
  },
  {
    // Use invalid leaf field as display field
    input: freeFormStructData,
    format: {
      type: 'struct',
      format: 'chip',
      display: ['address', 'invalid'],
    },
    output: { type: 'chip', value: ['Example Name'], chipsCount: 1 },
    options: { isRoot: true },
  },
  {
    // Use invalid leaf field as display field
    input: freeFormStructData,
    format: {
      type: 'struct',
      format: 'chip',
      display: ['address', 'state', 'invalid'],
    },
    output: { type: 'chip', value: ['Example Name'], chipsCount: 1 },
    options: { isRoot: true },
  },

  // With hyperlinks
  {
    input: {
      dataType: 'struct',
      value: {
        x: { dataType: 'string', value: 'Google google.com' },
        y: {
          dataType: 'string[]',
          value: [
            { value: 'https://google.com', dataType: 'string' },
            { value: 'Youtube youtube.com', dataType: 'string' },
          ],
        },
        z: {
          dataType: 'json',
          value: { google: 'https://google.com' },
        },
      },
    },
    options: { isRoot: true, showHyperlink: true },
    output: {
      type: 'hyperlink',
      value:
        '{ "x": "Google google.com", "y": ["https://google.com", "Youtube youtube.com"], "z": {"google": "https://google.com"} }',
      linkRuns: [
        {
          startOffset: 15,
          endOffset: 25,
          ref: 'google.com',
        },
        {
          startOffset: 35,
          endOffset: 53,
          ref: 'https://google.com',
        },
        {
          startOffset: 65,
          endOffset: 76,
          ref: 'youtube.com',
        },
        {
          startOffset: 97,
          endOffset: 115,
          ref: 'https://google.com',
        },
      ],
    },
  },
];

const tableStructValue: any = {
  name: 'Example Name',
  address: {
    street: '789 Oak St',
    city: 'Auckland',
    state: 'North Island',
    zip: 1010,
  },
  contact: '+1 (782) 783-1298',
  email: 'johnsmith@gmail.com',
  age: 34,
};
const tableStructType: Struct = {
  typeId: DataType.Struct,
  children: [
    { name: 'name', type: 'string' },
    {
      name: 'address',
      type: {
        typeId: DataType.Struct,
        children: [
          { name: 'street', type: 'string' },
          { name: 'city', type: 'string' },
          { name: 'state', type: 'string' },
          { name: 'zip', type: 'int' },
        ],
      },
    },
    { name: 'contact', type: 'string' },
    { name: 'email', type: 'string' },
    { name: 'age', type: 'int' },
  ],
};

const testTableData: {
  input: any;
  output: string | CellStructChipFormatResult | DataFormatWithHyperlinkResult;
  // isRoot: boolean;
  columnType: Struct;
  format?: CellStructFormat;
  options: DataFormatOptions;
}[] = [
  // at root
  {
    input: {},
    output: '{ }',
    columnType: { typeId: DataType.Struct, children: [] },
    options: { isRoot: true },
  },
  {
    input: { x: 125, y: 'hello' },
    output: '{ "x": 125, "y": "hello" }',
    columnType: {
      typeId: DataType.Struct,
      children: [
        { name: 'x', type: 'int' },
        { name: 'y', type: 'string' },
      ],
    },
    options: { isRoot: true },
  },
  {
    input: { x: true, y: Date.UTC(2022, 10, 11) },
    output: '{ "x": true, "y": 11/11/2022 }',
    columnType: {
      typeId: DataType.Struct,
      children: [
        { name: 'x', type: 'boolean' },
        { name: 'y', type: { typeId: DataType.Date } },
      ],
    },
    options: { isRoot: true },
  },
  {
    input: { x: { y: 1 } },
    output: '{ "x": {"y": 1} }',
    columnType: {
      typeId: DataType.Struct,
      children: [
        {
          name: 'x',
          type: {
            typeId: DataType.Struct,
            children: [{ name: 'y', type: 'int' }],
          },
        },
      ],
    },
    options: { isRoot: true },
  },
  // not at root
  {
    input: {},
    output: '{}',
    columnType: { typeId: DataType.Struct, children: [] },
    options: { isRoot: false },
  },
  {
    input: { x: 125, y: 'hello' },
    output: '{"x": 125, "y": "hello"}',
    columnType: {
      typeId: DataType.Struct,
      children: [
        { name: 'x', type: 'int' },
        { name: 'y', type: 'string' },
      ],
    },
    options: { isRoot: false },
  },
  {
    input: { x: true, y: Date.UTC(2022, 10, 11) },
    output: '{"x": true, "y": 11/11/2022}',
    columnType: {
      typeId: DataType.Struct,
      children: [
        { name: 'x', type: 'boolean' },
        { name: 'y', type: { typeId: DataType.Date } },
      ],
    },
    options: { isRoot: false },
  },
  {
    input: { x: { y: 1 } },
    output: '{"x": {"y": 1}}',
    columnType: {
      typeId: DataType.Struct,
      children: [
        {
          name: 'x',
          type: {
            typeId: DataType.Struct,
            children: [{ name: 'y', type: 'int' }],
          },
        },
      ],
    },
    options: { isRoot: false },
  },

  // chip format
  {
    // Use first leaf field as display field if not defined
    input: tableStructValue,
    columnType: tableStructType,
    format: { type: 'struct', format: 'chip' },
    output: { type: 'chip', value: ['Example Name'], chipsCount: 1 },
    options: { isRoot: true },
  },
  {
    // Use path to first leaf field as display field
    input: tableStructValue,
    columnType: tableStructType,
    format: { type: 'struct', format: 'chip', display: ['name'] },
    output: { type: 'chip', value: ['Example Name'], chipsCount: 1 },
    options: { isRoot: true },
  },
  {
    // Use nested leaf field as display field
    input: tableStructValue,
    columnType: tableStructType,
    format: { type: 'struct', format: 'chip', display: ['address', 'state'] },
    output: { type: 'chip', value: ['North Island'], chipsCount: 1 },
    options: { isRoot: true },
  },
  {
    // Use nested leaf field as display field
    input: tableStructValue,
    columnType: tableStructType,
    format: { type: 'struct', format: 'chip', display: ['address', 'zip'] },
    output: { type: 'chip', value: ['1010'], chipsCount: 1 },
    options: { isRoot: true },
  },
  {
    // Use invalid leaf field as display field
    input: tableStructValue,
    columnType: tableStructType,
    format: { type: 'struct', format: 'chip', display: ['address'] },
    output: { type: 'chip', value: ['Example Name'], chipsCount: 1 },
    options: { isRoot: true },
  },
  {
    // Use invalid leaf field as display field
    input: tableStructValue,
    columnType: tableStructType,
    format: { type: 'struct', format: 'chip', display: ['invalid'] },
    output: { type: 'chip', value: ['Example Name'], chipsCount: 1 },
    options: { isRoot: true },
  },
  {
    // Use invalid leaf field as display field
    input: tableStructValue,
    columnType: tableStructType,
    format: {
      type: 'struct',
      format: 'chip',
      display: ['address', 'invalid'],
    },
    output: { type: 'chip', value: ['Example Name'], chipsCount: 1 },
    options: { isRoot: true },
  },
  {
    // Use invalid leaf field as display field
    input: tableStructValue,
    columnType: tableStructType,
    format: {
      type: 'struct',
      format: 'chip',
      display: ['address', 'state', 'invalid'],
    },
    output: { type: 'chip', value: ['Example Name'], chipsCount: 1 },
    options: { isRoot: true },
  },

  // With hyperlinks
  {
    input: {
      x: 'Google google.com',
      y: ['https://google.com', 'Youtube youtube.com'],
    },
    columnType: {
      typeId: DataType.Struct,
      children: [
        { name: 'x', type: 'string' },
        {
          name: 'y',
          type: {
            typeId: DataType.List,
            child: { name: 'f', type: 'string' },
          },
        },
      ],
    },
    options: { isRoot: true, showHyperlink: true },
    output: {
      type: 'hyperlink',
      value:
        '{ "x": "Google google.com", "y": ["https://google.com", "Youtube youtube.com"] }',
      linkRuns: [
        {
          startOffset: 15,
          endOffset: 25,
          ref: 'google.com',
        },
        {
          startOffset: 35,
          endOffset: 53,
          ref: 'https://google.com',
        },
        {
          startOffset: 65,
          endOffset: 76,
          ref: 'youtube.com',
        },
      ],
    },
  },
];

describe('test struct data format', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, output, format, options } = testData[i];
    it(`struct ${input} should be ${output}`, () => {
      const result = formatFormulaData(input, format, options);
      deepStrictEqual(result, output);
    });
  }

  for (let i = 0; i < testTableData.length; i++) {
    const { input, output, columnType, format, options } = testTableData[i];
    it(`struct ${input} with type ${columnType} should be ${output}`, () => {
      const result = formatTableCellValue(input, columnType, format, options);
      deepStrictEqual(result, output);
    });
  }
});
