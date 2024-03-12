import type { SvelteComponentTyped } from "svelte";
import type { ModalConfigType } from "../modal";
import { panelModalStore } from "./panel-layover/store";

export function openPanelModal<ComponentType extends SvelteComponentTyped>(
  config: ModalConfigType<ComponentType>
) {
  panelModalStore.set(config);
}

// close current open modal if exist
export function closePanelModal() {
  panelModalStore.set(null);
}
