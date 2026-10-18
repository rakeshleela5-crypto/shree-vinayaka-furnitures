import { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import type { Product } from '../../types/retailDaddy';
import { Barcode128 } from '../common/Barcode128';
import { FurnitureAssemblyScannerModal } from '../inventory/FurnitureAssemblyScannerModal';
import { downloadProductBoxLabelsPdf } from '../../api/client';

interface BarcodeDesignerViewProps {
  products: Product[];
  selectedProduct?: Product;
  onOpenMobilePortal?: (sku: string) => void;
}

export function BarcodeDesignerView({
  products,
  selectedProduct,
  onOpenMobilePortal
}: BarcodeDesignerViewProps) {
  const [currentProduct, setCurrentProduct] = useState<Product>(
    selectedProduct || products[0]
  );
  const [copies, setCopies] = useState<number>(4);
  const [stickerFormat, setStickerFormat] = useState<
    'QR_SHOWROOM_75x50' | 'COMPACT_50x25' | 'TENT_CARD_100x75' | 'A4_SHEET_8UP' | 'GODREJ_MULTIBOX_CARTON'
  >('QR_SHOWROOM_75x50');
  const [batchMode, setBatchMode] = useState<'SINGLE' | 'CATEGORY' | 'ALL_STORE'>('SINGLE');
  const [selectedCategory, setSelectedCategory] = useState<string>(currentProduct.category || 'STEEL ALMIRAHS & STORWELS');
  const [qrCodeDataUrls, setQrCodeDataUrls] = useState<Record<string, string>>({});
  const [showAssemblyScanner, setShowAssemblyScanner] = useState<boolean>(false);
  const [productSearch, setProductSearch] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Distinct Categories
  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category)));
  }, [products]);

  // Determine which products to print
  const printableProducts = useMemo(() => {
    if (batchMode === 'ALL_STORE') {
      return products;
    }
    if (batchMode === 'CATEGORY') {
      return products.filter(p => p.category === selectedCategory);
    }
    return [currentProduct];
  }, [batchMode, currentProduct, selectedCategory, products]);

  // Base production portal URL for QR codes
  const basePortalUrl = 'https://srivinayakafurnitures.pages.dev';

  // Generate QR codes for printable products
  useEffect(() => {
    let isMounted = true;
    const generateQrs = async () => {
      const urls: Record<string, string> = {};
      for (const prod of printableProducts) {
        const targetUrl = `${basePortalUrl}/?sku=${encodeURIComponent(prod.pCode)}&scan=1`;
        try {
          const dataUrl = await QRCode.toDataURL(targetUrl, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 160,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });
          urls[prod.id] = dataUrl;
        } catch (err) {
          console.error('Failed to generate QR code for product', prod.pCode, err);
        }
      }
      if (isMounted) {
        setQrCodeDataUrls(urls);
      }
    };

    generateQrs();
    return () => {
      isMounted = false;
    };
  }, [printableProducts]);

  return (
    <div className="rd-window" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 1. WINDOW HEADER */}
      <div className="rd-window-header-green" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="rd-window-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🏷️</span>
          <span>FURNITURE SHOWROOM BARCODE & SMART QR CODE DESIGNER</span>
        </div>
        <div className="rd-window-actions" style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={async () => {
              try {
                showToast(`📄 Generating Multi-Box Carton Labels PDF for ${currentProduct.pCode}...`);
                await downloadProductBoxLabelsPdf(currentProduct.pCode || currentProduct.id);
                showToast(`✓ Multi-Box PDF successfully generated and downloaded!`);
              } catch (err: any) {
                showToast(`Multi-Box PDF notice: ${err.message}. Opening print preview fallback.`);
                window.print();
              }
            }}
            className="rd-btn-header"
            style={{ background: '#0f766e', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', border: 'none' }}
            title="Download Official Multi-Box Carton Stickers PDF"
          >
            📄 MULTI-BOX PDF
          </button>
          <button
            className="rd-btn-header"
            style={{ background: '#059669', color: '#fff' }}
            onClick={() => setShowAssemblyScanner(true)}
          >
            🔨 ASSEMBLY SCANNER
          </button>
          {onOpenMobilePortal && (
            <button
              className="rd-btn-header"
              style={{ background: '#0284c7', color: '#fff' }}
              onClick={() => onOpenMobilePortal(currentProduct.pCode)}
            >
              📱 PREVIEW MOBILE PORTAL
            </button>
          )}
          <button
            className="rd-btn-header export"
            onClick={() => window.print()}
          >
            🖨️ PRINT {printableProducts.length * copies} LABELS
          </button>
        </div>
      </div>

      {toastMsg && (
        <div style={{ background: '#ecfdf5', color: '#065f46', borderBottom: '1px solid #a7f3d0', padding: '6px 16px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>
          {toastMsg}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 2. CONTROLS SIDEBAR */}
        <div style={{
          width: '340px',
          background: '#f8fafc',
          borderRight: '1px solid #cbd5e1',
          padding: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {/* Format Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', marginBottom: '6px', color: '#1e293b' }}>
              STICKER & QR CODE FORMAT :
            </label>
            <select
              className="rd-pos-input"
              style={{ width: '100%', fontWeight: '700' }}
              value={stickerFormat}
              onChange={e => setStickerFormat(e.target.value as any)}
            >
              <option value="QR_SHOWROOM_75x50">⭐ Smart Showroom QR Tag (75 x 50mm) - [Client Favorite]</option>
              <option value="GODREJ_MULTIBOX_CARTON">📦 Godrej Knockdown Multi-Box Flat-Pack Labels (Box 1 of N)</option>
              <option value="TENT_CARD_100x75">📇 Luxury Floor Tent Card / Standee (100 x 75mm)</option>
              <option value="COMPACT_50x25">⚡ Compact Thermal Barcode (50 x 25mm)</option>
              <option value="A4_SHEET_8UP">📄 A4 Multi-Up Showroom Sheet (8 per sheet)</option>
            </select>
            <div style={{ fontSize: '11px', color: '#0369a1', marginTop: '4px' }}>
              {stickerFormat === 'GODREJ_MULTIBOX_CARTON'
                ? 'Prints individual box identification labels for flat-pack knockdown cartons (Headboard, Rails, Storage)!'
                : 'Includes live QR link for walk-in customer mobile scan & pricing portal!'}
            </div>
          </div>

          {/* Batch Mode Selection */}
          <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', marginBottom: '6px', color: '#0f172a' }}>
              PRINT SCOPE :
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'SINGLE', label: 'Single SKU' },
                { id: 'CATEGORY', label: 'By Category' },
                { id: 'ALL_STORE', label: 'All 65 Items' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setBatchMode(opt.id as any)}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    fontSize: '11px',
                    fontWeight: '800',
                    border: '1px solid',
                    borderColor: batchMode === opt.id ? '#15803d' : '#cbd5e1',
                    background: batchMode === opt.id ? '#15803d' : '#ffffff',
                    color: batchMode === opt.id ? '#ffffff' : '#475569',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Product Selection */}
          {batchMode === 'SINGLE' && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', marginBottom: '4px', color: '#0f172a' }}>
                Select Furniture Model :
              </label>
              <div style={{ marginBottom: '6px' }}>
                <input
                  type="text"
                  placeholder="🔍 Search Product (Name, SKU, Barcode)..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '5px 8px',
                    fontSize: '11px',
                    border: '1.5px solid #0284c7',
                    borderRadius: '4px',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontWeight: '600'
                  }}
                />
              </div>
              <select
                className="rd-pos-input"
                style={{ width: '100%', fontSize: '12px', background: '#ffffff', color: '#0f172a', fontWeight: 'bold' }}
                value={currentProduct.id}
                onChange={e => {
                  const p = products.find(x => x.id === e.target.value);
                  if (p) setCurrentProduct(p);
                }}
              >
                {products
                  .filter(p => {
                    if (!productSearch.trim()) return true;
                    const q = productSearch.toLowerCase();
                    return (
                      p.name.toLowerCase().includes(q) ||
                      (p.pCode && p.pCode.toLowerCase().includes(q)) ||
                      (p.barcode && p.barcode.includes(q)) ||
                      (p.category && p.category.toLowerCase().includes(q))
                    );
                  })
                  .map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.pCode}] {p.name.substring(0, 36)} (₹{p.retailPrice})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {batchMode === 'CATEGORY' && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', marginBottom: '4px' }}>
                Select Showroom Category :
              </label>
              <select
                className="rd-pos-input"
                style={{ width: '100%', fontSize: '12px' }}
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
              >
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c} ({products.filter(p => p.category === c).length} products)
                  </option>
                ))}
              </select>
            </div>
          )}

          {batchMode === 'ALL_STORE' && (
            <div style={{ background: '#dcfce7', border: '1px solid #86efac', padding: '10px', borderRadius: '6px', fontSize: '11px', color: '#166534' }}>
              ✓ <strong>Store-Wide Mode:</strong> Printing QR price tags for all 65 Godrej Interio models across all departments.
            </div>
          )}

          {/* Copies Per Product */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', marginBottom: '4px' }}>
              Copies Per Model :
            </label>
            <input
              type="number"
              className="rd-pos-input"
              style={{ width: '100%' }}
              value={copies}
              min="1"
              max="50"
              onChange={e => setCopies(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>

          {/* QR Scan Destination Tip */}
          <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '11px', color: '#1e40af' }}>
            <div style={{ fontWeight: '800', marginBottom: '4px' }}>📱 QR Destination Target:</div>
            <code style={{ background: '#ffffff', padding: '4px', borderRadius: '4px', display: 'block', wordBreak: 'break-all', fontSize: '10px' }}>
              {basePortalUrl}/?sku={currentProduct.pCode}&scan=1
            </code>
            <div style={{ marginTop: '6px', color: '#3b82f6' }}>
              When scanned on mobile, this loads the product discount specs and complete 65-item digital showroom catalog!
            </div>
          </div>

          {/* Printer calibration tip */}
          <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '6px', fontSize: '11px', color: '#92400e', border: '1px solid #fde68a' }}>
            🖨️ <strong>Thermal Sticker Support:</strong> TVS RP-3200, Zebra ZD220, TSC TE244, Citizen CL-S621, or regular laser/inkjet A4 sticker sheets.
          </div>
        </div>

        {/* 3. LIVE STICKER PREVIEW SHEET */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#94a3b8' }}>
          <div style={{
            fontSize: '13px',
            fontWeight: '800',
            marginBottom: '16px',
            color: '#0f172a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>
              Previewing {printableProducts.length * copies} Stickers ({printableProducts.length} models × {copies} copies):
            </span>
            <span style={{ fontSize: '11px', color: '#334155' }}>
              Ready for Print (Press Ctrl+P or click Print Labels)
            </span>
          </div>

          {/* Print Sheet Container */}
          <div
            id="printable-label-sheet"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              justifyContent: 'flex-start'
            }}
          >
            {printableProducts.flatMap(prod =>
              Array.from({ length: copies }).map((_, cIdx) => {
                const qrUrl = qrCodeDataUrls[prod.id];
                const savings = Math.max(0, prod.mrp - prod.retailPrice);
                const discount = prod.mrp > 0 ? Math.round((savings / prod.mrp) * 100) : 0;

                // ==================== TEMPLATE 0: GODREJ MULTI-BOX KNOCKDOWN CARTON LABELS ====================
                if (stickerFormat === 'GODREJ_MULTIBOX_CARTON') {
                  const totalBoxes = prod.totalBoxesCount || 3;
                  const defaultNames = [
                    'Headboard & Footboard Frame',
                    'Side Rails & Central Stiffener',
                    'Storage Box Unit & Hydraulic Lifters',
                    'Hardware & Fitting Accessories'
                  ];
                  const boxes = (prod.boxComponents && prod.boxComponents.length > 0)
                    ? prod.boxComponents
                    : Array.from({ length: totalBoxes }, (_, i) => ({
                        boxNumber: i + 1,
                        totalBoxes: totalBoxes,
                        componentName: defaultNames[i] || `Component Box ${i + 1}`,
                        boxBarcode: `${prod.pCode}-BX${i + 1}`,
                        dimensions: '200x120x15 cm',
                        weightKg: 25
                      }));

                  return (
                    <div key={`${prod.id}-${cIdx}`} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', width: '100%' }}>
                      {boxes.map(box => (
                        <div
                          key={`${prod.id}-b${box.boxNumber}-${cIdx}`}
                          style={{
                            width: '340px',
                            height: '240px',
                            background: '#ffffff',
                            border: '3px solid #0f766e',
                            borderRadius: '8px',
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                            fontFamily: "'Segoe UI', Roboto, sans-serif",
                            boxSizing: 'border-box'
                          }}
                        >
                          {/* Store Header & Multi-Box Badge */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '10px', fontWeight: '900', color: '#0f766e' }}>
                                ★ SHREE VINAYAKA FURNITURES ★
                              </span>
                              <span style={{ fontSize: '8px', background: '#ecfdf5', color: '#0f766e', fontWeight: '800', padding: '1px 5px', borderRadius: '3px', border: '1px solid #a7f3d0' }}>
                                GODREJ FLAT-PACK
                              </span>
                            </div>

                            {/* Eye-Catching Big Box Indicator */}
                            <div style={{
                              background: '#0f766e',
                              color: '#ffffff',
                              fontWeight: '900',
                              fontSize: '13px',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              textAlign: 'center',
                              margin: '6px 0 4px 0',
                              letterSpacing: '0.04em'
                            }}>
                              📦 BOX {box.boxNumber} OF {box.totalBoxes}
                            </div>

                            {/* Component Name */}
                            <div style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a', textAlign: 'center' }}>
                              {box.componentName.toUpperCase()}
                            </div>

                            <div style={{ fontSize: '9px', color: '#475569', textAlign: 'center', marginTop: '2px' }}>
                              Master Model: <strong>{prod.name}</strong> ({prod.pCode})
                            </div>
                          </div>

                          {/* Barcode & QR Code Row */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', padding: '4px 0' }}>
                            <div style={{ textAlign: 'center', flex: 1 }}>
                              <Barcode128
                                value={box.boxBarcode || `${prod.pCode}-BX${box.boxNumber}`}
                                width={1.2}
                                height={24}
                                fontSize={8.5}
                                margin={0}
                                text={box.boxBarcode || `${prod.pCode}-BX${box.boxNumber}`}
                              />
                            </div>

                            {qrUrl && (
                              <div style={{ textAlign: 'center', marginLeft: '6px' }}>
                                <img src={qrUrl} alt="QR" style={{ width: '48px', height: '48px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                <div style={{ fontSize: '6px', fontWeight: 'bold', color: '#0f766e' }}>VERIFY BOX</div>
                              </div>
                            )}
                          </div>

                          {/* Warehouse Warning & Logistics Footer */}
                          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '4px 6px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '7.5px', color: '#78350f' }}>
                              Rack: {prod.godown || 'Central Godown'} - {prod.rack || 'Bay A'}
                            </span>
                            <span style={{ fontSize: '8px', fontWeight: '900', color: '#b45309' }}>
                              ⚠️ FRAGILE • THIS SIDE UP
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }

                // ==================== TEMPLATE 1: SMART SHOWROOM QR TAG (75x50mm) ====================
                if (stickerFormat === 'QR_SHOWROOM_75x50') {
                  return (
                    <div
                      key={`${prod.id}-${cIdx}`}
                      style={{
                        width: '320px',
                        height: '210px',
                        background: '#ffffff',
                        border: '2px solid #0f172a',
                        borderRadius: '6px',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
                        fontFamily: "'Segoe UI', Roboto, sans-serif",
                        boxSizing: 'border-box'
                      }}
                    >
                      {/* Top Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #b91c1c', paddingBottom: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ background: '#b91c1c', color: '#fff', fontWeight: '900', fontSize: '9px', padding: '1px 4px', borderRadius: '2px' }}>
                            GODREJ INTERIO
                          </span>
                          <span style={{ fontSize: '9px', fontWeight: '800', color: '#0f172a' }}>
                            SHREE VINAYAKA FURNITURES
                          </span>
                        </div>
                        <span style={{ fontSize: '8px', color: '#64748b', fontWeight: '700' }}>
                          {prod.godown ? prod.godown.substring(0, 16) : 'SHOWROOM'}
                        </span>
                      </div>

                      {/* Product Title & Model */}
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#0f172a', lineHeight: '1.2', marginTop: '4px' }}>
                          {prod.name.substring(0, 48)}
                        </div>
                        <div style={{ fontSize: '9px', color: '#64748b', display: 'flex', gap: '8px', marginTop: '2px' }}>
                          <span>Model: <strong>{prod.pCode}</strong></span>
                          <span>HSN: <strong>{prod.hsn || '9403'}</strong></span>
                          {prod.size && <span>Size: <strong>{prod.size.substring(0, 16)}</strong></span>}
                        </div>
                      </div>

                      {/* Middle Body: QR Code + Pricing Callout */}
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', margin: '4px 0' }}>
                        {/* QR Box */}
                        <div style={{ textAlign: 'center', flexShrink: 0 }}>
                          {qrUrl ? (
                            <img
                              src={qrUrl}
                              alt="Scan QR"
                              style={{ width: '84px', height: '84px', border: '1px solid #cbd5e1', borderRadius: '4px', display: 'block' }}
                            />
                          ) : (
                            <div style={{ width: '84px', height: '84px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                              Generating QR...
                            </div>
                          )}
                          <div style={{ fontSize: '7px', fontWeight: '800', color: '#b91c1c', marginTop: '2px', letterSpacing: '0.02em' }}>
                            📱 SCAN FOR DISCOUNTS
                          </div>
                        </div>

                        {/* Price Details */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>MRP:</span>
                            <span style={{ fontSize: '12px', color: '#64748b', textDecoration: 'line-through' }}>
                              ₹{prod.mrp.toFixed(2)}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>OFFER PRICE:</span>
                            <span style={{ fontSize: '16px', fontWeight: '900', color: '#15803d' }}>
                              ₹{prod.retailPrice.toFixed(2)}
                            </span>
                          </div>

                          {discount > 0 && (
                            <div style={{
                              background: '#fee2e2',
                              color: '#b91c1c',
                              fontSize: '9px',
                              fontWeight: '900',
                              padding: '2px 4px',
                              borderRadius: '3px',
                              textAlign: 'center'
                            }}>
                              SAVE ₹{savings.toFixed(0)} ({discount}% OFF)
                            </div>
                          )}

                          <div style={{ fontSize: '8px', color: '#64748b' }}>
                            • Incl. 18% GST (CGST 9% + SGST 9%)<br />
                            • EMI from ₹{(prod.retailPrice / 6).toFixed(0)}/mo
                          </div>
                        </div>
                      </div>

                      {/* Bottom Footer: Barcode for POS Cashier */}
                      <div style={{
                        borderTop: '1px solid #cbd5e1',
                        paddingTop: '2px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ fontSize: '8px', color: '#64748b' }}>
                          Scan with Mobile for 65 Showroom Items
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Barcode128
                            value={prod.barcode}
                            width={1.1}
                            height={20}
                            fontSize={8}
                            margin={1}
                            text={prod.barcode}
                          />
                        </div>
                      </div>
                    </div>
                  );
                }

                // ==================== TEMPLATE 2: TENT CARD / STANDEE (100x75mm) ====================
                if (stickerFormat === 'TENT_CARD_100x75') {
                  return (
                    <div
                      key={`${prod.id}-${cIdx}`}
                      style={{
                        width: '380px',
                        height: '260px',
                        background: '#ffffff',
                        border: '3px solid #b91c1c',
                        borderRadius: '10px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
                        fontFamily: "'Segoe UI', Roboto, sans-serif",
                        boxSizing: 'border-box'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '900', color: '#b91c1c' }}>
                            GODREJ INTERIO SHOWROOM
                          </div>
                          <div style={{ fontSize: '10px', fontWeight: '700', color: '#0f172a' }}>
                            Shree Vinayaka Furnitures • Authorised Partner
                          </div>
                        </div>
                        <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px' }}>
                          10 YR WARRANTY
                        </span>
                      </div>

                      <div style={{ margin: '4px 0' }}>
                        <div style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', lineHeight: '1.25' }}>
                          {prod.name}
                        </div>
                        <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>
                          Model: <strong>{prod.pCode}</strong> | Finish: <strong>{prod.colour || 'Godrej Original'}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        {qrUrl && (
                          <div style={{ textAlign: 'center' }}>
                            <img
                              src={qrUrl}
                              alt="Scan QR"
                              style={{ width: '90px', height: '90px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            />
                            <div style={{ fontSize: '8px', fontWeight: '800', color: '#b91c1c', marginTop: '2px' }}>
                              SCAN FOR FULL CATALOG
                            </div>
                          </div>
                        )}

                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', color: '#64748b', textDecoration: 'line-through' }}>
                            MRP: ₹{prod.mrp.toFixed(2)}
                          </div>
                          <div style={{ fontSize: '20px', fontWeight: '900', color: '#15803d', margin: '2px 0' }}>
                            ₹{prod.retailPrice.toFixed(2)}
                          </div>
                          {discount > 0 && (
                            <div style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                              FESTIVAL SAVINGS: ₹{savings.toFixed(0)} ({discount}% OFF)
                            </div>
                          )}
                          <div style={{ fontSize: '8.5px', color: '#475569', lineHeight: '1.3' }}>
                            ✓ Free Showroom Fitting & Delivery<br />
                            ✓ 100% Genuine CRCA Steel & Teak Wood
                          </div>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', color: '#64748b' }}>
                        <span>Customer Mobile Portal • Instant Pricing</span>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Barcode128
                            value={prod.barcode}
                            width={1.1}
                            height={20}
                            fontSize={8}
                            margin={0}
                            text={`POS: ${prod.barcode}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                }

                // ==================== TEMPLATE 4: A4 SHEET (8 LABELS PER SHEET) ====================
                if (stickerFormat === 'A4_SHEET_8UP') {
                  return (
                    <div
                      key={`${prod.id}-${cIdx}`}
                      style={{
                        width: '340px',
                        height: '230px',
                        background: '#ffffff',
                        border: '2px solid #0284c7',
                        borderRadius: '6px',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        fontFamily: "'Segoe UI', Roboto, sans-serif",
                        boxSizing: 'border-box'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #0284c7', paddingBottom: '3px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '900', color: '#0369a1' }}>
                          SHREE VINAYAKA FURNITURES
                        </span>
                        <span style={{ fontSize: '8px', background: '#e0f2fe', color: '#0369a1', padding: '1px 4px', borderRadius: '2px', fontWeight: '800' }}>
                          A4 SHEET 8-UP
                        </span>
                      </div>

                      <div style={{ fontSize: '11px', fontWeight: '900', color: '#0f172a', lineHeight: '1.2' }}>
                        {prod.name.substring(0, 40)}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {qrUrl && (
                          <div style={{ textAlign: 'center' }}>
                            <img src={qrUrl} alt="QR" style={{ width: '70px', height: '70px', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                            <div style={{ fontSize: '7px', fontWeight: 'bold', color: '#0284c7' }}>SCAN CATALOG</div>
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '9px', color: '#64748b' }}>
                            MRP: <span style={{ textDecoration: 'line-through' }}>₹{prod.mrp.toFixed(2)}</span>
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '900', color: '#15803d' }}>
                            ₹{prod.retailPrice.toFixed(2)}
                          </div>
                          <div style={{ fontSize: '8px', color: '#475569' }}>
                            Model: <strong>{prod.pCode}</strong> | HSN: {prod.hsn || '9403'}
                          </div>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '2px', display: 'flex', justifyContent: 'center' }}>
                        <Barcode128
                          value={prod.barcode}
                          width={1.1}
                          height={18}
                          fontSize={8}
                          margin={0}
                          text={prod.barcode}
                        />
                      </div>
                    </div>
                  );
                }

                // ==================== TEMPLATE 3: COMPACT THERMAL BARCODE (50x25mm) ====================
                return (
                  <div
                    key={`${prod.id}-${cIdx}`}
                    style={{
                      width: '210px',
                      height: '115px',
                      background: '#ffffff',
                      border: '1px solid #94a3b8',
                      borderRadius: '4px',
                      padding: '6px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      fontFamily: "'Segoe UI', sans-serif",
                      boxSizing: 'border-box'
                    }}
                  >
                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#000', textAlign: 'center' }}>
                      GODREJ INTERIO - VINAYAKA
                    </div>
                    <div style={{ fontSize: '9.5px', fontWeight: 'bold', color: '#0f172a', textAlign: 'center', lineHeight: '1.2' }}>
                      {prod.name.substring(0, 24)}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {qrUrl && (
                        <img src={qrUrl} alt="QR" style={{ width: '36px', height: '36px' }} />
                      )}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '8px', textDecoration: 'line-through', color: '#64748b' }}>
                          MRP: ₹{prod.mrp.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#15803d' }}>
                          ₹{prod.retailPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Barcode128
                        value={prod.barcode}
                        width={1.0}
                        height={16}
                        fontSize={7.5}
                        margin={0}
                        text={`${prod.barcode} (${prod.pCode})`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showAssemblyScanner && (
        <FurnitureAssemblyScannerModal
          isOpen={showAssemblyScanner}
          onClose={() => setShowAssemblyScanner(false)}
          products={products}
          initialProduct={currentProduct}
        />
      )}
    </div>
  );
}
