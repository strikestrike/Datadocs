//@ts-nocheck
import { copyMethods } from '../util';
import type { GridPrivateProperties } from '../types';

export default function loadGridTreeManager(self: GridPrivateProperties) {
  copyMethods(new GridTreeManager(self), self);
}

export type ToggleTreeType =
  | 'Expand'
  | 'Collapse'
  | 'Toggle'
  | null
  | undefined;

export class GridTreeManager {
  constructor(private readonly grid: GridPrivateProperties) {}

  toggleCollapseTree = (
    rowIndex: number,
    columnIndex: number,
    type?: ToggleTreeType,
  ) => {
    const self = this.grid;
    const tempData = [];
    let collapsedCount = 0;
    if (
      columnIndex == self.cellTree.rowTreeColIndex &&
      (rowIndex > 0 || (rowIndex == 0 && self.cellTree.rows[0].icon))
    ) {
      const ctr = self.cellTree.rows;
      switch (type) {
        case 'Expand':
          ctr[rowIndex].expand = true;
          self.cellTree.origin.rows[ctr[rowIndex].index].expand = true;
          break;

        case 'Collapse':
          ctr[rowIndex].expand = false;
          self.cellTree.origin.rows[ctr[rowIndex].index].expand = false;
          break;

        default:
          ctr[rowIndex].expand = !ctr[rowIndex].expand;
          self.cellTree.origin.rows[ctr[rowIndex].index].expand =
            ctr[rowIndex].expand;
      }
      for (
        let ri = ctr[rowIndex].index + 1;
        ri <= ctr[rowIndex].lastchild;
        ri++
      ) {
        const orTree = self.cellTree.origin.rows[ri];
        if (ctr[rowIndex].expand) {
          orTree.hide = false;
          if (orTree.icon && !orTree.expand) ri = orTree.lastchild;
        } else {
          orTree.hide = true;
        }
      }
    } else if (self.cellTree.columns[rowIndex]) {
      const ctc = self.cellTree.columns[rowIndex];

      switch (type) {
        case 'Expand':
          ctc[columnIndex].expand = true;
          break;

        case 'Collapse':
          ctc[columnIndex].expand = false;
          break;

        default:
          ctc[columnIndex].expand = !ctc[columnIndex].expand;
      }
      for (
        let ci = ctc[columnIndex].index + 1;
        ci <= ctc[columnIndex].lastchild;
        ci++
      ) {
        if (ctc[columnIndex].expand)
          self.cellTree.tempSchema[ci].hidden = false;
        else self.cellTree.tempSchema[ci].hidden = true;
      }
      let rc = 0,
        _ri;

      if (ctc[columnIndex].expand) {
        while (rc < ctc[columnIndex].child) {
          _ri = rowIndex + rc + 1;

          for (
            let _ci = ctc[columnIndex].index;
            _ci <= ctc[columnIndex].lastchild;
            _ci++
          ) {
            if (
              self.cellTree.origin.columns[_ri] &&
              self.cellTree.origin.columns[_ri][_ci].icon &&
              !self.cellTree.origin.columns[_ri][_ci].expand
            ) {
              for (
                let si = _ci + 1;
                si <= self.cellTree.origin.columns[_ri][_ci].lastchild;
                si++
              ) {
                self.cellTree.tempSchema[si].hidden = true;
              }
            }
          }

          rc++;
        }
      }
    }
    const otherData = {};
    const collapsed = [];
    self.cellTree.rows = [];
    self.cellTree.columns = {};
    for (const k in self.cellTree.origin.rows) {
      const tempRow = [];
      const tree = self.cellTree.origin.rows[k];
      if (!tree.hide) {
        const colTrees = [];
        let collapsedColCount = 0;
        const kNum = parseInt(k, 10);
        if (kNum < self.cellTree.columnTreeRowStartIndex) {
          tempData.push(self.originalData[k]);
        } else {
          if (kNum > self.cellTree.columnTreeRowEndIndex) {
            otherData[k] = self.viewData[k];
            collapsedCount++;
          } else {
            for (let l = 0; l < self.originalData[k].length; l++) {
              if (!self.cellTree.tempSchema[l].hidden) {
                if (l < self.cellTree.rowTreeColIndex) {
                  if (!Object.prototype.hasOwnProperty.call(otherData, k))
                    otherData[k] = [];
                  otherData[k].push(self.viewData[k][l]);
                }
                tempRow.push(self.originalData[k][l]);
                if (
                  Object.prototype.hasOwnProperty.call(
                    self.cellTree.origin.columns,
                    k,
                  )
                )
                  colTrees.push(self.cellTree.origin.columns[k][l]);
              } else collapsedColCount++;
            }
            tempRow.push(...Array(collapsedColCount).fill(''));
            if (colTrees.length) {
              colTrees.push(
                ...Array(collapsedColCount)
                  .fill(null)
                  .map(() => {
                    return {};
                  }),
              );
              self.cellTree.columns[k] = colTrees;
            }
            tempData.push(tempRow);
          }
        }
        self.cellTree.rows.push(tree);
      } else {
        for (let l = 0; l < self.cellTree.rowTreeColIndex; l++) {
          tempRow.push(self.viewData[k][l]);
        }
        otherData[k] = tempRow;
        collapsed.push(Array(self.viewData[0].length).fill(''));
        collapsedCount++;
      }
    }
    if (collapsedCount) {
      self.cellTree.rows.push(
        ...Array(collapsedCount)
          .fill(null)
          .map((u, index) => {
            return { index: self.cellTree.rows.length + index };
          }),
      );
      tempData.push(...collapsed);
    }
    for (const k in otherData) {
      const kNum = parseInt(k, 10);
      if (kNum > self.cellTree.columnTreeRowEndIndex)
        tempData[k] = otherData[k];
      else
        for (const l in otherData[k]) {
          tempData[k][l] = otherData[k][l];
        }
    }
    self.viewData = tempData;
  };

