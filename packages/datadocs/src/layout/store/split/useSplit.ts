import { CONTEXT_TYPE } from "src/layout/constants/context";
import { ContextType } from "src/layout/enums/context";
import { Split } from "src/layout/enums/split";
import type { Type } from "src/layout/types/context";
import type { Pane, PaneContent } from "src/layout/types/pane";
import type { SplitData, SplitLevel } from "src/layout/types/split";
import { getContext, tick } from "svelte";
import type { Writable } from "svelte/store";
import { get } from "svelte/store";
import { useLayoutSheet, useLayoutWorkBook } from "../pane";
import { useStore } from "./useStore";
import { splitDataSheet, splitDataWorkbook } from "./store-split";

const { layoutStore: layoutSheet, layout: layoutCacheSheet } = useLayoutSheet();
const { layoutStore: layoutWorkbook, layout: layoutCacheWorkbook } =
  useLayoutWorkBook();

const storeSheet = useStore(splitDataSheet, ContextType.SHEET);
const storeWorkbook = useStore(splitDataWorkbook, ContextType.WORKBOOK);

layoutSheet.subscribe((config) => {
  if (config) {
    storeSheet.init(get(layoutCacheSheet).root);
  }
});

layoutWorkbook.subscribe((config) => {
  if (config) {
    storeWorkbook.init(get(layoutCacheWorkbook).root);
  }
});

export function useSplit() {
  const type = getContext<Type>(CONTEXT_TYPE);
  return type === ContextType.SHEET ? storeSheet : storeWorkbook;
}
