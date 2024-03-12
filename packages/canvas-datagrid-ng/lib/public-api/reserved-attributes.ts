import type { defaultGridStyles } from '../style/default-styles';
import type { GridAttributes } from '../attributes';
import type { GridPrivateProperties } from '../types';

/**
 * Because the property `attributes` is a reserved property for a DOM element.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/attributes
 *
 * This method returns a property descriptor for the `init` method of the grid.
 * So a `attributes` can be mounted on the grid's public API
 * by calling `defineProperty` with this descriptor
 */
export function getGridPublicAttributes(self: GridPrivateProperties) {
  const attributes: GridAttributes = {} as any;
  const attrNames = Object.keys(self.attributes);
  for (let i = 0; i < attrNames.length; i++) {
    const attrName = attrNames[i];
    Object.defineProperty(attributes, attrName, {
      enumerable: true,
      get: () => self.attributes[attrName],
      set: (value) => {
        self.attributes[attrName] = value;
        if (
          attrName === 'rowTree' ||
          attrName === 'columnTree' ||
          attrName === 'columnTreeRowEndIndex'
        ) {
          // self.initCellTreeSettings();
        }
        self.draw(true);
        self.dispatchEvent('attributechanged', {
          name: attrName,
          value,
        });
      },
    });
  }
  return attributes;
}

/**
 * Because the property `style` is a reserved property for a DOM element.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/style
 *
 * This method returns a property descriptor for the `init` method of the grid.
 * So a `style` can be mounted on the grid's public API
 * by calling `defineProperty` with this descriptor
 */
export function getGridPublicStyles(self: GridPrivateProperties) {
  const style: typeof defaultGridStyles & CSSStyleDeclaration = {} as any;

  const styleKeys = [
    ...self.styleKeys,
    // add DOM css style keys
    ...Object.keys(self.DOMStyles),
  ];
  const defined = new Set<string>();

  for (let i = 0; i < styleKeys.length; i++) {
    const styleKey = styleKeys[i];
    if (defined.has(styleKey)) continue;
    Object.defineProperty(style, styleKey, {
      // unless this line is here, Object.keys() will not work on <instance>.style
      enumerable: true,
      get: () => self.getStyleProperty(styleKey),
      set: (value) => {
        if (self.initialized) self.appliedInlineStyles[styleKey] = value;
        self.setStyleProperty(styleKey, value);
      },
    });
    defined.add(styleKey);
  }
  return style;
}
