import type { DataSourceState } from './spec/state';

export function getDefaultDataSourceState(): DataSourceState {
  return {
    initialized: false,
    loading: false,
    rows: 0,
    cols: 0,
  };
}
