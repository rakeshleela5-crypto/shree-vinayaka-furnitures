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
  partNo?: string;
  lastSoldPrice?: number;
  goodProductQty?: number;
  damageProductQty?: number;
  variants?: ProductVariant[];
  batches?: ProductBatch[];
}

export type ExpirySearchType =
  | 'Product Name'
  | 'Barcode'
  | 'Category'
  | 'Sub Category'
  | 'Part/Group'
  | 'Godown'
  | 'Rack'
  | 'Batch'
  | 'Size'
  | 'Colour'
  | 'IMEI-1'
  | 'IMEI-2';

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
  originalInvoiceNo: string; // e.g. "SVF-0059-2025"
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
  billNo: string; // e.g. "SVF-0038-2025"
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
  openingBalance?: number;
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
  barcodePrefix?: string;
  companyId: string;
  logo?: string;
  multiBranchEnabled?: boolean;
  mobileAppStatus?: 'Enabled' | 'Disabled';
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
  voucherNo: string; // SVF-SINV-0028 or RCPT-0002-2024/25
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
  voucherNo: string; // SVF-SINV-0036-... or RCPT-0001-2024/25
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
  | 'SALES_REGISTER_BILL_WISE'
  | 'CUSTOMER_PORTAL';

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

// ==========================================
// VIDEO 11: LOGIN PANEL, MULTI-COMPANY, USER CONTROL & LOCALIZATION TYPES
// ==========================================

export type UserType = 'Admin' | 'Sales Person' | 'Inventory Manager' | 'Moderator' | 'SAdmin';

export interface UserRecord {
  id: string;
  userId: string;
  userType: UserType;
  password: string;
  name: string;
  email: string;
  contactNo: string;
  isActive: boolean;
  signaturePath?: string;
  photo?: string;
  registeredDate: string;
}

export interface UserControlPermissions {
  // Column 1 (17 items)
  companyInformation: boolean;
  saleEntry: boolean;
  saleReturn: boolean;
  quotation: boolean;
  purchaseEntry: boolean;
  purchaseReturn: boolean;
  purchaseOrder: boolean;
  receipt: boolean;
  payment: boolean;
  income: boolean;
  expense: boolean;
  estimate: boolean;
  productCatalogue: boolean;
  gallery: boolean;
  autoBackup: boolean;
  reminderRecord: boolean;
  logsActivity: boolean;

  // Column 2 (17 items)
  bulkEditor: boolean;
  customerEntry: boolean;
  supplierEntry: boolean;
  salesManEntry: boolean;
  productEntry: boolean;
  inventory: boolean;
  upiQrCode: boolean;
  banking: boolean;
  records: boolean;
  reports: boolean;
  taxReport: boolean;
  exportImport: boolean;
  contraVoucher: boolean;
  offerValidation: boolean;
  generalBarcode: boolean;
  cipherBarcode: boolean;
  preSufInvoiceCode: boolean;

  // Column 3 (17 items)
  setting: boolean;
  messenger: boolean;
  chequePrint: boolean;
  mainScrnDashboard: boolean;
  balanceSheet: boolean;
  loyaltyManagement: boolean;
  service: boolean;
  androidAppMBranch: boolean;
  journalVoucher: boolean;
  damageRecoverItem: boolean;
  payrollManagement: boolean;
  cloudBackupMgmt: boolean;
  virtualCompanyInfo: boolean;
  customerRoute: boolean;
  transporter: boolean;
  weightScale: boolean;
  whatsAppFeature: boolean;
}

export interface CompanyProfile {
  id: string;
  name: string;
  contactNo: string;
  email: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  financialYear: string;
}

export type SupportedLanguage =
  | 'ENGLISH'
  | 'Bangla'
  | 'Gujarati'
  | 'Hindi'
  | 'Kannada'
  | 'Malayalam'
  | 'Marathi'
  | 'Oriya'
  | 'Punjabi'
  | 'Tamil'
  | 'Telugu'
  | 'Urdu';

// Video 10: Quantity Based Auto Discount Option [vXHCNi2e4rQ] (Frames 0071, 0090, 0100)
export interface ProductQuantityDiscountRule {
  id: string;
  pid: number | string;
  productName: string;
  barcode: string;
  minQty: number;
  maxQty: number;
  discountPercent: number;
}

