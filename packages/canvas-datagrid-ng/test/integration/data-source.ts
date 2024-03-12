import { g } from '../utils/base.js';
import { assertCompareCondition } from '../utils/assert.js';

export default function () {
  it('uses an empty data source by default', async function () {
    const grid = g({ test: this.test });
    assertCompareCondition(
      'Data source name',
      grid.dataSource.constructor.name,
      '===',
      'EmptyDataSource',
    );
  });
}
