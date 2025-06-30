import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// This configuration is now loaded from environment variables.
// Make sure your .env file is populated with the correct values from your Firebase project.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let firebaseReady = false;

// Check if all required environment variables are set
const areCredsSet =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId;

if (areCredsSet && !firebaseConfig.apiKey.startsWith("your_")) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    firebaseReady = true;
  } catch (e) {
    console.error("Firebase initialization error:", e);
    // Set to null to indicate services are not available
    app = null!;
    auth = null!;
    db = null!;
    storage = null!;
    firebaseReady = false;
  }
} else {
  console.warn("Firebase credentials are not set correctly in your .env file. Firebase services will be disabled.");
  app = null!;
  auth = null!;
  db = null!;
  storage = null!;
  firebaseReady = false;
}


export { auth, app, db, storage, firebaseReady };
