import type { RangeDescriptor } from '../types/base-structs';
import type { GridPrivateProperties } from '../types/grid';
import type {
  ClipboardActionContext,
  ClipboardBase,
  PasteType,
  MinimumNativeClipboardData,
} from './spec';
import { stringifyDataForClipboard } from './stringify-for-clipboard';
import { setDataToClipboard } from './clipboard-set-data';
import { getDataFromClipboard } from './clipboard-get-data';
import { getSelectedData } from '../selections/selected-data-getter';
import type { SelectionDescriptor } from '../selections/types';

export class DemoVirtualClipboard implements ClipboardBase {
  statusElement?: HTMLElement;

  async copy(
    context: ClipboardActionContext,
    selection: RangeDescriptor[],
  ): Promise<boolean | void> {
    if (this.statusElement)
      this.statusElement.innerText =
        'copied ' + selection.length + ' selections';
    this.copySelectedCellsToClipboard(
      context.grid,
      context.event?.clipboardData,
    );
  }

  async paste(
    context: ClipboardActionContext,
    target: SelectionDescriptor,
    pasteType: PasteType,
  ): Promise<boolean | void> {
    const data = await getDataFromClipboard(context.event?.clipboardData);
    if (data)
      context.grid.pasteData(
        data.text,
        data.mimeType,
        context.selections,
        pasteType,
      );
  }

  private copySelectedCellsToClipboard = (
    self: GridPrivateProperties,
    clipboardData?: MinimumNativeClipboardData,
  ) => {
    const data = getSelectedData(self);
    if (!data) return;

    const result = stringifyDataForClipboard(data.matrix);
    const copiedData = {
      'text/plain': result.tsv,
      'text/html': result.html,
    };
    return setDataToClipboard(copiedData, clipboardData);
  };
}
