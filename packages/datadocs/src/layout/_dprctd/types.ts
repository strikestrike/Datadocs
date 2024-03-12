/**
 * @packageDocumentation
 * @module layout/types
 */

import type { Writable } from "svelte/store";

type AnyFunction = (...args: any) => void;

export enum PanelAlignment {
  LEFT = "left",
  RIGHT = "right",
  BOTTOM = "bottom",
}

export enum PanelOrientation {
  HORIZONTAL = "horizontal",
  VERTICAL = "vertical",
}

/**
 * Panel rendered in a Pane.
 */
export type View = {
  /**
   * Id of the Panel to be rendered
   */
  id: string;
  /**
   * Name of the Panel to be rendered
   */
  name: string;
  /**
   * Icon of the Panel to be rendered
   */
  icon?: string;
  /**
   * Label of the Panel to be rendered
   */
  label: string;
  /**
   * Layer Index
   */
  layerIndex?: number;
  /**
   * Configuration of the View
   */
  config?: ViewConfig;
};

/**
 * Configuration of UI Component rendered in a Pane
 */
export type ViewConfig = {
  [key: string]: any;
};

// /**
//  * UI Component rendered in a Pane
//  */
// export type View = {
//   name?: string;
//   [key: string]: any;
//   config?: ViewConfig;
// };

/**
 * Properties of the Pane Config.
 * This decides the behaviour of the Pane
 */
export type PaneConfigProps = {
  /**
   * Whether the Pane is the Worksapce root or not
   */
  isRoot?: boolean;
  /**
   *  Type of pane
   */
  paneType?: string;
  /**
   *  Type of group
   */
  groupType?: string;
  /**
   *  Whether the Pane is a closable or not
   */
  isClosable?: boolean;
  /**
   *  Whether the Pane is a currently closed
   */
  isClosed?: boolean;
  /**
   *  Minimum Width of the Pane
   */
  minWidth?: number;
  /**
   *  Minimum Height of the Pane
   */
  minHeight?: number;
  /**
   *  Index of components which can be dropped on the Pane
   */
  dropAllowed?: FlagIndex;
  /**
   *  Index of components which cannot be dropped on the Pane
   */
  dropDenied?: FlagIndex;
  /**
   *  Whether the Pane is locked or not. If true the Pane cannot be moved or resized
   */
  isFixed?: boolean;
  /**
   *  Whether the border of the Pane is hidden
   */
  noBorder?: boolean;
  /**
   *  Whether the Pane adjusts its size automatically
   */
  hasAutosize?: boolean;
  /**
   *  Whether the Pane hides content overflow
   */
  noOverflow?: boolean;
  /**
   *  Whether the Pane just completed a move operation
   */
  isMovedPane?: boolean;
  /**
   *  Whether the Pane  was inserted using drag
   */
  isDragInsert?: boolean;
  /**
   * Layer Index
   */
  layerIndex?: number;
  /**
   *  Whether the Pane is locked or not.
   */
  isLocked?: boolean;
  /**
   *  Whether the Pane is hidden or not.
   */
  isHidden?: boolean;
  /**
   * Index of active child
   */
  activeChild?: number;
  /**
   * Id of active tab
   */
  activeId?: PaneConfig["id"];
};

/**
 * Properties of the Pane.
 * This decides the behaviour of the Pane
 */
export interface PaneProps extends PaneConfigProps {
  /**
   *  Flag that denotes the group type
   */
  isHGroup?: boolean;
  isVGroup?: boolean;
  isTabsGroup?: boolean;
  isFixedGroup?: boolean;
  isEmbeddedGroup?: boolean;
  isCustomGroup?: boolean;
  isSpreadSheetGroup?: boolean;
}

/**
 * Settings of the Pane.
 * This decides the content in the Pane and how it is rendered
 */
