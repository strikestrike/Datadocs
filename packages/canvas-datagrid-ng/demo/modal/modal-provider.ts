import {
  ConfirmDialogOptions,
  ConfirmDialogResult,
  ModalDialogProvider,
} from '../../lib/modal/spec';
import { ConfirmDialogChoice } from '../../lib/main';

type SwalOptions = {
  title?: string;
  titleText?: string;
  html?: any;
  text?: string;
  icon?: 'success' | 'error' | 'warning' | 'info' | 'question';
  [x: string]: any;
};
declare class Swal {
  static fire(options: SwalOptions): Promise<{
    isDismissed: boolean;
    isConfirmed: boolean;
    isDenied: boolean;
    dismiss: string;
  }>;
  static close(): void;
}

export class SweetAlertProvider implements ModalDialogProvider {
  confirm = async (
    options: ConfirmDialogOptions,
  ): Promise<ConfirmDialogResult> => {
    const message = document.createElement('div');
    message.style.display = 'flex';
    message.style.flexDirection = 'column';
    message.style.alignItems = 'flex-start';
    message.style.width = '330px';
    message.style.marginLeft = 'auto';
    message.style.marginRight = 'auto';
    message.innerHTML = `
    <div style="text-align:left;">${options.message}</div>
<div style="margin-top:20px">
<div style="text-align: left">Automatical merge strategy:</div>
<select name="merge_resolution">
  <option value="lww" selected>Resolve all conflicts by: [Last Write Win]</option>
  <option value="lcw" >Resolve all conflicts by: [Local Changes Win]</option>
  <option value="scw">Resolve all conflicts by: [Server Changes Win]</option>
  <option value="fork">Fork all local changes to a separate document</option>
</select>
</div>
`;
    let strategy = 'lww';
    const selectBox = message.querySelector('select');
    if (selectBox) {
      selectBox.addEventListener('change', (ev) => {
        strategy = selectBox.value;
      });
    }

    const swalOptions: SwalOptions = {
      icon: 'question',
      title: options.title,
      html: message,

      backdrop: options.escapable || false,
      allowEscapeKey: options.escapable || false,

      showConfirmButton: options.positiveBtn !== false,
      showDenyButton: options.negativeBtn !== false,
      showCancelButton: options.neutralBtn !== false,

      confirmButtonText: options.positiveBtn || 'Automatically Merge All',
      denyButtonText: options.negativeBtn || 'Drop Local Changes',
      cancelButtonText: options.neutralBtn || 'Manually Merge Conflicts',
    };

    const result = await Swal.fire(swalOptions);
    console.log(result);

    let choice: ConfirmDialogChoice =
      typeof options.defaults === 'number'
        ? options.defaults
        : ConfirmDialogChoice.Cancelled;
    if (result.isConfirmed) choice = ConfirmDialogChoice.Positive;
    else if (result.isDenied) choice = ConfirmDialogChoice.Negative;
    else if (result.dismiss === 'cancel') choice = ConfirmDialogChoice.Neutral;
    return { choice, extra: { strategy } };
  };
  dispose = (): void => Swal.close();
}
