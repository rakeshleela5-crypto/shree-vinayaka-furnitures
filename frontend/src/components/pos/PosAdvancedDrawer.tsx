import { useState } from 'react';
import type { PosProductInfoConfig } from '../../types/retailDaddy';

interface PosAdvancedDrawerProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  config: PosProductInfoConfig;
  onUpdateConfig: (config: PosProductInfoConfig) => void;
  productLastSoldPrice?: number;
  customerLastSoldPrice?: number;
  lastInvoiceAmt?: number;
  purchasePrice?: number;
  totalMargin?: number;
  summaryMetrics?: {
    totalItems: number;
    totalQty: number;
    totalDiscount: number;
    totalTax: number;
    totalMrp: number;
    netPay: number;
    grossProfit?: number;
  };
  onOpenCouponModal?: () => void;
  onOpenAddProductModal?: () => void;
  onOpenGiftModal?: () => void;
}

export function PosAdvancedDrawer({
  isOpen,
  onToggleOpen,
  config,
  onUpdateConfig,
  productLastSoldPrice = 400.0,
  customerLastSoldPrice = 0.0,
  lastInvoiceAmt = 758.0,
  purchasePrice = 100.0,
  totalMargin = 0.0,
  summaryMetrics,
  onOpenCouponModal,
  onOpenAddProductModal,
  onOpenGiftModal
}: PosAdvancedDrawerProps) {
  const [activeTab, setActiveTab] = useState<'BILL_SUMMARY' | 'PRODUCT_INFO'>('PRODUCT_INFO');

  const updateField = (key: keyof PosProductInfoConfig, val: any) => {
    onUpdateConfig({
      ...config,
      [key]: val
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%', zIndex: 120 }}>
      {/* 1. ADVANCED DRAWER BOX */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '42px',
          left: '10px',
          width: '560px',
          maxWidth: '96vw',
          background: '#002b55',
          border: '2px solid #001a33',
          boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
          borderRadius: '6px',
          overflow: 'hidden',
          color: '#ffffff',
          fontSize: '11px'
        }}>
          {/* Top Tabs */}
          <div style={{
            display: 'flex',
            background: '#e2e8f0',
            borderBottom: '1px solid #cbd5e1',
            padding: '2px 6px 0 6px',
            gap: '4px',
            alignItems: 'center'
          }}>
            {[
              { id: 'PRODUCT_INFO', label: '🏷️ PRICING & PRODUCT MEMORY' },
              { id: 'BILL_SUMMARY', label: '📋 BILL SUMMARY & TAX BREAKDOWN' }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  style={{
                    background: isActive ? '#002b55' : '#cbd5e1',
                    color: isActive ? '#ffffff' : '#0f172a',
                    border: '1px solid #94a3b8',
                    borderBottom: isActive ? 'none' : '1px solid #94a3b8',
                    padding: '5px 12px',
                    fontSize: '11px',
                    fontWeight: isActive ? '900' : 'bold',
                    cursor: 'pointer',
                    borderRadius: '4px 4px 0 0'
                  }}
                  onClick={() => setActiveTab(tab.id as any)}
                >
                  {tab.label}
                </button>
              );
            })}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '2px', alignItems: 'center' }}>
              <button
                type="button"
                style={{
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
                onClick={onToggleOpen}
                title="Close drawer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tab 1: PRODUCT INFO & PRICING MEMORY */}
          {activeTab === 'PRODUCT_INFO' && (
            <div style={{ padding: '12px 14px', background: '#002b55' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                {/* Column 1: Pricing Memory */}
                <div style={{ background: '#001e3d', padding: '10px', borderRadius: '4px', border: '1px solid #0f3d6b' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '8px', borderBottom: '1px solid #1e40af', paddingBottom: '3px' }}>
                    📊 Historical Pricing Memory
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', color: '#cbd5e1' }}>
                    <span>Estimated Purchase Cost:</span>
                    <strong style={{ color: '#ffffff' }}>₹{purchasePrice.toFixed(2)}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11px', color: '#cbd5e1' }}>
                    <span>Live Basket Margin:</span>
                    <strong style={{ color: totalMargin >= 0 ? '#4ade80' : '#f87171' }}>
                      ₹{totalMargin.toFixed(2)}
                    </strong>
                  </div>

                  {/* Red Highlight Box around Product's Last Sold Price */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    border: '1.5px solid #dc2626',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    background: 'rgba(220, 38, 38, 0.15)'
                  }}>
                    <span style={{ fontSize: '11px' }}>Product's Last Sold :</span>
                    <strong style={{ color: '#fef08a', fontSize: '12px' }}>₹{productLastSoldPrice.toFixed(2)}</strong>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    border: '1px solid #0284c7',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    background: 'rgba(2, 132, 199, 0.15)'
                  }}>
                    <span style={{ fontSize: '11px' }}>Customer's Last Sold :</span>
                    <strong style={{ color: '#fef08a', fontSize: '12px' }}>₹{customerLastSoldPrice.toFixed(2)}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginTop: '6px' }}>
                    <span style={{ color: '#94a3b8' }}>Last Invoice Amt :</span>
                    <span style={{ background: '#000000', color: '#22c55e', padding: '2px 6px', fontFamily: 'monospace', fontWeight: 'bold', borderRadius: '3px' }}>
                      ₹{lastInvoiceAmt.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Column 2: POS Inventory Flags & Parameters */}
                <div style={{ background: '#001e3d', padding: '10px', borderRadius: '4px', border: '1px solid #0f3d6b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '2px', borderBottom: '1px solid #1e40af', paddingBottom: '3px' }}>
                    ⚙️ Active POS Rules
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={config.stockLimitAlert}
                      onChange={e => updateField('stockLimitAlert', e.target.checked)}
                    />
                    <span style={{ color: '#f1f5f9' }}>Stock Limit Alert</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={config.negativeStockAlert}
                      onChange={e => updateField('negativeStockAlert', e.target.checked)}
                    />
                    <span style={{ color: '#f1f5f9' }}>-Ve Negative Stock Alert</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={config.productParameterEnabled}
                      onChange={e => updateField('productParameterEnabled', e.target.checked)}
                    />
                    <span style={{ color: '#f1f5f9' }}>Multi-Batch & Parameter Support</span>
                  </label>

                  <div style={{ marginTop: 'auto', padding: '6px', background: 'rgba(2, 132, 199, 0.1)', borderRadius: '4px', fontSize: '10px', color: '#93c5fd' }}>
                    💡 Tip: Stock alert flags prevent cashiers from billing depleted furniture items unintentionally.
                  </div>
                </div>
              </div>

              {/* Bottom Narration / Delivery Remarks */}
              <div style={{ marginTop: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#cbd5e1' }}>
                  🚚 Invoice Delivery Instructions & Remarks (Printed on bill) :
                </span>
                <textarea
                  className="rd-pos-input"
                  rows={2}
                  style={{
                    width: '100%',
                    background: '#fef9c3',
                    color: '#0f172a',
                    resize: 'none',
                    fontSize: '11.5px',
                    fontWeight: 'bold',
                    marginTop: '4px',
                    borderRadius: '4px',
                    padding: '6px'
                  }}
                  value={config.narration}
                  onChange={e => updateField('narration', e.target.value)}
                  placeholder="e.g. Deliver to 2nd floor, assemble on site, balance on delivery..."
                />
              </div>
            </div>
          )}

          {/* Tab 2: BILL SUMMARY & TAX BREAKDOWN */}
          {activeTab === 'BILL_SUMMARY' && (
            <div style={{ padding: '12px 14px', background: '#002b55' }}>
              {summaryMetrics ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#001e3d', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>TOTAL ITEMS & QTY</div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#38bdf8', marginTop: '4px' }}>
                      {summaryMetrics.totalItems} Items ({summaryMetrics.totalQty.toFixed(1)} Pcs)
                    </div>
                  </div>

                  <div style={{ background: '#001e3d', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>BILL MRP VALUE</div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#facc15', marginTop: '4px' }}>
                      ₹{summaryMetrics.totalMrp.toFixed(2)}
                    </div>
                  </div>

                  <div style={{ background: '#001e3d', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>TOTAL DISCOUNT</div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#f87171', marginTop: '4px' }}>
                      ₹{summaryMetrics.totalDiscount.toFixed(2)}
                    </div>
                  </div>

                  <div style={{ background: '#001e3d', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>TAX AMOUNT (GST)</div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#a78bfa', marginTop: '4px' }}>
                      ₹{summaryMetrics.totalTax.toFixed(2)}
                    </div>
                  </div>

                  <div style={{ background: '#001e3d', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>NET PAYABLE</div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#4ade80', marginTop: '2px' }}>
                      ₹{summaryMetrics.netPay.toFixed(2)}
                    </div>
                  </div>

                  <div style={{ background: '#001e3d', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>GROSS PROFIT</div>
                    <div style={{ fontSize: '16px', fontWeight: '900', color: '#38bdf8', marginTop: '4px' }}>
                      ₹{(summaryMetrics.grossProfit || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px', color: '#cbd5e1' }}>
                  No active cart items to summarize.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. BOTTOM PILL TOOLBAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '3px 8px',
        background: '#e2e8f0',
        borderTop: '1px solid #cbd5e1'
      }}>
        {/* COUPON Pill */}
        <button
          type="button"
          style={{
            background: 'linear-gradient(180deg, #ca8a04 0%, #a16207 100%)',
            border: '1px solid #eab308',
            borderRadius: '16px',
            padding: '3px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '11px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onClick={onOpenCouponModal}
          title="Redeem Promotional Discount Coupon"
        >
          <span>🎟️</span>
          <span>COUPON</span>
        </button>

        {/* Add Product Pill */}
        <button
          type="button"
          style={{
            background: 'linear-gradient(180deg, #15803d 0%, #166534 100%)',
            border: '1px solid #22c55e',
            borderRadius: '16px',
            padding: '3px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '11px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onClick={onOpenAddProductModal}
          title="Quick Add Product to Master"
        >
          <span>+</span>
          <span>Add Product</span>
        </button>

        {/* GIFT Pill */}
        <button
          type="button"
          style={{
            background: 'linear-gradient(180deg, #b91c1c 0%, #991b1b 100%)',
            border: '1px solid #ef4444',
            borderRadius: '16px',
            padding: '3px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '11px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onClick={onOpenGiftModal}
          title="Apply Gift Voucher or Reward"
        >
          <span>🎁</span>
          <span>GIFT</span>
        </button>

        {/* BILL SUMMARY Pill (Toggles Drawer) */}
        <button
          type="button"
          style={{
            background: isOpen
              ? 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)'
              : 'linear-gradient(180deg, #0f766e 0%, #115e59 100%)',
            border: '1px solid #14b8a6',
            borderRadius: '16px',
            padding: '3px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: '#ffffff',
            fontWeight: 'bold',
            fontSize: '11px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          onClick={onToggleOpen}
          title="Toggle POS Advanced Drawer & Pricing Memory"
        >
          <span>📋</span>
          <span>BILL SUMMARY {isOpen ? '▲' : '▼'}</span>
        </button>
      </div>
    </div>
  );
}
