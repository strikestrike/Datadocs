'use strict';
import type {
  CellDescriptor,
  CellStyleDeclaration,
  NormalCellDescriptor,
} from './types/cell';
import type { GridPrivateProperties } from './types/grid';
import type { Cursor, ElementForScrollOffset } from './types/base';
import { copyMethods } from './util';
import { DrawUtils } from './draw/util';
import type { EditorCellData, EditorProperties } from './editor/type';
import { loadAllEditorModules } from './editor/modules';
import type { EditorSelectionDescriptor } from './editor/selection';
import { DatadocEditorId, ZeroWidthBlank } from './editor/constant';
import type { MetaRun, StyleRun } from './types/style';
import { setDataToClipboard } from './clipboard/clipboard-set-data';
import type { EditCellDescriptor } from './types';
import {
  cellEditorStyleKeys,
  checkRunsEqual,
  getEditCellStyle,
} from './editor/utils';
import { getUndoRedoCellKey } from './utils/undo-redo';
import {
  getTableCellStringValue,
  getHyperlinkData,
  getLinkDisplayContent,
} from './utils/hyperlink';
import { ensureAsync } from './data/data-source/await';
import { isHyperlinkDataFormat } from './data/formatters';

interface EditorCellBounds {
  x: number;
  y: number;

  height: number;
  width: number;
}

export default function loadGridDOMHelper(self: GridPrivateProperties) {
  copyMethods(new GridDOMHelper(self), self);
}

export class GridDOMHelper {
  zIndexTop: number;
  constructor(private readonly grid: GridPrivateProperties) {}

  getDomRoot = () => {
    const self = this.grid;
    return self.shadowRoot ? self.shadowRoot.host : self.parentNode;
  };
  getCursor = () => this.grid.parentNodeStyle.cursor;
  setCursor = (value: Cursor) => {
    const self = this.grid;
    if (self.currentCursor !== value) {
      self.parentNodeStyle.cursor = value;
      self.currentCursor = value;
    }

    if (self.draggingItem) {
      document.body.classList.add('grid-cursor-override-children');
      document.body.style.setProperty('cursor', value, 'important');
    } else {
      document.body.classList.remove('grid-cursor-override-children');
      document.body.style.cursor = 'default';
    }
  };

