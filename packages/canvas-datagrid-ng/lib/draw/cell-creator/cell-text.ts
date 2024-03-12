import { columnTypeToString } from '../../utils/column-types';
import type { DrawFrameCache } from '../frame-cache';
import type {
  ColumnType,
  GridPrivateProperties,
  NormalCellDescriptor,
} from '../../types';
import type { CellLine, CellText } from '../../types/cell';
import type { CellLinkedNode } from '../../types/drawing';
import type { CellCreator } from '.';
import { DrawUtils } from '../util';
import type {
  ComputedTextLine,
  FontStyleRun,
  StyleRun,
} from '../../types/style';
import { isHyperlinkDataFormat } from '../../data/formatters';

export class CellTextUtils {
  private readonly drawUtils: DrawUtils;
  constructor(
    private readonly self: GridPrivateProperties,
    private readonly frameCache: DrawFrameCache,
    private readonly cellCreator: CellCreator,
  ) {
    this.drawUtils = new DrawUtils(self);
  }

  /**
   * Format cell text.
   * @param cellNode A cell that needs formatting.
   */
  readonly formatCellText = (cellNode: CellLinkedNode) => {
    const { self, frameCache } = this;
    const { applyCellFontStyles } = this.drawUtils;
    const { source, cell } = cellNode;
    const header = cell.tableHeader ?? cell.header;
    const cellType: ColumnType = cell.valueType || 'string';

    // FIXME check the type of this `val`
    let val = '';

    const formatter = self.formatters[columnTypeToString(cellType)];

    if (!self.dispatchEvent('formatcellvalue', cell.event)) {
      const isHyperlink = isHyperlinkDataFormat(cell.dataFormat);

      if (isHyperlink && !cell.table) {
        val = self.formulaHyperlinkFormat(cell);
      } else if (cell.meta?.parserData) {
        // format cell formula data
        val = self.formulaFormat(cell);
      } else if (formatter) {
        val = formatter(cell.event);
      }
    }

    if (cell.isGrid) {
      self.dispatchEvent('rendercell', cell.event);
      if (cell.height !== source.rowHeight) {
        cell.height = source.rowHeight || self.style.cellHeightWithChildGrid;
        frameCache.checkScrollHeight = true;
      }
      cell.width = self.sizes.getColumnWidth(
        source.headerIndex,
        self.style.cellWidthWithChildGrid,
      );
    } else {
      // create text ref to see if height needs to expand
      if (val === undefined && !formatter) {
        console.warn(
          'canvas-datagrid: Unknown format ' +
            header.type +
            ' add a cellFormater',
        );
      }
      cell.formattedValue = val?.toString?.() ?? '';
      if (
        self.columnFilters &&
        self.columnFilters[val] !== undefined &&
        cell.isHeader
      ) {
        cell.formattedValue = self.attributes.filterTextPrefix + val;
      }

      self.addLinkRuns(cell);
      this.stylizeTotalRow(cell);

      // This must happen before wrapText for text measurement to be correct
      if (!self.dispatchEvent('formattext', cell.event)) {
        applyCellFontStyles(cell);
        if (!Array.isArray(cell.chips)) {
          cell.prefixText = this.wrapPrefixText(cellNode);
          if (!cell.textRotation) {
            cell.text = this.wrapText(cellNode);
          } else {
            cell.text = this.wrapRotationText(cellNode);
          }
        }
      }
    }
  };

  readonly stylizeTotalRow = (cell: NormalCellDescriptor) => {
    if (
      (!cell.tableContext?.isTotalRow && !cell.tableContext?.isSubtotalRow) ||
      !cell.tableContext?.summaryContext
    ) {
      return;
    }

    const { tableContext } = cell;
    const { summaryContext } = tableContext;

    const summaryFnText =
      cell.tableContext?.isSubtotalRow && !cell.tableContext.isTotalRow
        ? ''
        : ` (${summaryContext.fn.shortenedTitle})`;

    if (!cell.drawStyleRuns) cell.drawStyleRuns = [];
    cell.drawStyleRuns.push({
      startOffset: 0,
      endOffset: cell.formattedValue.length,
      style: {
        isBold: true,
      },
    });
    if (summaryFnText) {
      cell.drawStyleRuns.push({
        startOffset: cell.formattedValue.length,
        endOffset: cell.formattedValue.length + summaryFnText.length,
        style: {
          textColor: this.self.style.tableTotalRowFnColor,
        },
      });
      cell.formattedValue += summaryFnText;
    }
  };

  readonly wrapPrefixText = (cellNode: CellLinkedNode): CellLine => {
    const { self } = this;
    const { cell } = cellNode;
    if (!cell.prefixValue) return;
    const value = cell.prefixValue;
    const textWidth = self.ctx.measureText(value).width;
    const indentWidth = self.ctx.measureText('  ').width;
    // if cell has prefix text (accounting number format), horizontal
    // aligment always right
    cell.horizontalAlignment = 'right';
    const offsetLeft = cell.paddingLeft + cell.prefixWidth + indentWidth;
    cell.prefixWidth += textWidth + self.style.scaled.cellPaddingLeft;

    return {
      value,
      width: textWidth,
      height: cell.fontHeight,
      offsetLeft,
      offsetTop: Math.round((cell.calculatedLineHeight - cell.fontHeight) / 2),
      fontAscent: 0,
      x: 0,
      y: cell.calculatedLineHeight,
    };
  };

