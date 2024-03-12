import type { PixelBoundingRect } from '../types/base-structs';
import type { GridPrivateProperties } from '../types/grid';
import {
  GRID_CONTEXT_MENU_ITEM_TYPE_ACTION,
  GRID_CONTEXT_MENU_ITEM_TYPE_DIVIDER,
  GRID_CONTEXT_MENU_ITEM_TYPE_SUBMENU,
} from './constants';
import type { GridContextMenuItem, GridContextMenuPosition } from './types';

type HoverScrollType = 'up' | 'down';

/**
 * A visible context menu instance.
 *
 * Note that this class is for internal/development use only.  The real context
 * menu will be created by Datadocs UI by responding to the context menu events
 * we trigger from here.
 */
export class GridInternalContextMenu {
  private readonly container = document.createElement('div');
  private readonly upArrow = document.createElement('div');
  private readonly downArrow = document.createElement('div');

  private _selectedIndex = -1;

  private hoverScrollTimeout: number;

  private readonly childContainers: HTMLElement[] = [];
  private readonly childContextMenus = new Map<
    number,
    GridInternalContextMenu
  >();

  constructor(
    private readonly self: GridPrivateProperties,
    private readonly children: GridContextMenuItem[],
    private readonly positionFactory: () => GridContextMenuPosition,
    private readonly onSuccessfulClose?: () => any,
    private readonly zIndexTop = self.style.contextMenuZIndex,
    private readonly parentContextMenu?: GridInternalContextMenu,
  ) {
    this.init();
  }

  get selectedIndex() {
    return this._selectedIndex;
  }
  set selectedIndex(value) {
    const { self } = this;
    value = Math.max(Math.min(value, this.children.length - 1), 0);

    this.childContainers.forEach(function (container, index) {
      self.createInlineStyle(
        container,
        index === value
          ? 'canvas-datagrid-context-menu-item:hover'
          : 'canvas-datagrid-context-menu-item',
      );
    });

    this._selectedIndex = value;
  }

  private init() {
    const { self, container, upArrow, downArrow } = this;

    self.createInlineStyle(
      container,
      'canvas-datagrid-context-menu' + (self.mobile ? '-mobile' : ''),
    );

    container.style.position = 'absolute';
    upArrow.style.color = self.style.contextMenuArrowColor;
    downArrow.style.color = self.style.contextMenuArrowColor;
    [upArrow, downArrow].forEach((el) => {
      el.style.textAlign = 'center';
      el.style.position = 'absolute';
      el.style.zIndex = (this.zIndexTop + 1).toString();
    });
    container.style.zIndex = this.zIndexTop.toString();

    container.addEventListener('scroll', this.checkArrowVisibility);
    container.addEventListener('wheel', (e) => {
      if (self.hasFocus) {
        container.scrollTop += e.deltaY;
        container.scrollLeft += e.deltaX;
      }
      this.checkArrowVisibility();
    });
    upArrow.innerHTML = self.style.contextMenuArrowUpHTML;
    downArrow.innerHTML = self.style.contextMenuArrowDownHTML;
    container.appendChild(upArrow);

    downArrow.addEventListener('mouseover', this.startHoverScroll('down'));
    downArrow.addEventListener('mouseout', this.endHoverScroll);
    upArrow.addEventListener('mouseover', this.startHoverScroll('up'));
    upArrow.addEventListener('mouseout', this.endHoverScroll);

    this.createItems();
  }

  show() {
    if (!this.parentContextMenu) {
      window.addEventListener('mousedown', this.handleInputEvent);
      window.addEventListener('touchstart', this.handleInputEvent);
    }

    document.body.appendChild(this.downArrow);
    document.body.appendChild(this.container);
    this.refreshPosition();
    this.childContextMenus.forEach((contextMenu) => {
      contextMenu.refreshPosition();
    });
  }

