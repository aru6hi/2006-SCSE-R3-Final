// Import the functions to test from your booking service
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import {
  bookSpot,
  fetchUserBookings,
  handleCheckIn,
  handleCancel,
  handleChangeTiming
} from '../services/bookingService';

// Import Firestore functions so we can mock them:
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

// ----- Mocks for Firebase Firestore functions -----
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(() => ({})), // Simple mock that returns an empty object
}));

// ----- Mock global.fetch for testing bookSpot -----
global.fetch = jest.fn();

describe('Booking Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ------------------ Test bookSpot ------------------
  describe('bookSpot', () => {
    const API_URL = "http://10.0.2.2:5001";
    const carParkNo = "ACB";
    const date = "Today";
    const hoursFrom = "10";
    const hoursTo = "11";
    const userEmail = "user@example.com";
    const address = "BLK 270/271 ALBERT CENTRE BASEMENT CAR PARK";

    test('should successfully book a spot and return data', async () => {
      const mockResponseData = { success: true, bookingId: "BK001" };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponseData),
      };
      fetch.mockResolvedValue(mockResponse);

      const result = await bookSpot(carParkNo, date, hoursFrom, hoursTo, userEmail, address);

      expect(fetch).toHaveBeenCalledWith(`${API_URL}/bookSpot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carParkNo,
          date,
          hoursFrom,
          hoursTo,
          userEmail,
          address,
        }),
      });
      expect(result).toEqual(mockResponseData);
    });

    test('should throw an error when response is not ok', async () => {
      const errorMessage = "Failed to book spot";
      const mockResponseData = { error: errorMessage };
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue(mockResponseData),
      };
      fetch.mockResolvedValue(mockResponse);

      await expect(bookSpot(carParkNo, date, hoursFrom, hoursTo, userEmail, address))
        .rejects
        .toThrow(errorMessage);
    });

    test('should throw an error if fetch fails', async () => {
      fetch.mockRejectedValue(new Error("Network Error"));
      await expect(bookSpot(carParkNo, date, hoursFrom, hoursTo, userEmail, address))
        .rejects
        .toThrow("Network Error");
    });
  });

  // ------------------ Test fetchUserBookings ------------------
  describe('fetchUserBookings', () => {
    test('should return an empty array if no user email is provided', async () => {
      const result = await fetchUserBookings('');
      expect(result).toEqual([]);
    });

    test('should return user bookings when a valid user email is provided', async () => {
      // Create fake document snapshots
      const fakeDocData1 = { userEmail: "user@example.com", bookingDetail: "Booking 1" };
      const fakeDocData2 = { userEmail: "user@example.com", bookingDetail: "Booking 2" };

      const fakeDocSnapshot1 = { id: "doc1", data: () => fakeDocData1 };
      const fakeDocSnapshot2 = { id: "doc2", data: () => fakeDocData2 };

      // Mock getDocs to simulate Firestore returning two documents
      getDocs.mockResolvedValue({
        forEach: (callback) => {
          callback(fakeDocSnapshot1);
          callback(fakeDocSnapshot2);
        },
      });

      const result = await fetchUserBookings("user@example.com");
      expect(result).toEqual([
        { id: "doc1", ...fakeDocData1 },
        { id: "doc2", ...fakeDocData2 },
      ]);

      // Optionally, you can check that the Firebase functions were called appropriately
      expect(collection).toHaveBeenCalledWith(expect.any(Object), 'bookings');
      expect(where).toHaveBeenCalledWith('userEmail', '==', "user@example.com");
      expect(query).toHaveBeenCalled();
    });
  });

  // ------------------ Test handleCheckIn ------------------
  describe('handleCheckIn', () => {
    test('should resolve with success message when updateDoc succeeds', async () => {
      updateDoc.mockResolvedValue();
      const booking = { id: "booking1" };

      const result = await handleCheckIn(booking);
      expect(updateDoc).toHaveBeenCalled();
      expect(result).toEqual({ success: true, message: 'Booking checked in successfully' });
    });

    test('should throw an error when updateDoc fails in check-in', async () => {
      updateDoc.mockRejectedValue(new Error("Update Failed"));
      const booking = { id: "booking1" };
      await expect(handleCheckIn(booking))
        .rejects
        .toThrow("Failed to check in");
    });
  });

  // ------------------ Test handleCancel ------------------
  describe('handleCancel', () => {
    test('should resolve with success message when updateDoc succeeds', async () => {
      updateDoc.mockResolvedValue();
      const bookingId = "booking1";

      const result = await handleCancel(bookingId);
      expect(updateDoc).toHaveBeenCalled();
      expect(result).toEqual({ success: true, message: 'Booking cancelled successfully' });
    });

    test('should throw an error when updateDoc fails in cancel', async () => {
      updateDoc.mockRejectedValue(new Error("Cancel Failed"));
      const bookingId = "booking1";
      await expect(handleCancel(bookingId))
        .rejects
        .toThrow("Failed to cancel booking");
    });
  });

  // ------------------ Test handleChangeTiming ------------------
  describe('handleChangeTiming', () => {
    test('should resolve with success message when deleteDoc succeeds', async () => {
      deleteDoc.mockResolvedValue();
      const bookingId = "booking1";

      const result = await handleChangeTiming(bookingId);
      expect(deleteDoc).toHaveBeenCalled();
      expect(result).toEqual({ success: true, message: 'Booking removed. Please rebook with new timing.' });
    });

    test('should throw an error when deleteDoc fails in change timing', async () => {
      deleteDoc.mockRejectedValue(new Error("Delete Failed"));
      const bookingId = "booking1";
      await expect(handleChangeTiming(bookingId))
        .rejects
        .toThrow("Failed to change timing");
    });
  });
});
