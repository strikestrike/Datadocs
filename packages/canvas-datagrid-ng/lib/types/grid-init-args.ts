import type { GridAttributes } from '../attributes';
import type {
  FilterFn,
  FormatterFn,
  TransformerFn,
  SorterFnGenerator,
} from './base';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { defaultGridStyles } from '../style/default-styles';

/**
 * The parameter for initalizing the grid
 */
export interface GridInitArgs extends Partial<GridAttributes> {
  /**
   * The parent HTML node for the grid
   */
  parentNode?: HTMLElement;

  /**
   * This value will be stored to the `GridInternalState.canvasOffsetLeft`
   */
  canvasOffsetLeft?: number;
  /**
   * This value will be stored to the `GridInternalState.canvasOffsetTop`
   */
  canvasOffsetTop?: number;

  /**
   * This init arg is not used for the internal of the grid.
   * It is used for the grid creator.
   * The creator creates the grid by WebComponent if this field is not provided or it is `true`
   * when the browser context supports WebComponent.
   * Otherwise, the creator creates the grid that is wrapped in a normal HTML div element
   * @default true
   */
  component?: boolean;

  /**
   * @see defaultGridStyles
   * {@link Style.defaultGridStyles}
   */
  style?: { [x: string]: string | number };
  filters?: { [x: string]: FilterFn };
  sorters?: { [x: string]: SorterFnGenerator };
  formatters?: { [x: string]: FormatterFn };
  transformers?: { [x: string]: TransformerFn };
}
