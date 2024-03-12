import { copyMethods } from '../util';
import { getImplicitHyperlinkRuns } from '../utils/hyperlink';
import { ZeroWidthBlank } from './constant';
import type { EditorElement, EditorLinkRun } from './type';
import type { MetaRun } from '../types';
import type { EditorSelectionDescriptor } from './selection';
import { getChildRect } from './utils';
import { getFormulaCellLinkRuns } from '../utils/hyperlink';
import { isFormulaCell } from '../utils/hyperlink';

export default function loadEditorHyperlink(self: EditorElement) {
  copyMethods(new EditorHyperlink(self), self);
}

const HYPERLINK_BUTTON_WIDTH = 20;
const HYPERLINK_BUTTON_HEIGHT = 16;
const SPACE = /\s/;

export class EditorHyperlink {
  /**
   * Each link-run should have their own Id so we can keep track of its
   * position to update/build new link-runs when needed.
   */
  private currentLinkRunId = 0;

  /**
   * Keep track of the current added link. It can be used in `Backspace`
   * key press to remove the link.
   */
  private latestAddedLinkId: string;

  /**
   * Indicate if it allows to remove current added link when the user press
   * `Backspace` key. Sometimes there is @latestAddedLinkId but if the caret
   * position has been changed, we shouldn't remove the link.
   */
  private removeLinkOnBackspace = false;

  /**
   * Keep track of list of hyperlink handlers that need execute on editor
   * input event
   */
  private hyperlinkHandlers: Array<() => void> = [];

  /**
   * Hyperlink button inside grid editor for adding new link inside large text
   */
  private hyperlinkButton: HTMLDivElement;

  /**
   * The current display value after combining with link runs.
   */
  displayText: string;

  /**
   * Link runs within display text, use in the editor only. It will be transform
   * into actual value link runs at the end of editing process.
   */
  displayLinkRuns: EditorLinkRun[] = [];

  /**
   * The actual length of a link run within the original value, NOT inside
   * display text
   */
  actualLinksLength: Map<string, number> = new Map();

  constructor(private readonly editor: EditorElement) {
    // There are cases that we end editing on special keys such as `Enter`,
    // so we need to add link on keydown event capturing phase to make sure
    // the links' handlers are called.
    editor.addEventListener(
      'keydown',
      (event: KeyboardEvent) => {
        if (!editor.grid.isInFormulaMode() && !editor.isReadonly()) {
          // Try to add a link when the user types in the text
          editor.addLinkOnTyping(event);
          // Try to remove link when the user presses `Backspace` key
          editor.removeLinkOnTyping(event);
        }
      },
      true,
    );

    // After the editor is init successfully, update selection again to make
    // sure it up-to-date and layover menu depend on it is showed properly.
    setTimeout(() => {
      editor.updateSelection(true);
    });
  }

  getNextLinkRunId = () => {
    return `__link_run__${++this.currentLinkRunId}`;
  };

  resetLinkRunId = () => {
    this.currentLinkRunId = 0;
  };

  enableRemoveLinkOnBackspace = () => {
    this.removeLinkOnBackspace = true;
  };

  disableRemoveLinkOnBackspace = () => {
    this.removeLinkOnBackspace = false;
  };

  shouldRemoveLinkOnBackspace = () => {
    return this.removeLinkOnBackspace;
  };

  setLatestAddedLink = (id: string) => {
    this.latestAddedLinkId = id;
  };

  resetLatestAddedLink = () => {
    this.latestAddedLinkId = null;
  };

  /**
   * Get actual length of a link, it can be smaller or bigger if editor is for
   * readonly cell value.
   * @param linkRun
   * @returns
   */
  getActualLinkLength = (linkRun: EditorLinkRun) => {
    const actualLength = this.actualLinksLength.get(linkRun.id);
    const displayLength = linkRun.endOffset - linkRun.startOffset;
    return actualLength ?? displayLength;
  };

  /**
   * Remove link when the user presses Backspace key
   * @param event
   */
  removeLinkOnTyping = (event: KeyboardEvent) => {
    const isBackspaceKey = event.code === 'Backspace';

    if (
      !this.editor.isReadonly() &&
      isBackspaceKey &&
      this.shouldRemoveLinkOnBackspace()
    ) {
      const removeLink = () => {
        this.unLinkById(this.latestAddedLinkId, true);
        event.preventDefault();
      };

      this.editor.executeActionWithHistory(removeLink);
      this.editor.updateEditorStyle();
      this.editor.updateSelection(true);
    }
  };

