const pad2 = (n: number) => (n >= 10 ? n.toString() : '0' + n);

export class FDocDataBlockIdAllocator {
  private last: string;
  private lastSec: number;
  private incr = 1;
  alloc = () => {
    const now = new Date();
    const sec = Math.floor(now.getTime() / 1000);
    if (sec === this.lastSec) return this.last + '-' + this.incr++;

    this.lastSec = sec;
    this.incr = 1;
    const id =
      now.getFullYear() +
      pad2(now.getMonth() + 1) +
      pad2(now.getDate()) +
      pad2(now.getHours()) +
      pad2(now.getMinutes()) +
      pad2(now.getSeconds());
    this.last = id;
    return id;
  };
}
