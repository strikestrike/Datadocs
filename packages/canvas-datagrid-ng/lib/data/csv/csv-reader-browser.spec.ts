/// <reference types="mocha" />
// https://en.wikipedia.org/wiki/Comma-separated_values

import type { Stats } from 'fs';
import { close, open, read, statSync } from 'fs';
import { CSVReader } from './csv-reader-browser';
import { assertCompareCondition, assertWithName } from '../../spec-util';

const chunkSize = 128 * 1024;

const csvFile =
  typeof process !== 'undefined' && process.env && process.env.TEST_CSV_FILE;
let csvStat: Stats;
let _describe = describe.skip;
if (csvFile) {
  csvStat = statSync(csvFile);
  _describe = describe;
  const size = csvStat.size;
  console.log(`using the file "${csvFile}" to test csv reader (size=${size})`);
}

_describe('Test CSV Parser', () => {
  let fd: number;
  let reader: CSVReader;
  console.log(`injected CSVReader._read for test`);
  CSVReader._read = async (context, offset, end) => {
    context.reading = true;
    const buffer = Buffer.alloc(end - offset);
    return new Promise<string>((resolve, reject) => {
      read(fd, buffer, 0, buffer.length, offset, (err, size, buffer) => {
        context.reading = false;
        if (err) return reject(err);
        return resolve(buffer.slice(0, size).toString('utf-8'));
      });
    });
  };

  before((callback) => {
    open(csvFile, 'r', (err, _fd) => {
      if (err) return callback(err);
      fd = _fd;
      console.log(`   - opened CSV file, fd=${fd}`);

      const file = { size: csvStat.size } as Blob;
      reader = new CSVReader(file, { chunkSize });
      // reader.setReadingStateListener((reading) => {
      //   console.log(`   - reading state: ${reading}`);
      // });
      reader.setLoadChunkListener((chunkId, chunk) => {
        console.log(`   - loaded chunk #${chunkId}, rows=${chunk.rows.length}`);
      });
      return callback();
    });
  });
  after((callback) => {
    console.log(`   - closing CSV file`);
    close(fd, callback);
  });

  it('Initialized state', () => {
    assertWithName('chunkSize', reader.options.chunkSize, chunkSize);
    assertWithName('initialized', reader.initialized, false);
    assertWithName(
      'chunksCount',
      reader.chunksCount,
      Math.ceil(csvStat.size / chunkSize),
    );
    console.log(`   - chunksCount=${reader.chunksCount}`);
  });

  it('init', async () => {
    // reader.init();
    let result = reader.getRows(0, 0);
    assertWithName(`result`, result, []);
    await waitReader();

    result = reader.getRows(0, 0);
    assertWithName(`result.length`, result.length, 1);

    assertWithName('initialized', reader.initialized, true);
    assertWithName('headers', Array.isArray(reader.headers), true);
    assertCompareCondition('headers.length', reader.headers.length, '>=', 1);
    assertCompareCondition('chunks.length', reader.chunks.length, '>=', 1);

    const firstChunk = reader.chunks[0];
    assertCompareCondition('firstChunk.startRow', firstChunk.startRow, '==', 0);
    assertCompareCondition('firstChunk.endRow', firstChunk.endRow, '>=', 1);
    const printChunk = {
      startRow: firstChunk.startRow,
      endRow: firstChunk.endRow,
      restText: firstChunk.restText,
    };
    console.log(`   - firstChunk=${JSON.stringify(printChunk)}`);

    const result2 = reader.getRows(
      firstChunk.endRow + 1,
      firstChunk.endRow + 1,
    );
    console.log(
      `   - the first row in the second chunk=${JSON.stringify(result2[0])}`,
    );
  });

  it('read last chunk', async function () {
    this.timeout(60 * 1000);

    const getLastRowIndex = () =>
      reader.chunks[reader.chunks.length - 1].endRow;
    const getRow = (rowIndex: number) => {
      const rows = reader.getRows(rowIndex, rowIndex);
      console.log(`   - row#${rowIndex}: ${JSON.stringify(rows)}`);

      const lastChunkId = reader.chunks.length - 1;
      const lastChunk = reader.chunks[lastChunkId];
      console.log(
        `   - lastChunk#${lastChunkId}, lastRow=${lastChunk.endRow}, resolvedAllRows=${reader.resolvedAllRows}`,
      );
    };
    getRow(getLastRowIndex());
    getRow(getLastRowIndex() * 10);
    await waitReader();
    getRow(getLastRowIndex() * 10);
    await waitReader();
    getRow(getLastRowIndex() * 10);
    await waitReader(10 * 1000);
    getRow(getLastRowIndex() * 10);
    await waitReader(30 * 1000);
    getRow(getLastRowIndex());
  });

  it('read random rows', async function () {
    const lastRow = reader.chunks[reader.chunks.length - 1].endRow;
    const getRandomRow = async () => {
      const length = getInt(100, 1000);
      const rowIndex = getInt(0, lastRow - length - 1);
      const endRowIndex = rowIndex + length - 1;
      console.log(
        `   - read row#${rowIndex} to row#${endRowIndex} (length=${length})`,
      );
      reader.getRows(rowIndex, endRowIndex);
      await waitReader();

      const rows = reader.getRows(rowIndex, endRowIndex);
      console.log(`   - row#${rowIndex}: ${JSON.stringify(rows[0])}`);
    };
    await getRandomRow();
    await getRandomRow();
  });

  async function waitReader(timeout = 1000) {
    return new Promise<void>((resolve, reject) => {
      const expired = Date.now() + timeout;
      const ms = Math.floor(Math.max(timeout / 20, 15));
      setTimeout(check, 15);

      function check() {
        const now = Date.now();
        if (now > expired)
          return reject(new Error(`Timeout to wait the reader`));
        if (reader.loading) return setTimeout(check, ms);
        return resolve();
      }
    });
  }
  function getInt(min: number, max: number) {
    const count = max - min + 1;
    return Math.floor(Math.random() * count + min);
  }
});
