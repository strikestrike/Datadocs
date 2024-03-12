/// <reference types="mocha" />

import { deepStrictEqual } from 'assert';
import type { CellJSONFormat } from '../../../types/data-format';
import { jsonFormatter } from './json-formatter';
import { getDefaultStyleForDataType } from '../../../style/style';

const testData: {
  input: any;
  output: string;
  format: CellJSONFormat['format'];
  align: 'left' | 'right' | 'center';
}[] = [
  // JSON number
  {
    input: 1.234,
    output: '1.234',
    format: 'short',
    align: 'right',
  },
  {
    input: 123.777777777,
    output: '123.77777778',
    format: 'short',
    align: 'right',
  },
  {
    input: 1.234,
    output: 'JSON 1.234',
    format: 'long',
    align: 'right',
  },
  {
    input: 123.777777777,
    output: 'JSON 123.77777778',
    format: 'long',
    align: 'right',
  },
  // JSON string
  {
    input: 'hello world',
    output: 'hello world',
    format: 'short',
    align: 'left',
  },
  {
    input: 'EXAMPLE',
    output: 'JSON "EXAMPLE"',
    format: 'long',
    align: 'left',
  },
  // JSON boolean
  {
    input: true,
    output: 'true',
    format: 'short',
    align: 'center',
  },
  {
    input: false,
    output: 'false',
    format: 'short',
    align: 'center',
  },
  {
    input: true,
    output: 'JSON true',
    format: 'long',
    align: 'center',
  },
  {
    input: false,
    output: 'JSON false',
    format: 'long',
    align: 'center',
  },
  // JSON null
  {
    input: null,
    output: 'null',
    format: 'short',
    align: 'left',
  },
  {
    input: null,
    output: 'JSON null',
    format: 'long',
    align: 'left',
  },
  // JSON undefined
  {
    input: undefined,
    output: 'undefined',
    format: 'short',
    align: 'left',
  },
  {
    input: undefined,
    output: 'JSON undefined',
    format: 'long',
    align: 'left',
  },
  // JSON array
  {
    input: [],
    output: '[ ]',
    format: 'short',
    align: 'left',
  },
  {
    input: [1, 2, 3],
    output: '[ 1, 2, 3 ]',
    format: 'short',
    align: 'left',
  },
  {
    input: [true, false],
    output: '[ true, false ]',
    format: 'short',
    align: 'left',
  },
  {
    input: ['this', 'is', 'an', 'example'],
    output: '[ "this", "is", "an", "example" ]',
    format: 'short',
    align: 'left',
  },
  {
    input: [{}, {}, {}],
    output: '[ {}, {}, {} ]',
    format: 'short',
    align: 'left',
  },
  {
    input: [
      { x: 1, y: true },
      { y: false, z: 'example' },
      { z: 'hello world', t: null },
    ],
    output:
      '[ {"x": 1, "y": true}, {"y": false, "z": "example"}, {"z": "hello world", "t": null} ]',
    format: 'short',
    align: 'left',
  },
  {
    input: [1, true, null, 'example'],
    output: '[ 1, true, null, "example" ]',
    format: 'short',
    align: 'left',
  },
  {
    input: [],
    output: 'JSON []',
    format: 'long',
    align: 'left',
  },
  {
    input: [1, 2, 3],
    output: 'JSON [1, 2, 3]',
    format: 'long',
    align: 'left',
  },
  {
    input: [true, false],
    output: 'JSON [true, false]',
    format: 'long',
    align: 'left',
  },
  {
    input: ['this', 'is', 'an', 'example'],
    output: 'JSON ["this", "is", "an", "example"]',
    format: 'long',
    align: 'left',
  },
  {
    input: [1, true, null, 'example'],
    output: 'JSON [1, true, null, "example"]',
    format: 'long',
    align: 'left',
  },
  {
    input: [{}, {}, {}],
    output: 'JSON [{}, {}, {}]',
    format: 'long',
    align: 'left',
  },
  {
    input: [
      { x: 1, y: true },
      { y: false, z: 'example' },
      { z: 'hello world', t: null },
    ],
    output:
      'JSON [{"x": 1, "y": true}, {"y": false, "z": "example"}, {"z": "hello world", "t": null}]',
    format: 'long',
    align: 'left',
  },
  // JSON object
  {
    input: {},
    output: '{ }',
    format: 'short',
    align: 'left',
  },
  {
    input: { x: 1, y: 2 },
    output: '{ "x": 1, "y": 2 }',
    format: 'short',
    align: 'left',
  },
  {
    input: { x: 1, y: true, z: 'example', t: null },
    output: '{ "x": 1, "y": true, "z": "example", "t": null }',
    format: 'short',
    align: 'left',
  },
  {
    input: {
      x: [1, true, null, { y: 'example', z: [true, false] }],
      y: { z: 'hello world' },
    },
    output:
      '{ "x": [1, true, null, {"y": "example", "z": [true, false]}], "y": {"z": "hello world"} }',
    format: 'short',
    align: 'left',
  },
  {
    input: {},
    output: 'JSON {}',
    format: 'long',
    align: 'left',
  },
  {
    input: { x: 1, y: 2 },
    output: 'JSON {"x": 1, "y": 2}',
    format: 'long',
    align: 'left',
  },
  {
    input: { x: 1, y: true, z: 'example', t: null },
    output: 'JSON {"x": 1, "y": true, "z": "example", "t": null}',
    format: 'long',
    align: 'left',
  },
  {
    input: {
      x: [1, true, null, { y: 'example', z: [true, false] }],
      y: { z: 'hello world' },
    },
    output:
      'JSON {"x": [1, true, null, {"y": "example", "z": [true, false]}], "y": {"z": "hello world"}}',
    format: 'long',
    align: 'left',
  },
];

describe('test JSON formatter', () => {
  for (let i = 0; i < testData.length; i++) {
    const { input, output, format, align } = testData[i];
    it(`boolean ${input} with format ${format} should be ${output} and align ${align}`, () => {
      const result = jsonFormatter(input, { type: 'json', format }, true);
      deepStrictEqual(output, result);
      // check if align style is correct
      const defaultStyle = getDefaultStyleForDataType('json', input);
      deepStrictEqual(defaultStyle.horizontalAlignment, align);
    });
  }
});
