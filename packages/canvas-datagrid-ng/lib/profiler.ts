export type HistoryInfo = {
  /** from `performance.now()`, its unit is milliseconds */
  tick: number;
  /** time consuming: `performance.now() - this.tick` */
  tc?: number;
};

export class ProfileStatistics {
  count = 0;
  max = 0;
  avg = 0;
  min = Infinity;

  add = (time: number) => {
    if (time > this.max) this.max = time;
    if (time < this.min) this.min = time;
    this.avg = (this.avg * this.count + time) / (this.count + 1);
    this.count++;
  };
}

export type ProfilerListener = (profier: GridProfiler) => void;

export class GridProfiler {
  static maxHistory = 1000;

  draw = new ProfileStatistics();
  drawHistory: HistoryInfo[] = [];
  timing: { [key: string]: number } = {};
  timingResults: { [key: string]: number } = {};

  private _listener: ProfilerListener;
  set listener(listener: { innerText: string } | ProfilerListener) {
    if (typeof listener === 'function') {
      this._listener = listener;
      return;
    }
    if ('innerText' in listener) {
      this._listener = (profiler) =>
        (listener.innerText = profiler.getSummaryText());
      return;
    }
  }

  startDraw = () => {
    this.drawHistory.push({ tick: performance.now() });
  };
  endDraw = () => {
    const lastIndex = this.drawHistory.length - 1;
    const context = this.drawHistory[lastIndex];
    const tc = performance.now() - context.tick;
    context.tc = tc;
    this.draw.add(tc);
    if (this.drawHistory.length > GridProfiler.maxHistory * 2)
      this.drawHistory = this.drawHistory.slice(-GridProfiler.maxHistory);
    if (this._listener) setTimeout(this._listener, 0, this);
  };

  startTiming = (name: string) => {
    this.timing[name] = performance.now();
  };

  stopTiming = (name: string) => {
    const timing = this.timing[name];
    if (!timing) return;
    delete this.timing[name];
    this.timingResults[name] = performance.now() - timing;
  };

  getLast = (ms: number) => {
    const after = performance.now() - ms;
    const result = { count: 0, max: 0, min: Infinity, total: 0, avg: 0 };
    for (let i = this.drawHistory.length - 1; i >= 0; i--) {
      const hist = this.drawHistory[i];
      if (hist.tick < after) break;
      result.count++;
      result.total += hist.tc;
      if (hist.tc > result.max) result.max = hist.tc;
      if (hist.tc < result.min) result.min = hist.tc;
    }
    if (result.count > 0) result.avg = result.total / result.count;
    return result;
  };

  getSummaryText = () => {
    const text = [];
    {
      const { max, avg, count } = this.draw;
      text.push(`all=${count} `, `(${avg.toFixed(1)}/${max.toFixed(1)})`);
    }
    {
      const { max, avg, count } = this.getLast(5 * 1000);
      text.push(`; 5s=${count} `, `(${avg.toFixed(1)}/${max.toFixed(1)})`);
    }
    for (const [name, time] of Object.entries(this.timingResults)) {
      text.push(`; ${name}=${time.toFixed(1)}ms`);
    }
    return text.join('');
  };
}