  /**
   * Init starting state for editor linkRuns, return default styleRuns for
   * those links (use to merge with cell text styleRuns)
   */
  initLinkRuns = () => {
    const self = this.editor;
    const runs = structuredClone(
      self.editCell.explicitLink ? self.editCell.linkRuns : [],
    );

    self.linkRuns = runs.map((run) => {
      return { ...run, id: self.getNextLinkRunId() };
    });

    // Update actual length of a link run for use in readonly mode
    if (self.isReadonly()) {
      const lengthMap = this.actualLinksLength;

      self.linkRuns.forEach((run) => {
        lengthMap.set(run.id, run.endOffset - run.startOffset);
      });
    }
  };

  /**
   * Try to add link in grid editor while typing
   * @param event
   * @returns
   */
  addLinkOnTyping = (event: KeyboardEvent) => {
    const self = this.editor;
    const validKeys = ['Space', 'Enter', 'Tab'];
    const shouldAddLink = validKeys.includes(event.code);
    const { isCollapsed } = window.getSelection();
    if (self.isReadonly() || !shouldAddLink || !isCollapsed) {
      return;
    }

    const { value: possibleLinkText, endOffset: linkEndPosition } =
      this.getBeforeCaretText(event.code !== 'Space');
    if (!possibleLinkText || linkEndPosition == null) {
      return;
    }

    const addLink = () => {
      self.updateSelection();
      const currentSelection = self.currentSelection;
      const previousSelection: EditorSelectionDescriptor = {
        startOffset: currentSelection.startOffset,
        endOffset: currentSelection.endOffset,
      };

      // try to predict and add new link
      let linkText: string;
      let linkStartOffset: number;
      const links = getImplicitHyperlinkRuns(possibleLinkText);
      if (links?.length > 0) {
        const link = links[0];
        linkStartOffset = link.startOffset;
        linkText = possibleLinkText.substring(linkStartOffset, link.endOffset);
      }

      if (linkText) {
        self.updateSelectionWithOffset(
          {
            startOffset:
              linkEndPosition - possibleLinkText.length + linkStartOffset,
            endOffset:
              linkEndPosition -
              possibleLinkText.length +
              linkStartOffset +
              linkText.length,
          },
          false,
        );
        self.reSelectOffset();

        const range = window.getSelection().getRangeAt(0);
        const linkContents = range.extractContents();
        const linkId = this.getNextLinkRunId();
        const linkElement = self.createGridEditorChildElement(
          '',
          'a',
          {},
          linkText,
          linkId,
        ) as HTMLAnchorElement;
        linkElement.appendChild(linkContents);

        self.updateSelectionWithOffset(
          {
            startOffset: linkEndPosition - linkText.length,
            endOffset: linkEndPosition - linkText.length,
          },
          false,
        );

        const currentRange = window.getSelection().getRangeAt(0);
        currentRange.insertNode(linkElement);
        currentRange.collapse(false);
        self.updateSelection(false);

        // flatten child elements inside editor
        const elements = self.flattenElement(self);
        const fragment = document.createDocumentFragment();
        fragment.append(...elements);
        self.innerHTML = '';
        self.appendChild(fragment);
        this.updateEditorLinkRun();
        setTimeout(() => {
          this.setLatestAddedLink(linkId);
          this.enableRemoveLinkOnBackspace();
        });

        self.updateSelectionWithOffset(previousSelection, false);
        self.reSelectOffset();
        self.markEditorAsChanged();
      }
    };

    // We will want to handle add link on grid editor input event to not
    // acidentally changing breaking the default behavior. Also, we can
    // reduce undo/redo complexity by letting the existing history stuff
    // on input event take care of the new link-runs.
    self.addHyperlinkHandler(addLink);
  };

  /**
   * Update editor link-runs with data from editor
   * @param ignoreZeroWidthBlank
   */
  updateEditorLinkRun = () => {
    this.editor.linkRuns = this.extractLinkRunsFromEditor();
  };

