import React from 'react';
import { X, Unlock, Clock, ShoppingCart, Trash2 } from 'lucide-react';
import type { HoldBill } from '../../../types/pos';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  holdBills: HoldBill[];
  onRestoreHoldBill: (bill: HoldBill) => void;
  onDeleteHoldBill: (id: string) => void;
}

export const HoldBillsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  holdBills,
  onRestoreHoldBill,
  onDeleteHoldBill
}) => {
  if (!isOpen) return null;

  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal-window" style={{ maxWidth: '720px', width: '92%' }}>
        <div
          className="pos-modal-header"
          style={{ background: '#7c3aed', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Unlock size={18} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Suspended / Held Bills (Unhold Panel)</h3>
          </div>
          <button className="pos-modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ padding: '16px', background: '#f8fafc' }}>
          {holdBills.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
              <ShoppingCart size={36} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.95rem' }}>No held bills currently in queue.</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Click the "Hold" button on the POS screen to suspend an active cart.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {holdBills.map((b, i) => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: '#fff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#7c3aed', fontSize: '0.95rem' }}>
                        Hold #{b.holdNumber || i + 1}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {b.timestamp}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', marginTop: '2px' }}>
                      Customer: {b.customer.name} ({b.customer.contactNo})
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>
                      {b.items.length} Items ({b.items.map(it => it.name).slice(0, 2).join(', ')}{b.items.length > 2 ? '...' : ''})
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Amount</span>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#15803d' }}>
                        ₹ {b.netPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          onRestoreHoldBill(b);
                          onClose();
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 14px',
                          background: '#7c3aed',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Unlock size={14} /> Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteHoldBill(b.id)}
                        style={{
                          padding: '6px 10px',
                          background: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #fca5a5',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
