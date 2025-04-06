import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { registerUser, loginUser } from "./authService.js";
import { db } from "./firebaseConfig.js"; // Firestore instance
import { doc, setDoc, getDoc, collection, addDoc } from "firebase/firestore";
import { getAuth, updatePassword, sendPasswordResetEmail as firebaseSendPasswordResetEmail } from "firebase/auth";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// LOGIN API
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await loginUser(email, password);
    // Fetch user info from Firestore document keyed by the actual email
    const userDoc = await getDoc(doc(db, "users", email));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      res.status(200).json(userData);
    } else {
      res.status(404).json({ error: "User data not found in Firestore" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * REGISTER API:
 * - For new users (alreadyRegistered !== true), creates the user in Firebase Auth using the provided email.
 * - Then, it merges the registration details and any provided vehicle details into a Firestore document keyed by the user's actual email.
 */
app.post("/register", async (req, res) => {
  console.log("Received /register request with body:", req.body);
  const {
    email,
    password,
    fullName,
    phoneNumber,
    country,
    vehicleNo,
    iuNo,
    alreadyRegistered
  } = req.body;

  try {
    if (alreadyRegistered !== true) {
      // Create the user in Firebase Auth using the provided email.
      const user = await registerUser(email, password, fullName, phoneNumber);
      console.log("User registered successfully:", user);
    } else {
      console.log("User is already registered; merging additional details");
    }

    // Merge registration (and vehicle) details into the Firestore document keyed by the actual email.
    await setDoc(
      doc(db, "users", email),
      {
        email,
        fullName: fullName || "",
        phoneNumber: phoneNumber || "",
        country: country || "",
        vehicleNo: vehicleNo || "",
        iuNo: iuNo || "",
        updatedAt: new Date()
      },
      { merge: true }
    );

    res.status(201).json({ message: "User/Vehicle details updated" });
  } catch (error) {
    console.error("Registration/Update failed:", error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * UPDATE VEHICLE API:
 * Used to update vehicle details for an already registered user.
 */
app.post("/updateVehicle", async (req, res) => {
  console.log("Received /updateVehicle request with body:", req.body);
  const { email, country, vehicleNo, iuNo } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required to update vehicle info." });
  }
  try {
    await setDoc(
      doc(db, "users", email),
      {
        country: country || "",
        vehicleNo: vehicleNo || "",
        iuNo: iuNo || "",
        updatedAt: new Date(),
      },
      { merge: true }
    );
    return res.status(200).json({ message: "Vehicle updated" });
  } catch (error) {
    console.error("Vehicle update failed:", error.message);
    return res.status(400).json({ error: error.message });
  }
});

/**
 * BOOK SPOT API:
 * This endpoint handles storing booking details and reducing available parking spots.
 * It creates a booking record in the "bookings" collection using the actual userEmail,
 * and then updates the "carpark_availability" document (keyed by carParkNo) by reducing lots_available by 1.
 */
app.post("/bookSpot", async (req, res) => {
  try {
    const {
      carParkNo,
      date,
      hoursFrom,
      hoursTo,
      userEmail,  // This should be the real user's email, passed from the frontend
      address
    } = req.body;

    if (!carParkNo || !userEmail) {
      return res.status(400).json({ error: "carParkNo and userEmail are required" });
    }

    // Create a booking record in the "bookings" collection.
    const bookingRef = await addDoc(collection(db, "bookings"), {
      carParkNo,
      userEmail,
      address: address || "",
      date: date || "Today",
      hoursFrom: hoursFrom || "",
      hoursTo: hoursTo || "",
      bookedAt: new Date()
    });
    console.log("Booking created with ID:", bookingRef.id);

    return res.status(200).json({ message: "Booking stored successfully" });
  } catch (error) {
    console.error("Error booking spot:", error.message);
    return res.status(400).json({ error: error.message });
  }
});

app.post("/resetPassword", async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email) {
    return res.status(400).json({
      error: "Email is required",
      success: false
    });
  }

  try {
    const userDoc = await getDoc(doc(db, "users", email));
    if (!userDoc.exists()) {
      return res.status(404).json({
        error: "User not found",
        success: false
      });
    }

    const auth = getAuth();

    if (newPassword) {
      // Update password directly if newPassword is provided
      const user = auth.currentUser;
      if (user && user.email === email) {
        await updatePassword(user, newPassword);
        console.log("Password updated for:", email);
      } else {
        return res.status(400).json({
          error: "Unable to update password. Please log in and try again.",
          success: false
        });
      }
    } else {
      // Send password reset email if newPassword is not provided
      try {
        await firebaseSendPasswordResetEmail(auth, email);
        console.log("Password reset email sent to:", email);
      } catch (emailError) {
        console.warn("Could not send password reset email:", emailError.message);
        return res.status(500).json({
          error: "Failed to send password reset email",
          success: false
        });
      }
    }

    await setDoc(
      doc(db, "users", email),
      {
        passwordResetAt: new Date(),
        mustChangePassword: !newPassword
      },
      { merge: true }
    );

    return res.status(200).json({
      message: newPassword
        ? "Password updated successfully."
        : "Password reset email sent. Check your inbox.",
      success: true
    });

  } catch (error) {
    console.error("Password Reset Error:", error.message);
    return res.status(500).json({
      error: "An unexpected error occurred during password reset",
      details: error.message,
      success: false
    });
  }
});
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));