import Sources from "./Sources/Sources.svelte";
import { sourcesConfig } from "./Sources/Sources";
import TableView from "./TableView/TableView.svelte";
import { tableViewConfig } from "./TableView/TableView";
import QueryHistory from "./QueryHistory/QueryHistory.svelte";
import { queryhistoryConfig } from "./QueryHistory/QueryHistory";
import History from "./History/History.svelte";
import { historyConfig } from "./History/History";
import Layers from "./Layers/Layers.svelte";
import { layersConfig } from "./Layers/Layers";
import Objects from "./Objects/Objects.svelte";
import { objectsConfig } from "./Objects/Objects";
import NamedRanges from "./NamedRanges/NamedRanges.svelte";
import { namedRangesConfig } from "./NamedRanges/NamedRanges";
import Datadocs from "./Datadocs/Datadocs.svelte";
import { datadocsConfig } from "./Datadocs/Datadocs";

// Dummy panels for testing
import Tools from "./Tools/Tools.svelte";
import { toolsConfig } from "./Tools/Tools";
import Plugins from "./Plugins/Plugins.svelte";
import { pluginsConfig } from "./Plugins/Plugins";
import Actions from "./Actions/Actions.svelte";
import { actionsConfig } from "./Actions/Actions";
import Adjustments from "./Adjustments/Adjustments.svelte";
import { adjustmentsConfig } from "./Adjustments/Adjustments";
import Navigator from "./Navigator/Navigator.svelte";
import { navigatorConfig } from "./Navigator/Navigator";
import Notes from "./Notes/Notes.svelte";
import { notesConfig } from "./Notes/Notes";
import Info from "./Info/Info.svelte";
import { infoConfig } from "./Info/Info";
import Presets from "./Presets/Presets.svelte";
import { presetsConfig } from "./Presets/Presets";
import Shape from "./Shape/Shape.svelte";
import { shapeConfig } from "./Shape/Shape";

// Dashboard Panels
import SpreadSheet from "./SpreadSheet/SpreadSheet.svelte";
import { spreadsheetConfig } from "./SpreadSheet/SpreadSheet";
import Graph from "./Graph/Graph.svelte";
import { graphConfig } from "./Graph/Graph";
import Image from "./Image/Image.svelte";
import { imageConfig } from "./Image/Image";

import { addPanel } from "./panels-config";

/**
 * This method is called to initiate Panels
 * import Panel Config and Svelte component  and call addPanel method
 */
export function initializePanels() {
  addPanel(sourcesConfig, Sources);
  addPanel(tableViewConfig, TableView);
  addPanel(historyConfig, History);
  addPanel(queryhistoryConfig, QueryHistory);
  addPanel(layersConfig, Layers);
  addPanel(objectsConfig, Objects);
  addPanel(spreadsheetConfig, SpreadSheet);
  addPanel(graphConfig, Graph);
  addPanel(namedRangesConfig, NamedRanges);
  addPanel(datadocsConfig, Datadocs);

  // Dummy panels for testing
  addPanel(toolsConfig, Tools);
  addPanel(pluginsConfig, Plugins);
  addPanel(actionsConfig, Actions);
  addPanel(adjustmentsConfig, Adjustments);
  addPanel(navigatorConfig, Navigator);
  addPanel(notesConfig, Notes);
  addPanel(infoConfig, Info);
  addPanel(presetsConfig, Presets);

  // Dashboard Panels
  addPanel(spreadsheetConfig, SpreadSheet);
  addPanel(graphConfig, Graph);
  addPanel(imageConfig, Image);
  addPanel(shapeConfig, Shape);

  // Add new Panels here
}
