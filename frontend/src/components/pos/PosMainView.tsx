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
  DEFAULT_CURSOR_FLOW,
  INITIAL_INVOICES,
  INITIAL_QUOTATIONS
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
import { OldBillsSearchModal } from './modals/OldBillsSearchModal';
import { EWayBillModal } from './modals/EWayBillModal';
import { SalesmanAssignModal } from './modals/SalesmanAssignModal';
import { ProductSearchPickerModal } from './modals/ProductSearchPickerModal';
import { SalesReturnModal } from './modals/SalesReturnModal';
import { PurchaseEntryModal } from './modals/PurchaseEntryModal';
import { ErpSubModuleModal, type ErpModuleType } from './modals/ErpSubModuleModal';
import { LastSoldPriceModal } from './modals/LastSoldPriceModal';
import { BillSundryModal } from './modals/BillSundryModal';
import { CashVoucherModal, type VoucherType } from './modals/CashVoucherModal';
import { SerialNumberModal } from './modals/SerialNumberModal';
import { BillDiscountModal } from './modals/BillDiscountModal';

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
  const [billDesignConfig, setBillDesignConfig] = useState<BillDesignConfig>(INITIAL_BILL_DESIGN);

  // Invoices & Quotations
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [quotations] = useState<Quotation[]>(INITIAL_QUOTATIONS);
  const [holdBills, setHoldBills] = useState<HoldBill[]>([]);

  // Shell State
  const [activeMenuTab, setActiveMenuTab] = useState<string | null>(null);
  const [isPosWindowOpen, setIsPosWindowOpen] = useState(true);
  const [isPosWindowMaximized, setIsPosWindowMaximized] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'Sale' | 'D-Sale' | 'Bill Design' | 'Dash board' | 'Pay'>('Sale');
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString('en-US'));

  // Modes
  const [isGorillaMode, setIsGorillaMode] = useState(false);
  const [isRubicMode, setIsRubicMode] = useState(false);
  const [rubicCategory, setRubicCategory] = useState('ALL');
  const [isEstimateMode, setIsEstimateMode] = useState(false);

  // Active Salesman
  const [activeSalesman, setActiveSalesman] = useState('Mahesh (Counter 1)');
  const [salesmanCommissionPct, setSalesmanCommissionPct] = useState(2.5);

  // Notification Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

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

  // D-Sale Details
  const [deliveryDetails, setDeliveryDetails] = useState({
    driverName: 'Ramesh Cargo Express',
    vehicleNo: 'KA-05-MK-9912',
    deliverySlot: 'Evening (04:00 PM - 07:00 PM)',
    shippingCharges: 450,
    deliveryAddress: 'Main Showroom Counter Handover'
  });

  // Line Item Entry Row
  const [barcodeInput, setBarcodeInput] = useState('');
  const [forDSale, setForDSale] = useState(false);
  const [itemMrp, setItemMrp] = useState('350.00');
  const [itemQty, setItemQty] = useState('1');
  const [itemUnit, setItemUnit] = useState('Unit');
  const [itemPrice, setItemPrice] = useState('320.00');
  const [itemDiscType, setItemDiscType] = useState<DiscountType>('PERCENT');
  const [itemDiscValue, setItemDiscValue] = useState('0');

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
      total: 320,
      salesmanName: 'Mahesh (Counter 1)',
      salesmanCommissionPct: 2.5,
      commissionAmt: 8.00
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
      total: 800,
      salesmanName: 'Mahesh (Counter 1)',
      salesmanCommissionPct: 2.5,
      commissionAmt: 20.00
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
      total: 1600,
      salesmanName: 'Mahesh (Counter 1)',
      salesmanCommissionPct: 2.5,
      commissionAmt: 40.00
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
  const [showOldBillsModal, setShowOldBillsModal] = useState(false);
  const [showEWayBillModal, setShowEWayBillModal] = useState(false);
  const [showSalesmanModal, setShowSalesmanModal] = useState(false);
  const [showProductPickerModal, setShowProductPickerModal] = useState(false);
  const [showSalesReturnModal, setShowSalesReturnModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showErpModal, setShowErpModal] = useState(false);
  const [erpModuleType, setErpModuleType] = useState<ErpModuleType>('company-info');

  // Features from deep analysis of the 3 videos:
  const [showLastSoldPriceModal, setShowLastSoldPriceModal] = useState(false);
  const [showBillSundryModal, setShowBillSundryModal] = useState(false);
  const [showCashVoucherModal, setShowCashVoucherModal] = useState(false);
  const [voucherType, setVoucherType] = useState<VoucherType>('customer-receipt');
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [serialProductTarget, setSerialProductTarget] = useState<ProductItem | null>(null);
  const [showBillDiscountModal, setShowBillDiscountModal] = useState(false);
  const [billDiscountAmt, setBillDiscountAmt] = useState(0);
  const [billSundryCharge, setBillSundryCharge] = useState<{ name: string; amount: number }>({ name: '', amount: 0 });
  const [showMarginDisplay, setShowMarginDisplay] = useState(true);

  const [scaleWeight, setScaleWeight] = useState<number>(0);
  const [activeInvoiceForPrint, setActiveInvoiceForPrint] = useState<Invoice | null>(null);

  const barcodeRef = useRef<HTMLInputElement>(null);

  // Calculations with bill discount & sundry
  const calc = usePosCalculations(cart, selectedCustomer, isEstimateMode ? 'NON_GST' : taxType, billDiscountAmt, billSundryCharge);
  const approxCost = cart.reduce((acc, it) => acc + ((it.rate * 0.75) * it.qty), 0);
  const grossProfit = Math.max(0, calc.netPay - approxCost);
  const marginPct = calc.netPay > 0 ? (grossProfit / calc.netPay) * 100 : 0;

  // Add Item to Cart
  const handleAddItemToCart = (prod?: ProductItem) => {
    let target = prod;
    if (!target) {
      if (barcodeInput.trim()) {
        const term = barcodeInput.trim().toLowerCase();
        target = products.find(p => p.barcode === term || p.code.toLowerCase() === term || p.name.toLowerCase().includes(term));
      }
    }

    if (!target) {
      // Fallback: create dynamic item from inputs
      const rate = parseFloat(itemPrice) || 300;
      const qty = parseFloat(itemQty) || 1;
      const mrp = parseFloat(itemMrp) || rate;
      const discVal = parseFloat(itemDiscValue) || 0;
      const commAmt = (rate * qty * salesmanCommissionPct) / 100;

      const { discountAmt, taxableAmt, cgstRate, sgstRate, igstRate, cgstAmt, sgstAmt, igstAmt, total } = calculateLineItem(
        qty,
        rate,
        mrp,
        itemDiscType,
        discVal,
        18,
        customerState,
        isEstimateMode ? 'NON_GST' : taxType
      );

      const newItem: CartItem = {
        id: `cart-${Date.now()}`,
        productId: 'custom-item',
        code: barcodeInput || 'ITEM-NEW',
        barcode: barcodeInput || '0000',
        name: `General Item (${barcodeInput || 'Counter Item'})`,
        hsn: '9403',
        qty,
        unit: itemUnit,
        mrp,
        rate,
        discountType: itemDiscType,
        discountValue: discVal,
        discountAmt,
        taxableAmt,
        cgstRate,
        sgstRate,
        igstRate,
        cgstAmt,
        sgstAmt,
        igstAmt,
        total,
        salesmanName: activeSalesman,
        salesmanCommissionPct,
        commissionAmt: commAmt
      };

      setCart(prev => [...prev, newItem]);
      setSelectedRowId(newItem.id);
      setBarcodeInput('');
      triggerToast(`✓ Added item to cart: ₹${total.toFixed(2)}`);
      return;
    }

    if (forSerial && target && !target.regionalName?.startsWith('SN:')) {
      setSerialProductTarget(target);
      setShowSerialModal(true);
      return;
    }

    const rate = priceMode === 'WHOLESALE' ? target.wholesalePrice : target.retailPrice;
    const qty = parseFloat(itemQty) || 1;
    const discVal = parseFloat(itemDiscValue) || 0;
    const commAmt = (rate * qty * salesmanCommissionPct) / 100;

    const { discountAmt, taxableAmt, cgstRate, sgstRate, igstRate, cgstAmt, sgstAmt, igstAmt, total } = calculateLineItem(
      qty,
      rate,
      target.mrp,
      itemDiscType,
      discVal,
      target.taxRate,
      customerState,
      isEstimateMode ? 'NON_GST' : taxType
    );

    const newItem: CartItem = {
      id: `cart-${Date.now()}`,
      productId: target.id,
      code: target.code,
      barcode: target.barcode,
      name: target.name,
      regionalName: target.regionalName,
      hsn: target.hsn,
      qty,
      unit: target.unit || itemUnit,
      mrp: target.mrp,
      rate,
      discountType: itemDiscType,
      discountValue: discVal,
      discountAmt,
      taxableAmt,
      cgstRate,
      sgstRate,
      igstRate,
      cgstAmt,
      sgstAmt,
      igstAmt,
      total,
      salesmanName: activeSalesman,
      salesmanCommissionPct,
      commissionAmt: commAmt
    };

    setCart(prev => [...prev, newItem]);
    setSelectedRowId(newItem.id);
    setBarcodeInput('');
    triggerToast(`✓ Added ${target.name} to cart!`);
  };

  // Helper to build invoice for print
  const buildCurrentInvoice = (paymentMode: string = 'Cash', payments?: PaymentSplit[]): Invoice => ({
    id: `inv-${Date.now()}`,
    invoiceNo: isEstimateMode ? invoiceNo.replace('GST', 'EST') : invoiceNo,
    date: invoiceDate,
    time: currentTime,
    taxType: isEstimateMode ? 'NON_GST' : taxType,
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
    cgstTotal: isEstimateMode ? 0 : calc.cgstTotal,
    sgstTotal: isEstimateMode ? 0 : calc.sgstTotal,
    igstTotal: isEstimateMode ? 0 : calc.igstTotal,
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
    if (cart.length === 0) return triggerToast('⚠️ Bill is empty!');
    const inv = buildCurrentInvoice('By Cash');
    setInvoices(prev => [inv, ...prev]);
    setActiveInvoiceForPrint(inv);
    setShowPrintModal(true);
    triggerToast(`✓ Invoice ${inv.invoiceNo} generated & paid via Cash!`);
  };

  const handleNewBill = () => {
    setCart([]);
    const nextNum = parseInt(invoiceNo.replace(/\D/g, '')) + 1;
    setInvoiceNo(`GST-000${nextNum}-2026/27`);
    triggerToast('✓ Started fresh new bill');
  };

  const handleHold = () => {
    if (cart.length === 0) return triggerToast('⚠️ Cart is empty, cannot hold');
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
    triggerToast(`✓ Current bill suspended to Hold #${hold.holdNumber}`);
  };

  const handleUnhold = () => {
    if (holdBills.length > 0) {
      setShowHoldBillsModal(true);
    } else {
      triggerToast('ℹ️ No bills currently on Hold');
    }
  };

  const handleDirectCreditSale = () => {
    if (cart.length === 0) return triggerToast('⚠️ Cart is empty!');
    const inv: Invoice = {
      ...buildCurrentInvoice('Direct Credit', [{ mode: 'Credit (30 Days)', amount: calc.netPay, enabled: true }]),
      status: 'CREDIT',
      paidAmount: 0,
      pendingAmount: calc.netPay
    };
    setInvoices(prev => [inv, ...prev]);
    setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, currentBalance: c.currentBalance + calc.netPay } : c));
    triggerToast(`✓ Direct 1-Click Credit Sale: ₹${calc.netPay.toFixed(2)} charged to ${selectedCustomer.name}`);
    setActiveInvoiceForPrint(inv);
    setShowPrintModal(true);
  };

  // Keyboard Shortcuts Hook (Ctrl+S, Ctrl+C, Ctrl+H, F2, F4, F5, F6)
  usePosShortcuts({
    onNewBill: handleNewBill,
    onQuickPay: handleQuickPay,
    onOldBills: () => setShowOldBillsModal(true),
    onPrint: () => {
      if (cart.length > 0) {
        setActiveInvoiceForPrint(buildCurrentInvoice());
        setShowPrintModal(true);
      }
    },
    onTogglePriceMode: () => setPriceMode(p => p === 'RETAIL' ? 'WHOLESALE' : 'RETAIL'),
    onBillDiscount: () => setShowBillDiscountModal(true),
    onLastSoldPrice: () => setShowLastSoldPriceModal(true),
    onHoldBill: handleHold,
    onUnholdBill: handleUnhold
  });

  // Open Erp Sub-Module Helper
  const openModule = (mod: ErpModuleType) => {
    setErpModuleType(mod);
    setShowErpModal(true);
  };

  // Open Cash Voucher Helper (Part 2)
  const openVoucher = (type: VoucherType) => {
    setVoucherType(type);
    setShowCashVoucherModal(true);
  };

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
          <button className="rd-win-btn" onClick={() => setIsPosWindowOpen(!isPosWindowOpen)} title="Minimize POS Window">_</button>
          <button className="rd-win-btn" onClick={() => setIsPosWindowMaximized(!isPosWindowMaximized)} title="Maximize">□</button>
          <button className="rd-win-btn close" onClick={onBackToShowroom} title="Exit to Showroom">✕</button>
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          2. TOP 16-ICON MENU RIBBON (All 16 tabs fully operational!)
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

      {/* Sub-Ribbon Cards for ALL 16 tabs */}
      {activeMenuTab && (
        <div className="rd-sub-ribbon">
          {activeMenuTab === 'master' && [
            { label: 'Company Info', icon: '🏢', action: () => openModule('company-info') },
            { label: 'Category Master', icon: '🗂️', action: () => openModule('category-master') },
            { label: 'Products Master', icon: '🛒', action: () => setShowBulkEditorModal(true) },
            { label: 'Sales Person', icon: '👔', action: () => setShowSalesmanModal(true) },
            { label: 'Customer', icon: '👥', action: () => setShowCustomerModal(true) },
            { label: 'Supplier / Timber Mills', icon: '👷', action: () => setShowPurchaseModal(true) },
            { label: 'Transporter (E-Way)', icon: '🚚', action: () => setShowEWayBillModal(true) }
          ].map((sub, idx) => (
            <div key={idx} className="rd-sub-card" onClick={sub.action}>
              <span style={{ fontSize: '24px' }}>{sub.icon}</span>
              <span className="rd-sub-card-label">{sub.label}</span>
            </div>
          ))}

          {activeMenuTab === 'trans' && [
            { label: 'Point of Sale (F1)', icon: '🛒', action: () => { setIsPosWindowOpen(true); setIsRubicMode(false); } },
            { label: 'Rubic Touch POS', icon: '🎲', action: () => { setIsPosWindowOpen(true); setIsRubicMode(true); } },
            { label: 'Estimate / Delivery', icon: '📋', action: () => { setIsEstimateMode(!isEstimateMode); triggerToast(`Switched to ${!isEstimateMode ? 'ESTIMATE' : 'GST TAX INVOICE'} mode`); } },
            { label: 'Sales Return (Cr.Note)', icon: '🔄', action: () => setShowSalesReturnModal(true) },
            { label: 'Quotation Portal', icon: '📱', action: () => setShowQuotationModal(true) },
            { label: 'Purchase Entry (F2)', icon: '📦', action: () => setShowPurchaseModal(true) },
            { label: 'Receipt (From Customer)', icon: '🧾', action: () => openVoucher('customer-receipt') },
            { label: 'Payment (To Supplier)', icon: '💳', action: () => openVoucher('supplier-payment') },
            { label: 'Expense Voucher', icon: '💵', action: () => openVoucher('expense') },
            { label: 'Income Voucher', icon: '💰', action: () => openVoucher('income') },
            { label: 'E-Way Bill (1900)', icon: '🚚', action: () => setShowEWayBillModal(true) }
          ].map((sub, idx) => (
            <div key={idx} className="rd-sub-card" onClick={sub.action}>
              <span style={{ fontSize: '24px' }}>{sub.icon}</span>
              <span className="rd-sub-card-label">{sub.label}</span>
            </div>
          ))}

          {activeMenuTab === 'services' && [
            { label: 'Delivery Logistics', icon: '🚚', action: () => openModule('delivery-challan') },
            { label: 'Customer Support / AMC', icon: '🔧', action: () => triggerToast('✓ AMC & Furniture Polish Services active') },
            { label: 'Online Orders Hub', icon: '📱', action: () => openModule('online-orders') }
          ].map((sub, idx) => (
            <div key={idx} className="rd-sub-card" onClick={sub.action}>
              <span style={{ fontSize: '24px' }}>{sub.icon}</span>
              <span className="rd-sub-card-label">{sub.label}</span>
            </div>
          ))}

          {activeMenuTab === 'utilities' && [
            { label: 'Desktop Calculator', icon: '🖩', action: () => openModule('calculator') },
            { label: 'Database Backup', icon: '💾', action: () => openModule('backup-restore') },
            { label: 'Barcode Designer', icon: '🏷️', action: () => openModule('barcode-designer') },
            { label: 'Weighing Scale', icon: '⚖️', action: () => setShowScaleModal(true) }
          ].map((sub, idx) => (
            <div key={idx} className="rd-sub-card" onClick={sub.action}>
              <span style={{ fontSize: '24px' }}>{sub.icon}</span>
              <span className="rd-sub-card-label">{sub.label}</span>
            </div>
          ))}

          {activeMenuTab === 'inventory' && [
            { label: 'Stock Summary', icon: '📦', action: () => openModule('stock-summary') },
            { label: 'Low Stock Alerts', icon: '⚠️', action: () => openModule('low-stock-alert') },
            { label: 'Bulk Price Editor', icon: '📊', action: () => setShowBulkEditorModal(true) },
            { label: 'Purchase Inward (F2)', icon: '📥', action: () => setShowPurchaseModal(true) }
          ].map((sub, idx) => (
            <div key={idx} className="rd-sub-card" onClick={sub.action}>
              <span style={{ fontSize: '24px' }}>{sub.icon}</span>
              <span className="rd-sub-card-label">{sub.label}</span>
            </div>
          ))}

          {activeMenuTab === 'banking' && [
            { label: 'Bank Accounts', icon: '🏛️', action: () => openModule('banking') },
            { label: 'UPI / M-Pay Gateway', icon: '📱', action: () => setShowMultiPayModal(true) }
          ].map((sub, idx) => (
            <div key={idx} className="rd-sub-card" onClick={sub.action}>
              <span style={{ fontSize: '24px' }}>{sub.icon}</span>
              <span className="rd-sub-card-label">{sub.label}</span>
            </div>
          ))}

          {activeMenuTab === 'payroll' && [
            { label: 'Staff & Salaries', icon: '👥', action: () => openModule('payroll') },
            { label: 'Salesman Commission', icon: '👔', action: () => setShowSalesmanModal(true) }
          ].map((sub, idx) => (
            <div key={idx} className="rd-sub-card" onClick={sub.action}>
              <span style={{ fontSize: '24px' }}>{sub.icon}</span>
              <span className="rd-sub-card-label">{sub.label}</span>
            </div>
          ))}

          {activeMenuTab === 'records' && [
            { label: 'Day Book', icon: '📒', action: () => openModule('day-book') },
            { label: 'Cash Book', icon: '💵', action: () => openModule('cash-book') },
            { label: 'Sales Register (F5)', icon: '📁', action: () => setShowOldBillsModal(true) },
            { label: 'Customer Ledger', icon: '👥', action: () => openModule('customer-ledger') }
          ].map((sub, idx) => (
            <div key={idx} className="rd-sub-card" onClick={sub.action}>
              <span style={{ fontSize: '24px' }}>{sub.icon}</span>
              <span className="rd-sub-card-label">{sub.label}</span>
            </div>
          ))}

          {activeMenuTab === 'reports' && [
            { label: 'Sales Dashboard', icon: '📊', action: () => { setIsPosWindowOpen(true); setActiveSubTab('Dash board'); } },
            { label: 'Old Bills Register', icon: '📁', action: () => setShowOldBillsModal(true) },
            { label: 'Stock Valuation', icon: '📦', action: () => openModule('stock-summary') }
          ].map((sub, idx) => (
            <div key={idx} className="rd-sub-card" onClick={sub.action}>
              <span style={{ fontSize: '24px' }}>{sub.icon}</span>
              <span className="rd-sub-card-label">{sub.label}</span>
            </div>
          ))}

          {activeMenuTab === 'tax' && [
            { label: 'GSTR-1 Monthly Return', icon: '📑', action: () => openModule('tax-reports-gstr1') },
            { label: 'GSTR-3B Tax Summary', icon: '📊', action: () => openModule('tax-reports-gstr3b') }
          ].map((sub, idx) => (
            <div key={idx} className="rd-sub-card" onClick={sub.action}>
              <span style={{ fontSize: '24px' }}>{sub.icon}</span>
              <span className="rd-sub-card-label">{sub.label}</span>
            </div>
          ))}

          {activeMenuTab === 'db' && [
            { label: 'Backup to JSON', icon: '💾', action: () => openModule('backup-restore') },
            { label: 'PostgreSQL Cloud Sync', icon: '🗄️', action: () => openModule('backup-restore') }
          ].map((sub, idx) => (
            <div key={idx} className="rd-sub-card" onClick={sub.action}>
              <span style={{ fontSize: '24px' }}>{sub.icon}</span>
              <span className="rd-sub-card-label">{sub.label}</span>
            </div>
          ))}

          {activeMenuTab === 'export' && [
            { label: 'Export Catalog Excel', icon: '📊', action: () => openModule('stock-summary') },
            { label: 'Bulk Product Editor', icon: '🛒', action: () => setShowBulkEditorModal(true) }
          ].map((sub, idx) => (
            <div key={idx} className="rd-sub-card" onClick={sub.action}>
              <span style={{ fontSize: '24px' }}>{sub.icon}</span>
              <span className="rd-sub-card-label">{sub.label}</span>
            </div>
          ))}

          {activeMenuTab === 'barcode' && [
            { label: 'Sticker Designer', icon: '🏷️', action: () => openModule('barcode-designer') }
          ].map((sub, idx) => (
            <div key={idx} className="rd-sub-card" onClick={sub.action}>
              <span style={{ fontSize: '24px' }}>{sub.icon}</span>
              <span className="rd-sub-card-label">{sub.label}</span>
            </div>
          ))}

          {activeMenuTab === 'settings' && [
            { label: 'General POS Settings', icon: '⚙️', action: () => openModule('general-settings') },
            { label: 'Bill Index Columns', icon: '⎘', action: () => setShowIndexSettingModal(true) },
            { label: 'Cursor Flow Setting', icon: '⚡', action: () => setShowCursorSettingModal(true) }
          ].map((sub, idx) => (
            <div key={idx} className="rd-sub-card" onClick={sub.action}>
              <span style={{ fontSize: '24px' }}>{sub.icon}</span>
              <span className="rd-sub-card-label">{sub.label}</span>
            </div>
          ))}

          {activeMenuTab === 'messenger' && [
            { label: 'WhatsApp Campaign', icon: '📱', action: () => openModule('whatsapp-marketing') }
          ].map((sub, idx) => (
            <div key={idx} className="rd-sub-card" onClick={sub.action}>
              <span style={{ fontSize: '24px' }}>{sub.icon}</span>
              <span className="rd-sub-card-label">{sub.label}</span>
            </div>
          ))}

          {activeMenuTab === 'admin' && [
            { label: 'Company Profile', icon: '🏢', action: () => openModule('company-info') },
            { label: 'Security & Access', icon: '👤', action: () => openModule('general-settings') }
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
        <button 
          className={`rd-quick-btn ${isGorillaMode ? 'rd-gorilla-active' : ''}`}
          onClick={() => {
            setIsGorillaMode(!isGorillaMode);
            triggerToast(!isGorillaMode ? '🦍 Gorilla High-Speed Scan Mode ACTIVATED!' : '🦍 Gorilla Mode Deactivated');
          }}
          title="Toggle High-Speed Gorilla Scan Mode"
        >
          <span>🦍</span> Gorilla {isGorillaMode && '⚡ ON'}
        </button>

        <button className="rd-quick-btn" onClick={() => setShowBulkEditorModal(true)}>
          <span style={{ color: '#eab308' }}>🏷️+</span> Add Product
        </button>

        <button 
          className="rd-quick-btn sale-pos" 
          onClick={() => {
            setIsPosWindowOpen(true);
            setIsRubicMode(false);
          }}
          title="F1 - Launch Point of Sale Screen"
        >
          <span>🛒</span> Sale POS <span style={{ fontSize: '10px', background: '#e11d48', color: '#fff', padding: '1px 4px', borderRadius: '2px' }}>F1</span>
        </button>

        <button 
          className={`rd-quick-btn ${isRubicMode ? 'active' : ''}`}
          onClick={() => {
            setIsPosWindowOpen(true);
            setIsRubicMode(!isRubicMode);
            triggerToast(!isRubicMode ? '🎲 Switched to Rubic Touch Tile Grid POS' : '🛒 Switched to Standard POS');
          }}
          title="Rubic Touch Visual Product POS"
        >
          <span>🎲</span> Rubic POS {isRubicMode && '✓'}
        </button>

        <button className="rd-quick-btn purchase" onClick={() => setShowPurchaseModal(true)}>
          <span>📦</span> Purchase <span style={{ fontSize: '10px', background: '#059669', color: '#fff', padding: '1px 4px', borderRadius: '2px' }}>F2</span>
        </button>

        <button className="rd-quick-btn logout" onClick={onBackToShowroom} title="Return to Public Showroom">
          <span>⭕</span> LogOut
        </button>
      </div>

      {/* Floating Notification Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '110px',
          right: '24px',
          background: '#0f172a',
          color: '#4ade80',
          border: '1.5px solid #22c55e',
          padding: '10px 18px',
          borderRadius: '6px',
          fontWeight: 800,
          fontSize: '12px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>⚡</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ----------------------------------------------------------------------
          4. DESKTOP CANVAS (Wallpaper with Money Tree & Retail Daddy 1.8 AI)
          ---------------------------------------------------------------------- */}
      <div className="rd-desktop-canvas">
        {/* Money tree illustration & pot */}
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
            <path d="M 120 300 Q 140 220 110 180 Q 90 140 100 90" stroke="url(#trunkGrad)" strokeWidth="18" fill="none" strokeLinecap="round" />
            <path d="M 140 300 Q 170 230 180 170 Q 190 130 160 80" stroke="url(#trunkGrad)" strokeWidth="16" fill="none" strokeLinecap="round" />
            <path d="M 150 220 Q 210 190 220 130" stroke="url(#trunkGrad)" strokeWidth="12" fill="none" strokeLinecap="round" />
            
            <circle cx="90" cy="90" r="50" fill="url(#leafGrad)" />
            <rect x="75" y="70" width="30" height="18" rx="2" fill="#dcfce7" stroke="#16a34a" strokeWidth="1" transform="rotate(-15 90 80)" />
            <text x="82" y="83" fontSize="8" fontWeight="bold" fill="#166534">₹500</text>
            
            <circle cx="160" cy="70" r="60" fill="url(#leafGrad)" />
            <rect x="145" y="55" width="32" height="19" rx="2" fill="#dcfce7" stroke="#16a34a" strokeWidth="1" transform="rotate(10 160 65)" />
            <text x="151" y="68" fontSize="8" fontWeight="bold" fill="#166534">₹2000</text>

            <circle cx="220" cy="120" r="45" fill="url(#leafGrad)" />
            <rect x="210" y="110" width="28" height="16" rx="2" fill="#dcfce7" stroke="#16a34a" strokeWidth="1" transform="rotate(25 220 120)" />
            <text x="215" y="122" fontSize="7" fontWeight="bold" fill="#166534">₹500</text>

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

        {/* Gold Crown 10th Anniversary Banner */}
        <div className="rd-anniversary-banner">
          <span style={{ fontSize: '20px' }}>👑</span>
          <span>Raintech Software Ltd. • <strong>10th Anniversary Edition</strong></span>
        </div>

        {/* ------------------------------------------------------------------
            5. SALE POS WINDOW: "Customer's Statement" (screen_044.jpg)
            ------------------------------------------------------------------ */}
        {isPosWindowOpen && (
          <div className={`rd-pos-window ${isPosWindowMaximized ? 'maximized' : ''}`} style={isPosWindowMaximized ? { inset: '10px', width: 'auto', height: 'auto' } : {}}>
            {/* Window Title Bar */}
            <div className="rd-pos-header-bar">
              <span style={{ color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Customer's Statement 
                {isGorillaMode && <span style={{ background: '#fef08a', color: '#854d0e', padding: '1px 6px', borderRadius: '3px', fontSize: '10px' }}>🦍 GORILLA FAST SCAN ON</span>}
                {isEstimateMode && <span style={{ background: '#fbcfe8', color: '#9d174d', padding: '1px 6px', borderRadius: '3px', fontSize: '10px' }}>📋 ESTIMATE / CHALLAN MODE</span>}
              </span>
              <div className="rd-window-controls">
                <button className="rd-win-btn" onClick={() => setIsPosWindowOpen(false)} title="Minimize">_</button>
                <button className="rd-win-btn" onClick={() => setIsPosWindowMaximized(!isPosWindowMaximized)} title="Maximize">□</button>
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
                <span style={{ fontWeight: 700, fontSize: '11px' }}>
                  {isEstimateMode ? 'Estimate No :' : 'Invoice No :'}
                </span>
                <input 
                  type="text" 
                  value={isEstimateMode ? invoiceNo.replace('GST', 'EST') : invoiceNo}
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
                  disabled={isEstimateMode}
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

            {/* TAB CONTENT: 1. DASHBOARD */}
            {activeSubTab === 'Dash board' ? (
              <div className="rd-dashboard-wrap">
                <div className="rd-dash-kpi-grid">
                  <div className="rd-dash-kpi-card">
                    <div className="label">Today's Gross Sales</div>
                    <div className="value" style={{ color: '#16a34a' }}>₹ 1,84,200.00</div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>+14.5% vs yesterday</div>
                  </div>
                  <div className="rd-dash-kpi-card">
                    <div className="label">Total Bills Issued</div>
                    <div className="value">18 Bills</div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>15 GST • 3 Estimates</div>
                  </div>
                  <div className="rd-dash-kpi-card">
                    <div className="label">Average Basket Size</div>
                    <div className="value">₹ 10,233.00</div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Avg 2.4 Items/Bill</div>
                  </div>
                  <div className="rd-dash-kpi-card">
                    <div className="label">UPI / Digital Share</div>
                    <div className="value" style={{ color: '#2563eb' }}>72%</div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>₹ 1,32,624 via UPI QR</div>
                  </div>
                </div>

                <div className="rd-dash-charts-row">
                  <div className="rd-dash-panel">
                    <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '12px' }}>Hourly Sales Trend (Peak Hours: 11 AM - 2 PM, 5 PM - 8 PM)</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px', height: '140px', paddingBottom: '10px', borderBottom: '1px solid #cbd5e1' }}>
                      {[
                        { hour: '10 AM', amt: 14000, height: '35%' },
                        { hour: '11 AM', amt: 49560, height: '80%' },
                        { hour: '12 PM', amt: 32000, height: '60%' },
                        { hour: '01 PM', amt: 18000, height: '40%' },
                        { hour: '02 PM', amt: 8500, height: '20%' },
                        { hour: '03 PM', amt: 12000, height: '30%' },
                        { hour: '04 PM', amt: 24000, height: '50%' },
                        { hour: '05 PM', amt: 42000, height: '75%' },
                        { hour: '06 PM', amt: 58000, height: '95%' }
                      ].map((bar, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                          <div style={{ width: '100%', height: bar.height, background: '#0284c7', borderRadius: '3px 3px 0 0' }} title={`₹${bar.amt.toLocaleString()}`} />
                          <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', marginTop: '4px' }}>{bar.hour}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rd-dash-panel">
                    <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '8px' }}>Top Selling Products Today</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {products.slice(0, 4).map((p, idx) => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', padding: '4px 0', borderBottom: '1px dashed #e2e8f0' }}>
                          <span><strong>#{idx + 1}</strong> {p.name.slice(0, 24)}...</span>
                          <span style={{ fontWeight: 800, color: '#16a34a' }}>₹ {p.retailPrice}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeSubTab === 'D-Sale' ? (
              /* TAB CONTENT: 2. D-SALE (Delivery / Logistics) */
              <div style={{ flex: 1, background: '#f8fafc', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px', borderRadius: '4px' }}>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#065f46' }}>🚚 Departmental & Direct Delivery Sale Configuration</div>
                  <div style={{ fontSize: '11px', color: '#047857', marginTop: '3px' }}>
                    Configure vehicle dispatch, driver hand-off, delivery timeslot, and doorstep payment collection.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700 }}>Driver / Logistics Agency:</label>
                    <input 
                      type="text" 
                      value={deliveryDetails.driverName}
                      onChange={e => setDeliveryDetails({ ...deliveryDetails, driverName: e.target.value })}
                      style={{ width: '100%', padding: '6px', border: '1px solid #94a3b8', fontSize: '12px', marginTop: '3px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700 }}>Vehicle Registration No:</label>
                    <input 
                      type="text" 
                      value={deliveryDetails.vehicleNo}
                      onChange={e => setDeliveryDetails({ ...deliveryDetails, vehicleNo: e.target.value })}
                      style={{ width: '100%', padding: '6px', border: '1px solid #94a3b8', fontSize: '12px', marginTop: '3px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700 }}>Delivery Time Slot:</label>
                    <select 
                      value={deliveryDetails.deliverySlot}
                      onChange={e => setDeliveryDetails({ ...deliveryDetails, deliverySlot: e.target.value })}
                      style={{ width: '100%', padding: '6px', border: '1px solid #94a3b8', fontSize: '12px', marginTop: '3px' }}
                    >
                      <option>Morning (09:00 AM - 12:00 PM)</option>
                      <option>Afternoon (01:00 PM - 04:00 PM)</option>
                      <option>Evening (04:00 PM - 07:00 PM)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700 }}>Packaging & Delivery Freight (₹):</label>
                    <input 
                      type="number" 
                      value={deliveryDetails.shippingCharges}
                      onChange={e => setDeliveryDetails({ ...deliveryDetails, shippingCharges: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '6px', border: '1px solid #94a3b8', fontSize: '12px', marginTop: '3px' }}
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700 }}>Doorstep Delivery Address:</label>
                    <input 
                      type="text" 
                      value={deliveryDetails.deliveryAddress}
                      onChange={e => setDeliveryDetails({ ...deliveryDetails, deliveryAddress: e.target.value })}
                      style={{ width: '100%', padding: '6px', border: '1px solid #94a3b8', fontSize: '12px', marginTop: '3px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button className="rd-classic-btn" onClick={() => setActiveSubTab('Sale')}>Back to POS Grid</button>
                  <button 
                    className="rd-classic-btn" 
                    style={{ background: '#16a34a', color: '#fff', borderColor: '#15803d' }}
                    onClick={() => {
                      triggerToast('✓ Delivery logistics details saved to invoice');
                      setActiveSubTab('Sale');
                    }}
                  >
                    Apply Delivery Parameters
                  </button>
                </div>
              </div>
            ) : activeSubTab === 'Bill Design' ? (
              /* TAB CONTENT: 3. BILL DESIGNER */
              <div style={{ flex: 1, background: '#f8fafc', padding: '16px', display: 'flex', gap: '20px', overflowY: 'auto' }}>
                <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontWeight: 800, fontSize: '12px' }}>Thermal & Laser Formats:</div>
                  <label><input type="radio" name="paper" checked={billDesignConfig.style === '3inch-style1'} onChange={() => setBillDesignConfig({ ...billDesignConfig, style: '3inch-style1' })} /> 3 Inch Thermal (Standard)</label>
                  <label><input type="radio" name="paper" checked={billDesignConfig.style === '3inch-style3-hindi'} onChange={() => setBillDesignConfig({ ...billDesignConfig, style: '3inch-style3-hindi' })} /> 3 Inch Hindi / Regional Layout</label>
                  <label><input type="radio" name="paper" checked={billDesignConfig.style === 'a4-gst'} onChange={() => setBillDesignConfig({ ...billDesignConfig, style: 'a4-gst' })} /> A4 Full Size GST Tax Invoice</label>
                  <label><input type="radio" name="paper" checked={billDesignConfig.style === 'a5-slip'} onChange={() => setBillDesignConfig({ ...billDesignConfig, style: 'a5-slip' })} /> A5 Half Slip Delivery Challan</label>
                  
                  <button 
                    style={{ marginTop: '16px', padding: '8px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 800, cursor: 'pointer' }}
                    onClick={() => {
                      triggerToast('✓ Bill Design template applied successfully');
                      setActiveSubTab('Sale');
                    }}
                  >
                    Apply Template
                  </button>
                </div>
                <div style={{ flex: 1, background: '#fff', border: '1px solid #cbd5e1', padding: '20px', borderRadius: '4px', maxWidth: '340px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 900 }}>SHREE VINAYAKA FURNITURES</div>
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
            ) : isRubicMode ? (
              /* TAB CONTENT: 4. RUBIC TOUCH GRID POS */
              <div className="rd-rubic-container">
                <div className="rd-rubic-tabs">
                  {['ALL', 'Dining', 'Living', 'Bedroom', 'Office', 'Pooja', 'Raw Wood'].map(cat => (
                    <button 
                      key={cat} 
                      className={`rd-rubic-tab-btn ${rubicCategory === cat ? 'active' : ''}`}
                      onClick={() => setRubicCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="rd-rubic-tile-grid">
                  {products
                    .filter(p => rubicCategory === 'ALL' || p.category === rubicCategory)
                    .map(p => (
                      <div 
                        key={p.id} 
                        className="rd-rubic-card"
                        onClick={() => handleAddItemToCart(p)}
                      >
                        <div>
                          <div className="rd-rubic-card-title">{p.name}</div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>{p.code} • Stock: {p.stock}</div>
                        </div>
                        <div className="rd-rubic-card-price">₹ {priceMode === 'WHOLESALE' ? p.wholesalePrice : p.retailPrice}</div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              /* TAB CONTENT: 5. STANDARD SALE POS (screen_044.jpg) */
              <>
                {/* Customer Information Row (screen_044.jpg) */}
                <div className="rd-customer-row">
                  <button 
                    className="rd-pill-btn" 
                    onClick={() => {
                      setSelectedCustomer(INITIAL_CUSTOMERS[0]);
                      setCustomerPhone('1234567890');
                      setCustomerState('Kerala');
                      triggerToast('✓ Reset to Default Cash Customer');
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

                  <button className="rd-pill-btn" style={{ padding: '2px 6px' }} onClick={() => setShowCustomerModal(true)} title="Search Customer">🔍</button>
                  <button className="rd-pill-btn" style={{ padding: '2px 6px' }} onClick={() => setShowCustomerModal(true)} title="Customer List">▾</button>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 600 }}>
                    <input type="checkbox" checked={forSerial} onChange={e => setForSerial(e.target.checked)} /> For Serial
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 600 }}>
                    <input type="checkbox" checked={wBarcode} onChange={e => setWBarcode(e.target.checked)} /> W-Barcode
                  </label>

                  <button 
                    className="rd-pill-btn" 
                    style={{ background: '#fef08a', color: '#854d0e', fontWeight: 800, padding: '2px 8px' }}
                    onClick={() => setShowLastSoldPriceModal(true)} 
                    title="Customer Last Sold Price History (Ctrl+H - Feature 28)"
                  >
                    Ctrl+H History
                  </button>

                  <button 
                    className="rd-cursor-setting-pill" 
                    onClick={() => setShowCursorSettingModal(true)}
                  >
                    Cursor Setting
                  </button>
                </div>

                {/* Barcode & Fast Item Entry Row (screen_044.jpg) */}
                <div className="rd-item-entry-row">
                  <div className="rd-field-item">
                    <button 
                      style={{ padding: '2px 8px', background: '#fff', border: '1px solid #94a3b8', borderRadius: '3px', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}
                      onClick={() => setShowProductPickerModal(true)}
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
                      onKeyDown={e => e.key === 'Enter' && handleAddItemToCart()}
                      placeholder="Scan or enter code..."
                      className="rd-input-yellow"
                      style={{ width: '90px' }}
                    />
                  </div>

                  <div className="rd-field-item">
                    <label>MRP :</label>
                    <input 
                      type="text" 
                      value={itemMrp} 
                      onChange={e => setItemMrp(e.target.value)}
                      className="rd-input-yellow" 
                      style={{ width: '55px', textAlign: 'right' }} 
                    />
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
                    <span 
                      style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => setItemUnit(itemUnit === 'Unit' ? 'PCS' : 'Unit')}
                      title="Click to toggle alternate unit"
                    >
                      Alt Unit
                    </span>
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
                    <label>Disc Val :</label>
                    <input 
                      type="text" 
                      value={itemDiscValue} 
                      onChange={e => setItemDiscValue(e.target.value)}
                      style={{ width: '45px', textAlign: 'right' }} 
                    />
                  </div>

                  <div className="rd-field-item">
                    <label>Total Amt :</label>
                    <input 
                      type="text" 
                      readOnly 
                      value={((parseFloat(itemPrice) || 0) * (parseFloat(itemQty) || 1)).toFixed(2)} 
                      style={{ width: '65px', textAlign: 'right', fontWeight: 700 }} 
                    />
                  </div>
                </div>

                {/* Action Ribbon: Salesman, Hold, Unhold, Weighing Scale, Quotation, Online Order */}
                <div className="rd-action-ribbon">
                  <button className="rd-action-card-btn" onClick={() => setShowSalesmanModal(true)}>
                    <span>👔</span> {activeSalesman.split(' ')[0]} ({salesmanCommissionPct}%)
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

                  <button className="rd-action-card-btn" onClick={() => openModule('online-orders')}>
                    <span>📱</span> Online Orders
                  </button>

                  <button className="rd-action-card-btn" onClick={() => setShowBillSundryModal(true)} title="Loading & Shipping Charges (Feature 16)">
                    <span>🚚</span> Sundry {billSundryCharge.amount > 0 ? `(+₹${billSundryCharge.amount})` : ''}
                  </button>

                  <button className="rd-action-card-btn" onClick={() => setShowBillDiscountModal(true)} title="Total Bill Discount (Ctrl+C - Feature 27)">
                    <span>🏷️</span> Bill Disc {billDiscountAmt > 0 ? `(-₹${billDiscountAmt})` : ''}
                  </button>

                  {/* Giant Net Pay Display in Ribbon */}
                  <div className="rd-giant-netpay">
                    Net Pay : {calc.netPay.toFixed(2)}
                  </div>

                  <div className="rd-round-btn-group">
                    <button className="rd-round-tool-btn green" onClick={() => handleAddItemToCart()} title="Add to Grid">+</button>
                    <button 
                      className="rd-round-tool-btn" 
                      onClick={() => {
                        if (selectedRowId) {
                          setCart(prev => prev.filter(it => it.id !== selectedRowId));
                        }
                      }}
                      title="Remove Row"
                    >
                      -
                    </button>
                    <button className="rd-round-tool-btn" onClick={() => setShowIndexSettingModal(true)} title="Column Settings">⎘</button>
                    <button 
                      className="rd-round-tool-btn" 
                      onClick={() => {
                        setItemMrp('0.00');
                        setItemPrice('0.00');
                        setItemQty('1');
                        setBarcodeInput('');
                      }} 
                      title="Reset Item Entry"
                    >
                      ↻
                    </button>
                  </div>
                </div>

                {/* Line Items Grid Table (screen_044.jpg exact columns) */}
                <div className="rd-table-viewport">
                  <table className="rd-grid-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>Action</th>
                        <th style={{ width: '60px' }}>HSN Code</th>
                        <th>Product Name</th>
                        <th style={{ width: '90px' }}>Barcode</th>
                        <th className="numeric" style={{ width: '65px' }}>Qty</th>
                        <th className="numeric" style={{ width: '75px' }}>Rate</th>
                        <th className="numeric" style={{ width: '50px' }}>Disc %</th>
                        <th className="numeric" style={{ width: '60px' }}>Disc Amt</th>
                        <th className="numeric" style={{ width: '70px' }}>Total</th>
                        <th style={{ width: '75px' }}>SalesMan</th>
                        <th className="numeric" style={{ width: '45px' }}>%</th>
                        <th className="numeric" style={{ width: '65px' }}>Commission</th>
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
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '3px', cursor: 'pointer', padding: '1px 5px', fontWeight: 800 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCart(prev => prev.filter(it => it.id !== item.id));
                              }}
                              title="Delete Item"
                            >
                              ✕
                            </button>
                          </td>
                          <td>{item.hsn}</td>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td>{item.barcode}</td>
                          <td className="numeric">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
                              <button 
                                style={{ width: '16px', height: '16px', padding: 0, fontSize: '10px' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item.qty > 1) {
                                    setCart(prev => prev.map(it => it.id === item.id ? { ...it, qty: it.qty - 1, total: (it.qty - 1) * it.rate } : it));
                                  }
                                }}
                              >
                                -
                              </button>
                              <span>{item.qty}</span>
                              <button 
                                style={{ width: '16px', height: '16px', padding: 0, fontSize: '10px' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCart(prev => prev.map(it => it.id === item.id ? { ...it, qty: it.qty + 1, total: (it.qty + 1) * it.rate } : it));
                                }}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="numeric">
                            <input 
                              type="number"
                              value={item.rate}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setCart(prev => prev.map(it => it.id === item.id ? { ...it, rate: val, total: it.qty * val } : it));
                              }}
                              style={{ width: '65px', textAlign: 'right', fontSize: '11px', border: '1px solid #cbd5e1', padding: '1px' }}
                            />
                          </td>
                          <td className="numeric">{item.discountValue}</td>
                          <td className="numeric">{item.discountAmt}</td>
                          <td className="numeric" style={{ fontWeight: 700, color: item.total < 0 ? '#dc2626' : 'inherit' }}>
                            {item.total.toFixed(2)}
                          </td>
                          <td>{item.salesmanName || activeSalesman}</td>
                          <td className="numeric">{(item.salesmanCommissionPct || salesmanCommissionPct).toFixed(1)}</td>
                          <td className="numeric">{(item.commissionAmt || (item.total * salesmanCommissionPct / 100)).toFixed(2)}</td>
                          <td>{item.unit}</td>
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
                      <button 
                        className="rd-classic-btn"
                        onClick={() => {
                          setIsEstimateMode(!isEstimateMode);
                          triggerToast(!isEstimateMode ? '📋 Switched to Estimate Mode' : '🧾 Switched to GST Tax Mode');
                        }}
                      >
                        <span>🖩</span> {isEstimateMode ? '✓ Estimate ON' : 'Estimate'}
                      </button>
                      <button className="rd-classic-btn" onClick={() => setShowOldBillsModal(true)}>
                        <span>📋</span> Old Estimate
                      </button>
                    </div>

                    <div className="rd-btn-row">
                      <button className="rd-classic-btn" onClick={() => setShowSalesReturnModal(true)}>
                        <span>🔄</span> Sales Return
                      </button>
                      <button className="rd-classic-btn" onClick={() => setShowSalesReturnModal(true)}>
                        SalesReturnRecord
                      </button>
                    </div>

                    <div className="rd-eway-btn" onClick={() => setShowEWayBillModal(true)} style={{ cursor: 'pointer' }}>
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
                          <td>{isEstimateMode ? '0.00' : calc.taxTotal.toFixed(2)}</td>
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
                          <td>{isEstimateMode ? '0.00' : calc.taxTotal.toFixed(2)}</td>
                          <td>{calc.billMrp}</td>
                          <td style={{ color: '#15803d' }}>{calc.netPay}</td>
                        </tr>
                      </tbody>
                    </table>
                    {showMarginDisplay && (
                      <div 
                        style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '3px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                        onClick={() => setShowMarginDisplay(!showMarginDisplay)}
                        title="Click to toggle Margin Display (Features 25 & 26)"
                      >
                        <span>Gross Profit: <strong style={{ color: '#047857' }}>₹ {grossProfit.toFixed(2)}</strong></span>
                        <span>Margin: <strong style={{ color: '#047857' }}>{marginPct.toFixed(1)}%</strong></span>
                        {billDiscountAmt > 0 && <span style={{ color: '#dc2626' }}>Disc: -₹{billDiscountAmt}</span>}
                        {billSundryCharge.amount > 0 && <span style={{ color: '#0284c7' }}>Sundry: +₹{billSundryCharge.amount}</span>}
                      </div>
                    )}
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
                      <button 
                        className="rd-pay-btn-wallet" 
                        style={{ background: '#fef3c7', borderColor: '#d97706', color: '#92400e', fontWeight: 800 }} 
                        onClick={handleDirectCreditSale} 
                        title="Feature 33: Direct 1-Click Credit Sale (F7)"
                      >
                        <span>💳</span> Credit
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
                      <button 
                        className="rd-fkey-btn" 
                        onClick={() => triggerToast(`✓ Bill ${invoiceNo} synchronized and saved to database`)}
                      >
                        <span>🔄</span> Update <small style={{ color: '#64748b' }}>F3</small>
                      </button>
                      <button className="rd-fkey-btn" onClick={() => setShowOldBillsModal(true)}>
                        <span>📁</span> Old Bill <small style={{ color: '#64748b' }}>F5</small>
                      </button>
                      <button 
                        className="rd-fkey-btn" 
                        onClick={() => {
                          if (cart.length > 0) {
                            setActiveInvoiceForPrint(buildCurrentInvoice());
                            setShowPrintModal(true);
                          } else {
                            triggerToast('⚠️ Please add items to print invoice');
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
          Shree Vinayaka Furnitures • Raintech Software Limited Rel 1.8 AI
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span>💬 +9186060 93110</span>
          <span>✉️ raintech9847158963@gmail.com</span>
          <span>📅 {currentTime}</span>
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          7. ALL MODALS INTEGRATED & WIRED FUNCTIONALLY
          ---------------------------------------------------------------------- */}
      {/* 1. Weighing Scale Modal (Screen 066) */}
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
                    triggerToast(`✓ Transferred ${(scaleWeight || 1.450).toFixed(3)} KG to QTY input`);
                  }}
                >
                  Transfer Weight
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Customer Entry Modal (Screen 661) */}
      <CustomerEntryModal 
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSaveCustomer={cust => {
          setCustomers(prev => [cust, ...prev]);
          setSelectedCustomer(cust);
          setCustomerPhone(cust.contactNo);
          setCustomerState(cust.state);
          setShowCustomerModal(false);
          triggerToast(`✓ Saved customer: ${cust.name}`);
        }}
      />

      {/* 3. Multi Bill Payment Modal (Screen 500 frmMultiBillPayment) */}
      <MultiBillPaymentModal 
        isOpen={showMultiPayModal}
        onClose={() => setShowMultiPayModal(false)}
        netPay={calc.netPay}
        onSavePayments={payments => {
          const inv = buildCurrentInvoice('Multi-Pay', payments);
          setShowMultiPayModal(false);
          setInvoices(prev => [inv, ...prev]);
          setActiveInvoiceForPrint(inv);
          setShowPrintModal(true);
          triggerToast(`✓ Multi-split payment settled for Invoice ${inv.invoiceNo}`);
        }}
      />

      {/* 4. Index Setting Modal (Screen 061) */}
      <IndexSettingModal 
        isOpen={showIndexSettingModal}
        onClose={() => setShowIndexSettingModal(false)}
        columns={columns}
        onSaveColumns={cols => {
          setColumns(cols);
          setShowIndexSettingModal(false);
          triggerToast('✓ POS Column indexes updated');
        }}
      />

      {/* 5. Cursor Setting Modal (Screen 045) */}
      <CursorSettingModal 
        isOpen={showCursorSettingModal}
        onClose={() => setShowCursorSettingModal(false)}
        flow={cursorFlow}
        onSaveFlow={fl => {
          setCursorFlow(fl);
          setShowCursorSettingModal(false);
          triggerToast('✓ POS Cursor navigation flow saved');
        }}
      />

      {/* 6. Quotation List Modal (Screen 522) */}
      <QuotationListModal 
        isOpen={showQuotationModal}
        onClose={() => setShowQuotationModal(false)}
        quotations={quotations}
        onLoadQuotation={q => {
          setCart(q.items);
          setSelectedCustomer(q.customer);
          setCustomerPhone(q.customer.contactNo);
          setCustomerState(q.customer.state);
          setShowQuotationModal(false);
          triggerToast(`✓ Converted Quotation ${q.quotationNo} into POS Invoice Cart!`);
        }}
      />

      {/* 7. Hold Bills Modal (Feature 44) */}
      <HoldBillsModal 
        isOpen={showHoldBillsModal}
        onClose={() => setShowHoldBillsModal(false)}
        holdBills={holdBills}
        onRestoreHoldBill={bill => {
          setCart(bill.items);
          setSelectedCustomer(bill.customer);
          setHoldBills(prev => prev.filter(b => b.id !== bill.id));
          setShowHoldBillsModal(false);
          triggerToast(`✓ Restored Hold Bill #${bill.holdNumber} to Cart!`);
        }}
        onDeleteHoldBill={id => setHoldBills(prev => prev.filter(b => b.id !== id))}
      />

      {/* 8. Print Preview Modal (Screens 050, 080, 716) */}
      <PrintPreviewModal 
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        invoice={activeInvoiceForPrint}
        designConfig={billDesignConfig}
      />

      {/* 9. Bulk Product Editor (Screen 556) */}
      <ProductBulkEditorModal 
        isOpen={showBulkEditorModal}
        onClose={() => setShowBulkEditorModal(false)}
        products={products}
        onSaveProducts={prods => {
          setProducts(prods);
          setShowBulkEditorModal(false);
          triggerToast('✓ Master Products inventory catalog updated');
        }}
      />

      {/* 10. Old Bills Search Register (F5) */}
      <OldBillsSearchModal 
        isOpen={showOldBillsModal}
        onClose={() => setShowOldBillsModal(false)}
        invoices={invoices}
        onSelectInvoice={inv => {
          setCart(inv.items);
          setSelectedCustomer(inv.customer);
          setCustomerPhone(inv.customer.contactNo);
          setCustomerState(inv.customer.state);
          setInvoiceNo(inv.invoiceNo);
          setShowOldBillsModal(false);
          triggerToast(`✓ Loaded previous Bill ${inv.invoiceNo} into active POS!`);
        }}
        onReprintInvoice={inv => {
          setActiveInvoiceForPrint(inv);
          setShowOldBillsModal(false);
          setShowPrintModal(true);
        }}
        onDeleteInvoice={id => {
          setInvoices(prev => prev.filter(inv => inv.id !== id));
          triggerToast('✓ Invoice voided & removed from sales register (Feature 35)');
        }}
      />

      {/* 11. E-Way Bill Modal (Shortcut 1900) */}
      <EWayBillModal 
        isOpen={showEWayBillModal}
        onClose={() => setShowEWayBillModal(false)}
        invoiceNo={invoiceNo}
        totalAmt={calc.netPay}
      />

      {/* 12. Salesman Assign Modal */}
      <SalesmanAssignModal 
        isOpen={showSalesmanModal}
        onClose={() => setShowSalesmanModal(false)}
        currentSalesman={activeSalesman}
        onAssignSalesman={(name, commPct) => {
          setActiveSalesman(name);
          setSalesmanCommissionPct(commPct);
          setCart(prev => prev.map(it => ({
            ...it,
            salesmanName: name,
            salesmanCommissionPct: commPct,
            commissionAmt: (it.total * commPct) / 100
          })));
          triggerToast(`✓ Salesman assigned: ${name} (${commPct}% comm.)`);
        }}
      />

      {/* 13. Product Search Picker Modal (Product ▾) */}
      <ProductSearchPickerModal 
        isOpen={showProductPickerModal}
        onClose={() => setShowProductPickerModal(false)}
        products={products}
        onSelectProduct={p => {
          setItemMrp(p.mrp.toFixed(2));
          setItemPrice((priceMode === 'WHOLESALE' ? p.wholesalePrice : p.retailPrice).toString());
          setItemUnit(p.unit || 'Unit');
          setBarcodeInput(p.barcode);
          handleAddItemToCart(p);
          setShowProductPickerModal(false);
        }}
      />

      {/* 14. Sales Return / Credit Note Entry */}
      <SalesReturnModal 
        isOpen={showSalesReturnModal}
        onClose={() => setShowSalesReturnModal(false)}
        onProcessReturn={(retItem, reason) => {
          setCart(prev => [...prev, retItem]);
          triggerToast(`✓ Credit Note Return added: ${retItem.name} (${reason})`);
        }}
      />

      {/* 15. Purchase Invoice Entry (F2) */}
      <PurchaseEntryModal 
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        products={products}
        onAddStock={(productId, addedQty, purchaseRate) => {
          setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: p.stock + addedQty } : p));
          triggerToast(`✓ Stock Inward registered: +${addedQty} units at ₹${purchaseRate}`);
        }}
      />

      {/* 16. Comprehensive ERP Sub-Module Modal for All 16 Ribbon Tabs */}
      <ErpSubModuleModal 
        isOpen={showErpModal}
        onClose={() => setShowErpModal(false)}
        moduleType={erpModuleType}
        products={products}
        customers={customers}
        invoices={invoices}
        onLoadInvoiceToPos={inv => {
          setCart(inv.items);
          setSelectedCustomer(inv.customer);
          setInvoiceNo(inv.invoiceNo);
          setShowErpModal(false);
        }}
        onAddStock={(productId, qty) => {
          setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: p.stock + qty } : p));
        }}
      />

      {/* 17. Customer Last Sold Price Modal (Ctrl+H - Feature 28) */}
      <LastSoldPriceModal 
        isOpen={showLastSoldPriceModal}
        onClose={() => setShowLastSoldPriceModal(false)}
        customer={selectedCustomer}
        onApplyPrice={p => {
          setItemPrice(p.toFixed(2));
          triggerToast(`✓ Applied customer's last negotiated price: ₹${p.toFixed(2)}`);
        }}
      />

      {/* 18. Bill Sundry Modal (Loading & Shipping Charges - Feature 16) */}
      <BillSundryModal 
        isOpen={showBillSundryModal}
        onClose={() => setShowBillSundryModal(false)}
        currentSundry={billSundryCharge}
        onApplySundry={s => {
          setBillSundryCharge(s);
          triggerToast(`✓ Added ${s.name}: ₹${s.amount.toFixed(2)} to invoice summary`);
        }}
      />

      {/* 19. Cash Vouchers Modal (Customer Receipt, Supplier Payment, Expenses - Part 2) */}
      <CashVoucherModal 
        isOpen={showCashVoucherModal}
        onClose={() => setShowCashVoucherModal(false)}
        voucherType={voucherType}
        customers={customers}
        onRecordVoucher={(title, amt, mode) => {
          triggerToast(`✓ Saved Voucher: ${title} (₹${amt.toFixed(2)} via ${mode})`);
        }}
      />

      {/* 20. Serial Number Prompt (Features 53 & 54) */}
      <SerialNumberModal 
        isOpen={showSerialModal}
        onClose={() => setShowSerialModal(false)}
        productName={serialProductTarget?.name || 'Selected Furniture Item'}
        onSaveSerial={sn => {
          if (serialProductTarget) {
            handleAddItemToCart({ ...serialProductTarget, regionalName: `SN: ${sn}` });
            triggerToast(`✓ Attached Serial Number: ${sn}`);
          }
        }}
      />

      {/* 21. Total Bill Discount Modal (Ctrl+C - Feature 27) */}
      <BillDiscountModal 
        isOpen={showBillDiscountModal}
        onClose={() => setShowBillDiscountModal(false)}
        subtotal={calc.taxableTotal}
        currentDiscount={billDiscountAmt}
        onApplyBillDiscount={amt => {
          setBillDiscountAmt(amt);
          triggerToast(`✓ Applied Total Bill Discount: -₹${amt.toFixed(2)}`);
        }}
      />
    </div>
  );
};
