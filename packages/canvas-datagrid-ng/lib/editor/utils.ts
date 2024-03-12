import type { CellStyleDeclaration, NormalCellDescriptor } from '../types';
import { copyMethods } from '../util';
import { transformToHttpUrl } from '../utils/hyperlink';
import type { EditorChildNodeData, EditorElement } from './type';

export default function loadEditorElementFunctions(self: EditorElement) {
  copyMethods(new EditorElementFunctions(self), self);
}

const RGBA_COLOR_REGEX =
  /^((rgba)|rgb)[\D]+([\d.]+)[\D]+([\d.]+)[\D]+([\d.]+)[\D]*?([\d.]+|$)/i;

const HEX_COLOR_REGEX =
  /^#?(([\dA-Fa-f]{3,4})|([\dA-Fa-f]{6})|([\dA-Fa-f]{8}))$/i;

function isHexColor(v: string): boolean {
  return !!HEX_COLOR_REGEX.exec(v);
}
export const cellEditorStyleKeys: Array<keyof CellStyleDeclaration> = [
  'isBold',
  'isItalic',
  'isStrikethrough',
  'isUnderline',
  'fontSize',
  'fontFamily',
  'styleRuns',
];

/**
 * convert a color string to hex color
 * @param color a color string of types: rgb, rgba or hex
 * @returns
 */
export function parseToHex(color: string): string {
  if (isHexColor(color)) {
    return color;
  }

  const isValid = (v: number) => !isNaN(v) && v >= 0 && v <= 255;
  const match = RGBA_COLOR_REGEX.exec(color);
  if (!match) return null;
  const r = parseInt(match[3]),
    g = parseInt(match[4]),
    b = parseInt(match[5]),
    a = Math.floor((match[6] ? parseFloat(match[6]) : 1) * 255);

  if (!isValid(r) || !isValid(g) || !isValid(b) || !isValid(a)) {
    return null;
  }

  return (
    '#' + [r, g, b, a].map((v) => v.toString(16).padStart(2, '0')).join('')
  );
}

const FONTSIZE_REGEX = /^([\d]+)(\s)*(px)/i;
export function parseFontSize(size: string): number {
  const isValid = (v: number) => !isNaN(v) && v >= 6 && v <= 36;
  const match = FONTSIZE_REGEX.exec(size);
  if (!match) return null;
  const num = parseInt(match[1]);
  if (!isValid(num)) {
    return null;
  }
  return num;
}

export class EditorElementFunctions {
  constructor(private readonly editor: EditorElement) {}

  handleFormularModeChange = () => {
    const isOldInFormularMode = this.editor.isStateInFormulaMode(
      this.editor.getState('OLD'),
    );
    const isNewInFormularMode = this.editor.isStateInFormulaMode(
      this.editor.getState('NEW'),
    );

    // Editor style-runs/link-runs should be removed when switching between two
    // modes
    if (isOldInFormularMode != isNewInFormularMode) {
      this.editor.resetEditorContent();
      this.editor.buildHistoryState('NEW');
    }
  };

  isNestedNode = (node: Node): boolean => {
    if (
      node.nodeName.toLowerCase() === 'span' &&
      node.parentNode === this.editor
    ) {
      if (node.childNodes.length === 0) {
        return false;
      } else if (
        node.childNodes.length === 1 &&
        node.childNodes[0] instanceof Text
      ) {
        return false;
      }
    }
    return true;
  };

  /**
   * Flatten nested child nodes in editor. Bring them on the same level (bellow
   * the editor contenteditable root), make it easier to manage and retrieve
   * style-runs or link-runs data.
   * @param node
   * @returns
   */
  flattenElement = (node: Node): HTMLElement[] => {
    const flattenData = this.getFlattenNodeData(node);
    return flattenData.map((data) => {
      return this.createGridEditorChildElement(
        data.textContent,
        data.tag,
        data.style,
        data.href,
        data.id,
      );
    }, this);
  };

