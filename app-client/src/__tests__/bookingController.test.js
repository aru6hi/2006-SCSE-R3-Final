// bookingController.test.js
import { handleBooking } from '../screens/BookingScreen';

describe('BookingScreen - handleBooking (Black Box Testing)', () => {
  // Create Jest mocks for dependencies:
  const mockBookSpot = jest.fn();
  const mockSetAvailabilityData = jest.fn();
  const mockNavigation = { navigate: jest.fn() };
  const mockAsyncStorage = { setItem: jest.fn(() => Promise.resolve()) };
  const mockAlert = { alert: jest.fn() };

  // A sample car park object taken from your JSON structure:
  const sampleCarPark = {
    car_park_no: "ACB",
    address: "BLK 270/271 ALBERT CENTRE BASEMENT CAR PARK",
    car_park_type: "BASEMENT CAR PARK",
    type_of_parking_system: "ELECTRONIC PARKING",
    short_term_parking: "WHOLE DAY",
    free_parking: "NO",
    night_parking: "YES",
    latitude: 1.3010632720874935,
    longitude: 103.85411804993093
  };

  // A sample availability object:
  const sampleAvailabilityData = {
    carpark_info: [{
      lots_available: "10",
      total_lots: "20",
      lot_type: "C"
    }]
  };

  // Valid parameters for a successful booking:
  const validParams = {
    userEmail: 'user@example.com',
    carPark: sampleCarPark,
    date: 'Today',
    hoursFrom: '10',
    hoursTo: '11',
    availabilityData: sampleAvailabilityData,
    setAvailabilityData: mockSetAvailabilityData,
    navigation: mockNavigation,
    bookSpot: mockBookSpot,
    AsyncStorage: mockAsyncStorage,
    Alert: mockAlert
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------- Equivalence Class Partitioning Tests ----------

  test('should alert error if user email is missing (Invalid Input ECP)', async () => {
    const params = { ...validParams, userEmail: '' };
    await handleBooking(params);
    expect(mockAlert.alert).toHaveBeenCalledWith("Error", "User email not available");
    expect(mockBookSpot).not.toHaveBeenCalled();
  });

  test('should proceed with booking when inputs are valid and API succeeds (Valid Input ECP)', async () => {
    // Simulate a successful API call:
    mockBookSpot.mockResolvedValueOnce({});

    await handleBooking(validParams);

    // Expect that bookSpot is called with correct arguments:
    expect(mockBookSpot).toHaveBeenCalledWith(
      sampleCarPark.car_park_no,
      validParams.date,
      validParams.hoursFrom,
      validParams.hoursTo,
      validParams.userEmail,
      sampleCarPark.address
    );
    // Expect that availability update was called:
    expect(mockSetAvailabilityData).toHaveBeenCalled();

    // Expect that navigation to HomeScreen is triggered:
    expect(mockNavigation.navigate).toHaveBeenCalledWith("HomeScreen");

    // And a success alert was shown:
    expect(mockAlert.alert).toHaveBeenCalledWith(
      "Booking Successful",
      expect.stringContaining(sampleCarPark.address),
      expect.any(Array)
    );
  });

  test('should alert error if the API call fails (Error ECP)', async () => {
    const errorMessage = "Service unavailable";
    mockBookSpot.mockRejectedValueOnce(new Error(errorMessage));
    await handleBooking(validParams);
    expect(mockAlert.alert).toHaveBeenCalledWith("Error", errorMessage);
  });

  // ---------- Boundary Value Analysis Tests ----------

  test('should handle zero duration booking (Boundary Test: hoursFrom equals hoursTo)', async () => {
    // For instance, if the booking window is zero (10 to 10) and your app should reject it:
    const params = { ...validParams, hoursFrom: '10', hoursTo: '10' };

    // If your logic is set to immediately alert an error on zero duration,
    // then expect that the API call is not made and an error is alerted.
    await handleBooking(params);

    expect(mockBookSpot).not.toHaveBeenCalled();
    expect(mockAlert.alert).toHaveBeenCalledWith("Error", "Invalid booking window");
  });
});
