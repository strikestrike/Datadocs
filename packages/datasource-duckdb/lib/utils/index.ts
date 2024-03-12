import type { Table, RecordBatch } from 'apache-arrow';

export function getObjectsFromQueryResult<T = any>(
  result: Table<any> | RecordBatch<any>[],
): T[] {
  if (result === null || result === undefined) return;

  const rows: T[] = [];
  if (typeof (result as RecordBatch<any>[]).length === 'number') {
    const recordBatch = result as RecordBatch<any>[];
    for (let i = 0; i < recordBatch.length; i++) {
      const record = recordBatch[i];
      const numRows = record.numRows;
      for (let j = 0; j < numRows; j++)
        rows.push(record.get(j).toJSON() as any);
    }
  } else {
    const table = result as Table;
    const numRows = table.numRows;
    for (let i = 0; i < numRows; i++) rows.push(table.get(i).toJSON() as any);
  }
  return rows;
}

export function expandRowsRange(
  range: Readonly<[number, number]>,
  num: number,
  max?: number,
  min = 0,
): [number, number] {
  if (!Array.isArray(range)) return range as any;
  if (typeof num !== 'number' || num < 0) num = 0;
  const r: [number, number] = [range[0] - num, range[1] + num];
  if (r[0] < min) r[0] = min;
  if (typeof max === 'number') {
    if (max < r[0]) max = r[0];
    if (r[1] > max) r[1] = max;
  }
  return r;
}

export class Tick {
  private last = performance.now();
  private logs: string[];
  constructor(private readonly name = '') {}
  readonly pipe = (array: string[]) => {
    this.logs = array;
  };
  readonly tick = (action?: string) => {
    if (action) {
      const ms = performance.now() - this.last;
      if (this.name) action = `${this.name} ${action}`;
      const log = `${action}: ${ms.toFixed(2)}ms`;
      if (this.logs) this.logs.push(log);
      else console.log(log);
    }
    this.last = performance.now();
  };
}

export function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
