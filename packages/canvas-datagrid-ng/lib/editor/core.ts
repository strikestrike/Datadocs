import type { CellStyleDeclaration } from '../types';
import type { StyleRun, TextRange } from '../types/style';
import { copyMethods } from '../util';
import { DatadocEditorId, ZeroWidthBlank } from './constant';
import type { EditorCellData, EditorElement, EditorLinkRun } from './type';
import {
  getEditCellStyle,
  hasStrikeThrough,
  hasUnderlineStyle,
  parseFontSize,
} from './utils';
import { getTextRangeIntersection } from '../utils/style-runs';

export default function loadEditorCore(self: EditorElement) {
  copyMethods(new EditorCore(self), self);
}

export class EditorCore {
  static instanceCounter = 1;
  editorId: string;
  horizontalAlignment: string;
  /**
   * Indicate if content of editor has changed
   */
  isPolluted = false;
  /**
   * Whether a text inside of editor is for readonly or not. If true, we
   * cannot change the text content but adding link-runs is possible.
   */
  private _isReadonly = false;

  constructor(private readonly editor: EditorElement) {
    editor.editorId = 'datadocs_editor__' + EditorCore.instanceCounter;
    EditorCore.instanceCounter++;
  }

  execAction = (action: string, value: any) => {
    const self = this.editor;

    // Note: In readonly cells, display text and actual value are different
    // because of link-runs/hyperlink data-format applying to the cells. So
    // style-runs will not be showed properly on those cases.
    if (
      self.isReadonly() &&
      action !== 'undo' &&
      action !== 'redo' &&
      action !== 'selectAll'
    ) {
      return;
    }

    switch (action) {
      case 'undo': {
        self.undo();
        break;
      }
      case 'redo': {
        self.redo();
        break;
      }
      case 'selectAll': {
        const range = document.createRange();
        range.selectNodeContents(self);
        self.selectRange(document, range);
        break;
      }
      case 'fontSize': {
        self.focus();
        setTimeout(() => {
          self.buildHistoryState('OLD');
          self.reSelectOffset();
          self.currentSelectedFontSize = value;
          if (document.execCommand) {
            document.execCommand('styleWithCSS', false, 'true');
            document.execCommand(action, false, '3');
          } else {
            // Handle own execCommand
          }
        });
        break;
      }
      case 'foreColor': {
        self.buildHistoryState('OLD');
        self.focus();
        setTimeout(() => {
          self.reSelectOffset();
          self.currentSelectedTextColor = value;
          if (document.execCommand) {
            document.execCommand('styleWithCSS', false, 'true');
            const isSuccess = document.execCommand(action, false, value);
            if (!isSuccess) {
              const selection = window.getSelection();
              if (selection.rangeCount) {
                const range = selection.getRangeAt(0);
                const contents = range.extractContents();
                const sp = document.createElement('span');
                sp.appendChild(contents);
                sp.style.color = value;
                range.insertNode(sp);
              }
            }
          } else {
            // Handle own execCommand
          }
          self.currentSelectedTextColor = null;
        });
        break;
      }
      default: {
        self.buildHistoryState('OLD');
        self.focus();
        const isUnderlineAction = action === 'underline';
        if (isUnderlineAction) {
          self.isUpdatingUnderlineStyle = true;
        }
        setTimeout(() => {
          self.reSelectOffset();
          if (document.execCommand) {
            document.execCommand('styleWithCSS', false, 'true');
            document.execCommand(action, false, value);
          } else {
            // Handle own execCommand
          }
          if (isUnderlineAction) {
            self.isUpdatingUnderlineStyle = false;
          }
        });
        break;
      }
    }
  };

  getSelectionDataForClipboard = () => {
    const selection = window.getSelection();
    if (selection.rangeCount) {
      const plain: string[] = [];
      const html: string[] = [];
      const range = selection.getRangeAt(0);
      let contents = range.cloneContents();
      if (!contents.textContent || contents.textContent === '') {
        return undefined;
      }

      // Make sure to get parrent style in case we only have text node in
      // the range content.
      const { commonAncestorContainer } = range;
      if (
        commonAncestorContainer instanceof Text &&
        commonAncestorContainer.parentNode !== this.editor &&
        this.editor.contains(commonAncestorContainer)
      ) {
        const parrentNode =
          commonAncestorContainer.parentNode?.cloneNode() as HTMLElement;

        if (parrentNode instanceof HTMLElement) {
          parrentNode.innerHTML = '';
          parrentNode.appendChild(contents);
          contents = document.createDocumentFragment();
          contents.appendChild(parrentNode);
        }
      }

      const temp = document.createElement('div');
      temp.innerHTML = '';
      temp.appendChild(contents);
      plain.push(temp.innerText);
      html.push(
        `<meta name=${DatadocEditorId} content=${this.editor.editorId}>`,
      );
      html.push(temp.innerHTML);
      return { plain: plain.join(''), html: html.join('') };
    }
    return undefined;
  };