  cellTreeExpandCollapse = (
    rowIndex: number,
    columnIndex: number,
    type?: ToggleTreeType,
  ) => {
    const self = this.grid;
    if (
      columnIndex == self.cellTree.rowTreeColIndex &&
      (rowIndex > 0 || (rowIndex == 0 && self.cellTree.rows[0].icon))
    ) {
      const ctr = self.cellTree.rows;
      switch (type) {
        case 'Expand':
          ctr[rowIndex].expand = true;
          break;
        case 'Collapse':
          ctr[rowIndex].expand = false;
          break;
        default:
          ctr[rowIndex].expand = !ctr[rowIndex].expand;
      }
      for (let ri = rowIndex + 1; ri <= ctr[rowIndex].lastchild; ri++) {
        if (ctr[rowIndex].expand) {
          ctr[ri].hide = false;
          if (ctr[ri].icon && !ctr[ri].expand) ri = ctr[ri].lastchild;
        } else {
          ctr[ri].hide = true;
        }
      }
    } else if (self.cellTree.columns[rowIndex]) {
      const ctc = self.cellTree.columns[rowIndex];
      switch (type) {
        case 'Expand':
          ctc[columnIndex].expand = true;
          break;
        case 'Collapse':
          ctc[columnIndex].expand = false;
          break;
        default:
          ctc[columnIndex].expand = !ctc[columnIndex].expand;
      }

      for (let ci = columnIndex + 1; ci <= ctc[columnIndex].lastchild; ci++) {
        if (ctc[columnIndex].expand) self.tempSchema[ci].hidden = false;
        else self.tempSchema[ci].hidden = true;
      }

      let rc = 0,
        ri;
      if (ctc[columnIndex].expand) {
        while (rc < ctc[columnIndex].child) {
          ri = rowIndex + rc + 1;
          for (let ci = columnIndex; ci <= ctc[columnIndex].lastchild; ci++) {
            if (
              self.cellTree.columns[ri] &&
              self.cellTree.columns[ri][ci].icon &&
              !self.cellTree.columns[ri][ci].expand
            ) {
              for (
                let si = ci + 1;
                si <= self.cellTree.columns[ri][ci].lastchild;
                si++
              )
                self.tempSchema[si].hidden = true;
            }
          }
          rc++;
        }
      }
    }
  };

