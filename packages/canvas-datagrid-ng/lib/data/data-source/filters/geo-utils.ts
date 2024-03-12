import {
  GeometryCollection,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
} from 'wkx';
import type { Geometry } from 'wkx';
import type { GeographyBoundary } from './spec';

export const isPointInGeographyBounds = (
  bounds: GeographyBoundary,
  point: Point,
) => {
  // Sometimes the south-west and north-east longitude may be in reverse,
  // which happens when the start of the boundary is the end of the map,
  // and the end is the start of it.  We don't need to worry about the
  // latitude since the Google Map doesn't repeat the map for latitudes.
  return !(
    (bounds.type === 'rectangle' &&
      ((bounds.ne.lng > bounds.sw.lng &&
        (point.x > bounds.ne.lng || point.x < bounds.sw.lng)) ||
        (bounds.ne.lng < bounds.sw.lng &&
          point.x < bounds.sw.lng &&
          point.x > bounds.ne.lng) ||
        point.y > bounds.ne.lat ||
        point.y < bounds.sw.lat)) ||
    (bounds.type === 'circular' &&
      distanceInMeters(
        bounds.center.lat,
        bounds.center.lng,
        point.y,
        point.x,
      ) >= bounds.distance)
  );
};

export const isAnyPointInGeographyBounds = (
  bounds: GeographyBoundary,
  points: Point[],
) => {
  for (const point of points) {
    if (isPointInGeographyBounds(bounds, point)) return true;
  }
  return false;
};

export const isGeometryInGeographyBounds = (
  bounds: GeographyBoundary,
  geometry: Geometry,
) => {
  if (geometry instanceof Point) {
    return isPointInGeographyBounds(bounds, geometry);
  } else if (geometry instanceof Polygon) {
    return isAnyPointInGeographyBounds(bounds, geometry.exteriorRing);
  } else if (geometry instanceof LineString) {
    return isAnyPointInGeographyBounds(bounds, geometry.points);
  } else if (geometry instanceof MultiLineString) {
    for (const lineString of geometry.lineStrings) {
      if (isAnyPointInGeographyBounds(bounds, lineString.points)) {
        return true;
      }
    }
  } else if (geometry instanceof MultiPolygon) {
    for (const polygon of geometry.polygons) {
      if (isAnyPointInGeographyBounds(bounds, polygon.exteriorRing)) {
        return true;
      }
    }
  } else if (geometry instanceof MultiPoint) {
    for (const point of geometry.points) {
      if (isPointInGeographyBounds(bounds, point)) return true;
    }
  } else if (geometry instanceof GeometryCollection) {
    for (const geo of geometry.geometries) {
      if (isGeometryInGeographyBounds(bounds, geo)) return true;
    }
  }
  return false;
};

/**
 * Calcualate the distance between two points on the map in meters.
 * @param lat1 The latitude of the first point.
 * @param lng1 The longitude of the first point.
 * @param lat2 The latitude of the second point.
 * @param lng2 The longitude of the second point.
 * @returns Distance in meters.
 */
export const distanceInMeters = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) => {
  // Convert degrees to radians
  function toRad(x: number) {
    return (x * Math.PI) / 180;
  }

  // Use the Haversine formula to calculate the distance
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in meters
  return d;
};
