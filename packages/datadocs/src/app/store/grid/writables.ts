import type { DataSourceBase } from "@datadocs/canvas-datagrid-ng/lib/types";
import type { Writable } from "svelte/store";
import { writable } from "svelte/store";
import type { datagrid as CanvasDatagrid } from "@datadocs/canvas-datagrid-ng";

export type Grid = ReturnType<typeof CanvasDatagrid>;
export const grid: Writable<Grid> = writable(null);
export const gridDataSource: Writable<DataSourceBase> = writable(null);
