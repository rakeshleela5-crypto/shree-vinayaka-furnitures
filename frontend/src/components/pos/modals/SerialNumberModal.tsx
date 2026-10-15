import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  onSaveSerial: (serialNo: string) => void;
}

export const SerialNumberModal: React.FC<Props> = ({
  isOpen,
  onClose,
  productName,
  onSaveSerial
}) => {
  const [serialNo, setSerialNo] = useState(`SVF-${Date.now().toString().slice(-6)}`);

  if (!isOpen) return null;

  return (
    <div className="rd-modal-backdrop">
      <div className="rd-form-window" style={{ width: '420px' }}>
        <div className="rd-form-titlebar" style={{ background: '#0284c7', color: '#fff' }}>
          <span>Enter Serial Number / IMEI (Feature 53 & 54)</span>
          <button className="rd-win-btn close" onClick={onClose} style={{ color: '#fff' }}>✕</button>
        </div>

        <div style={{ padding: '16px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '11px', color: '#334155' }}>
            Product: <strong>{productName}</strong>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>Unique Serial Number / Wood Hallmark / IMEI: *</label>
            <input 
              type="text" 
              value={serialNo} 
              onChange={e => setSerialNo(e.target.value)}
              className="rd-input-yellow"
              style={{ width: '100%', padding: '6px', fontSize: '13px', fontWeight: 800, marginTop: '4px' }}
              autoFocus
            />
          </div>

          <div style={{ fontSize: '10px', color: '#64748b' }}>
            ℹ️ This serial number will be uniquely recorded in the warranty register and printed directly on the customer's tax invoice receipt.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <button className="rd-classic-btn" onClick={onClose}>Cancel</button>
            <button 
              className="rd-classic-btn" 
              style={{ background: '#16a34a', color: '#fff', borderColor: '#15803d' }}
              onClick={() => {
                if (serialNo.trim()) {
                  onSaveSerial(serialNo.trim());
                  onClose();
                }
              }}
            >
              Attach Serial Number
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
