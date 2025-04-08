import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { generatePDF } from '../services/pdfService';

/**
 * ParkingTicket Component: Displays a dynamic parking ticket with reservation details.
 * The QuickPark icon and text are placed inside the white ticket card.
 */
const ParkingTicket = ({ ticketData }) => {
  const ticket = ticketData || {};
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Function to handle PDF generation and provide feedback to the user
  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPdf(true);
      const base64Data = await generatePDF(ticket);

      if (base64Data) {
        console.log('Base64 PDF length:', base64Data.length);
        Alert.alert(
          'PDF Generated Successfully',
          'Your parking ticket has been generated and is ready for download.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'No PDF data returned');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <View style={styles.ticketContainer}>
      {/* Ticket Card */}
      <View style={styles.ticketCard}>
        {/* Notch at the top */}
        <View style={styles.ticketNotch} />

        {/* Icon & QuickPark Title inside the card */}
        <View style={styles.iconTitleRow}>
          <View style={styles.appIconContainer}>
            <Text style={styles.appIconText}>QP</Text>
          </View>
          <Text style={styles.appNameText}>QuickPark</Text>
        </View>

        {/* Ticket Title */}
        <View style={styles.ticketTitleContainer}>
          <Text style={styles.ticketTitle}>Here's your</Text>
          <Text style={styles.ticketTitle}>Parking Ticket!</Text>
        </View>

        {/* Ticket Details - Top Row */}
        <View style={styles.ticketDetailRow}>
          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>Parking slot</Text>
            <Text style={styles.detailValue}>{ticket.parkingSlot || 'N/A'}</Text>
          </View>
          <View style={styles.qrContainer}>
            <Image
              source={{ uri: 'https://via.placeholder.com/96' }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Ticket Details - Middle Row */}
        <View style={styles.ticketDetailRow}>
          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>Vehicle</Text>
            <Text style={styles.detailValueSmall}>{ticket.vehicleNumber || 'N/A'}</Text>
          </View>
          <View style={[styles.detailBlock, styles.detailBlockRight]}>
            <Text style={[styles.detailLabel, { textAlign: 'right' }]}>Parking Pass</Text>
            <Text style={[styles.detailValueSmall, { textAlign: 'right' }]}>{ticket.parkingPass || 'N/A'}</Text>
          </View>
        </View>

        {/* Divider Line */}
        <View style={styles.divider} />

        {/* Ticket Details - Time */}
        <View style={styles.ticketTimeContainer}>
          <Text style={styles.detailLabelCenter}>Entry Time - Exit Time</Text>
          <Text style={styles.detailValueCenter}>
            {ticket.entryTime || 'N/A'} - {ticket.exitTime || 'N/A'}
          </Text>
        </View>

        {/* Ticket Details - Address */}
        <View style={styles.ticketAddressContainer}>
          <View style={styles.addressLabelContainer}>
            <Text style={styles.detailLabel}>Entry Address</Text>
          </View>
          <View style={styles.addressValueContainer}>
            <Text style={styles.detailValue}>{ticket.entryAddress || 'N/A'}</Text>
          </View>
        </View>

        {/* Dotted Line */}
        <View style={styles.dottedLineContainer}>
          {Array.from({ length: 28 }).map((_, i) => (
            <View key={i} style={styles.dottedDot} />
          ))}
        </View>
      </View>

      {/* EXIT Button */}
      <TouchableOpacity
        style={styles.exitButton}
        onPress={() => ticket.onExit && ticket.onExit()}
      >
        <Text style={styles.exitButtonText}>EXIT</Text>
      </TouchableOpacity>

      {/* Download PDF Button */}
      <TouchableOpacity
        style={styles.downloadButton}
        onPress={handleGeneratePDF}
        disabled={isGeneratingPdf}
      >
        {isGeneratingPdf ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text style={styles.downloadButtonText}>Download PDF</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const ParkingTicketContainer = ({ route, navigation }) => {
  const booking = route.params?.ticketData;
  const userEmail = booking?.userEmail;
  const [vehicleNo, setVehicleNo] = useState('N/A');
  const [loadingUser, setLoadingUser] = useState(true);

  if (!booking) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No booking data found.</Text>
      </View>
    );
  }

  useEffect(() => {
    const fetchUserVehicleNo = async () => {
      try {
        if (userEmail) {
          const userDocRef = doc(db, 'users', userEmail);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setVehicleNo(userData.vehicleNo || 'N/A');
          }
        }
      } catch (error) {
        console.error('Error fetching user doc:', error);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserVehicleNo();
  }, [userEmail]);

  if (loadingUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={styles.loadingText}>Loading user data...</Text>
      </View>
    );
  }

  const mappedTicketData = {
    // Use the booking document ID as the unique Parking Pass
    parkingPass: booking.id || 'N/A',
    parkingSlot: booking.carParkNo || 'N/A',
    vehicleNumber: vehicleNo,
    entryTime: (booking.hoursFrom || '--') + ' hrs',
    exitTime: (booking.hoursTo || '--') + ' hrs',
    entryAddress: booking.address || 'N/A',
    onExit: () => {
      console.log('Exiting ticket view');
      navigation.goBack();
    },
  };

  return (
    <View style={styles.container}>
      <ParkingTicket ticketData={mappedTicketData} />
    </View>
  );
};

export default ParkingTicketContainer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#e6f4ea',
    paddingTop: 40,
    paddingBottom: 24,
    width: '100%',
  },
  ticketContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingTop: 40,
    paddingBottom: 24,
    width: '100%',
  },
  ticketCard: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingHorizontal: 24,
    paddingVertical: 50,
    marginBottom: 16,
    position: 'relative',
  },
  ticketNotch: {
    position: 'absolute',
    top: 0,
    left: '50%',
    width: 80,
    height: 40,
    backgroundColor: '#d1fae5',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    transform: [{ translateX: -40 }],
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  appIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#14b8a6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  appIconText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  appNameText: {
    fontSize: 16,
    color: '#065f46',
    fontWeight: '600',
  },
  ticketTitleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ticketTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  ticketDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailBlock: {
    flex: 1,
  },
  detailBlockRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  detailValueSmall: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  ticketTimeContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  detailLabelCenter: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  detailValueCenter: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
    textAlign: 'center',
  },
  ticketAddressContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  addressLabelContainer: {
    width: '35%',
  },
  addressValueContainer: {
    width: '65%',
  },
  dottedLineContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  dottedDot: {
    width: 10,
    height: 8,
    borderRadius: 6,
    backgroundColor: '#d1fae5',
    marginHorizontal: 2,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: 96,
    height: 96,
  },
  exitButton: {
    backgroundColor: '#1e40af',
    width: '85%',
    maxWidth: 400,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
  },
  exitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  downloadButton: {
    backgroundColor: '#0284c7',
    width: '85%',
    maxWidth: 400,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 12,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1e40af',
  },
});