export class HiddenNumLRUCache {
  private viewIndex: number;
  private rangeIndex: number;
  private hiddenNum: number;

  /**
   * @param cond A optional condition
   */
  reset(cond?: { gte?: number; lte?: number }) {
    if (cond) {
      const viewIndex = this.viewIndex;
      if (typeof viewIndex !== 'number') return false;
      if ('gte' in cond) if (this.viewIndex < cond.gte) return false;
      if ('lte' in cond) if (this.viewIndex > cond.lte) return false;
    }
    delete this.viewIndex;
    return true;
  }

  get(): [viewIndex: number, rangeIndex: number, hiddenNum: number] {
    const viewIndex = this.viewIndex;
    if (typeof viewIndex !== 'number') return;
    return [viewIndex, this.rangeIndex, this.hiddenNum];
  }

  set(viewIndex: number, rangeIndex: number, hiddenNum: number) {
    this.viewIndex = viewIndex;
    this.rangeIndex = rangeIndex;
    this.hiddenNum = hiddenNum;
  }
}