  readonly wrapText = (cellNode: CellLinkedNode): CellText => {
    const { self, cellCreator } = this;
    const { applyCellFontStyles } = this.drawUtils;
    const { cell } = cellNode;

    if (!cell.formattedValue) {
      return {
        lines: [
          {
            width: 0,
            height: 0,
            value: '',
            offsetLeft: 0,
            offsetTop: 0,
            fontAscent: 0,
            x: 0,
            y: 0,
          },
        ],
        width: 0,
        coveredCellCount: 1,
        height: cell.calculatedLineHeight,
      };
    }

    cell.subsumedRightCellCount = 0;
    cell.subsumedLeftCellCount = 0;
    cell.contentWidth = cell.width;

    // There are cases where we don't want the paddings to be ignored such as
    // when we use them with table headers to limit the text width when it is
    // obstructed by the type icon and quick filter buttons.
    const ignorePaddingForEllipsis = !cell.isTableHeader;
    const originalColumnWidth =
      cellNode.source?.originalColumnWidth ?? cell.width;
    const horizontalAlignment = cell.horizontalAlignment;
    const allowEllipses =
      cell.header.truncateWithEllipsis !== false &&
      cell.wrapMode !== 'overflowing';
    let allowLeftEllipsis = allowEllipses,
      allowRightEllipsis = allowEllipses;

    // Available with to put text into
    let availableWidth: number = cell.paddedWidth;
    // Only use if we have textAlign center, keep track of left/right space
    // to wrap text on each side separately
    let leftAvailableWidth = 0;
    let rightAvailableWidth = 0;
    let maxLeftContentWidth = 0;
    let maxRightContentWidth = 0;
    // Left/right empty cells width is usable space on left/right of current
    // cell to put overflowing text on
    let leftEmptyCellsWidth = 0;
    let rightEmptyCellsWidth = 0;
    if (cell.wrapMode === 'overflowing') {
      if (horizontalAlignment === 'left' || horizontalAlignment === 'center') {
        let prevNode = cellNode;
        let curNode = cellNode.nextSibling;
        while (
          curNode &&
          (curNode.cell?.isEmpty ||
            curNode.source?.isRightOverflowingInvisibleCell)
        ) {
          rightEmptyCellsWidth += curNode.cell.isEmpty
            ? curNode.cell.width
            : curNode.cell.width - originalColumnWidth;
          prevNode = curNode;
          curNode = curNode.nextSibling;
        }
        if (prevNode !== cellNode) {
          rightEmptyCellsWidth - prevNode.cell.paddingRight;
        }
        // Since we are only working with visible cells, we need to check if
        // the overflowing cell is in the frozen area, or if it is the last drawn
        // cell due to available space, and check if it really needs ellipses.
        if (cell.truncateWithEllipsis) {
          if (
            curNode ||
            prevNode.cell.columnIndex + 1 >= self.dataSource.state.cols
          ) {
            allowRightEllipsis = true;
          } else if (!curNode) {
            allowRightEllipsis = false;
          }
        }
      }

      if (horizontalAlignment === 'right' || horizontalAlignment === 'center') {
        let prevNode = cellNode;
        let curNode = cellNode.prevSibling;
        while (
          curNode &&
          (curNode.cell?.isEmpty ||
            curNode.source?.isLeftOverflowingInvisibleCell)
        ) {
          // Merge padding in the boundaries
          leftEmptyCellsWidth += curNode.cell.isEmpty
            ? curNode.cell.width
            : curNode.cell.width - curNode.source.originalColumnWidth;
          prevNode = curNode;
          curNode = curNode.prevSibling;
        }
        if (prevNode !== cellNode) {
          leftEmptyCellsWidth - prevNode.cell.paddingLeft;
        }

        if (cell.truncateWithEllipsis) {
          if (curNode || prevNode.cell.columnIndex <= 0) {
            allowLeftEllipsis = true;
          } else if (!curNode) {
            allowLeftEllipsis = false;
          }
        }
      }
    }

    if (horizontalAlignment === 'left') {
      if (rightEmptyCellsWidth > 0) {
        availableWidth =
          cell.paddedWidth + cell.paddingRight + rightEmptyCellsWidth;
      }
      availableWidth = Math.max(availableWidth - cell.prefixWidth, 0);
    } else if (horizontalAlignment === 'right') {
      if (leftEmptyCellsWidth > 0) {
        availableWidth =
          cell.paddedWidth + cell.paddingLeft + leftEmptyCellsWidth;
      }
      availableWidth = Math.max(availableWidth - cell.prefixWidth, 0);
    } else {
      if (rightEmptyCellsWidth > 0) {
        rightAvailableWidth =
          cell.width - originalColumnWidth / 2 + rightEmptyCellsWidth;
      } else {
        rightAvailableWidth = cell.width - originalColumnWidth / 2;
      }
      rightAvailableWidth = Math.max(
        rightAvailableWidth - cell.prefixWidth / 2,
        0,
      );

      if (leftEmptyCellsWidth > 0) {
        leftAvailableWidth =
          cell.width - originalColumnWidth / 2 + leftEmptyCellsWidth;
      } else {
        leftAvailableWidth = cell.width - originalColumnWidth / 2;
      }
      leftAvailableWidth = Math.max(
        leftAvailableWidth - cell.prefixWidth / 2,
        0,
      );
    }

    const wrap = cell.wrapMode === 'multi-line',
      isStyleRun = cell.drawStyleRuns?.length > 0,
      rawLines = cell.formattedValue.split(/\r\n|\r|\n/),
      ellipsisText = cell.truncateWithEllipsis
        ? self.attributes.ellipsisText
        : '',
      ellipsisDimensions = self.ctx.measureText(ellipsisText),
      ellipsisWidth = ellipsisDimensions.width,
      lines = [] as CellLine[];
    let textOffset = 0,
      currStyleRunIndex = 0;
    const newLine = (haveFontStyle = false, startOffset = 0): CellLine => {
      const height = cell.fontHeight;
      const line: CellLine = {
        value: '',
        width: 0,
        height,
        offsetLeft: 0,
        offsetTop: Math.round((cell.calculatedLineHeight - height) / 2),
        fontAscent: ellipsisDimensions.actualBoundingBoxAscent,
        x: 0,
        y: cell.calculatedLineHeight * lines.length,
      };
      if (haveFontStyle) {
        line.fontStyles = [
          {
            startOffset: startOffset,
            endOffset: startOffset,
            x: 0,
            width: 0,
            height: line.height,
            currentStyleRunIdx: currStyleRunIndex,
            fontStyle: {
              style: cell.style,
              fontSize: cell.fontSize,
              fontFamily: cell.fontFamily,
              fontWeight: cell.fontWeight,
              fontStyle: cell.fontStyle,
              isStrikethrough: cell.isStrikethrough,
              isUnderline: cell.isUnderline,
              textColor: cell.textColor,
            },
          },
        ];
      }
      lines.push(line);
      return line;
    };
    const hardWrapWord = (
      line: CellLine,
      maxWidth: number,
      word: string,
      spaceWidth?: number,
      dir?: 'to-left' | 'to-right',
    ) => {
      spaceWidth = spaceWidth || 0;
      dir = dir || 'to-right';

      let remaining = word.slice();
      let remainingUnfit = '';
      if (dir === 'to-right') {
        while (remaining.length > 0) {
          const left =
            remaining.length > 1
              ? remaining.slice(0, Math.floor(remaining.length / 2))
              : remaining;
          if (left.length === remaining.length) {
            remaining = '';
          } else if (remaining.length > 0) {
            remaining = remaining.slice(left.length);
          }

          const measure = self.ctx.measureText(left);
          if (
            line.width + measure.width <= maxWidth - spaceWidth ||
            (left.length === 1 && line.value.length === 0)
          ) {
            line.width += measure.width;
            line.value += left;
          } else {
            remainingUnfit = remaining + remainingUnfit;
            if (left.length > 1) {
              remaining = left;
            } else if (
              spaceWidth > 0 &&
              line.value.length >= 2 &&
              maxWidth - line.width < spaceWidth
            ) {
              // Need to make space, so shrink the line value by 2 characters.
              remaining = line.value.slice(line.value.length - 2);
              line.value = line.value.slice(0, line.value.length - 2);
              line.width -= self.ctx.measureText(remaining).width;
            } else {
              remainingUnfit = left + remainingUnfit;
              break;
            }
          }
        }
      } else {
        while (remaining.length > 0) {
          const left =
            remaining.length > 1
              ? remaining.slice(Math.ceil(remaining.length / 2))
              : remaining;
          if (left.length === remaining.length) {
            remaining = '';
          } else if (remaining.length > 0) {
            remaining = remaining.slice(0, -left.length);
          }

          const measure = self.ctx.measureText(left);
          if (
            line.width + measure.width <= maxWidth - spaceWidth ||
            (left.length === 1 && line.value.length === 0)
          ) {
            line.width += measure.width;
            line.value = left + line.value;
          } else {
            remainingUnfit = remainingUnfit + remaining;
            if (left.length > 1) {
              remaining = left;
            } else if (
              spaceWidth > 0 &&
              line.value.length >= 2 &&
              maxWidth - line.width < spaceWidth
            ) {
              // Need to make space, so shrink the line value by 2 characters.
              remaining = line.value.slice(0, 2);
              line.value = line.value.slice(2);
              line.width -= self.ctx.measureText(remaining).width;
            } else {
              remainingUnfit = remainingUnfit + left;
              break;
            }
          }
        }
      }

      return remainingUnfit;
    };

    // Use for wrapping text from left to right direction, suitable for textAlign left.
    // It will also be used in case of wrapping text in multiple lines
    const wrapTextLeftToRight = (
      words: string[],
      availableWidth: number,
      allowEllipsis: boolean,
    ) => {
      let line = newLine(isStyleRun, 0);
      if (isStyleRun && currStyleRunIndex < cell.drawStyleRuns.length) {
        const curStyleRun = cell.drawStyleRuns[currStyleRunIndex];
        if (
          textOffset > curStyleRun.startOffset &&
          textOffset < curStyleRun.endOffset
        ) {
          line.fontStyles[0].fontStyle = {
            style: cell.style,
            fontSize: curStyleRun.style.fontSize || cell.fontSize,
            fontFamily: curStyleRun.style.fontFamily || cell.fontFamily,
            fontWeight: curStyleRun.style.isBold ? 'bold' : cell.fontWeight,
            fontStyle: curStyleRun.style.isItalic ? 'italic' : cell.fontStyle,
            isStrikethrough:
              curStyleRun.style.isStrikethrough || cell.isStrikethrough,
            isUnderline: curStyleRun.style.isUnderline ?? cell.isUnderline,
            textColor: curStyleRun.style.textColor || cell.textColor,
          };
        }
      }
      let lastSpaceIndex = -1;
      let lastSpaceWordIndex = -1;

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        let measureWidth = self.ctx.measureText(word).width;
        if (isStyleRun) {
          const curStyleRun = cell.drawStyleRuns[currStyleRunIndex];
          if (
            currStyleRunIndex >= cell.drawStyleRuns.length ||
            curStyleRun.startOffset >= textOffset + word.length
          ) {
            const prevFontStyle = line.fontStyles[line.fontStyles.length - 1];
            prevFontStyle.endOffset += word.length;
            prevFontStyle.width += measureWidth;
          } else {
            if (
              curStyleRun.startOffset >= textOffset &&
              curStyleRun.startOffset < textOffset + word.length
            ) {
              const height = curStyleRun.style.fontSize
                ? curStyleRun.style.fontSize * self.scale
                : line.height;
              line.fontStyles.push({
                startOffset:
                  curStyleRun.startOffset - textOffset + line.value.length,
                endOffset:
                  curStyleRun.startOffset - textOffset + line.value.length,
                x: line.width,
                width: 0,
                height: height,
                currentStyleRunIdx: currStyleRunIndex,
                fontStyle: {
                  style: cell.style,
                  fontSize: curStyleRun.style.fontSize || cell.fontSize,
                  fontFamily: curStyleRun.style.fontFamily || cell.fontFamily,
                  fontWeight: curStyleRun.style.isBold
                    ? 'bold'
                    : cell.fontWeight,
                  fontStyle: curStyleRun.style.isItalic
                    ? 'italic'
                    : cell.fontStyle,
                  isStrikethrough:
                    curStyleRun.style.isStrikethrough || cell.isStrikethrough,
                  isUnderline:
                    curStyleRun.style.isUnderline ?? cell.isUnderline,
                  textColor: curStyleRun.style.textColor || cell.textColor,
                },
              });
              applyCellFontStyles(
                line.fontStyles[line.fontStyles.length - 1].fontStyle,
              );
              measureWidth = self.ctx.measureText(word).width;
            }
            if (curStyleRun.endOffset > textOffset + word.length) {
              const prevFontStyle = line.fontStyles[line.fontStyles.length - 1];
              prevFontStyle.endOffset += word.length;
              prevFontStyle.width += measureWidth;
            } else {
              const prevFontStyle = line.fontStyles[line.fontStyles.length - 1];
              prevFontStyle.endOffset += word.length;
              prevFontStyle.width += measureWidth;
              currStyleRunIndex++;
              applyCellFontStyles(cell);
              line.fontStyles.push({
                startOffset:
                  curStyleRun.endOffset - textOffset + line.value.length,
                endOffset:
                  curStyleRun.endOffset - textOffset + line.value.length,
                x: line.width + measureWidth,
                width: 0,
                height: line.height,
                currentStyleRunIdx: currStyleRunIndex,
                fontStyle: {
                  style: cell.style,
                  fontSize: cell.fontSize,
                  fontFamily: cell.fontFamily,
                  fontWeight: cell.fontWeight,
                  fontStyle: cell.fontStyle,
                  isStrikethrough: cell.isStrikethrough,
                  isUnderline: cell.isUnderline,
                  textColor: cell.textColor,
                },
              });
            }
          }
          textOffset += word.length;
        }
        const fits = line.width + measureWidth <= availableWidth;

        if (fits) {
          if (isStyleRun && word === ' ') {
            lastSpaceIndex = line.value.length;
            lastSpaceWordIndex = i;
          }
          line.width += measureWidth;
          line.value += word;
        } else if (wrap) {
          if (isStyleRun) {
            let updatedWords: string[] = null;
            line.fontStyles = line.fontStyles.filter(
              (fs) => fs.startOffset !== fs.endOffset,
            );
            let needUpdateLine = true;
            if (line.value.length == 0 || lastSpaceIndex === -1) {
              const remaining = hardWrapWord(line, availableWidth, word);
              if (remaining.length > 0) {
                const fs = line.fontStyles[line.fontStyles.length - 1];
                fs.endOffset -= remaining.length;
                fs.width -= self.ctx.measureText(remaining).width;
                textOffset -= remaining.length;
                updatedWords = words.slice(i);
                updatedWords[0] = remaining;
                currStyleRunIndex = fs.currentStyleRunIdx;
                needUpdateLine = false;
              }
            }
            if (needUpdateLine) {
              if (
                word !== ' ' &&
                lastSpaceIndex !== -1 &&
                lastSpaceWordIndex !== i - 1
              ) {
                let sliceEndIdx = line.fontStyles.length;
                for (let j = line.fontStyles.length - 1; j >= 0; j--) {
                  sliceEndIdx = j + 1;
                  const fs = line.fontStyles[j];
                  if (
                    fs.startOffset <= lastSpaceIndex &&
                    fs.endOffset > lastSpaceIndex
                  ) {
                    const s = line.value.slice(
                      lastSpaceIndex + 1,
                      fs.endOffset,
                    );
                    if (s) {
                      applyCellFontStyles(fs.fontStyle);
                      const sWidth = self.ctx.measureText(s).width;
                      fs.width -= sWidth;
                    }
                    fs.endOffset = lastSpaceIndex + 1;
                    currStyleRunIndex = fs.currentStyleRunIdx;
                    break;
                  }
                }
                line.fontStyles = line.fontStyles.slice(0, sliceEndIdx);
                textOffset -=
                  line.value.length - (lastSpaceIndex + 1) + word.length;
                line.value = line.value.slice(0, lastSpaceIndex + 1);
                line.width = line.fontStyles.reduce(function (accumulator, fs) {
                  return accumulator + fs.width;
                }, 0);
                updatedWords = words.slice(lastSpaceWordIndex + 1);
                needUpdateLine = false;
              }
              if (needUpdateLine) {
                const fs = line.fontStyles[line.fontStyles.length - 1];
                fs.endOffset -= word.length;
                fs.width -= measureWidth;
                textOffset -= word.length;
                updatedWords = words.slice(i);
                currStyleRunIndex = fs.currentStyleRunIdx;
              }
            }
            wrapTextLeftToRight(updatedWords, availableWidth, allowEllipsis);
            break;
          } else {
            if (line.value.length > 0) {
              line = newLine(isStyleRun, 0);
            }
            let remaining = word;
            while (remaining.length > 0) {
              remaining = hardWrapWord(line, availableWidth, remaining);
              if (remaining.length > 0) line = newLine();
            }
          }
        } else if (
          allowEllipsis &&
          cell.truncateWithEllipsis &&
          cell.formattedValue.length > 1
        ) {
          if (isStyleRun) {
            const newEllipsisWidth = self.ctx.measureText(ellipsisText).width;
            const remaining = hardWrapWord(
              line,
              availableWidth +
                (ignorePaddingForEllipsis ? cell.paddingRight : 0),
              word,
              newEllipsisWidth,
            );
            const prevFontStyle = line.fontStyles[line.fontStyles.length - 1];
            // Make sure the line has at least one visible character.
            if (remaining.length >= 1 && line.value.length <= 0) {
              line.value = remaining.charAt(0);
              line.width = self.ctx.measureText(line.value).width;
              prevFontStyle.endOffset = 1;
              prevFontStyle.width = line.width;
            }
            line.width += newEllipsisWidth;
            line.value += ellipsisText;
            prevFontStyle.endOffset += ellipsisText.length;
            prevFontStyle.width += newEllipsisWidth;
          } else {
            const remaining = hardWrapWord(
              line,
              availableWidth +
                (ignorePaddingForEllipsis ? cell.paddingRight : 0),
              word,
              ellipsisWidth,
            );
            // Make sure the line has at least one visible character.
            if (remaining.length >= 1 && line.value.length <= 0) {
              line.value = remaining.charAt(0);
              line.width = self.ctx.measureText(line.value).width;
            }
            line.width += ellipsisWidth;
            line.value += ellipsisText;
          }
          break;
        } else {
          // Allow the text to overflow only by one character, and do not allow
          // it to be more than the space available.
          const remaining = hardWrapWord(
            line,
            availableWidth + cell.paddingLeft + cell.paddingRight,
            word,
          );
          if (remaining.length > 0) {
            const singleLetter = remaining.charAt(0);
            line.width += self.ctx.measureText(singleLetter).width;
            line.value += singleLetter;
            break;
          }
        }
      }
    };

