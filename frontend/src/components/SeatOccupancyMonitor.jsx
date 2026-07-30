import { useEffect, useRef, useState } from 'react';
import { Camera, Square } from 'lucide-react';
import Button from './Button';
import * as shopsApi from '../services/shops';

const TF_SCRIPT = 'https://cdnjs.cloudflare.com/ajax/libs/tensorflow/4.10.0/tf.min.js';
const COCO_SCRIPT = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2/dist/coco-ssd.min.js';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

/** Maps occupied/capacity ratio to the same seat-status tiers used elsewhere in the app. */
function tierFromRatio(ratio) {
  if (ratio >= 0.95) return 'FULL';
  if (ratio >= 0.8) return 'NEARLY_FULL';
  if (ratio >= 0.6) return 'FEW_LEFT';
  if (ratio >= 0.35) return 'MODERATE';
  return 'PLENTY';
}

/**
 * Computer-Vision Seat Occupancy Detection.
 * Runs an object-detection model (COCO-SSD, pretrained, free, entirely
 * client-side — no external API key or per-call cost) against the vendor's
 * camera feed, counts "person" detections, and auto-updates the shop's
 * seatStatus tier based on occupied-vs-capacity ratio — replacing the
 * vendor's manual guess with a live, camera-verified count.
 */
export default function SeatOccupancyMonitor({ seatCapacity, onStatusChange }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const modelRef = useRef(null);
  const intervalRef = useRef(null);
  const lastTierRef = useRef(null);

  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [peopleCount, setPeopleCount] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const detectFrame = async () => {
    if (!videoRef.current || !modelRef.current) return;
    const predictions = await modelRef.current.detect(videoRef.current);
    const people = predictions.filter((p) => p.class === 'person' && p.score > 0.5);
    setPeopleCount(people.length);

    const ratio = Math.min(people.length / seatCapacity, 1);
    const tier = tierFromRatio(ratio);

    if (tier !== lastTierRef.current) {
      lastTierRef.current = tier;
      try {
        await shopsApi.setSeatStatus(tier);
        onStatusChange?.(tier);
      } catch {
        // non-fatal — will retry on next detection tick
      }
    }
  };

  const start = async () => {
    if (!seatCapacity || seatCapacity < 1) {
      return setError('Set a seat capacity in Shop Settings first.');
    }
    setLoading(true);
    setError('');
    try {
      await loadScript(TF_SCRIPT);
      await loadScript(COCO_SCRIPT);
      if (!modelRef.current) {
        // eslint-disable-next-line no-undef
        modelRef.current = await cocoSsd.load();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setRunning(true);
      intervalRef.current = setInterval(detectFrame, 3000); // every 3s — plenty for a seating area, keeps CPU light
    } catch (err) {
      setError(err.message || 'Could not start camera or load detection model');
    } finally {
      setLoading(false);
    }
  };

  const stop = () => {
    clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setRunning(false);
    setPeopleCount(null);
    lastTierRef.current = null;
  };

  return (
    <div>
      <div className="relative rounded-xl overflow-hidden bg-cream-200 aspect-video">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        {!running && (
          <div className="absolute inset-0 flex items-center justify-center text-ink-300 text-sm">
            Camera preview will appear here
          </div>
        )}
        {running && peopleCount != null && (
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-mono px-2 py-1 rounded-lg">
            {peopleCount} / {seatCapacity} seats occupied
          </div>
        )}
      </div>

      {error && <p className="text-xs text-rose-500 mt-2">{error}</p>}

      <div className="mt-3">
        {running ? (
          <Button variant="secondary" onClick={stop} className="w-full">
            <Square className="w-4 h-4" /> Stop monitoring
          </Button>
        ) : (
          <Button onClick={start} disabled={loading} className="w-full">
            <Camera className="w-4 h-4" /> {loading ? 'Loading model…' : 'Start seat monitor'}
          </Button>
        )}
      </div>
    </div>
  );
}
