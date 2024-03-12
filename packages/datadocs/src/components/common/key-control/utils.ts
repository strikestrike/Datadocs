export function hasValue<T>(value: T): boolean {
  return value !== undefined && value !== null;
}

export function getElementIndex<T>(list: T[], predicate: (v: T) => boolean) {
  return list.findIndex((v) => predicate(v));
}

export function getFirstElementIndex<T>(
  list: T[],
  predicate: (v: T) => boolean,
  from?: number
): number {
  if (!hasValue(from)) {
    from = -1;
  }

  return list.findIndex((v, i) => predicate(v) && i > from);
}

export function getLastElementIndex<T>(
  list: T[],
  predicate: (v: T) => boolean,
  from?: number
): number {
  if (!hasValue(from)) {
    from = list.length;
  }

  let index = -1;
  let l = from - 1;
  while (l >= 0) {
    if (predicate(list[l])) {
      index = l;
      break;
    }

    l--;
  }

  return index;
}
