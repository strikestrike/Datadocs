export type FirebaseCommit = {
  blockId: string;
  isNewBlock: boolean;

  baseRow: number;
  data: {
    row: number;
    column: string;
    value?: any;
  }[];
};
