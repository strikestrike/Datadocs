import type { Geometry } from 'wkx';
import {
  Point,
  MultiPoint,
  LineString,
  MultiLineString,
  Polygon,
  MultiPolygon,
  GeometryCollection,
} from 'wkx';
import {
  isPointEmpty,
  isMultiPointEmpty,
  isLineStringEmpty,
  isMultiLineStringEmpty,
  isPolygonEmpty,
  isMultiPolygonEmpty,
  isGeometryCollectionEmpty,
} from './utils';
import type { GeographyType } from './constant';

const WktTypes: Record<GeographyType, string> = {
  Point: 'POINT',
  LineString: 'LINESTRING',
  Polygon: 'POLYGON',
  MultiPoint: 'MULTIPOINT',
  MultiLineString: 'MULTILINESTRING',
  MultiPolygon: 'MULTIPOLYGON',
  GeometryCollection: 'GEOMETRYCOLLECTION',
};
const SEPARATOR = ', ';

export function formatPointAsWkt(point: Point) {
  if (isPointEmpty(point)) {
    return getWktType(point, 'Point', true);
  }
  return (
    getWktType(point, 'Point', false) + '(' + getWktCoordinate(point) + ')'
  );
}

export function formatMultiPointAsWkt(multiPoint: MultiPoint) {
  if (isMultiPointEmpty(multiPoint)) {
    return getWktType(multiPoint, 'MultiPoint', true);
  }
  return (
    getWktType(multiPoint, 'MultiPoint', false) +
    '(' +
    getPointListCoordinate(multiPoint.points) +
    ')'
  );
}

export function formatLineStringAsWkt(lineString: LineString) {
  if (isLineStringEmpty(lineString)) {
    return getWktType(lineString, 'LineString', true);
  }
  return (
    getWktType(lineString, 'LineString', false) +
    '(' +
    getPointListCoordinate(lineString.points) +
    ')'
  );
}

export function formatMultiLineStringAsWkt(multiLineString: MultiLineString) {
  const lineStrings = multiLineString.lineStrings;
  if (isMultiLineStringEmpty(multiLineString)) {
    return getWktType(multiLineString, 'MultiLineString', true);
  }

  let wkt = getWktType(multiLineString, 'MultiLineString', false) + '(';
  for (let i = 0; i < lineStrings.length; i++) {
    wkt +=
      '(' + getPointListCoordinate(lineStrings[i].points) + ')' + SEPARATOR;
  }
  return wkt.slice(0, -SEPARATOR.length) + ')';
}

export function formatPolygonAsWkt(polygon: Polygon) {
  if (isPolygonEmpty(polygon)) {
    return getWktType(polygon, 'Polygon', true);
  }
  return (
    getWktType(polygon, 'Polygon', false) +
    '(' +
    getPolygonCoordinate(polygon) +
    ')'
  );
}

export function formatMultiPolygonAsWkt(multiPolygon: MultiPolygon) {
  const polygons = multiPolygon.polygons;
  if (isMultiPolygonEmpty(multiPolygon)) {
    return getWktType(multiPolygon, 'MultiPolygon', true);
  }
  let coordinates = '';
  for (let i = 0; i < polygons.length; i++) {
    coordinates += '(' + getPolygonCoordinate(polygons[i]) + ')' + SEPARATOR;
  }
  coordinates = coordinates.slice(0, -SEPARATOR.length);
  return (
    getWktType(multiPolygon, 'MultiPolygon', false) + '(' + coordinates + ')'
  );
}

export function formatGeometryCollectionAsWkt(collection: GeometryCollection) {
  const geometries = collection.geometries;
  if (isGeometryCollectionEmpty(collection)) {
    return getWktType(collection, 'GeometryCollection', true);
  }

  let coordinates = '';
  for (let i = 0; i < geometries.length; i++) {
    coordinates += getGeometryAsWkt(geometries[i]) + SEPARATOR;
  }
  coordinates = coordinates.slice(0, -SEPARATOR.length);
  return (
    getWktType(collection, 'GeometryCollection', false) +
    '(' +
    coordinates +
    ')'
  );
}

function getGeometryAsWkt(geo: Geometry) {
  if (geo instanceof Point) {
    return formatPointAsWkt(geo);
  } else if (geo instanceof MultiPoint) {
    return formatMultiPointAsWkt(geo);
  } else if (geo instanceof LineString) {
    return formatLineStringAsWkt(geo);
  } else if (geo instanceof MultiLineString) {
    return formatMultiLineStringAsWkt(geo);
  } else if (geo instanceof Polygon) {
    return formatPolygonAsWkt(geo);
  } else if (geo instanceof MultiPolygon) {
    return formatMultiPolygonAsWkt(geo);
  } else if (geo instanceof GeometryCollection) {
    return formatGeometryCollectionAsWkt(geo);
  }

  return '';
}

function getWktType(geo: Geometry, type: GeographyType, isEmpty: boolean) {
  let wkt = WktTypes[type];
  if (geo.hasZ && geo.hasM) wkt += ' ZM ';
  else if (geo.hasZ) wkt += ' Z ';
  else if (geo.hasM) wkt += ' M ';

  if (isEmpty && !geo.hasZ && !geo.hasM) wkt += ' ';
  if (isEmpty) wkt += 'EMPTY';

  return wkt;
}

function getWktCoordinate(point: Point) {
  let coordinates = point.x + ' ' + point.y;
  if (point.hasZ) coordinates += ' ' + point.z;
  if (point.hasM) coordinates += ' ' + point.m;

  return coordinates;
}

function getPointListCoordinate(points: Point[]) {
  let coordinates = '';
  for (let i = 0; i < points.length; i++) {
    coordinates += getWktCoordinate(points[i]) + SEPARATOR;
  }
  return coordinates.slice(0, -SEPARATOR.length);
}

function getPolygonCoordinate(polygon: Polygon) {
  const exteriorRingStr =
    '(' + getPointListCoordinate(polygon.exteriorRing) + ')';
  let interiorRingsStr = '';
  for (let i = 0; i < polygon.interiorRings.length; i++) {
    interiorRingsStr +=
      '(' + getPointListCoordinate(polygon.interiorRings[i]) + ')' + SEPARATOR;
  }
  interiorRingsStr = interiorRingsStr.slice(0, -SEPARATOR.length);

  let wkt = exteriorRingStr;
  if (interiorRingsStr) {
    wkt += SEPARATOR + interiorRingsStr;
  }
  return wkt;
}
