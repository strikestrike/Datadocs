export type CommonDialogOptions = {
  /**
   * The name of this modal.
   * The dialog provider can add details for special modal dialog base on this string
   * @example "COPY_LARGE_DATA"
   */
  name: string;

  title: string;
  message?: string;

  /**
   * Allow the user cancel this modal dialog by clicking backdrop or typing "ESC"
   * @default false
   */
  escapable?: boolean;
};

export type ConfirmDialogOptions = CommonDialogOptions & {
  /**
   * The text of positive button. `false` means no positive button
   * @example "OK"
   */
  positiveBtn?: string | false;
  /**
   * The text of neutral button. `false` means no neutral button
   * @example "Show Options"
   */
  neutralBtn?: string | false;
  /**
   * The text of negative button. `false` means no negative button
   * @example "No"
   */
  negativeBtn?: string | false;

  /**
   * @default ConfirmDialogChoice.Cancelled
   */
  defaults?: ConfirmDialogChoice;
};

export enum ConfirmDialogChoice {
  Cancelled = -1,
  Negative = 0,
  Positive = 1,
  Neutral = 2,
}

export type ConfirmDialogResult = {
  choice: ConfirmDialogChoice;
  extra?: unknown;
};

/**
 * @version 2023-01-09
 */
export interface ModalDialogProvider {
  confirm(options: ConfirmDialogOptions): Promise<ConfirmDialogResult>;
  dispose(): void;
}
