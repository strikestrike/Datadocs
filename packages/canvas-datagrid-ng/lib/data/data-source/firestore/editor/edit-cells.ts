import { FDocDataBlockIdAllocator } from '../utils/data-block';
import type { FirestoreContext } from '../base/context';
import type { EditCellDescriptor } from './edit-cells-base';
import { EditCellsQueue, ResolvedEditDescriptor } from './edit-cells-base';
import type { FirestoreBasicEditor } from './basic-editor';
import { pushEditCommitsToFirestore } from './push-edit-commits';
import { pushDataRangeToFirestore } from './push-data-range';

export class FirestoreEditCells {
  static PUSH_THROTTLE = 100;

  private readonly id = new FDocDataBlockIdAllocator();
  private readonly queue = new EditCellsQueue();

  private timer: any;
  private editIndex = 0;

  constructor(
    private readonly context: FirestoreContext,
    private readonly editor: FirestoreBasicEditor,
  ) {}

  readonly edit = (descriptors: EditCellDescriptor[]) => {
    this.queue.init();
    const { caches } = this.context;
    const inMemCaches = caches.inMem;
    for (let i = 0; i < descriptors.length; i++) {
      const edit = descriptors[i];
      this.queue.push(edit);
      const inMemRow = inMemCaches.getForEdit(edit.row);
      inMemRow.data[edit.column] = edit.data;
      inMemRow.style[edit.column] = edit.style;
    }
    if (!this.timer) {
      this.timer = setTimeout(
        this.editCellsTimer,
        FirestoreEditCells.PUSH_THROTTLE,
      );
    }
    return true;
  };

  //#region editCellsTimer
  private readonly editCellsTimer = () => {
    const edits = this.queue.items;
    this.queue.clean();
    delete this.timer;

    if (!edits || edits.length === 0) return;
    const { rowRanges } = this.context;
    edits.sort((a, b) => a.row - b.row);

    const newRows: number[] = [];

    /** key is `rowIndex` */
    const commits = new Map<number, ResolvedEditDescriptor>();

    let range: { row0: number; row1: number };
    for (let i = 0; i < edits.length; i++) {
      const edit = edits[i];
      if (range) {
        if (edit.row < range.row0) range.row0 = edit.row;
        if (edit.row > range.row1) range.row1 = edit.row;
      } else {
        range = {
          row0: edit.row,
          row1: edit.row,
        };
      }

      const { rowIndexes, isNew } = rowRanges.markRow(edit.row);
      const [rowIndex] = rowIndexes;
      if (isNew) newRows.push(rowIndex);

      let commit = commits.get(rowIndex);
      if (!commit) {
        let dataBlock = rowRanges.getBlocksInfoByRowIndex(rowIndex);
        const isNewBlock = !dataBlock;
        if (isNewBlock) {
          dataBlock = {
            id: [this.id.alloc()],
            updatedAt: dataBlock.updatedAt,
          };
          rowRanges.setBlocksInfo(rowIndex, dataBlock);
        }
        commit = new ResolvedEditDescriptor(
          dataBlock.id[0],
          isNewBlock,
          rowIndex,
        );
        commits.set(rowIndex, commit);
      }
      commit.edits.push(edit);
    }

    if (newRows.length > 0) {
      pushDataRangeToFirestore(this.context, this.editor, newRows);
    }
    if (commits.size > 0) {
      const allCommits = Array.from(commits.values());
      pushEditCommitsToFirestore(
        this.context,
        this.editor,
        ++this.editIndex,
        allCommits,
        range,
      );
    }
    return true;
  };
  //#endregion editCellsTimer
}
