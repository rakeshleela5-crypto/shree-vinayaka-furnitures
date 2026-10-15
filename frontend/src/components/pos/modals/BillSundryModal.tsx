import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentSundry: { name: string; amount: number };
  onApplySundry: (sundry: { name: string; amount: number }) => void;
}

export const BillSundryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentSundry,
  onApplySundry
}) => {
  const [sundryType, setSundryType] = useState(currentSundry.name || 'Loading & Labour Charges');
  const [amount, setAmount] = useState((currentSundry.amount || 0).toString());

  if (!isOpen) return null;

  const presetCharges = [
    { label: 'Loading & Labour Charges', defaultAmt: 450 },
    { label: 'Doorstep Shipping & Freight', defaultAmt: 1200 },
    { label: 'Mandir On-Site Carpentry & Fitting', defaultAmt: 850 },
    { label: 'Bubble Wrap & Wooden Crate Packaging', defaultAmt: 600 },
    { label: 'Transit Insurance Cover', defaultAmt: 350 }
  ];

  const handleSave = () => {
    const amt = parseFloat(amount) || 0;
    onApplySundry({
      name: sundryType,
      amount: amt
    });
    onClose();
  };

  return (
    <div className="rd-modal-backdrop">
      <div className="rd-form-window" style={{ width: '480px' }}>
        <div className="rd-form-titlebar" style={{ background: '#0284c7', color: '#fff' }}>
          <span>Bill Sundry (Loading & Shipping Charges - Feature 16)</span>
          <button className="rd-win-btn close" onClick={onClose} style={{ color: '#fff' }}>✕</button>
        </div>

        <div style={{ padding: '16px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Select Sundry Charge Head:</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
              {presetCharges.map((preset, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    setSundryType(preset.label);
                    setAmount(preset.defaultAmt.toString());
                  }}
                  style={{
                    padding: '6px 10px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    background: sundryType === preset.label ? '#eff6ff' : '#fff',
                    borderColor: sundryType === preset.label ? '#3b82f6' : '#cbd5e1',
                    fontSize: '11px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{preset.label}</span>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>₹ {preset.defaultAmt}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Custom Charge Title:</label>
            <input 
              type="text" 
              value={sundryType}
              onChange={e => setSundryType(e.target.value)}
              style={{ width: '100%', padding: '5px', fontSize: '12px', border: '1px solid #94a3b8', marginTop: '3px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Charge Amount (₹):</label>
            <input 
              type="number" 
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="rd-input-yellow"
              style={{ width: '100%', padding: '6px', fontSize: '14px', fontWeight: 800, marginTop: '3px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <button 
              className="rd-classic-btn" 
              style={{ color: '#dc2626' }}
              onClick={() => {
                onApplySundry({ name: '', amount: 0 });
                onClose();
              }}
            >
              Clear Sundry
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="rd-classic-btn" onClick={onClose}>Cancel</button>
              <button 
                className="rd-classic-btn" 
                style={{ background: '#16a34a', color: '#fff', borderColor: '#15803d' }}
                onClick={handleSave}
              >
                Apply Charge to Bill
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
