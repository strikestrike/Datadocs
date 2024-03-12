import type { DataSourceState } from '../spec';
import type { FDocBasicInfoV1 } from './spec/storage';

export function updateFirestoreDataSourceState(
  state: DataSourceState,
  docBase?: FDocBasicInfoV1,
  loading?: boolean,
) {
  if (docBase) {
    state.initialized = true;
    state.cols = docBase.cols;
    state.rows = docBase.rows;
  }
  if (typeof loading === 'boolean') state.loading = loading;
}