// Video 08: Google Drive Cloud Backup & Disaster Recovery (Frames 0042, 0145, 0155, 0220)
export interface BackupRecord {
  id: string;
  filename: string;
  timestamp: string;
  destination: string;
  type: 'Offline' | 'Cloud' | 'Dual';
  sizeKb: number;
  itemCounts: {
    products: number;
    invoices: number;
    customers: number;
  };
}

export interface CloudflareR2Config {
  bucketName: string;
  accountId?: string;
  endpointUrl?: string;
  region: string;
  status: 'Connected' | 'Configuring' | 'Disabled';
  totalBackupsStored: number;
}

export interface AutoBackupConfig {
  destinationFolderPath: string;
  autoOfflineBackupStatus: 'Enable' | 'Disable';
  autoCloudBackupStatus: 'Enable' | 'Disable';
  cloudProvider: 'Cloudflare_R2' | 'Google_Drive' | 'Both';
  cloudflareR2: CloudflareR2Config;
  connectedGoogleAccount?: string;
  lastBackupTimestamp?: string;
  lastBackupFilename?: string;
  backupHistory: BackupRecord[];
}

export interface DatabaseSnapshot {
  version: string;
  timestamp: string;
  companyInfo: CompanyInfo;
  products: Product[];
  categories: Category[];
  subCategories: SubCategory[];
  customers: Customer[];
  bills: SalesRegisterBill[];
  users: UserRecord[];
}

// Video 07: Outstanding Analysis & Records Data Types
export type OutstandingEntity = 'CUSTOMER' | 'SUPPLIER';
export type OutstandingFilterMode = 'RECEIVABLE' | 'PAYABLE' | 'NO_DUES' | 'ALL';

export interface OutstandingRecord {
  id: string;
  entityType: OutstandingEntity;
  code: string;
  name: string;
  contactNo: string;
  address?: string;
  city?: string;
  state?: string;
  totalCredit: number;
  totalDebit: number;
  balance: number;
}

export interface SupplierPaymentRecord {
  id: string;
  voucherNo: string;
  date: string;
  supplierId: string;
  supplierName: string;
  address: string;
  contactNo: string;
  acBalance: number;
  paymentMode: 'By Cash' | 'Cheque' | 'Bank Transfer' | 'UPI / Card';
  bankAcNo?: string;
  amount: number;
  paymentDetails?: string;
}

export interface ProductRecordItem {
  id: string;
  code: string;
  name: string;
  category: string;
  subCategory: string;
  barcode: string;
  hsnCode: string;
  partNo: string;
  godown: string;
  rack: string;
  mrp: number;
  retailPrice: number;
  wholesalePrice: number;
  openingStock: number;
  currentStock: number;
  saleTaxType: 'Inclusive' | 'Exclusive';
  purchaseTaxType: 'Inclusive' | 'Exclusive';
  active: boolean;
  defaultSaleQty: number;
  colour?: string;
  size?: string;
  salesmanPercent?: number;
  loyaltyPoints?: number;
  mfgDate?: string;
  expDate?: string;
}
// Video 06: Purchase Dashboard, Dynamic Column Settings, and Serial Entry
export type PurchaseFilterCategory =
  | 'ALL'
  | 'INVOICE_NO'
  | 'SUPPLIER_INVOICE_NO'
  | 'SUPPLIER_NAME'
  | 'PRODUCT_NAME'
  | 'COLOUR'
  | 'SIZE'
  | 'BARCODE'
  | 'BATCH_SERIAL_NO';

export interface PurchaseRecordItem {
  id: string;
  invoiceNo: string; // e.g. "SHIB-0011-2024/25"
  invoiceDate: string; // "03/03/2025"
  taxType: 'GST' | 'Composition';
  supplierInvoiceNo: string; // e.g. "12345"
  supplierInvoiceDate: string; // "03/03/2025"
  supplierName: string; // "Godrej & Boyce Mfg.", "Nilambur Teak Guild"
  state: string; // "Kerala"
  gstin: string;
  productCode: string; // e.g. "GI-SL3D-PB", "GI-MOT-HB"
  productName: string; // e.g. "Godrej Interio Slimline Wardrobe", "Motion Chair"
  hsnCode: string; // e.g. "94031010", "94013000"
  barcode: string; // e.g. "8901101", "8901102"
  qty: number;
  unit: string; // "PCS", "Unit", "Box"
  purchasePrice: number;
  mrp: number;
  retailPrice: number;
  wholesalePrice: number;
  taxableAmount: number;
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  igstPercent: number;
  igstAmount: number;
  cessPercent: number;
  cessAmount: number;
  totalAmount: number;
  colour?: string; // e.g. "YELLOW", "RED", "BLUE"
  size?: string; // e.g. "DOUBLE XL", "XL", "L", "M"
  serialNumbers?: string[]; // e.g. ["12345", "123456", "1234567", "12345678", "123456789"]
  batchNo?: string;
}

