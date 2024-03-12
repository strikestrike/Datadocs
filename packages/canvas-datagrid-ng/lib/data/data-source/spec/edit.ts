import type { CellMeta } from './base';
import type { CellStyleDeclaration } from '../../../types/cell';
/**
 * @version 2022-12-25
 *
 * Describe the request for editing a cell.
 * If you just need to change the style of the cell,
 * you can DON'T provide the field `value` or set its value to `undefined`
 */
export interface EditCellDescriptor {
  /** row view index */
  row: number;
  /** column view index */
  column: number;
  /** either value or style can be changed */
  value?: any;
  meta?: Partial<CellMeta>;
  style?: Partial<CellStyleDeclaration>;
}
