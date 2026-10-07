import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: "AIzaSyCaY7kK-Fe0z4QQzrvwyWYKcnj7ImbMXdI",
  authDomain: "royal-x11-85e44.firebaseapp.com",
  databaseURL: "https://royal-x11-85e44-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "royal-x11-85e44",
  storageBucket: "royal-x11-85e44.firebasestorage.app",
  messagingSenderId: "1082777928409",
  appId: "1:1082777928409:web:d678293f6ece0f510334c8",
  measurementId: "G-64CM1VVPT5"
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getDatabase(app);
export const auth = getAuth(app);
