import RNHTMLtoPDF from 'react-native-html-to-pdf';

/**
 * Service to handle PDF generation for QuickPark tickets
 */
export const generatePDF = async (ticketData, fileName = 'QuickPark_Ticket') => {
  try {
    const htmlContent = createTicketHTML(ticketData);

    const options = {
      html: htmlContent,
      fileName,
      directory: 'Documents',
      base64: true,
    };

    const file = await RNHTMLtoPDF.convert(options);
    return file.base64;
  } catch (error) {
    console.error("PDF Generation Error:", error.message);
    throw error;
  }
};

/**
 * Creates HTML content for the ticket based on ticket data
 * @param {Object} ticket - The ticket data object
 * @returns {string} HTML content for the PDF
 */
const createTicketHTML = (ticket) => {
  return `
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
            <h2>Here's your</h2>
            <h2>Parking Ticket!</h2>
          </div>

          <!-- Parking Slot & QR -->
          <div class="flex-row">
            <div>
              <div class="label">Parking slot</div>
              <div class="value">${ticket.parkingSlot || 'N/A'}</div>
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
              <div class="valueSmall">${ticket.vehicleNumber || 'N/A'}</div>
            </div>
            <div style="text-align: right;">
              <div class="label" style="text-align: right;">Parking Pass</div>
              <div class="valueSmall" style="text-align: right;">${ticket.parkingPass || 'N/A'}</div>
            </div>
          </div>

          <!-- Divider -->
          <div class="divider"></div>

          <!-- Entry & Exit Time -->
          <div class="timeSection">
            <div class="label">Entry Time - Exit Time</div>
            <div class="valueSmall">${ticket.entryTime || 'N/A'} - ${ticket.exitTime || 'N/A'}</div>
          </div>

          <!-- Address -->
          <div class="addressRow">
            <div class="addressLabel">Entry Address</div>
            <div class="addressValue">${ticket.entryAddress || 'N/A'}</div>
          </div>

          <!-- Dotted Line -->
          <div class="dottedLine">
            <span class="dots">...................................................</span>
          </div>
        </div>
      </body>
    </html>
  `;
};