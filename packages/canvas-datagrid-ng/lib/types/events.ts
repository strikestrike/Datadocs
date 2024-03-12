import type {
  CellDescriptor,
  GridHeader,
  NormalCellDescriptor,
  TableDescriptor,
  TableSummaryFn,
} from '.';
import type { GridPublicAPI } from './grid';
import type { HighlightDescriptor } from '../highlights/types';
import type { SelectionDescriptor } from '../selections/types';
import type { PixelBoundingRect } from './base-structs';
import type { CellDetailTypeData } from './data-format';

type FlexibleEvent = Event & {
  [x: string]: any;
};

export type TableFieldDropdownEvent = Event & {
  grid: GridPublicAPI;
  cell: CellDescriptor;
  table: TableDescriptor;
  header: GridHeader;
  button: CellDescriptor;
  buttonPos: PixelBoundingRect;
  onClose?: () => void;
  onOpen?: () => void;
};

export type TableAggregationOptsEvent = Event & {
  grid: GridPublicAPI;
  cell: NormalCellDescriptor;
  cellPos: PixelBoundingRect;
  table: TableDescriptor;
  header: GridHeader;
  currentFn?: TableSummaryFn;
  availableFns: Readonly<TableSummaryFn>[];
  onClose?: () => void;
  closeHandle: { onClose?: () => any };
};

export type TableFieldTypeTooltipEvent = Event & {
  cell?: CellDescriptor;
  table?: TableDescriptor;
  header?: GridHeader;
  button?: CellDescriptor;
  buttonPos?: PixelBoundingRect;
  tooltipData?: CellDetailTypeData;
};

export type CellDataLayoverEvent = Event & {
  cell?: NormalCellDescriptor;
  cellPos?: PixelBoundingRect;
};

export type GridEventHandlerParameters = {
  error: [
    err: {
      message: string;
      /** @example `copy`, `paste` */
      context: string;
      stack?: string;
    },
  ];

  selectionchanged: [
    Event & {
      selectionList: SelectionDescriptor[];
      readonly selectedCells: any;
      readonly selectionBounds: any;
    },
  ];

  customhighlightchanged: [
    event: {
      previous: HighlightDescriptor[];
      latest: HighlightDescriptor[];
    },
  ];

  beforeendedit: [
    editInfo: {
      cell: any;
      newValue: any;
      oldValue: any;
      abort: () => void;
      input: HTMLInputElement;
    },
  ];

  confirmationmodal: [
    dialog: {
      title: string;
      message: string;
      yesAction: () => any;
    },
  ];

  tablefielddropdown: [dropdown: TableFieldDropdownEvent];

  tableaggregationoptionsdropdown: [dropdown: TableAggregationOptsEvent];
};

export type GridAddEventListenerMethod = {
  <EventName extends keyof GridEventHandlerParameters>(
    eventName: EventName,
    handler: (...args: GridEventHandlerParameters[EventName]) => any,
  ): void;

  (eventName: string, handler: (event: FlexibleEvent) => any): void;
};

export type GridDispatchEventMethod = {
  <EventName extends keyof GridEventHandlerParameters>(
    eventName: EventName,
    ...args: GridEventHandlerParameters[EventName]
  ): boolean;

  (eventName: string, ...args: any[]): boolean;
};
