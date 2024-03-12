import type { GridPrivateProperties } from '../types';
import { copyMethods } from '../util';

export default function loadGridInlineStyles(self: GridPrivateProperties) {
  copyMethods(new GridInlineStyles(self), self);
}

/**
 * A shortcut function to scale edit cell border and return the style.
 *
 * It only uses the user-set scaling value since the device pixel
 * ratio will be applied by the browser by default.
 * @param self
 * @returns The resulting style.
 */
const getEditCellBorderStyle = (self: GridPrivateProperties) => {
  return (
    self.style.editCellBorderStyle +
    ' ' +
    self.dp(self.style.editCellBorderWidth, self.userScale) +
    'px ' +
    self.style.editCellBorderColor
  );
};

export class GridInlineStyles {
  constructor(private readonly self: GridPrivateProperties) {}

  createInlineStyle = (el: HTMLElement, className: string) => {
    const { self } = this;
    let applyStyleProps: Partial<
      CSSStyleDeclaration & { mozAppearance: string }
    >;

    switch (className) {
      case 'canvas-datagrid-button-wrapper':
        applyStyleProps = {
          display: 'inline-block',
          padding: self.style.buttonPadding,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: self.style.buttonBorderColor,
          cursor: 'pointer',
          background: self.style.buttonBackgroundColor,
          userSelect: 'none',
        };
        break;
      case 'canvas-datagrid-button-wrapper:hover':
        applyStyleProps = {
          borderColor: self.style.buttonBorderColor,
          background: self.style.buttonHoverBackgroundColor,
        };
        break;
      case 'canvas-datagrid-button-wrapper:active':
        applyStyleProps = {
          borderColor: self.style.buttonActiveBorderColor,
          background: self.style.buttonActiveBackgroundColor,
        };
        break;
      case 'canvas-datagrid-button-icon':
        applyStyleProps = {
          width: '18px',
          height: '18px',
          display: 'inline-block',
          verticalAlign: 'middle',
        };
        break;
      case 'canvas-datagrid-button-arrow':
        applyStyleProps = {
          display: 'inline-block',
          color: self.style.buttonArrowColor,
          fontSize: '9px',
        };
        break;
      case 'canvas-datagrid-button-menu-item-mobile':
        applyStyleProps = {
          lineHeight: 'normal',
          fontWeight: 'normal',
          fontFamily: self.style.contextMenuFontFamily,
          fontSize: self.style.contextMenuFontSize,
          color: 'inherit',
          background: 'inherit',
          margin: self.style.contextMenuItemMargin,
          borderRadius: self.style.contextMenuItemBorderRadius,
          verticalAlign: 'middle',
        };
        break;
      case 'canvas-datagrid-button-menu-item':
        applyStyleProps = {
          lineHeight: 'normal',
          fontWeight: 'normal',
          fontFamily: self.style.contextMenuFontFamily,
          fontSize: self.style.contextMenuFontSize,
          color: 'inherit',
          background: 'inherit',
          margin: self.style.contextMenuItemMargin,
          borderRadius: self.style.contextMenuItemBorderRadius,
          verticalAlign: 'middle',
        };
        break;
      case 'canvas-datagrid-button-menu-item:hover':
        applyStyleProps = {
          background: self.style.contextMenuHoverBackground,
          color: self.style.contextMenuHoverColor,
        };
        break;
      case 'canvas-datagrid-button-menu-label':
        applyStyleProps = {
          margin: self.style.contextMenuLabelMargin,
          display: self.style.contextMenuLabelDisplay,
          minWidth: self.style.contextMenuLabelMinWidth,
          maxWidth: self.style.contextMenuLabelMaxWidth,
        };
        break;
      case 'canvas-datagrid-button-menu-mobile':
        applyStyleProps = {
          lineHeight: 'normal',
          fontWeight: 'normal',
          fontFamily: self.style.contextMenuFontFamily,
          fontSize: self.style.contextMenuFontSize,
          background: self.style.contextMenuBackground,
          color: self.style.contextMenuColor,
          border: self.style.contextMenuBorder,
          padding: self.style.contextMenuPadding,
          borderRadius: self.style.contextMenuBorderRadius,
          opacity: self.style.contextMenuOpacity,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        };
        break;
      case 'canvas-datagrid-button-menu':
        applyStyleProps = {
          lineHeight: 'normal',
          fontWeight: 'normal',
          fontFamily: self.style.contextMenuFontFamily,
          fontSize: self.style.contextMenuFontSize,
          background: self.style.contextMenuBackground,
          color: self.style.contextMenuColor,
          border: self.style.contextMenuBorder,
          padding: self.style.contextMenuPadding,
          borderRadius: self.style.contextMenuBorderRadius,
          opacity: self.style.contextMenuOpacity,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          cursor: self.style.contextMenuCursor,
        };
        break;
      case 'canvas-datagrid-context-menu-filter-input':
        applyStyleProps = {
          height: '19px',
          verticalAlign: 'bottom',
          marginLeft: '2px',
          padding: '0',
          background: self.style.contextFilterInputBackground,
          color: self.style.contextFilterInputColor,
          border: self.style.contextFilterInputBorder,
          borderRadius: self.style.contextFilterInputBorderRadius,
          lineHeight: 'normal',
          fontWeight: 'normal',
          fontFamily: self.style.contextFilterInputFontFamily,
          fontSize: self.style.contextFilterInputFontSize,
        };
        break;
      case 'canvas-datagrid-context-menu-filter-button':
        applyStyleProps = {
          height: '19px',
          verticalAlign: 'bottom',
          marginLeft: '2px',
          padding: '0',
          background: self.style.contextMenuBackground,
          color: self.style.contextMenuColor,
          border: self.style.contextFilterButtonBorder,
          borderRadius: self.style.contextFilterButtonBorderRadius,
          lineHeight: 'normal',
          fontWeight: 'normal',
          fontFamily: self.style.contextMenuFilterButtonFontFamily,
          fontSize: self.style.contextMenuFilterButtonFontSize,
        };
        break;
      case 'canvas-datagrid-context-child-arrow':
        applyStyleProps = {
          cssFloat: 'right',
          color: self.style.childContextMenuArrowColor,
          fontSize: self.style.contextMenuChildArrowFontSize,
          fontFamily: self.style.contextMenuFontFamily,
          verticalAlign: 'middle',
        };
        break;
      case 'canvas-datagrid-autocomplete':
        applyStyleProps = {
          fontFamily: self.style.contextMenuFontFamily,
          fontSize: self.style.contextMenuFontSize,
          background: self.style.contextMenuBackground,
          color: self.style.contextMenuColor,
          border: self.style.contextMenuBorder,
          padding: self.style.contextMenuPadding,
          borderRadius: self.style.contextMenuBorderRadius,
          opacity: self.style.contextMenuOpacity,
          position: 'absolute',
          zIndex: '9999',
          overflow: 'hidden',
        };
        break;
      case 'canvas-datagrid-autocomplete-item':
        applyStyleProps = {
          background: self.style.contextMenuBackground,
          color: self.style.contextMenuColor,
        };
        break;
      case 'canvas-datagrid-autocomplete-item:hover':
        applyStyleProps = {
          background: self.style.contextMenuHoverBackground,
          color: self.style.contextMenuHoverColor,
        };
        break;
      case 'canvas-datagrid-canvas':
        applyStyleProps = {
          position: 'absolute',
          zIndex: '-1',
        };
        break;
      /**
       * The grid will have a static width and height that shouldn't be bigger
       * than its parent, hence `overflow: hidden`.
       */
      case 'canvas-datagrid':
        applyStyleProps = {
          display: 'block',
          overflow: 'hidden',
        };
        break;
      case 'canvas-datagrid-control-input':
        applyStyleProps = {
          position: 'fixed',
          top: '-5px',
          left: '-5px',
          border: 'none',
          opacity: '0',
          cursor: 'pointer',
          width: '1px',
          height: '1px',
          lineHeight: 'normal',
          fontWeight: 'normal',
          fontFamily: self.style.contextMenuFontFamily,
          fontSize: self.style.contextMenuFontSize,
        };
        break;
      case 'canvas-datagrid-edit-mobile-input':
        applyStyleProps = {
          boxSizing: 'content-box',
          outline: 'none',
          margin: '0',
          padding: '0 0 0 0',
          lineHeight: 'normal',
          fontWeight: 'normal',
          fontFamily: self.style.mobileEditFontFamily,
          fontSize: self.style.mobileEditFontSize,
          border: getEditCellBorderStyle(self),
          color: self.style.editCellColor,
          background: self.style.editCellBackgroundColor,
          appearance: 'none',
          webkitAppearance: 'none',
          mozAppearance: 'none',
          borderRadius: '0',
          whiteSpace: 'pre-wrap',
          overflowX: 'hidden',
        };
        break;
      case 'canvas-datagrid-edit-input':
        applyStyleProps = {
          boxSizing: 'border-box',
          outline: 'none',
          margin: '0',
          padding:
            self.dp(self.style.editCellPaddingTop, self.userScale) +
            'px 0 0 ' +
            self.dp(self.style.editCellPaddingLeft, self.userScale) +
            'px',
          lineHeight: 'normal',
          fontWeight: 'normal',
          fontFamily: self.style.editCellFontFamily,
          fontSize: self.style.editCellFontSize + ' px',
          boxShadow: self.style.editCellBoxShadow,
          border: getEditCellBorderStyle(self),
          color: self.style.editCellColor,
          background: self.style.editCellBackgroundColor,
          appearance: 'none',
          webkitAppearance: 'none',
          mozAppearance: 'none',
          borderRadius: '0',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          overflowX: 'hidden',
        };
        break;
      case 'canvas-datagrid-edit-cell-badge':
        applyStyleProps = {
          backgroundColor: self.style.editCellBadgeBorderColor,
          boxSizing: 'content-box',
          boxShadow: '0px 0.1em 0.2em rgb(0 0 0 / 50%)',
          borderRadius:
            self.dp(self.style.editCellBadgeBorderRadius, self.userScale) +
            'px',
          color: '#fff',
          fontFamily: 'Poppins, sans-serif',
          fontSize:
            self.dp(self.style.editCellBadgeFontSize, self.userScale) + 'px',
          fontWeight: self.style.editCellBadgeFontWeight,
          height:
            self.dp(self.style.editCellBadgeHeight, self.userScale) + 'px',
          padding: '0em 0.4em',
          position: 'absolute',
          zIndex: self.getZIndex('input'),
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        };
        break;
      case 'canvas-datagrid-context-menu-item-mobile':
        applyStyleProps = {
          lineHeight: 'normal',
          fontWeight: 'normal',
          fontFamily: self.style.contextMenuFontFamily,
          fontSize: self.style.contextMenuFontSize,
          color: 'inherit',
          background: 'inherit',
          margin: self.style.contextMenuItemMargin,
          borderRadius: self.style.contextMenuItemBorderRadius,
          verticalAlign: 'middle',
        };
        break;
      case 'canvas-datagrid-context-menu-item':
        applyStyleProps = {
          lineHeight: 'normal',
          fontWeight: 'normal',
          fontFamily: self.style.contextMenuFontFamily,
          fontSize: self.style.contextMenuFontSize,
          color: 'inherit',
          background: 'inherit',
          margin: self.style.contextMenuItemMargin,
          borderRadius: self.style.contextMenuItemBorderRadius,
          verticalAlign: 'middle',
        };
        break;
      case 'canvas-datagrid-context-menu-item:hover':
        applyStyleProps = {
          background: self.style.contextMenuHoverBackground,
          color: self.style.contextMenuHoverColor,
        };
        break;
      case 'canvas-datagrid-context-menu-label':
        applyStyleProps = {
          margin: self.style.contextMenuLabelMargin,
          display: self.style.contextMenuLabelDisplay,
          minWidth: self.style.contextMenuLabelMinWidth,
          maxWidth: self.style.contextMenuLabelMaxWidth,
        };
        break;
      case 'canvas-datagrid-context-menu-mobile':
        applyStyleProps = {
          lineHeight: 'normal',
          fontWeight: 'normal',
          fontFamily: self.style.contextMenuFontFamily,
          fontSize: self.style.contextMenuFontSize,
          background: self.style.contextMenuBackground,
          color: self.style.contextMenuColor,
          border: self.style.contextMenuBorder,
          padding: self.style.contextMenuPadding,
          borderRadius: self.style.contextMenuBorderRadius,
          opacity: self.style.contextMenuOpacity,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        };
        break;
      case 'canvas-datagrid-context-menu':
        applyStyleProps = {
          lineHeight: 'normal',
          fontWeight: 'normal',
          fontFamily: self.style.contextMenuFontFamily,
          fontSize: self.style.contextMenuFontSize,
          background: self.style.contextMenuBackground,
          color: self.style.contextMenuColor,
          border: self.style.contextMenuBorder,
          padding: self.style.contextMenuPadding,
          borderRadius: self.style.contextMenuBorderRadius,
          opacity: self.style.contextMenuOpacity,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          cursor: self.style.contextMenuCursor,
        };
        break;
      case 'canvas-datagrid-invalid-search-regExp':
        applyStyleProps = {
          background: self.style.contextMenuFilterInvalidExpresion,
        };
        break;
      case 'canvas-datagrid-cell-preview-placeholder':
        applyStyleProps = {
          display: 'none',
        };
        break;
    }
    if (applyStyleProps) {
      Object.keys(applyStyleProps).forEach(function (prop) {
        el.style[prop] = applyStyleProps[prop];
      });
    }
  };
}
