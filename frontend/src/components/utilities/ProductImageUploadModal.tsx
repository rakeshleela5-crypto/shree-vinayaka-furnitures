import { useState } from 'react';
import type { Product } from '../../types/retailDaddy';

interface ProductImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onUpdateProductPhoto: (productId: string, photoUrl: string) => void;
}

// Curated furniture fallback photo pool based on keywords
const FURNITURE_PHOTO_MAP: Record<string, string[]> = {
  chair: [
    'https://images.unsplash.com/photo-1580481077195-c3a821a58875?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=800&q=80'
  ],
  sofa: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'
  ],
  table: [
    'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=800&q=80'
  ],
  bed: [
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?auto=format&fit=crop&w=800&q=80'
  ],
  wardrobe: [
    'https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80'
  ],
  desk: [
    'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80'
  ]
};

export function ProductImageUploadModal({
  isOpen,
  onClose,
  products,
  onUpdateProductPhoto
}: ProductImageUploadModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMissingOnly, setFilterMissingOnly] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [onlineResults, setOnlineResults] = useState<string[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm) ||
      (p.pCode && p.pCode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMissing = !filterMissingOnly || !p.photo;
    return matchesSearch && matchesMissing;
  });

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setCustomUrl(prod.photo || '');
    setOnlineResults([]);
    // Auto-search recommendations
    handleOnlineSearch(prod.name);
  };

  const handleOnlineSearch = (query: string) => {
    setIsSearchingOnline(true);
    const qLower = query.toLowerCase();
    let matches: string[] = [];

    // Search keywords in map
    for (const [key, urls] of Object.entries(FURNITURE_PHOTO_MAP)) {
      if (qLower.includes(key)) {
        matches = [...matches, ...urls];
      }
    }

    if (matches.length === 0) {
      // Default to general furniture pool
      matches = [
        ...FURNITURE_PHOTO_MAP.chair,
        ...FURNITURE_PHOTO_MAP.sofa,
        ...FURNITURE_PHOTO_MAP.table
      ];
    }

    setOnlineResults(Array.from(new Set(matches)));
    setIsSearchingOnline(false);
  };

  const handleApplyPhoto = (url: string) => {
    if (!selectedProduct) return;
    onUpdateProductPhoto(selectedProduct.id, url);
    setSelectedProduct({ ...selectedProduct, photo: url });
    setCustomUrl(url);
    showToast(`✓ Photo attached to ${selectedProduct.name}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProduct) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      handleApplyPhoto(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rd-modal-overlay" style={{ zIndex: 99999 }}>
      <div className="rd-dialog" style={{ width: '1050px', maxWidth: '98vw', height: '85vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header Bar */}
        <div style={{
          background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
          color: '#ffffff',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #075985'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🖼️</span>
            <div>
              <div style={{ fontWeight: '900', fontSize: '14px', letterSpacing: '0.5px' }}>
                Product Image Upload & Online Photo Search
              </div>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>
                Attach high-resolution furniture photos for POS Touch billing, catalogues & digital bills
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

        {/* Main Dual-Column Content */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '420px 1fr', overflow: 'hidden' }}>
          {/* Left Column: Product List */}
          <div style={{ borderRight: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
            {/* Filters */}
            <div style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                className="rd-pos-input"
                style={{ width: '100%' }}
                placeholder="Search furniture by name or code..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#475569', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filterMissingOnly}
                  onChange={e => setFilterMissingOnly(e.target.checked)}
                />
                <span>Show only items missing photos ({products.filter(p => !p.photo).length})</span>
              </label>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
              {filteredProducts.map(prod => {
                const isSelected = selectedProduct?.id === prod.id;
                return (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '4px',
                      border: isSelected ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                      background: isSelected ? '#e0f2fe' : '#ffffff',
                      marginBottom: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Thumbnail preview */}
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '4px',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {prod.photo ? (
                        <img src={prod.photo} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '16px', opacity: 0.4 }}>🛋️</span>
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {prod.name}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', display: 'flex', gap: '8px' }}>
                        <span>Code: {prod.pCode || prod.barcode}</span>
                        <span>₹{prod.retailPrice?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>

                    {prod.photo ? (
                      <span style={{ color: '#16a34a', fontSize: '14px' }} title="Photo attached">✓</span>
                    ) : (
                      <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '9px', fontWeight: 'bold', padding: '2px 5px', borderRadius: '3px' }}>
                        No Photo
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Product & Photo Attacher */}
          <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', background: '#ffffff' }}>
            {selectedProduct ? (
              <>
                {/* Active Product Banner */}
                <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>{selectedProduct.name}</h3>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Barcode: <strong>{selectedProduct.barcode}</strong> | Retail Price: <strong>₹{selectedProduct.retailPrice?.toFixed(2)}</strong>
                    </div>
                  </div>
                  {selectedProduct.photo && (
                    <button
                      type="button"
                      onClick={() => handleApplyPhoto('')}
                      style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Remove Photo
                    </button>
                  )}
                </div>

                {/* Current Photo vs Preview */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{
                    width: '140px',
                    height: '140px',
                    borderRadius: '6px',
                    border: '2px dashed #94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    background: '#f8fafc'
                  }}>
                    {selectedProduct.photo ? (
                      <img src={selectedProduct.photo} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
                        <div style={{ fontSize: '28px', marginBottom: '4px' }}>📷</div>
                        No Photo Attached
                      </div>
                    )}
                  </div>

                  {/* Manual / File Upload Controls */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>
                      Option A: Upload Image from Computer / Camera
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ fontSize: '11px' }}
                    />

                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155', marginTop: '6px' }}>
                      Option B: Paste Direct Web Image URL
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        className="rd-pos-input"
                        style={{ flex: 1 }}
                        placeholder="https://example.com/furniture.jpg"
                        value={customUrl}
                        onChange={e => setCustomUrl(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyPhoto(customUrl)}
                        style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>

                {/* Option C: 1-Click Online Suggested Photos */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>
                      🌐 Suggested Online Furniture Photos (1-Click Attach):
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOnlineSearch(selectedProduct.name)}
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                    >
                      🔄 Refresh Suggestions
                    </button>
                  </div>

                  {isSearchingOnline ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Searching online...</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                      {onlineResults.map((url, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleApplyPhoto(url)}
                          style={{
                            height: '110px',
                            borderRadius: '4px',
                            border: selectedProduct.photo === url ? '2px solid #16a34a' : '1px solid #cbd5e1',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            position: 'relative'
                          }}
                        >
                          <img src={url} alt="suggestion" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {selectedProduct.photo === url && (
                            <div style={{ position: 'absolute', top: '4px', right: '4px', background: '#16a34a', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                              ✓
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748b' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>👈</div>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Select a furniture item from the list</div>
                <div style={{ fontSize: '11.5px', marginTop: '4px' }}>
                  Click any item on the left to upload, search online, and preview photos.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 16px', background: '#f1f5f9', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Total Items: <strong>{products.length}</strong> | With Photos: <strong>{products.filter(p => p.photo).length}</strong>
          </span>
          <button
            type="button"
            className="rd-f-btn"
            style={{ height: '32px', minWidth: '80px', background: '#64748b', fontSize: '12px' }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
