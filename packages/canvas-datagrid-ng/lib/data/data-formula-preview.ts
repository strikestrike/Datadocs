import type { GridPrivateProperties, ParserCellData } from '../types';
import type { CellPreview } from '../cell-helper/types';
import { DrawUtils } from '../draw/util';
import {
  stringFormatter,
  bytesFormatter,
  booleanFormatter,
  numberFormatter,
  dateTimeFormatter,
  intervalFormatter,
  geographyFormatter,
} from './formatters';

import { copyMethods } from '../util';

export default function loadGridDataFormulaPreview(
  self: GridPrivateProperties,
) {
  copyMethods(new GridDataFormulaPreview(self), self);
}

/**
 * Maximum width of formula cell preview
 */
const EDIT_CELL_PREVIEW_MAX_WIDTH = 500; // px
const MIN_PREVIEW_CHILD_COUNT = 1;
const MAX_OBJECT_PREVIEW_KEY = 20;
const ELLIPISS_TEXT = '…';
const OPEN_CURLY_BRACKET = previewTokenWrapper('{');
const CLOSE_CURLY_BRACKET = previewTokenWrapper('}');
const OPEN_SQUARE_BRACKET = previewTokenWrapper('[');
const CLOSE_SQUARE_BRACKET = previewTokenWrapper(']');
const COLON = previewTokenWrapper(':');
const COMMA = previewTokenWrapper(',');
const SPACE = previewTokenWrapper('&nbsp;');
const ELLIPSIS = previewTokenWrapper(ELLIPISS_TEXT);
const JSON_PREFIX = previewTokenWrapper('JSON');

function previewValueWrapper(value: string): string {
  return `<span style="color: #F0980B;">${value}</span>`;
}

function previewStringWrapper(value: string): string {
  return `<span style="color: #1C9D9D;">${value}</span>`;
}

function previewKeyWrapper(value: string): string {
  return `<span style="color: #6D777E;">${value}</span>`;
}

function previewTokenWrapper(value: string): string {
  return `<span style="color: #454450;">${value}</span>`;
}

function previewChildrenWrapper(value: string): string {
  return `<span>${value}</span>`;
}

/**
 * Replace consecutive whitespaces to a non-breaking space to:
 * - Not showing too many consecutive whitespaces
 * - Not having whitespaces at the begin/end of value
 */
function previewTrimAllWhiteSpace(value: string): string {
  const reg = /(\s+)/g;
  return value.trim().replace(reg, ' ');
}

export class GridDataFormulaPreview {
  /**
   * It is used as a preview html temporarily placeholder,
   * make it easy for extracting textContent from preview html
   */
  cellPreviewPlaceholderElement: HTMLDivElement;

  constructor(private readonly grid: GridPrivateProperties) {
    this._initCellPreviewPlaceholder();
  }

  _initCellPreviewPlaceholder = () => {
    const cellPreviewPlaceholderId = 'canvas-datagrid-cell-preview-placeholder';
    this.cellPreviewPlaceholderElement = document.getElementById(
      cellPreviewPlaceholderId,
    ) as HTMLDivElement;

    if (!this.cellPreviewPlaceholderElement) {
      this.cellPreviewPlaceholderElement = document.createElement('div');
      this.cellPreviewPlaceholderElement.id = cellPreviewPlaceholderId;
      this.grid.createInlineStyle(
        this.cellPreviewPlaceholderElement,
        cellPreviewPlaceholderId,
      );
      document.body.appendChild(this.cellPreviewPlaceholderElement);
    }
  };

  _getCellPreviewTextContent = (cellPreviewHtml: string) => {
    this.cellPreviewPlaceholderElement.innerHTML = cellPreviewHtml;
    const textContent = this.cellPreviewPlaceholderElement.textContent;
    this.cellPreviewPlaceholderElement.innerHTML = '';
    return textContent;
  };

  /**
   * Check if preview content with is still fit in formula cell preview
   * @param cellPreviewHtml
   * @returns
   */
  _checkPreviewContentWidth = (cellPreviewHtml: string) => {
    const self = this.grid;
    const drawUtils = new DrawUtils(self);
    drawUtils.applyCellFontStyles({
      style: 'cell',
      fontSize: self.style.editCellPreviewFontSize,
      fontFamily: self.style.editCellPreviewFontFamily,
      fontWeight: 'normal',
      fontStyle: 'normal',
    });

    const textContent = this._getCellPreviewTextContent(cellPreviewHtml);
    const measurement = self.ctx.measureText(textContent);
    const pixelWidth = self.px(measurement.width, self.windowScale);
    return pixelWidth < EDIT_CELL_PREVIEW_MAX_WIDTH;
  };