export type PaneSettings = {
  /**
   * Index of active tab
   */
  active?: number;
  /**
   * Id of active tab
   */
  activeId?: Pane["id"];
  /**
   * List of Panels
   */
  tabs?: View[];
  tabAsView?: boolean;
  /**
   * Details of the UI component to be rendered in the Pane
   */
  view?: View;
};

/**
 * Configuration of the Pane Content.
 * This decides the content in the Pane and how it is rendered
 */
export type PaneContent = {
  /**
   * Details of the UI component to be rendered in the Pane
   */
  view?: View;
};

/**
 * Type of the Pane.
 */
type PaneType = "group" | "pane" | "tabbedPane" | "fixedPane" | any;

/**
 * Position of the Pane in the Workspace
 */
export type PanePlacement =
  | "root"
  // | "top"
  // | "bottom"
  | "container"
  | "container:left"
  | "container:left:inner"
  | "container:right"
  | "container:right:inner"
  | "container:center"
  | "container:center:main"
  | "container:center:main:inner"
  | "container:center:bottom"
  | "container:center:bottom:inner"
  | "container:bottom"
  | "tab"
  | "tile"
  | "fixed"
  | "embedded"
  | "";

/**
 * Configurarion of the Pane
 */
export type PaneConfig = {
  /**
   * Unique Id of the Pane
   */
  id: string;
  /**
   * Type of the pane
   * @type {PaneType}
   */
  type: PaneType;
  /**
   * Position of the Pane
   * @type {PanePlacement}
   */
  placement: PanePlacement;
  /**
   * Size of the Pane.
   * This can set as "<number>px" | "<number>%" | "auto", When set as "auto" the size is calculated based on the content
   */
  size?: string;
  /**
   * Properties of the Pane declared in PaneProps.
   * This decides the behaviour of the Pane
   * @type {PaneConfigProps}
   */
  props?: PaneConfigProps;
  /**
   * Configuration of the pane content.
   * This decides the content in the Pane and how it is rendered
   * @type {PaneContent}
   */
  content?: PaneContent;
  /**
   * List of child Panes of the Pane.
   * Used only when Pane type is "group"
   * @type {PaneConfig[]}
   */
  children?: Array<PaneConfig>;
};

/**
 * Configurarion of the whole Workspace
 */
export type WorkspaceConfig = {
  /**
   * Pane at the root.
   * This Pane contains the whole Workspace
   * @type {PaneConfig[]}
   */
  root?: PaneConfig;
};

/** External Methods  */
export type ExternalMethods = {
  onDividerDrag?: (element: HTMLElement, pane: Pane) => boolean;
  onDividerDrop?: (element: HTMLElement, pane: Pane, dropSide?: string) => void;
  onPaneMouseMove?: (
    element: HTMLElement,
    pane: Pane,
    checkPaneMousePosition: () => void
  ) => void;
  formatOnSave?: (item: any, type: string) => any;
  [key: string]: AnyFunction;
};

/**
 * Rendered Pane instance from a PanceConfig
 */
export type Pane = {
  /**
   * Unique Id of the Pane
   */
  id: string;
  /**
   * Type of the pane
   * @type {PaneType}
   */
  type?: PaneType;
  /**
   * Position of the Pane
   * @type {PanePlacement}
   */
  placement?: string;
  /**
   * Size of the Pane.
   * This can set as "auto" | "<number>px" | number
   */
  size?: string | number;
  /**
   * Properties of the Pane declared in PaneProps.
   * This decides the behaviour of the Pane
   * @type {PaneProps}
   */
  props?: PaneProps;
  /**
   * Configuration of the pane content.
   * This decides the content in the Pane and how it is rendered
   * @type {PaneContent}
   */
  content?: PaneContent | null;
  /**
   * List of child Panes of the Pane.
   * Used only when Pane type is "group"
   * @type {Pane[]}
   */
  children?: Pane[];
  /**
   * Parent Pane
   * @type {Pane}
   */
  parent?: Pane;
  /**
   * Next Pane in the PaneGroup
   * @type {Pane}
   */
  next?: Pane;
  /**
   * Previous Pane in the PaneGroup
   * @type {Pane}
   */
  prev?: Pane;

  /**
   * Settings (optional)
   */
  settings?: PaneSettings;
  /**
   * The Origin PaneConfig of the Pane
   */
  origin?: PaneConfig;
};

