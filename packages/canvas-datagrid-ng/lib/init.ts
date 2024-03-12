import type { GridInitArgs, GridPrivateProperties } from './types';
import { setDefaults, copyMethods } from './util';
import { copyGetterSetter, copyPlainFields } from './utils/object-props';
import {
  defaultGridStyleKeys,
  defaultGridStyles,
} from './style/default-styles';
import { defaultFormatters } from './data/default-formatter';
import { defaultGridAttributeKeys, defaultGridAttributes } from './attributes';
import { ScrollBox } from './scroll-box';
import { hyphenateProperty } from './web-component/utils';
import { applyComponentStyle } from './web-component/attribute-setter';
import { StylePreviewManager } from './style/preview/style-preview-manager';
import { GridPublicMethods } from './public-api/public-methods';
import { getGridPublicFields } from './public-api/public-fields';
import {
  getGridPublicAttributes,
  getGridPublicStyles,
} from './public-api/reserved-attributes';
import type { GridInternalState } from './state';
import type { GridPublicAPI } from './types/grid';
import { initIconImages } from './draw/icons';

export default function loadGridInit(self: GridPrivateProperties) {
  copyMethods(new GridInit(self), self);
}

/**
 * This class is used for initializing the grid properties and public APIs
 */
export class GridInit {
  constructor(private readonly grid: GridPrivateProperties) {}

  private _initNestedPropFromArgs = (
    propName: keyof GridInternalState & keyof GridInitArgs,
  ) => {
    const self = this.grid;
    const nestedArgs = self.args[propName];
    if (!nestedArgs) return;
    Object.keys(nestedArgs).forEach(
      (key) => (self[propName][key] = nestedArgs[key]),
    );
  };
  private _initNestedPropsFromArgs = () => {
    this._initNestedPropFromArgs('formatters');
    this._initNestedPropFromArgs('filters');
    this._initNestedPropFromArgs('sorters');
    this._initNestedPropFromArgs('transformers');
  };

  /**
   * Initialize grid's attributes from args.
   * Using default value for the attribute if it is not provided from the `args`.
   */
  private _initAttributesFromArgs = () => {
    const self = this.grid;
    defaultGridAttributeKeys.forEach((key) =>
      setDefaults(self.attributes, self.args, key, defaultGridAttributes[key]),
    );
  };

  /**
   * Initialize grid's style property from `args.style`.
   * Using default style value from `defaultGridStyles` if it is not provided from the `args.style`.
   */
  private _initStyleFromArgs = () => {
    const self = this.grid;
    const styleInInitArgs = self.args.style || {};
    defaultGridStyleKeys.forEach((key) =>
      // Because inside defaultGridStyles we have value is an object such as
      // scaled for grid dimensions, assign the object dirrectly will cause
      // multiple grid instances using the same object. So using structuredClone
      // to make sure all style properties is independent.
      setDefaults(
        self.style,
        styleInInitArgs,
        key,
        structuredClone(defaultGridStyles[key]),
      ),
    );
  };

  private _initStyleKeys = () => {
    const self = this.grid;

    /** because self.styleKeys will be modified, so clone this array in here */
    const styleKeys = [...defaultGridStyleKeys];
    const styleKeySet = new Set(defaultGridStyleKeys);
    const addStyleKey = (key: string) => {
      if (styleKeySet.has(key)) return;
      styleKeys.push(key);
      styleKeySet.add(key);
    };
    for (let i = 0, i1 = styleKeys.length; i < i1; i++)
      addStyleKey(hyphenateProperty(styleKeys[i], false));
    for (let i = 0, i1 = styleKeys.length; i < i1; i++)
      addStyleKey(hyphenateProperty(styleKeys[i], true));

    self.styleKeys = styleKeys;
  };

  private _initBrowserCharacteristic = () => {
    const self = this.grid;
    self.ie = /Trident/.test(window.navigator.userAgent);
    self.edge = /Edge/.test(window.navigator.userAgent);
    self.webKit = /WebKit/.test(window.navigator.userAgent);
    self.moz = /Gecko/.test(window.navigator.userAgent);
    self.mobile = /Mobile/i.test(window.navigator.userAgent);

    self.cursorGrab = self.webKit ? '-webkit-grab' : 'grab';
    self.cursorGrabbing = self.moz ? '-webkit-grabbing' : 'grabbing';
  };

  /**
   * This sets the active cell to the first column of the first row if not
   * prevented.
   *
   * One of the reasons it might be prevented is if there is a session that is
   * being restored and it is setting the active cell for us.
   */
  initActiveCell = () => {
    if (this.grid.dispatchEvent('beforeinitactivecell', {})) return;
    this.grid.selectCell(0, 0);
  };

  applyComponentStyle = applyComponentStyle;

  /**
   * Initialize the grid and its public APIs
   */
  init = () => {
    const self = this.grid;
    if (self.initialized) {
      return;
    }

    // Create images for icons that need to be drawn on canvas
    initIconImages();

    //#region Initialize the state properties that need `self` context
    self.stylePreviewManager = new StylePreviewManager(self);
    self.scrollBox = new ScrollBox(self);
    //#endregion

    //#region Initialize properties from grid's args
    self.formatters = { ...defaultFormatters };
    self.transformers = [];

    this._initAttributesFromArgs();
    this._initStyleFromArgs();
    this._initNestedPropsFromArgs();
    //#endregion

    // Initialize renderer
    this.grid.startRendererLoop();

    // Bind DOM
    this._initBrowserCharacteristic();
    self.setDom();

    self.initActiveCell();

    this._initStyleKeys();
    self.DOMStyles = window.getComputedStyle(document.body, null);

    //
    //#region Initialize public methods/fields
    //
    type Writeable<T> = { -readonly [P in keyof T]: T[P] };
    const publicApi: Writeable<GridPublicAPI> = self.publicApi;

    // export private properties for debugging
    Object.defineProperty(publicApi, '__private', { get: () => self });

    const publicMethods = new GridPublicMethods(self);
    copyMethods(publicMethods, publicApi);

    Object.defineProperty(publicApi, 'attributes', {
      value: getGridPublicAttributes(self),
    });

    const InternalStyle = getGridPublicStyles(self);
    Object.defineProperty(publicApi, 'style', {
      get: () => InternalStyle,
      // set: function (valueObject) {
      //   Object.keys(valueObject).forEach(function (key) {
      //     self.setStyleProperty(key, valueObject[key], true);
      //   });
      //   self.draw(true);
      //   self.dispatchEvent('stylechanged', {
      //     name: 'style',
      //     value: valueObject,
      //   });
      // },
    });

    const publicFields = getGridPublicFields(self);
    copyPlainFields(publicApi, publicFields, true);
    copyGetterSetter(publicApi, publicFields, publicFields);
    //
    //#endregion
    //

    self.applyComponentStyle(false, self.intf);
    if (!self.isComponent) {
      requestAnimationFrame(function () {
        self.resize(true);
      });
    } else {
      self.resize(true);
    }

    self.initialized = true;
    return self;
  };
}