export interface ProductColumnSettings {
  wSalePrice: boolean;
  batch: boolean;
  mfgDate: boolean;
  expDate: boolean;
  size: boolean;
  colour: boolean;
  imei1: boolean;
  imei2: boolean;
  kitchen: boolean;
  categoryPlus: boolean;
  subcategoryPlus: boolean;
  description: boolean;
  discount: boolean;
  gstPlus: boolean;
  cgst: boolean;
  sgst: boolean;
  igst: boolean;
  salesUnit: boolean;
  salesAltUnit: boolean;
  minStock: boolean;
  status: boolean;
  godown: boolean;
  rack: boolean;
  partNo: boolean;
}

export interface InlineNewProductData {
  pCode: string;
  name: string;
  purchasePrice: number;
  cessPercent: number;
  minStock: number;
  openingStock: number;
  barcode: string;
  mrp: number;
  retailPrice: number;
  size: string;
  colour: string;
}

// ==================== VIDEO 05 TYPES ====================
export type AccountHeadGroup =
  | 'Goods and Services Tax'
  | 'Statutory Taxes'
  | 'Expenses (Direct/Indirect)'
  | 'Fixed Assets'
  | 'Security & Deposit (Assets)'
  | 'Loan & Advance (Assets)'
  | 'Income (Direct/Indirect)'
  | 'Loan (Liability)'
  | 'Capital Account';

export interface AccountHeadItem {
  id: string;
  accountHead: string;
  underGroup: AccountHeadGroup;
}

export interface ExpenseVoucherItem {
  id: string;
  particulars: string;
  amount: number;
  notes: string;
}

export interface ExpenseVoucher {
  id: string;
  voucherNo: string; // e.g. EXP-0001-2024/25
  date: string; // DD/MM/YYYY
  name: string; // Payee (e.g. SHIBIN)
  details: string;
  items: ExpenseVoucherItem[];
  paymentMode: 'Cash' | 'Bank';
  bankAcNo?: string;
  grandTotal: number;
}

export interface IncomeVoucherItem {
  id: string;
  particulars: string;
  amount: number;
  notes: string;
}

export interface IncomeVoucher {
  id: string;
  voucherNo: string; // e.g. INCM-0001-2024/25
  date: string; // DD/MM/YYYY
  name: string; // Payer (e.g. MADHU)
  details: string;
  items: IncomeVoucherItem[];
  paymentMode: 'Cash' | 'Bank';
  bankAcNo?: string;
  grandTotal: number;
}

export interface BankStatementEntry {
  id: string;
  date: string;
  accountNo: string;
  receiptNo: string;
  description: string;
  debit: number;
  credit: number;
}

// Video 04: Stock In Hand Search Types (Frame 0420)
export type StockSearchType =
  | 'Product Name'
  | 'Barcode'
  | 'Category'
  | 'Sub Category'
  | 'Part/Group'
  | 'Godown'
  | 'Rack'
  | 'Batch'
  | 'Size'
  | 'Colour'
  | 'IMEI-1'
  | 'IMEI-2';

// Video 04: Purchase Return / Debit Note (Frame 0225)
export interface PurchaseReturnItem {
  hsnCode: string;
  productName: string;
  barcode: string;
  qty: number;
  mrp: number;
  price: number;
  discountPercent: number;
  discountAmt: number;
  cgstPercent: number;
  cgstAmt: number;
  sgstPercent: number;
  sgstAmt: number;
  igstPercent: number;
  igstAmt: number;
  cessPercent: number;
  cessAmt: number;
  total: number;
}

export interface PurchaseReturnDebitNote {
  id: string;
  prNo: string; // e.g. "SHIB-0001-2024/25"
  date: string; // e.g. "03/03/2025"
  taxType: string; // "GST"
  originalInvoiceNo: string; // e.g. "SHIB-0016-2024/25"
  reverseCharges: string; // "No"
  supplierId: string; // "S-0004"
  supplierName: string; // "Delco Engineering"
  city: string; // "vaikom"
  state: string; // "Kerala"
  contactNo: string; // "8898989898"
  items: PurchaseReturnItem[];
  billSundry: number;
  billDiscount: number;
  total: number;
  roundOff: number;
  grandTotal: number;
  paymentMode: 'Cash' | 'Bank';
}