  /**
   * Generate link-runs from grid editor content. Try to merge consecutive
   * `<a>` (link) into one link-run if they point to the same ref.
   *
   * @param ignoreZeroWidthBlank Should ignore ZerowidthBlank or not
   */
  extractLinkRunsFromEditor = (ignoreZeroWidthBlank = false) => {
    const self = this.editor;
    const linkRuns: EditorLinkRun[] = [];
    let startOffset = 0;
    let currentLinkRun: EditorLinkRun = null;

    // get the link-runs
    for (let i = 0; i < self.childNodes.length; i++) {
      const child = self.childNodes[i];
      let textContent =
        child instanceof HTMLElement || child instanceof Text
          ? child.textContent
          : '';
      if (ignoreZeroWidthBlank) {
        textContent = textContent.replace(ZeroWidthBlank, '');
      }
      const endOffset =
        startOffset +
        (child instanceof HTMLElement || child instanceof Text
          ? child.textContent.length
          : 0);

      if (child instanceof HTMLAnchorElement) {
        const linkData = self.extractLinkNodeData(child);
        const canMerge =
          currentLinkRun &&
          currentLinkRun.id === linkData.id &&
          currentLinkRun.ref === linkData.ref &&
          currentLinkRun.endOffset === startOffset;

        if (canMerge) {
          currentLinkRun.endOffset = endOffset;
        } else {
          currentLinkRun = {
            id: linkData.id,
            startOffset,
            endOffset,
            ref: linkData.ref,
          };
          linkRuns.push(currentLinkRun);
        }
      } else if (child instanceof HTMLElement) {
        currentLinkRun = null;
      }

      startOffset = endOffset;
    }

    const textContent = self.textContent;
    for (const linkRun of linkRuns) {
      const label = textContent.substring(
        linkRun.startOffset,
        linkRun.endOffset,
      );
      const run = self.linkRuns?.find((run) => {
        return run.id === linkRun.id;
      });

      if (run?.label || linkRun.ref !== label) {
        linkRun.label = label;
      }
    }

    return linkRuns;
  };

  /**
   * Add selection for the link run at text offset
   * @param offset Display value offset
   */
  selectLinkAt = (offset: number) => {
    const linkRun = this.getLinkAt(offset);
    if (!linkRun) {
      return;
    }

    this.editor.updateSelectionWithOffset(
      {
        startOffset: linkRun.startOffset,
        endOffset: linkRun.endOffset,
      },
      true,
    );
    this.editor.reSelectOffset();
  };

  /**
   * Remove the link run at text offset
   * @param offset
   */
  removeLinkAt = (offset: number) => {
    const linkRun = this.getLinkAt(offset);
    if (!linkRun) {
      return;
    }

    const removeLink = () => {
      this.unLinkById(linkRun.id);
    };
    this.editor.executeActionWithHistory(removeLink);
    this.editor.updateEditorStyle();
  };

  /**
   * Convert actual value offset to editor display value offset
   * @param offset
   * @returns
   */
  getDisplayOffset = (offset: number) => {
    const linkRuns = this.editor.linkRuns ?? [];
    let offsetDelta = 0;

    for (const run of linkRuns) {
      const originLength = this.getActualLinkLength(run);
      const displayLength = run.endOffset - run.startOffset;
      const runDelta = displayLength - originLength;

      if (offset + offsetDelta < run.endOffset - runDelta) {
        break;
      }

      offsetDelta += runDelta;
    }

    return offset + offsetDelta;
  };

  /**
   * Get the actual text of a link run by using its id. We will need to set the
   * actual content back when the hyperlink is removed.
   * @param linkId
   * @returns
   */
  getLinkRunActualText = (linkId: string) => {
    const self = this.editor;
    const linkRuns = self.linkRuns ?? [];
    let offsetDelta = 0;

    for (const run of linkRuns) {
      const originLength = this.getActualLinkLength(run);
      const displayLength = run.endOffset - run.startOffset;

      if (run.id === linkId) {
        const actualValue = self.isReadonly()
          ? (self.editCell.value as string)
          : self.textContent;

        return actualValue.slice(
          run.startOffset - offsetDelta,
          run.startOffset - offsetDelta + originLength,
        );
      }

      offsetDelta += displayLength - originLength;
    }

    return null;
  };

  /**
   * Get the link run at text offset
   * @param offset Display value offset
   * @returns
   */
  getLinkAt = (offset: number) => {
    const linkRuns = this.editor.linkRuns;
    let linkRun: EditorLinkRun = null;

    for (const run of linkRuns) {
      if (run.startOffset <= offset && run.endOffset > offset) {
        linkRun = run;
        break;
      }
    }

    return linkRun;
  };

