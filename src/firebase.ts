// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDWwbl-EfJ2Ks3LG1rRf39xeCn_TrM3E9k",
  authDomain: "earsound-v1.firebaseapp.com",
  projectId: "earsound-v1",
  storageBucket: "earsound-v1.firebasestorage.app",
  messagingSenderId: "522125091301",
  appId: "1:522125091301:web:d8b8f79a39bdad90b8cf0c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
});

export const auth = getAuth(app);