    // Use for wrapping text from right to left direction, suitable for textAlign right.
    const wrapTextRightToLeft = (
      words: string[],
      availableWidth: number,
      allowEllipsis: boolean,
    ) => {
      let remaininglineLength = 0;
      if (isStyleRun) {
        remaininglineLength = words.reduce(function (accumulator, word) {
          return accumulator + word.length;
        }, 0);
      }
      const line = newLine(isStyleRun, remaininglineLength);

      for (let i = words.length - 1; i >= 0; i--) {
        const word = words[i];
        let measureWidth = self.ctx.measureText(word).width;
        if (isStyleRun) {
          const curStyleRun = cell.drawStyleRuns[currStyleRunIndex];
          if (
            currStyleRunIndex < 0 ||
            curStyleRun.endOffset <=
              textOffset + remaininglineLength - word.length
          ) {
            const prevFontStyle = line.fontStyles[line.fontStyles.length - 1];
            prevFontStyle.startOffset -= word.length;
            prevFontStyle.width += measureWidth;
            prevFontStyle.x -= measureWidth;
          } else {
            const currTextOffset = textOffset + remaininglineLength;
            const styleRun = cell.drawStyleRuns[currStyleRunIndex];
            if (
              styleRun.endOffset <= currTextOffset &&
              styleRun.endOffset > currTextOffset - word.length
            ) {
              const height = styleRun.style.fontSize
                ? styleRun.style.fontSize * self.scale
                : line.height;
              line.fontStyles.push({
                startOffset: styleRun.endOffset - textOffset,
                endOffset: styleRun.endOffset - textOffset,
                x: -line.width,
                width: 0,
                height: height,
                currentStyleRunIdx: currStyleRunIndex,
                fontStyle: {
                  style: cell.style,
                  fontSize: styleRun.style.fontSize || cell.fontSize,
                  fontFamily: styleRun.style.fontFamily || cell.fontFamily,
                  fontWeight: styleRun.style.isBold ? 'bold' : cell.fontWeight,
                  fontStyle: styleRun.style.isItalic
                    ? 'italic'
                    : cell.fontStyle,
                  isStrikethrough:
                    styleRun.style.isStrikethrough || cell.isStrikethrough,
                  isUnderline: styleRun.style.isUnderline ?? cell.isUnderline,
                  textColor: styleRun.style.textColor || cell.textColor,
                },
              });
              applyCellFontStyles(
                line.fontStyles[line.fontStyles.length - 1].fontStyle,
              );
              measureWidth = self.ctx.measureText(word).width;
            }
            if (
              styleRun.startOffset <
              textOffset + remaininglineLength - word.length
            ) {
              const prevFontStyle = line.fontStyles[line.fontStyles.length - 1];
              prevFontStyle.startOffset -= word.length;
              prevFontStyle.width += measureWidth;
              prevFontStyle.x -= measureWidth;
            } else {
              const prevFontStyle = line.fontStyles[line.fontStyles.length - 1];
              prevFontStyle.startOffset -= word.length;
              prevFontStyle.width += measureWidth;
              prevFontStyle.x -= measureWidth;
              currStyleRunIndex--;
              applyCellFontStyles(cell);
              line.fontStyles.push({
                startOffset: remaininglineLength - word.length,
                endOffset: remaininglineLength - word.length,
                x: -line.width - measureWidth,
                width: 0,
                height: line.height,
                currentStyleRunIdx: currStyleRunIndex,
                fontStyle: {
                  style: cell.style,
                  fontSize: cell.fontSize,
                  fontFamily: cell.fontFamily,
                  fontWeight: cell.fontWeight,
                  fontStyle: cell.fontStyle,
                  isStrikethrough: cell.isStrikethrough,
                  isUnderline: cell.isUnderline,
                  textColor: cell.textColor,
                },
              });
            }
          }
          remaininglineLength -= word.length;
        }
        // const measure = self.ctx.measureText(word);
        const fits = line.width + measureWidth <= availableWidth;

        if (fits) {
          line.width += measureWidth;
          line.value = word + line.value;
        } else if (
          allowEllipsis &&
          cell.truncateWithEllipsis &&
          cell.formattedValue.length > 1
        ) {
          if (isStyleRun) {
            line.fontStyles = line.fontStyles.filter(
              (fs) => fs.startOffset < fs.endOffset,
            );
            const newEllipsisWidth = self.ctx.measureText(ellipsisText).width;
            const prevFontStyle = line.fontStyles[line.fontStyles.length - 1];
            const lineLengthBefore = line.value.length + word.length;
            const lineWidthBefore = line.width + measureWidth;
            const remaining = hardWrapWord(
              line,
              availableWidth,
              word,
              newEllipsisWidth,
              'to-left',
            );
            // Make sure the line has at least one visible character.
            if (remaining.length >= 1 && line.value.length <= 0) {
              line.value = remaining.slice(-1);
              line.width = self.ctx.measureText(line.value).width;
            }
            line.width += newEllipsisWidth;
            line.value = ellipsisText + line.value;
            const lineLengthAfter = line.value.length;
            const lineWidthAfter = line.width;
            prevFontStyle.startOffset -= lineLengthAfter - lineLengthBefore;
            const diffOffset = prevFontStyle.startOffset;
            let newLineWidth = 0;
            for (let i = 0; i < line.fontStyles.length; i++) {
              line.fontStyles[i].startOffset -= diffOffset;
              line.fontStyles[i].endOffset -= diffOffset;
              if (line.fontStyles[i].endOffset <= 0) {
                line.fontStyles[i].startOffset = 0;
                line.fontStyles[i].startOffset = 0;
                line.fontStyles[i].width = 0;
              } else if (line.fontStyles[i].startOffset <= 0) {
                const s = line.value.slice(
                  -line.fontStyles[i].startOffset,
                  line.fontStyles[i].endOffset,
                );
                applyCellFontStyles(line.fontStyles[i].fontStyle);
                if (s) {
                  line.fontStyles[i].width = self.ctx.measureText(s).width;
                  line.fontStyles[i].x = -line.width;
                  newLineWidth += line.fontStyles[i].width;
                }
                line.fontStyles[i].startOffset = 0;
              } else {
                newLineWidth += line.fontStyles[i].width;
              }
            }
            line.width = newLineWidth;
          } else {
            const remaining = hardWrapWord(
              line,
              availableWidth,
              word,
              ellipsisWidth,
              'to-left',
            );
            // Make sure the line has at least one visible character.
            if (remaining.length >= 1 && line.value.length <= 0) {
              line.value = remaining.slice(-1);
              line.width = self.ctx.measureText(line.value).width;
            }
            line.width += ellipsisWidth;
            line.value = ellipsisText + line.value;
          }
          break;
        } else {
          // Allow the text to overflow only by one character, and do not allow
          // it to be more than the space available.
          const remaining = hardWrapWord(
            line,
            availableWidth + cell.paddingLeft + cell.paddingRight,
            word,
            0,
            'to-left',
          );
          if (remaining.length > 0) {
            const singleLetter = remaining.slice(-1);
            line.width += self.ctx.measureText(singleLetter).width;
            line.value = singleLetter + line.value;
            break;
          }
        }
      }
    };

