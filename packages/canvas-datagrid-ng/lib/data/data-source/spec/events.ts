import type { RangeDescriptor } from '../../../types/base-structs';
import type { DataEventBase } from '../../event-target/spec';
import type { GridSavedFilter } from '../filters/spec';
import type { GridSort } from '../sorters/spec';
import type { DataGroup } from './data-group';
import type { EditCellDescriptor } from './edit';
import type { DataSourceSettings } from './settings';
import type { TableEvent } from './table';

export type LoadDataEvent = {
  name: 'load';
};

export type ErrorDataEvent = {
  name: 'error';
};

export type FilterDataEvent = {
  name: 'filter';
  previous?: GridSavedFilter;
  current?: GridSavedFilter;
};

export type SortDataEvent = {
  name: 'sort';
  previous?: GridSort[];
  change?: GridSort | GridSort[];
};

export type DataGroupEvent = {
  name: 'dataGroup';
  previous: DataGroup[];
  current: DataGroup[];
};

export type SetAggregationFnEvent = {
  name: 'setAggregationFn';
  columnId: string;
  previous?: string;
  current?: string;
};

export type BatchDataEventType =
  | 'clear'
  | 'move'
  | 'resize'
  | 'hideRows'
  | 'unhideRows'
  | 'hideColumns'
  | 'unhideColumns'
  | 'reorder'
  | 'tableAdd'
  | 'tableDelete'
  | 'tableColumn';

export type BatchDataEvent = {
  name: 'data';
  type: BatchDataEventType;
  targetRange?: RangeDescriptor;
  sourceRange?: RangeDescriptor;
};

export type DataCountEvent = {
  name: 'dataCount';
  prevRowCount: number;
  prevColumnCount: number;
  rowCount: number;
  columnCount: number;
};

export type EditDataEvent = {
  name: 'edit';
  cells: EditCellDescriptor[];
};

export type DataTableEvent = {
  name: 'table';
  tableEvent: TableEvent;
};

export type FieldSettingEvent = {
  name: 'fieldsetting';
  /**
   * The column/field id.
   */
  columnId: string;
  /**
   * The type field-related setting that changed.
   */
  target: 'structFilterPath' | 'structFilterPathType' | 'geoSortType';
};

export type SettingsChangedEvent = {
  name: 'settings';
  previous: DataSourceSettings;
  current: DataSourceSettings;
};

/**
 * @version 2023-11-14
 */
export type DataEvent = DataEventBase &
  (
    | LoadDataEvent
    | ErrorDataEvent
    | FilterDataEvent
    | SortDataEvent
    | BatchDataEvent
    | EditDataEvent
    | DataCountEvent
    | DataTableEvent
    | DataGroupEvent
    | SetAggregationFnEvent
    | FieldSettingEvent
    | SettingsChangedEvent
  );
