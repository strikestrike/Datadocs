import { stringToPath } from './string-to-path';

const reInt = /^(?:0|[1-9]\d*)$/;
const hasOwnProperty = Object.prototype.hasOwnProperty;

// const test: any = {};
// updateObject(test, 'a.0.0.b.1', true);
// console.log(test.a[0][0].b[1] === true);

export const DeleteValue = Symbol('DeleteValue');
export function updateObject(object: any, stringPath: string, value: any) {
  if (!isObject(object)) {
    return object;
  }

  const path = stringToPath(stringPath);
  const length = path.length;
  const lastIndex = length - 1;

  let index = -1;
  let nested = object;

  while (nested != null && ++index < length) {
    const key = path[index];
    let newValue = value;

    if (index != lastIndex) {
      const objValue = nested[key];
      newValue = isObject(objValue)
        ? objValue
        : reInt.test(path[index + 1])
        ? []
        : {};
    }
    assignValue(nested, key, newValue);
    nested = nested[key];
  }
  return object;
}

// eslint-disable-next-line @typescript-eslint/ban-types
function isObject(obj: any): obj is Object {
  if (obj === null || obj === undefined) return false;
  const type = typeof obj;
  return type === 'object' || type === 'function';
}

function assignValue(object: any, key: string, value: any) {
  // simplify to ignore this key
  if (key === '__proto__') return;
  if (value === DeleteValue) {
    delete object[key];
    return;
  }

  const objValue = object[key];
  if (!(hasOwnProperty.call(object, key) && eq(objValue, value))) {
    if (value !== 0 || 1 / value === 1 / objValue) {
      object[key] = value;
    }
  } else if (value === undefined && !(key in object)) {
    object[key] = value;
  }
}
function eq(value: any, other: any) {
  return (
    value === other ||
    // for NaN
    (value !== value && other !== other)
  );
}
