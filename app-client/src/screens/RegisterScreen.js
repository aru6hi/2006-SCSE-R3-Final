import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { registerUser } from '../services/api'; // Connects to backend API
import { useVehicleData } from './VehicleContext';

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Added password field
  const { updateVehicleData } = useVehicleData();

  // Handle Sign Up button tap
  const handleSignUp = async () => {
    if (!fullName || !phoneNumber || !email || !password) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    
    // Debug log to check the values being sent
    console.log('Registering with:', { email, password, fullName, phoneNumber });
    
    try {
      // Call the registerUser function from your API
      const response = await registerUser(email, password, fullName, phoneNumber);
      console.log('Registration successful:', response);
      Alert.alert('Success', 'Registration completed!');
      // Navigate to the VehicleDetails screen, passing the email as identifier
      updateVehicleData({
        email: email,
        vehicleNumber: '',
        iuNo: '',
        country: 'SG',
      });
      navigation.navigate('VehicleDetails');
    } catch (error) {
      console.error('Registration failed:', error);
      Alert.alert('Error', error.message || 'Registration failed.');
    }
  };

  // Handle "Back to Login" if needed
  const handleBackToLogin = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Top Row: App Icon & "Sign Up" */}
      <View style={styles.topRow}>
        {/* Uncomment and replace the image asset if needed */}
        {/* <Image
          source={require('../assets/quickpark_icon.png')}
          style={styles.appIcon}
        /> */}
        <TouchableOpacity onPress={handleSignUp} style={styles.signUpButton}>
          <Text style={styles.signUpText}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      {/* REGISTER Title */}
      <Text style={styles.registerTitle}>REGISTER</Text>

      {/* Full Name Field */}
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor="#999"
        value={fullName}
        onChangeText={setFullName}
      />

      {/* Phone Number Field */}
      <TextInput
        style={styles.input}
        placeholder="Phone No."
        placeholderTextColor="#999"
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
      />

      {/* Email Field */}
      <TextInput
        style={styles.input}
        placeholder="Email Id"
        placeholderTextColor="#999"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* Password Field */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry={true}
        value={password}
        onChangeText={setPassword}
      />

      {/* Register Button */}
      <TouchableOpacity style={styles.registerButton} onPress={handleSignUp}>
        <Text style={styles.registerButtonText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DCE7E3',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  appIcon: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginLeft: 10,
  },
  signUpButton: {
    marginRight: 10,
  },
  signUpText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  registerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginTop: 10,
  },
  registerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    width: '100%',
    paddingVertical: 15,
    marginTop: 20,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
