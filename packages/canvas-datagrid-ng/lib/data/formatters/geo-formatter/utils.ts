import type {
  GeometryCollection,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
} from 'wkx';

export function isPointEmpty(point: Point) {
  const { x, y, z, m } = point;
  return (
    (typeof x !== 'number' || isNaN(x)) &&
    (typeof y !== 'number' || isNaN(y)) &&
    (typeof z !== 'number' || isNaN(z)) &&
    (typeof m !== 'number' || isNaN(m))
  );
}

export function isMultiPointEmpty(multiPoint: MultiPoint) {
  return multiPoint.points.length === 0;
}

export function isLineStringEmpty(lineString: LineString) {
  return lineString.points.length === 0;
}

export function isMultiLineStringEmpty(multiLineString: MultiLineString) {
  return multiLineString.lineStrings.length === 0;
}

export function isPolygonEmpty(polygon: Polygon) {
  return polygon.exteriorRing.length === 0;
}

export function isMultiPolygonEmpty(multiPolygon: MultiPolygon) {
  return multiPolygon.polygons.length === 0;
}

export function isGeometryCollectionEmpty(collection: GeometryCollection) {
  return collection.geometries.length === 0;
}
