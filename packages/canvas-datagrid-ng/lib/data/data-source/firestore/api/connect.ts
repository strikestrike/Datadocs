import type { FirestoreConnectInfo } from '../base/connect-info';
import type { FirestoreError } from 'firebase/firestore';
import { signInWithCustomToken } from 'firebase/auth';
import { FirestoreDebugLogger } from '../utils/debug-logger';
import { NetworkStatus } from '../utils/network-status';

const console = new FirestoreDebugLogger('connect');

export class FirestoreConnector {
  constructor(private readonly conn: FirestoreConnectInfo) {}

  private readonly viaOfflineMode = () => {
    console.log(`connect to Firestore via offline mode`);
    this.conn.connected = true;
    return true;
  };

  readonly connect = async (): Promise<boolean> => {
    const { conn } = this;
    if (conn.connected) return true;

    const network = NetworkStatus.get();
    if (!network.online) return this.viaOfflineMode();

    if (conn.method === 'token') {
      try {
        // const result =
        await signInWithCustomToken(conn.auth, conn.token);
        // console.log(result);
      } catch (error) {
        let msg = `login firestore failed: ${error.message}`;
        if ('code' in error) msg += `code=${JSON.stringify(error.code)}`;
        console.error(msg);

        if (isNetworkError(error) && !network.online)
          return this.viaOfflineMode();
        return false;
      }
    }

    return true;
  };
}

function isNetworkError(err: unknown): err is FirestoreError {
  return err && (err as any).code === 'auth/network-request-failed';
}
