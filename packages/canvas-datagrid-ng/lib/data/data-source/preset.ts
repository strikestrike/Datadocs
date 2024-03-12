import { EmptyDataSource } from './empty';
import { FirestoreDataSource } from './firestore';
import { DataSourceFromArray } from './from-array';

export function getPresetDataSources() {
  return {
    Empty: EmptyDataSource,
    Array: DataSourceFromArray,
    Firestore: FirestoreDataSource,
  };
}
