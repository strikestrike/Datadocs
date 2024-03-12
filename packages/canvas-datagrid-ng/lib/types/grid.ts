import type { GridInternalState } from '../state';
import type { GridSelectionManager } from '../selections';
import type { GridPositionHelper } from '../position';
import type { GridEventHandler } from '../events';
import type { ClipboardEventHandler } from '../events/clipboard-events';
import type { GridInlineStyles } from '../style/inline-style';
import type { GridButtonComponent } from '../button';
import type { GridDOMHelper } from '../dom';
import type { GridTouchHelper } from '../events/touch-events';
import type { GridGroupManager } from '../groups';
import type { GridSchemaHelper } from '../schema';
import type { GridHideAndUnhide } from '../hide';
// import type { GridTreeManager } from '../tree';
import type { GridStylesHelper } from '../style/style';
import type { GridFilterHelper } from '../data/filters';
import type { GridSorterHelper } from '../data/sorters';
import type { GridMiscMethods } from '../misc-methods';
import type { GridInit } from '../init';
import type { GridViewDataManager } from '../data/view-data';
import type { GridContextMenu } from '../context-menu/index';
import type { GridInitArgs } from './grid-init-args';
import type { MergeDirection } from './cell';
import type { GridProfiler } from '../profiler';
import type { GridDrawManager } from '../draw';
import type { GridSizeHelper } from '../size';
import type { getPresetDataSources } from '../data/data-source/preset';
import type { GridOverlayManager } from '../overlay';
import type { GridDerivedState } from '../state/derived';
import type { GridDispatchEventMethod } from './events';
import type { GridHighlightManager } from '../highlights';
import type { GridPublicMethods } from '../public-api/public-methods';
import type { getGridPublicFields } from '../public-api/public-fields';
import type { getAllUtils } from '../export-utils';
import type { GridNamedRanges } from '../named-ranges';
import type { GridMergedCells } from '../merged-cells';
import type { GridModalManager } from '../modal';
import type { GridCellHelper } from '../cell-helper';
import type { GridDataFormat } from '../data/data-format';
import type { GridDataFormulaPreview } from '../data/data-formula-preview';
import type { GridMouseEventHandler } from '../events/mouse-events';
import type { GridScrollEventHandler } from '../events/scroll-events';
import type { GridMoveSelectionEventHandler } from '../events/move-selection-events';
import type { GridDragEventHandler } from '../events/drag-events';
import type { GridKeyboardEventHandler } from '../events/keyboard-events';

export interface GridPrivateMethods
  extends Omit<GridInit, 'self' | 'grid'>,
    Omit<GridDerivedState, 'self' | 'grid'>,
    Omit<GridDOMHelper, 'self' | 'grid'>,
    Omit<GridDrawManager, 'self' | 'grid'>,
    Omit<GridStylesHelper, 'self' | 'grid'>,
    Omit<GridSchemaHelper, 'self' | 'grid'>,
    // Omit<GridTreeManager, 'self' | 'grid'>,
    Omit<GridSelectionManager, 'self' | 'grid'>,
    Omit<GridHighlightManager, 'self' | 'grid'>,
    Omit<GridHideAndUnhide, 'self' | 'grid'>,
    Omit<GridGroupManager, 'self' | 'grid'>,
    Omit<GridButtonComponent, 'self' | 'grid'>,
    Omit<GridPositionHelper, 'self' | 'grid'>,
    Omit<GridSizeHelper, 'self' | 'grid'>,
    Omit<GridInlineStyles, 'self' | 'grid'>,
    Omit<GridSorterHelper, 'self' | 'grid'>,
    Omit<GridFilterHelper, 'self' | 'grid'>,
    Omit<GridViewDataManager, 'self' | 'grid'>,
    Omit<GridEventHandler, 'self' | 'grid' | 'dispatchEvent'>,
    Omit<GridMouseEventHandler, 'self' | 'grid'>,
    Omit<GridKeyboardEventHandler, 'self' | 'grid'>,
    Omit<GridScrollEventHandler, 'self' | 'grid'>,
    Omit<GridMoveSelectionEventHandler, 'self' | 'grid'>,
    Omit<GridDragEventHandler, 'self' | 'grid'>,
    Omit<ClipboardEventHandler, 'self' | 'grid'>,
    Omit<GridContextMenu, 'self' | 'grid'>,
    Omit<GridTouchHelper, 'self' | 'grid'>,
    Omit<GridOverlayManager, 'self' | 'grid'>,
    Omit<GridModalManager, 'self' | 'grid'>,
    Omit<GridMiscMethods, 'self' | 'grid'>,
    Omit<GridMergedCells, 'self' | 'grid'>,
    Omit<GridNamedRanges, 'self' | 'grid'>,
    Omit<GridCellHelper, 'self' | 'grid'>,
    Omit<GridDataFormat, 'self' | 'grid'>,
    Omit<GridDataFormulaPreview, 'self' | 'grid'> {}

export interface GridPublicAPI
  extends GridPublicMethods,
    ReturnType<typeof getGridPublicFields> {
  readonly attributes: GridInternalState['attributes'];
  readonly formatters: GridInternalState['formatters'];
  readonly transformers: GridInternalState['transformers'];
  readonly filters: GridInternalState['filters'];
  readonly sorters: GridInternalState['sorters'];
  readonly style: GridInternalState['style'];
}

/**
 * Aka `self.intf` in original project
 */
export interface GridPublicProperties
  /**
   * Follow by the code `self.intf = document.createElement('canvas')` in `main.js`, this interface is extended from HTMLCanvasElement
   */
  extends Omit<
      HTMLElement,
      | 'style'
      | 'focus'
      | 'attributes'
      | 'dispatchEvent'
      | 'addEventListener'
      | 'removeEventListener'
      | 'parentNode'
      | 'shadowRoot'
      | 'scrollIntoView'
    >,
    GridPublicAPI {}

export interface GridPrivateProperties
  extends GridPrivateMethods,
    GridInternalState {
  /** @deprecated */
  intf?: GridPublicProperties;
  publicApi?: GridPublicAPI;

  dispatchEvent?: GridDispatchEventMethod;
}

export interface GridStaticProperties {
  MergeDirection: typeof MergeDirection;
  Profiler: typeof GridProfiler;
  DataSources: ReturnType<typeof getPresetDataSources>;
  utils: ReturnType<typeof getAllUtils>;
}

export type GridModuleLoader = (self: GridPrivateProperties) => void;

/**
 * @alias GridPublicAPI
 */
export type GridInstance = GridPublicAPI & HTMLElement;
export type CreateGridFn = (args?: GridInitArgs) => GridPublicAPI;
