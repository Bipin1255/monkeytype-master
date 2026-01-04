// frontend/src/ts/constants/firebase-config-live.ts

export const firebaseConfig = {
  apiKey: "AIzaSyBlcUAuskfuB0riHr0EAOmkmVMAoeiwmaE",
  authDomain: "mastermonkey-auth.firebaseapp.com",
  // databaseURL is optional for most setups; keep it empty if you don't have it
  databaseURL: "",
  projectId: "mastermonkey-auth",
  storageBucket: "mastermonkey-auth.firebasestorage.app",
  messagingSenderId: "263257780372",
  appId: "1:263257780372:web:20588bc96efda29d334481",
};

// Optional helpers (some parts of the codebase may use these)
export const firebaseEnabled = true as const;
export const FIREBASE_CONFIG = firebaseConfig as const;
