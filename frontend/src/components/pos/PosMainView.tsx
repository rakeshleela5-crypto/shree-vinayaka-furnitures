import React, { useState, useRef, useEffect } from 'react';
import { 
  Scan, 
  ShoppingCart, 
  Plus, 
  Trash2, 
  User, 
  Printer, 
  CreditCard, 
  DollarSign, 
  Settings, 
  Sliders, 
  PauseCircle, 
  PlayCircle, 
  FileText, 
  Scale, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  ArrowLeft,
  Boxes
} from 'lucide-react';

import type { 
  Customer, 
  ProductItem, 
  CartItem, 
  Invoice, 
  Quotation, 
  HoldBill, 
  PriceMode, 
  TaxType, 
  DiscountType, 
  PaymentSplit,
  ColumnIndexConfig,
  CursorFlowConfig,
  BillDesignConfig
} from '../../types/pos';

import { 
  INITIAL_CUSTOMERS, 
  INITIAL_PRODUCTS, 
  INITIAL_BILL_DESIGN, 
  DEFAULT_COLUMN_INDEXES, 
  DEFAULT_CURSOR_FLOW 
} from '../../data/posMockData';

import { calculateLineItem, usePosCalculations, STORE_STATE } from '../../hooks/usePosCalculations';
import { usePosShortcuts } from '../../hooks/usePosShortcuts';

// Modals
import { CustomerEntryModal } from './modals/CustomerEntryModal';
import { MultiBillPaymentModal } from './modals/MultiBillPaymentModal';
import { IndexSettingModal } from './modals/IndexSettingModal';
import { CursorSettingModal } from './modals/CursorSettingModal';
import { QuotationListModal } from './modals/QuotationListModal';
import { HoldBillsModal } from './modals/HoldBillsModal';
import { PrintPreviewModal } from './modals/PrintPreviewModal';
import { ProductBulkEditorModal } from './modals/ProductBulkEditorModal';

import './pos.css';

interface Props {
  onBackToShowroom?: () => void;
}

