import type { ComponentType } from "svelte";
import { type Writable, writable } from "svelte/store";
import type { ModalConfigType } from "../../modal";

export const panelLayoverStore: Writable<ComponentType> = writable(null);
export const panelModalStore: Writable<ModalConfigType<any>> = writable(null);

export function setPanelLayover(element: ComponentType) {
  panelLayoverStore.set(element);
}
