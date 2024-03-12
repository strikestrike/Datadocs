export class Tick {
  private last = performance.now();
  constructor(private readonly name = "") {}

  readonly tick = (action?: string) => {
    if (action) {
      const ms = performance.now() - this.last;
      if (this.name) action = `${this.name} ${action}`;
      console.log(`${action}: ${ms.toFixed(2)}ms`);
    }
    this.last = performance.now();
  };
}