  scrollOffset = (e: ElementForScrollOffset) => {
    var x = 0,
      y = 0,
      scrollingElement = document.scrollingElement || {
        scrollLeft: 0,
        scrollTop: 0,
      };
    while (
      e.parentNode &&
      e.nodeName !== 'CANVAS-DATAGRID' &&
      (e as any) !== this.grid.intf
    ) {
      if (
        e.nodeType !== 'canvas-datagrid-tree' &&
        e.nodeType !== 'canvas-datagrid-cell'
      ) {
        x -= e.scrollLeft;
        y -= e.scrollTop;
      }
      e = e.parentNode as any;
    }
    return {
      left: x - scrollingElement.scrollLeft,
      top: y - scrollingElement.scrollTop,
    };
  };
  resizeEditInput = (isInitial = false) => {
    const self = this.grid;
    // Reference captured when input was created
    // containing potentially stale geom observations
    if (!self.input?.editCell) return;

    const canvasBounds = self.canvas.getBoundingClientRect(),
      scrollOffset = this.scrollOffset(self.componentRoot),
      drawUtils = new DrawUtils(self);

    if (self.mobile) {
      self.input.style.left = canvasBounds.left + scrollOffset.left + 'px';
      self.input.style.top =
        canvasBounds.top +
        scrollOffset.top +
        self.canvas.clientHeight -
        self.dp(self.style.mobileEditInputHeight, self.userScale) +
        'px';
      self.input.style.height =
        self.dp(self.style.mobileEditInputHeight, self.userScale) + 'px';
      self.input.style.width =
        self.canvas.clientWidth - self.style.editCellPaddingLeft + 'px';
      return;
    }

    const { rowIndex, columnIndex } = self.input.editCell;

    let cell = isInitial
        ? self.input.editCell
        : self.getVisibleCellByIndex(columnIndex, rowIndex),
      usingInitialCell = false;

    if (cell) {
      self.input.editCell = cell;
    } else {
      cell = self.input.editCell;
      usingInitialCell = true;
      // Update the dimensions so that it stays proportionate on scale changes.
      cell.width = self.dp(self.getColumnWidth(columnIndex));
      cell.height = self.dp(self.getRowHeight(rowIndex));
    }

    // Use different cell editor input style when enter formula mode
    this._updateCellEditorInputStyle();

    const viewport = self.viewport;
    const { horizontalTrack, verticalTrack } = self.scrollBox.entities;
    const cellX = usingInitialCell
      ? viewport.getColumnHeader(columnIndex)?.x
      : cell.x;
    const cellY = usingInitialCell
      ? viewport.getRowHeader(rowIndex)?.y
      : cell.y;

    let x = cellX;
    if (self.input.horizontalAlignment === 'right' && x) {
      x += cell.width;
    } else if (self.input.horizontalAlignment === 'center' && x) {
      x += cell.width / 2;
    }
    let y = cellY;

    const leftAreaWidth = self.dp(self.getLeftAreaWidth());
    const topAreaHeight = self.dp(self.getTopAreaHeight());
    const constraints = {
      x:
        cell.columnIndex >= self.frozenColumn
          ? horizontalTrack.x
          : leftAreaWidth,
      y: cell.rowIndex >= self.frozenRow ? verticalTrack.y : topAreaHeight,
      x0: horizontalTrack.x + horizontalTrack.width,
      y0: verticalTrack.y + verticalTrack.height,
    };

    const lineWidths: number[] = [];
    // const value = (isInitial ? cell.value : self.input.textContent) ?? '';
    const formattedEditCellValue = self.getFormatEditCellValue(
      cell.rowIndex,
      cell.columnIndex,
    );
    const value =
      (isInitial ? formattedEditCellValue : self.getInputValue()) ?? '';
    let maxLineWidth =
      self.ctx.measureText(formattedEditCellValue).width +
      self.dp(self.style.editCellPaddingLeft, self.userScale) +
      cell.paddingRight;
    let maxLineHeight = 0;

    // Since the cell is scaled, we do not disable the scaling here,
    // and as editor style is different of cell style in formula mode
    // need to make sure we apply the right style
    if (this.isInFormulaMode()) {
      drawUtils.applyCellFontStyles({
        style: cell.style,
        fontSize: self.style.cellFontSize,
        fontWeight: 'normal',
        fontStyle: 'normal',
        fontFamily: self.style.editCellFormulaFontFamily,
      });
    } else {
      drawUtils.applyCellFontStyles(cell);
    }

    if (['textarea', 'div'].indexOf(self.input.tagName.toLowerCase()) !== -1) {
      const lines = value.split('\n');
      // ^ This is different from cell.text.lines because:
      //
      // a. we are not wrapping based on cell bounds.
      // b. We are dealing with raw value and not formatted value
      let textOffset = 0;
      let currStyleIdx = 0;
      const editorData = self.input.generateDataFromEditor();
      for (const line of lines) {
        let lineWidth = 0;
        if (currStyleIdx >= editorData.styles.length) {
          drawUtils.applyCellFontStyles(cell);
          const measurement = self.ctx.measureText(line);
          lineWidth = Math.max(
            measurement.width +
              self.dp(self.style.editCellPaddingLeft, self.scale) +
              cell.paddingRight +
              2 * self.dp(self.style.editCellBorderWidth, self.scale),
            0,
          );
        } else {
          const lineLength = line.length;
          for (let i = currStyleIdx; i < editorData.styles.length; i++) {
            const styleRun = editorData.styles[i];
            const startOffset = Math.max(styleRun.startOffset - textOffset, 0);
            const endOffset = Math.min(
              styleRun.endOffset - textOffset,
              lineLength,
            );
            const s = line.slice(startOffset, endOffset);
            drawUtils.applyCellFontStyles({ ...cell, ...styleRun.style });
            lineWidth += self.ctx.measureText(s).width;
            if (endOffset === lineLength) {
              currStyleIdx = i;
              break;
            }
          }
          lineWidth = Math.max(
            lineWidth +
              self.dp(self.style.editCellPaddingLeft, self.scale) +
              cell.paddingRight +
              2 * self.dp(self.style.editCellBorderWidth, self.scale),
            0,
          );
        }
        const lineHeight = cell.lineHeight;
        lineWidths.push(lineWidth);
        // if (lineWidth > maxLineWidth) {
        //   maxLineWidth = lineWidth;
        // }

        if (lineHeight > maxLineHeight) {
          maxLineHeight = lineHeight;
        }
        textOffset += line.length;
      }
      maxLineWidth = Math.max(...lineWidths);
    } else {
      const measurement = self.ctx.measureText(value);
      const lineHeight = cell.lineHeight;

      // The combination of userScale and windowScale should be used,
      // because mesureText calculate text width with those scale
      const lineWidth = Math.max(
        measurement.width +
          self.dp(self.style.editCellPaddingLeft, self.scale) +
          cell.paddingRight +
          2 * self.dp(self.style.editCellBorderWidth, self.scale),
        0,
      );
      lineWidths.push(lineWidth);
      if (lineWidth > maxLineWidth) {
        maxLineWidth = lineWidth;
      }
      maxLineHeight = lineHeight;
    }
    const minEditorBoundsWidth = self.dp(20);
    const editorBounds = this._computeAvailableBoundsForEditor(
      cell,
      lineWidths,
      maxLineWidth,
    );
    editorBounds.width = Math.max(editorBounds.width, minEditorBoundsWidth);
    const desiredHeight = self.px(editorBounds.height, self.windowScale) + 1;
    // This will be set true if there isn't horizontal space, and we allow
    // the element set the adjust the height so that we can display the texts
    // in multi-lines.
    let freeFormHeight = false;

    // Used to check whether the x, y coordinates of the input is adjusted so
    // that it stays in view while the underlying cell that is being edited is
    // not.  If differs, start to display the `cellBadge` so that the user can
    // know the input is not exactly over the cell and has been moved.
    const originalX = x;
    const originalY = y;

    // if (
    //   (x === undefined && columnIndex < self.scrollIndexLeft) ||
    //   x < constraints.x
    // ) {
    //   x = constraints.x;
    // } else if (
    //   (x === undefined && columnIndex > self.scrollIndexRight) ||
    //   x + editorBounds.width > constraints.x0
    // ) {
    //   x = Math.max(constraints.x0 - editorBounds.width, constraints.x);
    // }

    // The minimum value of cell editor width. If the min width is bigger than
    // the distance from cellX to constraints right is smaller than , it will
    // be used as the width of cell editor. It's not allowed cell editor
    // expand to the left side, mimic how Google Sheets and Excel do it.
    const minInputWidth = Math.min(
      Math.max(minEditorBoundsWidth, cell.width),
      constraints.x0 - constraints.x,
    );
    if (self.input.horizontalAlignment === 'center') {
      const halfMinInputWidth = minInputWidth / 2;
      if (
        (x === undefined && columnIndex < self.scrollIndexLeft) ||
        x - halfMinInputWidth < constraints.x
      ) {
        x = Math.min(
          constraints.x + halfMinInputWidth,
          constraints.x0 - halfMinInputWidth,
        );
      } else if (
        (x === undefined && columnIndex > self.scrollIndexRight) ||
        x + halfMinInputWidth > constraints.x0
      ) {
        x = Math.max(
          constraints.x0 - halfMinInputWidth,
          constraints.x + halfMinInputWidth,
        );
      } else if (x - constraints.x > constraints.x0 - x) {
        if (x + editorBounds.width / 2 > constraints.x0) {
          if (x - editorBounds.width / 2 >= constraints.x0) {
            x = Math.max(
              constraints.x0 - halfMinInputWidth,
              constraints.x + halfMinInputWidth,
            );
          } else {
            const halfMaxInputWidth = Math.max(
              editorBounds.width / 2 -
                (x + editorBounds.width / 2 - constraints.x0),
              halfMinInputWidth,
            );
            x = constraints.x0 - halfMaxInputWidth;
            x = Math.max(x, constraints.x + halfMaxInputWidth);
          }
        }
      } else if (x - constraints.x < constraints.x0 - x) {
        if (x - editorBounds.width / 2 < constraints.x) {
          if (x + editorBounds.width / 2 <= constraints.x) {
            x = Math.min(
              constraints.x0 - halfMinInputWidth,
              constraints.x + halfMinInputWidth,
            );
          } else {
            const halfMaxInputWidth = Math.max(
              editorBounds.width / 2 -
                (constraints.x - (x - editorBounds.width / 2)),
              halfMinInputWidth,
            );
            x = constraints.x + halfMaxInputWidth;
            x = Math.min(x, constraints.x0 - halfMaxInputWidth);
          }
        }
      }

      if (x + editorBounds.width / 2 > constraints.x0) {
        editorBounds.width = (constraints.x0 - x) * 2;
      }
      if (x - editorBounds.width / 2 < constraints.x) {
        editorBounds.width = (x - constraints.x) * 2;
      }
    } else if (self.input.horizontalAlignment === 'right') {
      if (
        (x === undefined && columnIndex > self.scrollIndexRight) ||
        x > constraints.x0
      ) {
        x = constraints.x0;
      } else if (x === undefined && columnIndex < self.scrollIndexLeft) {
        x = Math.min(constraints.x0, constraints.x + minInputWidth);
      } else if (x - minInputWidth < constraints.x) {
        if (x <= constraints.x) {
          x = Math.min(constraints.x0, constraints.x + minInputWidth);
        } else {
          x = constraints.x + Math.max(minInputWidth, x - constraints.x);
          x = Math.min(x, constraints.x0);
        }
      }

      if (x - editorBounds.width < constraints.x) {
        editorBounds.width = x - constraints.x;
      }
    } else {
      if (
        (x === undefined && columnIndex < self.scrollIndexLeft) ||
        x < constraints.x
      ) {
        x = constraints.x;
      } else if (x === undefined && columnIndex > self.scrollIndexRight) {
        x = Math.max(constraints.x0 - minInputWidth, constraints.x);
      } else if (x + editorBounds.width > constraints.x0) {
        if (x >= constraints.x0) {
          x = Math.max(constraints.x0 - minInputWidth, constraints.x);
        } else {
          x = constraints.x0 - Math.max(minInputWidth, constraints.x0 - x);
          x = Math.max(x, constraints.x);
        }
      }

      if (x + editorBounds.width > constraints.x0) {
        editorBounds.width = constraints.x0 - x;
      }
    }

    // ^ Need to allow freeFormHeight by default, because:
    //
    // a. The height of edit cell can be bigger than the desiredHeight, In case
    // of big font-size, we don't want cell editor only show top half of text.
    // b. Sometime the cursor is at the begin of new line because there is not
    // enough space in previous line. It causes new line break even though the
    // text content still fit in nicely.
    freeFormHeight = true;
    self.input.style.height = 'auto';
    self.input.style.minHeight = desiredHeight + 'px';

    self.input.style.paddingTop =
      (cell.paddingTop * 1) / self.windowScale - self.input.clientTop + 'px';
    self.input.style.paddingLeft =
      (self.dp(self.style.editCellPaddingLeft, self.userScale) * 1) /
        self.windowScale -
      self.input.clientLeft +
      'px';
    self.input.style.paddingBottom = freeFormHeight
      ? self.dp(self.style.editCellPaddingBottom, self.userScale) + 'px'
      : '0';

    if (
      (y === undefined && rowIndex < self.scrollIndexTop) ||
      y < constraints.y
    ) {
      y = constraints.y;
    } else if (
      (y === undefined && rowIndex > self.scrollIndexBottom) ||
      y + editorBounds.height > constraints.y0
    ) {
      y = Math.max(constraints.y0 - editorBounds.height, constraints.y);
    }
    if (y + editorBounds.height > constraints.y0) {
      editorBounds.height = constraints.y0 - y;
    }

    // We are taking the floor of `canvasOffsetLeft`/`canvasOffsetTop` because
    // browsers round the integers whereas we mostly take the floor of them. So,
    // taking also the floor of those two prevents the offsetting that happens
    // when we do -0.5 offsetting instead of -1.
    let adjusted = originalX !== x || originalY !== y;
    const getTop = (y: number) => {
      return (
        canvasBounds.top +
        self.px(y, self.windowScale) +
        scrollOffset.top +
        Math.floor(self.canvasOffsetTop)
      );
    };
    const getLeft = (x: number) => {
      return (
        canvasBounds.left +
        self.px(x, self.windowScale) +
        scrollOffset.left +
        Math.floor(self.canvasOffsetLeft)
      );
    };
    const updatePosition = () => {
      self.input.style.width =
        self.px(editorBounds.width, self.windowScale) + 1 + 'px';
      const trustX =
        self.input.horizontalAlignment === 'center'
          ? x - editorBounds.width / 2
          : self.input.horizontalAlignment === 'right'
          ? x - editorBounds.width
          : x;
      self.input.style.left = getLeft(trustX) + 'px';
      self.input.style.top = getTop(y) + 'px';
      if (freeFormHeight) {
        // Make sure we are not surpassing the total height, and if so, limit the
        // height.
        const rect = (self.input as HTMLDivElement).getBoundingClientRect();
        const top = getTop(constraints.y);
        const bottom = getTop(constraints.y0);

        if (rect.bottom > bottom) {
          const y = rect.top - (rect.bottom - bottom);
          adjusted = adjusted || originalY !== y;
          if (y >= top) {
            const wasScroll = self.input.style.overflowY === 'scroll';
            self.input.style.overflowY = 'hidden';
            self.input.style.top = y + 'px';

            // Hiding the scrollbar might increase the horizontal space in
            // Chromium-based browsers, so check the position again when it is
            // hidden.
            if (wasScroll) updatePosition();
          } else {
            self.input.style.overflowY = 'scroll';
            self.input.style.top = top + 'px';
            self.input.style.height = bottom - top + 'px';
            self.input.style.minHeight = '0';
          }
        }
      } else {
        self.input.style.overflowY = 'hidden';
        self.input.style.height = desiredHeight + 'px';
        self.input.style.minHeight = '0';
      }

      const { cellBadge } = self.input;
      cellBadge.style.display = adjusted ? 'flex' : 'none';

      if (adjusted) {
        const rect = self.input.getBoundingClientRect();
        // const maxRight = rect.right - cellBadge.offsetWidth;
        cellBadge.style.top =
          rect.top -
          cellBadge.offsetHeight -
          self.dp(self.style.editCellBadgeMarginBottom, self.userScale) +
          'px';

        // Cell badge should always be at the left corner, because
        // cell preview can sit next to it (according to Google Sheets)
        cellBadge.style.left = rect.left + 'px';

        // if (cellX !== undefined) {
        //   cellBadge.style.left =
        //     Math.min(getLeft(Math.max(constraints.x, cellX)), maxRight) + 'px';
        // } else {
        //   const isCellOnLeft = cell.columnIndex < self.scrollIndexLeft;
        //   cellBadge.style.left = (isCellOnLeft ? rect.left : maxRight) + 'px';
        // }
      }
    };

    updatePosition();
    self.updateCellPreviewPosition();

    if (self.input.updateHyperlinkButtonPosition) {
      self.input.updateHyperlinkButtonPosition(true);
    }
    // Input position has changed so that the link position inside it has been
    // changed as well
    self.input?.linkPositionChanged();
  };

