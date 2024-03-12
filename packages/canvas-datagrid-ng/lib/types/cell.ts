import type {
  TableDescriptor,
  TableGroupHeader,
  TableSummaryFn,
  TableSummaryContext,
} from '../data/data-source/spec';
import type { HighlightDescriptor } from '../highlights/types';
import type { GridPosition } from '../position';
import type { ColumnType } from './column-types';
import type { GridHeader } from './column-header';
import type { RangeDescriptor, PixelBoundingRect } from './base-structs';
import type { CellMeta } from '../data/data-source/spec/base';
import type { CellDataFormat } from './data-format';
import type { FontStyleRun, MetaRun, StyleRun } from './style';

export type HeaderCellBaseStyleName =
  | 'cornerCell'
  | 'columnHeaderCell'
  | 'columnHeaderCellCap'
  | 'columnHeaderCellCap'
  | 'rowHeaderCell'
  | 'tableHeaderCell'
  | 'tableGroupHeader';

export type NormallCellBaseStyleName = 'activeCell' | 'cell';

export type SelectionHandleStyleName =
  | 'selection-handle-tl'
  | 'selection-handle-tr'
  | 'selection-handle-bl'
  | 'selection-handle-br';

export type ScrollBarStyle =
  | 'horizontal-scroll-bar'
  | 'horizontal-scroll-box'
  | 'vertical-scroll-box'
  | 'vertical-scroll-bar'
  | 'scroll-box-corner';

export type FrozenMarkerBaseStyle =
  | 'frozen-column-marker'
  | 'frozen-row-marker';

export type CellBaseStyleName =
  | HeaderCellBaseStyleName
  | NormallCellBaseStyleName;

export type CellResizeTarget = 'column-resize' | 'row-resize';

export type CellMoveTarget =
  | 'left-move'
  | 'right-move'
  | 'top-move'
  | 'bottom-move';

export type CellReorderTarget = 'column-reorder' | 'row-reorder';

export type CellTableTarget =
  | 'table-dropdown-button'
  | 'table-type-icon-button'
  | 'table-group-toggle-button'
  | 'table-aggregation-opts-button'
  | 'resize-table'
  | 'select-table'
  | 'select-table-row'
  | 'select-table-column';

export type CellUnhideIndicatorTarget =
  | 'unhide-indicator-end'
  | 'unhide-indicator-start';

export type CellCursorTarget =
  | 'cell'
  | 'cell-grid'
  | 'tree'
  | CellResizeTarget
  | CellMoveTarget
  | CellReorderTarget
  | CellTableTarget
  | CellUnhideIndicatorTarget;

export interface CellIndex {
  rowIndex: number;
  columnIndex: number;
}

export interface PropDescriptor extends PixelBoundingRect, Partial<CellIndex> {
  nodeType: unknown;

  meta?: CellMeta;
  isScrollBar?: boolean;
  isScrollBoxCorner?: boolean;
  isHorizontalScrollBar?: boolean;
  isVerticalScrollBar?: boolean;

  isGrid?: boolean;
  isCorner?: boolean;
  isHeader?: boolean;
  isColumnHeader?: boolean;
  isColumnHeaderCellCap?: boolean;
  isRowHeader?: boolean;
  isTableHeader?: boolean;
  isNormal?: boolean;
}

export type CellDescriptor =
  | FrozenMarkerDescriptor
  | ScrollBoxEntity
  | SelectionHandleDescriptor
  | TableDropdownButtonDescriptor
  | TableTypeIconButtonDescriptor
  | TreeGridDescriptor
  | NormalCellDescriptor
  | GridCursorTargetBackground
  | GridCursorTargetInherit;

export interface GridCursorTargetInherit extends PropDescriptor {
  nodeType: 'inherit';
}

export interface GridCursorTargetBackground extends PropDescriptor {
  nodeType: 'background';
}

export interface ScrollBoxEntity extends PropDescriptor {
  nodeType: 'scrollbar';
  style: ScrollBarStyle;
}

export interface FrozenMarkerDescriptor extends PropDescriptor {
  nodeType: 'frozen-marker';
  style: FrozenMarkerBaseStyle;
}

export interface SelectionHandleDescriptor extends PropDescriptor {
  nodeType: 'selection-handle';
  style: SelectionHandleStyleName;
}

export interface TreeGridDescriptor extends PropDescriptor {
  nodeType: 'tree-grid';
}

export interface TableDropdownButtonDescriptor extends PropDescriptor {
  nodeType: 'table-dropdown-button';
}

