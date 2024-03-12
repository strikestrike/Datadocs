import type { FirebaseApp, FirebaseOptions } from 'firebase/app';
import { initializeApp } from 'firebase/app';
import type { Auth as FirebaseAuth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getUUID } from '../utils/crypto';

/**
 * `token` means login via `signInWithCustomToken`.
 * `oauth` means login via OAuth2 redirect.
 */
export type _FirestoreCustomSignInToken = {
  method: 'token';
  token: string;
};

export class FirestoreConnectInfo {
  readonly method: 'token' | 'oauth';
  readonly token?: string;
  readonly app: FirebaseApp;
  readonly auth: FirebaseAuth;
  readonly store: Firestore;

  private _appId: string;
  set appId(appId: string) {
    this._appId = appId;
  }
  get appId(): string {
    if (!this._appId) this._appId = getUUID();
    return this._appId;
  }

  connected = false;

  /**
   * @todo support other way to signIn. Eg: OAuth2
   */
  constructor(
    readonly config: FirebaseOptions,
    signIn: _FirestoreCustomSignInToken,
    readonly docId: string,
  ) {
    this.method = signIn.method;
    switch (this.method) {
      case 'token':
        this.token = signIn.token;
        break;
    }
    this.app = initializeApp(config);
    this.app.automaticDataCollectionEnabled = false;
    this.auth = getAuth(this.app);
    this.store = getFirestore(this.app);
  }
}
