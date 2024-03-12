import type TreeViewStateManager from "./tree-view-state-manager";
import type { Writable } from "svelte/store";
import { writable, get } from "svelte/store";
import type { DBTable } from "../type";

type EventHandler = (event: Event) => void;

export type SourcesPanelActiveTableEvent = Event & {
  activeTable?: DBTable;
};

class TreeGroupManager {
  treeGroupMap: Map<string, TreeViewStateManager> = new Map();
  listTreeViewManagerStore: Writable<TreeViewStateManager[]>;

  constructor(managers: TreeViewStateManager[]) {
    this.listTreeViewManagerStore = writable([...managers]);

    // create group map and set group manager to all tree view
    this.listTreeViewManager.forEach((m) => {
      this.treeGroupMap.set(m.id, m);
      m.setTreeGroupManager(this);
    }, this);
  }

  get listTreeViewManager() {
    return get(this.listTreeViewManagerStore);
  }

  get isSelected() {
    return this.listTreeViewManager.map((t) => t.isSelected).some((v) => v);
  }

  deselectAllComponents() {
    this.listTreeViewManager.forEach((m) => m.deselectComponent());
  }

  addNewTreeView(manager: TreeViewStateManager) {
    this.treeGroupMap.set(manager.id, manager);
    manager.setTreeGroupManager(this);
    this.listTreeViewManagerStore.update((managers) => [...managers, manager]);
  }

  removeTreeView(id: string) {
    if (!this.treeGroupMap.has(id)) return;
    this.treeGroupMap.delete(id);
    const managers = this.listTreeViewManager.filter((m) => m.id !== id);
    this.listTreeViewManagerStore.set(managers);
  }

  // Function for event handler
  events: { [eventName: string]: any[] } = {};
  /**
   * Adds an event listener to the given event.
   * @memberof TreeViewStateManager
   * @name addEventListener
   * @method
   * @param {string} ev The name of the event to subscribe to.
   * @param {function} fn The event procedure to execute when the event is raised.
   */
  addEventListener = (ev: string, fn: EventHandler) => {
    this.events[ev] = this.events[ev] || [];
    this.events[ev].unshift(fn);
  };

  /**
   * Removes the given listener function from the given event.  Must be an actual reference to the function that was bound.
   * @memberof TreeViewStateManager
   * @name removeEventListener
   * @method
   * @param {string} ev The name of the event to unsubscribe from.
   * @param {function} fn The event procedure to execute when the event is raised.
   */
  removeEventListener = (ev: string, fn: EventHandler) => {
    const self = this;
    (self.events[ev] || []).forEach(function removeEachListener(sfn, idx) {
      if (fn === sfn) {
        self.events[ev].splice(idx, 1);
      }
    });
  };

  /**
   * Fires the given event, passing an event object to the event subscribers.
   * @memberof TreeViewStateManager
   * @name dispatchEvent
   * @method
   * @param eventName The name of the event to dispatch.
   * @param e The event object.
   */
  dispatchEvent = (eventName: string, e: any) => {
    let defaultPrevented: boolean;
    function preventDefault() {
      defaultPrevented = true;
    }

    const self = this;
    if (!self.events[eventName]) return;
    self.events[eventName].forEach(function dispatchEachEvent(fn) {
      e.preventDefault = preventDefault;
      fn.apply(undefined, [e]);
    });
    return defaultPrevented;
  };
}

export default TreeGroupManager;
