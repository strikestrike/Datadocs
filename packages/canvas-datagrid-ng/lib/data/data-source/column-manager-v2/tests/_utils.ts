import { deepStrictEqual, ok } from 'assert';
import { integerToAlpha } from '../../../../util';
import type { ColumnManager } from '..';
import type { ColumnCounter } from '../column-counter';
import type { LinkedColumnNode } from '../linked-node';
import type { ActionResultWithUndoDescriptor } from '../types';

export const logLList = (llist: LinkedColumnNode) =>
  console.log(JSON.stringify(llist.toJSON()));

export const sequence = (from: number, to: number): number[] => {
  const result: number[] = [];
  for (let i = from; i <= to; i++) result.push(i);
  return result;
};

export const eq = <T>(actual: T, expected: T, msg?: any) =>
  deepStrictEqual(actual, expected, msg);

export const eqArray = <T extends any[]>(actual: T, expected: T) => {
  const alen = actual?.length;
  const elen = expected?.length;
  deepStrictEqual(
    alen,
    elen,
    `actual.length ${alen} !== expected.length ${elen}`,
  );
  for (let i = 0; i < alen; i++) {
    const a = actual[i];
    const e = expected[i];
    const msg =
      `actual[${i}] ${JSON.stringify(a)} !== ` +
      `expected[${i}] ${JSON.stringify(e)}`;
    deepStrictEqual(a, e, msg);
  }
};

export const actionOK = <T extends ActionResultWithUndoDescriptor<any, any>>(
  actionResult: T,
): T => {
  ok(actionResult);
  deepStrictEqual(actionResult.ok, true);
  return actionResult;
};

export const actionFail = <T extends ActionResultWithUndoDescriptor<any, any>>(
  actionResult: T,
): T => {
  ok(actionResult);
  deepStrictEqual(actionResult.ok, false);
  return actionResult;
};

export const assertCount = (
  count: ColumnCounter,
  all: number,
  visible: number,
) => {
  eq(count.all, all, `count.all ${count.all} !== ${all}`);
  eq(count.visible, visible, `count.visible ${count.visible} !== ${visible}`);

  const hidden = all - visible;
  eq(count.hidden, hidden, `count.hidden ${count.hidden} !== ${hidden}`);
};

export const assertColumnSchemas = (
  columns: ColumnManager<{ id: any; title: string }>,
  titles: string[],
  schemaIndexes?: number[],
) => {
  const schemas = columns.getSchemas(0, titles.length);
  const actualTitles = schemas.map((it) => it.title);
  eq(actualTitles, titles);
  if (schemaIndexes) {
    const actualIndexes = schemas.map((it) => it.schemaIndex);
    eq(actualIndexes, schemaIndexes);
  }
};

export const defaultSchemaGetter = (schemaIndex: number, viewIndex: number) => {
  return {
    id: `_` + schemaIndex,
    dataKey: viewIndex as any,
    title: integerToAlpha(viewIndex).toUpperCase(),
  };
};
