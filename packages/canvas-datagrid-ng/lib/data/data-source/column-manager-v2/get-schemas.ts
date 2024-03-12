import type { ColumnManager } from '.';
import type { SchemaItemWithIndex } from './types';

/**
 * Get schemas that has an extra field `schemaIndex` for sequential columns
 */
export function getSchemas<SchemaItem extends { id: any }>(
  this: ColumnManager<SchemaItem>,
  viewIndexBegin: number,
  count = 1,
): SchemaItemWithIndex<SchemaItem>[] {
  const { schemas, count: counter } = this;
  const schemaIndexes = this.viewIndex.resolveMulti(viewIndexBegin, count);
  return new Array(schemaIndexes.length).fill(null).map((_, index) => {
    const schemaIndex = schemaIndexes[index];
    const viewIndex = viewIndexBegin + index;
    let schema: SchemaItem = schemas[schemaIndex];
    if (!schema) {
      const hiddenNum = counter.getHiddenNumBefore(viewIndex);
      const defaultViewIndex = viewIndex + hiddenNum;
      schema = this.defaultColumnGetter(schemaIndex, defaultViewIndex);
    }
    if (!schema) schema = { id: null } as any;
    return {
      ...schema,
      viewIndex,
      schemaIndex,
    };
  });
}

export function generateDefaultSchemas<SchemaItem extends { id: any }>(
  this: ColumnManager<SchemaItem>,
  ...indexes: Array<[schemaIndex: number, viewIndex: number]>
): SchemaItem[] {
  const result: SchemaItem[] = [];
  indexes.sort((a, b) => a[0] - b[0]);
  for (let i = 0; i < indexes.length; i++) {
    const [schemaIndex, viewIndex] = indexes[i];
    const hiddenNum = this.count.getHiddenNumBefore(viewIndex);
    result.push(this.defaultColumnGetter(schemaIndex, viewIndex + hiddenNum));
  }
  return result;
}
