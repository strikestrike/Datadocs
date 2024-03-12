export class DataPagingManager<T> {
  private pages: Array<T[]> = [];

  constructor(readonly pageSize: number) {}

  clearAll() {
    this.pages = [];
  }

  getAll() {
    const flattenData: T[] = [];
    for (let i = 0; i < this.pages.length; i++) {
      const pageData = this.pages[i];
      if (pageData?.length > 0) {
        flattenData.splice(i * this.pageSize, 0, ...pageData);
      }
    }
    return flattenData;
  }

  addPage(data: T[], pageIndex: number) {
    this.pages[pageIndex] = data;
  }

  getPage(pageIndex: number) {
    return this.pages[pageIndex];
  }

  lastPageIndex() {
    return Math.max(this.pages.length - 1, 0);
  }

  nextPageIndex() {
    return this.pages.length;
  }

  hasNextPage() {
    const lastPage = this.pages[this.lastPageIndex()];
    if (!lastPage) return true;
    return lastPage?.length === this.pageSize;
  }

  hasPage(pageIndex: number) {
    return !!this.pages[pageIndex];
  }
}
