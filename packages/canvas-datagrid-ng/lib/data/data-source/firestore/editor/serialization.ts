import {
  serverTimestamp,
  increment,
  arrayUnion,
  FieldValue,
  arrayRemove,
  deleteField,
} from 'firebase/firestore';

export type FirestoreFieldMeta = {
  method:
    | 'serverTimestamp'
    | 'increment'
    | 'arrayUnion'
    | 'arrayRemove'
    | 'deleteField';
  path: Array<string | number>;
  params: any[];
};
const firestoreFieldMethods = {
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  deleteField,
};

export function strinigfy(payload: any | undefined | null) {
  if (!payload) return { payload: '', payloadMeta: [] };

  const payloadMeta: FirestoreFieldMeta[] = [];
  const json = JSON.stringify(payload, getJsonReplacer(payloadMeta));
  return { payload: json, payloadMeta };
}

export function parse(input: { payload: string; payloadMeta: any[] }) {
  if (!input.payload) return {};

  const parsed = JSON.parse(input.payload);
  applyFirestoreField(parsed, input.payloadMeta);
  return parsed;
}

function applyFirestoreField(target: any, meta: FirestoreFieldMeta[]) {
  for (let i = 0; i < meta.length; i++) {
    const { method, path, params } = meta[i];
    if (!Object.prototype.hasOwnProperty.call(firestoreFieldMethods, method))
      throw new Error(
        `Unknown Firestore method "${method}" in field ${path.join('.')}`,
      );

    const field = firestoreFieldMethods[method].apply(this, params);
    let ptr = target;
    path.forEach((key, index) => {
      if (
        ptr === null ||
        ptr === undefined ||
        !Object.prototype.hasOwnProperty.call(ptr, key)
      )
        throw new Error(`Unreachable object path ${path.join('.')}`);

      if (index === path.length - 1) ptr[key] = field;
      else ptr = ptr[key];
    });
  }
}

function getJsonReplacer(metaStorage: FirestoreFieldMeta[]) {
  const objectToPath = new Map<any, string>();
  return function (key: string | number, value: any) {
    const basePath = objectToPath.get(this);
    let path: (string | number)[];
    if (basePath) path = [...JSON.parse(basePath), key];
    else path = [];

    if (value instanceof FieldValue) {
      const method = value['_methodName'];
      switch (method) {
        case 'increment':
          metaStorage.push({ method, path, params: [value['_operand']] });
          return null;
        case 'serverTimestamp':
        case 'deleteField':
          metaStorage.push({ method, path, params: [] });
          return null;
        case 'arrayUnion':
        case 'arrayRemove':
          metaStorage.push({ method, path, params: [value['_elements']] });
          return null;
        default:
          throw new Error(
            `Unknown Firestore method "${method}" in field ${path.join('.')}`,
          );
      }
    }

    if (value === Object(value)) objectToPath.set(value, JSON.stringify(path));
    return value;
  };
}
