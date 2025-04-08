const API_URL = "http://10.0.2.2:5001";

export const updateVehicleDetails = async (email, country, vehicleNo, iuNo) => {
  try {
    console.log(`Sending request to: ${API_URL}/updateVehicle for vehicle update`);

    // Input validation
    if (!email) throw new Error("Email is required");
    if (!vehicleNo) throw new Error("Vehicle number is required");

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

/**
 * Fetches vehicle details by email
 * @param {string} email - User's email address
 * @returns {Promise<Object>} - Vehicle data
 */
export const getVehicleByEmail = async (email) => {
  try {
    if (!email) throw new Error("Email is required");

    const response = await fetch(`${API_URL}/getVehicle?email=${encodeURIComponent(email)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch vehicle details");
    }

    return data;
  } catch (error) {
    console.error("Get Vehicle API Error:", error.message);
    throw error;
  }
};