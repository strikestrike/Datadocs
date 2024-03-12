import { ok } from 'assert';
import { getDuckDBForTest } from './test-utils';
import { MetadataTable, getEmptyMetadata } from '../MetadataTable';
import type { DuckDBState } from '../types/db-state';
import type {
  CellNumberAccountingFormat,
  CellNumberCurrencyFormat,
} from '@datadocs/canvas-datagrid-ng';

describe('Metadata Table', () => {
  let count = 0;
  const nextTableName = () => `___metadata_table_name_${count++}`;
  const initMetadataTable = async () => {
    const { db, connID } = await getDuckDBForTest();
    const metadataTable = new MetadataTable(db, {
      fields: tableFields,
    } as DuckDBState);
    metadataTable.setMetadataTableName(nextTableName(), nextTableName());
    await metadataTable.init();
    return { metadataTable, connID, db };
  };

  const tableFields = [
    { name: 'price', type: 'float' },
    { name: 'location', type: 'string' },
    { name: 'organization', type: 'string' },
    { name: 'email', type: 'string' },
  ];
  const accountingDataFormat = {
    dataFormat: {
      type: 'number',
      format: 'accounting',
      decimalPlaces: 3,
      currency: 'usd',
    } as CellNumberAccountingFormat,
  };
  const scientificDataFormat = {
    dataFormat: {
      type: 'number',
      format: 'currency',
      decimalPlaces: 3,
      currency: 'pounds',
    } as CellNumberCurrencyFormat,
  };

  it('Insert same metadata will not create new record', async function () {
    const { metadataTable, connID, db } = await initMetadataTable();

    const metadata = metadataTable.getNewMetadataFromStyle(
      getEmptyMetadata(),
      accountingDataFormat,
    );

    const r1 = await metadataTable.getOrInsertMetadata(metadata, connID);
    const r2 = await metadataTable.getOrInsertMetadata(metadata, connID);

    ok(r1 === r2);
    await db.closeConnection(connID);
  });

  it('Edit metadata', async function () {
    const { metadataTable, connID, db } = await initMetadataTable();
    const rowIndex = 10;

    // insert metadata to price column
    await metadataTable.editCellStyle(
      rowIndex,
      'price',
      accountingDataFormat,
      connID,
    );
    metadataTable.clear();
    let row = await metadataTable.getMetadataRow(rowIndex);
    ok(row.getColumnMetadataRef('price') != null);
    ok(row.getColumnMetadataRef('location') == null);

    // insert metadata into location field should have the same metadata ref
    await metadataTable.editCellStyle(
      rowIndex,
      'location',
      accountingDataFormat,
      connID,
    );
    metadataTable.clear();
    row = await metadataTable.getMetadataRow(rowIndex);
    ok(
      row.getColumnMetadataRef('price') ===
        row.getColumnMetadataRef('location'),
      'Should have the same metadata ref',
    );

    await db.closeConnection(connID);
  });

  it('Edit cell metadata in combination with clear column metadata', async function () {
    const { metadataTable, connID, db } = await initMetadataTable();
    const rowIndex = 10;

    await metadataTable.editCellStyle(
      rowIndex,
      'price',
      accountingDataFormat,
      connID,
    );
    await metadataTable.editCellStyle(
      rowIndex,
      'location',
      accountingDataFormat,
      connID,
    );

    metadataTable.clear();
    await metadataTable.clearTableColumnStyle(
      'price',
      accountingDataFormat,
      true,
    );

    metadataTable.clear();
    let row = await metadataTable.getMetadataRow(rowIndex);
    let priceMetadata = row.getColumnMetadata('price');
    const locationMetadata = row.getColumnMetadata('location');

    ok(
      priceMetadata.style.dataFormat?.type == null,
      'Price data format should be empty',
    );
    ok(
      locationMetadata.style.dataFormat?.format == 'accounting',
      'Location data format should be the same',
    );

    await metadataTable.editCellStyle(
      rowIndex,
      'price',
      scientificDataFormat,
      connID,
    );
    metadataTable.clear();
    row = await metadataTable.getMetadataRow(rowIndex);
    priceMetadata = row.getColumnMetadata('price');
    ok(
      priceMetadata.style.dataFormat?.format == 'currency',
      'Price data format should be currency',
    );

    await db.closeConnection(connID);
  });
});
