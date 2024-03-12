export type SummaryItem = {
  group: string;
  summary: string;
  subgroups?: {
    data: SummaryItem[];
    expanded: boolean;
  };
};
