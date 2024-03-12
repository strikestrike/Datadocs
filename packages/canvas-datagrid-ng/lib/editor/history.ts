import { copyMethods } from '../util';
import { ZeroWidthBlank } from './constant';
import type { EditorSelectionDescriptor } from './selection';
import type { EditorCellData, EditorElement } from './type';

export default function loadEditorElementFunctions(self: EditorElement) {
  copyMethods(new EditorHistory(self), self);
}

export type STATETYPE = 'OLD' | 'NEW';

interface HistoryState {
  selection: EditorSelectionDescriptor;
  data: EditorCellData;
}

interface HistoryItem {
  oldState: HistoryState;
  newState: HistoryState;
}

export class EditorHistory {
  oldState: HistoryState;
  newState: HistoryState;
  undoStack: HistoryItem[];
  redoStack: HistoryItem[];
  constructor(private readonly editor: EditorElement) {
    this.undoStack = [];
    this.redoStack = [];
    this.oldState = null;
    this.newState = null;
  }

  setState = (type: STATETYPE, state: HistoryState) => {
    if (type === 'NEW') {
      this.newState = state;
    } else {
      this.oldState = state;
    }
  };

  getState = (type: STATETYPE): HistoryState => {
    if (type === 'NEW') {
      return this.newState;
    } else {
      return this.oldState;
    }
  };

  isStateInFormulaMode = (state: HistoryState): boolean => {
    const inputValue = state.data.text;
    return inputValue
      ? inputValue.startsWith('=') ||
          inputValue.startsWith(ZeroWidthBlank + '=')
      : false;
  };

  buildHistoryState = (type: STATETYPE) => {
    const selOffset = this.editor.getSelectionOffsets(this.editor);
    if (selOffset.startOffset === -1 || selOffset.endOffset === -1) {
      selOffset.startOffset = this.editor.currentSelection.startOffset;
      selOffset.endOffset = this.editor.currentSelection.endOffset;
    }
    const cellData = this.editor.generateDataFromEditor();
    cellData.actualLinksLength = new Map(this.editor.actualLinksLength);
    this.setState(type, { selection: selOffset, data: cellData });
  };

  addHistoryItem = () => {
    if (this.oldState && this.newState) {
      this.undoStack.push({
        oldState: this.oldState,
        newState: this.newState,
      });
      this.redoStack = [];
      this.oldState = null;
      this.newState = null;
    }
  };

  handleUndoRedoState = (state: HistoryState) => {
    const elements = this.editor.generateElementsFromState(
      state.data.text,
      state.data.styles,
      state.data.linkRuns,
    );
    this.editor.linkRuns = state.data.linkRuns;
    if (state.data.actualLinksLength) {
      this.editor.actualLinksLength = new Map(state.data.actualLinksLength);
    }
    this.editor.innerHTML = '';
    let lastNode: HTMLElement;
    let selectedStartNode: HTMLElement = null;
    let selectedEndNode: HTMLElement = null;
    const selOffset: EditorSelectionDescriptor = {
      startOffset: state.selection.startOffset,
      endOffset: state.selection.endOffset,
    };
    for (const ele of elements) {
      lastNode = this.editor.appendChild(ele);
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
    const selection = window.getSelection();
    if (selection.rangeCount) {
      let range = selection.getRangeAt(0);
      // Preserve the selection:
      if (
        lastNode &&
        selectedStartNode &&
        selectedEndNode &&
        document.activeElement === this.editor
      ) {
        range = range.cloneRange();
        range.setStart(selectedStartNode.childNodes[0], selOffset.startOffset);
        range.setEnd(selectedEndNode.childNodes[0], selOffset.endOffset);
        // range.collapse(true);
        this.editor.selectRange(document, range);
      }
    }
    this.editor.grid.dispatchEvent('editorvaluechange', {});
  };

  undo = () => {
    const item = this.undoStack.pop();
    if (item) {
      this.handleUndoRedoState(item.oldState);
      this.redoStack.push(item);
    }
  };

  redo = () => {
    const item = this.redoStack.pop();
    if (item) {
      this.handleUndoRedoState(item.newState);
      this.undoStack.push(item);
    }
  };
}