  setInputValue = (value: string) => {
    let selection = this.editor.currentSelection;
    if (value === this.editor.textContent) {
      return;
    }
    const data = this.editor.generateDataFromEditor();
    if (selection.startOffset != selection.endOffset) {
      data.text =
        data.text.substring(0, selection.startOffset) +
        data.text.substring(selection.endOffset, data.text.length);
      const styles: StyleRun[] = [];
      for (const style of data.styles) {
        if (style.endOffset <= selection.startOffset) {
          styles.push(style);
        } else if (style.startOffset >= selection.endOffset) {
          styles.push({
            startOffset:
              style.startOffset - (selection.endOffset - selection.startOffset),
            endOffset:
              style.endOffset - (selection.endOffset - selection.startOffset),
            style: style.style,
          });
        } else if (
          style.endOffset <= selection.endOffset &&
          style.startOffset >= selection.startOffset
        ) {
          continue;
        } else if (style.startOffset < selection.startOffset) {
          styles.push({
            startOffset: style.startOffset,
            endOffset: selection.startOffset,
            style: style.style,
          });
        } else if (style.endOffset > selection.endOffset) {
          styles.push({
            startOffset: selection.startOffset,
            endOffset:
              style.endOffset - (selection.endOffset - selection.startOffset),
            style: style.style,
          });
        }
      }
      data.styles = styles;
      selection = {
        startOffset: selection.startOffset,
        endOffset: selection.startOffset,
      };
    }
    const diff = value.length - data.text.length;
    if (data.styles.length > 0) {
      const newData: EditorCellData = {
        text: value,
        styles: [],
      };
      for (let i = 0; i < data.styles.length; i++) {
        const style = data.styles[i];
        if (selection.startOffset > style.endOffset) {
          newData.styles.push(style);
        } else if (selection.startOffset > style.startOffset) {
          newData.styles.push({
            startOffset: style.startOffset,
            endOffset: style.endOffset + diff,
            style: style.style,
          });
        } else {
          newData.styles.push({
            startOffset: style.startOffset + diff,
            endOffset: style.endOffset + diff,
            style: style.style,
          });
        }
      }
      const elements = this.generateElementsFromState(
        newData.text,
        newData.styles,
      );
      this.editor.innerHTML = '';
      const contentsFrag = document.createDocumentFragment();
      for (const ele of elements) {
        contentsFrag.appendChild(ele);
      }
      this.editor.append(contentsFrag);
      this.editor.grid.dispatchEvent('editorvaluechange', {});
    } else {
      const contentElement = document.createElement('span');
      contentElement.textContent = value;

      this.editor.innerHTML = '';
      this.editor.appendChild(contentElement);
    }
  };

  generateDataFromEditor = (): EditorCellData => {
    const self = this.editor;
    const data: EditorCellData = {
      text: self.textContent,
      styles: [],
    };

    let startOffset = 0;
    for (let i = 0; i < self.childNodes.length; i++) {
      const child = self.childNodes[i];
      const style: StyleRun = {
        startOffset: startOffset,
        endOffset: startOffset + child.textContent.length,
        style: {},
      };
      const {
        isBold,
        isItalic,
        isStrikethrough,
        fontFamily,
        textColor,
        fontSize,
        isUnderline,
      } = self.extractChildNodeStyle(child);

      if (isBold) style.style.isBold = true;
      if (isItalic) style.style.isItalic = true;
      if (isStrikethrough) style.style.isStrikethrough = true;
      if (fontFamily) style.style.fontFamily = fontFamily;
      if (textColor) style.style.textColor = textColor;
      if (fontSize != null) style.style.fontSize = fontSize;
      if (isUnderline != null) style.style.isUnderline = isUnderline;
      data.styles.push(style);
      startOffset += child.textContent.length;
    }

    data.linkRuns = self.linkRuns ? structuredClone(self.linkRuns) : null;
    return data;
  };

