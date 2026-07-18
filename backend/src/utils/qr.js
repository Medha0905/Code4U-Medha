const QRCode = require('qrcode');

/**
 * Generates a QR code as a base64 data URL for a given token payload.
 * The QR encodes the qrToken string which is scanned by the vendor
 * and looked up directly in the Order table (unique, unguessable UUID).
 */
async function generateQrDataUrl(qrToken) {
  return QRCode.toDataURL(qrToken, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 320,
    color: { dark: '#3a3a3a', light: '#fdfaf6' },
  });
}

module.exports = { generateQrDataUrl };
