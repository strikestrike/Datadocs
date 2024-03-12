import type {
  DataEventBase,
  DataEventListener,
  DataEventTargetInterface,
} from './spec';

export class DefaultDataEventTarget<EventType = DataEventBase>
  implements DataEventTargetInterface<EventType>
{
  private _listeners = new Set<DataEventListener>();

  /** @override */
  addListener = (listener: DataEventListener<EventType>) => {
    if (this._listeners.has(listener)) return;
    this._listeners.add(listener);
  };

  /** @override */
  removeListener = (listener: DataEventListener<EventType>) => {
    this._listeners.delete(listener);
  };

  /** @override */
  dispatchEvent = (event: EventType, async = false) => {
    if (async)
      return setTimeout(this.dispatchEvent.bind(this, event, false), 0);
    this._listeners.forEach((fn) => fn(event));
  };
}
