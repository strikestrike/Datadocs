import type { Readable } from "svelte/store";

/**
 * A readable that checks the difference between the previous and the new value,
 * and only updates when there is a change.
 * @param readable The base readable.
 * @param diffUtil That checks if the values are the same and returns true when
 *  they are.
 */
export function uniqueReadable<T>(
  readable: Readable<T>,
  diffUtil?: (previous: T | undefined, value: T) => boolean
): Readable<T> {
  return {
    subscribe(run) {
      let previous: T | undefined;
      return readable.subscribe((value: T) => {
        if ((diffUtil && diffUtil(previous, value)) || previous != value) {
          run(value);
          previous = value;
        }
      });
    },
  };
}