  private _initBounds = (cell: CellDescriptor): EditorCellBounds => {
    const bounds = {
      x: cell.x,
      y: cell.y,

      // Editor will atleast occupy current cell's height/width
      height: cell.height,
      width: cell.width,
      isIdeal: false,
      expDirs: [],
      idealHeight: 0,
    };
    return bounds;
  };

  /**
   * We default to rightward and downward expansion
   * which is more familiar
   *
   * But when space is not adequate, reverse
   * directions

   * We never expand simultaneously in both direction
   * because the visual context of what is getting
   * edited gets lost
   *
   * It is also rare in practice to end up with grid
   * so narrow that there isn't space in either direction
   *
   */
  private _computeAvailableBoundsForEditor = (
    cell: NormalCellDescriptor,
    lineWidths: number[],
    maxLineWidth: number,
  ): EditorCellBounds => {
    const self = this.grid;

    let { columnIndex } = cell;
    const bounds = this._initBounds(cell);

    // horizontal center expand both right and left
    if (self.input.horizontalAlignment === 'center') {
      let leftRemainingWidth = 0;
      let rightRemainingWidth = 0;
      let leftColumnIndex = columnIndex;
      let rightColumnIndex = columnIndex;
      while (
        bounds.width -
          self.dp(self.style.editCellPaddingLeft, self.userScale) -
          cell.paddingRight <
        maxLineWidth
      ) {
        if (leftRemainingWidth <= 0) {
          leftColumnIndex -= 1;
          if (leftColumnIndex < 0) break;
          // Attempt expanding to next cell left
          const schema = self.getSchema()[leftColumnIndex];
          if (!schema) break;
          if (schema.hidden) continue;
          leftRemainingWidth = self.dp(self.getColumnWidth(leftColumnIndex));
        }
        if (rightRemainingWidth <= 0) {
          rightColumnIndex += 1;
          // Attempt expanding to next cell right
          const schema = self.getSchema()[rightColumnIndex];
          if (!schema) break;
          if (schema.hidden) continue;
          rightRemainingWidth = self.dp(self.getColumnWidth(rightColumnIndex));
        }
        const expandWidth = Math.min(leftRemainingWidth, rightRemainingWidth);
        leftRemainingWidth -= expandWidth;
        rightRemainingWidth -= expandWidth;
        bounds.width += expandWidth * 2;
      }
    }
    // Expand right or left
    else {
      while (
        bounds.width -
          self.dp(self.style.editCellPaddingLeft, self.userScale) -
          cell.paddingRight <
        maxLineWidth
      ) {
        // Attempt expanding to next cell right or left
        if (self.input.horizontalAlignment === 'right') {
          columnIndex -= 1;
          if (columnIndex < 0) break;
        } else {
          columnIndex += 1;
        }
        const schema = self.getSchema()[columnIndex];
        if (!schema) break;
        if (schema.hidden) continue;
        bounds.width += self.dp(self.getColumnWidth(columnIndex));
      }
    }

    return bounds;
  };

