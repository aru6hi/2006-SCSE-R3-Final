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
  Alert
} from 'react-native';
import { useVehicleData } from './VehicleContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import carParksData from '../../assets/carparks_sg.json';
import { getCurrentLocation } from '../services/geolocationService';
import { WebView } from 'react-native-webview';
import {
  getNearbyCarParks,
  getCarParksMapHTML,
  showCarParksOnMap
} from '../services/mapService';

// Car avatar imports
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
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(0);

  const webViewRef = React.useRef(null);

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, 'users', email);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
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

  // Load car parks from local JSON
  useEffect(() => {
    setCarParks(carParksData);
  }, []);

  // Get user's current location
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const coords = await getCurrentLocation();
        setUserLocation({
          lat: coords.latitude,
          lon: coords.longitude,
        });
      } catch (error) {
        console.error('Geolocation error:', error.message);
        Alert.alert('Location Error', 'Could not get your current location.');
      }
    };

    fetchLocation();
  }, []);

  // Determine nearby car parks (within 5 km)
  useEffect(() => {
    if (userLocation && carParks.length > 0) {
      const nearby = getNearbyCarParks(carParks, userLocation, 5);
      setNearbySpots(nearby);
    }
  }, [userLocation, carParks]);

  // Load car parks onto the mini-map WebView
  useEffect(() => {
    if (webViewRef.current && userLocation && nearbySpots.length > 0) {
      showCarParksOnMap(webViewRef, nearbySpots, userLocation, searchQuery);
    }
  }, [webViewRef.current, userLocation, nearbySpots, searchQuery]);

  const handleSetCarAvatar = async () => {
    try {
      updateVehicleData({
        ...vehicleData,
        avatarIndex: selectedAvatarIndex,
      });
      navigation.navigate('EditDetailsScreen');
      if (email) {
        const userDocRef = doc(db, 'users', email);
        await updateDoc(userDocRef, { avatarIndex: selectedAvatarIndex });
      }
      Alert.alert('Avatar Updated', 'Select your car avatar');
    } catch (err) {
      console.error('Failed to set car avatar:', err);
    }
  };

  const openMap = () => {
    navigation.navigate('Map', { searchQuery: '' });
  };

  const searchAndOpenMap = () => {
    navigation.navigate('Map', { searchQuery });
  };

  const handleLogout = () => {
    navigation.navigate('LoginScreen');
  };

  const handleProfile = () => {
    navigation.navigate('ProfileScreen');
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

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

        {/* Single car image (removed the avatar gallery) */}
        <Image
          source={carAvatars[selectedAvatarIndex]}
          style={styles.carImage}
          resizeMode="contain"
        />

        <TouchableOpacity style={styles.setAvatarButton} onPress={handleSetCarAvatar}>
          <Text style={styles.setAvatarButtonText}>Set New Car Avatar</Text>
        </TouchableOpacity>
      </View>

      {/* Mini Map Preview */}
      <View style={styles.miniMapContainer}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: getCarParksMapHTML() }}
          style={styles.miniMap}
        />
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
      {/* Keep the spots list scrollable with extra bottom padding */}
      <ScrollView
        style={styles.spotsList}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        {nearbySpots.length > 0 ? (
          nearbySpots.map((park, index) => (
            <TouchableOpacity
              key={index}
              style={styles.spotCard}
              onPress={() => navigation.navigate('BookingScreen', { carPark: park })}
            >
              <Text style={styles.spotName}>{park.address}</Text>
              <Text style={styles.spotDistance}>
                {park.distance.toFixed(2)} km away
              </Text>
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
    marginBottom: 1,
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
  carImage: {
    width: 300,
    height: 180,
    marginTop: 3,
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
  miniMapContainer: {
    height: 150,
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  miniMap: {
    flex: 1,
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
