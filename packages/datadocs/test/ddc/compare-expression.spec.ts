import { describe, expect, it } from 'vitest';
import { ValueNode } from "@datadocs/ddc";
import { getParserResult } from "../../src/app/store/parser";
import { LHS_EQUAL, LHS_INEQUAL } from "./data/lhs-test-data";
import { RHS_EQUAL, RHS_INEQUAL } from "./data/rhs-test-data";

function isSameKeys(a: Record<string, any>, b: Record<string, any>) {
  var aKeys = Object.keys(a).sort();
  var bKeys = Object.keys(b).sort();
  return JSON.stringify(aKeys) === JSON.stringify(bKeys);
}

function buildCompareTestCase(
  testSuiteName: string,
  LHS: Record<string, string>,
  RHS: Record<string, string>,
  output: boolean,
) {
  if (!isSameKeys(LHS, RHS)) {
    throw new Error(`Test suite ${testSuiteName} is incorrect`);
  }

  for (const key in LHS) {
    const expression = `${LHS[key]}=${RHS[key]}`
    it(`Expression \`${expression}\` should be \`${String(output).toUpperCase()}\``, () => {
      const { ast, errors } = getParserResult(expression);
      expect(!errors).toBe(true);
      expect(ast.root instanceof ValueNode).toBe(true);
      expect(output).toEqual((ast.root as ValueNode).value);
    })
  }
}

describe('Test ddc compare expression', () => {
  // EQUAL test
  if (!isSameKeys(LHS_EQUAL, RHS_EQUAL)) {
    throw new Error(`Test suite for EQUAL is incorrect`);
  }
  for (const key in LHS_EQUAL) {
    const testSuiteName = `EQUAL for ${key}`;
    describe(`Test ddc assert ${testSuiteName}`, () => {
      buildCompareTestCase(testSuiteName, LHS_EQUAL[key], RHS_EQUAL[key], true);
    });
  }

  // INEQUAL test
  if (!isSameKeys(LHS_INEQUAL, RHS_INEQUAL)) {
    throw new Error(`Test suite for INEQUAL is incorrect`);
  }
  for (const key in LHS_INEQUAL) {
    const testSuiteName = `INEQUAL for ${key}`;
    describe(`Test ddc assert ${testSuiteName}`, () => {
      buildCompareTestCase(testSuiteName, LHS_INEQUAL[key], RHS_INEQUAL[key], false);
    });
  }
});
