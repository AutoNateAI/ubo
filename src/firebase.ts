import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyDiojaiBrj0nRNIGMVHCFr4zMxEMEkv8S0",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "autonateai-learning-hub.firebaseapp.com",
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || "autonateai-learning-hub",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "autonateai-learning-hub.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "650162209338",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:650162209338:web:cb9626f2e6f9ac3eff6b03",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-D7553DEM0Y",
};

export const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
