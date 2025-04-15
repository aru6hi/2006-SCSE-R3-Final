import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Image,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useVehicleData } from "./VehicleContext";
import { fetchUserData, updateUserProfile } from "../services/userProfileService";
import { updateVehicleDetails } from "../services/vehicleService";

// Car avatars array
const carAvatars = [
  require('../../assets/vecteezy_dynamic-sport-car-with-sleek-lines-and-powerful-presence_51785067.png'),
  require('../../assets/vecteezy_modern-car-isolated-on-transparent-background-3d-rendering_19146428.png'),
  require('../../assets/vecteezy_sport-car-3d-rendering_13472036.png'),
  require('../../assets/vecteezy_sport-car-isolated-on-transparent-background-3d-rendering_19069771.png'),
  require('../../assets/vecteezy_toy-car-isolated_13737872.png'),
  require('../../assets/vecteezy_white-sport-car-on-transparent-background-3d-rendering_25305916.png'),
  require('../../assets/vecteezy_white-suv-on-transparent-background-3d-rendering_25311224.png')
];

export default function EditDetailsScreen() {
  const navigation = useNavigation();
  const { vehicleData, updateVehicleData } = useVehicleData();

  // Basic user details
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [iuNumber, setIuNumber] = useState(""); // Added IU Number field

  // Car avatar index
  const [avatarIndex, setAvatarIndex] = useState(0);

  // Loading indicator
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Flag to prevent reloading data if already loaded
  const [hasLoadedData, setHasLoadedData] = useState(false);

  // Fetch user details from userProfileService only once
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (vehicleData && vehicleData.email && !hasLoadedData) {
        try {
          const userData = await fetchUserData(vehicleData.email);
          if (userData) {
            setFullName(userData.fullName || "");
            setPhoneNumber(userData.phoneNumber || "");
            setCountry(userData.country || "");
            setVehicleNumber(userData.vehicleNo || "");
            setIuNumber(userData.iuNo || "");
            setAvatarIndex(userData.avatarIndex || 0);
            setHasLoadedData(true);
          } else {
            console.log("No user document found");
            setHasLoadedData(true);
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
          Alert.alert("Error", "Failed to load user details");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserDetails();
  }, [vehicleData, hasLoadedData]);

  // Handle update using both services
  const handleUpdate = async () => {
    if (!vehicleData.email) {
      Alert.alert("Error", "User email not available");
      return;
    }

    setUpdating(true);
    try {
      // Use userProfileService to update user profile
      const userProfileData = {
        fullName,
        phoneNumber,
        avatarIndex,
      };

      await updateUserProfile(vehicleData.email, userProfileData);

      // Use vehicleService to update vehicle details
      await updateVehicleDetails(
        vehicleData.email,
        country,
        vehicleNumber,
        iuNumber
      );

      // Update local context so other screens see the changes
      updateVehicleData({
        ...vehicleData,
        fullName,
        phoneNumber,
        country,
        vehicleNumber,
        iuNumber,
        avatarIndex,
      });

      Alert.alert("Success", "User and vehicle details updated");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating details:", error);
      Alert.alert("Error", "Failed to update details");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>Edit Your Details</Text>

      <ScrollView style={styles.scrollContainer}>
        {/* User Profile Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
        </View>

        {/* Vehicle Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>
          <TextInput
            style={styles.input}
            placeholder="Country"
            value={country}
            onChangeText={setCountry}
          />
          <TextInput
            style={styles.input}
            placeholder="Vehicle Number"
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
          />
          <TextInput
            style={styles.input}
            placeholder="IU Number"
            value={iuNumber}
            onChangeText={setIuNumber}
          />
        </View>

        {/* Avatar Selection Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Vehicle Avatar</Text>

          {/* Preview the currently selected avatar */}
          <View style={styles.avatarPreview}>
            <Image
              source={carAvatars[avatarIndex]}
              style={styles.avatarPreviewImage}
              resizeMode="contain"
            />
            <Text style={styles.avatarLabel}>
              Selected Vehicle Avatar
            </Text>
          </View>

          {/* Horizontal scroll of avatar options */}
          <ScrollView
            horizontal
            style={styles.avatarScroll}
            contentContainerStyle={styles.avatarScrollContent}
            showsHorizontalScrollIndicator={false}
          >
            {carAvatars.map((avatarSrc, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.avatarOption,
                  idx === avatarIndex && styles.avatarOptionSelected,
                ]}
                onPress={() => setAvatarIndex(idx)}
              >
                <Image source={avatarSrc} style={styles.avatarImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Save changes */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleUpdate}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Update Details</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#DCE7E3",
  },
  container: {
    flex: 1,
    backgroundColor: "#DCE7E3",
  },
  scrollContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 20,
    textAlign: "center",
    color: "#333",
  },
  sectionContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  input: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    fontSize: 16,
  },
  avatarPreview: {
    alignItems: "center",
    marginTop: 10,
  },
  avatarPreviewImage: {
    width: 200,
    height: 120,
    marginBottom: 8,
  },
  avatarLabel: {
    fontSize: 16,
    color: "#333",
  },
  avatarScroll: {
    marginTop: 16,
  },
  avatarScrollContent: {
    paddingHorizontal: 5,
    alignItems: "center",
  },
  avatarOption: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    marginHorizontal: 5,
    padding: 8,
  },
  avatarOptionSelected: {
    borderColor: "#007AFF",
    borderWidth: 2,
    backgroundColor: "#E6F2FF",
  },
  avatarImage: {
    width: 60,
    height: 40,
    resizeMode: "contain",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 20,
    height: 50,
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