  /**
   * Get the value of the input element that is actively editing a cell.
   * @returns The input value, or an empty string if there is no ongoing edit.
   */
  getInputValue = () => {
    const self = this.grid;
    return self.inputValue;
  };

  getInputFormattedValue = () => {
    const self = this.grid;
    return self.getInputValue().replace(ZeroWidthBlank, '');
  };

  /**
   * Set the value of the input element that is actively editing a cell if
   * there is an ongoing edit.
   * @param value To set.
   * @param skipResize Do not resize the resize input.
   */
  setInputValue = (value: string, skipResize?: boolean) => {
    const self = this.grid;
    if (
      this.isInFormulaMode() ||
      value.startsWith('=') ||
      value.startsWith(ZeroWidthBlank + '=')
    ) {
      self.inputValue = value;
    } else {
      self.input.setInputValue(value);
    }
    if (!skipResize) self.resizeEditInput();
  };

  /**
   * Exec command for editor from outside
   * @param command
   */
  execEditorAction = (command: string, value: any = null) => {
    const self = this.grid;
    if (!self.input) return;
    self.input.execAction(command, value);
    self.input.focus();
  };

  getEditorCellStyle = (): Partial<CellStyleDeclaration> => {
    const self = this.grid;
    if (!self.input) return null;
    return self.input.getSelectionStyle();
  };

  /**
   * Get the seleted hyperlink run in grid editor. It also includes some
   * extra information for showing hyperlink layover menu.
   */
  getSelectedHyperlink = () => {
    return this.grid.input?.getSelectedHyperlink();
  };

  /**
   * Start edit hyperlink
   */
  editLinkAt = () => {
    return this.grid.input?.editLinkAt();
  };

  /**
   * Apply new link label and ref to the grid editor
   * @param run
   * @param label
   * @param ref
   * @returns
   */
  applyLinkRunChange = (run: MetaRun, label: string, ref: string) => {
    return this.grid.input?.applyLinkRunChange(run, label, ref);
  };

  changeFormulaLinkRun = (label: string, ref: string) => {
    return this.grid.input?.changeFormulaLinkRun(label, ref);
  };

  insertLink = (run: MetaRun, label: string, ref: string) => {
    return this.grid.input?.insertLink(run, label, ref);
  };

  updateEditorSelection = (selection: EditorSelectionDescriptor) => {
    return this.grid.input?.updateSelectionWithOffset(selection);
  };

  /**
   * Create a text selection on a link inside link run list
   *
   * NOTE: The actual link runs can be different from grid editor display link
   * runs. The reason is that we take special care for readonly value from table
   * cells, so the real offset inside link-run can be bigger or smaller than the
   * one within grid editor.
   *
   * @param offset Text offset inside the link run (actual value)
   * @returns
   */
  selectLinkAt = (offset: number) => {
    const editor = this.grid.input;
    if (!editor) {
      return;
    }
    const displayOffset = editor.getDisplayOffset(offset);
    return editor.selectLinkAt(displayOffset);
  };

