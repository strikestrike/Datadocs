/// <reference types="chai" />

export function doAssert(assertion: boolean, message: string) {
  if (typeof chai !== 'undefined') chai.assert(assertion, message);
  if (!assertion) throw new Error(message);
}

export function assertWithName<T = any>(
  objectName: string,
  actual: T,
  expected: T,
) {
  try {
    chai.assert.deepStrictEqual(actual, expected);
  } catch (error) {
    const message = [
      `${objectName} should deeply equal`,
      `  ${JSON.stringify(expected)}`,
      `But its actual value is`,
      `  ${JSON.stringify(actual)}`,
    ].join('\n');
    throw new Error(message);
  }
}

const compareOperators = [
  // operator, name, alternatives...
  ['==', 'be equal to', 'equal', 'eq', 'eql', '=', '==', '==='],
  ['!=', 'not be equal to', 'ne', '!=', '!==', '<>'],
  ['<', 'be less than', 'lt', '<'],
  ['<=', 'be less than or equal to', 'lte', '<='],
  ['>', 'be greater than', 'lt', '>'],
  ['>=', 'be greater than or equal to', 'lte', '>='],
];

export function assertCompareCondition<T = any>(
  xName: string,
  x: T,
  operator: string,
  y: T,
) {
  const assert = chai.assert;
  const operatorDescriptor =
    compareOperators.find((it) => it.indexOf(operator) >= 0) ||
    compareOperators[0];
  const [op, opName] = operatorDescriptor;
  try {
    switch (op) {
      case '==':
        return assert(x === y);
      case '!=':
        return assert(x !== y);
      case '<':
        return assert(x < y);
      case '<=':
        return assert(x <= y);
      case '>':
        return assert(x > y);
      case '>=':
        return assert(x >= y);
    }
  } catch (error) {
    const message = [
      `${xName} should ${opName}`,
      `  ${JSON.stringify(y)}`,
      `But its actual value is`,
      `  ${JSON.stringify(x)}`,
    ].join('\n');
    throw new Error(message);
  }
}
