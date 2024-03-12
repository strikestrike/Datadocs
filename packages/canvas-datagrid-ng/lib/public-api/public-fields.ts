import { addFallbackAPIsForDataSource } from '../data/data-source/fallback';
import type { DataEventListener } from '../data/event-target/spec';
import type { ModalDialogProvider } from '../modal/spec';
import type { GridProfiler } from '../profiler';
import type { GridViewportState } from '../state/viewport';
import type {
  DataSourceBase,
  GridPrivateProperties,
  RectangleObject,
} from '../types';

/**
 * @returns The grid's public fields.
 * - Getter and setter will be merged to the grid public API object directly.
 * - Plain fields will be merged as read only to the grid public API object.
 * - Other properties will be omitted
 */
export function getGridPublicFields(self: GridPrivateProperties) {
  const dataSourceListener: DataEventListener = (ev) => {
    // console.log('DataSouceEvent: ' + ev.name);
    switch (ev.name) {
      case 'data':
      case 'load':
      case 'edit':
      case 'filter':
      case 'table':
        self.draw();
        break;
    }
    if (self.dispatchEvent('datasource', ev)) return;
    self.checkShowLoadingUI();
    self.canvas.width = 0;
    self.resize(true);
  };

  return {
    args: self.args,
    formatters: self.formatters,
    transformers: self.transformers,
    isComponent: self.isComponent,
    range: self.range,

    get profiler() {
      return self.profiler;
    },
    set profiler(profiler: GridProfiler) {
      self.profiler = profiler;
    },

    canvas: self.canvas,
    get context() {
      return self.ctx;
    },
    get ctx() {
      return self.ctx;
    },
    get drawSynchronously() {
      return self.attributes.drawSynchronously;
    },
    set drawSynchronously(value: boolean) {
      self.attributes.drawSynchronously = value;
    },

    get order() {
      return self.orders;
    },
    get selectionBounds() {
      return self.getSelectionBounds();
    },
    get visibleSchema() {
      return self.getVisibleSchema().map((it) => it);
    },

    get height() {
      if (!self.shadowRoot) return;
      return self.shadowRoot.height;
    },
    set height(value) {
      if (!self.shadowRoot) return;
      self.shadowRoot.height = value;
      self.resize(true);
    },

    get width() {
      if (!self.shadowRoot) return;
      return self.shadowRoot.width;
    },
    set width(value) {
      if (!self.shadowRoot) return;
      self.shadowRoot.width = value;
      self.resize(true);
    },

    get parentNode() {
      if (!self.shadowRoot) return;
      return self.parentNode;
    },
    set parentNode(value) {
      if (!self.shadowRoot) return;
      self.parentNode = value;
    },
    get parentDOMNode() {
      return self.parentDOMNode;
    },
    get componentRoot() {
      return self.componentRoot;
    },

    get visibleRowHeights() {
      return self.viewport.rowHeights;
    },

    get frozenRow() {
      return self.frozenRow;
    },
    set frozenRow(val) {
      if (isNaN(val)) {
        throw new TypeError('Expected value for frozenRow to be a number.');
      }
      if (self.viewport.rows.size < val) {
        throw new RangeError(
          'Cannot set a value larger than the number of visible rows.',
        );
      }
      self.frozenRow = val;
    },

    get frozenColumn() {
      return self.frozenColumn;
    },
    set frozenColumn(val) {
      if (isNaN(val)) {
        throw new TypeError('Expected value for frozenRow to be a number.');
      }
      if (self.getVisibleSchema().length < val) {
        throw new RangeError(
          'Cannot set a value larger than the number of visible columns.',
        );
      }
      self.frozenColumn = val;
    },

    get scrollIndexRect(): RectangleObject {
      return {
        top: self.scrollIndexTop,
        right: self.scrollIndexRight,
        bottom: self.scrollIndexBottom,
        left: self.scrollIndexLeft,
      };
    },
    get scrollPixelRect(): RectangleObject {
      return {
        top: self.scrollPixelTop,
        right: self.scrollPixelRight,
        bottom: self.scrollPixelBottom,
        left: self.scrollPixelLeft,
      };
    },

    get scrollLeft() {
      return self.scrollBox.scrollLeft;
    },
    set scrollLeft(value) {
      self.scrollBox.scrollLeft = value;
    },

    get sizes() {
      return self.dataSource.sizes;
    },

    get input() {
      return self.input;
    },

    get controlInput() {
      return self.controlInput;
    },

    get currentCell() {
      return self.currentCell;
    },

    get visibleCells() {
      return self.visibleCells;
    },

    get viewport() {
      // Because the methods in the viewport manager are designed for internal use in the Grid.
      // So we assign a fields only type for it
      return self.viewport as GridViewportState;
    },

    get selectionList() {
      return self.selections;
    },

    get dragMode() {
      return self.dragMode;
    },

    /**
     * From original API document:
     * > Note: When you pass string data into the web component and
     * >  the `grid.dataType` is set to the default: `application/x-canvas-datagrid`
     * >  it will become set to `application/json+x-canvas-datagrid` to parse the string data.
     * >  If `grid.dataType` was previously changed,
     * >  the parser it was changed to will be used instead.
     */
    get dataType() {
      return self.dataType;
    },
    set dataType(value) {
      self.dataType = value;
    },

    //#region component fields
    get offsetHeight() {
      return self.isComponent ? self.canvas.offsetHeight : undefined;
    },
    get offsetWidth() {
      return self.isComponent ? self.canvas.offsetWidth : undefined;
    },
    //#endregion

    get scrollHeight() {
      return self.scrollBox.scrollHeight;
    },

    get scrollWidth() {
      return self.scrollBox.scrollWidth;
    },

    get scrollTop() {
      return self.scrollBox.scrollTop;
    },
    set scrollTop(value) {
      self.scrollBox.scrollTop = value;
    },

    get modalProvider() {
      return self.modal;
    },
    set modalProvider(modal: ModalDialogProvider) {
      self.modal.dispose();
      self.modal = modal;
    },

    get dataSource() {
      return self.dataSource;
    },
    set dataSource(dataSource: DataSourceBase) {
      self.dataSource.removeListener(dataSourceListener);
      self.dataSource.unbind(self.publicApi);
      // Make sure all API has a fallback implementation
      addFallbackAPIsForDataSource(dataSource);
      self.dataSource = dataSource;
      self.canvas.width = 0;
      self.resize(true);
      self.checkShowLoadingUI();
      dataSource.bind(self.publicApi);
      dataSource.addListener(dataSourceListener);
    },

    get shadowRoot() {
      return self.shadowRoot;
    },
    get activeCell() {
      return self.activeCell;
    },
    get hasFocus() {
      return self.hasFocus;
    },
    get hasActiveFilters() {
      return self.hasActiveFilters();
    },
    get scrollIndexLeft() {
      return self.scrollBox.scrollIndexLeft;
    },
    set scrollIndexLeft(val: number) {
      self.scrollBox.scrollIndexLeft = val;
    },
    get scrollIndexTop() {
      return self.scrollBox.scrollIndexTop;
    },
    set scrollIndexTop(val: number) {
      self.scrollBox.scrollIndexTop = val;
    },
  };
}
