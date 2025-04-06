import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './screens/LoginScreen';
import { VehicleProvider } from './screens/VehicleContext';
import RegisterScreen from './screens/RegisterScreen';
import VehicleDetailsScreen from './screens/VehicleDetailsScreen';
import HomeScreen from './screens/HomeScreen';
import MapScreen from './screens/MapScreen';
import BookingScreen from './screens/BookingScreen';
import ProfileScreen from './screens/Profile';
import CheckInScreen from './screens/CheckInScreen';
import EditDetailsScreen from './screens/EditDetailsScreen';
import ParkingTicketContainer from './screens/ParkingTicketScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <VehicleProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="LoginScreen">
          <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="RegisterScreen" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="VehicleDetails" component={VehicleDetailsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Map" component={MapScreen} options={{ headerShown: false }} />
          <Stack.Screen name="BookingScreen" component={BookingScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CheckInScreen" component={CheckInScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EditDetailsScreen" component={EditDetailsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ParkingTicketScreen" component={ParkingTicketContainer} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </VehicleProvider>
  );
}
