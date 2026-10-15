import { useState, useRef, useEffect, useCallback } from 'react';
import type {
  Product,
  CartItem,
  Customer,
  CompanyInfo,
  BillTemplateConfig,
  DSaleBill,
  DSaleItem,
  BillPaperFormat,
  TaxScheme,
  HeldCart,
  PrefixSuffixConfig,
  BankAccountRecord,
  CustomerReceiptEntry,
  CustomerLedgerEntry
} from '../../types/retailDaddy';
import { CustomerEntryModal } from './CustomerEntryModal';
import { BillTemplatePreview } from './BillTemplatePreview';
import { AdjustableAmountModal } from './AdjustableAmountModal';
import { HoldRecordModal } from './HoldRecordModal';
import { SettlementModal } from './SettlementModal';
import { ReceiptEntryModal } from '../customers/ReceiptEntryModal';
import { OutstandingBalanceReportModal } from '../reports/OutstandingBalanceReportModal';
import { OldBillManagerModal, type OldBillRecord } from './OldBillManagerModal';

interface SalePosViewProps {
  products: Product[];
  customers: Customer[];
  isAdmin: boolean;
  onStockDeduct: (barcode: string, qty: number) => void;
  onRecordSaleInvoice: (invoiceData: any) => void;
  companyInfo: CompanyInfo;
  onUpdateCompanyInfo?: (info: CompanyInfo) => void;
  dSaleBills: DSaleBill[];
  onRecordDSaleBill: (bill: DSaleBill) => void;
  billConfig: BillTemplateConfig;
  onUpdateBillConfig: (config: BillTemplateConfig) => void;
  onAddCustomer?: (customer: Customer) => void;
  // Video 20 props
  heldCarts?: HeldCart[];
  onUpdateHeldCarts?: (carts: HeldCart[]) => void;
  prefixSuffixConfig?: PrefixSuffixConfig;
  bankAccounts?: BankAccountRecord[];
  ledgerEntries?: CustomerLedgerEntry[];
  onRecordReceipt?: (receipt: CustomerReceiptEntry, ledger: CustomerLedgerEntry) => void;
  billsHistory?: OldBillRecord[];
  onUpdateOldBill?: (billId: string, updatedBill: OldBillRecord) => void;
  onDeleteOldBill?: (billId: string) => void;
}