  getNodeData = (
    currNode: Node,
    shouldUpdatedFontSize = false,
  ): EditorChildNodeData[] => {
    const self = this.editor;
    const result: EditorChildNodeData[] = [];
    const {
      isBold,
      isItalic,
      isStrikethrough,
      fontFamily,
      textColor,
      isUnderline,
    } = self.extractChildNodeStyle(currNode);
    const fontSize =
      currNode instanceof HTMLElement ? currNode.style.fontSize : null;
    let updatedFontSize = fontSize;

    if (fontSize && fontSize === 'medium' && shouldUpdatedFontSize) {
      updatedFontSize = self.currentSelectedFontSize + 'px';
    }

    let shouldUpdateUnderlineStyle = false;
    if (currNode instanceof HTMLElement && self.isUpdatingUnderlineStyle) {
      shouldUpdateUnderlineStyle = this.checkNodeInsideSelection(currNode);
    }

    for (let i = 0; i < currNode.childNodes.length; i++) {
      const childNode = currNode.childNodes[i];
      const childData = this.getFlattenNodeData(childNode);

      childData.forEach((data) => {
        if (isBold) data.style.isBold = true;
        if (isItalic) data.style.isItalic = true;
        if (isStrikethrough) data.style.isStrikethrough = true;
        if (fontFamily) data.style.fontFamily = fontFamily;
        if (textColor) data.style.textColor = textColor;
        // Need to make sure the parent font-size doesn't override child font-size
        // unless we are changing font-size.
        if (
          (fontSize === 'medium' && shouldUpdatedFontSize) ||
          !data.style.fontSize
        ) {
          data.style.fontSize = parseFontSize(updatedFontSize);
        }
        if (shouldUpdateUnderlineStyle) {
          if (hasUnderlineStyle(currNode as HTMLElement)) {
            data.style.isUnderline = true;
          } else {
            data.style.isUnderline = data.style.isUnderline ?? false;
          }
        } else if (isUnderline != null) {
          data.style.isUnderline = data.style.isUnderline ?? isUnderline;
        }
      });
      result.push(...childData);
    }
    return result;
  };

  getFlattenNodeData = (node: Node): EditorChildNodeData[] => {
    const self = this.editor;
    const childrenData: EditorChildNodeData[] = [];

    if (node instanceof Text) {
      // This is text node, we will need to create a `<span>` tag
      const nodeData: EditorChildNodeData = {
        tag: 'span',
        textContent: node.textContent,
        style: {},
      };
      childrenData.push(nodeData);
    } else if (node instanceof HTMLElement && node.childNodes.length > 0) {
      const childNodes = node.childNodes;

      switch (node.nodeName.toLowerCase()) {
        case 'b':
        case 'strong': {
          for (let i = 0; i < childNodes.length; i++) {
            const child = childNodes[i];
            const childData = this.getFlattenNodeData(child);
            childData.forEach((data) => {
              data.style.isBold = true;
            });
            childrenData.push(...childData);
          }
          break;
        }
        case 'i': {
          for (let i = 0; i < childNodes.length; i++) {
            const child = childNodes[i];
            const childData = this.getFlattenNodeData(child);
            childData.forEach((data) => {
              data.style.isItalic = true;
            });
            childrenData.push(...childData);
          }
          break;
        }
        case 'strike': {
          for (let i = 0; i < childNodes.length; i++) {
            const child = childNodes[i];
            const childData = this.getFlattenNodeData(child);
            childData.forEach((data) => {
              data.style.isStrikethrough = true;
            });
            childrenData.push(...childData);
          }
          break;
        }
        case 'u': {
          for (let i = 0; i < childNodes.length; i++) {
            const child = childNodes[i];
            const childData = this.getFlattenNodeData(child);
            childData.forEach((data) => {
              data.style.isUnderline = true;
            });
            childrenData.push(...childData);
          }
          break;
        }
        case 'font': {
          if (!(node instanceof HTMLFontElement)) {
            break;
          }

          const fontFamily = node.face;
          const fontSize = parseFontSize(self.currentSelectedFontSize + 'px');
          for (let i = 0; i < childNodes.length; i++) {
            const child = childNodes[i];
            const childData = this.getFlattenNodeData(child);
            for (const data of childData) {
              if (node.face) {
                data.style.fontFamily = fontFamily;
              }
              if (node.size === '3') {
                data.style.fontSize = fontSize;
              }
            }
            childrenData.push(...childData);
          }
          break;
        }
        case 'span': {
          const childData = this.getNodeData(node, true);
          childrenData.push(...childData);
          break;
        }
        case 'a': {
          const childData = this.getNodeData(node, true);
          const linkData = this.extractLinkNodeData(node as HTMLAnchorElement);
          let shouldChangeTextColor = false;
          let shouldChangeUnderline = false;
          if (self.currentSelectedTextColor || self.isUpdatingUnderlineStyle) {
            const isInSelection = this.checkNodeInsideSelection(node);
            shouldChangeTextColor =
              self.currentSelectedTextColor && isInSelection;
            shouldChangeUnderline =
              self.isUpdatingUnderlineStyle && isInSelection;
          }

          childData.forEach((data) => {
            data.tag = 'a';
            data.href = linkData.ref;
            data.id = linkData.id;
            if (shouldChangeTextColor) {
              data.style.textColor = self.currentSelectedTextColor;
            }

            if (shouldChangeUnderline) {
              if (hasUnderlineStyle(node)) {
                data.style.isUnderline = true;
              } else {
                data.style.isUnderline = data.style.isUnderline ?? false;
              }
            }
          });

          childrenData.push(...childData);
          break;
        }
        default: {
          if (node === self) {
            for (let i = 0; i < childNodes.length; i++) {
              const child = childNodes[i];
              const childData = this.getFlattenNodeData(child);
              childrenData.push(...childData);
            }
          } else {
            const childData = this.getNodeData(node, true);
            childrenData.push(...childData);
          }
        }
      }
    }

    return childrenData;
  };