  /**
   * Apply new link label and ref to the grid editor
   * @param run
   * @param label
   * @param ref
   * @returns
   */
  applyLinkRunChange = (run: MetaRun, label: string, ref: string) => {
    if (!ref) return;

    const self = this.editor;
    self.reSelectOffset();

    const updateLinkRun = () => {
      const linkRuns = self.linkRuns;
      const runIndex = linkRuns.findIndex((linkRun) => {
        return linkRun.startOffset === run.startOffset;
      });

      if (runIndex === -1 || (!label && !ref)) {
        // Not found the run in run list
        return;
      }
      // Update editted link run
      const linkLabel = label || ref;
      const oldRun = linkRuns[runIndex];
      const newRun: EditorLinkRun = {
        id: oldRun.id,
        startOffset: oldRun.startOffset,
        endOffset: oldRun.startOffset + linkLabel.length,
        label,
        ref,
      };
      linkRuns[runIndex] = newRun;

      // Update offset of other link runs
      const delta = newRun.endOffset - oldRun.endOffset;
      for (let i = runIndex + 1; i < linkRuns.length; i++) {
        const run = { ...linkRuns[i] };
        run.startOffset += delta;
        run.endOffset += delta;
        linkRuns[i] = run;
      }

      // Update grid editor with new data
      const range = window.getSelection().getRangeAt(0);
      range.deleteContents();
      self.cleanEmptyChildren();
      const linkElement = self.createGridEditorChildElement(
        linkLabel,
        'a',
        self.getEditCellDefaultLinkStyle(),
        ref,
        oldRun.id,
      );
      range.insertNode(linkElement);
    };

    self.executeActionWithHistory(updateLinkRun);
    self.updateEditorStyle();
    self.updateSelection(true);
  };

  /**
   * When users try to edit a auto-generated link which com from a formula, the
   * formula text should be removed and replace with a normal link-run.
   * @param label
   * @param ref
   */
  changeFormulaLinkRun = (label: string, ref: string) => {
    if (!ref) return;

    const self = this.editor;
    const replaceLink = () => {
      const linkLabel = label || ref;
      const linkId = this.getNextLinkRunId();
      const linkElement = self.createGridEditorChildElement(
        linkLabel,
        'a',
        self.getEditCellDefaultLinkStyle(),
        ref,
        linkId,
      ) as HTMLAnchorElement;

      // Replace editor content with new link
      self.innerHTML = '';
      self.appendChild(linkElement);
      self.cleanEmptyChildren();

      // Update selection and link-runs
      self.updateSelectionWithOffset(
        {
          startOffset: 0,
          endOffset: linkLabel.length,
        },
        false,
      );
      self.reSelectOffset();
      this.updateEditorLinkRun();
    };

    self.executeActionWithHistory(replaceLink);
    self.updateEditorStyle();
    self.updateSelection(true);
  };

  /**
   * Insert a new link in current text
   * @param run
   * @param label
   * @param ref
   */
  insertLink = (run: MetaRun, label: string, ref: string) => {
    const self = this.editor;
    self.reSelectOffset();

    const addLink = () => {
      self.updateSelection();
      const linkLabel = label || ref;
      const currentSelection = self.currentSelection;
      const previousSelection: EditorSelectionDescriptor = {
        startOffset: currentSelection.startOffset,
        endOffset: currentSelection.endOffset,
      };
      const newSelection: EditorSelectionDescriptor = {
        startOffset: previousSelection.startOffset,
        endOffset: previousSelection.startOffset + linkLabel.length,
      };

      let currentRange = window.getSelection().getRangeAt(0);
      currentRange.deleteContents();

      const linkId = this.getNextLinkRunId();
      const linkElement = self.createGridEditorChildElement(
        linkLabel,
        'a',
        self.getEditCellDefaultLinkStyle(),
        ref,
        linkId,
      ) as HTMLAnchorElement;

      currentRange = window.getSelection().getRangeAt(0);
      currentRange.insertNode(linkElement);
      // flatten child elements inside editor
      const elements = self.flattenElement(self);
      const fragment = document.createDocumentFragment();
      fragment.append(...elements);
      self.innerHTML = '';
      self.appendChild(fragment);
      self.cleanEmptyChildren();

      // Reset all the style of text inside link's offset
      self.updateSelectionWithOffset(newSelection, false);
      self.reSelectOffset();
      currentRange = window.getSelection().getRangeAt(0);
      currentRange.deleteContents();
      self.cleanEmptyChildren();
      currentRange.insertNode(linkElement);

      this.updateEditorLinkRun();
      // self.markEditorAsChanged();

      self.updateSelectionWithOffset(newSelection, false);
      self.reSelectOffset();

      return linkId;
    };

    if (self.isReadonly()) {
      self.executeActionWithHistory(() => {
        const actualLength = run.endOffset - run.startOffset;
        const newLinkId = addLink();
        this.actualLinksLength.set(newLinkId, actualLength);
      });
    } else {
      self.executeActionWithHistory(addLink);
    }

    self.updateEditorStyle();
    self.updateSelection(true);
  };

