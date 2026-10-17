import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface UpiQrCodeProps {
  upiId?: string;
  payeeName?: string;
  amount: number;
  invoiceNo?: string;
  note?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function UpiQrCode({
  upiId = 'shreevinayaka@icici',
  payeeName = 'SHREE VINAYAKA FURNITURES',
  amount,
  invoiceNo,
  note,
  size = 140,
  className,
  style
}: UpiQrCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  const roundedAmount = Math.max(0, Number(amount.toFixed(2)));
  const tr = invoiceNo ? `&tr=${encodeURIComponent(invoiceNo)}` : '';
  const tn = note
    ? `&tn=${encodeURIComponent(note)}`
    : invoiceNo
    ? `&tn=${encodeURIComponent(`Invoice ${invoiceNo}`)}`
    : '&tn=Furniture%20Purchase';

  const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${roundedAmount}&cu=INR${tr}${tn}`;

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(upiString, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: size * 2, // 2x for retina/sharp printing
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then(url => {
        if (active) setDataUrl(url);
      })
      .catch(err => {
        console.error('[UpiQrCode] Generation failed:', err);
      });

    return () => {
      active = false;
    };
  }, [upiString, size]);

  if (!dataUrl) {
    return (
      <div
        className={className}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background: '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          color: '#64748b',
          borderRadius: '4px',
          ...style
        }}
      >
        Generating QR...
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt="UPI Payment QR"
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'block',
        ...style
      }}
    />
  );
}
