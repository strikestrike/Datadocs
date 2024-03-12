import type { Writable } from "svelte/store";
import { writable } from "svelte/store";
import type { PanelIndex } from "../types";

export function getPanelsStore() {
  /**
   * Index of enabled Panels
   * @type {Writable<PanelIndex>}
   */
  const activePanels: Writable<PanelIndex> = writable({});

  /**
   * Panels enabled/disabled changes
   * @type {Writable<any>}
   */
  const onChange: Writable<any> = writable({});

  return {
    activePanels,
    onChange,
    /**
     * Set active(enabled) Panels.
     * @type Function
     */
    setPanels: (panels: PanelIndex) => {
      activePanels.update(() => panels);
    },
    /**
     * Toggle the status of a Panel
     * @type Function
     */
    togglePanel: (panelName: string, show: boolean) => {
      onChange.update((panelsChange) => {
        if (show) {
          panelsChange.added = panelName;
        } else {
          panelsChange.removed = panelName;
        }
        return panelsChange;
      });
      activePanels.update((panels) => {
        if (show !== true) {
          delete panels[panelName];
        }
        return panels;
      });
    },

    /**
     * Clear changes in the the status of Panels
     * @type Function
     */
    clearPanelChange: () => {
      onChange.update(() => {
        return {};
      });
    },
  };
}