// Video 03: Sales Return Dashboard & Purchase Return Dashboard
export type SalesReturnCategorySearchType =
  | 'Sales Return No'
  | 'Sales Invoice No'
  | 'Customer Name'
  | 'Product Name'
  | 'Barcode';

export interface SalesReturnDashboardItem {
  id: string;
  srNo: string; // e.g. "SHIB-0004-2024/25"
  srDate: string; // "03/03/2025"
  taxType: 'GST' | 'Non-GST' | 'VAT';
  salesInvoiceNo: string; // e.g. "SVF-0138-2025"
  salesInvoiceDate: string;
  customerId?: string;
  customerName: string;
  contactNo?: string;
  state: string;
  gstin?: string;
  productCode: string;
  productName: string;
  barcode: string;
  hsnCode: string;
  salesRate: number;
  returnQty: number;
  discount: number;
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  totalRefundAmt: number;
}

export type PurchaseReturnCategorySearchType =
  | 'Purchase Return No'
  | 'Purchase Invoice No'
  | 'Supplier Name'
  | 'Product Name'
  | 'Barcode';

export interface PurchaseReturnDashboardItem {
  id: string;
  prNo: string; // e.g. "SHIB-0001-2024/25"
  prDate: string; // "03/03/2025"
  taxType: 'GST' | 'Non-GST' | 'VAT';
  purchaseInvoiceNo: string; // e.g. "SHIB-0016-2024/25"
  purchaseInvoiceDate: string;
  supplierId?: string;
  supplierName: string;
  contactNo?: string;
  state: string;
  gstin?: string;
  productCode: string;
  productName: string;
  barcode: string;
  hsnCode: string;
  purchaseRate: number;
  returnQty: number;
  discount: number;
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  totalDebitAmt: number;
}

// ==========================================
// VIDEO 01: STOCK ENTRY, ADJUSTMENT & RECORDS
// ==========================================

export interface StockEntryItem {
  id: string;
  stockId: string; // e.g. "1", "2", "0003"
  date: string; // e.g. "04/03/2025"
  productId: string; // e.g. "1", "126", "127"
  productCode?: string; // e.g. "P-0001", "P-0126"
  productName: string; // e.g. "ALWAYS ULTRA THIN SMOLL", "BUGGLES CHILLY 13GM"
  barcode: string; // e.g. "650000", "650125"
  qty: number;
  unit: string; // e.g. "Pcs", "Box", "Kg"
  remarks?: string;
}

export interface StockEntryVoucher {
  id: string;
  stockId: string;
  date: string;
  remarks: string;
  items: StockEntryItem[];
}

export interface StockAdjustmentRecordItem {
  id: string;
  adjustmentId: string; // e.g. "1", "2"
  saCode?: string; // e.g. "SA-1-Y", "SA-2-Y"
  date: string; // e.g. "03/03/2025", "04/03/2025"
  productCode: string; // e.g. "P-0001", "P-0128"
  productName: string; // e.g. "ALWAYS ULTRA THIN...", "ADOL EXTRA"
  barcode: string; // e.g. "650000", "650128"
  adjustmentType: 'Plus' | 'Minus';
  qty: number;
  reason: string;
}

export interface PurchaseInvoiceListItem {
  id: string;
  invoiceNo: string; // e.g. "SHIB-0002-2024/25"
  date: string; // "24/02/2025"
  referenceNo: string; // e.g. "REF-001"
  reverseCharges: 'Yes' | 'No';
  purchaseType: 'Credit' | 'Cash';
  taxType: 'GST' | 'Non-GST' | 'Composition';
  supplierInvoiceNo?: string; // e.g. "12345"
  supplierInvoiceDate?: string;
  supplierId: string; // e.g. "S-0001"
  supplierName: string; // "abc", "Delco Engineering", "Gindal supplier"
  subTotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  roundOff: number;
  grandTotal: number;
}

// ==========================================
// MASTER & OPERATIONAL MODELS (VIDEOS 06-19)
// ==========================================

