import React, { useState, useEffect, useRef } from 'react';
import type { Product, Category } from '../../types/retailDaddy';
import { quickCreateProduct, notifyApiSuccess, notifyApiError } from '../../api/client';

interface QuickProductAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: (string | Category)[];
  activeCategory?: string;
  onSaveProduct: (product: Product) => void;
  onSaveAndAddToCart?: (product: Product) => void;
  onAddNewCategory?: (categoryName: string) => void;
}

const PRESET_ICONS = [
  { label: 'Sofa', icon: '🛋️' },
  { label: 'Bed', icon: '🛏️' },
  { label: 'Chair', icon: '🪑' },
  { label: 'Almirah', icon: '🚪' },
  { label: 'Wardrobe', icon: '🪞' },
  { label: 'Dining', icon: '🍽️' },
  { label: 'Desk', icon: '💼' },
  { label: 'Safe', icon: '🔒' },
  { label: 'Mattress', icon: '🛏️' },
  { label: 'General', icon: '📦' }
];

const GST_RATES = [0, 5, 12, 18, 28];

export const QuickProductAddModal: React.FC<QuickProductAddModalProps> = ({
  isOpen,
  onClose,
  categories,
  activeCategory,
  onSaveProduct,
  onSaveAndAddToCart,
  onAddNewCategory
}) => {
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Normalize category strings
  const categoryNames = React.useMemo(() => {
    const names = categories
      .map(c => (typeof c === 'string' ? c : c.name))
      .filter(n => n && n !== 'ALL');
    return Array.from(new Set(names));
  }, [categories]);

  // Form State
  const [productName, setProductName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [barcode, setBarcode] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [mrp, setMrp] = useState<string>('');
  const [retailPrice, setRetailPrice] = useState<string>('');
  const [wholesalePrice, setWholesalePrice] = useState<string>('');
  const [itemType, setItemType] = useState<'PRODUCT' | 'SERVICE'>('PRODUCT');
  const [minWholesaleQty, setMinWholesaleQty] = useState<string>('5');
  const [taxRate, setTaxRate] = useState<number>(18);
  const [openingStock, setOpeningStock] = useState<number>(10);
  const [salesUnit, setSalesUnit] = useState<string>('NOS');
  const [hsn, setHsn] = useState<string>('9403');
  const [selectedIcon, setSelectedIcon] = useState<string>('📦');
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Auto-generate barcode & init active category on open
  useEffect(() => {
    if (isOpen) {
      setItemType('PRODUCT');
      setProductName('');
      const defaultCat = (activeCategory && activeCategory !== 'ALL')
        ? activeCategory
        : (categoryNames[0] || 'STEEL ALMIRAHS & STORWELS');
      setSelectedCategory(defaultCat);
      setIsAddingNewCategory(false);
      setNewCategoryName('');

      const autoBarcode = `SVF-${Math.floor(100000 + Math.random() * 900000)}`;
      setBarcode(autoBarcode);
      setPurchasePrice('');
      setMrp('');
      setRetailPrice('');
      setWholesalePrice('');
      setMinWholesaleQty('5');
      setTaxRate(18);
      setOpeningStock(10);
      setSalesUnit('NOS');
      setHsn('9403');
      setSelectedIcon('📦');
      setCustomPhotoUrl('');
      setValidationError(null);

      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, activeCategory, categoryNames]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Auto-fill retail price and icon based on inputs
  const handleNameChange = (val: string) => {
    setProductName(val);
    const lower = val.toLowerCase();
    if (lower.includes('sofa') || lower.includes('couch')) setSelectedIcon('🛋️');
    else if (lower.includes('bed') || lower.includes('cot')) setSelectedIcon('🛏️');
    else if (lower.includes('chair')) setSelectedIcon('🪑');
    else if (lower.includes('almirah') || lower.includes('storwel') || lower.includes('cupboard')) setSelectedIcon('🚪');
    else if (lower.includes('dining')) setSelectedIcon('🍽️');
    else if (lower.includes('table') || lower.includes('desk')) setSelectedIcon('💼');
    else if (lower.includes('safe') || lower.includes('locker')) setSelectedIcon('🔒');
    else if (lower.includes('mattress')) setSelectedIcon('🛏️');
    else if (lower.includes('wardrobe') || lower.includes('dressing')) setSelectedIcon('🪞');
  };

  const handleMrpChange = (val: string) => {
    setMrp(val);
    if (!retailPrice || Number(retailPrice) === Number(mrp)) {
      setRetailPrice(val);
    }
  };

  const buildProductObject = (): Product | null => {
    if (!productName.trim()) {
      setValidationError('Please enter a Product / Item Name');
      nameInputRef.current?.focus();
      return null;
    }

    let finalCategory = selectedCategory;
    if (isAddingNewCategory) {
      if (!newCategoryName.trim()) {
        setValidationError('Please enter a new Category name');
        return null;
      }
      finalCategory = newCategoryName.trim().toUpperCase();
      if (onAddNewCategory) {
        onAddNewCategory(finalCategory);
      }
    }

    const costVal = parseFloat(purchasePrice) || 0;
    const mrpVal = parseFloat(mrp) || parseFloat(retailPrice) || 0;
    const saleVal = parseFloat(retailPrice) || mrpVal;

    if (saleVal <= 0) {
      setValidationError('Please enter a valid Retail Sale Price or MRP');
      return null;
    }

    const wVal = parseFloat(wholesalePrice) || Number((saleVal * 0.9).toFixed(2));
    const finalBarcode = barcode.trim() || `SVF-${Math.floor(100000 + Math.random() * 900000)}`;
    const pCodeNum = Math.floor(1000 + Math.random() * 9000);

    const halfTax = Number((taxRate / 2).toFixed(2));

    const newProd: Product = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      pCode: `P-${pCodeNum}`,
      name: productName.trim(),
      purchasePrice: costVal,
      cessPercent: 0,
      openingStock: itemType === 'SERVICE' ? 0 : (Number(openingStock) || 0),
      physical_stock: itemType === 'SERVICE' ? 0 : (Number(openingStock) || 0),
      reserved_stock: 0,
      barcode: finalBarcode,
      mrp: mrpVal,
      retailPrice: saleVal,
      wholesalePrice: wVal,
      minWholesaleQty: parseFloat(minWholesaleQty) || 5,
      itemType: itemType,
      category: finalCategory,
      subCategory: 'STANDARD',
      description: `${productName.trim()} (${finalCategory})`,
      cgst: halfTax,
      sgst: halfTax,
      igst: taxRate,
      salesUnit: salesUnit || (itemType === 'SERVICE' ? 'JOB' : 'NOS'),
      hsn: hsn || (itemType === 'SERVICE' ? '9954' : '9403'),
      photo: customPhotoUrl.trim() || selectedIcon,
      status: 'Active',
      sTax: 'Inclusive',
      pTax: 'Inclusive',
      godown: 'Main Showroom',
      rack: 'Floor A1'
    };

    return newProd;
  };

  const handleSaveOnly = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;
    const prod = buildProductObject();
    if (!prod) return;

    setIsSaving(true);
    setValidationError(null);
    try {
      const payload = {
        p_code: prod.pCode,
        name: prod.name,
        barcode: prod.barcode,
        item_type: prod.itemType || 'PRODUCT',
        purchase_price: prod.purchasePrice || 0,
        mrp: prod.mrp || 0,
        retail_price: prod.retailPrice || 0,
        wholesale_price: prod.wholesalePrice || 0,
        min_wholesale_quantity: prod.minWholesaleQty || 1,
        opening_stock: prod.openingStock || 0,
        current_stock: prod.physical_stock || prod.openingStock || 0,
        physical_stock: prod.physical_stock || prod.openingStock || 0,
        category_name: prod.category || 'General',
        sub_category: prod.subCategory || 'STANDARD',
        sales_unit: prod.salesUnit || 'NOS',
        hsn_code: prod.hsn || '9403',
        cgst: prod.cgst || 0,
        sgst: prod.sgst || 0,
        igst: prod.igst || 0,
        description: prod.description || prod.name,
        image_url: prod.photo && prod.photo.startsWith('http') ? prod.photo : undefined,
        godown: prod.godown || 'Main Showroom',
        rack: prod.rack || 'Floor A1'
      };
      const created = await quickCreateProduct(payload);
      const mappedProduct: Product = {
        ...prod,
        id: String(created.id || prod.id)
      };
      notifyApiSuccess(`Product "${mappedProduct.name}" created in PostgreSQL!`);
      onSaveProduct(mappedProduct);
      onClose();
    } catch (err: any) {
      notifyApiError('Failed to save product to database', err);
      setValidationError(err?.message || 'Database creation failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;
    const prod = buildProductObject();
    if (!prod) return;

    setIsSaving(true);
    setValidationError(null);
    try {
      const payload = {
        p_code: prod.pCode,
        name: prod.name,
        barcode: prod.barcode,
        item_type: prod.itemType || 'PRODUCT',
        purchase_price: prod.purchasePrice || 0,
        mrp: prod.mrp || 0,
        retail_price: prod.retailPrice || 0,
        wholesale_price: prod.wholesalePrice || 0,
        min_wholesale_quantity: prod.minWholesaleQty || 1,
        opening_stock: prod.openingStock || 0,
        current_stock: prod.physical_stock || prod.openingStock || 0,
        physical_stock: prod.physical_stock || prod.openingStock || 0,
        category_name: prod.category || 'General',
        sub_category: prod.subCategory || 'STANDARD',
        sales_unit: prod.salesUnit || 'NOS',
        hsn_code: prod.hsn || '9403',
        cgst: prod.cgst || 0,
        sgst: prod.sgst || 0,
        igst: prod.igst || 0,
        description: prod.description || prod.name,
        image_url: prod.photo && prod.photo.startsWith('http') ? prod.photo : undefined,
        godown: prod.godown || 'Main Showroom',
        rack: prod.rack || 'Floor A1'
      };
      const created = await quickCreateProduct(payload);
      const mappedProduct: Product = {
        ...prod,
        id: String(created.id || prod.id)
      };
      notifyApiSuccess(`Product "${mappedProduct.name}" created and added to cart!`);
      onSaveProduct(mappedProduct);
      if (onSaveAndAddToCart) {
        onSaveAndAddToCart(mappedProduct);
      }
      onClose();
    } catch (err: any) {
      notifyApiError('Failed to save product to database', err);
      setValidationError(err?.message || 'Database creation failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(3px)',
        zIndex: 2100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '650px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.15s ease-out'
        }}
      >
        {/* Header matching Retail Daddy Sales Panel Window */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
            color: '#ffffff',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '3px solid #f59e0b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>⚡</span>
            <div>
              <div style={{ fontWeight: '900', fontSize: '16px', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Quick Product Entry</span>
                <span style={{ background: '#f59e0b', color: '#78350f', fontSize: '10px', padding: '1px 6px', borderRadius: '3px', fontWeight: '800' }}>
                  DIRECT IN-POS
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#bfdbfe', marginTop: '1px' }}>
                Retail Daddy Direct Billing Entry • Add unlisted items without closing cart
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.1s'
            }}
            title="Close [Esc]"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {validationError && (
            <div
              style={{
                background: '#fee2e2',
                border: '1px solid #f87171',
                color: '#991b1b',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>⚠️ {validationError}</span>
              <button
                type="button"
                onClick={() => setValidationError(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Vyapar Video Item Type Toggle: Product vs Service */}
          <div style={{ display: 'flex', gap: '8px', padding: '4px', background: '#e2e8f0', borderRadius: '6px' }}>
            <button
              type="button"
              onClick={() => {
                setItemType('PRODUCT');
                if (hsn === '9954' || hsn === '9987') setHsn('9403');
                if (salesUnit === 'JOB' || salesUnit === 'SERVICE') setSalesUnit('NOS');
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '5px',
                border: 'none',
                background: itemType === 'PRODUCT' ? '#1e3a8a' : 'transparent',
                color: itemType === 'PRODUCT' ? '#ffffff' : '#334155',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>📦</span>
              <span>Physical Product (Goods)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setItemType('SERVICE');
                setHsn('9954');
                setSalesUnit('JOB');
                setOpeningStock(0);
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '5px',
                border: 'none',
                background: itemType === 'SERVICE' ? '#0d9488' : 'transparent',
                color: itemType === 'SERVICE' ? '#ffffff' : '#334155',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>🛠️</span>
              <span>Service / Labor / Freight (Non-Inventory)</span>
            </button>
          </div>

          {itemType === 'SERVICE' && (
            <div style={{
              background: '#f0fdfa',
              border: '1px solid #5eead4',
              color: '#0f766e',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>ℹ️</span>
              <span>Non-inventory service item: Bypasses stock locks and stock deduction in POS. Uses SAC code.</span>
            </div>
          )}

          {/* Row 1: Product Name */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>
              {itemType === 'SERVICE' ? 'Service / Labor Description' : 'Product / Item Name'} <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={productName}
              onChange={e => handleNameChange(e.target.value)}
              placeholder={itemType === 'SERVICE' ? 'e.g. On-Site Furniture Assembly & Polishing' : 'e.g. Godrej Slimline 2-Door Steel Almirah (Royal Blue)'}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#0f172a',
                border: '2px solid #3b82f6',
                borderRadius: '4px',
                backgroundColor: '#ffffea',
                boxSizing: 'border-box',
                outline: 'none'
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveAndAdd();
                }
              }}
            />
          </div>

          {/* Row 2: Category Strip + Add Category Button */}
          <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a' }}>
                Category <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
                style={{
                  background: isAddingNewCategory ? '#ef4444' : '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '3px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{isAddingNewCategory ? '✕ Cancel' : '+ New Category'}</span>
              </button>
            </div>

            {isAddingNewCategory ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="Type new category name e.g. EXECUTIVE DESKS"
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    fontSize: '12px',
                    color: '#0f172a',
                    border: '1px solid #10b981',
                    borderRadius: '4px',
                    textTransform: 'uppercase',
                    fontWeight: 'bold'
                  }}
                  autoFocus
                />
              </div>
            ) : (
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 8px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#0f172a',
                  border: '1px solid #94a3b8',
                  borderRadius: '4px',
                  background: '#ffffff',
                  boxSizing: 'border-box'
                }}
              >
                {categoryNames.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>

          {/* Row 3: Barcode + Qty + Sales Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>Barcode / SKU</label>
                <button
                  type="button"
                  onClick={() => setBarcode(`SVF-${Math.floor(100000 + Math.random() * 900000)}`)}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
                >
                  🔄 New Code
                </button>
              </div>
              <input
                type="text"
                value={barcode}
                onChange={e => setBarcode(e.target.value)}
                placeholder="Scan or type barcode"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '12px',
                  color: '#0f172a',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  border: '1px solid #94a3b8',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>
                {itemType === 'SERVICE' ? 'Stock (Bypassed)' : 'Opening Stock'}
              </label>
              <input
                type="number"
                min="0"
                disabled={itemType === 'SERVICE'}
                value={itemType === 'SERVICE' ? 0 : openingStock}
                onChange={e => setOpeningStock(parseFloat(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '12px',
                  color: itemType === 'SERVICE' ? '#64748b' : '#0f172a',
                  background: itemType === 'SERVICE' ? '#f1f5f9' : '#ffffff',
                  fontWeight: 'bold',
                  border: '1px solid #94a3b8',
                  borderRadius: '4px',
                  textAlign: 'right',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>Unit</label>
              <select
                value={salesUnit}
                onChange={e => setSalesUnit(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '12px',
                  color: '#0f172a',
                  fontWeight: 'bold',
                  border: '1px solid #94a3b8',
                  borderRadius: '4px',
                  boxSizing: 'border-box'
                }}
              >
                <option value="NOS">NOS</option>
                <option value="SET">SET</option>
                <option value="PCS">PCS</option>
                <option value="JOB">JOB</option>
                <option value="SERVICE">SERVICE</option>
                <option value="MTR">MTR</option>
              </select>
            </div>
          </div>

          {/* Row 4: Pricing Grid (Purchase, MRP, Retail Sale, Wholesale & Min Qty) */}
          <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: '6px', border: '1px solid #86efac' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#166534', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>PRICING & WHOLESALE TIERS (₹)</span>
              <span style={{ fontSize: '10px', color: '#15803d' }}>Auto-applies when cart qty ≥ Min Whls Qty</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr 1fr 0.8fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#1e293b', marginBottom: '3px' }}>
                  Cost (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={purchasePrice}
                  onChange={e => setPurchasePrice(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '12px',
                    color: '#0f172a',
                    fontWeight: 'bold',
                    border: '1px solid #94a3b8',
                    borderRadius: '4px',
                    textAlign: 'right',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#1e293b', marginBottom: '3px' }}>
                  MRP (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={mrp}
                  onChange={e => handleMrpChange(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '12px',
                    color: '#0f172a',
                    fontWeight: 'bold',
                    border: '1px solid #94a3b8',
                    borderRadius: '4px',
                    textAlign: 'right',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#15803d', marginBottom: '3px' }}>
                  Retail Sale (₹) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={retailPrice}
                  onChange={e => setRetailPrice(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '13px',
                    fontWeight: '900',
                    color: '#0f172a',
                    border: '2px solid #16a34a',
                    borderRadius: '4px',
                    textAlign: 'right',
                    backgroundColor: '#fef08a',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#1e293b', marginBottom: '3px' }}>
                  Wholesale (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={wholesalePrice}
                  onChange={e => setWholesalePrice(e.target.value)}
                  placeholder="Optional"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '12px',
                    color: '#0f172a',
                    fontWeight: 'bold',
                    border: '1px solid #94a3b8',
                    borderRadius: '4px',
                    textAlign: 'right',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#1e293b', marginBottom: '3px' }}>
                  Min Whls Qty
                </label>
                <input
                  type="number"
                  min="1"
                  value={minWholesaleQty}
                  onChange={e => setMinWholesaleQty(e.target.value)}
                  placeholder="5"
                  title="Minimum quantity to unlock wholesale pricing"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '12px',
                    color: '#0f172a',
                    fontWeight: 'bold',
                    border: '1px solid #94a3b8',
                    borderRadius: '4px',
                    textAlign: 'right',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Row 5: GST Rate & HSN */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e40af' }}>GST Rate:</span>
              {GST_RATES.map(rate => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setTaxRate(rate)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    borderRadius: '3px',
                    border: taxRate === rate ? '2px solid #1d4ed8' : '1px solid #cbd5e1',
                    background: taxRate === rate ? '#dbeafe' : '#ffffff',
                    color: taxRate === rate ? '#1e40af' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  {rate}%
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569' }}>HSN:</span>
              <input
                type="text"
                value={hsn}
                onChange={e => setHsn(e.target.value)}
                style={{ width: '65px', padding: '3px 6px', fontSize: '11px', border: '1px solid #cbd5e1', borderRadius: '3px', textAlign: 'center' }}
              />
            </div>
          </div>

          {/* Row 6: Visual Icon Picker / Image */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>
              Visual Icon or Photo Preview:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {PRESET_ICONS.map(pi => (
                <button
                  key={pi.label}
                  type="button"
                  onClick={() => {
                    setSelectedIcon(pi.icon);
                    setCustomPhotoUrl('');
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '16px',
                    borderRadius: '4px',
                    border: selectedIcon === pi.icon && !customPhotoUrl ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: selectedIcon === pi.icon && !customPhotoUrl ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer'
                  }}
                  title={pi.label}
                >
                  {pi.icon}
                </button>
              ))}
              <input
                type="text"
                value={customPhotoUrl}
                onChange={e => setCustomPhotoUrl(e.target.value)}
                placeholder="Or paste image URL..."
                style={{
                  flex: 1,
                  minWidth: '150px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions matching Frame 0040 & Retail Daddy */}
        <div
          style={{
            background: '#f8fafc',
            borderTop: '1px solid #cbd5e1',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#e2e8f0',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            ✕ Cancel [Esc]
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handleSaveOnly}
              disabled={isSaving}
              style={{
                background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.6 : 1,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              title="Save into Master Catalog without adding to active cart"
            >
              {isSaving ? '⏳ Saving...' : '💾 Save to Catalog'}
            </button>

            <button
              type="button"
              onClick={handleSaveAndAdd}
              disabled={isSaving}
              style={{
                background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: '900',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.6 : 1,
                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Save item and immediately add to current cart with Qty 1"
            >
              <span>{isSaving ? '⏳ Saving...' : '⚡ Save & Add to Bill'}</span>
              <span style={{ fontSize: '10px', background: '#14532d', padding: '1px 5px', borderRadius: '3px' }}>
                Enter
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
