import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB70zT7LUKxVAtos0IP6LhRPdY203XxLx4",
  authDomain: "referbridge.firebaseapp.com",
  projectId: "referbridge",
  storageBucket: "referbridge.appspot.com",
  messagingSenderId: "280892968691",
  appId: "1:280892968691:web:b99516ec81ec2f21e8f186",
};

// Initialize Firebase
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { auth, app, db, storage };