  /**
   * Get link run of formula cell. It should cover the whole text of editor.
   */
  getFormulaLink = () => {
    const self = this.editor;
    if (!self.hasChanged() && getFormulaCellLinkRuns(self.editCell)) {
      const selectedLink: MetaRun = {
        startOffset: 0,
        endOffset: self.textContent.length,
        ref: self.editCell.formattedValue,
      };

      const linkRect = selectedLink
        ? getChildRect(self, selectedLink.startOffset, selectedLink.endOffset)
        : null;

      return {
        run: selectedLink,
        rect: linkRect,
        cell: self.editCell,
        value: self.textContent,
        isFormulaCellHyperlink: true,
      };
    }
  };

  editLinkAt = () => {
    const self = this.editor;
    const selectedLink =
      isFormulaCell(self.editCell) && !self.hasChanged()
        ? self.getFormulaLink()
        : self.getSelectedHyperlink();

    self.grid.dispatchEvent('showupdatelinkmenu', {
      detail: selectedLink,
    });
  };

  linkPositionChanged = () => {
    const self = this.editor;
    const data =
      isFormulaCell(self.editCell) && !self.hasChanged()
        ? self.getFormulaLink()
        : self.getSelectedHyperlink();

    this.editor.grid.dispatchEvent('linkpositionchanged', {
      detail: data,
    });
  };

  /**
   * Get selected hyperlink according to caret/selection position
   *
   * If there is no character in the selection, the caret on the left most
   * of the link text will NOT be counted as inside the link.
   * @returns
   */
  getSelectedHyperlink = () => {
    const self = this.editor;
    const currSelection = self.currentSelection;
    const linkRuns = self.linkRuns ?? [];
    let selectedLink: EditorLinkRun;

    function checkSelectionInHyperlink(
      selection: EditorSelectionDescriptor,
      run: EditorLinkRun,
    ) {
      const hasSelection = selection.startOffset < selection.endOffset;
      return (
        ((!hasSelection && run.startOffset < selection.startOffset) ||
          (hasSelection && run.startOffset <= selection.startOffset)) &&
        run.endOffset >= selection.endOffset
      );
    }

    for (const run of linkRuns) {
      if (checkSelectionInHyperlink(currSelection, run)) {
        selectedLink = run;
        break;
      }
    }

    const linkRect = selectedLink
      ? getChildRect(self, selectedLink.startOffset, selectedLink.endOffset)
      : null;

    return {
      run: selectedLink,
      rect: linkRect,
      cell: self.editCell,
      value: self.textContent,
    };
  };

  /**
   * Add a handler into queue, it will be called on editor input event
   * @param handler
   */
  addHyperlinkHandler = (handler: () => void) => {
    this.hyperlinkHandlers.push(handler);
  };

  /**
   * Clean all handlers inside queue without executing it
   */
  cleanHyperlinkHandlers = () => {
    this.hyperlinkHandlers = [];
  };

  /**
   * Excecute all registered handlers once and then remove it out of the queue
   */
  excecuteHyperlinkHandlers = () => {
    for (const cb of this.hyperlinkHandlers) {
      if (typeof cb === 'function') {
        cb();
      }
    }
    this.cleanHyperlinkHandlers();
  };

