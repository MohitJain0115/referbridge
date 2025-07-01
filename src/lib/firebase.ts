import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Log the config to the browser console for debugging
console.log("Firebase Config Object from process.env:", firebaseConfig);


let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let firebaseReady = false;

const areCredsSet =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId;

if (areCredsSet && !firebaseConfig.apiKey.includes("your_")) {
  try {
    console.log("Attempting to initialize Firebase...");
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    firebaseReady = true;
    console.log("Firebase initialized successfully.");
  } catch (e) {
    console.error("Firebase initialization error:", e);
    app = null!;
    auth = null!;
    db = null!;
    storage = null!;
    firebaseReady = false;
  }
} else {
  console.warn("Firebase credentials are not set correctly in .env file or are placeholders. Firebase services will be disabled.");
  console.log("API Key found:", firebaseConfig.apiKey);
  app = null!;
  auth = null!;
  db = null!;
  storage = null!;
  firebaseReady = false;
}

export { auth, app, db, storage, firebaseReady };
