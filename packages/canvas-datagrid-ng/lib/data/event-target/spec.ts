export type DataEventBase = {
  name?: string;
  [x: string]: any;
};

export type DataEventListener<EventType = DataEventBase> = (
  event: EventType,
) => any;

/**
 * @version 2023-03-08
 * `DefaultDataEventTarget` is defined in `index.ts`
 */
export interface DataEventTargetInterface<EventType = DataEventBase> {
  addListener(listener: DataEventListener<EventType>): void;
  removeListener(listener: DataEventListener<EventType>): void;
  dispatchEvent(event: EventType, async?: boolean): void;
}
