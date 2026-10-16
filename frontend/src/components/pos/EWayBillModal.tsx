import React, { useState } from 'react';
import type { EWayBillRecord } from '../../types/retailDaddy';

interface EWayBillModalProps {
  isOpen: boolean;
  currentInvoiceNo: string;
  customerName: string;
  customerGstin?: string;
  grandTotal: number;
  ewayBills: EWayBillRecord[];
  onGenerateEWayBill: (bill: EWayBillRecord) => void;
  onClose: () => void;
}

export const EWayBillModal: React.FC<EWayBillModalProps> = ({
  isOpen,
  currentInvoiceNo,
  customerName,
  customerGstin,
  grandTotal,
  ewayBills,
  onGenerateEWayBill,
  onClose
}) => {
  const [fromPlace, setFromPlace] = useState('Vaikom, Kottayam');
  const [toPlace, setToPlace] = useState('Kozhikode Town');
  const [distanceKm, setDistanceKm] = useState<number>(215);
  const [transporterId, setTransporterId] = useState('32AAACT1001P1Z9');
  const [transporterName, setTransporterName] = useState('Kerala Fast Logistics');
  const [vehicleNo, setVehicleNo] = useState('KL-11-BV-4512');
  const [transportMode, setTransportMode] = useState<'Road' | 'Rail' | 'Air' | 'Ship'>('Road');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBill: EWayBillRecord = {
      id: `ewb-${Date.now()}`,
      ewayBillNo: `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      ewayBillDate: new Date().toLocaleDateString('en-GB'),
      invoiceNo: currentInvoiceNo || 'SINV-CURRENT',
      invoiceDate: new Date().toLocaleDateString('en-GB'),
      customerId: 'cust-selected',
      customerName: customerName || 'B2B Client',
      customerGstin: customerGstin || '32AABCS8899Z1Z5',
      fromPlace,
      toPlace,
      pinToPinDistanceKm: Number(distanceKm) || 10,
      transporterId,
      transporterName,
      transportMode,
      vehicleNo,
      vehicleType: 'Regular',
      status: 'Generated',
      validUntil: new Date(Date.now() + 48 * 3600 * 1000).toLocaleString('en-GB')
    };

    onGenerateEWayBill(newBill);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      backdropFilter: 'blur(3px)'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        width: '680px',
        maxWidth: '95vw',
        borderRadius: '10px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
        border: '1.5px solid #0f766e'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #115e59 0%, #0f766e 100%)',
          color: '#ffffff',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🚚</span>
            <span style={{ fontWeight: 700, fontSize: '15px' }}>GST E-Way Bill Generation & Dispatch Portal [Video 16 & 19]</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '18px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '16px' }}>
          <div style={{
            background: '#f0fdfa',
            border: '1px solid #99f6e4',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: '#115e59', fontWeight: 600 }}>Active Consignment:</div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#134e4a' }}>
                Invoice: {currentInvoiceNo || 'SHIB-0138-DADDY'} • Client: {customerName || 'Cash / B2B'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#115e59', fontWeight: 600 }}>Consignment Value:</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f766e' }}>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                DISPATCH FROM (PLACE & PIN)
              </label>
              <input
                type="text"
                value={fromPlace}
                onChange={(e) => setFromPlace(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                DELIVERY DESTINATION (PLACE & PIN)
              </label>
              <input
                type="text"
                value={toPlace}
                onChange={(e) => setToPlace(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                DISTANCE IN KM
              </label>
              <input
                type="number"
                value={distanceKm}
                onChange={(e) => setDistanceKm(Number(e.target.value))}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', fontWeight: 700 }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                TRANSPORT MODE
              </label>
              <select
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value as any)}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', background: '#fff' }}
              >
                <option value="Road">Road</option>
                <option value="Rail">Rail</option>
                <option value="Air">Air</option>
                <option value="Ship">Ship</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                VEHICLE NO (e.g. KL-11-BV-4512)
              </label>
              <input
                type="text"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', fontWeight: 700 }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                TRANSPORTER ID / TRANSIN
              </label>
              <input
                type="text"
                value={transporterId}
                onChange={(e) => setTransporterId(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                TRANSPORTER NAME
              </label>
              <input
                type="text"
                value={transporterName}
                onChange={(e) => setTransporterName(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px' }}
                required
              />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Complies with GST E-Way Bill Rule 138 (Mandatory for consigments &gt; ₹50,000)
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#64748b',
                  color: '#ffffff',
                  border: 'none',
                  padding: '7px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(180deg, #0d9488 0%, #0f766e 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '7px 20px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                ✓ Generate & Print E-Way Bill
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
