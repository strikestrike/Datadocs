'use strict';

import type { GridPrivateProperties, GridSchemaItem } from './types';
import { copyMethods } from './util';

export default function loadGridSchemaHelper(self: GridPrivateProperties) {
  copyMethods(new GridSchemaHelper(self), self);
}

export class GridSchemaHelper {
  constructor(private readonly grid: GridPrivateProperties) {
    Object.defineProperty(grid.publicApi, 'schema', {
      get: function schemaGetter() {
        return grid.getSchema();
      },
      set: function schemaSetter(value: GridSchemaItem[]) {
        return grid.setSchema(value);
      },
    });
  }

  getSchema = () => {
    const dataSource = this.grid.dataSource;
    if (!dataSource) return [];
    return this.grid.dataSource.deprecated_getAllSchema();
  };

  setSchema = (schema?: GridSchemaItem[]) => {
    const grid = this.grid;
    if (!schema) schema = [];
    if (!Array.isArray(schema)) return false;

    Promise.resolve(grid.dataSource.setSchema(schema)).then((handled) => {
      if (!handled) return;
      grid.createNewRowData();
      grid.resize(true);
      grid.dispatchEvent('schemachanged', { schema });
    });
    return true;
  };

  getVisibleSchema = () => {
    return this.getSchema().filter((col) => !col.hidden);
  };

  /**
   * Returns a header from the schema by name.
   * @returns header with the selected name, or undefined.
   * @param name The name of the column to resize.
   */
  getHeaderById = (id: string) => this.grid.dataSource.getHeaderById(id);

  validateColumn = (c: { name: string }, s: { name: string }[]) => {
    if (!c.name) {
      throw new Error('A column must contain at least a name.');
    }
    if (
      s.filter(function (i) {
        return i.name === c.name;
      }).length > 0
    ) {
      throw new Error(
        'A column with the name ' +
          c.name +
          ' already exists and cannot be added again.',
      );
    }
    return true;
  };
}
