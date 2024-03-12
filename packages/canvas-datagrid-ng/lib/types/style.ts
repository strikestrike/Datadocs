import type { CellStyleDeclaration } from '.';
import type { defaultGridStyles } from '../style/default-styles';

export interface StyleRun {
  startOffset: number;
  endOffset: number;
  style: Partial<CellStyleDeclaration>;
}

export interface TextRange {
  startOffset: number;
  endOffset: number;
}

export interface ClearStyleRun {
  clearBold: boolean;
  clearItalic: boolean;
  clearStrikethrough: boolean;
  clearUnderline: boolean;
  clearFontSize: boolean;
  clearFontFamily: boolean;
  clearTextColor: boolean;
}

export interface FontStyleRun {
  startOffset: number;
  endOffset: number;
  x: number;
  /**
   * Distance from the starting point of text line. It is currently
   * used in drawing Text-rotation style
   */
  offsetLeft?: number;
  /**
   * Distance from the top of text line. It is useful for drawing
   * stack vertically style when each character is on different row.
   */
  offsetTop?: number;
  /**
   * Calculated text length for the style run
   */
  width: number;
  /**
   * Height of text
   */
  height: number;
  currentStyleRunIdx: number;
  fontStyle?: {
    style: string;
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: string;
    fontFamily?: string;
    isStrikethrough?: boolean;
    isUnderline?: boolean;
    textColor?: string;
  };
}

export type GridStyleDeclaration = typeof defaultGridStyles;

/**
 * It contains computed information for a text line with or without
 * style runs, is used for drawing.
 */
export type ComputedTextLine = {
  /**
   * Text content of the line
   */
  value: string;
  /**
   * Total width of text line or maximum width of stack-vertically text
   */
  width: number;
  /**
   * Maximum height of the style runs inside text line or total height
   * of stack-vertically text
   */
  height: number;
  /**
   * List style runs of text line
   */
  runs?: FontStyleRun[];
};

/**
 * It contains a meta run of cell and can be used in different places,
 * such as Hyperlink run
 */
export type MetaRun = {
  // No providing offsets can indicate that the entire cell is covered.
  /**
   * Link label start index
   */
  startOffset?: number;
  /**
   * Link label end index
   */
  endOffset?: number;
  /**
   * For link URL or ref
   */
  ref?: string;
  /**
   * For link label
   */
  label?: string;
};

/**
 * Contain hyperlink data for a cell.
 */
export type HyperlinkData = {
  /**
   * It contains the hash of original cell value, use for checking if a
   * cell value has been changed. Link runs for readonly cell only valid
   * if the original value still the same.
   */
  originalTextHash?: string;
  /**
   * Display text for readonly cell by combining original value with the
   * link runs in @spans
   */
  effectiveText?: string;
  /**
   * Link-runs within the cell
   */
  spans?: MetaRun[];
};
