import { useState, useRef } from 'react';
import type { Product, Customer, CompanyInfo, CartItem, EstimateRecord } from '../../types/retailDaddy';

interface EstimateDeliveryNoteViewProps {
  products: Product[];
  customers: Customer[];
  companyInfo: CompanyInfo;
  estimates: EstimateRecord[];
  onSaveEstimate: (estimate: EstimateRecord) => void;
  onClose: () => void;
  onOpenCustomerModal?: () => void;
  onOpenProductModal?: () => void;
}

export function EstimateDeliveryNoteView({
  products,
  customers,
  companyInfo,
  estimates,
  onSaveEstimate,
  onClose,
  onOpenCustomerModal,
  onOpenProductModal
}: EstimateDeliveryNoteViewProps) {
  // Navigation & Estimate Info (Frame 0025)
  const [currentEstimateIndex, setCurrentEstimateIndex] = useState<number>(0);
  const [estimateNo, setEstimateNo] = useState<string>(`ESTM-${String(estimates.length + 1).padStart(4, '0')}-2024/25`);
  const [estimateDate, setEstimateDate] = useState<string>('25/02/2025');
  const [remarks, setRemarks] = useState<string>('Deliver via direct transport to store branch');

  // Customer Details (Frame 0025)
  const defaultCust = customers.find(c => c.phone === '9898989898') || customers[0] || {
    id: 'C-0004',
    name: 'SUMESH_9898989898',
    phone: '9898989898',
    state: 'Kerala',
    balance: 0,
    loyaltyPoints: 0
  };

  const [customerId, setCustomerId] = useState<string>(defaultCust.id || 'C-0004');
  const [contactNo, setContactNo] = useState<string>(defaultCust.phone || '9898989898');
  const [customerName, setCustomerName] = useState<string>(defaultCust.name || 'SUMESH_9898989898');
  const [state, setState] = useState<string>(defaultCust.state || 'Kerala');
  const [gstin, setGstin] = useState<string>(defaultCust.gstin || '0');

  // Price Mode & Memory Checks (Frame 0025)
  const [priceMode, setPriceMode] = useState<'RETAIL' | 'WHOLESALE'>('RETAIL');
  const [checkCustLastPrice, setCheckCustLastPrice] = useState(false);
  const [checkProdLastPrice, setCheckProdLastPrice] = useState(false);
  const [checkProdPurchasePrice, setCheckProdPurchasePrice] = useState(false);
  const [speedEntry, setSpeedEntry] = useState(false);
  const [showProductImage, setShowProductImage] = useState(true);
  const [billTemplate, setBillTemplate] = useState<'A4 Size' | '3 Inch Thermal'>('A4 Size');

  // Product Row Input State (Frame 0025)
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [entryQty, setEntryQty] = useState<number>(1);
  const [entryUnit, setEntryUnit] = useState<string>('Unit');
  const [entryRate, setEntryRate] = useState<number>(products[0]?.retailPrice || 500);
  const [entryDiscType, setEntryDiscType] = useState<'%' | 'Amt'>('%');
  const [entryDiscVal, setEntryDiscVal] = useState<number>(0);

  // Cart Items
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (estimates.length > 0 && estimates[0].items) {
      return [...estimates[0].items];
    }
    return [
      {
        id: 'est-it-1',
        productId: 'prod-radio',
        pCode: 'P-1239',
        name: 'Radio',
        barcode: '3466',
        qty: 1,
        rate: 500.0,
        mrp: 500.0,
        purchasePrice: 100.0,
        discPercent: 0,
        discAmt: 0,
        discType: '%',
        taxable: 423.72,
        cgstPercent: 9,
        sgstPercent: 9,
        igstPercent: 0,
        cgstAmt: 38.14,
        sgstAmt: 38.14,
        igstAmt: 0,
        total: 500.0,
        salesman: 'Sukumar',
        commissionPercent: 0,
        commissionAmt: 0,
        stockId: 'STK-01',
        points: 0,
        unit: 'KGS',
        hsn: '0'
      },
      {
        id: 'est-it-2',
        productId: 'prod-date-roll-cake',
        pCode: 'P-80051',
        name: 'DATE ROLL EURO CAKE',
        barcode: '650276',
        qty: 1,
        rate: 563.0,
        mrp: 563.0,
        purchasePrice: 400.0,
        discPercent: 0,
        discAmt: 0,
        discType: '%',
        taxable: 477.12,
        cgstPercent: 9,
        sgstPercent: 9,
        igstPercent: 0,
        cgstAmt: 42.94,
        sgstAmt: 42.94,
        igstAmt: 0,
        total: 563.0,
        salesman: 'Sukumar',
        commissionPercent: 0,
        commissionAmt: 0,
        stockId: 'STK-02',
        points: 0,
        unit: 'PCS',
        hsn: '80051'
      }
    ];
  });

  const [selectedCartIdx, setSelectedCartIdx] = useState<number | null>(null);

  // Print Preview Modal State (Frame 0035)
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printCopies, setPrintCopies] = useState<number>(1);
  const [emailId, setEmailId] = useState<string>('');
  const [whatsappPhone, setWhatsappPhone] = useState<string>('9898989898');
  const [whatsappMessage, setWhatsappMessage] = useState<string>(
    'Dear Sir/Madam, Please find the attached Estimate / Delivery Note from OLIVE SHOP. Thank you!'
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Math Calculations (Frame 0025)
  const grossSubTotal = cartItems.reduce((acc, it) => acc + it.total, 0);
  const roundOff = 0.0;
  const grandTotal = grossSubTotal + roundOff;

  // Selected Product Information
  const activeProduct = products.find(p => p.id === selectedProductId) || products[0];
  const stockAvailable = activeProduct ? activeProduct.openingStock.toFixed(3) : '784.000';

  // Add Item to Cart
  const handleAddToCart = () => {
    if (!activeProduct) return;
    const baseRate = entryRate > 0 ? entryRate : (priceMode === 'WHOLESALE' && activeProduct.wholesalePrice ? activeProduct.wholesalePrice : activeProduct.retailPrice);
    const discAmount = entryDiscType === '%' ? (baseRate * entryQty * entryDiscVal) / 100 : entryDiscVal;
    const lineTotal = (baseRate * entryQty) - discAmount;

    const newItem: CartItem = {
      id: `est-it-${Date.now()}`,
      productId: activeProduct.id,
      pCode: activeProduct.pCode,
      name: activeProduct.name,
      barcode: activeProduct.barcode || barcodeInput || '3466',
      qty: entryQty,
      rate: baseRate,
      mrp: activeProduct.mrp,
      purchasePrice: activeProduct.purchasePrice || 0,
      discPercent: entryDiscType === '%' ? entryDiscVal : 0,
      discAmt: discAmount,
      discType: entryDiscType,
      taxable: lineTotal / 1.18,
      cgstPercent: 9,
      sgstPercent: 9,
      igstPercent: 0,
      cgstAmt: (lineTotal / 1.18) * 0.09,
      sgstAmt: (lineTotal / 1.18) * 0.09,
      igstAmt: 0,
      total: lineTotal,
      salesman: 'Sukumar',
      commissionPercent: 0,
      commissionAmt: 0,
      stockId: 'STK-01',
      points: 0,
      unit: entryUnit,
      hsn: activeProduct.hsn || '80051',
      photo: activeProduct.photo
    };

    setCartItems([...cartItems, newItem]);
    showToast(`Added ${activeProduct.name} to Estimate`);
    setEntryQty(1);
    setEntryDiscVal(0);
    setBarcodeInput('');
  };

  const handleRemoveItem = () => {
    if (selectedCartIdx === null) {
      showToast('Select a line item to remove');
      return;
    }
    const updated = [...cartItems];
    updated.splice(selectedCartIdx, 1);
    setCartItems(updated);
    setSelectedCartIdx(null);
    showToast('Item removed from cart');
  };

  const handleSave = () => {
    const newRecord: EstimateRecord = {
      id: `estm-${Date.now()}`,
      estimateNo,
      date: estimateDate,
      customerId,
      customerName,
      contactNo,
      state,
      gstin,
      remarks,
      items: [...cartItems],
      subTotal: grossSubTotal,
      totalDiscount: 0,
      roundOff,
      grandTotal
    };
    onSaveEstimate(newRecord);
    showToast(`✅ Estimate ${estimateNo} saved successfully!`);
  };

  const handleNavigate = (direction: 'first' | 'prev' | 'next' | 'last') => {
    if (estimates.length === 0) return;
    let nextIdx = currentEstimateIndex;
    if (direction === 'first') nextIdx = 0;
    else if (direction === 'last') nextIdx = estimates.length - 1;
    else if (direction === 'prev') nextIdx = Math.max(0, currentEstimateIndex - 1);
    else if (direction === 'next') nextIdx = Math.min(estimates.length - 1, currentEstimateIndex + 1);

    setCurrentEstimateIndex(nextIdx);
    const est = estimates[nextIdx];
    if (est) {
      setEstimateNo(est.estimateNo);
      setEstimateDate(est.date);
      setCustomerId(est.customerId);
      setCustomerName(est.customerName);
      setContactNo(est.contactNo);
      setState(est.state);
      setGstin(est.gstin || '0');
      setRemarks(est.remarks || '');
      setCartItems([...est.items]);
      showToast(`Loaded ${est.estimateNo}`);
    }
  };

  return (
    <div className="rd-window" style={{ background: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Banner */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '8px 16px',
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '12px',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          borderLeft: '4px solid #22c55e'
        }}>
          {toastMsg}
        </div>
      )}

      {/* 1. TOP TITLEBAR (Frame 0025) */}
      <div style={{
        background: 'linear-gradient(180deg, #003366 0%, #001a33 100%)',
        color: '#ffffff',
        padding: '6px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #002244'
      }}>
        <div style={{ fontSize: '15px', fontWeight: '900', letterSpacing: '0.05em' }}>
          ESTIMATE / DELIVERY NOTE
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', cursor: 'pointer' }} title="Notifications">🔔</button>
          <button style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', cursor: 'pointer' }} title="Weighing Scale Integration">⚖️</button>
          <button style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', cursor: 'pointer' }} title="Voice Announcements">🔊</button>
          <button style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', cursor: 'pointer' }} title="Settings">⚙️</button>
          <button
            style={{ background: '#dc2626', border: 'none', color: '#fff', fontWeight: 'bold', fontSize: '12px', padding: '2px 8px', borderRadius: '3px', cursor: 'pointer', marginLeft: '6px' }}
            onClick={onClose}
          >
            ✕ Close
          </button>
        </div>
      </div>

      <div style={{ padding: '8px 12px', display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1, overflowY: 'auto' }}>
        {/* 2. ESTIMATE INFO + CUSTOMER DETAILS (Frame 0025) */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 140px', gap: '8px', width: '100%' }}>
          {/* Box 1: Estimate Info */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '3px', padding: '6px 8px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#0369a1', marginBottom: '4px', textTransform: 'uppercase' }}>
              Estimate Info
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', width: '80px' }}>Estimate No. :</span>
              <input
                type="text"
                className="rd-pos-input"
                style={{ flex: 1, fontWeight: 'bold', background: '#f8fafc' }}
                value={estimateNo}
                onChange={e => setEstimateNo(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '2px' }}>
                <button type="button" className="rd-grid-btn" style={{ padding: '1px 5px', fontSize: '10px' }} onClick={() => handleNavigate('first')}>|&lt;</button>
                <button type="button" className="rd-grid-btn" style={{ padding: '1px 5px', fontSize: '10px' }} onClick={() => handleNavigate('prev')}>&lt;&lt;</button>
                <button type="button" className="rd-grid-btn" style={{ padding: '1px 5px', fontSize: '10px' }} onClick={() => handleNavigate('next')}>&gt;&gt;</button>
                <button type="button" className="rd-grid-btn" style={{ padding: '1px 5px', fontSize: '10px' }} onClick={() => handleNavigate('last')}>&gt;|</button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', width: '80px' }}>Date :</span>
              <input
                type="text"
                className="rd-pos-input"
                style={{ width: '100px', textAlign: 'center' }}
                value={estimateDate}
                onChange={e => setEstimateDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', width: '80px' }}>Remarks :</span>
              <input
                type="text"
                className="rd-pos-input"
                style={{ flex: 1, background: '#fef9c3' }}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>
          </div>

          {/* Box 2: Customer Details */}
          <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '3px', padding: '6px 8px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#0369a1', marginBottom: '4px', textTransform: 'uppercase' }}>
              Customer Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', width: '90px' }}>Customer ID :</span>
                <input
                  type="text"
                  readOnly
                  className="rd-pos-input"
                  style={{ width: '100px', background: '#f1f5f9' }}
                  value={customerId}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', width: '90px' }}>Contact No. : *</span>
                <input
                  type="text"
                  className="rd-pos-input"
                  style={{ flex: 1, background: '#fef9c3', fontWeight: 'bold' }}
                  value={contactNo}
                  onChange={e => setContactNo(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', gridColumn: 'span 2' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', width: '90px' }}>Customer Name : *</span>
                <select
                  className="rd-pos-input"
                  style={{ flex: 1, fontWeight: 'bold', background: '#fef9c3' }}
                  value={customerName}
                  onChange={e => {
                    setCustomerName(e.target.value);
                    const matched = customers.find(c => c.name === e.target.value);
                    if (matched) {
                      setContactNo(matched.phone);
                      setState(matched.state || 'Kerala');
                      setGstin(matched.gstin || '0');
                      setCustomerId(matched.id || 'C-0004');
                    }
                  }}
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="rd-grid-btn"
                  style={{ background: '#2563eb', color: '#ffffff', padding: '2px 8px', fontWeight: 'bold' }}
                  onClick={onOpenCustomerModal}
                  title="Add New Customer"
                >
                  +
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', width: '90px' }}>State :</span>
                <input
                  type="text"
                  className="rd-pos-input"
                  style={{ width: '130px' }}
                  value={state}
                  onChange={e => setState(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', width: '90px' }}>GSTIN :</span>
                <input
                  type="text"
                  className="rd-pos-input"
                  style={{ width: '130px' }}
                  value={gstin}
                  onChange={e => setGstin(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Box 3: Product Image Placeholder */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '3px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            color: '#64748b',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '4px'
          }}>
            {activeProduct?.photo ? (
              <img src={activeProduct.photo} alt="Item" style={{ maxHeight: '70px', maxWidth: '100%', objectFit: 'contain' }} />
            ) : (
              <div>
                <div style={{ fontSize: '24px', opacity: 0.3 }}>🖼️</div>
                <div style={{ fontSize: '9px', marginTop: '2px' }}>NO IMAGE AVAILABLE</div>
              </div>
            )}
          </div>
        </div>

        {/* 3. PRODUCT INFO INPUT ROW (Frame 0025) */}
        <div style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '3px', padding: '8px' }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#0369a1', marginBottom: '6px', textTransform: 'uppercase' }}>
            Product Info
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Product Name :</span>
            <select
              className="rd-pos-input"
              style={{ width: '220px', background: '#fef9c3', fontWeight: 'bold' }}
              value={selectedProductId}
              onChange={e => {
                setSelectedProductId(e.target.value);
                const p = products.find(x => x.id === e.target.value);
                if (p) {
                  setEntryRate(priceMode === 'WHOLESALE' && p.wholesalePrice ? p.wholesalePrice : p.retailPrice);
                  setBarcodeInput(p.barcode);
                  setEntryUnit(p.salesUnit || 'Unit');
                }
              }}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.barcode}]
                </option>
              ))}
            </select>

            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: '#0284c7', color: '#fff', fontSize: '10px', padding: '2px 6px' }}
              onClick={() => showToast('Part Wise Search Modal Active')}
            >
              Part Wise Search
            </button>

            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: '#16a34a', color: '#fff', fontSize: '10px', padding: '2px 6px' }}
              onClick={onOpenProductModal}
            >
              +
            </button>

            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Barcode :</span>
            <input
              ref={barcodeInputRef}
              type="text"
              className="rd-pos-input"
              style={{ width: '100px' }}
              value={barcodeInput}
              onChange={e => {
                setBarcodeInput(e.target.value);
                const matched = products.find(p => p.barcode === e.target.value.trim());
                if (matched) {
                  setSelectedProductId(matched.id);
                  setEntryRate(priceMode === 'WHOLESALE' && matched.wholesalePrice ? matched.wholesalePrice : matched.retailPrice);
                  setEntryUnit(matched.salesUnit || 'Unit');
                }
              }}
            />

            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Quantity : *</span>
            <input
              type="number"
              min="0.001"
              step="any"
              className="rd-pos-input"
              style={{ width: '60px', textAlign: 'center', background: '#fef9c3', fontWeight: 'bold' }}
              value={entryQty}
              onChange={e => setEntryQty(parseFloat(e.target.value) || 1)}
            />

            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Unit : *</span>
            <select
              className="rd-pos-input"
              style={{ width: '75px', background: '#fef9c3' }}
              value={entryUnit}
              onChange={e => setEntryUnit(e.target.value)}
            >
              <option value="Unit">Unit</option>
              <option value="PCS">PCS</option>
              <option value="KGS">KGS</option>
              <option value="BOX">BOX</option>
              <option value="BAGS">BAGS</option>
            </select>

            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Price/Main Unit *</span>
            <input
              type="number"
              step="any"
              className="rd-pos-input"
              style={{ width: '80px', textAlign: 'right', fontWeight: 'bold' }}
              value={entryRate}
              onChange={e => setEntryRate(parseFloat(e.target.value) || 0)}
            />

            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Disc :</span>
            <select
              className="rd-pos-input"
              style={{ width: '55px' }}
              value={entryDiscType}
              onChange={e => setEntryDiscType(e.target.value as '%' | 'Amt')}
            >
              <option value="%">%</option>
              <option value="Amt">Amt</option>
            </select>

            <input
              type="number"
              step="any"
              className="rd-pos-input"
              style={{ width: '60px', textAlign: 'center' }}
              value={entryDiscVal}
              onChange={e => setEntryDiscVal(parseFloat(e.target.value) || 0)}
            />

            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Total Amount :</span>
            <input
              type="text"
              readOnly
              className="rd-pos-input"
              style={{ width: '90px', textAlign: 'right', background: '#f1f5f9', fontWeight: 'bold', color: '#15803d' }}
              value={`₹${((entryRate * entryQty) - (entryDiscType === '%' ? (entryRate * entryQty * entryDiscVal) / 100 : entryDiscVal)).toFixed(2)}`}
            />
          </div>

          {/* Sub-row controls (Frame 0025) */}
          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', flexWrap: 'wrap' }}>
            <span style={{ color: '#0369a1', fontWeight: 'bold' }}>
              Current Stock Available : <span style={{ color: '#0f172a' }}>{stockAvailable}</span>
            </span>
            <span style={{ color: '#dc2626', fontWeight: 'bold' }}>Alt Unit x 1</span>

            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input type="checkbox" checked={checkCustLastPrice} onChange={e => setCheckCustLastPrice(e.target.checked)} />
              <span>Customer's Last Sold Price :</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input type="checkbox" checked={checkProdLastPrice} onChange={e => setCheckProdLastPrice(e.target.checked)} />
              <span>Product's Last Sold Price :</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input type="checkbox" checked={checkProdPurchasePrice} onChange={e => setCheckProdPurchasePrice(e.target.checked)} />
              <span>Product's Purchase Price :</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input type="checkbox" checked={speedEntry} onChange={e => setSpeedEntry(e.target.checked)} />
              <span>Speed Entry</span>
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <input
                  type="radio"
                  name="priceModeEst"
                  checked={priceMode === 'RETAIL'}
                  onChange={() => setPriceMode('RETAIL')}
                />
                <span>Retail</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <input
                  type="radio"
                  name="priceModeEst"
                  checked={priceMode === 'WHOLESALE'}
                  onChange={() => setPriceMode('WHOLESALE')}
                />
                <span>Wholesale</span>
              </label>
            </div>
          </div>

          {/* Action Buttons Bar (Frame 0025) */}
          <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: '#0284c7', color: '#fff', fontWeight: 'bold', fontSize: '11px', padding: '4px 10px' }}
              onClick={() => barcodeInputRef.current?.focus()}
            >
              Barcode Scan
            </button>
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: '#0284c7', color: '#fff', fontWeight: 'bold', fontSize: '11px', padding: '4px 10px' }}
              onClick={() => {
                setEntryQty(1);
                setEntryDiscVal(0);
                setBarcodeInput('');
              }}
            >
              Reset
            </button>
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: '#dc2626', color: '#fff', fontWeight: 'bold', fontSize: '11px', padding: '4px 10px' }}
              onClick={handleRemoveItem}
            >
              Remove
            </button>
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: '#0284c7', color: '#fff', fontWeight: 'bold', fontSize: '11px', padding: '4px 10px' }}
              onClick={() => showToast('Line item ready for editing')}
            >
              Edit
            </button>
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: '#16a34a', color: '#fff', fontWeight: 'bold', fontSize: '11px', padding: '4px 14px', marginLeft: 'auto' }}
              onClick={handleAddToCart}
            >
              + Add To Cart
            </button>
          </div>
        </div>

        {/* 4. MAIN CART GRID & SIDE ACTION BAR (Frame 0025) */}
        <div style={{ display: 'flex', gap: '8px', width: '100%', minHeight: '260px' }}>
          {/* Table */}
          <div style={{ flex: 1, background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '3px', overflowY: 'auto' }}>
            <table className="rd-data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#002b55', color: '#ffffff' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #001a33' }}>Product Name</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #001a33' }}>Barcode</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #001a33' }}>Main Qty</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #001a33' }}>Price / Main Unit</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #001a33' }}>Discount %</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #001a33' }}>Discount</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', border: '1px solid #001a33' }}>Total Amount</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #001a33' }}>Alt Qty</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #001a33' }}>Alt Unit</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No products added to estimate. Use the Product Info panel above to add items.
                    </td>
                  </tr>
                ) : (
                  cartItems.map((it, idx) => (
                    <tr
                      key={it.id || idx}
                      style={{
                        background: selectedCartIdx === idx ? '#dbeafe' : (idx % 2 === 0 ? '#f8fafc' : '#ffffff'),
                        cursor: 'pointer',
                        borderBottom: '1px solid #e2e8f0'
                      }}
                      onClick={() => setSelectedCartIdx(idx)}
                    >
                      <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>{it.name}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{it.barcode}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 'bold' }}>{it.qty.toFixed(3)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{it.rate.toFixed(2)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{it.discPercent.toFixed(2)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{it.discAmt.toFixed(2)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>{it.total.toFixed(2)}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>0.000</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>{it.unit || 'Unit'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Right Action Buttons Strip (Frame 0025) */}
          <div style={{
            width: '120px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            background: '#ffffff',
            padding: '8px',
            border: '1px solid #cbd5e1',
            borderRadius: '3px'
          }}>
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: '#002b55', color: '#fff', fontWeight: 'bold', fontSize: '11px', padding: '6px 0' }}
              onClick={() => {
                setCartItems([]);
                setSelectedCartIdx(null);
                setEstimateNo(`ESTM-${String(estimates.length + 2).padStart(4, '0')}-2024/25`);
                showToast('New Estimate Sheet initialized');
              }}
            >
              New
            </button>

            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: '#16a34a', color: '#fff', fontWeight: 'bold', fontSize: '11px', padding: '6px 0' }}
              onClick={handleSave}
            >
              Save
            </button>

            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: '#002b55', color: '#fff', fontWeight: 'bold', fontSize: '11px', padding: '6px 0' }}
              onClick={handleSave}
            >
              Update
            </button>

            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: '#dc2626', color: '#fff', fontWeight: 'bold', fontSize: '11px', padding: '6px 0' }}
              onClick={() => {
                if (window.confirm('Delete this estimate record?')) {
                  setCartItems([]);
                  showToast('Estimate deleted');
                }
              }}
            >
              Delete
            </button>

            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: '#002b55', color: '#fff', fontWeight: 'bold', fontSize: '11px', padding: '6px 0' }}
              onClick={() => showToast('Loading estimate archives...')}
            >
              Get Data
            </button>

            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: '#002b55', color: '#fff', fontWeight: 'bold', fontSize: '11px', padding: '6px 0' }}
              onClick={() => setShowPrintPreview(true)}
            >
              Print
            </button>

            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: '#002b55', color: '#fff', fontWeight: 'bold', fontSize: '11px', padding: '6px 0' }}
              onClick={() => showToast(`Token generated: #${Math.floor(100 + Math.random() * 900)}`)}
            >
              Token
            </button>

            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#16a34a', fontWeight: 'bold', marginTop: '6px' }}>
              <input
                type="checkbox"
                checked={showProductImage}
                onChange={e => setShowProductImage(e.target.checked)}
              />
              <span>Product Image Show</span>
            </label>

            <div style={{ marginTop: '4px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>Bill Template :</div>
              <select
                className="rd-pos-input"
                style={{ width: '100%', background: '#800000', color: '#ffffff', fontWeight: 'bold', fontSize: '10px' }}
                value={billTemplate}
                onChange={e => setBillTemplate(e.target.value as any)}
              >
                <option value="A4 Size">A4 Size</option>
                <option value="3 Inch Thermal">3 Inch Thermal</option>
              </select>
            </div>
          </div>
        </div>

        {/* 5. BOTTOM TOTALS (Frame 0025) */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: '16px', background: '#ffffff', padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Total :</span>
            <input
              type="text"
              readOnly
              className="rd-pos-input"
              style={{ width: '100px', textAlign: 'right', fontWeight: 'bold', background: '#f1f5f9' }}
              value={grossSubTotal.toFixed(2)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Round Off :</span>
            <input type="checkbox" defaultChecked />
            <input
              type="text"
              readOnly
              className="rd-pos-input"
              style={{ width: '80px', textAlign: 'right', fontWeight: 'bold', background: '#f1f5f9' }}
              value="0.00"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: '900', color: '#0369a1' }}>Grand Total :</span>
            <input
              type="text"
              readOnly
              className="rd-pos-input"
              style={{ width: '120px', textAlign: 'right', fontWeight: '900', fontSize: '14px', background: '#fef08a', color: '#0f172a' }}
              value={grandTotal.toFixed(2)}
            />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. ESTIMATE PRINT PREVIEW MODAL (Video 16 Frame 0035)   */}
      {/* ======================================================== */}
      {showPrintPreview && (
        <div className="rd-modal-overlay">
          <div className="rd-dialog" style={{ width: '95vw', height: '94vh', display: 'flex', flexDirection: 'column', background: '#94a3b8' }}>
            {/* Title Bar */}
            <div className="rd-dialog-titlebar" style={{ background: '#002b55', color: '#ffffff', display: 'flex', justifyContent: 'space-between', padding: '6px 12px' }}>
              <span>Print Preview — Estimate / Delivery Note</span>
              <button
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                onClick={() => setShowPrintPreview(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Left Action Sidebar (Frame 0035) */}
              <div style={{
                width: '180px',
                background: '#ffffff',
                borderRight: '1px solid #cbd5e1',
                padding: '10px 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '11px',
                flexShrink: 0,
                overflowY: 'auto'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold' }}>No(s) of Copy :</span>
                  <input
                    type="number"
                    min="1"
                    className="rd-pos-input"
                    style={{ width: '45px', textAlign: 'center' }}
                    value={printCopies}
                    onChange={e => setPrintCopies(parseInt(e.target.value) || 1)}
                  />
                </div>

                {/* Big Blue Print [F6] */}
                <button
                  type="button"
                  style={{
                    height: '56px',
                    background: '#ffffff',
                    border: '2px solid #2563eb',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => window.print()}
                >
                  <span style={{ fontSize: '24px' }}>🖨️</span>
                  <span style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '10px' }}>F6 Print</span>
                </button>

                {/* Big Red PDF [F7] */}
                <button
                  type="button"
                  style={{
                    height: '56px',
                    background: '#ffffff',
                    border: '2px solid #dc2626',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    window.print();
                    showToast('PDF Export triggered');
                  }}
                >
                  <span style={{ fontSize: '22px', color: '#dc2626', fontWeight: '900' }}>PDF</span>
                  <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '10px' }}>F7 Export</span>
                </button>

                {/* Email Section */}
                <span style={{ fontWeight: 'bold', marginTop: '4px' }}>Enter Valid Email ID :</span>
                <input
                  type="email"
                  className="rd-pos-input"
                  style={{ width: '100%' }}
                  placeholder="name@domain.com"
                  value={emailId}
                  onChange={e => setEmailId(e.target.value)}
                />

                <button
                  type="button"
                  style={{
                    height: '50px',
                    background: '#ffffff',
                    border: '2px solid #ea580c',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    if (!emailId) {
                      alert('Please enter a valid email address.');
                      return;
                    }
                    showToast(`Estimate sent to ${emailId}`);
                  }}
                >
                  <span style={{ fontSize: '20px' }}>✉️</span>
                  <span style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '10px' }}>F8 Email</span>
                </button>

                {/* WhatsApp Section */}
                <span style={{ fontWeight: 'bold', marginTop: '4px' }}>Enter Valid WhatsApp No. :</span>
                <input
                  type="text"
                  className="rd-pos-input"
                  style={{ width: '100%', fontWeight: 'bold' }}
                  value={whatsappPhone}
                  onChange={e => setWhatsappPhone(e.target.value)}
                />

                <span style={{ fontWeight: 'bold' }}>Text Message to WhatsApp :</span>
                <textarea
                  className="rd-pos-input"
                  rows={3}
                  style={{ width: '100%', resize: 'none', fontSize: '10px' }}
                  value={whatsappMessage}
                  onChange={e => setWhatsappMessage(e.target.value)}
                />

                {/* 3 WhatsApp Gateway Buttons (Frame 0035) */}
                <button
                  type="button"
                  style={{
                    background: '#ffffff',
                    border: '2px solid #16a34a',
                    borderRadius: '4px',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    color: '#15803d'
                  }}
                  onClick={() => {
                    const clean = whatsappPhone.replace(/\D/g, '');
                    window.open(`https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(whatsappMessage)}`, '_blank');
                  }}
                >
                  <span style={{ fontSize: '16px' }}>💬</span>
                  <span>Tejas</span>
                </button>

                <button
                  type="button"
                  style={{
                    background: '#ffffff',
                    border: '2px solid #16a34a',
                    borderRadius: '4px',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    color: '#15803d'
                  }}
                  onClick={() => {
                    const clean = whatsappPhone.replace(/\D/g, '');
                    window.open(`https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(whatsappMessage)}`, '_blank');
                  }}
                >
                  <span style={{ fontSize: '16px' }}>💬</span>
                  <span>Rocket</span>
                </button>

                <button
                  type="button"
                  style={{
                    background: '#ffffff',
                    border: '2px solid #16a34a',
                    borderRadius: '4px',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    color: '#15803d'
                  }}
                  onClick={() => {
                    const clean = whatsappPhone.replace(/\D/g, '');
                    window.open(`https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(whatsappMessage)}`, '_blank');
                  }}
                >
                  <span style={{ fontSize: '16px' }}>💬</span>
                  <span>Agni - F9</span>
                </button>
              </div>

              {/* Main Document Preview (Frame 0035) */}
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  width: '640px',
                  minHeight: '880px',
                  background: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                  padding: '24px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  fontSize: '11px',
                  fontFamily: 'Arial, sans-serif'
                }}>
                  {/* Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px' }}>
                    <div style={{
                      width: '100px',
                      height: '80px',
                      border: '1px solid #cbd5e1',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      <div>NO LOGO</div>
                      <div>AVAILABLE</div>
                    </div>

                    <div style={{ textAlign: 'center', flex: 1, padding: '0 12px' }}>
                      <div style={{ fontSize: '20px', fontWeight: '900', color: '#002b55' }}>
                        {companyInfo.name || 'OLIVE SHOP'}
                      </div>
                      <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>
                        {companyInfo.address || 'YOUR ADDRESS YOUR ADDRESS YOUR ADDRESS'}
                      </div>
                      <div style={{ fontSize: '10px', color: '#475569' }}>
                        {companyInfo.state || 'Kerala'} • Contact No. : {companyInfo.phone || '123456789'}
                      </div>
                      <div style={{ fontSize: '10px', color: '#475569' }}>
                        Email : {companyInfo.email || 'yourmailid@gmail.com'}
                      </div>
                      <div style={{ fontSize: '10px', color: '#475569', fontWeight: 'bold' }}>
                        GSTIN : {companyInfo.gstin || '1234454444444'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        background: '#dc2626',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '2px',
                        display: 'inline-block',
                        marginBottom: '6px'
                      }}>
                        Estimate / Delivery Note
                      </div>
                      <div style={{ fontSize: '10px' }}><strong>E. No. :</strong> {estimateNo}</div>
                      <div style={{ fontSize: '10px' }}><strong>Date :</strong> {estimateDate}</div>
                    </div>
                  </div>

                  {/* Customer Details Ribbon */}
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ background: '#002b55', color: '#ffffff', fontWeight: 'bold', padding: '3px 8px', fontSize: '11px' }}>
                      Customer Details
                    </div>
                    <div style={{ padding: '6px 8px', border: '1px solid #cbd5e1', borderTop: 'none', lineHeight: '1.5' }}>
                      <div style={{ fontWeight: 'bold' }}>{customerName}</div>
                      <div>local, localcity</div>
                      <div>{state}</div>
                      <div>Contact No. : {contactNo}</div>
                      <div>GSTIN/UID : {gstin || '0'}</div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #000', borderTop: '1px solid #000' }}>
                        <th style={{ padding: '4px', textAlign: 'center', width: '35px' }}>Sl No</th>
                        <th style={{ padding: '4px', textAlign: 'left' }}>Product Name</th>
                        <th style={{ padding: '4px', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '4px', textAlign: 'right' }}>Rate</th>
                        <th style={{ padding: '4px', textAlign: 'center' }}>Disc %</th>
                        <th style={{ padding: '4px', textAlign: 'right' }}>Disc Amt</th>
                        <th style={{ padding: '4px', textAlign: 'right' }}>Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((it, idx) => (
                        <tr key={it.id || idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '6px 4px', textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ padding: '6px 4px', fontWeight: 'bold' }}>
                            <div>{it.name}</div>
                            {it.serialNos && it.serialNos.length > 0 && (
                              <div style={{ fontSize: '10px', color: '#475569', fontFamily: 'monospace' }}>
                                {it.serialNos.map((s, si) => <div key={si}>{s}</div>)}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                            {it.qty.toFixed(3)} {it.unit || 'PCS'}
                          </td>
                          <td style={{ padding: '6px 4px', textAlign: 'right' }}>{it.rate.toFixed(2)}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'center' }}>{it.discPercent.toFixed(2)}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right' }}>{it.discAmt.toFixed(2)}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 'bold' }}>{it.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Total Summary Footer */}
                  <div style={{ marginTop: 'auto', borderTop: '2px solid #000', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                      * This is an Estimate / Delivery Note only. Not a Tax Invoice.
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12px' }}>
                      <div style={{ fontWeight: 'bold' }}>Grand Total : ₹{grandTotal.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Status Ribbon (Frame 0035) */}
            <div style={{ background: '#f8fafc', borderTop: '1px solid #cbd5e1', padding: '4px 12px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#475569' }}>
              <span>Current Page No.: 1</span>
              <span>Total Page No.: 1</span>
              <span>Zoom Factor: 100%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
