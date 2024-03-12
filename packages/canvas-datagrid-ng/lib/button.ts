'use strict';

import type { GridPrivateProperties, PixelBoundingRect } from './types';
import { copyMethods } from './util';

export default function loadGridButtonComponent(self: GridPrivateProperties) {
  copyMethods(new GridButtonComponent(self), self);
}

export type GridButtonItem = {
  title: string;
  click?: (this: GridPrivateProperties, ev: MouseEvent) => void;
  buttonMenuItemContainer?: HTMLElement;
};
export type GridButtonIcon = string | HTMLElement | SVGElement;

export class GridButtonComponent {
  zIndexTop: number;
  constructor(private readonly grid: GridPrivateProperties) {}

  private _applyButtonMenuItemStyle = (
    buttonMenuItemContainer: HTMLElement,
  ) => {
    const self = this.grid;
    self.createInlineStyle(
      buttonMenuItemContainer,
      'canvas-datagrid-button-menu-item' + (self.mobile ? '-mobile' : ''),
    );
    buttonMenuItemContainer.addEventListener('mouseover', function () {
      self.createInlineStyle(
        buttonMenuItemContainer,
        'canvas-datagrid-button-menu-item:hover',
      );
    });
    buttonMenuItemContainer.addEventListener('mouseout', function () {
      self.createInlineStyle(
        buttonMenuItemContainer,
        'canvas-datagrid-button-menu-item',
      );
    });
  };

  private _applyButtonStyle = (button: HTMLElement) => {
    const self = this.grid;
    self.createInlineStyle(button, 'canvas-datagrid-button-wrapper');
    button.addEventListener('mouseover', function () {
      if (!self.buttonMenu) {
        self.createInlineStyle(button, 'canvas-datagrid-button-wrapper:hover');
      }
    });
    button.addEventListener('mouseout', function () {
      if (!self.buttonMenu) {
        self.createInlineStyle(button, 'canvas-datagrid-button-wrapper');
      }
    });
  };

