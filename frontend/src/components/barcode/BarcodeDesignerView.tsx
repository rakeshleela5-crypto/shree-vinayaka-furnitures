import { useState } from 'react';
import type { Product } from '../../types/retailDaddy';

interface BarcodeDesignerViewProps {
  products: Product[];
  selectedProduct?: Product;
}

export function BarcodeDesignerView({ products, selectedProduct }: BarcodeDesignerViewProps) {
  const [currentProduct, setCurrentProduct] = useState<Product>(
    selectedProduct || products[0]
  );
  const [copies, setCopies] = useState<number>(4);
  const [stickerFormat, setStickerFormat] = useState<'50x25' | '38x25' | 'DoubleColumn'>('50x25');

  return (
    <div className="rd-window">
      <div className="rd-window-header-green">
        <div className="rd-window-title">BARCODE LABEL DESIGNER & BATCH PRINTER</div>
        <div className="rd-window-actions">
          <button
            className="rd-btn-header export"
            onClick={() => window.print()}
          >
            🖨️ PRINT LABELS
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Controls Sidebar */}
        <div style={{ width: '320px', background: '#f8fafc', borderRight: '1px solid #cbd5e1', padding: '16px', overflowY: 'auto' }}>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
            Select Product :
          </label>
          <select
            className="rd-pos-input"
            style={{ width: '100%', marginBottom: '14px' }}
            value={currentProduct.id}
            onChange={e => {
              const p = products.find(x => x.id === e.target.value);
              if (p) setCurrentProduct(p);
            }}
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} [{p.barcode}]
              </option>
            ))}
          </select>

          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
            Number of Label Copies :
          </label>
          <input
            type="number"
            className="rd-pos-input"
            style={{ width: '100%', marginBottom: '14px' }}
            value={copies}
            min="1"
            max="100"
            onChange={e => setCopies(Math.max(1, Number(e.target.value) || 1))}
          />

          <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
            Sticker Format :
          </label>
          <select
            className="rd-pos-input"
            style={{ width: '100%', marginBottom: '14px' }}
            value={stickerFormat}
            onChange={e => setStickerFormat(e.target.value as any)}
          >
            <option value="50x25">Standard 50mm x 25mm (Thermal)</option>
            <option value="38x25">Compact 38mm x 25mm</option>
            <option value="DoubleColumn">Double Column Sheet (A4)</option>
          </select>

          <div style={{ background: '#e0f2fe', padding: '10px', borderRadius: '4px', fontSize: '11px', color: '#0369a1' }}>
            💡 <strong>Printer Tip:</strong> Retail Daddy supports TVS, Zebra, TSC, and Citizen thermal barcode printers with 1-click calibration.
          </div>
        </div>

        {/* Live Sticker Preview Canvas */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#cbd5e1' }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 'bold',
            marginBottom: '12px',
            color: '#1e293b'
          }}>
            Sticker Preview Sheet ({copies} copies):
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            {Array.from({ length: copies }).map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: stickerFormat === '38x25' ? '180px' : '220px',
                  height: '110px',
                  background: '#ffffff',
                  border: '1px solid #94a3b8',
                  borderRadius: '4px',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  fontFamily: 'Segoe UI, sans-serif'
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: '900', color: '#000' }}>
                  SHREE VINAYAKA FURNITURES
                </div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b', textAlign: 'center', lineHeight: '1.2' }}>
                  {currentProduct.name.substring(0, 22)}
                </div>

                {/* Barcode Graphic */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-flex',
                    height: '28px',
                    alignItems: 'flex-end',
                    gap: '2px',
                    background: '#000',
                    padding: '2px 4px'
                  }}>
                    {Array.from({ length: 24 }).map((__, bIdx) => (
                      <div
                        key={bIdx}
                        style={{
                          width: bIdx % 3 === 0 ? '3px' : '1px',
                          height: '24px',
                          background: '#fff'
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.1em' }}>
                    *{currentProduct.barcode}*
                  </div>
                </div>

                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '900' }}>
                  <span>MRP: ₹{currentProduct.mrp.toFixed(2)}</span>
                  <span style={{ color: '#15803d' }}>Our Price: ₹{currentProduct.retailPrice.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
