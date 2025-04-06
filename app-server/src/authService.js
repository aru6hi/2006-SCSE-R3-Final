import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { auth, db } from './firebaseConfig.js';

// Register User & Store in Firestore
const registerUser = async (email, password, fullName) => {
  try {
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Store additional user details in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      fullName: fullName, // Add extra fields
      createdAt: new Date()
    });

    return user;
  } catch (error) {
    console.error("Error registering user:", error.message);
    throw error;
  }
};

// Login User
const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error logging in:", error.message);
    throw error;
  }
};

// Logout User
const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log("User logged out successfully.");
  } catch (error) {
    console.error("Error logging out:", error.message);
    throw error;
  }
};

export { registerUser, loginUser, logoutUser };
