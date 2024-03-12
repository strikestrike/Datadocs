import { getDataForViewPort } from '../api/get-data';
import { FirestoreDebugLogger } from '../utils/debug-logger';
import type { FDocSyncUserStatesV1, SyncUserState } from '../spec/storage';
import { diffUserStates } from './diff-states';
import type { FirestoreContext } from '../base/context';
import type { FirestoreBasicEditor } from '../editor/basic-editor';

const console = new FirestoreDebugLogger('user-states');

export class UserStatesManager {
  static SYNC_THROTTLE = 100;

  constructor(
    private readonly context: FirestoreContext,
    private readonly editor: FirestoreBasicEditor,
  ) {}

  private get appId() {
    return this.context.connect.appId;
  }
  private readonly dispatch = () => {
    return this.context.events.dispatch();
  };

  private syncPayload: any;
  private syncTimer: any;
  private readonly _sync = async () => {
    this.syncTimer = null;
    if (!this.syncPayload) return;

    const payload = { ...this.syncPayload };
    this.syncPayload = null;

    const doc = this.context.docsRef.getMetaDoc('sync');
    const userDocId = this.context.userDocId;
    const len = Object.keys(payload).length;
    try {
      await this.editor.updateDoc(doc, payload, {
        oneTimeOnly: true,
        dbId: userDocId,
      });
    } catch (error) {
      console.log(`synchronize ${len} state fields failed: ${error.message}`);
      return;
    }
    console.log(`synchronized ${len} state fields to firestore`);
  };
  readonly sync = async (
    update: Partial<Omit<SyncUserState, 'lastPingAt'>>,
  ) => {
    if (!this.syncPayload) this.syncPayload = {};
    const appId = this.appId;
    const pingKey: keyof SyncUserState = 'lastPingAt';
    const payload = this.syncPayload;
    update[`${appId}.${pingKey}`] = Date.now();
    Object.keys(update).forEach((path) => {
      payload[`${appId}.${path}`] = update[path];
    });
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(this._sync, UserStatesManager.SYNC_THROTTLE);
  };

  /** It is used for diff user states in the function `onUpstreamMetaChanges` */
  private lastSync?: FDocSyncUserStatesV1;

  /** This method is used for the firestore subscriber */
  readonly onUpstreamMetaChanges = async (
    data: any,
    isLocalChange: boolean,
  ) => {
    if (isLocalChange) return;
    const { outdatedRows, newSync } = diffUserStates(
      this.appId,
      this.lastSync,
      data,
    );
    this.lastSync = newSync;
    if (outdatedRows.size > 0) {
      const ranges = outdatedRows.getAll();
      console.log(`sync outdated rows ranges: ${JSON.stringify(ranges)}`);

      let fetched = false;
      await Promise.all(
        ranges.map(async (range) => {
          try {
            if (await getDataForViewPort(this.context, range, true))
              fetched = true;
          } catch (error) {
            console.error(
              `sync range ${JSON.stringify(range)} failed: ${error.message}`,
            );
          }
        }),
      );
      if (fetched) this.dispatch();
    }
  };
}
