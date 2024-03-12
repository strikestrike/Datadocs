import type { GridInitArgs } from '../types/grid-init-args';
import type { GridPrivateProperties, GridPublicAPI } from '../types/grid';
import { loadAllGridModules } from '../modules';
import { GridInternalState } from '../state';
import { componentName } from './const';
import {
  applyComponentAttribute,
  applyComponentStyle,
} from './attribute-setter';
import { defaultGridAttributeKeys } from '../attributes';

const defaultDataType = 'application/json+x-canvas-datagrid';

/**
 * @module WebComponent
 * This module contains the method and the properties about the Web Components.
 * You can find the guide about the Web Components from here:
 * @see https://developer.mozilla.org/en-US/docs/Web/Web_Components
 */
export class GridWebComponent extends HTMLElement {
  static dataType = defaultDataType;
  static registered = false;

  /**
   * Register the grid component into the document as a creatable element
   * (it can be created by the API `document.createElement`)
   */
  static register() {
    if (typeof customElements !== 'undefined' && customElements?.define) {
      customElements.define(componentName, GridWebComponent as any);
      GridWebComponent.registered = true;
    }
  }

  /** Is this component connected */
  connected = false;

  /**
   * This getter is designed for the auto type convertor.
   */
  private get gridAPI(): GridPrivateProperties {
    return this as any;
  }

  publicAPI: GridPublicAPI;
  constructor(/* args */) {
    // information: `args` will be undefined if this component is used as a web component (document.createElement)
    super();

    const args = {} as GridInitArgs;
    const self: GridPrivateProperties = new GridInternalState() as any;
    self.isComponent = true;
    self.args = args;

    loadAllGridModules(self, this);
    self.shadowRoot = this.attachShadow({ mode: 'open' });
    self.parentNode = self.shadowRoot as any;
    self.init();
    this.publicAPI = self.publicApi;
  }

  /**
   * {@label WebComponentAPI}
   * @see observedAttributes
   * @returns The method `attributeChangedCallback` will be invoked if any value of these properies is changed
   */
  static observedAttributes = [
    'data',
    'schema',
    'style',
    'className',
    'name',
    ...defaultGridAttributeKeys,
  ];

  /**
   * {@label WebComponentAPI}
   * (TLDR: **Custom element added to page.**)
   * Invoked each time the custom element is appended into a document-connected element. This will happen each time the node is moved, and may happen before the element's contents have been fully parsed.
   */
  connectedCallback = () => {
    const publicApi = this.gridAPI;
    publicApi.parentDOMNode.innerHTML = '';
    publicApi.parentDOMNode.appendChild(publicApi.canvas);
    this.connected = true;
    this.observe(publicApi);
    applyComponentStyle(true, publicApi);
    publicApi.resize(true);
  };

  /**
   * {@label WebComponentAPI}
   * (TLDR: **Custom element removed from page.**)
   * Invoked each time the custom element is disconnected from the document's DOM.
   */
  disconnectedCallback = () => {
    this.connected = false;
  };

  /**
   * {@label WebComponentAPI}
   * Invoked each time one of the custom element's attributes is added, removed, or changed. Which attributes to notice change for is specified in a static get `observedAttributes` method
   */
  attributeChangedCallback = (attrName: string, oldVal: any, newVal: any) =>
    applyComponentAttribute(attrName, oldVal, newVal, this.gridAPI);

  /**
   * {@label WebComponentAPI}
   * Invoked each time the custom element is moved to a new document.
   */
  adoptedCallback = () => {
    this.gridAPI.resize();
  };

  observe = (intf: GridPrivateProperties) => {
    if (!window.MutationObserver) {
      return;
    }
    /**
     * Applies the computed css styles to the grid.  In some browsers, changing directives in attached style sheets does not automatically update the styles in this component.  It is necessary to call this method to update in these cases.
     * @memberof canvasDatagrid
     * @name applyComponentStyle
     * @method
     */
    const observer = new window.MutationObserver(function (mutations) {
      var checkInnerHTML, checkStyle;
      Array.prototype.forEach.call(mutations, function (mutation) {
        if (
          mutation.attributeName === 'class' ||
          mutation.attributeName === 'style'
        ) {
          checkStyle = true;
          return;
        }
        if (mutation.target.nodeName === 'STYLE') {
          checkStyle = true;
          return;
        }
        if (
          mutation.target.parentNode &&
          mutation.target.parentNode.nodeName === 'STYLE'
        ) {
          checkStyle = true;
          return;
        }
        if (
          mutation.target === intf &&
          (mutation.addedNodes.length > 0 || mutation.type === 'characterData')
        ) {
          checkInnerHTML = true;
        }
      });
      if (checkStyle) {
        intf.applyComponentStyle(false, intf);
      }
      if (checkInnerHTML) {
        if (intf.dataType === '') {
          intf.dataType = defaultDataType;
        }
        // intf.data = intf.innerHTML;
      }
    });
    observer.observe(this, {
      characterData: true,
      childList: true,
      attributes: true,
      subtree: true,
    });
    Array.prototype.forEach.call(
      document.querySelectorAll('style'),
      function (el) {
        observer.observe(el, {
          characterData: true,
          childList: true,
          attributes: true,
          subtree: true,
        });
      },
    );
  };
}
