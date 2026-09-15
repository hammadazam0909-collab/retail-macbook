// Firebase Configuration
// Replace these values with your Firebase project credentials from Firebase Console
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCiUokZwaqJU8XR0TOPZ2moMjzZSNj8gzw",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ar-macbook.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ar-macbook",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ar-macbook.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "338602046633",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:338602046633:web:3a651c91dc93baca9a25b8",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-SWER7HBJZE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
