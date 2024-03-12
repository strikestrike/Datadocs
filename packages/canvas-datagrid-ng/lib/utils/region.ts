import type { RectangleObject } from '../types/base-structs';

/**
 * Temporary name, for internal usage.
 */
export type _Size = { width: number; height: number };

export function getRectangleSize(rect: RectangleObject): NonNullable<_Size> {
  if (rect && rect.right >= rect.left && rect.bottom >= rect.top) {
    const width = rect.right - rect.left + 1;
    const height = rect.bottom - rect.top + 1;
    if (Number.isSafeInteger(width) && Number.isSafeInteger(height))
      return { width, height };
  }
  return { width: 0, height: 0 };
}

export type FrameIteratorForRegion<T> = (
  frame: RectangleObject & _Size,
  offset: {
    /**
     * The offset between
     * the left side of **the original large region**
     * and
     * the left side of **this frame**
     */
    left: number;
    /**
     * The offset between
     * the top side of **the original large region**
     * and
     * the top side of **this frame**
     */
    top: number;
  },
) => T;

/**
 * This method is used for iterating a large region with the smaller size frame
 * For example:
 * ```
 * iterateLargeRegionWithFrame(
 *  {top: 0, left: 0, bottom: 99, right: 99},
 *  {width: 40, height: 40},
 *  iterator
 * )
 * ```
 * In this example, the iterator will be called 9 times,
 * **from the top to the bottom, from the left to the right**.
 *
 * Eg: `[[0,0], [39,39]]`, `[[0,40], [39,79]]`, `[[0,80], [39,99]]`, `[[40,0], [79,39]]`, ...
 */
export function iterateLargeRegionWithFrame<T>(
  largeRegion: RectangleObject,
  frameSize: _Size,
  iterator: FrameIteratorForRegion<T>,
): void;
export function iterateLargeRegionWithFrame<T>(
  largeRegion: RectangleObject,
  frameSize: _Size,
  iterator: FrameIteratorForRegion<T>,
  async: false,
): void;
export function iterateLargeRegionWithFrame<T>(
  largeRegion: RectangleObject,
  frameSize: _Size,
  iterator: FrameIteratorForRegion<Promise<T>>,
  async: true,
): Promise<void>;

export function iterateLargeRegionWithFrame(
  largeRegion: RectangleObject,
  frameSize: _Size,
  iterator: FrameIteratorForRegion<any>,
  async = false,
): void | Promise<void> {
  const { left, right, top, bottom } = largeRegion;
  const { width, height } = frameSize;

  let frameTop = top;
  let frameLeft = left;

  let offsetTop = 0;
  let offsetLeft = 0;

  let promise: Promise<void>;
  for (; frameTop <= bottom; frameTop += height, offsetTop += height) {
    for (
      frameLeft = left, offsetLeft = 0;
      frameLeft <= right;
      frameLeft += width, offsetLeft += width
    ) {
      const frameRight = Math.min(frameLeft + width - 1, right);
      const frameBottom = Math.min(frameTop + height - 1, bottom);
      const frameWidth = frameRight - frameLeft + 1;
      const frameHeight = frameBottom - frameTop + 1;
      const frame: RectangleObject & _Size = {
        left: frameLeft,
        right: frameRight,
        top: frameTop,
        bottom: frameBottom,
        width: frameWidth,
        height: frameHeight,
      };
      const offset = { top: offsetTop, left: offsetLeft };
      if (async) {
        promise = (promise || Promise.resolve()).then(() =>
          iterator(frame, offset),
        );
        return;
      } else {
        iterator(frame, offset);
      }
    }
  }

  if (promise) return promise;
}
