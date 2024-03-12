export class EditCellDescriptor {
  readonly data: any;
  readonly style?: any;
  readonly location: string;

  constructor(
    readonly row: number,
    readonly column: string,
    edit: {
      data: any;
      style?: any;
    },
  ) {
    this.location = this.row + '-' + this.column;
    this.data = edit.data;
    this.style = edit.style;
  }
}

export class ResolvedEditDescriptor {
  readonly edits: EditCellDescriptor[] = [];
  constructor(
    readonly blockId: string,
    readonly isNewBlock: boolean,
    readonly row: number,
  ) {}
}

export class EditCellsQueue {
  items: EditCellDescriptor[];
  map = new Map<string, number>();

  readonly init = () => {
    if (this.items) return;
    this.items = [];
    this.map = new Map();
  };

  readonly push = (edit: EditCellDescriptor) => {
    const existed = this.map.get(edit.location);
    if (typeof existed === 'number') this.items.splice(existed, 1);
    this.map.set(edit.location, this.items.length);
    this.items.push(edit);
  };

  readonly clean = () => {
    delete this.items;
    delete this.map;
  };
}
