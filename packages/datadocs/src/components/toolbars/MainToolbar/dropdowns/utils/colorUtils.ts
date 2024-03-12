export const MAX_HUE_COLOR = 360;
export const MIN_HUE_COLOR = 0;
export const MAX_SATURATION_COLOR = 100;
export const MIN_SATURATION_COLOR = 0;
export const MAX_VALUE_COLOR = 100;
export const MIN_VALUE_COLOR = 0;
export const MAX_OPACITY_COLOR = 1;
export const MIN_OPACITY_COLOR = 0;

const HEX_COLOR_REGEX =
  /^#?(([\dA-Fa-f]{3,4})|([\dA-Fa-f]{6})|([\dA-Fa-f]{8}))$/i;
const RGBA_COLOR_REGEX =
  /^((rgba)|rgb)[\D]+([\d.]+)[\D]+([\d.]+)[\D]+([\d.]+)[\D]*?([\d.]+|$)/i;

export function isHexColor(v: string): boolean {
  return !!HEX_COLOR_REGEX.exec(v);
}

/**
 * Convert a hex color to nomalized form, for example #ffffff -> #FFFFFFFF
 * @param v Hex color string
 * @returns A normalized hex color or null
 */
export function normalizeHexColor(v: string): string {
  if (!isHexColor(v)) return null;

  const match = HEX_COLOR_REGEX.exec(v);

  if (match) {
    let [, hex] = match;
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .split("")
        .map((v) => v + v)
        .join("");
    }
    if (hex.length === 6) {
      hex += "FF";
    }
    return ("#" + hex).toUpperCase();
  }

  return null;
}

function hsvToRgb(h: number, s: number, v: number): number[] {
  h = (h / 360) * 6;
  s /= 100;
  v /= 100;
  const i = Math.floor(h);
  const f = h - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const mod = i % 6;
  const r = [v, q, p, p, t, v][mod];
  const g = [t, v, v, q, p, p][mod];
  const b = [p, p, t, v, v, q][mod];
  return [r * 255, g * 255, b * 255];
}

function rgbToHsv(r: number, g: number, b: number): number[] {
  r /= 255;
  g /= 255;
  b /= 255;
  const minVal = Math.min(r, g, b);
  const maxVal = Math.max(r, g, b);
  const delta = maxVal - minVal;
  let h: number, s: number;
  const v = maxVal;

  if (delta === 0) {
    h = s = 0;
  } else {
    s = delta / maxVal;
    const dr = ((maxVal - r) / 6 + delta / 2) / delta;
    const dg = ((maxVal - g) / 6 + delta / 2) / delta;
    const db = ((maxVal - b) / 6 + delta / 2) / delta;

    if (r === maxVal) {
      h = db - dg;
    } else if (g === maxVal) {
      h = 1 / 3 + dr - db;
    } else if (b === maxVal) {
      h = 2 / 3 + dg - dr;
    }

    if (h < 0) {
      h += 1;
    } else if (h > 1) {
      h -= 1;
    }
  }

  return [h * 360, s * 100, v * 100];
}

export function hexToRgba(hexValue: string): number[] {
  hexValue = normalizeHexColor(hexValue);

  if (hexValue) {
    hexValue = hexValue.substring(1); // remove # character in hex string
    return hexValue.match(/.{2}/g).map((v) => parseInt(v, 16));
  }

  return null;
}

export function hsvaToHex(h: number, s: number, v: number, a: number): string {
  a = a * 255;
  const rgba = [...hsvToRgb(h, s, v), a];
  return (
    "#" + rgba.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")
  ).toUpperCase();
}

export function hexToHsva(hexValue: string): number[] {
  const rgba = hexToRgba(hexValue);

  if (rgba) {
    let [r, g, b, a] = rgba;
    const hsv = rgbToHsv(r, g, b);
    a = a / 255;
    return [...hsv, a];
  }

  return null;
}

export function normalizeValueInRange(v: number, min: number, max: number) {
  if (v >= max) {
    v = max;
  } else if (v <= min) {
    v = min;
  }

  return v;
}

export function hasValue<T>(value: T): boolean {
  return value !== undefined && value !== null;
}

/**
 * convert a color string to hex color
 * @param color a color string of types: hex, hexa, rgb, rgba
 * @returns
 */
export function parseToHex(color: string): string {
  if (isHexColor(color)) return color;
  const returnColorOnError = () => normalizeHexColor("#ffffff");
  const isValid = (v: number) => !isNaN(v) && v >= 0 && v <= 255;

  const match = RGBA_COLOR_REGEX.exec(color);
  if (!match) return returnColorOnError();
  let r = parseInt(match[3]),
    g = parseInt(match[4]),
    b = parseInt(match[5]),
    a = match[6] ? parseFloat(match[6]) : 1;
  a = Math.floor(a * 255);

  if (!isValid(r) || !isValid(g) || !isValid(b) || !isValid(a)) {
    return returnColorOnError();
  }

  return "#" + [r, g, b, a].map((v) => v.toString(16).padStart(2, "0")).join("");
}

/**
 * Transform hex color to rgba color with opacity with opacity
 * @param hexColor The hex color need to be converted
 * @param targetOpacity The final opacity of the color
 */
export function convertHexToRgbaStringWithOpacity(
  hexColor: string,
  targetOpacity: number
): string {
  const rgbaArray = hexToRgba(hexColor);
  if (rgbaArray) {
    const [r, g, b, _] = rgbaArray;
    const a = normalizeValueInRange(targetOpacity, 0, 1);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  } else {
    return null;
  }
}
