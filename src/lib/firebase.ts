import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCXb-i_tL5bTj4g-9gSROEyh3iV3H8G_U0",
  authDomain: "referbridge.firebaseapp.com",
  projectId: "referbridge",
  storageBucket: "referbridge.firebasestorage.app",
  messagingSenderId: "365313904576",
  appId: "1:365313904576:web:658b7250424a13e7178121",
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let firebaseReady = false;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  firebaseReady = true;
} catch (e) {
  console.error("Firebase initialization error:", e);
  app = null!;
  auth = null!;
  db = null!;
  storage = null!;
  firebaseReady = false;
}

export { auth, app, db, storage, firebaseReady };
