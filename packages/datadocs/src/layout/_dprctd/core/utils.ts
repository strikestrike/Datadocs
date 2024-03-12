/**
 * @packageDocumentation
 * @module layout/utils
 */

export function clamp(num, min, max) {
  if (num < min) return min;
  if (num > max) return max;
  return num;
}

export function indexByProperty(array = [], prop, value) {
  return array.findIndex((item) => item[prop] === value);
}

export function indexByObject(array = [], child) {
  return Array.prototype.indexOf.call(array, child);
}

export function removeFromArray(array, item) {
  const index = array.indexOf(item);
  if (index === -1) throw new Error("Unexpected error");
  array.splice(index, 1);
  return index;
}

export function removeFromArrayIndex(array, index) {
  if (index === -1) throw new Error("Unexpected error");
  array.splice(index, 1);
}

export function emptyArray(array) {
  array.splice(0, array.length);
}

export function insertToArray(array, index, item) {
  array.splice(index, 0, item);
}

export function getId() {
  return Math.random().toString(36).slice(2);
}