  flattenRange = (start: Node, end: Node): HTMLElement[] => {
    if (start === end) return this.flattenElement(start);
    const res: HTMLElement[] = [];
    for (let node = start; node !== end; node = node.nextSibling) {
      const newChildList = this.flattenElement(node);
      for (const newChild of newChildList) {
        res.push(newChild);
      }
    }
    return res;
  };

  typingText = (event: KeyboardEvent) => {
    const self = this.editor;
    const selection = window.getSelection();
    if (selection.rangeCount) {
      let range = selection.getRangeAt(0);
      let toReplace = range.commonAncestorContainer;
      let selOffset = self.getSelectionOffsets(toReplace);
      if (
        !this.isNestedNode(toReplace) ||
        document.activeElement !== this.editor
      ) {
        return true;
      }
      let lastNode: HTMLElement;
      let flattenElements: HTMLElement[] = null;

      // https://github.com/yabwe/medium-editor/issues/748
      // If the selection is an empty editor element, create a temporary text node inside of the editor
      // and select it so that we don't delete the editor element
      if (toReplace === self) {
        range.selectNodeContents(toReplace);
      } else {
        // Ensure range covers maximum amount of nodes as possible
        // By moving up the DOM and selecting ancestors whose only child is the range
        while (
          !(toReplace === self) &&
          toReplace.parentNode &&
          !(toReplace.parentNode === self)
        ) {
          toReplace = toReplace.parentNode;
        }
        // updated select node
        selOffset = self.getSelectionOffsets(toReplace);
        range.selectNode(toReplace);
      }

      flattenElements = this.flattenElement(toReplace);
      range.deleteContents();

      const fragment = document.createDocumentFragment();
      let selectedStartNode: HTMLElement = null;
      let selectedEndNode: HTMLElement = null;
      for (const ele of flattenElements) {
        lastNode = fragment.appendChild(ele);
        if (selectedStartNode === null) {
          if (selOffset.startOffset > ele.textContent.length) {
            selOffset.startOffset -= ele.textContent.length;
          } else {
            selectedStartNode = lastNode;
          }
        }
        if (selectedEndNode === null) {
          if (selOffset.endOffset > ele.textContent.length) {
            selOffset.endOffset -= ele.textContent.length;
          } else {
            selectedEndNode = lastNode;
          }
        }
      }
      range.insertNode(fragment);

      // Preserve the selection:
      if (lastNode) {
        range = range.cloneRange();
        range.setStart(selectedStartNode.childNodes[0], selOffset.startOffset);
        range.setEnd(selectedEndNode.childNodes[0], selOffset.endOffset);
        // range.collapse(true);
        self.selectRange(document, range);
      }
    }

    self.excecuteHyperlinkHandlers();
    // Update link-runs data
    self.updateEditorLinkRun();
    self.updateSelection();
  };

