import type { DataSourceBase } from '../../data-source/spec';
import type { DataEvent } from '../spec/events';
import type { FirestoreConnectInfo } from './base/connect-info';

import { DefaultNamedRangeManager } from '../../../named-ranges/default-manager';
import { getDefaultDataSourceState } from '../../data-source/defaults';
import { DefaultMergedCellsManager } from '../../data-source/merged-cells-manager';
import { SizesManager } from '../../data-source/sizes-manager';
import { DefaultDataEventTarget } from '../../event-target';
import { DefaultComponentProvider } from '../../namespace/default-component-provider';
import { DefaultNamespaceController } from '../../namespace/default-controller';
import { ColumnsManager } from '../columns-manager';
import { InMemoryHiddenRangeStore } from '../in-memory-hidden-range-store';
import { InMemoryPositionHelper } from '../in-memory-position-helper';
import { TableManager } from '../table-manager';
import { FirestoreConnector } from './api/connect';
import { FirestoreUserDocOpener } from './api/open-user-db';
import { UserStatesManager } from './user-states/manager';
import { FirestoreContext } from './base/context';
import { UpstreamSubscriber } from './api/subscribe-docs';
import { FirestoreBasicEditor } from './editor/basic-editor';
import { FirestoreOpPersistenceIDB } from './persistence/idb';
import { updateFirestoreDataSourceState } from './update-state';
import { initColumnHeaders } from './init-columns';
import { getDataFrame } from './get-data-frame';
import { getCellStyle, getCellValue } from './get-cell';
import { editCells } from './edit-cell';
import { FirestoreEditCells } from './editor/edit-cells';
import {
  getHiddenColumns,
  hideColumns,
  unhideColumns,
} from './hide-and-unhide';
import { reorderColumns, reorderRows } from './reorder';
import { createQueueForGettingData } from './get-data-queue';
import type { RowsLoadingQueue } from '../../rows-loader/queue';

/**
 * Follow the spec version `2023-02-09`
 */
export class FirestoreDataSource implements DataSourceBase {
  //#region public fields
  readonly name = 'Firestore';
  readonly namedRanges = new DefaultNamedRangeManager();
  readonly tables = new TableManager();
  readonly namespace = new DefaultNamespaceController([
    new DefaultComponentProvider(this.namedRanges, this.tables),
  ]);
  readonly state = getDefaultDataSourceState();
  readonly columns = new ColumnsManager([]);
  readonly sizes = new SizesManager(this.columns);
  protected readonly hiddenRowRanges = new InMemoryHiddenRangeStore();
  readonly positionHelper = new InMemoryPositionHelper(
    this,
    this.sizes,
    this.hiddenRowRanges,
  );
  readonly mergedCells = new DefaultMergedCellsManager();
  //#endregion public fields

  //#region data event target
  private eventTarget = new DefaultDataEventTarget<DataEvent>();
  addListener = this.eventTarget.addListener;
  removeListener = this.eventTarget.removeListener;
  dispatchEvent = this.eventTarget.dispatchEvent;
  //#endregion

  private grid: any;
  readonly bind = (grid: any) => (this.grid = grid);
  readonly unbind = (grid: any) => (this.grid = null);

  protected readonly persistence = new FirestoreOpPersistenceIDB();
  protected conn: FirestoreConnectInfo;
  protected editorBase: FirestoreBasicEditor;
  protected editor: FirestoreEditCells;
  protected subscriber: UpstreamSubscriber;
  protected userStates: UserStatesManager;
  protected context: FirestoreContext;
  protected userDoc: FirestoreUserDocOpener;
  protected getDataQueue: RowsLoadingQueue;
  protected readonly onFirestoreEvent = () =>
    this.dispatchEvent({ source: this, name: 'load' });

  get connected() {
    if (!this.conn) return false;
    return this.conn.connected;
  }
  get opened() {
    if (!this.context) return false;
    return this.context.opened;
  }

  readonly open = async (conn: FirestoreConnectInfo): Promise<boolean> => {
    this.conn = conn;
    this.context = new FirestoreContext(conn, {
      dispatch: this.onFirestoreEvent,
    });
    this.editorBase = new FirestoreBasicEditor(conn, this.persistence);
    this.editor = new FirestoreEditCells(this.context, this.editorBase);
    this.userStates = new UserStatesManager(this.context, this.editorBase);
    this.subscriber = new UpstreamSubscriber(this.context, this.userStates);
    this.userDoc = new FirestoreUserDocOpener(this.context, this.subscriber);
    this.getDataQueue = createQueueForGettingData(this.context);

    updateFirestoreDataSourceState(this.state, null, true);
    const connected = await new FirestoreConnector(this.conn).connect();
    if (!connected) return connected;

    await this.userDoc.open();
    initColumnHeaders(this.userDoc, this.columns);
    updateFirestoreDataSourceState(this.state, this.userDoc.docBase, false);
    this.dispatchEvent({ name: 'load' });
  };

  protected readonly resolveRowIndex = (rowViewIndex: number) => rowViewIndex;

  readonly deprecated_getAllSchema = () => this.columns.getAll();
  readonly deprecated_getRowData = (rowViewIndex: number) => {
    const result = {};
    const columns = this.columns.getAll();
    const rowIndex = this.resolveRowIndex(rowViewIndex);
    const inMemCaches = this.context.caches;
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const v = inMemCaches.getCellValue(rowIndex, column.id);
      result[column.name] = v;
    }
    return result;
  };

  readonly getHeaderById = (columnId: string) => this.columns.getById(columnId);
  readonly getHeader = (viewIndex: number) => this.columns.get(viewIndex);
  readonly getHeaders = () => this.columns.getAll(true);

  readonly getDataFrame = bind(this, getDataFrame);
  readonly getCellValue = bind(this, getCellValue);
  readonly getCellStyle = bind(this, getCellStyle);

  readonly editCells = bind(this, editCells);

  readonly hideColumns = bind(this, hideColumns);
  readonly unhideColumns = bind(this, unhideColumns);
  readonly getHiddenColumns = bind(this, getHiddenColumns);

  readonly allowReorderRows = () => true;
  readonly allowReorderColumns = () => true;
  readonly reorderRows = bind(this, reorderRows);
  readonly reorderColumns = bind(this, reorderColumns);
}

function bind<T extends (...args: any[]) => any>(
  thiz: FirestoreDataSource,
  method: T,
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>) => method.apply(thiz, args);
}
