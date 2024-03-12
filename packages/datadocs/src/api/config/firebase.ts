import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { isLocalhost } from "./isLocalhost";
import { mockAPIEndpoint } from "./mockApiEndpoint";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBX0nT-_BfrlymlhvvRJtCd1HWc1tRWDAU",
  authDomain: "datadocs-front-end.firebaseapp.com",
  projectId: "datadocs-front-end",
  storageBucket: "datadocs-front-end.appspot.com",
  messagingSenderId: "364007121801",
  appId: "1:364007121801:web:fc7eccbc4180b338b6b758",
};

const firebaseLocalConfig = {
  apiKey: "AIzaSyDHsYRL6tR3YgoVObfQ9HcZ-BE_dkQBIMo",
  authDomain: "datadocs-front-end-dev.firebaseapp.com",
  projectId: "datadocs-front-end-dev",
  storageBucket: "datadocs-front-end-dev.appspot.com",
  messagingSenderId: "547168256198",
  appId: "1:547168256198:web:a34bd820f72cb5c29397c7",
};

const firebaseEmulatorHost = "http://localhost:9099";

function getFirebaseConfig() {
  // Because the mock api server will connect to the upstream
  if (mockAPIEndpoint) return firebaseConfig;
  return !isLocalhost ? firebaseConfig : firebaseLocalConfig;
}

// Initialize Firebase App
const app = initializeApp(getFirebaseConfig());

const firebaseAuth = getAuth(app);
if (isLocalhost && !mockAPIEndpoint) {
  connectAuthEmulator(firebaseAuth, firebaseEmulatorHost);
}

function getFirestoreConfig(name: string) {
  const firestoreApp = initializeApp(getFirebaseConfig(), name);
  const firestoreAuth = getAuth(firestoreApp);
  const firestoreDB = getFirestore(firestoreApp);

  if (isLocalhost && !mockAPIEndpoint) {
    connectAuthEmulator(firestoreAuth, firebaseEmulatorHost);
    connectFirestoreEmulator(firestoreDB, "localhost", 8888);
  }
  return { firestoreAuth, firestoreDB };
}

export { firebaseAuth, getFirestoreConfig };