  /**
   * Create `<span>` or `<a>` element. Use to create child element of grid editor
   * (a contenteditable div).
   * @param text
   * @param tag
   * @param style
   * @param reference
   * @returns
   */
  createGridEditorChildElement = (
    text: string,
    tag: EditorChildNodeData['tag'],
    style: Partial<CellStyleDeclaration>,
    reference?: string,
    linkId?: string,
  ) => {
    const element = document.createElement(tag);
    const baseStyle = getCSSStyleFromCellStyle(style);

    element.innerText = text;
    Object.assign(element.style, baseStyle);

    // Link text have underline style by default, we need a way to know if the text
    // underline was defined or not. So we have three different value: true, false
    // and undefined. A workaround is adding `underline` property to the node dataset
    // if there is underline style set by users.
    const isUnderlineDefined = style.isUnderline != null;
    if (isUnderlineDefined) {
      element.dataset.underline = 'true';
    }

    if (element instanceof HTMLAnchorElement) {
      const linkDefaultStyle = this.editor.grid.getLinkDefaultStyle();

      element.href = transformToHttpUrl(reference ?? '');
      element.dataset.linkRef = reference ?? '';
      element.dataset.linkId = linkId ?? '';

      if (baseStyle.color) {
        element.dataset.color = baseStyle.color;
      } else {
        // We won't know where a link text-color comes from if only get it from
        // the style attribute of `<a>` element. So we use dataset property to
        // store the custom text color in style-run
        element.style.color = linkDefaultStyle.textColor;
      }

      if (!isUnderlineDefined) {
        element.style.textDecoration = getTextDecoration(
          style.isStrikethrough,
          true,
        );
        element.style.textDecorationLine = getTextDecoration(
          style.isStrikethrough,
          true,
        );
      }
    }

    // Make sure text decoration underline over the text
    element.style.textDecorationSkipInk = 'none';

    return element;
  };

  /**
   * Convert a link (`<a>`) to normal `<span>` without losing any style information
   * @param linkNode
   */
  unlinkAnchorElement = (linkNode: HTMLAnchorElement): HTMLSpanElement => {
    const nodeStyle = this.extractChildNodeStyle(linkNode);
    return this.createGridEditorChildElement(
      linkNode.textContent,
      'span',
      nodeStyle,
    );
  };

  /**
   * Extract style from grid editor child node
   * @param child
   * @returns
   */
  extractChildNodeStyle = (child: Node): Partial<CellStyleDeclaration> => {
    const isBold =
      child instanceof HTMLElement ? child.style.fontWeight === 'bold' : false;
    const isItalic =
      child instanceof HTMLElement ? child.style.fontStyle === 'italic' : false;
    const isStrikethrough =
      child instanceof HTMLElement ? hasStrikeThrough(child) : false;

    // Link text have underline style by default, we need a way to know if the text
    // underline was defined or not. So we have three different value: true, false
    // and undefined. A workaround is adding a new underline to the node dataset if
    // there is underline style set by users.
    let isUnderline: boolean = null;
    if (child instanceof HTMLElement) {
      const userDefined = !!child.dataset.underline;
      if (userDefined) {
        isUnderline = hasUnderlineStyle(child);
      }
    }

    const fontFamily =
      child instanceof HTMLElement ? child.style.fontFamily : null;
    let textColor = child instanceof HTMLElement ? child.style.color : null;
    const fontSize = child instanceof HTMLElement ? child.style.fontSize : null;

    if (child instanceof HTMLAnchorElement) {
      // Link custom text-color is stored inside dataset property, don't take default
      // link color into account.
      textColor = child.dataset.color || null;
    }

    return {
      isBold,
      isItalic,
      isStrikethrough,
      isUnderline,
      fontFamily,
      textColor: textColor ? parseToHex(textColor) : null,
      fontSize: fontSize ? parseFontSize(fontSize) : null,
    };
  };

