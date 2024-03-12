import type { ColumnManager } from '.';
import type { ActionResultWithUndoDescriptor } from './types';

/**
 * Elementary action: touch column
 */
export function touch(
  this: ColumnManager<any>,
  index: number,
  isSchemaIndex?: boolean,
): ActionResultWithUndoDescriptor<'touch', 'untouch'> {
  //
  // Example:
  //
  //                 (count.visible=4)
  //    ViewIndex: -1,  0,  1,  2,  3,|  4
  //  SchemaIndex: -1, 99,102+        | ...
  //     Complete: -1, 99,102,103,104,|105+
  //  touch(104) -> false;
  //  touch(105) -> true and incr size
  let viewIndex: number;
  if (isSchemaIndex) {
    const tailSchemaIndex = this.tail.schemaIndex;
    if (index < tailSchemaIndex) return { ok: false };

    const nodes = this.llist.next.count();
    viewIndex = index - tailSchemaIndex + nodes - 1;
  } else {
    viewIndex = index;
  }

  const { visible } = this.count;
  if (viewIndex < visible) return { ok: false };

  const add = viewIndex - visible + 1;
  this.count.add(add);
  return {
    ok: true,
    result: { add },
    undo: { type: 'untouch', args: { sub: add, visible } },
  };
}

/**
 * Elementary action: untouch column
 */
export function untouch(
  this: ColumnManager<any>,
  sub: number,
): ActionResultWithUndoDescriptor<'untouch', 'touch'> {
  const ok = this.count.decr(sub);
  if (!ok) return { ok: false };

  const lastVisible = this.lastVisible;
  return {
    ok: true,
    result: {},
    undo: {
      type: 'touch',
      args: {
        add: sub,
        viewIndex: lastVisible.viewIndex + sub,
      },
    },
  };
}