    // Use for wrapping text from left to right direction for case have style run, suitable for textAlign right.
    const wrapTextLeftToRightWithFontStyles = (
      value: string,
      availableWidth: number,
      allowEllipsis: boolean,
      fontStyles: FontStyleRun[],
    ) => {
      if (!isStyleRun) {
        return;
      }
      let line = newLine();
      const updatedFontStyles: FontStyleRun[] = [];
      for (const fs of fontStyles) {
        applyCellFontStyles(fs.fontStyle);
        const measureWidth = fs.width;
        const word = value.slice(fs.startOffset, fs.endOffset);
        const fits = line.width + measureWidth <= availableWidth;

        if (fits) {
          line.width += measureWidth;
          line.value += word;
          updatedFontStyles.push(fs);
        } else if (wrap) {
          if (line.value.length > 0) {
            line = newLine();
          }

          let remaining = word;
          while (remaining.length > 0) {
            remaining = hardWrapWord(line, availableWidth, remaining);
            if (remaining.length > 0) line = newLine();
          }
          updatedFontStyles.push(fs);
        } else if (
          allowEllipsis &&
          cell.truncateWithEllipsis &&
          cell.formattedValue.length > 1
        ) {
          const newEllipsisWidth = self.ctx.measureText(ellipsisText).width;
          const remaining = hardWrapWord(
            line,
            availableWidth + cell.paddingRight,
            word,
            newEllipsisWidth,
          );
          // Make sure the line has at least one visible character.
          if (remaining.length >= 1 && line.value.length <= 0) {
            line.value = remaining.charAt(0);
            line.width = self.ctx.measureText(line.value).width;
            fs.endOffset = 1;
            fs.width = line.width;
          }
          line.width += newEllipsisWidth;
          line.value += ellipsisText;
          fs.endOffset += ellipsisText.length;
          fs.width += newEllipsisWidth;
          updatedFontStyles.push(fs);
          break;
        } else {
          // Allow the text to overflow only by one character, and do not allow
          // it to be more than the space available.
          const remaining = hardWrapWord(
            line,
            availableWidth + cell.paddingLeft + cell.paddingRight,
            word,
          );
          if (remaining.length > 0) {
            const singleLetter = remaining.charAt(0);
            const simgleLetterWidth = self.ctx.measureText(singleLetter).width;
            line.width += simgleLetterWidth;
            line.value += singleLetter;
            fs.width -=
              self.ctx.measureText(remaining).width - simgleLetterWidth;
            fs.endOffset = fs.startOffset + word.length - remaining.length + 1;
            updatedFontStyles.push(fs);
            break;
          }
        }
      }
      line.fontStyles = updatedFontStyles;
      line.width = line.fontStyles.reduce(function (accumulator, fs) {
        return accumulator + fs.width;
      }, 0);
    };

