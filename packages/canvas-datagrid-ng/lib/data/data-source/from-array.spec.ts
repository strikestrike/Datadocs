//@ts-nocheck
/// <reference types="mocha" />

import { deepStrictEqual } from 'assert';
import { DataSourceFromArray } from './from-array';

function assertShape<T>(actual: T, shape: Partial<T>) {
  Object.keys(shape).forEach((prop) => {
    deepStrictEqual(
      actual?.[prop],
      shape[prop],
      `The property '${prop}' doesn't equal expected value`,
    );
  });
}

describe('Test DataSourceFromArray', () => {
  const data1 = [{ name: 'Lee', age: 30, gender: 'M' }];
  const data2 = [
    { name: 'Lee', age: 30, gender: 'M' },
    { age: 46, name: 'Kim', gender: 'F' },
    { name: 'Suzuki', age: 33, gender: 'M' },
    { name: 'Schmidt', age: 32, gender: 'M' },
    { name: 'Martin', impurity: 'lalala', age: 29, gender: 'M' },
    { name: 'Kumbhar', age: 45, gender: 'M' },
    { name: 'Ali', age: 35, gender: 'M' },
    { name: 'Ivanov', age: 40, gender: 'M' },
  ];

  it('can be created from a empty array', () => {
    const dataSource = new DataSourceFromArray([]);
    deepStrictEqual(typeof dataSource.addListener, 'function');
    deepStrictEqual(typeof dataSource.getDataFrame, 'function');
  });

  it('is an event target', function (resolve) {
    this.timeout(100);
    const dataSource = new DataSourceFromArray([]);
    dataSource.addListener((event) => resolve());
    dataSource.dispatchEvent({ name: 'test' });
  });

  it('creates correct state', () => {
    const dataSource = new DataSourceFromArray(data1);
    const state = dataSource.state;
    assertShape(state, {
      cols: Object.keys(data1[0]).length,
      rows: data1.length,
      initialized: true,
      loading: false,
    });
  });

  it('responses correct data frame (empty)', () => {
    const dataSource = new DataSourceFromArray(data1);
    const data = dataSource.getDataFrame({
      startRow: -1,
      endRow: -1,
      startColumn: -1,
      endColumn: -1,
    });
    assertShape(data, {
      cells: [],
      columns: [],
    });
  });

  it('responses correct data frame (empty cells)', () => {
    const dataSource = new DataSourceFromArray(data1);
    const data = dataSource.getDataFrame({
      startRow: -1,
      endRow: -1,
      startColumn: -1,
      endColumn: 999,
    });
    deepStrictEqual(data.cells, []);
    deepStrictEqual(data.columns.length, 3);
    assertShape(data.columns[0], {
      type: 'string',
      title: 'name',
      columnViewIndex: 0,
    });
    assertShape(data.columns[1], {
      type: 'number',
      title: 'age',
      columnViewIndex: 1,
    });
    assertShape(data.columns[2], {
      type: 'string',
      title: 'gender',
      columnViewIndex: 2,
    });
  });

  it('responses correct data frame (all data)', () => {
    const dataSource = new DataSourceFromArray(data2);
    const data = dataSource.getDataFrame({
      startRow: -1,
      endRow: 999,
      startColumn: -1,
      endColumn: 999,
    });
    deepStrictEqual(data.cells, [
      ['Lee', 30, 'M'],
      ['Kim', 46, 'F'],
      ['Suzuki', 33, 'M'],
      ['Schmidt', 32, 'M'],
      ['Martin', 29, 'M'],
      ['Kumbhar', 45, 'M'],
      ['Ali', 35, 'M'],
      ['Ivanov', 40, 'M'],
    ]);
  });

  it('responses correct data frame (partial data)', () => {
    const dataSource = new DataSourceFromArray(data2);
    let data = dataSource.getDataFrame({
      startRow: 0,
      endRow: 1,
      startColumn: 0,
      endColumn: 0,
    });
    deepStrictEqual(data.cells, [['Lee'], ['Kim']]);

    data = dataSource.getDataFrame({
      startRow: 2,
      endRow: 2,
      startColumn: 0,
      endColumn: 1,
    });
    deepStrictEqual(data.cells, [['Suzuki', 33]]);
  });

  const wideData = [
    {
      A: 1,
      B: 2,
      C: 3,
      D: 4,
      E: 5,
      F: 6,
      G: 7,
      H: 8,
      I: 9,
    },
  ];

  it('can hide single column and unhide single columns', () => {
    const dataSource = new DataSourceFromArray(wideData);
    const getColumns = () =>
      dataSource.getDataFrame({
        startColumn: 0,
        endColumn: 999,
        startRow: -1,
        endRow: -1,
      }).columns;
    let columns: ReturnType<typeof getColumns>;

    // hide A
    dataSource.hideColumns(0, 1);
    columns = getColumns();
    assertShape(columns, { length: 8 } as any);
    assertShape(columns[0], { dataKey: 'B' });

    // unhide A
    dataSource.unhideColumns(-1);
    columns = getColumns();
    assertShape(columns, { length: 9 } as any);
    assertShape(columns[0], { dataKey: 'A' });
    assertShape(columns[1], { dataKey: 'B' });
  });

  it('can hide multiple columns and unhide multiple columns', () => {
    const dataSource = new DataSourceFromArray(wideData);
    const getColumns = () =>
      dataSource.getDataFrame({
        startColumn: 0,
        endColumn: 999,
        startRow: -1,
        endRow: -1,
      }).columns;
    let columns: ReturnType<typeof getColumns>;

    // hide A => _BCDEFGHI
    dataSource.hideColumns(0, 1);
    // hide B => __CDEFGHI
    dataSource.hideColumns(0, 1);
    columns = getColumns();
    assertShape(columns, { length: 7 } as any);
    assertShape(columns[0], { dataKey: 'C' });

    // hide CD => ____EFGHI
    dataSource.hideColumns(0, 2);
    columns = getColumns();
    assertShape(columns, { length: 5 } as any);
    assertShape(columns[0], { dataKey: 'E' });

    // hide GHI => ____EF___
    dataSource.hideColumns(2, 999);
    columns = getColumns();
    assertShape(columns, { length: 2 } as any);
    assertShape(columns[0], { dataKey: 'E' });

    // hide all
    dataSource.hideColumns(0, 999);
    columns = getColumns();
    assertShape(columns, { length: 0 } as any);

    // unhide all => ABCDEFGHI
    dataSource.unhideColumns(-1);
    columns = getColumns();
    assertShape(columns, { length: 9 } as any);
    assertShape(columns[7], { dataKey: 'H' });
  });

  it('can filter data', () => {
    const dataSource = new DataSourceFromArray(data2);
    dataSource.setFilter([{ id: 'gender', value: 'F' }]);
    assertShape(dataSource.state, { rows: 1 });

    dataSource.setFilter([
      { id: 'gender', value: 'F' },
      { id: 'name', value: 'Moo~' },
    ]);
    assertShape(dataSource.state, { rows: 0 });

    dataSource.setFilter([]);
    assertShape(dataSource.state, { rows: 8 });
  });

  it('can sort data after filter', () => {
    const dataSource = new DataSourceFromArray(data2);
    dataSource.setFilter([{ id: 'gender', value: 'M' }]);
    assertShape(dataSource.state, { rows: 7 });

    dataSource.sort([{ id: 'age', dir: 'desc' }]);
    const data = dataSource.getDataFrame({
      startColumn: 0,
      endColumn: 999,
      startRow: 0,
      endRow: 999,
    });
    assertShape(data.cells[0], ['Kumbhar', 45]);
  });
});
