import { useState, useMemo, useEffect } from 'react';
import type { Product, CompanyInfo } from '../../types/retailDaddy';

interface CustomerShowroomPortalViewProps {
  products: Product[];
  companyInfo: CompanyInfo;
  initialSku?: string;
  onExitToPos?: () => void;
}

export function CustomerShowroomPortalView({
  products,
  companyInfo,
  initialSku,
  onExitToPos
}: CustomerShowroomPortalViewProps) {
  // Find initial scanned product if provided
  const defaultProduct = useMemo(() => {
    if (initialSku) {
      const match = products.find(
        p =>
          p.pCode.toLowerCase() === initialSku.toLowerCase() ||
          p.barcode === initialSku ||
          p.id === initialSku
      );
      if (match) return match;
    }
    // Default to the flagship Godrej Slimline 3-Door
    return products.find(p => p.pCode === 'GI-SL3D-PB') || products[0];
  }, [products, initialSku]);

  const [activeProduct, setActiveProduct] = useState<Product>(defaultProduct);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [priceFilter, setPriceFilter] = useState<'ALL' | 'UNDER_20K' | '20K_40K' | 'ABOVE_40K'>('ALL');
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gi_customer_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeTab, setActiveTab] = useState<'SPOTLIGHT' | 'CATALOG' | 'WISHLIST' | 'STORE_INFO'>('SPOTLIGHT');
  const [salespersonRequested, setSalespersonRequested] = useState(false);
  const [selectedEmiTenure, setSelectedEmiTenure] = useState<number>(6);

  useEffect(() => {
    if (defaultProduct) {
      setActiveProduct(defaultProduct);
    }
  }, [defaultProduct]);

  // Save wishlist
  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const next = prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId];
      try {
        localStorage.setItem('gi_customer_wishlist', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Distinct Categories with Counts
  const categoriesWithCounts = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach(p => {
      map[p.category] = (map[p.category] || 0) + 1;
    });
    return [
      { id: 'ALL', name: 'All Collections', count: products.length },
      ...Object.entries(map).map(([name, count]) => ({ id: name, name, count }))
    ];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.pCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        Boolean(p.subCategory && p.subCategory.toLowerCase().includes(searchQuery.toLowerCase())) ||
        Boolean(p.colour && p.colour.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesPrice = true;
      if (priceFilter === 'UNDER_20K') matchesPrice = p.retailPrice < 20000;
      if (priceFilter === '20K_40K') matchesPrice = p.retailPrice >= 20000 && p.retailPrice <= 40000;
      if (priceFilter === 'ABOVE_40K') matchesPrice = p.retailPrice > 40000;

      return matchesCategory && matchesSearch && matchesPrice;
    });
  }, [products, selectedCategory, searchQuery, priceFilter]);

  // Savings calculation for active product
  const savings = Math.max(0, activeProduct.mrp - activeProduct.retailPrice);
  const discountPercent = activeProduct.mrp > 0 ? Math.round((savings / activeProduct.mrp) * 100) : 0;
  const emiAmount = Math.round(activeProduct.retailPrice / selectedEmiTenure);

  // Wishlist products
  const wishlistProducts = useMemo(() => {
    return products.filter(p => wishlist.includes(p.id));
  }, [products, wishlist]);

  const wishlistTotal = wishlistProducts.reduce((sum, p) => sum + p.retailPrice, 0);
  const wishlistTotalSavings = wishlistProducts.reduce((sum, p) => sum + (p.mrp - p.retailPrice), 0);

  // WhatsApp Enquiry Link
  const getWhatsAppLink = (prod: Product) => {
    const text = encodeURIComponent(
      `Hello Shree Vinayaka Furnitures,\nI am visiting your showroom and interested in:\n• Model: ${prod.name} (${prod.pCode})\n• Showroom Price: ₹${prod.retailPrice.toLocaleString('en-IN')}\n• MRP: ₹${prod.mrp.toLocaleString('en-IN')}\nPlease connect me with a floor consultant for availability and delivery.`
    );
    return `https://wa.me/919847012345?text=${text}`;
  };

  const handleRequestStaff = () => {
    setSalespersonRequested(true);
    setTimeout(() => {
      alert(`🔔 Showroom Assistance Request Sent!\nA sales consultant has been notified for ${activeProduct.name} at ${activeProduct.godown || 'Showroom Display Bay'}. They will assist you shortly.`);
    }, 400);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      color: '#0f172a',
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      <div style={{
        background: 'linear-gradient(90deg, #1e3a8a 0%, #1e40af 50%, #0369a1 100%)',
        color: '#ffffff',
        padding: '8px 16px',
        fontSize: '12px',
        fontWeight: '600',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: '#ef4444',
            color: '#fff',
            fontSize: '10px',
            fontWeight: '900',
            padding: '2px 6px',
            borderRadius: '4px',
            letterSpacing: '0.05em'
          }}>
            FESTIVE SHOWROOM SPECIAL
          </span>
          <span>Up to 25% Off + Free Kerala Delivery & Installation</span>
        </div>
        {onExitToPos && (
          <button
            onClick={onExitToPos}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '700',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            💻 Staff POS Login
          </button>
        )}
      </div>

      {/* 2. SHOWROOM HEADER */}
      <header style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Logo & Showroom Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: '900',
              boxShadow: '0 4px 10px rgba(185, 28, 28, 0.3)'
            }}>
              G
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '18px', fontWeight: '900', color: '#b91c1c', letterSpacing: '-0.02em' }}>
                  GODREJ INTERIO
                </span>
                <span style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  border: '1px solid #86efac'
                }}>
                  ✓ Authorised Partner
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>
                Shree Vinayaka Furnitures Showroom
              </div>
            </div>
          </div>

          {/* Quick Contact & Wishlist Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a
              href="tel:+919847012345"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#f1f5f9',
                color: '#0f172a',
                padding: '8px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '12px',
                fontWeight: '700'
              }}
            >
              📞 Call Showroom
            </a>

            <button
              onClick={() => setActiveTab('WISHLIST')}
              style={{
                position: 'relative',
                background: activeTab === 'WISHLIST' ? '#b91c1c' : '#f8fafc',
                color: activeTab === 'WISHLIST' ? '#ffffff' : '#0f172a',
                border: '1px solid #cbd5e1',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>❤️ My Wishlist</span>
              {wishlist.length > 0 && (
                <span style={{
                  background: activeTab === 'WISHLIST' ? '#ffffff' : '#ef4444',
                  color: activeTab === 'WISHLIST' ? '#b91c1c' : '#ffffff',
                  fontSize: '10px',
                  fontWeight: '900',
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}>
                  {wishlist.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 16px',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          borderTop: '1px solid #f1f5f9'
        }}>
          <button
            onClick={() => setActiveTab('SPOTLIGHT')}
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: activeTab === 'SPOTLIGHT' ? '800' : '600',
              color: activeTab === 'SPOTLIGHT' ? '#b91c1c' : '#64748b',
              borderBottom: activeTab === 'SPOTLIGHT' ? '3px solid #b91c1c' : '3px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            📍 Scanned Furniture Spotlight
          </button>
          <button
            onClick={() => setActiveTab('CATALOG')}
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: activeTab === 'CATALOG' ? '800' : '600',
              color: activeTab === 'CATALOG' ? '#b91c1c' : '#64748b',
              borderBottom: activeTab === 'CATALOG' ? '3px solid #b91c1c' : '3px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            🛋️ All 65 Showroom Collections
          </button>
          <button
            onClick={() => setActiveTab('WISHLIST')}
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: activeTab === 'WISHLIST' ? '800' : '600',
              color: activeTab === 'WISHLIST' ? '#b91c1c' : '#64748b',
              borderBottom: activeTab === 'WISHLIST' ? '3px solid #b91c1c' : '3px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            📋 My Saved Items ({wishlist.length})
          </button>
          <button
            onClick={() => setActiveTab('STORE_INFO')}
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: activeTab === 'STORE_INFO' ? '800' : '600',
              color: activeTab === 'STORE_INFO' ? '#b91c1c' : '#64748b',
              borderBottom: activeTab === 'STORE_INFO' ? '3px solid #b91c1c' : '3px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            ℹ️ Showroom Timings & Location
          </button>
        </div>
      </header>

      {/* 3. MAIN CONTENT CONTAINER */}
      <main style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '20px 16px' }}>

        {/* ==================== TAB 1: SCANNED ITEM SPOTLIGHT ==================== */}
        {activeTab === 'SPOTLIGHT' && (
          <div>
            {/* Scanned Badge */}
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>📱</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#065f46' }}>
                    LIVE QR CODE SCAN DETECTED • SHOWROOM FLOOR
                  </div>
                  <div style={{ fontSize: '12px', color: '#047857' }}>
                    You are viewing the physical display piece in <strong>{activeProduct.godown || 'Main Showroom Floor'}</strong>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('CATALOG')}
                style={{
                  background: '#047857',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Browse Other 64 Showroom Items ➔
              </button>
            </div>

            {/* Product Hero Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)'
            }}>
              {/* Left Column: Image Showcase */}
              <div style={{ position: 'relative', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '380px' }}>
                <img
                  src={activeProduct.photo || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80'}
                  alt={activeProduct.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    maxHeight: '440px',
                    objectFit: 'cover'
                  }}
                />
                {/* Floating Tags */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <span style={{
                    background: '#b91c1c',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    {activeProduct.category}
                  </span>
                  <span style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    SKU: {activeProduct.pCode}
                  </span>
                </div>

                {/* Wishlist Heart on Photo */}
                <button
                  onClick={() => toggleWishlist(activeProduct.id)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    border: 'none',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    cursor: 'pointer'
                  }}
                >
                  {wishlist.includes(activeProduct.id) ? '❤️' : '🤍'}
                </button>

                {/* Showroom Availability Tag */}
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  right: '16px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(4px)',
                  color: '#ffffff',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                    In Showroom Display • {activeProduct.openingStock} Units in Stock
                  </span>
                  <span style={{ color: '#94a3b8' }}>Rack: {activeProduct.rack || 'Display Bay'}</span>
                </div>
              </div>

              {/* Right Column: Pricing & Specifications */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Official Godrej Interio Collection
                  </div>
                  <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', margin: '6px 0 12px 0', lineHeight: '1.25' }}>
                    {activeProduct.name}
                  </h1>

                  {/* Rating & HSN */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', fontSize: '12px', color: '#64748b' }}>
                    <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '6px', fontWeight: '800' }}>
                      ★ 4.9 (Godrej Quality Tested)
                    </span>
                    <span>HSN: <strong>{activeProduct.hsn || '9403'}</strong></span>
                    <span>Barcode: <strong>{activeProduct.barcode}</strong></span>
                  </div>

                  {/* PRICE & SAVINGS HERO BOX */}
                  <div style={{
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '32px', fontWeight: '900', color: '#15803d' }}>
                        ₹{activeProduct.retailPrice.toLocaleString('en-IN')}
                      </span>
                      {activeProduct.mrp > activeProduct.retailPrice && (
                        <>
                          <span style={{ fontSize: '18px', color: '#94a3b8', textDecoration: 'line-through' }}>
                            MRP ₹{activeProduct.mrp.toLocaleString('en-IN')}
                          </span>
                          <span style={{
                            background: '#fee2e2',
                            color: '#b91c1c',
                            fontSize: '12px',
                            fontWeight: '800',
                            padding: '3px 8px',
                            borderRadius: '6px'
                          }}>
                            SAVE ₹{savings.toLocaleString('en-IN')} ({discountPercent}% OFF)
                          </span>
                        </>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                      *Inclusive of all 18% GST (CGST 9% + SGST 9%) • Free Showroom Fitting Included
                    </div>

                    {/* Low Cost EMI Simulation */}
                    <div style={{
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: '1px dashed #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                      fontSize: '12px'
                    }}>
                      <div style={{ color: '#1e293b' }}>
                        💳 <strong>No-Cost EMI:</strong> ₹{emiAmount.toLocaleString('en-IN')}/mo
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[3, 6, 9, 12].map(months => (
                          <button
                            key={months}
                            onClick={() => setSelectedEmiTenure(months)}
                            style={{
                              background: selectedEmiTenure === months ? '#0f172a' : '#ffffff',
                              color: selectedEmiTenure === months ? '#ffffff' : '#64748b',
                              border: '1px solid #cbd5e1',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            {months}M
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Key Specifications Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px', fontSize: '12px' }}>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '600' }}>📏 Dimensions</div>
                      <div style={{ fontWeight: '800', color: '#0f172a' }}>{activeProduct.size || 'Standard Specification'}</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '600' }}>🎨 Colour / Finish</div>
                      <div style={{ fontWeight: '800', color: '#0f172a' }}>{activeProduct.colour || 'Premium Godrej Texture'}</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '600' }}>🛡️ Warranty</div>
                      <div style={{ fontWeight: '800', color: '#0f172a' }}>10 Years Official Warranty</div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '600' }}>🚚 Delivery</div>
                      <div style={{ fontWeight: '800', color: '#15803d' }}>Next-Day Delivery Available</div>
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#334155', marginBottom: '24px' }}>
                    {activeProduct.description || 'Precision engineered by Godrej Interio for lifetime strength, ergonomic ergonomics, and scratch-resistant beauty.'}
                  </div>
                </div>

                {/* Action Buttons for Walk-in Customer */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={handleRequestStaff}
                      disabled={salespersonRequested}
                      style={{
                        flex: 1,
                        background: salespersonRequested ? '#15803d' : '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        padding: '14px',
                        borderRadius: '10px',
                        fontWeight: '800',
                        fontSize: '13px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>{salespersonRequested ? '✓ Staff Notified' : '🙋‍♂️ Call Sales Consultant to Display'}</span>
                    </button>

                    <a
                      href={getWhatsAppLink(activeProduct)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        background: '#22c55e',
                        color: '#ffffff',
                        padding: '14px',
                        borderRadius: '10px',
                        fontWeight: '800',
                        fontSize: '13px',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 10px rgba(34, 197, 94, 0.3)'
                      }}
                    >
                      <span>💬 Enquire via WhatsApp</span>
                    </a>
                  </div>

                  <button
                    onClick={() => toggleWishlist(activeProduct.id)}
                    style={{
                      background: wishlist.includes(activeProduct.id) ? '#fef2f2' : '#ffffff',
                      color: wishlist.includes(activeProduct.id) ? '#b91c1c' : '#475569',
                      border: '1px solid #cbd5e1',
                      padding: '12px',
                      borderRadius: '10px',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {wishlist.includes(activeProduct.id) ? '✓ Saved to Wishlist (Show at Cashier Counter)' : '❤️ Save to Wishlist for Billing'}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Suggestions in same category */}
            <div style={{ marginTop: '36px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Compare with Similar {activeProduct.category}
                </h3>
                <button
                  onClick={() => {
                    setSelectedCategory(activeProduct.category);
                    setActiveTab('CATALOG');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#b91c1c',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer'
                  }}
                >
                  View All {activeProduct.category} ➔
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px'
              }}>
                {products
                  .filter(p => p.category === activeProduct.category && p.id !== activeProduct.id)
                  .slice(0, 4)
                  .map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setActiveProduct(item);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '12px',
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ height: '140px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
                        <img
                          src={item.photo || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80'}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#b91c1c' }}>{item.pCode}</div>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', lineHeight: '1.3', marginBottom: '8px' }}>
                          {item.name}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: '15px', fontWeight: '900', color: '#15803d' }}>
                          ₹{item.retailPrice.toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' }}>
                          MRP ₹{item.mrp.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: ENTIRE STORE CATALOG ==================== */}
        {activeTab === 'CATALOG' && (
          <div>
            {/* Header & Search */}
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              marginBottom: '24px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: '0 0 6px 0' }}>
                Complete Godrej Interio Showroom Inventory
              </h2>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                Browse all {products.length} models currently stocked and on display at Shree Vinayaka Furnitures.
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="🔍 Search sofa, king bed, almirah, office chair, safe, model code..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: '2px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: '600',
                    outline: 'none',
                    background: '#f8fafc',
                    boxSizing: 'border-box'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: '#cbd5e1',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '800'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '8px',
                marginBottom: '12px'
              }}>
                {categoriesWithCounts.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      border: '1px solid',
                      borderColor: selectedCategory === cat.id ? '#b91c1c' : '#cbd5e1',
                      background: selectedCategory === cat.id ? '#b91c1c' : '#ffffff',
                      color: selectedCategory === cat.id ? '#ffffff' : '#475569',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{cat.name}</span>
                    <span style={{
                      background: selectedCategory === cat.id ? 'rgba(255,255,255,0.3)' : '#f1f5f9',
                      color: selectedCategory === cat.id ? '#ffffff' : '#64748b',
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '10px'
                    }}>
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Price Filter Chips */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
                <span style={{ fontWeight: '700' }}>Price:</span>
                {[
                  { id: 'ALL', label: 'All Prices' },
                  { id: 'UNDER_20K', label: 'Under ₹20,000' },
                  { id: '20K_40K', label: '₹20,000 - ₹40,000' },
                  { id: 'ABOVE_40K', label: '₹40,000+' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setPriceFilter(f.id as any)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: priceFilter === f.id ? '#0f172a' : '#f1f5f9',
                      color: priceFilter === f.id ? '#ffffff' : '#64748b',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Count */}
            <div style={{ marginBottom: '16px', fontSize: '13px', fontWeight: '700', color: '#475569' }}>
              Showing {filteredProducts.length} furniture products
            </div>

            {/* Product Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '20px'
            }}>
              {filteredProducts.map(prod => {
                const prodSavings = Math.max(0, prod.mrp - prod.retailPrice);
                const prodDiscount = prod.mrp > 0 ? Math.round((prodSavings / prod.mrp) * 100) : 0;
                const isWishlisted = wishlist.includes(prod.id);

                return (
                  <div
                    key={prod.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                  >
                    {/* Image with Tag */}
                    <div style={{ position: 'relative', height: '180px', background: '#f8fafc' }}>
                      <img
                        src={prod.photo || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80'}
                        alt={prod.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: '#0f172a',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: '800',
                        padding: '3px 6px',
                        borderRadius: '4px'
                      }}>
                        {prod.pCode}
                      </span>

                      {prodDiscount > 0 && (
                        <span style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: '#ef4444',
                          color: '#ffffff',
                          fontSize: '10px',
                          fontWeight: '800',
                          padding: '3px 6px',
                          borderRadius: '4px'
                        }}>
                          {prodDiscount}% OFF
                        </span>
                      )}

                      <button
                        onClick={e => {
                          e.stopPropagation();
                          toggleWishlist(prod.id);
                        }}
                        style={{
                          position: 'absolute',
                          bottom: '10px',
                          right: '10px',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: '#ffffff',
                          border: 'none',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px'
                        }}
                      >
                        {isWishlisted ? '❤️' : '🤍'}
                      </button>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#b91c1c', marginBottom: '4px' }}>
                          {prod.category}
                        </div>
                        <h4 style={{
                          fontSize: '14px',
                          fontWeight: '800',
                          color: '#0f172a',
                          margin: '0 0 8px 0',
                          lineHeight: '1.3'
                        }}>
                          {prod.name}
                        </h4>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>
                          📐 {prod.size || 'Standard Size'} • {prod.colour || 'Godrej Finish'}
                        </div>
                      </div>

                      {/* Pricing & CTA */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
                          <span style={{ fontSize: '18px', fontWeight: '900', color: '#15803d' }}>
                            ₹{prod.retailPrice.toLocaleString('en-IN')}
                          </span>
                          {prod.mrp > prod.retailPrice && (
                            <span style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>
                              ₹{prod.mrp.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setActiveProduct(prod);
                              setActiveTab('SPOTLIGHT');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            style={{
                              flex: 1,
                              background: '#0f172a',
                              color: '#ffffff',
                              border: 'none',
                              padding: '8px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            View Specs
                          </button>
                          <a
                            href={getWhatsAppLink(prod)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: '#22c55e',
                              color: '#ffffff',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            💬
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: WISHLIST / BILLING ESTIMATE ==================== */}
        {activeTab === 'WISHLIST' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0' }}>
                    My Showroom Wishlist & Estimate
                  </h2>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    Show this estimate screen to our cashier or sales consultant for instant checkout!
                  </div>
                </div>
                {wishlist.length > 0 && (
                  <button
                    onClick={() => setWishlist([])}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {wishlistProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 16px', color: '#64748b' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛋️</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                    Your wishlist is empty
                  </div>
                  <div style={{ fontSize: '13px', marginBottom: '20px' }}>
                    Tap the heart icon (❤️) on any furniture in our showroom to add it here.
                  </div>
                  <button
                    onClick={() => setActiveTab('CATALOG')}
                    style={{
                      background: '#b91c1c',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    Explore 65 Collections ➔
                  </button>
                </div>
              ) : (
                <div>
                  {/* Item List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    {wishlistProducts.map(item => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '12px',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          background: '#f8fafc'
                        }}
                      >
                        <img
                          src={item.photo || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=200&q=80'}
                          alt={item.name}
                          style={{ width: '70px', height: '70px', borderRadius: '8px', objectFit: 'cover' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#b91c1c' }}>{item.pCode}</div>
                          <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{item.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            Godown: {item.godown || 'Showroom Display'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '16px', fontWeight: '900', color: '#15803d' }}>
                            ₹{item.retailPrice.toLocaleString('en-IN')}
                          </div>
                          {item.mrp > item.retailPrice && (
                            <div style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' }}>
                              ₹{item.mrp.toLocaleString('en-IN')}
                            </div>
                          )}
                          <button
                            onClick={() => toggleWishlist(item.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              marginTop: '4px'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Box */}
                  <div style={{
                    background: '#f1f5f9',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                      <span>Total Selected Items:</span>
                      <strong>{wishlistProducts.length} Pieces</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#b91c1c' }}>
                      <span>Total Festival Savings:</span>
                      <strong>- ₹{wishlistTotalSavings.toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: '10px',
                      borderTop: '2px solid #cbd5e1',
                      fontSize: '18px',
                      fontWeight: '900',
                      color: '#0f172a'
                    }}>
                      <span>Showroom Estimate:</span>
                      <span style={{ color: '#15803d' }}>₹{wishlistTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* WhatsApp Estimate Send Button */}
                  <a
                    href={`https://wa.me/919847012345?text=${encodeURIComponent(
                      `Hello Shree Vinayaka Furnitures,\nI am at your showroom and finalized my wishlist:\n${wishlistProducts
                        .map(p => `• ${p.name} (${p.pCode}) - ₹${p.retailPrice.toLocaleString('en-IN')}`)
                        .join('\n')}\nTotal Estimate: ₹${wishlistTotal.toLocaleString('en-IN')}\nPlease confirm delivery & final billing.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      background: '#22c55e',
                      color: '#ffffff',
                      padding: '14px',
                      borderRadius: '10px',
                      fontWeight: '800',
                      fontSize: '14px',
                      textDecoration: 'none',
                      boxShadow: '0 4px 10px rgba(34, 197, 94, 0.3)'
                    }}
                  >
                    💬 Send My Estimate to Billing Team on WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 4: STORE INFO & TIMINGS ==================== */}
        {activeTab === 'STORE_INFO' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', margin: '0 0 8px 0' }}>
                {companyInfo.name || 'Shree Vinayaka Furnitures'}
              </h2>
              <div style={{ fontSize: '14px', color: '#b91c1c', fontWeight: '800', marginBottom: '16px' }}>
                Official Godrej Interio Authorised Channel Partner
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>📍 SHOWROOM ADDRESS</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', lineHeight: '1.4' }}>
                    {companyInfo.address}, {companyInfo.city}, {companyInfo.state}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', marginBottom: '6px' }}>⏰ SHOWROOM TIMINGS</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', lineHeight: '1.4' }}>
                    Monday - Sunday: 9:30 AM to 8:30 PM<br />
                    <span style={{ color: '#15803d', fontWeight: '800' }}>Open All 7 Days</span>
                  </div>
                </div>
              </div>

              {/* Contact Actions */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a
                  href={`tel:${companyInfo.contactNo || '+91 98470 12345'}`}
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    background: '#0f172a',
                    color: '#ffffff',
                    padding: '14px',
                    borderRadius: '10px',
                    fontWeight: '800',
                    fontSize: '13px',
                    textAlign: 'center',
                    textDecoration: 'none'
                  }}
                >
                  📞 Call {companyInfo.contactNo || '+91 98470 12345'}
                </a>
                <a
                  href="https://wa.me/919847012345"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    background: '#22c55e',
                    color: '#ffffff',
                    padding: '14px',
                    borderRadius: '10px',
                    fontWeight: '800',
                    fontSize: '13px',
                    textAlign: 'center',
                    textDecoration: 'none'
                  }}
                >
                  💬 Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 4. FOOTER */}
      <footer style={{
        background: '#0f172a',
        color: '#94a3b8',
        padding: '24px 16px',
        marginTop: '40px',
        textAlign: 'center',
        fontSize: '12px',
        borderTop: '1px solid #1e293b'
      }}>
        <div style={{ color: '#ffffff', fontWeight: '800', fontSize: '14px', marginBottom: '6px' }}>
          GODREJ INTERIO - SHREE VINAYAKA FURNITURES
        </div>
        <div>Authorised Channel Partner • Enterprise Retail Daddy POS & Smart QR Showroom System</div>
        <div style={{ marginTop: '8px', color: '#64748b' }}>
          © {new Date().getFullYear()} Shree Vinayaka Furnitures. All Prices inclusive of 18% GST.
        </div>
      </footer>
    </div>
  );
}