  /**
   * Get style-runs and links run from editor state
   */
  getEditorStyle = (): Partial<CellStyleDeclaration> => {
    const self = this.editor;
    if (self.grid.isInFormulaMode()) {
      return {};
    }
    const data: Partial<CellStyleDeclaration> = {};

    let startOffset = 0;
    let isFullBold = true;
    let isFullItalic = true;
    let isFullStrikeThrough = true;
    let isFullUnderline = true;
    let fontSizeDetail: { full: boolean; size?: number } = null;
    let fontFamilyDetail: { full: boolean; font?: string } = null;
    let fontColorDetail: { full: boolean; color?: string } = null;
    // These variables is used for storing the last style-run, checking
    // with the current style run to see if there is a chance of merging
    // them into one
    let lastNodeStyle: Partial<CellStyleDeclaration> = null;
    let lastStyleRun: StyleRun = null;

    for (let i = 0; i < self.childNodes.length; i++) {
      const child = self.childNodes[i];
      if (child.textContent.indexOf(ZeroWidthBlank) != -1) {
        child.textContent = child.textContent.replace(ZeroWidthBlank, '');
      }
      if (child.textContent.length === 0) {
        continue;
      }
      const style: StyleRun = {
        startOffset: startOffset,
        endOffset: startOffset + child.textContent.length,
        style: {},
      };
      const {
        isBold,
        isItalic,
        isStrikethrough,
        isUnderline,
        fontFamily,
        textColor,
        fontSize,
      } = self.extractChildNodeStyle(child);

      if (isBold) {
        style.style.isBold = true;
      } else if (isFullBold) {
        isFullBold = false;
      }
      if (isItalic) {
        style.style.isItalic = true;
      } else if (isFullItalic) {
        isFullItalic = false;
      }
      if (isStrikethrough) {
        style.style.isStrikethrough = true;
      } else if (isFullStrikeThrough) {
        isFullStrikeThrough = false;
      }

      if (isUnderline != null) {
        style.style.isUnderline = isUnderline;
      }
      if (!isUnderline && isFullUnderline) {
        isFullUnderline = false;
      }

      if (fontFamily) {
        let updatedFontFamily = fontFamily;
        try {
          updatedFontFamily = JSON.parse(fontFamily);
        } catch (error) {
          // Do nothing
        }
        style.style.fontFamily = updatedFontFamily;
        if (!fontFamilyDetail) {
          fontFamilyDetail = { full: true, font: updatedFontFamily };
        } else if (
          fontFamilyDetail.full &&
          updatedFontFamily !== fontFamilyDetail.font
        ) {
          fontFamilyDetail.full = false;
        }
      } else {
        fontFamilyDetail = { full: false };
      }
      if (textColor) {
        style.style.textColor = textColor;
        if (!fontColorDetail) {
          fontColorDetail = { full: true, color: style.style.textColor };
        } else if (
          fontColorDetail.full &&
          style.style.textColor !== fontColorDetail.color
        ) {
          fontColorDetail.full = false;
        }
      } else {
        fontColorDetail = { full: false };
      }
      if (fontSize != null) {
        style.style.fontSize = fontSize;
        if (!fontSizeDetail) {
          fontSizeDetail = { full: true, size: style.style.fontSize };
        } else if (
          fontSizeDetail.full &&
          style.style.fontSize !== fontSizeDetail.size
        ) {
          fontSizeDetail.full = false;
        }
      } else {
        fontSizeDetail = { full: false };
      }
      if (
        Object.keys(style.style).length !== 0 &&
        style.startOffset != style.endOffset
      ) {
        if (!data.styleRuns) {
          data.styleRuns = [];
        }

        if (
          lastNodeStyle &&
          lastStyleRun &&
          isBold == lastNodeStyle.isBold &&
          isItalic == lastNodeStyle.isItalic &&
          isStrikethrough == lastNodeStyle.isStrikethrough &&
          isUnderline == lastNodeStyle.isUnderline &&
          fontFamily == lastNodeStyle.fontFamily &&
          textColor == lastNodeStyle.textColor &&
          fontSize == lastNodeStyle.fontSize
        ) {
          lastStyleRun.endOffset += child.textContent.length;
        } else {
          data.styleRuns.push(style);
          lastStyleRun = style;
          lastNodeStyle = {
            isBold,
            isItalic,
            isStrikethrough,
            fontFamily,
            textColor,
            fontSize,
            isUnderline,
          };
        }
      } else {
        lastNodeStyle = null;
        lastStyleRun = null;
      }
      startOffset += child.textContent.length;
    }
    if (isFullBold && data.styleRuns) {
      data.isBold = true;
      for (let i = 0; i < data.styleRuns.length; i++) {
        if (data.styleRuns[i].style.isBold) {
          delete data.styleRuns[i].style.isBold;
        }
      }
    }
    if (isFullItalic && data.styleRuns) {
      data.isItalic = true;
      for (let i = 0; i < data.styleRuns.length; i++) {
        if (data.styleRuns[i].style.isItalic) {
          delete data.styleRuns[i].style.isItalic;
        }
      }
    }
    if (isFullStrikeThrough && data.styleRuns) {
      data.isStrikethrough = true;
      for (let i = 0; i < data.styleRuns.length; i++) {
        if (data.styleRuns[i].style.isStrikethrough) {
          delete data.styleRuns[i].style.isStrikethrough;
        }
      }
    }
    if (isFullUnderline && data.styleRuns) {
      data.isUnderline = true;
      for (let i = 0; i < data.styleRuns.length; i++) {
        if (data.styleRuns[i].style.isUnderline != null) {
          delete data.styleRuns[i].style.isUnderline;
        }
      }
    }
    if (data.styleRuns && (!fontSizeDetail || fontSizeDetail.full)) {
      data.fontSize = fontSizeDetail ? fontSizeDetail.size : 13;
      for (let i = 0; i < data.styleRuns.length; i++) {
        if (data.styleRuns[i].style.fontSize) {
          delete data.styleRuns[i].style.fontSize;
        }
      }
    }
    if (data.styleRuns && (!fontFamilyDetail || fontFamilyDetail.full)) {
      data.fontFamily = fontFamilyDetail ? fontFamilyDetail.font : null;
      for (let i = 0; i < data.styleRuns.length; i++) {
        if (data.styleRuns[i].style.fontFamily) {
          delete data.styleRuns[i].style.fontFamily;
        }
      }
    }

    if (data.styleRuns && (!fontColorDetail || fontColorDetail.full)) {
      data.textColor = fontColorDetail ? fontColorDetail.color : null;
      for (let i = 0; i < data.styleRuns.length; i++) {
        if (data.styleRuns[i].style.textColor) {
          delete data.styleRuns[i].style.textColor;
        }
      }
    }
    if (data.styleRuns) {
      const newStyleRuns: StyleRun[] = [];
      for (let i = 0; i < data.styleRuns.length; i++) {
        if (Object.keys(data.styleRuns[i].style).length > 0) {
          newStyleRuns.push(data.styleRuns[i]);
        }
      }
      if (newStyleRuns.length === 0) {
        data.styleRuns = [];
      } else {
        data.styleRuns = newStyleRuns;
      }
    }
    if (!data.styleRuns) {
      data.styleRuns = [];
    }
    return data;
  };

