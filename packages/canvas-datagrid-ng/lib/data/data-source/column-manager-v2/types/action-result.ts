export type ActionResultWithUndoDescriptor<
  ActionType extends keyof ActionResultMap,
  UndoType extends keyof UndoArgsMap,
> = {
  /** Indicating whether the action was successful or not. */
  ok: boolean;
  result?: ActionResultMap[ActionType];
  undo?: {
    type: UndoType;
    /**
     * The argument for some action contains both schema index-based fields and
     * view index-based fields.
     * This design is used to
     * enhance the column locating experience in a remote collaborative grid and
     * reduce conflicts in state synchronization.
     */
    args: UndoArgsMap[UndoType];
  };
};

export type ActionResultMap = {
  untouch: any;
  touch: any;
  update: any;
  hide: {
    /** The number of new hidden columns that were added by this action */
    count: number;
    schemaIndexes: number[];
  };
  unhide: {
    count: number;
    schemaIndexes: number[];
  };
  remove: {
    schemaIndex: number;
    viewIndex: number;
    hidden?: boolean;
    schema: any;
    defaultSchema: any;
  };
  insert: {
    schemaIndex: number;
    viewIndex: number;
    hidden: boolean;
  };
  reorder: {
    /**
     * If this value is `true`, it indicates that all column related state has not been changed.
     * Usually occurs after the user moves columns that have no data and have not been modified.
     */
    virtual?: boolean;
    beginSchemaIndex: number;
    count: number;
    /**
     * The new view index for the first column in the moved columns.
     */
    newViewIndex: number;
  };
};

export type UndoArgsMap = {
  untouch: {
    /** How many visible columns should be remove */
    sub: number;
    /** How many visible columns after untouch */
    visible: number;
  };
  touch: {
    add: number;
    viewIndex: number;
  };
  update: {
    schemaIndex: number;
    /** As a fallback way to find the column */
    id?: any;
    fields: any;
    unset: string[];
  };
  hide: {
    schemaIndexes: number[];
  };
  unhide: {
    schemaIndexes: number[];
  };
  restore: {
    schemaIndex: number;
    afterSchemaIndex: number;
    hidden?: boolean;
    schema: any;
  };
  undoInsert: {
    schemaIndex: number;
  };
  reorder: {
    viewIndex: number;
    count: number;
    afterViewIndex: number;
    afterSchemaIndex: number;
    /** The number of columns that need to be removed after undoing this reorder. */
    sub?: number;
  };
};
