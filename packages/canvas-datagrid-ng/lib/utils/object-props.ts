export function copyGetterSetter<Target, Prototype>(
  target: Target,
  prototype: Prototype,
  thiz: unknown = target,
): Target {
  const prototypeNames = Object.getOwnPropertyNames(prototype);
  for (let i = 0; i < prototypeNames.length; i++) {
    const key = prototypeNames[i];
    const descriptor = Object.getOwnPropertyDescriptor(prototype, key);

    if ('value' in descriptor || descriptor.writable) continue;

    const { get, set } = descriptor;
    if (typeof get === 'function' || typeof set === 'function') {
      Object.defineProperty(target, key, {
        get: get ? get.bind(thiz) : undefined,
        set: set ? set.bind(thiz) : undefined,
        enumerable: descriptor.enumerable,
        configurable: descriptor.configurable,
      });
    }
  }
  return target;
}

export function copyPlainFields<Target, Source>(
  target: Target,
  src: Source,
  readonly?: boolean,
): Target {
  const fieldNames = Object.getOwnPropertyNames(src);
  for (let i = 0; i < fieldNames.length; i++) {
    const key = fieldNames[i];
    const descriptor = Object.getOwnPropertyDescriptor(src, key);
    if ('value' in descriptor === false) continue;
    if (
      descriptor.writable !== true ||
      descriptor.enumerable !== true ||
      descriptor.configurable !== true ||
      descriptor.get ||
      descriptor.set
    )
      continue;

    if (readonly) descriptor.writable = true;
    Object.defineProperty(target, key, descriptor);
  }
  return target;
}
