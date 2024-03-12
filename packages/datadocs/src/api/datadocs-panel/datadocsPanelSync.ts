import {
  type Auth,
  inMemoryPersistence,
  setPersistence,
  signInWithCustomToken,
} from "firebase/auth";
import {
  type Firestore,
  type Unsubscribe,
  onSnapshot,
  doc,
} from "firebase/firestore";
import { getObjectPermissionToken } from "./datadocsPanel";
import { getFirestoreConfig } from "../config";
import type { DatadocsPanelSyncObjectData } from "./type";
import { syncDatadocsObjectData } from "./syncUtils";

const DATADOCS_PANEL_COLLECTION = "datadocspanel";

const enum ListenerType {
  FOLDER = "folder",
  ACTIVE_WORKBOOK = "active-workbook",
}

const enum ListenerState {
  SYNC = 0,
  UNSYNC = 1,
}

class DatadocsObjectListener {
  private unsubscribeSnapshot: Unsubscribe;
  /**
   * As the subscribe/unsunscribe are executed asynchrously. Subscribing is
   * triggered automatically after the authorization process is done (get
   * custom token, sign-in) but user may navigate out of that folder and
   * not interested in the changes anymore.
   */
  private desireState: ListenerState;
  private documentCache: DatadocsPanelSyncObjectData;
  /**
   * Indicate authentication is in progress
   */
  isAuthenticating = false;

  constructor(
    readonly objectId: string,
    readonly type: ListenerType,
    readonly firestoreAuth: Auth,
    readonly firestoreDB: Firestore
  ) {}

  subscribe() {
    if (this.desireState === ListenerState.UNSYNC) {
      return this.unsubscribe();
    }

    if (
      this.isSubscribing() ||
      !this.firestoreDB ||
      !this.firestoreAuth.currentUser
    ) {
      return;
    }

    const objectRef = doc(
      this.firestoreDB,
      DATADOCS_PANEL_COLLECTION,
      this.getSubscribeDocId()
    );
    // console.log("debug here ==== subscribe === ", {
    //   type: this.type,
    //   objectId: this.objectId,
    // });
    this.unsubscribeSnapshot = onSnapshot(objectRef, (object) => {
      this.onReceivingData(object.data() as DatadocsPanelSyncObjectData);
    });
  }

  unsubscribe() {
    if (this.desireState === ListenerState.SYNC) {
      return this.subscribe();
    }

    if (this.isSubscribing()) {
      // console.log("debug here ==== unsubscribe === ", {
      //   type: this.type,
      //   objectId: this.objectId,
      // });
      this.unsubscribeSnapshot();
    }
    this.unsubscribeSnapshot = null;
  }

  setDesireState(state: ListenerState) {
    this.desireState = state;
  }

  private onReceivingData(data: DatadocsPanelSyncObjectData) {
    // console.log("debug here ==== firestore data ======", {
    //   type: this.type,
    //   objectId: this.objectId,
    //   data,
    // });
    this.documentCache = data as DatadocsPanelSyncObjectData;
    this.syncData();
  }

  syncData() {
    if (this.documentCache) {
      syncDatadocsObjectData(
        this.objectId,
        this.documentCache,
        this.type === "folder"
      );
    }
  }

  private isSubscribing() {
    return typeof this.unsubscribeSnapshot === "function";
  }

  private getSubscribeDocId() {
    const uid = this.firestoreAuth.currentUser.uid;
    return this.objectId === null ? `u_${uid}` : this.objectId;
  }
}

export default class DatadocsPanelSyncManager {
  private objectListeners: Map<string | null, DatadocsObjectListener> =
    new Map();
  private counter = 1;

  /**
   * Start listening to changes on the object
   *
   * As we use firebase id token to give permission to the object that user is
   * currently watching, each objectId need a token id which contain the right
   * claim in order to access Firestore data from frontend.
   * @param objectId
   * @param type
   */
  async sync(objectId: string, type: ListenerType = ListenerType.FOLDER) {
    let listener: DatadocsObjectListener;

    if (this.objectListeners.has(objectId)) {
      listener = this.objectListeners.get(objectId);
      listener.setDesireState(ListenerState.SYNC);

      // If there is listener exist and fully setup, just make it subscibe to Firestore data
      if (listener.firestoreAuth.currentUser) {
        listener.subscribe();
        return true;
      }
    } else {
      const { firestoreAuth, firestoreDB } = getFirestoreConfig(
        this.getNextAppName()
      );
      listener = new DatadocsObjectListener(
        objectId,
        type,
        firestoreAuth,
        firestoreDB
      );
      this.objectListeners.set(objectId, listener);
      listener.setDesireState(ListenerState.SYNC);
    }

    if (listener.isAuthenticating) return;
    listener.isAuthenticating = true;

    // Authenticate to get access permission to the object
    try {
      const result = await getObjectPermissionToken([objectId]);
      if (!result || !result.token) {
        throw new Error("Could not get custom token for accessing data");
      }
      await setPersistence(listener.firestoreAuth, inMemoryPersistence);
      await signInWithCustomToken(listener.firestoreAuth, result.token);
      // Listen to Firestore change after all setup is done
      listener.subscribe();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    } finally {
      listener.isAuthenticating = false;
    }
  }

  async unsync(objectId: string) {
    if (this.objectListeners.has(objectId)) {
      const listener = this.objectListeners.get(objectId);
      listener.setDesireState(ListenerState.UNSYNC);
      listener.unsubscribe();
    }
    return true;
  }

  async unsyncAll() {
    for (const objectId of this.objectListeners.keys()) {
      await this.unsync(objectId);
    }
    return true;
  }

  private getNextAppName() {
    const count = this.counter++;
    return `firestore-${count}`;
  }

  async syncActiveWorkbook(objectId: string) {
    for (const listener of this.objectListeners.values()) {
      if (listener.type === ListenerType.ACTIVE_WORKBOOK) {
        await this.unsync(listener.objectId);
      }
    }

    return await this.sync(objectId, ListenerType.ACTIVE_WORKBOOK);
  }

  /**
   * Clean all listener and reset all sync data
   */
  async destroy() {
    await this.unsyncAll();
    this.objectListeners = new Map();
  }
}
