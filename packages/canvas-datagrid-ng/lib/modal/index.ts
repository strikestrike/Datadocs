import type { GridPrivateProperties } from '../types';
import { copyMethods } from '../util';
import type { ConfirmDialogOptions, ConfirmDialogResult } from './spec';

export default function loadGridModalManager(self: GridPrivateProperties) {
  copyMethods(new GridModalManager(self), self);
}

export class GridModalManager {
  constructor(private readonly self: GridPrivateProperties) {}

  openConfirmDialog = async (
    options: ConfirmDialogOptions & { backdrop?: boolean },
  ): Promise<ConfirmDialogResult> => {
    const grid = this.self;
    const { result } = await grid.callProcess(
      {
        name: 'confirm-dialog',
        backdrop: options.backdrop !== false,
      },
      async () => grid.modal.confirm(options),
    );
    return result;
  };
}
