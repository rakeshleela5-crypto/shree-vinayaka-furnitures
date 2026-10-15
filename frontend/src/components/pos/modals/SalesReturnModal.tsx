import React, { useState } from 'react';
import type { CartItem } from '../../../types/pos';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProcessReturn: (returnedItem: CartItem, reason: string) => void;
}

export const SalesReturnModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onProcessReturn
}) => {
  const [origBillNo, setOrigBillNo] = useState('GST-0005-2026/27');
  const [returnItemName, setReturnItemName] = useState('Teak Wood 6-Seater Royal Dining Table Set');
  const [returnQty, setReturnQty] = useState('1');
  const [refundRate, setRefundRate] = useState('42000');
  const [returnReason, setReturnReason] = useState('Customer changed dining room size requirement');

  if (!isOpen) return null;

  const handleReturn = () => {
    const qty = parseFloat(returnQty) || 1;
    const rate = parseFloat(refundRate) || 0;
    const item: CartItem = {
      id: `return-${Date.now()}`,
      productId: 'return-prod',
      code: 'RET-01',
      barcode: 'RETURN-1',
      name: `[RETURN] ${returnItemName} (Bill #${origBillNo})`,
      hsn: '9403',
      qty: -qty, // Negative quantity for credit note!
      unit: 'SET',
      mrp: rate,
      rate: rate,
      discountType: 'FLAT',
      discountValue: 0,
      discountAmt: 0,
      taxableAmt: -(qty * rate),
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,
      cgstAmt: -((qty * rate * 0.09)),
      sgstAmt: -((qty * rate * 0.09)),
      igstAmt: 0,
      total: -(qty * rate * 1.18)
    };

    onProcessReturn(item, returnReason);
    onClose();
  };

  return (
    <div className="rd-modal-backdrop">
      <div className="rd-form-window" style={{ width: '520px' }}>
        <div className="rd-form-titlebar" style={{ background: '#dc2626', color: '#fff' }}>
          <span>Sales Return / Credit Note Entry (Cr. Note)</span>
          <button className="rd-win-btn close" onClick={onClose} style={{ color: '#fff' }}>✕</button>
        </div>

        <div style={{ padding: '16px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Original Invoice Number:</label>
            <input 
              type="text" 
              value={origBillNo} 
              onChange={e => setOrigBillNo(e.target.value)}
              className="rd-input-yellow"
              style={{ width: '100%', marginTop: '3px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Item Being Returned:</label>
            <input 
              type="text" 
              value={returnItemName} 
              onChange={e => setReturnItemName(e.target.value)}
              style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', fontSize: '11px', marginTop: '3px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Return Quantity:</label>
              <input 
                type="number" 
                value={returnQty} 
                onChange={e => setReturnQty(e.target.value)}
                style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', fontSize: '11px', marginTop: '3px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Refund Rate (₹):</label>
              <input 
                type="number" 
                value={refundRate} 
                onChange={e => setRefundRate(e.target.value)}
                className="rd-input-yellow"
                style={{ width: '100%', marginTop: '3px', textAlign: 'right' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Reason for Return:</label>
            <textarea 
              rows={2}
              value={returnReason}
              onChange={e => setReturnReason(e.target.value)}
              style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', fontSize: '11px', marginTop: '3px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <button className="rd-classic-btn" onClick={onClose}>Cancel</button>
            <button 
              className="rd-classic-btn" 
              style={{ background: '#dc2626', color: '#fff', borderColor: '#b91c1c', padding: '6px 16px' }}
              onClick={handleReturn}
            >
              Add Credit Note Return to Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
