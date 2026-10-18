import React, { useState, useMemo, useEffect } from 'react';
import type { Product, Customer, CompanyInfo, Category } from '../../types/retailDaddy';
import { QuickProductAddModal } from './QuickProductAddModal';

interface RubicPosModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers?: Customer[];
  companyInfo?: CompanyInfo;
  onQuickPayBill?: (billData: any) => void;
  onCompleteBill?: (billData: any) => void;
  invoiceNo?: string;
  onAddProduct?: (product: Product) => void;
  onAddCategory?: (category: Category) => void;
  onUpdateProductPhoto?: (productId: string, photoUrl: string) => void;
}

interface TouchCartItem {
  id: string;
  productId: string;
  productName: string;
  barcode: string;
  qty: number;
  rate: number;
  disc: number;
  total: number;
  mrp: number;
}

const DEFAULT_CATEGORIES = [
  'ALL',
  'STEEL ALMIRAHS & STORWELS',
  'WOODEN BEDS & BEDROOM',
  'LIVING ROOM SOFAS',
  'OFFICE & STUDY CHAIRS',
  'DINING FURNITURE',
  'HOME SECURITY & SAFES',
  'MATTRESSES',
  'TABLES & DESKS',
  'ACCESSORIES'
];

const FURNITURE_PHOTO_MAP: Record<string, string> = {
  sofa: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80',
  bed: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=80',
  chair: 'https://images.unsplash.com/photo-1580481077195-c3a821a58875?auto=format&fit=crop&w=400&q=80',
  almirah: 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=400&q=80',
  storwel: 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=400&q=80',
  dining: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=400&q=80',
  table: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=400&q=80',
  desk: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=400&q=80',
  safe: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=400&q=80',
  mattress: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=400&q=80',
  wardrobe: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=400&q=80'
};

