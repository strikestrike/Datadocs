import type { ParserCellData, ColumnType } from "@datadocs/canvas-datagrid-ng";

export type CellValue = ParserCellData | { columnType: ColumnType; value: any };

export type StructFieldsItem = {
  key: string;
  value: ParserCellData | { columnType: ColumnType; value: any };
};
