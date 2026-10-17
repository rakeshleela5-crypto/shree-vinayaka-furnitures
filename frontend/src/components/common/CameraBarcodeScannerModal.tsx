import { useState, useEffect, useRef } from 'react';

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedCode: string) => void;
  title?: string;
}

export function CameraBarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  title = '📷 Barcode & QR Code Scanner'
}: CameraBarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [manualCode, setManualCode] = useState<string>('');
  const scanIntervalRef = useRef<number | null>(null);

  // Play crisp confirmation beep on successful scan
  const playScanBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime); // High pitch A6 beep
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio not permitted or supported
    }
  };

  const handleSuccessfulCode = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;
    playScanBeep();
    onScan(cleanCode);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setCameraActive(false);
      setErrorMessage('');
      setManualCode('');
      return;
    }

    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access not supported on this device/browser.');
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Prefer back camera on mobile/tablet
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);
        }

        // Modern BarcodeDetector API detection
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: [
              'code_128',
              'code_39',
              'ean_13',
              'ean_8',
              'upc_a',
              'upc_e',
              'qr_code',
              'data_matrix'
            ]
          });

          scanIntervalRef.current = window.setInterval(async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) return;
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                const detected = barcodes[0].rawValue;
                if (detected) {
                  if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
                  handleSuccessfulCode(detected);
                }
              }
            } catch {
              // Frame dropped or decoding error
            }
          }, 250);
        }
      } catch (err: any) {
        console.warn('[CameraScanner] Camera error:', err);
        setErrorMessage(
          err.message || 'Unable to access camera. Please allow camera permissions or enter barcode manually.'
        );
      }
    };

    startCamera();

    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '460px',
          maxWidth: '100%',
          background: '#ffffff',
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: '#0f766e',
            color: '#ffffff',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          <span>{title}</span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '18px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Video Viewport / Viewfinder */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '260px',
            background: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />

          {/* Aiming Reticle / Laser Line */}
          {cameraActive && (
            <div
              style={{
                position: 'absolute',
                inset: '24px',
                border: '2px dashed rgba(52, 211, 153, 0.8)',
                borderRadius: '8px',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div
                style={{
                  width: '90%',
                  height: '2px',
                  background: '#ef4444',
                  boxShadow: '0 0 8px #ef4444'
                }}
              />
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                position: 'absolute',
                padding: '16px',
                textAlign: 'center',
                color: '#fca5a5',
                fontSize: '12px'
              }}
            >
              ⚠️ {errorMessage}
            </div>
          )}
        </div>

        {/* Footer with Manual Input Fallback */}
        <div style={{ padding: '16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', textAlign: 'center' }}>
            Point camera at 1D Barcode (Godrej tag) or 2D QR Code. Or type code directly:
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              handleSuccessfulCode(manualCode);
            }}
            style={{ display: 'flex', gap: '8px' }}
          >
            <input
              type="text"
              autoFocus
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder="Enter barcode or SKU (e.g. 8901101)..."
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 'bold',
                fontFamily: 'monospace'
              }}
            />
            <button
              type="submit"
              disabled={!manualCode.trim()}
              style={{
                background: '#0f766e',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: manualCode.trim() ? 'pointer' : 'not-allowed',
                opacity: manualCode.trim() ? 1 : 0.6
              }}
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