  /**
   * Remove a specific link by using its Id
   * @param linkId
   * @param keepStyle
   */
  unLinkById = (linkId: string, keepStyle = false) => {
    const self = this.editor;
    const linkNodes = this.findLinkById(linkId);
    if (!linkNodes || linkNodes.length === 0) {
      return;
    }

    if (!self.isReadonly() && keepStyle) {
      for (const linkNode of linkNodes) {
        const spanNode = self.unlinkAnchorElement(linkNode);
        linkNode.replaceWith(spanNode);
      }
    } else {
      // In readonly mode, we need to change the text to the actual one.
      // They can be smaller or bigger than the current label, so we can't
      // keep the style runs in this case.
      const actualText = this.getLinkRunActualText(linkId);
      if (actualText == null) return;
      const spanNode = self.createGridEditorChildElement(
        actualText,
        'span',
        {},
      );

      linkNodes[0].replaceWith(spanNode);
      for (let i = 1; i < linkNodes.length; i++) {
        const node = linkNodes[i];
        node.parentElement.removeChild(node);
      }

      self.cleanEmptyChildren();
      const range = window.getSelection().getRangeAt(0);
      if (range) {
        range.selectNode(spanNode);
      }
    }

    this.updateEditorLinkRun();
    this.resetLatestAddedLink();
    this.disableRemoveLinkOnBackspace();
    self.updateSelection(true);
  };

  /**
   * Find all child node of a link by using its Id
   * @param linkId
   */
  findLinkById = (linkId: string) => {
    const childNodes = this.editor.childNodes;
    const linkNodes: HTMLAnchorElement[] = [];

    for (let i = 0; i < childNodes.length; i++) {
      const child = childNodes[i];
      const match =
        child instanceof HTMLAnchorElement &&
        this.editor.extractLinkNodeData(child).id === linkId;

      if (match) {
        linkNodes.push(child);
      } else if (linkNodes.length > 0) {
        // Child elements of the same link is in consecutive position,
        // so stop here if it was found
        break;
      }
    }

    return linkNodes;
  };

  /**
   * Use for outputing the link-runs and the value may store in free-form
   * or table cells' metadata
   * @returns
   */
  getEditorLinkRuns = (): MetaRun[] => {
    const self = this.editor;
    const linkRuns = self.extractLinkRunsFromEditor(true);

    if (!linkRuns) {
      return [];
    }

    // There is readonly cell, the value of cell cannot be modified, so
    // we need to convert from display offset to original value index
    let offsetDelta = 0;
    const runs: MetaRun[] = [];

    for (const linkRun of linkRuns) {
      const originLength = this.getActualLinkLength(linkRun);
      const displayLength = linkRun.endOffset - linkRun.startOffset;
      const { id: _, ...run } = linkRun;

      run.startOffset += offsetDelta;
      run.endOffset = run.startOffset + originLength;

      offsetDelta += originLength - displayLength;
      runs.push(run);
    }

    return runs;
  };

  /**
   * Selection/caret position has changed, notify to update various part of the
   * editor.
   */
  updateLinkOnCaretPositionChanged = () => {
    // When the caret position is changed, we should disable the ability to remove
    // link if the user presses `Backspace` key.
    this.disableRemoveLinkOnBackspace();

    // Only add hyperlink button if there is text inside selection and not overlap
    // the link text
    const self = this.editor;
    const selection = self.currentSelection;

    if (selection && selection.startOffset < selection.endOffset) {
      const linkRuns = self.linkRuns ?? [];
      // Don't allow to insert link in formula mode
      let canInsertLink = self.isString && !self.grid.isInFormulaMode();

      if (canInsertLink) {
        for (const run of linkRuns) {
          if (
            run.startOffset >= selection.endOffset ||
            run.endOffset <= selection.startOffset
          ) {
            continue;
          }
          canInsertLink = false;
          break;
        }
      }

      if (canInsertLink) {
        this.addHyperlinkButton();
      } else {
        this.removeHyperlinkButton();
      }
    } else {
      this.removeHyperlinkButton();
    }
  };

  /**
   * Check if a editor child node is or inside a link element
   * @param node
   * @returns
   */
  checkNodeInsideLink = (node: Node) => {
    const self = this.editor;
    if (!self.contains(node)) {
      return false;
    }

    while (self.contains(node)) {
      if (node instanceof HTMLAnchorElement) {
        return true;
      }
      node = node.parentElement;
    }

    return false;
  };

