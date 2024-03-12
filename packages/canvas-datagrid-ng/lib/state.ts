import { GridEasingFunctions } from './animation';
import type { GroupData, VisibleGroupItem } from './groups/types';
import type {
  SelectionRequestContext,
  SelectionDescriptor,
} from './selections/types';
import type {
  CellDescriptor,
  EllipsisCacheMap,
  GridDragMode,
  GridInitArgs,
  GridParentNode,
  HTMLImageCacheMap,
  SorterFnGenerator,
  VisibleUnhideIndicator,
  FormatterFn,
  TransformerFn,
  NormalCellDescriptor,
  Cursor,
  CursorGrab,
  CursorGrabbing,
  RangeDescriptor,
  CellIndex,
  ScrollBarTarget,
  DragContext,
  ScrollContext,
  TableDescriptor,
  GridHeader,
} from './types';
import type { PixelPosition } from './types/base-structs';
import type { GridAttributes } from './attributes';
import type { GridProfiler } from './profiler';
import type { ScrollBox } from './scroll-box';
import type { DataSourceBase } from './data/data-source/spec';
import type { GridInternalContextMenu } from './context-menu/internal';
import type { HighlightDescriptor } from './highlights/types';
import type { StylePreviewManager } from './style/preview/style-preview-manager';
import type { defaultGridStyles } from './style/default-styles';
import { EmptyDataSource } from './data/data-source/empty';
import { DefaultSystemClipboard } from './clipboard/default-system-clipboard';
import type { PasteBehaviourConfig } from './clipboard/spec';
import { defaultPasteBehaviour } from './clipboard/spec';
import type { OverlayDescriptor } from './types/overlay';
import type { ModalDialogProvider } from './modal/spec';
import { DefaultModalDialogProvider } from './modal/defaults';
import type { EditorElement } from './editor/type';
import { GridViewportStateManager } from './state/viewport';

export type ReorderDescriptor = {
  /**
   * The heights/widths of the rows/cols that come before the `startCell`, which
   * is used to position the reorder overlay relative to the row/col header the
   * user has started dragging.
   */
  offset: number;
  /**
   * X axis coordinate for column reordering or Y for row reordering.
   */
  position: number;
  /**
   * The width of columns/the height of the rows depending on the reordering
   * type.
   */
  size: number;
  /**
   * The row/column that the user started dragging from.
   */
  startCell: NormalCellDescriptor;
  /**
   * The current cell where the user can stop dragging to complete the
   * reordering process.  This may become undefined if the user goes over a
   * cell (or any other prop) that can't used for reordering.
   */
  targetCell?: NormalCellDescriptor;
  /**
   * Which side of the `targetCell` should be used to end the reordering
   * process.  For column reordering, this is either the left or the right
   * of the cell, or the top or the bottom of the cell for row reordering.
   */
  targetSnapToEnd?: boolean;
  /**
   * The change in frozen area if the user is moving rows/cols in or out of it.
   */
  changeInFrozenArea: number;
  /**
   * Keep a cache for the items that has been tried for whether they can be
   * for reordering, and where the closest target that can be used is when they
   * cannot be.
   */
  targetCache: { [key: string]: number | boolean };
};

export const defaultDataType = 'application/x-canvas-datagrid';

