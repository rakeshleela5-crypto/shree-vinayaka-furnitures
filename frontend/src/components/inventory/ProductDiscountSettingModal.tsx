import { useState, useEffect, useMemo, useRef } from 'react';
import type { Product, ProductQuantityDiscountRule } from '../../types/retailDaddy';

interface ProductDiscountSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  rules: ProductQuantityDiscountRule[];
  onSaveRule: (rule: ProductQuantityDiscountRule) => void;
  onRemoveRule: (ruleId: string) => void;
  onDeleteAllForProduct: (barcode: string) => void;
}

/**
 * Video 10: Quantity Based Auto Discount Option [vXHCNi2e4rQ]
 * Microscopic 1:1 replica of Windows Form `frmProductDiscount` (Frames 0071, 0078, 0090, 0095, 0100)
 */
export function ProductDiscountSettingModal({
  isOpen,
  onClose,
  products = [],
  rules = [],
  onSaveRule,
  onRemoveRule,
  onDeleteAllForProduct
}: ProductDiscountSettingModalProps) {
  // Selected product state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    // Default to ADOL EXTRA if present, or first product
    return (products || []).find(p => p.name === 'ADOL EXTRA' || p.barcode === '650008') || (products || [])[0] || null;
  });

  const [productSearch, setProductSearch] = useState<string>(() => selectedProduct ? selectedProduct.name : '');
  const [barcodeSearch, setBarcodeSearch] = useState<string>(() => selectedProduct ? selectedProduct.barcode : '');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Form Inputs (Frame 0071, 0090)
  const [minQty, setMinQty] = useState<string>('1');
  const [maxQty, setMaxQty] = useState<string>('5');
  const [discountPercent, setDiscountPercent] = useState<string>('0');

  // Selected Table Row index for Remove
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  // Show all rules or only current product
  const [showAllData, setShowAllData] = useState<boolean>(false);

  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Search input ref
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter products for dropdown
  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 15);
    const q = productSearch.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q)).slice(0, 20);
  }, [products, productSearch]);

  // When selected product changes, calculate next suggested tier
  useEffect(() => {
    if (selectedProduct) {
      setProductSearch(selectedProduct.name);
      setBarcodeSearch(selectedProduct.barcode);
      // Find existing tiers for this product to suggest next range
      const existing = rules
        .filter(r => r.barcode === selectedProduct.barcode)
        .sort((a, b) => a.maxQty - b.maxQty);

      if (existing.length === 0) {
        setMinQty('1');
        setMaxQty('5');
        setDiscountPercent('0');
      } else {
        const last = existing[existing.length - 1];
        const nextMin = last.maxQty + 1;
        setMinQty(String(nextMin));
        setMaxQty(String(nextMin + (last.maxQty - last.minQty)));
        setDiscountPercent(String(Math.min(100, last.discountPercent + 5)));
      }
    }
  }, [selectedProduct, rules]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Displayed Rules
  const displayedRules = useMemo(() => {
    if (showAllData || !selectedProduct) {
      return [...rules].sort((a, b) => a.productName.localeCompare(b.productName) || a.minQty - b.minQty);
    }
    return rules
      .filter(r => r.barcode === selectedProduct.barcode)
      .sort((a, b) => a.minQty - b.minQty);
  }, [rules, showAllData, selectedProduct]);

  // Select a product
  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setProductSearch(prod.name);
    setBarcodeSearch(prod.barcode);
    setIsDropdownOpen(false);
  };

  // Barcode input handler
  const handleBarcodeChange = (bCode: string) => {
    setBarcodeSearch(bCode);
    const matched = products.find(p => p.barcode === bCode);
    if (matched) {
      setSelectedProduct(matched);
      setProductSearch(matched.name);
    }
  };

  // Clear Form Inputs (Frame 0071 [Clear] button)
  const handleClear = () => {
    setMinQty('');
    setMaxQty('');
    setDiscountPercent('');
    setSelectedRuleId(null);
  };

  // Add Rule (Frame 0071, 0090 [Add] button)
  const handleAddRule = () => {
    if (!selectedProduct) {
      showToast('Please select or search a valid product first.', 'error');
      return;
    }
    const min = parseFloat(minQty);
    const max = parseFloat(maxQty);
    const disc = parseFloat(discountPercent);

    if (isNaN(min) || min <= 0) {
      showToast('Please enter a valid Min Quantity greater than 0.', 'error');
      return;
    }
    if (isNaN(max) || max < min) {
      showToast('Max Quantity must be greater than or equal to Min Quantity.', 'error');
      return;
    }
    if (isNaN(disc) || disc < 0 || disc > 100) {
      showToast('Discount % must be between 0 and 100.', 'error');
      return;
    }

    // Check for exact range conflict
    const conflict = rules.find(
      r => r.barcode === selectedProduct.barcode && r.minQty === min && r.maxQty === max
    );

    const pidVal = selectedProduct.id === 'prod-adol-extra' ? 9 : (products.indexOf(selectedProduct) + 1);

    const newRule: ProductQuantityDiscountRule = {
      id: conflict ? conflict.id : `qdr-${Date.now()}`,
      pid: pidVal,
      productName: selectedProduct.name,
      barcode: selectedProduct.barcode,
      minQty: min,
      maxQty: max,
      discountPercent: disc
    };

    onSaveRule(newRule);
    setSelectedRuleId(newRule.id);
    showToast(`✓ Discount rule added for ${selectedProduct.name}!`, 'success');

    // Auto-advance next suggested range
    const nextMin = max + 1;
    setMinQty(String(nextMin));
    setMaxQty(String(nextMin + (max - min)));
    setDiscountPercent(String(Math.min(100, disc + 5)));
  };

  // Remove Selected Rule (Frame 0071 [Remove] button)
  const handleRemove = () => {
    if (!selectedRuleId) {
      showToast('Please select a rule from the table to remove.', 'error');
      return;
    }
    onRemoveRule(selectedRuleId);
    setSelectedRuleId(null);
    showToast('✓ Discount rule removed.', 'info');
  };

  // Delete All Rules for Product (Frame 0071 [Delete All] button)
  const handleDeleteAll = () => {
    if (!selectedProduct) {
      showToast('Please select a product first.', 'error');
      return;
    }
    const count = rules.filter(r => r.barcode === selectedProduct.barcode).length;
    if (count === 0) {
      showToast(`No discount rules exist for ${selectedProduct.name}.`, 'info');
      return;
    }
    onDeleteAllForProduct(selectedProduct.barcode);
    setSelectedRuleId(null);
    showToast(`✓ Removed all rules for ${selectedProduct.name}.`, 'info');
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Windows Form: frmProductDiscount (Video 10 Frame 0071) */}
      <div
        style={{
          width: isMaximized ? '98vw' : '920px',
          maxWidth: '98vw',
          maxHeight: isMaximized ? '98vh' : undefined,
          backgroundColor: '#f1f5f9',
          border: '2px solid #003399',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px #ffffff inset',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '2px',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar: frmProductDiscount */}
        <div
          style={{
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '2px 8px',
            borderBottom: '1px solid #cbd5e1',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px' }}>📊</span>
            <span style={{ fontSize: '11px', color: '#0f172a', fontWeight: '500' }}>
              frmProductDiscount
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={onClose}
              style={{
                width: '24px',
                height: '18px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close / Minimize"
            >
              _
            </button>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              style={{
                width: '24px',
                height: '18px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Maximize / Restore"
            >
              {isMaximized ? '❐' : '□'}
            </button>
            <button
              onClick={onClose}
              style={{
                width: '28px',
                height: '18px',
                border: '1px solid #ef4444',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {toast && (
          <div
            style={{
              padding: '6px 14px',
              backgroundColor: toast.type === 'error' ? '#fee2e2' : toast.type === 'success' ? '#dcfce7' : '#e0f2fe',
              color: toast.type === 'error' ? '#991b1b' : toast.type === 'success' ? '#166534' : '#0369a1',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #cbd5e1'
            }}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Deep Royal Blue Header Banner: Item / Product Discount (Frame 0071) */}
        <div
          style={{
            background: 'linear-gradient(180deg, #003899 0%, #002277 100%)',
            color: '#ffffff',
            padding: '6px 16px',
            textAlign: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
            letterSpacing: '0.5px',
            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            borderBottom: '2px solid #001a55'
          }}
        >
          Item / Product Discount
        </div>

        {/* Form Controls Strip & Table Area */}
        <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc' }}>
          {/* Top Form Input Row (Frames 0071, 0078, 0090, 0095) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              marginBottom: '12px'
            }}
          >
            {/* Search By Product Name */}
            <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }} ref={dropdownRef}>
              <span style={{ fontSize: '11px', color: '#0f172a', fontWeight: 'bold', marginRight: '6px', whiteSpace: 'nowrap' }}>
                Search By Product Name :
              </span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    height: '24px',
                    width: '22px',
                    backgroundColor: '#e2e8f0',
                    border: '1px solid #94a3b8',
                    borderRight: 'none',
                    borderRadius: '2px 0 0 2px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Select product from catalog"
                >
                  ▼
                </button>
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => {
                    setProductSearch(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  style={{
                    height: '24px',
                    width: '180px',
                    backgroundColor: '#ffffcc',
                    border: '1px solid #94a3b8',
                    borderRadius: '0 2px 2px 0',
                    padding: '2px 6px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#0f172a'
                  }}
                  placeholder="Type product name..."
                />

                {/* Dropdown Auto-Suggest List */}
                {isDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '26px',
                      left: 0,
                      width: '280px',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      backgroundColor: '#ffffff',
                      border: '1px solid #003399',
                      boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                      zIndex: 100000
                    }}
                  >
                    {filteredProducts.map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        style={{
                          padding: '6px 10px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f1f5f9',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: selectedProduct?.id === p.id ? '#eff6ff' : '#ffffff'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.backgroundColor = '#dbeafe';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.backgroundColor = selectedProduct?.id === p.id ? '#eff6ff' : '#ffffff';
                        }}
                      >
                        <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{p.name}</span>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>[{p.barcode}] ₹{p.retailPrice}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Search By Barcode */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#0f172a', fontWeight: 'bold', marginRight: '6px', whiteSpace: 'nowrap' }}>
                Search By Barcode:
              </span>
              <input
                type="text"
                value={barcodeSearch}
                onChange={e => handleBarcodeChange(e.target.value)}
                style={{
                  height: '24px',
                  width: '120px',
                  backgroundColor: '#ffffcc',
                  border: '1px solid #94a3b8',
                  borderRadius: '2px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#0f172a'
                }}
                placeholder="Barcode..."
              />
            </div>

            {/* Min Qty */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#0f172a', fontWeight: 'bold', marginBottom: '2px' }}>
                Min Qty
              </span>
              <input
                type="number"
                step="1"
                min="1"
                value={minQty}
                onChange={e => setMinQty(e.target.value)}
                style={{
                  height: '24px',
                  width: '56px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #003399',
                  borderRadius: '2px',
                  padding: '2px 4px',
                  fontSize: '11px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#0f172a'
                }}
              />
            </div>

            {/* Max Qty */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#0f172a', fontWeight: 'bold', marginBottom: '2px' }}>
                Max Qty
              </span>
              <input
                type="number"
                step="1"
                min="1"
                value={maxQty}
                onChange={e => setMaxQty(e.target.value)}
                style={{
                  height: '24px',
                  width: '56px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #003399',
                  borderRadius: '2px',
                  padding: '2px 4px',
                  fontSize: '11px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#0f172a'
                }}
              />
            </div>

            {/* Discount % */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#0f172a', fontWeight: 'bold', marginBottom: '2px' }}>
                Discount %
              </span>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={discountPercent}
                onChange={e => setDiscountPercent(e.target.value)}
                style={{
                  height: '24px',
                  width: '56px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #003399',
                  borderRadius: '2px',
                  padding: '2px 4px',
                  fontSize: '11px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#0f172a'
                }}
              />
            </div>

            {/* Top [Clear] Button (Frame 0071) */}
            <button
              type="button"
              onClick={handleClear}
              style={{
                marginLeft: '8px',
                height: '28px',
                padding: '0 20px',
                background: 'linear-gradient(180deg, #e53935 0%, #b71c1c 100%)',
                color: '#ffffff',
                border: '1px solid #ffffff',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                letterSpacing: '0.3px'
              }}
              title="Clear entry fields"
            >
              Clear
            </button>

            {/* Top [Add] Button (Frame 0071) */}
            <button
              type="button"
              onClick={handleAddRule}
              style={{
                height: '28px',
                padding: '0 24px',
                background: 'linear-gradient(180deg, #1e88e5 0%, #0d47a1 100%)',
                color: '#ffffff',
                border: '1px solid #ffffff',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                letterSpacing: '0.3px'
              }}
              title="Add or update quantity tier discount rule"
            >
              Add
            </button>
          </div>

          {/* Main Content Area: Data Table + Right Action Buttons Column */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {/* Table Container (Frames 0071, 0090, 0095, 0100) */}
            <div
              style={{
                flex: 1,
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                minHeight: '340px',
                maxHeight: '380px',
                overflowY: 'auto'
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '11px',
                  userSelect: 'none'
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: 'linear-gradient(180deg, #8b0000 0%, #6e0000 100%)',
                      color: '#ffffff',
                      height: '26px'
                    }}
                  >
                    <th style={{ width: '24px', padding: '4px', borderRight: '1px solid #a32222', textAlign: 'center' }}></th>
                    <th style={{ width: '45px', padding: '4px 6px', borderRight: '1px solid #a32222', textAlign: 'center' }}>PID</th>
                    <th style={{ padding: '4px 8px', borderRight: '1px solid #a32222', textAlign: 'left' }}>Product Name</th>
                    <th style={{ width: '100px', padding: '4px 6px', borderRight: '1px solid #a32222', textAlign: 'left' }}>Barcode</th>
                    <th style={{ width: '80px', padding: '4px 6px', borderRight: '1px solid #a32222', textAlign: 'right' }}>Min Qty</th>
                    <th style={{ width: '80px', padding: '4px 6px', borderRight: '1px solid #a32222', textAlign: 'right' }}>MaxQty</th>
                    <th style={{ width: '85px', padding: '4px 6px', textAlign: 'right' }}>Discount %</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRules.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8' }}>
                        <div style={{ fontSize: '24px', marginBottom: '6px' }}>🏷️</div>
                        <div style={{ fontWeight: 'bold' }}>No quantity discount rules defined yet</div>
                        <div style={{ fontSize: '10px', marginTop: '4px' }}>
                          Select product, set Min Qty, Max Qty, and Discount % above, then click [Add].
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedRules.map((rule, idx) => {
                      const isSelected = selectedRuleId === rule.id;
                      const isOdd = idx % 2 === 1;
                      const rowBg = isSelected
                        ? '#dbeafe'
                        : isOdd
                        ? '#fffdf0'
                        : '#ffffff';

                      return (
                        <tr
                          key={rule.id}
                          onClick={() => {
                            setSelectedRuleId(rule.id);
                            setMinQty(String(rule.minQty));
                            setMaxQty(String(rule.maxQty));
                            setDiscountPercent(String(rule.discountPercent));
                          }}
                          style={{
                            backgroundColor: rowBg,
                            height: '24px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #e2e8f0'
                          }}
                        >
                          {/* Row Indicator ▶ */}
                          <td
                            style={{
                              textAlign: 'center',
                              color: isSelected ? '#003399' : '#b91c1c',
                              fontWeight: 'bold',
                              borderRight: '1px solid #e2e8f0'
                            }}
                          >
                            {isSelected ? '▶' : ''}
                          </td>
                          <td style={{ textAlign: 'center', borderRight: '1px solid #e2e8f0', color: '#334155', fontWeight: '500' }}>
                            {rule.pid}
                          </td>
                          <td style={{ padding: '2px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 'bold', color: '#0f172a' }}>
                            {rule.productName}
                          </td>
                          <td style={{ padding: '2px 6px', borderRight: '1px solid #e2e8f0', color: '#475569', fontFamily: 'monospace' }}>
                            {rule.barcode}
                          </td>
                          <td style={{ padding: '2px 6px', borderRight: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '500' }}>
                            {rule.minQty.toFixed(3)}
                          </td>
                          <td style={{ padding: '2px 6px', borderRight: '1px solid #e2e8f0', textAlign: 'right', fontWeight: '500' }}>
                            {rule.maxQty.toFixed(3)}
                          </td>
                          <td style={{ padding: '2px 6px', textAlign: 'right', fontWeight: 'bold', color: rule.discountPercent > 0 ? '#15803d' : '#64748b' }}>
                            {rule.discountPercent.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Right Action Button Column (Frames 0071, 0090, 0095, 0100) */}
            <div
              style={{
                width: '120px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingTop: '2px'
              }}
            >
              {/* [ Add ] (Frame 0071) */}
              <button
                type="button"
                onClick={handleAddRule}
                style={{
                  height: '30px',
                  background: 'linear-gradient(180deg, #1e88e5 0%, #0d47a1 100%)',
                  color: '#ffffff',
                  border: '1px solid #ffffff',
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Add
              </button>

              {/* [ Remove ] (Frame 0071) */}
              <button
                type="button"
                onClick={handleRemove}
                disabled={!selectedRuleId}
                style={{
                  height: '30px',
                  background: selectedRuleId ? 'linear-gradient(180deg, #e53935 0%, #b71c1c 100%)' : '#94a3b8',
                  color: '#ffffff',
                  border: '1px solid #ffffff',
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: selectedRuleId ? 'pointer' : 'not-allowed',
                  opacity: selectedRuleId ? 1 : 0.6
                }}
              >
                Remove
              </button>

              {/* [ Show All Data ] (Frame 0071) */}
              <button
                type="button"
                onClick={() => setShowAllData(!showAllData)}
                style={{
                  height: '30px',
                  background: showAllData ? 'linear-gradient(180deg, #059669 0%, #047857 100%)' : 'linear-gradient(180deg, #1e88e5 0%, #0d47a1 100%)',
                  color: '#ffffff',
                  border: '1px solid #ffffff',
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
                title={showAllData ? "Showing all products - Click to filter by current product" : "Click to view all rules across all products"}
              >
                {showAllData ? 'Show Selected' : 'Show All Data'}
              </button>

              {/* [ Delete All ] (Frame 0071) */}
              <button
                type="button"
                onClick={handleDeleteAll}
                style={{
                  height: '30px',
                  background: 'linear-gradient(180deg, #e53935 0%, #b71c1c 100%)',
                  color: '#ffffff',
                  border: '1px solid #ffffff',
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
                title="Delete all discount rules for active product"
              >
                Delete All
              </button>

              <div style={{ flex: 1 }} />

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                style={{
                  height: '28px',
                  backgroundColor: '#64748b',
                  color: '#ffffff',
                  border: '1px solid #475569',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Close (ESC)
              </button>
            </div>
          </div>

          {/* Quick Info Bar */}
          <div
            style={{
              marginTop: '10px',
              padding: '6px 12px',
              backgroundColor: '#e2e8f0',
              border: '1px solid #cbd5e1',
              borderRadius: '3px',
              fontSize: '11px',
              color: '#334155',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              Active Product: <strong>{selectedProduct ? `${selectedProduct.name} [Barcode: ${selectedProduct.barcode}]` : 'None'}</strong>
            </div>
            <div>
              Rules for this item: <strong>{rules.filter(r => r.barcode === selectedProduct?.barcode).length} tiers</strong>
              {showAllData && <span style={{ marginLeft: '12px', color: '#15803d', fontWeight: 'bold' }}>• Displaying All ({rules.length} total)</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