export type DropInfo = {
  dropArea?: string;
};

/**
 * Index of arbitrary values
 */
export type AnyIndex = {
  [key: string]: any;
};

/**
 * Index of Panes mapped with id of the Pane
 */
export type PaneIndex = {
  [key: string]: Pane;
};

/**
 * Index of Panes mapped with id of the Pane
 */
export type ViewIndex = {
  [key: string]: View;
};

/**
 * Index of Panels mapped with id of the Panel
 */
export type PanelIndex = {
  [key: string]: Pane;
};

/**
 * Index of Panel Bounds mapped with id of the Panel
 */
export type BoundsIndex = {
  [key: string]: DOMRect;
};

/**
 * Index of Panel Sizes mapped with id of the Panel
 */
export type SizeIndex = {
  [key: string]: number;
};

/**
 * Utility type to create key:boolean index object
 */
export type FlagIndex = {
  [key: string]: boolean;
};

/**
 * Active drag status
 */

export type ActiveDrag = {
  /**
   * This flag is set to true when drag starts
   */
  isMouseDown: boolean;
  /**
   * This flag is set to true when a drop is prevented based on some conditions
   */
  preventDrop: boolean;
};

/**
 * Active drag status
 */

export type ActiveResize = {
  /**
   * This flag is set to true when resize starts
   */
  isResizing: boolean;
  /**
   * Direction of resizing
   */
  type: string;
};

export type ActiveDND = {
  /**
   * This flag is set to true when drag starts
   */
  isMouseDown: boolean;
  /**
   * The Pane on which mouse is moving now
   */
  currentPane: View;
  /**
   * Type of the item being dragged - tab or pane
   */
  type: string;
  /**
   * Target window edge
   */
  edge: string;
  /**
   * HTML element of the item being dragged
   */
  source: HTMLElement;
  /**
   * Bounds of the item being dragged
   */
  sourceBounds: DOMRect;
  /**
   * Index of the item being dragged
   */
  sourceIndex: number;
  /**
   * Clone of  the HTML element of the item being dragged
   */
  sourceProxy: HTMLElement;
  /**
   * 2nd Clone of  the HTML element of the item being dragged
   */
  sourceCopy: HTMLElement;
  /**
   * HTML element of the drop target
   */
  target: HTMLElement;
  /**
   * Clone of the HTML element of the drop target
   */
  targetProxy: HTMLElement;
  /**
   * Bounds of the drag stage
   */
  stageBounds: DOMRect;
  /**
   * X position of drag start
   */
  startX: number;
  /**
   * Y position of drag start
   */
  startY: number;
  /**
   * Current X position of drag
   */
  x: number;
  /**
   * Current Y position of drag
   */
  y: number;
  /**
   * X offset of drag with respect to the origin of the item being dragged
   */
  offX: number;
  /**
   * Y offset of drag with respect to the origin of the item being dragged
   */
  offY: number;
  /**
   * Side at which drop is expected
   */
  edgeDropArea?: string;
};

/**
 * Details of the active drag operation
 */
export type DragContext = {
  drag: ActiveDrag;
  dnd: ActiveDND;
};

/**
 * State of the active drag and drop
 */
export type DNDContext = {
  /**
   * Instance of the HTMLElement that holds drag and drop elements
   */
  dragStage: HTMLElement;
  /**
   * State of the active drag
   */
  drag: Writable<ActiveDrag>;
  /**
   * State of the active drag and drop
   */
  dnd: ActiveDND;
  /**
   * Details of the drag source
   */
  from: {
    pane?: Pane;
    [key: string]: any;
  };
  /**
   * Details of the drop target
   */
  to: {
    pane?: Pane;
    [key: string]: any;
  };
  /**
   * Method that updates the changes in drag and drop as the mouse moves
   */
  preventDrop?: boolean;
  /**
   * Method that updates the changes in drag and drop as the mouse moves
   */
  change(dnd: any, drag?: any): void;
  /**
   * Method that resets drag and drop status
   */
  reset(): void;
  /**
   * Method that applies the changes caused by the drag and drop operation
   */
  update(placement?: string);
};