export class GridInternalState {
  // todo: move readonly fields to another class Eg: GridConfig
  readonly blankValues: any[] = [undefined, null, ''];
  readonly storageName = 'canvasDataGrid';
  readonly invalidSearchExpClass = 'canvas-datagrid-invalid-search-regExp';
  readonly localStyleLibraryStorageKey = 'canvas-datagrid-user-style-library';
  readonly scrollModes: ScrollBarTarget[] = [
    'vertical-scroll-box',
    'vertical-scroll-top',
    'vertical-scroll-bottom',
    'horizontal-scroll-box',
    'horizontal-scroll-right',
    'horizontal-scroll-left',
  ];
  readonly eventNames = [
    'activecellchanged',
    'afterdraw',
    'afterrendercell',
    'afterrenderfilterbutton',
    'aftercreategroup',
    'attributechanged',
    'beforeinitactivecell',
    'beforebeginedit',
    'beforecreatecellgrid',
    'beforedraw',
    'beforeendedit',
    'beforerendercell',
    'beforerendercellgrid',
    'beforerenderfilterbutton',
    'beginedit',
    'cellmouseout',
    'cellmouseover',
    'click',
    'collapsetree',
    'columnhide',
    'columnunhide',
    'contextmenu',
    'copy',
    'datachanged',
    'dblclick',
    'endedit',
    'expandtree',
    'formatcellvalue',
    'hidecellerror',
    'hidecellpreview',
    'keydown',
    'keypress',
    'keyup',
    'mousedown',
    'mousemove',
    'mouseup',
    'newrow',
    'ordercolumn',
    'rendercell',
    'rendercellgrid',
    'renderorderbyarrow',
    'rendertext',
    'rendertreearrow',
    'reorder',
    'reordering',
    'resize',
    'resizecolumn',
    'resizerow',
    'schemachanged',
    'scroll',
    'selectionchanged',
    'showcellerror',
    'showcellpreview',
    'stylechanged',
    'touchcancel',
    'touchend',
    'touchmove',
    'touchstart',
    'wheel',
    'editorselectionchange',
    'editorvaluechange',
    'showupdatelinkmenu',
    'linkpositionchanged',
  ];
  readonly nodeType = 'canvas-datagrid';
  dataType = defaultDataType;

  //#region browser detection
  ie?: boolean;
  edge?: boolean;
  webKit?: boolean;
  moz?: boolean;
  mobile?: boolean;
  //#endregion browser detection

  /**
   * The value of this field is the thing that the grid is processing on.
   *
   * If this value is not an empty string, it means an action is being processed.
   * But it isn't complete now. May be waiting for user confirmation or requesting API.
   *
   * So for the grid's internal,
   * please check this variable at the beginning of the event handler function.
   * Don't process current event if this value is not empty.
   *
   * For example:
   * The user tried to re-order columns,
   * the application displays a confimation dialog composed of HTML elements.
   * In this case, the application and the grid need to wait for the user to
   * click the buttons in the dialog.
   * So now this value is `reorder` and the grid should not handle any mouse events or keyboard events
   */
  processing = '';

  //#region DOMs
  /**
   * This is the container of the grid.
   * It is one of the following element:
   * * `HTMLDivElement` for the grid that is NOT created by WebComponent
   * * WebComponent: `canvas-datagrid` for the grid that is created by WebComponent
   *
   * Creating by WebComponent doesn't only mean using grid
   * by a WebComponent DOM tag in your HTML.
   * But also creating the grid via API `createGrid` with
   * a browser context that supports WebComponent
   * @see {createGrid}
   */
  componentRoot: HTMLElement;
  parentNode?: GridParentNode;
  parentNodeStyle?: CSSStyleDeclaration;
  parentDOMNode?: HTMLElement;
  //#endregion DOMs

  /**
   * The target that receives the mouse and other similar events (this is
   * usually the canvas).
   */
  eventParent?: EventTarget;

  height = 0;
  width = 0;
  innerHTML = '';
  canvas?: HTMLCanvasElement;
  ctx?: CanvasRenderingContext2D;
  canvasOffsetLeft?: number;
  canvasOffsetTop?: number;
  contextMenu?: GridInternalContextMenu;
  input?: EditorElement;

  /**
   * The element that receives the events such as keyboard presses, clipboard
   * events (cut, copy, and paste), and other events that require a focusable
   * element. Note that this element has to be focusable in order to function
   * properly and is usually the parent node that contains the canvas.
   */
  controlInput?: HTMLInputElement;

  /**
   * This is an element as a render container role.
   * Its size is always as same as the canvas of the grid.
   * And it is always on the top of the canvas
   * It can be used for rendering loading indicator, internal dialog....
   */
  overlays = new Map<string, OverlayDescriptor>();

  fillOverlay?: {
    rowIndex: number;
    columnIndex: number;
    distance: { x?: number; y?: number; x0?: number; y0?: number };
    selection: RangeDescriptor;
    direction?: 'x' | 'y';
    lastInBoundsLocation?: { x: number; y: number };
  };
  DOMStyles?: CSSStyleDeclaration;
  shadowRoot?: ShadowRoot & { width?: number; height?: number };
  observer?: MutationObserver;

  //#region clipboard
  systemClipboard = new DefaultSystemClipboard();
  pasteBehaviour: Required<PasteBehaviourConfig> = {
    ...defaultPasteBehaviour,
  };
  //#endregion clipboard