  private _createButton = (pos, items, imgSrc) => {
    const self = this.grid;
    const toggleButtonMenu = this._toggleButtonMenu;
    const wrapper: HTMLDivElement & {
        left?: number;
        top?: number;
      } = document.createElement('div'),
      buttonArrow = document.createElement('div'),
      buttonIcon = document.createElement('div'),
      intf: any = {};

    if (!Array.isArray(items)) {
      throw new Error('createButton expects an array.');
    }

    const init = () => {
      const s = self.scrollOffset(self.canvas);

      if (this.zIndexTop === undefined) {
        this.zIndexTop = self.style.buttonZIndex;
      }

      this._applyButtonStyle(wrapper);
      self.createInlineStyle(buttonIcon, 'canvas-datagrid-button-icon');
      self.createInlineStyle(buttonArrow, 'canvas-datagrid-button-arrow');

      const loc: PixelBoundingRect = {
        x: pos.left - s.left,
        y: pos.top - s.top,
        width: 0,
        height: 0,
      };
      this.zIndexTop += 1;
      wrapper.style.position = 'absolute';
      wrapper.style.zIndex = this.zIndexTop.toFixed(0);
      wrapper.style.left = loc.x + 'px';
      wrapper.style.top = loc.y + 'px';
      wrapper.left = pos.left + self.scrollBox.scrollPixelTotalLeft;
      wrapper.top = pos.top + self.scrollBox.scrollPixelTotalTop;
      buttonArrow.innerHTML = self.style.buttonArrowDownHTML;
      if (imgSrc) {
        if (imgSrc instanceof Element) {
          const img = imgSrc as HTMLElement;
          if (img.style) {
            img.style.maxWidth = '100%';
            img.style.height = '100%';
          }
          buttonIcon.appendChild(img);
        } else {
          const img = document.createElement('img');
          img.setAttribute('src', imgSrc);
          img.style.maxWidth = '100%';
          img.style.height = '100%';
          buttonIcon.appendChild(img);
        }
      }
      wrapper.appendChild(buttonIcon);
      wrapper.appendChild(buttonArrow);
      document.body.appendChild(wrapper);
      wrapper.addEventListener('click', toggleButtonMenu);
    };

    intf.wrapper = wrapper;
    intf.items = items;
    init();

    intf.dispose = function () {
      if (wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
    };
    return intf;
  };

  private _toggleButtonMenu = () => {
    const self = this.grid;
    function createDisposeEvent() {
      requestAnimationFrame(function () {
        document.addEventListener('click', self.disposeButtonMenu);
      });
    }
    if (self.buttonMenu) {
      self.disposeButtonMenu();
    } else {
      const pos = {
        left: self.button.wrapper.left - self.scrollBox.scrollPixelTotalLeft,
        top:
          self.button.wrapper.top +
          self.button.wrapper.offsetHeight -
          self.scrollBox.scrollPixelTotalTop,
      };
      self.buttonMenu = this._createButtonMenu(pos, self.button.items);
      self.createInlineStyle(
        self.button.wrapper,
        'canvas-datagrid-button-wrapper:active',
      );
      createDisposeEvent();
    }
  };

  private _createButtonMenu = (pos, items) => {
    const self = this.grid;
    const applyButtonMenuItemStyle = this._applyButtonMenuItemStyle;
    const buttonMenu = document.createElement('div'),
      intf: any = {};
    let rect: DOMRect;
    let selectedIndex = -1;

    function createItems() {
      function addItem(item: GridButtonItem, menuItemContainer: HTMLElement) {
        function addContent(content) {
          if (content === null) {
            return;
          }

          if (typeof content === 'object') {
            menuItemContainer.appendChild(content);
            return;
          }

          applyButtonMenuItemStyle(menuItemContainer);
          menuItemContainer.innerHTML = content;
          return;
        }

        addContent(item.title);
        item.buttonMenuItemContainer = menuItemContainer;

        if (item.click) {
          menuItemContainer.addEventListener('click', function (ev) {
            item.click.apply(self, [ev]);
            self.disposeButton();
          });
        }
      }

      for (const item of items) {
        const buttonMenuItemContainer = document.createElement('div');
        addItem(item, buttonMenuItemContainer);
        buttonMenu.appendChild(buttonMenuItemContainer);
      }
    }

    function clickIndex(idx) {
      items[idx].buttonMenuItemContainer.dispatchEvent(new Event('click'));
    }

    const init = () => {
      const s = self.scrollOffset(self.canvas);

      if (this.zIndexTop === undefined) {
        this.zIndexTop = self.style.buttonZIndex;
      }

      createItems();
      self.createInlineStyle(
        buttonMenu,
        'canvas-datagrid-button-menu' + (self.mobile ? '-mobile' : ''),
      );

      const loc: PixelBoundingRect = {
        x: pos.left - s.left,
        y: pos.top - s.top,
        width: 0,
        height: 0,
      };
      this.zIndexTop += 1;
      buttonMenu.style.position = 'absolute';
      buttonMenu.style.zIndex = this.zIndexTop.toFixed(0);
      buttonMenu.style.left = loc.x + 'px';
      buttonMenu.style.top = loc.y + 'px';
      document.body.appendChild(buttonMenu);
      rect = buttonMenu.getBoundingClientRect();

      if (rect.bottom > window.innerHeight) {
        loc.y =
          self.button.wrapper.top -
          buttonMenu.offsetHeight -
          self.scrollBox.scrollPixelTotalTop;
        if (loc.y < 0) {
          loc.y = self.style.buttonMenuWindowMargin;
        }

        if (
          buttonMenu.offsetHeight >
          window.innerHeight - self.style.buttonMenuWindowMargin
        ) {
          buttonMenu.style.height =
            window.innerHeight - self.style.buttonMenuWindowMargin * 2 + 'px';
        }
      }

      if (rect.right > window.innerWidth) {
        loc.x -=
          rect.right - window.innerWidth + self.style.buttonMenuWindowMargin;
      }

      if (loc.x < 0) {
        loc.x = self.style.buttonMenuWindowMargin;
      }

      if (loc.y < 0) {
        loc.y = self.style.buttonMenuWindowMargin;
      }

      buttonMenu.style.left = loc.x + 'px';
      buttonMenu.style.top = loc.y + 'px';
    };

    intf.buttonMenu = buttonMenu;
    init();
    intf.clickIndex = clickIndex;
    intf.rect = rect;
    intf.items = items;

    intf.dispose = function () {
      if (buttonMenu.parentNode) {
        buttonMenu.parentNode.removeChild(buttonMenu);
      }
    };

    Object.defineProperty(intf, 'selectedIndex', {
      get: function get() {
        return selectedIndex;
      },
      set: function set(value) {
        if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
          throw new Error('Button menu selected index must be a sane number.');
        }

        selectedIndex = value;

        if (selectedIndex > items.length - 1) {
          selectedIndex = items.length - 1;
        }

        if (selectedIndex < 0) {
          selectedIndex = 0;
        }

        items.forEach(function (item, index) {
          if (index === selectedIndex) {
            return self.createInlineStyle(
              item.buttonMenuItemContainer,
              'canvas-datagrid-button-menu-item:hover',
            );
          }

          self.createInlineStyle(
            item.buttonMenuItemContainer,
            'canvas-datagrid-button-menu-item',
          );
        });
      },
    });
    return intf;
  };