/**
 * Details of the active resize operation
 */
export type PanelResize = {
  /**
   * This flag is set to true when a resize is initilized
   */
  initialized: boolean;
  /**
   * Various parameters at the beginning of the resize operation
   */
  initialParams: {
    /**
     * X position of mouse pointer
     */
    x?: number;
    /**
     * Y position of mouse pointer
     */
    y?: number;
    /**
     * Pane Divider element which triggered the resize operation
     */
    divider?: HTMLElement;
    /**
     * Pane instance which contains the divider
     */
    pane?: Pane;
    /**
     * Index of the Pane in the parent PaneGroup
     */
    paneIndex?: number;
    /**
     * Resize type - horizontal or vertical
     */
    type?: string;
    /**
     * Whether there resize will just divide the available space in half
     */
    equal?: boolean;
    /**
     * Callback function to handle Resize complete event
     */
    onResize?: AnyFunction;
  };

  /**
   * Pane instance which contains the divider
   */
  source: Pane;
  /**
   * Parent Pane of the source
   */
  parent: Pane;
  /**
   * Pane Divider element which triggered the resize operation
   */
  divider: HTMLElement;

  /**
   * Index of the Pane on the left/top of the divider
   */
  paneXIndex: number;
  /**
   * Index of the Pane on the right/bottom of the divider
   */
  paneYIndex: number;
  /**
   * Pane on the left/top of the divider
   */
  paneX: View;
  /**
   * Pane on the right/bottom of the divider
   */
  paneY: View;
  /**
   * Bounds of the Pane on the left/top of the divider
   */
  paneXBounds: DOMRect;
  /**
   * Bounds of the Pane on the right/bottom of the divider
   */
  paneYBounds: DOMRect;
  /**
   * HTMLElement of the Pane on the left/top of the divider
   */
  paneXElement: HTMLElement;
  /**
   * HTMLElement of the Pane on the right/bottom of the divider
   */
  paneYElement: HTMLElement;
  /**
   * All children of the parent of paneX and paneY
   */
  panes: Array<Pane>;
  /**
   * HTMLElements of all children of the parent of paneX and paneY
   */
  paneElements: AnyIndex;
  /**
   * Bounds of all children of the parent of paneX and paneY
   */
  paneBounds: BoundsIndex;
  /**
   * Minumum sizes of all children of the parent of paneX and paneY
   */
  paneMinSizes: SizeIndex;
  /**
   * Count of the children of the parent of paneX and paneY
   */
  panesCount: number;
  /**
   * Panes to be skipped in the resize operation
   */
  panesSkip: PanelIndex;
  /**
   * Panes skipped in the resize operation
   */
  panesSkipped: number;

  /**
   *Total size of paneX and paneY
   */
  totalSize: number;
  /**
   *Space available for the resize operation
   */
  availableSize: number;
  /**
   * Amount of size to adjusted to render border after resize
   */
  borderAdjust: number;

  /**
   * Resize type - horizontal or vertical
   */
  type: string;
  /**
   * Initial X position of mouse pointer
   */
  startX: number;
  /**
   * Initial Y position of mouse pointer
   */
  startY: number;
  /**
   * Current X position of mouse pointer
   */
  currentX: number;
  /**
   * Current Y position of mouse pointer
   */
  currentY: number;
  /**
   * List of start and end positions of each Pane
   */
  markers: Array<ResizeMarker>;

  /**
   * HTML user select current status
   */
  userSelect: string;
  /**
   * Current direction of resize
   */
  direction: string;
  /**
   * This flag indicates whether furthere resizing is possible towards top/left
   */
  maxXReached: boolean;
  /**
   * This flag indicates whether furthere resizing is possible towards bottom/right
   */
  maxYReached: boolean;
  /**
   * Callback function to handle Resize complete event
   */
  onResize: AnyFunction;
};

