import type { Point } from 'wkx';

const NAN_STRING = NaN.toString();
const SEPARATOR = ', ';

export function formatPointAsDD(point: Point) {
  const longitudeStr = isCoordinateInvalid(point.x)
    ? NAN_STRING
    : String(point.x);
  const latitudeStr = isCoordinateInvalid(point.y)
    ? NAN_STRING
    : String(point.y);
  return latitudeStr + SEPARATOR + longitudeStr;
}

export function formatPointAsDMS(point: Point) {
  const longitudeStr = longitudeToDMS(point.x);
  const latitudeStr = latitudeToDMS(point.y);
  return latitudeStr + SEPARATOR + longitudeStr;
}

function latitudeToDMS(latitude: number) {
  if (isCoordinateInvalid(latitude)) {
    return NAN_STRING;
  }
  const direction = latitude >= 0 ? 'N' : 'S';
  latitude = Math.abs(latitude);
  return getDMS(latitude, direction);
}

function longitudeToDMS(longitude: number) {
  if (isCoordinateInvalid(longitude)) {
    return NAN_STRING;
  }
  const direction = longitude >= 0 ? 'E' : 'W';
  longitude = Math.abs(longitude);
  return getDMS(longitude, direction);
}

function getDMS(value: number, direction: string) {
  const degrees = Math.floor(value);
  const minutes = Math.floor((value - degrees) * 60);
  let seconds = (value * 3600 - degrees * 3600 - minutes * 60).toFixed(1);
  seconds = String(parseFloat(seconds));
  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

function isCoordinateInvalid(value: number) {
  return typeof value !== 'number' || isNaN(value);
}
