import type {
  AddRowsLoadingTask,
  RowsLoaderForQueue,
  RowsLoadingQueueOptions,
  RowsLoadingTask,
} from './types';

type ExclusiveRange = [number, number, unknown?];

export class RowsLoadingQueue {
  static DEFAULT_LOADER: RowsLoaderForQueue = {
    transformRange: (range) => range,
    load: () => Promise.resolve(),
  };
  static DEFAULT_OPTIONS: RowsLoadingQueueOptions = {
    maxRows: 200,
    parallel: 2,
    fifo: true,
    throttle: 50,
    timeout: 300,
  };

  idIncr = 0;
  /** the result of the `setTimeout` */
  timer: any;
  working = 0;

  loader: RowsLoaderForQueue;
  opts: RowsLoadingQueueOptions;
  queue: RowsLoadingTask[] = [];
  get length() {
    return this.queue.length;
  }

  constructor(
    loader: Partial<RowsLoaderForQueue>,
    opts?: Partial<RowsLoadingQueueOptions>,
  ) {
    this.loader = { ...RowsLoadingQueue.DEFAULT_LOADER, ...loader };
    this.opts = { ...RowsLoadingQueue.DEFAULT_OPTIONS };
    if (opts) Object.assign(this.opts, opts);
  }

  readonly add = <MetaType = any>(
    task: AddRowsLoadingTask<MetaType>,
  ): RowsLoadingTask<MetaType> => {
    this.normalizeRange(task.range);
    const timeout =
      typeof task.timeout === 'number' ? task.timeout : this.opts.timeout;

    const mergedTask = this.tryToMergeTask(task.range);
    const exp = Date.now() + timeout;
    if (mergedTask) {
      mergedTask.meta = task.meta;
      mergedTask.exp = exp;
      this.initTimer();
      return mergedTask;
    }

    const newTask: RowsLoadingTask<any> = {
      id: ++this.idIncr,
      range: task.range,
      meta: task.meta,
      exp: Date.now() + timeout,
      waiting: true,
      cancellable: true,
    };
    this.queue.push(newTask);
    this.initTimer();
    return newTask;
  };

  readonly cancel = (taskId: number) => {
    for (let i = 0; i < this.queue.length; i++) {
      const task = this.queue[i];
      if (task.id !== taskId) continue;
      if (!task.cancellable || task.end) return false;
      task.end = 'cancelled';
      return true;
    }
    return false;
  };

  //
  //#region private methods
  //
  private initTimer = () => {
    if (this.timer || this.queue.length === 0) return;
    this.timer = setTimeout(this.onTick, this.opts.throttle);
  };

  private tryToMergeTask = (newRange: Readonly<ExclusiveRange>) => {
    const { queue } = this;
    if (queue.length === 0) return;
    let lastTask = queue[queue.length - 1];
    while (lastTask?.end) {
      queue.pop();
      lastTask = queue[queue.length - 1];
    }
    if (!lastTask) return;

    const [lastLow, lastHigh] = lastTask.range;
    const [low, high] = newRange;
    /** @todo put this const into the config */
    const minGap = 2;
    // check if these two ranges are not closed
    if (lastHigh < low - minGap - 1) return;
    if (lastLow > high + minGap + 1) return;
    const newLow = Math.min(low, lastLow);
    const newHigh = Math.max(high, lastHigh);
    const newSize = newHigh - newLow + 1;
    if (newSize > this.opts.maxRows) return;
    lastTask.range = [newLow, newHigh];
    return lastTask;
  };

  private takeQueueItems = (count: number) => {
    const now = Date.now();
    const result: RowsLoadingTask[] = [];
    const { queue, opts } = this;
    let getItemFn: () => RowsLoadingTask<number> = opts.fifo
      ? queue.pop
      : queue.shift;
    getItemFn = getItemFn.bind(queue);
    while (count > 0 && this.queue.length > 0) {
      const item = getItemFn();
      if (item.end) continue;
      if (now > item.exp) continue;
      result.push(item);
      count--;
    }
    return result;
  };

  private onTick = async () => {
    delete this.timer;
    const currWorking = this.working;
    if (currWorking >= this.opts.parallel) return;

    const debug = this.opts.debug;

    let items: RowsLoadingTask[];
    let addedWorking = 0;
    try {
      items = this.takeQueueItems(1);
      if (items.length === 0) return;
      if (debug)
        console.log(
          `onTick for ${items.length} items, rested items: ${this.length}`,
        );

      const promise = this.load(items);
      addedWorking = this.working - currWorking;
      await promise;
    } catch (error) {
      console.error(`load(${items?.length} items) failed: `, error);
    }
    this.working -= addedWorking;
    if (this.working < 0) this.working = 0;
    this.initTimer();
  };

  private load = async (items: RowsLoadingTask[]) => {
    const { loader } = this;
    const promises: Promise<void>[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      item.cancellable = false;
      item.waiting = false;

      let { id, range } = item;
      range = loader.transformRange(range);
      if (!range) continue;

      this.working++;
      console.log(
        `fetching for rows [${range.join(', ')}] virtually for the task ${id}`,
      );
      promises.push(loader.load(range));
    }
    return await Promise.all(promises);
  };

  private readonly normalizeRange = (range: ExclusiveRange): ExclusiveRange => {
    const diff = this.opts.maxRows - 1;
    if (range[0] < 0) range[0] = 0;
    if (range[1] < range[0]) range[1] = range[0];
    if (range[1] - range[0] > diff) range[1] = range[0] + diff;
    return range;
  };
  //
  //#endregion private methods
  //
}
