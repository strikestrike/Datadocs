import { FirestoreDebugLogger } from './debug-logger';
import { DefaultDataEventTarget } from '../../../event-target';

const console = new FirestoreDebugLogger('network-status');

export type NetworkStatusEvent = {
  name: 'network';
  online: boolean;
};
export type NetworkStatusListener = (event: NetworkStatusEvent) => any;

export class NetworkStatus {
  private static instance: NetworkStatus;
  static get() {
    if (!NetworkStatus.instance) NetworkStatus.instance = new NetworkStatus();
    return NetworkStatus.instance;
  }

  private _online: boolean;
  private _forceOffline = false;

  private listeners = new DefaultDataEventTarget();
  readonly addListener = (listener: NetworkStatusListener) =>
    this.listeners.addListener(listener);
  readonly removeListener = (listener: NetworkStatusListener) =>
    this.listeners.removeListener(listener);

  get online() {
    return this._forceOffline ? false : this._online;
  }

  private set online(_online: boolean) {
    const prevOnline = this.online;
    this._online = _online;
    console.log(_online ? 'online' : `offline`);
    const currOnline = this.online;
    if (prevOnline !== currOnline) {
      const event: NetworkStatusEvent = {
        name: 'network',
        online: currOnline,
      };
      this.listeners.dispatchEvent(event);
    }
  }

  readonly forceOffline = (enabled?: boolean) => {
    if (enabled === undefined || enabled === null) enabled = true;
    if (enabled) console.log(`forced offline`);
    const prevOnline = this.online;
    this._forceOffline = enabled;
    const currOnline = this.online;
    if (prevOnline !== currOnline) {
      const event: NetworkStatusEvent = {
        name: 'network',
        online: currOnline,
      };
      this.listeners.dispatchEvent(event);
    }
  };

  constructor() {
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.onLine === 'boolean'
    ) {
      this._online = navigator.onLine;
    } else {
      // we assume the initial status is online
      this._online = true;
    }

    /** https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/effectiveType */
    const log = [
      `effectiveType: ${navigator['connection']?.['effectiveType']}`,
      `online: ${this._online}`,
    ].join(' ');
    console.log(log);

    window.addEventListener('online', () => {
      this.online = true;
    });
    window.addEventListener('offline', () => {
      this.online = false;
    });
  }
}