  style: typeof defaultGridStyles = {} as any;
  computedStyle: CSSStyleDeclaration;

  styleKeys?: string[];
  appliedInlineStyles: any = {};

  stylePreviewManager: StylePreviewManager;

  isComponent?: boolean;
  /**
   * Whether the grid is receiving mouse or touch move events, and it hasn't
   * received those events from {@link window} where it is not the target.
   *
   * This is used for updating the grid when the cursor leaves it, and there
   * are stale hover targets that needs to updating.
   */
  isGridCursorTarget = false;
  /**
   * Whether the grid (or its {@link controlInput}) currently has the focus.
   */
  get hasFocus() {
    // We might put `controlInput` inside the shadow element hosted by the grid,
    // so check if the active element is the grid first.
    return (
      document.activeElement == this.shadowRoot?.host ||
      document.activeElement == this.controlInput
    );
  }
  initialized = false;
  ignoreNextClick?: boolean;
  newRow?: any;

  cellBoundaryCrossed?: boolean;
  rowBoundaryCrossed?: boolean;
  columnBoundaryCrossed?: boolean;

  attributes: GridAttributes = {} as any;
  args?: GridInitArgs;

  modal: ModalDialogProvider = new DefaultModalDialogProvider();

  dataSource?: DataSourceBase = new EmptyDataSource();
  page = { horizontal: 0, vertical: 0 };
  schemaHashes?: any = {};

  formatters: {
    string?: FormatterFn;
    [x: string]: FormatterFn;
  } = {};
  transformers: TransformerFn[] = [];
  sorters: {
    string?: SorterFnGenerator;
    number?: SorterFnGenerator;
    date?: SorterFnGenerator;
    [x: string]: SorterFnGenerator;
  } = {};
  hovers: any = {};

  mouse: PixelPosition = { x: 0, y: 0 };
  lastMouseDownTarget?: EventTarget;
  moveContext?: {
    /**
     * Row index offset. '0' means no offset yet.
     */
    row: number;
    /**
     * Column index offset. '0' means no offset yet.
     */
    column: number;
    /**
     * The selection that is being moved.
     */
    selection: SelectionDescriptor;
  };

  orders = {};
  filters: any = {};
  columnFilters: any = {};
  filterable = {
    rows: [],
    columns: [],
  };
  selectedFilterButton = {
    columnIndex: -1,
    rowIndex: -1,
  };
  invalidFilterRegEx?: any;

  /**
   * The context for the `self.autoScrollZone` method.
   *
   * This keeps track of the pending auto-scroll events waiting
   * to be invoked by {@link requestAnimationFrame}.
   */
  autoScrollContext?: { frameRequestHandle: number };

  dragItem?: CellDescriptor;
  draggingItem?: CellDescriptor;
  dragging?: CellDescriptor;
  dragStart?: PixelPosition;
  dragStartObject?: CellDescriptor;
  dragMode?: GridDragMode;
  /**
   * This is used when there is a frozen area, and the user moves from a frozen
   * area to a non-frozen one, and vice-versa.
   *
   * When the user crosses the frozen area for the first time, the related axis
   * in this object will be set to true, and when the user returns to the frozen
   * area, it will be set to false. On both occasions, we will reset the scroll
   * to start.
   *
   * Finally, we need this because we autoscroll and resetting all the time,
   * invalidates such the former.
   */
  dragFromFrozenInitialReset: { x?: boolean; y?: boolean } = {};

  reorderContext?: ReorderDescriptor;

  touches = [] as Touch[];
  touchPositions = [] as PixelPosition[];
  touchDeltas = [] as PixelPosition[];
  touchStartEvent?: TouchEvent;
  touchStart?: PixelPosition;
  touchState?: 'selection' | 'scroll' | 'scrollbar' | 'zoom';
  touchSelecting?: boolean;
  touchScrolling?: boolean;
  touchScrollTimeout: NodeJS.Timeout;
  /**
   * The context for the ongoing scroll animation.
   */
  touchScrollAnimationContext?: {
    x: number;
    y: number;
    iteration: number;
    frameCallback: 0;
  };
  get primaryTouch() {
    return this.touches[0];
  }
  get primaryTouchPosition() {
    return this.touchPositions[0] ?? { x: 0, y: 0 };
  }
  get primaryTouchDelta() {
    return this.touchDeltas[0] ?? { x: 0, y: 0 };
  }
  get touchCount() {
    return this.touches.length;
  }