/**
 * Used to track the changes in Pane Transforms
 */
export type PaneTransform = {
  resize: PanelResize;
};

/**
 * Parameters used in the calculation of Pane/Window edges in drag and drop
 */
export type EdgeArgs = [
  string,
  DOMRect,
  boolean,
  number,
  number,
  number,
  FlagIndex?
];

/**
 * List of start and end positions and other details of Panes being resized
 */
export type ResizeMarker = {
  /**
   * Unique id of the Pane
   */
  id: string;
  /**
   * Index of the Pane
   */
  index: number;
  /**
   * Original starting position of the Pane
   */
  from: number;
  /**
   * Current starting position of the Pane
   */
  start: number;
  /**
   * Current resize position of the Pane
   */
  position: number;
  /**
   * Current ending position of the Pane
   */
  at: number;
  /**
   * Original ending position of the Pane
   */
  original: number;
  /**
   * Current size position of the Pane
   */
  size: number;
  /**
   * Minimum size position of the Pane
   */
  minimum: number;
  /**
   * Whether the Pane can be closed while resizing
   */
  isClosable: boolean;
};

/**
 * Rendered Workspace which contains the tree of Panes
 */
export type Workspace = {
  /**
   * Pane at the root.
   * This Pane contains the whole Workspace
   * @type {Pane[]}
   */
  root?: Pane;
};

/**
 * Context which handles all the interactions with the Panes
 */
export type PanesContext = {
  expand: (
    pane: Pane,
    index?: number | null,
    size?: number | string,
    apply?: boolean
  ) => void;
  collapse: (
    pane: Pane,
    index?: number | null,
    quick?: boolean,
    apply?: boolean
  ) => void;

  getPane: (id: string) => Pane | null;
  getPaneByPlacement: (placement: PanePlacement) => Pane | null;
  getPaneByViewId: (id: string) => Pane | null;
  getView: (id: string) => View | null;
  getViewIndex: (id: string) => number | null;

  insertNewPane: (
    pane: Pane,
    type: string,
    side: string,
    paneIndex: number,
    dragInsert: boolean
  ) => void;
  addByName: (panelName: string) => void;
  removeByName: (panelName: string) => void;
  removePane: (pane: Pane) => void;
  removeTabByIndex: (pane: Pane, index: number) => void;

  movePane: (
    pane: Pane,
    toIndex: number,
    fromIndex?: number,
    parent?: Pane
  ) => void;
  reorderPanes: (
    fromPane: Pane,
    toPane: Pane,
    fromIndex: number,
    toIndex: number
  ) => void;
  reorderTabsByIndex: (pane: Pane, fromIndex: number, toIndex: number) => void;
  reorderTabs: (toPane: Pane, newTabs: View[], active: number | null) => void;
  activeTabChange: (pane: Pane, index: number | null) => void;

  clearMovedPane: (pane: Pane) => void;

  updatePane(pane: Pane, sync?: boolean);
  updatePanes(panes: Pane[], sync?: boolean);

  createPane(
    type: string,
    paneGroupType: string,
    params: {
      id?: string;
      viewId?: string;
      placement?: string;
      props?: PaneProps;
      children?: Pane[];
      viewConfig?: View;
      size?: number | string;
    }
  );
  insertPane(pane: Pane, newPane: Pane, index?: number);
  // toggleCollapsedQueryToolbar: (isCollapsed: boolean) => void;
  // resizeQueryToolbar: (height: number, layoutChange: boolean) => void;
};

