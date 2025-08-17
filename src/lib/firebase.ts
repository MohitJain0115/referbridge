
// import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
// import { getAuth, type Auth } from 'firebase/auth';
// import { getFirestore, type Firestore } from 'firebase/firestore';
// import { getStorage, type FirebaseStorage } from 'firebase/storage';
// import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
// };

// let app: FirebaseApp;
// let auth: Auth;
// let db: Firestore;
// let storage: FirebaseStorage;
// let analytics: Analytics | null = null;
// let firebaseReady = false;

// // Check that all required environment variables are present
// if (
//   firebaseConfig.apiKey &&
//   firebaseConfig.authDomain &&
//   firebaseConfig.projectId &&
//   firebaseConfig.storageBucket &&
//   firebaseConfig.messagingSenderId &&
//   firebaseConfig.appId
// ) {
//     try {
//       app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
//       auth = getAuth(app);
//       db = getFirestore(app);
//       storage = getStorage(app);
      
//       if (typeof window !== 'undefined') {
//         isSupported().then(supported => {
//           if (supported) {
//             analytics = getAnalytics(app);
//           }
//         });
//       }

//       firebaseReady = true;
//     } catch (e) {
//       console.error("Firebase initialization error:", e);
//       app = null!;
//       auth = null!;
//       db = null!;
//       storage = null!;
//       analytics = null;
//       firebaseReady = false;
//     }
// } else {
//     console.error("Firebase environment variables are not set correctly.");
// }


// export { auth, app, db, storage, analytics, firebaseReady };



import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

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
let analytics: Analytics | null = null;
let firebaseReady = false;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Initialize analytics only in browser environment
  if (typeof window !== 'undefined') {
    isSupported().then(supported => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    }).catch(error => {
      console.warn("Analytics initialization failed:", error);
    });
  }

  firebaseReady = true;
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
  firebaseReady = false;
}

export { auth, app, db, storage, analytics, firebaseReady };