  /**
   * Whether currently selecting cells by dragging the selection overlay.
   */
  selecting?: boolean;
  /**
   * Here are explanation for the item of this array:
   *
   * The type of properties about the row in it is viewRowIndex (startRow, endRow).
   * Here is an example of accessing the row data from the selection object:
   * `const rowData = originalData[self.getBoundRowIndexFromViewRowIndex(selection.startRow)]`
   *
   * The type of properties about the column in it is columnOrderIndex (startColumn, endRow)
   * Here is an example of accessing thr column schema from the selection object:
   * `const columnSchema = schema[self.orders.columns.getRealIndex(selection.startColumn)]`
   */
  selections: SelectionDescriptor[] = [];
  highlights: HighlightDescriptor[] = [];

  /**
   * Whether there is a selection request that needs to be fulfilled.
   *
   * The cell selection mode will finish once the active cell changes.
   *
   * The range selection mode will finishes once the user stops dragging
   * the selection overlay.
   *
   * The user selection will be ignored when in this mode and the input will
   * be sent to the callback. You should change the selection if you need it
   * to change.
   */
  selectionRequestContext: SelectionRequestContext;
  /**
   * This holds the selection that contains the active cell. Most of
   * the time, it is going to be the same as {@link lastAddedSelection},
   * however, if the user navigates between selections, e.g., with
   * `self.moveActiveCell`, this will keep track of that.
   */
  activeSelection?: SelectionDescriptor;
  /**
   * The last added selection, also known as, the primary selection. This will
   * always be up to date.
   *
   * This should be accessed with `self.getPrimarySelection()` only.
   */
  lastAddedSelection?: SelectionDescriptor;

  selectionBounds?: any;

  scrollIndexRight?: number;
  scrollPixelRight?: number;
  scrollIndexBottom?: number;
  scrollPixelBottom?: number;
  get scrollIndexTop() {
    return this.scrollBox.scrollIndexTop;
  }
  get scrollPixelTop() {
    return this.scrollBox.scrollPixelTop;
  }
  get scrollIndexLeft() {
    return this.scrollBox.scrollIndexLeft;
  }
  get scrollPixelLeft() {
    return this.scrollBox.scrollPixelLeft;
  }
  scrollContext?: ScrollContext;
  scrollBox: ScrollBox;
  scrollTimer?: number;

  /**
   * The number of digits used to calculate the previous row number column width.
   *
   * When not matched with the max number of digits needed to draw, we wil update
   * the width so that the column only consumes as much as it needs.
   */
  rowNumberColumnDigitCount = 0;
  rowNumberColumnWidth = 0;
  /**
   * Whether any row label cell was showing an unhide button when the grid was
   * last drawn.
   */
  rowNumberShowingUnhideButtons = false;

  frozenRowsHeight = 0;
  frozenColumnsWidth = 0;

  /**
   * The total width of all the columns.
   */
  scrollableDataWidth = 0;
  /**
   * The total height of all the rows.
   */
  scrollableDataHeight = 0;

  /**
   * Total number of hidden rows.
   */
  hiddenRowCount = 0;

  /**
   * The scaling value that the user manually set for the grid.
   * @see scale
   */
  userScale = 1;
  /**
   * The scaling value that is coming from the window and that is equal to the
   * combination of the current zoom value, and the value of system-wide
   * scaling.
   * @see scale
   * @see window.devicePixelRatio
   */
  get windowScale() {
    return Math.min(
      this.attributes.maxPixelRatio,
      window.devicePixelRatio || 1,
    );
  }
  /**
   * The value that can be used to draw UI elements.  This uses both the
   * window's default scaling value {@link window.devicePixelRatio} and also,
   * the grid's user-set scaling value {@link userScale}.
   */
  get scale() {
    return this.windowScale * this.userScale;
  }

  startScale?: number;
  scaleDelta?: number;

  zoomDeltaStart?: number;

  activeCell: CellIndex = {
    columnIndex: 0,
    rowIndex: 0,
  };
  currentCell?: CellDescriptor;
  currentDragContext?: DragContext | 'none';
  startingCell?: CellDescriptor;
  activeTableFieldDropdown?: {
    table: TableDescriptor;
    header: GridHeader;
  };
  activeAggregationOptsDropdown?: {
    table: TableDescriptor;
    header: GridHeader;
    rowIndex: number;
    closeHandle: {
      onClose?: () => any;
    };
  };