  /**
   * Combine style-runs and link-runs to generate list of child elements for
   * grid editor. Normal text parts should be inside `<span>` and hyperlinks
   * are in `<a>` tags.
   * @param text
   * @param styleRuns
   * @param linkRuns
   * @returns
   */
  generateElementsFromState = (
    text: string,
    styleRuns: StyleRun[],
    linkRuns?: EditorLinkRun[],
  ): HTMLElement[] => {
    const elements: HTMLElement[] = [];

    if (!linkRuns || linkRuns.length === 0) {
      for (const style of styleRuns) {
        const textContent = text.substring(style.startOffset, style.endOffset);
        elements.push(
          this.editor.createGridEditorChildElement(
            textContent,
            'span',
            style.style,
          ),
        );
      }
    } else {
      let currentTextOffset = 0;
      let currentLinkIndex = 0;

      for (const styleRun of styleRuns) {
        for (let i = currentLinkIndex; i < linkRuns.length; i++) {
          currentLinkIndex = i;

          const linkRun = linkRuns[i];
          const linkRange: TextRange = {
            startOffset: linkRun.startOffset ?? 0,
            endOffset: linkRun.endOffset ?? text.length,
          };
          const intersection = getTextRangeIntersection(styleRun, linkRange);

          if (intersection) {
            if (currentTextOffset < intersection.startOffset) {
              // Add the text part before intersection into `<span>` element
              const textContent = text.substring(
                currentTextOffset,
                intersection.startOffset,
              );
              elements.push(
                this.editor.createGridEditorChildElement(
                  textContent,
                  'span',
                  styleRun.style,
                ),
              );
            }

            // Add intersection part in to `<a>` element
            const textContent = text.substring(
              intersection.startOffset,
              intersection.endOffset,
            );
            elements.push(
              this.editor.createGridEditorChildElement(
                textContent,
                'a',
                styleRun.style,
                linkRun.ref,
                linkRun.id,
              ),
            );
            currentTextOffset = intersection.endOffset;

            if (styleRun.endOffset > intersection.endOffset) {
              // style run contain intersection, move to next link run to see if
              // the remaining part of the style run is in other link run
              continue;
            } else {
              // move to the next style run
              break;
            }
          } else {
            if (linkRun.endOffset <= styleRun.startOffset) {
              // link run is on the left of style run without intersection, move to
              // the next link run
              continue;
            } else {
              break;
            }
          }
        }

        if (currentTextOffset < styleRun.endOffset) {
          // after merging all possible link-run, the remaining part of style run should
          // be considered as normal span element
          const textContent = text.substring(
            currentTextOffset,
            styleRun.endOffset,
          );
          elements.push(
            this.editor.createGridEditorChildElement(
              textContent,
              'span',
              styleRun.style,
            ),
          );
          currentTextOffset = styleRun.endOffset;
        }
      }
    }

    return elements;
  };

