import type {
  NormalCellDescriptor,
  CellDescriptor,
  FrozenMarkerBaseStyle,
  SelectionHandleStyleName,
  CellCursorTarget,
} from './cell';
import type { GridPublicAPI } from './grid';
import type { OverlayDescriptor } from './overlay';
import type { CellSource } from './drawing';

/** This type is a utility for the types checking */
export type AssertPartialType<
  FullType,
  PartialType extends Partial<FullType>,
> = PartialType;

export type HTMLImageCache = {
  img: HTMLImageElement;
  width: number;
  height: number;
};
export type HTMLImageCacheMap = {
  [cacheKey: string]: HTMLImageCache;
};

export type EllipsisCache = {
  value?: string;
  width?: number;
};
export type EllipsisCacheMap = {
  [cacheKey: string]: EllipsisCache;
};

export type ElementForScrollOffset = {
  parentNode?: any;
  nodeName?: string;
  nodeType?: any;
  scrollLeft?: number;
  scrollTop?: number;
};

export type VisibleUnhideIndicator = {
  x: number;
  x2: number;
  y: number;
  y2: number;
  orderIndex0: number;
  orderIndex1: number;
  dir: 'l' | 'r' | 't' | 'b';
};

export type CursorGrab = '-webkit-grab' | 'grab';

export type CursorGrabbing = '-webkit-grabbing' | 'grabbing';

export type Cursor =
  | CursorGrab
  | CursorGrabbing
  | 'default'
  | 'inherit'
  | 'pointer'
  | 'crosshair'
  | 'e-resize'
  | 'n-resize'
  | 's-resize'
  | 'se-resize'
  | 'nwse-resize'
  | 'not-allowed';

export type CursorTarget = {
  cursor: Cursor;
  dragContext: DragContext;
  cell: CellDescriptor;
};

export type DragContext =
  | 'inherit'
  | 'background'
  | CellCursorTarget
  | ScrollBarTarget
  | SelectionHandleStyleName
  | FrozenMarkerBaseStyle;

export type ScrollBarTarget =
  | 'vertical-scroll-box'
  | 'vertical-scroll-top'
  | 'vertical-scroll-bottom'
  | 'horizontal-scroll-box'
  | 'horizontal-scroll-right'
  | 'horizontal-scroll-left';

export type FormatterFnInput<HeaderType = any> = {
  /** TODO: rename to `rawVaue` */
  value?: any;
  row?: any;
  header: HeaderType;
  /** TODO: the following `value` is a patch */
  cell: CellDescriptor & { value?: any };
};

export type FormatterFn<HeaderType = any> = (
  input: FormatterFnInput<HeaderType>,
) => string;
export type TransformerFn = (
  cell: NormalCellDescriptor,
  source: CellSource,
) => NormalCellDescriptor;

export type ParserCellData = { value: any; dataType: string };

export type TableVariantCellData = ParserCellData;

export type FilterFn = (value: any, filterFor: any) => boolean;

export type OrderDirection = 'asc' | 'desc';
export type SorterFn = (a: any, b: any) => number;
export type SorterFnGenerator = (
  columnName: string,
  direction: OrderDirection,
) => SorterFn;

export type GridDragMode = DragContext;

export type GridParentNode = Omit<HTMLElement, 'nodeType' | 'offsetParent'> & {
  width?: number;
  height?: number;
  left?: number;
  top?: number;

  columnGroupsAreaHeight?: number;
  rowGroupsAreaWidth?: number;

  //overwrite
  nodeType?: number | string;
  offsetParent?: GridParentNode;
};

export type DragResizeConfig = boolean | 'when-multiple-selected';

export interface SizeMapping {
  clearColumnWidths();
  getColumnWidth(index: number, defaultValue?: number): number | undefined;
  setColumnWidth(
    index: number,
    width: number,
    auto?: boolean,
    endIndex?: number,
  ): boolean;

  clearRowHeights();
  getRowHeight(index: number, defaultValue?: number): number | undefined;
  setRowHeight(
    index: number,
    height: number,
    auto?: boolean,
    endIndex?: number,
  ): boolean;

  getTreeHeight(index: number, defaultValue?: number): number | undefined;
  setTreeHeight(index: number, height: number);
}

export type LoadingIndicatorRenderer = (
  grid: GridPublicAPI,
) => Omit<OverlayDescriptor, 'id'>;
