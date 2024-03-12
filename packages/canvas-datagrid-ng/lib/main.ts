import { GridInternalState } from './state';
import { MergeDirection } from './types/cell';
import type {
  GridPrivateProperties,
  GridPublicProperties,
  CreateGridFn,
  GridStaticProperties,
  GridPublicAPI,
} from './types/grid';
import type { GridInitArgs } from './types/grid-init-args';
import { GridProfiler } from './profiler';
import { getPresetDataSources } from './data/data-source/preset';
import { componentName } from './web-component/const';
import { GridWebComponent } from './web-component';
import { applyComponentInitArgs } from './web-component/attribute-setter';
import { loadAllGridModules } from './modules';
import { getAllUtils } from './export-utils';

GridWebComponent.register();

/**
 * This grid component class is used for the context that doesn't support WebComponent.
 */
class GridComponent {
  //#region static properties
  static MergeDirection = MergeDirection;
  static Profiler = GridProfiler;
  static DataSources = getPresetDataSources();
  //#region static properties

  readonly publicApi: GridPublicProperties;
  constructor(args: GridInitArgs) {
    args = args || {};
    const self: GridPrivateProperties = new GridInternalState() as any;
    self.isComponent = true;
    self.args = args;

    const component = document.createElement('div');
    loadAllGridModules(self, component);
    /** @see https://caniuse.com/shadowdomv1 */
    self.shadowRoot = component.attachShadow({ mode: 'open' });
    self.parentNode = self.shadowRoot as any;
    self.init();
    this.publicApi = component as any;
    // @todo after all intf is removed, use the following statement
    // this.publicApi = self.publicApi;
  }
}

/**
 * @label {Entrypoint}
 */
function createGrid(args?: GridInitArgs): GridPublicAPI {
  args = args || {};
  const useWebComponent = args.component !== false;

  let gridElement: GridPublicAPI;
  // The web component is supported in the current environment.
  // GridWebComponent.registered = false;
  if (GridWebComponent.registered && useWebComponent) {
    const component = document.createElement(componentName);
    applyComponentInitArgs(component, args);
    gridElement = component as any;
    // @todo after all intf is removed, use the following statement
    // gridElement = (component as GridWebComponent).publicAPI;
  } else {
    const component = new GridComponent(args);
    gridElement = component.publicApi;
  }

  // append to target parentNode (add to the dom very last to avoid redraws)
  if (args.parentNode && args.parentNode.appendChild)
    args.parentNode.appendChild(gridElement.componentRoot);
  return gridElement;
}
function bindStaticProperties(target: Partial<GridStaticProperties>) {
  target.MergeDirection = MergeDirection;
  target.Profiler = GridProfiler;
  target.DataSources = getPresetDataSources();
  target.utils = getAllUtils();
}
bindStaticProperties(createGrid as any);

//
//#region export this component
//
/*
Out-dated comments:
Export this component entrypoint by amd loader.

Explanation for the question: where is it exported to after this component is bundled by `webpack`?
It is exported to the global variable named `canvasDatagrid`. For example: `window.canvasDatagrid === createGrid`.

Why it is exported to this variable. It is caused by the value of the config `output.library` in the `webpacl.config.js`
*/

/**
 * A method that can create a grid component by invoking it.
 * And it also contains some utilities properties for the grid
 *
 * {@link Types.GridStaticProperties}
 * @see GridStaticProperties
 */
export const datagrid = createGrid as GridStaticProperties & CreateGridFn;
export * from './types';
//#region export enum
export { ConfirmDialogChoice } from './modal/spec';
//#endregion export enum

// export the grid component to global

/**
 * Export this component entrypoint to global without any loader.
 */
// Present to exclude global declarations from ES Module bundles
if (window && !window.EXCLUDE_GLOBAL && !window.require) {
  const exportTo = 'canvasDatagrid';
  if (!window[exportTo]) window[exportTo] = createGrid as any;
}
//
//#endregion export this component
//