  _isPreviewRoot = (level: number) => {
    return level === 1;
  };

  previewFormat = (parserCellData: ParserCellData, level = 1): CellPreview => {
    if (!parserCellData) return;
    const { value, dataType } = parserCellData;
    const isRoot = this._isPreviewRoot(level);

    if (value === null && dataType !== 'json') {
      if (isRoot) {
        return { value: '', dataType };
      } else {
        return { value: this._previewFormatNull(), dataType };
      }
    } else if (value === '' || value === undefined) {
      if (isRoot) return { value: '', dataType };
    }

    switch (dataType) {
      case 'boolean': {
        if (typeof value === 'boolean') {
          return { value: this._previewFormatBoolean(value), dataType };
        }
        break;
      }
      case 'int': {
        return { value: this._previewFormatNumber(value), dataType };
      }
      case 'float': {
        if (typeof value === 'number') {
          return { value: this._previewFormatNumber(value), dataType };
        }
        break;
      }
      case 'decimal': {
        return { value: this._previewFormatDecimal(value), dataType };
      }
      case 'string': {
        return { value: this._previewFormatString(value, !isRoot), dataType };
      }
      case 'bytes': {
        return { value: this._previewFormatBytes(value, isRoot), dataType };
      }
      case 'date': {
        return { value: this._previewFormatDate(value), dataType };
      }
      case 'time': {
        return { value: this._previewFormatTime(value), dataType };
      }
      case 'datetime': {
        return { value: this._previewFormatDatetime(value), dataType };
      }
      case 'timestamp': {
        return { value: this._previewFormatTimestamp(value), dataType };
      }
      case 'interval': {
        return { value: this._previewFormatInterval(value), dataType };
      }
      case 'json': {
        return { value: this._previewFormatJson(value), dataType };
      }
      case 'geography': {
        return { value: this._previewFormatGeo(value), dataType };
      }
      case 'null': {
        return { value: this._previewFormatNull(), dataType };
      }
      case 'struct': {
        return {
          value: this._previewFormatStruct(value, level),
          dataType,
        };
      }
      default: {
        if (dataType.endsWith('[]')) {
          return {
            value: this._previewFormatArray(value, level),
            dataType,
          };
        }

        return { value: '', dataType };
      }
    }
  };

  _previewFormatBoolean = (value: boolean): string => {
    return previewValueWrapper(booleanFormatter(value));
  };

  _previewFormatNumber = (value: number): string => {
    return previewValueWrapper(numberFormatter(value) as string);
  };

  _previewFormatDecimal = (value: { a: bigint; b: number }): string => {
    return previewValueWrapper(numberFormatter(value) as string);
  };

  _previewFormatString = (value: string, quote = false): string => {
    if (!value) return quote ? '""' : '';
    value = previewTrimAllWhiteSpace(value);
    let preview = stringFormatter(value);
    if (quote) preview = `"${preview}"`;
    return previewStringWrapper(preview);
  };

  _previewFormatBytes = (value: Uint8Array, isRoot = true): string => {
    if (!value || !value.length)
      return isRoot ? '' : previewTokenWrapper('b') + SPACE;
    let preview = bytesFormatter(value, -1, { type: 'bytes', format: 'utf8' });
    preview = previewTrimAllWhiteSpace(preview);
    return `<span>${previewTokenWrapper('b')}${SPACE}${previewStringWrapper(
      stringFormatter(preview),
    )}</span>`;
  };

  _previewFormatDate = (value: number): string => {
    return previewValueWrapper(dateTimeFormatter(value, { type: 'date' }));
  };

  _previewFormatTime = (value: number): string => {
    return previewValueWrapper(dateTimeFormatter(value, { type: 'time' }));
  };

  _previewFormatDatetime = (value: number): string => {
    return previewValueWrapper(
      dateTimeFormatter(value, {
        type: 'datetime',
        format: 'M/d/yyyy H:mm:ss',
      }),
    );
  };

  _previewFormatTimestamp = (value: number): string => {
    return previewValueWrapper(
      dateTimeFormatter(value, {
        type: 'timestamp',
        format: 'M/d/yyyy HH:mm:ss UTC',
        timeZoneOffset: 0,
      }),
    );
  };

  _previewFormatInterval = (value: number): string => {
    return previewValueWrapper(intervalFormatter(value));
  };

  _previewFormatGeo = (value: Uint8Array): string => {
    let str = geographyFormatter(value);
    str = previewTrimAllWhiteSpace(str);
    return this._previewFormatString(str, false);
  };

