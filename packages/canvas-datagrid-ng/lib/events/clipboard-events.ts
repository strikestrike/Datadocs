import { pasteData } from '../clipboard/paste-data';
import type { ClipboardActionContext } from '../clipboard/spec';
import { PasteType } from '../clipboard/spec';
import { SelectionType } from '../selections/util';
import type { GridPrivateProperties } from '../types/grid';
import { copyMethods } from '../util';

export default function loadClipboardEventHandler(self: GridPrivateProperties) {
  copyMethods(new ClipboardEventHandler(self), self);
}

export class ClipboardEventHandler {
  constructor(private readonly self: GridPrivateProperties) {}

  paste = async (event?: ClipboardEvent) => {
    const { self } = this;
    if (!self.attributes.editable) return;
    if (event) event.preventDefault();

    await self.callProcess('paste', async () => {
      let range = self.getPrimarySelection();
      if (!range) {
        range = {
          type: SelectionType.Cells,
          startColumn: 0,
          startRow: 0,
          endColumn: 0,
          endRow: 0,
        };
      }

      const virtualClipboard = self.dataSource?.clipboard;
      const context: ClipboardActionContext = {
        grid: self,
        selections: this._snapshotSelections(),
        event,
      };

      let callSystemClipboard = true;
      if (virtualClipboard) {
        const processed = await virtualClipboard.paste(
          context,
          range,
          PasteType.DEFAULT,
        );
        callSystemClipboard = !processed && processed !== false;
      }
      if (callSystemClipboard)
        await self.systemClipboard.paste(context, range, PasteType.DEFAULT);
      self.requestRedraw('all');
    });
  };

  cut = async (event?: ClipboardEvent) => {
    const { self } = this;

    if (!self.attributes.editable) return;
    if (!self.hasFocus) return;
    if (event) event.preventDefault();
    await self.callProcess('cut', async () => {
      await this._unsafeCopy(event);
      /*const affectedCells = */ self.clearSelectedCells();
      self.requestRedraw('selection');
    });
  };

  copy = async (event?: ClipboardEvent) => {
    const { self } = this;
    if (!self.hasFocus) return;
    if (event) event.preventDefault();
    await self.callProcess('copy', this._unsafeCopy.bind(this, event));
  };

  private _snapshotSelections = () =>
    this.self.selections.map((it) => ({ ...it }));

  private _unsafeCopy = async (event?: ClipboardEvent) => {
    const { self } = this;
    const virtualClipboard = self.dataSource?.clipboard;
    const selections = this._snapshotSelections();
    const context: ClipboardActionContext = {
      grid: self,
      selections,
      event,
    };

    const ranges = selections.map((it) => self.normalizeSelection(it));
    let callSystemClipboard = true;
    if (virtualClipboard) {
      const processed = await virtualClipboard.copy(context, ranges);
      callSystemClipboard = !processed && processed !== false;
    }
    if (callSystemClipboard) await self.systemClipboard.copy(context, ranges);
  };

  pasteData: typeof pasteData = pasteData.bind(this.self);
}