    const wrapTextOverflowCenter = (
      rawLine: string,
      leftAvailableWidth: number,
      rightAvailableWidth: number,
      allowLeftEllipsis: boolean,
      allowRightEllipsis: boolean,
    ) => {
      let offsetXDelta = 0;
      if (cellNode.source.isLeftOverflowingInvisibleCell) {
        // Not care about available width on left side of cell
        leftAvailableWidth = +Infinity;
      } else if (cellNode.source.isRightOverflowingInvisibleCell) {
        // Not care about available width on right side of cell
        rightAvailableWidth = +Infinity;
        // Hidden overflow cell startX is different from visible cell
        offsetXDelta = cell.width - originalColumnWidth;
      }
      let currStyleIdx = currStyleRunIndex;

      let fullTextWidth = 0;
      let fontStyles: FontStyleRun[] = [];
      if (!isStyleRun || currStyleIdx >= cell.drawStyleRuns.length) {
        fullTextWidth = self.ctx.measureText(rawLine).width;
      } else {
        fontStyles.push({
          startOffset: 0,
          endOffset: 0,
          x: 0,
          width: 0,
          height: cell.fontHeight,
          currentStyleRunIdx: currStyleRunIndex,
          fontStyle: {
            style: cell.style,
            fontSize: cell.fontSize,
            fontFamily: cell.fontFamily,
            fontWeight: cell.fontWeight,
            fontStyle: cell.fontStyle,
            isStrikethrough: cell.isStrikethrough,
            isUnderline: cell.isUnderline,
            textColor: cell.textColor,
          },
        });
        const curStyleRun = cell.drawStyleRuns[currStyleIdx];
        if (
          currStyleIdx >= cell.drawStyleRuns.length ||
          curStyleRun.startOffset >= textOffset + rawLine.length
        ) {
          fullTextWidth = self.ctx.measureText(rawLine).width;
          textOffset += rawLine.length;
          const prevFontStyle = fontStyles[fontStyles.length - 1];
          prevFontStyle.endOffset += rawLine.length;
          prevFontStyle.width += fullTextWidth;
        } else {
          let currTextOffset = textOffset;
          for (let i = currStyleIdx; i < cell.drawStyleRuns.length; i++) {
            const styleRun = cell.drawStyleRuns[i];
            if (
              styleRun.startOffset >= textOffset &&
              styleRun.startOffset < textOffset + rawLine.length
            ) {
              const s = rawLine.slice(
                currTextOffset - textOffset,
                styleRun.startOffset - textOffset,
              );
              if (s) {
                const sWidth = self.ctx.measureText(s).width;
                fullTextWidth += sWidth;
                const prevFontStyle = fontStyles[fontStyles.length - 1];
                prevFontStyle.endOffset += s.length;
                prevFontStyle.width += sWidth;
              }
              const height = styleRun.style.fontSize
                ? styleRun.style.fontSize * self.scale
                : cell.fontHeight;
              fontStyles.push({
                startOffset: styleRun.startOffset - textOffset,
                endOffset: styleRun.startOffset - textOffset,
                x: fullTextWidth,
                width: 0,
                height: height,
                currentStyleRunIdx: currStyleRunIndex,
                fontStyle: {
                  style: cell.style,
                  fontSize: styleRun.style.fontSize || cell.fontSize,
                  fontFamily: styleRun.style.fontFamily || cell.fontFamily,
                  fontWeight: styleRun.style.isBold ? 'bold' : cell.fontWeight,
                  fontStyle: styleRun.style.isItalic
                    ? 'italic'
                    : cell.fontStyle,
                  isStrikethrough:
                    styleRun.style.isStrikethrough || cell.isStrikethrough,
                  isUnderline: styleRun.style.isUnderline ?? cell.isUnderline,
                  textColor: styleRun.style.textColor || cell.textColor,
                },
              });
              applyCellFontStyles(fontStyles[fontStyles.length - 1].fontStyle);
              currTextOffset = styleRun.startOffset - textOffset;
            }
            if (styleRun.endOffset > textOffset + rawLine.length) {
              const s = rawLine.slice(currTextOffset - textOffset);
              const sWidth = self.ctx.measureText(s).width;
              const prevFontStyle = fontStyles[fontStyles.length - 1];
              prevFontStyle.endOffset += s.length;
              prevFontStyle.width += sWidth;
              fullTextWidth += sWidth;
              currTextOffset += s.length;
              break;
            } else {
              const s = rawLine.slice(
                currTextOffset - textOffset,
                styleRun.endOffset - textOffset,
              );
              const sWidth = self.ctx.measureText(s).width;
              const prevFontStyle = fontStyles[fontStyles.length - 1];
              prevFontStyle.endOffset += s.length;
              prevFontStyle.width += sWidth;
              fullTextWidth += sWidth;
              currTextOffset = styleRun.endOffset;
              currStyleIdx++;
              applyCellFontStyles(cell);
              fontStyles.push({
                startOffset: styleRun.endOffset - textOffset,
                endOffset: styleRun.endOffset - textOffset,
                x: fullTextWidth,
                width: 0,
                height: cell.fontHeight,
                currentStyleRunIdx: currStyleIdx,
                fontStyle: {
                  style: cell.style,
                  fontSize: cell.fontSize,
                  fontFamily: cell.fontFamily,
                  fontWeight: cell.fontWeight,
                  fontStyle: cell.fontStyle,
                  isStrikethrough: cell.isStrikethrough,
                  isUnderline: cell.isUnderline,
                  textColor: cell.textColor,
                },
              });
            }
          }
          if (
            fontStyles &&
            fontStyles.length > 0 &&
            currTextOffset < textOffset + rawLine.length
          ) {
            const s = rawLine.slice(currTextOffset - textOffset);
            const sWidth = self.ctx.measureText(s).width;
            const prevFontStyle = fontStyles[fontStyles.length - 1];
            prevFontStyle.endOffset += s.length;
            prevFontStyle.width += sWidth;
            fullTextWidth += sWidth;
          }
        }
        fontStyles = fontStyles.filter((fs) => fs.startOffset !== fs.endOffset);
      }
      const halfTextWidth = fullTextWidth / 2;
      const truncateLeft = leftAvailableWidth < halfTextWidth;
      const truncateRight = rightAvailableWidth < halfTextWidth;
      const leftContentWidth = Math.min(leftAvailableWidth, halfTextWidth);
      const rightContentWidth = Math.min(rightAvailableWidth, halfTextWidth);

      if ((!truncateLeft && !truncateRight) || rawLine.length <= 3) {
        const line = newLine();
        line.width = fullTextWidth;
        line.value = rawLine;
        line.offsetLeft =
          originalColumnWidth / 2 - halfTextWidth + offsetXDelta;
        line.fontStyles = fontStyles;
      } else {
        const words = updateWordsWithStyleRuns(
          rawLine.split(/(\s)/),
          currStyleRunIndex,
        );
        const line: CellLine = {
          value: '',
          width: 0,
          height: cell.fontHeight,
          offsetLeft: 0,
          offsetTop: 0,
          fontAscent: ellipsisDimensions.actualBoundingBoxAscent,
          x: 0,
          y: 0,
        };

        let startWordIndex = 0;
        let startCharIndex = 0;
        let leftRedundantWidth = 0;
        let rightRedundantWidth = 0;
        let startFontStyleIndex = 0;
        if (truncateLeft) {
          const leftWidthToTruncate = halfTextWidth - leftAvailableWidth;
          if (isStyleRun) {
            let currentWidth = 0;
            for (let i = 0; i < fontStyles.length; i++) {
              startFontStyleIndex = i;
              if (currentWidth + fontStyles[i].width > leftWidthToTruncate) {
                const maxWrapWidth =
                  currentWidth + fontStyles[i].width - leftWidthToTruncate;
                applyCellFontStyles(fontStyles[i].fontStyle);
                const remaining = hardWrapWord(
                  line,
                  maxWrapWidth,
                  rawLine.slice(
                    fontStyles[i].startOffset,
                    fontStyles[i].endOffset,
                  ),
                  0,
                  'to-left',
                );
                if (remaining) {
                  startCharIndex = remaining.length - 1;
                  fontStyles[i].startOffset += startCharIndex;
                }
                const remainingWidth = self.ctx.measureText(
                  remaining.substring(0, startCharIndex),
                ).width;
                fontStyles[i].width -= remainingWidth;
                leftRedundantWidth = Math.max(
                  leftWidthToTruncate - currentWidth - remainingWidth,
                  0,
                );
                break;
              }
              currentWidth += fontStyles[i].width;
            }
          } else {
            let currentWidth = 0;
            for (let i = 0; i < words.length; i++) {
              startWordIndex = i;
              const word = words[i];
              const measure = self.ctx.measureText(word);
              if (currentWidth + measure.width > leftWidthToTruncate) {
                const maxWrapWidth =
                  currentWidth + measure.width - leftWidthToTruncate;
                const remaining = hardWrapWord(
                  line,
                  maxWrapWidth,
                  word,
                  0,
                  'to-left',
                );
                if (remaining) {
                  startCharIndex = remaining.length - 1;
                  words[startWordIndex] =
                    remaining[startCharIndex] + line.value;
                }
                const remainingWidth = self.ctx.measureText(
                  remaining.substring(0, startCharIndex),
                ).width;
                leftRedundantWidth = Math.max(
                  leftWidthToTruncate - currentWidth - remainingWidth,
                  0,
                );
                break;
              }
              currentWidth += measure.width;
            }
          }
        }

        if (truncateRight) {
          const availableWidth =
            leftContentWidth + leftRedundantWidth + rightContentWidth;
          if (isStyleRun) {
            fontStyles = fontStyles.slice(startFontStyleIndex);
            const diffOffset = fontStyles[0].startOffset;
            if (diffOffset > 0) {
              let fsWidth = 0;
              const updatedFontStyles: FontStyleRun[] = [];
              for (const fs of fontStyles) {
                fs.startOffset -= diffOffset;
                fs.endOffset -= diffOffset;
                fs.x = fsWidth;
                fsWidth += fs.width;
                if (fs.startOffset >= 0 && fs.endOffset > fs.startOffset) {
                  updatedFontStyles.push(fs);
                }
              }
              fontStyles = updatedFontStyles;
            }
            wrapTextLeftToRightWithFontStyles(
              rawLine.slice(diffOffset),
              availableWidth,
              false,
              fontStyles,
            );
          } else {
            wrapTextLeftToRight(
              words.slice(startWordIndex),
              availableWidth,
              false,
            );
          }
          rightRedundantWidth = Math.max(
            lines[lines.length - 1].width - availableWidth,
            0,
          );
        } else {
          const line = newLine();
          if (isStyleRun) {
            fontStyles = fontStyles.slice(startFontStyleIndex);
            line.value = rawLine.slice(fontStyles[0].startOffset);
            line.width = fontStyles.reduce(function (accumulator, fs) {
              return accumulator + fs.width;
            }, 0);
            const diffOffset = fontStyles[0].startOffset;
            let fsWidth = 0;
            for (const fs of fontStyles) {
              fs.startOffset -= diffOffset;
              fs.endOffset -= diffOffset;
              fs.x = fsWidth;
              fsWidth += fs.width;
            }
            line.fontStyles = fontStyles;
          } else {
            line.value = words.slice(startWordIndex).join('');
            line.width = self.ctx.measureText(line.value).width;
          }
        }

        const currentLine = lines[lines.length - 1];
        let newLeftContentWidth = leftContentWidth + leftRedundantWidth;
        if (cell.truncateWithEllipsis) {
          if (truncateLeft && allowLeftEllipsis) {
            if (isStyleRun) {
              let currentWidth = 0;
              let beginFSidx = 0;
              let breakOut = false;
              for (let idx = 0; idx < currentLine.fontStyles.length; idx++) {
                beginFSidx = idx;
                const fs = currentLine.fontStyles[idx];
                const value = currentLine.value.slice(
                  fs.startOffset,
                  fs.endOffset,
                );
                applyCellFontStyles(fs.fontStyle);
                const newEllipsisWidth =
                  self.ctx.measureText(ellipsisText).width;
                let sliceWidth = 0;
                for (let i = 0; i < value.length; i++) {
                  const char = value[i];
                  const charWidth = self.ctx.measureText(char).width;
                  currentWidth += charWidth;
                  sliceWidth += charWidth;
                  if (currentWidth > leftRedundantWidth + newEllipsisWidth) {
                    currentLine.value =
                      ellipsisText +
                      currentLine.value.slice(fs.startOffset + 1);
                    fs.width = fs.width - sliceWidth + newEllipsisWidth;
                    newLeftContentWidth =
                      leftContentWidth +
                      leftRedundantWidth -
                      currentWidth +
                      newEllipsisWidth;
                    breakOut = true;
                    break;
                  }
                  fs.startOffset++;
                }
                if (breakOut) {
                  break;
                }
              }
              currentLine.fontStyles = currentLine.fontStyles.slice(beginFSidx);
              currentLine.width = currentLine.fontStyles.reduce(function (
                accumulator,
                fs,
              ) {
                return accumulator + fs.width;
              },
              0);
              const diffOffset = currentLine.fontStyles[0].startOffset;
              let fsWidth = 0;
              for (const fs of currentLine.fontStyles) {
                fs.startOffset -= diffOffset;
                fs.endOffset -= diffOffset;
                fs.x = fsWidth;
                fsWidth += fs.width;
              }
            } else {
              const value = currentLine.value;
              let currentWidth = 0;
              for (let i = 0; i < value.length; i++) {
                const char = value[i];
                currentWidth += self.ctx.measureText(char).width;
                if (currentWidth > leftRedundantWidth + ellipsisWidth) {
                  currentLine.value =
                    ellipsisText + currentLine.value.slice(i + 1);
                  currentLine.width =
                    currentLine.width - currentWidth + ellipsisWidth;
                  newLeftContentWidth =
                    leftContentWidth +
                    leftRedundantWidth -
                    currentWidth +
                    ellipsisWidth;
                  break;
                }
              }
            }
          }
          if (truncateRight && allowRightEllipsis) {
            if (isStyleRun) {
              let currentWidth = 0;
              let endFSidx = 0;
              let breakOut = false;
              for (
                let idx = currentLine.fontStyles.length - 1;
                idx >= 0;
                idx--
              ) {
                endFSidx = idx;
                const fs = currentLine.fontStyles[idx];
                const value = currentLine.value.slice(
                  fs.startOffset,
                  fs.endOffset,
                );
                applyCellFontStyles(fs.fontStyle);
                const newEllipsisWidth =
                  self.ctx.measureText(ellipsisText).width;
                let sliceWidth = 0;
                for (let i = value.length - 1; i >= 0; i--) {
                  const char = value[i];
                  const charWidth = self.ctx.measureText(char).width;
                  currentWidth += charWidth;
                  sliceWidth += charWidth;
                  if (currentWidth > rightRedundantWidth + newEllipsisWidth) {
                    currentLine.value =
                      currentLine.value.slice(0, fs.endOffset) + ellipsisText;
                    fs.width = fs.width - sliceWidth + newEllipsisWidth;
                    breakOut = true;
                    fs.endOffset++;
                    break;
                  }
                  fs.endOffset--;
                }
                if (breakOut) {
                  break;
                }
              }
              currentLine.fontStyles = currentLine.fontStyles.slice(
                0,
                endFSidx + 1,
              );
              currentLine.width = currentLine.fontStyles.reduce(function (
                accumulator,
                fs,
              ) {
                return accumulator + fs.width;
              },
              0);
            } else {
              const value = currentLine.value;
              let currentWidth = 0;
              for (let i = value.length - 1; i >= 0; i--) {
                const char = value[i];
                currentWidth += self.ctx.measureText(char).width;
                if (currentWidth > rightRedundantWidth + ellipsisWidth) {
                  currentLine.value =
                    currentLine.value.slice(0, i) + ellipsisText;
                  currentLine.width =
                    currentLine.width - currentWidth + ellipsisWidth;
                  break;
                }
              }
            }
          }
        }
        currentLine.offsetLeft =
          originalColumnWidth / 2 - newLeftContentWidth + offsetXDelta;
      }

      maxLeftContentWidth = Math.max(maxLeftContentWidth, leftContentWidth);
      maxRightContentWidth = Math.max(maxRightContentWidth, rightContentWidth);
      textOffset += rawLine.length;
    };

    const updateWordsWithStyleRuns = (
      words: string[],
      curStyleIdx: number,
    ): string[] => {
      if (isStyleRun) {
        const updatedWords: string[] = [];
        let currIdx = curStyleIdx;
        let internalTextOffset = textOffset;
        for (const word of words) {
          const curStyleRun = cell.drawStyleRuns[currIdx];
          if (
            currIdx >= cell.drawStyleRuns.length ||
            curStyleRun.startOffset >= internalTextOffset + word.length
          ) {
            updatedWords.push(word);
          } else {
            let currTextOffset = internalTextOffset;
            for (let i = currIdx; i < cell.drawStyleRuns.length; i++) {
              const styleRun = cell.drawStyleRuns[i];
              if (
                styleRun.startOffset >= internalTextOffset &&
                styleRun.startOffset < internalTextOffset + word.length
              ) {
                const s = word.slice(
                  currTextOffset - internalTextOffset,
                  styleRun.startOffset - internalTextOffset,
                );
                if (s) {
                  updatedWords.push(s);
                }
                currTextOffset += s.length;
              }
              if (styleRun.endOffset > internalTextOffset + word.length) {
                const s = word.slice(currTextOffset - internalTextOffset);
                if (s) {
                  updatedWords.push(s);
                }
                currTextOffset += s.length;
                break;
              } else {
                const s = word.slice(
                  currTextOffset - internalTextOffset,
                  styleRun.endOffset - internalTextOffset,
                );
                if (s) {
                  updatedWords.push(s);
                }
                currIdx++;
                currTextOffset += s.length;
              }
            }
            if (currTextOffset < internalTextOffset + word.length) {
              const s = word.slice(currTextOffset - internalTextOffset);
              if (s) {
                updatedWords.push(s);
              }
            }
          }
          internalTextOffset += word.length;
        }
        return updatedWords;
      }
      return words;
    };

