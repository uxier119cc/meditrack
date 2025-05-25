// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDxHSbT3NrlqCcAR50HfC1l8_3xSk2b2ig",
  authDomain: "nps2-2.firebaseapp.com",
  projectId: "nps2-2",
  storageBucket: "nps2-2.firebasestorage.app",
  messagingSenderId: "814464216669",
  appId: "1:814464216669:web:95f020645e09f7fe4367b4",
  measurementId: "G-JT1QT0T0PK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth };