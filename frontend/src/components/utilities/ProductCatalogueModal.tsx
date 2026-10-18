import { useState } from 'react';
import type { Product, CompanyInfo } from '../../types/retailDaddy';

interface ProductCatalogueModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  companyInfo: CompanyInfo;
}

export function ProductCatalogueModal({
  isOpen,
  onClose,
  products,
  companyInfo
}: ProductCatalogueModalProps) {
  // Selected product IDs for the catalogue
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(() => {
    // Default to first 6 products that have photos or first 6 products
    const withPhotos = products.filter(p => p.photo);
    if (withPhotos.length >= 4) {
      return withPhotos.slice(0, 6).map(p => p.id);
    }
    return products.slice(0, 6).map(p => p.id);
  });

  const [catalogueTitle, setCatalogueTitle] = useState('PREMIUM FURNITURE SHOWCASE CATALOGUE');
  const [catalogueSubtitle, setCatalogueSubtitle] = useState('Exclusive Direct Factory Pricing • Custom Teak & Engineered Wood');
  const [columns, setColumns] = useState<2 | 3>(3);
  const [showMrp, setShowMrp] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const selectedProducts = products.filter(p => selectedProductIds.includes(p.id));

  const toggleSelectProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(pid => pid !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const selectAll = () => {
    setSelectedProductIds(products.map(p => p.id));
  };

  const deselectAll = () => {
    setSelectedProductIds([]);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (selectedProducts.length === 0) {
      showToast('⚠️ Please select at least 1 product to share');
      return;
    }
    const productSummary = selectedProducts.map((p, idx) => {
      const discount = p.mrp > (p.retailPrice || 0) ? ` (Save ₹${(p.mrp - (p.retailPrice || 0)).toFixed(0)})` : '';
      return `${idx + 1}. *${p.name}*\n   Price: ₹${p.retailPrice || p.mrp}${discount}\n   Code: ${p.pCode || p.barcode}`;
    }).join('\n\n');

    const msg = `🛋️ *${companyInfo.name || 'Sri Vinayaka Furnitures'} - New Catalogue*\n${catalogueSubtitle}\n\n${productSummary}\n\n📍 Visit our showroom: ${companyInfo.address || 'Vaikom, Kerala'}\n📞 Contact/Enquiry: ${companyInfo.contactNo || '+91 94477 12345'}`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="rd-modal-overlay" style={{ zIndex: 99999 }}>
      <div className="rd-dialog" style={{ width: '1150px', maxWidth: '98vw', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header Bar */}
        <div style={{
          background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)',
          color: '#ffffff',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #172554'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🛋️</span>
            <div>
              <div style={{ fontWeight: '900', fontSize: '14px', letterSpacing: '0.5px' }}>
                Showroom Product Catalogue Generator & Brochure Designer
              </div>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>
                Generate printable A4 brochures & WhatsApp showcases for walk-in and online furniture customers
              </div>
            </div>
          </div>
          <button
            type="button"
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div style={{ background: '#dcfce7', borderBottom: '1px solid #86efac', padding: '6px 16px', color: '#166534', fontSize: '12px', fontWeight: 'bold' }}>
            {toastMessage}
          </div>
        )}

        {/* Workspace: Left (Settings & Product Picker) / Right (Live Printable Catalogue Preview) */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr', overflow: 'hidden' }}>
          {/* Left Column: Settings */}
          <div style={{ borderRight: '1px solid #cbd5e1', background: '#f8fafc', padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Title Customizer */}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>Catalogue Banner Title:</label>
              <input
                type="text"
                className="rd-pos-input"
                style={{ width: '100%', marginTop: '4px' }}
                value={catalogueTitle}
                onChange={e => setCatalogueTitle(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>Subtitle / Promotional Offer:</label>
              <input
                type="text"
                className="rd-pos-input"
                style={{ width: '100%', marginTop: '4px' }}
                value={catalogueSubtitle}
                onChange={e => setCatalogueSubtitle(e.target.value)}
              />
            </div>

            {/* Display Options */}
            <div style={{ background: '#ffffff', padding: '10px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0369a1' }}>Layout & Badges</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setColumns(2)}
                  style={{ flex: 1, padding: '4px', background: columns === 2 ? '#0284c7' : '#f1f5f9', color: columns === 2 ? '#fff' : '#0f172a', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  2 Columns
                </button>
                <button
                  type="button"
                  onClick={() => setColumns(3)}
                  style={{ flex: 1, padding: '4px', background: columns === 3 ? '#0284c7' : '#f1f5f9', color: columns === 3 ? '#fff' : '#0f172a', border: '1px solid #cbd5e1', borderRadius: '3px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  3 Columns
                </button>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#334155', cursor: 'pointer' }}>
                <input type="checkbox" checked={showMrp} onChange={e => setShowMrp(e.target.checked)} />
                <span>Show MRP & Discount Badges</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#334155', cursor: 'pointer' }}>
                <input type="checkbox" checked={showDimensions} onChange={e => setShowDimensions(e.target.checked)} />
                <span>Show Dimensions & Specifications</span>
              </label>
            </div>

            {/* Product Picker */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>
                  Select Items ({selectedProductIds.length}/{products.length}):
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button type="button" onClick={selectAll} style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}>All</button>
                  <button type="button" onClick={deselectAll} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Clear</button>
                </div>
              </div>

              <div style={{ flex: 1, maxHeight: '280px', overflowY: 'auto', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', padding: '4px' }}>
                {products.map(prod => {
                  const isChecked = selectedProductIds.includes(prod.id);
                  return (
                    <label
                      key={prod.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 6px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                        background: isChecked ? '#e0f2fe' : 'transparent'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectProduct(prod.id)}
                      />
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {prod.name}
                      </span>
                      <span style={{ color: '#059669', fontWeight: 'bold', fontSize: '10px' }}>
                        ₹{prod.retailPrice || prod.mrp}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Live Printable Catalogue Preview */}
          <div style={{ background: '#525252', padding: '16px', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
            <div
              id="printable-furniture-catalogue"
              style={{
                width: '780px',
                minHeight: '1020px',
                background: '#ffffff',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                padding: '28px 32px',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
              }}
            >
              {/* Catalogue Header */}
              <div style={{ borderBottom: '3px solid #1e3a8a', paddingBottom: '14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e3a8a', letterSpacing: '0.5px' }}>
                    {companyInfo.name || 'SRI VINAYAKA FURNITURES'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    {companyInfo.address || 'Near Private Bus Stand, Vaikom, Kottayam, Kerala 686141'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Phone: <strong>{companyInfo.contactNo || '+91 94477 12345'}</strong> | GSTIN: <strong>{companyInfo.gstin || '32AABCS1429B1Z2'}</strong>
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
                  color: '#ffffff',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  textAlign: 'right'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '900' }}>SHOWROOM COLLECTION</div>
                  <div style={{ fontSize: '10px', opacity: 0.9 }}>Issue Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                </div>
              </div>

              {/* Banner */}
              <div style={{
                background: 'linear-gradient(90deg, #fef3c7 0%, #fde68a 100%)',
                border: '1px solid #f59e0b',
                borderRadius: '6px',
                padding: '10px 16px',
                textAlign: 'center',
                marginBottom: '18px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '900', color: '#92400e', letterSpacing: '0.4px' }}>
                  {catalogueTitle}
                </div>
                <div style={{ fontSize: '11.5px', color: '#b45309', fontWeight: 'bold', marginTop: '2px' }}>
                  {catalogueSubtitle}
                </div>
              </div>

              {/* Catalogue Product Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: '14px',
                flex: 1
              }}>
                {selectedProducts.map(prod => {
                  const hasDiscount = prod.mrp > (prod.retailPrice || 0);
                  const discountPct = hasDiscount ? Math.round(((prod.mrp - (prod.retailPrice || 0)) / prod.mrp) * 100) : 0;
                  return (
                    <div
                      key={prod.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        background: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                      }}
                    >
                      {/* Photo */}
                      <div style={{
                        height: columns === 2 ? '170px' : '130px',
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        {prod.photo ? (
                          <img src={prod.photo} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ fontSize: '32px', opacity: 0.3 }}>🛋️</div>
                        )}
                        {showMrp && discountPct > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            background: '#dc2626',
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: '900',
                            padding: '2px 6px',
                            borderRadius: '3px'
                          }}>
                            {discountPct}% OFF
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ padding: '8px 10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', lineHeight: '1.25', marginBottom: '2px' }}>
                            {prod.name}
                          </div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>
                            Code: <strong>{prod.pCode || prod.barcode}</strong>
                          </div>
                          {showDimensions && (
                            <div style={{ fontSize: '9.5px', color: '#475569', marginTop: '3px' }}>
                              {prod.size ? `Size: ${prod.size}` : 'Standard Dimensions'} | {prod.colour || 'Natural Wood'}
                            </div>
                          )}
                        </div>

                        {/* Pricing */}
                        <div style={{ marginTop: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '6px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                          <div>
                            {showMrp && prod.mrp > (prod.retailPrice || 0) && (
                              <div style={{ fontSize: '10px', color: '#94a3b8', textDecoration: 'line-through' }}>
                                MRP: ₹{prod.mrp.toFixed(0)}
                              </div>
                            )}
                            <div style={{ fontSize: '14px', fontWeight: '900', color: '#16a34a' }}>
                              ₹{(prod.retailPrice || prod.mrp).toFixed(0)}
                            </div>
                          </div>
                          <span style={{ fontSize: '9px', background: '#dcfce7', color: '#166534', fontWeight: 'bold', padding: '1px 5px', borderRadius: '3px' }}>
                            IN STOCK
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Catalogue Footer */}
              <div style={{
                marginTop: '20px',
                borderTop: '2px solid #e2e8f0',
                paddingTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '10.5px',
                color: '#64748b'
              }}>
                <div>
                  🚚 <strong>Free Showroom Delivery</strong> within Kottayam & Ernakulam district on orders above ₹25,000.
                </div>
                <div>
                  💬 WhatsApp Inquiries: <strong>{companyInfo.contactNo || '+91 94477 12345'}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div style={{ padding: '8px 16px', background: '#f1f5f9', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#475569' }}>
            Displaying <strong>{selectedProducts.length}</strong> furniture items in catalogue brochure.
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              style={{
                background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 14px',
                fontWeight: 'bold',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>💬</span>
              <span>Share to WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              style={{
                background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 14px',
                fontWeight: 'bold',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>🖨️</span>
              <span>Print A4 Catalogue / Save PDF</span>
            </button>

            <button
              type="button"
              className="rd-f-btn"
              style={{ height: '32px', minWidth: '70px', background: '#64748b', fontSize: '12px' }}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