  /**
   * Get part of text in edior at the caret position.
   * @param includeRightText Whether the text on the right of cursor should
   * be included.
   */
  getBeforeCaretText = (includeRightText = false) => {
    const self = this.editor;
    const position = self.currentSelection.startOffset;
    const { anchorNode, anchorOffset } = window.getSelection();
    if (this.checkNodeInsideLink(anchorNode)) {
      // The current selected node is inside a link
      return {};
    }

    function getNodeText(node: Node) {
      if (node instanceof HTMLElement || node instanceof Text) {
        return node.textContent;
      }
      return '';
    }

    function getTextWithoutSpace(text: string, to: 'left' | 'right') {
      const parts = text.split(SPACE);
      return to === 'left' ? parts[parts.length - 1] : parts[0];
    }

    // Get left text
    let leftText = getNodeText(anchorNode)
      ? getNodeText(anchorNode).slice(0, anchorOffset)
      : '';
    let node = anchorNode;
    let stop = false;
    while (self != node && self.contains(node)) {
      if (this.checkNodeInsideLink(node)) {
        // Stop getting more text if found a link
        break;
      }

      let siblingNode = node.previousSibling;
      while (siblingNode) {
        if (this.checkNodeInsideLink(siblingNode)) {
          // Stop getting more text if found a link
          stop = true;
          break;
        }

        leftText = getNodeText(siblingNode) + leftText;
        siblingNode = siblingNode.previousSibling;
      }

      if (stop) break;
      node = node.parentNode;
    }
    leftText = getTextWithoutSpace(leftText, 'left');

    if (!includeRightText || !leftText) {
      return {
        startOffset: position - leftText.length,
        endOffset: position,
        value: leftText,
      };
    }

    // Get right text
    let rightText = getNodeText(anchorNode)
      ? getNodeText(anchorNode).slice(anchorOffset)
      : '';
    stop = false;
    node = anchorNode;
    while (self != node && self.contains(node)) {
      if (this.checkNodeInsideLink(node)) {
        // Stop getting more text if found a link
        break;
      }

      let siblingNode = node.nextSibling;
      while (siblingNode) {
        if (this.checkNodeInsideLink(siblingNode)) {
          // Stop getting more text if found a link
          stop = true;
        }

        rightText = rightText + getNodeText(siblingNode);
        siblingNode = siblingNode.nextSibling;
      }

      if (stop) break;
      node = node.parentNode;
    }
    rightText = getTextWithoutSpace(rightText, 'right');

    return {
      startOffset: position - leftText.length,
      endOffset: position + rightText.length,
      value: leftText + rightText,
    };
  };

  /**
   * Update/clean up hyperlink stuff before end editing
   */
  updateHyperlinkOnEndEdit = () => {
    this.excecuteHyperlinkHandlers();
    // remove the insert hyperlink button
    this.removeHyperlinkButton();

    setTimeout(() => {
      // remove the insert hyperlink layover menu
      this.showAddHyperlinkMenu({ close: true });
    });
  };

  /**
   * Keep track of the old link id to make sure elements with the same old link id
   * should have the same new link id as well.
   */
  pasteLinkIdMap: Record<string, string> = {};

  /**
   * Each link in editor link runs have different ids. So before pasting the link
   * we need to do a clean up to generate new ids for links inside paste content.
   * @param node
   * @param isRoot
   */
  cleanPasteHTMLHyperlink = (node: HTMLElement, isRoot = true) => {
    if (isRoot) {
      this.pasteLinkIdMap = {};
    }
    const childNodes = node.childNodes;

    for (let i = 0; i < childNodes.length; i++) {
      const child = childNodes[i];
      if (child instanceof HTMLMetaElement) {
        continue;
      }

      if (child instanceof HTMLAnchorElement) {
        const linkId = child.dataset.linkId;
        if (this.pasteLinkIdMap[linkId]) {
          child.dataset.linkId = this.pasteLinkIdMap[linkId];
        } else {
          const newLinkId = this.getNextLinkRunId();
          child.dataset.linkId = newLinkId;
          this.pasteLinkIdMap[linkId] = newLinkId;
        }
      } else if (child instanceof HTMLElement) {
        this.cleanPasteHTMLHyperlink(child, false);
      }
    }
  };

  /**
   * Parent element that the hyperlink button will be appended to. It should
   * be the same as editor parent.
   */
  get hyperlinkButtonRoot() {
    return this.editor.parentElement;
  }

