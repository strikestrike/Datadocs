//@ts-check
import type { DataSourceBase } from '../../lib/main';
import { datagrid } from '../../lib/main';

(function () {
  document.addEventListener('DOMContentLoaded', main);
  function main() {
    const DataSources = datagrid.DataSources;

    const container = document.getElementById('grid');
    if (!container) return alert(`container #grid is not found!`);

    const grid = datagrid({
      parentNode: container,
      allowFreezingRows: true,
      sortFrozenRows: false,
      filterFrozenRows: false,
      formatters: Object.create(null),
    });
    grid.style.height = '100%';
    grid.style.width = '100%';

    const tableData = [
      ['a1', 'b1', 'c1', 'd1'],
      ['a2', 'b2', 'c2', 'd2'],
      ['a3', 'b3', 'c3', 'd3'],
    ];

    const dataSource = new DataSources.Empty({
      rows: 100,
      cols: 100,
    }) as DataSourceBase;
    grid.dataSource = dataSource;
    grid.focus();

    addOnClickListener('btnCreateTable', () => {
      const ds = dataSource as Required<DataSourceBase>;
      const tableName = dataSource.namespace.nextName('table');
      const startPoint = { rowIndex: 0, colIndex: 0 };
      const tableDataSource = new DataSources.Array(
        tableData,
      ) as DataSourceBase;

      console.log(`tableName=${tableName}`);

      ds.createTable(
        tableName,
        startPoint.rowIndex,
        startPoint.colIndex,
        tableDataSource,
        {},
        'fail',
      );
    });

    function addOnClickListener(
      id: string,
      listener: (ev: MouseEvent) => void,
    ) {
      byId<HTMLButtonElement>(id).addEventListener('click', listener);
    }
    function byId<T extends HTMLElement>(id: string): T {
      const el: T = document.getElementById(id) as any;
      if (!el) throw new Error(`Element#${id} is not found!`);
      return el;
    }
  }
})();
