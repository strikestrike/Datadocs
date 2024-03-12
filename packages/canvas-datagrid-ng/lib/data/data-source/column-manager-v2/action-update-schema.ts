import type { ColumnManager } from '.';
import { findLinkedNode } from './linked-node/find';
import type { ActionResultWithUndoDescriptor } from './types';
import type { UndoArgsMap } from './types/action-result';

const INVALID_ACTION: Readonly<ActionResultWithUndoDescriptor<any, any>> =
  Object.freeze({
    ok: false,
  });

export type UpdateSchemaPayload<SchemaItem> = {
  fields: Partial<SchemaItem>;
  unset?: Array<keyof SchemaItem>;
};

/**
 * Elementary action: update schema (E.g.; update title, ...)
 */
export function updateSchema<SchemaItem extends { id: any }>(
  this: ColumnManager<SchemaItem>,
  payload: UpdateSchemaPayload<SchemaItem>,
  index: number,
  isSchemaIndex?: boolean,
): ActionResultWithUndoDescriptor<'update', 'update'> {
  if (index < 0) return INVALID_ACTION;

  let schemaIndex: number;
  let viewIndex: number;
  if (isSchemaIndex) {
    schemaIndex = index;
    const result = findLinkedNode(schemaIndex, this.llist, -1);
    if (result.node.isRest) {
      viewIndex = result.offset + result.offset;
      if (viewIndex >= this.count.visible) return INVALID_ACTION;
    } else if (result.parent) {
      viewIndex = result.parentOffset;
    }
  } else {
    viewIndex = index;
    if (viewIndex >= this.count.visible) return INVALID_ACTION;

    schemaIndex = this.viewIndex.resolve(viewIndex);
    if (schemaIndex < 0) return INVALID_ACTION;
  }
  const args: Parameters<typeof _applySchema<SchemaItem>> = [
    schemaIndex,
    viewIndex,
    payload,
  ];
  const undoArgs: ReturnType<typeof _applySchema> = _applySchema.apply(
    this,
    args,
  );
  return {
    ok: true,
    result: {},
    undo: {
      type: 'update',
      args: undoArgs,
    },
  };
}

function _applySchema<SchemaItem extends { id: any }>(
  this: ColumnManager<SchemaItem>,
  schemaIndex: number,
  viewIndex: number,
  payload: UpdateSchemaPayload<SchemaItem>,
): UndoArgsMap['update'] {
  const oldSchema = this.schemas[schemaIndex];
  const undo: UndoArgsMap['update'] = { schemaIndex, fields: {}, unset: [] };
  const fields = Object.entries(payload.fields);

  // new schema for the column
  if (!oldSchema) {
    // noop operation
    if (fields.length === 0) return undo;

    const schema: SchemaItem = this.generateDefaultSchemas([
      schemaIndex,
      viewIndex,
    ])[0];
    this.schemas[schemaIndex] = schema;

    undo.id = schema.id;
    undo.unset.push(...Object.keys(schema));

    for (const [fieldName, fieldValue] of fields)
      schema[fieldName] = fieldValue;
    return undo;
  }

  undo.id = oldSchema.id;
  for (const [fieldName, fieldValue] of fields) {
    if (hasKey(oldSchema, fieldName))
      undo.fields[fieldName] = oldSchema[fieldName];
    else undo.unset.push(fieldName);
    oldSchema[fieldName] = fieldValue;
  }
  if (Array.isArray(payload.unset)) {
    for (const fieldName of payload.unset) {
      if (!hasKey(oldSchema, fieldName)) continue;
      undo.fields[fieldName] = oldSchema[fieldName];
      delete oldSchema[fieldName];
    }
  }
  return undo;
}

function hasKey<T>(obj: T, key: any): key is keyof T {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
