import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  currentDiscount: number;
  onApplyBillDiscount: (amount: number) => void;
}

export const BillDiscountModal: React.FC<Props> = ({
  isOpen,
  onClose,
  subtotal,
  currentDiscount,
  onApplyBillDiscount
}) => {
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [discountVal, setDiscountVal] = useState(currentDiscount > 0 ? currentDiscount.toString() : '5');

  if (!isOpen) return null;

  const numericVal = parseFloat(discountVal) || 0;
  const computedAmt = discountType === 'PERCENT' ? (subtotal * numericVal) / 100 : numericVal;

  const handleApply = () => {
    onApplyBillDiscount(computedAmt);
    onClose();
  };

  return (
    <div className="rd-modal-backdrop">
      <div className="rd-form-window" style={{ width: '420px' }}>
        <div className="rd-form-titlebar" style={{ background: '#0284c7', color: '#fff' }}>
          <span>Total Bill Discount (Ctrl+C - Feature 27)</span>
          <button className="rd-win-btn close" onClick={onClose} style={{ color: '#fff' }}>✕</button>
        </div>

        <div style={{ padding: '16px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: '#ecfdf5', padding: '8px 12px', borderRadius: '4px', border: '1px solid #a7f3d0', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Bill Subtotal:</span>
            <strong style={{ color: '#047857', fontSize: '13px' }}>₹ {subtotal.toFixed(2)}</strong>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700 }}>
              <input 
                type="radio" 
                name="bdt" 
                checked={discountType === 'PERCENT'} 
                onChange={() => setDiscountType('PERCENT')} 
              /> Percentage Discount (%)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700 }}>
              <input 
                type="radio" 
                name="bdt" 
                checked={discountType === 'FLAT'} 
                onChange={() => setDiscountType('FLAT')} 
              /> Flat Amount (₹)
            </label>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700 }}>Enter Discount Value ({discountType === 'PERCENT' ? '%' : '₹'}):</label>
            <input 
              type="number" 
              value={discountVal}
              onChange={e => setDiscountVal(e.target.value)}
              className="rd-input-yellow"
              style={{ width: '100%', padding: '6px', fontSize: '14px', fontWeight: 800, marginTop: '3px' }}
              autoFocus
            />
          </div>

          <div style={{ background: '#f1f5f9', padding: '8px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Calculated Bill Discount:</span>
            <strong style={{ color: '#dc2626', fontSize: '13px' }}>- ₹ {computedAmt.toFixed(2)}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <button 
              type="button"
              className="rd-classic-btn"
              style={{ color: '#dc2626' }}
              onClick={() => {
                onApplyBillDiscount(0);
                onClose();
              }}
            >
              Clear Discount
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="rd-classic-btn" onClick={onClose}>Cancel</button>
              <button 
                type="button"
                className="rd-classic-btn" 
                style={{ background: '#16a34a', color: '#fff', borderColor: '#15803d' }}
                onClick={handleApply}
              >
                Apply to Bill
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
