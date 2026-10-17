import React, { useState } from 'react';
import type { GiftVoucherRecord } from '../../types/retailDaddy';

interface GiftVoucherModalProps {
  isOpen: boolean;
  vouchers: GiftVoucherRecord[];
  cartSubtotal: number;
  onRedeemVoucher: (voucher: GiftVoucherRecord, redeemedAmount: number) => void;
  onClose: () => void;
}

export const GiftVoucherModal: React.FC<GiftVoucherModalProps> = ({
  isOpen,
  vouchers,
  cartSubtotal,
  onRedeemVoucher,
  onClose
}) => {
  const [voucherCode, setVoucherCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRedeem = (voucher: GiftVoucherRecord) => {
    if (voucher.status !== 'Active') {
      setErrorMsg(`⚠️ This gift voucher is already ${voucher.status}.`);
      return;
    }
    const redeemAmount = Math.min(voucher.denomination, cartSubtotal);
    onRedeemVoucher(voucher, redeemAmount);
    onClose();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleaned = voucherCode.trim().toUpperCase();
    if (!cleaned) return;

    const matched = vouchers.find(v => v.voucherCode.toUpperCase() === cleaned);
    if (!matched) {
      setErrorMsg(`❌ Gift voucher "${cleaned}" not found in system.`);
      return;
    }
    handleRedeem(matched);
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
        width: '500px',
        maxWidth: '95vw',
        borderRadius: '10px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
        border: '1.5px solid #d97706'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
          color: '#ffffff',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🎁</span>
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Gift Voucher & Rewards Redemption</span>
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

        {/* Content */}
        <div style={{ padding: '16px' }}>
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '13px', color: '#92400e', fontWeight: 600 }}>Invoice Net Payable:</span>
            <span style={{ fontSize: '16px', color: '#78350f', fontWeight: 800 }}>₹{cartSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <input
              type="text"
              placeholder="SCAN OR ENTER VOUCHER CODE..."
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              style={{
                flex: 1,
                padding: '9px 12px',
                border: '1.5px solid #94a3b8',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 700,
                textTransform: 'uppercase'
              }}
            />
            <button
              type="submit"
              style={{
                background: '#d97706',
                color: '#ffffff',
                border: 'none',
                padding: '0 16px',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Verify Voucher
            </button>
          </form>

          {errorMsg && (
            <div style={{
              background: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #f87171',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '12px'
            }}>
              {errorMsg}
            </div>
          )}

          <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase' }}>
            Active Customer Gift Cards in System:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto' }}>
            {vouchers.map((v) => {
              const isActive = v.status === 'Active';
              return (
                <div
                  key={v.id}
                  style={{
                    border: isActive ? '1.5px dashed #f59e0b' : '1.5px dashed #cbd5e1',
                    background: isActive ? '#fffbeb' : '#f8fafc',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: isActive ? 1 : 0.6
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{
                        background: '#b45309',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        {v.voucherCode}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{v.title}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Issued to: {v.issuedToCustomerName || 'Walk-in'} • Expiry: {v.expiryDate}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#b45309', marginBottom: '4px' }}>
                      ₹{v.denomination.toLocaleString()}
                    </div>
                    <button
                      type="button"
                      disabled={!isActive}
                      onClick={() => handleRedeem(v)}
                      style={{
                        background: isActive ? '#d97706' : '#94a3b8',
                        color: '#ffffff',
                        border: 'none',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: isActive ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {isActive ? 'Redeem Voucher' : v.status}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          background: '#f1f5f9',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'flex-end',
          borderTop: '1px solid #e2e8f0'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#64748b',
              color: '#ffffff',
              border: 'none',
              padding: '6px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
