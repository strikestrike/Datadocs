import derivedState from './state/derived';
import draw from './draw/index';
import events from './events/index';
import mouseEvents from './events/mouse-events';
import keyboardEvents from './events/keyboard-events';
import scrollEvents from './events/scroll-events';
import moveSelectionEvents from './events/move-selection-events';
import dragEvents from './events/drag-events';
import clipboardEvents from './events/clipboard-events';
import touch from './events/touch-events';
import init from './init';
import schema from './schema';
import selections from './selections/index';
import groups from './groups/index';
import hideAndUnhide from './hide';
import contextMenu from './context-menu/index';
import button from './button';
import dom from './dom';
import styles from './style/style';
import inlineStyles from './style/inline-style';
import filters from './data/filters';
import sorters from './data/sorters';
import viewData from './data/view-data';
import position from './position';
import highlights from './highlights';
import overlay from './overlay/index.js';
import modal from './modal/index.js';
import size from './size';
import mergedCells from './merged-cells/index';
import namedRanges from './named-ranges/index';
import cellHelper from './cell-helper/index';
import dataFormat from './data/data-format';
import dataFormulaPreview from './data/data-formula-preview';
// import tree from './tree/index';
import miscMethods from './misc-methods';
import type { GridModuleLoader, GridPrivateProperties } from './types/grid';

export const gridModules: GridModuleLoader[] = [
  init,
  derivedState,
  viewData,
  position,
  size,
  draw,
  events,
  mouseEvents,
  keyboardEvents,
  scrollEvents,
  moveSelectionEvents,
  dragEvents,
  clipboardEvents,
  touch,
  schema,
  selections,
  highlights,
  groups,
  hideAndUnhide,
  contextMenu,
  button,
  inlineStyles,
  styles,
  dom,
  filters,
  sorters,
  overlay,
  modal,
  miscMethods,
  mergedCells,
  namedRanges,
  cellHelper,
  dataFormat,
  dataFormulaPreview,
  // tree,
];

export function loadAllGridModules(
  gridState: GridPrivateProperties,
  exportTo: HTMLElement,
) {
  gridState.componentRoot = exportTo;
  gridState.intf = exportTo as any;
  gridState.publicApi = exportTo as any;
  // gridState.publicApi = {} as any;

  // gridState.applyComponentStyle = webComponent.applyComponentStyle;
  gridModules.forEach(function (module) {
    module(gridState);
  });
  return gridState.intf;
}
