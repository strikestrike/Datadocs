export class Client {
  /** Database names(path) */
  private acquired = new Set<string>();
  /** Last response at */
  private _last = 0;
  constructor(readonly id: string) {}

  set(acquired: string[]) {
    this.acquired = new Set(acquired);
    this._last = Date.now();
  }
  has(dbName: string) {
    return this.acquired.has(dbName);
  }
  get last() {
    return this._last;
  }
  dump() {
    return [this.id, Array.from(this.acquired), this.last];
  }
}

export class ClientMap {
  private readonly map = new Map<string, Client>();
  delete(clientId: string) {
    this.map.delete(clientId);
  }
  get(clientId: string) {
    let client = this.map.get(clientId);
    if (!client) {
      client = new Client(clientId);
      this.map.set(clientId, client);
    }
    return client;
  }
  search(dbName: string): Client[] {
    const result: Client[] = [];
    for (const client of this.map.values())
      if (client.has(dbName)) result.push(client);
    return result;
  }
  dump() {
    return Array.from(this.map.values()).map((it) => it.dump());
  }
}
