const API_URL = "http://10.0.2.2:5001";
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

// Create a booking
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

// Fetch user's bookings
export const fetchUserBookings = async (userEmail) => {
  try {
    if (!userEmail) {
      console.log('No user email found');
      return [];
    }
    // Query all bookings where userEmail == logged-in user's email
    const q = query(collection(db, 'bookings'), where('userEmail', '==', userEmail));
    const querySnapshot = await getDocs(q);
    const userBookings = [];
    querySnapshot.forEach((docSnap) => {
      userBookings.push({ id: docSnap.id, ...docSnap.data() });
    });
    return userBookings;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
};

// Mark a booking as completed (check-in)
export const handleCheckIn = async (booking) => {
  try {
    await updateDoc(doc(db, 'bookings', booking.id), { status: 'completed' });
    return { success: true, message: 'Booking checked in successfully' };
  } catch (error) {
    console.error('Check-In error:', error);
    throw new Error('Failed to check in');
  }
};

// Cancel a booking
export const handleCancel = async (bookingId) => {
  try {
    await updateDoc(doc(db, 'bookings', bookingId), { status: 'cancelled' });
    return { success: true, message: 'Booking cancelled successfully' };
  } catch (error) {
    console.error('Cancel error:', error);
    throw new Error('Failed to cancel booking');
  }
};

// Delete a booking for rebooking with new timing
export const handleChangeTiming = async (bookingId) => {
  try {
    await deleteDoc(doc(db, 'bookings', bookingId));
    return { success: true, message: 'Booking removed. Please rebook with new timing.' };
  } catch (error) {
    console.error('ChangeTiming error:', error);
    throw new Error('Failed to change timing');
  }
};