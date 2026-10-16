export interface Product {
  id: string;
  pCode: string; // e.g. "P-1521"
  name: string;
  purchasePrice: number;
  cessPercent: number;
  openingStock: number;
  barcode: string; // Internal (e.g. "3748") or EAN-13 (e.g. "3068320080000")
  mrp: number;
  retailPrice: number;
  wholesalePrice?: number;
  batch?: string;
  mfgDate?: string;
  expDate?: string;
  size?: string;
  colour?: string;
  imei1?: string;
  imei2?: string;
  kitchen?: string;
  category: string;
  subCategory?: string;
  description?: string;
  discount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  salesUnit?: string;
  salesAltUnit?: string;
  conv?: number;
  minStock?: number;
  salesmanCommission?: number;
  status?: string;
  sTax?: 'Inclusive' | 'Exclusive';
  pTax?: 'Inclusive' | 'Exclusive';
  godown?: string; // e.g. "Block 5"
  rack?: string;   // e.g. "Rack 7"
  hsn?: string;
  photo?: string;
  loyaltyValue?: number;
  loyaltyType?: string;
  variants?: ProductVariant[];
  batches?: ProductBatch[];
}

export interface SaleReturnItem {
  id: string;
  productId: string;
  pCode: string;
  barcode: string;
  name: string;
  hsn: string;
  qty: number;
  salesRate: number;
  discountPercent: number;
  discountAmt: number;
  taxableAmt: number;
  cgstPercent: number;
  cgstAmt: number;
  sgstPercent: number;
  sgstAmt: number;
  igstPercent: number;
  igstAmt: number;
  total: number;
}

export interface SaleReturnVoucher {
  id: string;
  returnNo: string; // e.g. "SHIB-0003-2024/25"
  date: string;     // e.g. "26/02/2025"
  taxType: string;  // "GST"
  originalInvoiceNo: string; // e.g. "SHIB-0059-DADDY"
  customerId: string;
  customerName: string;
  items: SaleReturnItem[];
  billDiscount: number;
  total: number;
  roundOff: number;
  grandTotal: number;
  paymentMode: 'Cash' | 'Credit' | 'Adjust';
  status: 'ACTIVE' | 'ADJUSTED';
}

export interface ProductBatch {
  id: string;
  productId?: string;
  batchNo: string;
  barcode: string;
  mrp: number;
  retailSaleRate: number;
  wholesaleSaleRate: number;
  purchaseRate: number;
  purchaseRateGst: number;
  availableQty: number;
  colour?: string;
  size?: string;
  info?: string;
  purchaseDate?: string;
}

export interface PosProductInfoConfig {
  productParameterEnabled: boolean;
  stockLimitAlert: boolean;
  negativeStockAlert: boolean;
  itemSpeedEntry1: boolean;
  itemSpeedEntry2: boolean;
  imeiSerialNo: boolean;
  editProductInfo: boolean;
  productImageShow: boolean;
  upiQrCodePrint: boolean;
  lastInvoiceAmt: number;
  narration: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  pCode: string;
  barcode: string;
  size: string;
  colour: string;
  qty: number;
  mrp: number;
  retailPrice: number;
}

export interface ProductDefaultConfig {
  subCategory: string;
  isDefaultSubCategory: boolean;
  unit: string;
  isDefaultUnit: boolean;
  gstRate: number;
  isDefaultGstRate: boolean;
  sTax: 'Inclusive' | 'Exclusive';
  pTax: 'Inclusive' | 'Exclusive';
  pointsPerSale: number;
}