  disposeButtonMenu = () => {
    const self = this.grid;
    if (self.buttonMenu) {
      document.removeEventListener('click', self.disposeButtonMenu);
      self.buttonMenu.dispose();
      self.buttonMenu = undefined;
      self.createInlineStyle(
        self.button.wrapper,
        'canvas-datagrid-button-wrapper:hover',
      );
    }
  };

  disposeButton = (e?: KeyboardEvent) => {
    if (e && e.key !== 'Escape') return;
    const self = this.grid;
    document.removeEventListener('keydown', self.disposeButton);
    this.zIndexTop = self.style.buttonZIndex;
    self.disposeButtonMenu();

    if (self.button) {
      self.button.dispose();
    }

    self.button = undefined;
  };

  /**
   * @todo Check why this depends on `scrollLeft` and `scrollTop`.
   */
  moveButtonPos = () => {
    const self = this.grid;
    self.button.wrapper.style.left =
      self.button.wrapper.left - self.scrollBox.scrollPixelTotalLeft + 'px';
    self.button.wrapper.style.top =
      self.button.wrapper.top - self.scrollBox.scrollPixelTotalTop + 'px';
    self.disposeButtonMenu();
  };

  attachButton = (
    pos: { top: number; left: number },
    items: GridButtonItem[],
    icon: GridButtonIcon,
  ) => {
    const self = this.grid;
    function createDisposeEvent() {
      requestAnimationFrame(function () {
        document.addEventListener('keydown', self.disposeButton);
      });
    }

    if (self.button) {
      self.disposeButton();
    }

    self.button = this._createButton(pos, items, icon);
    createDisposeEvent();
  };

  /**
   * Add a button into the cell.
   * @memberof canvasDatagrid
   * @name addButton
   * @method
   * @param columnIndex The column index of the cell to to add a button.
   * @param rowIndex The row index of the cell to to add a button.
   * @param offset Offset how far go away from cell.
   * @param items a list of items to add into button menu.
   * @param icon icon path to add into button.
   */
  addButton = (
    columnIndex: number,
    rowIndex: number,
    offset: { x: number; y: number },
    items: GridButtonItem[],
    icon?: GridButtonIcon,
  ) => {
    const self = this.grid;
    const cells = self.visibleCells.filter(function (c) {
      if (!('sortColumnIndex' in c)) return false;
      return c.sortColumnIndex === columnIndex && c.sortRowIndex === rowIndex;
    });

    self.attachButton(
      {
        top: cells[0].y + cells[0].height + offset.y,
        left: cells[0].x + cells[0].width + offset.x,
      },
      items,
      icon,
    );
  };
}
