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
  onOpenCouponModal,
  onOpenAddProductModal,
  onOpenGiftModal
}: PosAdvancedDrawerProps) {
  const [activeTab, setActiveTab] = useState<'BILL_SUMMARY' | 'TAX_INFO' | 'PRODUCT_INFO' | 'CONFIG' | 'BROKER' | 'E_COM'>('PRODUCT_INFO');

  const updateField = (key: keyof PosProductInfoConfig, val: any) => {
    onUpdateConfig({
      ...config,
      [key]: val
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%', zIndex: 120 }}>
      {/* 1. ADVANCED DRAWER BOX (Video 16 Frame 0380 & 0405) */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '42px',
          left: '10px',
          width: '540px',
          maxWidth: '95vw',
          background: '#002b55',
          border: '2px solid #001a33',
          boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
          borderRadius: '4px',
          overflow: 'hidden',
          color: '#ffffff',
          fontSize: '11px'
        }}>
          {/* Top Tabs */}
          <div style={{
            display: 'flex',
            background: '#e2e8f0',
            borderBottom: '1px solid #cbd5e1',
            padding: '2px 4px 0 4px',
            gap: '2px',
            overflowX: 'auto'
          }}>
            {[
              { id: 'BILL_SUMMARY', label: 'Bill SUMMARY' },
              { id: 'TAX_INFO', label: 'TAX INFO' },
              { id: 'PRODUCT_INFO', label: 'PRODUCT INFO' },
              { id: 'CONFIG', label: 'CONFIG' },
              { id: 'BROKER', label: 'BROKER' },
              { id: 'E_COM', label: 'E-Com' }
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
                    padding: '3px 8px',
                    fontSize: '10.5px',
                    fontWeight: isActive ? '900' : 'bold',
                    cursor: 'pointer',
                    borderRadius: '3px 3px 0 0'
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
                style={{ background: '#94a3b8', border: 'none', color: '#fff', fontSize: '9px', padding: '1px 4px', cursor: 'pointer' }}
                onClick={onToggleOpen}
                title="Collapse drawer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Drawer Body (Frame 0380: PRODUCT INFO) */}
          {activeTab === 'PRODUCT_INFO' && (
            <div style={{ padding: '10px 12px', background: '#002b55' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '170px 170px 1fr', gap: '8px' }}>
                {/* Column 1: Pricing Memory */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <input type="checkbox" />
                    <span>Show / Hide</span>
                  </label>

                  <div style={{ marginBottom: '4px', fontSize: '10px', color: '#cbd5e1' }}>
                    Purc. Price / Unit : ₹100.00
                  </div>
                  <div style={{ marginBottom: '4px', fontSize: '10px', color: '#cbd5e1' }}>
                    Total Margin Amt : ₹400.00
                  </div>

                  {/* Red Highlight Box around Product's Last Sold Price (Frame 0380) */}
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginBottom: '4px',
                    border: '1.5px solid #dc2626',
                    padding: '2px 4px',
                    borderRadius: '2px',
                    background: 'rgba(220, 38, 38, 0.1)'
                  }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ fontSize: '10px' }}>Product's Last Sold :</span>
                    <strong style={{ marginLeft: 'auto', color: '#fef08a' }}>{productLastSoldPrice.toFixed(2)}</strong>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <input type="checkbox" defaultChecked />
                    <span style={{ fontSize: '10px' }}>Customer's Last Sold :</span>
                    <strong style={{ marginLeft: 'auto', color: '#fef08a' }}>{customerLastSoldPrice.toFixed(2)}</strong>
                  </label>

                  <div style={{ fontSize: '10px' }}>
                    <span>Last Invoice Amt : </span>
                    <span style={{ background: '#000000', color: '#22c55e', padding: '1px 4px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {lastInvoiceAmt.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Column 2: Middle Checkboxes (Frame 0380) */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                    <input
                      type="checkbox"
                      checked={config.stockLimitAlert}
                      onChange={e => updateField('stockLimitAlert', e.target.checked)}
                    />
                    <span>Stock Limit Alert</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                    <input
                      type="checkbox"
                      checked={config.negativeStockAlert}
                      onChange={e => updateField('negativeStockAlert', e.target.checked)}
                    />
                    <span>-Ve Stock Alert</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                    <input
                      type="checkbox"
                      checked={config.itemSpeedEntry1}
                      onChange={e => updateField('itemSpeedEntry1', e.target.checked)}
                    />
                    <span>Item Speed Entry-1</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                    <input
                      type="checkbox"
                      checked={config.imeiSerialNo}
                      onChange={e => updateField('imeiSerialNo', e.target.checked)}
                    />
                    <span>IMEI / Serial No.</span>
                  </label>
                </div>

                {/* Column 3: Right Checkboxes (Frame 0380) */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                    <input
                      type="checkbox"
                      checked={config.editProductInfo}
                      onChange={e => updateField('editProductInfo', e.target.checked)}
                    />
                    <span>Edit Product Info</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                    <input
                      type="checkbox"
                      checked={config.productParameterEnabled}
                      onChange={e => updateField('productParameterEnabled', e.target.checked)}
                    />
                    <span>Product Parameter</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                    <input
                      type="checkbox"
                      checked={config.itemSpeedEntry2}
                      onChange={e => updateField('itemSpeedEntry2', e.target.checked)}
                    />
                    <span>Item Speed Entry-2</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                    <input
                      type="checkbox"
                      checked={config.productImageShow}
                      onChange={e => updateField('productImageShow', e.target.checked)}
                    />
                    <span>Product Image Show</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                    <input
                      type="checkbox"
                      checked={config.upiQrCodePrint}
                      onChange={e => updateField('upiQrCodePrint', e.target.checked)}
                    />
                    <span>UPI QRCode Print</span>
                  </label>
                </div>
              </div>

              {/* Bottom Narration Field (Frame 0380) */}
              <div style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '10px', color: '#cbd5e1' }}>Narration (if any) :</span>
                <textarea
                  className="rd-pos-input"
                  rows={2}
                  style={{
                    width: '100%',
                    background: '#fef9c3',
                    color: '#0f172a',
                    resize: 'none',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    marginTop: '2px'
                  }}
                  value={config.narration}
                  onChange={e => updateField('narration', e.target.value)}
                  placeholder="Enter remarks or delivery instructions for this invoice..."
                />
              </div>
            </div>
          )}

          {/* Fallback for other tabs */}
          {activeTab !== 'PRODUCT_INFO' && (
            <div style={{ padding: '16px', textAlign: 'center', color: '#cbd5e1', fontSize: '11px' }}>
              <strong>{activeTab}</strong> parameters configured and synchronized with POS session.
            </div>
          )}
        </div>
      )}

      {/* 2. BOTTOM PILL TOOLBAR (Video 16 Frame 0380, 0400, 0405) */}
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
