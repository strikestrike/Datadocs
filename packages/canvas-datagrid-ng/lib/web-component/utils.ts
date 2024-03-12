/**
 * Dehyphenate the property name
 * @example `"max-width" => "maxWidth"`
 * @example `"--cdg-max-width" => "maxWidth"`
 */
export function dehyphenateProperty(prop: string): string {
  prop = prop.replace('--cdg-', '');
  let p = '';
  let nextLetterCap: boolean;
  Array.prototype.forEach.call(prop, function (char: string) {
    if (nextLetterCap) {
      nextLetterCap = false;
      p += char.toUpperCase();
      return;
    }
    if (char === '-') {
      nextLetterCap = true;
      return;
    }
    p += char;
  });
  return p;
}

/**
 * Hyphenate the property name
 * @param addCustomPrefix Add a custom prefix `--cdg-` at the beginning
 */
export function hyphenateProperty(prop: string, addCustomPrefix?: boolean) {
  var p = '';
  Array.prototype.forEach.call(prop, function (char: string) {
    if (char === char.toUpperCase()) {
      p += '-' + char.toLowerCase();
      return;
    }
    p += char;
  });
  return (addCustomPrefix ? '--cdg-' : '') + p;
}
