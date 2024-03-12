//@ts-check
import type { BorderDragBehavior } from '../../lib/main';
import { datagrid } from '../../lib/main';

(function () {
  document.addEventListener('DOMContentLoaded', main);
  function main() {
    const txtDocId = byId<HTMLInputElement>('txtDocId');
    const txtToken = byId<HTMLInputElement>('txtToken');
    loadParamsFromURL();

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
    const ds = new DataSources.Firestore();
    grid.dataSource = ds as any;
    grid.focus();

    addOnClickListener('btnConnect', () => {
      const docId = txtDocId.value;
      const docToken = txtToken.value;
      if (!docId || !docToken)
        return alert(`docId and token are required for connecting!`);
      saveParamsToURL(docId, docToken);
    });

    function loadParamsFromURL() {
      const url = new URL(location.href);
      const docId = url.searchParams.get('doc');
      const docToken = url.searchParams.get('token');
      if (docId) txtDocId.value = docId;
      if (docToken) txtToken.value = docToken;
    }
    function saveParamsToURL(docId: string, token: string) {
      docId = encodeURIComponent(docId);
      token = encodeURIComponent(token);
      location.search = `?docId=${docId}&token=${token}`;
    }
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
