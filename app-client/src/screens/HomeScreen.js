import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform,
  PermissionsAndroid,
  Alert
} from 'react-native';
import { useVehicleData } from './VehicleContext';  // Import the context
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // If you want to save avatar to Firestore
import Geolocation from '@react-native-community/geolocation';
import carParksData from '../../assets/carparks_sg.json';
import { db } from "../services/firebaseConfig";

// 1) Import all your car images here:
const carAvatars = [
  require('../../assets/vecteezy_dynamic-sport-car-with-sleek-lines-and-powerful-presence_51785067.png'),
  require('../../assets/vecteezy_modern-car-isolated-on-transparent-background-3d-rendering_19146428.png'),
  require('../../assets/vecteezy_sport-car-3d-rendering_13472036.png'),
  require('../../assets/vecteezy_sport-car-isolated-on-transparent-background-3d-rendering_19069771.png'),
  require('../../assets/vecteezy_toy-car-isolated_13737872.png'),
  require('../../assets/vecteezy_white-sport-car-on-transparent-background-3d-rendering_25305916.png'),
  require('../../assets/vecteezy_white-suv-on-transparent-background-3d-rendering_25311224.png')

];

export default function HomeScreen({ navigation }) {
  const { vehicleData, updateVehicleData } = useVehicleData();
  const { vehicleNumber, email } = vehicleData;

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [carParks, setCarParks] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbySpots, setNearbySpots] = useState([]);

  // NEW: track the selected avatar index in state
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(0);

  // 1) Fetch user data to update vehicle number
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, 'users', email);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          // If you have saved an avatar index or URL in Firestore, load it:
          if (data.avatarIndex !== undefined) {
            setSelectedAvatarIndex(data.avatarIndex);
          }
          updateVehicleData({ vehicleNumber: data.vehicleNo || '' });
        } else {
          console.log('No user document found');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    if (email) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [email, updateVehicleData]);

  // 2) Load car parks from local JSON
  useEffect(() => {
    setCarParks(carParksData);
  }, []);

  // 3) Get user's current location
  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: "Location Permission",
              message: "This app needs access to your location to show nearby car parks.",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "OK",
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log("Location permission denied");
            return;
          }
        } catch (err) {
          console.warn(err);
          return;
        }
      }
      Geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => console.error("Geolocation error: ", error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    };
    requestLocationPermission();
  }, []);

  // 4) Once we have userLocation & carParks, filter nearby spots (within 5 km)
  useEffect(() => {
    if (userLocation && carParks.length > 0) {
      const spotsWithin5km = carParks
        .map((park) => {
          const dist = getDistanceInKm(
            userLocation.lat,
            userLocation.lon,
            parseFloat(park.latitude),
            parseFloat(park.longitude)
          );
          return { ...park, distance: dist };
        })
        .filter((park) => park.distance <= 5);
      // Sort spots in increasing order (closest first)
      spotsWithin5km.sort((a, b) => a.distance - b.distance);
      setNearbySpots(spotsWithin5km);
    }
  }, [userLocation, carParks]);

  // Haversine formula: returns distance in km
  const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg) => deg * (Math.PI / 180);

  // Map button handlers
  const openMap = () => {
    navigation.navigate('Map', { searchQuery: '' });
  };

  const searchAndOpenMap = () => {
    navigation.navigate('Map', { searchQuery });
  };

  // Placeholder logout/profile functions
  const handleLogout = () => {
    navigation.navigate('LoginScreen');
  };

  const handleProfile = () => {
    navigation.navigate('ProfileScreen');
  };

  // NEW: Confirm the chosen avatar (optionally save to Firestore)
  const handleSetCarAvatar = async () => {
    try {
      // Save to your context
      updateVehicleData({
        ...vehicleData,
        avatarIndex: selectedAvatarIndex,
      });
      navigation.navigate('EditDetailsScreen');
      // Optionally also update Firestore
      if (email) {
        const userDocRef = doc(db, 'users', email);
        await updateDoc(userDocRef, { avatarIndex: selectedAvatarIndex });
      }
      Alert.alert("Avatar Updated", "Select your car avatar");
    } catch (err) {
      console.error("Failed to set car avatar:", err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Check if vehicle exists
  const hasVehicle = vehicleNumber && vehicleNumber.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.headerButton}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleProfile}>
          <Text style={styles.headerButton}>Profile</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Let's get parking!</Text>

      {/* Vehicle Info Card */}
      <View style={styles.vehicleContainer}>
        <Text style={styles.vehicleTitle}>My Vehicle</Text>
        <Text style={styles.vehicleNumber}>
          {hasVehicle ? vehicleNumber : 'No Vehicle Entered'}
        </Text>
        {!hasVehicle && (
          <TouchableOpacity
            style={styles.addVehicleButton}
            onPress={() => navigation.navigate('VehicleDetails')}
          >
            <Text style={styles.addVehicleButtonText}>Add Vehicle</Text>
          </TouchableOpacity>
        )}

        {/* NEW: Show the selected avatar in a larger preview */}
        <Image
          source={carAvatars[selectedAvatarIndex]}
          style={styles.carImage}
          resizeMode="contain"
        />

        {/* Horizontal scroll of all available car avatars */}
        <ScrollView
          horizontal
          style={styles.avatarScroll}
          contentContainerStyle={styles.avatarScrollContent}
        >
          {carAvatars.map((avatarSrc, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.avatarOption,
                idx === selectedAvatarIndex && styles.avatarOptionSelected
              ]}
              onPress={() => setSelectedAvatarIndex(idx)}
            >
              <Image source={avatarSrc} style={styles.avatarImage} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Button to confirm chosen avatar */}
        <TouchableOpacity style={styles.setAvatarButton} onPress={handleSetCarAvatar}>
          <Text style={styles.setAvatarButtonText}>Set Car Avatar</Text>
        </TouchableOpacity>
      </View>

      {/* Map & Search Section */}
      <View style={styles.mapSection}>
        <TouchableOpacity style={styles.mapButton} onPress={openMap}>
          <Text style={styles.mapButtonText}>Open Map</Text>
        </TouchableOpacity>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter place to search"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.mapButton} onPress={searchAndOpenMap}>
            <Text style={styles.mapButtonText}>Search & Open Map</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Spots Near You */}
      <View style={styles.spotsHeader}>
        <Text style={styles.spotsTitle}>Spots near you</Text>
      </View>
      <ScrollView style={styles.spotsList}>
        {nearbySpots.length > 0 ? (
          nearbySpots.map((park, index) => (
            <TouchableOpacity
              key={index}
              style={styles.spotCard}
              onPress={() => navigation.navigate('BookingScreen', { carPark: park })}
            >
              <Text style={styles.spotName}>{park.address}</Text>
              <Text style={styles.spotDistance}>{park.distance.toFixed(2)} km away</Text>
              <Text style={styles.spotPrice}>FREE: {park.free_parking}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.spotCard}>
            <Text style={styles.spotName}>No spots within 5 km</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DCE7E3',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DCE7E3',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#003366',
  },
  vehicleContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  vehicleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  vehicleNumber: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  addVehicleButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  addVehicleButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Main preview image of the selected avatar
  carImage: {
    width: 200,
    height: 120,
    marginTop: 10,
  },
  // Horizontal avatar scroll
  avatarScroll: {
    marginTop: 10,
    width: '100%',
  },
  avatarScrollContent: {
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  avatarOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginHorizontal: 5,
    padding: 5,
  },
  avatarOptionSelected: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  avatarImage: {
    width: 60,
    height: 40,
    resizeMode: 'contain',
  },
  setAvatarButton: {
    marginTop: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  setAvatarButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  mapSection: {
    marginBottom: 20,
  },
  mapButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginVertical: 5,
  },
  mapButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginRight: 10,
  },
  spotsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  spotsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  spotsList: {
    flex: 1,
    marginBottom: 20,
  },
  spotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  spotName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  spotDistance: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  spotPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});
