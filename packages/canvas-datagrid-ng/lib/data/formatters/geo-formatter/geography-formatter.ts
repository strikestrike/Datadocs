import { Buffer } from 'buffer';
import type { CellGeographyFormat } from '../../../types/data-format';
import {
  Geometry,
  Point,
  MultiPoint,
  LineString,
  MultiLineString,
  Polygon,
  MultiPolygon,
  GeometryCollection,
} from 'wkx';
import {
  formatPointAsWkt,
  formatMultiPointAsWkt,
  formatLineStringAsWkt,
  formatMultiLineStringAsWkt,
  formatPolygonAsWkt,
  formatMultiPolygonAsWkt,
  formatGeometryCollectionAsWkt,
} from './wkt-formats';
import {
  formatPointAsGeoJson,
  formatMultiPointAsGeoJson,
  formatLineStringAsGeoJson,
  formatMultiLineStringAsGeoJson,
  formatPolygonAsGeoJson,
  formatMultiPolygonAsGeoJson,
  formatGeometryCollectionAsGeoJson,
} from './geoJson-formats';
import { formatPointAsDD, formatPointAsDMS } from './degrees-formats';
import { getGeograpyDefaultFormat } from '../util';

const DEFAULT_GEOGRAPHY_FORMAT = getGeograpyDefaultFormat().format;

export function geographyFormatter(
  data: string | Uint8Array,
  dataFormat?: CellGeographyFormat,
) {
  const format = dataFormat?.format ?? DEFAULT_GEOGRAPHY_FORMAT;
  const isGeoJson = format === 'JSON';
  const geo =
    typeof data === 'string'
      ? Geometry.parse(data)
      : Geometry.parse(Buffer.from(data));
  let result = '';

  if (geo instanceof Point) {
    switch (format) {
      case 'WKT': {
        result = formatPointAsWkt(geo);
        break;
      }
      case 'JSON': {
        result = formatPointAsGeoJson(geo);
        break;
      }
      case 'DD': {
        result = formatPointAsDD(geo);
        break;
      }
      case 'DMS': {
        result = formatPointAsDMS(geo);
        break;
      }
    }
  } else if (geo instanceof MultiPoint) {
    result = isGeoJson
      ? formatMultiPointAsGeoJson(geo)
      : formatMultiPointAsWkt(geo);
  } else if (geo instanceof LineString) {
    result = isGeoJson
      ? formatLineStringAsGeoJson(geo)
      : formatLineStringAsWkt(geo);
  } else if (geo instanceof MultiLineString) {
    result = isGeoJson
      ? formatMultiLineStringAsGeoJson(geo)
      : formatMultiLineStringAsWkt(geo);
  } else if (geo instanceof Polygon) {
    result = isGeoJson ? formatPolygonAsGeoJson(geo) : formatPolygonAsWkt(geo);
  } else if (geo instanceof MultiPolygon) {
    result = isGeoJson
      ? formatMultiPolygonAsGeoJson(geo)
      : formatMultiPolygonAsWkt(geo);
  } else if (geo instanceof GeometryCollection) {
    result = isGeoJson
      ? formatGeometryCollectionAsGeoJson(geo)
      : formatGeometryCollectionAsWkt(geo);
  }
  return result;
}
