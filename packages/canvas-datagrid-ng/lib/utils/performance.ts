export class PerfTimer {
  lastTick: number;
  tick = () => {
    if (this.lastTick) {
      const v = performance.now() - this.lastTick;
      this.lastTick = performance.now();
      return v;
    }
    this.lastTick = performance.now();
    return 0;
  };
  log = (...msg: any[]) =>
    console.log('+' + this.tick().toFixed(2) + ' ms', ...msg);
  constructor() {
    this.tick();
  }
}