// Video 06 & 07: Formal Supplier Master Model
export interface Supplier {
  id: string;
  code: string; // e.g. "S-0001"
  name: string; // e.g. "Delco Engineering"
  companyName?: string;
  gstin?: string;
  state: string; // e.g. "Kerala"
  stateCode?: string; // e.g. "32"
  contactNo: string;
  email?: string;
  address?: string;
  city?: string;
  pincode?: string;
  bankName?: string;
  bankAcNo?: string;
  bankIfsc?: string;
  bankBranch?: string;
  creditPeriodDays?: number;
  openingBalance: number;
  balanceType: 'Dr' | 'Cr';
  currentBalance: number;
  active: boolean;
}

// Video 16: Delivery Note & Dispatch Challan Model
export interface DeliveryNoteRecord {
  id: string;
  deliveryNoteNo: string; // e.g. "DN-0001-2024/25"
  date: string;
  customerId: string;
  customerName: string;
  contactNo: string;
  deliveryAddress: string;
  city?: string;
  state: string;
  gstin?: string;
  vehicleNo?: string;
  transporterName?: string;
  driverName?: string;
  driverPhone?: string;
  status: 'Draft' | 'Dispatched' | 'Delivered' | 'Invoiced';
  invoiceNo?: string;
  items: CartItem[];
  subTotal: number;
  grandTotal: number;
  remarks?: string;
}

// Video 13 & 16: Promotional Scheme, Coupon & Voucher Models
export interface CouponRule {
  id: string;
  code: string; // e.g. "FURNITURE50"
  title: string;
  discountType: 'Percentage' | 'FlatAmount';
  discountValue: number;
  minBillAmount: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
}

export interface GiftVoucherRecord {
  id: string;
  voucherCode: string; // e.g. "GIFT-1000"
  title: string;
  denomination: number; // e.g. 500, 1000, 2500
  issueDate: string;
  expiryDate: string;
  issuedToCustomerId?: string;
  issuedToCustomerName?: string;
  status: 'Active' | 'Redeemed' | 'Expired';
  redeemedDate?: string;
  redeemedBillNo?: string;
}

// Video 09 & 13: Customer Loyalty Ledger & Transaction History Model
export interface LoyaltyTransaction {
  id: string;
  date: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  billNo: string;
  type: 'Earned' | 'Redeemed' | 'Adjusted' | 'Expired';
  billAmount: number;
  points: number;
  pointValueRate: number; // e.g. 0.10
  equivalentAmount: number;
  balancePointsAfter: number;
  remarks?: string;
}

// Video 11: Multi-Company Tenant & Enterprise Switching Model
export interface CompanyTenant {
  id: string;
  code: string; // e.g. "COMP-01"
  companyName: string; // e.g. "Shree Vinayaka Furnitures", "Godrej Interio Commercial"
  legalName?: string;
  gstin?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  currencySymbol: string; // "₹", "$", "Rs."
  financialYear: string; // "2024-2025"
  logo?: string;
  dbKey: string;
  isDefault: boolean;
  active: boolean;
}

// Video 09 & 15: Barcode Label Sheet & Continuous Roll Template Model
export interface BarcodeTemplateDesign {
  id: string;
  name: string; // "24-Label A4", "40-Label A4", "Single Roll 50x25mm"
  paperType: 'A4_Sheet' | 'Continuous_Roll';
  labelsAcross: number;
  labelsDown: number;
  labelWidthMm: number;
  labelHeightMm: number;
  showShopName: boolean;
  showProductName: boolean;
  showMrp: boolean;
  showRetailPrice: boolean;
  showBarcodeNumber: boolean;
  showSizeColour: boolean;
  barcodeType: 'CODE128' | 'EAN13';
}

// Video 16 & 19: GST E-Way Bill Logistics Model
export interface EWayBillRecord {
  id: string;
  ewayBillNo: string; // e.g. "231004928172"
  ewayBillDate: string;
  invoiceNo: string;
  invoiceDate: string;
  customerId: string;
  customerName: string;
  customerGstin?: string;
  fromPlace: string;
  toPlace: string;
  pinToPinDistanceKm: number;
  transporterId: string; // Transporter GSTIN or TRANSIN
  transporterName: string;
  transportMode: 'Road' | 'Rail' | 'Air' | 'Ship';
  vehicleNo: string;
  vehicleType: 'Regular' | 'OverDimensional';
  status: 'Generated' | 'Cancelled' | 'Expired';
  validUntil: string;
}