  _previewFormatNull = (): string => {
    return previewValueWrapper('NULL');
  };

  _previewFormatArrayShortTerm = (numberOfChildren: number): string => {
    return previewTokenWrapper(`Array(${numberOfChildren})`);
  };

  _previewFormatArray = (value: any, level = 1): string => {
    const isRoot = this._isPreviewRoot(level);
    const numberOfChildren = value.length;
    if (isRoot) {
      const previewChildren: Array<CellPreview> = [];
      const getPreviewChildAt = (index: number): string => {
        if (!previewChildren[index]) {
          previewChildren[index] = this.previewFormat(value[index], level + 1);
        }
        return previewChildren[index].value;
      };
      const getPreviewContentForArray = (childCount: number): string => {
        if (childCount <= 0) return OPEN_SQUARE_BRACKET + CLOSE_SQUARE_BRACKET;
        const children: Array<string> = [];
        for (let i = 0; i < childCount; i++) {
          children.push(getPreviewChildAt(i));
        }
        if (childCount < numberOfChildren) {
          children.push(ELLIPSIS);
        }

        return (
          OPEN_SQUARE_BRACKET +
          children.join(COMMA + SPACE) +
          CLOSE_SQUARE_BRACKET
        );
      };

      let previewResult: string = OPEN_SQUARE_BRACKET + CLOSE_SQUARE_BRACKET;
      if (numberOfChildren > 0) {
        for (let i = 0; i < numberOfChildren; i++) {
          const childCount = i + 1;
          const previewContent = getPreviewContentForArray(childCount);
          if (
            childCount > MIN_PREVIEW_CHILD_COUNT &&
            !this._checkPreviewContentWidth(previewContent)
          ) {
            break;
          }
          previewResult = previewContent;
        }
      }

      return previewChildrenWrapper(previewResult);
    } else {
      return this._previewFormatArrayShortTerm(numberOfChildren);
    }
  };