    // If the column width is smaller than the minimum column width, don't wrap
    // the text.
    if (
      availableWidth <= self.style.scaled.minColumnWidth &&
      cell.wrapMode === 'overflowing'
    ) {
      const line = newLine();
      line.value = cell.formattedValue;
      line.width = self.ctx.measureText(line.value).width;
    } else {
      if (horizontalAlignment === 'right' && isStyleRun && !wrap) {
        currStyleRunIndex = cell.drawStyleRuns.length - 1;
      }
      for (const rawLine of rawLines) {
        if (horizontalAlignment === 'right' && !wrap) {
          const words = updateWordsWithStyleRuns(rawLine.split(/(\s)/), 0);
          wrapTextRightToLeft(words, availableWidth, allowLeftEllipsis);
          textOffset += rawLine.length;
        } else if (cell.isNormal && horizontalAlignment === 'center' && !wrap) {
          wrapTextOverflowCenter(
            rawLine,
            leftAvailableWidth,
            rightAvailableWidth,
            allowLeftEllipsis,
            allowRightEllipsis,
          );
        } else {
          const words = updateWordsWithStyleRuns(
            rawLine.split(/(\s)/),
            currStyleRunIndex,
          );
          wrapTextLeftToRight(words, availableWidth, allowRightEllipsis);
        }
      }
    }
    let maxLineWidth = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].width > maxLineWidth) {
        maxLineWidth = lines[i].width;
      }
    }
    let coveredCellCount = 1;
    let clipStartX: number = cell.x;

    if (cell.wrapMode === 'overflowing') {
      const updateCellCount = (
        remainingWidth: number,
        dir: 'to-right' | 'to-left',
      ) => {
        if (dir === 'to-right') {
          let prevNode = cellNode;
          let curNode = cellNode.nextSibling;
          while (curNode && curNode.cell.isEmpty && remainingWidth > 0) {
            remainingWidth -= prevNode.cell.paddingRight;
            remainingWidth -= curNode.cell.paddingLeft;
            remainingWidth -= curNode.cell.paddedWidth;
            coveredCellCount += 1;
            cell.contentWidth += curNode.cell.width;
            cell.subsumedRightCellCount++;

            prevNode = curNode;
            curNode = curNode.nextSibling;
          }
          return prevNode;
        } else {
          let prevNode = cellNode;
          let curNode = cellNode.prevSibling;
          while (curNode && curNode.cell.isEmpty && remainingWidth > 0) {
            remainingWidth -= prevNode.cell.paddingLeft;
            remainingWidth -= curNode.cell.paddingRight;
            remainingWidth -= curNode.cell.paddedWidth;
            coveredCellCount += 1;
            cell.contentWidth += curNode.cell.width;
            cell.subsumedLeftCellCount++;

            prevNode = curNode;
            curNode = curNode.prevSibling;
          }
          return prevNode;
        }
      };
      if (horizontalAlignment === 'left') {
        const remainingWidth = maxLineWidth - cell.paddedWidth;
        updateCellCount(remainingWidth, 'to-right');
      } else if (horizontalAlignment === 'right') {
        const remainingWidth = maxLineWidth - cell.paddedWidth;
        const firstNode = updateCellCount(remainingWidth, 'to-left');
        clipStartX = firstNode.cell.x;
      } else {
        const remainingLeftWidth =
          maxLeftContentWidth - cell.width + originalColumnWidth / 2;
        const remainingRightWidth =
          maxRightContentWidth - cell.width + originalColumnWidth / 2;
        updateCellCount(remainingRightWidth, 'to-right');
        const firstNode = updateCellCount(remainingLeftWidth, 'to-left');
        clipStartX = firstNode.cell.x;
      }
    }
    return {
      lines: lines,
      width: maxLineWidth,
      coveredCellCount,
      height: cell.calculatedLineHeight * lines.length,
      clipStartX,
    };
  };

  /**
   * Get the rectangle information that contains the whole line of rotation text,
   * includes the distance from rectangle corner to start point of the text
   * @param textLine
   * @param rotationAngle Measure in radians
   * @param padding
   * @returns
   */
  readonly getRotationRect = (
    textLine: ComputedTextLine,
    rotationAngle: number,
    padding: number,
  ) => {
    const { width: valueWidth, height: valueHeight } = textLine;
    const horizontalOffset =
      padding + Math.abs(Math.sin(rotationAngle) * valueHeight) / 2;
    const verticalOffset =
      padding + Math.abs(Math.cos(rotationAngle) * valueHeight) / 2;
    const rectWidth =
      Math.abs(valueWidth * Math.cos(rotationAngle)) + 2 * horizontalOffset;
    const rectHeight =
      Math.abs(valueWidth * Math.sin(rotationAngle)) + 2 * verticalOffset;

    return {
      textLine,
      rectWidth,
      rectHeight,
      originalHorizontalOffset: horizontalOffset,
      originalVerticalOffset: verticalOffset,
      horizontalOffset,
      verticalOffset,
    };
  };

  /**
   * Get maximum width of text that can fit into the rotation rect
   * @param rectHeight
   * @param valueHeight
   * @param rotationAngle Measure in radians
   * @returns
   */
  readonly getMaxRotationTextWidth = (
    rectHeight: number,
    valueHeight: number,
    rotationAngle: number,
  ) => {
    return Math.abs(
      Math.max(
        rectHeight - Math.abs(valueHeight * Math.cos(rotationAngle)),
        0,
      ) / Math.sin(rotationAngle),
    );
  };

  /**
   * Get style runs for each raw line of cell value
   *
   * @param value
   * @param styleRuns
   * @param separators Contain chars for separate substring
   */
  private readonly getSubstringWithStyleRuns = (
    value: string,
    styleRuns: StyleRun[],
    separator: RegExp | string,
    skipSeparator: boolean,
  ) => {
    const rawLines = value.split(separator);
    const lines: Array<{ value: string; styleRuns: StyleRun[] }> = [];
    let lineStartOffset = 0;
    let lineEndOffset = 0;
    let currentStyleRunIndex = 0;
    styleRuns = styleRuns ?? [];

    for (let i = 0; i < rawLines.length; i++) {
      const rawLine = rawLines[i];
      const rawLineLength = rawLine.length;

      // Ignore separator string
      if (!skipSeparator || i % 2 === 0) {
        lineEndOffset = lineStartOffset + rawLineLength;
        const line = { value: rawLine, styleRuns: [] as StyleRun[] };
        lines.push(line);

        if (currentStyleRunIndex < styleRuns.length && rawLineLength > 0) {
          for (let i = currentStyleRunIndex; i < styleRuns.length; i++) {
            currentStyleRunIndex = i;

            const styleRun = styleRuns[i];
            if (
              styleRun.endOffset > lineStartOffset &&
              styleRun.startOffset < lineEndOffset
            ) {
              // There is intersection between style run and text line
              line.styleRuns.push({
                startOffset:
                  Math.max(lineStartOffset, styleRun.startOffset) -
                  lineStartOffset,
                endOffset:
                  Math.min(lineEndOffset, styleRun.endOffset) - lineStartOffset,
                style: styleRun.style,
              });

              if (styleRun.endOffset > lineEndOffset) {
                // Style Run goes over the end of text line and can be
                // part of the next line
                break;
              }
            } else {
              if (styleRun.endOffset <= lineStartOffset) {
                // Style Run is smaller than the end of text line, process
                // next Style Run to find more style run on the line
                continue;
              } else {
                // Style Run is higher than the text
                break;
              }
            }
          }
        }
      }
      lineStartOffset += rawLineLength;
    }
    return lines;
  };

  /**
   * Merge a word to a rotation line. The word value will be at the end and
   * their style run will be merged as well. It's usefull for text-wrapping
   * when we want to calculate one word by one word to find out if it fits
   * the remaining space of line.
   * @param line
   * @param word
   * @param cell
   */
  private readonly addWordToLine = (
    line: ComputedTextLine,
    word: ComputedTextLine,
    cell: NormalCellDescriptor,
  ) => {
    const wordStartOffset = line.value.length;
    const wordPositionOffset = line.width;
    line.runs = line.runs || [];

    function addRun(runs: FontStyleRun[], run: FontStyleRun) {
      const runsLength = runs.length;
      if (runsLength === 0) {
        runs.push(run);
      } else {
        const lastRun = runs[runsLength - 1];
        const lastStyle = lastRun.fontStyle;
        const runStyle = run.fontStyle;
        const isMergeable =
          lastStyle.fontFamily == runStyle.fontFamily &&
          lastStyle.fontSize == runStyle.fontSize &&
          lastStyle.fontStyle == runStyle.fontStyle &&
          lastStyle.fontWeight == runStyle.fontWeight &&
          lastStyle.isStrikethrough == runStyle.isStrikethrough &&
          lastStyle.isUnderline == runStyle.isUnderline &&
          lastStyle.textColor == runStyle.textColor;
        if (isMergeable) {
          lastRun.endOffset += run.endOffset - run.startOffset;
          lastRun.width += run.width;
        } else {
          run = { ...run };
          run.startOffset += wordStartOffset;
          run.endOffset += wordStartOffset;
          run.offsetLeft += wordPositionOffset;
          line.runs.push(run);
        }
      }
    }

    if (word.runs?.length > 0) {
      for (const run of word.runs) {
        addRun(line.runs, run);
      }
    } else {
      const run: FontStyleRun = {
        startOffset: 0,
        endOffset: word.value.length,
        offsetLeft: 0,
        width: word.width,
        height: word.height,
        fontStyle: this.mergeStyleRunFontStyle(cell, null),
        currentStyleRunIdx: -1,
        x: line.value.length,
      };
      addRun(line.runs, run);
    }

    line.value += word.value;
    line.width += word.width;
    line.height = Math.max(line.height, word.height);
  };

  /**
   * Wrap rotation style cell value into multiple lines
   *
   * @param cellNode
   * @returns
   */
  private readonly getRotationWrappingText = (cellNode: CellLinkedNode) => {
    const self = this.self;
    const { cell } = cellNode;
    const { getAngleInRadians } = this.drawUtils;
    // const rawLines = cell.formattedValue.split(/\r\n|\r|\n/);
    const rotationContentPadding = self.style.scaled.cellRotationContentPadding;
    const maxRectHeight = cell.height - 2 * rotationContentPadding;
    const rotationAngle = getAngleInRadians(cell.textRotation);
    let availableWidth: number;

    const rawLines = this.getSubstringWithStyleRuns(
      cell.formattedValue,
      cell.drawStyleRuns,
      /(\r\n|\r|\n)/,
      true,
    );

    const wrapTextLines: ComputedTextLine[] = [];
    const newWrapTextLine = () => {
      const textLine: ComputedTextLine = {
        value: '',
        width: 0,
        height: 0,
        runs: [],
      };
      wrapTextLines.push(textLine);
      return textLine;
    };

    let currentLine: ComputedTextLine;
    for (const rawLine of rawLines) {
      currentLine = newWrapTextLine();
      const words = this.getSubstringWithStyleRuns(
        rawLine.value,
        rawLine.styleRuns,
        /(\s)/,
        false,
      );

      for (const word of words) {
        const wordData = this.getTextLineWithRuns(
          cell,
          word.value,
          word.styleRuns,
        );

        if (currentLine.height < wordData.height) {
          availableWidth = this.getMaxRotationTextWidth(
            maxRectHeight,
            wordData.height,
            rotationAngle,
          );
        }

        const fits = currentLine.width + wordData.width <= availableWidth;
        if (fits) {
          this.addWordToLine(currentLine, wordData, cell);
        } else {
          if (currentLine.value) {
            // The current line has text, put the current word in the new line
            currentLine = newWrapTextLine();
            availableWidth = this.getMaxRotationTextWidth(
              maxRectHeight,
              wordData.height,
              rotationAngle,
            );

            if (wordData.width <= availableWidth) {
              this.addWordToLine(currentLine, wordData, cell);
              continue;
            }
          }

          // In case the current word couldn't fit in a line, should wrap it
          // in multiple lines
          const charList = this.getSubstringWithStyleRuns(
            word.value,
            word.styleRuns,
            '',
            false,
          ).map((char) =>
            this.getTextLineWithRuns(cell, char.value, char.styleRuns),
          );

          for (let i = 0; i < charList.length; i++) {
            const charData = charList[i];
            if (currentLine.height < charData.height) {
              availableWidth = this.getMaxRotationTextWidth(
                maxRectHeight,
                charData.height,
                rotationAngle,
              );
            }

            const fits = currentLine.width + charData.width <= availableWidth;
            if (fits || currentLine.value.length === 0) {
              this.addWordToLine(currentLine, charData, cell);
            } else {
              currentLine = newWrapTextLine();
              this.addWordToLine(currentLine, charData, cell);
            }
          }
        }
      }
    }
    return wrapTextLines;
  };

  private readonly getTextLineWithRuns = (
    cell: NormalCellDescriptor,
    value: string,
    styleRuns: StyleRun[],
  ): ComputedTextLine => {
    const self = this.self;
    const { applyCellFontStyles } = this.drawUtils;
    const currentLine: ComputedTextLine = {
      value,
      width: 0,
      height: 0,
      runs: [],
    };

    function addFontStyleRun(line: ComputedTextLine, run: FontStyleRun) {
      line.runs.push(run);
      line.width += run.width;
      line.height = Math.max(run.height, line.height);
    }

    if (styleRuns && styleRuns.length > 0) {
      let startCharIndex = 0,
        currentRunIndex = 0;
      while (startCharIndex < value.length) {
        const styleRun = styleRuns[currentRunIndex];

        if (!styleRun) {
          // There is no style run left, process the remaining text with cell style
          const startOffset = startCharIndex;
          const endOffset = value.length;
          const fontStyleRun = this.getFontStyleRunForText(
            cell,
            value,
            null,
            startOffset,
            endOffset,
            currentLine.width,
          );
          addFontStyleRun(currentLine, fontStyleRun);
          startCharIndex = endOffset;
          break;
        } else {
          if (startCharIndex < styleRun.startOffset) {
            // There is no style run for text in range [startCharIndex, styleRun.startOffset)
            const startOffset = startCharIndex;
            const endOffset = styleRun.startOffset;
            const fontStyleRun = this.getFontStyleRunForText(
              cell,
              value,
              null,
              startOffset,
              endOffset,
              currentLine.width,
            );
            addFontStyleRun(currentLine, fontStyleRun);
            startCharIndex = endOffset;
          } else if (startCharIndex >= styleRun.endOffset) {
            // The text is at higher offset than style run, it should be processed
            // with the next style run
            currentRunIndex++;
            continue;
          } else {
            // The text is inside style run range [styleRun.startOffset, styleRun.endOffset)
            // Calculate text with the custom font style
            const startOffset = startCharIndex;
            const endOffset = Math.min(styleRun.endOffset, value.length);
            const fontStyleRun = this.getFontStyleRunForText(
              cell,
              value,
              styleRun,
              startOffset,
              endOffset,
              currentLine.width,
            );
            addFontStyleRun(currentLine, fontStyleRun);
            startCharIndex = endOffset;
          }
        }
      }
    } else {
      // There is no style run inside, process the text with cell style
      applyCellFontStyles(cell);
      currentLine.width = self.ctx.measureText(value).width;
      currentLine.height = cell.fontSize * self.scale;
    }

    return currentLine;
  };

  /**
   * Merge style run and cell's style for drawing
   * @param cell
   * @param styleRun
   * @returns
   */
  private readonly mergeStyleRunFontStyle = (
    cell: NormalCellDescriptor,
    styleRun: StyleRun,
  ): FontStyleRun['fontStyle'] => {
    const style = styleRun?.style ?? {};
    return {
      style: cell.style,
      fontSize: style.fontSize ?? cell.fontSize,
      fontFamily: style.fontFamily || cell.fontFamily,
      fontWeight: style.isBold ? 'bold' : cell.fontWeight,
      fontStyle: style.isItalic ? 'italic' : cell.fontStyle,
      isStrikethrough: style.isStrikethrough ?? cell.isStrikethrough,
      isUnderline: style.isUnderline ?? cell.isUnderline,
      textColor: style.textColor || cell.textColor || this.self.style.cellColor,
    };
  };

  private readonly getFontStyleRunForText = (
    cell: NormalCellDescriptor,
    value: string,
    styleRun: StyleRun,
    startOffset: number,
    endOffset: number,
    offsetLeft: number,
  ): FontStyleRun => {
    const self = this.self;
    const { applyCellFontStyles } = this.drawUtils;
    const fontStyle = this.mergeStyleRunFontStyle(cell, styleRun);

    applyCellFontStyles(fontStyle);
    const width = self.ctx.measureText(
      value.slice(startOffset, endOffset),
    ).width;

    return {
      startOffset,
      endOffset,
      x: startOffset,
      offsetLeft,
      width,
      height: fontStyle.fontSize * self.scale,
      currentStyleRunIdx: -1,
      fontStyle,
    };
  };

  /**
   * Calculate area of cell that used for showing rotation text
   *
   * @param cellNode
   * @param textLines
   * @param rotationAngle
   * @returns
   */
  private readonly getRotationCellContentRect = (
    cellNode: CellLinkedNode,
    textLines: ComputedTextLine[],
    rotationAngle: number,
  ) => {
    const { cell } = cellNode;
    let maxCellContentWidth = 0;
    let maxCellContentHeight = 0;
    let cellLineOffset = 0;
    const rotationRects: ReturnType<typeof this.getRotationRect>[] = [];

    for (const textLine of textLines) {
      const currentRect = this.getRotationRect(textLine, rotationAngle, 0);
      const lastRectIndex =
        rotationRects.length > 0 ? rotationRects.length - 1 : -1;

      if (lastRectIndex >= 0) {
        cellLineOffset +=
          rotationRects[lastRectIndex].originalHorizontalOffset +
          Math.abs(
            (rotationRects[lastRectIndex].textLine.height * 0.2) /
              Math.sin(rotationAngle),
          ) +
          Math.abs(
            (Math.cos(rotationAngle) * currentRect.textLine.height) /
              Math.tan(rotationAngle),
          ) +
          currentRect.horizontalOffset;
      } else {
        cellLineOffset += currentRect.originalHorizontalOffset;
      }

      maxCellContentHeight = Math.max(
        maxCellContentHeight,
        currentRect.rectHeight,
      );

      let cellContentWidth: number;
      if (
        cell.horizontalAlignment === 'right' &&
        currentRect.rectHeight < maxCellContentHeight
      ) {
        // In case the last row has small length, need to reserve additional width
        // for the right-align text or the contentWidth is incorrect and cause problem
        // when drawing
        cellContentWidth =
          Math.abs(
            (maxCellContentHeight - 2 * currentRect.verticalOffset) /
              Math.tan(rotationAngle),
          ) + currentRect.horizontalOffset;
      } else {
        cellContentWidth = currentRect.rectWidth;
      }

      maxCellContentWidth = Math.max(
        maxCellContentWidth,
        cellLineOffset + cellContentWidth,
      );

      currentRect.horizontalOffset = cellLineOffset;
      rotationRects.push(currentRect);
    }

    return {
      maxCellContentWidth,
      maxCellContentHeight,
      rotationRects,
    };
  };

  /**
   * Wrap rotation text
   * @param cellNode
   * @returns
   */
  readonly wrapRotationText = (cellNode: CellLinkedNode): CellText => {
    const self = this.self;
    const { cell } = cellNode;
    const stackVertically = self.checkCellStackVerticallyStyle(
      cell.textRotation,
    );

    const newLine = (): CellLine => {
      const line: CellLine = {
        value: '',
        width: 0,
        height: 0,
        offsetLeft: 0,
        offsetTop: 0,
        fontAscent: 0,
        x: 0,
        y: 0,
      };
      return line;
    };

    if (!cell.formattedValue) {
      return {
        lines: [newLine()],
        width: 0,
        coveredCellCount: 1,
        height: -1,
      };
    }

    if (stackVertically) {
      return this.wrapStackVerticallyText(cellNode);
    }

    const { getAngleInRadians } = this.drawUtils;
    const rotationAngle = getAngleInRadians(cell.textRotation),
      hAlign = cell.horizontalAlignment,
      wrap = cell.wrapMode === 'multi-line',
      lines = [] as CellLine[],
      rotationContentPadding = self.style.scaled.cellRotationContentPadding;

    let cellContentTopOffset: number;
    let cellContentLeftOffset: number;

    let textLines: ComputedTextLine[] = [];
    if (wrap) {
      textLines = this.getRotationWrappingText(cellNode);
    } else {
      const rawLines = this.getSubstringWithStyleRuns(
        cell.formattedValue,
        cell.drawStyleRuns,
        /(\r\n|\r|\n)/,
        true,
      );

      for (const rawLine of rawLines) {
        textLines.push(
          this.getTextLineWithRuns(cell, rawLine.value, rawLine.styleRuns),
        );
      }
    }

    if (rotationAngle < 0) {
      textLines = textLines.reverse();
    }

    let { maxCellContentWidth, maxCellContentHeight, rotationRects } =
      this.getRotationCellContentRect(cellNode, textLines, rotationAngle);

    // Add some padding to make sure the text not too close the edge of cell
    maxCellContentWidth += 2 * rotationContentPadding;
    maxCellContentHeight += 2 * rotationContentPadding;

    if (hAlign === 'right') {
      cellContentLeftOffset = cell.width - maxCellContentWidth;
    } else if (hAlign === 'center') {
      cellContentLeftOffset = (cell.width - maxCellContentWidth) / 2;
    } else {
      cellContentLeftOffset = 0;
    }

    if (cell.verticalAlignment === 'bottom') {
      cellContentTopOffset = Math.max(0, cell.height - maxCellContentHeight);
    } else if (cell.verticalAlignment === 'middle') {
      cellContentTopOffset = Math.max(
        0,
        (cell.height - maxCellContentHeight) / 2,
      );
    } else {
      cellContentTopOffset = 0;
    }

    for (const rotationRect of rotationRects) {
      const { width: textWidth, height: textHeight } = rotationRect.textLine;
      const maxTextWidth = this.getMaxRotationTextWidth(
        maxCellContentHeight - 2 * rotationContentPadding,
        textHeight,
        rotationAngle,
      );
      let valueHorizontalOffset = 0;
      let valueVerticalOffset = 0;
      const line = newLine();

      line.value = rotationRect.textLine.value;
      line.fontStyles = rotationRect.textLine.runs;
      line.height = textHeight;
      line.width = textWidth;

      if (hAlign === 'right') {
        valueHorizontalOffset = Math.abs(
          (maxTextWidth - textWidth) * Math.cos(rotationAngle),
        );

        valueVerticalOffset = Math.abs(
          (maxTextWidth - textWidth) * Math.sin(rotationAngle),
        );
      } else if (hAlign === 'center') {
        valueHorizontalOffset = Math.abs(
          ((maxTextWidth - textWidth) / 2) * Math.cos(rotationAngle),
        );

        valueVerticalOffset = Math.abs(
          ((maxTextWidth - textWidth) / 2) * Math.sin(rotationAngle),
        );
      }

      if (rotationAngle > 0) {
        // Draw text bottom up
        line.offsetTop =
          cellContentTopOffset +
          maxCellContentHeight -
          valueVerticalOffset -
          rotationRect.verticalOffset -
          rotationContentPadding;
        line.offsetLeft =
          cellContentLeftOffset +
          valueHorizontalOffset +
          rotationRect.horizontalOffset +
          rotationContentPadding;
      } else {
        // Draw text top down
        line.offsetTop =
          cellContentTopOffset +
          valueVerticalOffset +
          rotationRect.verticalOffset +
          rotationContentPadding;
        line.offsetLeft =
          cellContentLeftOffset +
          valueHorizontalOffset +
          rotationRect.horizontalOffset +
          rotationContentPadding;
      }

      lines.push(line);
    }

    const updateCellCount = (toX: number, dir: 'to-right' | 'to-left') => {
      if (dir === 'to-right') {
        let prevNode = cellNode;
        let curNode = cellNode.nextSibling;
        while (curNode && toX > curNode.cell.x) {
          cell.subsumedRightCellCount++;
          prevNode = curNode;
          curNode = curNode.nextSibling;
        }
        return prevNode;
      } else {
        let prevNode = cellNode;
        let curNode = cellNode.prevSibling;
        while (curNode && toX < curNode.cell.x + curNode.cell.width) {
          cell.subsumedLeftCellCount++;
          prevNode = curNode;
          curNode = curNode.prevSibling;
        }
        return prevNode;
      }
    };

    if (hAlign === 'left' || hAlign === 'center') {
      const rightX = cell.x + cellContentLeftOffset + maxCellContentWidth;
      updateCellCount(rightX, 'to-right');
    }

    if (hAlign === 'right' || hAlign === 'center') {
      const leftX = cell.x + cellContentLeftOffset;
      updateCellCount(leftX, 'to-left');
    }

    return {
      lines: lines,
      width: -1,
      coveredCellCount: -1,
      height: -1,
      rotationAngle,
    };
  };

  /**
   * Wrap text content for Stack vertically style (part of Text-rotation style)
   * @param cellNode
   * @returns
   */
  readonly wrapStackVerticallyText = (cellNode: CellLinkedNode): CellText => {
    const self = this.self;
    const { cell } = cellNode;
    const lines = [] as CellLine[],
      wrap = cell.wrapMode === 'multi-line',
      lineSpaceBetween = self.style.scaled.cellStackVerticallySpaceBetween,
      rotationContentPadding = self.style.scaled.cellRotationContentPadding,
      fontHeightRatio = 1.1;
    const newLine = (): CellLine => {
      const line: CellLine = {
        value: '',
        width: 0,
        height: 0,
        offsetLeft: 0,
        offsetTop: 0,
        fontAscent: 0,
        x: 0,
        y: 0,
        fontStyles: [],
      };
      return line;
    };

    const rawLines = this.getSubstringWithStyleRuns(
      cell.formattedValue,
      cell.drawStyleRuns,
      /(\r\n|\r|\n)/,
      true,
    );

    let maxCellContentWidth = 0;
    let maxCellContentHeight = 0;
    let cellContentTopOffset: number;
    let cellContentLeftOffset: number;
    const defaultFontStyle = this.mergeStyleRunFontStyle(cell, null);

    // A text is drawn with textBaseline set to alphabetic. We will need a
    // kind of space at the botom to make sure text won't overlap each other
    const getTextHeight = (fontHeight: number) => {
      return fontHeight * fontHeightRatio;
    };

    // Add a char into line, update the line properties such as
    // width, height, value, etc accordingly
    const addChar = (line: CellLine, charData: ComputedTextLine) => {
      const fontStyleRun: FontStyleRun = {
        startOffset: line.value.length,
        endOffset: line.value.length + charData.value.length,
        x: 0,
        offsetLeft: 0,
        offsetTop: line.height + charData.height,
        width: charData.width,
        height: charData.height,
        currentStyleRunIdx: -1,
        fontStyle: charData.runs?.[0]?.fontStyle ?? defaultFontStyle,
      };

      line.fontStyles.push(fontStyleRun);
      line.value += charData.value;
      line.height += getTextHeight(charData.height);
      if (line.width < charData.width) {
        line.width = charData.width;
      }
    };

    // Add a line into lines. We will also update the total width/height of
    // the text content, so the line should be added after all its char is
    // in place
    const addLine = (line: CellLine) => {
      const space = lines.length !== 0 ? lineSpaceBetween : 0;
      maxCellContentHeight = Math.max(line.height, maxCellContentHeight);
      line.offsetLeft = maxCellContentWidth + space;
      maxCellContentWidth += space + line.width;
      lines.push(line);
    };

    if (!wrap) {
      for (const rawLine of rawLines) {
        const line = newLine();
        const charList = this.getSubstringWithStyleRuns(
          rawLine.value,
          rawLine.styleRuns,
          '',
          false,
        );

        for (const char of charList) {
          const charData = this.getTextLineWithRuns(
            cell,
            char.value,
            char.styleRuns,
          );
          addChar(line, charData);
        }
        addLine(line);
      }
    } else {
      const maxLineHeight = cell.height - 2 * rotationContentPadding;

      for (const rawLine of rawLines) {
        let currentLine = newLine();
        const charList = this.getSubstringWithStyleRuns(
          rawLine.value,
          rawLine.styleRuns,
          '',
          false,
        );

        for (const char of charList) {
          const charData = this.getTextLineWithRuns(
            cell,
            char.value,
            char.styleRuns,
          );
          if (currentLine.value.length === 0) {
            // There is no character in line, make sure to have at
            // least one for each line
            addChar(currentLine, charData);
          } else {
            const fit =
              currentLine.height + getTextHeight(charData.height) <=
              maxLineHeight;
            if (fit) {
              addChar(currentLine, charData);
            } else {
              // Char not fit, put it in new line
              addLine(currentLine);
              currentLine = newLine();
              addChar(currentLine, charData);
            }
          }
        }

        addLine(currentLine);
      }
    }

    // Add some padding to make sure the text not too close the edge of cell
    maxCellContentWidth += 2 * rotationContentPadding;
    maxCellContentHeight += 2 * rotationContentPadding;

    if (cell.horizontalAlignment === 'right') {
      cellContentLeftOffset = cell.width - maxCellContentWidth;
    } else if (cell.horizontalAlignment === 'center') {
      cellContentLeftOffset = (cell.width - maxCellContentWidth) / 2;
    } else {
      cellContentLeftOffset = 0;
    }

    if (cell.verticalAlignment === 'bottom') {
      cellContentTopOffset = Math.max(0, cell.height - maxCellContentHeight);
    } else if (cell.verticalAlignment === 'middle') {
      cellContentTopOffset = Math.max(
        0,
        (cell.height - maxCellContentHeight) / 2,
      );
    } else {
      cellContentTopOffset = 0;
    }

    // After all characters in a line (column) gets calculated,
    // we need to compute the position of each character to make
    // sure that it's always at the center of line
    for (const line of lines) {
      const lineWidth = line.width;
      const lineOffsetLeft =
        cellContentLeftOffset + rotationContentPadding + line.offsetLeft;
      const lineOffsetTop =
        cellContentTopOffset + rotationContentPadding + line.offsetTop;
      for (const run of line.fontStyles) {
        run.offsetLeft = lineOffsetLeft + (lineWidth - run.width) / 2;
        run.offsetTop = lineOffsetTop + run.offsetTop;
      }
    }

    return {
      lines,
      width: -1,
      coveredCellCount: -1,
      height: -1,
      rotationAngle: 180,
      stackVertically: true,
    };
  };
}
