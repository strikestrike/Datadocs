import type { Writable } from "svelte/store";
import { writable } from "svelte/store";
import type { ModalConfigType } from "./type";
import type { SvelteComponentTyped } from "svelte";

export const modalConfigStore: Writable<ModalConfigType<any>> = writable(null);

export function openModal<ComponentType extends SvelteComponentTyped>(
  config: ModalConfigType<ComponentType>
) {
  modalConfigStore.set(config);
}

// close current open modal if exist
export function closeModal() {
  modalConfigStore.set(null);
}
