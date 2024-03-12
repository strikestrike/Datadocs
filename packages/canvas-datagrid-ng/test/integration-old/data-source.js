/** @typedef {import('../lib/types').GridPublicProperties} Grid **/

import { g, assert } from './util.js';

export default function () {
  const { deepStrictEqual } = assert;
  it('uses an empty data source by default', async function () {
    const grid = g({ test: this.test });
    deepStrictEqual(grid.dataSource.constructor.name, 'EmptyDataSource');
  });

  it('uses DataSourceFromArray if there is a static data for the grid', async function () {
    const grid = g({ test: this.test, data: [] });
    deepStrictEqual(grid.dataSource.constructor.name, 'DataSourceFromArray');
  });
}
