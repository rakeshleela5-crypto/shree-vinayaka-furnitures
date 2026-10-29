import React, { useState, useEffect } from 'react';
import type { GiftVoucherRecord } from '../../types/retailDaddy';
import { api, redeemGiftVoucher, notifyApiSuccess, notifyApiError } from '../../api/client';

interface GiftVoucherModalProps {
  isOpen: boolean;
  vouchers?: GiftVoucherRecord[];
  cartSubtotal: number;
  onRedeemVoucher: (voucher: GiftVoucherRecord, redeemedAmount: number) => void;
  onClose: () => void;
}

export const GiftVoucherModal: React.FC<GiftVoucherModalProps> = ({
  isOpen,
  vouchers = [],
  cartSubtotal,
  onRedeemVoucher,
  onClose
}) => {
  const [voucherCode, setVoucherCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [liveVouchers, setLiveVouchers] = useState<GiftVoucherRecord[]>(vouchers);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsLoading(true);
    api.getGiftVouchers()
      .then((data: any[]) => {
        if (!isMounted || !Array.isArray(data) || data.length === 0) return;
        const mapped: GiftVoucherRecord[] = data.map((d: any) => ({
          id: String(d.id),
          voucherCode: d.voucher_code,
          title: d.title || `Voucher ${d.voucher_code}`,
          denomination: Number(d.amount || d.denomination || 0),
          status: d.status || 'Active',
          issuedToCustomerName: d.customer_name,
          issueDate: d.created_at ? new Date(d.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
          expiryDate: d.valid_until ? new Date(d.valid_until).toLocaleDateString('en-GB') : '31/12/2030'
        }));
        setLiveVouchers(mapped);
      })
      .catch((err) => console.warn('Could not fetch gift vouchers from backend:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRedeem = async (voucher: GiftVoucherRecord) => {
    if (voucher.status !== 'Active') {
      setErrorMsg(`⚠️ This gift voucher is already ${voucher.status}.`);
      return;
    }
    const redeemAmount = Math.min(voucher.denomination, cartSubtotal);
    setIsRedeeming(true);
    setErrorMsg(null);
    try {
      const res = await redeemGiftVoucher(voucher.voucherCode);
      notifyApiSuccess(`✓ Gift voucher ${voucher.voucherCode} redeemed: ₹${redeemAmount}!`);
      onRedeemVoucher({
        ...voucher,
        status: (res.status as any) || 'Redeemed'
      }, redeemAmount);
      onClose();
    } catch (e: any) {
      notifyApiError('Redemption failed', e);
      setErrorMsg(`❌ ${e?.message || 'Failed to redeem voucher'}`);
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleaned = voucherCode.trim().toUpperCase();
    if (!cleaned || isRedeeming) return;

    const matched = liveVouchers.find(v => v.voucherCode.toUpperCase() === cleaned);
    if (!matched) {
      // Try direct backend lookup
      setIsRedeeming(true);
      try {
        const redeemAmount = Math.min(500, cartSubtotal);
        const res = await redeemGiftVoucher(cleaned);
        const vRec: GiftVoucherRecord = {
          id: String(res.id || cleaned),
          voucherCode: cleaned,
          title: `Voucher ${cleaned}`,
          denomination: Number(res.denomination || redeemAmount),
          status: 'Redeemed',
          issueDate: new Date().toLocaleDateString('en-GB'),
          expiryDate: '31/12/2030'
        };
        notifyApiSuccess(`✓ Gift voucher ${cleaned} redeemed: ₹${redeemAmount}!`);
        onRedeemVoucher(vRec, redeemAmount);
        onClose();
      } catch (err: any) {
        setErrorMsg(`❌ Gift voucher "${cleaned}" not found or invalid: ${err?.message || ''}`);
      } finally {
        setIsRedeeming(false);
      }
      return;
    }
    await handleRedeem(matched);
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
                cursor: isRedeeming ? 'not-allowed' : 'pointer',
                opacity: isRedeeming ? 0.6 : 1,
                fontSize: '13px'
              }}
            >
              {isRedeeming ? 'Checking...' : 'Verify Voucher'}
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
            Active Customer Gift Cards in System: {isLoading && <span style={{ color: '#d97706' }}>(Loading...)</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto' }}>
            {liveVouchers.map((v) => {
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
                      disabled={!isActive || isRedeeming}
                      onClick={() => handleRedeem(v)}
                      style={{
                        background: isActive ? '#d97706' : '#94a3b8',
                        color: '#ffffff',
                        border: 'none',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: (isActive && !isRedeeming) ? 'pointer' : 'not-allowed',
                        opacity: isRedeeming ? 0.6 : 1
                      }}
                    >
                      {isRedeeming ? 'Redeeming...' : isActive ? 'Redeem Voucher' : v.status}
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
