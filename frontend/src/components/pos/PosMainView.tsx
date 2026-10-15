import React, { useState, useRef, useEffect } from 'react';
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

import { calculateLineItem, usePosCalculations } from '../../hooks/usePosCalculations';
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
  // Master state
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [products, setProducts] = useState<ProductItem[]>([
    {
      id: 'p-dune',
      code: 'DUNE-01',
      barcode: '1214',
      name: 'Dune kimia',
      regionalName: 'डूने कीमिया',
      category: 'General',
      hsn: '0',
      mrp: 350,
      retailPrice: 320,
      wholesalePrice: 290,
      specialPrice: 280,
      unit: 'Unit',
      stock: 45,
      taxRate: 18
    },
    {
      id: 'p-keyboard',
      code: 'KEY-02',
      barcode: '1218',
      name: 'Keyboard',
      regionalName: 'कीबोर्ड',
      category: 'Electronics',
      hsn: '847160',
      mrp: 950,
      retailPrice: 800,
      wholesalePrice: 720,
      specialPrice: 700,
      unit: 'Unit',
      stock: 30,
      taxRate: 18
    },
    {
      id: 'p-dateland',
      code: 'DL-03',
      barcode: '1275',
      name: 'DateLand',
      regionalName: 'डेटलैंड',
      category: 'Dry Fruits',
      hsn: '0',
      mrp: 1800,
      retailPrice: 1600,
      wholesalePrice: 1450,
      specialPrice: 1400,
      unit: 'Unit',
      stock: 60,
      taxRate: 12
    },
    ...INITIAL_PRODUCTS
  ]);

  const [columns, setColumns] = useState<ColumnIndexConfig[]>(DEFAULT_COLUMN_INDEXES);
  const [cursorFlow, setCursorFlow] = useState<CursorFlowConfig[]>(DEFAULT_CURSOR_FLOW);
  const [billDesignConfig] = useState<BillDesignConfig>(INITIAL_BILL_DESIGN);

  // Shell State
  const [activeMenuTab, setActiveMenuTab] = useState<string | null>(null);
  const [isPosWindowOpen, setIsPosWindowOpen] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'Sale' | 'D-Sale' | 'Bill Design' | 'Dash board' | 'Pay'>('Sale');
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString('en-US'));

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // POS State (screen_044.jpg)
  const [priceMode, setPriceMode] = useState<PriceMode>('RETAIL');
  const [invoiceNo, setInvoiceNo] = useState('GST-0008-2026/27');
  const [invoiceDate, setInvoiceDate] = useState('10/04/2026');
  const [taxType, setTaxType] = useState<TaxType>('GST');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(INITIAL_CUSTOMERS[0]);
  const [customerPhone, setCustomerPhone] = useState('1234567890');
  const [customerState, setCustomerState] = useState('Kerala');
  const [forSerial, setForSerial] = useState(false);
  const [wBarcode, setWBarcode] = useState(false);

  // Line Item Entry Row
  const [barcodeInput, setBarcodeInput] = useState('');
  const [forDSale, setForDSale] = useState(false);
  const [itemMrp, setItemMrp] = useState('0.00');
  const [itemQty, setItemQty] = useState('0');
  const [itemUnit, setItemUnit] = useState('Unit');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDiscType, setItemDiscType] = useState<DiscountType>('PERCENT');
  const [totalDiscAmt] = useState('0.00');
  const [totalAmt] = useState('0.00');

  // Cart matching screen_044.jpg exact initial items
  const [cart, setCart] = useState<CartItem[]>([
    {
      id: 'cart-item-1',
      productId: 'p-dune',
      code: 'DUNE-01',
      barcode: '1214',
      name: 'Dune kimia',
      regionalName: 'डूने कीमिया',
      hsn: '0',
      qty: 1,
      unit: 'Unit',
      mrp: 350,
      rate: 320,
      discountType: 'PERCENT',
      discountValue: 0,
      discountAmt: 0,
      taxableAmt: 320,
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,
      cgstAmt: 28.8,
      sgstAmt: 28.8,
      igstAmt: 0,
      total: 320
    },
    {
      id: 'cart-item-2',
      productId: 'p-keyboard',
      code: 'KEY-02',
      barcode: '1218',
      name: 'Keyboard',
      regionalName: 'कीबोर्ड',
      hsn: '847160',
      qty: 1,
      unit: 'Unit',
      mrp: 950,
      rate: 800,
      discountType: 'PERCENT',
      discountValue: 0,
      discountAmt: 0,
      taxableAmt: 800,
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,
      cgstAmt: 72,
      sgstAmt: 72,
      igstAmt: 0,
      total: 800
    },
    {
      id: 'cart-item-3',
      productId: 'p-dateland',
      code: 'DL-03',
      barcode: '1275',
      name: 'DateLand',
      regionalName: 'डेटलैंड',
      hsn: '0',
      qty: 1,
      unit: 'Unit',
      mrp: 1800,
      rate: 1600,
      discountType: 'PERCENT',
      discountValue: 0,
      discountAmt: 0,
      taxableAmt: 1600,
      cgstRate: 6,
      sgstRate: 6,
      igstRate: 0,
      cgstAmt: 96,
      sgstAmt: 96,
      igstAmt: 0,
      total: 1600
    }
  ]);

  const [selectedRowId, setSelectedRowId] = useState<string>('cart-item-3');

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

  // Hold & Quotations
  const [holdBills, setHoldBills] = useState<HoldBill[]>([]);
  const [quotations] = useState<Quotation[]>([]);
  const [scaleWeight, setScaleWeight] = useState<number>(0);
  const [activeInvoiceForPrint, setActiveInvoiceForPrint] = useState<Invoice | null>(null);

  const barcodeRef = useRef<HTMLInputElement>(null);

  // Calculations
  const calc = usePosCalculations(cart, selectedCustomer, taxType, 0, { name: '', amount: 0 });

  // Barcode search and auto add
  const handleBarcodeSubmit = () => {
    if (!barcodeInput.trim()) return;
    const term = barcodeInput.trim().toLowerCase();
    const found = products.find(p => p.barcode === term || p.code.toLowerCase() === term || p.name.toLowerCase().includes(term));
    if (found) {
      setItemMrp(found.mrp.toFixed(2));
      setItemQty('1');
      setItemPrice((priceMode === 'WHOLESALE' ? found.wholesalePrice : found.retailPrice).toString());
      setItemUnit(found.unit || 'Unit');

      const rate = priceMode === 'WHOLESALE' ? found.wholesalePrice : found.retailPrice;
      const { discountAmt, taxableAmt, cgstRate, sgstRate, igstRate, cgstAmt, sgstAmt, igstAmt, total } = calculateLineItem(
        1,
        rate,
        found.mrp,
        itemDiscType,
        0,
        found.taxRate,
        customerState,
        taxType
      );

      const newItem: CartItem = {
        id: `cart-${Date.now()}`,
        productId: found.id,
        code: found.code,
        barcode: found.barcode,
        name: found.name,
        regionalName: found.regionalName,
        hsn: found.hsn,
        qty: 1,
        unit: found.unit,
        mrp: found.mrp,
        rate,
        discountType: itemDiscType,
        discountValue: 0,
        discountAmt,
        taxableAmt,
        cgstRate,
        sgstRate,
        igstRate,
        cgstAmt,
        sgstAmt,
        igstAmt,
        total
      };

      setCart(prev => [...prev, newItem]);
      setSelectedRowId(newItem.id);
      setBarcodeInput('');
    } else {
      alert(`Barcode ${barcodeInput} not found!`);
    }
  };

  // Helper to build invoice for print
  const buildCurrentInvoice = (paymentMode: string = 'Cash', payments?: PaymentSplit[]): Invoice => ({
    id: `inv-${Date.now()}`,
    invoiceNo,
    date: invoiceDate,
    time: currentTime,
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
    status: 'PAID',
    designStyle: billDesignConfig.style
  });

  const handleQuickPay = () => {
    if (cart.length === 0) return alert('Bill is empty!');
    const inv = buildCurrentInvoice('By Cash');
    setActiveInvoiceForPrint(inv);
    setShowPrintModal(true);
  };

  const handleNewBill = () => {
    setCart([]);
    const nextNum = parseInt(invoiceNo.replace(/\D/g, '')) + 1;
    setInvoiceNo(`GST-000${nextNum}-2026/27`);
  };

  const handleHold = () => {
    if (cart.length === 0) return;
    const hold: HoldBill = {
      id: `hold-${Date.now()}`,
      timestamp: currentTime,
      holdNumber: holdBills.length + 1,
      customer: selectedCustomer,
      items: cart,
      billDiscount: 0,
      sundry: { name: '', amount: 0 },
      netPay: calc.netPay
    };
    setHoldBills(prev => [hold, ...prev]);
    setCart([]);
  };

  const handleUnhold = () => {
    if (holdBills.length > 0) {
      setShowHoldBillsModal(true);
    } else {
      alert('No bills currently on Hold');
    }
  };

  // Keyboard Shortcuts Hook
  usePosShortcuts({
    onNewBill: handleNewBill,
    onQuickPay: handleQuickPay,
    onPrint: () => {
      if (cart.length > 0) {
        setActiveInvoiceForPrint(buildCurrentInvoice());
        setShowPrintModal(true);
      }
    },
    onTogglePriceMode: () => setPriceMode(p => p === 'RETAIL' ? 'WHOLESALE' : 'RETAIL'),
    onHoldBill: handleHold,
    onUnholdBill: handleUnhold
  });

  return (
    <div className="rd-desktop-container">
      {/* ----------------------------------------------------------------------
          1. TOP WINDOW TITLE BAR (Raintech Software Limited Enterprise Shell)
          ---------------------------------------------------------------------- */}
      <div className="rd-titlebar">
        <div className="rd-titlebar-text">
          <span className="rd-titlebar-icon">POS</span>
          <span>
            Raintech Software Limited | Rel 1.8 | Enterprise Edition | Multiuser Mode | Valid Upto : 26-10-2026 | Shree Vinayaka Furnitures | FY : 01-04-2026 - 31-03-2027
          </span>
        </div>
        <div className="rd-window-controls">
          <button className="rd-win-btn" title="Minimize">_</button>
          <button className="rd-win-btn" title="Maximize">□</button>
          <button className="rd-win-btn close" onClick={onBackToShowroom} title="Exit to Showroom">✕</button>
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          2. TOP 16-ICON MENU RIBBON (screen_005.jpg, screen_017.jpg, screen_025.jpg)
          ---------------------------------------------------------------------- */}
      <div className="rd-ribbon-menu">
        {[
          { id: 'master', label: 'Master Entry', iconBg: '#38bdf8', icon: '📋' },
          { id: 'trans', label: 'Transaction', iconBg: '#0284c7', icon: '⚙️' },
          { id: 'services', label: 'Services', iconBg: '#3b82f6', icon: '🔧' },
          { id: 'utilities', label: 'Utilities', iconBg: '#0369a1', icon: '🛠️' },
          { id: 'inventory', label: 'Inventory', iconBg: '#60a5fa', icon: '📦' },
          { id: 'banking', label: 'Banking', iconBg: '#0ea5e9', icon: '🏛️' },
          { id: 'payroll', label: 'Payroll', iconBg: '#38bdf8', icon: '🖩' },
          { id: 'records', label: 'Records', iconBg: '#0284c7', icon: '📁' },
          { id: 'reports', label: 'Reports', iconBg: '#0369a1', icon: '📊' },
          { id: 'tax', label: 'Tax Report', iconBg: '#3b82f6', icon: '📑' },
          { id: 'db', label: 'Database', iconBg: '#0284c7', icon: '🗄️' },
          { id: 'export', label: 'Export / Import', iconBg: '#10b981', icon: '📊' },
          { id: 'barcode', label: 'Barcode', iconBg: '#0ea5e9', icon: '🏷️' },
          { id: 'settings', label: 'Settings', iconBg: '#0284c7', icon: '⚙️' },
          { id: 'messenger', label: 'Messenger', iconBg: '#2563eb', icon: '✈️' },
          { id: 'admin', label: 'Administrator', iconBg: '#0369a1', icon: '👤' }
        ].map(item => (
          <div 
            key={item.id} 
            className={`rd-ribbon-item ${activeMenuTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveMenuTab(activeMenuTab === item.id ? null : item.id)}
          >
            <div className="rd-ribbon-icon-wrap" style={{ background: item.iconBg }}>
              {item.icon}
            </div>
            <span className="rd-ribbon-label">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Sub-Ribbon Cards (when clicking a Menu Tab like Master Entry or Transaction) */}
      {activeMenuTab === 'master' && (
        <div className="rd-sub-ribbon">
          {[
            { label: 'Company Info', icon: '🏢' },
            { label: 'Category', icon: '🗂️' },
            { label: 'Sub Category / Brand', icon: '🏷️' },
            { label: 'Unit Master', icon: '⚖️' },
            { label: 'Tax Category', icon: '🧾' },
            { label: 'Tax Type', icon: '📝' },
            { label: 'Product Order Section', icon: '📦' },
            { label: 'Products', icon: '🛒', action: () => setShowBulkEditorModal(true) },
            { label: 'Sales Person', icon: '👔' },
            { label: 'Customer', icon: '👥', action: () => setShowCustomerModal(true) },
            { label: 'Supplier', icon: '👷' },
            { label: 'Bill Sundry Head', icon: '📒' },
            { label: 'Account Head', icon: '👤' },
            { label: 'Transporter', icon: '🚚' },
            { label: 'Language Setting', icon: '🌐' }
          ].map((sub, idx) => (
            <div key={idx} className="rd-sub-card" onClick={sub.action}>
              <span style={{ fontSize: '24px' }}>{sub.icon}</span>
              <span className="rd-sub-card-label">{sub.label}</span>
            </div>
          ))}
        </div>
      )}

      {activeMenuTab === 'trans' && (
        <div className="rd-sub-ribbon">
          {[
            { label: 'Point of Sale', icon: '🛒', action: () => setIsPosWindowOpen(true) },
            { label: 'Rubic POS', icon: '🎲' },
            { label: 'Estimate / Delivery Note', icon: '📋' },
            { label: 'Sales Return (Cr.Note)', icon: '🔄' },
            { label: 'Quotation', icon: '📱', action: () => setShowQuotationModal(true) },
            { label: 'Purchase Entry', icon: '📦' },
            { label: 'Receipt (From Customer)', icon: '🧾' },
            { label: 'Payment (To Supplier)', icon: '💳' },
            { label: 'Expense Voucher', icon: '💵' }
          ].map((sub, idx) => (
            <div key={idx} className="rd-sub-card" onClick={sub.action}>
              <span style={{ fontSize: '24px' }}>{sub.icon}</span>
              <span className="rd-sub-card-label">{sub.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ----------------------------------------------------------------------
          3. BIG ACTION BAR (screen_005.jpg)
          [Gorilla] [Add Product] [Sale POS F1] [Rubic POS] [Purchase F2] [LogOut]
          ---------------------------------------------------------------------- */}
      <div className="rd-quick-bar">
        <button className="rd-quick-btn" title="Gorilla Mode">
          <span>🦍</span> Gorilla
        </button>

        <button className="rd-quick-btn" onClick={() => setShowBulkEditorModal(true)}>
          <span style={{ color: '#eab308' }}>🏷️+</span> Add Product
        </button>

        <button 
          className="rd-quick-btn sale-pos" 
          onClick={() => setIsPosWindowOpen(true)}
          title="F1 - Launch Point of Sale Screen"
        >
          <span>🛒</span> Sale POS <span style={{ fontSize: '10px', background: '#e11d48', color: '#fff', padding: '1px 4px', borderRadius: '2px' }}>F1</span>
        </button>

        <button className="rd-quick-btn">
          <span>🎲</span> Rubic POS
        </button>

        <button className="rd-quick-btn purchase" onClick={() => alert('Purchase Panel (F2)')}>
          <span>📦</span> Purchase <span style={{ fontSize: '10px', background: '#059669', color: '#fff', padding: '1px 4px', borderRadius: '2px' }}>F2</span>
        </button>

        <button className="rd-quick-btn logout" onClick={onBackToShowroom} title="Return to Public Showroom">
          <span>⭕</span> LogOut
        </button>
      </div>

      {/* ----------------------------------------------------------------------
          4. DESKTOP CANVAS (Wallpaper with Money Tree & Retail Daddy 1.8 AI)
          ---------------------------------------------------------------------- */}
      <div className="rd-desktop-canvas">
        {/* Money tree illustration & pot matching screen_005.jpg */}
        <div className="rd-money-tree">
          <svg viewBox="0 0 300 400" width="100%" height="100%">
            <defs>
              <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#451a03" />
                <stop offset="50%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>
              <radialGradient id="leafGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#86efac" />
                <stop offset="70%" stopColor="#15803d" />
                <stop offset="100%" stopColor="#14532d" />
              </radialGradient>
            </defs>
            {/* Trunk */}
            <path d="M 120 300 Q 140 220 110 180 Q 90 140 100 90" stroke="url(#trunkGrad)" strokeWidth="18" fill="none" strokeLinecap="round" />
            <path d="M 140 300 Q 170 230 180 170 Q 190 130 160 80" stroke="url(#trunkGrad)" strokeWidth="16" fill="none" strokeLinecap="round" />
            <path d="M 150 220 Q 210 190 220 130" stroke="url(#trunkGrad)" strokeWidth="12" fill="none" strokeLinecap="round" />
            
            {/* Money Bush 1 */}
            <circle cx="90" cy="90" r="50" fill="url(#leafGrad)" />
            <rect x="75" y="70" width="30" height="18" rx="2" fill="#dcfce7" stroke="#16a34a" strokeWidth="1" transform="rotate(-15 90 80)" />
            <text x="82" y="83" fontSize="8" fontWeight="bold" fill="#166534">₹500</text>
            
            {/* Money Bush 2 */}
            <circle cx="160" cy="70" r="60" fill="url(#leafGrad)" />
            <rect x="145" y="55" width="32" height="19" rx="2" fill="#dcfce7" stroke="#16a34a" strokeWidth="1" transform="rotate(10 160 65)" />
            <text x="151" y="68" fontSize="8" fontWeight="bold" fill="#166534">₹2000</text>

            {/* Money Bush 3 */}
            <circle cx="220" cy="120" r="45" fill="url(#leafGrad)" />
            <rect x="210" y="110" width="28" height="16" rx="2" fill="#dcfce7" stroke="#16a34a" strokeWidth="1" transform="rotate(25 220 120)" />
            <text x="215" y="122" fontSize="7" fontWeight="bold" fill="#166534">₹500</text>

            {/* White Pot matching screen_005 "Label1" */}
            <polygon points="100,300 200,300 185,380 115,380" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
            <rect x="135" y="335" width="32" height="12" fill="#f1f5f9" rx="2" />
            <text x="138" y="344" fontSize="8" fill="#64748b" fontWeight="bold">Label1</text>
          </svg>
        </div>

        {/* Center Logo */}
        <div className="rd-center-logo">
          <h1 className="rd-logo-title">Retail Daddy</h1>
          <div className="rd-logo-sub">
            <span>VERSION 1.8</span>
            <span className="rd-ai-badge">AI</span>
          </div>
        </div>

        {/* Gold Crown 10th Anniversary Banner matching screen_005 */}
        <div className="rd-anniversary-banner">
          <span style={{ fontSize: '20px' }}>👑</span>
          <span>Raintech Software Ltd. • <strong>10th Anniversary Edition</strong></span>
        </div>

        {/* ------------------------------------------------------------------
            5. SALE POS WINDOW: "Customer's Statement" (screen_044.jpg)
            Matches screen_044 pixel-for-pixel!
            ------------------------------------------------------------------ */}
        {isPosWindowOpen && (
          <div className="rd-pos-window">
            {/* Window Title Bar */}
            <div className="rd-pos-header-bar">
              <span style={{ color: '#0f172a' }}>Customer's Statement</span>
              <div className="rd-window-controls">
                <button className="rd-win-btn" onClick={() => setIsPosWindowOpen(false)}>_</button>
                <button className="rd-win-btn">□</button>
                <button className="rd-win-btn close" onClick={() => setIsPosWindowOpen(false)}>✕</button>
              </div>
            </div>

            {/* Top Lime Green Bar */}
            <div className="rd-pos-top-ribbon">
              <span className="rd-pos-title">POINT OF SALE</span>

              <div className="rd-pos-radio-group">
                <label>
                  <input 
                    type="radio" 
                    name="priceMode" 
                    checked={priceMode === 'RETAIL'} 
                    onChange={() => setPriceMode('RETAIL')} 
                  /> Retail Price
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="priceMode" 
                    checked={priceMode === 'WHOLESALE'} 
                    onChange={() => setPriceMode('WHOLESALE')} 
                  /> Wholesale Price
                </label>
              </div>

              <div className="rd-pos-meta-inputs">
                <span style={{ fontWeight: 700, fontSize: '11px' }}>Invoice No :</span>
                <input 
                  type="text" 
                  value={invoiceNo}
                  readOnly
                  style={{ width: '150px', background: '#ffffff', fontWeight: 800, padding: '2px 4px', border: '1px solid #84cc16' }}
                />

                <span style={{ fontWeight: 700, fontSize: '11px' }}>Date :</span>
                <select 
                  value={invoiceDate}
                  onChange={e => setInvoiceDate(e.target.value)}
                  style={{ background: '#ffffff', padding: '2px 4px', border: '1px solid #94a3b8', fontSize: '11px' }}
                >
                  <option value="10/04/2026">10/04/2026</option>
                  <option value="15/10/2026">15/10/2026</option>
                </select>

                <span style={{ fontWeight: 700, fontSize: '11px' }}>Tax :</span>
                <select 
                  value={taxType}
                  onChange={e => setTaxType(e.target.value as TaxType)}
                  style={{ background: '#ffffff', padding: '2px 4px', border: '1px solid #94a3b8', fontSize: '11px' }}
                >
                  <option value="GST">GST</option>
                  <option value="COMPOSITION">Composition</option>
                  <option value="NON_GST">Non-GST</option>
                </select>
              </div>
            </div>

            {/* Sub-Tabs: Sale | D-Sale | Bill Design | Dash board | Pay */}
            <div className="rd-pos-subtabs">
              {(['Sale', 'D-Sale', 'Bill Design', 'Dash board', 'Pay'] as const).map(tab => (
                <button 
                  key={tab}
                  className={`rd-tab-btn ${activeSubTab === tab ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSubTab(tab);
                    if (tab === 'Pay') setShowMultiPayModal(true);
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* If Bill Design tab is selected (screen_716.jpg) */}
            {activeSubTab === 'Bill Design' ? (
              <div style={{ flex: 1, background: '#f8fafc', padding: '16px', display: 'flex', gap: '20px', overflowY: 'auto' }}>
                <div style={{ width: '180px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontWeight: 700, fontSize: '12px' }}>Paper Size:</div>
                  <label><input type="radio" name="paper" defaultChecked /> 3 Inch Thermal</label>
                  <label><input type="radio" name="paper" /> A4 Size GST</label>
                  <label><input type="radio" name="paper" /> A5 Half Slip</label>
                  <button 
                    style={{ marginTop: '20px', padding: '8px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 800, cursor: 'pointer' }}
                    onClick={() => setActiveSubTab('Sale')}
                  >
                    Apply Template
                  </button>
                </div>
                <div style={{ flex: 1, background: '#fff', border: '1px solid #cbd5e1', padding: '20px', borderRadius: '4px', maxWidth: '340px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
                    <div style={{ fontSize: '16px', fontWeight: 900 }}>SHREE VINAYAKA FURNITURES</div>
                    <div style={{ fontSize: '10px' }}>#42, 1st Cross, Ring Road Industrial Area, Bengaluru</div>
                    <div style={{ fontSize: '10px' }}>संपर्क : +91 98450 12345</div>
                    <div style={{ fontSize: '10px' }}>जी.एस.टी.आई.एन. : 29AABCS8899K1ZK</div>
                  </div>
                  <div style={{ fontSize: '10px', padding: '6px 0', borderBottom: '1px dashed #000' }}>
                    <div>चालान नंबर : {invoiceNo}</div>
                    <div>ग्राहक का नाम : {selectedCustomer.name}</div>
                    <div>संपर्क : {customerPhone}</div>
                  </div>
                  <table style={{ width: '100%', fontSize: '10px', marginTop: '6px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #000' }}>
                        <th style={{ textAlign: 'left' }}>उत्पाद</th>
                        <th style={{ textAlign: 'right' }}>दर</th>
                        <th style={{ textAlign: 'center' }}>मात्रा</th>
                        <th style={{ textAlign: 'right' }}>कुल</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map(it => (
                        <tr key={it.id}>
                          <td>{it.name}</td>
                          <td style={{ textAlign: 'right' }}>{it.rate}</td>
                          <td style={{ textAlign: 'center' }}>{it.qty}</td>
                          <td style={{ textAlign: 'right' }}>{it.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ textAlign: 'right', marginTop: '12px', fontSize: '13px', fontWeight: 900, borderTop: '1px dashed #000', paddingTop: '6px' }}>
                    कुल राशि: ₹ {calc.netPay.toFixed(2)}
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '11px', fontWeight: 700 }}>
                    धन्यवाद... पुनः पधारें!
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Customer Information Row (screen_044.jpg) */}
                <div className="rd-customer-row">
                  <button 
                    className="rd-pill-btn" 
                    onClick={() => {
                      setSelectedCustomer(INITIAL_CUSTOMERS[0]);
                      setCustomerPhone('1234567890');
                      setCustomerState('Kerala');
                    }}
                  >
                    Default
                  </button>

                  <button 
                    className="rd-pill-btn" 
                    style={{ background: '#dbeafe', color: '#1d4ed8' }}
                    onClick={() => setShowCustomerModal(true)}
                    title="Add New Customer"
                  >
                    👤+
                  </button>

                  <select 
                    value={selectedCustomer.id}
                    onChange={e => {
                      const c = customers.find(cust => cust.id === e.target.value);
                      if (c) {
                        setSelectedCustomer(c);
                        setCustomerPhone(c.contactNo);
                        setCustomerState(c.state);
                      }
                    }}
                    style={{ width: '120px', padding: '2px 4px', border: '1px solid #94a3b8', background: '#fff', fontSize: '12px' }}
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <input 
                    type="text" 
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="rd-input-yellow" 
                    style={{ width: '110px' }}
                  />

                  <select 
                    value={customerState}
                    onChange={e => setCustomerState(e.target.value)}
                    style={{ width: '85px', padding: '2px 4px', border: '1px solid #94a3b8', background: '#fff', fontSize: '12px' }}
                  >
                    <option value="Kerala">Kerala</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                  </select>

                  <button className="rd-pill-btn" style={{ padding: '2px 6px' }}>🔍</button>
                  <button className="rd-pill-btn" style={{ padding: '2px 6px' }}>▾</button>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 600 }}>
                    <input type="checkbox" checked={forSerial} onChange={e => setForSerial(e.target.checked)} /> For Serial
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 600 }}>
                    <input type="checkbox" checked={wBarcode} onChange={e => setWBarcode(e.target.checked)} /> W-Barcode
                  </label>

                  <button 
                    className="rd-cursor-setting-pill" 
                    onClick={() => setShowCursorSettingModal(true)}
                  >
                    Cusrsor Setting
                  </button>
                </div>

                {/* Barcode & Fast Item Entry Row (screen_044.jpg) */}
                <div className="rd-item-entry-row">
                  <div className="rd-field-item">
                    <button 
                      style={{ padding: '2px 8px', background: '#fff', border: '1px solid #94a3b8', borderRadius: '3px', fontWeight: 700, fontSize: '11px' }}
                      onClick={() => setShowBulkEditorModal(true)}
                    >
                      Product ▾
                    </button>
                  </div>

                  <div className="rd-field-item">
                    <label>Barcode : *</label>
                    <label style={{ fontSize: '10px', color: '#64748b' }}>
                      <input type="checkbox" checked={forDSale} onChange={e => setForDSale(e.target.checked)} /> For D-Sale
                    </label>
                    <input 
                      ref={barcodeRef}
                      type="text" 
                      value={barcodeInput}
                      onChange={e => setBarcodeInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleBarcodeSubmit()}
                      placeholder="1214..."
                      className="rd-input-yellow"
                      style={{ width: '80px' }}
                    />
                  </div>

                  <div className="rd-field-item">
                    <label>MRP :</label>
                    <input type="text" readOnly value={itemMrp} className="rd-input-yellow" style={{ width: '50px', textAlign: 'right' }} />
                  </div>

                  <div className="rd-field-item">
                    <label>QTY : *</label>
                    <input 
                      type="text" 
                      value={itemQty} 
                      onChange={e => setItemQty(e.target.value)}
                      className="rd-input-yellow" 
                      style={{ width: '38px', textAlign: 'center' }} 
                    />
                  </div>

                  <div className="rd-field-item">
                    <label>Unit :</label>
                    <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700 }}>Alt Unit</span>
                    <select 
                      value={itemUnit}
                      onChange={e => setItemUnit(e.target.value)}
                      className="rd-input-yellow" 
                      style={{ width: '60px' }}
                    >
                      <option value="Unit">Unit</option>
                      <option value="SET">SET</option>
                      <option value="PCS">PCS</option>
                      <option value="KG">KG</option>
                    </select>
                  </div>

                  <div className="rd-field-item">
                    <label>Price/Main Unit :</label>
                    <input 
                      type="text" 
                      value={itemPrice}
                      onChange={e => setItemPrice(e.target.value)}
                      className="rd-input-yellow" 
                      style={{ width: '70px', textAlign: 'right' }} 
                    />
                  </div>

                  <div className="rd-field-item">
                    <label>Disc Type :</label>
                    <select 
                      value={itemDiscType}
                      onChange={e => setItemDiscType(e.target.value as DiscountType)}
                      style={{ width: '42px', padding: '1px' }}
                    >
                      <option value="PERCENT">%</option>
                      <option value="FLAT">₹</option>
                    </select>
                  </div>

                  <div className="rd-field-item">
                    <label>Total Disc Amt :</label>
                    <input type="text" readOnly value={totalDiscAmt} style={{ width: '50px', textAlign: 'right' }} />
                  </div>

                  <div className="rd-field-item">
                    <label>Total Amt :</label>
                    <input type="text" readOnly value={totalAmt} style={{ width: '55px', textAlign: 'right' }} />
                  </div>
                </div>

                {/* Action Ribbon: Salesman, Hold, Unhold, Weighing Scale, Quotation, Online Order */}
                <div className="rd-action-ribbon">
                  <button className="rd-action-card-btn" onClick={() => alert('Salesman Assign')}>
                    <span>👔</span> Salesman
                  </button>

                  <button className="rd-action-card-btn" onClick={handleHold}>
                    <span style={{ color: '#7c3aed' }}>🔒</span> Hold
                  </button>

                  <button className="rd-action-card-btn" onClick={handleUnhold}>
                    <span style={{ color: '#7c3aed' }}>🔓</span> Unhold {holdBills.length > 0 && `(${holdBills.length})`}
                  </button>

                  <button className="rd-action-card-btn scale" onClick={() => setShowScaleModal(true)}>
                    <span>⚖️</span> Weighing Scale
                  </button>

                  <button className="rd-action-card-btn" onClick={() => setShowQuotationModal(true)}>
                    <span style={{ color: '#ea580c' }}>🔍</span> Quotation
                  </button>

                  <button className="rd-action-card-btn">
                    <span>📱</span> Online Order
                  </button>

                  {/* Giant Net Pay Display in Ribbon */}
                  <div className="rd-giant-netpay">
                    Net Pay : {calc.netPay.toFixed(2)}
                  </div>

                  <div className="rd-round-btn-group">
                    <button className="rd-round-tool-btn green" onClick={handleBarcodeSubmit}>↻</button>
                    <button 
                      className="rd-round-tool-btn" 
                      onClick={() => {
                        if (selectedRowId) {
                          setCart(prev => prev.filter(it => it.id !== selectedRowId));
                        }
                      }}
                    >
                      -
                    </button>
                    <button className="rd-round-tool-btn" onClick={() => setShowIndexSettingModal(true)}>⎘</button>
                    <button className="rd-round-tool-btn green" onClick={handleBarcodeSubmit}>+</button>
                  </div>
                </div>

                {/* Line Items Grid Table (screen_044.jpg exact columns) */}
                <div className="rd-table-viewport">
                  <table className="rd-grid-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>HSN Code</th>
                        <th>Product Name</th>
                        <th style={{ width: '90px' }}>Barcode</th>
                        <th className="numeric" style={{ width: '45px' }}>Qty</th>
                        <th className="numeric" style={{ width: '60px' }}>Rate</th>
                        <th className="numeric" style={{ width: '50px' }}>Disc %</th>
                        <th className="numeric" style={{ width: '60px' }}>Disc Amt</th>
                        <th className="numeric" style={{ width: '70px' }}>Total</th>
                        <th style={{ width: '75px' }}>SalesMan</th>
                        <th className="numeric" style={{ width: '45px' }}>%</th>
                        <th className="numeric" style={{ width: '65px' }}>Commision</th>
                        <th style={{ width: '60px' }}>StockId</th>
                        <th className="numeric" style={{ width: '50px' }}>Points</th>
                        <th style={{ width: '50px' }}>Qty Pcs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map(item => (
                        <tr 
                          key={item.id}
                          className={selectedRowId === item.id ? 'selected' : ''}
                          onClick={() => setSelectedRowId(item.id)}
                        >
                          <td>{item.hsn}</td>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td>{item.barcode}</td>
                          <td className="numeric">{item.qty}</td>
                          <td className="numeric">{item.rate}</td>
                          <td className="numeric">{item.discountValue}</td>
                          <td className="numeric">{item.discountAmt}</td>
                          <td className="numeric" style={{ fontWeight: 700 }}>{item.total}</td>
                          <td>{item.salesmanName || ''}</td>
                          <td className="numeric">0.00</td>
                          <td className="numeric">0</td>
                          <td></td>
                          <td className="numeric">0</td>
                          <td></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Section (screen_044.jpg) */}
                <div className="rd-pos-bottom-footer">
                  {/* Left: Estimate, Sales Return, E-way bill */}
                  <div className="rd-footer-left">
                    <div className="rd-btn-row">
                      <button className="rd-classic-btn">
                        <span>🖩</span> Estimate
                      </button>
                      <button className="rd-classic-btn">
                        <span>📋</span> Old Estimate
                      </button>
                    </div>

                    <div className="rd-btn-row">
                      <button className="rd-classic-btn">
                        <span>🛒</span> Sales Return
                      </button>
                      <button className="rd-classic-btn">
                        SalesReturnRecord
                      </button>
                    </div>

                    <div className="rd-eway-btn">
                      <span style={{ fontSize: '18px' }}>🚚</span>
                      <div>
                        <div>E-way Bill</div>
                        <div style={{ fontSize: '9px', color: '#64748b' }}>Shortcut Key 1900</div>
                      </div>
                    </div>
                  </div>

                  {/* Center: 6-Column Summary Table (ITEMS, QTY, DISCOUNT, TAX, BILL MRP, BILL NET AMT) */}
                  <div>
                    <table className="rd-summary-table">
                      <thead>
                        <tr>
                          <th>ITEMS</th>
                          <th>QTY</th>
                          <th>DISCOUNT</th>
                          <th>TAX</th>
                          <th>BILL MRP</th>
                          <th>BILL NET AMT</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{calc.itemsCount}.00</td>
                          <td>{calc.totalQty.toFixed(3)}</td>
                          <td>{calc.itemDiscountTotal.toFixed(2)}</td>
                          <td>{calc.taxTotal.toFixed(2)}</td>
                          <td>{calc.billMrp}</td>
                          <td>{calc.netPay}.00</td>
                        </tr>
                        <tr>
                          <td>0.00</td>
                          <td>0.00</td>
                          <td>0.00</td>
                          <td></td>
                          <td></td>
                          <td>0.00</td>
                        </tr>
                        <tr className="total-row">
                          <td>{calc.itemsCount}</td>
                          <td>{calc.totalQty}</td>
                          <td>0</td>
                          <td>{calc.taxTotal.toFixed(2)}</td>
                          <td>{calc.billMrp}</td>
                          <td style={{ color: '#15803d' }}>{calc.netPay}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Right: Payment & Action Buttons */}
                  <div className="rd-footer-right">
                    <div className="rd-pay-top-row">
                      <button className="rd-pay-btn-wallet" onClick={() => setShowMultiPayModal(true)}>
                        <span style={{ color: '#2563eb' }}>👛</span> Pay
                      </button>
                      <button className="rd-pay-btn-upi" onClick={() => setShowMultiPayModal(true)}>
                        <strong style={{ color: '#ea580c' }}>UPI</strong> UPI Pay
                      </button>
                    </div>

                    <div className="rd-pay-middle-row">
                      <button className="rd-btn-mpay" onClick={() => setShowMultiPayModal(true)}>
                        M-PAY
                      </button>

                      <button className="rd-btn-quickpay" onClick={handleQuickPay}>
                        <span style={{ fontSize: '20px', color: '#16a34a' }}>✔</span>
                        <span className="rd-quickpay-text">Quick Pay</span>
                        <span className="rd-quickpay-f4">F4</span>
                      </button>
                    </div>

                    <div className="rd-action-fkeys-row">
                      <button className="rd-fkey-btn" onClick={handleNewBill}>
                        <span>📄</span> New
                      </button>
                      <button className="rd-fkey-btn" onClick={() => alert('Bill Updated')}>
                        <span>🔄</span> Update <small style={{ color: '#64748b' }}>F3</small>
                      </button>
                      <button className="rd-fkey-btn" onClick={() => alert('Search Old Bills')}>
                        <span>📁</span> Old Bill <small style={{ color: '#64748b' }}>F5</small>
                      </button>
                      <button 
                        className="rd-fkey-btn" 
                        onClick={() => {
                          if (cart.length > 0) {
                            setActiveInvoiceForPrint(buildCurrentInvoice());
                            setShowPrintModal(true);
                          }
                        }}
                      >
                        <span>🖨️</span> Print <small style={{ color: '#64748b' }}>F6</small>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------------------
          6. BOTTOM WINDOW STATUS BAR (screen_005.jpg)
          ---------------------------------------------------------------------- */}
      <div style={{ background: '#0284c7', color: '#ffffff', padding: '3px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Logged in As :</span>
          <span>👤 Admin : admin</span>
        </div>
        <div>
          Shree Vinayaka Furnitures • Raintech Software Limited
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span>💬 +9186060 93110</span>
          <span>✉️ raintech9847158963@gmail.com</span>
          <span>📅 {currentTime}</span>
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          7. MODALS
          ---------------------------------------------------------------------- */}
      {/* Weighing Scale Modal (Screen 066) */}
      {showScaleModal && (
        <div className="rd-modal-backdrop">
          <div className="rd-form-window" style={{ width: '400px' }}>
            <div className="rd-form-titlebar">
              <span>Weighing Scale Integration</span>
              <button className="rd-win-btn close" onClick={() => setShowScaleModal(false)}>✕</button>
            </div>
            <div style={{ padding: '16px', background: '#f8fafc' }}>
              <div style={{ background: '#0f172a', color: '#4ade80', padding: '16px', borderRadius: '4px', textAlign: 'center', fontFamily: 'monospace', fontSize: '28px', fontWeight: 900 }}>
                {(scaleWeight || 1.450).toFixed(3)} KG
              </div>
              <div style={{ marginTop: '12px' }}>
                <label style={{ fontWeight: 700, fontSize: '11px' }}>Enter Simulated Weight (Kg):</label>
                <input 
                  type="number" 
                  step="0.001"
                  value={scaleWeight} 
                  onChange={e => setScaleWeight(parseFloat(e.target.value) || 0)}
                  className="rd-input-yellow"
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button className="rd-classic-btn" onClick={() => setShowScaleModal(false)}>Cancel</button>
                <button 
                  className="rd-classic-btn" 
                  style={{ background: '#16a34a', color: '#fff', borderColor: '#15803d' }}
                  onClick={() => {
                    setItemQty((scaleWeight || 1.450).toString());
                    setShowScaleModal(false);
                  }}
                >
                  Transfer Weight
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Entry Modal (Screen 661) */}
      <CustomerEntryModal 
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSaveCustomer={cust => {
          setCustomers(prev => [cust, ...prev]);
          setSelectedCustomer(cust);
          setCustomerPhone(cust.contactNo);
          setCustomerState(cust.state);
          setShowCustomerModal(false);
        }}
      />

      {/* Multi Bill Payment Modal (Screen 500 frmMultiBillPayment) */}
      <MultiBillPaymentModal 
        isOpen={showMultiPayModal}
        onClose={() => setShowMultiPayModal(false)}
        netPay={calc.netPay}
        onSavePayments={payments => {
          const inv = buildCurrentInvoice('Multi-Pay', payments);
          setShowMultiPayModal(false);
          setActiveInvoiceForPrint(inv);
          setShowPrintModal(true);
        }}
      />

      {/* Index Setting Modal (Screen 061) */}
      <IndexSettingModal 
        isOpen={showIndexSettingModal}
        onClose={() => setShowIndexSettingModal(false)}
        columns={columns}
        onSaveColumns={cols => {
          setColumns(cols);
          setShowIndexSettingModal(false);
        }}
      />

      {/* Cursor Setting Modal (Screen 045) */}
      <CursorSettingModal 
        isOpen={showCursorSettingModal}
        onClose={() => setShowCursorSettingModal(false)}
        flow={cursorFlow}
        onSaveFlow={fl => {
          setCursorFlow(fl);
          setShowCursorSettingModal(false);
        }}
      />

      {/* Quotation List Modal (Screen 522) */}
      <QuotationListModal 
        isOpen={showQuotationModal}
        onClose={() => setShowQuotationModal(false)}
        quotations={quotations}
        onLoadQuotation={q => {
          setCart(q.items);
          setSelectedCustomer(q.customer);
          setShowQuotationModal(false);
        }}
      />

      {/* Hold Bills Modal (Feature 44) */}
      <HoldBillsModal 
        isOpen={showHoldBillsModal}
        onClose={() => setShowHoldBillsModal(false)}
        holdBills={holdBills}
        onRestoreHoldBill={bill => {
          setCart(bill.items);
          setSelectedCustomer(bill.customer);
          setHoldBills(prev => prev.filter(b => b.id !== bill.id));
          setShowHoldBillsModal(false);
        }}
        onDeleteHoldBill={id => setHoldBills(prev => prev.filter(b => b.id !== id))}
      />

      {/* Print Preview Modal (Screens 050, 080, 716) */}
      <PrintPreviewModal 
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        invoice={activeInvoiceForPrint}
        designConfig={billDesignConfig}
      />

      {/* Bulk Product Editor (Screen 556) */}
      <ProductBulkEditorModal 
        isOpen={showBulkEditorModal}
        onClose={() => setShowBulkEditorModal(false)}
        products={products}
        onSaveProducts={prods => {
          setProducts(prods);
          setShowBulkEditorModal(false);
        }}
      />
    </div>
  );
};
