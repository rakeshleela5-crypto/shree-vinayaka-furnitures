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
  CustomerLedgerEntry,
  SalesmanRecord,
  SalesmanPaymentVoucher,
  SalesmanLedgerEntry,
  StockAlertConfig,
  ProductBatch,
  PosProductInfoConfig,
  QuotationRecord,
  ProductSerial,
  EstimateRecord,
  SaleReturnVoucher,
  ComboPack,
  SmsConfig,
  EmailConfig,
  ProductQuantityDiscountRule,
  CouponRule,
  GiftVoucherRecord,
  EWayBillRecord
} from '../../types/retailDaddy';
import {
  INITIAL_QUOTATIONS,
  INITIAL_PRODUCT_SERIALS,
  INITIAL_ESTIMATES,
  INITIAL_SALE_RETURNS,
  INITIAL_COMBO_PACKS,
  INITIAL_SMS_CONFIG,
  INITIAL_EMAIL_CONFIG,
  INITIAL_COUPONS,
  INITIAL_GIFT_VOUCHERS,
  INITIAL_EWAY_BILLS
} from '../../data/retailDaddyData';
import { CustomerEntryModal } from './CustomerEntryModal';
import { BillTemplatePreview } from './BillTemplatePreview';
import { SaleReturnModal } from './SaleReturnModal';
import { AdjustableAmountModal } from './AdjustableAmountModal';
import { HoldRecordModal } from './HoldRecordModal';
import { SettlementModal } from './SettlementModal';
import { ReceiptEntryModal } from '../customers/ReceiptEntryModal';
import { OutstandingBalanceReportModal } from '../reports/OutstandingBalanceReportModal';
import { OldBillManagerModal, type OldBillRecord } from './OldBillManagerModal';
import { NegativeStockAlertModal } from './NegativeStockAlertModal';
import { MinimumStockAlertModal } from './MinimumStockAlertModal';
import { SalesmanPaymentModal } from '../master/SalesmanPaymentModal';
import { SalesmanLedgerModal } from '../reports/SalesmanLedgerModal';
import { ProductBulkEditorModal } from '../products/ProductBulkEditorModal';
import { SalePriceEditModal } from '../products/SalePriceEditModal';
import { ProductParameterModal } from './ProductParameterModal';
import { CustomerLedgerModal } from '../customers/CustomerLedgerModal';
import { QuotationView } from './QuotationView';
import { EstimateRegisterModal } from './EstimateRegisterModal';
import { PosAdvancedDrawer } from './PosAdvancedDrawer';
import { ComboPackMasterModal } from '../inventory/ComboPackMasterModal';
import { SmsSettingModal } from '../settings/SmsSettingModal';
import { EmailSettingModal } from '../settings/EmailSettingModal';
import { RubicPosModal } from './RubicPosModal';
import { ProductDiscountSettingModal } from '../inventory/ProductDiscountSettingModal';
import { CouponDiscountModal } from './CouponDiscountModal';
import { GiftVoucherModal } from './GiftVoucherModal';
import { EWayBillModal } from './EWayBillModal';
import { WeighingScaleModal } from './WeighingScaleModal';

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
  onUpdateCustomer?: (customer: Customer) => void;
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
  // Video 19 props
  salesmen?: SalesmanRecord[];
  onUpdateSalesman?: (salesman: SalesmanRecord) => void;
  salesmanLedger?: SalesmanLedgerEntry[];
  onSaveSalesmanPayment?: (voucher: SalesmanPaymentVoucher, ledgerEntry: SalesmanLedgerEntry) => void;
  stockAlertConfig?: StockAlertConfig;
  onUpdateStockAlertConfig?: (config: StockAlertConfig) => void;
  onBulkUpdateProducts?: (updated: Product[]) => void;
  // Video 16 props
  estimates?: EstimateRecord[];
  productSerials?: ProductSerial[];
  onUpdateProductSerials?: (serials: ProductSerial[]) => void;
  // Video 10 Quantity-Based Auto Discount Props
  quantityDiscountRules?: ProductQuantityDiscountRule[];
  onOpenProductDiscountSetting?: () => void;
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
  onUpdateCustomer,
  heldCarts: externalHeldCarts,
  onUpdateHeldCarts,
  prefixSuffixConfig,
  bankAccounts = [],
  ledgerEntries = [],
  onRecordReceipt,
  billsHistory = [],
  onUpdateOldBill,
  onDeleteOldBill,
  salesmen = [],
  onUpdateSalesman: _onUpdateSalesman,
  salesmanLedger = [],
  onSaveSalesmanPayment,
  stockAlertConfig,
  onUpdateStockAlertConfig: _onUpdateStockAlertConfig,
  onBulkUpdateProducts,
  estimates: externalEstimates,
  productSerials: externalProductSerials,
  onUpdateProductSerials: _onUpdateProductSerials,
  quantityDiscountRules = [],
  onOpenProductDiscountSetting
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
  // Video 14 Feature 2 & Video 12 Frame 0495: Multi-Criteria Advanced Product Search Mode
  const [productSearchMode, setProductSearchMode] = useState<
    'Product Name' | 'Part No' | 'Barcode' | 'Batch No' | 'Mfg Date' | 'Exp Date' | 'Colour' | 'Size' | 'Combo Pack'
  >('Product Name');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [entryQty, setEntryQty] = useState<number>(1);

  // Video 19 Feature 18: Dual Discount Scheme & On-the-fly Rate (Frames 440, 600)
  const [entryDiscType, setEntryDiscType] = useState<'%' | 'Amt'>('%');
  const [entryDiscValue, setEntryDiscValue] = useState<number>(0);
  const entryDiscPercent = entryDiscType === '%' ? entryDiscValue : 0;
  const [entryRateOverride, setEntryRateOverride] = useState<number | ''>('');
  const [selectedLineMargin, setSelectedLineMargin] = useState<number | null>(null);

  // Video 19 Features 15 & 16: Stock Alert Modals (Frames 090, 210)
  const [negativeAlertData, setNegativeAlertData] = useState<{ productName: string; barcode: string } | null>(null);
  const [minStockAlertData, setMinStockAlertData] = useState<{ productName: string; barcode: string } | null>(null);
  const [pendingAddAction, setPendingAddAction] = useState<{ product: Product; qty: number; forceAltUnit?: boolean } | null>(null);

  // Video 19 Features 17 & 18: Modals
  const [isSalesmanPaymentOpen, setIsSalesmanPaymentOpen] = useState(false);
  const [isSalesmanLedgerOpen, setIsSalesmanLedgerOpen] = useState(false);
  const [isBulkEditorOpen, setIsBulkEditorOpen] = useState(false);
  const [isSalePriceEditorOpen, setIsSalePriceEditorOpen] = useState(false);

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

  // Video 18 Feature 4: Product Parameter Multi-Batch Selection Modal & Config (Frames 096, 234, 254)
  const [isProductParameterModalOpen, setIsProductParameterModalOpen] = useState(false);
  const [parameterProduct, setParameterProduct] = useState<Product | null>(null);
  const [posProductInfoConfig, setPosProductInfoConfig] = useState<PosProductInfoConfig>({
    productParameterEnabled: true,
    stockLimitAlert: true,
    negativeStockAlert: false,
    itemSpeedEntry1: false,
    itemSpeedEntry2: false,
    imeiSerialNo: false,
    editProductInfo: false,
    productImageShow: false,
    upiQrCodePrint: false,
    lastInvoiceAmt: 60.0,
    narration: ''
  });

  // Video 10 Quantity-Based Auto Discount Modal State (frmProductDiscount)
  const [isInternalVolDiscountModalOpen, setIsInternalVolDiscountModalOpen] = useState(false);

  // Video 18 Feature 1: Customer Ledger Statement Modal (Frame 064)
  const [isCustomerLedgerOpen, setIsCustomerLedgerOpen] = useState(false);

  // Video 17 Feature: Quotation Module State (Frame 0160)
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [quotations, setQuotations] = useState<QuotationRecord[]>(() => {
    const saved = localStorage.getItem('rd_quotations');
    return saved ? JSON.parse(saved) : INITIAL_QUOTATIONS;
  });

  useEffect(() => {
    localStorage.setItem('rd_quotations', JSON.stringify(quotations));
  }, [quotations]);

  // Video 17 Feature: Pay Tab Tender State (Frame 0105/0115)
  const [tenderPaidByCash, setTenderPaidByCash] = useState<number>(0);
  const [tenderDiscount, setTenderDiscount] = useState<number>(0);
  const [tenderDiscountType, setTenderDiscountType] = useState<'Amount' | 'Percentage'>('Amount');
  const [returnNo, setReturnNo] = useState<string>('');
  const [returnAmount, setReturnAmount] = useState<number>(0);
  const [showInstantQrModal, setShowInstantQrModal] = useState<boolean>(false);
  const [loyaltyRedeemChecked, setLoyaltyRedeemChecked] = useState<boolean>(false);
  const [loyaltyRedeemAmt, setLoyaltyRedeemAmt] = useState<number>(0);

  // Video 13 Feature: Sale Return Voucher & Credit Note Engine (Frames 0050, 0060, 0085)
  const [isSaleReturnModalOpen, setIsSaleReturnModalOpen] = useState<boolean>(false);
  const [saleReturns, setSaleReturns] = useState<SaleReturnVoucher[]>(() => {
    const saved = localStorage.getItem('rd_sale_returns');
    return saved ? JSON.parse(saved) : INITIAL_SALE_RETURNS;
  });
  useEffect(() => {
    localStorage.setItem('rd_sale_returns', JSON.stringify(saleReturns));
  }, [saleReturns]);

  const [appliedReturnAmount, setAppliedReturnAmount] = useState<number>(0);
  const [appliedReturnNo, setAppliedReturnNo] = useState<string>('');

  // Video 18 Feature 4: Bill Summary in Pay Tab (Frames 252-254)
  const [showBillSummaryInPay, setShowBillSummaryInPay] = useState(false);
  const [billSummarySubTab, setBillSummarySubTab] = useState<'BILL_SUMMARY' | 'TAX_INFO' | 'PRODUCT_INFO' | 'CONFIG' | 'BROKER' | 'E_COM'>('PRODUCT_INFO');

  // Video 16 Feature: Backdating & Invoice Date Control (Frames 0115, 0120)
  const [invoiceDate, setInvoiceDate] = useState<string>(() => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  });

  // Video 16 Feature: Serial Number Selector & IMEI Tracking (Frames 0255, 0260, 0275)
  const [isForSerial, setIsForSerial] = useState(false);
  const [internalProductSerials] = useState<ProductSerial[]>(() => {
    const saved = localStorage.getItem('rd_product_serials');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCT_SERIALS;
  });
  const availableSerials = externalProductSerials || internalProductSerials;
  const [selectedSerialNos, setSelectedSerialNos] = useState<string[]>([]);

  // Video 16 Feature: Estimate Register Modal & Estimate-to-POS Bill Conversion (Frames 0045, 0050)
  const [isEstimateRegisterOpen, setIsEstimateRegisterOpen] = useState(false);
  const [internalEstimates] = useState<EstimateRecord[]>(() => {
    const saved = localStorage.getItem('rd_estimates');
    return saved ? JSON.parse(saved) : INITIAL_ESTIMATES;
  });
  const activeEstimates = externalEstimates || internalEstimates;

  // Video 16 Feature: Bottom Pill Toolbar & PosAdvancedDrawer (Frames 0380, 0405)
  const [isAdvancedDrawerOpen, setIsAdvancedDrawerOpen] = useState(false);

  // Video 13 & 16: Promotional Coupon Schemes
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [coupons] = useState<CouponRule[]>(() => {
    const saved = localStorage.getItem('rd_coupons');
    return saved ? JSON.parse(saved) : INITIAL_COUPONS;
  });
  const [appliedCouponDisc, setAppliedCouponDisc] = useState<number>(0);

  // Video 16: Gift Voucher Redemption
  const [isGiftVoucherModalOpen, setIsGiftVoucherModalOpen] = useState(false);
  const [giftVouchers] = useState<GiftVoucherRecord[]>(() => {
    const saved = localStorage.getItem('rd_gift_vouchers');
    return saved ? JSON.parse(saved) : INITIAL_GIFT_VOUCHERS;
  });
  const [appliedGiftVoucherDisc, setAppliedGiftVoucherDisc] = useState<number>(0);

  // Video 16 & 19: GST E-Way Bill Dispatch
  const [isEWayBillModalOpen, setIsEWayBillModalOpen] = useState(false);
  const [ewayBills, setEwayBills] = useState<EWayBillRecord[]>(() => {
    const saved = localStorage.getItem('rd_eway_bills');
    return saved ? JSON.parse(saved) : INITIAL_EWAY_BILLS;
  });

  // Video 20: Electronic Weighing Scale
  const [isWeighingScaleModalOpen, setIsWeighingScaleModalOpen] = useState(false);

  // Video 12 Features: Combo Pack Master, SMS Setting, Email Setting, Rubic POS (Frames 0100, 0108, 0446, 0510)
  const [isComboPackModalOpen, setIsComboPackModalOpen] = useState(false);
  const [comboPacks, setComboPacks] = useState<ComboPack[]>(() => {
    const saved = localStorage.getItem('rd_combo_packs');
    return saved ? JSON.parse(saved) : INITIAL_COMBO_PACKS;
  });
  useEffect(() => {
    localStorage.setItem('rd_combo_packs', JSON.stringify(comboPacks));
  }, [comboPacks]);

  const [isSmsSettingModalOpen, setIsSmsSettingModalOpen] = useState(false);
  const [smsConfig, setSmsConfig] = useState<SmsConfig>(() => {
    const saved = localStorage.getItem('rd_sms_config');
    return saved ? JSON.parse(saved) : INITIAL_SMS_CONFIG;
  });
  useEffect(() => {
    localStorage.setItem('rd_sms_config', JSON.stringify(smsConfig));
  }, [smsConfig]);

  const [isEmailSettingModalOpen, setIsEmailSettingModalOpen] = useState(false);
  const [emailConfig, setEmailConfig] = useState<EmailConfig>(() => {
    const saved = localStorage.getItem('rd_email_config');
    return saved ? JSON.parse(saved) : INITIAL_EMAIL_CONFIG;
  });
  useEffect(() => {
    localStorage.setItem('rd_email_config', JSON.stringify(emailConfig));
  }, [emailConfig]);

  const [isRubicPosModalOpen, setIsRubicPosModalOpen] = useState(false);

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

  // Bill Design Tab State (Frame 065, 220, Video 15 Frame 0198)
  const [designFormat, setDesignFormat] = useState<BillPaperFormat>(billConfig.paperFormat || 'A4');
  const [designStyleIndex, setDesignStyleIndex] = useState<number>(billConfig.styleIndex || 1);
  const [designPrinter, setDesignPrinter] = useState<string>(billConfig.printerName || 'XP-80C (copy 1)');
  const [designFormatFilter, setDesignFormatFilter] = useState<'A4' | 'A5' | '3INCH' | 'ALL'>('A4');
  const [showTerminalSuccessModal, setShowTerminalSuccessModal] = useState<boolean>(false);

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

  // Video 14 Feature 1: Automatic Intra-State (CGST + SGST) vs Inter-State (IGST) Tax Engine
  useEffect(() => {
    const isInterState = (customerState || selectedCustomer?.state || '').toLowerCase() !== (companyInfo?.state || 'Kerala').toLowerCase();
    setCart(prev => {
      let changed = false;
      const nextCart = prev.map(item => {
        const prod = products.find(p => p.id === item.productId || p.barcode === item.barcode);
        const totalTaxRate = prod
          ? (prod.igst || ((prod.cgst || 0) + (prod.sgst || 0)) || 12)
          : ((item.cgstPercent || 0) + (item.sgstPercent || 0) + (item.igstPercent || 0) || 12);

        let newCgstPercent = 0;
        let newSgstPercent = 0;
        let newIgstPercent = 0;

        if (taxScheme === 'GST') {
          if (!isInterState) {
            newCgstPercent = prod?.cgst || (totalTaxRate / 2);
            newSgstPercent = prod?.sgst || (totalTaxRate / 2);
            newIgstPercent = 0;
          } else {
            newCgstPercent = 0;
            newSgstPercent = 0;
            newIgstPercent = prod?.igst || totalTaxRate;
          }
        }

        const isInclusive = (prod?.sTax || 'Inclusive') === 'Inclusive';
        const gross = (item.rate * item.qty) - (item.discAmt || 0);
        let taxable = gross;

        if (isInclusive && taxScheme === 'GST' && totalTaxRate > 0) {
          taxable = Number((gross / (1 + totalTaxRate / 100)).toFixed(2));
        } else {
          taxable = gross;
        }

        const cgstAmt = Number(((taxable * newCgstPercent) / 100).toFixed(2));
        const sgstAmt = Number(((taxable * newSgstPercent) / 100).toFixed(2));
        const igstAmt = Number(((taxable * newIgstPercent) / 100).toFixed(2));
        const total = isInclusive ? gross : taxable + cgstAmt + sgstAmt + igstAmt;

        if (
          item.cgstPercent !== newCgstPercent ||
          item.sgstPercent !== newSgstPercent ||
          item.igstPercent !== newIgstPercent ||
          item.cgstAmt !== cgstAmt ||
          item.sgstAmt !== sgstAmt ||
          item.igstAmt !== igstAmt ||
          item.taxable !== taxable ||
          item.total !== total
        ) {
          changed = true;
          return {
            ...item,
            taxable,
            cgstPercent: newCgstPercent,
            sgstPercent: newSgstPercent,
            igstPercent: newIgstPercent,
            cgstAmt,
            sgstAmt,
            igstAmt,
            total
          };
        }
        return item;
      });
      return changed ? nextCart : prev;
    });
  }, [customerState, selectedCustomer?.state, taxScheme, companyInfo?.state, products]);

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
  // COMMIT ADD PRODUCT TO CART (VIDEO 19 EXECUTION)
  // ==========================================
  const commitAddItemToCart = useCallback((product: Product, quantity: number = 1, forceAltUnit?: boolean, serialNos?: string[]) => {
    const enteredRate = entryRateOverride !== '' && typeof entryRateOverride === 'number' && entryRateOverride > 0
      ? entryRateOverride
      : (priceMode === 'WHOLESALE' && product.wholesalePrice ? product.wholesalePrice : product.retailPrice);

    const isAlt = forceAltUnit !== undefined ? forceAltUnit : false;
    const convFactor = (isAlt && product.conv && product.conv > 1) ? product.conv : 1;
    const rate = Number((enteredRate / convFactor).toFixed(2));
    const unitName = isAlt ? (product.salesAltUnit || 'Piece') : (product.salesUnit || 'Nos');
    const stockDeductQty = isAlt ? Number((quantity / convFactor).toFixed(3)) : quantity;

    // Video 19 Frame 0440: Update Live Margin (Rate - Purchase Price)
    const margin = rate - (product.purchasePrice || 0);
    setSelectedLineMargin(margin);

    // Video 19 Frame 0310: Salesman assignment & commission %
    const assignedSalesman = salesmen.find(s => s.name.toLowerCase() === selectedSalesman.toLowerCase()) || salesmen[0];
    const salesmanName = assignedSalesman ? assignedSalesman.name : selectedSalesman;
    const commPercent = product.salesmanCommission !== undefined && product.salesmanCommission > 0
      ? product.salesmanCommission
      : (assignedSalesman?.commissionRate ?? 2.5);

    // Video 10 Quantity-Based Auto Discount Lookup (Frames 0071, 0090, 0100)
    const tierMatch = quantityDiscountRules.find(
      r => r.barcode === product.barcode && quantity >= r.minQty && quantity <= r.maxQty
    );

    // Video 19 Frame 0600: Dual Discount Calculation
    let discAmt = 0;
    let effectiveDiscPercent = 0;
    if (entryDiscType === 'Amt') {
      discAmt = entryDiscValue;
      effectiveDiscPercent = (rate * quantity) > 0 ? Number(((entryDiscValue / (rate * quantity)) * 100).toFixed(2)) : 0;
    } else {
      if (entryDiscValue > 0) {
        effectiveDiscPercent = entryDiscValue;
      } else if (tierMatch) {
        effectiveDiscPercent = tierMatch.discountPercent;
      } else if (entryDiscPercent > 0) {
        effectiveDiscPercent = entryDiscPercent;
      } else {
        effectiveDiscPercent = product.discount || 0;
      }
      discAmt = Number(((rate * quantity * effectiveDiscPercent) / 100).toFixed(2));
    }

    const existingIndex = cart.findIndex(c => c.barcode === product.barcode && Boolean(c.isAltUnit) === isAlt);
    const isInterState = (customerState || selectedCustomer.state || '').toLowerCase() !== (companyInfo?.state || 'Kerala').toLowerCase();
    const isInclusive = product.sTax === 'Inclusive';
    const totalTaxRate = product.igst || ((product.cgst || 0) + (product.sgst || 0)) || 0;
    const cgstRate = taxScheme === 'GST' && !isInterState ? (product.cgst || (totalTaxRate / 2)) : 0;
    const sgstRate = taxScheme === 'GST' && !isInterState ? (product.sgst || (totalTaxRate / 2)) : 0;
    const igstRate = taxScheme === 'GST' && isInterState ? (product.igst || totalTaxRate) : 0;

    if (existingIndex > -1) {
      const updated = [...cart];
      const newQty = updated[existingIndex].qty + quantity;
      const newStockDeduct = isAlt ? Number((newQty / convFactor).toFixed(3)) : newQty;

      // Video 10: Re-evaluate volume tier on combined quantity
      const existingTierMatch = quantityDiscountRules.find(
        r => r.barcode === product.barcode && newQty >= r.minQty && newQty <= r.maxQty
      );
      if (existingTierMatch && entryDiscType !== 'Amt') {
        effectiveDiscPercent = existingTierMatch.discountPercent;
      }

      const newDiscAmt = entryDiscType === 'Amt'
        ? entryDiscValue
        : Number(((rate * newQty * effectiveDiscPercent) / 100).toFixed(2));
      const gross = (newQty * rate) - newDiscAmt;

      let taxable = gross;
      let cgstAmt = 0;
      let sgstAmt = 0;
      let igstAmt = 0;
      let total = gross;

      if (isInclusive && taxScheme === 'GST' && totalTaxRate > 0) {
        taxable = Number((gross / (1 + totalTaxRate / 100)).toFixed(2));
        cgstAmt = Number(((taxable * cgstRate) / 100).toFixed(2));
        sgstAmt = Number(((taxable * sgstRate) / 100).toFixed(2));
        igstAmt = Number(((taxable * igstRate) / 100).toFixed(2));
        total = gross;
      } else {
        taxable = gross;
        if (taxScheme === 'GST') {
          cgstAmt = Number(((taxable * cgstRate) / 100).toFixed(2));
          sgstAmt = Number(((taxable * sgstRate) / 100).toFixed(2));
          igstAmt = Number(((taxable * igstRate) / 100).toFixed(2));
        }
        total = taxable + cgstAmt + sgstAmt + igstAmt;
      }

      const commissionAmt = Number(((total * (updated[existingIndex].commissionPercent || commPercent)) / 100).toFixed(2));

      updated[existingIndex] = {
        ...updated[existingIndex],
        qty: newQty,
        stockDeductQty: newStockDeduct,
        discAmt: newDiscAmt,
        discPercent: effectiveDiscPercent,
        taxable,
        cgstPercent: cgstRate,
        sgstPercent: sgstRate,
        igstPercent: igstRate,
        cgstAmt,
        sgstAmt,
        igstAmt,
        total,
        commissionAmt,
        points: (product.loyaltyValue ? Number(((total * product.loyaltyValue) / 100).toFixed(2)) : Math.floor(total / 100)),
        serialNos: (() => {
          const prev = updated[existingIndex].serialNos || [];
          const combined = serialNos && serialNos.length > 0 ? [...prev, ...serialNos] : prev;
          return combined.length > 0 ? combined : undefined;
        })()
      };
      setCart(updated);
      showToast(`Updated ${product.name} [${unitName}] qty: ${newQty}`);
    } else {
      const gross = (rate * quantity) - discAmt;
      let taxable = gross;
      let cgstAmt = 0;
      let sgstAmt = 0;
      let igstAmt = 0;
      let total = gross;

      if (isInclusive && taxScheme === 'GST' && totalTaxRate > 0) {
        taxable = Number((gross / (1 + totalTaxRate / 100)).toFixed(2));
        cgstAmt = Number(((taxable * cgstRate) / 100).toFixed(2));
        sgstAmt = Number(((taxable * sgstRate) / 100).toFixed(2));
        igstAmt = Number(((taxable * igstRate) / 100).toFixed(2));
        total = gross;
      } else {
        taxable = gross;
        if (taxScheme === 'GST') {
          cgstAmt = Number(((taxable * cgstRate) / 100).toFixed(2));
          sgstAmt = Number(((taxable * sgstRate) / 100).toFixed(2));
          igstAmt = Number(((taxable * igstRate) / 100).toFixed(2));
        }
        total = taxable + cgstAmt + sgstAmt + igstAmt;
      }
      const commissionAmt = Number(((total * commPercent) / 100).toFixed(2));

      const newItem: CartItem = {
        id: `item-${Date.now()}-${Math.random()}`,
        productId: product.id,
        pCode: product.pCode,
        name: product.name,
        hsn: product.hsn || '9403',
        barcode: product.barcode,
        qty: quantity,
        rate,
        mrp: isAlt ? Number(((product.mrp || rate) / convFactor).toFixed(2)) : (product.mrp || rate),
        purchasePrice: isAlt ? Number(((product.purchasePrice || 0) / convFactor).toFixed(2)) : product.purchasePrice,
        discType: entryDiscType,
        discPercent: effectiveDiscPercent,
        discAmt,
        taxable,
        cgstPercent: cgstRate,
        sgstPercent: sgstRate,
        igstPercent: igstRate,
        cgstAmt,
        sgstAmt,
        igstAmt,
        total,
        salesman: salesmanName,
        commissionPercent: commPercent,
        commissionAmt,
        stockId: product.id,
        points: (product.loyaltyValue ? Number(((total * product.loyaltyValue) / 100).toFixed(2)) : Math.floor(total / 100)),
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
        photo: product.photo,
        serialNos: serialNos && serialNos.length > 0 ? [...serialNos] : undefined
      };

      setCart(prev => [newItem, ...prev]);
      const discTag = discAmt > 0 ? ` (Disc: ₹${discAmt.toFixed(2)})` : '';
      const serialTag = serialNos && serialNos.length > 0 ? ` [SN: ${serialNos.join(', ')}]` : '';
      showToast(`Added ${product.name} [${unitName}] (₹${rate.toFixed(2)})${discTag}${serialTag}`);
    }

    setSearchQuery('');
    setBarcodeInput('');
    setEntryQty(1);
    setEntryDiscValue(0);
    setEntryRateOverride('');
    searchInputRef.current?.focus();
  }, [cart, customerState, entryDiscPercent, entryDiscType, entryDiscValue, entryRateOverride, priceMode, salesmen, selectedSalesman, taxScheme, quantityDiscountRules]);

  // Video 10: Dynamic Row Quantity Update & Instant Volume Discount Recalculation (Frames 0118, 0128, 0146)
  const handleUpdateRowQty = useCallback((itemId: string, newQty: number) => {
    if (newQty <= 0) return;
    setCart(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const matchedProd = products.find(p => p.barcode === item.barcode || p.id === item.productId);
      const tierMatch = quantityDiscountRules.find(
        r => r.barcode === item.barcode && newQty >= r.minQty && newQty <= r.maxQty
      );
      const effectiveDiscPercent = tierMatch ? tierMatch.discountPercent : item.discPercent;
      const newDiscAmt = Number(((item.rate * newQty * effectiveDiscPercent) / 100).toFixed(2));
      const gross = (newQty * item.rate) - newDiscAmt;

      const isInterState = (customerState || selectedCustomer.state || '').toLowerCase() !== (companyInfo?.state || 'Kerala').toLowerCase();
      const isInclusive = matchedProd ? matchedProd.sTax === 'Inclusive' : false;
      const totalTaxRate = matchedProd ? (matchedProd.igst || ((matchedProd.cgst || 0) + (matchedProd.sgst || 0)) || 0) : 0;
      const cgstRate = taxScheme === 'GST' && !isInterState ? (matchedProd?.cgst || (totalTaxRate / 2)) : 0;
      const sgstRate = taxScheme === 'GST' && !isInterState ? (matchedProd?.sgst || (totalTaxRate / 2)) : 0;
      const igstRate = taxScheme === 'GST' && isInterState ? (matchedProd?.igst || totalTaxRate) : 0;

      let taxable = gross;
      let cgstAmt = 0;
      let sgstAmt = 0;
      let igstAmt = 0;
      let total = gross;

      if (isInclusive && taxScheme === 'GST' && totalTaxRate > 0) {
        taxable = Number((gross / (1 + totalTaxRate / 100)).toFixed(2));
        cgstAmt = Number(((taxable * cgstRate) / 100).toFixed(2));
        sgstAmt = Number(((taxable * sgstRate) / 100).toFixed(2));
        igstAmt = Number(((taxable * igstRate) / 100).toFixed(2));
        total = gross;
      } else {
        taxable = gross;
        if (taxScheme === 'GST') {
          cgstAmt = Number(((taxable * cgstRate) / 100).toFixed(2));
          sgstAmt = Number(((taxable * sgstRate) / 100).toFixed(2));
          igstAmt = Number(((taxable * igstRate) / 100).toFixed(2));
        }
        total = taxable + cgstAmt + sgstAmt + igstAmt;
      }

      const commAmt = Number(((total * (item.commissionPercent || 0)) / 100).toFixed(2));

      if (tierMatch && tierMatch.discountPercent !== item.discPercent) {
        showToast(`⚡ Auto Volume Discount: ${tierMatch.discountPercent}% applied for ${item.name} (${newQty} pcs: Tier ${tierMatch.minQty}-${tierMatch.maxQty}) [Video 10]`);
      }

      return {
        ...item,
        qty: newQty,
        discPercent: effectiveDiscPercent,
        discAmt: newDiscAmt,
        taxable,
        cgstAmt,
        sgstAmt,
        igstAmt,
        total,
        commissionAmt: commAmt
      };
    }));
  }, [products, quantityDiscountRules, customerState, selectedCustomer, companyInfo, taxScheme]);

  // ==========================================
  // GATEKEEPER: ADD PRODUCT WITH STOCK CHECKS (VID 19 FEAT 15 & 16, VID 18 FEAT 4)
  // ==========================================
  const addItemToCart = useCallback((product: Product, quantity: number = 1, forceAltUnit?: boolean, serialNos?: string[]) => {
    // Video 12 Frame 0370: Expiry Date Alert & Restriction Engine
    if (product.expDate) {
      let exp: Date;
      if (product.expDate.includes('/')) {
        const parts = product.expDate.split('/');
        exp = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      } else {
        exp = new Date(product.expDate);
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (exp < today) {
        alert(`You are not allow to sell expired product\n\nProduct "${product.name}" expired on ${product.expDate}. [Video 12 Frame 0370]`);
        return;
      }
    }

    // Video 18 Feature 4: Product Parameter Dashboard multi-batch popup (Frames 096, 234, 254)
    if (product.batches && product.batches.length > 1 && posProductInfoConfig.productParameterEnabled) {
      setParameterProduct(product);
      setIsProductParameterModalOpen(true);
      return;
    }

    let targetProduct = product;
    if (product.batches && product.batches.length > 0 && !posProductInfoConfig.productParameterEnabled) {
      const latestBatch = product.batches[0];
      targetProduct = {
        ...product,
        retailPrice: latestBatch.retailSaleRate,
        wholesalePrice: latestBatch.wholesaleSaleRate,
        mrp: latestBatch.mrp,
        purchasePrice: latestBatch.purchaseRate,
        barcode: latestBatch.barcode
      };
    }

    const isAlt = forceAltUnit !== undefined ? forceAltUnit : false;
    const convFactor = (isAlt && targetProduct.conv && targetProduct.conv > 1) ? targetProduct.conv : 1;
    const addStockDeduct = isAlt ? Number((quantity / convFactor).toFixed(3)) : quantity;
    const existing = cart.find(c => c.barcode === targetProduct.barcode && Boolean(c.isAltUnit) === isAlt);
    const totalRequestedStock = (existing ? existing.stockDeductQty || existing.qty : 0) + addStockDeduct;

    // Feature 15: Negative Stock Check (Frame 090)
    const alertNeg = stockAlertConfig?.negativeStockAlert ?? true;
    if (alertNeg && targetProduct.openingStock !== undefined && totalRequestedStock > targetProduct.openingStock) {
      setNegativeAlertData({ productName: targetProduct.name, barcode: targetProduct.barcode });
      setPendingAddAction({ product: targetProduct, qty: quantity, forceAltUnit });
      return;
    }

    // Feature 16: Minimum Stock Limit Check (Frame 210)
    const alertMin = stockAlertConfig?.minimumStockAlert ?? true;
    if (alertMin && targetProduct.minStock !== undefined && targetProduct.minStock > 0 && targetProduct.openingStock !== undefined) {
      const remStock = targetProduct.openingStock - totalRequestedStock;
      if (remStock < targetProduct.minStock) {
        setMinStockAlertData({ productName: targetProduct.name, barcode: targetProduct.barcode });
        setPendingAddAction({ product: targetProduct, qty: quantity, forceAltUnit });
        return;
      }
    }

    commitAddItemToCart(targetProduct, quantity, forceAltUnit, serialNos);
  }, [cart, commitAddItemToCart, posProductInfoConfig.productParameterEnabled, stockAlertConfig]);

  // Video 12 Feature 2: Combo Pack Bundle Engine (Frames 0446, 0460, 0495)
  const handleSelectComboPack = (cp: ComboPack) => {
    cp.items.forEach(cpItem => {
      const prod = products.find(p => p.barcode === cpItem.barcode || p.name.toLowerCase() === cpItem.productName.toLowerCase());
      if (prod) {
        commitAddItemToCart({ ...prod, retailPrice: cpItem.rate }, cpItem.qty);
      } else {
        const virtualProd: Product = {
          id: `prod-cp-${Date.now()}-${Math.random()}`,
          pCode: cpItem.barcode,
          name: cpItem.productName,
          barcode: cpItem.barcode,
          retailPrice: cpItem.rate,
          wholesalePrice: cpItem.rate,
          mrp: cpItem.rate,
          purchasePrice: cpItem.rate * 0.7,
          openingStock: 100,
          salesUnit: cpItem.unit || 'PCS',
          category: 'Combo Pack Items',
          hsn: '4901',
          cgst: 0,
          sgst: 0,
          igst: 0,
          cessPercent: 0
        };
        commitAddItemToCart(virtualProd, cpItem.qty);
      }
    });
    setSearchQuery('');
    setBarcodeInput('');
    showToast(`📦 Added Combo Pack "${cp.bundleName || cp.name}" (${cp.items.length} items) to Cart [Video 12 Frame 0495]`);
  };

  const handleSelectBatch = (batch: ProductBatch) => {
    if (!parameterProduct) return;
    setIsProductParameterModalOpen(false);

    const updatedProduct: Product = {
      ...parameterProduct,
      retailPrice: batch.retailSaleRate,
      wholesalePrice: batch.wholesaleSaleRate,
      mrp: batch.mrp,
      purchasePrice: batch.purchaseRate,
      barcode: batch.barcode
    };
    commitAddItemToCart(updatedProduct, entryQty);
    setParameterProduct(null);
  };

  // Handlers for Video 19 Stock Alert Modals
  const handleConfirmNegativeStock = () => {
    if (!pendingAddAction) {
      setNegativeAlertData(null);
      return;
    }
    const { product, qty, forceAltUnit } = pendingAddAction;
    setNegativeAlertData(null);

    // After negative stock confirmed, also check if minimum stock alert triggered
    const alertMin = stockAlertConfig?.minimumStockAlert ?? true;
    const isAlt = forceAltUnit !== undefined ? forceAltUnit : false;
    const convFactor = (isAlt && product.conv && product.conv > 1) ? product.conv : 1;
    const addStockDeduct = isAlt ? Number((qty / convFactor).toFixed(3)) : qty;
    const existing = cart.find(c => c.barcode === product.barcode && Boolean(c.isAltUnit) === isAlt);
    const totalRequestedStock = (existing ? existing.stockDeductQty || existing.qty : 0) + addStockDeduct;

    if (alertMin && product.minStock !== undefined && product.minStock > 0 && product.openingStock !== undefined) {
      const remStock = product.openingStock - totalRequestedStock;
      if (remStock < product.minStock) {
        setMinStockAlertData({ productName: product.name, barcode: product.barcode });
        return;
      }
    }

    commitAddItemToCart(product, qty, forceAltUnit);
    setPendingAddAction(null);
  };

  const handleCancelNegativeStock = () => {
    setNegativeAlertData(null);
    setPendingAddAction(null);
    showToast('❌ Item addition cancelled (Negative Stock Alert)');
  };

  const handleConfirmMinStock = () => {
    if (pendingAddAction) {
      commitAddItemToCart(pendingAddAction.product, pendingAddAction.qty, pendingAddAction.forceAltUnit);
      setPendingAddAction(null);
    }
    setMinStockAlertData(null);
  };

  const handleCancelMinStock = () => {
    setMinStockAlertData(null);
    setPendingAddAction(null);
    showToast('❌ Item addition cancelled (Minimum Stock Limit Alert)');
  };

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
      // Video 12 Frame 0495: Check if barcode matches a Combo Pack
      const matchedCombo = comboPacks.find(cp => (cp.bundleBarcode || cp.barcode).toLowerCase() === query.toLowerCase());
      if (matchedCombo) {
        handleSelectComboPack(matchedCombo);
        return;
      }
      showToast(`❌ Barcode "${barcodeInput}" not found in database`);
    }
  };

  // Video 16 Feature: Load & Convert Estimate into active POS Bill (Frames 0045, 0050)
  const handleLoadEstimateToCart = (estimate: EstimateRecord) => {
    // 1. Set Customer
    const matchedCustomer = customers.find(c => c.name.toLowerCase() === estimate.customerName.toLowerCase() || c.phone === estimate.phone);
    if (matchedCustomer) {
      setSelectedCustomer(matchedCustomer);
      setCustomerPhone(matchedCustomer.phone);
      setCustomerState(matchedCustomer.state);
    } else {
      const newCust: Customer = {
        id: `cust-est-${Date.now()}`,
        name: estimate.customerName,
        phone: estimate.phone || '1234567890',
        state: estimate.state || 'Kerala',
        address: estimate.address || 'local',
        gstin: estimate.gstin,
        balance: 0,
        loyaltyPoints: 0
      };
      setSelectedCustomer(newCust);
      setCustomerPhone(newCust.phone);
      setCustomerState(newCust.state);
    }

    // 2. Convert Estimate items to CartItem[]
    const newCartItems: CartItem[] = estimate.items.map((it, idx) => ({
      id: `cart-est-${Date.now()}-${idx}`,
      productId: it.productId,
      pCode: it.pCode,
      name: it.name || it.productName || 'Item',
      hsn: it.hsn,
      barcode: it.barcode,
      qty: it.qty,
      rate: it.rate,
      mrp: it.mrp,
      purchasePrice: it.purchasePrice || 0,
      discPercent: it.discPercent,
      discAmt: it.discAmt,
      taxable: it.taxable,
      cgstPercent: it.cgstPercent,
      sgstPercent: it.sgstPercent,
      igstPercent: it.igstPercent,
      cgstAmt: it.cgstAmt,
      sgstAmt: it.sgstAmt,
      igstAmt: it.igstAmt,
      total: it.total,
      salesman: 'Counter 1',
      commissionPercent: 0,
      commissionAmt: 0,
      stockId: it.productId,
      points: Math.floor(it.total / 100),
      unit: it.unit
    }));

    setCart(newCartItems);
    setIsEstimateRegisterOpen(false);
    showToast(`✓ Converted Estimate ${estimate.estimateNo} into active POS Bill for ${estimate.customerName}! [Video 16 Frame 0050]`);
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
      } else if (e.key === 'F5') {
        e.preventDefault();
        setIsOldBillModalOpen(true);
      } else if (e.key === 'F6') {
        e.preventDefault();
        if (editingOldBill) {
          setLastCompletedBill(editingOldBill);
          setShowPrintModal(true);
        } else if (cart.length > 0) {
          triggerQuickPay();
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        togglePriceMode(priceMode === 'RETAIL' ? 'WHOLESALE' : 'RETAIL');
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [posActiveTab, priceMode, cart, dSaleItems, editingOldBill]);

  // Cart Calculations (Standard Sale)
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalTax = cart.reduce((sum, item) => sum + item.cgstAmt + item.sgstAmt + item.igstAmt, 0);
  const totalDisc = cart.reduce((sum, item) => sum + item.discAmt, 0);
  const totalMrp = cart.reduce((sum, item) => sum + (item.mrp * item.qty), 0);
  const grossCartTotal = cart.reduce((sum, item) => sum + item.total, 0);

  // Video 13: Accurate Net Pay with Loyalty Redemption & Sales Return adjustment (Frames 0085, 0090, 0235)
  const appliedTenderDisc = tenderDiscountType === 'Amount' ? tenderDiscount : (grossCartTotal * tenderDiscount) / 100;
  const effectiveLoyaltyDisc = loyaltyRedeemChecked ? loyaltyRedeemAmt : 0;
  const netPay = Math.max(0, grossCartTotal - appliedTenderDisc - effectiveLoyaltyDisc - appliedReturnAmount - appliedCouponDisc - appliedGiftVoucherDisc);

  // Video 13: Loyalty points earned from current bill
  const billLoyaltyPointsEarned = cart.reduce((sum, item) => sum + (item.points || 0), 0);

  // Profit Margins (Admin only)
  const totalPurchaseCost = cart.reduce((sum, item) => sum + (item.purchasePrice * item.qty), 0);
  const grossProfit = netPay - totalTax - totalPurchaseCost;
  const profitMarginPercent = netPay > 0 ? (grossProfit / netPay) * 100 : 0;

  // Video 18 Feature 3: Live Basket Profit Margin with Inclusive & Exclusive GST (Frame 0197)
  const liveBasketMargin = cart.reduce((acc, item) => {
    const cost = (item.purchasePrice || 0) * (item.stockDeductQty !== undefined ? item.stockDeductQty : item.qty);
    const itemMargin = item.taxable - cost;
    return acc + itemMargin;
  }, 0);

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

    const custBasePoints = selectedCustomer.loyaltyPoints !== undefined ? selectedCustomer.loyaltyPoints : 71.08;
    const pointsDeducted = loyaltyRedeemChecked ? Math.floor(loyaltyRedeemAmt * 10) : 0;
    const finalBalancePoints = custBasePoints - pointsDeducted + billLoyaltyPointsEarned;

    const billRecord = {
      invoiceNo: currentInvoiceNo,
      date: new Date().toLocaleDateString('en-GB'),
      customer: selectedCustomer,
      items: [...cart],
      totalItems: cart.length,
      totalQty,
      totalTax,
      totalDisc: totalDisc + appliedTenderDisc + effectiveLoyaltyDisc,
      totalMrp,
      netPay,
      taxScheme,
      status: 'PAID',
      salesReturnAdjusted: appliedReturnAmount,
      salesReturnNo: appliedReturnNo,
      loyaltyPointsEarned: billLoyaltyPointsEarned,
      loyaltyPointsUsed: pointsDeducted,
      loyaltyAmtUsed: effectiveLoyaltyDisc,
      balanceLoyaltyPoints: finalBalancePoints
    };

    onRecordSaleInvoice(billRecord);
    setLastCompletedBill(billRecord);
    setShowPrintModal(true);
    setCart([]);
    setAppliedReturnAmount(0);
    setAppliedReturnNo('');
    setLoyaltyRedeemChecked(false);
    setLoyaltyRedeemAmt(0);
    showToast(`✅ Bill ${currentInvoiceNo} generated for ₹${netPay.toFixed(2)}`);
  };

  // Video 17 Feature: Pay Tab 12-Key Touch Keypad Press Handler (Frame 0105)
  const handleTenderKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setTenderPaidByCash(0);
      return;
    }
    if (val === 'BACKSPACE') {
      const s = tenderPaidByCash.toString();
      const next = s.length > 1 ? s.slice(0, -1) : '0';
      setTenderPaidByCash(parseFloat(next) || 0);
      return;
    }
    const currentStr = tenderPaidByCash === 0 ? '' : tenderPaidByCash.toString();
    if (val === '.' && currentStr.includes('.')) return;
    const nextStr = currentStr + val;
    setTenderPaidByCash(parseFloat(nextStr) || 0);
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
    setShowTerminalSuccessModal(true);
    showToast(`✓ Applied ${designFormat} Style ${designStyleIndex} to ${designPrinter}`);
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span>Date :</span>
            <input
              type="text"
              value={invoiceDate}
              onChange={e => setInvoiceDate(e.target.value)}
              title="Edit Invoice Date for Backdated Invoices [Video 16 Frames 0115/0120]"
              style={{
                width: '85px',
                padding: '1px 4px',
                fontWeight: 'bold',
                fontSize: '11px',
                background: '#ffffff',
                border: '1px solid #65a30d',
                borderRadius: '3px',
                textAlign: 'center',
                color: '#166534'
              }}
            />
          </div>

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
            borderRadius: '4px 4px 0 0',
            fontWeight: 'bold'
          }}
        >
          Dash board
        </button>

        <button
          onClick={() => {
            setTenderPaidByCash(netPay);
            setPosActiveTab('PAY');
          }}
          style={{
            padding: '6px 18px',
            border: '1px solid #cbd5e1',
            borderBottom: posActiveTab === 'PAY' ? '2px solid #ffffff' : 'none',
            background: posActiveTab === 'PAY' ? '#ffffff' : '#f1f5f9',
            color: posActiveTab === 'PAY' ? '#15803d' : '#475569',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0',
            fontWeight: 'bold'
          }}
        >
          Pay
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
              list="pos-customer-datalist"
              className="rd-pos-input"
              style={{ width: '150px', background: '#fef08a', fontWeight: 'bold' }}
              value={selectedCustomer.name}
              onChange={e => {
                const val = e.target.value;
                const found = customers.find(c => c.name.toLowerCase() === val.toLowerCase() || c.id.toLowerCase() === val.toLowerCase());
                if (found) {
                  setSelectedCustomer(found);
                  setCustomerPhone(found.phone);
                  setCustomerState(found.state);
                  showToast(`Selected Customer: ${found.name} (Balance: Rs.${Math.abs(found.balance).toFixed(2)} ${found.balance >= 0 ? 'Dr' : 'Cr'})`);
                } else {
                  setSelectedCustomer({ ...selectedCustomer, name: val });
                }
              }}
              placeholder="Customer Name"
            />
            <datalist id="pos-customer-datalist">
              {customers.map(c => (
                <option key={c.id} value={c.name}>
                  {c.phone ? `${c.phone} | Bal: Rs.${Math.abs(c.balance).toFixed(2)} ${c.balance >= 0 ? 'Dr' : 'Cr'}` : ''}
                </option>
              ))}
            </datalist>

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
              style={{ width: '135px', background: '#ffffff', fontWeight: 'bold' }}
              value={customerState}
              onChange={e => {
                const newState = e.target.value;
                setCustomerState(newState);
                setSelectedCustomer(prev => ({ ...prev, state: newState }));
              }}
            >
              <option value="Kerala">Kerala (Code: 32)</option>
              <option value="Delhi">Delhi (Code: 07)</option>
              <option value="Karnataka">Karnataka (Code: 29)</option>
              <option value="Tamil Nadu">Tamil Nadu (Code: 33)</option>
              <option value="Maharashtra">Maharashtra (Code: 27)</option>
              <option value="Gujarat">Gujarat (Code: 24)</option>
              <option value="Uttar Pradesh">Uttar Pradesh (Code: 09)</option>
              <option value="West Bengal">West Bengal (Code: 19)</option>
              <option value="SriLanka">SriLanka (Code: 96)</option>
            </select>

            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold', color: '#0000ff' }}>
              <input type="checkbox" />
              <span>W-Barcode</span>
            </label>

            {/* Video 15 Frame 0142: Available Qty indicator beside W-Barcode right above QTY input */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '12px' }}>
              <span style={{ fontWeight: 'bold', color: '#0000cd', fontSize: '11px' }}>Available Qty :</span>
              <span style={{
                fontWeight: 'bold',
                color: '#0000cd',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}>
                {(() => {
                  const matched = products.find(p => p.barcode === barcodeInput.trim() || (searchQuery && p.name.toLowerCase().includes(searchQuery.toLowerCase())));
                  return matched ? matched.openingStock.toFixed(3) : '0.000';
                })()}
              </span>
            </div>

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

            {/* Video 18 Feature 1: Customer Live Balance & Ledger Statement (Frames 012, 047, 064) */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                className="rd-grid-btn"
                style={{
                  background: 'linear-gradient(180deg, #7c3aed 0%, #5b21b6 100%)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onClick={() => setIsCustomerLedgerOpen(true)}
                title="Customer Ledger Statement Crystal Reports [Video 18 Frame 064]"
              >
                <span>📜</span>
                <span>Statement</span>
              </button>

              <div
                style={{
                  background: selectedCustomer.balance >= 0 ? '#fee2e2' : '#dcfce7',
                  border: `1.5px solid ${selectedCustomer.balance >= 0 ? '#ef4444' : '#16a34a'}`,
                  color: selectedCustomer.balance >= 0 ? '#991b1b' : '#15803d',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  fontWeight: '900',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
                onClick={() => setIsCustomerLedgerOpen(true)}
                title="Click to view Customer Ledger Statement (Video 18 Frame 064)"
              >
                <span>Balance: Rs.{Math.abs(selectedCustomer.balance).toFixed(2)} {selectedCustomer.balance >= 0 ? 'Dr' : 'Cr'}</span>
              </div>
            </div>
          </div>

          {/* PRODUCT SEARCH & INPUT STRIP (ROW 2) */}
          {/* PRODUCT SEARCH & INPUT STRIP (ROW 2 - Video 14 Frames 0273, 0275, 0290) */}
          <div className="rd-pos-strip" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ color: '#16a34a' }}>📦</span>
              <span>Search By Product :</span>
            </span>

            {/* Video 14 Multi-Criteria Search Mode Dropdown (Frames 0273 & 0274) */}
            <select
              className="rd-pos-input"
              value={productSearchMode}
              onChange={e => setProductSearchMode(e.target.value as any)}
              style={{
                width: '105px',
                background: '#ffffff',
                border: '1px solid #2563eb',
                fontWeight: 'bold',
                fontSize: '11px',
                color: '#1e3a8a',
                padding: '2px 4px'
              }}
              title="Select Product Search Mode (Video 14 Frame 0273)"
            >
              <option value="Product Name">Product Name</option>
              <option value="Part No">Part No</option>
              <option value="Barcode">Barcode</option>
              <option value="Batch No">Batch No</option>
              <option value="Mfg Date">Mfg Date</option>
              <option value="Exp Date">Exp Date</option>
              <option value="Colour">Colour</option>
              <option value="Size">Size</option>
              <option value="Combo Pack">Combo Pack</option>
            </select>

            <div style={{ position: 'relative' }}>
              <input
                ref={searchInputRef}
                type="text"
                className="rd-pos-input"
                style={{ width: '260px', background: '#fef08a', fontWeight: 'bold' }}
                placeholder={`Search by ${productSearchMode}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '920px',
                  maxWidth: '94vw',
                  maxHeight: '340px',
                  overflowY: 'auto',
                  overflowX: 'auto',
                  background: '#ffffff',
                  border: '2px solid #2563eb',
                  boxShadow: '0 10px 25px -3px rgba(0,0,0,0.4)',
                  zIndex: 600,
                  borderRadius: '4px'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', whiteSpace: 'nowrap' }}>
                    <thead style={{ background: 'linear-gradient(180deg, #bef264 0%, #a3e635 100%)', color: '#166534', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 2 }}>
                      <tr>
                        <th style={{ padding: '5px 8px', textAlign: 'left', borderRight: '1px solid #84cc16' }}>Product Name</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #84cc16' }}>Part / Group</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #84cc16' }}>Barcode</th>
                        <th style={{ padding: '5px 6px', textAlign: 'right', borderRight: '1px solid #84cc16' }}>Retail Sale Price</th>
                        <th style={{ padding: '5px 6px', textAlign: 'right', borderRight: '1px solid #84cc16' }}>Discount</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #84cc16' }}>Qty</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #84cc16' }}>Main Unit</th>
                        <th style={{ padding: '5px 6px', textAlign: 'right', borderRight: '1px solid #84cc16' }}>Wholesale Sale</th>
                        <th style={{ padding: '5px 6px', textAlign: 'right', borderRight: '1px solid #84cc16' }}>Damage</th>
                        <th style={{ padding: '5px 6px', textAlign: 'right', borderRight: '1px solid #84cc16' }}>MRP</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #84cc16' }}>Batch</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #84cc16' }}>Exp Date</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #84cc16' }}>Size</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #84cc16' }}>Colour</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #84cc16' }}>SalesMan%</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #84cc16' }}>Loyalty Mark</th>
                        <th style={{ padding: '5px 6px', textAlign: 'center' }}>Loyalty Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productSearchMode === 'Combo Pack' ? (
                        comboPacks
                          .filter(cp => {
                            const q = searchQuery.trim().toLowerCase();
                            const bName = (cp.bundleName || cp.name).toLowerCase();
                            const bCode = (cp.bundleBarcode || cp.barcode).toLowerCase();
                            return !q || bName.includes(q) || bCode.includes(q);
                          })
                          .map((cp, cIdx) => (
                            <tr
                              key={cp.id}
                              onMouseDown={() => handleSelectComboPack(cp)}
                              style={{
                                background: cIdx % 2 === 0 ? '#ffffff' : '#f8fafc',
                                color: '#0f172a',
                                cursor: 'pointer',
                                borderBottom: '1px solid #e2e8f0'
                              }}
                            >
                              <td style={{ padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid #cbd5e1', color: '#6d28d9' }}>
                                📦 {cp.bundleName || cp.name} ({cp.items.length} items)
                              </td>
                              <td style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>Bundle</td>
                              <td style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', fontWeight: 'bold', color: '#1e40af' }}>{cp.bundleBarcode || cp.barcode}</td>
                              <td style={{ padding: '5px 6px', textAlign: 'right', borderRight: '1px solid #cbd5e1', fontWeight: 'bold', color: '#15803d' }}>
                                ₹{cp.totalAmount.toFixed(2)}
                              </td>
                              <td style={{ padding: '5px 6px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>0.00</td>
                              <td style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>1.000</td>
                              <td style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>SET</td>
                              <td style={{ padding: '5px 6px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>₹{cp.totalAmount.toFixed(2)}</td>
                              <td style={{ padding: '5px 6px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}></td>
                              <td style={{ padding: '5px 6px', textAlign: 'right', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>₹{cp.totalAmount.toFixed(2)}</td>
                              <td colSpan={7} style={{ padding: '5px 6px', fontStyle: 'italic', color: '#64748b' }}>
                                Click to drop all bundle items into cart [Video 12 Frame 0495]
                              </td>
                            </tr>
                          ))
                      ) : (
                        products
                          .filter(p => {
                            const q = searchQuery.trim().toLowerCase();
                            if (!q) return false;
                            if (productSearchMode === 'Product Name') {
                              return p.name.toLowerCase().includes(q) || (p.pCode && p.pCode.toLowerCase().includes(q));
                            }
                            if (productSearchMode === 'Part No') {
                              return (p.description || '').toLowerCase().includes(q) || (p.subCategory || '').toLowerCase().includes(q);
                            }
                            if (productSearchMode === 'Barcode') {
                              return p.barcode.toLowerCase().includes(q);
                            }
                            if (productSearchMode === 'Batch No') {
                              return (p.batch || '').toLowerCase().includes(q);
                            }
                            if (productSearchMode === 'Mfg Date') {
                              return (p.mfgDate || '').toLowerCase().includes(q);
                            }
                            if (productSearchMode === 'Exp Date') {
                              return (p.expDate || '').toLowerCase().includes(q);
                            }
                            if (productSearchMode === 'Colour') {
                              return (p.colour || '').toLowerCase().includes(q);
                            }
                            if (productSearchMode === 'Size') {
                              return (p.size || '').toLowerCase().includes(q);
                            }
                            return (
                              p.name.toLowerCase().includes(q) ||
                              p.barcode.includes(q) ||
                              (p.size && p.size.toLowerCase().includes(q)) ||
                              (p.colour && p.colour.toLowerCase().includes(q))
                            );
                          })
                          .map((p, pIdx) => {
                            const basePrice = priceMode === 'WHOLESALE' && p.wholesalePrice ? p.wholesalePrice : p.retailPrice;
                            const isRowActive = pIdx === 0;
                            return (
                              <tr
                                key={p.id}
                                onMouseDown={() => {
                                  setBarcodeInput(p.barcode);
                                  setSearchQuery(p.name);
                                  setEntryRateOverride(basePrice);
                                  setSelectedLineMargin(basePrice - (p.purchasePrice || 0));
                                  if (isForSerial || availableSerials.some(s => s.barcode === p.barcode && s.status === 'AVAILABLE')) {
                                    setIsForSerial(true);
                                    showToast(`🔍 Serial Selector opened for ${p.name} [Video 16 Frame 0260]`);
                                  } else {
                                    addItemToCart(p, entryQty, false);
                                  }
                                }}
                                style={{
                                  background: isRowActive ? '#2563eb' : (pIdx % 2 === 0 ? '#ffffff' : '#f8fafc'),
                                  color: isRowActive ? '#ffffff' : '#0f172a',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #e2e8f0'
                                }}
                              >
                                <td style={{ padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid #cbd5e1' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {p.photo && (
                                      <img src={p.photo} alt={p.name} style={{ width: '20px', height: '20px', borderRadius: '2px', objectFit: 'cover' }} />
                                    )}
                                    <span>{p.name}</span>
                                  </div>
                                </td>
                                <td style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>{p.description || p.pCode || '0'}</td>
                                <td style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>{p.barcode}</td>
                                <td style={{ padding: '5px 6px', textAlign: 'right', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>{basePrice.toFixed(2)}</td>
                                <td style={{ padding: '5px 6px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>0.00</td>
                                <td style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>{p.openingStock.toFixed(3)}</td>
                                <td style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>{p.salesUnit || 'PCS'}</td>
                                <td style={{ padding: '5px 6px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>{p.wholesalePrice ? p.wholesalePrice.toFixed(2) : '0.00'}</td>
                                <td style={{ padding: '5px 6px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}></td>
                                <td style={{ padding: '5px 6px', textAlign: 'right', borderRight: '1px solid #cbd5e1', fontWeight: 'bold' }}>{p.mrp ? p.mrp.toFixed(2) : '0.00'}</td>
                                <td style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>{p.batch || ''}</td>
                                <td style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>{p.expDate || ''}</td>
                                <td style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>{p.size || ''}</td>
                                <td style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>{p.colour || ''}</td>
                                <td style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>0.00</td>
                                <td style={{ padding: '5px 6px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>per</td>
                                <td style={{ padding: '5px 6px', textAlign: 'center' }}>0.00</td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <form onSubmit={handleBarcodeSubmit} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Barcode :</span>
              <input
                ref={barcodeInputRef}
                type="text"
                className="rd-pos-input"
                style={{ width: '105px', background: '#fef08a', fontWeight: 'bold' }}
                placeholder="Scan / Barcode..."
                value={barcodeInput}
                onChange={e => {
                  setBarcodeInput(e.target.value);
                  const matched = products.find(p => p.barcode === e.target.value.trim());
                  if (matched) {
                    const price = priceMode === 'WHOLESALE' && matched.wholesalePrice ? matched.wholesalePrice : matched.retailPrice;
                    setEntryRateOverride(price);
                    setSelectedLineMargin(price - (matched.purchasePrice || 0));
                    if (isForSerial || availableSerials.some(s => s.barcode === matched.barcode && s.status === 'AVAILABLE')) {
                      setIsForSerial(true);
                    }
                  }
                }}
              />
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', marginLeft: '3px' }}>
                <input
                  type="checkbox"
                  checked={isForSerial}
                  onChange={e => setIsForSerial(e.target.checked)}
                />
                <span>For Serial</span>
              </label>
            </form>

            {/* Video 16 Feature: Serial Selector Table Drawer (Frames 0255 & 0260) */}
            {isForSerial && (
              <div style={{
                position: 'absolute',
                top: '190px',
                right: '20px',
                width: '380px',
                background: '#ffffff',
                border: '2px solid #84cc16',
                boxShadow: '0 10px 25px -3px rgba(0,0,0,0.4)',
                zIndex: 400,
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: 'linear-gradient(180deg, #bef264 0%, #a3e635 100%)',
                  padding: '5px 8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 'bold',
                  fontSize: '11px',
                  color: '#166534',
                  borderBottom: '1px solid #84cc16'
                }}>
                  <span>⚡ Available Serial Numbers [{selectedSerialNos.length} selected]</span>
                  <button
                    type="button"
                    onClick={() => setIsForSerial(false)}
                    style={{ background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer', color: '#166534' }}
                  >
                    ✕
                  </button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead style={{ background: '#d9f99d', color: '#166534', fontWeight: 'bold' }}>
                    <tr>
                      <th style={{ width: '25px', padding: '4px' }}></th>
                      <th style={{ padding: '4px 6px', textAlign: 'left', borderRight: '1px solid #bef264' }}>Product Name</th>
                      <th style={{ padding: '4px 6px', textAlign: 'left', borderRight: '1px solid #bef264' }}>Barcode</th>
                      <th style={{ padding: '4px 6px', textAlign: 'left' }}>Serial_no</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const relevantSerials = availableSerials.filter(s =>
                        s.status === 'AVAILABLE' &&
                        (!barcodeInput || s.barcode === barcodeInput || (searchQuery && s.productName.toLowerCase().includes(searchQuery.toLowerCase())))
                      );
                      if (relevantSerials.length === 0) {
                        return (
                          <tr>
                            <td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                              No unsold serials found. Click Inward / Purchase to register serials.
                            </td>
                          </tr>
                        );
                      }
                      return relevantSerials.map(sn => {
                        const isSelected = selectedSerialNos.includes(sn.serialNo);
                        return (
                          <tr
                            key={sn.id}
                            onClick={() => {
                              if (isSelected) {
                                const next = selectedSerialNos.filter(x => x !== sn.serialNo);
                                setSelectedSerialNos(next);
                                setEntryQty(next.length || 1);
                              } else {
                                const next = [...selectedSerialNos, sn.serialNo];
                                setSelectedSerialNos(next);
                                setEntryQty(next.length);
                              }
                            }}
                            style={{
                              background: isSelected ? '#1e1b4b' : '#ffffff',
                              color: isSelected ? '#ffffff' : '#0f172a',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f1f5f9'
                            }}
                          >
                            <td style={{ textAlign: 'center', color: isSelected ? '#a855f7' : 'transparent', fontWeight: 'bold' }}>
                              ▶
                            </td>
                            <td style={{ padding: '4px 6px', fontWeight: 'bold', borderRight: '1px solid #e2e8f0' }}>{sn.productName}</td>
                            <td style={{ padding: '4px 6px', borderRight: '1px solid #e2e8f0' }}>{sn.barcode}</td>
                            <td style={{ padding: '4px 6px', fontFamily: 'monospace', fontWeight: 'bold' }}>{sn.serialNo}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
                <div style={{ padding: '6px 8px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Click rows to select serials</span>
                  <button
                    type="button"
                    onClick={() => {
                      const matched = products.find(p => p.barcode === barcodeInput || (selectedSerialNos.length > 0 && availableSerials.find(s => s.serialNo === selectedSerialNos[0])?.barcode === p.barcode));
                      if (matched && selectedSerialNos.length > 0) {
                        addItemToCart(matched, selectedSerialNos.length, false, selectedSerialNos);
                        setIsForSerial(false);
                        setSelectedSerialNos([]);
                      } else {
                        showToast('Please select at least 1 serial number');
                      }
                    }}
                    style={{
                      background: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '3px',
                      padding: '4px 10px',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    ✓ Add Selected ({selectedSerialNos.length}) to Cart
                  </button>
                </div>
              </div>
            )}

            {/* MRP Box (Frame 0440) */}
            <span style={{ fontWeight: 'bold', fontSize: '11px' }}>MRP :</span>
            <input
              type="text"
              readOnly
              className="rd-pos-input"
              style={{ width: '65px', background: '#f1f5f9', textAlign: 'right', fontWeight: 'bold', color: '#334155' }}
              value={(() => {
                const matched = products.find(p => p.barcode === barcodeInput || p.name.toLowerCase() === searchQuery.toLowerCase());
                return matched?.mrp ? `₹${matched.mrp.toFixed(2)}` : '0.00';
              })()}
            />

            {/* Video 17 Feature: Real-Time Available Qty Indicator (Frame 0035) */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: '900', color: '#000080', fontSize: '11px' }}>Available Qty</span>
              <span style={{
                fontWeight: '900',
                color: '#000080',
                fontSize: '12px',
                fontFamily: 'monospace',
                background: '#ffffff',
                border: '1.5px solid #dc2626',
                padding: '1px 5px',
                borderRadius: '2px'
              }}>
                {(() => {
                  const matched = products.find(p => p.barcode === barcodeInput.trim() || p.name.toLowerCase() === searchQuery.toLowerCase());
                  return matched ? matched.openingStock.toFixed(3) : '0.000';
                })()}
              </span>
            </div>

            <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Qty :</span>
            <input
              type="number"
              step="any"
              min="0.001"
              className="rd-pos-input"
              style={{ width: '55px', background: '#fef08a', textAlign: 'center', fontWeight: 'bold' }}
              value={entryQty}
              onChange={e => setEntryQty(parseFloat(e.target.value) || 1)}
            />

            {/* Price/Main Unit with on-the-fly edit (Frame 0440 / 0600) */}
            <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Price/Unit :</span>
            <input
              type="number"
              step="any"
              className="rd-pos-input"
              style={{ width: '75px', background: '#fef08a', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}
              placeholder={(() => {
                const matched = products.find(p => p.barcode === barcodeInput || p.name.toLowerCase() === searchQuery.toLowerCase());
                return matched ? String(matched.retailPrice) : 'Rate';
              })()}
              value={entryRateOverride}
              onChange={e => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                setEntryRateOverride(val);
                if (typeof val === 'number') {
                  const matched = products.find(p => p.barcode === barcodeInput || p.name.toLowerCase() === searchQuery.toLowerCase());
                  setSelectedLineMargin(val - (matched?.purchasePrice || 0));
                }
              }}
              title="Edit sale price on the fly [Video 19 Frame 0440 & Feature 18]"
            />

            {/* Disc Type Dropdown: [% | Amt] (Video 19 Frame 0600) */}
            <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Disc Type :</span>
            <select
              className="rd-pos-input"
              style={{ width: '55px', background: '#fef08a', fontWeight: 'bold', padding: '1px 2px' }}
              value={entryDiscType}
              onChange={e => setEntryDiscType(e.target.value as '%' | 'Amt')}
              title="Dual Discount Scheme: % or Direct Amount [Video 19 Frame 0600]"
            >
              <option value="%">%</option>
              <option value="Amt">Amt</option>
            </select>

            <input
              type="number"
              min="0"
              step="any"
              className="rd-pos-input"
              style={{ width: '55px', background: '#fef08a', textAlign: 'center', fontWeight: 'bold' }}
              value={entryDiscValue}
              onChange={e => setEntryDiscValue(parseFloat(e.target.value) || 0)}
              placeholder="0"
              title={entryDiscType === '%' ? 'Discount Percentage' : 'Discount Rupee Amount'}
            />

            {/* Total Disc Amt Readonly Preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
              <span style={{ fontWeight: 'bold', color: '#64748b' }}>Disc:</span>
              <span style={{ fontWeight: 'bold', background: '#e2e8f0', padding: '2px 5px', borderRadius: '3px', minWidth: '40px', textAlign: 'right' }}>
                ₹{(() => {
                  const matched = products.find(p => p.barcode === barcodeInput || p.name.toLowerCase() === searchQuery.toLowerCase());
                  const r = typeof entryRateOverride === 'number' && entryRateOverride > 0 ? entryRateOverride : (matched?.retailPrice || 0);
                  const gross = r * entryQty;
                  return entryDiscType === 'Amt' ? entryDiscValue.toFixed(2) : ((gross * entryDiscValue) / 100).toFixed(2);
                })()}
              </span>
            </div>

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

          {/* Video 19 & 20: ACTION BUTTONS STRIP (ROW 3 - 1:1 FRAME 034, 321, 345) */}
          <div className="rd-pos-strip" style={{
            background: '#e2e8f0',
            borderBottom: '1px solid #cbd5e1',
            padding: '3px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap'
          }}>
            {showBtnSalesman && (
              <button
                type="button"
                className="rd-grid-btn"
                style={{ background: '#1e293b', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                onClick={() => setIsSalesmanPaymentOpen(true)}
                title="Salesman Commission & Payout Voucher [Video 19 Frame 345]"
              >
                👨‍💼 Salesman
              </button>
            )}

            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: '#0e7490', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
              onClick={() => setIsBulkEditorOpen(true)}
              title="Product Bulk Editor with Salesman % & Loyalty Points [Video 19 Frame 275]"
            >
              📋 Bulk Editor
            </button>

            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: '#7c3aed', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
              onClick={() => setIsSalePriceEditorOpen(true)}
              title="Sale Price & Margin Editor [Video 19 Frame 535]"
            >
              💲 Price Edit
            </button>

            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: '#047857', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
              onClick={() => setIsSalesmanLedgerOpen(true)}
              title="Salesman Commission Ledger Report [Video 19 Frame 365]"
            >
              📜 Salesman Ledger
            </button>

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
                onClick={() => setIsWeighingScaleModalOpen(true)}
                title="Open Electronic Weighing Scale [Video 20]"
              >
                ⚖️ Weighing Scale
              </button>
            )}

            {showBtnEstimate && (
              <button
                type="button"
                className="rd-grid-btn"
                style={{ background: '#475569', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                onClick={() => setIsEstimateRegisterOpen(true)}
                title="Open Estimate Register Dialog & Load to POS [Video 16 Frames 0045 & 0050]"
              >
                🧮 Estimate
              </button>
            )}

            {showBtnQuotation && (
              <button
                type="button"
                className="rd-grid-btn"
                style={{ background: '#ea580c', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                onClick={() => setIsQuotationModalOpen(true)}
                title="Open Quotation Window [Video 17 Frame 0160]"
              >
                📄 Quotation
              </button>
            )}

            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: '#dc2626', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
              onClick={() => setIsSaleReturnModalOpen(true)}
              title="Open Sale Return (Credit Note) Window [Video 13 Frames 0050 & 0060]"
            >
              🔄 Sale Return
            </button>

            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: '#d97706', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
              onClick={() => showToast('Checking Online Orders (Swiggy/Zomato/WhatsApp)...')}
            >
              📦 Online Order
            </button>

            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: '#7c3aed', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
              onClick={() => setIsComboPackModalOpen(true)}
              title="Combo Pack Master & Bundle Engine [Video 12 Frames 0446 & 0460]"
            >
              📦 Combo Pack
            </button>

            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: '#059669', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
              onClick={() => setIsRubicPosModalOpen(true)}
              title="Rubic Touch Screen POS [Video 12 Frames 0510 & 0520]"
            >
              📱 Rubic POS
            </button>

            {/* Video 10 Quantity-Based Auto Discount Setting (Frames 0071, 0090, 0100) */}
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
              onClick={() => {
                if (onOpenProductDiscountSetting) {
                  onOpenProductDiscountSetting();
                } else {
                  setIsInternalVolDiscountModalOpen(true);
                }
              }}
              title="Configure Quantity-Based Auto Discount Rules (frmProductDiscount) [Video 10 Frames 0071, 0090, 0100]"
            >
              🏷️ Vol Discount
            </button>

            {/* Live Net Pay Display (1:1 Frame 034) */}
            <div style={{ marginLeft: 'auto', fontSize: '16px', fontWeight: '900', color: '#15803d' }}>
              Net Pay : ₹{netPay.toFixed(2)}
            </div>
          </div>

          {/* MAIN POS ITEMS GRID (FRAME 035, 0310 & 0440) */}
          <div className="rd-pos-grid-container" style={{ flex: 1, overflow: 'auto' }}>
            <table className="rd-table">
              <thead>
                <tr style={{ background: '#d9f99d', color: '#14532d' }}>
                  <th style={{ width: '30px' }}>#</th>
                  <th style={{ width: '70px' }}>HSN Code</th>
                  <th>Product Name</th>
                  <th style={{ width: '65px' }}>Barcode</th>
                  <th style={{ width: '50px' }}>Qty</th>
                  <th style={{ width: '55px' }}>Unit</th>
                  <th style={{ width: '65px' }}>Rate</th>
                  <th style={{ width: '50px' }}>Disc %</th>
                  <th style={{ width: '60px' }}>Disc Amt</th>
                  {taxScheme === 'GST' && (
                    <>
                      <th style={{ width: '55px' }}>CGST</th>
                      <th style={{ width: '55px' }}>SGST</th>
                    </>
                  )}
                  <th style={{ width: '75px' }}>Total</th>
                  {/* Video 19 Frame 0310 Columns */}
                  <th style={{ width: '90px' }}>SalesMan</th>
                  <th style={{ width: '45px' }}>%</th>
                  <th style={{ width: '65px' }}>Commision</th>
                  <th style={{ width: '60px' }}>StockId</th>
                  <th style={{ width: '45px' }}>Points</th>
                  <th style={{ width: '35px' }}>Del</th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={taxScheme === 'GST' ? 17 : 15} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>🛒</div>
                      <div style={{ fontWeight: 'bold', fontSize: '13px' }}>Point of Sale Cart is Empty</div>
                      <div style={{ fontSize: '11px', marginTop: '4px' }}>
                        Scan barcodes or type in the search bar above to begin billing.
                      </div>
                    </td>
                  </tr>
                ) : (
                  cart.map((item, idx) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedLineMargin(item.rate - (item.purchasePrice || 0))}
                      style={{ cursor: 'pointer' }}
                      title="Click row to inspect line profit margin under E-Way Bill button"
                    >
                      <td>{idx + 1}</td>
                      <td>{item.hsn}</td>
                      <td style={{ fontWeight: 'bold' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {item.photo && (
                            <img src={item.photo} alt={item.name} style={{ width: '22px', height: '22px', borderRadius: '2px', objectFit: 'cover' }} />
                          )}
                          <div>
                            <div>{item.name}</div>
                            {item.serialNos && item.serialNos.length > 0 && (
                              <div style={{ fontSize: '10px', color: '#1d4ed8', fontFamily: 'monospace', fontWeight: 'bold', marginTop: '2px' }}>
                                SN: {item.serialNos.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          <button
                            type="button"
                            onClick={() => handleUpdateRowQty(item.id, Math.max(1, item.qty - 1))}
                            style={{
                              width: '18px',
                              height: '18px',
                              padding: 0,
                              fontSize: '11px',
                              cursor: 'pointer',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#f8fafc',
                              borderRadius: '2px',
                              fontWeight: 'bold',
                              lineHeight: '1'
                            }}
                            title="Decrease Qty"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.qty}
                            onChange={e => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val > 0) {
                                handleUpdateRowQty(item.id, val);
                              }
                            }}
                            style={{
                              width: '42px',
                              height: '20px',
                              textAlign: 'center',
                              fontWeight: 'bold',
                              fontSize: '11px',
                              border: '1px solid #3b82f6',
                              backgroundColor: '#eff6ff',
                              borderRadius: '2px',
                              padding: '1px'
                            }}
                            title="Change quantity (Video 10: auto volume discount calculates instantly)"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateRowQty(item.id, item.qty + 1)}
                            style={{
                              width: '18px',
                              height: '18px',
                              padding: 0,
                              fontSize: '11px',
                              cursor: 'pointer',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#f8fafc',
                              borderRadius: '2px',
                              fontWeight: 'bold',
                              lineHeight: '1'
                            }}
                            title="Increase Qty"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>{item.unit}</td>
                      <td style={{ textAlign: 'right' }}>₹{item.rate.toFixed(2)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: item.discPercent > 0 ? '#15803d' : '#334155' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                          <span>{item.discPercent}%</span>
                          {item.discPercent > 0 && (
                            <span
                              style={{
                                fontSize: '8px',
                                backgroundColor: '#dcfce7',
                                color: '#166534',
                                padding: '1px 3px',
                                borderRadius: '2px',
                                border: '1px solid #86efac',
                                fontWeight: 'bold'
                              }}
                              title={`Auto Volume Discount Applied: ${item.discPercent}%`}
                            >
                              VOL
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: (item.discAmt || 0) > 0 ? '#b91c1c' : '#334155' }}>
                        ₹{(item.discAmt || 0).toFixed(2)}
                      </td>
                      {taxScheme === 'GST' && (
                        <>
                          <td style={{ textAlign: 'right' }}>₹{item.cgstAmt.toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>₹{item.sgstAmt.toFixed(2)}</td>
                        </>
                      )}
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>
                        ₹{item.total.toFixed(2)}
                      </td>

                      {/* Video 19 Frame 0310: SalesMan Selection */}
                      <td>
                        <select
                          className="rd-pos-input"
                          style={{ fontSize: '10px', padding: '1px 3px', width: '85px', background: '#fef9c3', fontWeight: 'bold' }}
                          value={item.salesman || selectedSalesman}
                          onChange={e => {
                            const newSalesmanName = e.target.value;
                            const matchedSm = salesmen.find(s => s.name === newSalesmanName);
                            const newCommRate = matchedSm?.commissionRate ?? item.commissionPercent;
                            const newCommAmt = Number(((item.total * newCommRate) / 100).toFixed(2));
                            setCart(cart.map(c => c.id === item.id ? { ...c, salesman: newSalesmanName, commissionPercent: newCommRate, commissionAmt: newCommAmt } : c));
                          }}
                        >
                          {salesmen.length > 0 ? (
                            salesmen.map(sm => (
                              <option key={sm.id} value={sm.name}>{sm.name}</option>
                            ))
                          ) : (
                            <>
                              <option value="sukumar">sukumar</option>
                              <option value="Madhu">Madhu</option>
                              <option value="Ashok">Ashok</option>
                              <option value="Mahesh (Counter 1)">Mahesh (Counter 1)</option>
                            </>
                          )}
                        </select>
                      </td>

                      {/* Video 19 Frame 0310: Commission % */}
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          style={{ width: '40px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', background: '#fef9c3', border: '1px solid #cbd5e1' }}
                          value={item.commissionPercent || 0}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            const newCommAmt = Number(((item.total * val) / 100).toFixed(2));
                            setCart(cart.map(c => c.id === item.id ? { ...c, commissionPercent: val, commissionAmt: newCommAmt } : c));
                          }}
                        />
                      </td>

                      {/* Video 19 Frame 0310: Commission Amount Display */}
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#b45309' }}>
                        ₹{(item.commissionAmt || 0).toFixed(2)}
                      </td>

                      {/* StockId */}
                      <td style={{ fontSize: '10px', color: '#64748b', textAlign: 'center' }}>
                        {item.stockId || item.productId}
                      </td>

                      {/* Points */}
                      <td style={{ fontSize: '10px', textAlign: 'center', fontWeight: 'bold', color: '#0369a1' }}>
                        {item.points || 0}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCart(cart.filter(c => c.id !== item.id));
                          }}
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

          {/* VIDEO 16 BOTTOM PILL TOOLBAR & POS ADVANCED DRAWER (FRAMES 0380 & 0405) */}
          <div style={{ padding: '2px 8px 0 8px', background: '#cbd5e1' }}>
            <PosAdvancedDrawer
              isOpen={isAdvancedDrawerOpen}
              onToggleOpen={() => setIsAdvancedDrawerOpen(!isAdvancedDrawerOpen)}
              config={posProductInfoConfig}
              onUpdateConfig={setPosProductInfoConfig}
              productLastSoldPrice={cart.length > 0 ? (cart[0].rate || 400.0) : 400.0}
              customerLastSoldPrice={selectedCustomer.balance > 0 ? 0.0 : 31.0}
              lastInvoiceAmt={netPay > 0 ? netPay : 758.0}
              onOpenCouponModal={() => setIsCouponModalOpen(true)}
              onOpenAddProductModal={() => {
                setIsBulkEditorOpen(true);
                showToast('➕ Opening Add Product Master [Video 16 Frame 0380]');
              }}
              onOpenGiftModal={() => setIsGiftVoucherModalOpen(true)}
            />
          </div>

          {/* BOTTOM SUMMARY & F-KEYS ACTION BAR (FRAME 035 & 0440) */}
          <div className="rd-pos-footer">
            {/* Left: E-Way Bill Button & Live Line Margin (Video 19 Frame 0440) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 10px', flexShrink: 0 }}>
              <button
                type="button"
                className="rd-grid-btn"
                style={{
                  background: 'linear-gradient(180deg, #f8fafc 0%, #cbd5e1 100%)',
                  border: '1.5px solid #64748b',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                onClick={() => setIsEWayBillModalOpen(true)}
                title="Generate E-Way Bill [Video 19 Frame 0440]"
              >
                <span style={{ fontSize: '18px' }}>🚚</span>
                <span style={{ fontWeight: '900', fontSize: '12px', color: '#0f172a' }}>E-way Bill</span>
              </button>
              <div
                style={{
                  marginTop: '4px',
                  fontSize: '15px',
                  fontWeight: '900',
                  color: '#0f172a',
                  textAlign: 'center',
                  letterSpacing: '0.5px'
                }}
                title="Live Basket Profit Margin (Taxable Base - Purchase Cost) [Video 18 Frame 0197 & Video 19 Frame 0440]"
              >
                {cart.length > 0
                  ? (liveBasketMargin % 1 === 0 ? liveBasketMargin.toFixed(0) : liveBasketMargin.toFixed(2))
                  : (selectedLineMargin !== null ? selectedLineMargin.toFixed(0) : '0')}
              </div>
            </div>

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

            {/* Video 16 Feature: PosAdvancedDrawer & Bottom Pill Toolbar (Frames 0380, 0405) */}
            <PosAdvancedDrawer
              isOpen={isAdvancedDrawerOpen}
              onToggleOpen={() => setIsAdvancedDrawerOpen(!isAdvancedDrawerOpen)}
              config={posProductInfoConfig}
              onUpdateConfig={setPosProductInfoConfig}
              productLastSoldPrice={cart.length > 0 ? cart[cart.length - 1].rate : 400.0}
              customerLastSoldPrice={selectedCustomer.balance ? 400.0 : 0.0}
              lastInvoiceAmt={758.0}
              onOpenCouponModal={() => showToast('Coupon: No active coupon code found')}
              onOpenAddProductModal={() => showToast('Product Catalog: Use Product Add Smart in top menu')}
              onOpenGiftModal={() => showToast('Gift Voucher: Apply voucher')}
            />

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
                  setTenderPaidByCash(netPay);
                  setPosActiveTab('PAY');
                }}
                title="Open Pay Touch Screen Tender [Video 17 Frame 0105]"
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
                onClick={() => {
                  if (editingOldBill) {
                    setLastCompletedBill(editingOldBill);
                    setShowPrintModal(true);
                  } else if (cart.length > 0) {
                    triggerQuickPay();
                  } else {
                    showToast('⚠️ Scan or add items to print');
                  }
                }}
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
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: '#f1f5f9', position: 'relative' }}>
          {/* Format Selector Radio Strip (Frame 0198, 0230) */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '12px',
            zIndex: 10,
            display: 'flex',
            gap: '12px',
            fontSize: '11px',
            fontWeight: 'bold',
            background: '#ffffff',
            padding: '3px 10px',
            borderRadius: '3px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="designFormatFilter"
                checked={designFormatFilter === 'A4'}
                onChange={() => {
                  setDesignFormatFilter('A4');
                  setDesignFormat('A4');
                }}
              />
              <span>A4</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="designFormatFilter"
                checked={designFormatFilter === 'A5'}
                onChange={() => {
                  setDesignFormatFilter('A5');
                  setDesignFormat('A5');
                }}
              />
              <span>A5</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="designFormatFilter"
                checked={designFormatFilter === '3INCH'}
                onChange={() => {
                  setDesignFormatFilter('3INCH');
                  setDesignFormat('3INCH');
                }}
              />
              <span>3Inch</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="designFormatFilter"
                checked={designFormatFilter === 'ALL'}
                onChange={() => setDesignFormatFilter('ALL')}
              />
              <span>All</span>
            </label>
          </div>

          {/* Left Panel: Styles List (Frame 0198, 0230 exact red pointer on active row) */}
          <div style={{
            width: '180px',
            background: '#ffffff',
            borderRight: '1px solid #cbd5e1',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            paddingTop: '36px'
          }}>
            <div style={{
              background: '#bef264',
              color: '#166534',
              padding: '6px',
              fontWeight: 'bold',
              fontSize: '11px',
              textAlign: 'center',
              borderBottom: '1px solid #a3e635'
            }}>
              Bill Style Name
            </div>

            {(() => {
              const formatsToRender: ('A4' | 'A5' | '3INCH')[] =
                designFormatFilter === 'ALL' ? ['A4', 'A5', '3INCH'] : [designFormatFilter as 'A4' | 'A5' | '3INCH'];

              return formatsToRender.flatMap(fmt =>
                Array.from({ length: 10 }, (_, i) => i + 1).map(styleNum => {
                  const isSelected = designFormat === fmt && designStyleIndex === styleNum;
                  return (
                    <div
                      key={`${fmt}-${styleNum}`}
                      onClick={() => {
                        setDesignFormat(fmt);
                        setDesignStyleIndex(styleNum);
                        showToast(`Selected ${fmt}-Style${styleNum}`);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px 6px',
                        fontSize: '11px',
                        fontWeight: isSelected ? 'bold' : 'normal',
                        background: isSelected ? '#000000' : (styleNum === 1 && !isSelected ? '#fef08a' : '#ffffff'),
                        color: isSelected ? '#ffffff' : '#000000',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{
                        width: '18px',
                        height: '18px',
                        background: '#4c1d95',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9px',
                        marginRight: '6px',
                        borderRadius: '1px',
                        flexShrink: 0
                      }}>
                        {isSelected && (
                          <span style={{ color: '#ef4444', fontSize: '10px' }}>▶</span>
                        )}
                      </div>
                      <span>{fmt}-Style{styleNum}</span>
                    </div>
                  );
                })
              );
            })()}
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
                isPrintMode={true}
              />
            </div>
          </div>

          {/* Right Panel: Printer Controls (Frame 0198, 0230 exact controls) */}
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
              <option value="XP-80C (copy 1)">XP-80C (copy 1)</option>
              <option value="XP-80C Thermal (copy 1)">XP-80C Thermal (copy 1)</option>
              <option value="Microsoft Print to PDF">Microsoft Print to PDF</option>
              <option value="HP LaserJet A4 Pro">HP LaserJet A4 Pro</option>
              <option value="Canon LBP2900B">Canon LBP2900B</option>
            </select>

            {/* Apply Button (Green Gradient Frame 0198) */}
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

            {/* Tool Buttons (Blue Gradient Frame 0198) */}
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

          {/* Windows Modal Dialog: Terminal Setting Successfully Updated (Frame 0198) */}
          {showTerminalSuccessModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3000
            }}>
              <div style={{
                width: '270px',
                background: '#ffffff',
                border: '1px solid #71717a',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                fontFamily: 'Segoe UI, Tahoma, sans-serif'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 8px',
                  background: '#ffffff',
                  borderBottom: '1px solid #e4e4e7',
                  fontSize: '12px'
                }}>
                  <span style={{ color: '#000000' }}>Terminal Setting</span>
                  <button
                    onClick={() => setShowTerminalSuccessModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#000000'
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{
                  padding: '20px 16px 14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#0044cc',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    fontFamily: 'serif',
                    flexShrink: 0
                  }}>
                    i
                  </div>
                  <div style={{ fontSize: '12px', color: '#000000', fontWeight: '500' }}>
                    Successfully Updated
                  </div>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '0 0 14px 0'
                }}>
                  <button
                    onClick={() => setShowTerminalSuccessModal(false)}
                    style={{
                      minWidth: '76px',
                      padding: '3px 14px',
                      background: '#e1e1e1',
                      border: '1px solid #0055ea',
                      outline: '1px solid #0055ea',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
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
              onClick={() => setIsSaleReturnModalOpen(true)}
              title="Open Sale Return (Credit Note) Window [Video 13 Frames 0050 & 0060]"
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

            {/* Video 12 Features: SMS, Email, Combo Pack, and Rubic POS (Frames 0100, 0108, 0446, 0510) */}
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: 'linear-gradient(180deg, #ea580c 0%, #c2410c 100%)', color: '#fff', padding: '8px 12px', fontWeight: 'bold', fontSize: '12px' }}
              onClick={() => setIsSmsSettingModalOpen(true)}
              title="SMS Gateway Configuration [Video 12 Frame 0100]"
            >
              ✉️ SMS Setting
            </button>
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)', color: '#fff', padding: '8px 12px', fontWeight: 'bold', fontSize: '12px' }}
              onClick={() => setIsEmailSettingModalOpen(true)}
              title="Email SMTP Configuration [Video 12 Frame 0108]"
            >
              📧 Email Setting
            </button>
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: 'linear-gradient(180deg, #7c3aed 0%, #5b21b6 100%)', color: '#fff', padding: '8px 12px', fontWeight: 'bold', fontSize: '12px' }}
              onClick={() => setIsComboPackModalOpen(true)}
              title="Combo Pack Master [Video 12 Frame 0446]"
            >
              📦 Combo Pack Master
            </button>
            <button
              type="button"
              className="rd-grid-btn"
              style={{ background: 'linear-gradient(180deg, #059669 0%, #047857 100%)', color: '#fff', padding: '8px 12px', fontWeight: 'bold', fontSize: '12px' }}
              onClick={() => setIsRubicPosModalOpen(true)}
              title="Rubic Touch Screen POS [Video 12 Frame 0510]"
            >
              📱 Rubic Touch POS
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
      {/* TAB 5: PAY TAB COMPLETE SETTLEMENT PANEL (1:1 VIDEO 17 FRAME 0105) */}
      {/* ============================================================== */}
      {posActiveTab === 'PAY' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f1f5f9', overflowY: 'auto' }}>
          {/* Top Button Strip: GET QR Button (Frame 0105) */}
          <div style={{ padding: '4px 16px', background: '#f8fafc', borderBottom: '1px solid #cbd5e1', display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowInstantQrModal(true)}
              style={{
                border: '1.5px solid #1e3a8a',
                background: '#ffffff',
                color: '#1e3a8a',
                fontWeight: '900',
                padding: '3px 14px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '11px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              GET QR
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '16px', padding: '16px' }}>
            {/* Left Area: Loyalty + By Cash/ByReturn + Settlement + Bill Summary (Frames 0105, 0110, 0115) */}
            <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                {/* Loyalty Card Discount (Video 13 Frames 0225 & 0235) */}
                <fieldset style={{ flex: 1, border: '1px solid #94a3b8', borderRadius: '4px', padding: '10px 14px', background: '#ffffff', position: 'relative' }}>
                  <legend style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e40af', padding: '0 4px' }}>
                    Loyalty Card Discount
                  </legend>
                  <span style={{ position: 'absolute', top: '8px', left: '10px', fontSize: '10px', color: '#2563eb', fontWeight: 'bold' }}>
                    0.00
                  </span>
                  {(() => {
                    const pointMultiplier = companyInfo?.loyaltyPerPointValue !== undefined ? companyInfo.loyaltyPerPointValue : 0.10;
                    const custBasePts = selectedCustomer.loyaltyPoints !== undefined ? selectedCustomer.loyaltyPoints : 71.08;
                    const calculatedCashValue = Number((custBasePts * pointMultiplier).toFixed(2));
                    const maxRedeem = Math.floor(calculatedCashValue);
                    const ptsToDeduct = loyaltyRedeemChecked ? (pointMultiplier > 0 ? (loyaltyRedeemAmt / pointMultiplier) : 0) : 0;
                    const remainingPts = Math.max(0, custBasePts - ptsToDeduct);
                    const remainingAmt = Number((remainingPts * pointMultiplier).toFixed(2));
                    const cardNo = selectedCustomer.id?.startsWith('C-') ? selectedCustomer.id : (selectedCustomer.phone ? `C-${selectedCustomer.phone.slice(-4)}` : 'C-0002');

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', marginTop: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Card No. :</span>
                          <span style={{ color: '#1d4ed8', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '13px' }}>
                            {cardNo}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Loyalty Points :</span>
                          <input
                            type="text"
                            readOnly
                            value={remainingPts.toFixed(2)}
                            style={{ width: '85px', background: '#ffffcc', textAlign: 'right', border: '1px solid #94a3b8', padding: '2px 6px', fontWeight: 'bold' }}
                            title={`Base Points: ${custBasePts.toFixed(2)}`}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Amount ({companyInfo?.currencySymbol || 'Rs.'}) :</span>
                          <input
                            type="text"
                            readOnly
                            value={remainingAmt.toFixed(2)}
                            style={{ width: '85px', background: '#ffffcc', textAlign: 'right', border: '1px solid #94a3b8', padding: '2px 6px', fontWeight: 'bold', color: '#15803d' }}
                            title={`Valued at ${pointMultiplier} per point [Video 09 Frame 0275/0305]`}
                          />
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '9px', color: '#64748b', marginTop: '-4px' }}>
                          For Point ({pointMultiplier} / pt)
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                            <span>L P Redeem :</span>
                            <input
                              type="checkbox"
                              checked={loyaltyRedeemChecked}
                              onChange={e => {
                                setLoyaltyRedeemChecked(e.target.checked);
                                setLoyaltyRedeemAmt(e.target.checked ? maxRedeem : 0);
                              }}
                            />
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={calculatedCashValue}
                            value={loyaltyRedeemChecked ? loyaltyRedeemAmt : 0}
                            onChange={e => {
                              const val = Math.min(calculatedCashValue, Math.max(0, parseFloat(e.target.value) || 0));
                              setLoyaltyRedeemAmt(val);
                              if (val > 0 && !loyaltyRedeemChecked) setLoyaltyRedeemChecked(true);
                              if (val === 0 && loyaltyRedeemChecked) setLoyaltyRedeemChecked(false);
                            }}
                            style={{ width: '85px', background: '#ffffcc', textAlign: 'right', border: '1px solid #94a3b8', padding: '2px 6px', fontWeight: 'bold' }}
                            title="Redeemable cash discount from loyalty points"
                          />
                        </div>
                      </div>
                    );
                  })()}
                </fieldset>

                {/* By Cash / ByReturn (Frame 0105 & Video 13 Frame 0235) */}
                <fieldset style={{ flex: 1.2, border: '1px solid #94a3b8', borderRadius: '4px', padding: '10px 14px', background: '#ffffff' }}>
                  <legend style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e40af', padding: '0 4px' }}>
                    By Cash / ByReturn
                  </legend>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Bill Discount :</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', fontSize: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="tenderDiscType"
                            checked={tenderDiscountType === 'Amount'}
                            onChange={() => setTenderDiscountType('Amount')}
                          />
                          <span>By Amount</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="tenderDiscType"
                            checked={tenderDiscountType === 'Percentage'}
                            onChange={() => setTenderDiscountType('Percentage')}
                          />
                          <span>By Percentage</span>
                        </label>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="number"
                          value={tenderDiscount}
                          onChange={e => setTenderDiscount(parseFloat(e.target.value) || 0)}
                          style={{
                            width: '50%',
                            background: tenderDiscountType === 'Amount' ? '#ffffcc' : '#e2e8f0',
                            textAlign: 'right',
                            border: '1px solid #94a3b8',
                            padding: '2px 6px',
                            fontWeight: 'bold'
                          }}
                        />
                        <input
                          type="text"
                          readOnly
                          value={(loyaltyRedeemChecked ? loyaltyRedeemAmt : 0).toFixed(2)}
                          style={{
                            width: '50%',
                            background: '#e2e8f0',
                            textAlign: 'right',
                            border: '1px solid #94a3b8',
                            padding: '2px 6px',
                            fontWeight: 'bold',
                            color: '#1e293b'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Paid By Cash :</span>
                      <input
                        type="number"
                        step="any"
                        value={tenderPaidByCash || ''}
                        onChange={e => setTenderPaidByCash(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        style={{
                          width: '120px',
                          background: '#ffffcc',
                          textAlign: 'right',
                          fontWeight: '900',
                          fontSize: '14px',
                          border: '1.5px solid #0284c7',
                          padding: '3px 8px',
                          borderRadius: '2px'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '11px' }}>Cash Change :</span>
                      <span style={{ fontWeight: '900', color: '#15803d', fontSize: '15px' }}>
                        {tenderPaidByCash > netPay ? (tenderPaidByCash - netPay).toFixed(2) : '0'}
                      </span>
                    </div>

                    {appliedReturnAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', background: '#fee2e2', padding: '3px 6px', borderRadius: '3px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#991b1b' }}>Sale Return Adjusted :</span>
                        <span style={{ fontWeight: '900', color: '#991b1b', fontSize: '12px' }}>
                          -₹{appliedReturnAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </fieldset>
              </div>

              {/* Split Payment & Credit Terms Settlement Bar (Frames 0110, 0115) */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e40af' }}>Split Payment & Credit Terms Settlement</div>
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
                    fontSize: '12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    border: 'none'
                  }}
                >
                  Open Settlement [F12]
                </button>
              </div>

              {/* Video 18 Feature 4: Bottom 4 Action Buttons (Frames 0230-0255 & Frame 0105) */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                <button
                  type="button"
                  className="rd-grid-btn"
                  style={{
                    flex: 1,
                    background: 'linear-gradient(180deg, #eab308 0%, #ca8a04 100%)',
                    border: '1px solid #a16207',
                    borderRadius: '4px',
                    padding: '7px 4px',
                    fontSize: '11px',
                    fontWeight: '900',
                    color: '#000000',
                    cursor: 'pointer'
                  }}
                  onClick={() => setIsCouponModalOpen(true)}
                >
                  🎟️ COUPON
                </button>
                <button
                  type="button"
                  className="rd-grid-btn"
                  style={{
                    flex: 1,
                    background: 'linear-gradient(180deg, #15803d 0%, #166534 100%)',
                    border: '1px solid #14532d',
                    borderRadius: '4px',
                    padding: '7px 4px',
                    fontSize: '11px',
                    fontWeight: '900',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setPosActiveTab('SALE');
                    searchInputRef.current?.focus();
                  }}
                >
                  ➕ Add Product
                </button>
                <button
                  type="button"
                  className="rd-grid-btn"
                  style={{
                    flex: 1,
                    background: 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)',
                    border: '1px solid #7f1d1d',
                    borderRadius: '4px',
                    padding: '7px 4px',
                    fontSize: '11px',
                    fontWeight: '900',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                  onClick={() => setIsGiftVoucherModalOpen(true)}
                >
                  🎁 GIFT
                </button>
                <button
                  type="button"
                  className="rd-grid-btn"
                  style={{
                    flex: 1.2,
                    background: showBillSummaryInPay ? 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)' : 'linear-gradient(180deg, #0d9488 0%, #0f766e 100%)',
                    color: '#ffffff',
                    border: '1px solid #0f766e',
                    borderRadius: '4px',
                    padding: '7px 4px',
                    fontSize: '11px',
                    fontWeight: '900',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowBillSummaryInPay(!showBillSummaryInPay)}
                  title="Toggle Bill Summary / Product Info Settings [Video 18 Frame 252-255]"
                >
                  📋 BILL SUMMARY
                </button>
              </div>

              {/* Video 18 Feature 4: BILL SUMMARY & PRODUCT INFO Config Panel */}
              {showBillSummaryInPay && (
                <div style={{
                  background: '#ffffff',
                  border: '1.5px solid #0369a1',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}>
                  {/* Sub-tabs header */}
                  <div style={{ display: 'flex', background: '#002b55', color: '#ffffff', fontSize: '11px', fontWeight: 'bold' }}>
                    {[
                      { id: 'BILL_SUMMARY', label: 'BILL SUMMARY' },
                      { id: 'TAX_INFO', label: 'TAX INFO' },
                      { id: 'PRODUCT_INFO', label: 'PRODUCT INFO' },
                      { id: 'CONFIG', label: 'CONFIG' },
                      { id: 'BROKER', label: 'BROKER' },
                      { id: 'E_COM', label: 'E COM' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setBillSummarySubTab(tab.id as any)}
                        style={{
                          flex: 1,
                          padding: '6px 4px',
                          border: 'none',
                          borderRight: '1px solid #0f3d6b',
                          background: billSummarySubTab === tab.id ? '#0284c7' : 'transparent',
                          color: '#ffffff',
                          cursor: 'pointer',
                          fontSize: '10px',
                          fontWeight: 'bold'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Body: PRODUCT INFO */}
                  {billSummarySubTab === 'PRODUCT_INFO' && (
                    <div style={{ padding: '12px', background: '#f8fafc', fontSize: '11px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#0369a1' }}>
                          <input
                            type="checkbox"
                            checked={posProductInfoConfig.productParameterEnabled}
                            onChange={e => {
                              const updated = { ...posProductInfoConfig, productParameterEnabled: e.target.checked };
                              setPosProductInfoConfig(updated);
                              showToast(e.target.checked ? '✓ Product Parameter Multi-Batch Dashboard Enabled' : '⚠ Product Parameter Disabled: Single/Latest Rate Active');
                            }}
                          />
                          <span>Product Parameter</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={posProductInfoConfig.stockLimitAlert}
                            onChange={e => setPosProductInfoConfig({ ...posProductInfoConfig, stockLimitAlert: e.target.checked })}
                          />
                          <span>Stock Limit Alert</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={posProductInfoConfig.negativeStockAlert}
                            onChange={e => setPosProductInfoConfig({ ...posProductInfoConfig, negativeStockAlert: e.target.checked })}
                          />
                          <span>Negative Stock Alert</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={posProductInfoConfig.itemSpeedEntry1}
                            onChange={e => setPosProductInfoConfig({ ...posProductInfoConfig, itemSpeedEntry1: e.target.checked })}
                          />
                          <span>Item Speed Entry 1</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={posProductInfoConfig.itemSpeedEntry2}
                            onChange={e => setPosProductInfoConfig({ ...posProductInfoConfig, itemSpeedEntry2: e.target.checked })}
                          />
                          <span>Item Speed Entry 2</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={posProductInfoConfig.imeiSerialNo}
                            onChange={e => setPosProductInfoConfig({ ...posProductInfoConfig, imeiSerialNo: e.target.checked })}
                          />
                          <span>IMEI / Serial No.</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={posProductInfoConfig.editProductInfo}
                            onChange={e => setPosProductInfoConfig({ ...posProductInfoConfig, editProductInfo: e.target.checked })}
                          />
                          <span>Edit Product Info</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={posProductInfoConfig.productImageShow}
                            onChange={e => setPosProductInfoConfig({ ...posProductInfoConfig, productImageShow: e.target.checked })}
                          />
                          <span>Product Image Show</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={posProductInfoConfig.upiQrCodePrint}
                            onChange={e => setPosProductInfoConfig({ ...posProductInfoConfig, upiQrCodePrint: e.target.checked })}
                          />
                          <span>UPI QR Code Print</span>
                        </label>
                      </div>

                      <div style={{ marginTop: '10px', display: 'flex', gap: '16px', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 'bold' }}>Last Invoice Amt:</span>
                          <input
                            type="text"
                            readOnly
                            value={`₹${posProductInfoConfig.lastInvoiceAmt.toFixed(2)}`}
                            style={{ width: '80px', background: '#ffffcc', padding: '2px 4px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold' }}
                          />
                        </div>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 'bold' }}>Narration:</span>
                          <input
                            type="text"
                            placeholder="Invoice notes / remarks..."
                            value={posProductInfoConfig.narration}
                            onChange={e => setPosProductInfoConfig({ ...posProductInfoConfig, narration: e.target.value })}
                            style={{ flex: 1, padding: '2px 6px', border: '1px solid #cbd5e1', background: '#ffffff' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {billSummarySubTab === 'BILL_SUMMARY' && (
                    <div style={{ padding: '12px', background: '#f8fafc', fontSize: '11px', display: 'flex', gap: '20px' }}>
                      <div>Total Items: <b>{cart.length}</b></div>
                      <div>Total Qty: <b>{totalQty}</b></div>
                      <div>Total Tax: <b>₹{totalTax.toFixed(2)}</b></div>
                      <div>Total Discount: <b>₹{totalDisc.toFixed(2)}</b></div>
                      <div>Net Payable: <b style={{ color: '#15803d' }}>₹{netPay.toFixed(2)}</b></div>
                    </div>
                  )}

                  {billSummarySubTab === 'TAX_INFO' && (
                    <div style={{ padding: '12px', background: '#f8fafc', fontSize: '11px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#e2e8f0', textAlign: 'left' }}>
                            <th style={{ padding: '4px' }}>Tax Rate</th>
                            <th style={{ padding: '4px' }}>Taxable Amt</th>
                            <th style={{ padding: '4px' }}>CGST</th>
                            <th style={{ padding: '4px' }}>SGST</th>
                            <th style={{ padding: '4px' }}>IGST</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ padding: '4px' }}>18% GST</td>
                            <td style={{ padding: '4px' }}>₹{cart.reduce((s, i) => s + (i.cgstPercent > 0 ? i.taxable : 0), 0).toFixed(2)}</td>
                            <td style={{ padding: '4px' }}>₹{cart.reduce((s, i) => s + i.cgstAmt, 0).toFixed(2)}</td>
                            <td style={{ padding: '4px' }}>₹{cart.reduce((s, i) => s + i.sgstAmt, 0).toFixed(2)}</td>
                            <td style={{ padding: '4px' }}>₹{cart.reduce((s, i) => s + i.igstAmt, 0).toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {(billSummarySubTab === 'CONFIG' || billSummarySubTab === 'BROKER' || billSummarySubTab === 'E_COM') && (
                    <div style={{ padding: '16px', background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>
                      Config and integrations ready for Retail Daddy modules.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Area: Net Pay + 5 Tender Tiles + 12-Key Touch Keypad + Returns + SALE - F12 (Frame 0105) */}
            <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Big Green Net Pay Display */}
              <div style={{
                textAlign: 'right',
                fontSize: '32px',
                fontWeight: '900',
                color: '#008000',
                background: '#ffffff',
                padding: '4px 14px',
                borderRadius: '4px',
                border: '1px solid #cbd5e1',
                fontFamily: 'system-ui, sans-serif'
              }}>
                Net Pay : {netPay.toFixed(0)}
              </div>

              {/* Tender Buttons (Left) & 12-Key Keypad (Right) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '8px' }}>
                {/* Left: 5 Big Tender Buttons (Frame 0105) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* CASH */}
                  <button
                    type="button"
                    onClick={() => {
                      setTenderPaidByCash(netPay);
                      showToast('Tender: By Cash');
                    }}
                    style={{
                      background: 'linear-gradient(180deg, #166534 0%, #14532d 100%)',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      padding: '10px 8px',
                      borderRadius: '4px',
                      border: '1px solid #14532d',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                    }}
                  >
                    <span>CASH</span>
                    <span style={{ fontSize: '18px' }}>💵✋</span>
                  </button>

                  {/* CREDIT CARD */}
                  <button
                    type="button"
                    onClick={() => {
                      showToast('Tender: Credit Card Authorized');
                      triggerQuickPay();
                    }}
                    style={{
                      background: 'linear-gradient(180deg, #166534 0%, #14532d 100%)',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      padding: '8px 8px',
                      borderRadius: '4px',
                      border: '1px solid #14532d',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                    }}
                  >
                    <span>CREDIT<br />CARD</span>
                    <span style={{ fontSize: '18px', background: '#dc2626', borderRadius: '3px', padding: '1px 4px' }}>💳</span>
                  </button>

                  {/* DEBIT CARD */}
                  <button
                    type="button"
                    onClick={() => {
                      showToast('Tender: Debit Card Authorized');
                      triggerQuickPay();
                    }}
                    style={{
                      background: 'linear-gradient(180deg, #166534 0%, #14532d 100%)',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      padding: '8px 8px',
                      borderRadius: '4px',
                      border: '1px solid #14532d',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                    }}
                  >
                    <span>DEBIT<br />CARD</span>
                    <span style={{ fontSize: '18px', background: '#2563eb', borderRadius: '3px', padding: '1px 4px' }}>💳</span>
                  </button>

                  {/* WALLET */}
                  <button
                    type="button"
                    onClick={() => {
                      showToast('Tender: Digital Wallet Settled');
                      triggerQuickPay();
                    }}
                    style={{
                      background: 'linear-gradient(180deg, #166534 0%, #14532d 100%)',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      padding: '9px 8px',
                      borderRadius: '4px',
                      border: '1px solid #14532d',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                    }}
                  >
                    <span>WALLET</span>
                    <span style={{ fontSize: '18px' }}>👛</span>
                  </button>

                  {/* UPI / QR */}
                  <button
                    type="button"
                    onClick={() => setShowInstantQrModal(true)}
                    style={{
                      background: 'linear-gradient(180deg, #166534 0%, #14532d 100%)',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      padding: '9px 8px',
                      borderRadius: '4px',
                      border: '1px solid #14532d',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                    }}
                  >
                    <span>UPI / QR</span>
                    <span style={{ fontSize: '16px', background: '#3b82f6', borderRadius: '3px', padding: '1px 3px' }}>📱</span>
                  </button>
                </div>

                {/* Right: 12-Key Touch Keypad (Frame 0105) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', '⌫'].map(k => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        if (k === '⌫') handleTenderKeypadPress('BACKSPACE');
                        else handleTenderKeypadPress(k);
                      }}
                      style={{
                        background: k === '.' ? 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)' : k === '⌫' ? 'linear-gradient(180deg, #475569 0%, #0f172a 100%)' : 'linear-gradient(180deg, #1e293b 0%, #000000 100%)',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        border: '1px solid #0f172a',
                        borderRadius: '3px',
                        padding: '12px 0',
                        cursor: 'pointer',
                        boxShadow: '0 2px 3px rgba(0,0,0,0.2)'
                      }}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {/* Return Voucher Entry (1:1 Video 13 Frames 0085 & 0090) */}
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '9px', color: '#1e3a8a', fontWeight: 'bold' }}>Return No</span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <input
                      type="text"
                      value={returnNo}
                      onChange={e => {
                        const val = e.target.value;
                        setReturnNo(val);
                        const match = saleReturns.find(r => r.returnNo.toLowerCase() === val.toLowerCase() && r.status === 'ACTIVE');
                        if (match) {
                          setReturnAmount(match.grandTotal);
                        }
                      }}
                      placeholder="SHIB-0003-2024/25"
                      style={{ border: '1px solid #94a3b8', padding: '2px 4px', fontSize: '11px', width: '100%', fontFamily: 'monospace', fontWeight: 'bold' }}
                    />
                    {saleReturns.length > 0 && (
                      <select
                        onChange={e => {
                          const val = e.target.value;
                          if (val) {
                            setReturnNo(val);
                            const match = saleReturns.find(r => r.returnNo === val);
                            if (match) setReturnAmount(match.grandTotal);
                          }
                        }}
                        style={{ width: '18px', padding: 0 }}
                        title="Select Active Return Voucher"
                      >
                        <option value="">▼</option>
                        {saleReturns.map(r => (
                          <option key={r.id} value={r.returnNo}>
                            {r.returnNo} (₹{r.grandTotal.toFixed(2)})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '9px', color: '#1e3a8a', fontWeight: 'bold' }}>Return Amount</span>
                  <input
                    type="number"
                    value={returnAmount || ''}
                    onChange={e => setReturnAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    style={{ border: '1px solid #94a3b8', padding: '2px 4px', textAlign: 'right', fontSize: '11px', fontWeight: 'bold', backgroundColor: '#ffffcc' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!returnAmount || returnAmount <= 0) {
                      showToast('Please enter or select a valid return amount');
                      return;
                    }
                    setAppliedReturnAmount(returnAmount);
                    setAppliedReturnNo(returnNo || 'SHIB-0003-2024/25');
                    showToast(`✓ Return voucher ${returnNo || 'SHIB-0003-2024/25'} applied (-₹${returnAmount.toFixed(2)}) [Video 13 Frame 0085]`);
                  }}
                  style={{
                    background: 'linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '8px 14px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    marginTop: '10px',
                    boxShadow: '0 2px 3px rgba(0,0,0,0.2)'
                  }}
                >
                  Add
                </button>
              </div>

              {/* Action Row: Eye button + CREDIT CUS + SALE - F12 (Frame 0105) */}
              <div style={{ display: 'grid', gridTemplateColumns: '40px 1.2fr 1.8fr', gap: '6px', alignItems: 'stretch' }}>
                <button
                  type="button"
                  onClick={() => showToast('Quick Tender Check')}
                  style={{
                    background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                    color: '#ffffff',
                    border: '1px solid #14532d',
                    borderRadius: '4px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Quick Check"
                >
                  👁️
                </button>

                <button
                  type="button"
                  onClick={() => setIsSettlementModalOpen(true)}
                  style={{
                    background: 'linear-gradient(180deg, #14532d 0%, #052e16 100%)',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    border: '1px solid #052e16',
                    borderRadius: '4px',
                    padding: '8px 4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                  }}
                >
                  <span>💳</span>
                  <span>CREDIT CUS</span>
                </button>

                <button
                  type="button"
                  onClick={triggerQuickPay}
                  style={{
                    background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                    color: '#ffffff',
                    fontWeight: '900',
                    fontSize: '15px',
                    border: '1px solid #14532d',
                    borderRadius: '4px',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                  }}
                >
                  <span>🛍️</span>
                  <span>SALE - F12</span>
                </button>
              </div>
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
        <div className="rd-modal-overlay" style={{ zIndex: 1200, padding: '10px' }}>
          <div className="rd-dialog" style={{ width: '96vw', maxWidth: '1240px', height: '94vh', display: 'flex', flexDirection: 'column' }}>
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
            <div className="rd-dialog-body" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex' }}>
              <BillTemplatePreview
                companyInfo={companyInfo}
                config={billConfig}
                billData={lastCompletedBill}
                isPrintMode={false}
              />
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
          const creditLines = splitLines.filter(l => l.mode === 'CREDIT');
          const creditAmount = creditLines.reduce((s, l) => s + l.amount, 0);
          const totalCreditDue = Number((balanceDue + creditAmount).toFixed(2));
          const cashPaid = totalSettled - creditAmount;

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
            paidAmount: cashPaid,
            balanceDue: totalCreditDue,
            paymentMode: splitLines.length === 1 ? splitLines[0].mode : `Split (${splitLines.map(s => s.mode).join(' + ')})`,
            paymentSplits: splitLines,
            salesman: selectedSalesman,
            taxScheme,
            status: totalCreditDue > 0 ? (cashPaid > 0 ? 'PARTIAL' : 'CREDIT') : 'PAID'
          };

          cart.forEach(item => {
            onStockDeduct(item.barcode, item.stockDeductQty || item.qty);
          });

          onRecordSaleInvoice(completedBill);

          // Video 18 Feature 1: Update customer balance upon credit sale
          if (totalCreditDue > 0) {
            const updated = {
              ...selectedCustomer,
              balance: Number((selectedCustomer.balance + totalCreditDue).toFixed(2))
            };
            setSelectedCustomer(updated);
            if (onUpdateCustomer) {
              onUpdateCustomer(updated);
            }
          }

          setLastCompletedBill(completedBill);
          setShowPrintModal(true);
          setCart([]);
          setEditingOldBill(null);
          setIsSettlementModalOpen(false);
          showToast(`✓ Bill ${currentInvoiceNo} settled! Paid: ₹${cashPaid.toFixed(2)}, Due/Credit: ₹${totalCreditDue.toFixed(2)}`);
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

      {/* ============================================================== */}
      {/* MODAL 9: NEGATIVE STOCK ALERT MODAL (VIDEO 19 FRAME 090)        */}
      {/* ============================================================== */}
      <NegativeStockAlertModal
        isOpen={Boolean(negativeAlertData)}
        productName={negativeAlertData?.productName || ''}
        barcode={negativeAlertData?.barcode || ''}
        availableQty={pendingAddAction ? (products.find(p => p.barcode === pendingAddAction.product.barcode)?.openingStock ?? 0) : 0}
        requestedQty={pendingAddAction ? pendingAddAction.qty : 1}
        onConfirm={handleConfirmNegativeStock}
        onCancel={handleCancelNegativeStock}
      />

      {/* ============================================================== */}
      {/* MODAL 10: MINIMUM STOCK LIMIT ALERT MODAL (VIDEO 19 FRAME 210)  */}
      {/* ============================================================== */}
      <MinimumStockAlertModal
        isOpen={Boolean(minStockAlertData)}
        productName={minStockAlertData?.productName || ''}
        barcode={minStockAlertData?.barcode || ''}
        currentStock={pendingAddAction ? (products.find(p => p.barcode === pendingAddAction.product.barcode)?.openingStock ?? 0) : 0}
        minStock={pendingAddAction ? (products.find(p => p.barcode === pendingAddAction.product.barcode)?.minStock ?? 0) : 0}
        requestedQty={pendingAddAction ? pendingAddAction.qty : 1}
        onConfirm={handleConfirmMinStock}
        onCancel={handleCancelMinStock}
      />

      {/* ============================================================== */}
      {/* MODAL 11: SALESMAN PAYMENT ENTRY MODAL (VIDEO 19 FRAME 345)     */}
      {/* ============================================================== */}
      <SalesmanPaymentModal
        isOpen={isSalesmanPaymentOpen}
        salesmen={salesmen}
        ledgerEntries={salesmanLedger}
        onSavePayment={(voucher, ledgerEntry) => {
          if (onSaveSalesmanPayment) {
            onSaveSalesmanPayment(voucher, ledgerEntry);
          }
          setIsSalesmanPaymentOpen(false);
          showToast(`✓ Commission Payout Voucher ${voucher.voucherNo} issued for ${voucher.salesmanName}! [Video 19 Frame 345]`);
        }}
        onClose={() => setIsSalesmanPaymentOpen(false)}
      />

      {/* ============================================================== */}
      {/* MODAL 12: SALESMAN LEDGER STATEMENT MODAL (VIDEO 19 FRAME 365)  */}
      {/* ============================================================== */}
      <SalesmanLedgerModal
        isOpen={isSalesmanLedgerOpen}
        salesmen={salesmen}
        ledgerEntries={salesmanLedger}
        onClose={() => setIsSalesmanLedgerOpen(false)}
      />

      {/* ============================================================== */}
      {/* MODAL 13: PRODUCT BULK EDITOR MODAL (VIDEO 19 FRAME 275)        */}
      {/* ============================================================== */}
      <ProductBulkEditorModal
        isOpen={isBulkEditorOpen}
        products={products}
        onSaveProducts={(updated) => {
          if (onBulkUpdateProducts) {
            onBulkUpdateProducts(updated);
          }
          setIsBulkEditorOpen(false);
          showToast('✓ Mass Product Commission and Loyalty updated successfully! [Video 19 Frame 275]');
        }}
        onClose={() => setIsBulkEditorOpen(false)}
      />

      {/* ============================================================== */}
      {/* MODAL 14: SALE PRICE EDIT MODAL (VIDEO 19 FRAME 535)            */}
      {/* ============================================================== */}
      <SalePriceEditModal
        isOpen={isSalePriceEditorOpen}
        products={products}
        initialBarcode={barcodeInput || '3460'}
        onUpdatePrices={(barcode, prices) => {
          const matchedProd = products.find(p => p.barcode === barcode);
          if (matchedProd && onBulkUpdateProducts) {
            const updated = products.map(p => p.barcode === barcode ? {
              ...p,
              mrp: prices.mrp,
              retailPrice: prices.retailPrice,
              wholesalePrice: prices.wholesalePrice,
              purchasePrice: prices.purchasePrice ?? p.purchasePrice
            } : p);
            onBulkUpdateProducts(updated);
            showToast(`✓ Updated prices for Barcode ${barcode} (Retail: ₹${prices.retailPrice}) [Video 19 Frame 535]`);
          }
          setIsSalePriceEditorOpen(false);
        }}
        onClose={() => setIsSalePriceEditorOpen(false)}
      />

      {/* ============================================================== */}
      {/* MODAL 15: PRODUCT PARAMETER DASHBOARD (VIDEO 18 FRAMES 096/234/254) */}
      {/* ============================================================== */}
      {parameterProduct && (
        <ProductParameterModal
          isOpen={isProductParameterModalOpen}
          productName={parameterProduct.name}
          productBarcode={parameterProduct.barcode}
          batches={parameterProduct.batches || []}
          onSelectBatch={handleSelectBatch}
          onClose={() => {
            setIsProductParameterModalOpen(false);
            setParameterProduct(null);
          }}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL 16: CUSTOMER LEDGER STATEMENT (VIDEO 18 FRAMES 047/064)   */}
      {/* ============================================================== */}
      <CustomerLedgerModal
        isOpen={isCustomerLedgerOpen}
        customer={selectedCustomer}
        ledgerEntries={ledgerEntries}
        onClose={() => setIsCustomerLedgerOpen(false)}
      />

      {/* ============================================================== */}
      {/* MODAL 17: INSTANT DYNAMIC UPI QR MODAL (VIDEO 17 FRAME 0105)    */}
      {/* ============================================================== */}
      {showInstantQrModal && (
        <div className="rd-modal-overlay" style={{ zIndex: 1300 }}>
          <div className="rd-dialog" style={{ width: '420px', background: '#ffffff', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
            <div className="rd-dialog-titlebar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(180deg, #002b55 0%, #001f3f 100%)', color: '#ffffff', padding: '8px 12px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '13px' }}>
                Instant Dynamic UPI QR - {currentInvoiceNo}
              </span>
              <button
                type="button"
                onClick={() => setShowInstantQrModal(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc' }}>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#002b55', marginBottom: '4px' }}>
                {companyInfo.companyName || companyInfo.name || 'SHREE VINAYAKA FURNITURES'}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>
                UPI ID: <b>oliveshop@okaxis</b>
              </div>

              {/* Dynamic QR SVG Presentation */}
              <div style={{ background: '#ffffff', border: '2px solid #0284c7', borderRadius: '8px', padding: '16px', display: 'inline-block', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <svg width="180" height="180" viewBox="0 0 180 180" style={{ display: 'block' }}>
                  <rect width="180" height="180" fill="#ffffff" />
                  <rect x="15" y="15" width="40" height="40" fill="#000000" />
                  <rect x="23" y="23" width="24" height="24" fill="#ffffff" />
                  <rect x="29" y="29" width="12" height="12" fill="#000000" />
                  <rect x="125" y="15" width="40" height="40" fill="#000000" />
                  <rect x="133" y="23" width="24" height="24" fill="#ffffff" />
                  <rect x="139" y="29" width="12" height="12" fill="#000000" />
                  <rect x="15" y="125" width="40" height="40" fill="#000000" />
                  <rect x="23" y="133" width="24" height="24" fill="#ffffff" />
                  <rect x="29" y="139" width="12" height="12" fill="#000000" />
                  <rect x="65" y="20" width="10" height="20" fill="#000000" />
                  <rect x="85" y="15" width="25" height="10" fill="#000000" />
                  <rect x="75" y="35" width="15" height="15" fill="#000000" />
                  <rect x="100" y="35" width="10" height="20" fill="#000000" />
                  <rect x="20" y="65" width="20" height="10" fill="#000000" />
                  <rect x="50" y="65" width="15" height="15" fill="#000000" />
                  <rect x="75" y="65" width="30" height="30" fill="#0284c7" />
                  <rect x="115" y="65" width="20" height="10" fill="#000000" />
                  <rect x="145" y="65" width="15" height="20" fill="#000000" />
                  <rect x="20" y="85" width="10" height="25" fill="#000000" />
                  <rect x="40" y="90" width="20" height="15" fill="#000000" />
                  <rect x="115" y="85" width="15" height="25" fill="#000000" />
                  <rect x="140" y="95" width="25" height="10" fill="#000000" />
                  <rect x="65" y="105" width="20" height="10" fill="#000000" />
                  <rect x="95" y="105" width="10" height="20" fill="#000000" />
                  <rect x="65" y="125" width="15" height="20" fill="#000000" />
                  <rect x="90" y="125" width="25" height="10" fill="#000000" />
                  <rect x="125" y="125" width="20" height="20" fill="#000000" />
                  <rect x="155" y="125" width="10" height="35" fill="#000000" />
                  <rect x="65" y="155" width="25" height="10" fill="#000000" />
                  <rect x="100" y="145" width="20" height="20" fill="#000000" />
                  <rect x="130" y="155" width="15" height="10" fill="#000000" />
                </svg>
              </div>

              <div style={{ marginTop: '12px', fontSize: '20px', fontWeight: '900', color: '#15803d' }}>
                ₹{netPay.toFixed(2)}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Scan with any UPI app (GPay, PhonePe, Paytm, BHIM)
              </div>

              <div style={{ marginTop: '16px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowInstantQrModal(false);
                    triggerQuickPay();
                    showToast('✓ UPI payment confirmed! Generating bill...');
                  }}
                  style={{
                    background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                >
                  ✓ Payment Received - Settle [F12]
                </button>
                <button
                  type="button"
                  onClick={() => setShowInstantQrModal(false)}
                  style={{
                    background: '#e2e8f0',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    padding: '8px 14px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 18: QUOTATION MANAGEMENT MODAL (VIDEO 17 FRAME 0160)       */}
      {/* ============================================================== */}
      {isQuotationModalOpen && (
        <div className="rd-modal-overlay" style={{ zIndex: 1250 }}>
          <div className="rd-dialog" style={{ width: '96vw', height: '94vh', maxWidth: '1400px', display: 'flex', flexDirection: 'column' }}>
            <QuotationView
              products={products}
              customers={customers}
              companyInfo={companyInfo}
              quotations={quotations}
              onSaveQuotation={(quot) => {
                setQuotations(prev => {
                  const idx = prev.findIndex(q => q.id === quot.id);
                  if (idx >= 0) {
                    const next = [...prev];
                    next[idx] = quot;
                    return next;
                  }
                  return [quot, ...prev];
                });
                showToast(`✓ Quotation ${quot.quotationNo} saved successfully! [Video 17 Frame 0160]`);
              }}
              onDeleteQuotation={(id) => {
                setQuotations(prev => prev.filter(q => q.id !== id));
                showToast('Quotation deleted successfully.');
              }}
              onClose={() => setIsQuotationModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 19: ESTIMATE REGISTER & POS CONVERSION (VIDEO 16 FRAME 0045/0050) */}
      {/* ============================================================== */}
      <EstimateRegisterModal
        isOpen={isEstimateRegisterOpen}
        estimates={activeEstimates}
        onClose={() => setIsEstimateRegisterOpen(false)}
        onSelectEstimate={handleLoadEstimateToCart}
      />

      {/* ============================================================== */}
      {/* MODAL 20: SALE RETURN (CREDIT NOTE) MODAL (VIDEO 13 FRAMES 0050 & 0060) */}
      {/* ============================================================== */}
      <SaleReturnModal
        isOpen={isSaleReturnModalOpen}
        onClose={() => setIsSaleReturnModalOpen(false)}
        products={products}
        onSaveReturn={(v) => {
          setSaleReturns(prev => [v, ...prev]);
          setReturnNo(v.returnNo);
          setReturnAmount(v.grandTotal);
          showToast(`✓ Return voucher ${v.returnNo} generated (₹${v.grandTotal.toFixed(2)}) [Video 13 Frame 0060]`);
        }}
      />

      {/* ============================================================== */}
      {/* MODAL 21: COMBO PACK MASTER MODAL (VIDEO 12 FRAMES 0446 & 0460) */}
      {/* ============================================================== */}
      <ComboPackMasterModal
        isOpen={isComboPackModalOpen}
        comboPacks={comboPacks}
        products={products}
        onSaveComboPack={(cp) => {
          setComboPacks(prev => {
            const idx = prev.findIndex(p => p.id === cp.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = cp;
              return updated;
            }
            return [cp, ...prev];
          });
          showToast(`✓ Combo Pack "${cp.bundleName || cp.name}" saved successfully! [Video 12 Frame 0460]`);
        }}
        onDeleteComboPack={(id) => {
          setComboPacks(prev => prev.filter(p => p.id !== id));
          showToast('✓ Combo Pack deleted.');
        }}
        onClose={() => setIsComboPackModalOpen(false)}
      />

      {/* ============================================================== */}
      {/* MODAL 22: SMS SETTING MODAL (VIDEO 12 FRAME 0100)               */}
      {/* ============================================================== */}
      <SmsSettingModal
        isOpen={isSmsSettingModalOpen}
        config={smsConfig}
        onSave={(cfg: SmsConfig) => {
          setSmsConfig(cfg);
          setIsSmsSettingModalOpen(false);
          showToast('✓ SMS Gateway settings saved! [Video 12 Frame 0100]');
        }}
        onClose={() => setIsSmsSettingModalOpen(false)}
      />

      {/* ============================================================== */}
      {/* MODAL 23: EMAIL SETTING MODAL (VIDEO 12 FRAME 0108)             */}
      {/* ============================================================== */}
      <EmailSettingModal
        isOpen={isEmailSettingModalOpen}
        config={emailConfig}
        onSave={(cfg: EmailConfig) => {
          setEmailConfig(cfg);
          setIsEmailSettingModalOpen(false);
          showToast('✓ Email SMTP settings saved! [Video 12 Frame 0108]');
        }}
        onClose={() => setIsEmailSettingModalOpen(false)}
      />

      {/* ============================================================== */}
      {/* MODAL 24: RUBIC TOUCH SCREEN POS MODAL (VIDEO 12 FRAMES 0510 & 0520) */}
      {/* ============================================================== */}
      <RubicPosModal
        isOpen={isRubicPosModalOpen}
        products={products}
        companyInfo={companyInfo}
        onClose={() => setIsRubicPosModalOpen(false)}
        onCompleteBill={(bill: any) => {
          onRecordSaleInvoice(bill);
          setLastCompletedBill(bill);
          setShowPrintModal(true);
          showToast(`✓ Rubic POS Bill completed! Bill Total: ₹${bill.netPay.toFixed(2)} [Video 12 Frame 0520]`);
        }}
      />

      {/* ============================================================== */}
      {/* MODAL 25: PRODUCT DISCOUNT SETTING (VIDEO 10 FRAMES 0071, 0090, 0100) */}
      {/* ============================================================== */}
      <ProductDiscountSettingModal
        isOpen={isInternalVolDiscountModalOpen}
        onClose={() => setIsInternalVolDiscountModalOpen(false)}
        products={products}
        rules={quantityDiscountRules}
        onSaveRule={(rule) => {
          showToast(`✓ Rule saved for ${rule.productName} (${rule.minQty}-${rule.maxQty} pcs -> ${rule.discountPercent}%) [Video 10]`);
        }}
        onRemoveRule={() => {}}
        onDeleteAllForProduct={() => {}}
      />

      {/* ============================================================== */}
      {/* MODAL 26: COUPON DISCOUNT MODAL (VIDEOS 13 & 16)                */}
      {/* ============================================================== */}
      <CouponDiscountModal
        isOpen={isCouponModalOpen}
        coupons={coupons}
        cartSubtotal={grossCartTotal}
        onApplyCoupon={(coupon, disc) => {
          setAppliedCouponDisc(disc);
          showToast(`✓ Coupon "${coupon.code}" applied! Discount: ₹${disc.toFixed(2)} [Video 16]`);
        }}
        onClose={() => setIsCouponModalOpen(false)}
      />

      {/* ============================================================== */}
      {/* MODAL 27: GIFT VOUCHER REDEMPTION MODAL (VIDEO 16)              */}
      {/* ============================================================== */}
      <GiftVoucherModal
        isOpen={isGiftVoucherModalOpen}
        vouchers={giftVouchers}
        cartSubtotal={grossCartTotal - appliedCouponDisc}
        onRedeemVoucher={(voucher, redeemedAmount) => {
          setAppliedGiftVoucherDisc(redeemedAmount);
          showToast(`✓ Gift Voucher "${voucher.voucherCode}" redeemed! Amount: ₹${redeemedAmount.toFixed(2)} [Video 16]`);
        }}
        onClose={() => setIsGiftVoucherModalOpen(false)}
      />

      {/* ============================================================== */}
      {/* MODAL 28: GST E-WAY BILL LOGISTICS MODAL (VIDEOS 16 & 19)       */}
      {/* ============================================================== */}
      <EWayBillModal
        isOpen={isEWayBillModalOpen}
        currentInvoiceNo={editingOldBill ? editingOldBill.billNo : (companyInfo ? `${companyInfo.invoicePrefix || 'SHIB-'}${String(completedBills.length + 1).padStart(4, '0')}-DADDY` : 'SHIB-0138-DADDY')}
        customerName={selectedCustomer.name}
        customerGstin={selectedCustomer.gstin}
        grandTotal={netPay}
        ewayBills={ewayBills}
        onGenerateEWayBill={(newEwb) => {
          const updated = [newEwb, ...ewayBills];
          setEwayBills(updated);
          localStorage.setItem('rd_eway_bills', JSON.stringify(updated));
          showToast(`✓ E-Way Bill #${newEwb.ewayBillNo} generated successfully! [Video 19]`);
        }}
        onClose={() => setIsEWayBillModalOpen(false)}
      />

      {/* ============================================================== */}
      {/* MODAL 29: ELECTRONIC WEIGHING SCALE TERMINAL (VIDEO 20)         */}
      {/* ============================================================== */}
      <WeighingScaleModal
        isOpen={isWeighingScaleModalOpen}
        productName={cart.length > 0 ? cart[0].name : 'Loose Timber / Material'}
        ratePerKg={cart.length > 0 ? (cart[0].rate || 100) : 120}
        onApplyWeightItem={(weightKg, amount) => {
          if (cart.length > 0) {
            const updated = [...cart];
            updated[0] = {
              ...updated[0],
              qty: weightKg,
              total: amount,
              taxable: amount
            };
            setCart(updated);
            showToast(`✓ Scale weight ${weightKg} KG (₹${amount}) applied to ${updated[0].name} [Video 20]`);
          } else {
            showToast(`✓ Scale reading: ${weightKg} KG = ₹${amount}. Add product to cart to apply.`);
          }
        }}
        onClose={() => setIsWeighingScaleModalOpen(false)}
      />
    </div>
  );
}
