export const fetchCarParkAvailability = async () => {
  try {
    const response = await fetch('https://api.data.gov.sg/v1/transport/carpark-availability');
    if (!response.ok) throw new Error("Failed to fetch car park availability");
    return await response.json();
  } catch (error) {
    console.error("Car Park Availability API Error:", error.message);
    throw error;
  }
};