  initCellTreeSettings = () => {
    const self = this.grid;
    if (self.viewData === undefined) return;
    if (self.attributes.rowTree.length > 0 && self.viewData.length > 0) {
      self.cellTree.rows = Array(self.viewData.length)
        .fill(null)
        .map((u, index) => ({ index: index }));
      self.cellTree.rowTreeColIndex = self.attributes.rowTreeColIndex as number;
      let invalidRowTree = false;
      for (const rt of self.attributes.rowTree) {
        if (self.cellTree.rows.length <= rt.end) {
          invalidRowTree = true;
          break;
        }

        for (let ri = rt.begin; ri <= rt.end; ri++) {
          if (ri == rt.begin) {
            self.cellTree.rows[ri].icon = true;
            self.cellTree.rows[ri].lastchild = rt.end;
            self.cellTree.rows[ri].expand = true;
            if (!self.cellTree.rows[ri].parentCount)
              self.cellTree.rows[ri].parentCount = 0;
          } else {
            self.cellTree.rows[ri].hide = false;
            self.cellTree.rows[ri].parentIndex = rt.begin;
            if (self.cellTree.rows[ri] && self.cellTree.rows[ri].parentCount)
              self.cellTree.rows[ri].parentCount += 1;
            else self.cellTree.rows[ri].parentCount = 1;
          }
        }
      }
      // todo: check is the following {} should be changed to []
      if (invalidRowTree) self.cellTree.rows = {} as any;
    }
    if (self.attributes.columnTree.length > 0 && self.viewData.length > 0) {
      self.cellTree.columnTreeRowStartIndex = self.attributes
        .columnTreeRowStartIndex as number;
      self.cellTree.columnTreeRowEndIndex = self.attributes
        .columnTreeRowEndIndex as number;
      const dataColumnLength = Object.keys(self.viewData[0]).length;
      let invalidColumnTree = false;
      for (const ct of self.attributes.columnTree) {
        if (dataColumnLength <= ct.end) {
          invalidColumnTree = true;
          break;
        }

        if (!self.cellTree.columns[ct.row])
          self.cellTree.columns[ct.row] = Array(dataColumnLength)
            .fill(null)
            .map((u, index) => ({ index: index }));

        for (let i = ct.begin; i <= ct.end; i++) {
          const ctc = self.cellTree.columns[ct.row][i];
          if (i == ct.begin) {
            ctc.icon = true;
            ctc.lastchild = ct.end;
            ctc.length = ct.end - ct.begin;
            ctc.expand = true;
            if (ct.child) ctc.child = ct.child;
            else ctc.child = 0;
          }
        }
      }
      self.cellTree.tempSchema = Array(dataColumnLength)
        .fill(null)
        .map(function () {
          return { hidden: false };
        });
      if (invalidColumnTree) self.cellTree.columns = {};
    }
    self.cellTree.origin = {
      rows: self.cellTree.rows,
      columns: self.cellTree.columns,
    };
  };

  /**
   * Expand/Collapse CellTree.
   * @memberof canvasDatagrid
   * @name toggleCellCollapseTree
   * @method
   * @param {array} treeData The array of cellTree to expand or collapse.
   */
  toggleCellCollapseTree = (treeData: { [x in ToggleTreeType]?: any[] }) => {
    const self = this.grid;
    for (const type in treeData) {
      for (const t of treeData[type])
        if (t.length > 0) self.toggleCollapseTree(t[0], t[1], type as any);
    }
    self.draw();
  };

  /**
   * Expand/Collapse CellTree.
   * @memberof canvasDatagrid
   * @name expandCollapseCellTree
   * @method
   * @param {array} treeData The array of cellTree to expand or collapse.
   */
  expandCollapseCellTree = (treeData: { [x in ToggleTreeType]?: any[] }) => {
    const self = this.grid;
    for (const type in treeData) {
      for (const t of treeData[type])
        if (t.length > 0) self.cellTreeExpandCollapse(t[0], t[1], type as any);
    }
    self.draw();
  };
}
