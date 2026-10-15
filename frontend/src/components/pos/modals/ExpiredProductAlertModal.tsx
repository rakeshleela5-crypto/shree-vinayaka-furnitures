import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  barcode: string;
  expDate: string;
}

export const ExpiredProductAlertModal: React.FC<Props> = ({
  isOpen,
  onClose,
  productName,
  barcode,
  expDate
}) => {
  if (!isOpen) return null;

  return (
    <div className="rd-modal-backdrop" style={{ zIndex: 1300 }}>
      <div 
        className="rd-form-window" 
        style={{ 
          width: '400px', 
          background: '#ece9d8', 
          border: '2px solid #0055ea',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar matching expiry_08.jpg */}
        <div 
          className="rd-form-titlebar" 
          style={{ 
            background: 'linear-gradient(90deg, #0055ea 0%, #2563eb 100%)', 
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 8px',
            fontSize: '12px',
            fontWeight: 800
          }}
        >
          <span>Alert</span>
          <button 
            className="rd-win-btn close" 
            onClick={onClose} 
            style={{ 
              background: '#e81123', 
              color: '#fff', 
              border: 'none', 
              width: '18px', 
              height: '18px', 
              lineHeight: '16px',
              cursor: 'pointer',
              fontWeight: 800
            }}
          >
            ✕
          </button>
        </div>

        {/* Content matching expiry_08.jpg with red warning icon */}
        <div 
          style={{ 
            padding: '20px 24px', 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '16px',
            background: '#ece9d8'
          }}
        >
          <div 
            style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              background: '#dc2626', 
              color: '#fff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 900,
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(220,38,38,0.4)'
            }}
          >
            ✕
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#991b1b' }}>
              This product has expired! You cannot sell expired stock.
            </div>
            <div style={{ fontSize: '11px', color: '#334155', marginTop: '2px' }}>
              Product: <strong>{productName}</strong>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Barcode: <strong>{barcode}</strong> | Expiry Date: <span style={{ color: '#dc2626', fontWeight: 800 }}>{expDate}</span>
            </div>
          </div>
        </div>

        {/* Action Button: OK */}
        <div 
          style={{ 
            padding: '10px 16px', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            background: '#e0ded3',
            borderTop: '1px solid #c0bfae'
          }}
        >
          <button 
            onClick={onClose}
            autoFocus
            style={{ 
              minWidth: '80px', 
              padding: '4px 18px', 
              fontSize: '12px', 
              fontWeight: 700,
              background: 'linear-gradient(to bottom, #ffffff, #e1e1e1)',
              border: '1px solid #003c74',
              cursor: 'pointer',
              borderRadius: '2px'
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
