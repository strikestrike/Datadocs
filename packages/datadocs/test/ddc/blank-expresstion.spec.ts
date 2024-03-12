import { describe, expect, it } from 'vitest';
import { ValueNode } from "@datadocs/ddc";
import { getParserResult } from "../../src/app/store/parser";

let blankTestData: {
  input: string,
  output: any,
  isError?: boolean,
}[] = [
  {
    input: '@blank::INT',
    output: { value: 0n },
  },
  {
    input: '@blank::BOOLEAN',
    output: false,
  },
  {
    input: '@blank::STRING',
    output: '',
  },
  {
    input: '@blank::BYTES',
    output: new ArrayBuffer(0),
  },
  {
    input: '@blank::INTERVAL',
    output: 0,
  },
  {
    input: '@blank::INTERVAL=INTERVAL 0 day',
    output: true,
  },
  {
    input: '@blank::VARIANT[]',
    output: [],
  },

  // compare @blank
  {
    input: '@blank=FALSE',
    output: true,
  },
  {
    input: '@blank=0',
    output: true,
  },
  {
    input: '@blank=0.0',
    output: true,
  },
  {
    input: '@blank=0.0e+0',
    output: true,
  },
  {
    input: '@blank=b""',
    output: true,
  },
  {
    input: '@blank=INTERVAL 0 HOUR',
    output: true,
  },
  {
    input: '@blank=[]',
    output: true,
  },
  {
    input: '@blank=ST_GEOGFROMTEXT("GEOMETRYCOLLECTION EMPTY")',
    output: true,
  },
  {
    input: '@blank=JSON ""',
    output: true,
  },
];

describe("Test ddc blank expression", () => {
  for (let i = 0; i < blankTestData.length; i++) {
    let { input, output, isError } = blankTestData[i];
    input = input.substring(0);
    let displayOutput = String(output);
    try {
      displayOutput = JSON.stringify(output);
    } catch (error) {
    }
    if (isError) displayOutput = 'error';

    it(`${input} should be ${displayOutput}`, () => {
      const { ast, errors } = getParserResult(input);
      // console.log(input, " value => ", ast.root);
      // console.log(input, " error => ", errors);
      if (!isError) {
        expect(!errors).toBe(true);
        expect(ast.root instanceof ValueNode).toBe(true);
        expect(output).toEqual((ast.root as ValueNode).value);
      } else {
        expect(!!errors).toBe(true);
      }
    });
  }
});
