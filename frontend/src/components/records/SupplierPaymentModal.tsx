import React, { useState, useEffect } from 'react';
import type { OutstandingRecord } from '../../types/retailDaddy';

interface SupplierPaymentModalProps {
  isOpen: boolean;
  suppliers: OutstandingRecord[];
  initialSupplierId?: string;
  onSavePayment: (supplierId: string, amount: number, paymentMode: string, transactionNo: string) => void;
  onClose: () => void;
}

export const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  isOpen,
  suppliers,
  initialSupplierId,
  onSavePayment,
  onClose
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    initialSupplierId || (suppliers[0]?.code || 'S-0004')
  );

  const [transactionNo, setTransactionNo] = useState('PYMT-0001-2024/25');
  const [transactionDate, setTransactionDate] = useState('01/03/2025');
  const [paymentMode, setPaymentMode] = useState<'By Cash' | 'Cheque' | 'Bank Transfer' | 'UPI / Card'>('By Cash');
  const [bankAcNo, setBankAcNo] = useState('');
  const [amount, setAmount] = useState<number>(10000);
  const [paymentDetails, setPaymentDetails] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialSupplierId) {
      setSelectedSupplierId(initialSupplierId);
    }
  }, [initialSupplierId]);

  if (!isOpen) return null;

  const currentSupplier = suppliers.find(s => s.code === selectedSupplierId) || suppliers[0];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSupplier) return;
    if (amount <= 0) {
      setToastMsg('⚠️ Please enter a valid payment amount greater than zero');
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }

    onSavePayment(currentSupplier.code, amount, paymentMode, transactionNo);
    setToastMsg(`✓ Payment of ₹${amount.toFixed(2)} recorded for ${currentSupplier.name}!`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
      {/* Main Window Frame (Video 07 Frame 0350) */}
      <div
        style={{
          width: '92%',
          maxWidth: '850px',
          backgroundColor: '#f8fafc',
          border: '2px solid #0284c7',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 45px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar Banner */}
        <div
          style={{
            background: 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)',
            color: '#ffffff',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #0284c7',
            userSelect: 'none'
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
            Payment (To Supplier)
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#e11d48',
              border: '1px solid #ffffff',
              color: '#ffffff',
              width: '26px',
              height: '22px',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSave} style={{ padding: '16px', display: 'flex', gap: '20px' }}>
          {/* Left Form Area */}
          <div style={{ flex: 1 }}>
            {/* Supplier Information Section */}
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px', marginBottom: '14px' }}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#334155', marginBottom: '2px' }}>
                  Select Supplier Name :
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(e.target.value)}
                  style={{
                    width: '100%',
                    height: '28px',
                    border: '1px solid #94a3b8',
                    borderRadius: '2px',
                    padding: '0 6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#0f172a'
                  }}
                >
                  {suppliers.map(s => (
                    <option key={s.code} value={s.code}>
                      {s.name} ({s.code}) - Balance: ₹{s.balance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {currentSupplier && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Address :</span>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                        {currentSupplier.address || 'vaikom, Kerala'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Contact No. :</span>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                        {currentSupplier.contactNo || '8898989898'}
                      </div>
                    </div>
                  </div>

                  {/* A/c Balance Highlight (Frame 0350: bold 24915.52 Cr) */}
                  <div
                    style={{
                      background: '#fee2e2',
                      border: '1px solid #f87171',
                      borderRadius: '3px',
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#991b1b' }}>
                      A/c Balance :
                    </span>
                    <span style={{ fontSize: '16px', fontWeight: '900', color: '#dc2626' }}>
                      {currentSupplier.balance.toFixed(2)} Cr
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Transaction Info Section (Frame 0350) */}
            <fieldset style={{ border: '1px solid #cbd5e1', borderRadius: '4px', padding: '10px 12px', background: '#ffffff' }}>
              <legend style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e40af', padding: '0 4px' }}>
                Transaction Info
              </legend>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
                    Transaction No. :
                  </label>
                  <input
                    type="text"
                    value={transactionNo}
                    onChange={e => setTransactionNo(e.target.value)}
                    style={{ width: '100%', height: '26px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '0 6px', fontSize: '11px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
                    Transaction Date :
                  </label>
                  <input
                    type="text"
                    value={transactionDate}
                    onChange={e => setTransactionDate(e.target.value)}
                    style={{ width: '100%', height: '26px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '0 6px', fontSize: '11px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
                    Payment Mode :
                  </label>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value as any)}
                    style={{ width: '100%', height: '26px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '0 6px', fontSize: '11px' }}
                  >
                    <option value="By Cash">By Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI / Card">UPI / Card</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
                    Bank A/c No :
                  </label>
                  <input
                    type="text"
                    value={bankAcNo}
                    onChange={e => setBankAcNo(e.target.value)}
                    placeholder="SBI / HDFC 9912..."
                    style={{ width: '100%', height: '26px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '0 6px', fontSize: '11px' }}
                  />
                </div>
              </div>

              {/* Amount input with red border (Frame 0350) */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#dc2626', marginBottom: '2px' }}>
                  Amount :
                </label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    height: '32px',
                    border: '2px solid #dc2626',
                    borderRadius: '2px',
                    padding: '0 8px',
                    fontSize: '16px',
                    fontWeight: '900',
                    color: '#0f172a'
                  }}
                />
              </div>

              {/* Payment Details pale yellow textarea (Frame 0350: #fef9c3) */}
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
                  Payment Mode Details : (Transaction ID/ Cheque No.)
                </label>
                <textarea
                  rows={3}
                  value={paymentDetails}
                  onChange={e => setPaymentDetails(e.target.value)}
                  placeholder="e.g. Paid cash at store counter / Cheque No 88219..."
                  style={{
                    width: '100%',
                    border: '1px solid #ca8a04',
                    backgroundColor: '#fef9c3',
                    borderRadius: '2px',
                    padding: '6px',
                    fontSize: '11px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </fieldset>
          </div>

          {/* Right Action Buttons Column (Frame 0350) */}
          <div style={{ width: '120px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="submit"
              style={{
                height: '34px',
                background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
                color: '#ffffff',
                border: '1px solid #15803d',
                borderRadius: '3px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              Save (F10)
            </button>
            <button
              type="button"
              onClick={() => {
                setAmount(0);
                setPaymentDetails('');
              }}
              style={{
                height: '30px',
                background: '#ffffff',
                color: '#334155',
                border: '1px solid #94a3b8',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              New
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                height: '30px',
                background: '#ffffff',
                color: '#1e40af',
                border: '1px solid #93c5fd',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Print
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                height: '30px',
                background: '#dc2626',
                color: '#ffffff',
                border: '1px solid #b91c1c',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </form>
      </div>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10001
          }}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
};
