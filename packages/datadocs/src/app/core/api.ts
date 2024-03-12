import { get } from "svelte/store";

import type { WorkspaceConfig } from "../../layout/_dprctd/types";
import { sheetsDataStore } from "../store/store-worksheets";

import wsheet01Single from "../store/sheets/wsheet-01-single";
import wsheet02Tiled from "../store/sheets/wsheet-02-tiled";
import wsheet03Tabs from "../store/sheets/wsheet-03-tabs";
import wsheet04Divide from "../store/sheets/wsheet-04-divide";
import wsheet05Nested from "../store/sheets/wsheet-05-nested";

const worksheets = {
  1: wsheet01Single,
  2: wsheet02Tiled,
  3: wsheet03Tabs,
  4: wsheet04Divide,
  5: wsheet05Nested,
};

export const api = {
  getSheetContent: async (id: string) => {
    return new Promise((resolve) => {
      const sheets = get(sheetsDataStore);
      const sheet = sheets.find((s) => s.id === id);
      resolve(sheet.config);
    });
  },
  saveSheetContent: async (id: string, sheetData: WorkspaceConfig) => {
    return new Promise((resolve) => {
      const sheets = get(sheetsDataStore);
      const sheet = sheets.find((s) => s.id === id);
      sheet.config = sheetData;
      resolve(true);
    });
  },
};
