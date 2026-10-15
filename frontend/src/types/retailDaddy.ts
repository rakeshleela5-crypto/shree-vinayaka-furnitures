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
  status?: string;
  sTax?: 'Inclusive' | 'Exclusive';
  pTax?: 'Inclusive' | 'Exclusive';
  godown?: string; // e.g. "Block 5"
  rack?: string;   // e.g. "Rack 7"
  hsn?: string;
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
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  state: string; // 'Kerala' | 'Karnataka' | 'Tamil Nadu' etc.
  address?: string;
  balance: number; // positive = credit/receivable
  loyaltyPoints: number;
}

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
  | 'BARCODE_DESIGNER';