export interface Category {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface SubCategory {
  id: string;
  name: string;
  category: string;
  isDefault?: boolean;
  photo?: string;
}

export interface ColumnVisibilityConfig {
  wSalePrice: boolean;
  batch: boolean;
  mfgDate: boolean;
  expDate: boolean;
  size: boolean;
  colour: boolean;
  imei1: boolean;
  imei2: boolean;
  kitchen: boolean;
  category_plus: boolean;
  subcategory_plus: boolean;
  description: boolean;
  discount: boolean;
  gst_plus: boolean;
  cgst: boolean;
  sgst: boolean;
  igst: boolean;
  salesUnit: boolean;
  salesAltUnit: boolean;
  conv: boolean;
  minStock: boolean;
  status: boolean;
  sTax: boolean;
  pTax: boolean;
  godown: boolean;
  rack: boolean;
  hsn: boolean;
  photo: boolean;
  variantButton: boolean;
  updateButtonColumn: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  pCode: string;
  name: string;
  hsn: string;
  barcode: string;
  qty: number;
  rate: number; // Retail or Wholesale based on toggle
  mrp: number;
  purchasePrice: number;
  discPercent: number;
  discAmt: number;
  discType?: '%' | 'Amt';
  taxable: number;
  cgstPercent: number;
  sgstPercent: number;
  igstPercent: number;
  cgstAmt: number;
  sgstAmt: number;
  igstAmt: number;
  total: number;
  salesman: string;
  commissionPercent: number;
  commissionAmt: number;
  stockId: string;
  points: number;
  batch?: string;
  expDate?: string;
  godown?: string;
  rack?: string;
  size?: string;
  colour?: string;
  unit?: string;
  isAltUnit?: boolean;
  conv?: number;
  stockDeductQty?: number;
  photo?: string;
  cessPercent?: number;
  cessAmt?: number;
  serialNos?: string[]; // Video 16 Frame 0260 & 0275 serial number tracking
  productName?: string;
}

export interface ProductSerial {
  id: string;
  productId?: string;
  productCode: string;
  productName: string;
  barcode: string;
  serialNo: string;
  status: 'InStock' | 'Sold' | 'AVAILABLE';
  purchaseInvoiceNo?: string;
  saleInvoiceNo?: string;
  addedDate?: string;
  purchaseDate?: string;
  supplierName?: string;
}

export interface EstimateRecord {
  id: string;
  estimateNo: string; // e.g. "ESTM-0001-2024/25" (Frame 0025)
  date: string;
  customerId: string;
  customerName: string;
  contactNo: string;
  phone?: string;
  address?: string;
  state: string;
  gstin?: string;
  remarks?: string;
  items: CartItem[];
  subTotal: number;
  totalDiscount: number;
  roundOff: number;
  grandTotal: number;
}

export interface SalesRegisterBill {
  id: string;
  billNo: string; // e.g. "SHIB-0038-DADDY" (Frame 0150)
  date: string; // e.g. "06/11/2024" (Frame 0155)
  customerName: string;
  gstin: string;
  billAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  otherAmount: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  state: string; // 'Kerala' | 'Karnataka' | 'Tamil Nadu' etc.
  address?: string;
  city?: string;
  postalCode?: string;
  email?: string;
  gstin?: string; // e.g. "32AAAAA0000A1Z5"
  cin?: string;
  pan?: string;
  balance: number; // positive = credit/receivable
  loyaltyPoints: number;
  loyaltyEnabled?: boolean;
  tcsApplied?: boolean;
  creditLimit?: number;
  route?: string;
  turnAroundDays?: number;
  bankName?: string;
  accountNo?: string;
  accountName?: string;
  branch?: string;
  ifsc?: string;
  photo?: string;
}

export interface CompanyInfo {
  name: string;
  companyName?: string;
  address: string;
  city: string;
  state: string;
  contactNo: string;
  phone?: string;
  pincode?: string;
  pan?: string;
  email: string;
  gstin: string;
  cin?: string;
  website?: string;
  bankName?: string;
  accountName?: string;
  accountNo?: string;
  branch?: string;
  ifsc?: string;
  loyaltyPerPointValue: number;
  currencySymbol: string;
  barcodeCode?: string;
  companyId: string;
  logo?: string;
  multiBranchEnabled?: boolean;
}

export interface DSaleItem {
  id: string;
  code: string; // e.g. INVD-0001
  productName: string;
  qty: number;
  unit: string;
  rate: number;
  discPercent: number;
  discAmt: number;
  total: number;
  totalMrp: number;
}

export interface DSaleBill {
  id: string;
  invoiceNo: string; // INVD-0001
  date: string;
  customerName: string;
  items: DSaleItem[];
  totalQty: number;
  grandTotal: number;
  totalPaid: number;
  balance: number;
  paymentMode: 'CASH' | 'UPI' | 'CARD';
}

export type BillPaperFormat = '3INCH' | 'A4' | 'A5' | 'A4_PINK_GST' | 'QUOTATION' | 'BILL_OF_SUPPLY';

export interface BillTemplateConfig {
  paperFormat: BillPaperFormat;
  styleIndex: number; // 1 to 10
  printerName: string;
  upiId?: string;
  showDynamicQr: boolean;
}

export type TaxScheme = 'GST' | 'NON_GST' | 'COMPOSITION';

export interface PettyExpense {
  id: string;
  voucherNo: string;
  date: string;
  category: string; // Refreshment, Fuel, Freight, Stationery
  amount: number;
  paidTo: string;
  remarks: string;
}

export interface StockAdjustment {
  id: string;
  date: string;
  productName: string;
  barcode: string;
  bookStock: number;
  physicalStock: number;
  adjustmentQty: number; // physical - book
  reason: 'Damage' | 'Shrinkage' | 'Expiry' | 'Audit Discrepancy' | 'Opening Balance Correction';
  approvedBy: string;
}

// ==========================================
// VIDEO 20: SALE PANEL FEATURES PART 2 TYPES
// ==========================================

export interface HeldCart {
  id: string;
  holdNo: string; // e.g. H-0001 (Frame 197)
  holdDate: string; // 22/02/2025
  taxType: string; // 'NON GST' | 'GST' | 'COMPOSITION'
  customerName: string; // e.g. SUMESH_9898989898
  contactNo: string;
  items: CartItem[];
  totalAmount: number;
  priceMode: 'RETAIL' | 'WHOLESALE';
}

export interface DocumentPrefixSuffix {
  prefix: string;
  suffix: string;
}

export interface PrefixSuffixConfig {
  saleInvoice: DocumentPrefixSuffix;
  purchaseInvoice: DocumentPrefixSuffix;
  saleReturnInvoice: DocumentPrefixSuffix;
  purchaseReturnInvoice: DocumentPrefixSuffix;
  quotationInvoice: DocumentPrefixSuffix;
  purchaseOrderInvoice: DocumentPrefixSuffix;
  receiptInvoice: DocumentPrefixSuffix;
  paymentInvoice: DocumentPrefixSuffix;
  incomeInvoice: DocumentPrefixSuffix;
  expenseInvoice: DocumentPrefixSuffix;
  estimateInvoice: DocumentPrefixSuffix;
}

export interface PaymentSplitLine {
  id: string;
  mode: 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'CREDIT';
  modeName?: string; // Video 14 Display label e.g. "Google Pay", "Paytm", "By Cash" (Frame 0410)
  amount: number;
  bankAccountId?: string;
  bankAccountName?: string;
  creditDays?: number; // 7, 15, 30, 60, 90, 120, 180, 0 for adjust
  date: string;
  refNo?: string;
}

export interface BankRecord {
  id: string;
  name: string; // e.g. SBI (Frame 272)
  code?: string;
}

export interface BranchRecord {
  id: string;
  bankName: string;
  branchName: string; // e.g. Vaikom
  address: string;
  contactNo: string;
  ifsc: string; // e.g. SBIN0070123
  branchCode: string;
}

export interface BankAccountRecord {
  id: string;
  accountNo: string;
  accountName: string;
  accountType: 'Current Account' | 'Savings Account';
  bankName: string;
  branchName: string;
  balance: number;
}

export interface CustomerReceiptEntry {
  id: string;
  transactionNo: string; // RCPT-0002-2024/25 (Frame 331)
  transactionDate: string;
  customerId: string;
  customerName: string;
  paymentMode: 'By Cash' | 'By Cheque' | 'By Bank Transfer' | 'By UPI';
  bankAccountId?: string;
  amount: number;
  remarks: string;
}

export interface CustomerLedgerEntry {
  id: string;
  customerId: string;
  date: string;
  voucherNo: string; // SINV-0028-DADDY or RCPT-0002-2024/25
  particulars: 'Sales' | 'Receipt' | 'Opening Balance' | 'Sales Return';
  debit: number;
  credit: number;
}

export interface OldBillRecord {
  id: string;
  invoiceNo: string;
  date: string;
  customerName: string;
  contactNo: string;
  totalQty: number;
  netPay: number;
  items: CartItem[];
  paymentMode?: string;
}

export interface SalesmanRecord {
  id: string;
  code: string; // e.g. SM-0001, SM-0002, SM-0003
  name: string; // e.g. Sukumar, Madhu, Ashok
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  photo?: string;
  commissionRate: number; // default %
  balance: number; // running Cr balance
}

export interface SalesmanPaymentVoucher {
  id: string;
  voucherNo: string; // RCPT-0001-2024/25
  date: string;
  salesmanId: string;
  salesmanName: string;
  amount: number;
  paymentMode: 'By Cash' | 'By Cheque' | 'By Bank Transfer' | 'By UPI';
  referenceNo?: string;
  remarks: string;
}

export interface SalesmanLedgerEntry {
  id: string;
  salesmanId: string;
  date: string;
  account: string; // Sukumar or Cash Account
  voucherNo: string; // SINV-0036-DADDY-... or RCPT-0001-2024/25
  voucherType: 'Sales' | 'SalesMan_Payment' | 'Opening Balance';
  particulars: string;
  debit: number;
  credit: number;
  balance?: number;
}

export interface StockAlertConfig {
  negativeStockAlert: boolean;
  minimumStockAlert: boolean;
}

export type ActiveWorkspace =
  | 'DESKTOP_HOME'
  | 'PRODUCT_ADD_SMART'
  | 'SALE_POS'
  | 'RUBIC_POS'
  | 'PURCHASE_INWARD'
  | 'STOCK_AUDIT'
  | 'STOCK_IN_HAND'
  | 'CUSTOMER_LEDGER'
  | 'PETTY_EXPENSES'
  | 'BARCODE_DESIGNER'
  | 'EXPIRY_REPORT'
  | 'TAX_REPORT_GST'
  | 'SALES_INVOICE_REPORT'
  | 'D_SALE_REPORT'
  | 'QUOTATION'
  | 'ESTIMATE_DELIVERY'
  | 'SALES_REGISTER_BILL_WISE';

export interface TerminalConfig {
  terminalId: string;
  printerName: string;
  invoiceTemplate: 'Thermal Printer' | 'A4 GST Tax Invoice (Pink Band)' | 'A4/A5 Standard GST Invoice' | 'Quotation Format' | 'Bill of Supply' | 'Estimate / Delivery Note';
  cashDrawerActive: boolean;
  weightMachinePort: string;
  weightMachineActive: boolean;
  customerDisplayPort: string;
  customerDisplayActive: boolean;
  customerSecondaryDisplay: boolean;
  secondaryBaudRate: string;
  qrDisplayPort: string;
  qrDisplayActive: boolean;
  upiId: string;
  brandName: string;
  showMenuItemImages: boolean;
}

export interface TillRecord {
  id: string;
  tillId: string;
  printerName: string;
  invoiceTemplate: string;
}

export interface QuotationRecord {
  id: string;
  quotationNo: string;
  date: string;
  customerId: string;
  customerName: string;
  contactNo: string;
  state: string;
  gstin?: string;
  remarks?: string;
  items: CartItem[];
  subTotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  totalDiscount: number;
  roundOff: number;
  grandTotal: number;
}

// Video 12 Feature: Combo Pack Master & Bundling Engine (Frames 0446 & 0460)
export interface ComboPackItem {
  id: string;
  productId: string;
  productName: string;
  barcode: string;
  qty: number;
  rate: number;
  mrp: number;
  unit?: string;
}

export interface ComboPack {
  id: string;
  name: string; // e.g. "7 Std Books", "10 Std Books"
  bundleName?: string;
  barcode: string; // e.g. "CO1001", "CO1002"
  bundleBarcode?: string;
  qrCode?: string;
  items: ComboPackItem[];
  totalAmount: number;
  createdDate: string;
}

// Video 12 Feature: Invoice SMS Gateway Setting (Frame 0100)
export interface SmsConfig {
  apiUrl: string;
  isEnabled: boolean;
  isDefault: boolean;
  autoSmsEnabled: boolean;
  senderId: string;
}

// Video 12 Feature: Invoice Email Setting (Frame 0108)
export interface EmailConfig {
  serverName: 'Gmail' | 'Yahoo' | 'Rediffmail' | 'Hotmail(Outlook)';
  smtpAddress: string;
  emailId: string;
  password?: string;
  port: number;
  tlsSslRequired: 'Yes' | 'No';
  isDefault: boolean;
  isEnabled: boolean;
}

// Video 12 Feature: 3-Channel WhatsApp Dispatch (Frames 0128 & 0478)
export interface WhatsAppChannelConfig {
  tejasActive: boolean;
  rocketActive: boolean;
  agniActive: boolean;
  defaultChannel: 'Tejas' | 'Rocket' | 'Agni';
  shopPhone: string;
  apiKey?: string;
  messageTemplate: string;
}


