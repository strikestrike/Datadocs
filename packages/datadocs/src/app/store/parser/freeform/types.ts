import type {
  CellDataFormat,
  ParserCellData,
} from "@datadocs/canvas-datagrid-ng";
import type { MeridiemType } from "./locale";

export type ParserFreeformMeta = {
  data: ParserCellData;
  format?: CellDataFormat;
};

export type LocaleInfo = {
  key: string;
  name: string;
  currency: string;
  shortMeridiem?: MeridiemType;
  dateSeparator?: string[];
};
