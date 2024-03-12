import type { Subscriber } from "svelte/store";
import { writable } from "svelte/store";

const storagePrefix = "datadocs-pw-";

export function getStorageKey(key: string, version = 1) {
  return `${storagePrefix}${key}-v${version}`;
}

/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 *
 * And initialize its value from the local storage if there is existed saved value.
 * Also save its value into the local storage after its value be changed.
 */
export function permanentWritable<T = any>(
  storageKey: string,
  ...args: Parameters<typeof writable<T>>
) {
  try {
    const permanentValue = localStorage.getItem(storageKey);
    if (permanentValue) args[0] = JSON.parse(permanentValue);
  } catch (error) {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error(error);
    }
  }

  const slot = writable(...args);
  slot.subscribe(createSubscriberForPermanentWritable(storageKey));
  return slot;
}

function createSubscriberForPermanentWritable(storageKey: string) {
  const sub: Subscriber<unknown> = (value) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
      console.log("updated permanent slot:", storageKey);
    } catch (error) {
      console.error(error);
    }
  };
  return sub;
}
