import type { Readable, Writable } from "svelte/store";
import { writable } from "svelte/store";

export type DisposableReadableOptions<T> = {
  /**
   * Don't call update or dispose on null/undefined values.
   */
  noNullable?: boolean;
  onUpdate?: (newValue: T) => void;
  onDispose?: (lastValue: T) => void;
};

/**
 * A readable for disposing previous values and attaching new ones.
 * @param readable From which to create a new readable.
 * @param options
 * @returns The new readable.
 */
export function disposableReadable<T>(
  readable: Readable<T>,
  options: DisposableReadableOptions<T>
): Readable<T> {
  function canUpdateWith(value: T) {
    return !options.noNullable || (value !== undefined && value !== null);
  }

  return {
    subscribe(run) {
      let previous: T | undefined;
      const mainUnsubscriber = readable.subscribe((value: T) => {
        if (canUpdateWith(previous)) options.onDispose?.(previous);
        if (canUpdateWith(value)) options.onUpdate?.(value);
        run(value);
        previous = value;
      });

      return () => {
        if (canUpdateWith(previous)) options.onDispose?.(previous);
        mainUnsubscriber();
      };
    },
  };
}

/**
 * A writable for tracking properties inside a Svelte component.
 * @param value
 * @param options
 * @returns A writable with update and dispose options.
 */
export function tracker<T>(
  value: T,
  options: DisposableReadableOptions<T>
): Writable<T> {
  const writable_ = writable(value);
  const disposable = disposableReadable(writable_, options);

  return Object.assign(
    {
      set: writable_.set.bind(writable_),
      update: writable_.update.bind(writable_),
    },
    disposable
  );
}