  /**
   * Get styles of current selection in the editor. The styles contain raw style
   * of HTMLElement and will mainly be used in showing state of toolbar buttons.
   * @returns
   */
  getSelectionStyle = (): Partial<CellStyleDeclaration> => {
    const res: Partial<CellStyleDeclaration> = {};
    const currSelection = this.editor.currentSelection;
    let startOffset = 0;
    for (let i = 0; i < this.editor.childNodes.length; i++) {
      const child = this.editor.childNodes[i];
      const endOffset = startOffset + child.textContent.length;
      if (
        currSelection.startOffset >= startOffset &&
        ((currSelection.startOffset === currSelection.endOffset &&
          currSelection.startOffset <= endOffset) ||
          (currSelection.startOffset <= currSelection.endOffset &&
            currSelection.startOffset < endOffset))
      ) {
        const isBold =
          child instanceof HTMLElement
            ? child.style.fontWeight === 'bold'
            : false;
        const isItalic =
          child instanceof HTMLElement
            ? child.style.fontStyle === 'italic'
            : false;
        const isStrikethrough =
          child instanceof HTMLElement ? hasStrikeThrough(child) : false;
        // Get underline style directly from the HTMLElement.
        const isUnderline =
          child instanceof HTMLElement ? hasUnderlineStyle(child) : false;
        const fontFamily =
          child instanceof HTMLElement ? child.style.fontFamily : null;
        const textColor =
          child instanceof HTMLElement ? child.style.color : null;
        const fontSize =
          child instanceof HTMLElement
            ? parseFontSize(child.style.fontSize)
            : null;

        res.isBold = isBold;
        res.isItalic = isItalic;
        res.isStrikethrough = isStrikethrough;
        res.isUnderline = isUnderline;

        if (fontFamily) {
          res.fontFamily = fontFamily;
          try {
            res.fontFamily = JSON.parse(fontFamily);
          } catch (error) {
            // Do nothing
          }
        }
        if (textColor) {
          res.textColor = textColor;
        }
        if (fontSize != null) {
          res.fontSize = fontSize;
        }
        break;
      }
      startOffset = endOffset;
    }

    return res;
  };

  /**
   * Remove all style-runs and link-runs inside the editor.
   */
  resetEditorContent = () => {
    const self = this.editor;
    self.updateSelection();
    const selection = { ...self.currentSelection };

    const textContent = self.textContent;
    const element = self.createGridEditorChildElement(
      textContent,
      'span',
      getEditCellStyle(self.editCell),
    );
    self.innerHTML = '';
    self.appendChild(element);
    self.cleanEmptyChildren();

    self.updateSelectionWithOffset(selection, true);
    if (document.body.contains(self)) {
      self.reSelectOffset();
    }
    self.updateEditorLinkRun();
  };

  onCaretPositionChanged = () => {
    this.editor.updateLinkOnCaretPositionChanged();
  };

  /**
   * It will be called to do some stuff before end editing
   */
  beforeEndEdit = () => {
    this.editor.updateHyperlinkOnEndEdit();
  };

  markEditorAsChanged = () => {
    this.isPolluted = true;
  };

  /**
   * Check if the editor has changed from its initial state
   * @returns
   */
  hasChanged = () => {
    return this.isPolluted;
  };

  /**
   * Mark the grid editor is for readonly cell value.
   */
  markEditorAsReadonly = () => {
    this._isReadonly = true;
  };

  isReadonly = () => {
    return this._isReadonly;
  };
}
