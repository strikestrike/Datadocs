export const firebaseConfig = {
  apiKey: "AIzaSyBX0nT-_BfrlymlhvvRJtCd1HWc1tRWDAU",
  authDomain: "datadocs-front-end.firebaseapp.com",
  projectId: "datadocs-front-end",
  storageBucket: "datadocs-front-end.appspot.com",
  messagingSenderId: "364007121801",
  appId: "1:364007121801:web:fc7eccbc4180b338b6b758",
};

export const defaultUser = process.env.DATADOCS_USER || "";
export const defaultPass = process.env.DATADOCS_PASS || "";

export const upstreamEndpoint = "https://internal-api.datadocs.com/v1/";

export const uidCookieName = "dduid";

export const port = 5001;
