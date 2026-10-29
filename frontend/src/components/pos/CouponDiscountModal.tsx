import React, { useState, useEffect } from 'react';
import type { CouponRule } from '../../types/retailDaddy';
import { validateCoupon, api } from '../../api/client';

interface CouponDiscountModalProps {
  isOpen: boolean;
  coupons?: CouponRule[];
  cartSubtotal: number;
  onApplyCoupon: (coupon: CouponRule, discountAmount: number) => void;
  onClose: () => void;
}

export const CouponDiscountModal: React.FC<CouponDiscountModalProps> = ({
  isOpen,
  coupons = [],
  cartSubtotal,
  onApplyCoupon,
  onClose
}) => {
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [liveCoupons, setLiveCoupons] = useState<CouponRule[]>(coupons);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsLoading(true);
    api.getCoupons()
      .then((data: any[]) => {
        if (!isMounted || !Array.isArray(data) || data.length === 0) return;
        const mapped: CouponRule[] = data.map((d: any) => ({
          id: String(d.id),
          code: d.code,
          title: d.title || d.code,
          discountType: d.discount_type || 'Percentage',
          discountValue: Number(d.discount_value || 0),
          minBillAmount: Number(d.min_order_amount || 0),
          maxDiscountAmount: d.max_discount_amount ? Number(d.max_discount_amount) : undefined,
          startDate: d.valid_from ? new Date(d.valid_from).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
          endDate: d.valid_until ? new Date(d.valid_until).toLocaleDateString('en-GB') : '31/12/2030',
          isActive: d.is_active !== undefined ? d.is_active : true,
          usedCount: Number(d.times_used || d.used_count || 0)
        }));
        setLiveCoupons(mapped);
      })
      .catch((err) => console.warn('Could not fetch live coupons from FastAPI:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const calculateDiscount = (coupon: CouponRule): number => {
    let disc = 0;
    if (coupon.discountType === 'FlatAmount') {
      disc = coupon.discountValue;
    } else {
      disc = (cartSubtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && disc > coupon.maxDiscountAmount) {
        disc = coupon.maxDiscountAmount;
      }
    }
    return Math.min(disc, cartSubtotal);
  };

  const handleApply = async (coupon: CouponRule) => {
    if (cartSubtotal < coupon.minBillAmount) {
      setErrorMsg(`⚠️ Minimum order amount of ₹${coupon.minBillAmount.toLocaleString()} required to apply "${coupon.code}"`);
      return;
    }
    setIsValidating(true);
    setErrorMsg(null);
    try {
      const res = await validateCoupon({
        code: coupon.code,
        order_amount: cartSubtotal
      });
      if (res.is_valid) {
        onApplyCoupon(coupon, res.discount_amount);
        onClose();
      } else {
        setErrorMsg(`❌ ${res.message || 'Coupon is not applicable to current order'}`);
      }
    } catch (e: any) {
      setErrorMsg(`❌ ${e?.message || 'Failed to validate coupon'}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleCustomCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleaned = inputCode.trim().toUpperCase();
    if (!cleaned || isValidating) return;

    setIsValidating(true);
    try {
      const res = await validateCoupon({
        code: cleaned,
        order_amount: cartSubtotal
      });
      if (res.is_valid) {
        const matched = liveCoupons.find(c => c.code.toUpperCase() === cleaned) || {
          id: `cpn-${cleaned}`,
          code: cleaned,
          title: `PROMO ${cleaned}`,
          discountType: (res.discount_type as any) || 'FlatAmount',
          discountValue: res.discount_value || res.discount_amount,
          minBillAmount: 0,
          startDate: new Date().toLocaleDateString('en-GB'),
          endDate: '31/12/2030',
          isActive: true,
          usedCount: 0
        };
        onApplyCoupon(matched, res.discount_amount);
        onClose();
      } else {
        setErrorMsg(`❌ ${res.message || `Invalid or expired coupon code: "${cleaned}"`}`);
      }
    } catch (err: any) {
      setErrorMsg(`❌ ${err?.message || `Coupon "${cleaned}" is invalid or expired`}`);
    } finally {
      setIsValidating(false);
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
        width: '520px',
        maxWidth: '95vw',
        borderRadius: '10px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
        border: '1.5px solid #2563eb'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
          color: '#ffffff',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🎟️</span>
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Apply Promotional Coupon / Discount</span>
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

        {/* Body */}
        <div style={{ padding: '16px' }}>
          {/* Subtotal Banner */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>Active Cart Subtotal:</span>
            <span style={{ fontSize: '16px', color: '#0f172a', fontWeight: 800 }}>₹{cartSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          {/* Code Input Form */}
          <form onSubmit={handleCustomCodeSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <input
              type="text"
              placeholder="ENTER COUPON CODE..."
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              style={{
                flex: 1,
                padding: '9px 12px',
                border: '1.5px solid #94a3b8',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}
            />
            <button
              type="submit"
              disabled={isValidating}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '0 18px',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: isValidating ? 'not-allowed' : 'pointer',
                opacity: isValidating ? 0.6 : 1,
                fontSize: '13px'
              }}
            >
              {isValidating ? 'Validating...' : 'Apply Code'}
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

          {/* Available Coupons List */}
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px', textTransform: 'uppercase' }}>
            Available Store Schemes & Offers: {isLoading && <span style={{ color: '#2563eb' }}>(Loading...)</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
            {liveCoupons.map((coupon) => {
              const eligible = cartSubtotal >= coupon.minBillAmount;
              const disc = calculateDiscount(coupon);
              return (
                <div
                  key={coupon.id}
                  style={{
                    border: eligible ? '1.5px dashed #22c55e' : '1.5px dashed #cbd5e1',
                    background: eligible ? '#f0fdf4' : '#f8fafc',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: eligible ? 1 : 0.65
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{
                        background: '#047857',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        letterSpacing: '0.5px'
                      }}>
                        {coupon.code}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{coupon.title}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Min Order: ₹{coupon.minBillAmount.toLocaleString()} • Valid till: {coupon.endDate}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#15803d', marginBottom: '4px' }}>
                      Save ₹{disc.toFixed(2)}
                    </div>
                    <button
                      type="button"
                      disabled={!eligible}
                      onClick={() => handleApply(coupon)}
                      style={{
                        background: eligible ? '#16a34a' : '#94a3b8',
                        color: '#ffffff',
                        border: 'none',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: eligible ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {eligible ? 'Redeem' : 'Locked'}
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
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
