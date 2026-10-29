import React, { useState } from 'react';
import type { EWayBillRecord } from '../../types/retailDaddy';
import { api, notifyApiSuccess, notifyApiError } from '../../api/client';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    const genNo = `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    const payload = {
      eway_bill_no: genNo,
      eway_bill_date: new Date().toISOString().split('T')[0],
      invoice_no: currentInvoiceNo || 'SINV-CURRENT',
      customer_name: customerName || 'B2B Client',
      customer_gstin: customerGstin || '32AABCS8899Z1Z5',
      from_place: fromPlace,
      to_place: toPlace,
      distance_km: Number(distanceKm) || 10,
      transporter_id: transporterId,
      transporter_name: transporterName,
      transport_mode: transportMode,
      vehicle_no: vehicleNo,
      vehicle_type: 'Regular',
      valid_until: new Date(Date.now() + 48 * 3600 * 1000).toISOString()
    };

    try {
      const res = await api.createEWayBill(payload);
      const newBill: EWayBillRecord = {
        id: String(res.id || `ewb-${Date.now()}`),
        ewayBillNo: res.eway_bill_no || genNo,
        ewayBillDate: res.eway_bill_date || new Date().toLocaleDateString('en-GB'),
        invoiceNo: res.invoice_no || currentInvoiceNo || 'SINV-CURRENT',
        invoiceDate: new Date().toLocaleDateString('en-GB'),
        customerId: 'cust-selected',
        customerName: res.customer_name || customerName || 'B2B Client',
        customerGstin: res.customer_gstin || customerGstin || '32AABCS8899Z1Z5',
        fromPlace: res.from_place || fromPlace,
        toPlace: res.to_place || toPlace,
        pinToPinDistanceKm: Number(res.distance_km || distanceKm || 10),
        transporterId: res.transporter_id || transporterId,
        transporterName: res.transporter_name || transporterName,
        transportMode: (res.transport_mode as any) || transportMode,
        vehicleNo: res.vehicle_no || vehicleNo,
        vehicleType: 'Regular',
        status: (res.status as any) || 'Generated',
        validUntil: res.valid_until ? new Date(res.valid_until).toLocaleString('en-GB') : new Date(Date.now() + 48 * 3600 * 1000).toLocaleString('en-GB')
      };
      notifyApiSuccess(`✓ E-Way Bill ${newBill.ewayBillNo} registered in PostgreSQL!`);
      onGenerateEWayBill(newBill);
      onClose();
    } catch (err: any) {
      notifyApiError('Failed to generate E-Way Bill', err);
      setErrorMsg(err?.message || 'Failed to generate E-Way bill');
    } finally {
      setIsSubmitting(false);
    }
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
            <span style={{ fontWeight: 700, fontSize: '15px' }}>GST E-Way Bill Generation & Dispatch Portal</span>
            {ewayBills && ewayBills.length > 0 && (
              <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                {ewayBills.length} recorded
              </span>
            )}
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

          {errorMsg && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '12px'
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

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
