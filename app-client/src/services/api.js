const API_URL = "http://10.0.2.2:5001"; // Use your local IP if testing on a device

// Register User
export const registerUser = async (email, password, fullName, phoneNumber) => {
  try {
    console.log(`Sending request to: ${API_URL}/register`);
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName, phoneNumber }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Registration failed");
    console.log("Registration successful:", data);
    return data;
  } catch (error) {
    console.error("Register API Error:", error.message);
    throw error;
  }
};

// Login User
export const loginUser = async (email, password) => {
  try {
    console.log(`Sending request to: ${API_URL}/login`);
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Login failed");
    console.log("Login successful:", data);
    return data;
  } catch (error) {
    console.error("Login API Error:", error.message);
    throw error;
  }
};

// Update Vehicle Details
export const updateVehicleDetails = async (email, country, vehicleNo, iuNo) => {
  try {
    console.log(`Sending request to: ${API_URL}/updateVehicle for vehicle update`);
    const response = await fetch(`${API_URL}/updateVehicle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        country,
        vehicleNo,
        iuNo,
        alreadyRegistered: true // Flag indicating this is an update
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to update vehicle details");
    }
    console.log("Vehicle details update successful:", data);
    return data;
  } catch (error) {
    console.error("Update Vehicle Details API Error:", error.message);
    throw error;
  }
};

// Book Spot API: Store booking details and reduce available parking spots
export const bookSpot = async (carParkNo, date, hoursFrom, hoursTo, userEmail, address) => {
  try {
    console.log(`Sending request to: ${API_URL}/bookSpot`);
    const response = await fetch(`${API_URL}/bookSpot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        carParkNo,
        date,
        hoursFrom,
        hoursTo,
        userEmail,
        address
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to book spot");
    console.log("Spot booking success:", data);
    return data;
  } catch (error) {
    console.error("bookSpot API Error:", error.message);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email, newPassword = null) => {
  try {
    console.log(`Sending request to: ${API_URL}/resetPassword`);
    const response = await fetch(`${API_URL}/resetPassword`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPassword }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Password reset failed");

    console.log("Password reset successful:", data);
    return data;
  } catch (error) {
    console.error("Password Reset API Error:", error.message);
    throw error;
  }
};