export type TransformContext = {
  isResizing: boolean;
  resize: Writable<ActiveResize>;
  transform: PaneTransform;
  /**
   * Start resing Panes when mouse pointer holds a divider
   *
   */
  startResize(
    x: number,
    y: number,
    divider: HTMLElement,
    pane: Pane,
    paneIndex: number,
    type: string,
    equal: boolean,
    onResize: () => void
  ): void;
  /**
   * Initialize Resize by setting parameters
   *
   */
  initialize(): void;
  /**
   * Update Resize by updating parameters
   *
   */
  updateResize(type: string, equal?: boolean): void;
  /**
   * Equally divide the Pane sizes
   *
   */
  splitSize();
  /**
   * Geet the Panes which will be affected by the Resize
   *
   */
  getResizPanes(parent: Pane, type: string): FlagIndex;
  /**
   * Set the Panes which will be affected by the Resize
   *
   */
  setResizePanes(type: string);
  /**
   * Set the Inner Panes which will be affected by the Resize
   *
   */
  setResizeInnerPanes();
  /**
   * Apply the new sizes to Panes after Resize
   *
   */
  saveResizePanes(type: string, resizing?: boolean): void;
  /**
   * Adjust the sizes of adjacent Panes if needed
   *
   */
  shrinkPane(
    marker: ResizeMarker,
    newPosition: number,
    direction: string,
    property: string,
    forwarded: boolean,
    reverse?: boolean
  ): number;
  /**
   * Calculate new sizes of the Panes as the divider is dragged
   *
   */
  doResize(event: MouseEvent): void;
  /**
   * Stop the Resize operation
   *
   */
  stopResize(): void;
};

export type PanelsStore = {
  activePanels: Writable<PanelIndex>;
  onChange: Writable<any>;
  setPanels: AnyFunction;
  togglePanel: AnyFunction;
  clearPanelChange: AnyFunction;
};

/**
 * Context which handles all the interactions with the Panes
 */
export type GlobalContext = {
  bounds?: DOMRect;
  panels?: PanelsStore;
  actions?: {
    layoutAction: AnyFunction;
    divideAction: AnyFunction;
    paneAction: AnyFunction;
    paneDividerAction: AnyFunction;
    dropAreaAction: AnyFunction;
    tabsAction: AnyFunction;
    tabAction: AnyFunction;
    panelSettingsAction?: AnyFunction;
  };
  extMethods?: ExternalMethods;
  transformContext?: TransformContext;
  panesContext?: PanesContext;
  dndContext?: DNDContext;
};

export type PanesManager = {
  insertPane: AnyFunction;
  insertPaneAtIndex: AnyFunction;
  insertWithNewGroup: AnyFunction;
  rearrangeTab: AnyFunction;
  insertTab: AnyFunction;
  removePane: AnyFunction;
  createPane: AnyFunction;
};

export type PanelComponentConfig = {
  name: string;
  icon: string;
  label: string;
  defaultPlacement: string;
};

export interface PanelViewOptions {}

export interface UIListItem {
  uuid: string;
  parentId: string;
  type: string;
}

export interface Tab extends UIListItem {
  id: string;
  label: string;
  shortLabel: string;
}

export interface SimpleTabsOptions extends PanelViewOptions {
  active: string;
  tabSide: string;
  tabsListId: string;
}

export interface PanelView extends UIListItem {
  options: PanelViewOptions;
}

export interface Panel extends UIListItem {
  viewsListId: string;
}

export type PanelSet = {
  uuid: string;
  parentId: string;
  panelsListId: string;
};

export type PanelSets = {
  main?: PanelSet;
  left?: PanelSet;
  right?: PanelSet;
  bottom?: PanelSet;
};

export type PanelDragAction = {
  parentId: string;
  uuid: string;
  options: any;
};

export type PanelsProcessed = {
  panelSets: PanelSets;
  uiLists: UILists;
  uiIndex: UIIndex;
};

export type UILists = { [key: string]: Array<UIListItem> };
export type UIIndex = { [key: string]: any };
