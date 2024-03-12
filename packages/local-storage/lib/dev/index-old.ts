import { DuckDBDataProtocol, type AsyncDuckDB } from '@datadocs/duckdb-wasm';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { LogsWriter } from './logs';
import { DuckDB } from './duckdb-loader';

declare global {
  interface Performance {
    memory: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
  }
}

interface BaseDB extends DBSchema {
  dbv1: {
    key: [number, number];
    value: {
      dbId: number;
      logId: number;
      sql: string;
    };
  };
}
const dbKey = (key: keyof BaseDB['dbv1']['value']) => key;

main().catch((error) => {
  console.error(error);
});
async function main() {
  const contextId = '22c13bb89e6a42e3b761f70d5aa3baa5';
  const getButton = (id: string) =>
    document.getElementById(id) as HTMLButtonElement;

  const csvType: FilePickerAcceptType = {
    description: 'CSV',
    accept: { 'text/csv': ['.csv'] },
  };

  const button = getButton('btnOpen');
  const logs = new LogsWriter(document.getElementById('txtLogs')!);
  let db: IDBPDatabase<BaseDB>;
  let duckdb: AsyncDuckDB;
  let performanceTimer: number;
  memStat();

  // button.addEventListener('click', testStorage);
  button.addEventListener('click', testDuckDBImportAndExport);
  getButton('btnOpenOPFS').addEventListener('click', openDuckDBFromOPFS);
  getButton('btnCleanOPFS').addEventListener('click', cleanOPFS);
  getButton('btnFileFP').addEventListener('click', async () => {
    const files = await window.showOpenFilePicker({
      id: contextId,
      types: [csvType],
    });
    console.log(await files[0].getFile());
  });
  initDuckDB().catch((error) => {
    console.error(error);
    logs.addText(error.message, 'e');
  });
  async function testDuckDBImportAndExport() {
    const files = await window.showOpenFilePicker({
      id: contextId,
      types: [csvType],
    });
    if (files.length < 0) return;
    const [csv] = files;
    logs.addText('csv: ' + csv.name);

    const csvFile = await csv.getFile();
    logs.addText('size: ' + humanReadableSize(csvFile.size));

    const duckdbCSV = `${contextId}.csv`;
    const duckdbParquet = `${contextId}.parquet`;

    const opfs = await navigator.storage.getDirectory();
    const targetFile = await opfs.getFileHandle(`${contextId}.parquet`, {
      create: true,
    });

    await duckdb.registerFileHandle(
      duckdbCSV,
      csvFile,
      DuckDBDataProtocol.BROWSER_FILEREADER,
      true,
    );
    logs.addText(`registered: ` + duckdbCSV);
    memStat();

    resetTimer();
    // await duckdb.registerFileHandle(
    //   duckdbParquet,
    //   await targetFile.getFile(),
    //   DuckDBDataProtocol.BROWSER_FSACCESS,
    //   true,
    // );
    // timeStat('registered file');

    const conn = await duckdb.connect();

    // resetTimer();
    // await conn.send(
    //   `CREATE VIEW ${contextId} AS SELECT * FROM '${inDuckDBFileName}'`,
    // );
    // timeStat('CREATE VIEW');

    logs.addText('COPYing ...');
    resetTimer();
    await conn.send(
      `COPY (SELECT * FROM '${duckdbCSV}') TO '${duckdbParquet}' (FORMAT 'parquet');`,
    );
    timeStat('COPY TO PARQUET');
    memStat();

    resetTimer();
    const parquet = await duckdb.copyFileToBuffer(duckdbParquet);
    timeStat('copy to buffer');
    memStat();

    resetTimer();
    const writable = await targetFile.createWritable();
    await writable.write(parquet);
    await writable.close();
    timeStat('write to OPFS');
    memStat();

    const file = await targetFile.getFile();
    logs.addText('OPFS file size: ' + humanReadableSize(file.size));

    await conn.close();
  }

  async function openDuckDBFromOPFS() {
    const opfs = await navigator.storage.getDirectory();
    const targetFile = await opfs.getFileHandle(`${contextId}.parquet`, {
      create: false,
    });

    await duckdb.registerFileHandle(
      'restore.parquet',
      await targetFile.getFile(),
      DuckDBDataProtocol.BROWSER_FILEREADER,
      true,
    );

    resetTimer();
    const conn = await duckdb.connect();
    await conn.send(
      `CREATE TABLE view_${contextId} AS SELECT * FROM 'restore.parquet'`,
    );
    timeStat('CREATE TABLE');
  }

  async function cleanOPFS() {
    const opfs = await navigator.storage.getDirectory();
    for await (const fileName of opfs.keys()) {
      logs.addText(`removing ${fileName} from opfs ...`);
      try {
        await opfs.removeEntry(fileName, { recursive: true });
      } catch (error) {
        console.error(error);
        logs.addText((error as Error).message, 'e');
      }
    }
  }

  async function initDuckDB() {
    logs.addText('initializing DuckDB ...');
    duckdb = await DuckDB();
    logs.addText('DuckDB is initialized');
  }
  async function testIDB() {
    if (!db) {
      db = await openDB<BaseDB>('test-local-storage-idb', 1, {
        upgrade(db, oldVersion, newVersion, tx) {
          db.createObjectStore('dbv1', {
            keyPath: [dbKey('dbId'), dbKey('logId')],
            autoIncrement: false,
          });
        },
      });
    }
    const count = await db.count('dbv1');
    if (count > 0) {
      const tx = db.transaction('dbv1', 'readonly');
      let cursor = await tx.store.openCursor(
        IDBKeyRange.bound([1, 0], [2, 0], false, true),
        'next',
      );
      while (cursor) {
        console.log(cursor.value);
        cursor = await cursor.continue();
      }
    } else {
      await db.put('dbv1', {
        dbId: 1,
        logId: 1,
        sql: 'UPDATE x SET y=1 WHERE z>1',
      });
      await db.put('dbv1', {
        dbId: 1,
        logId: 2,
        sql: 'UPDATE x SET y=1 WHERE z>2',
      });
      await db.put('dbv1', {
        dbId: 2,
        logId: 1,
        sql: 'UPDATE x SET y=1 WHERE z>3',
      });
    }
  }
  async function testStorage() {
    let storageRoot: FileSystemDirectoryHandle;
    try {
      // console.log(await navigator.storage.estimate());
      // storageRoot = (await navigator.storage.getDirectory()) as any;
    } catch (error) {
      console.error(error);
    }
    const file = await storageRoot!.getFileHandle('web.txt', { create: true });
    const fileStat = await file.getFile();
    const w = await file.createWritable({ keepExistingData: true });
    if (fileStat.size > 0) {
      console.log(fileStat.size);
      await w.seek(2);
      await w.write('hello');
    } else {
      console.log('new');
      await w.write('12345');
      await w.write('67890');
    }
    await w.close();
  }
  function memStat() {
    const mem = window.performance.memory;
    if (!mem) return;
    const log =
      `heap size: ` +
      `used=${humanReadableSize(mem.usedJSHeapSize)}; ` +
      `total=${humanReadableSize(mem.totalJSHeapSize)}; ` +
      `(limit=${humanReadableSize(mem.jsHeapSizeLimit)})`;
    logs.addText(log);
  }
  function resetTimer() {
    performanceTimer = performance.now();
  }
  function timeStat(task: string) {
    const ms = performance.now() - performanceTimer;
    logs.addText(`${task}: ${ms.toFixed(2)}ms`);
  }
}

function humanReadableSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