  /**
   * Remove a link run at text offset
   * @param offset
   * @returns
   */
  removeEditorLinkAt = (offset: number) => {
    return this.grid.input?.removeLinkAt(offset);
  };

  /**
   * Ends editing, optionally aborting the edit.
   * @memberof canvasDatagrid
   * @name endEdit
   * @method
   * @param abort When true, abort the edit.
   */
  endEdit = async (abort?: boolean) => {
    const self = this.grid;
    if (!self.input) return;
    document.body.removeEventListener(
      'mousedown',
      self.inputOnBodyMousedownHandler,
    );

    document.body.removeEventListener('mouseup', self.input.handleMouseUp);

    const cell: NormalCellDescriptor = self.input.editCell;
    const y = cell.rowIndex;

    function abortEdit() {
      abort = true;
    }

    // NOTE: It is not allowed to edit data inside table cell now,
    // because we need to proccessed the value according to column
    // type and stored in DB as well.
    // if (cell.tableHeader) abortEdit();

    const isReadOnly = self.input.isReadonly();
    const oldValue = cell.value;
    const value = isReadOnly
      ? oldValue
      : this.getInputValue().replace(ZeroWidthBlank, '');

    if (
      self.dispatchEvent('beforeendedit', {
        cell: cell,
        newValue: value,
        oldValue,
        abort: abortEdit,
        input: self.input,
      })
    ) {
      return false;
    }

    if (self.input.beforeEndEdit) {
      self.input.beforeEndEdit();
    }
    const { dataSource } = self;
    const { rows } = dataSource.state;
    const editorStyle = self.input.getEditorStyle();

    // If there is explicit (user-defined) links after finishing editing,
    // store links data inside CellMeta
    const newLinkRuns = self.input.getEditorLinkRuns();
    const meta = self.input.editCell.meta
      ? { ...self.input.editCell.meta }
      : {};

    const oldCellContentMap = new Map();
    const oldCellStyleMap = self.getActiveCellValue(cellEditorStyleKeys);
    const oldStyle: Partial<CellStyleDeclaration> =
      self.dataSource.getCellStyle(cell.rowIndex, cell.columnIndex);
    const oldLinkRuns = cell.linkRuns;

    oldCellContentMap.set(getUndoRedoCellKey(cell.rowIndex, cell.columnIndex), {
      text: oldValue,
      cellError: meta.cellError,
      parserData: meta.parserData,
      linkData: meta.linkData,
    });

    if (!newLinkRuns) {
      delete meta.linkData;
    } else {
      meta.linkData = getHyperlinkData(
        structuredClone(newLinkRuns),
        getTableCellStringValue(isReadOnly ? oldValue : value),
        isReadOnly,
      );
    }

    if (value && editorStyle) {
      if (oldStyle?.isBold != null && !editorStyle.isBold) {
        editorStyle.isBold = false;
      }
      if (oldStyle?.isItalic != null && !editorStyle.isItalic) {
        editorStyle.isItalic = false;
      }
      if (oldStyle?.isStrikethrough != null && !editorStyle.isStrikethrough) {
        editorStyle.isStrikethrough = false;
      }
    }

    const newStyle = { ...oldStyle, ...editorStyle };
    const isStyleRunsChanged = !checkRunsEqual(oldStyle, newStyle);
    const isLinkRunsChanged = !checkRunsEqual(oldLinkRuns, newLinkRuns);
    const isValueChange = value !== cell.value;
    let shouldEdit = false;

    if (isReadOnly) {
      shouldEdit = self.input.hasChanged() && isLinkRunsChanged && !abort;
    } else {
      shouldEdit =
        self.input.hasChanged() &&
        (isValueChange || isStyleRunsChanged || isLinkRunsChanged) &&
        !abort;
    }
    if (!value && !oldValue) {
      shouldEdit = false;
    }

    if (self.input.parentNode) {
      self.input.parentNode.removeChild(self.input);
    }

    if (self.input.cellBadge.parentNode) {
      self.input.cellBadge.parentNode.removeChild(self.input.cellBadge);
    }

    if (shouldEdit) {
      // NOTE: For table cell, only allow to change its meta (for now), which
      // contains link runs
      const change: EditCellDescriptor = !cell.tableHeader
        ? {
            row: cell.viewRowIndex,
            column: cell.columnIndex,
            value,
            style: editorStyle,
            meta,
          }
        : {
            row: cell.viewRowIndex,
            column: cell.columnIndex,
            meta,
          };

      await ensureAsync(dataSource.editCells([change]));

      if (y === rows) {
        if (
          self.dispatchEvent('newrow', {
            value,
            defaultValue: cell.value,
            aborted: abort,
            cell: cell,
            input: self.input,
          })
        ) {
          return false;
        }
        self.addRow(cell.data);
        self.createNewRowData();
      }
      self.draw(true);
    }

    self.controlInput?.focus();
    self.dispatchEvent('endedit', {
      cell: cell,
      value,
      oldCellContent: oldCellContentMap,
      oldCellStyle: oldCellStyleMap,
      isEdited: shouldEdit,
      aborted: abort,
      input: self.input,
    });
    self.input = undefined;
    return true;
  };

