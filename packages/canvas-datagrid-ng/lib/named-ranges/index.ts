import { isSelectionSingular, SelectionType } from '../selections/util';
import type {
  GridPrivateProperties,
  NameType,
  SelectionDescriptor,
} from '../types';
import { copyMethods } from '../util';
import type { NameBoxState } from './spec';
import {
  getSelectionAsRangeString,
  getSelectionFromRange,
  getSelectionsAsRangeString,
} from './util';

export default function loadGridNamedRanges(self: GridPrivateProperties) {
  copyMethods(new GridNamedRanges(self), self);
}

/**
 * Grid miscellaneous methods
 */
export class GridNamedRanges {
  constructor(private readonly self: GridPrivateProperties) {}

  goToName = (name: string) => {
    name = name.trim();
    if (name.length <= 0) return false;
    const { self } = this;

    const sensitivity = { sensitivity: 'accent' };
    let item: { name: string; type: NameType } | undefined;
    self.dataSource.namespace.forEachComponent(false, (other, type) => {
      if (name.localeCompare(other, undefined, sensitivity) === 0) {
        item = { name: other, type };
        return false;
      }
      return true;
    });
    if (!item) {
      const selection = getSelectionFromRange(name.toUpperCase(), true, true);
      if (selection) {
        if (
          ((selection.type === SelectionType.Columns ||
            selection.type === SelectionType.Cells) &&
            (selection.endColumn < selection.startColumn ||
              selection.endColumn >= self.dataSource.state.cols)) ||
          ((selection.type === SelectionType.Rows ||
            selection.type === SelectionType.Cells) &&
            (selection.endRow < selection.startRow ||
              selection.endRow >= self.dataSource.state.rows))
        ) {
          throw new Error('Invalid range');
        }
        self.replaceAllSelections([selection]);
        self.scrollIntoView(
          self.activeCell.columnIndex,
          self.activeCell.rowIndex,
        );
        return true;
      }

      return false;
    }
    if (item.type === 'table') {
      const table = self.dataSource.getTable(name);
      if (!table) return false;
      self.selectArea({
        top: table.startRow,
        left: table.startColumn,
        bottom: table.endRow,
        right: table.endColumn,
      });
      self.scrollIntoView(table.startColumn, table.startRow);
    } else if (item.type === 'range') {
      const namedRange = self.dataSource.namedRanges.get(name);
      if (!namedRange) return false;
      self.replaceAllSelections(namedRange.selections);
      const firstSelection = namedRange.selections[0];
      if (firstSelection) {
        const range = self.convertSelectionToRange(firstSelection);
        self.scrollIntoView(range.startColumn, range.startRow);
      }
    } else {
      return false;
    }
    return true;
  };

  /**
   * Returns the current name box value (range string or the name of the named
   * range if the bounds fit).
   * @param friendly Return without dollar sign.
   */
  getNameBoxState = (friendly = false): NameBoxState => {
    const { self } = this;
    const selection = self.getPrimarySelection();
    const lookupRange = getSelectionAsRangeString(selection);
    const namedRange = self.dataSource.namedRanges.getByRange(lookupRange);
    if (namedRange) {
      return { value: namedRange.name, item: namedRange };
    }

    const result: NameBoxState = {
      value: friendly
        ? getSelectionAsRangeString(selection, true)
        : lookupRange,
    };

    if (isSelectionSingular(selection)) {
      const { rowIndex, columnIndex } = self.activeCell;
      const column = self.dataSource.getHeader(columnIndex);

      result.type = column.type;
      const table = self.dataSource.getTableByIndex(rowIndex, columnIndex);
      if (table) {
        const tableColumn = table.dataSource.getHeader(
          columnIndex - table.startColumn,
        );
        if (tableColumn) {
          result.type = tableColumn.type;
          result.item = table;
        }
      }
    }
    return result;
  };

  getNameSelections = (
    selections: SelectionDescriptor[],
    friendly: boolean,
  ): string => {
    const rangeString = getSelectionsAsRangeString(selections, friendly);
    return rangeString;
  };

  getNameActiveCell = (activeCell: any, friendly: boolean): string => {
    return this.getNameSelections(
      [
        {
          startRow: activeCell.rowIndex,
          startColumn: activeCell.columnIndex,
          endRow: activeCell.rowIndex,
          endColumn: activeCell.columnIndex,
          type: SelectionType.Cells,
        },
      ],
      friendly,
    );
  };

  nameSelectedRanges = (name: string) => {
    const { self } = this;
    const { dataSource } = self;
    const { namedRanges, namespace } = dataSource;
    if (/[^\w\d _]/.test(name)) throw Error('None valid name');

    const rangeString = getSelectionsAsRangeString(self.selections);
    if (!namespace.checkName(name)) return false;

    return namedRanges.add(namespace, name, rangeString);
  };
}
