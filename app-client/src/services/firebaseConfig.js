import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAuhW2ejVj9qnWMiDhoKTVlYj6Y1vNUY_U",
  authDomain: "car-park-6b6e4.firebaseapp.com",
  projectId: "car-park-6b6e4",
  storageBucket: "car-park-6b6e4.appspot.com",
  messagingSenderId: "803034867641",
  appId: "1:803034867641:android:b302289aa0558b2c73b868",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
const db = getFirestore(app);

export { auth, db };