import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import carParksData from '../../assets/carparks_sg.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import services
import { fetchCarParkAvailability } from '../services/carParkService';
import { bookSpot } from "../services/bookingService";
import { getCurrentLocation } from '../services/geolocationService';
import { useVehicleData } from './VehicleContext';

// Import map service functions
import {
  haversineDistance,
  getCarParkDetailMapHTML,
  showCarParkOnMap,
  openGoogleMapsDirections
} from '../services/mapService';

export default function BookingScreen({ route, navigation }) {
  const { carPark: routeCarPark, carParkNo } = route?.params || {};

  const [carPark, setCarPark] = useState(null);
  const [hoursFrom, setHoursFrom] = useState('');
  const [hoursTo, setHoursTo] = useState('');
  const [date, setDate] = useState('Today');
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [hoursModalVisible, setHoursModalVisible] = useState(false);
  const [isFromHours, setIsFromHours] = useState(true);
  const [distance, setDistance] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const webViewRef = useRef(null);
  const { vehicleData } = useVehicleData();
  const userEmail = vehicleData.email;

  const [availabilityData, setAvailabilityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedAmenities, setSelectedAmenities] = useState({
    mobileCheckIn: false,
    selfPark: false
  });

  // Load car park data
  useEffect(() => {
    if (routeCarPark) {
      setCarPark(routeCarPark);
    } else if (carParkNo) {
      const foundCarPark = carParksData.find(cp => cp.car_park_no === carParkNo);
      if (foundCarPark) {
        setCarPark(foundCarPark);
      } else if (carParksData.length > 0) {
        setCarPark(carParksData[0]);
      }
    } else if (carParksData.length > 0) {
      setCarPark(carParksData[0]);
    }
  }, [routeCarPark, carParkNo]);

  // Fetch availability data
  useEffect(() => {
    if (!carPark) return;

    const getAvailability = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchCarParkAvailability();
        const carparkInfo = data.items[0].carpark_data.find(
          cp => cp.carpark_number === carPark.car_park_no
        );

        if (carparkInfo) {
          setAvailabilityData(carparkInfo);
        } else {
          console.log('Car park not found in API data:', carPark.car_park_no);
          setAvailabilityData({
            carpark_info: [{ total_lots: "30", lots_available: "15", lot_type: "C" }]
          });
        }
      } catch (err) {
        console.error('Error fetching availability data:', err);
        setError('Failed to load availability data');
        setAvailabilityData({
          carpark_info: [{ total_lots: "30", lots_available: "15", lot_type: "C" }]
        });
      } finally {
        setLoading(false);
      }
    };

    getAvailability();
    const intervalId = setInterval(getAvailability, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [carPark]);

  // Request location using location service
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const coords = await getCurrentLocation();
        const userLoc = {
          lat: coords.latitude,
          lon: coords.longitude,
        };
        setUserLocation(userLoc);

        if (carPark) {
          const carParkLocation = {
            lat: parseFloat(carPark.latitude),
            lon: parseFloat(carPark.longitude)
          };
          // Use haversineDistance from mapService
          const distanceToCarPark = haversineDistance(userLoc, carParkLocation);
          setDistance(distanceToCarPark.toFixed(2));
        }
      } catch (error) {
        console.error("Geolocation error:", error.message);
        Alert.alert("Location Error", "Could not get your current location.");
      }
    };

    fetchLocation();
  }, [carPark]);

  // Use mapService to show car park on map
  useEffect(() => {
    if (carPark && webViewRef.current && userLocation) {
      showCarParkOnMap(webViewRef, carPark, userLocation);
    }
  }, [carPark, userLocation]);

  const setCurrentTime = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const laterHour = (currentHour + 1) % 24;
    setHoursFrom(currentHour.toString().padStart(2, '0'));
    setHoursTo(laterHour.toString().padStart(2, '0'));
  };

  // Calculate available hours
  const baseHours =
    date === 'Today'
      ? [...Array(24).keys()].filter(hour => hour >= new Date().getHours())
      : [...Array(24).keys()];
  const availableHours =
    !isFromHours && hoursFrom !== ''
      ? baseHours.filter(hour => hour > parseInt(hoursFrom))
      : baseHours;

  // Select an hour from the modal
  const selectHour = (hour) => {
    if (isFromHours) {
      setHoursFrom(hour.toString().padStart(2, '0'));
      if (hoursTo && parseInt(hoursTo) <= hour) {
        setHoursTo('');
      }
    } else {
      setHoursTo(hour.toString().padStart(2, '0'));
    }
    setHoursModalVisible(false);
  };

  // Handle booking functionality
  const handleBooking = async () => {
    // Validate inputs
    if (!hoursFrom || !hoursTo) {
      Alert.alert("Missing Information", "Please select both start and end times.");
      return;
    }

    try {
      if (!userEmail) {
        Alert.alert("Error", "User email not available");
        return;
      }

      // Call API to book the spot
      await bookSpot(
        carPark.car_park_no,
        date,
        hoursFrom,
        hoursTo,
        userEmail,
        carPark.address
      );

      // Update the UI by reducing the available count by 1
      if (availabilityData?.carpark_info?.length > 0) {
        const currentAvailable = parseInt(availabilityData.carpark_info[0].lots_available, 10);
        const newAvailable = Math.max(currentAvailable - 1, 0);
        const updatedAvailability = {
          ...availabilityData,
          carpark_info: [{
            ...availabilityData.carpark_info[0],
            lots_available: newAvailable.toString()
          }]
        };
        setAvailabilityData(updatedAvailability);

        // Store the new availability locally keyed by car park number
        await AsyncStorage.setItem(`availability_${carPark.car_park_no}`, newAvailable.toString());
      }

      // Show booking success alert
      const displayAddress = carPark.address || "145 West St.";
      Alert.alert(
        "Booking Successful",
        `Your parking spot at ${displayAddress} has been booked for ${date}!`,
        [{ text: "OK", onPress: () => navigation.navigate("HomeScreen") }]
      );
    } catch (error) {
      console.error("Booking error:", error);
      Alert.alert("Error", error.message || "Failed to book spot");
    }
  };

  const selectDate = (selectedDate) => {
    setDate(selectedDate);
    setDateModalVisible(false);
    // Reset time selections when date changes
    setHoursFrom('');
    setHoursTo('');
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev => ({
      ...prev,
      [amenity]: !prev[amenity]
    }));
  };

  // Use mapService to open Google Maps directions
  const handleOpenGoogleMaps = () => {
    if (carPark) {
      openGoogleMapsDirections(carPark);
    }
  };

  // At the bottom of your component, before the return:
  const availabilityZero =
  availabilityData?.carpark_info &&
  parseInt(availabilityData.carpark_info[0].lots_available, 10) === 0;
  const isBookDisabled = availabilityZero;

  if (!carPark) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F7FB" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading car park data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayAddress = carPark.address || "145 West St.";

  const getAvailabilityInfo = () => {
    if (loading) {
      return (
        <View style={styles.availabilityLoading}>
          <ActivityIndicator size="small" color="#000080" />
          <Text style={styles.availabilityText}> Loading availability...</Text>
        </View>
      );
    }
    if (error) {
      return <Text style={styles.availabilityText}>{error}</Text>;
    }
    if (availabilityData?.carpark_info?.length > 0) {
      const carparkInfo = availabilityData.carpark_info[0];
      return (
        <Text style={styles.availabilityText}>
          <Text style={styles.availableCount}>
            {carparkInfo.lots_available} / {carparkInfo.total_lots}
          </Text>{" "}
          spots available at the entered time
        </Text>
      );
    }
    return <Text style={styles.availabilityText}>Availability information not found</Text>;
  };

  const amenitiesToShow = [
    "car_park_type",
    "type_of_parking_system",
    "night_parking"
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#DCE7E3" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("ProfileScreen")}>
          <Text style={styles.headerButtonText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Address Header */}
      <View style={styles.addressHeader}>
        <Text style={styles.addressText}>{displayAddress}</Text>
        <Text style={styles.distanceText}>
          {distance ? `${distance} km` : "Calculating..."}
        </Text>
      </View>

      {/* Map Section - using HTML from mapService */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html: getCarParkDetailMapHTML() }}
          style={styles.webviewMap}
        />
      </View>

      {/* Open in Google Maps Button */}
      <View style={styles.openMapsContainer}>
        <TouchableOpacity style={styles.openMapsButton} onPress={handleOpenGoogleMaps}>
          <Text style={styles.openMapsText}>Open in Google Maps</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Content */}
      <ScrollView style={styles.bottomScroll} contentContainerStyle={styles.bottomScrollContent}>
        {/* Availability Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitleCard}>Availability</Text>
          {getAvailabilityInfo()}
          {availabilityData && (
            <Text style={styles.lastUpdatedText}>
              Last updated: {new Date().toLocaleTimeString()}
            </Text>
          )}
        </View>

        {/* Parking Hours Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitleCard}>Select Parking Hours</Text>
          <View style={styles.timeSelectionContainer}>
            <View style={styles.timeInputContainer}>
              <TouchableOpacity
                style={styles.timeInput}
                onPress={() => {
                  setIsFromHours(true);
                  setHoursModalVisible(true);
                }}
              >
                <Text style={styles.timeInputText}>{hoursFrom || 'From'}</Text>
              </TouchableOpacity>
              <Text style={styles.toText}>to</Text>
              <TouchableOpacity
                style={styles.timeInput}
                onPress={() => {
                  setIsFromHours(false);
                  setHoursModalVisible(true);
                }}
              >
                <Text style={styles.timeInputText}>{hoursTo || 'To'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateContainer}>
              <Text style={styles.dateLabel}>Date:</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setDateModalVisible(true)}>
                <Text style={styles.dateButtonText}>{date}</Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.currentTimeButton} onPress={setCurrentTime}>
            <Text style={styles.currentTimeText}>Set current time</Text>
          </TouchableOpacity>
        </View>

        {/* Amenities Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitleCard}>
            Amenities
            {carPark.free_parking && (
              <Text style={styles.freeParkingBadge}> | FREE: {carPark.free_parking}</Text>
            )}
          </Text>
          <View style={styles.amenitiesContainer}>
            {amenitiesToShow.map((amenityKey) => {
              const amenityValue = carPark[amenityKey];
              return (
                <TouchableOpacity
                  key={amenityKey}
                  style={[
                    styles.amenityButton,
                    selectedAmenities[amenityKey] && styles.amenityButtonSelected
                  ]}
                  onPress={() => toggleAmenity(amenityKey)}
                >
                  <Text
                    style={[
                      styles.amenityText,
                      selectedAmenities[amenityKey] && styles.amenityTextSelected
                    ]}
                  >
                    {amenityKey}: {String(amenityValue)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Book Button */}
        <TouchableOpacity
            style={[
                  styles.bookButton,
                  isBookDisabled && styles.bookButtonDisabled
                ]}
                disabled={isBookDisabled}
                onPress={handleBooking}
              >
                <Text style={styles.bookButtonText}>BOOK SPOT</Text>
              </TouchableOpacity>
      </ScrollView>

      {/* Date selection modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={dateModalVisible}
        onRequestClose={() => setDateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <TouchableOpacity
              style={[styles.dateOption, date === 'Today' && styles.dateOptionSelected]}
              onPress={() => selectDate('Today')}
            >
              <Text style={[styles.dateOptionText, date === 'Today' && styles.dateOptionTextSelected]}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateOption, date === 'Tomorrow' && styles.dateOptionSelected]}
              onPress={() => selectDate('Tomorrow')}
            >
              <Text style={[styles.dateOptionText, date === 'Tomorrow' && styles.dateOptionTextSelected]}>
                Tomorrow
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setDateModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Hours selection modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={hoursModalVisible}
        onRequestClose={() => setHoursModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isFromHours ? 'Select Starting Hour' : 'Select Ending Hour'}
            </Text>
            <ScrollView
              contentContainerStyle={styles.hourScrollContainer}
              showsVerticalScrollIndicator={false}
            >
              {availableHours.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={[
                    styles.hourOption,
                    (isFromHours ? hoursFrom : hoursTo) === hour.toString().padStart(2, '0') &&
                      styles.hourOptionSelected
                  ]}
                  onPress={() => selectHour(hour)}
                >
                  <Text
                    style={[
                      styles.hourOptionText,
                      (isFromHours ? hoursFrom : hoursTo) === hour.toString().padStart(2, '0') &&
                        styles.hourOptionTextSelected
                    ]}
                  >
                    {hour.toString().padStart(2, '0')}:00
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setHoursModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DCE7E3',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#000080',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#DCE7E3',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0D6EFD',
  },
  addressHeader: {
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  addressText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  mapContainer: {
    height: '30%',
    backgroundColor: '#F5F7FB',
  },
  webviewMap: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  openMapsContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#F5F7FB',
  },
  openMapsButton: {
    backgroundColor: '#0D6EFD',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  openMapsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomScroll: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  bottomScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitleCard: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  freeParkingBadge: {
    fontWeight: 'bold',
    color: '#0D6EFD',
  },
  availabilityLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityText: {
    fontSize: 16,
    color: '#333',
  },
  availableCount: {
    fontWeight: 'bold',
    color: '#0D6EFD',
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  timeSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
  },
  timeInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  timeInputText: {
    fontSize: 16,
    color: '#333',
  },
  toText: {
    marginHorizontal: 10,
    fontSize: 16,
    color: '#333',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  dateLabel: {
    fontSize: 16,
    marginRight: 5,
    color: '#333',
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#666',
  },
  currentTimeButton: {
    backgroundColor: '#0D6EFD',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 15,
    alignSelf: 'flex-start',
  },
  currentTimeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  amenityButtonSelected: {
    backgroundColor: '#0D6EFD',
    borderColor: '#0D6EFD',
  },
  amenityText: {
    fontSize: 14,
    color: '#333',
  },
  amenityTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  bookButton: {
    backgroundColor: '#0D6EFD',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  bookButtonDisabled: {
    backgroundColor: '#A0C0FF',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0D6EFD',
  },
  hourScrollContainer: {
    width: '100%',
    alignItems: 'center',
  },
  dateOption: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 10,
    backgroundColor: '#F5F5F5',
  },
  dateOptionSelected: {
    backgroundColor: '#0D6EFD',
  },
  dateOptionText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
  },
  dateOptionTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  hourOption: {
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 10,
    backgroundColor: '#F5F5F5',
  },
  hourOptionSelected: {
    backgroundColor: '#0D6EFD',
  },
  hourOptionText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
  },
  hourOptionTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: '#757575',
    fontSize: 16,
  },
});