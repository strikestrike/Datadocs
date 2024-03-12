import { Geometry } from 'wkx';

export function getGeographyData(geoStr: string) {
  return Geometry.parse(geoStr).toWkb();
}

export function getDateObject(dateStr: string, utc = true) {
  if (utc) dateStr += ' UTC';
  return new Date(dateStr);
}