export const PosMainView: React.FC<Props> = ({ onBackToShowroom }) => {
  // Master lists
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [columns, setColumns] = useState<ColumnIndexConfig[]>(DEFAULT_COLUMN_INDEXES);
  const [cursorFlow, setCursorFlow] = useState<CursorFlowConfig[]>(DEFAULT_CURSOR_FLOW);
  const [billDesignConfig] = useState<BillDesignConfig>(INITIAL_BILL_DESIGN);

  // Active Bill Meta
  const [invoiceSeq, setInvoiceSeq] = useState(1);
  const invoiceNo = `GST-000${invoiceSeq}-2026/27`;
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [priceMode, setPriceMode] = useState<PriceMode>('RETAIL');
  const [taxType, setTaxType] = useState<TaxType>('GST');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(INITIAL_CUSTOMERS[0]);
  const [selectedSalesman, setSelectedSalesman] = useState<string>('Mahesh (Counter 1)');

  // Cart & Line Items
  const [cart, setCart] = useState<CartItem[]>([
    {
      id: 'item-demo-1',
      productId: 'p-1001',
      code: 'SVF-101',
      barcode: '1214',
      name: 'Teak Wood 6-Seater Royal Dining Table Set',
      regionalName: 'शीशम / सागवान डाइनिंग टेबल',
      hsn: '94036000',
      qty: 1,
      unit: 'SET',
      mrp: 48000,
      rate: 42000,
      discountType: 'PERCENT',
      discountValue: 5,
      discountAmt: 2100,
      taxableAmt: 39900,
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,
      cgstAmt: 3591,
      sgstAmt: 3591,
      igstAmt: 0,
      total: 47082
    }
  ]);

  // Discounts & Sundry
  const [billDiscount, setBillDiscount] = useState<number>(0);
  const [billSundry, setBillSundry] = useState<{ name: string; amount: number }>({
    name: 'Assembly & Express Delivery',
    amount: 0
  });

  // Hold Carts & Quotations
  const [holdBills, setHoldBills] = useState<HoldBill[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([
    {
      id: 'q-9001',
      quotationNo: 'QTN-2026-0042',
      date: '2026-10-14',
      validTill: '2026-10-30',
      customer: INITIAL_CUSTOMERS[1],
      items: [
        {
          id: 'q-item-1',
          productId: 'p-1002',
          code: 'SVF-102',
          barcode: '1218',
          name: 'L-Shaped Velvet Recliner Fabric Sofa Set',
          hsn: '94016100',
          qty: 1,
          unit: 'SET',
          mrp: 65000,
          rate: 54000,
          discountType: 'FLAT',
          discountValue: 2000,
          discountAmt: 2000,
          taxableAmt: 52000,
          cgstRate: 9,
          sgstRate: 9,
          igstRate: 0,
          cgstAmt: 4680,
          sgstAmt: 4680,
          igstAmt: 0,
          total: 61360
        }
      ],
      netPay: 61360,
      salesman: 'Mahesh (Counter 1)',
      status: 'OPEN'
    }
  ]);

  // Current Fast Barcode Input Entry State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [activeProduct, setActiveProduct] = useState<ProductItem | null>(null);
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemUnit, setItemUnit] = useState<string>('PCS');
  const [itemRate, setItemRate] = useState<number>(0);
  const [itemDiscType, setItemDiscType] = useState<DiscountType>('PERCENT');
  const [itemDiscVal, setItemDiscVal] = useState<number>(0);

  // Weighing Scale live simulation (Feature 24 & 25)
  const [scaleWeight, setScaleWeight] = useState<number>(0);
  const [scaleTargetAmt, setScaleTargetAmt] = useState<string>('');

  // Modals state
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showMultiPayModal, setShowMultiPayModal] = useState(false);
  const [showIndexSettingModal, setShowIndexSettingModal] = useState(false);
  const [showCursorSettingModal, setShowCursorSettingModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showHoldBillsModal, setShowHoldBillsModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showBulkEditorModal, setShowBulkEditorModal] = useState(false);
  const [showScaleModal, setShowScaleModal] = useState(false);

  // Current printed invoice reference
  const [activeInvoiceForPrint, setActiveInvoiceForPrint] = useState<Invoice | null>(null);

  // Toast Notice
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Input references for cursor focus jump
  const barcodeRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const rateRef = useRef<HTMLInputElement>(null);
  const discRef = useRef<HTMLInputElement>(null);

  // Calculations Hook
  const calc = usePosCalculations(cart, selectedCustomer, taxType, billDiscount, billSundry);

  // Sync Item Price based on Price Mode
  useEffect(() => {
    if (activeProduct) {
      if (priceMode === 'WHOLESALE') {
        setItemRate(activeProduct.wholesalePrice);
      } else if (priceMode === 'SPECIAL') {
        setItemRate(activeProduct.specialPrice);
      } else {
        setItemRate(activeProduct.retailPrice);
      }
    }
  }, [priceMode, activeProduct]);

  // Handle Barcode Scan / Enter
  const handleBarcodeSubmit = () => {
    if (!barcodeInput.trim()) return;

    const term = barcodeInput.trim().toLowerCase();
    const found = products.find(p => 
      p.barcode.toLowerCase() === term || 
      p.code.toLowerCase() === term || 
      p.name.toLowerCase().includes(term)
    );

    if (found) {
      setActiveProduct(found);
      setItemQty(found.isWeighing && scaleWeight > 0 ? scaleWeight : 1);
      setItemUnit(found.unit || 'PCS');
      setItemRate(priceMode === 'WHOLESALE' ? found.wholesalePrice : priceMode === 'SPECIAL' ? found.specialPrice : found.retailPrice);
      setItemDiscVal(0);
      setBarcodeInput('');
      qtyRef.current?.focus();
      triggerToast(`Found: ${found.name} (Stock: ${found.stock})`);
    } else {
      triggerToast(`Barcode/Item "${barcodeInput}" not found!`);
    }
  };

  // Add Item to Bill Grid
  const handleAddItemToCart = () => {
    if (!activeProduct) {
      triggerToast('Please scan or select a product first');
      return;
    }
    if (itemQty <= 0) {
      triggerToast('Quantity must be greater than zero');
      return;
    }

    const {
      discountAmt,
      taxableAmt,
      cgstRate,
      sgstRate,
      igstRate,
      cgstAmt,
      sgstAmt,
      igstAmt,
      total
    } = calculateLineItem(
      itemQty,
      itemRate,
      activeProduct.mrp,
      itemDiscType,
      itemDiscVal,
      activeProduct.taxRate,
      selectedCustomer.state,
      taxType
    );

    const newItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random()}`,
      productId: activeProduct.id,
      code: activeProduct.code,
      barcode: activeProduct.barcode,
      name: activeProduct.name,
      regionalName: activeProduct.regionalName,
      hsn: activeProduct.hsn,
      qty: itemQty,
      unit: itemUnit,
      mrp: activeProduct.mrp,
      rate: itemRate,
      discountType: itemDiscType,
      discountValue: itemDiscVal,
      discountAmt,
      taxableAmt,
      cgstRate,
      sgstRate,
      igstRate,
      cgstAmt,
      sgstAmt,
      igstAmt,
      total,
      salesmanName: selectedSalesman
    };

    setCart(prev => [newItem, ...prev]);
    triggerToast(`Added ${activeProduct.name} to bill`);

    // Reset item entry bar
    setActiveProduct(null);
    setItemQty(1);
    setItemRate(0);
    setItemDiscVal(0);
    barcodeRef.current?.focus();
  };

  // Delete line item
  const handleDeleteItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Build Full Invoice Object
  const generateCurrentInvoice = (paymentMode: string = 'Cash', payments?: PaymentSplit[]): Invoice => {
    return {
      id: `inv-${Date.now()}`,
      invoiceNo,
      date: invoiceDate,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      taxType,
      priceMode,
      customer: selectedCustomer,
      items: cart,
      itemsCount: calc.itemsCount,
      totalQty: calc.totalQty,
      billMrp: calc.billMrp,
      itemDiscountTotal: calc.itemDiscountTotal,
      billDiscount: calc.billDiscount,
      billSundry: calc.billSundry,
      taxableTotal: calc.taxableTotal,
      cgstTotal: calc.cgstTotal,
      sgstTotal: calc.sgstTotal,
      igstTotal: calc.igstTotal,
      cessTotal: 0,
      roundOff: calc.roundOff,
      netPay: calc.netPay,
      paidAmount: calc.netPay,
      pendingAmount: 0,
      payments: payments || [{ mode: paymentMode, amount: calc.netPay, enabled: true }],
      salesmanId: selectedSalesman,
      status: 'PAID',
      designStyle: billDesignConfig.style
    };
  };

  // F4 Quick Pay (One-Click Instant Checkout)
  const handleQuickPay = () => {
    if (cart.length === 0) {
      triggerToast('Cart is empty. Add items before payment.');
      return;
    }
    const inv = generateCurrentInvoice('By Cash');
    setActiveInvoiceForPrint(inv);
    setShowPrintModal(true);
    triggerToast(`⚡ Bill ${invoiceNo} settled via Cash (₹ ${calc.netPay})!`);
  };

  // F2 New Bill
  const handleNewBill = () => {
    setCart([]);
    setBillDiscount(0);
    setBillSundry({ name: 'Delivery & Assembly', amount: 0 });
    setInvoiceSeq(s => s + 1);
    setSelectedCustomer(INITIAL_CUSTOMERS[0]);
    triggerToast(`New Bill Started: GST-000${invoiceSeq + 1}-2026/27`);
    barcodeRef.current?.focus();
  };

  // Multi-Pay Confirm
  const handleSaveMultiPayment = (payments: PaymentSplit[]) => {
    const inv = generateCurrentInvoice('Multi-Pay', payments);
    setShowMultiPayModal(false);
    setActiveInvoiceForPrint(inv);
    setShowPrintModal(true);
    triggerToast(`Multi-Payment Saved for Bill ${invoiceNo}!`);
  };

  // F8 Hold Bill
  const handleHoldBill = () => {
    if (cart.length === 0) {
      triggerToast('Nothing in cart to put on Hold');
      return;
    }
    const newHold: HoldBill = {
      id: `hold-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      holdNumber: holdBills.length + 1,
      customer: selectedCustomer,
      items: cart,
      billDiscount,
      sundry: billSundry,
      netPay: calc.netPay,
      notes: `Hold Cart #${holdBills.length + 1} (${selectedCustomer.name})`
    };
    setHoldBills(prev => [newHold, ...prev]);
    setCart([]);
    setInvoiceSeq(s => s + 1);
    triggerToast(`Cart put on HOLD #${newHold.holdNumber}! New bill ready.`);
  };

  // F9 Unhold Bill
  const handleRestoreHoldBill = (bill: HoldBill) => {
    setCart(bill.items);
    setSelectedCustomer(bill.customer);
    setBillDiscount(bill.billDiscount);
    setBillSundry(bill.sundry);
    setHoldBills(prev => prev.filter(b => b.id !== bill.id));
    setShowHoldBillsModal(false);
    triggerToast(`Restored Hold Bill #${bill.holdNumber} (${bill.customer.name})`);
  };

  // F7 Save As Quotation
  const handleSaveAsQuotation = () => {
    if (cart.length === 0) {
      triggerToast('Add items to cart before creating a quotation');
      return;
    }
    const qtnNo = `QTN-2026-00${quotations.length + 50}`;
    const newQtn: Quotation = {
      id: `qtn-${Date.now()}`,
      quotationNo: qtnNo,
      date: invoiceDate,
      validTill: '2026-11-15',
      customer: selectedCustomer,
      items: cart,
      netPay: calc.netPay,
      salesman: selectedSalesman,
      status: 'OPEN'
    };
    setQuotations(prev => [newQtn, ...prev]);
    triggerToast(`Quotation ${qtnNo} created successfully!`);
  };

  // Load Quotation into Bill
  const handleLoadQuotation = (qtn: Quotation) => {
    setCart(qtn.items);
    setSelectedCustomer(qtn.customer);
    setShowQuotationModal(false);
    triggerToast(`Loaded Quotation ${qtn.quotationNo} into Bill!`);
  };

  // Cycle Price Mode (Ctrl+S)
  const handleTogglePriceMode = () => {
    setPriceMode(prev => {
      const next = prev === 'RETAIL' ? 'WHOLESALE' : prev === 'WHOLESALE' ? 'SPECIAL' : 'RETAIL';
      triggerToast(`Price Mode Changed: ${next}`);
      return next;
    });
  };

  // Feature 28: Ctrl+H Last Sold Price Check
  const handleLastSoldPriceCheck = () => {
    if (!activeProduct) {
      triggerToast('Select or scan a product first to check last sold price');
      return;
    }
    triggerToast(`Last Sold Rate of ${activeProduct.name} to ${selectedCustomer.name}: ₹ ${activeProduct.retailPrice - 500}`);
  };

  // Setup Keyboard Shortcuts (F1-F12, Ctrl+S, Ctrl+C, Ctrl+H, Ctrl+B, etc.)
  usePosShortcuts({
    onNewBill: handleNewBill,
    onQuickPay: handleQuickPay,
    onPrint: () => {
      if (cart.length === 0) {
        triggerToast('Cart is empty. Add items to print.');
        return;
      }
      setActiveInvoiceForPrint(generateCurrentInvoice());
      setShowPrintModal(true);
    },
    onTogglePriceMode: handleTogglePriceMode,
    onBillDiscount: () => {
      const disc = prompt('Enter Total Bill Discount (Flat Amount in ₹):', billDiscount.toString());
      if (disc !== null) {
        setBillDiscount(Number(disc) || 0);
        triggerToast(`Bill Discount Set: ₹ ${disc}`);
      }
    },
    onLastSoldPrice: handleLastSoldPriceCheck,
    onFocusBarcode: () => barcodeRef.current?.focus(),
    onFocusQty: () => qtyRef.current?.focus(),
    onMultiPay: () => setShowMultiPayModal(true),
    onHoldBill: handleHoldBill,
    onUnholdBill: () => setShowHoldBillsModal(true)
  });

  return (
    <div className="pos-wrapper">
      {/* Top Header Banner Bar (Lime Green) */}
      <header className="pos-top-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {onBackToShowroom && (
            <button 
              onClick={onBackToShowroom} 
              className="pos-btn pos-btn-secondary"
              style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Return to Public Furniture Showroom"
            >
              <ArrowLeft size={14} /> Showroom
            </button>
          )}

          <div className="pos-title-badge">
            <span>POINT OF SALE</span>
            <span className="pos-company-subtitle">SHREE VINAYAKA FURNITURES • REL 1.8 ENTERPRISE</span>
          </div>
        </div>

        {/* Header Controls: Price Mode, Tax Type, Invoice Date */}
        <div className="pos-header-controls">
          {/* Price Mode Toggle (Ctrl+S) */}
          <div className="pos-mode-toggle" title="Press Ctrl+S to toggle Price Mode">
            <button 
              className={`pos-mode-btn ${priceMode === 'RETAIL' ? 'active' : ''}`}
              onClick={() => setPriceMode('RETAIL')}
            >
              Retail
            </button>
            <button 
              className={`pos-mode-btn ${priceMode === 'WHOLESALE' ? 'active' : ''}`}
              onClick={() => setPriceMode('WHOLESALE')}
            >
              Wholesale
            </button>
            <button 
              className={`pos-mode-btn ${priceMode === 'SPECIAL' ? 'active' : ''}`}
              onClick={() => setPriceMode('SPECIAL')}
            >
              Special
            </button>
          </div>

          {/* Tax Structure Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span className="pos-label-text">Tax:</span>
            <select 
              value={taxType} 
              onChange={e => setTaxType(e.target.value as TaxType)}
              className="pos-input"
              style={{ fontWeight: 700 }}
            >
              <option value="GST">GST Regular (CGST+SGST / IGST)</option>
              <option value="COMPOSITION">Composition (Flat 1%)</option>
              <option value="NON_GST">Non-GST / Tax Free</option>
            </select>
          </div>

          {/* Invoice No & Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="pos-label-text">Bill No:</span>
            <span style={{ fontWeight: 900, color: '#14532d', background: '#ecfccb', padding: '3px 8px', borderRadius: '4px', border: '1px solid #84cc16' }}>
              {invoiceNo}
            </span>
            <input 
              type="date" 
              value={invoiceDate} 
              onChange={e => setInvoiceDate(e.target.value)}
              className="pos-input" 
              style={{ padding: '2px 6px' }}
            />
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="pos-main-body">
        {/* Customer & Bill Context Ribbon */}
        <div className="pos-ribbon-card">
          {/* Customer Selector & Quick Info */}
          <div className="pos-meta-group">
            <span className="pos-label-text" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={14} color="#0284c7" /> Customer:
            </span>

            <select 
              className="pos-input pos-input-yellow"
              style={{ minWidth: '220px' }}
              value={selectedCustomer.id}
              onChange={e => {
                const found = customers.find(c => c.id === e.target.value);
                if (found) setSelectedCustomer(found);
              }}
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name} ({c.contactNo})
                </option>
              ))}
            </select>

            {/* Quick Add Customer Modal Trigger */}
            <button 
              className="pos-btn pos-btn-primary" 
              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
              onClick={() => setShowCustomerModal(true)}
              title="Add New Customer (Screen 661)"
            >
              <Plus size={13} /> New (F1)
            </button>

            {/* Customer State & GST Status */}
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
              State: <strong style={{ color: selectedCustomer.state === STORE_STATE ? '#15803d' : '#b45309' }}>{selectedCustomer.state}</strong>
              {selectedCustomer.state !== STORE_STATE && ' (IGST Interstate)'}
            </span>

            {/* Opening / Current Balance Badge */}
            <div className={`pos-balance-pill ${selectedCustomer.balanceType === 'CR' ? 'cr' : 'dr'}`}>
              Bal: ₹ {selectedCustomer.currentBalance.toFixed(2)} {selectedCustomer.balanceType}
            </div>

            {/* Loyalty Points Badge */}
            {selectedCustomer.loyaltyEnabled && (
              <div className="pos-loyalty-pill">
                <Sparkles size={12} /> Points: {selectedCustomer.loyaltyPoints}
              </div>
            )}
          </div>

          {/* Salesman & Quick Toggles */}
          <div className="pos-meta-group">
            <span className="pos-label-text">Salesman:</span>
            <select 
              value={selectedSalesman}
              onChange={e => setSelectedSalesman(e.target.value)}
              className="pos-input"
            >
              <option value="Mahesh (Counter 1)">Mahesh (Counter 1)</option>
              <option value="Suresh (Sofa Section)">Suresh (Sofa Section)</option>
              <option value="Pooja (Dining Specialist)">Pooja (Dining Specialist)</option>
              <option value="Ravi (Lead Sales)">Ravi (Lead Sales)</option>
            </select>

            {/* Hold Count Indicator */}
            {holdBills.length > 0 && (
              <button 
                onClick={() => setShowHoldBillsModal(true)}
                className="pos-btn pos-btn-warning"
                style={{ padding: '3px 8px', fontSize: '0.75rem' }}
              >
                <PauseCircle size={13} /> {holdBills.length} on Hold (F9)
              </button>
            )}
          </div>
        </div>

        {/* Quick Action Ribbon Toolbar */}
        <div className="pos-toolbar">
          <button 
            className="pos-toolbar-btn" 
            onClick={() => setShowScaleModal(true)}
            title="Weighing Scale Integration (Feature 24/25)"
          >
            <Scale size={14} color="#0284c7" /> Weighing Scale (Ctrl+W)
          </button>

          <button 
            className="pos-toolbar-btn" 
            onClick={handleHoldBill}
            title="Hold Cart (F8)"
          >
            <PauseCircle size={14} color="#d97706" /> Hold Bill (F8)
          </button>

          <button 
            className="pos-toolbar-btn" 
            onClick={() => setShowHoldBillsModal(true)}
            title="Unhold Bills (F9)"
          >
            <PlayCircle size={14} color="#16a34a" /> Unhold Bills (F9)
          </button>

          <button 
            className="pos-toolbar-btn" 
            onClick={handleSaveAsQuotation}
            title="Save Active Cart as Quotation"
          >
            <FileText size={14} color="#7c3aed" /> Save Quotation (F7)
          </button>

          <button 
            className="pos-toolbar-btn" 
            onClick={() => setShowQuotationModal(true)}
            title="Search and Load Saved Quotations"
          >
            <Search size={14} color="#0f766e" /> Quotations List
          </button>

          <button 
            className="pos-toolbar-btn" 
            onClick={() => setShowBulkEditorModal(true)}
            title="Screen 556: Bulk Price & Stock Matrix Editor"
          >
            <Boxes size={14} color="#ea580c" /> Bulk Price/Stock (Ctrl+E)
          </button>

          <button 
            className="pos-toolbar-btn" 
            onClick={() => setShowIndexSettingModal(true)}
            title="Screen 061: Table Column Index & Visibility"
          >
            <Sliders size={14} color="#475569" /> Index Settings
          </button>

          <button 
            className="pos-toolbar-btn" 
            onClick={() => setShowCursorSettingModal(true)}
            title="Screen 045: Pos Cursor Tab Order"
          >
            <Settings size={14} color="#475569" /> Cursor Flow
          </button>

          <button 
            className="pos-toolbar-btn" 
            onClick={handleLastSoldPriceCheck}
            title="Feature 28: Last Sold Price for Customer"
          >
            <DollarSign size={14} color="#15803d" /> Last Sold Price (Ctrl+H)
          </button>
        </div>

        {/* Fast Item Scan & Entry Bar (Yellow Tinted High-Contrast Inputs) */}
        <div className="pos-entry-bar">
          {/* Barcode Search / Scan */}
          <div className="pos-field-box">
            <label>Scan Barcode / Code</label>
            <div style={{ position: 'relative' }}>
              <input 
                ref={barcodeRef}
                type="text" 
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleBarcodeSubmit()}
                placeholder="Scan / 1214..."
                className="pos-input pos-input-yellow"
                style={{ width: '100%', paddingLeft: '24px' }}
                autoFocus
              />
              <Scan size={14} style={{ position: 'absolute', left: '6px', top: '7px', color: '#b45309' }} />
            </div>
          </div>

          {/* Product Autocomplete Dropdown */}
          <div className="pos-field-box">
            <label>Product Description</label>
            <select 
              className="pos-input"
              value={activeProduct?.id || ''}
              onChange={e => {
                const p = products.find(prod => prod.id === e.target.value);
                if (p) {
                  setActiveProduct(p);
                  setItemQty(p.isWeighing && scaleWeight > 0 ? scaleWeight : 1);
                  setItemUnit(p.unit || 'PCS');
                  setItemRate(priceMode === 'WHOLESALE' ? p.wholesalePrice : priceMode === 'SPECIAL' ? p.specialPrice : p.retailPrice);
                  qtyRef.current?.focus();
                }
              }}
            >
              <option value="">-- Select or Scan Item --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.barcode} | {p.name} (Stock: {p.stock} {p.unit})
                </option>
              ))}
            </select>
          </div>

          {/* MRP Display */}
          <div className="pos-field-box">
            <label>MRP (₹)</label>
            <input 
              type="text" 
              readOnly 
              value={activeProduct ? activeProduct.mrp : ''}
              className="pos-input"
              style={{ background: '#f1f5f9', fontWeight: 700, textAlign: 'right' }}
            />
          </div>

          {/* Quantity (Supports fractional e.g. 0.066 kg) */}
          <div className="pos-field-box">
            <label>Qty (Ctrl+Q)</label>
            <input 
              ref={qtyRef}
              type="number" 
              step="any"
              min="0.001"
              value={itemQty}
              onChange={e => setItemQty(parseFloat(e.target.value) || 0)}
              onKeyDown={e => e.key === 'Enter' && rateRef.current?.focus()}
              className="pos-input pos-input-yellow"
              style={{ textAlign: 'right' }}
            />
          </div>

          {/* Unit */}
          <div className="pos-field-box">
            <label>Unit</label>
            <select 
              value={itemUnit}
              onChange={e => setItemUnit(e.target.value)}
              className="pos-input"
            >
              <option value="PCS">PCS</option>
              <option value="SET">SET</option>
              <option value="KG">KG</option>
              <option value="MTR">MTR</option>
              <option value="NOS">NOS</option>
              <option value="BOX">BOX</option>
            </select>
          </div>

          {/* Rate / Price */}
          <div className="pos-field-box">
            <label>Rate (₹)</label>
            <input 
              ref={rateRef}
              type="number" 
              value={itemRate}
              onChange={e => setItemRate(parseFloat(e.target.value) || 0)}
              onKeyDown={e => e.key === 'Enter' && discRef.current?.focus()}
              className="pos-input pos-input-yellow"
              style={{ textAlign: 'right' }}
            />
          </div>

          {/* Discount */}
          <div className="pos-field-box">
            <label>Disc % / ₹</label>
            <div style={{ display: 'flex', gap: '2px' }}>
              <input 
                ref={discRef}
                type="number" 
                value={itemDiscVal}
                onChange={e => setItemDiscVal(parseFloat(e.target.value) || 0)}
                onKeyDown={e => e.key === 'Enter' && handleAddItemToCart()}
                className="pos-input"
                style={{ width: '60px', textAlign: 'right' }}
              />
              <button 
                type="button" 
                className="pos-btn pos-btn-secondary"
                style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                onClick={() => setItemDiscType(t => t === 'PERCENT' ? 'FLAT' : 'PERCENT')}
                title="Toggle Percentage or Flat Discount"
              >
                {itemDiscType === 'PERCENT' ? '%' : '₹'}
              </button>
            </div>
          </div>

          {/* Estimated Line Total */}
          <div className="pos-field-box">
            <label>Est. Total</label>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#15803d', textAlign: 'right', padding: '4px' }}>
              ₹ {(itemQty * itemRate * (1 - (itemDiscType === 'PERCENT' ? itemDiscVal / 100 : 0))).toFixed(2)}
            </div>
          </div>

          {/* Add Item Button */}
          <div style={{ alignSelf: 'flex-end' }}>
            <button 
              className="pos-btn pos-btn-success"
              style={{ padding: '6px 14px' }}
              onClick={handleAddItemToCart}
              title="Add Item to Bill Grid (Enter)"
            >
              <Plus size={16} /> Add (Enter)
            </button>
          </div>
        </div>

        {/* Line Items Table Grid */}
        <div className="pos-grid-container">
          <table className="pos-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>Sr</th>
                <th>Barcode</th>
                <th>Item Description</th>
                <th>HSN</th>
                <th className="numeric">Qty</th>
                <th>Unit</th>
                <th className="numeric">MRP</th>
                <th className="numeric">Rate</th>
                <th className="numeric">Disc</th>
                <th className="numeric">Taxable</th>
                {taxType === 'GST' && (
                  <>
                    <th className="numeric">CGST</th>
                    <th className="numeric">SGST</th>
                    <th className="numeric">IGST</th>
                  </>
                )}
                <th className="numeric">Net Amount</th>
                <th style={{ width: '40px', textAlign: 'center' }}>Act</th>
              </tr>
            </thead>
            <tbody>
              {cart.length === 0 ? (
                <tr>
                  <td colSpan={14} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    <ShoppingCart size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                    <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>BILL IS EMPTY</p>
                    <p style={{ fontSize: '0.75rem' }}>Scan a barcode or choose an item from the top selector to begin billing.</p>
                  </td>
                </tr>
              ) : (
                cart.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{item.barcode}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{item.name}</div>
                      {item.regionalName && (
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.regionalName}</div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#475569' }}>{item.hsn}</td>
                    <td className="numeric">
                      <input 
                        type="number" 
                        step="any"
                        value={item.qty}
                        onChange={e => {
                          const newQty = parseFloat(e.target.value) || 0;
                          setCart(prev => prev.map(it => {
                            if (it.id !== item.id) return it;
                            const product = products.find(p => p.id === it.productId);
                            const updated = calculateLineItem(
                              newQty,
                              it.rate,
                              it.mrp,
                              it.discountType,
                              it.discountValue,
                              product?.taxRate || 18,
                              selectedCustomer.state,
                              taxType
                            );
                            return { ...it, qty: newQty, ...updated };
                          }));
                        }}
                        className="pos-table-input"
                      />
                    </td>
                    <td style={{ fontSize: '0.75rem' }}>{item.unit}</td>
                    <td className="numeric">{item.mrp.toFixed(2)}</td>
                    <td className="numeric">{item.rate.toFixed(2)}</td>
                    <td className="numeric" style={{ color: '#b45309', fontWeight: 700 }}>
                      {item.discountAmt > 0 ? `₹ ${item.discountAmt.toFixed(2)}` : '-'}
                    </td>
                    <td className="numeric">{item.taxableAmt.toFixed(2)}</td>
                    {taxType === 'GST' && (
                      <>
                        <td className="numeric" style={{ fontSize: '0.75rem' }}>
                          {item.cgstAmt > 0 ? `${item.cgstAmt.toFixed(2)} (${item.cgstRate}%)` : '-'}
                        </td>
                        <td className="numeric" style={{ fontSize: '0.75rem' }}>
                          {item.sgstAmt > 0 ? `${item.sgstAmt.toFixed(2)} (${item.sgstRate}%)` : '-'}
                        </td>
                        <td className="numeric" style={{ fontSize: '0.75rem' }}>
                          {item.igstAmt > 0 ? `${item.igstAmt.toFixed(2)} (${item.igstRate}%)` : '-'}
                        </td>
                      </>
                    )}
                    <td className="numeric" style={{ fontWeight: 800, color: '#15803d' }}>
                      ₹ {item.total.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                        title="Remove Item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Calculation & Summary Footer Section */}
        <div className="pos-footer-section">
          {/* Quick Metrics Statistics */}
          <div className="pos-stats-grid">
            <div className="pos-stat-card">
              <span className="pos-stat-label">Items / Total Qty</span>
              <span className="pos-stat-value">{calc.itemsCount} / {calc.totalQty}</span>
            </div>

            <div className="pos-stat-card">
              <span className="pos-stat-label">Gross MRP Total</span>
              <span className="pos-stat-value">₹ {calc.billMrp.toFixed(2)}</span>
            </div>

            <div className="pos-stat-card">
              <span className="pos-stat-label">Taxable Value</span>
              <span className="pos-stat-value">₹ {calc.taxableTotal.toFixed(2)}</span>
            </div>

            <div className="pos-stat-card">
              <span className="pos-stat-label">GST Tax Total</span>
              <span className="pos-stat-value">₹ {calc.taxTotal.toFixed(2)}</span>
            </div>

            <div className="pos-stat-card">
              <span className="pos-stat-label">Item Discounts</span>
              <span className="pos-stat-value" style={{ color: '#b45309' }}>
                ₹ {calc.itemDiscountTotal.toFixed(2)}
              </span>
            </div>

            <div className="pos-stat-card">
              <span className="pos-stat-label">Bill Discount (Ctrl+C)</span>
              <span className="pos-stat-value" style={{ color: '#b45309' }}>
                ₹ {calc.billDiscount.toFixed(2)}
              </span>
            </div>

            <div className="pos-stat-card">
              <span className="pos-stat-label">Sundry / Delivery</span>
              <span className="pos-stat-value">₹ {calc.billSundry.amount.toFixed(2)}</span>
            </div>

            <div className="pos-stat-card">
              <span className="pos-stat-label">Round Off</span>
              <span className="pos-stat-value">{calc.roundOff >= 0 ? `+${calc.roundOff}` : calc.roundOff}</span>
            </div>
          </div>

          {/* Customer Savings Banner */}
          <div className="pos-savings-badge">
            <Sparkles size={20} />
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Customer Total Savings
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>
                ₹ {calc.savings.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Giant LED Net Payable Display */}
          <div className="pos-giant-pay-box">
            <span className="pos-giant-label">NET PAYABLE AMOUNT</span>
            <span className="pos-giant-amount">₹ {calc.netPay.toLocaleString('en-IN')}.00</span>
          </div>
        </div>
      </main>

      {/* Bottom Function Action Ribbon (F2, F4, F5, F6, F10) */}
      <footer className="pos-function-ribbon">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button className="pos-fkey-btn" onClick={handleNewBill} title="F2 - New Bill">
            <span className="pos-fkey-badge">F2</span> New Bill
          </button>

          <button className="pos-fkey-btn quick-pay" onClick={handleQuickPay} title="F4 - Quick Cash Pay">
            <span className="pos-fkey-badge" style={{ background: '#ffffff', color: '#15803d' }}>F4</span> 
            ⚡ Quick Cash Pay
          </button>

          <button 
            className="pos-fkey-btn multi-pay" 
            onClick={() => setShowMultiPayModal(true)} 
            title="F10 - Split & Multi Payment Options"
          >
            <CreditCard size={15} /> Multi-Pay (F10)
          </button>

          <button 
            className="pos-fkey-btn" 
            onClick={() => {
              if (cart.length === 0) {
                triggerToast('Cart is empty. Add items to print.');
                return;
              }
              setActiveInvoiceForPrint(generateCurrentInvoice());
              setShowPrintModal(true);
            }} 
            title="F6 - Print Bill & Thermal Receipt"
          >
            <span className="pos-fkey-badge">F6</span> 
            <Printer size={14} /> Print Bill
          </button>

          <button 
            className="pos-fkey-btn" 
            onClick={() => {
              const disc = prompt('Enter Total Bill Discount (in ₹):', billDiscount.toString());
              if (disc !== null) {
                setBillDiscount(Number(disc) || 0);
                triggerToast(`Bill Discount Set: ₹ ${disc}`);
              }
            }} 
            title="Ctrl+C - Total Bill Discount"
          >
            <span className="pos-fkey-badge">Ctrl+C</span> Bill Disc
          </button>

          <button 
            className="pos-fkey-btn" 
            onClick={() => {
              const sundry = prompt('Enter Delivery / Assembly Charges (in ₹):', billSundry.amount.toString());
              if (sundry !== null) {
                setBillSundry({ name: 'Delivery & Assembly', amount: Number(sundry) || 0 });
                triggerToast(`Sundry Charges Set: ₹ ${sundry}`);
              }
            }} 
            title="Add Delivery / Assembly Charges"
          >
            Delivery / Sundry
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Direct UPI QR Ready • WhatsApp API Active
          </span>
          <button 
            className="pos-btn pos-btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            onClick={() => {
              setCart([]);
              triggerToast('Cleared bill cart');
            }}
          >
            Clear Grid
          </button>
        </div>
      </footer>

      {/* Weighing Scale Simulator Dialog Modal */}
      {showScaleModal && (
        <div className="pos-modal-overlay">
          <div className="pos-modal-window" style={{ maxWidth: '440px', width: '92%' }}>
            <div className="pos-modal-header" style={{ background: '#0284c7', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
                <Scale size={18} /> Weighing Scale Integration (Screen 066)
              </div>
              <button 
                onClick={() => setShowScaleModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div className="pos-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="pos-scale-widget">
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>LIVE SCALE READING</div>
                  <div className="pos-scale-weight">{(scaleWeight || 1.450).toFixed(3)} KG</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 700 }}>SERIAL READY</span>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                  Manual Weight Entry (Kg):
                </label>
                <input 
                  type="number" 
                  step="0.001" 
                  value={scaleWeight}
                  onChange={e => setScaleWeight(parseFloat(e.target.value) || 0)}
                  className="pos-input pos-input-yellow"
                  style={{ width: '100%', fontSize: '1.1rem', marginTop: '4px' }}
                />
              </div>

              {/* Inverse Math: Calculate Weight from Target Amount */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                  Or Amount Target to Auto-Compute Weight (Feature 24/25):
                </label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <input 
                    type="number" 
                    placeholder="Enter ₹ e.g. 500" 
                    value={scaleTargetAmt}
                    onChange={e => {
                      const amt = parseFloat(e.target.value) || 0;
                      setScaleTargetAmt(e.target.value);
                      const rate = itemRate || 3000;
                      if (rate > 0) {
                        setScaleWeight(Number((amt / rate).toFixed(3)));
                      }
                    }}
                    className="pos-input"
                    style={{ flex: 1 }}
                  />
                  <span style={{ alignSelf: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                    = {scaleWeight} Kg
                  </span>
                </div>
              </div>
            </div>
            <div className="pos-modal-footer">
              <button 
                className="pos-btn pos-btn-secondary" 
                onClick={() => setShowScaleModal(false)}
              >
                Cancel
              </button>
              <button 
                className="pos-btn pos-btn-primary" 
                onClick={() => {
                  setItemQty(scaleWeight || 1.450);
                  setShowScaleModal(false);
                  triggerToast(`Transferred ${(scaleWeight || 1.450).toFixed(3)} Kg to Quantity!`);
                }}
              >
                Apply Weight to Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Entry Modal (Screen 661) */}
      <CustomerEntryModal 
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSaveCustomer={newCust => {
          setCustomers(prev => [newCust, ...prev]);
          setSelectedCustomer(newCust);
          setShowCustomerModal(false);
          triggerToast(`Customer ${newCust.name} (${newCust.code}) created!`);
        }}
      />

      {/* Multi-Bill Payment Modal (Screen 500) */}
      <MultiBillPaymentModal 
        isOpen={showMultiPayModal}
        onClose={() => setShowMultiPayModal(false)}
        netPay={calc.netPay}
        onSavePayments={handleSaveMultiPayment}
      />

      {/* Table Column Index Setting Modal (Screen 061) */}
      <IndexSettingModal 
        isOpen={showIndexSettingModal}
        onClose={() => setShowIndexSettingModal(false)}
        columns={columns}
        onSaveColumns={cols => {
          setColumns(cols);
          setShowIndexSettingModal(false);
          triggerToast('Table Column Indexes Updated');
        }}
      />

      {/* Pos Cursor Tab Order Setting Modal (Screen 045) */}
      <CursorSettingModal 
        isOpen={showCursorSettingModal}
        onClose={() => setShowCursorSettingModal(false)}
        flow={cursorFlow}
        onSaveFlow={fl => {
          setCursorFlow(fl);
          setShowCursorSettingModal(false);
          triggerToast('Cursor Jump Sequence Saved');
        }}
      />

      {/* Quotations List & Convert Modal (Screen 522) */}
      <QuotationListModal 
        isOpen={showQuotationModal}
        onClose={() => setShowQuotationModal(false)}
        quotations={quotations}
        onLoadQuotation={handleLoadQuotation}
      />

      {/* Multi-Cart Hold & Unhold Modal (Feature 44) */}
      <HoldBillsModal 
        isOpen={showHoldBillsModal}
        onClose={() => setShowHoldBillsModal(false)}
        holdBills={holdBills}
        onRestoreHoldBill={handleRestoreHoldBill}
        onDeleteHoldBill={id => setHoldBills(prev => prev.filter(b => b.id !== id))}
      />

      {/* Thermal Receipt & A4 GST Print Preview Modal (Screens 050, 080, 716) */}
      <PrintPreviewModal 
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        invoice={activeInvoiceForPrint}
        designConfig={billDesignConfig}
      />

      {/* Bulk Inventory & Price Editor Modal (Screen 556) */}
      <ProductBulkEditorModal 
        isOpen={showBulkEditorModal}
        onClose={() => setShowBulkEditorModal(false)}
        products={products}
        onSaveProducts={updatedProds => {
          setProducts(updatedProds);
          setShowBulkEditorModal(false);
          triggerToast('Bulk Product Stock & Prices Updated Successfully');
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="pos-toast">
          <CheckCircle2 size={18} color="#22c55e" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
