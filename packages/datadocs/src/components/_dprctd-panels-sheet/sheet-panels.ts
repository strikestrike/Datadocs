import Spreadsheet from "./Spreadsheet/Spreadsheet.svelte";
import BlankCanvas from "./BlankCanvas/BlankCanvas.svelte";
import Graph from "./Graph/Graph.svelte";

import { spreadsheetConfig } from "./Spreadsheet/Spreadsheet";
import { blankCanvasConfig } from "./BlankCanvas/BlankCanvas";
import { graphConfig } from "./Graph/Graph";

import { addPanel } from "./sheet-panels-config";

/**
 * This method is called to initiate Panels
 * import Panel Config and Svelte component  and call addPanel method
 */
export function initializePanels() {
  addPanel(spreadsheetConfig, Spreadsheet);
  addPanel(blankCanvasConfig, BlankCanvas);
  addPanel(graphConfig, Graph);

  // Add new Panels here
}
