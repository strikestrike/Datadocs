import type { QuerySnapshot } from 'firebase/firestore';
import { setDoc, getDocs, updateDoc } from 'firebase/firestore';
import type { FirestoreContext } from '../base/context';
import { createOfflineEmptyDocs } from '../cache/datablock-mock';
import type {
  FDocBasicInfoV1,
  FDocDataBlockV2,
  FDocMetaNames,
  FDocRowRangesV1,
} from '../spec/storage';
import { defaultFDocBasicInfoV1 } from '../spec/storage';
import { FirestoreDebugLogger } from '../utils/debug-logger';
import type { NetworkStatusEvent } from '../utils/network-status';
import { NetworkStatus } from '../utils/network-status';
import { cleanOutdatedUserStates } from '../user-states/clean-outdated';
import type { UpstreamSubscriber } from './subscribe-docs';
import { saveObtaintedDataBlocks } from './get-data';

const console = new FirestoreDebugLogger('open');

export class FirestoreUserDocOpener {
  docBase: FDocBasicInfoV1;

  constructor(
    private readonly context: FirestoreContext,
    private readonly subscriber: UpstreamSubscriber,
  ) {}

  /**
   * Create a document if it doesn't exist or get a document
   */
  open = async () => {
    if (this.context.opened) return;

    const context = this.context;
    const { caches, docsRef, userDocId, rowRanges } = context;
    const { basePath } = docsRef;
    const baseRef = docsRef.base;
    const appId = context.connect.appId;

    let docBase = await caches.getDocData(baseRef);
    const exists = !!docBase;
    console.log(`${basePath} exists: ${exists}`);

    const network = NetworkStatus.get();
    if (!exists) {
      if (!network.online) throwOfflineError();
      console.log(`creating ${basePath} on firebase ...`);
      docBase = { ...defaultFDocBasicInfoV1 };
      await setDoc(baseRef, docBase);
    } else {
      // const prevFormat = docBase.format;
      // const changed = await updateDocumentFormat(docBase, baseRef);
      // if (changed) {
      //   docBase = await caches.getDocData(baseRef);
      //   console.log(`updated from ${prevFormat} to ${docBase.format}`);
      // }
      console.log(`doc basic info: ${JSON.stringify(docBase)}`);
    }
    this.docBase = docBase;
    await caches.cacheDoc(userDocId, baseRef, docBase);

    const metaDocs = network.online
      ? await getDocs(docsRef.getMetaCollection())
      : createOfflineEmptyDocs();

    const rowRangesRef = docsRef.getMetaDoc('rows');
    const loadedMeta = new Set<FDocMetaNames>();
    console.debug(`found ${metaDocs.size} meta docs`);
    metaDocs.forEach((meta) => {
      const data = meta.data();
      const metaId: FDocMetaNames = meta.id as any;
      loadedMeta.add(metaId);

      switch (metaId) {
        case 'rows':
          caches.cacheDoc(userDocId, rowRangesRef, data as any);
          return saveDataRange(data as any);
        case 'sync': {
          const update = cleanOutdatedUserStates(appId, data);
          if (update) {
            console.log(
              `cleaning ${Object.keys(update).length} fields in sync state`,
            );
            updateDoc(meta.ref, update);
          }
          return;
        }
        default:
          console.log(`WARN: unknown meta doc: ${meta.id}`);
      }
    });

    if (!loadedMeta.has('rows')) {
      if (network.online) {
        await setDoc(rowRangesRef, {});
        console.log(`initialized meta "rows"`);
      } else {
        const ranges = await caches.getDocData(rowRangesRef);
        if (!ranges) throwOfflineError(`can't load data range`);
        saveDataRange(ranges, true);
      }
    }

    if (!loadedMeta.has('sync') && network.online) {
      await setDoc(docsRef.getMetaDoc('sync'), {});
      console.log(`initialized meta "sync"`);
    }

    const initRange: [number, number] = [0, 100];
    let upstream: QuerySnapshot<FDocDataBlockV2>;
    if (network.online) {
      const queryDataBlocks = docsRef.getRowsQuery(...initRange);
      upstream = (await getDocs(queryDataBlocks)) as any;
    }
    const cached = await caches.dataBlocks.get(userDocId, initRange);
    saveObtaintedDataBlocks(context, cached, upstream);

    this.context.fetchedRanges.add(initRange);
    this.context.opened = true;

    if (network.online) {
      this.subscriber.sub();
    } else {
      network.addListener(subscribeUpstreamAfterOnline);
    }
    console.log(`opened`);

    function saveDataRange(data: FDocRowRangesV1, fromCache?: boolean) {
      const count = rowRanges.loadFromUpstream(data);
      let msg = `found ${count} data range from firestore`;
      if (fromCache) msg += ` from cache`;
      console.log(msg);
    }
    function throwOfflineError(msg?: string) {
      throw new Error(`Network is unavailable and no cache ${msg || ''}`);
    }
    function subscribeUpstreamAfterOnline(ev: NetworkStatusEvent) {
      if (ev.online) this.subscriber.sub(false);
      network.removeListener(subscribeUpstreamAfterOnline);
    }
  };
}
