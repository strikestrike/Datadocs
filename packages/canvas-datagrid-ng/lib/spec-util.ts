import { ok, deepStrictEqual } from 'assert';

export function assertShape<T>(
  objectName: string,
  actual: T,
  shape: Partial<T>,
) {
  Object.keys(shape).forEach((prop) => {
    assertWithName(
      `The property '${prop}' of the ${objectName}`,
      actual?.[prop],
      shape[prop],
    );
  });
}

export function assertWithName<T>(
  objectName: string,
  actual: T,
  expected: Partial<T>,
) {
  const getMessage = (extra?: string) =>
    [
      `${objectName} should deeply equal`,
      `  ${JSON.stringify(expected)}`,
      `But its actual value is`,
      `  ${JSON.stringify(actual)}`,
      extra,
    ]
      .filter((x) => x)
      .join('\n');

  // optimize for the array
  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length)
      throw new Error(
        getMessage(
          `  expected length is ${expected.length}\n` +
            `   actualt length is ${actual.length}`,
        ),
      );
    const baseName = objectName;
    for (let i = 0; i < expected.length; i++) {
      objectName = `${baseName}[${i}]`;
      try {
        deepStrictEqual(actual[i], expected[i]);
      } catch (error) {
        throw new Error(getMessage());
      }
    }
    return;
  }

  try {
    deepStrictEqual(actual, expected);
  } catch (error) {
    throw new Error(getMessage());
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

export function assertCompareCondition(
  xName: string,
  x: any,
  operator: '==' | '!=' | '<' | '>' | '<=' | '>=',
  y: any,
) {
  const operatorDescriptor =
    compareOperators.find((it) => it.indexOf(operator) >= 0) ||
    compareOperators[0];
  const [op, opName] = operatorDescriptor;
  try {
    switch (op) {
      case '==':
        return ok(x === y);
      case '!=':
        return ok(x !== y);
      case '<':
        return ok(x < y);
      case '<=':
        return ok(x <= y);
      case '>':
        return ok(x > y);
      case '>=':
        return ok(x >= y);
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
