import { copyMethods } from '../util';
import type { EditorElement } from './type';

export default function loadEditorKeyboardCommand(self: EditorElement) {
  copyMethods(new EditorSelection(self), self);
}

export interface EditorSelectionDescriptor {
  startOffset: number;
  endOffset: number;
}

export class EditorSelection {
  currentSelection: EditorSelectionDescriptor;
  oldSelection: EditorSelectionDescriptor;
  currentSelectedFontSize: string;
  currentSelectedTextColor: string;
  isUpdatingUnderlineStyle: boolean;

  constructor(private readonly editor: EditorElement) {
    this.updateSelection();
  }

  isActiveEditor = (): boolean => {
    if (document.activeElement === this.editor) {
      return true;
    }
    const selection = window.getSelection();
    if (selection.rangeCount) {
      const range = selection.getRangeAt(0);
      let node = range.commonAncestorContainer;
      while (node && node !== document.body) {
        if (node === this.editor) {
          return true;
        }
        node = node.parentElement;
      }
    }
    return false;
  };

  updateSelection = (dispatch = true) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (!range) {
        // this.editor.currentSelection = null;
        // return;
        return this.setSelection(null);
      }
      if (this.isActiveEditor()) {
        const newSelection: EditorSelectionDescriptor =
          this.getSelectionOffsets(this.editor);
        this.updateSelectionWithOffset(newSelection, dispatch);
      }
    }
  };

  updateSelectionWithOffset = (
    newSelection: EditorSelectionDescriptor,
    dispatch = true,
  ) => {
    if (this.editor.currentSelection !== newSelection) {
      // this.editor.currentSelection = newSelection;
      this.setSelection(newSelection);
    }
    if (dispatch) {
      this.editor.grid.dispatchEvent(
        'editorselectionchange',
        this.editor.currentSelection,
      );
    }
  };

  /**
   * Set new selection and possibly notify if the position of selection has been
   * changed from the last state.
   * @param selection
   */
  setSelection = (selection: EditorSelectionDescriptor) => {
    const self = this.editor;
    self.currentSelection = selection;

    const isCaretUnchanged =
      self.currentSelection === self.oldSelection ||
      (self.currentSelection?.startOffset === self.oldSelection?.startOffset &&
        self.currentSelection?.endOffset === self.oldSelection?.endOffset);
    if (!isCaretUnchanged) {
      self.onCaretPositionChanged();
    }

    self.oldSelection = selection;
  };

  handleMouseUp = (event: MouseEvent) => {
    // On mouse up, using timeout to make sure that the editor selection is updated
    // before updating its offset
    setTimeout(() => {
      this.updateSelection();
    });
  };

  selectRange = (ownerDocument: Document, range: Range) => {
    const selection = ownerDocument.getSelection();

    selection.removeAllRanges();
    selection.addRange(range);
    this.updateSelection();
  };

  reSelectOffset = () => {
    if (!this.editor.currentSelection) return;
    let lastNode: Node = null;
    let selectedStartNode: Node = null;
    let selectedEndNode: Node = null;
    const selOffset: EditorSelectionDescriptor = {
      startOffset: this.editor.currentSelection.startOffset,
      endOffset: this.editor.currentSelection.endOffset,
    };
    for (let i = 0; i < this.editor.childNodes.length; i++) {
      lastNode = this.editor.childNodes[i];
      if (selectedStartNode === null) {
        if (selOffset.startOffset > lastNode.textContent.length) {
          selOffset.startOffset -= lastNode.textContent.length;
        } else {
          selectedStartNode = lastNode;
        }
      }
      if (selectedEndNode === null) {
        if (selOffset.endOffset > lastNode.textContent.length) {
          selOffset.endOffset -= lastNode.textContent.length;
        } else {
          selectedEndNode = lastNode;
        }
      }
    }
    const selection = window.getSelection();
    if (selection.rangeCount) {
      let range = selection.getRangeAt(0);
      // Preserve the selection:
      if (lastNode && selectedStartNode && selectedEndNode) {
        range = range.cloneRange();
        range.setStart(selectedStartNode.childNodes[0], selOffset.startOffset);
        range.setEnd(selectedEndNode.childNodes[0], selOffset.endOffset);
        // range.collapse(true);
        this.editor.selectRange(document, range);
      }
    }
  };

  getSelectionItemRecurrency = (
    currNode: Node,
    compareNode: Node,
    rangeOffset: number,
  ): number => {
    if (currNode === compareNode) {
      if (compareNode instanceof Text) {
        return rangeOffset;
      } else {
        if (currNode.childNodes.length > 0) {
          let res = 0;
          for (let i = 0; i < currNode.childNodes.length; i++) {
            if (i === rangeOffset) {
              break;
            }
            res += currNode.childNodes[i].textContent.length;
          }
          return res;
        } else {
          return currNode.textContent.length;
        }
      }
    }
    if (currNode.childNodes.length) {
      let res = 0;
      for (let i = 0; i < currNode.childNodes.length; i++) {
        const offset = this.getSelectionItemRecurrency(
          currNode.childNodes[i],
          compareNode,
          rangeOffset,
        );
        if (offset === -1) {
          res += currNode.childNodes[i].textContent.length;
        } else {
          res += offset;
          return res;
        }
      }
    }
    return -1;
  };

  getSelectionOffsets = (container: Node): EditorSelectionDescriptor => {
    const selOffset: EditorSelectionDescriptor = {
      startOffset: 0,
      endOffset: 0,
    };

    const selection = window.getSelection();
    if (selection.rangeCount) {
      const range = selection.getRangeAt(0);
      selOffset.startOffset = this.getSelectionItemRecurrency(
        container,
        range.startContainer,
        range.startOffset,
      );
      selOffset.endOffset = this.getSelectionItemRecurrency(
        container,
        range.endContainer,
        range.endOffset,
      );
    }

    return selOffset;
  };
}
