import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoiceNo: string;
  totalAmt: number;
}

export const EWayBillModal: React.FC<Props> = ({
  isOpen,
  onClose,
  invoiceNo,
  totalAmt
}) => {
  const [transporterId, setTransporterId] = useState('29AABCU9603R1ZM');
  const [transporterName, setTransporterName] = useState('VRL Logistics Bangalore');
  const [vehicleNo, setVehicleNo] = useState('KA-01-MJ-8890');
  const [distanceKm, setDistanceKm] = useState('45');
  const [ewayNo, setEwayNo] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = () => {
    const randomEway = `3410${Math.floor(10000000 + Math.random() * 90000000)}`;
    setEwayNo(randomEway);
  };

  return (
    <div className="rd-modal-backdrop">
      <div className="rd-form-window" style={{ width: '560px' }}>
        <div className="rd-form-titlebar" style={{ background: '#7c3aed', color: '#fff' }}>
          <span>E-Way Bill Generation & Dispatch Portal (Shortcut 1900)</span>
          <button className="rd-win-btn close" onClick={onClose} style={{ color: '#fff' }}>✕</button>
        </div>

        <div style={{ padding: '16px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: '#ede9fe', padding: '8px 12px', borderRadius: '4px', border: '1px solid #c4b5fd', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Bill No: <strong>{invoiceNo}</strong></span>
            <span>Consignment Value: <strong>₹ {totalAmt.toFixed(2)}</strong></span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Transporter ID (GSTIN):</label>
              <input 
                type="text" 
                value={transporterId} 
                onChange={e => setTransporterId(e.target.value)}
                style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', fontSize: '11px', marginTop: '3px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Transporter Name:</label>
              <input 
                type="text" 
                value={transporterName} 
                onChange={e => setTransporterName(e.target.value)}
                style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', fontSize: '11px', marginTop: '3px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Vehicle Number:</label>
              <input 
                type="text" 
                value={vehicleNo} 
                onChange={e => setVehicleNo(e.target.value)}
                className="rd-input-yellow"
                style={{ width: '100%', marginTop: '3px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Approx Distance (KM):</label>
              <input 
                type="number" 
                value={distanceKm} 
                onChange={e => setDistanceKm(e.target.value)}
                style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', fontSize: '11px', marginTop: '3px' }}
              />
            </div>
          </div>

          {ewayNo && (
            <div style={{ background: '#dcfce7', border: '1px solid #86efac', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#166534', fontWeight: 700 }}>E-WAY BILL GENERATED SUCCESSFULLY!</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#14532d', letterSpacing: '0.05em', marginTop: '4px' }}>
                {ewayNo}
              </div>
              <div style={{ fontSize: '10px', color: '#15803d', marginTop: '2px' }}>Valid For 24 Hours • NIC Portal Synced</div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <button className="rd-classic-btn" onClick={onClose}>Close</button>
            <button 
              className="rd-classic-btn" 
              style={{ background: '#7c3aed', color: '#fff', borderColor: '#6d28d9', padding: '6px 16px' }}
              onClick={handleGenerate}
            >
              Generate E-Way Bill (NIC)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
