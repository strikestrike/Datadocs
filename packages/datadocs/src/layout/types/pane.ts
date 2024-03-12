import type {
  PaneGroupType,
  PaneSingleType,
  PaneType,
  Placement,
} from "../enums/pane";

/**
 * Configurarion of the whole Workspace
 */
export type WorkspaceConfig = {
  /**
   * Pane at the root.
   * This Pane contains the whole Workspace
   * @type {Pane[]}
   */
  root?: Pane;
};

/**
 * Configurarion of the Pane
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
  type: PaneType;
  /**
   * Position of the Pane
   * @type {PanePlacement}
   */
  placement: Placement;
  /**
   * Size of the Pane.
   * This can set as "<number>px" | "<number>%" | "auto", When set as "auto" the size is calculated based on the content
   */
  size?: string;
  /**
   * Configuration of the pane content.
   * This decides the content in the Pane and how it is rendered
   * @type {PaneContent}
   */
  content?: PaneContent;
  /**
   * Properties of the Pane declared in PaneProps.
   * This decides the behaviour of the Pane
   * @type {PaneProps}
   */
  props?: PaneProps;
  /**
   * List of child Panes of the Pane.
   * Used only when Pane type is "group"
   * @type {PaneConfig[]}
   */
  children?: Array<Pane>;
};

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
 * Properties of the Pane Config.
 * This decides the behaviour of the Pane
 */
export type PaneProps = {
  /**
   *  Type of pane
   */
  paneType?: PaneSingleType;
  /**
   *  Type of pane group
   */
  groupType?: PaneGroupType;
  /**
   * Id of active tab
   */
  activeId?: Pane["id"];
  isRoot?: boolean;
  collapse?: boolean;
};
