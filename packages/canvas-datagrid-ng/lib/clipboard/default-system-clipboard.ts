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

export class DefaultSystemClipboard implements ClipboardBase {
  async copy(
    context: ClipboardActionContext,
    selection: RangeDescriptor[],
  ): Promise<boolean | void> {
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
    // const isNeat = areSelectionsNeat(self.selections);
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
