// src/services/mapService.js
import { Alert } from 'react-native';

export const haversineDistance = (coords1, coords2) => {
  const deg2rad = (deg) => deg * (Math.PI / 180);
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(coords2.lat - coords1.lat);
  const dLon = deg2rad(coords2.lon - coords1.lon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(coords1.lat)) *
      Math.cos(deg2rad(coords2.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

export const getNearbyCarParks = (carParks, location, radiusKm = 5) => {
  if (!location || !carParks?.length) return [];

  return carParks
    .map((park) => {
      const dist = haversineDistance(
        location,
        {
          lat: parseFloat(park.latitude),
          lon: parseFloat(park.longitude)
        }
      );
      return { ...park, distance: dist };
    })
    .filter((park) => park.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
};

export const showCarParkOnMap = (webViewRef, carPark, userLocation) => {
  if (!webViewRef?.current || !carPark) return;

  const script = `
    (function() {
      var carPark = ${JSON.stringify(carPark)};
      var userLocation = ${userLocation ? JSON.stringify(userLocation) : 'null'};
      if (window.showCarParkOnMap) {
        window.showCarParkOnMap(carPark, userLocation);
      }
    })();
  `;

  webViewRef.current.injectJavaScript(script);
};

export const showCarParksOnMap = (webViewRef, carParks, centerLocation, searchQuery = "") => {
  if (!webViewRef?.current) return;

  const script = `
    (function() {
      var carParks = ${JSON.stringify(carParks)};
      var centerCoord = ${centerLocation ? JSON.stringify([centerLocation.lat, centerLocation.lon]) : 'null'};
      if (window.loadCarParks) {
        window.loadCarParks(carParks, "${searchQuery}", centerCoord);
      }
    })();
  `;

  webViewRef.current.injectJavaScript(script);
};

export const generateMapHTML = (isMultipleMarkers = false) => {
  // Base HTML for all maps
  const baseHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <title>Leaflet Map</title>
      <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
      <style>
        html, body { margin: 0; padding: 0; height: 100%; }
        #map { width: 100%; height: 100%; }
        .car-park-popup { font-size: 14px; }
        .car-park-popup .name { font-weight: bold; margin-bottom: 5px; }
        .car-park-popup .address { margin-bottom: 5px; }
        .car-park-popup .distance { color: #666; }
        .car-park-popup .free { color: #007AFF; font-weight: bold; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map');
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '©️ OpenStreetMap contributors',
          maxZoom: 20
        }).addTo(map);

        var markers = [];
        var userMarker;
  `;

  // For single car park view (BookingScreen)
  const singleMarkerHTML = `
        window.showCarParkOnMap = function(carPark, userLocation) {
          // Clear existing markers
          markers.forEach(marker => map.removeLayer(marker));
          markers = [];
          if (userMarker) map.removeLayer(userMarker);

          var lat = parseFloat(carPark.latitude);
          var lon = parseFloat(carPark.longitude);

          if (!isNaN(lat) && !isNaN(lon)) {
            var marker = L.marker([lat, lon])
              .bindPopup('<div class="car-park-popup"><div class="name">' +
                (carPark.address || "Car Park") + '</div>' +
                (carPark.free_parking ? '<div class="free">FREE: ' + carPark.free_parking + '</div>' : '') +
                '</div>')
              .addTo(map);

            markers.push(marker);

            if (userLocation) {
              userMarker = L.marker([userLocation.lat, userLocation.lon], {
                icon: L.divIcon({
                  html: '<div style="background-color: #4285F4; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
                  className: 'user-location-marker'
                })
              }).addTo(map);

              var bounds = L.latLngBounds([
                [lat, lon],
                [userLocation.lat, userLocation.lon]
              ]);
              map.fitBounds(bounds, { padding: [50, 50], maxZoom: 18 });
            } else {
              map.setView([lat, lon], 18);
            }
          }
        };
  `;

  // For multiple car parks view (MapScreen)
  const multipleMarkersHTML = `
        window.loadCarParks = function(carParks, searchQuery, centerCoord) {
          // Clear existing markers
          markers.forEach(marker => map.removeLayer(marker));
          markers = [];
          if (userMarker) map.removeLayer(userMarker);

          // Filter by search query if provided
          var filteredParks = carParks;
          if (searchQuery) {
            searchQuery = searchQuery.toLowerCase();
            filteredParks = carParks.filter(park =>
              park.address && park.address.toLowerCase().includes(searchQuery)
            );
          }

          // Add markers for car parks
          var bounds = L.latLngBounds();

          filteredParks.forEach(function(park) {
            var lat = parseFloat(park.latitude);
            var lon = parseFloat(park.longitude);

            if (!isNaN(lat) && !isNaN(lon)) {
              bounds.extend([lat, lon]);

              var popupContent = '<div class="car-park-popup">' +
                '<div class="name">' + (park.address || "Car Park") + '</div>' +
                (park.distance ? '<div class="distance">' + park.distance.toFixed(2) + ' km away</div>' : '') +
                (park.free_parking ? '<div class="free">FREE: ' + park.free_parking + '</div>' : '') +
                '</div>';

              var marker = L.marker([lat, lon])
                .bindPopup(popupContent)
                .addTo(map);

              markers.push(marker);
            }
          });

          // Add user location marker if available
          if (centerCoord) {
            bounds.extend([centerCoord[0], centerCoord[1]]);
            userMarker = L.marker([centerCoord[0], centerCoord[1]], {
              icon: L.divIcon({
                html: '<div style="background-color: #4285F4; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
                className: 'user-location-marker'
              })
            }).addTo(map);
          }

          // If we have markers, fit the map to show all of them
          if (markers.length > 0 || centerCoord) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
          } else if (filteredParks.length === 0) {
            // If no markers found with search query
            map.setView([1.3521, 103.8198], 12); // Default to Singapore
          }
        };
  `;

  const closingHTML = `
      </script>
    </body>
    </html>
  `;

  return baseHTML + (isMultipleMarkers ? multipleMarkersHTML : singleMarkerHTML) + closingHTML;
};

export const getCarParkDetailMapHTML = () => {
  return generateMapHTML(false);
};

export const getCarParksMapHTML = () => {
  return generateMapHTML(true);
};

export const openGoogleMapsDirections = (carPark) => {
  if (!carPark?.latitude || !carPark?.longitude) {
    Alert.alert("Error", "Location coordinates not available");
    return;
  }

  const lat = carPark.latitude;
  const lng = carPark.longitude;
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  import('react-native').then(({ Linking }) => {
    Linking.openURL(url).catch(err =>
      Alert.alert("Error", "Couldn't open Google Maps. Please make sure you have it installed.")
    );
  });
};