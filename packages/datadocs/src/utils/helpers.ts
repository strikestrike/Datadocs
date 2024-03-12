export function expandRange(
  range: Readonly<[number, number]>,
  num: number,
  max?: number,
  min = 0
): [number, number] {
  if (!Array.isArray(range)) return range as any;
  if (typeof num !== "number" || num < 0) num = 0;
  const r: [number, number] = [range[0] - num, range[1] + num];
  if (r[0] < min) r[0] = min;
  if (typeof max === "number") {
    if (max < r[0]) max = r[0];
    if (r[1] > max) r[1] = max;
  }
  return r;
}

type AllowAsyncFunction<T> = (...args: any[]) => Promise<T> | T;

/**
 * Make sure the async function only run one at a time, ignore all
 * other calls while processing
 * @param cb
 * @returns
 */
export function createSingleRunAsync<T>(
  func: AllowAsyncFunction<T>
): AllowAsyncFunction<T> {
  let isRunning = false;

  return async (...args) => {
    if (isRunning) return;
    isRunning = true;

    try {
      const result = func(...args);
      return result instanceof Promise ? await result : result;
    } finally {
      isRunning = false;
    }
  };
}

/**
 * Debounce `func` execution by `delay` ms
 * @param func
 * @param delay
 * @returns
 */
export function createSimpleDebounce<T>(
  func: AllowAsyncFunction<T>,
  delay: number
) {
  let timeoutId: NodeJS.Timeout;

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const immediate = (...args) => {
    cancel();
    func.apply(this, args);
  };

  const debounce = (...args) => {
    cancel();
    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, delay);
  };

  return { debounce, cancel, immediate };
}

// export function uuidv4() {
//   return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
//     var r = (Math.random() * 16) | 0,
//       v = c == "x" ? r : (r & 0x3) | 0x8;
//     return v.toString(16);
//   });
// }

// export function getEmptyImage() {
//   const img = document.createElement("img");
//   img.src =
//     "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
//   return img;
// }

// export function dndLog(dndElement, dndType, eventType) {
//   console.groupCollapsed("DNDLog");
//   console.log(`DND ${dndElement}:${dndType} ON ${eventType}`);
//   console.groupEnd();
// }
