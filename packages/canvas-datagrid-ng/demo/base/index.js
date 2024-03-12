//@ts-check
import { datagrid } from '../../lib/main';

/** @typedef {import('../../lib/types').GridClass} GridClass **/
/** @typedef {import('../../lib/types').GridPublicProperties} Grid **/
/** @typedef {import('../../lib/types').GridSchemaItem} GridSchemaItem **/
(function () {
  const defaultCols = 1000 * 10;
  const defaultRows = 1000 * 100;

  document.addEventListener('DOMContentLoaded', main);
  function main() {
    const errorMessage = document.getElementById('errorMessage');

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
    window['__debugGrid'] = grid;
    grid.focus();

    const profilerMessage = document.getElementById('profilerMessage');
    grid.profiler = profiler;
    profiler.listener = profilerMessage;

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
    document
      .getElementById('buttonAddButton')
      .addEventListener('click', (ev) => {
        ev.preventDefault();
        if (!grid.activeCell) return;
        const { columnIndex, rowIndex } = grid.activeCell;
        /** @type {SVGElement} */
        //@ts-ignore
        const icon = document.getElementById('icon1').cloneNode(true);
        icon.removeAttribute('id');
        grid.addButton(
          columnIndex,
          rowIndex,
          { x: 0, y: 0 },
          [
            {
              title: 'Test Button',
              click: () => console.log('test'),
            },
          ],
          icon,
        );
      });

    applyLoadingStateData(grid);
    setTimeout(() => applyMockData(grid), 300);
  }

  /**
   * @param {Grid} grid
   */
  function applyMockData(grid) {
    const cols = getIntFromQuery('cols', defaultCols);
    const rows = getIntFromQuery('rows', defaultRows);
    updateQueryString(
      { key: 'cols', value: cols },
      { key: 'rows', value: rows },
    );

    /** @type {GridSchemaItem[]} */
    const schema = [];
    for (let colIndex = 0; colIndex < cols; colIndex++) {
      const name = grid.integerToAlpha(colIndex);
      schema.push({ title: name.toUpperCase(), name, width: 100 });
    }
    grid.schema = schema;

    let count = 0;
    const defaultData = [];
    const defaultDataRows = 10;
    for (let row = 0; row < defaultDataRows; row++) defaultData[row] = {};
    for (let row = 0; row < defaultDataRows; row++)
      for (let col = 0; col < 10; col++)
        defaultData[row][grid.integerToAlpha(col)] = ++count;

    const isInt = /^\d+$/;
    const data = new Proxy([], {
      get: (target, name) => {
        // console.log('get', name, new Error().stack);
        if (name === 'length') return rows;
        //@ts-ignore
        if (typeof name === 'string' && isInt.test(name)) {
          //@ts-ignore
          const index = parseInt(name, 10);
          if (!target[name])
            target[name] = index < defaultDataRows ? defaultData[index] : {};
        }
        return target[name];
      },
    });
    grid.data = data;
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

  /**
   * @param {Grid} grid
   * @param {string} [status]
   */
  function applyLoadingStateData(grid, status) {
    grid.schema = [{ title: 'Loading', name: 'status', width: 300 }];
    grid.data = [{ status: `Loading data: ${status || '...'}` }];
  }

  /**
   * @param {string} url
   * @param {Grid} grid
   * @param {(csv: string) => void} callback
   */
  function requestCSV(url, grid, callback) {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('progress', function (e) {
      const status =
        'Loading data: ' +
        e.loaded +
        ' of ' +
        (e.total || 'unknown') +
        ' bytes...';
      grid.data = [{ status }];
    });
    xhr.addEventListener('load', function (e) {
      grid.data = [{ status: 'Loading data ' + e.loaded + '...' }];
      callback(xhr.responseText);
    });
    xhr.open('GET', url);
    xhr.send();
  }

  /**
   * @param {string} csv
   * @returns {{data:any[],schema:any[]}}
   */
  function parseCSV(csv) {
    const data = [];
    let schema = [];
    const rows = csv.split('\n');
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      if (!rows[rowIndex]) continue;
      const cols = rows[rowIndex].split(',');
      if (rowIndex === 0) {
        schema = cols;
        schema = schema.map((it, index) => `C${index}`);
        console.log(schema);
        continue;
      }
      /** @type {any} */
      const row = {};
      for (let colIndex = 0; colIndex < cols.length; colIndex++) {
        const col = cols[colIndex];
        const colName = schema[colIndex];
        row[colName] = col;
      }
      data.push(row);
    }
    const finalSchema = schema.map((it) => {
      const base = { name: it };
      if (it === 'C0' || it === 'C1') {
        base.width = 80;
      }
      return base;
    });
    return { data, schema: finalSchema };
  }
})();
