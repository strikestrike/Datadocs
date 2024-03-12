import { getDocs } from 'firebase/firestore';
import { FirestoreDebugLogger } from '../utils/debug-logger';
import { NetworkStatus } from '../utils/network-status';
import type { QuerySnapshot } from 'firebase/firestore';
import type { FirestoreContext } from '../base/context';
import type { FDocDataBlockV2 } from '../spec/storage';
import type { CachedDataBlockV2 } from '../cache/idb-schema';
import type { MetaForFetchedRow } from '../spec/meta';

const console = new FirestoreDebugLogger('get-data');
type ExclusiveRange = [number, number, ...unknown[]];

/**
 * @returns `true` means fetched, otherwise no data was fetched
 */
export async function getDataForViewPort(
  context: FirestoreContext,
  range: ExclusiveRange,
  force = false,
): Promise<boolean> {
  const { rowRanges, docsRef, userDocId, caches, fetchedRanges } = context;

  const [low, high] = range;
  const needFetch =
    force || rowRanges.checkWhichRowsNeedToBeFetched([low, high]);
  if (needFetch) {
    const now = Date.now();
    let because: string;
    if (Array.isArray(needFetch))
      because = `because key rows [${needFetch.join()}] are matched`;
    else because = 'because `force` is true';

    const online = NetworkStatus.get().online;
    const fetchFor = `${online ? '' : 'from only local cache'} ${because}`;
    console.log(`fetch [${low}, ${high}] ${fetchFor}`);

    let upstream: QuerySnapshot<FDocDataBlockV2>;
    if (online) {
      const queryDataBlocks = docsRef.getRowsQuery(low, high);
      upstream = (await getDocs(queryDataBlocks)) as any;
    }

    const cached = await caches.dataBlocks.get(userDocId, [low, high]);
    const elapsed = Date.now() - now;
    console.log(
      `loaded ${cached.length} cached blocks and ` +
        `${upstream?.size || 0} online blocks +${elapsed}ms`,
    );

    saveObtaintedDataBlocks(context, cached, upstream);
  }

  fetchedRanges.add([low, high]);
  return !!needFetch;
}

export async function saveObtaintedDataBlocks(
  context: FirestoreContext,
  cached: CachedDataBlockV2[],
  upstream: QuerySnapshot<FDocDataBlockV2> | null,
) {
  const { rowRanges, userDocId, caches } = context;

  let loadedRows = 0;

  const blockIdMap = new Map<
    string,
    {
      cache?: CachedDataBlockV2;
      upstream?: FDocDataBlockV2;
    }
  >();
  //
  //#region merging
  if (cached?.length > 0) {
    cached.forEach((block) => blockIdMap.set(block.blockId, { cache: block }));
  }
  if (upstream) {
    upstream.forEach((item) => {
      const blockId = item.id;
      const block = item.data();
      const e = blockIdMap.get(blockId);
      if (e) e.upstream = block;
      else blockIdMap.set(blockId, { upstream: block });
    });
  }
  //#endregion merging
  //

  const updateCacheIds: string[] = [];
  const updateCacheBodys: FDocDataBlockV2[] = [];

  blockIdMap.forEach(({ cache, upstream }, blockId) => {
    const { r: rowIndex, u: updatedAt } = upstream || cache;
    // check format
    const existed = rowRanges.getBlocksInfoByRowIndex(rowIndex);
    if (existed && updatedAt > existed.updatedAt === false) {
      console.debug(`skip old data block doc#${blockId}`);
      return;
    }
    rowRanges.setBlockId(rowIndex, blockId, updatedAt);

    const meta: MetaForFetchedRow = { sync: {} };
    let rowData = upstream ? upstream.d : cache.d;
    rowData = { ...rowData };
    if (cache?.unsaved) {
      const unsavedData = cache.unsaved.d;
      if (unsavedData) {
        Object.assign(rowData, unsavedData);
        if (upstream) {
          Object.keys(unsavedData).forEach((columnId) => {
            meta.sync[columnId] = has(upstream.d, columnId) ? 'CHANGED' : 'NEW';
          });
        }
      }
    }

    caches.inMem.add(rowIndex, { meta, data: rowData, style: {} });
    if (upstream) {
      // got the data from upstream, so we need to update local cache
      const updateCache = upstream as CachedDataBlockV2;
      if (cache?.unsaved) {
        // copy local unsaved changes to the payload
        updateCache.unsaved = cache.unsaved;
      }
      updateCacheBodys.push(updateCache);
      updateCacheIds.push(blockId);
    }
    loadedRows++;
  });

  caches.dataBlocks
    .set(userDocId, updateCacheIds, updateCacheBodys)
    .then((ok) => {
      if (ok)
        console.log(
          `cached ${updateCacheBodys.length} data blocks to local cache`,
        );
    });
  console.log(`loaded ${loadedRows} rows`);
}

function has<T>(obj: T, key: keyof T) {
  if (obj === null || obj === undefined) return false;
  return Object.prototype.hasOwnProperty.call(obj, key);
}
