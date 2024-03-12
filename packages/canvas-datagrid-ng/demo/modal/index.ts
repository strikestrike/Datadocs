//@ts-check
import { BorderDragBehavior, datagrid } from '../../lib/main';
import { SweetAlertProvider } from './modal-provider.js';

(function () {
  document.addEventListener('DOMContentLoaded', main);
  function main() {
    const DataSources = datagrid.DataSources;

    const container = document.getElementById('grid');
    if (!container) return alert(`container #grid is not found!`);

    const grid = datagrid({
      parentNode: container,
      borderDragBehavior: 'move' as BorderDragBehavior,
      allowMovingSelection: true,
      allowFreezingRows: true,
      allowFreezingColumns: true,
      allowRowReordering: true,
      allowColumnReordering: true,
      allowGroupingColumns: true,
      debug: false,
      enableInternalContextMenu: true,
      selectionHandleBehavior: 'single',
      resizeAfterDragged: 'when-multiple-selected',
      allowMergingCells: true,
    });
    grid.style.height = '100%';
    grid.style.width = '100%';
    grid.style.columnHeaderCellHorizontalAlignment = 'center';
    window['__debugGrid'] = grid;

    const rows = 1000 * 1000 * 1000 * 1000;
    const cols = 100 * 1000;
    const ds = new DataSources.Empty({ rows, cols });
    ds.editCells([
      { row: 0, column: 0, value: 'A1' },
      { row: 1, column: 0, value: 'A2' },
      { row: 0, column: 1, value: 'B1' },
      { row: 1, column: 1, value: 'B2' },
    ]);
    grid.dataSource = ds as any;
    grid.modalProvider = new SweetAlertProvider();
    grid.focus();

    addOnClickListener('buttonShowModal', () => {
      grid
        .openConfirmDialog({
          escapable: false,
          name: 'BEFORE_MERGE_UPSTREAM',
          title: 'Upstream data is modified',
          message:
            'Do you want the app merge your local offline changes automatically?<br />' +
            'Or resolve conflicts by yourself?',
        })
        .then((result) => {
          console.log(result);
          ds.editCells([{ column: 0, row: 0, value: JSON.stringify(result) }]);
          ds.dispatchEvent({ name: 'edit' });
        });
    });

    function addOnClickListener(id, listener) {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', listener);
    }
  }
})();