export interface TableTypeIconButtonDescriptor extends PropDescriptor {
  nodeType: 'table-type-icon-button';
}

export interface CellTableGroupContext {
  header?: TableGroupHeader;
  /**
   * Whether this is the first group header cell showing on the same row as the
   * table headers. This will not have a {@link header}.
   */
  isTopHeaderColumn: boolean;
  /**
   * Whether the cell belongs to the first column displaying the group
   * headers.
   */
  isHeaderColumn: boolean;
  headerColumnType?: 'top' | TableGroupHeader['rowType'];
}

export interface CellTableContext {
  header: GridHeader;
  hasResizeHandle: boolean;
  isTotalRow: boolean;
  isSubtotalRow: boolean;
  /**
   * Aggregation context that will be available when the the cell is a total
   * row ({@link isTotalRow}) and is displaying a summary.
   */
  summaryContext?: TableSummaryContext;
  groupContext?: CellTableGroupContext;
}

export interface NormalCellDescriptor extends PropDescriptor {
  nodeType: 'canvas-datagrid-cell';
  style: HeaderCellBaseStyleName | NormallCellBaseStyleName;
  type: ColumnType;

  sortColumnIndex: number;
  sortRowIndex: number;

  fontHeight: number;
  fontWeight?: string;
  fontStyle?: string;
  isStrikethrough?: boolean;
  isUnderline?: boolean;
  fontSize: number;
  fontFamily: string;
  textColor: string;
  textRotation: number;
  backgroundColor: string;
  styleRuns: StyleRun[];
  /**
   * This style-runs data will be used in drawing. It's the result after
   * merging style-runs with link-runs default style.
   */
  drawStyleRuns: StyleRun[];
  /**
   * Contain cell link-runs
   */
  linkRuns: MetaRun[];
  /**
   * Whether the cell's value is readonly and cannot be changed via grid
   * editor.
   */
  isValueReadOnly?: boolean;
  /**
   * Indicate that where {@link NormalCellDescriptor.linkRuns} is come from.
   * If true, it means there is explicit (user-defined) links inside the cell.
   */
  explicitLink?: boolean;
  /**
   * If true, there are {@link NormalCellDescriptor.linkRuns} added when doing
   * data-format for Array, Struct or JSON value.
   */
  inferLink?: boolean;

  horizontalAlignment: 'left' | 'right' | 'center';
  verticalAlignment: string;

  paddingLeft: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;

  lineHeight: number;
  lineSpacing: number;
  offsetTop: number;
  offsetLeft: number;
  active: boolean | string;
  hovered: boolean;
  groupHovered: boolean;
  hoverContext?: string;
  highlighted: boolean;
  selected: boolean;
  /**
   * Whether there are errors in the cell or not
   */
  error?: boolean;
  /**
   * Denotes that there is a selection request, and this cell is in the selected
   * range.
   */
  picked?: boolean;
  customHighlight?: HighlightDescriptor;
  /**
   * The number of selections that includes this cell.
   */
  selectedCount: number;
  /**
   * Denotes whether this is being hightlighted with an ongoing drag move
   * operation.
   */
  moveHighlighted: boolean;
  /**
   * These denote which fill handles (selection handles on touch) this cell
   * contains.
   */
  containsTopLeftHandle?: boolean;
  containsTopRightHandle?: boolean;
  containsBottomLeftHandle?: boolean;
  containsBottomRightHandle?: boolean;

  containsUnhideIndicatorAtStart?: boolean;
  containsUnhideIndicatorAtEnd?: boolean;

  /**
   * If this is a selected row or column header and is between of a merged cell
   * or contains a table header while not containing the table fully, this
   * property will be set to true.
   */
  isNonReorderable?: boolean;

  /**
   * Whether the cell inside a protected region and its value cannot be changed.
   */
  isReadOnly: boolean;

  /**
   * Denotes whether this cell is covered by the fill region.
   */
  isInFillRegion: boolean;

  /**
   * Width of the content within the cell.
   *
   * ContentWidth > width when wrapMode is overflowing
   */
  contentWidth: number;
  subsumedLeftCellCount: number;
  subsumedRightCellCount: number;
  /**
   * Whether this cell is being used the neigboring cell on the left to draw
   * its text.
   */
  subsumedByLeftNeighbor: boolean;
  /**
   * Whether this cell is being used the neigboring cell on the right to draw
   * its text.
   */
  subsumedByRightNeighbor: boolean;
  /**
   * Whether this cell is the first cell (from left to right) direction is being
   * used by the neigboring cell on the right to draw its text.
   */
  firstSubsumedByRightNeighbor: boolean;

