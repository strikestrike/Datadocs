import type { GridPrivateProperties } from '../types';

/**
 * Resizes the grid element.
 *
 * Note that it is NOT safe to use without calling the `resizeGrid` method yet
 * (although that is the goal.)
 * @param self
 */
export default function resizeGridElement(self: GridPrivateProperties) {
  /** region set grid rect */
  // We are scaling the grid dimensions with the device pixel ratio
  // because the latter reduces the amount physical pixels with that ratio
  // to a logical one, which we don't want.
  const ratio = self.windowScale,
    rect = self.componentRoot.getBoundingClientRect();

  self.height = Math.floor(rect.height * ratio);
  self.width = Math.floor(rect.width * ratio);
  self.canvasOffsetLeft = self.args.canvasOffsetLeft || 0;
  self.canvasOffsetTop = self.args.canvasOffsetTop || 0;
  /** endregion set grid rect */

  /** region set canvas rect */
  const newWidth = self.width;
  const newHeight = self.height;

  // Set the resolution of the canvas.  Beware that this also sets the CSS
  // height and width of it if they are not present, which we don't want.
  self.canvas.width = newWidth;
  self.canvas.height = newHeight;

  // Canvas is similar to an images displayed on the page. Any
  // disproportional stretching the browser might do to it will make it
  // look blurry, so we set the CSS dimensions based on the resolution
  // so that it is never stretched.
  self.canvas.style.width = newWidth * (1 / ratio) + 'px';
  self.canvas.style.height = newHeight * (1 / ratio) + 'px';
  /** endregion set canvas rect */
}