export const RubicPosModal: React.FC<RubicPosModalProps> = ({
  isOpen,
  onClose,
  products,
  customers = [],
  companyInfo: _companyInfo,
  onQuickPayBill,
  onCompleteBill,
  invoiceNo,
  onAddProduct,
  onAddCategory,
  onUpdateProductPhoto
}) => {
  // Mode: Retail vs Wholesale Price
  const [priceMode, setPriceMode] = useState<'RETAIL' | 'WHOLESALE'>('RETAIL');

  // Local products cache to allow immediate appearance of newly created products
  const [localProducts, setLocalProducts] = useState<Product[]>(products);

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  // Active Category filter
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // Custom categories added dynamically in POS
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState<boolean>(false);
  const [newCatInput, setNewCatInput] = useState<string>('');

  // Quick Product Add Modal state
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState<boolean>(false);

  // In-POS Touch Search Bar
  const [touchSearch, setTouchSearch] = useState<string>('');

  // Alphabetical sort/filter state
  const [alphabetFilter, setAlphabetFilter] = useState<string>('');
  const [showAlphaBar, setShowAlphaBar] = useState<boolean>(false);

  // Customer selection
  const [customerName, setCustomerName] = useState<string>('Cash');
  const [customerPhone, setCustomerPhone] = useState<string>('1234567890');
  const [taxType, setTaxType] = useState<string>('GST');
  const [stateName, setStateName] = useState<string>('Kerala');

  // Cart
  const [touchCart, setTouchCart] = useState<TouchCartItem[]>([]);

  // Discount
  const [discountType, setDiscountType] = useState<'Amount' | 'Percentage'>('Amount');
  const [discountVal, setDiscountVal] = useState<number>(0);

  // Non-blocking toast state
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Compile full category list
  const allCategories = useMemo(() => {
    const fromProducts = localProducts.map(p => p.category ? p.category.toUpperCase() : '').filter(Boolean);
    const combined = Array.from(new Set([...DEFAULT_CATEGORIES, ...customCategories, ...fromProducts]));
    return combined;
  }, [localProducts, customCategories]);

  // Filter products by category, alphabetical letter, and search
  const filteredProducts = useMemo(() => {
    return localProducts.filter(p => {
      const matchCat = activeCategory === 'ALL' || (p.category && p.category.toUpperCase() === activeCategory.toUpperCase());
      const matchAlpha = !alphabetFilter || p.name.toUpperCase().startsWith(alphabetFilter.toUpperCase());
      const matchSearch = !touchSearch ||
        p.name.toLowerCase().includes(touchSearch.toLowerCase()) ||
        p.barcode.includes(touchSearch);
      return matchCat && matchAlpha && matchSearch;
    });
  }, [localProducts, activeCategory, alphabetFilter, touchSearch]);

  // Add product to touch cart
  const handleAddProduct = (prod: Product) => {
    const rate = priceMode === 'WHOLESALE' && prod.wholesalePrice ? prod.wholesalePrice : (prod.retailPrice || prod.mrp);
    const existingIdx = touchCart.findIndex(item => item.productId === prod.id);

    if (existingIdx >= 0) {
      const updated = [...touchCart];
      const newQty = updated[existingIdx].qty + 1;
      updated[existingIdx].qty = newQty;
      updated[existingIdx].total = Number((newQty * rate - updated[existingIdx].disc).toFixed(2));
      setTouchCart(updated);
    } else {
      const newItem: TouchCartItem = {
        id: `tci-${Date.now()}-${Math.random()}`,
        productId: prod.id,
        productName: prod.name,
        barcode: prod.barcode,
        qty: 1,
        rate,
        disc: 0,
        total: rate,
        mrp: prod.mrp
      };
      setTouchCart([newItem, ...touchCart]);
    }
  };

  // Add new category directly from POS
  const handleCreateCategory = (nameToCreate?: string) => {
    const cat = (nameToCreate || newCatInput).trim().toUpperCase();
    if (!cat) {
      showToast('Please enter category name', 'error');
      return;
    }
    if (allCategories.includes(cat)) {
      setActiveCategory(cat);
      setIsAddCategoryOpen(false);
      setNewCatInput('');
      showToast(`Switched to existing category "${cat}"`, 'info');
      return;
    }

    setCustomCategories(prev => [...prev, cat]);
    setActiveCategory(cat);
    setIsAddCategoryOpen(false);
    setNewCatInput('');

    if (onAddCategory) {
      onAddCategory({
        id: `cat-${Date.now()}`,
        name: cat
      });
    }

    showToast(`Category "${cat}" added to POS!`, 'success');
  };

  // Callback when a new product is saved from QuickProductAddModal
  const handleSaveProductFromModal = (newProd: Product) => {
    setLocalProducts(prev => [newProd, ...prev]);
    if (onAddProduct) {
      onAddProduct(newProd);
    }
    if (newProd.category) {
      setActiveCategory(newProd.category.toUpperCase());
    }
    showToast(`Product "${newProd.name}" added to catalog!`, 'success');
  };

  // Callback when Save & Add to Bill is clicked
  const handleSaveAndAddFromModal = (newProd: Product) => {
    handleAddProduct(newProd);
    showToast(`Added "${newProd.name}" straight to current bill!`, 'success');
  };

  // Auto-update images for all products in current category
  const handleAutoUpdateImages = () => {
    let updatedCount = 0;
    const updatedList = localProducts.map(p => {
      const matchCat = activeCategory === 'ALL' || (p.category && p.category.toUpperCase() === activeCategory.toUpperCase());
      if (!matchCat) return p;

      // If photo is already an external HTTP URL, keep it
      if (p.photo && p.photo.startsWith('http')) return p;

      // Find matching furniture photo from pool
      const pNameLower = p.name.toLowerCase();
      let matchedUrl: string | undefined;
      for (const [key, url] of Object.entries(FURNITURE_PHOTO_MAP)) {
        if (pNameLower.includes(key)) {
          matchedUrl = url;
          break;
        }
      }

      if (!matchedUrl) {
        matchedUrl = FURNITURE_PHOTO_MAP.sofa;
      }

      updatedCount++;
      if (onUpdateProductPhoto) {
        onUpdateProductPhoto(p.id, matchedUrl);
      }
      return { ...p, photo: matchedUrl };
    });

    if (updatedCount > 0) {
      setLocalProducts(updatedList);
      showToast(`Updated high-res showroom photos for ${updatedCount} items!`, 'success');
    } else {
      showToast('All items in this category already have high-res photos.', 'info');
    }
  };

  // Keyboard shortcut listener for F2 inside Rubic POS
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setIsQuickAddModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculations
  const totalItems = touchCart.length;
  const totalQty = touchCart.reduce((sum, item) => sum + item.qty, 0);
  const grossTotal = touchCart.reduce((sum, item) => sum + (item.rate * item.qty), 0);
  const totalMrp = touchCart.reduce((sum, item) => sum + (item.mrp * item.qty), 0);

  const appliedDiscount = discountType === 'Percentage'
    ? Number(((grossTotal * discountVal) / 100).toFixed(2))
    : discountVal;

  const netTotal = Math.max(0, Number((grossTotal - appliedDiscount).toFixed(2)));
  const totalTax = taxType === 'GST' ? Number(((netTotal * 0.18) / 1.18).toFixed(2)) : 0;

  const handleQuickPay = () => {
    if (touchCart.length === 0) {
      showToast('Cart is empty. Please touch items from right catalog.', 'error');
      return;
    }

    const billRecord = {
      invoiceNo: invoiceNo || `SHIB-0096-DADDY`,
      date: new Date().toLocaleDateString('en-GB'),
      customer: {
        name: customerName,
        phone: customerPhone,
        state: stateName
      },
      items: touchCart.map(c => ({
        id: c.id,
        name: c.productName,
        barcode: c.barcode,
        qty: c.qty,
        rate: c.rate,
        mrp: c.mrp,
        discAmt: c.disc,
        total: c.total
      })),
      totalItems,
      totalQty,
      totalTax,
      totalDisc: appliedDiscount,
      totalMrp,
      netPay: netTotal,
      taxScheme: taxType,
      status: 'PAID'
    };

    if (onCompleteBill) onCompleteBill(billRecord);
    if (onQuickPayBill) onQuickPayBill(billRecord);
    setTouchCart([]);
    setDiscountVal(0);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#e2e8f0',
        zIndex: 1350,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        userSelect: 'none'
      }}
    >
      {/* Top Header Bar matching Frame 0510 ("POS New") */}
      <div
        style={{
          background: '#f8fafc',
          borderBottom: '2px solid #cbd5e1',
          padding: '6px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: '900', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📱</span>
              <span>Rubic POS Touch Billing</span>
            </span>
            <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '3px', fontWeight: 'bold', fontSize: '11px' }}>
              Invoice: {invoiceNo || 'SHIB-0096-DADDY'}
            </span>
          </div>

          {/* Quick Product Button + Retail vs Wholesale Radio Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* VIDEO OA9VplB3Tlc: In-POS Quick Product Creation Button */}
            <button
              type="button"
              onClick={() => setIsQuickAddModalOpen(true)}
              style={{
                background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 12px',
                fontSize: '12px',
                fontWeight: '900',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(22, 163, 74, 0.3)'
              }}
              title="Add Unlisted Product directly from Sales Panel [F2]"
            >
              <span>⚡ + Quick Product</span>
              <span style={{ fontSize: '10px', background: 'rgba(0,0,0,0.25)', padding: '1px 5px', borderRadius: '3px' }}>
                F2
              </span>
            </button>

            {/* Retail vs Wholesale Radio Switch (Frame 0040 & 0510) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', padding: '3px 10px', border: '1px solid #94a3b8', borderRadius: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', color: priceMode === 'RETAIL' ? '#15803d' : '#64748b' }}>
                <input
                  type="radio"
                  name="rubicPriceMode"
                  checked={priceMode === 'RETAIL'}
                  onChange={() => setPriceMode('RETAIL')}
                />
                Retail Price
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', color: priceMode === 'WHOLESALE' ? '#15803d' : '#64748b' }}>
                <input
                  type="radio"
                  name="rubicPriceMode"
                  checked={priceMode === 'WHOLESALE'}
                  onChange={() => setPriceMode('WHOLESALE')}
                />
                Wholesale Price
              </label>
            </div>

            <button
              onClick={onClose}
              style={{
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
            >
              ✕ Exit POS
            </button>
          </div>
        </div>

        {toastMsg && (
          <div style={{
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: toastMsg.type === 'error' ? '#fef2f2' : toastMsg.type === 'success' ? '#f0fdf4' : '#eff6ff',
            color: toastMsg.type === 'error' ? '#991b1b' : toastMsg.type === 'success' ? '#166534' : '#1e40af',
            border: `1px solid ${toastMsg.type === 'error' ? '#fca5a5' : toastMsg.type === 'success' ? '#86efac' : '#bfdbfe'}`
          }}>
            <span>{toastMsg.text}</span>
            <button onClick={() => setToastMsg(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </div>
        )}

        {/* Customer & Parameter strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>Customer :</span>
            <input
              type="text"
              list="rubic-customer-list"
              value={customerName}
              onChange={e => {
                const val = e.target.value;
                setCustomerName(val);
                const found = customers.find(c => c.name.toLowerCase() === val.toLowerCase());
                if (found) {
                  setCustomerPhone(found.phone);
                  setStateName(found.state);
                }
              }}
              style={{ border: '1px solid #94a3b8', padding: '2px 4px', width: '110px', backgroundColor: '#ffffcc', fontWeight: 'bold' }}
            />
            <datalist id="rubic-customer-list">
              {customers.map(c => (
                <option key={c.id} value={c.name}>{c.phone}</option>
              ))}
            </datalist>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>Contact No :</span>
            <input
              type="text"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              style={{ border: '1px solid #94a3b8', padding: '2px 4px', width: '100px', backgroundColor: '#ffffcc', fontWeight: 'bold' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>State :</span>
            <select
              value={stateName}
              onChange={e => setStateName(e.target.value)}
              style={{ border: '1px solid #94a3b8', padding: '2px 4px' }}
            >
              <option value="Kerala">Kerala</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Maharashtra">Maharashtra</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>Tax :</span>
            <select
              value={taxType}
              onChange={e => setTaxType(e.target.value)}
              style={{ border: '1px solid #94a3b8', padding: '2px 4px', fontWeight: 'bold', color: '#1e40af' }}
            >
              <option value="GST">GST</option>
              <option value="NON GST">NON GST</option>
            </select>
          </div>

          {/* Quick touch search bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
            <span style={{ fontWeight: 'bold', color: '#475569' }}>🔍 Find:</span>
            <input
              type="text"
              value={touchSearch}
              onChange={e => setTouchSearch(e.target.value)}
              placeholder="Search product / barcode..."
              style={{ border: '1px solid #94a3b8', padding: '2px 6px', width: '160px', borderRadius: '3px' }}
            />
            {touchSearch && (
              <button
                type="button"
                onClick={() => setTouchSearch('')}
                style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#64748b' }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort & Alphabet Toggle (Frame 0510) */}
          <button
            type="button"
            onClick={() => setShowAlphaBar(!showAlphaBar)}
            style={{
              background: 'linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '3px 10px',
              borderRadius: '3px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            A-Z Jump
          </button>
        </div>

        {/* Optional Alphabet Jump Bar (Frame 0510/0520) */}
        {showAlphaBar && (
          <div style={{ display: 'flex', gap: '3px', overflowX: 'auto', background: '#dbeafe', padding: '4px', borderRadius: '3px' }}>
            <button
              onClick={() => setAlphabetFilter('')}
              style={{
                padding: '2px 6px',
                border: '1px solid #94a3b8',
                borderRadius: '2px',
                background: alphabetFilter === '' ? '#1d4ed8' : '#ffffff',
                color: alphabetFilter === '' ? '#ffffff' : '#000000',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              ALL
            </button>
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
              <button
                key={letter}
                onClick={() => setAlphabetFilter(letter)}
                style={{
                  padding: '2px 5px',
                  border: '1px solid #94a3b8',
                  borderRadius: '2px',
                  background: alphabetFilter === letter ? '#1d4ed8' : '#ffffff',
                  color: alphabetFilter === letter ? '#ffffff' : '#000000',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                {letter}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Split Layout: Left Cart, Center Category Pills, Right Touch Card Grid */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Side: Cart Table & Totals (Width ~430px) */}
        <div
          style={{
            width: '430px',
            background: '#ffffff',
            borderRight: '2px solid #cbd5e1',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Table Container */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#1e40af', color: '#ffffff' }}>
                  <th style={{ padding: '6px', textAlign: 'left' }}>Product Name</th>
                  <th style={{ padding: '6px', width: '55px' }}>Barcode</th>
                  <th style={{ padding: '6px', width: '40px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '6px', width: '55px', textAlign: 'right' }}>Rate</th>
                  <th style={{ padding: '6px', width: '45px', textAlign: 'right' }}>Disc</th>
                  <th style={{ padding: '6px', width: '60px', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '6px', width: '30px' }}></th>
                </tr>
              </thead>
              <tbody>
                {touchCart.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px 10px', color: '#94a3b8' }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>👆</div>
                      <div style={{ fontWeight: 'bold' }}>Tap any product card on the right to add to bill.</div>
                      <div style={{ fontSize: '10px', marginTop: '4px' }}>
                        Or press <strong style={{ color: '#16a34a' }}>[F2]</strong> to quickly add a new unlisted item.
                      </div>
                    </td>
                  </tr>
                ) : (
                  touchCart.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '4px', fontWeight: 'bold', color: '#0f172a' }}>{item.productName}</td>
                      <td style={{ padding: '4px', fontFamily: 'monospace', color: '#64748b' }}>{item.barcode}</td>
                      <td style={{ padding: '4px', textAlign: 'center', fontWeight: 'bold' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                          <button
                            onClick={() => {
                              const updated = [...touchCart];
                              const idx = updated.findIndex(i => i.id === item.id);
                              if (idx >= 0) {
                                if (updated[idx].qty > 1) {
                                  updated[idx].qty -= 1;
                                  updated[idx].total = Number((updated[idx].qty * updated[idx].rate - updated[idx].disc).toFixed(2));
                                  setTouchCart(updated);
                                } else {
                                  setTouchCart(touchCart.filter(i => i.id !== item.id));
                                }
                              }
                            }}
                            style={{ width: '16px', height: '16px', padding: 0, fontSize: '10px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                          >
                            -
                          </button>
                          <span>{item.qty}</span>
                          <button
                            onClick={() => {
                              const updated = [...touchCart];
                              const idx = updated.findIndex(i => i.id === item.id);
                              if (idx >= 0) {
                                updated[idx].qty += 1;
                                updated[idx].total = Number((updated[idx].qty * updated[idx].rate - updated[idx].disc).toFixed(2));
                                setTouchCart(updated);
                              }
                            }}
                            style={{ width: '16px', height: '16px', padding: 0, fontSize: '10px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '4px', textAlign: 'right' }}>₹{item.rate.toFixed(2)}</td>
                      <td style={{ padding: '4px', textAlign: 'right', color: '#dc2626' }}>{item.disc}</td>
                      <td style={{ padding: '4px', textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>
                        ₹{item.total.toFixed(2)}
                      </td>
                      <td style={{ padding: '4px', textAlign: 'center' }}>
                        <button
                          onClick={() => setTouchCart(touchCart.filter(i => i.id !== item.id))}
                          style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '2px', cursor: 'pointer', padding: '1px 4px', fontSize: '9px' }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Box matching Frame 0510 */}
          <div style={{ background: '#f8fafc', borderTop: '2px solid #cbd5e1', padding: '6px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '2px', fontSize: '10px', textAlign: 'center', background: '#e2e8f0', padding: '4px', borderRadius: '2px' }}>
              <div>
                <div style={{ color: '#64748b', fontWeight: 'bold' }}>ITEMS</div>
                <div style={{ fontWeight: '900', color: '#0f172a' }}>{totalItems}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontWeight: 'bold' }}>QTY</div>
                <div style={{ fontWeight: '900', color: '#0f172a' }}>{totalQty.toFixed(3)}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontWeight: 'bold' }}>DISCOUNT</div>
                <div style={{ fontWeight: '900', color: '#dc2626' }}>{appliedDiscount.toFixed(2)}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontWeight: 'bold' }}>TAX</div>
                <div style={{ fontWeight: '900', color: '#0f172a' }}>{totalTax.toFixed(2)}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontWeight: 'bold' }}>TOTAL MRP</div>
                <div style={{ fontWeight: '900', color: '#0f172a' }}>₹{totalMrp.toFixed(0)}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontWeight: 'bold' }}>TOTAL BILL</div>
                <div style={{ fontWeight: '900', color: '#15803d' }}>₹{netTotal.toFixed(2)}</div>
              </div>
            </div>

            {/* Discount selector (Frame 0510) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="touchDiscType"
                    checked={discountType === 'Amount'}
                    onChange={() => setDiscountType('Amount')}
                  />
                  <span>By Amount</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="touchDiscType"
                    checked={discountType === 'Percentage'}
                    onChange={() => setDiscountType('Percentage')}
                  />
                  <span>By %</span>
                </label>
              </div>
              <input
                type="number"
                min="0"
                value={discountVal || ''}
                onChange={e => setDiscountVal(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                style={{ width: '80px', border: '1px solid #94a3b8', padding: '2px 4px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#ffffcc' }}
              />
            </div>

            {/* Quick Pay Button (Frame 0510) */}
            <button
              type="button"
              onClick={handleQuickPay}
              style={{
                width: '100%',
                marginTop: '6px',
                background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '10px',
                fontSize: '16px',
                fontWeight: '900',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              Quick Pay (₹{netTotal.toFixed(2)})
            </button>
          </div>
        </div>

        {/* Center: Category Pills Column with Add Category & Auto Images (Frame 0510 & Video OA9VplB3Tlc) */}
        <div
          style={{
            width: '150px',
            background: '#e0f2fe',
            borderRight: '2px solid #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            padding: '6px',
            gap: '5px',
            overflowY: 'auto'
          }}
        >
          {/* Header & Direct Category Add Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#0369a1' }}>
              CATEGORIES
            </span>
            <button
              type="button"
              onClick={() => setIsAddCategoryOpen(!isAddCategoryOpen)}
              style={{
                background: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '3px',
                padding: '2px 6px',
                fontSize: '10px',
                fontWeight: '900',
                cursor: 'pointer'
              }}
              title="Add New Category Tab on the fly"
            >
              + Add
            </button>
          </div>

          {/* Inline Add Category Input */}
          {isAddCategoryOpen && (
            <div style={{ background: '#ffffff', padding: '6px', borderRadius: '4px', border: '1px solid #10b981', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <input
                type="text"
                value={newCatInput}
                onChange={e => setNewCatInput(e.target.value)}
                placeholder="New Category..."
                style={{ width: '100%', padding: '3px 4px', fontSize: '10px', border: '1px solid #94a3b8', borderRadius: '2px', boxSizing: 'border-box' }}
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreateCategory();
                  if (e.key === 'Escape') setIsAddCategoryOpen(false);
                }}
              />
              <div style={{ display: 'flex', gap: '3px' }}>
                <button
                  type="button"
                  onClick={() => handleCreateCategory()}
                  style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', borderRadius: '2px', fontSize: '9px', fontWeight: 'bold', padding: '2px', cursor: 'pointer' }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  style={{ background: '#94a3b8', color: '#fff', border: 'none', borderRadius: '2px', fontSize: '9px', padding: '2px 4px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Category List */}
          {allCategories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              style={{
                background: activeCategory === cat
                  ? 'linear-gradient(180deg, #1d4ed8 0%, #1e3a8a 100%)'
                  : 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: activeCategory === cat ? '2px solid #fbbf24' : '1px solid #2563eb',
                borderRadius: '4px',
                padding: '9px 4px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                textAlign: 'center',
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                transition: 'all 0.1s',
                lineHeight: '1.2'
              }}
            >
              {cat}
            </button>
          ))}

          {/* Video OA9VplB3Tlc: Auto-Update Images Button */}
          <button
            type="button"
            onClick={handleAutoUpdateImages}
            style={{
              marginTop: 'auto',
              background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: '1px solid #0284c7',
              borderRadius: '4px',
              padding: '6px 4px',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
            title="Auto-Assign High-Res Furniture Photos to items in this category"
          >
            <span>🔄 Auto Images</span>
          </button>
        </div>

        {/* Right: Touch Product Cards Grid (Frame 0520 & Video OA9VplB3Tlc) */}
        <div
          style={{
            flex: 1,
            background: '#f1f5f9',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Subheader banner above grid */}
          <div
            style={{
              padding: '6px 12px',
              background: '#ffffff',
              borderBottom: '1px solid #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px'
            }}
          >
            <div style={{ color: '#475569', fontWeight: 'bold' }}>
              Showing <span style={{ color: '#1e40af' }}>{filteredProducts.length}</span> items in{' '}
              <strong style={{ color: '#0f172a' }}>"{activeCategory}"</strong>
            </div>

            <button
              type="button"
              onClick={() => setIsQuickAddModalOpen(true)}
              style={{
                background: '#fef3c7',
                color: '#92400e',
                border: '1px solid #f59e0b',
                borderRadius: '3px',
                padding: '2px 8px',
                fontWeight: 'bold',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              ✨ + Add Item to {activeCategory === 'ALL' ? 'Showroom' : activeCategory}
            </button>
          </div>

          <div
            style={{
              flex: 1,
              padding: '10px',
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gridAutoRows: 'max-content',
              gap: '10px'
            }}
          >
            {filteredProducts.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>🪑</div>
                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>No products found in category "{activeCategory}".</div>
                <div style={{ fontSize: '11px', marginTop: '4px', marginBottom: '14px' }}>
                  Touch the button below to quickly add a product to this category.
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuickAddModalOpen(true)}
                  style={{
                    background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  ⚡ + Quick Add Product Now
                </button>
              </div>
            ) : (
              filteredProducts.map(prod => {
                const displayRate = priceMode === 'WHOLESALE' && prod.wholesalePrice ? prod.wholesalePrice : (prod.retailPrice || prod.mrp);
                const isPhotoUrl = prod.photo && (prod.photo.startsWith('http://') || prod.photo.startsWith('https://') || prod.photo.startsWith('data:'));

                return (
                  <div
                    key={prod.id}
                    onClick={() => handleAddProduct(prod)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                      transition: 'transform 0.1s, box-shadow 0.1s'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    {/* Product Visual / Thumbnail (Frame 0520) */}
                    <div
                      style={{
                        height: '75px',
                        background: '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '36px',
                        borderBottom: '1px solid #e2e8f0',
                        overflow: 'hidden'
                      }}
                    >
                      {isPhotoUrl ? (
                        <img
                          src={prod.photo}
                          alt={prod.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => {
                            // Fallback if image fails to load
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span>{prod.photo || '📦'}</span>
                      )}
                    </div>

                    {/* Name */}
                    <div
                      style={{
                        padding: '4px 6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#0f172a',
                        height: '32px',
                        lineHeight: '1.2',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}
                      title={prod.name}
                    >
                      {prod.name}
                    </div>

                    {/* Dark Blue Pill Bottom with Qty and Price (1:1 Frame 0520) */}
                    <div
                      style={{
                        background: '#1e3a8a',
                        color: '#ffffff',
                        padding: '4px 6px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        marginTop: 'auto'
                      }}
                    >
                      <span style={{ fontSize: '9px', color: '#93c5fd' }}>
                        Qty: {prod.openingStock !== undefined ? prod.openingStock.toFixed(3) : '100.000'}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '900', color: '#fbbf24' }}>
                        ₹ {displayRate.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Product Add Modal (Direct In-POS) */}
      <QuickProductAddModal
        isOpen={isQuickAddModalOpen}
        onClose={() => setIsQuickAddModalOpen(false)}
        categories={allCategories}
        activeCategory={activeCategory}
        onSaveProduct={handleSaveProductFromModal}
        onSaveAndAddToCart={handleSaveAndAddFromModal}
        onAddNewCategory={handleCreateCategory}
      />
    </div>
  );
};
