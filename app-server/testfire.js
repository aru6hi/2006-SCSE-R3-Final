// testFirestoreWrite.js
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Replace these with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuhW2ejVj9qnWMiDhoKTVlYj6Y1vNUY_U",
  authDomain: "car-park-6b6e4.firebaseapp.com",
  projectId: "car-park-6b6e4",
  storageBucket: "car-park-6b6e4.appspot.com",
  messagingSenderId: "803034867641",
  appId: "1:803034867641:android:b302289aa0558b2c73b868"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testWrite() {
  try {
    // Write a test document to a collection named "test"
    await setDoc(doc(db, "test", "testDoc"), {
      message: "Hello Firestore!",
      timestamp: new Date()
    });
    console.log("Test write successful.");
  } catch (error) {
    console.error("Error writing test document:", error);
  }
}

testWrite();