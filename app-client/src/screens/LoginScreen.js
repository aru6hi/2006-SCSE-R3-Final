import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { loginUser, sendPasswordResetEmail } from "../services/authService"; // Import the new Google Login API function
import { useVehicleData } from './VehicleContext'; // Import the context

const generateRandomPassword = (length = 12) => {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;

  const getRandomChar = (charSet) => charSet[Math.floor(Math.random() * charSet.length)];

  // Ensure at least one character from each character set
  const password = [
    getRandomChar(uppercaseChars),
    getRandomChar(lowercaseChars),
    getRandomChar(numberChars),
    getRandomChar(specialChars)
  ];

  // Fill the rest of the password with random characters
  for (let i = 4; i < length; i++) {
    password.push(getRandomChar(allChars));
  }

  // Shuffle the password array
  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join('');
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { updateVehicleData } = useVehicleData(); // Get context data

  // Handle Login button tap
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }

    try {
      const user = await loginUser(email, password);
      if (user) {
        console.log("Login successful:", user);

        // Update vehicle data in context
        updateVehicleData({
          email: user.email || '',
          vehicleNumber: user.vehicleNo || '',
          iuNo: user.iuNo || '',
          country: user.country || 'SG',
        });

        Alert.alert("Success", "Login successful!");
        navigation.navigate("HomeScreen");
      } else {
        Alert.alert("Error", "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      Alert.alert("Error", error.message || "Invalid credentials.");
    }
  };

  // Handle "Not a User? Register" link
  const handleRegister = () => {
    navigation.navigate("RegisterScreen");
  };

  // Handle "Forgot Password?" link
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address first.");
      return;
    }

    try {
      const result = await sendPasswordResetEmail(email);
      if (result.success) {
        Alert.alert(
          "Password Reset",
          "A password reset link has been sent to your email. Please check your inbox and follow the instructions."
        );
      } else {
        Alert.alert("Error", result.error || "Failed to send password reset email. Please try again.");
      }
    } catch (error) {
      console.error("Password reset failed:", error);
      Alert.alert("Error", error.message || "Password reset failed.");
    }
  };

  // Handle "Sign Up" link
  const handleSignUp = () => {
    navigation.navigate('RegisterScreen');
  };

  return (
    <View style={styles.container}>
      {/* Top Row: App Icon & "Sign Up" */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={handleSignUp} style={styles.signUpButton}>
          <Text style={styles.signUpText}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      {/* LOGIN Title */}
      <Text style={styles.loginTitle}>LOGIN</Text>

      {/* Email Field */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        onChangeText={setEmail}
        value={email}
      />

      {/* Password Field */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />

      {/* Register & Forgot Password Row */}
      <View style={styles.linkRow}>
        <TouchableOpacity onPress={handleRegister}>
          <Text style={styles.linkText}>Not a User? Register</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.linkText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginButtonText}>Login</Text>
      </TouchableOpacity>

    </View>
  );
}

// Styles remain the same
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
  loginTitle: {
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
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    width: '100%',
    paddingVertical: 15,
    marginTop: 20,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  orText: {
    marginVertical: 10,
    color: '#666',
    fontSize: 14,
  },
  singPassButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
  },
  singPassButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});