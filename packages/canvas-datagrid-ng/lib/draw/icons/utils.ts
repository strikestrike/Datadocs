export function createSvgIconImage(
  svgIcon: string,
  width?: number,
  height?: number,
): HTMLImageElement {
  const image = new Image();
  image.width = width ?? 100;
  image.height = height ?? 100;
  image.src = 'data:image/svg+xml;base64,' + btoa(svgIcon);
  return image;
}
