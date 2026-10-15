export type TaxType = 'GST' | 'COMPOSITION' | 'NON_GST';
export type PriceMode = 'RETAIL' | 'WHOLESALE' | 'SPECIAL';
export type DiscountType = 'PERCENT' | 'FLAT';
export type BalanceType = 'DR' | 'CR';
export type BillDesignStyle = '3inch-style1' | '3inch-style2' | '3inch-style3-hindi' | 'a4-gst' | 'a5-slip';

export interface Customer {
  id: string;
  code: string; // e.g. "C-0105"
  name: string;
  contactNo: string;
  email?: string;
  gstin?: string;
  pan?: string;
  cin?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  sameAddress: boolean;
  shippingAddress: string;
  openingBalance: number;
  balanceType: BalanceType;
  currentBalance: number;
  loyaltyPoints: number;
  loyaltyEnabled: boolean;
  remarks?: string;
  tcsApplied: string;
  bankName?: string;
  accountNo?: string;
  ifsc?: string;
}

export interface ProductItem {
  id: string;
  code: string;
  barcode: string;
  name: string;
  regionalName?: string;
  category: string;
  subcategory?: string;
  hsn: string;
  mrp: number;
  retailPrice: number;
  wholesalePrice: number;
  specialPrice: number;
  unit: string;
  altUnit?: string;
  conversionFactor?: number;
  stock: number;
  minStock?: number;
  taxRate: number; // e.g. 0, 5, 12, 18, 28
  cessRate?: number;
  purchasePrice?: number;
  size?: string;
  color?: string;
  batchNo?: string;
  isWeighing?: boolean;
  isCombo?: boolean;
  isSerial?: boolean;
  isBatch?: boolean;
  isDsale?: boolean;
  isSlabGst?: boolean;
  slabThreshold?: number;
  mfgDate?: string;
  expDate?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  code: string;
  barcode: string;
  name: string;
  regionalName?: string;
  hsn: string;
  qty: number;
  unit: string;
  altUnit?: string;
  mrp: number;
  rate: number;
  purchasePrice?: number;
  size?: string;
  color?: string;
  batchNo?: string;
  mfgDate?: string;
  expDate?: string;
  discountType: DiscountType;
  discountValue: number;
  discountAmt: number;
  taxableAmt: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmt: number;
  sgstAmt: number;
  igstAmt: number;
  cessRate?: number;
  cessAmt?: number;
  isSlabGst?: boolean;
  total: number;
  salesmanId?: string;
  salesmanName?: string;
  salesmanCommissionPct?: number;
  commissionAmt?: number;
  stockId?: string;
  points?: number;
  serialNumber?: string;
}

export interface VisibleColumnsConfig {
  barcode: boolean;
  hsn: boolean;
  cgstRate: boolean;
  cgstAmt: boolean;
  sgstRate: boolean;
  sgstAmt: boolean;
  igstRate: boolean;
  igstAmt: boolean;
  cessRate: boolean;
  cessAmt: boolean;
  total: boolean;
  purchasePrice: boolean;
  margin: boolean;
  description: boolean;
  tempQty: boolean;
  serialNumber: boolean;
  mrp: boolean;
  taxableAmt: boolean;
  mfgDate: boolean;
  expDate: boolean;
  size: boolean;
  color: boolean;
  altUnit: boolean;
  salesman: boolean;
  commission: boolean;
}

export const DEFAULT_VISIBLE_COLUMNS: VisibleColumnsConfig = {
  barcode: true,
  hsn: true,
  cgstRate: true,
  cgstAmt: false,
  sgstRate: true,
  sgstAmt: false,
  igstRate: false,
  igstAmt: false,
  cessRate: false,
  cessAmt: false,
  total: true,
  purchasePrice: false,
  margin: false,
  description: false,
  tempQty: false,
  serialNumber: false,
  mrp: false,
  taxableAmt: true,
  mfgDate: false,
  expDate: false,
  size: false,
  color: false,
  altUnit: false,
  salesman: true,
  commission: true,
};

export interface PaymentSplit {
  mode: string;
  amount: number;
  enabled: boolean;
  creditDays?: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string; // e.g. "GST-0001-2026/27"
  date: string; // YYYY-MM-DD
  time: string;
  taxType: TaxType;
  priceMode: PriceMode;
  customer: Customer;
  items: CartItem[];
  itemsCount: number;
  totalQty: number;
  billMrp: number;
  itemDiscountTotal: number;
  billDiscount: number;
  billSundry: {
    name: string;
    amount: number;
  };
  taxableTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  cessTotal: number;
  roundOff: number;
  netPay: number;
  paidAmount: number;
  pendingAmount: number;
  payments: PaymentSplit[];
  salesmanId?: string;
  status: 'PAID' | 'CREDIT' | 'PARTIAL' | 'HOLD' | 'VOID';
  designStyle: BillDesignStyle;
}

export interface Quotation {
  id: string;
  quotationNo: string;
  date: string;
  validTill: string;
  customer: Customer;
  items: CartItem[];
  netPay: number;
  salesman?: string;
  status: 'OPEN' | 'CONVERTED' | 'EXPIRED';
}

export interface HoldBill {
  id: string;
  timestamp: string;
  holdNumber: number;
  customer: Customer;
  items: CartItem[];
  billDiscount: number;
  sundry: { name: string; amount: number };
  netPay: number;
  notes?: string;
}

export interface ColumnIndexConfig {
  name: string;
  label: string;
  columnIndex: number;
  visible: boolean;
  required: boolean;
}

export interface CursorFlowConfig {
  stepIndex: number;
  field: 'barcode' | 'qty' | 'unit' | 'rate' | 'discount' | 'enterItem';
  label: string;
}

export interface BillDesignConfig {
  style: BillDesignStyle;
  companyName: string;
  addressLine1: string;
  addressLine2: string;
  contactNumber: string;
  email: string;
  gstin: string;
  stateName: string;
  upiVpa: string; // e.g. "rakeshtraders@okaxis"
  upiName: string;
  showLogo: boolean;
  logoUrl?: string;
  showSavings: boolean;
  termsAndConditions: string;
  thankYouMessage: string;
}