  passive = false;

  frozenRow = 0;
  frozenColumn = 0;

  lastFrozenColumnPixel?: number;
  lastFrozenRowPixel?: number;
  freezeMarkerPosition?: {
    /**
     * This represents the X coordinate of the cursor when column freezing,
     * or the Y coordinate when row freezing.
     */
    pos: number;
    /**
     * Similarly to `pos`, this represents the X or Y coordinate of the cell
     * depending on the freezing type.
     */
    cellPos?: number;
    /**
     * This represents the column index when freezing the columns or
     * the row index when freezing the rows.
     */
    index?: number;
    /**
     * Snap the indicator to the current frozen position instead of letting
     * it follow the user cursor.
     */
    snapIndicator?: boolean;
  };
  startFreezeMove?: CellIndex;

  /**
   * Stores the grouped column data.
   *
   * Each array represents nesting of groups with the first one containing
   * members but without any membership.
   *
   * @see GroupData
   */
  groupedColumns: GroupData[] = [];

  /**
   * Stores the grouped column data.
   *
   * Each array represents nesting of groups with the first one containing
   * members but without any membership.
   *
   * @see GroupData
   */
  groupedRows: GroupData[] = [];

  /**
   * Whether the group toggle button is put to the end of group (instead of
   * start).
   */
  isColumnGroupToggleButtonMovedToEnd = false;
  isRowGroupToggleButtonMovedToEnd = false;

  /**
   * This array stored all groups information with context for drawing,
   * it is generated by drawing functions,
   * and be used for searching groups when users operate on the spreadsheet
   * Each item of this array contains these properties:
   * - `type`: its available values: 'c' and 'r'. indicates the type of this item, 'c' for column group
   *           and 'r' for row group.
   * - `x`,`y`: the left-top point of this group's rendering area.
   * - `x2`, `y2`: the right-bottom of this group's rendering area.
   * - `collapsed`: this value indicates the collapsed status of this group.
   * - `from`, `to`: The column index range of this group (We use this value for searching the group)
   * - `row`: The row index for column groups (We use this value for searching the group)
   */
  visibleGroups: VisibleGroupItem[] = [];

  /**
   * Current visible viewport state, E.g.,
   * the columns, rows, headers, and range included in current visible viewport.
   *
   * It includes the past states: `visibleRowHeights`, `visibleRows`, and `visibleHeaders`. And we will migrate the state `visibleCells` into this manager.
   */
  viewport = new GridViewportStateManager();
  visibleCells: CellDescriptor[] = [];

  /**
   * Each item of this  array contains these properties:
   * - `x`, `y`, `x2`, `y2`
   * - `orderIndex0`, `orderIndex1`: The closed interval of the hiding rows/columns.
   * - `dir`: The directon of the unhide indicator. 'l' and 'r' for columns, 't' and 'b' for rows
   */
  visibleUnhideIndicators: VisibleUnhideIndicator[] = [];

  pendingDragResize?: any;
  resizingStartingHeight?: number;
  resizingStartingWidth?: number;

  cursor?: string;
  cursorGrab?: CursorGrab;
  cursorGrabbing?: CursorGrabbing;
  currentCursor?: Cursor;

  buttonMenu?: any;
  button?: {
    items?: any[];
    dispose?: () => void;
    wrapper?: HTMLDivElement & { left?: number; top?: number };
  };

  ellipsisCache: EllipsisCacheMap = {};
  htmlImageCache: HTMLImageCacheMap = {};

  events: { [eventName: string]: any[] } = {};
  componentL1Events: { [columnName: string]: string } = {};

  cellTree = {
    rows: [],
    columns: {},
    tempSchema: [],
    rowTreeColIndex: 0,
    columnTreeRowStartIndex: 0,
    columnTreeRowEndIndex: 0,
    origin: {
      rows: [],
      columns: {},
    },
  };

  easingFunctions = new GridEasingFunctions();

  /** TODO: Consider initializing this state in here and without interface */
  get range() {
    return this.dataSource.namedRanges;
  }

  profiler?: GridProfiler;
}