export function SalePosView({
  products,
  customers,
  isAdmin,
  onStockDeduct,
  onRecordSaleInvoice,
  companyInfo,
  dSaleBills,
  onRecordDSaleBill,
  billConfig,
  onUpdateBillConfig,
  onAddCustomer,
  heldCarts: externalHeldCarts,
  onUpdateHeldCarts,
  prefixSuffixConfig,
  bankAccounts = [],
  ledgerEntries = [],
  onRecordReceipt,
  billsHistory = [],
  onUpdateOldBill,
  onDeleteOldBill
}: SalePosViewProps) {
  // Top POS Tab State (Frame 035, 065, 070, 262)
  const [posActiveTab, setPosActiveTab] = useState<'SALE' | 'D_SALE' | 'BILL_DESIGN' | 'DASHBOARD' | 'PAY'>('SALE');

  // Tax Scheme State (GST, Non-GST, Composition - Frame 035, lines 164-217 in video 21)
  const [taxScheme, setTaxScheme] = useState<TaxScheme>('GST');

  // Price Mode: Retail vs Wholesale (Ctrl+S toggles this)
  const [priceMode, setPriceMode] = useState<'RETAIL' | 'WHOLESALE'>('RETAIL');

  // Customer State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(customers[0] || {
    id: 'cust-1',
    name: 'Cash',
    phone: '1234567890',
    state: 'Kerala',
    balance: 0,
    loyaltyPoints: 0
  });
  const [customerPhone, setCustomerPhone] = useState(customers[0]?.phone || '1234567890');
  const [customerState, setCustomerState] = useState(customers[0]?.state || 'Kerala');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Video 20 Feature 7: Spot Customer Entry state (Frame 052/054)
  const [showSpotCustomerPopover, setShowSpotCustomerPopover] = useState(false);
  const [spotCustomerPhone, setSpotCustomerPhone] = useState('');
  const [spotCustomerName, setSpotCustomerName] = useState('');

  // Fast Product Search Input State
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [entryQty, setEntryQty] = useState<number>(1);
  const [entryDiscPercent, setEntryDiscPercent] = useState<number>(0);

  // Cart State (Standard Inventory POS)
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Video 20 Feature 9: Multi-Customer Cart Hold & Unhold System (Frame 197)
  const [internalHeldCarts, setInternalHeldCarts] = useState<HeldCart[]>([]);
  const activeHeldCarts = externalHeldCarts || internalHeldCarts;
  const updateHeldCarts = onUpdateHeldCarts || setInternalHeldCarts;
  const [isHoldRecordModalOpen, setIsHoldRecordModalOpen] = useState(false);

  // Video 20 Feature 6: Item Adjustable Amount Option (Frame 034)
  const [isAdjustableModalOpen, setIsAdjustableModalOpen] = useState(false);
  const [adjustableItemInfo, setAdjustableItemInfo] = useState<{ name: string; rate: number }>({ name: 'Elachi', rate: 3400 });

  // Video 20 Feature 8: Retail Invoice Editing & Deletion (Frames 093, 126, 128, 130)
  const [isOldBillModalOpen, setIsOldBillModalOpen] = useState(false);
  const [editingOldBill, setEditingOldBill] = useState<OldBillRecord | null>(null);

  // Video 20 Feature 11: Settlement & Split Payment (Frames 258, 262)
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);

  // Video 20 Feature 13 & 14: Receipt Entry Voucher & Outstanding Reports (Frames 321, 331, 362)
  const [isReceiptEntryModalOpen, setIsReceiptEntryModalOpen] = useState(false);
  const [isOutstandingReportModalOpen, setIsOutstandingReportModalOpen] = useState(false);

  // Video 20 Feature 13: Dashboard button visibility toggles (Frame 321)
  const [showBtnSalesman, setShowBtnSalesman] = useState(true);
  const [showBtnHold, setShowBtnHold] = useState(true);
  const [showBtnUnhold, setShowBtnUnhold] = useState(true);
  const [showBtnWeighingScaleOn, setShowBtnWeighingScaleOn] = useState(true);
  const [showBtnWeighingScaleOff, setShowBtnWeighingScaleOff] = useState(true);
  const [showBtnEstimate, setShowBtnEstimate] = useState(true);
  const [showBtnQuotation, setShowBtnQuotation] = useState(true);

  // D-Sale State (Frame 070, 075 Direct Non-Inventory Rapid Billing)
  const [dSaleItems, setDSaleItems] = useState<DSaleItem[]>([
    { id: 'ds-1', code: 'INVD-0001', productName: 'SAREE', qty: 2, unit: 'PCS', rate: 800, discPercent: 0, discAmt: 0, total: 1600, totalMrp: 1600 },
    { id: 'ds-2', code: 'INVD-0001', productName: 'SHIRT', qty: 4, unit: 'PCS', rate: 500, discPercent: 0, discAmt: 0, total: 2000, totalMrp: 2000 },
    { id: 'ds-3', code: 'INVD-0001', productName: 'CHURIDAR', qty: 2, unit: 'PCS', rate: 300, discPercent: 0, discAmt: 0, total: 600, totalMrp: 600 }
  ]);
  const [dSaleProductName, setDSaleProductName] = useState('');
  const [dSaleQty, setDSaleQty] = useState<number>(1);
  const [dSaleUnit, setDSaleUnit] = useState<string>('PCS');
  const [dSaleRate, setDSaleRate] = useState<number>(0);
  const [dSaleDiscType, setDSaleDiscType] = useState<string>('%');
  const [dSaleDiscPercent, setDSaleDiscPercent] = useState<number>(0);

  // Bill Design Tab State (Frame 065, 220)
  const [designFormat, setDesignFormat] = useState<BillPaperFormat>(billConfig.paperFormat || '3INCH');
  const [designStyleIndex, setDesignStyleIndex] = useState<number>(billConfig.styleIndex || 1);
  const [designPrinter, setDesignPrinter] = useState<string>(billConfig.printerName || 'Microsoft Print to PDF');

  // Modals & UI States
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [lastCompletedBill, setLastCompletedBill] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedSalesman] = useState('Mahesh (Counter 1)');

  // Input refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const dSaleProductNameRef = useRef<HTMLInputElement>(null);
  const dSaleRateRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Synchronize state when external customer changes
  useEffect(() => {
    if (customers.length > 0 && (!selectedCustomer || !customers.some(c => c.id === selectedCustomer.id))) {
      setSelectedCustomer(customers[0]);
      setCustomerPhone(customers[0].phone);
      setCustomerState(customers[0].state);
    }
  }, [customers, selectedCustomer]);

  // Video 20 Feature 10: Dynamic Invoice Number generator based on Prefix/Suffix Configuration (Frame 221)
  const currentInvoiceNo = editingOldBill
    ? editingOldBill.invoiceNo
    : prefixSuffixConfig
    ? `${prefixSuffixConfig.saleInvoice.prefix}0015${prefixSuffixConfig.saleInvoice.suffix}`
    : taxScheme === 'GST'
    ? 'SINV-0015-2024/25'
    : taxScheme === 'COMPOSITION'
    ? 'COMP-0015-2024/25'
    : 'NGST-0015-2024/25';

  const currentDSaleInvoiceNo = `INVD-${String(dSaleBills.length + 1).padStart(4, '0')}`;

  // Video 20 Feature 7: Spot Customer Entry Fast Save (Frame 052/054)
  const handleSaveSpotCustomer = () => {
    if (!spotCustomerName.trim() || !spotCustomerPhone.trim()) {
      alert('Please enter customer name and phone');
      return;
    }
    const newCust: Customer = {
      id: 'cust-' + Date.now(),
      name: spotCustomerName.trim(),
      phone: spotCustomerPhone.trim(),
      state: customerState,
      balance: 0,
      loyaltyPoints: 0
    };
    if (onAddCustomer) {
      onAddCustomer(newCust);
    }
    setSelectedCustomer(newCust);
    setCustomerPhone(newCust.phone);
    setShowSpotCustomerPopover(false);
    showToast(`✓ Spot Customer Saved: ${newCust.name} [Video 20 Frame 054]`);
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  };

  // ==========================================
  // ADD PRODUCT TO CART (Standard POS)
  // ==========================================
  const addItemToCart = useCallback((product: Product, quantity: number = 1, forceAltUnit?: boolean) => {
    if (product.expDate) {
      const exp = new Date(product.expDate);
      const today = new Date();
      if (exp < today) {
        alert(`🚨 EXPIRED PRODUCT ALERT!\n\nProduct "${product.name}" expired on ${product.expDate}.\nRetail Daddy safety protocol blocks selling expired stock.`);
        return;
      }
    }

    const baseRate = priceMode === 'WHOLESALE' && product.wholesalePrice
      ? product.wholesalePrice
      : product.retailPrice;

    const isAlt = forceAltUnit !== undefined ? forceAltUnit : false;
    const convFactor = (isAlt && product.conv && product.conv > 1) ? product.conv : 1;
    const rate = Number((baseRate / convFactor).toFixed(2));
    const unitName = isAlt ? (product.salesAltUnit || 'Piece') : (product.salesUnit || 'Nos');
    const stockDeductQty = isAlt ? Number((quantity / convFactor).toFixed(3)) : quantity;

    const existingIndex = cart.findIndex(c => c.barcode === product.barcode && Boolean(c.isAltUnit) === isAlt);
    if (existingIndex > -1) {
      const updated = [...cart];
      const newQty = updated[existingIndex].qty + quantity;
      const newStockDeduct = isAlt ? Number((newQty / convFactor).toFixed(3)) : newQty;
      const taxable = newQty * rate * (1 - updated[existingIndex].discPercent / 100);
      const isInterState = customerState !== 'Kerala';

      const cgstAmt = (taxScheme === 'GST' && !isInterState) ? (taxable * (product.cgst || 0)) / 100 : 0;
      const sgstAmt = (taxScheme === 'GST' && !isInterState) ? (taxable * (product.sgst || 0)) / 100 : 0;
      const igstAmt = (taxScheme === 'GST' && isInterState) ? (taxable * (product.igst || 0)) / 100 : 0;
      const total = taxable + cgstAmt + sgstAmt + igstAmt;

      updated[existingIndex] = {
        ...updated[existingIndex],
        qty: newQty,
        stockDeductQty: newStockDeduct,
        taxable,
        cgstAmt,
        sgstAmt,
        igstAmt,
        total
      };
      setCart(updated);
      showToast(`Updated ${product.name} [${unitName}] qty: ${newQty}`);
    } else {
      const isInterState = customerState !== 'Kerala';
      const effectiveDiscPercent = entryDiscPercent > 0 ? entryDiscPercent : (product.discount || 0);
      const discAmt = (rate * quantity * effectiveDiscPercent) / 100;
      const taxable = (rate * quantity) - discAmt;

      const cgstAmt = (taxScheme === 'GST' && !isInterState) ? (taxable * (product.cgst || 0)) / 100 : 0;
      const sgstAmt = (taxScheme === 'GST' && !isInterState) ? (taxable * (product.sgst || 0)) / 100 : 0;
      const igstAmt = (taxScheme === 'GST' && isInterState) ? (taxable * (product.igst || 0)) / 100 : 0;
      const total = taxable + cgstAmt + sgstAmt + igstAmt;

      const newItem: CartItem = {
        id: `item-${Date.now()}-${Math.random()}`,
        productId: product.id,
        pCode: product.pCode,
        name: product.name,
        hsn: product.hsn || '9403',
        barcode: product.barcode,
        qty: quantity,
        rate,
        mrp: isAlt ? Number(((product.mrp || rate) / convFactor).toFixed(2)) : product.mrp,
        purchasePrice: isAlt ? Number(((product.purchasePrice || 0) / convFactor).toFixed(2)) : product.purchasePrice,
        discPercent: effectiveDiscPercent,
        discAmt,
        taxable,
        cgstPercent: taxScheme === 'GST' && !isInterState ? (product.cgst || 0) : 0,
        sgstPercent: taxScheme === 'GST' && !isInterState ? (product.sgst || 0) : 0,
        igstPercent: taxScheme === 'GST' && isInterState ? (product.igst || 0) : 0,
        cgstAmt,
        sgstAmt,
        igstAmt,
        total,
        salesman: selectedSalesman,
        commissionPercent: 2.5,
        commissionAmt: total * 0.025,
        stockId: product.id,
        points: Math.floor(total / 100),
        batch: product.batch,
        expDate: product.expDate,
        godown: product.godown,
        rack: product.rack,
        size: product.size,
        colour: product.colour,
        unit: unitName,
        isAltUnit: isAlt,
        conv: product.conv,
        stockDeductQty,
        photo: product.photo
      };

      setCart(prev => [newItem, ...prev]);
      const discTag = effectiveDiscPercent > 0 ? ` (Disc: ${effectiveDiscPercent}%)` : '';
      showToast(`Added ${product.name} [${unitName}] (${priceMode === 'WHOLESALE' ? 'Wholesale' : 'Retail'} ₹${rate.toFixed(2)})${discTag}`);
    }

    setSearchQuery('');
    setBarcodeInput('');
    setEntryQty(1);
    searchInputRef.current?.focus();
  }, [cart, customerState, entryDiscPercent, priceMode, selectedSalesman, taxScheme]);

  // Barcode Scan Handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim();
    if (!query) return;

    let found = products.find(p => p.barcode === query);
    let matchedVariant = null;

    if (!found) {
      for (const p of products) {
        if (p.variants && p.variants.length > 0) {
          const v = p.variants.find(item => item.barcode === query);
          if (v) {
            found = p;
            matchedVariant = v;
            break;
          }
        }
      }
    }

    if (found) {
      if (matchedVariant) {
        const variantProduct: Product = {
          ...found,
          barcode: matchedVariant.barcode,
          name: `${found.name} (${matchedVariant.size}/${matchedVariant.colour})`,
          size: matchedVariant.size,
          colour: matchedVariant.colour,
          mrp: matchedVariant.mrp,
          retailPrice: matchedVariant.retailPrice
        };
        addItemToCart(variantProduct, entryQty, false);
      } else {
        addItemToCart(found, entryQty, false);
      }
    } else {
      showToast(`❌ Barcode "${barcodeInput}" not found in database`);
    }
  };

  // Switch Price Mode
  const togglePriceMode = (newMode: 'RETAIL' | 'WHOLESALE') => {
    setPriceMode(newMode);
    setCart(prev =>
      prev.map(item => {
        const prod = products.find(p => p.id === item.productId);
        const base = newMode === 'WHOLESALE' && prod?.wholesalePrice
          ? prod.wholesalePrice
          : (prod?.retailPrice || item.rate);
        const convFactor = (item.isAltUnit && item.conv && item.conv > 1) ? item.conv : 1;
        const newRate = Number((base / convFactor).toFixed(2));
        const taxable = item.qty * newRate * (1 - item.discPercent / 100);
        const isInterState = customerState !== 'Kerala';
        const cgstAmt = taxScheme === 'GST' && !isInterState ? (taxable * item.cgstPercent) / 100 : 0;
        const sgstAmt = taxScheme === 'GST' && !isInterState ? (taxable * item.sgstPercent) / 100 : 0;
        const igstAmt = taxScheme === 'GST' && isInterState ? (taxable * item.igstPercent) / 100 : 0;
        const total = taxable + cgstAmt + sgstAmt + igstAmt;
        return {
          ...item,
          rate: newRate,
          taxable,
          cgstAmt,
          sgstAmt,
          igstAmt,
          total
        };
      })
    );
    showToast(`Switched to ${newMode} Price Mode (Ctrl+S)`);
  };

  // Global Keyboard Shortcuts (F1, F4, Ctrl+S)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault();
        if (posActiveTab === 'D_SALE') {
          handleDSaleQuickPay();
        } else {
          triggerQuickPay();
        }
      } else if (e.key === 'F1') {
        e.preventDefault();
        if (posActiveTab === 'D_SALE') {
          setDSaleItems([]);
          showToast('New D-Sale Started [F1]');
        } else {
          setCart([]);
          showToast('New Bill Started [F1]');
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        togglePriceMode(priceMode === 'RETAIL' ? 'WHOLESALE' : 'RETAIL');
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [posActiveTab, priceMode, cart, dSaleItems]);

  // Cart Calculations (Standard Sale)
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalTax = cart.reduce((sum, item) => sum + item.cgstAmt + item.sgstAmt + item.igstAmt, 0);
  const totalDisc = cart.reduce((sum, item) => sum + item.discAmt, 0);
  const totalMrp = cart.reduce((sum, item) => sum + (item.mrp * item.qty), 0);
  const netPay = cart.reduce((sum, item) => sum + item.total, 0);

  // Profit Margins (Admin only)
  const totalPurchaseCost = cart.reduce((sum, item) => sum + (item.purchasePrice * item.qty), 0);
  const grossProfit = netPay - totalTax - totalPurchaseCost;
  const profitMarginPercent = netPay > 0 ? (grossProfit / netPay) * 100 : 0;

  // Trigger Standard Quick Pay F4
  const triggerQuickPay = () => {
    if (cart.length === 0) {
      alert('Cart is empty. Scan barcodes or select products to bill.');
      return;
    }

    cart.forEach(item => {
      const deductAmount = item.stockDeductQty !== undefined ? item.stockDeductQty : item.qty;
      onStockDeduct(item.barcode, deductAmount);
    });

    const billRecord = {
      invoiceNo: currentInvoiceNo,
      date: new Date().toLocaleDateString('en-GB'),
      customer: selectedCustomer,
      items: [...cart],
      totalItems: cart.length,
      totalQty,
      totalTax,
      totalDisc,
      totalMrp,
      netPay,
      taxScheme,
      status: 'PAID'
    };

    onRecordSaleInvoice(billRecord);
    setLastCompletedBill(billRecord);
    setShowPrintModal(true);
    setCart([]);
    showToast(`✅ Bill ${currentInvoiceNo} generated for ₹${netPay.toFixed(2)}`);
  };

  // ==========================================
  // D-SALE RAPID BILLING HANDLERS (Frame 070, 075)
  // ==========================================
  const handleAddDSaleItem = () => {
    if (!dSaleProductName.trim()) {
      alert('Please enter Product Name for D-Sale');
      dSaleProductNameRef.current?.focus();
      return;
    }
    if (dSaleRate <= 0) {
      alert('Please enter Rate for D-Sale item');
      dSaleRateRef.current?.focus();
      return;
    }

    const discAmt = (dSaleRate * dSaleQty * dSaleDiscPercent) / 100;
    const total = (dSaleRate * dSaleQty) - discAmt;

    const newItem: DSaleItem = {
      id: `ds-${Date.now()}`,
      code: currentDSaleInvoiceNo,
      productName: dSaleProductName.trim().toUpperCase(),
      qty: dSaleQty,
      unit: dSaleUnit,
      rate: dSaleRate,
      discPercent: dSaleDiscPercent,
      discAmt,
      total,
      totalMrp: dSaleRate * dSaleQty
    };

    setDSaleItems(prev => [...prev, newItem]);
    setDSaleProductName('');
    setDSaleQty(1);
    setDSaleRate(0);
    setDSaleDiscPercent(0);
    showToast(`Added D-Sale: ${newItem.productName} (₹${newItem.total.toFixed(2)})`);
    dSaleProductNameRef.current?.focus();
  };

  const dSaleTotalQty = dSaleItems.reduce((sum, it) => sum + it.qty, 0);
  const dSaleGrandTotal = dSaleItems.reduce((sum, it) => sum + it.total, 0);
  const dSaleTotalMrp = dSaleItems.reduce((sum, it) => sum + it.totalMrp, 0);

  const handleDSaleQuickPay = () => {
    if (dSaleItems.length === 0) {
      alert('D-Sale table is empty! Type product name, qty, rate and press Enter to add items.');
      return;
    }

    const newDSaleBill: DSaleBill = {
      id: `dbill-${Date.now()}`,
      invoiceNo: currentDSaleInvoiceNo,
      date: new Date().toLocaleDateString('en-GB'),
      customerName: selectedCustomer.name || 'Cash',
      items: [...dSaleItems],
      totalQty: dSaleTotalQty,
      grandTotal: dSaleGrandTotal,
      totalPaid: dSaleGrandTotal,
      balance: 0,
      paymentMode: 'CASH'
    };

    onRecordDSaleBill(newDSaleBill);

    // Prepare bill representation for print preview
    const convertedItems: CartItem[] = dSaleItems.map(it => ({
      id: it.id,
      productId: 'd-sale',
      pCode: it.code,
      name: it.productName,
      hsn: '9403',
      barcode: 'DSALE',
      qty: it.qty,
      rate: it.rate,
      mrp: it.totalMrp / it.qty,
      purchasePrice: 0,
      discPercent: it.discPercent,
      discAmt: it.discAmt,
      taxable: it.total,
      cgstPercent: 0,
      sgstPercent: 0,
      igstPercent: 0,
      cgstAmt: 0,
      sgstAmt: 0,
      igstAmt: 0,
      total: it.total,
      salesman: 'Direct Billing',
      commissionPercent: 0,
      commissionAmt: 0,
      stockId: 'd-sale',
      points: 0,
      unit: it.unit
    }));

    const billRecord = {
      invoiceNo: currentDSaleInvoiceNo,
      date: newDSaleBill.date,
      customer: selectedCustomer,
      items: convertedItems,
      totalItems: convertedItems.length,
      totalQty: dSaleTotalQty,
      totalTax: 0,
      totalDisc: 0,
      totalMrp: dSaleTotalMrp,
      netPay: dSaleGrandTotal,
      taxScheme: 'NON_GST' as const,
      status: 'PAID'
    };

    setLastCompletedBill(billRecord);
    setShowPrintModal(true);
    setDSaleItems([]);
    showToast(`✅ D-Sale Bill ${currentDSaleInvoiceNo} created for ₹${dSaleGrandTotal.toFixed(2)}`);
  };

  // ==========================================
  // BILL DESIGN TAB ACTIONS (Frame 065, 220)
  // ==========================================
  const handleApplyBillConfig = () => {
    const updated: BillTemplateConfig = {
      paperFormat: designFormat,
      styleIndex: designStyleIndex,
      printerName: designPrinter,
      showDynamicQr: true
    };
    onUpdateBillConfig(updated);
    showToast(`Applied ${designFormat} Style ${designStyleIndex} to ${designPrinter}`);
  };

  // Sample data for Bill Design Live Preview
  const sampleBillData = {
    invoiceNo: 'SINV-0003-2024/25',
    date: new Date().toLocaleDateString('en-GB'),
    customer: selectedCustomer,
    items: cart.length > 0 ? cart : [
      {
        id: 's-1',
        productId: 'p-1',
        pCode: 'P-101',
        name: 'AFRITADA TUNA 556',
        hsn: '1604',
        barcode: '8901234567890',
        qty: 1,
        rate: 29.00,
        mrp: 33.00,
        purchasePrice: 20.00,
        discPercent: 0,
        discAmt: 0,
        taxable: 29.00,
        cgstPercent: 0,
        sgstPercent: 0,
        igstPercent: 0,
        cgstAmt: 0,
        sgstAmt: 0,
        igstAmt: 0,
        total: 29.00,
        salesman: 'Counter 1',
        commissionPercent: 0,
        commissionAmt: 0,
        stockId: 's-1',
        points: 0,
        unit: 'PCS'
      },
      {
        id: 's-2',
        productId: 'p-2',
        pCode: 'P-102',
        name: 'ADOL EXTRA TABLETS',
        hsn: '3004',
        barcode: '8901234567891',
        qty: 1,
        rate: 27.00,
        mrp: 31.00,
        purchasePrice: 18.00,
        discPercent: 0,
        discAmt: 0,
        taxable: 27.00,
        cgstPercent: 0,
        sgstPercent: 0,
        igstPercent: 0,
        cgstAmt: 0,
        sgstAmt: 0,
        igstAmt: 0,
        total: 27.00,
        salesman: 'Counter 1',
        commissionPercent: 0,
        commissionAmt: 0,
        stockId: 's-2',
        points: 0,
        unit: 'PCS'
      },
      {
        id: 's-3',
        productId: 'p-3',
        pCode: 'P-103',
        name: 'AACHISAFOETIDA 50GM',
        hsn: '0910',
        barcode: '8901234567892',
        qty: 1,
        rate: 21.00,
        mrp: 25.00,
        purchasePrice: 15.00,
        discPercent: 0,
        discAmt: 0,
        taxable: 21.00,
        cgstPercent: 0,
        sgstPercent: 0,
        igstPercent: 0,
        cgstAmt: 0,
        sgstAmt: 0,
        igstAmt: 0,
        total: 21.00,
        salesman: 'Counter 1',
        commissionPercent: 0,
        commissionAmt: 0,
        stockId: 's-3',
        points: 0,
        unit: 'PCS'
      }
    ],
    totalQty: 3,
    totalTax: 0,
    totalDisc: 12.00,
    totalMrp: 89.00,
    netPay: 77.00,
    taxScheme
  };

  return (
    <div className="rd-window" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '45px',
          right: '20px',
          background: '#065f46',
          color: '#ffffff',
          padding: '8px 16px',
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          zIndex: 999
        }}>
          {toastMessage}
        </div>
      )}

      {/* TOP HEADER (MATCHING FRAME 035, 065, 070) */}
      <div className="rd-pos-header" style={{ background: '#d9f99d', borderBottom: '1px solid #a3e635' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="rd-pos-title" style={{ color: '#166534', fontWeight: '900', letterSpacing: '0.5px' }}>
            POINT OF SALE
          </span>

          {/* Retail vs Wholesale radio */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', fontWeight: 'bold' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="priceMode"
                checked={priceMode === 'RETAIL'}
                onChange={() => togglePriceMode('RETAIL')}
              />
              <span>Retail Price</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="priceMode"
                checked={priceMode === 'WHOLESALE'}
                onChange={() => togglePriceMode('WHOLESALE')}
              />
              <span>Wholesale Price</span>
            </label>
          </div>
        </div>

        {/* Invoice Meta & Tax Scheme Selector (Frame 035, lines 164-217 in video 21) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', fontWeight: 'bold' }}>
          <span>Invoice No : {posActiveTab === 'D_SALE' ? currentDSaleInvoiceNo : currentInvoiceNo}</span>
          <span>Date : {new Date().toLocaleDateString('en-GB')}</span>

          {/* Tax Scheme Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Tax :</span>
            <select
              value={taxScheme}
              onChange={e => {
                setTaxScheme(e.target.value as TaxScheme);
                showToast(`Tax Scheme switched to ${e.target.value}`);
              }}
              style={{
                padding: '2px 6px',
                fontWeight: 'bold',
                fontSize: '11px',
                background: taxScheme === 'GST' ? '#ffffff' : taxScheme === 'COMPOSITION' ? '#fef08a' : '#fed7aa',
                border: '1px solid #65a30d',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              <option value="GST">GST</option>
              <option value="NON_GST">NON GST</option>
              <option value="COMPOSITION">COMPOSITION</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5 TOP TABS (FRAME 035, 065, 070: Sale | D-Sale | Bill Design | Dash board | Pay) */}
      <div style={{
        background: '#e2e8f0',
        borderBottom: '2px solid #cbd5e1',
        display: 'flex',
        padding: '0 8px',
        gap: '4px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        <button
          onClick={() => setPosActiveTab('SALE')}
          style={{
            padding: '6px 16px',
            border: '1px solid #cbd5e1',
            borderBottom: posActiveTab === 'SALE' ? '2px solid #ffffff' : 'none',
            background: posActiveTab === 'SALE' ? '#ffffff' : '#f1f5f9',
            color: posActiveTab === 'SALE' ? '#1e40af' : '#475569',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0'
          }}
        >
          Sale
        </button>

        <button
          onClick={() => setPosActiveTab('D_SALE')}
          style={{
            padding: '6px 16px',
            border: '1px solid #cbd5e1',
            borderBottom: posActiveTab === 'D_SALE' ? '2px solid #ffffff' : 'none',
            background: posActiveTab === 'D_SALE' ? '#ffffff' : '#f1f5f9',
            color: posActiveTab === 'D_SALE' ? '#b45309' : '#475569',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0'
          }}
        >
          ⚡ D-Sale (Direct Billing)
        </button>

        <button
          onClick={() => setPosActiveTab('BILL_DESIGN')}
          style={{
            padding: '6px 16px',
            border: '1px solid #cbd5e1',
            borderBottom: posActiveTab === 'BILL_DESIGN' ? '2px solid #ffffff' : 'none',
            background: posActiveTab === 'BILL_DESIGN' ? '#ffffff' : '#f1f5f9',
            color: posActiveTab === 'BILL_DESIGN' ? '#15803d' : '#475569',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0'
          }}
        >
          🎨 Bill Design
        </button>

        <button
          onClick={() => setPosActiveTab('DASHBOARD')}
          style={{
            padding: '6px 16px',
            border: '1px solid #cbd5e1',
            borderBottom: posActiveTab === 'DASHBOARD' ? '2px solid #ffffff' : 'none',
            background: posActiveTab === 'DASHBOARD' ? '#ffffff' : '#f1f5f9',
            color: posActiveTab === 'DASHBOARD' ? '#6d28d9' : '#475569',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0'
          }}
        >
          Dash board
        </button>

        <button
          onClick={() => {
            if (cart.length > 0) triggerQuickPay();
            else if (dSaleItems.length > 0) handleDSaleQuickPay();
            else alert('Cart is empty. Please add items before paying.');
          }}
          style={{
            padding: '6px 16px',
            border: '1px solid #cbd5e1',
            background: '#16a34a',
            color: '#ffffff',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0',
            marginLeft: 'auto'
          }}
        >
          💳 Pay Instant
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: STANDARD INVENTORY SALE TAB (FRAME 035)                  */}
      {/* ============================================================== */}
      {posActiveTab === 'SALE' && (
        <>
          {/* Video 20 Feature 8: Edit Mode Warning Banner (Frame 126/130) */}
          {editingOldBill && (
            <div style={{
              background: '#fee2e2',
              borderBottom: '2px solid #dc2626',
              color: '#991b1b',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>⚠️</span>
                <span>EDITING SAVED INVOICE: <span style={{ textDecoration: 'underline', color: '#7f1d1d' }}>{editingOldBill.invoiceNo}</span> (Dated: {editingOldBill.date}) - Press [Update F3] to Save or [Delete] to Remove</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingOldBill(null);
                  setCart([]);
                  showToast('Exited Old Bill Edit Mode');
                }}
                style={{
                  background: '#991b1b',
                  color: '#ffffff',
                  border: 'none',
                  padding: '2px 10px',
                  borderRadius: '3px',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                ✕ Cancel Edit Mode
              </button>
            </div>
          )}

          {/* CUSTOMER ENTRY STRIP (ROW 1 - FRAME 035 & FRAME 052 SPOT CUSTOMER) */}
          <div className="rd-pos-strip" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', gap: '8px', position: 'relative' }}>
            {/* Customer Add/Edit Modal Trigger Button */}
            <button
              className="rd-grid-btn"
              style={{
                background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#ffffff',
                fontWeight: 'bold',
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              onClick={() => setIsCustomerModalOpen(true)}
              title="Open Customer Entry Master [Frame 035]"
            >
              <span>👤+</span>
              <span>Customer Entry</span>
            </button>

            <input
              type="text"
              className="rd-pos-input"
              style={{ width: '140px', background: '#fef08a', fontWeight: 'bold' }}
              value={selectedCustomer.name}
              onChange={e => setSelectedCustomer({ ...selectedCustomer, name: e.target.value })}
              placeholder="Customer Name"
            />

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="rd-pos-input"
                style={{ width: '120px', background: '#fef08a', fontWeight: 'bold' }}
                value={customerPhone}
                onChange={e => {
                  setCustomerPhone(e.target.value);
                  const found = customers.find(c => c.phone === e.target.value);
                  if (found) {
                    setSelectedCustomer(found);
                    setCustomerState(found.state);
                    showToast(`Customer: ${found.name} (Dr Balance: ₹${found.balance.toFixed(2)})`);
                  }
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const found = customers.find(c => c.phone === customerPhone);
                    if (!found && customerPhone.trim().length > 0) {
                      setSpotCustomerPhone(customerPhone);
                      setSpotCustomerName('');
                      setShowSpotCustomerPopover(true);
                    } else {
                      barcodeInputRef.current?.focus();
                    }
                  }
                }}
                placeholder="Mobile Number"
                title="Type phone & press ENTER for Spot Customer Entry [Video 20 Frame 052]"
              />

              {/* Video 20 Feature 7: Spot Customer Entry Popover (1:1 Frame 052 & 054) */}
              {showSpotCustomerPopover && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  zIndex: 2000,
                  background: '#e8ecef',
                  border: '2px solid #84cc16',
                  boxShadow: '0 10px 25px -3px rgba(0,0,0,0.4)',
                  width: '320px',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead style={{ background: '#bef264', color: '#166534', fontWeight: 'bold' }}>
                      <tr>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #84cc16', textAlign: 'left' }}>ContactNo</th>
                        <th style={{ padding: '4px 6px', borderRight: '1px solid #84cc16', textAlign: 'left' }}>Name</th>
                        <th style={{ padding: '4px 6px', textAlign: 'center' }}>Save</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ background: '#2563eb', color: '#ffffff' }}>
                        <td style={{ padding: '4px 6px', fontWeight: 'bold', borderRight: '1px solid #93c5fd' }}>
                          {spotCustomerPhone}
                        </td>
                        <td style={{ padding: '2px', borderRight: '1px solid #93c5fd' }}>
                          <input
                            autoFocus
                            type="text"
                            value={spotCustomerName}
                            onChange={e => setSpotCustomerName(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveSpotCustomer();
                              if (e.key === 'Escape') setShowSpotCustomerPopover(false);
                            }}
                            placeholder="Customer Name..."
                            style={{
                              width: '100%',
                              padding: '2px 4px',
                              fontSize: '11px',
                              color: '#000000',
                              fontWeight: 'bold',
                              background: '#ffffcc',
                              border: 'none',
                              outline: 'none'
                            }}
                          />
                        </td>
                        <td style={{ padding: '2px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={handleSaveSpotCustomer}
                            style={{
                              background: '#16a34a',
                              color: '#ffffff',
                              border: 'none',
                              padding: '3px 8px',
                              borderRadius: '2px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              fontSize: '10px'
                            }}
                          >
                            Save
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <select
              className="rd-pos-input"
              style={{ width: '130px' }}
              value={customerState}
              onChange={e => setCustomerState(e.target.value)}
            >
              <option value="Kerala">Kerala (Intra-State 32)</option>
              <option value="Karnataka">Karnataka (IGST 29)</option>
              <option value="Tamil Nadu">Tamil Nadu (IGST 33)</option>
            </select>

            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold' }}>
              <input type="checkbox" />
              <span>W-Barcode</span>
            </label>

            {selectedCustomer.gstin && (
              <span style={{
                background: '#dcfce7',
                border: '1px solid #16a34a',
                color: '#15803d',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                B2B GSTIN: {selectedCustomer.gstin}
              </span>
            )}

            {selectedCustomer.balance > 0 && (
              <div style={{ marginLeft: 'auto', background: '#fee2e2', border: '1px solid #ef4444', color: '#991b1b', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}>
                ⚠️ Due: ₹{selectedCustomer.balance.toFixed(2)}
              </div>
            )}
          </div>

          {/* PRODUCT SEARCH & INPUT STRIP (ROW 2) */}
          <div className="rd-pos-strip">
            <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Search By Product :</span>
            <div style={{ position: 'relative' }}>
              <input
                ref={searchInputRef}
                type="text"
                className="rd-pos-input"
                style={{ width: '280px', background: '#fef08a', fontWeight: 'bold' }}
                placeholder="Type Name or Scan Barcode..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '440px',
                  maxHeight: '280px',
                  overflowY: 'auto',
                  background: '#ffffff',
                  border: '2px solid #2563eb',
                  boxShadow: '0 10px 25px -3px rgba(0,0,0,0.3)',
                  zIndex: 100,
                  borderRadius: '4px'
                }}>
                  {products
                    .filter(p =>
                      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.barcode.includes(searchQuery) ||
                      (p.size && p.size.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      (p.colour && p.colour.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .slice(0, 8)
                    .map(p => {
                      const basePrice = priceMode === 'WHOLESALE' && p.wholesalePrice ? p.wholesalePrice : p.retailPrice;
                      const hasAlt = Boolean(p.conv && p.conv > 1);
                      const altPrice = hasAlt ? Number((basePrice / (p.conv || 1)).toFixed(2)) : null;

                      return (
                        <div
                          key={p.id}
                          style={{
                            padding: '6px 8px',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '11px',
                            gap: '8px'
                          }}
                        >
                          {p.photo && (
                            <img
                              src={p.photo}
                              alt={p.name}
                              style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '3px', border: '1px solid #cbd5e1', flexShrink: 0 }}
                            />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span>{p.name}</span>
                              {p.size && (
                                <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '1px 5px', borderRadius: '3px', fontSize: '10px' }}>
                                  Size: {p.size}
                                </span>
                              )}
                              {p.colour && (
                                <span style={{ background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: '3px', fontSize: '10px' }}>
                                  {p.colour}
                                </span>
                              )}
                            </div>
                            <div style={{ color: '#64748b', fontSize: '10px' }}>
                              Barcode: {p.barcode} | Stock: {p.openingStock} {p.salesUnit || 'Nos'}
                              {hasAlt && ` (1 ${p.salesUnit || 'Box'} = ${p.conv} ${p.salesAltUnit || 'Pcs'})`}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            <button
                              className="rd-grid-btn"
                              style={{ background: '#16a34a', color: '#ffffff', fontWeight: 'bold', fontSize: '10px', padding: '3px 6px' }}
                              onMouseDown={() => addItemToCart(p, entryQty, false)}
                              title={`Sell as ${p.salesUnit || 'Main Unit'}`}
                            >
                              {p.salesUnit || 'Nos'}: ₹{basePrice.toFixed(2)}
                            </button>
                            {hasAlt && altPrice !== null && (
                              <button
                                className="rd-grid-btn"
                                style={{ background: '#2563eb', color: '#ffffff', fontWeight: 'bold', fontSize: '10px', padding: '3px 6px' }}
                                onMouseDown={() => addItemToCart(p, entryQty, true)}
                                title={`Sell as ${p.salesAltUnit || 'Pcs'} (1/${p.conv} ratio)`}
                              >
                                {p.salesAltUnit || 'Pcs'}: ₹{altPrice.toFixed(2)}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <form onSubmit={handleBarcodeSubmit} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Barcode :</span>
              <input
                ref={barcodeInputRef}
                type="text"
                className="rd-pos-input"
                style={{ width: '130px', background: '#fef08a', fontWeight: 'bold' }}
                placeholder="Scan / Barcode..."
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
              />
            </form>

            <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Qty :</span>
            <input
              type="number"
              step="any"
              min="0.001"
              className="rd-pos-input"
              style={{ width: '60px', background: '#fef08a', textAlign: 'center', fontWeight: 'bold' }}
              value={entryQty}
              onChange={e => setEntryQty(parseFloat(e.target.value) || 1)}
            />

            <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Disc % :</span>
            <input
              type="number"
              min="0"
              max="100"
              className="rd-pos-input"
              style={{ width: '50px', background: '#fef08a', textAlign: 'center', fontWeight: 'bold' }}
              value={entryDiscPercent}
              onChange={e => setEntryDiscPercent(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />

            {/* Video 20 Feature 6: Item Adjustable Amount Option (Frame 034) */}
            <button
              type="button"
              className="rd-grid-btn"
              style={{
                background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '11px',
                padding: '3px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginLeft: 'auto'
              }}
              onClick={() => {
                const matched = products.find(p => p.barcode === barcodeInput || p.name.toLowerCase().includes(searchQuery.toLowerCase())) || products[0];
                const itemRate = priceMode === 'WHOLESALE' && matched?.wholesalePrice ? matched.wholesalePrice : (matched?.retailPrice || 3400);
                setAdjustableItemInfo({ name: matched?.name || 'Elachi', rate: itemRate });
                setIsAdjustableModalOpen(true);
              }}
              title="Reverse Price-to-Weight Calculator [Video 20 Frame 034]"
            >
              <span>🧮</span>
              <span>Adjustable Amt</span>
            </button>
          </div>

          {/* Video 20: ACTION BUTTONS STRIP (ROW 3 - 1:1 FRAME 034 & 321) */}
          <div className="rd-pos-strip" style={{
            background: '#e2e8f0',
            borderBottom: '1px solid #cbd5e1',
            padding: '3px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {showBtnSalesman && (
              <button
                type="button"
                className="rd-grid-btn"
                style={{ background: '#1e293b', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                onClick={() => showToast(`Salesman: ${selectedSalesman}`)}
              >
                👨‍💼 Salesman
              </button>
            )}

            {showBtnHold && (
              <button
                type="button"
                className="rd-grid-btn"
                style={{ background: '#4338ca', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                onClick={() => {
                  if (cart.length === 0) {
                    showToast('⚠️ No items in cart to hold');
                    return;
                  }
                  const nextHoldNum = activeHeldCarts.length + 1;
                  const holdNo = `H-${String(nextHoldNum).padStart(4, '0')}`;
                  const newHold: HeldCart = {
                    id: `hold-${Date.now()}`,
                    holdNo,
                    holdDate: '22/02/2025',
                    taxType: taxScheme === 'GST' ? 'GST' : 'NON GST',
                    customerName: selectedCustomer.name,
                    contactNo: selectedCustomer.phone,
                    priceMode,
                    totalAmount: netPay,
                    items: [...cart]
                  };
                  updateHeldCarts([newHold, ...activeHeldCarts]);
                  setCart([]);
                  showToast(`🔒 Cart parked as ${holdNo} for ${selectedCustomer.name} [Video 20 Frame 197]`);
                }}
                title="Park current cart on hold [Video 20 Frame 197]"
              >
                🔒 Hold ({activeHeldCarts.length})
              </button>
            )}

            {showBtnUnhold && (
              <button
                type="button"
                className="rd-grid-btn"
                style={{ background: '#059669', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                onClick={() => setIsHoldRecordModalOpen(true)}
                title="Open Hold Record Dialog [Video 20 Frame 197]"
              >
                🔓 Unhold
              </button>
            )}

            {showBtnWeighingScaleOn && (
              <button
                type="button"
                className="rd-grid-btn"
                style={{ background: '#0284c7', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                onClick={() => showToast('⚖️ Weighing Scale Online (Listening COM1 9600 Baud)')}
              >
                ⚖️ Weighing Scale
              </button>
            )}

            {showBtnEstimate && (
              <button
                type="button"
                className="rd-grid-btn"
                style={{ background: '#475569', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                onClick={() => showToast('Switched to Estimate Billing mode')}
              >
                🧮 Estimate
              </button>
            )}

            {showBtnQuotation && (
              <button
                type="button"
                className="rd-grid-btn"
                style={{ background: '#ea580c', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                onClick={() => showToast('Switched to Quotation mode')}
              >
                📄 Quotation
              </button>
            )}

            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: '#d97706', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
              onClick={() => showToast('Checking Online Orders (Swiggy/Zomato/WhatsApp)...')}
            >
              📦 Online Order
            </button>

            {/* Live Net Pay Display (1:1 Frame 034) */}
            <div style={{ marginLeft: 'auto', fontSize: '16px', fontWeight: '900', color: '#15803d' }}>
              Net Pay : ₹{netPay.toFixed(2)}
            </div>
          </div>

          {/* MAIN POS ITEMS GRID (FRAME 035) */}
          <div className="rd-pos-grid-container" style={{ flex: 1, overflow: 'auto' }}>
            <table className="rd-table">
              <thead>
                <tr>
                  <th style={{ width: '35px' }}>#</th>
                  <th style={{ width: '80px' }}>HSN Code</th>
                  <th>Product Name</th>
                  <th style={{ width: '60px' }}>Size</th>
                  <th style={{ width: '70px' }}>Colour</th>
                  <th style={{ width: '60px' }}>Qty</th>
                  <th style={{ width: '65px' }}>Unit</th>
                  <th style={{ width: '80px' }}>Rate</th>
                  <th style={{ width: '60px' }}>Disc %</th>
                  <th style={{ width: '75px' }}>Taxable</th>
                  {taxScheme === 'GST' && (
                    <>
                      <th style={{ width: '65px' }}>CGST</th>
                      <th style={{ width: '65px' }}>SGST</th>
                    </>
                  )}
                  <th style={{ width: '90px' }}>Total</th>
                  <th style={{ width: '40px' }}>Del</th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={taxScheme === 'GST' ? 14 : 12} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>🛒</div>
                      <div style={{ fontWeight: 'bold', fontSize: '13px' }}>Point of Sale Cart is Empty</div>
                      <div style={{ fontSize: '11px', marginTop: '4px' }}>
                        Scan barcodes or type in the search bar above to begin billing.
                      </div>
                    </td>
                  </tr>
                ) : (
                  cart.map((item, idx) => (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td>{item.hsn}</td>
                      <td style={{ fontWeight: 'bold' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {item.photo && (
                            <img src={item.photo} alt={item.name} style={{ width: '22px', height: '22px', borderRadius: '2px', objectFit: 'cover' }} />
                          )}
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td>{item.size || '-'}</td>
                      <td>{item.colour || '-'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.qty}</td>
                      <td style={{ textAlign: 'center' }}>{item.unit}</td>
                      <td style={{ textAlign: 'right' }}>₹{item.rate.toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>{item.discPercent}%</td>
                      <td style={{ textAlign: 'right' }}>₹{item.taxable.toFixed(2)}</td>
                      {taxScheme === 'GST' && (
                        <>
                          <td style={{ textAlign: 'right' }}>₹{item.cgstAmt.toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>₹{item.sgstAmt.toFixed(2)}</td>
                        </>
                      )}
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>
                        ₹{item.total.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => setCart(cart.filter(c => c.id !== item.id))}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
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

          {/* BOTTOM SUMMARY & F-KEYS ACTION BAR (FRAME 035) */}
          <div className="rd-pos-footer">
            <div className="rd-pos-summary-table-wrap">
              <table className="rd-pos-summary-table">
                <thead>
                  <tr>
                    <th>ITEMS</th>
                    <th>QTY</th>
                    <th>DISCOUNT</th>
                    <th>TAX (GST)</th>
                    <th>BILL MRP</th>
                    <th>BILL NET AMT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{cart.length}</td>
                    <td>{totalQty.toFixed(2)}</td>
                    <td>₹ {totalDisc.toFixed(2)}</td>
                    <td>₹ {totalTax.toFixed(2)}</td>
                    <td>₹ {totalMrp.toFixed(2)}</td>
                    <td style={{ color: '#15803d', fontSize: '15px', fontWeight: '900' }}>
                      ₹ {netPay.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {isAdmin && (
                <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: 'bold', background: '#e0f2fe', padding: '3px 8px', borderRadius: '4px' }}>
                  📊 Gross Profit: ₹{grossProfit.toFixed(2)} ({profitMarginPercent.toFixed(1)}% margin)
                </div>
              )}
            </div>

            {/* F-KEYS BUTTON BAR (1:1 FRAME 130 & 262) */}
            <div className="rd-pos-f-buttons">
              <button
                type="button"
                className="rd-f-btn new"
                onClick={() => {
                  setCart([]);
                  setEditingOldBill(null);
                  showToast('New Cart Started [F1]');
                }}
              >
                <span>📄</span>
                <span>New [F1]</span>
              </button>

              <button
                type="button"
                className="rd-f-btn"
                style={{
                  background: 'linear-gradient(180deg, #1e40af 0%, #172554 100%)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
                onClick={() => {
                  if (cart.length === 0) {
                    showToast('⚠️ Cart is empty. Add items to settle payment.');
                    return;
                  }
                  setIsSettlementModalOpen(true);
                }}
                title="Split Payment Settlement & Credit [Video 20 Frame 258]"
              >
                <span>💳</span>
                <span>Pay</span>
              </button>

              <button
                type="button"
                className="rd-f-btn quick-pay"
                onClick={triggerQuickPay}
              >
                <span>⚡✔</span>
                <span>Quick Pay [F4]</span>
              </button>

              <button
                type="button"
                className="rd-f-btn update"
                onClick={() => {
                  if (editingOldBill) {
                    const updated: OldBillRecord = {
                      ...editingOldBill,
                      items: [...cart],
                      totalQty,
                      netPay
                    };
                    if (onUpdateOldBill) onUpdateOldBill(editingOldBill.id, updated);
                    showToast(`✓ Invoice ${editingOldBill.invoiceNo} successfully updated! [Video 20 Frame 128]`);
                  } else {
                    showToast('Invoice updated in active memory [F3]');
                  }
                }}
                title="Update current loaded invoice [Video 20 Frame 128]"
              >
                <span>🔄</span>
                <span>Update [F3]</span>
              </button>

              <button
                type="button"
                className="rd-f-btn"
                style={{
                  background: 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
                onClick={() => {
                  if (!editingOldBill) {
                    if (cart.length > 0) {
                      if (confirm('Clear current active cart?')) {
                        setCart([]);
                        showToast('Cart cleared');
                      }
                    }
                    return;
                  }
                  if (confirm(`Are you sure you want to permanently delete Invoice ${editingOldBill.invoiceNo}? [Video 20 Frame 130]`)) {
                    if (onDeleteOldBill) onDeleteOldBill(editingOldBill.id);
                    setCart([]);
                    setEditingOldBill(null);
                    showToast(`🗑️ Invoice deleted successfully!`);
                  }
                }}
                title="Delete current invoice [Video 20 Frame 130]"
              >
                <span>🗑️</span>
                <span>Delete</span>
              </button>

              <button
                type="button"
                className="rd-f-btn old-bill"
                onClick={() => setIsOldBillModalOpen(true)}
                title="Search and Load Old Bills [Video 20 Frame 126]"
              >
                <span>📁</span>
                <span>Old Bill [F5]</span>
              </button>

              <button
                type="button"
                className="rd-f-btn print"
                onClick={() => { if (cart.length > 0) triggerQuickPay(); }}
              >
                <span>🖨️</span>
                <span>Print [F6]</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ============================================================== */}
      {/* TAB 2: D-SALE DIRECT NON-INVENTORY BILLING (FRAME 070, 075)     */}
      {/* ============================================================== */}
      {posActiveTab === 'D_SALE' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '10px', background: '#f8fafc' }}>
          {/* Top Quick Item Entry Bar (Frame 070, 075 exact recreation) */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            padding: '12px',
            marginBottom: '10px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', color: '#1e40af', fontSize: '13px' }}>
                Product : {currentDSaleInvoiceNo}
              </span>

              {/* Product Name Input */}
              <input
                ref={dSaleProductNameRef}
                type="text"
                placeholder="Product Name (e.g. SAREE, SHIRT, CHURIDAR)"
                value={dSaleProductName}
                onChange={e => setDSaleProductName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    dSaleRateRef.current?.focus();
                  }
                }}
                style={{
                  width: '240px',
                  padding: '4px 8px',
                  border: '1px solid #94a3b8',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}
              />

              {/* Qty Input */}
              <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#1e40af' }}>QTY : *</span>
              <input
                type="number"
                min="1"
                value={dSaleQty}
                onChange={e => setDSaleQty(parseInt(e.target.value) || 1)}
                style={{ width: '65px', padding: '4px', background: '#fef08a', textAlign: 'center', fontWeight: 'bold' }}
              />

              {/* Unit Dropdown */}
              <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#1e40af' }}>Unit :</span>
              <select
                value={dSaleUnit}
                onChange={e => setDSaleUnit(e.target.value)}
                style={{ width: '70px', padding: '4px', background: '#fef08a', fontWeight: 'bold' }}
              >
                <option value="PCS">PCS</option>
                <option value="BOX">BOX</option>
                <option value="KGS">KGS</option>
                <option value="MTR">MTR</option>
                <option value="NOS">NOS</option>
              </select>

              {/* Rate Input */}
              <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#1e40af' }}>Rate :</span>
              <input
                ref={dSaleRateRef}
                type="number"
                min="0"
                step="any"
                value={dSaleRate || ''}
                onChange={e => setDSaleRate(parseFloat(e.target.value) || 0)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleAddDSaleItem();
                  }
                }}
                placeholder="Rate ₹"
                style={{ width: '80px', padding: '4px', background: '#fef08a', textAlign: 'right', fontWeight: 'bold' }}
              />

              {/* Action Icons (Refresh, Delete, Add) */}
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setDSaleProductName('');
                    setDSaleQty(1);
                    setDSaleRate(0);
                  }}
                  title="Clear Entry"
                  style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
                >
                  🔄
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (dSaleItems.length > 0) {
                      setDSaleItems(dSaleItems.slice(0, -1));
                    }
                  }}
                  title="Remove Last Item"
                  style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#dc2626' }}
                >
                  ⊖
                </button>
                <button
                  type="button"
                  onClick={handleAddDSaleItem}
                  title="Add Item to D-Sale"
                  style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#16a34a' }}
                >
                  ⊕
                </button>
              </div>
            </div>

            {/* Row 2: Discount & Total */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#475569' }}>
              <span>Disc Type :</span>
              <select
                value={dSaleDiscType}
                onChange={e => setDSaleDiscType(e.target.value)}
                style={{ width: '50px', padding: '2px' }}
              >
                <option value="%">%</option>
                <option value="₹">₹</option>
              </select>

              <span>Disc% PU :</span>
              <input
                type="number"
                value={dSaleDiscPercent}
                onChange={e => setDSaleDiscPercent(parseFloat(e.target.value) || 0)}
                style={{ width: '60px', padding: '2px', background: '#fef08a', textAlign: 'center' }}
              />

              <span>Total Disc Amt :</span>
              <input
                type="text"
                readOnly
                value={((dSaleRate * dSaleQty * dSaleDiscPercent) / 100).toFixed(2)}
                style={{ width: '70px', padding: '2px', background: '#e2e8f0', textAlign: 'right' }}
              />

              <span>Total Amt :</span>
              <input
                type="text"
                readOnly
                value={((dSaleRate * dSaleQty) - (dSaleRate * dSaleQty * dSaleDiscPercent) / 100).toFixed(2)}
                style={{ width: '80px', padding: '2px', background: '#e2e8f0', textAlign: 'right', fontWeight: 'bold' }}
              />

              <button
                className="rd-grid-btn"
                style={{ background: '#1e3a8a', color: '#ffffff', fontWeight: 'bold', padding: '4px 10px' }}
                onClick={() => {
                  setDSaleItems([
                    { id: 'ds-1', code: 'INVD-0001', productName: 'SAREE', qty: 2, unit: 'PCS', rate: 800, discPercent: 0, discAmt: 0, total: 1600, totalMrp: 1600 },
                    { id: 'ds-2', code: 'INVD-0001', productName: 'SHIRT', qty: 4, unit: 'PCS', rate: 500, discPercent: 0, discAmt: 0, total: 2000, totalMrp: 2000 },
                    { id: 'ds-3', code: 'INVD-0001', productName: 'CHURIDAR', qty: 2, unit: 'PCS', rate: 300, discPercent: 0, discAmt: 0, total: 600, totalMrp: 600 }
                  ]);
                  showToast('Loaded D-Sale video demo items');
                }}
              >
                Get Data
              </button>

              <button
                className="rd-grid-btn"
                style={{ background: '#0f172a', color: '#ffffff', fontWeight: 'bold', padding: '4px 10px' }}
                onClick={handleDSaleQuickPay}
              >
                Print
              </button>
            </div>
          </div>

          {/* D-Sale Items Table (Frame 075 exact green header table) */}
          <div style={{ flex: 1, overflowY: 'auto', background: '#ffffff', border: '1px solid #cbd5e1' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#d9f99d', borderBottom: '2px solid #a3e635' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Product Name</th>
                  <th style={{ textAlign: 'center', padding: '8px', width: '70px' }}>Qty</th>
                  <th style={{ textAlign: 'center', padding: '8px', width: '80px' }}>Main Unit</th>
                  <th style={{ textAlign: 'right', padding: '8px', width: '90px' }}>Rate</th>
                  <th style={{ textAlign: 'center', padding: '8px', width: '70px' }}>Disc %</th>
                  <th style={{ textAlign: 'right', padding: '8px', width: '80px' }}>Disc Amt</th>
                  <th style={{ textAlign: 'right', padding: '8px', width: '100px' }}>Total</th>
                  <th style={{ textAlign: 'right', padding: '8px', width: '110px' }}>Total MRP</th>
                </tr>
              </thead>
              <tbody>
                {dSaleItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      <div style={{ fontSize: '24px' }}>⚡</div>
                      <div style={{ fontWeight: 'bold' }}>No Direct Sale Items Entered Yet</div>
                      <div style={{ fontSize: '11px' }}>Type Product Name, Qty, and Rate above and press Enter.</div>
                    </td>
                  </tr>
                ) : (
                  dSaleItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>{item.productName}</td>
                      <td style={{ textAlign: 'center', padding: '6px 8px' }}>{item.qty}</td>
                      <td style={{ textAlign: 'center', padding: '6px 8px' }}>{item.unit}</td>
                      <td style={{ textAlign: 'right', padding: '6px 8px' }}>{item.rate.toFixed(2)}</td>
                      <td style={{ textAlign: 'center', padding: '6px 8px' }}>{item.discPercent}</td>
                      <td style={{ textAlign: 'right', padding: '6px 8px' }}>{item.discAmt.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 'bold' }}>{item.total.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '6px 8px' }}>{item.totalMrp.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* D-Sale Footer Summary & Big Action Buttons (Frame 075) */}
          <div style={{
            background: '#ffffff',
            borderTop: '2px solid #cbd5e1',
            padding: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            {/* Summary Box */}
            <table className="rd-pos-summary-table" style={{ width: '450px' }}>
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
                  <td>{dSaleItems.length}</td>
                  <td>{dSaleTotalQty}</td>
                  <td>0</td>
                  <td>0.00</td>
                  <td>0.00</td>
                  <td style={{ color: '#15803d', fontWeight: '900', fontSize: '15px' }}>
                    {dSaleGrandTotal.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* D-Sale Action Buttons */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="rd-f-btn new"
                onClick={() => {
                  setDSaleItems([]);
                  showToast('New D-Sale Started [F1]');
                }}
              >
                <span>📄</span>
                <span>New</span>
              </button>

              <button
                className="rd-f-btn"
                style={{ background: 'linear-gradient(180deg, #1e3a8a 0%, #172554 100%)', color: '#fff' }}
                onClick={() => setPosActiveTab('SALE')}
              >
                <span>⬅️</span>
                <span>Back</span>
              </button>

              <button
                className="rd-f-btn quick-pay"
                onClick={handleDSaleQuickPay}
                style={{ minWidth: '130px' }}
              >
                <span>⚡✔</span>
                <span>Quick Pay [F4]</span>
              </button>

              <button
                className="rd-f-btn print"
                onClick={handleDSaleQuickPay}
              >
                <span>🖨️</span>
                <span>Print [F6]</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: BILL DESIGN MULTI-TEMPLATE ENGINE (FRAME 065, 220)       */}
      {/* ============================================================== */}
      {posActiveTab === 'BILL_DESIGN' && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: '#f1f5f9' }}>
          {/* Format Selector Radio Strip */}
          <div style={{
            position: 'absolute',
            top: '40px',
            left: '280px',
            zIndex: 10,
            display: 'flex',
            gap: '12px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="designFormat"
                checked={designFormat === 'A4'}
                onChange={() => setDesignFormat('A4')}
              />
              <span>A4</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="designFormat"
                checked={designFormat === 'A5'}
                onChange={() => setDesignFormat('A5')}
              />
              <span>A5</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="designFormat"
                checked={designFormat === '3INCH'}
                onChange={() => setDesignFormat('3INCH')}
              />
              <span>3Inch</span>
            </label>
          </div>

          {/* Left Panel: 10 Styles List (Frame 065, 220 exact purple pointer) */}
          <div style={{
            width: '180px',
            background: '#ffffff',
            borderRight: '1px solid #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto'
          }}>
            <div style={{
              background: '#d9f99d',
              padding: '6px',
              fontWeight: 'bold',
              fontSize: '11px',
              textAlign: 'center',
              borderBottom: '1px solid #a3e635'
            }}>
              Bill Style Name
            </div>

            {Array.from({ length: 10 }, (_, i) => i + 1).map(styleNum => {
              const isSelected = designStyleIndex === styleNum;
              return (
                <div
                  key={styleNum}
                  onClick={() => {
                    setDesignStyleIndex(styleNum);
                    showToast(`Selected Style ${styleNum} (${designFormat})`);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 8px',
                    fontSize: '11px',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    background: isSelected ? '#fef08a' : '#ffffff',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '18px',
                    height: '18px',
                    background: '#7e22ce',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    marginRight: '6px',
                    borderRadius: '2px'
                  }}>
                    ▶
                  </div>
                  <span>{designFormat}-Style{styleNum}</span>
                </div>
              );
            })}
          </div>

          {/* Center Canvas: Live Bill Preview with Real Company Master Name */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            background: '#64748b'
          }}>
            <div style={{ transform: 'scale(0.95)', transformOrigin: 'top center' }}>
              <BillTemplatePreview
                companyInfo={companyInfo}
                config={{
                  paperFormat: designFormat,
                  styleIndex: designStyleIndex,
                  printerName: designPrinter,
                  showDynamicQr: true
                }}
                billData={sampleBillData}
              />
            </div>
          </div>

          {/* Right Panel: Printer Controls (Frame 065 exact buttons) */}
          <div style={{
            width: '210px',
            background: '#ffffff',
            borderLeft: '1px solid #cbd5e1',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {/* Printer Dropdown */}
            <select
              value={designPrinter}
              onChange={e => setDesignPrinter(e.target.value)}
              style={{
                padding: '4px',
                fontSize: '11px',
                background: '#fef08a',
                border: '1px solid #94a3b8',
                fontWeight: 'bold'
              }}
            >
              <option value="Microsoft Print to PDF">Microsoft Print to PDF</option>
              <option value="XP-80C Thermal (copy 1)">XP-80C Thermal (copy 1)</option>
              <option value="HP LaserJet A4 Pro">HP LaserJet A4 Pro</option>
              <option value="Canon LBP2900B">Canon LBP2900B</option>
            </select>

            {/* Apply Button (Green Gradient) */}
            <button
              onClick={handleApplyBillConfig}
              style={{
                background: 'linear-gradient(180deg, #22c55e 0%, #15803d 100%)',
                color: '#ffffff',
                border: '1px solid #14532d',
                padding: '8px',
                fontWeight: 'bold',
                fontSize: '12px',
                borderRadius: '3px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              Apply
            </button>

            {/* Tool Buttons (Blue Gradient Frame 065) */}
            {[
              { label: 'Printer Setting', action: () => alert('Opening Windows Spooler & Printer Properties') },
              { label: 'Customer Dispaly', action: () => alert('Pole Display (VFD) 2-Line Output Connected on COM1') },
              { label: 'UPI Set', action: () => alert(`UPI ID active: ${companyInfo.email ? 'rakeshleela5@okhdfcbank' : 'rakeshleela5@okhdfcbank'}`) },
              { label: 'Weight Machine', action: () => alert('RS232 Serial Port Weighing Scale Listening at 9600 Baud') },
              { label: 'QR Display', action: () => alert('Dynamic UPI QR enabled on bill receipts') }
            ].map(btn => (
              <button
                key={btn.label}
                onClick={btn.action}
                style={{
                  background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  border: '1px solid #1e40af',
                  padding: '7px 0',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                }}
              >
                {btn.label}
              </button>
            ))}

            <div style={{ marginTop: 'auto', padding: '8px', background: '#f8fafc', border: '1px dashed #cbd5e1', fontSize: '10px' }}>
              <strong>Current Company Master:</strong><br />
              {companyInfo.name}<br />
              <span style={{ color: '#64748b' }}>Changes in Company Master update all 10 templates instantly.</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: DASHBOARD QUICK VIEW (1:1 FRAME 321, 331, 362)          */}
      {/* ============================================================== */}
      {posActiveTab === 'DASHBOARD' && (
        <div style={{ padding: '20px', flex: 1, background: '#e8ecef', overflowY: 'auto', display: 'flex', gap: '20px' }}>
          {/* Left Column (1:1 Frame 321) */}
          <div style={{ width: '230px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: 'linear-gradient(180deg, #1b3b6f 0%, #0a1c38 100%)', color: '#fff', padding: '8px 12px', fontWeight: 'bold', fontSize: '12px' }}
              onClick={() => setIsCustomerModalOpen(true)}
            >
              Customer Add
            </button>
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: 'linear-gradient(180deg, #1b3b6f 0%, #0a1c38 100%)', color: '#fff', padding: '8px 12px', fontWeight: 'bold', fontSize: '12px' }}
              onClick={() => showToast('Opening Customer Bulk Editor...')}
            >
              Customer Bulk Editor
            </button>
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: 'linear-gradient(180deg, #1b3b6f 0%, #0a1c38 100%)', color: '#fff', padding: '8px 12px', fontWeight: 'bold', fontSize: '12px' }}
              onClick={() => showToast('Switch to Product Add Smart to bulk edit products')}
            >
              Product Bulk Editor
            </button>
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: 'linear-gradient(180deg, #1b3b6f 0%, #0a1c38 100%)', color: '#fff', padding: '8px 12px', fontWeight: 'bold', fontSize: '12px' }}
              onClick={() => setIsReceiptEntryModalOpen(true)}
            >
              Cus Ledger (Loyalty)
            </button>
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: 'linear-gradient(180deg, #15803d 0%, #14532d 100%)', color: '#fff', padding: '10px 12px', fontWeight: 'bold', fontSize: '13px' }}
              onClick={() => showToast(`Sales Day Book: Total Revenue ₹18,450.00 Across 14 Invoices`)}
            >
              Sales Day Book
            </button>

            {/* Checkbox Group Controlling POS Buttons (1:1 Frame 321) */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #94a3b8',
              borderRadius: '3px',
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '11px',
              color: '#0f172a'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showBtnSalesman}
                  onChange={e => setShowBtnSalesman(e.target.checked)}
                />
                <span style={{ fontWeight: '600' }}>Sales Man</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showBtnHold}
                  onChange={e => setShowBtnHold(e.target.checked)}
                />
                <span style={{ fontWeight: '600' }}>Hold</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showBtnUnhold}
                  onChange={e => setShowBtnUnhold(e.target.checked)}
                />
                <span style={{ fontWeight: '600' }}>Unhold</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showBtnWeighingScaleOn}
                  onChange={e => setShowBtnWeighingScaleOn(e.target.checked)}
                />
                <span style={{ fontWeight: '600' }}>WieightingScale_On</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showBtnWeighingScaleOff}
                  onChange={e => setShowBtnWeighingScaleOff(e.target.checked)}
                />
                <span style={{ fontWeight: '600' }}>WieightingScale_OFF</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showBtnEstimate}
                  onChange={e => setShowBtnEstimate(e.target.checked)}
                />
                <span style={{ fontWeight: '600' }}>Estimate</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showBtnQuotation}
                  onChange={e => setShowBtnQuotation(e.target.checked)}
                />
                <span style={{ fontWeight: '600' }}>Quotation</span>
              </label>
            </div>
          </div>

          {/* Right Column (1:1 Frame 321) */}
          <div style={{ width: '230px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: 'linear-gradient(180deg, #15803d 0%, #14532d 100%)', color: '#fff', padding: '10px 12px', fontWeight: 'bold', fontSize: '13px' }}
              onClick={() => setIsReceiptEntryModalOpen(true)}
              title="Open Receipt Entry Voucher [Video 20 Frame 331]"
            >
              Customer Pay
            </button>
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)', color: '#fff', padding: '10px 12px', fontWeight: 'bold', fontSize: '13px' }}
              onClick={() => showToast('Opening Sales Return Dialog...')}
            >
              Sale Return
            </button>
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)', color: '#fff', padding: '8px 12px', fontWeight: 'bold', fontSize: '12px' }}
              onClick={() => setIsReceiptEntryModalOpen(true)}
              title="Open Customer Ledger Statement [Video 20 Frame 321]"
            >
              Customer Ledger
            </button>
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)', color: '#fff', padding: '8px 12px', fontWeight: 'bold', fontSize: '12px' }}
              onClick={() => showToast('Sales-Man Commission Ledger')}
            >
              Sales-Man Ledger
            </button>
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)', color: '#fff', padding: '8px 12px', fontWeight: 'bold', fontSize: '12px' }}
              onClick={() => setIsOutstandingReportModalOpen(true)}
              title="Open Outstanding Balance Report [Video 20 Frame 362]"
            >
              Customer OS
            </button>
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)', color: '#fff', padding: '8px 12px', fontWeight: 'bold', fontSize: '12px' }}
              onClick={() => setIsReceiptEntryModalOpen(true)}
            >
              Customer's Statement
            </button>
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)', color: '#fff', padding: '8px 12px', fontWeight: 'bold', fontSize: '12px' }}
              onClick={() => showToast('Top Performing vs Slow Moving Items Report')}
            >
              Best And Low Selling
            </button>
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 100%)', color: '#fff', padding: '8px 12px', fontWeight: 'bold', fontSize: '12px' }}
              onClick={() => showToast('Displaying Low Stock Critical Thresholds')}
            >
              Low Stock Items
            </button>
          </div>

          {/* Quick Metrics Cards */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 'bold' }}>CUSTOMER RECEIVABLES / PAYABLES</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#b91c1c', marginTop: '4px' }}>
                ₹ 4,608.00 Dr (Pooja_55555555)
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Click "Customer Pay" to record receipts or "Customer OS" for age analysis.</div>
            </div>
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 'bold' }}>PARKED / HELD BILLS COUNT</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#4338ca', marginTop: '4px' }}>
                {activeHeldCarts.length} Held Carts
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>H-0001 (Sumesh), H-0003 (Madhu), H-0004 (Ashook), H-0005 (Cash)</div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: PAY TAB COMPLETE SETTLEMENT PANEL (1:1 FRAME 262)       */}
      {/* ============================================================== */}
      {posActiveTab === 'PAY' && (
        <div style={{ padding: '16px', flex: 1, background: '#f1f5f9', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '16px' }}>
            {/* Left Top: Loyalty Card & Cash Tender (Frame 262) */}
            <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px', display: 'flex', gap: '16px' }}>
                {/* Loyalty Card Discount */}
                <div style={{ flex: 1, borderRight: '1px solid #e2e8f0', paddingRight: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e40af', marginBottom: '6px' }}>Loyalty Card Discount</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Card No. :</span>
                      <span className="font-mono font-bold">C-0001</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Loyalty Points :</span>
                      <input type="text" readOnly value="0" style={{ width: '80px', background: '#ffffcc', textAlign: 'right', border: '1px solid #cbd5e1', padding: '1px 4px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Amount (Rs.) :</span>
                      <input type="text" readOnly value="0.00" style={{ width: '80px', background: '#ffffcc', textAlign: 'right', border: '1px solid #cbd5e1', padding: '1px 4px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input type="checkbox" />
                        <span>L P Redeem</span>
                      </label>
                      <input type="text" readOnly value="0.00" style={{ width: '80px', background: '#ffffcc', textAlign: 'right', border: '1px solid #cbd5e1', padding: '1px 4px' }} />
                    </div>
                  </div>
                </div>

                {/* By Cash / ByReturn */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e40af', marginBottom: '6px' }}>By Cash / ByReturn</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Bill Discount :</span>
                      <input type="text" readOnly value="0.00" style={{ width: '60px', background: '#ffffcc', textAlign: 'right', border: '1px solid #cbd5e1', padding: '1px 4px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 'bold' }}>Paid By Cash :</span>
                      <input type="number" defaultValue={netPay} style={{ width: '80px', background: '#ffffcc', textAlign: 'right', fontWeight: 'bold', border: '1px solid #cbd5e1', padding: '1px 4px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Cash Change :</span>
                      <span style={{ fontWeight: 'bold', color: '#16a34a' }}>₹0.00</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settlement Button & Quick Launch */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e40af' }}>Split Payment & Credit Terms Settlement</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Support multi-split cash, cheque, bank transfer, and 7-180 days credit terms.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettlementModalOpen(true)}
                  style={{
                    background: 'linear-gradient(180deg, #15803d 0%, #14532d 100%)',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    padding: '8px 18px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    cursor: 'pointer'
                  }}
                >
                  Open Settlement [F12]
                </button>
              </div>
            </div>

            {/* Right Side: Big Mode Buttons & Keypad (Frame 262) */}
            <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ textAlign: 'right', fontSize: '24px', fontWeight: '900', color: '#15803d', background: '#ffffff', padding: '8px 16px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                Net Pay : ₹{netPay.toFixed(2)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {['CASH', 'CREDIT CARD', 'DEBIT CARD', 'WALLET', 'UPI / QR', 'CREDIT CUS'].map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      if (mode === 'CREDIT CUS') {
                        setIsSettlementModalOpen(true);
                      } else {
                        triggerQuickPay();
                      }
                    }}
                    style={{
                      background: mode === 'CREDIT CUS' ? 'linear-gradient(180deg, #b91c1c 0%, #7f1d1d 100%)' : 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      padding: '10px',
                      borderRadius: '4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                      cursor: 'pointer'
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* Big Sale F12 Button */}
              <button
                type="button"
                onClick={triggerQuickPay}
                style={{
                  background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                  color: '#ffffff',
                  fontWeight: '900',
                  fontSize: '16px',
                  padding: '14px',
                  borderRadius: '4px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                SALE - F12
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: CUSTOMER ENTRY (FRAME 035)                             */}
      {/* ============================================================== */}
      <CustomerEntryModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSaveCustomer={savedCust => {
          setSelectedCustomer(savedCust);
          setCustomerPhone(savedCust.phone);
          setCustomerState(savedCust.state);
          if (onAddCustomer) onAddCustomer(savedCust);
          showToast(`Customer "${savedCust.name}" attached to POS`);
        }}
        initialCustomer={selectedCustomer}
        existingCustomers={customers}
      />

      {/* ============================================================== */}
      {/* MODAL 2: DYNAMIC BILL PRINT PREVIEW (SUPPORTS 10 STYLES)       */}
      {/* ============================================================== */}
      {showPrintModal && lastCompletedBill && (
        <div className="rd-modal-overlay" style={{ zIndex: 1200 }}>
          <div className="rd-dialog" style={{ width: billConfig.paperFormat === '3INCH' ? '420px' : '820px', maxHeight: '92vh' }}>
            <div className="rd-dialog-titlebar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                Print Preview ({billConfig.paperFormat} - Style {billConfig.styleIndex}) - {lastCompletedBill.invoiceNo}
              </span>
              <button
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' }}
                onClick={() => setShowPrintModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="rd-dialog-body" style={{ background: '#64748b', padding: '16px', overflowY: 'auto' }}>
              <BillTemplatePreview
                companyInfo={companyInfo}
                config={billConfig}
                billData={lastCompletedBill}
                isPrintMode={true}
              />

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', background: '#ffffff', padding: '8px', borderRadius: '4px' }}>
                <button
                  className="rd-grid-btn"
                  onClick={() => setShowPrintModal(false)}
                >
                  Close
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="rd-grid-btn"
                    style={{ background: '#2563eb', color: '#ffffff', fontWeight: 'bold' }}
                    onClick={() => {
                      const nextStyle = (billConfig.styleIndex % 10) + 1;
                      onUpdateBillConfig({ ...billConfig, styleIndex: nextStyle });
                      showToast(`Switched preview to Style ${nextStyle}`);
                    }}
                  >
                    Cycle Style ({billConfig.styleIndex}/10)
                  </button>
                  <button
                    className="rd-grid-btn"
                    style={{ background: '#16a34a', color: '#ffffff', fontWeight: 'bold' }}
                    onClick={() => {
                      window.print();
                      setShowPrintModal(false);
                    }}
                  >
                    🖨️ Send to Printer ({billConfig.printerName})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: ADJUSTABLE AMOUNT REVERSE CALCULATOR (FRAME 034)      */}
      {/* ============================================================== */}
      <AdjustableAmountModal
        isOpen={isAdjustableModalOpen}
        productName={adjustableItemInfo.name}
        rate={adjustableItemInfo.rate}
        onApply={(calculatedQty, targetAmount) => {
          const matched = products.find(p => p.name.toLowerCase() === adjustableItemInfo.name.toLowerCase()) || products[0];
          if (matched) {
            addItemToCart(matched, calculatedQty);
            showToast(`✓ Added ${calculatedQty} Kg/Pcs ${adjustableItemInfo.name} for ₹${targetAmount} [Frame 034]`);
          }
          setIsAdjustableModalOpen(false);
        }}
        onClose={() => setIsAdjustableModalOpen(false)}
      />

      {/* ============================================================== */}
      {/* MODAL 4: MULTI-CUSTOMER HOLD & UNHOLD SYSTEM (FRAME 197)       */}
      {/* ============================================================== */}
      <HoldRecordModal
        isOpen={isHoldRecordModalOpen}
        heldCarts={activeHeldCarts}
        onRecallCart={(heldCart) => {
          setCart(heldCart.items);
          const matchedCust = customers.find(c => c.name.toLowerCase() === heldCart.customerName.toLowerCase() || c.phone === heldCart.contactNo);
          if (matchedCust) {
            setSelectedCustomer(matchedCust);
            setCustomerPhone(matchedCust.phone);
            setCustomerState(matchedCust.state);
          } else {
            setSelectedCustomer({
              id: 'cust-held-' + Date.now(),
              name: heldCart.customerName,
              phone: heldCart.contactNo,
              state: customerState,
              balance: 0,
              loyaltyPoints: 0
            });
            setCustomerPhone(heldCart.contactNo);
          }
          updateHeldCarts(activeHeldCarts.filter(c => c.id !== heldCart.id));
          setIsHoldRecordModalOpen(false);
          showToast(`✓ Recalled Cart ${heldCart.holdNo} (${heldCart.customerName}) [Frame 197]`);
        }}
        onDeleteCart={(cartId) => {
          updateHeldCarts(activeHeldCarts.filter(c => c.id !== cartId));
          showToast('Hold record deleted');
        }}
        onDeleteAllCarts={() => {
          updateHeldCarts([]);
          showToast('All hold records reset');
        }}
        onClose={() => setIsHoldRecordModalOpen(false)}
      />

      {/* ============================================================== */}
      {/* MODAL 5: SPLIT PAYMENT SETTLEMENT & CREDIT TERMS (FRAME 258/262) */}
      {/* ============================================================== */}
      <SettlementModal
        isOpen={isSettlementModalOpen}
        netPay={netPay}
        customerName={selectedCustomer.name}
        bankAccounts={bankAccounts}
        onCompleteSettlement={(splitLines, totalSettled, balanceDue) => {
          const completedBill = {
            id: `bill-${Date.now()}`,
            invoiceNo: currentInvoiceNo,
            date: new Date().toLocaleDateString('en-GB'),
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
            customer: selectedCustomer,
            items: [...cart],
            totalItems: cart.length,
            totalQty,
            totalTax,
            totalDisc,
            totalMrp,
            netPay,
            paidAmount: totalSettled,
            balanceDue,
            paymentMode: splitLines.length === 1 ? splitLines[0].mode : `Split (${splitLines.map(s => s.mode).join(' + ')})`,
            paymentSplits: splitLines,
            salesman: selectedSalesman,
            taxScheme,
            status: balanceDue > 0 ? 'PARTIAL' : 'PAID'
          };

          cart.forEach(item => {
            onStockDeduct(item.barcode, item.stockDeductQty || item.qty);
          });

          onRecordSaleInvoice(completedBill);
          setLastCompletedBill(completedBill);
          setShowPrintModal(true);
          setCart([]);
          setEditingOldBill(null);
          setIsSettlementModalOpen(false);
          showToast(`✓ Bill ${currentInvoiceNo} settled successfully! Settled: ₹${totalSettled.toFixed(2)}, Due: ₹${balanceDue.toFixed(2)}`);
        }}
        onClose={() => setIsSettlementModalOpen(false)}
      />

      {/* ============================================================== */}
      {/* MODAL 6: CUSTOMER RECEIPT ENTRY VOUCHER (FRAME 331)            */}
      {/* ============================================================== */}
      <ReceiptEntryModal
        isOpen={isReceiptEntryModalOpen}
        customers={customers}
        selectedCustomerId={selectedCustomer.id}
        bankAccounts={bankAccounts}
        ledgerEntries={ledgerEntries}
        onSaveReceipt={(receipt, ledgerEntry) => {
          if (onRecordReceipt) {
            onRecordReceipt(receipt, ledgerEntry);
          }
          setIsReceiptEntryModalOpen(false);
          showToast(`✓ Cash Receipt Voucher ${receipt.transactionNo} recorded for ${receipt.customerName}! [Frame 331]`);
        }}
        onClose={() => setIsReceiptEntryModalOpen(false)}
      />

      {/* ============================================================== */}
      {/* MODAL 7: OUTSTANDING BALANCE REPORT (FRAME 362/364)            */}
      {/* ============================================================== */}
      <OutstandingBalanceReportModal
        isOpen={isOutstandingReportModalOpen}
        customers={customers}
        ledgerEntries={ledgerEntries}
        onClose={() => setIsOutstandingReportModalOpen(false)}
      />

      {/* ============================================================== */}
      {/* MODAL 8: OLD BILL MANAGER & IN-MEMORY EDIT (FRAME 126/128/130)  */}
      {/* ============================================================== */}
      <OldBillManagerModal
        isOpen={isOldBillModalOpen}
        bills={billsHistory}
        onSelectBill={(bill) => {
          setEditingOldBill(bill);
          setCart(bill.items);
          const matchedCust = customers.find(c => c.name.toLowerCase() === bill.customerName.toLowerCase() || c.phone === bill.contactNo);
          if (matchedCust) {
            setSelectedCustomer(matchedCust);
            setCustomerPhone(matchedCust.phone);
            setCustomerState(matchedCust.state);
          }
          setIsOldBillModalOpen(false);
          showToast(`📂 Loaded Invoice ${bill.invoiceNo} into active editor [Frame 126]`);
        }}
        onDeleteBill={(billId) => {
          if (onDeleteOldBill) onDeleteOldBill(billId);
          showToast(`🗑️ Bill deleted permanently [Frame 130]`);
        }}
        onClose={() => setIsOldBillModalOpen(false)}
      />
    </div>
  );
}