  /**
   * Begins editing at cell x, row y.
   * @memberof canvasDatagrid
   * @name beginEditAt
   * @method
   * @param x The column index of the cell to edit.
   * @param y The row index of the cell to edit.
   * @param inReplaceMode If true, starting to type in cell will replace the
   * cell's previous value instead of appending, and using the arrow keys will allow
   * the user to navigate to adjacent cells instead of moving the text cursor around
   * (default is false, and means user is in 'edit' mode).
   * @param noFocus Do not steal the focus from the actively focused element.
   */
  beginEditAt = (
    x: number,
    y: number,
    NativeEvent?: Event,
    inReplaceMode = false,
    noFocus = false,
  ) => {
    const self = this.grid;
    if (!self.attributes.editable) {
      return;
    }
    if (self.input) {
      self.endEdit();
    }
    if (self.scrollIntoView(x, y)) {
      // We need the cell to be visible, so draw after changing position.
      self.redrawNow('all');
    }
    self.setActiveCell(x, y);
    const cell = self.getVisibleCellByIndex(x, y);
    if (!(cell && cell.header) || cell.isReadOnly) {
      return;
    }
    const enumValue = cell.header.enum;
    if (
      self.dispatchEvent('beforebeginedit', {
        cell: cell,
        NativeEvent: NativeEvent,
      })
    ) {
      return false;
    }

    // Request a redraw for selections to hide the selection handles when
    // editing.
    self.requestRedraw('selection');

    const isEnumInput = !!enumValue;
    const cellBadge = document.createElement('div');
    const editorProperties: EditorProperties = {} as any;

    if (isEnumInput) {
      self.input = Object.assign(
        document.createElement('select'),
        {
          editCell: cell,
          cellBadge,
          grid: self,
        },
        editorProperties,
      );
    } else {
      const element = Object.assign(
        document.createElement('div'),
        {
          editCell: cell,
          cellBadge,
          grid: self,
        },
        editorProperties,
      );
      element.contentEditable = 'true';
      self.input = element;
    }
    loadAllEditorModules(self.input);

    //HACK on mobile devices sometimes edit can begin without the cell being in view, I don't know how.
    if (enumValue) {
      let enumItems: Array<[string, string]>,
        option: HTMLOptionElement,
        valueInEnum: boolean;
      // add enums
      if (typeof enumValue === 'function') {
        enumItems = enumValue.apply(self.intf, [{ cell: cell }]);
      } else if (Array.isArray(enumValue)) {
        enumItems = enumValue;
      }
      enumItems.forEach(function (e) {
        const option = document.createElement('option'),
          isArray = Array.isArray(e),
          val = isArray ? e[0] : e,
          title = isArray ? e[1] : e;
        if (val === cell.value) {
          valueInEnum = true;
        }
        option.value = val;
        option.innerHTML = title;
        self.input.appendChild(option);
      });
      if (!valueInEnum) {
        option = document.createElement('option');
        option.value = cell.value;
        option.innerHTML = cell.value;
        self.input.appendChild(option);
      }
      self.input.addEventListener('change', function () {
        self.endEdit();
        self.draw(true);
      });
    } else {
      self.input.addEventListener('beforeinput', () => {
        self.input.buildHistoryState('OLD');
      });
      self.input.addEventListener('input', (e: KeyboardEvent) => {
        self.input.typingText(e);
        self.resizeEditInput();
        self.input.buildHistoryState('NEW');
        self.input.handleFormularModeChange();
        self.input.addHistoryItem();
        self.input.markEditorAsChanged();
      });
      self.input.addEventListener('mouseup', self.input.handleMouseUp);
      document.body.addEventListener('mouseup', self.input.handleMouseUp);
    }
    // if the user has not prevented the default action, append to the body
    if (
      !self.dispatchEvent('appendeditinput', { cell: cell, input: self.input })
    ) {
      document.body.appendChild(self.input);
      document.body.appendChild(self.input.cellBadge);
    }
    self.createInlineStyle(
      self.input,
      self.mobile
        ? 'canvas-datagrid-edit-mobile-input'
        : 'canvas-datagrid-edit-input',
    );
    self.createInlineStyle(
      self.input.cellBadge,
      'canvas-datagrid-edit-cell-badge',
    );
    // Not close editor when click on cellBadge
    self.input.cellBadge.setAttribute('data-grideditorcompanion', 'true');
    self.input.style.position = 'absolute';
    self.input.editCell = cell;
    self.input.style.zIndex = self.getZIndex('input');
    self.input.spellcheck = false;
    // self.input.style.fontSize = self.dp(cell.fontSize, self.userScale) + 'px';
    // self.input.style.fontWeight = cell.fontWeight ?? 'normal';
    // self.input.style.fontStyle = cell.fontStyle ?? 'normal';
    // self.input.style.textDecoration = cell.isStrikethrough
    //   ? 'line-through'
    //   : '';
    // self.input.style.fontFamily = cell.fontFamily;
    // self.input.style.color = cell.textColor;

    const shouldClearCellValue = cell.isEmpty || inReplaceMode;
    // const value = shouldClearCellValue ? '' : cell.value.toString();
    const formattedEditCellValue = self.getFormatEditCellValue(
      cell.rowIndex,
      cell.columnIndex,
    );
    let value = shouldClearCellValue ? '' : formattedEditCellValue;

    cellBadge.innerHTML = String(cell.header.dataKey) + (cell.rowIndex + 1);
    // Initialze horizontalAligment for editor from begin editor base on cell value and cell horizontal alignment
    self.input.horizontalAlignment = self.isInFormulaMode()
      ? 'left'
      : cell.horizontalAlignment
      ? cell.horizontalAlignment
      : self.style.cellHorizontalAlignment;

    if (this.isEditorReadOnly()) {
      self.input.markEditorAsReadonly();
    }
    self.input.isString =
      self.getDataTypeByIndex(cell.rowIndex, cell.columnIndex) === 'string';

    // Update value by merging original value with link runs and use display
    // link-runs for grid editor
    self.input.initLinkRuns();
    if (self.input.isReadonly()) {
      const originalText = value;
      const originalLinkRuns = self.input.linkRuns;
      const { displayText, displayLinkRuns } = getLinkDisplayContent(
        originalText,
        originalLinkRuns,
      );
      value = displayText;
      self.input.linkRuns = displayLinkRuns;
    }

    self.inputValue = value;

    if (self.input instanceof HTMLDivElement) {
      // self.input.style.lineHeight = cell.lineHeight * 1.2 + 'em';
      if (!self.isInFormulaMode()) {
        const data: EditorCellData = {
          text: value,
          styles: [],
        };
        const cellStyle: Partial<CellStyleDeclaration> = getEditCellStyle(cell);
        const styleRuns = cell.styleRuns;

        if (styleRuns && styleRuns.length > 0) {
          let startOffset = 0;
          for (let i = 0; i < styleRuns.length; i++) {
            const run = styleRuns[i];
            if (startOffset < run.startOffset) {
              data.styles.push({
                startOffset: startOffset,
                endOffset: run.startOffset,
                style: cellStyle,
              });
            }
            const newRun: StyleRun = {
              startOffset: run.startOffset,
              endOffset: run.endOffset,
              style: { ...run.style, ...cellStyle },
            };
            if (run.style.fontSize) {
              newRun.style.fontSize = run.style.fontSize;
            }
            if (run.style.fontFamily) {
              newRun.style.fontFamily = run.style.fontFamily;
            }
            if (run.style.textColor) {
              newRun.style.textColor = run.style.textColor;
            }
            // make sure that cell's underline not override style-run's underline
            if (run.style.isUnderline != null) {
              newRun.style.isUnderline = run.style.isUnderline;
            }
            data.styles.push(newRun);
            startOffset = run.endOffset;
          }
          if (startOffset != value.length) {
            data.styles.push({
              startOffset: startOffset,
              endOffset: value.length,
              style: cellStyle,
            });
          }
        } else if (cellStyle && Object.keys(cellStyle).length > 0) {
          if (value.length > 0) {
            data.styles.push({
              startOffset: 0,
              endOffset: value.length,
              style: cellStyle,
            });
          } else {
            data.text = ZeroWidthBlank;
            data.styles.push({
              startOffset: 0,
              endOffset: data.text.length,
              style: cellStyle,
            });
          }
        }

        const elements = self.input.generateElementsFromState(
          data.text,
          data.styles,
          self.input.linkRuns,
        );
        self.input.innerHTML = '';
        const contentsFrag = document.createDocumentFragment();
        for (const ele of elements) {
          contentsFrag.appendChild(ele);
        }
        self.input.append(contentsFrag);
      }

      if (self.input.lastElementChild) {
        // Move the editing cursor to the end of the `contenteditable`.
        // TODO: Once we have different elements in the `contenteditable`, make
        // sure this code block is adjusted for that.
        const selection = document.getSelection();
        const range = document.createRange();

        range.setStartAfter(self.input.lastElementChild);
        selection.removeAllRanges();
        selection.addRange(range);
        self.input.updateSelection();
      }
    }

    self.resizeEditInput(true);

    if (!noFocus) self.input.focus();
    self.input.addEventListener('click', self.stopPropagation);
    self.input.addEventListener('dblclick', self.stopPropagation);
    self.input.addEventListener('mouseup', self.stopPropagation);
    self.input.addEventListener('mousedown', self.stopPropagation);
    self.input.addEventListener('keydown', (e: KeyboardEvent) => {
      self.inputKeydown(e, inReplaceMode);
    });
    self.input.addEventListener('paste', function (e: ClipboardEvent) {
      e.preventDefault();

      self.input.buildHistoryState('OLD');
      // Only allow text/plain content into cell editor or style run for inside editor
      const text = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
      const html = e.clipboardData
        ? e.clipboardData
            .getData('text/html')
            .replace(new RegExp(`${ZeroWidthBlank}`, 'i'), '')
        : '';
      let pastedText = text;
      let acceptPasteHtml = false;
      let contentNodes: HTMLElement;

      if (html) {
        contentNodes = document.createElement('span');
        contentNodes.innerHTML = html;
        if (contentNodes.childNodes.length > 0) {
          for (let i = 0; i < contentNodes.childNodes.length; i++) {
            const child = contentNodes.childNodes[i];
            if (child instanceof HTMLMetaElement) {
              if (
                child.name === DatadocEditorId &&
                child.content === self.input.editorId
              ) {
                self.input.cleanPasteHTMLHyperlink(contentNodes);
                pastedText = contentNodes.innerHTML;
                acceptPasteHtml = true;
                break;
              }
            }
          }
        }
      }

      // if (document.queryCommandSupported('insertHTML')) {
      //   document.execCommand('insertHTML', false, pastedText);
      // } else {
      if (!acceptPasteHtml) {
        contentNodes = document.createElement('span');
        contentNodes.innerText = pastedText;
      }
      const range = document.getSelection().getRangeAt(0);
      range.deleteContents();
      range.insertNode(contentNodes);
      range.selectNodeContents(contentNodes);
      range.collapse(false);

      // const selection = document.getSelection();
      // selection.removeAllRanges();
      // selection.addRange(range);
      self.input.dispatchEvent(new Event('input'));

      self.input.updateSelection();
      self.input.reSelectOffset();
      // }
    });
    self.input.addEventListener('copy', (event: ClipboardEvent) => {
      const result = self.input.getSelectionDataForClipboard();
      if (result) {
        const copiedData = {
          'text/plain': result.plain,
          'text/html': result.html,
        };
        setDataToClipboard(copiedData, event.clipboardData);
        event.preventDefault();
      }
    });
    document.body.addEventListener(
      'mousedown',
      self.inputOnBodyMousedownHandler,
    );

    self.dispatchEvent('beginedit', { cell: cell, input: self.input });
    self.redrawCommit();
  };

