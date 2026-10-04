import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ value, size = 180, className = '' }) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => {
        setDataUrl(url);
        setError(false);
      })
      .catch(err => {
        console.error('QR generation error:', err);
        setError(true);
      });
  }, [value, size]);

  if (error || !dataUrl) {
    return (
      <div 
        style={{ width: size, height: size }} 
        className={`flex items-center justify-center bg-slate-800 rounded-xl text-xs text-slate-400 p-2 text-center ${className}`}
      >
        <span>Generating QR...</span>
      </div>
    );
  }

  return (
    <div className={`p-2 bg-white rounded-xl shadow-lg inline-block ${className}`}>
      <img src={dataUrl} alt="Payment QR Code" className="block rounded-lg" width={size} height={size} />
    </div>
  );
};