  private containsTarget(target: EventTarget) {
    if (target == this.container || this.container.contains(target as any)) {
      return true;
    }
    for (const [, menu] of this.childContextMenus) {
      if (menu.containsTarget(target)) return true;
    }

    return false;
  }

  hide(closeParent = false) {
    if (!this.parentContextMenu) {
      window.removeEventListener('mousedown', this.handleInputEvent);
      window.removeEventListener('touchstart', this.handleInputEvent);
    }

    if (closeParent && this.parentContextMenu) {
      this.parentContextMenu.hide(closeParent);
      return;
    }

    this.endHoverScroll();
    const { childContextMenus, container, downArrow, upArrow } = this;
    childContextMenus.forEach((contextMenu) => {
      contextMenu.hide();
    });
    [downArrow, upArrow, container].forEach((element) => {
      element.parentNode?.removeChild(element);
    });
  }

  private handleInputEvent = (e: Event) => {
    if (this.containsTarget(e.target)) {
      return;
    }
    this.hide();
  };

  private checkArrowVisibility() {
    const { self, container, upArrow, downArrow } = this;
    if (container.scrollTop > 0) {
      self.parentDOMNode.appendChild(upArrow);
    } else if (upArrow.parentNode) {
      upArrow.parentNode.removeChild(upArrow);
    }
    if (
      container.scrollTop >= container.scrollHeight - container.offsetHeight &&
      downArrow.parentNode
    ) {
      downArrow.parentNode.removeChild(downArrow);
    } else if (
      container.scrollHeight - container.offsetHeight > 0 &&
      !(container.scrollTop >= container.scrollHeight - container.offsetHeight)
    ) {
      self.parentDOMNode.appendChild(downArrow);
    }
  }

  private createItems() {
    const { self, container, children, childContextMenus } = this;
    children.forEach((item, index) => {
      if (item.type === GRID_CONTEXT_MENU_ITEM_TYPE_DIVIDER) {
        container.appendChild(document.createElement('hr'));
        return;
      }

      const childContainer = document.createElement('div');
      const createChildContextMenu = (items: GridContextMenuItem[]) => {
        const childMenuArrow = document.createElement('div');
        const contextMenu = new GridInternalContextMenu(
          self,
          items,
          () => {
            const rect = childContainer.getBoundingClientRect();
            return {
              top: rect.top + self.style.childContextMenuMarginTop,
              left:
                rect.left +
                container.offsetWidth +
                self.style.childContextMenuMarginLeft,
              bottom: rect.bottom,
              right: rect.right,
              width: rect.width,
              height: rect.height,
            };
          },
          this.onSuccessfulClose,
          this.zIndexTop + 1,
          this,
        );

        self.createInlineStyle(
          childMenuArrow,
          'canvas-datagrid-context-child-arrow',
        );
        childMenuArrow.innerHTML = self.style.childContextMenuArrowHTML;
        childContainer.appendChild(childMenuArrow);

        return contextMenu;
      };

      const hideChildContextMenu = (e: MouseEvent) => {
        const contextMenu = this.childContextMenus.get(index);
        if (
          contextMenu &&
          (e.relatedTarget === container ||
            contextMenu.container === e.relatedTarget ||
            childContainer === e.relatedTarget)
        ) {
          return;
        }

        contextMenu.hide();
        childContainer.removeEventListener('mouseout', hideChildContextMenu);
        container.removeEventListener('mouseout', hideChildContextMenu);
        childContainer.setAttribute('contextOpen', '0');
        childContainer.setAttribute('opening', '0');
      };
      const openChildContextMenu = () => {
        const contextMenu = this.childContextMenus.get(index);
        if (
          !contextMenu ||
          childContainer.getAttribute('contextOpen') === '1'
        ) {
          return;
        }

        childContainer.setAttribute('opening', '1');
        childContainer.addEventListener('mouseout', hideChildContextMenu);
        container.addEventListener('mouseout', hideChildContextMenu);
        contextMenu.show();
      };

      self.applyContextItemStyle(childContainer);
      childContainer.append(item.title);
      if (item.active) {
        childContainer.append(self.attributes.columnSelectorVisibleText);
      }

      if (item.type === GRID_CONTEXT_MENU_ITEM_TYPE_SUBMENU) {
        const children = item.children();
        const childContextMenu = createChildContextMenu(children);

        childContextMenus.set(index, childContextMenu);
        childContainer.addEventListener('mouseover', openChildContextMenu);
        childContainer.addEventListener('mouseout', function () {
          childContainer.setAttribute('opening', '0');
        });
      } else if (item.type === GRID_CONTEXT_MENU_ITEM_TYPE_ACTION) {
        childContainer.addEventListener('click', () => {
          this.hide(true);
          if (typeof this.onSuccessfulClose === 'function') {
            this.onSuccessfulClose();
          }
          if (typeof item.action === 'function') {
            item.action();
          }
        });
      }
      container.appendChild(childContainer);
    });
  }

