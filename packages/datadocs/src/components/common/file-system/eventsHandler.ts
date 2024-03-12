type EventHandler = (event: any) => void;
type EventName =
  | "datachange"
  | "shownodedetails"
  | "rootchange"
  | "sortchange"
  | "rebuild"
  | "refresh"
  | "delete";

export class FileSystemEventHandler {
  events: Partial<Record<EventName, EventHandler[]>> = {};

  addListener = (eventName: EventName, listener: EventHandler) => {
    this.events[eventName] = this.events[eventName] || [];
    this.events[eventName].unshift(listener);
  };

  removeListener = (eventName: EventName, listener: EventHandler) => {
    if (!this.events[eventName]) return;
    this.events[eventName].forEach(function removeEachListener(sfn, idx) {
      if (listener === sfn) {
        this.events[eventName].splice(idx, 1);
      }
    }, this);
  };

  dispatchEvent = (eventName: EventName, event: any) => {
    if (!this.events[eventName]) return;
    this.events[eventName].forEach(function dispatchEachEvent(listener) {
      listener(event);
    });
  };
}