  /**
   * The hyperlink button width. It will get bigger/smaller according to the
   * current zooming ratio.
   */
  get hyperlinkButtonWidth() {
    return this.editor.grid.dp(
      HYPERLINK_BUTTON_WIDTH,
      this.editor.grid.userScale,
    );
  }

  /**
   * The hyperlink button height. It will get bigger/smaller according to the
   * current zooming ratio
   */
  get hyperlinkButtonHeight() {
    return this.editor.grid.dp(
      HYPERLINK_BUTTON_HEIGHT,
      this.editor.grid.userScale,
    );
  }

  /**
   * Add the hyperlink button and its accosiated event handler.
   */
  addHyperlinkButton = () => {
    // Remove existing hyperlink button if exist
    this.removeHyperlinkButton();

    // Create new hyperlink button
    const button = document.createElement('div');
    const size = this.hyperlinkButtonWidth;
    const icon = `
      <svg width="${size}px" height="${size}px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
          <g id="Link">
            <rect id="Rectangle" fill-rule="nonzero" x="0" y="0" width="24" height="24">
            </rect>
            
            <path d="M14,16 L17,16 C19.2091,16 21,14.2091 21,12 L21,12 C21,9.79086 19.2091,8 17,8 L14,8" id="Path" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            </path>
            
            <path d="M10,16 L7,16 C4.79086,16 3,14.2091 3,12 L3,12 C3,9.79086 4.79086,8 7,8 L10,8" id="Path" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            </path>
                  
            <line x1="7.5" y1="12" x2="16.5" y2="12" id="Path" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            </line>
          </g>
        </g>
      </svg>
    `;
    button.innerHTML = icon;
    button.dataset.grideditorcompanion = 'true';
    button.classList.add('grid-editor-hyperlink-button');
    this.hyperlinkButton = button;

    this.hyperlinkButton.addEventListener('click', () => {
      this.showAddHyperlinkMenu();
    });

    this.hyperlinkButtonRoot?.appendChild(this.hyperlinkButton);
    this.updateHyperlinkButtonPosition();
  };

  /**
   * Remove the existing hyperlink button and close the associated Add hyperlink
   * overlay menu
   */
  removeHyperlinkButton = () => {
    if (
      this.hyperlinkButton &&
      this.hyperlinkButtonRoot?.contains(this.hyperlinkButton)
    ) {
      this.hyperlinkButtonRoot.removeChild(this.hyperlinkButton);
    }
    // notify to close add hyperlink menu
    this.showAddHyperlinkMenu({ close: true });
  };

  /**
   * Make sure the hyperlink button's position is at the top left corner of
   * grid editor
   * @param editorResize Whether the position update is because of the resize
   * of editor or not
   */
  updateHyperlinkButtonPosition = (editorResize = false) => {
    if (!this.hyperlinkButton) {
      return;
    }

    const editorBound = this.editor.getBoundingClientRect();
    const borderWidth = this.editor.grid.style.editCellBorderWidth;
    const buttonStyle: Partial<CSSStyleDeclaration> = {
      position: 'absolute',
      zIndex: '2000',
      // borderRadius: '4px',
      top: editorBound.top + borderWidth + 'px',
      left:
        editorBound.left +
        editorBound.width -
        this.hyperlinkButtonWidth -
        borderWidth +
        'px',
      height: this.hyperlinkButtonHeight + 'px',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      cursor: 'pointer',
      color: '#5F89FF',
      backgroundColor: 'white',
    };
    Object.assign(this.hyperlinkButton.style, buttonStyle);

    // Only update position of the menu if the editor position has changed
    // but not the menu data
    if (editorResize) {
      this.showAddHyperlinkMenu({ updatePosition: true });
    }
  };

  showAddHyperlinkMenu = (options?: {
    close?: boolean;
    updatePosition?: boolean;
  }) => {
    const self = this.editor;
    const detail: any =
      options?.close || !self ? null : { cell: self.editCell };

    // Indicate that only need to update the menu position
    if (options?.updatePosition && detail) {
      detail.updatePosition = true;
    }

    // Add selection text in order to create new link
    if (detail) {
      const selection = self.currentSelection;
      const content = self.textContent;
      const run: MetaRun = {
        startOffset: selection.startOffset,
        endOffset: selection.endOffset,
        label: content.slice(selection.startOffset, selection.endOffset),
      };
      detail.run = run;
    }
    self.grid.dispatchEvent('showaddhyperlinkmenu', {
      detail,
    });
  };
}
