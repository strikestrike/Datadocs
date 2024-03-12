import { createSvgIconImage } from './utils';

const imageIdMap = {
  'array[]': 'icon__data-type-array-array',
  bytes: 'icon__data-type-binary',
  'bytes[]': 'icon__data-type-binary-array',
  boolean: 'icon__data-type-boolean',
  'boolean[]': 'icon__data-type-boolean-array',
  date: 'icon__data-type-date',
  'date[]': 'icon__data-type-date-array',
  datetime: 'icon__data-type-datetime',
  'datetime[]': 'icon__data-type-datetime-array',
  decimal: 'icon__data-type-decimal',
  'decimal[]': 'icon__data-type-decimal-array',
  float: 'icon__data-type-float',
  'float[]': 'icon__data-type-float-array',
  geography: 'icon__data-type-geography',
  'geography[]': 'icon__data-type-geography-array',
  int: 'icon__data-type-integer',
  'int[]': 'icon__data-type-integer-array',
  interval: 'icon__data-type-interval',
  'interval[]': 'icon__data-type-interval-array',
  json: 'icon__data-type-json',
  'json[]': 'icon__data-type-json-array',
  string: 'icon__data-type-string',
  'string[]': 'icon__data-type-string-array',
  struct: 'icon__data-type-struct',
  'struct[]': 'icon__data-type-struct-array',
  time: 'icon__data-type-time',
  'time[]': 'icon__data-type-time-array',
  timestamp: 'icon__data-type-timestamp',
  'timestamp[]': 'icon__data-type-timestamp-array',
  variant: 'icon__data-type-variant',
  'variant[]': 'icon__data-type-variant-array',
};
const iconData: Record<string, string> = {};
const iconImageCache: Record<string, HTMLImageElement> = {};

function getIconData(type: string) {
  if (iconData[type]) return iconData[type];
  iconData[type] = document.getElementById(imageIdMap[type])?.innerHTML;
  return iconData[type];
}

export function getColumnTypeIconImage(type: string) {
  if (iconImageCache[type]) return iconImageCache[type];
  const svgIcon = getIconData(type) ?? '';
  const image = svgIcon ? createSvgIconImage(svgIcon) : null;
  iconImageCache[type] = image;
  return image;
}

export function initColumnTypeIconImages() {
  for (const type in imageIdMap) {
    getColumnTypeIconImage(type);
  }
}