  /**
   * Extract the link data such as Id or URL
   * @param node
   */
  extractLinkNodeData = (node: HTMLAnchorElement) => {
    return {
      id: node.dataset.linkId,
      ref: node.dataset.linkRef,
    };
  };

  /**
   * Remove all empty child nodes in grid editor
   *
   * After removing children on grid editor (e.g remove related link nodes),
   * there are parts of the node remain without any content inside. So we need
   * to do clean it up.
   */
  cleanEmptyChildren = () => {
    const self = this.editor;
    const emptyNodes: ChildNode[] = [];

    if (!(self instanceof HTMLElement)) {
      return;
    }

    function cleanNodes(node: HTMLElement) {
      const childNodes = node.childNodes;
      for (let i = 0; i < childNodes.length; i++) {
        const child = childNodes[i];
        if (child instanceof HTMLElement && child.textContent) {
          // Check nested children
          cleanNodes(child);
        } else if (child instanceof Text && child.textContent) {
          // Keep the non-empty text node
        } else {
          // Add empty node into removing node list
          emptyNodes.push(child);
        }
      }
    }

    cleanNodes(self);
    emptyNodes.forEach((node) => {
      self.removeChild(node);
    });
  };

  /**
   * Check if a child node of grid editor is inside the current selection
   * @param node
   * @returns
   */
  checkNodeInsideSelection = (node: HTMLElement | Text) => {
    const self = this.editor;
    const offset = getChildTextOffset(node, self);
    return (
      self.currentSelection.startOffset <= offset.startOffset &&
      self.currentSelection.endOffset >= offset.endOffset
    );
  };

  /**
   * It is used for running any actions that make changes to grid editor and we
   * also want to add `OLD` and `NEW` state for later use in undo/redo.
   * @param executeAction
   */
  executeActionWithHistory = (executeAction: () => void) => {
    const self = this.editor;
    self.buildHistoryState('OLD');

    // call the actual action that make editor state change
    if (typeof executeAction === 'function') {
      executeAction();
    }

    self.buildHistoryState('NEW');
    self.addHistoryItem();
    self.markEditorAsChanged();
  };

  getEditCellDefaultLinkStyle = (): Partial<CellStyleDeclaration> => {
    return {
      isUnderline: this.editor.editCell.isUnderline ?? null,
      textColor: this.editor.editCell.textColor || null,
    };
  };

  /**
   * Notify grid to update input style due to some changes in the editor. It
   * should be called after insert/remove/edit hyperlink.
   * @param immediate
   */
  updateEditorStyle = (immediate = false) => {
    const grid = this.editor.grid;
    if (immediate) {
      grid.resizeEditInput();
    } else {
      setTimeout(() => {
        grid.resizeEditInput();
      });
    }
  };
}

/**
 * Get bounding rect of grid editor children. It can be used to show the
 * layover menu around that child, such as Hyperlink layover for an individual
 * link in grid editor.
 * @param input
 * @param startOffset
 * @param endOffset
 * @returns
 */
export function getChildRect(
  input: HTMLElement,
  startOffset: number,
  endOffset: number,
) {
  const children = input.children;
  if (children.length === 0) {
    return input.getBoundingClientRect();
  }

  const childList: DOMRect[] = [];
  let currentOffset = 0;
  for (let i = 0; i < children.length; i++) {
    const child = children[i] as HTMLElement;
    if (currentOffset >= startOffset && currentOffset < endOffset) {
      childList.push(child.getBoundingClientRect());
    }
    currentOffset += child.textContent.length;
  }

  if (childList.length === 0) {
    childList.push((children[0] as HTMLElement).getBoundingClientRect());
  }

  const left = Math.min(...childList.map((child) => child.left));
  const right = Math.max(...childList.map((child) => child.right));
  const top = Math.min(...childList.map((child) => child.top));
  const bottom = Math.max(...childList.map((child) => child.bottom));

  return {
    x: left,
    y: top,
    left,
    right,
    top,
    bottom,
    width: right - left,
    height: bottom - top,
  };
}

/**
 * Generate CSS style from cell style. The main purpose is we can apply it
 * to editor child elements
 * @param style
 * @returns
 */
