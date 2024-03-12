// The reason why we need this module:
//
// Only one access handle can be created by the Web API `createSyncAccessHandle` on the same file
// at the same time.
//
// This means that each DuckDB database file can be read/write for only one worker/browser tab
// at the same time.
//
// So we created this module to implement a lock mechanism,
// This module provides the frontend with an ability to close access handle to the database file
// when another worker needs to access this database.
//
// The class `LocalDatabaseLock` use `BroadcastChannel` API to implement communication
// between different browser tabs.
//
//

import { ClientMap } from './client-map.js';

type ClientId = string;
type DBName = string;

const enum ChannelMessageType {
  PING = 1,
  PONG = 2,
  ACQUIRING = 4,
  RELEASED = 8,
}
const MessageTypeNames: { [x in ChannelMessageType]: string } = {
  [ChannelMessageType.PING]: 'PING',
  [ChannelMessageType.PONG]: 'PONG',
  [ChannelMessageType.ACQUIRING]: 'ACQUIRING',
  [ChannelMessageType.RELEASED]: 'RELEASED',
};

type ChannelMessage = {
  type: ChannelMessageType;
  client: ClientId;
  acquired: DBName[];
  dbName?: DBName;
  targetClients?: ClientId[];
};

export type LockAcquiringOptions = {
  waitTimeout?: number;
};

export const defaultLockAcquiringOptions: Required<LockAcquiringOptions> = {
  waitTimeout: 10 * 1000,
};

type LoggerFn = (msg: string) => void;

export class LocalDatabaseLock {
  static readonly INIT_WAIT = 1000;
  static readonly defaultLogFn: LoggerFn = (msg: string) => {
    const time = new Date().toJSON().slice(11);
    console.log(`[DBLock] ${time} ${msg}`);
  };

  readonly clientId: ClientId;
  private channel?: BroadcastChannel;
  private acquired = new Set<DBName>();
  private others = new ClientMap();

  // private acquireResolveFn: Array<() => void> = [];
  private log: LoggerFn = LocalDatabaseLock.defaultLogFn;
  private readonly waitInit: Promise<void>;

  constructor(
    readonly releaseImpl: (dbName: DBName) => Promise<void>,
    readonly channelName = 'ddlocaldatabaselock',
  ) {
    this.clientId = crypto.randomUUID();

    const channel = new BroadcastChannel(channelName);
    this.channel = channel;
    channel.addEventListener('message', this.onChannelMessage.bind(this));

    this.waitInit = new Promise<void>((resolve, reject) => {
      try {
        this.log(`init: clientId=${this.clientId}`);
        this.postMessage(ChannelMessageType.PING);
      } catch (error) {
        reject(error);
      }
      setTimeout(resolve, LocalDatabaseLock.INIT_WAIT);
    });
  }

  close() {
    if (!this.channel) return;
    const channel = this.channel;
    this.channel = undefined;
    channel.close();
  }

  bindLogger(logger: LoggerFn) {
    this.log = logger;
  }

  private getChannel(): BroadcastChannel {
    if (!this.channel) throw new Error(`BroadcastChannel has been closed`);
    return this.channel;
  }

  private postMessage(
    type: ChannelMessageType,
    dbName?: string,
    targetClients?: string[],
  ) {
    const msg: ChannelMessage = {
      type,
      client: this.clientId,
      acquired: Array.from(this.acquired),
      dbName,
      targetClients,
    };
    this.getChannel().postMessage(msg);
  }

  private onInvalidMessage(ev: MessageEvent<any>, msg: string) {
    console.warn(
      `BroadcastChannel("${this.channelName}") received an invalid message: ${msg}`,
    );
    console.warn(ev, ev.data);
  }

  private logChannelMessage(msg: ChannelMessage) {
    const { dbName, client, targetClients } = msg;
    const typeStr = MessageTypeNames[msg.type] || String(msg.type);
    let log = `received the message type=${typeStr} client=${client}`;
    if (dbName) log += ` dbName=${dbName}`;
    if (targetClients) {
      if (targetClients.includes(this.clientId)) log += ` (target: me)`;
      else log += ` (target: ${targetClients})`;
    }
    this.log(log);
  }

