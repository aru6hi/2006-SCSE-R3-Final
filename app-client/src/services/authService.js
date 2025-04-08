const API_URL = "http://10.0.2.2:5001";

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

export const googleLogin = async () => {
  try {
    console.log(`Sending request to: ${API_URL}/googleLogin`);
    const response = await fetch(`${API_URL}/googleLogin`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Google Login failed");
    console.log("Google Login successful:", data);
    return data;
  } catch (error) {
    console.error("Google Login API Error:", error.message);
    throw error;
  }
};