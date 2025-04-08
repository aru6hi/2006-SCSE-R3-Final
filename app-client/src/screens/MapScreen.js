import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert
} from 'react-native';
import { WebView } from 'react-native-webview';
import carParksData from '../../assets/carparks_sg.json';
import { getCurrentLocation } from '../services/geolocationService';

export default function MapScreen({ route, navigation }) {
  const { searchQuery } = route.params || "";
  const [carParks, setCarParks] = useState([]);
  const [centerLocation, setCenterLocation] = useState(null);
  const webViewRef = useRef(null);

  useEffect(() => {
    setCarParks(carParksData);
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const geocodeAddress = async (query) => {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=sg&q=${encodeURIComponent(query)}`;
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'QuickPark/1.0 (c230202@e.ntu.edu.sg)'
            }
          });
          const data = await response.json();
          if (data.length > 0) {
            const { lat, lon } = data[0];
            setCenterLocation({ lat: parseFloat(lat), lon: parseFloat(lon) });
          } else {
            console.warn("No results for:", query);
          }
        } catch (error) {
          console.error("Geocoding error:", error);
        }
      };
      geocodeAddress(searchQuery);
    } else {
      // Use geolocationService instead of direct Geolocation API
      const fetchLocation = async () => {
        try {
          const coords = await getCurrentLocation();
          setCenterLocation({
            lat: coords.latitude,
            lon: coords.longitude,
          });
        } catch (error) {
          console.error("Geolocation error:", error.message);
          Alert.alert("Location Error", "Could not get your current location.");
        }
      };
      fetchLocation();
    }
  }, [searchQuery]);

  const reInjectScript = () => {
    const script = `
      (function() {
        var carParks = ${JSON.stringify(carParks)};
        var centerCoord = ${centerLocation ? JSON.stringify([centerLocation.lat, centerLocation.lon]) : 'null'};
        if (window.loadCarParks) {
          window.loadCarParks(carParks, "", centerCoord);
        }
      })();
    `;
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(script);
    }
  };

  useEffect(() => {
    if (centerLocation || carParks.length > 0) {
      reInjectScript();
    }
  }, [centerLocation, carParks]);

  const leafletHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Leaflet Map</title>
      <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
      <style>
        html, body { margin: 0; padding: 0; height: 100%; }
        #map { width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([1.35, 103.8], 20);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: 'Â© OpenStreetMap contributors',
          maxZoom: 20
        }).addTo(map);

        window.loadCarParks = function(carParks, searchPlace, centerCoord) {
          var markers = L.featureGroup();
          carParks.forEach(function(cp) {
            var lat = parseFloat(cp.latitude);
            var lon = parseFloat(cp.longitude);
            if (!isNaN(lat) && !isNaN(lon)) {
              var marker = L.marker([lat, lon]).bindPopup(cp.address || "Carpark");
              marker.on('click', function() {
                // Send minimal data back; we'll use the car_park_no to lookup full details in RN
                window.ReactNativeWebView.postMessage(JSON.stringify({ car_park_no: cp.car_park_no, address: cp.address, latitude: lat, longitude: lon }));
              });
              markers.addLayer(marker);
            }
          });
          markers.addTo(map);

          if (centerCoord) {
            var offset = 0.002;
            var bounds = [
              [centerCoord[0] - offset, centerCoord[1] - offset],
              [centerCoord[0] + offset, centerCoord[1] + offset]
            ];
            map.fitBounds(bounds, { padding: [50, 50] });
          } else if (markers.getLayers().length > 0) {
            map.fitBounds(markers.getBounds(), { padding: [50, 50] });
          }
        };
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: leafletHtml }}
        onMessage={(event) => {
          const { car_park_no } = JSON.parse(event.nativeEvent.data);
          // Lookup full details using car_park_no
          const fullCarParkData = carParksData.find(cp => cp.car_park_no === car_park_no);
          if (fullCarParkData) {
            navigation.navigate('BookingScreen', { carPark: fullCarParkData });
          } else {
            Alert.alert("Error", "Car park data not found.");
          }
        }}
        style={{ flex: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,122,255,0.8)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
});