  private onChannelMessage(event: MessageEvent<ChannelMessage>) {
    const message = event.data;
    if (!message) return;

    const { type, client, acquired, targetClients } = message;
    if (!type) return this.onInvalidMessage(event, '`type` is missing');
    if (!client || typeof client !== 'string')
      return this.onInvalidMessage(event, '`client` is missing');
    if (client === this.clientId) return; // ignore myself
    if (!Array.isArray(acquired))
      return this.onInvalidMessage(event, '`acquired` is not an array');

    let needPong = false;
    if (targetClients && targetClients.includes(this.clientId)) needPong = true;

    const resolve = () => {
      if (needPong) this.postMessage(ChannelMessageType.PONG);
      // const fn = this.acquireResolveFn;
      // while (fn.length > 0) {
      //   try {
      //     fn.pop()();
      //   } catch (error) {
      //     console.error(error);
      //   }
      // }
    };

    this.others.get(client).set(acquired);
    this.logChannelMessage(message);
    switch (type) {
      case ChannelMessageType.PING:
        needPong = true;
        return resolve();
      case ChannelMessageType.ACQUIRING: {
        const { dbName } = message;
        if (!dbName || typeof dbName !== 'string') {
          this.onInvalidMessage(event, '`dbName` is missing');
          return resolve();
        }
        if (!this.acquired.has(dbName)) {
          return resolve();
        }
        this.release(dbName);
      }
    }
    return resolve();
  }

  async acquire(
    dbName: DBName,
    _options?: LockAcquiringOptions,
  ): Promise<boolean> {
    if (this.acquired.has(dbName)) return true;

    const options: Readonly<Required<LockAcquiringOptions>> = _options
      ? Object.assign(_options, defaultLockAcquiringOptions)
      : defaultLockAcquiringOptions;

    if (!this.waitInit) return false;
    await this.waitInit;

    const clients = this.others.search(dbName);
    if (clients.length === 0) {
      this.acquired.add(dbName);
      this.postMessage(ChannelMessageType.PONG);
      this.log(`acquired the database "${dbName}" ...`);
      return true;
    }

    clients.sort((a, b) => b.last - a.last);
    let log = `asking the client "${clients.map((it) => it.id)}"`;
    log += ` to release the database "${dbName}" ...`;
    this.log(log);

    const postedMessageAt = Date.now();
    this.postMessage(
      ChannelMessageType.ACQUIRING,
      dbName,
      clients.map((it) => it.id),
    );

    let rejected = false;
    const timeout = new Promise<never>((resolve, reject) => {
      setTimeout(() => {
        rejected = true;
        const err = new Error(
          `failed to acquire the database "${dbName}": timeout`,
        );
        reject(err);
      }, options.waitTimeout);
    });

    const checkFn = async () => {
      let checkedLost = false;
      while (!rejected) {
        await new Promise<void>((resolve) => setTimeout(resolve, 30));
        const clients = this.others.search(dbName);
        /** check if any client is lost */
        if (!checkedLost && Date.now() > postedMessageAt + 100) {
          checkedLost = true;
          for (const client of clients) {
            if (client.last >= postedMessageAt) continue;
            this.others.delete(client.id);
            this.log(`clean lost client "${client.id}"`);
          }
        }
        if (clients.length <= 0) {
          this.log(`the database "${dbName}" is available for acquiring now`);
          break;
        }
      }
    };

    await Promise.race([timeout, checkFn()]);
    this.acquired.add(dbName);
    this.postMessage(ChannelMessageType.PONG);
    return true;
  }

  async release(dbName: DBName) {
    if (!this.acquired.has(dbName)) return false;
    this.log(`releasing the database "${dbName}" ...`);
    try {
      await this.releaseImpl(dbName);
    } catch (error) {
      const errMsg = String((error as Error)?.message || error);
      console.error(`failed to release the database "${dbName}": ${errMsg}`);
    }
    this.acquired.delete(dbName);
    return this.postMessage(ChannelMessageType.RELEASED, dbName);
  }
}
