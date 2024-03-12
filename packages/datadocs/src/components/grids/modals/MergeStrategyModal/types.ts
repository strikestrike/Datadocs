export enum MergeStrategyModalResult {
  cancelled = 0,
  last_write_win = 1,
  local_changes_win = 2,
  server_changes_win = 3,
  fork_local_changes = 4,
  drop_local_changes = 5,
  merge_manually = 6,
}

export type WrappedMergeStrategyModalResult = {
  choice: MergeStrategyModalResult;
  remember: boolean;
};
