import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export const fetchUserData = async (email) => {
  try {
    if (!email) {
      console.log("No email provided to fetchUserData");
      return null;
    }

    const userDocRef = doc(db, "users", email);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return userDocSnap.data();
    } else {
      console.log("No user document found");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};

/**
 * Updates user profile data in Firestore
 * @param {string} email - User's email address (used as document ID)
 * @param {Object} userData - User data to update (name, phone, avatar, etc.)
 * @returns {Promise<Object>} - Response object
 */
export const updateUserProfile = async (email, userData) => {
  try {
    if (!email) {
      throw new Error("Email is required to update user data");
    }

    const userDocRef = doc(db, "users", email);
    await setDoc(
      userDocRef,
      {
        ...userData,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    console.log("User profile updated successfully");
    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};