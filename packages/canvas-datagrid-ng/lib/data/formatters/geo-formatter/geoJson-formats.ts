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
import type { GeographyType } from './constant';
import {
  isPointEmpty,
  isMultiPointEmpty,
  isLineStringEmpty,
  isMultiLineStringEmpty,
  isPolygonEmpty,
  isMultiPolygonEmpty,
  isGeometryCollectionEmpty,
} from './utils';

const geoJsonTypes: Record<GeographyType, string> = {
  Point: 'Point',
  LineString: 'LineString',
  Polygon: 'Polygon',
  MultiPoint: 'MultiPoint',
  MultiLineString: 'MultiLineString',
  MultiPolygon: 'MultiPolygon',
  GeometryCollection: 'GeometryCollection',
};
const SEPARATOR = ', ';
const SPACE = ' ';
const EMPTY_COORDINATES = '[ ]';

export function formatPointAsGeoJson(point: Point) {
  const coordinates = isPointEmpty(point)
    ? EMPTY_COORDINATES
    : getPointCoordinates(point);
  const typeStr = getGeoJsonTypeString(geoJsonTypes.Point);
  const coordinatesStr = getGeoJsonCoordinatesString(coordinates);
  return '{' + SPACE + typeStr + SEPARATOR + coordinatesStr + SPACE + '}';
}

export function formatMultiPointAsGeoJson(multiPoint: MultiPoint) {
  const coordinates = isMultiPointEmpty(multiPoint)
    ? EMPTY_COORDINATES
    : getMultiPointCoordinates(multiPoint.points);
  const typeStr = getGeoJsonTypeString(geoJsonTypes.MultiPoint);
  const coordinatesStr = getGeoJsonCoordinatesString(coordinates);
  return '{' + SPACE + typeStr + SEPARATOR + coordinatesStr + SPACE + '}';
}

export function formatLineStringAsGeoJson(lineString: LineString) {
  const coordinates = isLineStringEmpty(lineString)
    ? EMPTY_COORDINATES
    : getMultiPointCoordinates(lineString.points);
  const typeStr = getGeoJsonTypeString(geoJsonTypes.LineString);
  const coordinatesStr = getGeoJsonCoordinatesString(coordinates);
  return '{' + SPACE + typeStr + SEPARATOR + coordinatesStr + SPACE + '}';
}

export function formatMultiLineStringAsGeoJson(
  multiLineString: MultiLineString,
) {
  let coordinates = '';
  if (isMultiLineStringEmpty(multiLineString)) {
    coordinates = EMPTY_COORDINATES;
  } else {
    coordinates += '[' + SPACE;
    for (let i = 0; i < multiLineString.lineStrings.length; i++) {
      coordinates +=
        getMultiPointCoordinates(multiLineString.lineStrings[i].points) +
        SEPARATOR;
    }
    coordinates = coordinates.slice(0, -SEPARATOR.length);
    coordinates += SPACE + ']';
  }
  const typeStr = getGeoJsonTypeString(geoJsonTypes.MultiLineString);
  const coordinatesStr = getGeoJsonCoordinatesString(coordinates);
  return '{' + SPACE + typeStr + SEPARATOR + coordinatesStr + SPACE + '}';
}

export function formatPolygonAsGeoJson(polygon: Polygon) {
  const coordinates = isPolygonEmpty(polygon)
    ? EMPTY_COORDINATES
    : getPolygonCoordinate(polygon);
  const typeStr = getGeoJsonTypeString(geoJsonTypes.Polygon);
  const coordinatesStr = getGeoJsonCoordinatesString(coordinates);
  return '{' + SPACE + typeStr + SEPARATOR + coordinatesStr + SPACE + '}';
}

