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
import RNHTMLtoPDF from 'react-native-html-to-pdf';

/**
 * ParkingTicket Component: Displays a dynamic parking ticket with reservation details.
 * The QuickPark icon and text are placed inside the white ticket card.
 * A "Download PDF" button is added below the EXIT button.
 */
const ParkingTicket = ({ ticketData }) => {
  const ticket = ticketData || {};

  // Function to generate and download the ticket as a PDF
  const generatePDF = async () => {
    try {
      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body {
                font-family: sans-serif;
                margin: 20px;
              }
              h1 {
                font-size: 24px;
                text-align: center;
                color: #1e3a8a;
                margin-bottom: 16px;
              }
              .ticket-card {
                max-width: 400px;
                margin: 0 auto;
                background-color: #fff;
                border-radius: 10px;
                border: 1px solid #ccc;
                padding: 20px;
              }
              .title-row {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 20px;
              }
              .icon {
                width: 48px;
                height: 48px;
                background-color: #14b8a6; /* teal-600 */
                color: #fff;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                font-weight: bold;
                font-size: 20px;
                margin-right: 8px;
              }
              .appName {
                font-size: 16px;
                font-weight: 600;
                color: #065f46; /* darker teal */
              }
              .ticketTitle {
                text-align: center;
                margin-bottom: 16px;
              }
              .ticketTitle h2 {
                font-size: 26px;
                font-weight: bold;
                color: #1e40af; /* blue-900 */
                margin: 6px 0;
              }
              .section {
                margin-bottom: 12px;
              }
              .label {
                font-size: 16px;
                font-weight: 500;
                color: #374151; /* gray-700 */
                margin-bottom: 4px;
              }
              .value {
                font-size: 24px;
                font-weight: bold;
                color: #1e3a8a; /* deeper blue */
              }
              .valueSmall {
                font-size: 20px;
                font-weight: bold;
                color: #1e3a8a;
              }
              .divider {
                border-bottom: 1px solid #e5e7eb; /* gray-200 */
                margin: 16px 0;
              }
              .flex-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
              }
              .timeSection {
                text-align: center;
                margin-bottom: 16px;
              }
              .addressRow {
                display: flex;
                margin-bottom: 16px;
              }
              .addressLabel {
                width: 35%;
                font-size: 16px;
                font-weight: 500;
                color: #374151;
              }
              .addressValue {
                width: 65%;
                font-size: 24px;
                font-weight: bold;
                color: #1e3a8a;
              }
              .dottedLine {
                text-align: center;
                margin-top: 20px;
              }
              .dots {
                color: #d1fae5;
                font-size: 18px;
              }
            </style>
          </head>
          <body>
            <h1>QuickPark Ticket</h1>

            <div class="ticket-card">
              <!-- Icon & QuickPark Title -->
              <div class="title-row">
                <div class="icon">QP</div>
                <div class="appName">QuickPark</div>
              </div>

              <!-- Ticket Title -->
              <div class="ticketTitle">
                <h2>Here’s your</h2>
                <h2>Parking Ticket!</h2>
              </div>

              <!-- Parking Slot & QR -->
              <div class="flex-row">
                <div>
                  <div class="label">Parking slot</div>
                  <div class="value">{{parkingSlot}}</div>
                </div>
                <div>
                  <!-- QR Code Placeholder -->
                  <img src="https://via.placeholder.com/96" width="96" height="96" />
                </div>
              </div>

              <!-- Vehicle & Parking Pass -->
              <div class="flex-row">
                <div>
                  <div class="label">Vehicle</div>
                  <div class="valueSmall">{{vehicleNumber}}</div>
                </div>
                <div style="text-align: right;">
                  <div class="label" style="text-align: right;">Parking Pass</div>
                  <div class="valueSmall" style="text-align: right;">{{parkingPass}}</div>
                </div>
              </div>

              <!-- Divider -->
              <div class="divider"></div>

              <!-- Entry & Exit Time -->
              <div class="timeSection">
                <div class="label">Entry Time - Exit Time</div>
                <div class="valueSmall">{{entryTime}} - {{exitTime}}</div>
              </div>

              <!-- Address -->
              <div class="addressRow">
                <div class="addressLabel">Entry Address</div>
                <div class="addressValue">{{entryAddress}}</div>
              </div>

              <!-- Dotted Line -->
              <div class="dottedLine">
                <span class="dots">...................................................</span>
              </div>
            </div>
          </body>
        </html>
        `
      const options = {
        html: htmlContent,
        fileName: 'QuickPark_Ticket',
        directory: 'Documents', // This won't matter if base64 is true, but can remain
        base64: true,           // <-- IMPORTANT: Generate PDF in memory as base64
      };

      // Convert HTML to PDF (in memory)
      const file = await RNHTMLtoPDF.convert(options);

      // file.filePath might still be set, but the file won't be saved if base64 is true
      // The actual PDF data is now in file.base64
      if (file.base64) {
        console.log('Base64 PDF length:', file.base64.length);
        Alert.alert(
          'PDF Generated (Base64)',
          `PDF data length: ${file.base64.length}\nPDF file path: ${file.filePath || 'Not available'}`
        );
      } else {
        Alert.alert('Error', 'No Base64 data returned');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF');
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
          <Text style={styles.ticketTitle}>Here’s your</Text>
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
      <TouchableOpacity style={styles.downloadButton} onPress={generatePDF}>
        <Text style={styles.downloadButtonText}>Download PDF</Text>
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
        <Text>Loading user data...</Text>
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
});

