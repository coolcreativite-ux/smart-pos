import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { useLanguage } from '../hooks/useLanguage';

interface BarcodeScannerModalProps {
  onClose: () => void;
  onScan: (result: string) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ onClose, onScan }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let controls: ReturnType<typeof codeReader.decodeFromVideoDevice>;

    const startScanning = async () => {
      try {
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (videoInputDevices.length === 0) {
          setError(t('noCameraFound'));
          return;
        }

        if (videoRef.current) {
          controls = await codeReader.decodeFromVideoDevice(
            undefined,
            videoRef.current,
            (result, err) => {
              if (result) {
                onScan(result.getText());
                onClose();
              }
              if (err && err.name !== 'NotFoundException') {
                console.error('Barcode scan error:', err);
                setError(err.message);
              }
            }
          );
        }
      } catch (err) {
        console.error('Camera access error:', err);
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError(String(err));
        }
      }
    };

    startScanning();

    return () => {
      if (controls) {
        controls.stop();
      }
    };
  }, [onClose, onScan, t]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-85 flex flex-col items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-lg aspect-square bg-slate-900 rounded-lg overflow-hidden shadow-2xl">
        <video ref={videoRef} className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3/4 h-1/2 border-4 border-dashed border-white/50 rounded-lg"></div>
        </div>
        {error && (
            <div className="absolute bottom-4 left-4 right-4 bg-red-500/90 text-white p-3 rounded-md text-center">
                {error}
            </div>
        )}
        {!error && (
             <div className="absolute top-4 left-4 right-4 bg-black/50 text-white p-3 rounded-md text-center">
                {t('scanning')}
            </div>
        )}
      </div>
      <button
        onClick={onClose}
        className="mt-6 px-6 py-3 bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
      >
        {t('cancel')}
      </button>
    </div>
  );
};

export default BarcodeScannerModal;