  /**
   *  Change cell editor input style between formula and text mode
   */
  _updateCellEditorInputStyle = () => {
    const self = this.grid;
    if (!self.input) return;

    const cell = self.input.editCell;
    const inputStyle: any = {};
    const editorStyle: any = {};
    if (!this.isInFormulaMode()) {
      // inputStyle.fontSize = self.dp(cell.fontSize, self.userScale) + 'px';
      // inputStyle.fontWeight = cell.fontWeight ?? 'normal';
      // inputStyle.fontStyle = cell.fontStyle ?? 'normal';
      // inputStyle.textDecoration = cell.isStrikethrough ? 'line-through' : '';
      // inputStyle.fontFamily = cell.fontFamily
      //   ? cell.fontFamily
      //   : self.style.cellFontFamily;
      // inputStyle.color = cell.textColor ? cell.textColor : self.style.cellColor;
      inputStyle.backgroundColor = cell.backgroundColor
        ? cell.backgroundColor
        : 'white';

      // If a value inside table, cell editor should have the same aligntment as
      // the cell itself, which depends on column type.
      if (cell.table) {
        inputStyle.textAlign = cell.horizontalAlignment
          ? cell.horizontalAlignment
          : self.style.cellHorizontalAlignment;
      }
      editorStyle.textAlign = self.input.horizontalAlignment;
    } else {
      inputStyle.fontSize =
        self.dp(self.style.cellFontSize, self.userScale) + 'px';
      inputStyle.fontWeight = 'normal';
      inputStyle.fontStyle = 'normal';
      inputStyle.textDecoration = '';
      inputStyle.fontFamily = self.style.editCellFormulaFontFamily;
      inputStyle.color = self.style.cellColor;
      inputStyle.backgroundColor = self.style.cellBackgroundColor
        ? self.style.cellBackgroundColor
        : 'white';
      inputStyle.textAlign = 'left';
      editorStyle.textAlign = self.input.horizontalAlignment;
    }
    // Object.assign(self.input.style, inputStyle);
    Object.assign(self.input.style, editorStyle);

    if (self.input instanceof HTMLDivElement) {
      const childNodes = self.input.childNodes;
      for (let i = 0; i < childNodes.length; i++) {
        const child = childNodes[i];
        if (child instanceof HTMLElement)
          Object.assign(child.style, inputStyle);
      }
    }
  };

