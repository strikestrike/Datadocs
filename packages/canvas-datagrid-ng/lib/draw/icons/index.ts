export * from './column-header-icon';
export * from './column-type-icon';

import { initColumnHeaderIconImages } from './column-header-icon';
import { initColumnTypeIconImages } from './column-type-icon';
import { initGenericIconImages } from './generic-icon';

export function initIconImages() {
  initColumnHeaderIconImages();
  initColumnTypeIconImages();
  initGenericIconImages();
}
