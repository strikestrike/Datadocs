import type {
  GridPrivateProperties,
  GridPublicProperties,
} from '../types/grid';
import {
  defaultGridStyleKeys,
  defaultGridStyles,
} from '../style/default-styles';
import { hyphenateProperty } from './utils';
import { defaultGridAttributes } from '../attributes';
import type { GridInitArgs } from '../types';

const typeMap = {
  data: function (strData: string) {
    try {
      return JSON.parse(strData);
    } catch (e) {
      throw new Error('Cannot read JSON data in canvas-datagrid data.');
    }
  },
  schema: function (strSchema: string) {
    try {
      return JSON.parse(strSchema);
    } catch (e) {
      throw new Error(
        'Cannot read JSON data in canvas-datagrid schema attribute.',
      );
    }
  },
  number: function (strNum: string, def: number) {
    var n = parseInt(strNum, 10);
    return isNaN(n) ? def : n;
  },
  boolean: function (strBool: string) {
    return /true/i.test(strBool);
  },
  string: function (str: string) {
    return str;
  },
};
type AnyTuple = [string, any][];
const defaults = {
  attributes: Object.entries(defaultGridAttributes) as AnyTuple,
  styles: Object.entries(defaultGridStyles) as AnyTuple,
};
function getDefaultItem(base: 'attributes' | 'styles', item: string) {
  const r = defaults[base].filter(function (tuple) {
    return (
      tuple[0].toLowerCase() === item.toLowerCase() ||
      hyphenateProperty(tuple[0]) === item.toLowerCase() ||
      hyphenateProperty(tuple[0], true) === item.toLowerCase()
    );
  })[0];
  return r;
}

export function applyComponentStyle(
  supressChangeAndDrawEvents: boolean,
  intf: GridPrivateProperties | GridPublicProperties,
) {
  /** Current grid is not used as a WebComponent */
  if (!intf.isComponent) {
    return;
  }
  const intfAsElement: HTMLElement = intf as any;

  /** @see https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle */
  const cStyle = window.getComputedStyle(
    intfAsElement.tagName === 'CANVAS-DATAGRID' ? intfAsElement : intf.canvas,
    null,
  );
  /** @FIXME */
  (intf as any).computedStyle = cStyle;

  defaultGridStyleKeys.forEach((key) => {
    const defaultValue = defaultGridStyles[key];
    let val = cStyle.getPropertyValue(hyphenateProperty(key, true));
    if (val === '')
      val = cStyle.getPropertyValue(hyphenateProperty(key, false));
    if (val !== '' && typeof val === 'string') {
      intf.setStyleProperty(
        key,
        typeMap[typeof defaultValue](
          val.replace(/^\s+/, '').replace(/\s+$/, ''),
          defaultValue,
        ),
        true,
      );
    }
  });

  if (!supressChangeAndDrawEvents && intf.dispatchEvent) {
    requestAnimationFrame(function () {
      intf.resize(true);
    });
    intf.dispatchEvent('stylechanged', intf.style);
  }
}

export function applyComponentAttribute(
  attrName: string,
  oldVal: any,
  newVal: any,
  intf: GridPrivateProperties,
) {
  var tfn, def;
  if (attrName === 'style') {
    applyComponentStyle(false, intf);
    return;
  }
  if (attrName === 'schema') {
    // intf.schema = typeMap.schema(newVal);
    return;
  }
  if (attrName === 'name') {
    intf['name'] = newVal;
    return;
  }
  if (attrName === 'class' || attrName === 'className') {
    return;
  }
  def = getDefaultItem('attributes', attrName);
  if (def) {
    tfn = typeMap[typeof def[1]];
    intf.attributes[def[0]] = tfn(newVal);
    return;
  }
  if (/^on/.test(attrName)) {
    const eventHandler = Function('e', newVal) as any;
    intf.addEventListener('on' + attrName, eventHandler);
  }
  return;
}

/** top level keys in args */
const topLevelKeys = new Set([
  'style',
  'formatters',
  'sorters',
  'filters',
  'schema',
]);
const complexTopLevelKeys = new Set(['formatters', 'sorters', 'filters']);

export function applyComponentInitArgs(
  component: HTMLElement,
  args: GridInitArgs,
) {
  Object.keys(args).forEach(function (argKey) {
    // set data and parentNode after everything else
    if (argKey === 'data' || argKey === 'parentNode') return;
    if (topLevelKeys.has(argKey)) {
      if (complexTopLevelKeys.has(argKey)) {
        if (typeof args[argKey] === 'object' && args[argKey] !== null) {
          Object.keys(args[argKey]).forEach(function (sKey) {
            component[argKey][sKey] = args[argKey][sKey];
          });
        }
      } else {
        component[argKey] = args[argKey];
      }
      return;
    }
    // all others are attribute level keys
    component.attributes[argKey] = args[argKey];
  });
  // if (args.data) {
  // gridElement.data = args.data;
  // }
}
