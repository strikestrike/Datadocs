export type QueryKey = string | number | boolean | null | QueryObjectKey;
type QueryObjectKey = {
  [key: string]: QueryKey;
};

type QueryData = {
  key: string;
  queryResult: Promise<{ data: any; error: any }>;
};

function getSerializedQueryKey(key: QueryKey): string {
  if (!key || typeof key !== "object") {
    return String(key);
  } else {
    const sortedProps = Object.keys(key).sort();
    let serializedKey = "{";
    for (const prop of sortedProps) {
      const value = getSerializedQueryKey(key[prop]);
      serializedKey += `${prop}: ${value},`;
    }
    serializedKey += "}";
    return serializedKey;
  }
}

export class QueryManager {
  private fetchMap: Map<string, QueryData> = new Map();

  /**
   * Wrapper for quering data
   *
   * Group same queries into one. If the ui part accidentally call
   * a query multiple times, we only do one call to the server.
   * @param key
   * @param action
   * @returns
   */
  async execute(key: QueryKey, action: () => Promise<any>) {
    const serializedKey = getSerializedQueryKey(key);
    if (!this.fetchMap.has(serializedKey)) {
      const getQueryResult = async () => {
        let data: any = null;
        let error: any = null;
        try {
          data = await action();
        } catch (err) {
          error = err;
        }

        this.fetchMap.delete(serializedKey);
        return { data, error };
      };

      this.fetchMap.set(serializedKey, {
        key: serializedKey,
        queryResult: getQueryResult(),
      });
    } else {
      console.warn("Call similar queries", serializedKey);
    }

    return this.fetchMap.get(serializedKey).queryResult;
  }
}
