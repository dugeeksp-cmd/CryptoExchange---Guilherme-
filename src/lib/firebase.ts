import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyCYzvpB5u-OkCRPfR1s67cJvU7R3OY-kBw",
  authDomain: "herancakids.firebaseapp.com",
  projectId: "herancakids",
  storageBucket: "herancakids.firebasestorage.app",
  messagingSenderId: "998597919534",
  appId: "1:998597919534:web:0c8f7fef8bddb06e3fb0bf",
  measurementId: "G-VJ9TKLJ2ZM"
};

// Initialize Firebase app once
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
