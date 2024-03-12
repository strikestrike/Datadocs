import type { EditCellDescriptor } from '@datadocs/canvas-datagrid-ng/lib/data/data-source/spec';
import type { FromDuckDbThis } from './internal-types';
import type { Metadata } from './types/metadata';

export async function editCells(
  this: FromDuckDbThis,
  edit: EditCellDescriptor[],
  replace?: boolean,
) {
  const tbname = this.getTableNameForUpdate();
  let connID: string;
  for (const change of edit) {
    const column = this.getHeader(change.column);
    // TODO: Remove EXPERIMENTAL.AUTOCREATECOLUMNS
    const isVirtual = !!this.virtualColumns[column.dataKey];
    if (isVirtual) continue;

    if (typeof change.meta !== 'undefined') {
      // TODO: save meta info
    }

    if (change?.style) {
      if (typeof connID !== 'string') {
        connID = await this.dbManager.createConnection();
      }
      // console.log('debug here ==== edit cell style === ', change);
      await this.metadataTable.editCellStyle(
        change.row,
        column.id,
        change.style as Metadata['style'],
        connID,
      );
    }

    if (change?.meta && 'linkData' in change.meta) {
      if (typeof connID !== 'string') {
        connID = await this.dbManager.createConnection();
      }

      const linkData = change.meta.linkData as Metadata['linkData'];
      await this.metadataTable.editCellLinkData(
        change.row,
        column.id,
        linkData,
        connID,
      );
    }

    if (typeof change.value !== 'undefined') {
      // The query is for testing only
      if (typeof connID !== 'string')
        connID = await this.dbManager.createConnection();
      await this.dbManager.query(
        `UPDATE ${tbname} ` +
          `SET ${column.id} = '${change.value}' ` +
          `WHERE id IN (` +
          `  SELECT id FROM (` +
          `    SELECT id, row_number() OVER () AS RowNum FROM ${tbname}` +
          `  ) t1 WHERE RowNum = ${change.row + 1}` +
          `)`,
        connID,
      );
    }
  }

  if (typeof connID === 'string') await this.dbManager.closeConnection(connID);
  return true;
}
