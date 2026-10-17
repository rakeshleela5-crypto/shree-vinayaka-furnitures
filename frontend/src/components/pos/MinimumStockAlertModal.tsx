import React from 'react';

interface MinimumStockAlertModalProps {
  isOpen: boolean;
  productName: string;
  barcode: string;
  currentStock: number;
  minStock: number;
  requestedQty: number;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Minimum Stock Alert Modal
 * Notifies billing operators when a product falls below its re-order limit.
 */
export const MinimumStockAlertModal: React.FC<MinimumStockAlertModalProps> = ({
  isOpen,
  productName,
  barcode,
  currentStock,
  minStock,
  requestedQty,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
      }}
    >
      <div
        style={{
          width: '430px',
          backgroundColor: '#ffffff',
          border: '1px solid #71717a',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '6px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e4e4e7',
            userSelect: 'none'
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#18181b' }}>
            Are you confirm to proceed ?
          </span>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: '#71717a',
              cursor: 'pointer',
              fontSize: '13px',
              padding: '0 4px',
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>

        {/* Dialog Body */}
        <div
          style={{
            padding: '24px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px'
          }}
        >
          {/* Warning Icon (Yellow Triangle) */}
          <div style={{ flexShrink: 0, marginTop: '2px' }}>
            <svg width="38" height="34" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L1 21H23L12 2Z"
                fill="#FBBF24"
                stroke="#D97706"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <path
                d="M12 9V14"
                stroke="#18181B"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="17.5" r="1.25" fill="#18181B" />
            </svg>
          </div>

          {/* Exact Text from Frame 210 */}
          <div style={{ fontSize: '12px', color: '#18181b', lineHeight: '1.6' }}>
            <div style={{ fontWeight: '500' }}>
              Minimum stock limit crossed....
            </div>
            <div style={{ marginTop: '2px' }}>
              ( Product Name=<strong>'{productName}'</strong> having Barcode=<strong>'{barcode}'</strong> )
            </div>
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
              Current Stock: <strong>{currentStock}</strong> | Minimum Threshold: <strong>{minStock}</strong> | Selling: <strong>{requestedQty}</strong>
            </div>
          </div>
        </div>

        {/* Buttons Bar (1:1 Frame 210) */}
        <div
          style={{
            backgroundColor: '#f4f4f5',
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            borderTop: '1px solid #e4e4e7'
          }}
        >
          <button
            autoFocus
            onClick={onConfirm}
            style={{
              minWidth: '82px',
              padding: '4px 14px',
              backgroundColor: '#e0e7ff',
              border: '1.5px solid #2563eb',
              borderRadius: '2px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#0f172a',
              cursor: 'pointer',
              outline: 'none',
              boxShadow: '0 0 0 1px #2563eb'
            }}
          >
            Yes
          </button>
          <button
            onClick={onCancel}
            style={{
              minWidth: '82px',
              padding: '4px 14px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '2px',
              fontSize: '12px',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};
