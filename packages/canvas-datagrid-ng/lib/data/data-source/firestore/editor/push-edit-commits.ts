import type { FirestoreWriteBatchInput } from '../persistence/types';
import type { ResolvedEditDescriptor } from './edit-cells-base';
import type { CachedDataBlockV2 } from '../cache/idb-schema';
import type { FirestoreContext } from '../base/context';
import type { OfflineEditCommitMeta } from './types';
import type { FDocDataBlockV2 } from '../spec/storage';
import type { FirestoreBasicEditor } from './basic-editor';
import type { FirestoreQueryCacheDataBlock } from '../cache/datablock-cache';
import { addFieldIntoUpdatePayload } from './transformer';

/**
 * Final step of editing
 */
export async function pushEditCommitsToFirestore(
  context: FirestoreContext,
  editor: FirestoreBasicEditor,
  editIndex: number,
  commits: ResolvedEditDescriptor[],
  editRange: { row0: number; row1: number },
) {
  if (!commits || !commits.length) return;

  const now = Date.now();
  const { docsRef, connect, userDocId, caches } = context;
  const { appId } = connect;

  const batch: FirestoreWriteBatchInput<any>[] = [];
  let valueCount = 0;
  let updated = 0;
  let inserted = 0;

  const cacheUpdate: Parameters<FirestoreQueryCacheDataBlock['update']>[1] = [];
  const unsavedMarks: { row: number; columns: string[] }[] = [];
  for (const commit of commits) {
    const { blockId } = commit;
    const docRef = docsRef.getDataDoc(blockId);
    const meta: OfflineEditCommitMeta = {
      row: commit.row,
      columns: commit.edits.map((it) => it.column),
    };
    unsavedMarks.push({ ...meta });

    if (commit.isNewBlock) {
      const upstream: FDocDataBlockV2 = {
        format: '2',
        u: now,
        r: commit.row,
        d: {},
        v: {},
      };
      const cache: CachedDataBlockV2 = {
        ...upstream,
        blockId,
        dbId: userDocId,
        unsaved: { d: {} },
      };
      commit.edits.forEach((edit) => {
        const { column, data } = edit;
        upstream.d[column] = data;
        upstream.v[column] = now;
        cache.unsaved.d[column] = data;
        valueCount++;
      });

      inserted++;
      batch.push({ action: 'setDoc', ref: docRef, data: upstream, meta });
      cacheUpdate.push({
        blockId,
        update: cache,
      });
    } else {
      //
      // existed data block
      //
      const update = addFieldIntoUpdatePayload;

      const now = Date.now();
      const upstream: Partial<FDocDataBlockV2> = {};
      const cache: Partial<CachedDataBlockV2> = {};
      commit.edits.forEach((edit) => {
        const { column } = edit;
        const data =
          typeof edit.data === 'string' || edit.data ? edit.data : null;
        update(upstream, ['d', column], data);
        update(upstream, ['v', column], now);
        update(cache, ['unsaved', 'd', column], data);
        valueCount++;
      });

      update(upstream, ['u'], now);
      update(cache, ['unsaved', 'u'], now);

      updated++;
      batch.push({ action: 'updateDoc', ref: docRef, data: upstream, meta });
      cacheUpdate.push({
        blockId,
        update: cache,
      });
    }
  }

  //
  //#region core logic
  //
  if (cacheUpdate.length > 0) {
    await caches.dataBlocks.update(userDocId, cacheUpdate).then((ok) => {
      if (!ok) return;
      console.log(`updated ${cacheUpdate.length} data blocks to local cache`);
    });
  }
  const ok = await editor.writeBatch(batch, { dbId: userDocId });
  const syncRef = docsRef.getMetaDoc('sync');
  await editor.updateDoc(
    syncRef,
    {
      [`${appId}.lastEdit`]: editRange,
      [`${appId}.editIndex`]: editIndex,
      [`${appId}.lastEditAt`]: Date.now(),
      [`${appId}.lastPingAt`]: Date.now(),
    },
    {
      cleanOldOp: true,
      dbId: userDocId,
    },
  );
  if (ok) {
    console.log('>', unsavedMarks);
    for (let i = 0; i < unsavedMarks.length; i++) {
      const { row, columns } = unsavedMarks[i];
      await context.caches.dataBlocks.removeUnsavedMarks(
        userDocId,
        row,
        columns,
      );
    }
  }
  //
  //#endregion core logic
  //

  const elapsed = Date.now() - now;
  console.log(
    `added ${inserted} new data block and updated ${updated} data block. (affected value: ${valueCount}) +${elapsed}ms`,
  );
}
