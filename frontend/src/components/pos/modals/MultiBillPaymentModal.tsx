import React, { useState, useEffect } from 'react';
import { X, Save, Settings } from 'lucide-react';
import type { PaymentSplit } from '../../../types/pos';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  netPay: number;
  onSavePayments: (payments: PaymentSplit[]) => void;
}

interface PaymentRow {
  mode: string;
  amount: number;
  enabled: boolean;
  creditDays?: number;
}

export const MultiBillPaymentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  netPay,
  onSavePayments
}) => {
  const [rows, setRows] = useState<PaymentRow[]>([
    { mode: 'By Cash', amount: netPay, enabled: true },
    { mode: 'By Cheque', amount: 0, enabled: false },
    { mode: 'By Credit Card', amount: 0, enabled: true },
    { mode: 'By Debit Card', amount: 0, enabled: false },
    { mode: 'PhonePe', amount: 0, enabled: true },
    { mode: 'Google Pay', amount: 0, enabled: true },
    { mode: 'Paytm', amount: 0, enabled: true },
    { mode: 'E-Wallet', amount: 0, enabled: false },
    { mode: 'Credit Terms - 7 days', amount: 0, enabled: false, creditDays: 7 },
    { mode: 'Credit Terms - 15 days', amount: 0, enabled: true, creditDays: 15 },
    { mode: 'Credit Terms - 30 days', amount: 0, enabled: true, creditDays: 30 },
    { mode: 'Credit Terms - 60 days', amount: 0, enabled: false, creditDays: 60 },
    { mode: 'Credit Terms - 90 days', amount: 0, enabled: false, creditDays: 90 },
    { mode: 'Credit Terms - 120 days', amount: 0, enabled: false, creditDays: 120 }
  ]);

  useEffect(() => {
    // Reset cash to netPay whenever netPay changes
    setRows(prev =>
      prev.map(r => (r.mode === 'By Cash' ? { ...r, amount: netPay } : { ...r, amount: 0 }))
    );
  }, [netPay, isOpen]);

  if (!isOpen) return null;

  const totalPaid = Number(rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0).toFixed(2));
  const pendingAmount = Number((netPay - totalPaid).toFixed(2));

  const handleAmountChange = (index: number, val: string) => {
    const numeric = parseFloat(val) || 0;
    setRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], amount: numeric };
      return copy;
    });
  };

  const handleToggleEnabled = (index: number, checked: boolean) => {
    setRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], enabled: checked };
      return copy;
    });
  };

  const handleFillBalance = (index: number) => {
    // Fill remaining balance into this mode
    const currentSumWithoutThis = rows.reduce(
      (sum, r, i) => (i === index ? sum : sum + (Number(r.amount) || 0)),
      0
    );
    const rem = Math.max(0, Number((netPay - currentSumWithoutThis).toFixed(2)));
    setRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], amount: rem };
      return copy;
    });
  };

  const handleSave = () => {
    const activeSplits: PaymentSplit[] = rows
      .filter(r => r.amount > 0)
      .map(r => ({
        mode: r.mode,
        amount: r.amount,
        enabled: r.enabled,
        creditDays: r.creditDays
      }));

    if (activeSplits.length === 0) {
      alert('Please enter at least one payment amount');
      return;
    }

    onSavePayments(activeSplits);
    onClose();
  };

  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal-window" style={{ maxWidth: '620px', width: '92%' }}>
        <div
          className="pos-modal-header"
          style={{ background: '#f8fafc', color: '#0f172a', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>frmMultiBillPayment</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '3px 8px', background: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '3px', cursor: 'pointer' }}
            >
              <Settings size={12} /> Settings
            </button>
            <button className="pos-modal-close-btn" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        <div style={{ padding: '16px', background: '#f1f5f9' }}>
          {/* Header Net Pay Display */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              marginBottom: '12px'
            }}
          >
            <div>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Total Bill Net Pay:</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803d' }}>
                ₹ {netPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Pending Amount:</span>
              <div
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: pendingAmount === 0 ? '#15803d' : pendingAmount > 0 ? '#b91c1c' : '#d97706'
                }}
              >
                ₹ {pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Table Grid matching Screen 500 */}
          <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', maxHeight: '340px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#bef264', color: '#000', textAlign: 'left', borderBottom: '1px solid #94a3b8' }}>
                  <th style={{ padding: '6px 12px', fontWeight: 700 }}>Payment Mode</th>
                  <th style={{ padding: '6px 12px', fontWeight: 700, width: '150px' }}>Amount (₹)</th>
                  <th style={{ padding: '6px 12px', fontWeight: 700, width: '80px', textAlign: 'center' }}>Enabled</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row.mode}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: row.amount > 0 ? '#eff6ff' : idx % 2 === 0 ? '#fff' : '#f8fafc'
                    }}
                  >
                    <td style={{ padding: '6px 12px', fontWeight: row.amount > 0 ? 700 : 500 }}>
                      <span
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => handleFillBalance(idx)}
                        title="Click to fill balance"
                      >
                        {row.mode}
                      </span>
                    </td>
                    <td style={{ padding: '4px 12px' }}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.amount === 0 ? '' : row.amount}
                        placeholder="0.00"
                        onChange={e => handleAmountChange(idx, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px 8px',
                          border: row.amount > 0 ? '1px solid #2563eb' : '1px solid #cbd5e1',
                          borderRadius: '3px',
                          textAlign: 'right',
                          fontWeight: 600
                        }}
                      />
                    </td>
                    <td style={{ padding: '4px 12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        onChange={e => handleToggleEnabled(idx, e.target.checked)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paid Amount Footer */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: '16px'
            }}
          >
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#166534', marginBottom: '8px' }}>
              Paid Amount : ₹ {totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>

            <button
              type="button"
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 48px',
                background: '#e2e8f0',
                border: '1px solid #94a3b8',
                borderRadius: '6px',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#1e293b',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <Save size={20} color="#0284c7" /> Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
