import type { GridPrivateProperties } from '../types/grid';
import type { RangeDescriptor } from '../types/base-structs';
import type { AssertPartialType } from '../types/base';
import type { SelectionDescriptor } from '../selections/types';

export enum PasteType {
  DEFAULT = 0,
  VIEW = 1,
  FORMULA = 2,
  FORMAT = 4,
  STYLE = 8,
}

export type PasteBehaviourConfig = {
  /**
   * The limitation for repeating a small area data from the clipboard
   * to a large area on the grid.
   * For example, The user pastes the following data to the selection [0,0]-[9,9] on the grid:
   * ```
   * |---|---|
   * | A | C |
   * |---|---|
   * | B | D |
   * |---|---|
   * ```
   * If the value of this config less than `5` (Eg: `3`),
   * then this data will only be pasted one time at the [0,0]-[1,1] on the grid.
   */
  maxRepeatTimes?: number;
};
export const defaultPasteBehaviour: Required<PasteBehaviourConfig> = {
  maxRepeatTimes: 1000,
};

/**
 * This type is the minimum version of the `event.clipboardData`
 */
export type MinimumNativeClipboardData = AssertPartialType<
  DataTransfer,
  {
    items?: DataTransferItemList;
    setData: (mimeType: string, data: unknown) => void;
  }
>;

export type ClipboardActionContext = {
  /**
   * Avoid to use this property if possible.
   * We need to make the virtual clipboard as independent as possible.
   */
  grid: GridPrivateProperties;
  /**
   * It is a snapshot of the grid.selections usually.
   * - For the `copy` method, it is the same array as the parameter `selections` that
   * is snapshoted when the user tries to copy.
   * - For the `paste` method, it is copied from the `grid.selections`.
   * And it is designed for the custom clipboard to provide complex pasting behaviour.
   */
  selections: SelectionDescriptor[];
  event?: ClipboardEvent;
};

/**
 * The specification of the custom/virtual clipboard
 * @version 2022-12-03
 *
 * @todo allow the clipboard methods to reqturn custom data to let the grid to update the clipboard or overwrite default data from the clipboard.
 */
export interface ClipboardBase {
  /**
   * @returns
   * * `true` or not falsy value: This clipboard processed the copy request, and the grid does NOT need to call default system clipboard methods for this copy request.
   * * `false`: The clipboard REJECT this copy request. but the grid also does NOT need to call default system clipboard methods for this copt request.
   * * `null`, `undefined` (default): This clipboard doesn't process this copy request. So the grid NEEDS to call default system clipboard methods to process this request.
   *
   * Eg: The returned value is `true` when the user copy a whole column that contains too many data
   * and the user choose the copy option "to virtual clipboard"
   */
  copy(
    context: ClipboardActionContext,
    selections: RangeDescriptor[],
  ): Promise<boolean | void>;

  /**
   * @returns
   * * `true` or not falsy value: This clipboard prcoessed this paste request, and the grid does NOT need to do default paste operation.
   * * `false`: This clipboard REJECT this paste request. and the grid also does NOT need to do default paste operation.
   * * `null`, `undefined` (default): This clipboard doesn't process this paste request. The grid NEEDS to call default system clipboard methods to process this request.
   *
   * @param target It is the primary selection of the grid usually.
   * The full selection list is stored in `context.selections`
   */
  paste(
    context: ClipboardActionContext,
    target: SelectionDescriptor,
    pasteType: PasteType,
  ): Promise<boolean | void>;
}
