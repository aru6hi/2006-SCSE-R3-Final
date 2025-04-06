import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useVehicleData } from "./VehicleContext"; // Import context
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebaseConfig";

const Profile = () => {
  const navigation = useNavigation();
  const { vehicleData } = useVehicleData();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user details from Firestore using the email from vehicleData
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (vehicleData && vehicleData.email) {
          const userDocRef = doc(db, "users", vehicleData.email);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data());
          } else {
            console.log("No user document found");
          }
        } else {
          console.log("No email available in vehicleData");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [vehicleData]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const fullName = userData?.fullName || "User Name";
  const phone = userData?.phoneNumber || "No Phone";
  const email = userData?.email || "No Email";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* App Bar */}
      <View style={styles.header}>
        <View style={styles.appIconContainer}>
          <View style={styles.appIcon}>
            <Text style={styles.iconText}>QP</Text>
          </View>
          <Text style={styles.appName}>QuickPark</Text>
        </View>
        <View style={styles.profileIconContainer}>
          <Text style={styles.iconText}>👤</Text>
        </View>
      </View>

      {/* User Details */}
      <View style={styles.userDetails}>
        <Text style={styles.userName}>{fullName}</Text>
        <Text style={styles.userInfo}>{phone}</Text>
        <Text style={styles.userInfo}>{email}</Text>
      </View>

      {/* Profile Title */}
      <Text style={styles.profileTitle}>My Profile</Text>

      {/* Menu Grid */}
      <View style={styles.menuGrid}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("EditDetailsScreen")}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.menuIcon}>🚗</Text>
          </View>
          <Text style={styles.menuText}>Edit Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("CheckInScreen")}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.menuIcon}>🅿️</Text>
          </View>
          <Text style={styles.menuText}>My Parking</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("LoginScreen")}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.menuIcon}>↪️</Text>
          </View>
          <Text style={styles.menuText}>Logout</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate("HomeScreen")}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.menuIcon}>🏠</Text>
          </View>
          <Text style={styles.menuText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#DCE7E3",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#DCE7E3",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  appIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  appIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#4EB89D",
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  appName: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  profileIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  userDetails: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  userInfo: {
    fontSize: 14,
    color: "#555",
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 24,
    paddingHorizontal: 24,
    color: "#333",
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  menuItem: {
    width: "46%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
    aspectRatio: 1 / 0.8,
  },
  iconContainer: {
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  menuIcon: {
    fontSize: 24,
  },
  menuText: {
    textAlign: "center",
    fontWeight: "500",
    color: "#555",
  },
});

export default Profile;
