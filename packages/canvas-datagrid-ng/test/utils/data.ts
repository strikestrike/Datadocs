const ordA = 'a'.charCodeAt(0);
const ordZ = 'z'.charCodeAt(0);

/**
 * Convert number `n` to 'spreadsheet-style' column label `s`
 * Note: Zero-index, so 0 = A, 27 = AB, etc.
 */
export function itoa(n: number) {
  const len = ordZ - ordA + 1;
  let s = '';
  while (n >= 0) {
    s = String.fromCharCode((n % len) + ordA) + s;
    n = Math.floor(n / len) - 1;
  }
  return s;
}
