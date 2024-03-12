import type {
  ComponentCallback,
  ComponentProvider,
  NamespaceController,
} from '../../types';
import type { NamedRangeManager } from '../../named-ranges/spec';
import type { TableManager } from '../data-source/table-manager';

export class DefaultComponentProvider implements ComponentProvider {
  constructor(
    private readonly ranges: NamedRangeManager,
    private readonly tables: TableManager,
  ) {}

  forEach = (controller: NamespaceController, callback: ComponentCallback) => {
    try {
      this.forEachRange(controller, callback);
    } catch (e) {
      // Exit
    }
  };

  forEachRange = (
    controller: NamespaceController,
    callback: ComponentCallback,
  ) => {
    this.ranges.forEach((range, name) => {
      if (!callback(name, 'range', range, controller)) {
        throw Error();
      }
    });

    for (const table of this.tables.values) {
      if (!callback(table.name, 'table', table, controller)) return;
    }
  };
}
