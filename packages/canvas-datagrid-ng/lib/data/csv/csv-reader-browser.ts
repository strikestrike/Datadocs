import type { ParsedCSV } from './csv-parser';
import { parseCSV } from './csv-parser';

export type CSVReaderOptions = {
  hasHeaders?: boolean;
  chunkSize?: number;
  maxCachedChunk?: number;
};

export type ChunkInfo = {
  startRow: number;
  endRow: number;
  restText: string;

  rows?: string[][];
};

export type LoadChunkListener = (chunkId: number, chunk: ChunkInfo) => any;
export type ReadingStateListener = (reading: any) => any;

// 8mb
const defaultCSVReaderOptions: CSVReaderOptions = {
  hasHeaders: true,
  chunkSize: 512 * 1024,
  maxCachedChunk: 16,
};

export class CSVReader {
  static onError = (error: any) => console.error(error);
  static _read = async (
    context: { file: Blob; reading: any },
    offset: number,
    end: number,
  ) => {
    const { file } = context;
    const reader = new FileReader();
    context.reading = reader;
    return new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        context.reading = null;
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        context.reading = null;
        reject(reader.error);
      };
      reader.readAsText(file.slice(offset, end, file.type));
    });
  };

  readonly options: CSVReaderOptions;
  readonly chunksCount: number;

  //#region state
  initialized = false;
  resolvedAllRows = -1;

  headers: string[] = null;
  chunks: ChunkInfo[] = [];
  cachedChunks: number[] = [];

  rowsStat = {
    avg: 0,
    chunks: 0,
    rows: 0,
  };

  /**
   * This property will be updated by the method `_read`
   * @see CSVReader._read
   */
  _reading: FileReader;
  set reading(_reading: any) {
    this._reading = _reading;
    if (this.readingListener) this.readingListener(_reading);
  }
  private readingListener: ReadingStateListener;
  setReadingStateListener = (listener?: ReadingStateListener) => {
    this.readingListener = listener;
  };
  //#endregion state

  constructor(readonly file: Blob, options?: CSVReaderOptions) {
    options = options
      ? Object.assign({}, defaultCSVReaderOptions, options)
      : defaultCSVReaderOptions;
    this.options = options;

    this.chunksCount = Math.ceil(file.size / options.chunkSize);
  }

  private unsafeReadChunk = async (chunkId: number): Promise<ParsedCSV> => {
    if (chunkId < 0 || chunkId >= this.chunksCount)
      return { rows: [], lastRow: '' };

    const { chunkSize, hasHeaders } = this.options;
    const offset = chunkId * chunkSize;
    const end = offset + chunkSize;

    let csv = await CSVReader._read(this, offset, end);
    if (chunkId > 0) {
      const restText = this.chunks[chunkId - 1].restText || '';
      csv = restText + csv;
    }

    const { rows, lastRow } = parseCSV(csv);
    // save headers
    if (chunkId === 0 && hasHeaders) this.headers = rows.shift();
    // remove uncompleted row
    if (chunkId < this.chunksCount - 1 && lastRow && rows.length > 1)
      rows.pop();
    return { rows, lastRow };
  };

  private loadChunkListener: LoadChunkListener;
  setLoadChunkListener = (listener?: LoadChunkListener) => {
    this.loadChunkListener = listener;
  };

  /**
   * save rows data to its chunk. and clean cache if there are too many cached data
   */
  private saveRowsData = (chunkId: number, rows: string[][]) => {
    this.chunks[chunkId].rows = rows;
    // always keep first chunk data
    if (chunkId !== 0) this.cachedChunks.push(chunkId);
    if (this.cachedChunks.length > this.options.maxCachedChunk) {
      const removedChunkId = this.cachedChunks.shift();
      delete this.chunks[removedChunkId].rows;
    }
    if (chunkId === 0) this.initialized = true;
    if (this.loadChunkListener)
      this.loadChunkListener(chunkId, this.chunks[chunkId]);
  };

  private readNewChunk = async (endChunkId: number) => {
    const { rowsStat } = this;
    let chunkId = this.chunks.length;
    let lastEndRow = -1;
    if (chunkId > 0) lastEndRow = this.chunks[chunkId - 1].endRow;

    for (; chunkId <= endChunkId; chunkId++) {
      const { rows, lastRow } = await this.unsafeReadChunk(chunkId);
      const startRow = lastEndRow + 1;
      const endRow = lastEndRow + rows.length;
      if (chunkId === this.chunksCount) this.resolvedAllRows = endRow + 1;

      const chunkInfo: ChunkInfo = {
        startRow,
        endRow,
        restText: lastRow,
      };
      this.chunks[chunkId] = chunkInfo;
      if (chunkId === endChunkId || chunkId === 0)
        this.saveRowsData(chunkId, rows);
      lastEndRow = endRow;

      rowsStat.rows += endRow - startRow + 1;
      rowsStat.chunks++;
      rowsStat.avg = Math.floor(rowsStat.rows / rowsStat.chunks);
    }
  };

  private readTouchedChunk = async (chunkId: number) => {
    const { rows } = await this.unsafeReadChunk(chunkId);
    this.saveRowsData(chunkId, rows);
  };

  private readChunkQueue: number[] = [];
  private readChunk = (chunkId: number) => {
    // already read rows
    if (this.chunks[chunkId]?.rows) return;

    // there is a reader read this csv now. queue this read request
    if (this._reading) {
      const index = this.readChunkQueue.indexOf(chunkId);
      if (index < 0) this.readChunkQueue.push(chunkId);
      return;
    }

    // new chunk
    let promise: Promise<any>;
    if (chunkId >= this.chunks.length) {
      promise = this.readNewChunk(chunkId).catch(CSVReader.onError);
    } else {
      // read again touched chunk
      promise = this.readTouchedChunk(chunkId).catch(CSVReader.onError);
    }

    promise.then(() => {
      const newChunkId = this.readChunkQueue.shift();
      if (newChunkId >= 0) this.readChunk(newChunkId);
    });
  };

  private resolveChunkId = (row: number): number | undefined => {
    const { chunks, resolvedAllRows } = this;
    if (resolvedAllRows >= 0 && row >= resolvedAllRows) return -1;
    for (let i = 0; i < chunks.length; i++) {
      const { startRow, endRow } = chunks[i];
      if (startRow > row) continue;
      if (row <= endRow) return i;
    }
  };

  /**
   *
   * @param startRow included (closed interval)
   * @param endRow included (closed interval)
   */
  getRows = (startRow: number, endRow: number): string[][] => {
    if (endRow < startRow) return [];
    if (startRow < 0) startRow = 0;

    const chunksLength = this.chunks.length;
    const startChunkId = this.resolveChunkId(startRow);
    if (isNaN(startChunkId)) {
      const avgRowsPerChunk = this.rowsStat.avg;
      let guessChunk = 1;
      if (avgRowsPerChunk > 0 && chunksLength >= 1) {
        guessChunk = Math.max(
          Math.ceil(startRow / avgRowsPerChunk),
          chunksLength,
        );
      }
      this.readChunk(guessChunk);
      return [];
    }
    if (startChunkId < 0) return [];

    let endChunkId = this.resolveChunkId(endRow);
    if (isNaN(endChunkId) || endChunkId < 0) {
      endChunkId = chunksLength - 1;
      endRow = this.chunks[endChunkId].endRow;
    }

    const result: string[][] = [];
    for (let chunkId = startChunkId; chunkId <= endChunkId; chunkId++) {
      const chunk = this.chunks[chunkId];
      if (!chunk) continue;
      const startRowInThisChunk = Math.max(startRow, chunk.startRow);
      const endRowInThisChunk = Math.min(endRow, chunk.endRow);
      const length = endRowInThisChunk - startRowInThisChunk + 1;
      if (chunk.rows) {
        const offset = startRowInThisChunk - chunk.startRow;
        result.push(...chunk.rows.slice(offset, offset + length));
        continue;
      }
      this.readChunk(chunkId);
      for (let i = 0; i < length; i++) result.push([]);
    }

    // load more chunks
    if (endChunkId >= chunksLength - 1 && this.resolvedAllRows < 0)
      this.readChunk(chunksLength);

    return result;
  };

  init = () => {
    if (this.initialized) return;
    this.readChunk(0);
  };

  get loading() {
    return this._reading || this.readChunkQueue.length > 0 ? true : false;
  }
  get lastRowIndex() {
    const chunkId = this.chunks.length - 1;
    if (chunkId < 0) return -1;
    return this.chunks[chunkId].endRow;
  }
}
