import type { Writable } from "svelte/store";
import { writable } from "svelte/store";

export function useToggle(
  defaultValue = false
): [Writable<boolean>, () => void] {
  const sub = writable(defaultValue);
  const toggle = () => sub.update((v) => !v);
  return [sub, toggle];
}