  offsetWidth: number;
  offsetHeight: number;
  borderWidth: number;
  borderHeight: number;
  parentNode: any;
  offsetParent: any;
  /** @deprecated row data */
  data?: any;
  isFilterable: boolean;
  openedFilter: boolean;
  header: GridHeader;

  viewRowIndex: number;
  viewColumnIndex: number;

  mergedCell: MergedCellDescriptor;
  isBaseMergedCell: boolean;

  gridId: string;
  innerHTML: string;
  value: any;
  valueType?: ColumnType;
  displayValue?: any;
  linkLabel?: string;
  linkRef?: string;
  /** The locale that cell value should be formatted to */
  locale?: string;
  /**
   * Prefix text of cell, e.g in case number format accounting,
   * we have currency sign is drawn at the begining of cell content.
   */
  prefixValue?: string;
  /**
   * Struct or list of Struct can display as chip instead of string
   * on the cell
   */
  chips?: Array<string>;
  /**
   * Total number of chip
   */
  chipsCount?: number;
  /**
   * Value of @prefixWidth is greater 0 on truncate or multi-line wrapMode,
   * because there is no prefix content in overflowing.
   */
  prefixWidth: number;

  isRowTree: boolean;
  isColumnTree: boolean;

  calculatedLineHeight?: number;
  paddedWidth?: number;
  paddedHeight?: number;
  grid?: any;
  drawingStatus?: number;

  orderByArrowWidth?: number;

  table?: TableDescriptor;
  tableHeader?: GridHeader;
  tableButton?: TableDropdownButtonDescriptor;
  tableTypeButton?: TableTypeIconButtonDescriptor;
  tableContext?: CellTableContext;

  conditionalFormatIcon?: CellConditionalFormattingIcon;

  borders: CellBorders;
  /**
   * User custom borders that user added to a normal cell
   */
  customBorders: CellBorders;

  formattedValue?: string;
  text?: CellText;
  prefixText?: CellLine;
  /**
   * Configure how the text in the cell should wrap
   */
  wrapMode: CellWrapMode;
  /**
   * Data format which is applied to cell (e.g percent, currency, etc.)
   */
  dataFormat: CellDataFormat;
  /**
   * Configure if ellipsis should be shown if
   * cell content does not fit into the cell
   */
  truncateWithEllipsis: boolean;
  isEmpty: boolean;

  /**
   * We keep the event data in the cell itself for ease-of-reach.
   */
  event: CellEvent;

  /**
   * The targets on a cell.
   */
  subtargets: {
    groupToggleButton?: PixelBoundingRect & {
      hovered: boolean;
      collapsed: boolean;
    };
    aggregationOptsButton?: PixelBoundingRect & {
      hovered: boolean;
      expanded: boolean;
      draw: () => any;
    };
  };
  onReady: {
    formattedValue: (() => any)[];
  };
}

/**
 * This type includes all properties that can affect the cell rendering.
 * It is named with reference to native DOM type `CSSStyleDeclaration`
 *
 * *And please make sure all type of the properties can be stringify to JSON.*
 * *Because this style declaration may be saved to database after stringify*
 */
export type CellStyleDeclaration = {
  isBold: boolean;
  isItalic: boolean;
  isStrikethrough: boolean;
  isUnderline: boolean;
  fontSize: number;
  fontFamily: string;
  horizontalAlignment: string;
  verticalAlignment: string;
  textRotation: number;
  textColor: string;
  wrapMode: CellWrapMode;
  borders: CellBorders;
  backgroundColor: string;
  dataFormat?: CellDataFormat;
  /**
   * Icon set for showing conditional formatting
   */
  iconSet?: ConditionalFormattingIconSet;
  /** The size of the triangle flag at the top left corner */
  cornerSizeTR?: number;
  /** The color of the triangle flag at the top left corner */
  cornerColorTR?: string;
  /** The size of the triangle flag at the bottom left corner */
  cornerSizeBR?: number;
  /** The color of the triangle flag at the bottom left corner */
  cornerColorBR?: string;
  /**
   * Whether the data is itself immovable, or whether the other cells cannot
   * move into it.
   */
  isImmovable: boolean;
  /**
   * Whether the data is immutable at a cell level.
   */
  isReadOnly: boolean;

  styleRuns?: StyleRun[];
};

/**
 * This interface defines list keys of cell style
 */