export function formatMultiPolygonAsGeoJson(multiPolygon: MultiPolygon) {
  let coordinates = '';
  if (isMultiPolygonEmpty(multiPolygon)) {
    coordinates = EMPTY_COORDINATES;
  } else {
    coordinates += '[' + SPACE;
    for (let i = 0; i < multiPolygon.polygons.length; i++) {
      coordinates += getPolygonCoordinate(multiPolygon.polygons[i]) + SEPARATOR;
    }
    coordinates = coordinates.slice(0, -SEPARATOR.length);
    coordinates += SPACE + ']';
  }
  const typeStr = getGeoJsonTypeString(geoJsonTypes.MultiPolygon);
  const coordinatesStr = getGeoJsonCoordinatesString(coordinates);
  return '{' + SPACE + typeStr + SEPARATOR + coordinatesStr + SPACE + '}';
}

export function formatGeometryCollectionAsGeoJson(
  collection: GeometryCollection,
) {
  let coordinates = '';
  if (isGeometryCollectionEmpty(collection)) {
    coordinates = EMPTY_COORDINATES;
  } else {
    coordinates += '[' + SPACE;
    for (let i = 0; i < collection.geometries.length; i++) {
      coordinates += getGeometryAsGeoJson(collection.geometries[i]) + SEPARATOR;
    }
    coordinates = coordinates.slice(0, -SEPARATOR.length);
    coordinates += SPACE + ']';
  }
  const typeStr = getGeoJsonTypeString(geoJsonTypes.GeometryCollection);
  const coordinatesStr = `"geometries": ${coordinates}`;
  return '{' + SPACE + typeStr + SEPARATOR + coordinatesStr + SPACE + '}';
}

function getGeometryAsGeoJson(geo: Geometry) {
  if (geo instanceof Point) {
    return formatPointAsGeoJson(geo);
  } else if (geo instanceof MultiPoint) {
    return formatMultiPointAsGeoJson(geo);
  } else if (geo instanceof LineString) {
    return formatLineStringAsGeoJson(geo);
  } else if (geo instanceof MultiLineString) {
    return formatMultiLineStringAsGeoJson(geo);
  } else if (geo instanceof Polygon) {
    return formatPolygonAsGeoJson(geo);
  } else if (geo instanceof MultiPolygon) {
    return formatMultiPolygonAsGeoJson(geo);
  } else if (geo instanceof GeometryCollection) {
    return formatGeometryCollectionAsGeoJson(geo);
  }

  return '';
}

function getPointCoordinates(point: Point) {
  let coordinates = point.x + SEPARATOR + point.y;
  if (point.hasZ) coordinates += SEPARATOR + point.z;
  if (point.hasM) coordinates += SEPARATOR + point.m;
  return '[' + coordinates + ']';
}

function getMultiPointCoordinates(points: Point[]) {
  let coordinates = '';
  for (let i = 0; i < points.length; i++) {
    coordinates += getPointCoordinates(points[i]) + SEPARATOR;
  }
  coordinates = coordinates.slice(0, -SEPARATOR.length);
  return '[' + SPACE + coordinates + SPACE + ']';
}

function getPolygonCoordinate(polygon: Polygon) {
  let coordinates = '';
  if (isPolygonEmpty(polygon)) {
    coordinates = EMPTY_COORDINATES;
  } else {
    coordinates += '[' + SPACE;
    coordinates += getMultiPointCoordinates(polygon.exteriorRing);
    let interiorRingsStr = '';
    for (let i = 0; i < polygon.interiorRings.length; i++) {
      interiorRingsStr +=
        getMultiPointCoordinates(polygon.interiorRings[i]) + SEPARATOR;
    }
    interiorRingsStr = interiorRingsStr.slice(0, -SEPARATOR.length);
    if (interiorRingsStr) {
      coordinates += SEPARATOR + interiorRingsStr;
    }
    coordinates += SPACE + ']';
  }
  return coordinates;
}

function getGeoJsonTypeString(type: string) {
  return `"type": "${type}"`;
}

function getGeoJsonCoordinatesString(coordinate: string) {
  return `"coordinates": ${coordinate}`;
}
