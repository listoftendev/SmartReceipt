import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// TODO: Replace with your actual Firebase Project config from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAK8XvRQQXl8tEwMSMCojeTXXmOLZPsvBU",
  authDomain: "smartreceipt-92778.firebaseapp.com",
  projectId: "smartreceipt-92778",
  storageBucket: "smartreceipt-92778.firebasestorage.app",
  messagingSenderId: "122930660767",
  appId: "1:122930660767:web:25993eddc030b4b2e1a9aa",
  measurementId: "G-JEH0DKTYJF"
};

// Initialize Firebase only once
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Auth with AsyncStorage for React Native to persist login sessions
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

const db = getFirestore(app);

export { auth, db };