export type CellStyleDeclarationKey = keyof CellStyleDeclaration;

/**
 * This interface defines a common event triggered for the cells.
 */
export interface CellEvent {
  value?: any;
  /** @deprecated row data */
  row?: any[];
  header: GridHeader;
  cell: NormalCellDescriptor;
}

export interface CellText {
  lines: CellLine[];
  coveredCellCount: number;
  width: number;
  height: number;
  /** custom clip start for text if it is overflow to previous cell */
  clipStartX?: number;
  rotationAngle?: number;
  /** Whether the text is in stack vertically style */
  stackVertically?: boolean;
}

export interface CellLine {
  value: string;
  width: number;
  height: number;
  offsetLeft: number;
  offsetTop: number;
  fontAscent: number;
  x: number;
  y: number;
  fontStyles?: FontStyleRun[];
}

/**
 * Stores details on how an individual cell border will be drawn.
 */
export type CellBorder = {
  style?: CellBorderStyle;
  isHidden?: boolean;
  color?: string;
  /** Indicate if the border is from style preview/table/column borders */
  type?: 'preview' | 'table' | 'column';
};

/**
 * Stores details of an individual cell borders
 */
export type CellBorders = Partial<Record<GridPosition, CellBorder>>;

/**
 * Custom border style that user can add to normal cell
 * 'empty' indicate there is no border, can be used in merged cells
 */
export type CustomCellBorderStyle =
  | 'thin'
  | 'medium'
  | 'thick'
  | 'dashed'
  | 'dotted'
  | 'double'
  | 'empty';

export type CellBorderStyle =
  | 'solid'
  | 'selection'
  | 'fill'
  | 'move'
  | 'table'
  | 'pick'
  | CustomCellBorderStyle;

export type CellCorner = 'tl' | 'tr' | 'bl' | 'br';

/**
 * Denotes which sides of a rect is merging. True means the given side is
 * merging.
 *
 * Legend 1:
 * ```
 * |-------------|-------------|-------------|-------------|
 * |r is true     l is true    |undefined    |undefined    |
 * |-------------|-------------|-------------|-------------|
 * |r is true     l is true    |undefined    |undefined    |
 * |-------------|-------------|-------------|-------------|
 * ```
 *
 * Legend 2:
 * ```
 * |-------------|-------------|-------------|-------------|
 * |r,b are true  l,b are true |undefined    |undefined    |
 * |                           |-------------|-------------|
 * |r,t are true  l,t are true |undefined    |undefined    |
 * |-------------|-------------|-------------|-------------|
 * ```
 */
export interface MergePoints {
  /** It means the left neighbor is merged with the current cell if this value if true */
  l: boolean;
  /** It means the right neighbor is merged with the current cell if this value if true */
  r: boolean;
  /** It means the top neighbor is merged with the current cell if this value if true */
  t: boolean;
  /** It means the bottom neighbor is merged with the current cell if this value if true */
  b: boolean;
}

export type MergedCellDescriptor = RangeDescriptor;

export enum MergeDirection {
  Center = 'center',
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

/**
 * Indicates how the cell should wrap its content:
 *
 * - truncated: Overflowing cell content is truncated
 *
 * - multi-line: Overflowing content will wrap to multiple lines.
 *       It is also necessary to set autoResizeRows: true at grid level
 *       for this to work.
 *
 * - overflowing: If the adjacent cell on right is empty, cell content will
 *       expand to fill it. This does not cause any cell background,
 *       border etc. applied to cell to bleed through. Only the text
 *       content overflows.
 *
 * This type intentionally does not govern whether or not ellipsis
 * will be shown. For that use the truncateWithEllipsis cell property,
 * which can be enabled/disabled for any of the wrapping modes.
 */
export type CellWrapMode = 'truncated' | 'multi-line' | 'overflowing';

/**
 * Indicate how to clear a cell
 * - content: Clear text content.
 * - format: Clear styles, formats (percent, date, etc).
 * - all: Clear both content and format.
 */
export type CellClearMode = 'all' | 'content' | 'format';

export type ConditionalFormattingIcons = {
  iconSet: ConditionalFormattingIconSet;
  icons: Array<string>;
};

export type ConditionalFormattingIconSet =
  | '3-arrows-colored'
  | '3-traffic-lights';

/**
 * The information about the conditional formatting icon to draw on cell
 */
export type CellConditionalFormattingIcon = {
  iconSet: ConditionalFormattingIconSet;
  iconImage: string;
  iconRect: PixelBoundingRect;
};
