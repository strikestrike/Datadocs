export type CellMetaForConflicts = {
  conflicts: {
    upstream: {
      value?: any;
      style?: any;
      type?: any;
      /** Time stamp */
      updatedAt?: number;
    };
  };
};

export type CellMetaForUnsavedChanges = {
  unsaved: {
    isNew?: boolean;
    isRemoved?: boolean;
    /** Time stamp */
    updatedAt?: number;
  };
};
