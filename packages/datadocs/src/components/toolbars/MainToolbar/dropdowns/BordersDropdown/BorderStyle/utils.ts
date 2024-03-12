import type { BorderStyle } from "../../default";

const borderWidth = 80;
const thinBorder = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${borderWidth}" height="1">
    <line x1="0" y1="0.5" x2="${borderWidth}" y2="0.5" stroke-width="1" stroke="black"></line>
  </svg>
`;
const mediumBorder = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${borderWidth}" height="2">
    <line x1="0" y1="1.0" x2="${borderWidth}" y2="1.0" stroke-width="2" stroke="black"></line>
  </svg>
`;
const thickBorder = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${borderWidth}" height="3">
    <line x1="0" y1="1.5" x2="${borderWidth}" y2="1.5" stroke-width="3" stroke="black"></line>
  </svg>
`;
const dashedBorder = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${borderWidth}" height="1">
    <line x1="0" y1="0.5" x2="${borderWidth}" y2="0.5" stroke-width="1" stroke="black" stroke-dasharray="2"></line>
  </svg>
`;
const dottedBorder = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${borderWidth}" height="1">
    <line x1="0" y1="0.5" x2="${borderWidth}" y2="0.5" stroke-width="1" stroke="black" stroke-dasharray="1"></line>
  </svg>
`;
const doubleBorder = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${borderWidth}" height="3">
    <line x1="0" y1="0.5" x2="${borderWidth}" y2="0.5" stroke-width="1" stroke="black"></line>
    <line x1="0" y1="2.5" x2="${borderWidth}" y2="2.5" stroke-width="1" stroke="black"></line>
  </svg>
`;

export function getBorderStyleSvg(style: BorderStyle) {
  switch (style) {
    case "thin":
      return thinBorder;
    case "medium":
      return mediumBorder;
    case "thick":
      return thickBorder;
    case "dashed":
      return dashedBorder;
    case "dotted":
      return dottedBorder;
    default:
      return doubleBorder;
  }
}