  /**
   * Check if cell editor is in formula mode
   */
  isInFormulaMode = () => {
    const inputValue = this.getInputValue();
    return inputValue
      ? inputValue.startsWith('=') ||
          inputValue.startsWith(ZeroWidthBlank + '=')
      : false;
  };

  appendTo = (e: HTMLElement) => {
    this.grid.parentNode = e as any;
    this.setDom();
  };
  setDom = () => {
    const self = this.grid;

    if (/^canvas$/i.test(self.parentNode.tagName)) {
      console.warn(
        'Canvas elements as parents are not supported. They should only be ' +
          'created and managed internally.',
      );
    }

    self.parentDOMNode = self.parentNode as any;

    self.controlInput = self.controlInput || document.createElement('input');
    self.controlInput.setAttribute('readonly', true as any);
    self.createInlineStyle(self.controlInput, 'canvas-datagrid-control-input');
    self.parentDOMNode.appendChild(self.controlInput);

    self.canvas = document.createElement('canvas');
    self.parentDOMNode.appendChild(self.canvas);
    self.createInlineStyle(self.canvas, 'canvas-datagrid');
    self.ctx = self.canvas.getContext('2d');
    self.ctx.textBaseline = 'middle';
    self.eventParent = self.canvas;
    self.canvas.style.background = self.style.gridBackgroundColor;

    self.parentNodeStyle = self.canvas.style;
    self.eventParent.addEventListener('scroll', self.resize as any, false);
    self.eventParent.addEventListener('touchstart', self.touchstart, false);
    self.eventParent.addEventListener('touchmove', self.touchmove, {
      passive: false,
    });
    self.eventParent.addEventListener('touchend', self.touchend, false);
    self.eventParent.addEventListener('touchcancel', self.touchcancel, false);
    self.eventParent.addEventListener('mousedown', self.mousedown, false);
    self.eventParent.addEventListener('dblclick', self.dblclick, false);
    self.eventParent.addEventListener('click', self.click, false);
    self.eventParent.addEventListener(
      'mousemove',
      self.mousemoveOnEventParent,
      false,
    );
    self.eventParent.addEventListener(
      'mouseup',
      self.mouseupOnEventParent,
      false,
    );
    self.eventParent.addEventListener(
      'contextmenu',
      self.contextmenuEvent,
      false,
    );
    self.eventParent.addEventListener('wheel', self.scrollWheel, false);

    // Listen to the window events when an item is being dragged.
    window.addEventListener('mouseup', self.mouseupOnWindow, false);
    window.addEventListener('mousemove', self.mousemoveOnWindow);

    /**
     * @todo check documents.font
     * @todo also check all listeners for outside element
     */
    document.fonts.addEventListener('loadingdone', self.fontsloadingdone);
    self.controlInput.addEventListener('copy', self.copy);
    self.controlInput.addEventListener('cut', self.cut);
    self.controlInput.addEventListener('paste', self.paste);
    self.controlInput.addEventListener('keypress', self.keypress, false);
    self.controlInput.addEventListener('keyup', self.keyup, false);
    self.controlInput.addEventListener('keydown', self.keydown, false);
    self.controlInput.addEventListener('focus', self.focus, false);
    self.controlInput.addEventListener('blur', self.blur, false);
    window.addEventListener('resize', self.resize as any);
  };

  /**
   * Handle a keyboard event that happens while editing a cell.
   * @param e Keyboard event to respond to.
   * @param inReplaceMode Whether to allow navigation with arrow keys.
   */
  inputKeydown = async (
    e: KeyboardEvent,
    inReplaceMode?: boolean,
    noIncludeHistory?: boolean,
  ) => {
    const self = this.grid;
    if (!self.input) return;

    const isReadOnly = self.input.isReadonly?.();

    if (e.key === 'Escape') {
      await self.endEdit(true); // end edit and abort the value change
      self.draw(true);
    } else if (
      e.key === 'Enter' &&
      self.attributes.multiLine &&
      e.altKey &&
      self.input instanceof HTMLDivElement &&
      !isReadOnly
    ) {
      self.inputValue = self.inputValue + '\n';
      self.input.scrollTop = self.input.scrollHeight;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      await self.endEdit();
      self.moveWithEnter(e.shiftKey, true);
    } else if (
      e.key === 'Tab' ||
      (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) &&
        inReplaceMode)
    ) {
      e.preventDefault();
      await self.endEdit();
      self.keydown(e);
    } else {
      if (!self.isInFormulaMode() || self.input.isHistoryAction(e)) {
        self.input.handleKeydown(e, noIncludeHistory);
      }

      if (isReadOnly && !self.input.isReadonlyAllowKey(e)) {
        // Not allow user to type/paste in text when editor is readonly
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  inputOnBodyMousedownHandler = (e: MouseEvent) => {
    const self = this.grid;
    if (
      e.target == (self.intf as any) ||
      e.target == self.canvas ||
      e.target == self.input ||
      ((e.target instanceof HTMLElement || e.target instanceof SVGSVGElement) &&
        e.target.dataset.grideditorcompanion) ||
      (e.target instanceof SVGPathElement &&
        e.target.parentElement.dataset.grideditorcompanion)
    ) {
      return;
    }
    self.endEdit();
  };

  /**
   * Check if grid editor for a cell is readonly or not. Presently, there are two
   * cases that the edior is not editable:
   * - Cells from table
   * - Cells with hyperlink data-format
   */
  isEditorReadOnly = () => {
    const editCell = this.grid.input.editCell;

    return (
      editCell?.isValueReadOnly || isHyperlinkDataFormat(editCell?.dataFormat)
    );
  };

  /**
   * Check if the given target is `eventParent`.
   * @param e To check.
   * @returns True if the given target is the grid.
   */
  isTargetEventParent = (e: EventTarget | Element) => {
    const self = this.grid;
    return e == self.shadowRoot?.host || e == self.eventParent;
  };
}