export function getCSSStyleFromCellStyle(
  style: Partial<CellStyleDeclaration>,
): Partial<CSSStyleDeclaration> {
  const result: Partial<CSSStyleDeclaration> = {};

  if (style.isBold) {
    result.fontWeight = 'bold';
  }
  if (style.isItalic) {
    result.fontStyle = 'italic';
  }
  result.textDecoration = getTextDecoration(
    style.isStrikethrough,
    style.isUnderline,
  );
  result.textDecorationLine = getTextDecoration(
    style.isStrikethrough,
    style.isUnderline,
  );
  if (style.fontFamily) {
    result.fontFamily = style.fontFamily;
  }
  if (style.textColor) {
    result.color = style.textColor;
  }
  if (style.fontSize) {
    result.fontSize = style.fontSize + 'px';
  }

  return result;
}

/**
 * Get text offset of child node in a root element.
 * @param child
 * @param root
 * @returns
 */
function getChildTextOffset(child: HTMLElement | Text, root: HTMLElement) {
  if (!root.contains(child)) return null;

  let parent = child.parentElement;
  let offset = 0;

  do {
    for (let i = 0; i < parent.childNodes.length; i++) {
      const currChild = parent.childNodes[i];
      if (!currChild.contains(child)) {
        offset += currChild.textContent.length;
      } else {
        break;
      }
    }

    parent = parent.parentElement;
  } while (root.contains(parent));

  return {
    startOffset: offset,
    endOffset: offset + child.textContent.length,
  };
}

/**
 * Check if a HTMLElement has strikethrough style or not
 * @param node
 * @returns
 */
export function hasStrikeThrough(node: HTMLElement) {
  return (
    node instanceof HTMLElement &&
    (node.style.textDecoration.includes('line-through') ||
      node.style.textDecorationLine.includes('line-through'))
  );
}

/**
 * Check if a HTMLElement has underline style or not
 * @param node
 * @returns
 */
export function hasUnderlineStyle(node: HTMLElement) {
  return (
    node instanceof HTMLElement &&
    (node.style.textDecoration.includes('underline') ||
      node.style.textDecorationLine.includes('underline'))
  );
}

/**
 * Get decoration style string
 * @param isStrikeThrough
 * @param isUnderline
 * @returns
 */
function getTextDecoration(isStrikeThrough: boolean, isUnderline: boolean) {
  let textDecoration = '';
  if (isStrikeThrough) {
    textDecoration += 'line-through';
  }
  if (isUnderline) {
    textDecoration += ' underline';
  }
  return textDecoration.trim();
}

/**
 * Use for checking if two style or link-runs are equal
 */
export function checkRunsEqual(x: any, y: any) {
  if (x == y) {
    return true;
  } else if (Array.isArray(x) && Array.isArray(y)) {
    if (x.length !== y.length) {
      return false;
    }

    for (let i = 0; i < x.length; i++) {
      if (!checkRunsEqual(x[i], y[i])) {
        return false;
      }
    }
    return true;
  } else if (
    typeof x === 'object' &&
    x != null &&
    typeof y === 'object' &&
    y != null
  ) {
    if (Object.keys(x).length != Object.keys(y).length) {
      return false;
    }
    for (const key in x) {
      if (key in y) {
        if (!checkRunsEqual(x[key], y[key])) {
          return false;
        }
      } else {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
}

export function getEditCellStyle(cell: NormalCellDescriptor) {
  const cellStyle: Partial<CellStyleDeclaration> = {};
  if (cell.fontWeight === 'bold') {
    cellStyle.isBold = true;
  }
  if (cell.fontStyle === 'italic') {
    cellStyle.isItalic = true;
  }
  if (cell.isStrikethrough) {
    cellStyle.isStrikethrough = true;
  }
  if (cell.isUnderline != null) {
    cellStyle.isUnderline = cell.isUnderline;
  }
  if (cell.fontSize) {
    cellStyle.fontSize = cell.fontSize;
  }
  if (cell.fontFamily) {
    cellStyle.fontFamily = cell.fontFamily;
  }
  if (cell.textColor) {
    cellStyle.textColor = cell.textColor;
  }

  return cellStyle;
}
