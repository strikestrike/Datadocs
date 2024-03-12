import { setDoc, updateDoc } from 'firebase/firestore';
import type {
  OfflineEditCommitMeta,
  OfflineUpdateRangeMeta,
  RestoreAfterOnlineHandler,
} from './types';
import {
  deleteFromUpdatePayload,
  transformSetDataV2PayloadToUpdate,
} from './transformer';
import type { FDocDataBlockV2, FDocRowRangesV1 } from '../spec/storage';
import type { FirestoreContext } from '../base/context';
import { FirestoreDebugLogger } from '../utils/debug-logger';
import { firestoreEditFn } from '../utils/firestore';
import { getFDocData, getFDocsData } from '../api/get-docs';

const logger = new FirestoreDebugLogger('edit');

export class PushFirestoreOfflineEdits {
  constructor(private readonly context: FirestoreContext) {}

  readonly handle: RestoreAfterOnlineHandler = async (
    op,
    parsedPayload,
    state,
  ) => {
    // console.log(op);

    const meta: OfflineEditCommitMeta | OfflineUpdateRangeMeta = op.meta;
    const { docsRef, caches, rowRanges } = this.context;

    //#region normal document
    if (!meta) {
      // normal operation without meta
      const fn: typeof setDoc = firestoreEditFn[op.action];
      if (!fn) {
        logger.error(`unknown action "${op.action}"`);
        return true;
      }
      const ref = docsRef.getDoc(op.ref);
      try {
        await fn(ref, parsedPayload);
      } catch (error) {
        // TODO skip 'insufficient_permissions'
        console.error(error);
        throw error;
      }
      return true;
    }
    //#endregion normal document

    //#region row ranges meta
    if ('newRows' in meta) {
      // update range: do add operation
      const { newRows } = meta;
      const ref = docsRef.getMetaDoc('rows');
      const upstream: FDocRowRangesV1 = (await getFDocData(ref)) as any;
      if (newRows) rowRanges.loadFromUpstream(upstream);
      newRows.forEach((it) => rowRanges.markRow(it));
      await setDoc(ref, rowRanges.encodeForSave());
      return true;
    }
    //#endregion row ranges meta

    //#region operation for editing data block
    if ('row' in meta && 'columns' in meta) {
      // edit commit
      const { row, columns } = meta;
      const q = docsRef.getSingleRowQuery(row);
      const docs = await getFDocsData<FDocDataBlockV2>(q);

      const originalAction = op.action;

      let realRef = op.ref;
      let realAction = op.action;
      let removeUnsavedColumns: string[];

      const executeAction = async () => {
        const ref = docsRef.getDoc(realRef);
        if (realAction === 'setDoc') {
          await setDoc(ref, parsedPayload);
        } else {
          // realAction is "updateDoc"
          // to make sure the payload would be may rejected
          //  by Firestore security rule that is used for avoiding outdated push
          parsedPayload.u = Date.now();
          if (originalAction === 'setDoc') {
            const realPayload =
              transformSetDataV2PayloadToUpdate(parsedPayload);
            await updateDoc(ref, realPayload);
          } else {
            await updateDoc(ref, parsedPayload);
          }
        }

        await caches.dataBlocks.removeUnsavedMarks(
          op.dbId,
          row,
          removeUnsavedColumns,
        );
        return true;
      };

      if (docs.length == 0) {
        logger.log(`push to ${realRef} in easy mode (NO_UPSTREAM_DOCS)`);
        return executeAction();
      }

      // because there is existed upstream doc, so the real action become updateDoc
      realAction = 'updateDoc';
      const doc = docs[0];
      realRef = doc.ref;
      if (doc.data.u < op.createdAt) {
        logger.log(`push to ${realRef} in easy mode (UPSTREAM_IS_OLD)`);
        return executeAction();
      }

      const upstream: FDocDataBlockV2 = doc.data;
      const upstreamVersions = upstream.v;
      if (!upstreamVersions) {
        logger.log(`push to ${realRef} in easy mode (UPSTREAM_NO_VER)`);
        return executeAction();
      }

      const clonedPayload: FDocDataBlockV2 = { ...parsedPayload };
      if (clonedPayload.d) clonedPayload.d = { ...clonedPayload.d };
      if (clonedPayload.t) clonedPayload.t = { ...clonedPayload.t };

      const resolvedColumns: string[] = [];
      const conflictedColumns: string[] = [];
      for (let ci = 0; ci < columns.length; ci++) {
        const columnName = columns[ci];
        const upstreamVersion = upstreamVersions[columnName];
        if (!upstreamVersion || upstreamVersion < op.createdAt) {
          resolvedColumns.push(columnName);
          continue;
        }
        conflictedColumns.push(columnName);

        // local value is old, can't merge it automatically. this situation needs to be handled by user
        if (op.action === 'updateDoc') {
          deleteFromUpdatePayload(clonedPayload, ['d', columnName]);
          deleteFromUpdatePayload(clonedPayload, ['v', columnName]);
        } else {
          // setDoc
          delete clonedPayload.d?.columnName;
          delete clonedPayload.v?.columnName;
        }
      }

      let logsForConflict = '';
      if (conflictedColumns.length > 0)
        logsForConflict = ` Conflicts: ${conflictedColumns.join(', ')}`;
      logger.log(
        `push ${resolvedColumns.length} columns to ${realRef}${logsForConflict}`,
      );

      if (resolvedColumns.length > 0) {
        parsedPayload = clonedPayload;
        removeUnsavedColumns = resolvedColumns;
        await executeAction();
      }
      return true;
    }
    //#endregion operation for editing data block

    logger.error(`unknown meta`);
    return false;
  };
}
