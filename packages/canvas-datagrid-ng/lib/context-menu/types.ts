import type { CellDescriptor, NormalCellDescriptor } from '../types/cell';
import type {
  GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
  GRID_CONTEXT_MENU_ITEM_TYPE_DIVIDER,
  GRID_CONTEXT_MENU_ITEM_TYPE_SUBMENU,
} from './constants';

export type GridContextMenuData = {
  /**
   * On the GRID, where the context menu will be positioned.
   */
  pos: { x: number; y: number };
  /**
   * On the WINDOW, where the context menu will be positioned.
   */
  posRaw: { clientX: number; clientY: number };
  /**
   * The {@link CellDescriptor} over which the user opened the context menu.
   */
  cell: CellDescriptor & Partial<NormalCellDescriptor>;
  /**
   * The items displayed by the context menu.
   * @see GridContextMenu
   */
  items: GridContextMenuItem[];
};

/**
 * The event that is triggered when user opens the grid context menu.
 */
export type GridContextMenuEvent = GridContextMenuData & {
  /**
   * The native event that caused the context menu to open.
   */
  NativeEvent: Event;
};

/**
 * The individual item that appears on a context menu.
 */
type GridContextMenuActionableItem = {
  /**
   * The title/label for this item.
   */
  title: string;
  /**
   * The preferred (Datadocs) icon to display for this item.
   */
  prefixIcon?: string;
  /**
   * Whether or not this item is active in a given item group.
   */
  active?: boolean;
};

export type GridContextMenuActionItem = {
  type: typeof GRID_CONTEXT_MENU_ITEM_TYPE_ACTION;
  /**
   * The action to perform once the item is clicked on.
   */
  action: () => any;
} & GridContextMenuActionableItem;

export type GridContextMenuSubMenuItem = {
  type: typeof GRID_CONTEXT_MENU_ITEM_TYPE_SUBMENU;
  /**
   * If this is submenu, this will be available instead of {@link action}.
   */
  children: () => GridContextMenuItem[];
} & GridContextMenuActionableItem;

export type GridContextMenuDividerItem = {
  type: typeof GRID_CONTEXT_MENU_ITEM_TYPE_DIVIDER;
};

export type GridContextMenuItem =
  | GridContextMenuActionItem
  | GridContextMenuSubMenuItem
  | GridContextMenuDividerItem;

export type GridContextMenuPosition = {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
};
