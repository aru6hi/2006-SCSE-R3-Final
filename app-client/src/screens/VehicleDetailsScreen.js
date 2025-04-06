import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert 
} from 'react-native';
import { updateVehicleDetails } from '../services/api';
import { useVehicleData } from './VehicleContext'; // Import the context

export default function VehicleDetailsScreen({ navigation }) {
  const { vehicleData, updateVehicleData } = useVehicleData(); // Get context data
  const email = vehicleData.email; // Get email from context instead of route
  
  console.log("VehicleDetailsScreen - email:", email);

  const [country, setCountry] = useState(vehicleData.country || 'SG');
  const [vehicleNo, setVehicleNo] = useState(vehicleData.vehicleNumber || '');
  const [iuNo, setIuNo] = useState(vehicleData.iuNo || '');

  // If the user skips adding vehicle details,
  // navigate to HomeScreen with an empty vehicleNumber.
  const handleSkip = () => {
    console.log("User skipped adding vehicle details.");
    navigation.replace('HomeScreen', { email });

  };

  const handleSave = async () => {
    if (!vehicleNo || !iuNo) {
      Alert.alert('Error', 'Please fill in both vehicle no. and IU no.');
      return;
    }
    if (!email || email.trim() === '') {
      console.error("Email is missing from context");
      Alert.alert('Error', 'Email is required to update vehicle info. Please log in again.');
      return;
    }
    console.log("Saving vehicle details for:", email, { country, vehicleNo, iuNo });

    try {
      await updateVehicleDetails(email, country, vehicleNo, iuNo);
      console.log("Vehicle details saved successfully.");
      
      // Update vehicle data in context
      updateVehicleData({
        email: email,
        vehicleNumber: vehicleNo,
        iuNo,
        country
      });

      Alert.alert('Success', 'Vehicle details saved!');
      navigation.replace('HomeScreen', { email, vehicleNumber: vehicleNo });
    } catch (error) {
      console.error("Failed to save vehicle details:", error);
      Alert.alert('Error', 'Failed to save vehicle details. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Country Toggle */}
      <View style={styles.countryRow}>
        <TouchableOpacity
          style={[styles.countryButton, country === 'SG' && styles.selected]}
          onPress={() => setCountry('SG')}
        >
          <Text style={[styles.countryText, country === 'SG' && styles.selectedText]}>
            SG
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.countryButton, country === 'MY' && styles.selected]}
          onPress={() => setCountry('MY')}
        >
          <Text style={[styles.countryText, country === 'MY' && styles.selectedText]}>
            MY
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.countryButton, country === 'PH' && styles.selected]}
          onPress={() => setCountry('PH')}
        >
          <Text style={[styles.countryText, country === 'PH' && styles.selectedText]}>
            PH
          </Text>
        </TouchableOpacity>
      </View>

      {/* Vehicle Number Field */}
      <TextInput
        style={styles.input}
        placeholder="Vehicle No."
        placeholderTextColor="#999"
        value={vehicleNo}
        onChangeText={setVehicleNo}
      />

      {/* IU Number Field */}
      <TextInput
        style={styles.input}
        placeholder="IU No."
        placeholderTextColor="#999"
        value={iuNo}
        onChangeText={setIuNo}
      />

      {/* Button Row: Skip and Save */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#DCE7E3', 
    alignItems: 'center', 
    paddingTop: 50 
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 20 
  },
  countryRow: { 
    flexDirection: 'row', 
    marginBottom: 20 
  },
  countryButton: {
    backgroundColor: '#FFF',
    marginHorizontal: 5,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  selected: { 
    backgroundColor: '#007AFF' 
  },
  countryText: { 
    color: '#333', 
    fontSize: 16 
  },
  selectedText: { 
    color: '#FFF', 
    fontWeight: '600' 
  },
  input: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  buttonRow: { 
    flexDirection: 'row', 
    marginTop: 20 
  },
  skipButton: {
    backgroundColor: 'gray',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginRight: 10,
  },
  skipText: { 
    color: '#FFF', 
    fontSize: 16 
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  saveButtonText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: '600' 
  },
});