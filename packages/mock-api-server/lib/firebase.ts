import type { FirebaseApp } from "firebase/app";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "./config";

let firebaseApp: FirebaseApp;
export function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;
  return (firebaseApp = initializeApp(firebaseConfig));
}
export function getFirebaseAuth() {
  const app = getFirebaseApp();
  return getAuth(app);
}
