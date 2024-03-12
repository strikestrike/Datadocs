/**
 * @see https://github.com/WebReflection/html-escaper
 */
export function htmlEscape(value: string): string {
  if (typeof value !== 'string') return value;
  return value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
