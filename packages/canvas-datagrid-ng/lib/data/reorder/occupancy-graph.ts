import BTree from 'sorted-btree';

export class OccupancyGraph {
  private readonly records = new BTree<number, number>();

  get size() {
    return this.records.size;
  }

  add = (start: number, end: number) => {
    const existingFirstPair = this.records.getPairOrNextLower(start);
    const existingLastPair = this.records.getPairOrNextLower(end);
    this.records.deleteRange(start, end, true);
    this.records.set(
      existingFirstPair?.[1] >= start ? existingFirstPair[0] : start,
      existingLastPair?.[1] >= end ? existingLastPair[1] : end,
    );
  };

  entries = this.records.entries.bind(this.records);

  entriesReversed = this.records.entriesReversed.bind(this.records);
}
