/// <reference types="mocha" />

import { deepStrictEqual } from 'assert';
import type {
  ParserCellData,
  List,
  CellStructFormat,
  CellStructChipFormatResult,
  DataFormatWithHyperlinkResult,
  DataFormatOptions,
} from '../../../types';
import { DataType } from '../../../types/column-types';
import { formatFormulaData, formatTableCellValue } from '../../data-format';

const freeFormNestedStructArrayData: ParserCellData = {
  dataType: 'struct[]',
  value: [
    {
      dataType: 'struct',
      value: {
        name: { dataType: 'string', value: 'Example Name 1' },
        address: {
          dataType: 'struct',
          value: {
            street: { dataType: 'string', value: '123 Oak St' },
            city: { dataType: 'string', value: 'Auckland' },
            state: { dataType: 'string', value: 'North Island' },
            zip: { dataType: 'int', value: 1010 },
          },
        },
        contact: { dataType: 'string', value: '+1 (782) 783-1298' },
        email: { dataType: 'string', value: 'johnsmith@gmail.com' },
        age: { dataType: 'int', value: 34 },
      },
    },
    {
      dataType: 'struct',
      value: {
        name: { dataType: 'string', value: 'Example Name 2' },
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
    },
  ],
};

const testData: {
  input: ParserCellData;
  expect: string | CellStructChipFormatResult | DataFormatWithHyperlinkResult;
  format?: CellStructFormat;
  options: DataFormatOptions;
}[] = [
  {
    input: freeFormNestedStructArrayData,
    format: { type: 'struct', format: 'raw' },
    expect:
      '[ {"name": "Example Name 1", "address": {"street": "123 Oak St", "city": "Auckland", "state": "North Island", "zip": 1010}, "contact": "+1 (782) 783-1298", "email": "johnsmith@gmail.com", "age": 34}, {"name": "Example Name 2", "address": {"street": "789 Oak St", "city": "Auckland", "state": "North Island", "zip": 1010}, "contact": "+1 (782) 783-1298", "email": "johnsmith@gmail.com", "age": 34} ]',
    options: { isRoot: true },
  },
  {
    input: freeFormNestedStructArrayData,
    format: { type: 'struct', format: 'chip', display: ['invalid'] },
    expect: { type: 'chip', value: ['Example Name 1'], chipsCount: 2 },
    options: { isRoot: true },
  },
  {
    input: freeFormNestedStructArrayData,
    format: { type: 'struct', format: 'chip', display: ['address', 'state'] },
    expect: { type: 'chip', value: ['North Island'], chipsCount: 2 },
    options: { isRoot: true },
  },
  {
    input: freeFormNestedStructArrayData,
    format: { type: 'struct', format: 'chip', display: ['address', 'invalid'] },
    expect: { type: 'chip', value: ['Example Name 1'], chipsCount: 2 },
    options: { isRoot: true },
  },
  // With hyperlink
  {
    input: {
      dataType: 'struct[]',
      value: [
        {
          dataType: 'struct',
          value: {
            link: { dataType: 'string', value: 'https://google.com' },
          },
        },
        {
          dataType: 'struct',
          value: {
            link: { dataType: 'string', value: 'https://youtube.com' },
          },
        },
      ],
    },
    format: { type: 'struct', format: 'raw' },
    options: { isRoot: true, showHyperlink: true },
    expect: {
      type: 'hyperlink',
      value:
        '[ {"link": "https://google.com"}, {"link": "https://youtube.com"} ]',
      linkRuns: [
        {
          startOffset: 12,
          endOffset: 30,
          ref: 'https://google.com',
        },
        {
          startOffset: 44,
          endOffset: 63,
          ref: 'https://youtube.com',
        },
      ],
    },
  },
];

const tableStructArrayValue: any = [
  {
    name: 'Example Name 1',
    address: {
      street: '123 Oak St',
      city: 'Auckland',
      state: 'North Island',
      zip: 1010,
    },
    contact: '+1 (782) 783-1298',
    email: 'johnsmith@gmail.com',
    age: 34,
  },
  {
    name: 'Example Name 2',
    address: {
      street: '789 Oak St',
      city: 'Auckland',
      state: 'North Island',
      zip: 1010,
    },
    contact: '+1 (782) 783-1298',
    email: 'johnsmith@gmail.com',
    age: 34,
  },
];
const tableStructArrayType: List = {
  typeId: DataType.List,
  child: {
    name: 'f',
    type: {
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
    },
  },
};

const testTableData: {
  input: any;
  expect: string | CellStructChipFormatResult | DataFormatWithHyperlinkResult;
  columnType: List;
  format?: CellStructFormat;
  options: DataFormatOptions;
}[] = [
  {
    input: tableStructArrayValue,
    columnType: tableStructArrayType,
    expect:
      '[ {"name": "Example Name 1", "address": {"street": "123 Oak St", "city": "Auckland", "state": "North Island", "zip": 1010}, "contact": "+1 (782) 783-1298", "email": "johnsmith@gmail.com", "age": 34}, {"name": "Example Name 2", "address": {"street": "789 Oak St", "city": "Auckland", "state": "North Island", "zip": 1010}, "contact": "+1 (782) 783-1298", "email": "johnsmith@gmail.com", "age": 34} ]',
    format: { type: 'struct', format: 'raw' },
    options: { isRoot: true },
  },
  {
    input: tableStructArrayValue,
    columnType: tableStructArrayType,
    expect: { type: 'chip', value: ['Example Name 1'], chipsCount: 2 },
    format: { type: 'struct', format: 'chip' },
    options: { isRoot: true },
  },
  {
    input: tableStructArrayValue,
    columnType: tableStructArrayType,
    expect: { type: 'chip', value: ['123 Oak St'], chipsCount: 2 },
    format: { type: 'struct', format: 'chip', display: ['address', 'street'] },
    options: { isRoot: true },
  },
  {
    input: tableStructArrayValue,
    columnType: tableStructArrayType,
    expect: { type: 'chip', value: ['Example Name 1'], chipsCount: 2 },
    format: { type: 'struct', format: 'chip', display: ['invalid'] },
    options: { isRoot: true },
  },
  // With hyperlink
  {
    input: [{ link: 'https://google.com' }, { link: 'https://youtube.com' }],
    columnType: {
      typeId: DataType.List,
      child: {
        name: 'f',
        type: {
          typeId: DataType.Struct,
          children: [{ name: 'link', type: 'string' }],
        },
      },
    },
    format: { type: 'struct', format: 'raw' },
    options: { isRoot: true, showHyperlink: true },
    expect: {
      type: 'hyperlink',
      value:
        '[ {"link": "https://google.com"}, {"link": "https://youtube.com"} ]',
      linkRuns: [
        {
          startOffset: 12,
          endOffset: 30,
          ref: 'https://google.com',
        },
        {
          startOffset: 44,
          endOffset: 63,
          ref: 'https://youtube.com',
        },
      ],
    },
  },
];

describe('test struct array data format', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, expect, format, options } = testData[i];
    it(`struct array ${input} should be ${expect}`, () => {
      const output = formatFormulaData(input, format, options);
      deepStrictEqual(output, expect);
    });
  }

  for (let i = 0; i < testTableData.length; i++) {
    const { input, expect, columnType, format, options } = testTableData[i];
    it(`struct array ${input} with type ${columnType} should be ${expect}`, () => {
      const output = formatTableCellValue(input, columnType, format, options);
      deepStrictEqual(output, expect);
    });
  }
});
