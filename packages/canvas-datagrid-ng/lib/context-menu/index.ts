import type { GridPrivateProperties } from '../types/grid';
import { copyMethods } from '../util';
import { GridInternalContextMenu } from './internal';
import { GridContextMenuItems } from './items';
import type {
  GridContextMenuData,
  GridContextMenuEvent,
  GridContextMenuItem,
  GridContextMenuPosition,
} from './types';

export default function loadGridContextMenu(self: GridPrivateProperties) {
  copyMethods(new GridContextMenu(self), self);
}

export class GridContextMenu {
  private _items: GridContextMenuItems;

  constructor(private readonly grid: GridPrivateProperties) {
    this._items = new GridContextMenuItems(grid);
  }

  contextmenuEvent = (
    e: MouseEvent | TouchEvent,
    overridePos?: { x: number; y: number },
  ) => {
    const self = this.grid;
    if (
      e.defaultPrevented ||
      !self.hasFocus ||
      !self.attributes.enableInternalContextMenu
    ) {
      return;
    }

    const items = [] as GridContextMenuItem[],
      pos =
        overridePos ??
        (e instanceof MouseEvent ? self.getLayerPos(e) : self.getTouchPos(e)),
      { clientX, clientY } = e instanceof MouseEvent ? e : e.touches[0],
      ev: GridContextMenuEvent = {
        NativeEvent: e,
        cell: self.getCellAt(pos.x, pos.y).cell as any,
        pos,
        posRaw: { clientX, clientY },
        items: items,
      };
    if (ev.cell.isGrid) {
      return;
    }

    this._items.populate(ev);
    if (e.type !== 'mousedown' && self.dispatchEvent('contextmenu', ev)) {
      e.preventDefault();
      return;
    }

    if (self.contextMenu) {
      self.disposeContextMenu();
    }

    this._items.populateWithSecondaryItems(ev);

    const posUnscaled =
      e instanceof MouseEvent
        ? self.getLayerPos(e, true)
        : self.getTouchPos(e, 0, true);
    const { x, y } = overridePos ?? posUnscaled;
    const contextPosition: GridContextMenuPosition = {
      left:
        x +
        posUnscaled.rect.left +
        self.style.contextMenuMarginLeft +
        self.canvasOffsetLeft,
      top:
        y +
        posUnscaled.rect.top +
        self.style.contextMenuMarginTop +
        self.canvasOffsetTop +
        (e.type === 'mousedown' ? self.style.filterButtonMenuOffsetTop : 0),
      right: ev.cell.width + ev.cell.x + posUnscaled.rect.left,
      bottom: ev.cell.height + ev.cell.y + posUnscaled.rect.top,
      height: ev.cell.height,
      width: ev.cell.width,
    };

    self.contextMenu = new GridInternalContextMenu(
      self,
      items,
      () => contextPosition,
      () => self.controlInput.focus(),
    );

    self.contextMenu.show();
    e.preventDefault();
  };

  disposeContextMenu = (event?: MouseEvent | TouchEvent) => {
    const self = this.grid;
    if (!self.contextMenu) return;

    self.contextMenu.hide();
    self.contextMenu = undefined;
    if (event) {
      self.canvas.focus();
    }
  };

  applyContextItemStyle = (contextItemContainer: HTMLElement) => {
    const self = this.grid;
    self.createInlineStyle(
      contextItemContainer,
      'canvas-datagrid-context-menu-item' + (self.mobile ? '-mobile' : ''),
    );
    contextItemContainer.addEventListener('mouseover', function () {
      self.createInlineStyle(
        contextItemContainer,
        'canvas-datagrid-context-menu-item:hover',
      );
    });
    contextItemContainer.addEventListener('mouseout', function () {
      self.createInlineStyle(
        contextItemContainer,
        'canvas-datagrid-context-menu-item',
      );
    });
  };

  /**
   * Generate the context menu items based on the current grid state and the
   * coordinates provided.
   * @param clientX
   * @param clientY
   * @returns The context menu items.
   */
  getContextMenuItems = (clientX: number, clientY: number) => {
    const self = this.grid;
    const pos = self.getLayerPos({ clientX, clientY });
    const cell = self.getCellAt(pos.x, pos.y).cell;
    const data: GridContextMenuData = {
      cell: cell as any,
      pos,
      posRaw: { clientX, clientY },
      items: [],
    };

    this._items.populate(data);

    return data.items;
  };
}
