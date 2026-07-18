import { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

/** Renders a live camera feed and calls onScan(text) the moment a QR code is decoded. */
export default function QrScanner({ onScan, onError }) {
  const containerId = 'qr-scanner-region';
  const scannerRef = useRef(null);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;
    hasScannedRef.current = false;

    const safeStop = async () => {
      try {
        if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
          await scanner.stop();
        }
        await scanner.clear();
      } catch {
        // Scanner was already stopped/cleared — nothing to do.
      }
    };

    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (!cameras?.length) throw new Error('No camera found on this device');
        const cameraId = cameras[0].id;
        return scanner.start(
          cameraId,
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (decodedText) => {
            if (hasScannedRef.current) return;
            hasScannedRef.current = true;
            await safeStop();
            onScan(decodedText);
          },
          () => {}, // per-frame scan failures are normal — ignore
        );
      })
      .catch((err) => onError?.(err.message || 'Could not access camera'));

    return () => {
      safeStop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div id={containerId} className="rounded-xl overflow-hidden bg-cream-200" />;
}
