import type { Firestore } from 'firebase/firestore';
import {
  collection as _collection,
  doc as _doc,
  deleteDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

export const firestoreEditFn = {
  setDoc,
  updateDoc,
  deleteDoc,
};

function splitPath(path: string): string[] {
  const segments = path.split('/').filter((it) => it);
  if (segments.length < 1) return null;
  return segments;
}

export function collection(store: Firestore, path: string | string[]) {
  const parts = Array.isArray(path) ? path : splitPath(path);
  if (!parts) return;
  return _collection(store, parts[0], ...parts.slice(1));
}

export function doc(store: Firestore, path: string | string[]) {
  const parts = Array.isArray(path) ? path : splitPath(path);
  if (!parts) return;
  return _doc(store, parts[0], ...parts.slice(1));
}
