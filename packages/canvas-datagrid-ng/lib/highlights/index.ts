import type { GridPrivateProperties } from '../types';
import type { HighlightDescriptor } from './types';
import { copyMethods } from '../util';
import { isInSelection, SelectionType } from '../selections/util';

export default function loadGridHighlightManager(self: GridPrivateProperties) {
  copyMethods(new GridHighlightManager(self), self);
}

export class GridHighlightManager {
  constructor(private readonly self: GridPrivateProperties) {}

  getCustomHighlights = (userId?: string) => {
    const { self } = this;
    if (!userId) return self.highlights;
    return self.highlights.filter((it) => it.meta?.userId === userId);
  };

  updateCustomHighlights = (
    highlights: Omit<HighlightDescriptor, 'type'>[],
    dontDraw = false,
    suppressEvent = false,
  ) => {
    const { self } = this;
    const previous = self.highlights;
    self.highlights = highlights.map((it) => ({
      ...it,
      type: SelectionType.Cells,
    }));
    if (!dontDraw) self.draw();
    if (!suppressEvent) self.dispatchCustomHighlightChangedEvent(previous);
    return true;
  };

  dispatchCustomHighlightChangedEvent = (previous: HighlightDescriptor[]) => {
    const { self } = this;
    self.dispatchEvent('customhighlightchanged', {
      previous,
      latest: self.highlights,
    });
  };

  getCellHightlightInfo = (rowIndex?: number, columnIndex?: number) => {
    if (rowIndex === undefined && columnIndex === undefined) return;

    const { self } = this;
    for (let i = 0; i < self.highlights.length; i++) {
      const hl = self.highlights[i];
      if (isInSelection(hl, rowIndex, columnIndex)) return hl;
    }
  };
}