  _previewFormatStruct = (value: any, level = 1): string => {
    const isRoot = this._isPreviewRoot(level);
    const structKeys = [];
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        structKeys.push(key);
      }
      if (structKeys.length >= MAX_OBJECT_PREVIEW_KEY) break;
    }
    const numberOfChildren = structKeys.length;

    if (isRoot) {
      const previewChildren: Array<CellPreview> = [];
      const getPreviewChildAt = (index: number): string => {
        const childKey = structKeys[index];
        if (!previewChildren[childKey]) {
          previewChildren[childKey] = this.previewFormat(
            value[childKey],
            level + 1,
          );
        }
        return (
          previewKeyWrapper(childKey) +
          COLON +
          SPACE +
          previewChildren[childKey].value
        );
      };
      const getPreviewContentForStruct = (childCount: number): string => {
        if (childCount <= 0) return OPEN_SQUARE_BRACKET + CLOSE_SQUARE_BRACKET;
        const children: Array<string> = [];
        for (let i = 0; i < childCount; i++) {
          children.push(getPreviewChildAt(i));
        }
        if (childCount < numberOfChildren) {
          children.push(ELLIPSIS);
        }

        return (
          OPEN_CURLY_BRACKET +
          children.join(COMMA + SPACE) +
          CLOSE_CURLY_BRACKET
        );
      };

      let previewResult: string = OPEN_SQUARE_BRACKET + CLOSE_SQUARE_BRACKET;
      if (numberOfChildren > 0) {
        for (let i = 0; i < numberOfChildren; i++) {
          const childCount = i + 1;
          const previewContent = getPreviewContentForStruct(childCount);
          if (
            childCount > MIN_PREVIEW_CHILD_COUNT &&
            !this._checkPreviewContentWidth(previewContent)
          ) {
            break;
          }
          previewResult = previewContent;
        }
      }
      return previewChildrenWrapper(previewResult);
    } else {
      const child = numberOfChildren > 0 ? ELLIPSIS : '';
      return OPEN_CURLY_BRACKET + child + CLOSE_CURLY_BRACKET;
    }
  };

  _previewFormatJson = (value: any, level = 1): string => {
    const isRoot = this._isPreviewRoot(level);
    const jsonPrefix = isRoot ? JSON_PREFIX + SPACE : '';

    if (Array.isArray(value)) {
      return this._previewFormatJsonArray(value, level);
    }

    switch (typeof value) {
      case 'object': {
        if (value === null) {
          return jsonPrefix + this._previewFormatNull();
        } else {
          return this._previewFormatJsonObject(value, level);
        }
      }
      case 'boolean': {
        return jsonPrefix + this._previewFormatBoolean(value);
      }
      case 'string': {
        return jsonPrefix + this._previewFormatString(value, !isRoot);
      }
      case 'undefined': {
        return jsonPrefix + previewValueWrapper('undefined');
      }
      case 'number':
      case 'bigint': {
        return jsonPrefix + this._previewFormatNumber(Number(value));
      }
      default: {
        return jsonPrefix + previewTokenWrapper(JSON.stringify(value));
      }
    }
  };

  _previewFormatJsonArray = (value: Array<any>, level = 1): string => {
    const isRoot = this._isPreviewRoot(level);
    const jsonPrefix = isRoot ? JSON_PREFIX + SPACE : '';
    const numberOfChildren = value.length;

    if (isRoot) {
      const previewChildren: Array<string> = [];
      const getPreviewChildAt = (index: number): string => {
        if (!previewChildren[index]) {
          previewChildren[index] = this._previewFormatJson(
            value[index],
            level + 1,
          );
        }
        return previewChildren[index];
      };
      const getPreviewContentForArray = (childCount: number): string => {
        if (childCount <= 0) return OPEN_SQUARE_BRACKET + CLOSE_SQUARE_BRACKET;
        const children: Array<string> = [];
        for (let i = 0; i < childCount; i++) {
          children.push(getPreviewChildAt(i));
        }
        if (childCount < numberOfChildren) {
          children.push(ELLIPSIS);
        }

        return (
          jsonPrefix +
          OPEN_SQUARE_BRACKET +
          children.join(COMMA + SPACE) +
          CLOSE_SQUARE_BRACKET
        );
      };

      let previewResult: string = OPEN_SQUARE_BRACKET + CLOSE_SQUARE_BRACKET;
      if (numberOfChildren > 0) {
        for (let i = 0; i < numberOfChildren; i++) {
          const childCount = i + 1;
          const previewContent = getPreviewContentForArray(childCount);
          if (
            childCount > MIN_PREVIEW_CHILD_COUNT &&
            !this._checkPreviewContentWidth(previewContent)
          ) {
            break;
          }
          previewResult = previewContent;
        }
      }

      return previewChildrenWrapper(previewResult);
    } else {
      return this._previewFormatArrayShortTerm(numberOfChildren);
    }
  };

  _previewFormatJsonObject = (value: any, level = 1): string => {
    const isRoot = this._isPreviewRoot(level);
    const jsonPrefix = isRoot ? JSON_PREFIX + SPACE : '';
    const jsonKeys = [];

    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        jsonKeys.push(key);
      }
      if (jsonKeys.length >= MAX_OBJECT_PREVIEW_KEY) break;
    }
    const numberOfChildren = jsonKeys.length;

    if (isRoot) {
      const previewChildren: Array<string> = [];
      const getPreviewChildAt = (index: number): string => {
        const childKey = jsonKeys[index];
        if (!previewChildren[childKey]) {
          previewChildren[childKey] = this._previewFormatJson(
            value[childKey],
            level + 1,
          );
        }
        return (
          previewKeyWrapper(childKey) +
          COLON +
          SPACE +
          previewChildren[childKey]
        );
      };
      const getPreviewContentForJson = (childCount: number): string => {
        if (childCount <= 0) return OPEN_SQUARE_BRACKET + CLOSE_SQUARE_BRACKET;
        const children: Array<string> = [];
        for (let i = 0; i < childCount; i++) {
          children.push(getPreviewChildAt(i));
        }
        if (childCount < numberOfChildren) {
          children.push(ELLIPSIS);
        }

        return (
          jsonPrefix +
          OPEN_CURLY_BRACKET +
          children.join(COMMA + SPACE) +
          CLOSE_CURLY_BRACKET
        );
      };

      let previewResult: string = OPEN_SQUARE_BRACKET + CLOSE_SQUARE_BRACKET;
      if (numberOfChildren > 0) {
        for (let i = 0; i < numberOfChildren; i++) {
          const childCount = i + 1;
          const previewContent = getPreviewContentForJson(childCount);
          if (
            childCount > MIN_PREVIEW_CHILD_COUNT &&
            !this._checkPreviewContentWidth(previewContent)
          ) {
            break;
          }
          previewResult = previewContent;
        }
      }
      return previewChildrenWrapper(previewResult);
    } else {
      const child = numberOfChildren > 0 ? ELLIPSIS : '';
      return OPEN_CURLY_BRACKET + child + CLOSE_CURLY_BRACKET;
    }
  };
}
