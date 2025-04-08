import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useVehicleData } from './VehicleContext';
import {
  fetchUserBookings,
  handleCheckIn,
  handleCancel,
  handleChangeTiming
} from '../services/bookingService';

export default function CheckInScreen() {
  const navigation = useNavigation();
  const { vehicleData } = useVehicleData();
  const userEmail = vehicleData?.email || '';

  // Local states
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // For tab filtering (status based)
  const [activeTab, setActiveTab] = useState('ongoing'); // 'ongoing', 'completed', 'cancelled'

  // For search
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch bookings using bookingService
  useEffect(() => {
    const getBookings = async () => {
      try {
        const userBookings = await fetchUserBookings(userEmail);
        setBookings(userBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        Alert.alert('Error', 'Failed to load your bookings');
      } finally {
        setLoading(false);
      }
    };
    getBookings();
  }, [userEmail]);

  // Auto-cancel expired ongoing bookings (only for "Today" bookings)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      bookings.forEach((booking) => {
        // Default status to "ongoing" if missing.
        const bookingStatus = booking.status ? booking.status.toLowerCase() : 'ongoing';
        if (bookingStatus === "ongoing" && booking.date === "Today") {
          if (parseInt(booking.hoursTo, 10) <= currentHour) {
            handleCancel(booking.id)
              .then(() => {
                setBookings((prev) =>
                  prev.map((b) =>
                    b.id === booking.id ? { ...b, status: 'cancelled' } : b
                  )
                );
              })
              .catch((err) =>
                console.error("Failed to auto-cancel booking", err)
              );
          }
        }
      });
    }, 60000); // every minute
    return () => clearInterval(interval);
  }, [bookings]);

  // Show loader while fetching
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // 1) Filter by status tab (if a booking is missing status, default to 'ongoing')
  let filteredBookings = bookings.filter((b) => {
    const bookingStatus = b.status ? b.status.toLowerCase() : 'ongoing';
    return bookingStatus === activeTab;
  });

  // 2) Further filter by address if there's a search query
  if (searchQuery.trim() !== '') {
    filteredBookings = filteredBookings.filter((b) =>
      b.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // --- Booking Actions using the Booking Service ---

  // Only allow check in during the booking time
  const onCheckIn = async (booking) => {
    const now = new Date();
    const currentHour = now.getHours();
    if (booking.date !== "Today") {
      Alert.alert("Check-In Not Allowed", "You can only check in on the day of your booking.");
      return;
    }
    const startHour = parseInt(booking.hoursFrom, 10);
    const endHour = parseInt(booking.hoursTo, 10);
    if (currentHour < startHour || currentHour >= endHour) {
      Alert.alert("Check-In Not Allowed", "You can only check in during your booking time.");
      return;
    }
    try {
      await handleCheckIn(booking);
      Alert.alert('Success', 'Booking checked in.');
      setBookings((prev) =>
        prev.map((bk) => (bk.id === booking.id ? { ...bk, status: 'completed' } : bk))
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to check in.');
    }
  };

  const onCancel = async (bookingId) => {
    try {
      await handleCancel(bookingId);
      Alert.alert('Success', 'Booking cancelled.');
      setBookings((prev) =>
        prev.map((bk) => (bk.id === bookingId ? { ...bk, status: 'cancelled' } : bk))
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to cancel booking.');
    }
  };

  const onChangeTiming = async (bookingId) => {
    try {
      await handleChangeTiming(bookingId);
      Alert.alert('Notice', 'Booking removed. Please rebook with new timing.');
      setBookings((prev) => prev.filter((bk) => bk.id !== bookingId));
      navigation.navigate('BookingScreen', { bookingId });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to change timing.');
    }
  };

  // In completed or cancelled, allow the user to rebook the same spot.
  const onBookAgain = (booking) => {
    navigation.navigate('BookingScreen', { carParkNo: booking.carParkNo });
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Button and Search */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen')}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        {searchActive ? (
          <TextInput
            style={styles.searchInput}
            placeholder="Search by address"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        ) : (
          <Text style={styles.headerTitle}>My Parking</Text>
        )}
        <TouchableOpacity style={styles.searchButton} onPress={() => setSearchActive(!searchActive)}>
          <Text style={styles.searchIcon}>{searchActive ? 'X' : '🔍'}</Text>
        </TouchableOpacity>
      </View>

      {/* Status Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'ongoing' ? styles.activeTab : styles.inactiveTab]}
          onPress={() => setActiveTab('ongoing')}
        >
          <Text style={styles.tabButtonText}>Ongoing</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'completed' ? styles.activeTab : styles.inactiveTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={styles.tabButtonText}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'cancelled' ? styles.activeTab : styles.inactiveTab]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text style={styles.tabButtonText}>Cancelled</Text>
        </TouchableOpacity>
      </View>

      {/* Bookings List */}
      <ScrollView contentContainerStyle={styles.bookingsList}>
        {filteredBookings.length === 0 ? (
          <View style={styles.noBookings}>
            <Text style={styles.noBookingsText}>No {activeTab} bookings found.</Text>
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              onPress={() =>
                navigation.navigate("ParkingTicketScreen", { ticketData: booking })
              }
            >
              <View style={styles.bookingCard}>
                {/* Booking Info */}
                <View style={styles.bookingRow}>
                  <Text style={styles.carParkText}>
                    Car Park: {booking.carParkNo || 'N/A'}
                  </Text>
                  <Text style={styles.addressText}>
                    Address: {booking.address || 'N/A'}
                  </Text>
                  <Text style={styles.dateText}>
                    Date: {booking.date || 'N/A'}
                    {`  ( ${booking.hoursFrom || '--'} - ${booking.hoursTo || '--'} )`}
                  </Text>
                  {booking.bookedAt && (
                    <Text style={styles.bookedAtText}>
                      Booked At: {new Date(booking.bookedAt.seconds * 1000).toLocaleString()}
                    </Text>
                  )}
                </View>

                {/* Action Buttons */}
                {activeTab === 'ongoing' && (
                  <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => onCancel(booking.id)}>
                      <Text style={styles.actionButtonText}>Cancel Booking</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => onCheckIn(booking)}>
                      <Text style={styles.actionButtonText}>Check-In</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => onChangeTiming(booking.id)}>
                      <Text style={styles.actionButtonText}>Change Timing</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {(activeTab === 'completed' || activeTab === 'cancelled') && (
                  <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => onBookAgain(booking)}>
                      <Text style={styles.actionButtonText}>Book Again</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ... existing styles ...
const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#e6f4ea',
    paddingTop: 48,
    paddingBottom: 64,
    alignItems: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    width: '90%',
    maxWidth: 400,
    paddingHorizontal: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003366',
  },
  searchButton: {
    padding: 8,
  },
  searchIcon: {
    fontSize: 24,
    color: '#6b7280',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 40,
    marginHorizontal: 8,
  },
  tabs: {
    flexDirection: 'row',
    width: '90%',
    maxWidth: 400,
    paddingHorizontal: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 50,
  },
  activeTab: {
    backgroundColor: '#9ca3af',
  },
  inactiveTab: {
    backgroundColor: '#1e40af',
  },
  tabButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  bookingsList: {
    width: '400',
    maxWidth: 400,
  },
  noBookings: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  noBookingsText: {
    color: '#6b7280',
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
  },
  bookingRow: {
    marginBottom: 12,
  },
  carParkText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#374151',
  },
  dateText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#374151',
  },
  bookedAtText: {
    fontSize: 12,
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1e40af',
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 12,
    textAlign: 'center',
  },
  completedText: {
    fontSize: 14,
    color: 'green',
    textAlign: 'center',
    flex: 1,
  },
  cancelledText: {
    fontSize: 14,
    color: 'red',
    textAlign: 'center',
    flex: 1,
  },
});