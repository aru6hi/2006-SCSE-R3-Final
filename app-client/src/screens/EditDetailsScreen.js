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
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../services/firebaseConfig";
// 1) Import your car images in an array
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

  // Car avatar index
  const [avatarIndex, setAvatarIndex] = useState(0);

  // Loading indicator
  const [loading, setLoading] = useState(true);

  // 2) Fetch user details (including avatarIndex) from Firestore
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (vehicleData && vehicleData.email) {
        try {
          const userDocRef = doc(db, "users", vehicleData.email);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setFullName(data.fullName || "");
            setPhoneNumber(data.phoneNumber || "");
            setCountry(data.country || "");
            setVehicleNumber(data.vehicleNo || "");
            setAvatarIndex(data.avatarIndex || 0);
          } else {
            console.log("No user document found");
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
        } finally {
          setLoading(false);
        }
      } else {
        console.log("No email available in vehicleData");
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  // 3) Handle update (save to Firestore and context)
  const handleUpdate = async () => {
    if (!vehicleData.email) {
      Alert.alert("Error", "User email not available");
      return;
    }
    try {
      const userDocRef = doc(db, "users", vehicleData.email);
      await setDoc(
        userDocRef,
        {
          fullName,
          phoneNumber,
          country,
          vehicleNo: vehicleNumber,
          avatarIndex,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      // Update local context so other screens see the changes
      updateVehicleData({
        ...vehicleData,
        fullName,
        phoneNumber,
        country,
        vehicleNumber,
        avatarIndex,
      });

      Alert.alert("Success", "User details updated");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating user details:", error);
      Alert.alert("Error", "Failed to update details");
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

      {/* Basic info fields */}
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

      {/* Preview the currently selected avatar */}
      <View style={styles.avatarPreview}>
        <Image
          source={carAvatars[avatarIndex]}
          style={styles.avatarPreviewImage}
          resizeMode="contain"
        />
        <Text style={styles.avatarLabel}>
          Current Avatar (Index {avatarIndex})
        </Text>
      </View>

      {/* Horizontal scroll of avatar options */}
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
              idx === avatarIndex && styles.avatarOptionSelected,
            ]}
            onPress={() => setAvatarIndex(idx)}
          >
            <Image source={avatarSrc} style={styles.avatarImage} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Save changes */}
      <TouchableOpacity style={styles.button} onPress={handleUpdate}>
        <Text style={styles.buttonText}>Update Details</Text>
      </TouchableOpacity>
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
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 20,
    textAlign: "center",
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
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
    marginTop: 10,
    marginBottom: 20,
  },
  avatarScrollContent: {
    paddingHorizontal: 5,
    alignItems: "center",
  },
  avatarOption: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginHorizontal: 5,
    padding: 5,
  },
  avatarOptionSelected: {
    borderColor: "#007AFF",
    borderWidth: 2,
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
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
