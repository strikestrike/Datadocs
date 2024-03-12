import type { ConfirmDialogOptions, ModalDialogProvider } from './spec';
import { ConfirmDialogChoice } from './spec';

export class DefaultModalDialogProvider implements ModalDialogProvider {
  confirm = async (options: ConfirmDialogOptions) => {
    return typeof options.defaults === 'number'
      ? { choice: options.defaults }
      : { choice: ConfirmDialogChoice.Cancelled };
  };
  dispose = () => undefined;
}