  private startHoverScroll(type: HoverScrollType) {
    const { self, container } = this;
    const callback = () => {
      const { contextHoverScrollAmount: amount } = self.attributes;
      if (
        (type === 'up' && container.scrollTop === 0) ||
        (type === 'down' && container.scrollTop === container.scrollHeight)
      ) {
        return;
      }
      container.scrollTop += type === 'up' ? -amount : amount;
      this.hoverScrollTimeout = setTimeout(
        callback,
        self.attributes.contextHoverScrollRateMs,
        type,
      );
    };
    return callback;
  }

  private endHoverScroll() {
    clearTimeout(this.hoverScrollTimeout);
  }

  private refreshPosition() {
    const { self, container, upArrow, downArrow, positionFactory } = this;

    const pos = positionFactory();
    const scrollOffset = self.scrollOffset(self.canvas);
    const loc: PixelBoundingRect = {
      x: pos.left - scrollOffset.left,
      y: pos.top - scrollOffset.top,
      width: 0,
      height: 0,
    };

    // TODO: Fix (parent && parent.inputDropdown)
    /*if (parent && parent.inputDropdown) {
      container.style.maxHeight =
        window.innerHeight - loc.y - self.style.autocompleteBottomMargin + 'px';
      container.style.minWidth = pos.width + 'px';
      loc.y += pos.height;
    }*/
    if (self.mobile) {
      container.style.width = pos.width + 'px';
    }
    container.style.left = loc.x + 'px';
    container.style.top = loc.y + 'px';

    const rect = container.getBoundingClientRect();
    if (rect.bottom > window.innerHeight) {
      // TODO: fix !(parent && parent.inputDropdown) state (autocomplete)
      //if (!(parent && parent.inputDropdown)) {
      if (!parent) {
        loc.y -=
          rect.bottom + self.style.contextMenuWindowMargin - window.innerHeight;
      }
      if (loc.y < 0) {
        loc.y = self.style.contextMenuWindowMargin;
      }
      if (
        container.offsetHeight >
        window.innerHeight - self.style.contextMenuWindowMargin
      ) {
        container.style.height =
          window.innerHeight - self.style.contextMenuWindowMargin * 2 + 'px';
      }
    }
    if (rect.right > window.innerWidth) {
      loc.x -=
        rect.right - window.innerWidth + self.style.contextMenuWindowMargin;
    }
    if (loc.x < 0) {
      loc.x = self.style.contextMenuWindowMargin;
    }
    if (loc.y < 0) {
      loc.y = self.style.contextMenuWindowMargin;
    }
    container.style.left = loc.x + 'px';
    container.style.top = loc.y + 'px';
    upArrow.style.top = rect.top + 'px';
    downArrow.style.top =
      rect.top + rect.height - downArrow.offsetHeight + 'px';
    upArrow.style.left = rect.left + 'px';
    downArrow.style.left = rect.left + 'px';
    downArrow.style.width = container.offsetWidth + 'px';
    upArrow.style.width = container.offsetWidth + 'px';

    this.checkArrowVisibility();
  }
}
