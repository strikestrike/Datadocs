//@ts-check
import { datagrid } from '../../lib/main';

(function () {
  document.addEventListener('DOMContentLoaded', main);
  function main() {
    const errorMessage = document.getElementById('errorMessage');

    const DataSources = datagrid.DataSources;
    const profiler = new datagrid.Profiler();

    const showPerformance = getIntFromQuery('performance', 0) ? true : false;
    const grid = datagrid({
      parentNode: document.getElementById('grid'),
      borderDragBehavior: 'move',
      allowMovingSelection: true,
      allowFreezingRows: true,
      allowFreezingColumns: true,
      allowRowReordering: true,
      allowColumnReordering: true,
      allowGroupingColumns: true,
      debug: false,
      enableInternalContextMenu: true,
      showPerformance,
      selectionHandleBehavior: 'single',
      resizeAfterDragged: 'when-multiple-selected',
      allowMergingCells: true,
      fillCellCallback: function (args) {
        return args.newCellData + ' ' + (args.fillingPosition + 1);
      },
    });
    grid.attributes.showUnhideColumnsIndicator = true;
    grid.attributes.showUnhideRowsIndicator = true;
    grid.style.height = '100%';
    grid.style.width = '100%';
    grid.style.columnHeaderCellHorizontalAlignment = 'center';
    grid.addEventListener('error', (error) => {
      console.error(error);
      errorMessage.innerText =
        'Error:' +
        String(error['stack'] || '')
          .split('\n')
          .slice(0, 3)
          .join(' | ');
    });
    const statusMessage = document.getElementById('statusMessage');
    grid.addEventListener('selectionchanged', (ev) =>
      setTimeout(updateGridStatus),
    );
    grid.addEventListener('datasource', (ev) => setTimeout(updateGridStatus));
    window['__debugGrid'] = grid;

    const profilerMessage = document.getElementById('profilerMessage');
    grid.profiler = profiler;
    profiler.listener = profilerMessage;

    /** @type {HTMLInputElement} */
    //@ts-ignore
    const filePicker = document.getElementById('filePicker');

    document
      .getElementById('buttonTogglePerformance')
      .addEventListener('click', (ev) => {
        ev.preventDefault();
        const newState = !grid.attributes.showPerformance;
        grid.attributes.showPerformance = newState;
        if (!newState) profilerMessage.innerText = '';
        updateQueryString({ key: 'performance', value: newState ? 1 : 0 });
        grid.focus();
      });

    addOnClickListener('buttonEmpty', () => {
      const rows = 1000 * 1000 * 1000 * 1000;
      const cols = 100 * 1000;
      const ds = new DataSources.Empty({ rows, cols });
      ds.editCells([
        { row: 0, column: 0, value: 'A1' },
        { row: 1, column: 0, value: 'A2' },
        { row: 0, column: 1, value: 'B1' },
        { row: 1, column: 1, value: 'B2' },
      ]);
      grid.dataSource = ds;
      grid.focus();
    });
    addOnClickListener('buttonArray', () => {
      const baseData = [];
      for (let i = 0; i < 100; i++) {
        const base = i * 100;
        baseData[i] = { a: base + 1, b: base + 2, c: base + 3, d: base + 4 };
      }
      const dataSource = new DataSources.Array(baseData);
      grid.dataSource = dataSource;
      grid.focus();
    });
    addOnClickListener('buttonCSV', () => {
      filePicker.value = null;
      filePicker.click();
    });
    addOnClickListener('buttonHl', () => {
      grid.updateCustomHighlights([
        {
          startRow: 1,
          endRow: 1,
          startColumn: 2,
          endColumn: 2,
          meta: { userId: '100', color: '#dbeede' },
        },
      ]);
    });
    filePicker.addEventListener('change', (ev) => {
      if (!filePicker.files) return;
      const file = filePicker.files[0];
      if (!file) return;
      console.log(file);

      const dataSource = new DataSources.CSV(file);
      grid.dataSource = dataSource;
      dataSource.reader.init();
      grid.focus();
    });

    addOnClickListener('buttonFilterDemo', () => {
      const ds = grid.dataSource;
      ds.setFilter(
        ds.getCurrentFilters().length > 0
          ? []
          : [{ viewIndex: 0, op: 'contain', value: 2 }],
      );
    });

    /** @type {'desc'|'asc'} */
    let dir;
    addOnClickListener('buttonSortDemo', () => {
      const ds = grid.dataSource;
      dir = dir === 'desc' ? 'asc' : 'desc';
      ds.sort([{ viewIndex: 0, dir }]);
    });

    function updateGridStatus() {
      const { columnIndex, rowIndex } = grid.activeCell;
      const { rows, cols } = grid.dataSource.state;
      const text = [
        `active cell: ${rowIndex},${columnIndex}`,
        `data source: rows=${rows},cols=${cols}`,
      ];
      statusMessage.innerText = text.join('; ');
    }
  }

  function addOnClickListener(id, listener) {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', listener);
  }

  /**
   * @param {string} name
   * @returns {number}
   */
  function getIntFromQuery(name, defaultInt = 0) {
    const value = getStringFromQuery(name);
    if (!value) return defaultInt;
    const result = parseInt(value, 10);
    if (!Number.isSafeInteger(result)) return defaultInt;
    return result;
  }

  /**
   * @param {string} name
   * @returns {string}
   */
  function getStringFromQuery(name) {
    name += '=';
    const parts = location.search.replace(/^\?/, '').split('&');
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.startsWith(name)) {
        const value = part.slice(name.length);
        return decodeURIComponent(value);
      }
    }
    return '';
  }
  /**
   * @param  {Array<{key: string,value:any}>} items
   */
  function updateQueryString(...items) {
    const deleteNames = items.map((it) => it.key + '=');
    let newQueryParts = [];
    const parts = location.search.replace(/^\?/, '').split('&');
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (deleteNames.findIndex((prefix) => part.startsWith(prefix)) >= 0)
        continue;
      newQueryParts.push(part);
    }
    items.forEach((it) => {
      if (it.value === undefined || it.value === null) return;
      newQueryParts.push(`${it.key}=${encodeURIComponent(it.value)}`);
    });
    const newQueryString = '?' + newQueryParts.join('&');
    const newURL = location.href.replace(/\?.+$/, '') + newQueryString;
    history.pushState(null, null, newURL);
  }
})();
