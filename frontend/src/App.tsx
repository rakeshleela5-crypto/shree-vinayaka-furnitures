import { useState, useEffect } from 'react';
import './styles/retailDaddy.css';
import type {
  Product,
  Category,
  SubCategory,
  ColumnVisibilityConfig,
  Customer,
  PettyExpense,
  StockAdjustment,
  ActiveWorkspace,
  CompanyInfo,
  DSaleBill,
  BillTemplateConfig,
  HeldCart,
  PrefixSuffixConfig,
  BankRecord,
  BranchRecord,
  BankAccountRecord,
  CustomerReceiptEntry,
  CustomerLedgerEntry,
  OldBillRecord,
  SalesmanRecord,
  SalesmanPaymentVoucher,
  SalesmanLedgerEntry,
  StockAlertConfig,
  TerminalConfig,
  TillRecord,
  QuotationRecord,
  EstimateRecord,
  ProductSerial,
  SalesRegisterBill,
  UserRecord,
  UserControlPermissions,
  CompanyProfile,
  SupportedLanguage,
  ProductQuantityDiscountRule,
  AutoBackupConfig,
  DatabaseSnapshot,
  OutstandingRecord,
  OutstandingEntity,
  ProductRecordItem,
  PurchaseRecordItem,
  AccountHeadItem,
  ExpenseVoucher,
  IncomeVoucher,
  BankStatementEntry,
  PurchaseReturnDebitNote,
  SalesReturnDashboardItem,
  PurchaseReturnDashboardItem,
  StockEntryItem,
  StockAdjustmentRecordItem,
  PurchaseInvoiceListItem,
  SmsConfig,
  EmailConfig
} from './types/retailDaddy';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_SUBCATEGORIES,
  INITIAL_CUSTOMERS,
  INITIAL_EXPENSES,
  INITIAL_STOCK_ADJUSTMENTS,
  DEFAULT_COLUMN_CONFIG,
  DEFAULT_COMPANY_INFO,
  INITIAL_D_SALE_BILLS,
  DEFAULT_BILL_CONFIG,
  DEFAULT_PREFIX_SUFFIX_CONFIG,
  INITIAL_HELD_CARTS,
  INITIAL_BANKS,
  INITIAL_BRANCHES,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_CUSTOMER_LEDGER,
  INITIAL_CUSTOMER_RECEIPTS,
  INITIAL_OLD_BILLS,
  INITIAL_SALESMEN,
  INITIAL_SALESMAN_VOUCHERS,
  INITIAL_SALESMAN_LEDGER,
  DEFAULT_STOCK_ALERT_CONFIG,
  DEFAULT_TERMINAL_CONFIG,
  INITIAL_TILLS,
  INITIAL_QUOTATIONS,
  INITIAL_ESTIMATES,
  INITIAL_PRODUCT_SERIALS,
  INITIAL_SALES_REGISTER_BILLS,
  INITIAL_USERS,
  INITIAL_USER_PERMISSIONS,
  INITIAL_COMPANIES,
  COMPANY_PRODUCTS_MAP,
  DEFAULT_USER_PERMISSIONS_ALL,
  INITIAL_QUANTITY_DISCOUNT_RULES,
  DEFAULT_AUTO_BACKUP_CONFIG,
  INITIAL_CUSTOMER_OUTSTANDING,
  INITIAL_SUPPLIER_OUTSTANDING,
  INITIAL_PRODUCT_RECORDS,
  INITIAL_PURCHASE_RECORDS,
  INITIAL_ACCOUNT_HEADS,
  INITIAL_EXPENSE_VOUCHERS,
  INITIAL_INCOME_VOUCHERS,
  INITIAL_BANK_STATEMENT_ENTRIES,
  INITIAL_SALES_RETURN_RECORDS,
  INITIAL_PURCHASE_RETURN_RECORDS
} from './data/retailDaddyData';
import {
  INITIAL_STOCK_ENTRY_RECORDS,
  INITIAL_STOCK_ADJUSTMENT_RECORDS,
  INITIAL_PURCHASE_LIST_ITEMS
} from './data/retailDaddyStockData';

import { DesktopHeader } from './components/desktop/DesktopHeader';
import { DesktopStatusBar } from './components/desktop/DesktopStatusBar';
import { DesktopHomeView } from './components/desktop/DesktopHomeView';
import { ProductAddSmartView } from './components/products/ProductAddSmartView';
import { SalePosView } from './components/pos/SalePosView';
import { BarcodeDesignerView } from './components/barcode/BarcodeDesignerView';
import { CustomerShowroomPortalView } from './components/portal/CustomerShowroomPortalView';
import { StockInHandView } from './components/inventory/StockInHandView';
import { CustomerLedgerView } from './components/customers/CustomerLedgerView';
import { StockAuditView } from './components/inventory/StockAuditView';
import { PettyExpensesView } from './components/expenses/PettyExpensesView';
import { PurchaseInwardView } from './components/purchase/PurchaseInwardView';
import { ExpiryProductReportView } from './components/reports/ExpiryProductReportView';
import { TaxReportGstView } from './components/reports/TaxReportGstView';
import { SalesInvoiceReportView } from './components/reports/SalesInvoiceReportView';
import { DSaleReportView } from './components/reports/DSaleReportView';
import { CompanyMasterModal } from './components/master/CompanyMasterModal';
import { BankingMasterModal } from './components/master/BankingMasterModal';
import { PrefixSuffixSettingsModal } from './components/settings/PrefixSuffixSettingsModal';
import { ReceiptEntryModal } from './components/customers/ReceiptEntryModal';
import { OutstandingBalanceReportModal } from './components/reports/OutstandingBalanceReportModal';
import { ProductBulkEditorModal } from './components/products/ProductBulkEditorModal';
import { SalePriceEditModal } from './components/products/SalePriceEditModal';
import { SalesmanPaymentModal } from './components/master/SalesmanPaymentModal';
import { SalesmanLedgerModal } from './components/reports/SalesmanLedgerModal';
import { TerminalSettingModal } from './components/settings/TerminalSettingModal';
import { QuotationView } from './components/pos/QuotationView';
import { EstimateDeliveryNoteView } from './components/pos/EstimateDeliveryNoteView';
import { SalesRegisterBillWiseView } from './components/reports/SalesRegisterBillWiseView';
import { LoginModal } from './components/auth/LoginModal';
import { UserRegistrationModal } from './components/auth/UserRegistrationModal';
import { UserControlModal } from './components/auth/UserControlModal';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
import { CreateCompanyModal } from './components/auth/CreateCompanyModal';
import { VirtualKeyboard } from './components/common/VirtualKeyboard';
import { ProductDiscountSettingModal } from './components/inventory/ProductDiscountSettingModal';
import { AutoBackupModal } from './components/settings/AutoBackupModal';
import { CloudBackupOverlay } from './components/common/CloudBackupOverlay';
import { DatabaseRestoreModal } from './components/database/DatabaseRestoreModal';
import { CustomerRecordModal } from './components/records/CustomerRecordModal';
import { SupplierRecordModal } from './components/records/SupplierRecordModal';
import { OutstandingAnalysisModal } from './components/records/OutstandingAnalysisModal';
import { SupplierPaymentModal } from './components/records/SupplierPaymentModal';
import { ProductRecordModal } from './components/records/ProductRecordModal';
import { ExpiryProductRecordModal } from './components/records/ExpiryProductRecordModal';
import { ProductBulkEditorModal as FullProductBulkEditorModal } from './components/utilities/ProductBulkEditorModal';
import { PurchaseDashboardModal } from './components/records/PurchaseDashboardModal';
import { AccountHeadModal } from './components/accounting/AccountHeadModal';
import { ExpenseVoucherModal } from './components/accounting/ExpenseVoucherModal';
import { IncomeVoucherModal } from './components/accounting/IncomeVoucherModal';
import { ExpensesDashboardModal } from './components/accounting/ExpensesDashboardModal';
import { IncomeDashboardModal } from './components/accounting/IncomeDashboardModal';
import { BankStatementModal } from './components/banking/BankStatementModal';
import { StockInHandModal } from './components/inventory/StockInHandModal';
import { SalesReturnModal } from './components/sales/SalesReturnModal';
import { PurchaseReturnModal } from './components/purchases/PurchaseReturnModal';
import { SalesReturnDashboardModal } from './components/records/SalesReturnDashboardModal';
import { PurchaseReturnDashboardModal } from './components/records/PurchaseReturnDashboardModal';
import { StockEntryModal } from './components/inventory/StockEntryModal';
import { StockEntryRecordModal } from './components/records/StockEntryRecordModal';
import { StockAdjustmentEntryModal } from './components/inventory/StockAdjustmentEntryModal';
import { StockAdjustmentRecordModal } from './components/records/StockAdjustmentRecordModal';
import { PurchaseRecordModal } from './components/records/PurchaseRecordModal';
import { PurchaseReturnRecordModal } from './components/records/PurchaseReturnRecordModal';
import { RubicPosModal } from './components/pos/RubicPosModal';
import { SmsSettingModal } from './components/settings/SmsSettingModal';
import { EmailSettingModal } from './components/settings/EmailSettingModal';
import { api, mapBackendProductToFrontend, mapBackendCustomerToFrontend } from './api/client';

export default function App() {
  // 1. Persistent Master State
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('rd_products');
    if (!saved) return INITIAL_PRODUCTS;
    try {
      const parsed: Product[] = JSON.parse(saved);
      // Auto-purge outdated grocery/bakery/garments demo items
      const hasOutdatedData = parsed.some(p => 
        p.category === 'Vegetables' || 
        p.category === 'GROCERY' || 
        p.category === 'BAKERY' || 
        p.category === 'GARMENTS' ||
        p.name.includes('Tomoto') || 
        p.name.includes('Rawabi') ||
        p.name.toUpperCase().includes('SHIRT') ||
        p.name.toUpperCase().includes('SAREE') ||
        p.name.toUpperCase().includes('CHURIDAR') ||
        p.name.toUpperCase().includes('JEANS') ||
        p.name.toUpperCase().includes('TUNA')
      );
      if (hasOutdatedData) {
        localStorage.setItem('rd_products', JSON.stringify(INITIAL_PRODUCTS));
        return INITIAL_PRODUCTS;
      }
      const missing = INITIAL_PRODUCTS.filter(ip => !parsed.some(p => p.id === ip.id || p.barcode === ip.barcode));
      if (missing.length > 0) {
        const fullList = [...parsed, ...missing];
        localStorage.setItem('rd_products', JSON.stringify(fullList));
        return fullList;
      }
      return parsed;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    const saved = localStorage.getItem('rd_company_info');
    if (!saved) return DEFAULT_COMPANY_INFO;
    try {
      const parsed = JSON.parse(saved);
      if (!parsed.name.includes('GODREJ INTERIO')) {
        const updated = { ...parsed, name: DEFAULT_COMPANY_INFO.name, address: DEFAULT_COMPANY_INFO.address, city: DEFAULT_COMPANY_INFO.city };
        localStorage.setItem('rd_company_info', JSON.stringify(updated));
        return updated;
      }
      return parsed;
    } catch {
      return DEFAULT_COMPANY_INFO;
    }
  });

  const [dSaleBills, setDSaleBills] = useState<DSaleBill[]>(() => {
    const saved = localStorage.getItem('rd_d_sale_bills');
    if (!saved) return INITIAL_D_SALE_BILLS;
    try {
      const parsed: DSaleBill[] = JSON.parse(saved);
      if (parsed.some(b => b.items?.some(it => it.productName === 'SAREE' || it.productName === 'SHIRT' || it.productName === 'CHURIDAR'))) {
        localStorage.setItem('rd_d_sale_bills', JSON.stringify(INITIAL_D_SALE_BILLS));
        return INITIAL_D_SALE_BILLS;
      }
      return parsed;
    } catch {
      return INITIAL_D_SALE_BILLS;
    }
  });

  const [billConfig, setBillConfig] = useState<BillTemplateConfig>(() => {
    const saved = localStorage.getItem('rd_bill_config');
    return saved ? JSON.parse(saved) : DEFAULT_BILL_CONFIG;
  });

  const [showCompanyMaster, setShowCompanyMaster] = useState<boolean>(false);

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('rd_categories');
    if (!saved) return INITIAL_CATEGORIES;
    try {
      const parsed: Category[] = JSON.parse(saved);
      if (parsed.some(c => c.name === 'GROCERY' || c.name === 'BAKERY')) {
        localStorage.setItem('rd_categories', JSON.stringify(INITIAL_CATEGORIES));
        return INITIAL_CATEGORIES;
      }
      return parsed;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [subCategories, setSubCategories] = useState<SubCategory[]>(() => {
    const saved = localStorage.getItem('rd_subcategories');
    if (!saved) return INITIAL_SUBCATEGORIES;
    try {
      const parsed: SubCategory[] = JSON.parse(saved);
      if (parsed.some(sc => sc.name === 'GROCERY' || sc.name === 'MILK')) {
        localStorage.setItem('rd_subcategories', JSON.stringify(INITIAL_SUBCATEGORIES));
        return INITIAL_SUBCATEGORIES;
      }
      return parsed;
    } catch {
      return INITIAL_SUBCATEGORIES;
    }
  });

  const [columnConfig, setColumnConfig] = useState<ColumnVisibilityConfig>(() => {
    const saved = localStorage.getItem('rd_column_config');
    return saved ? JSON.parse(saved) : DEFAULT_COLUMN_CONFIG;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('rd_customers');
    if (!saved) return INITIAL_CUSTOMERS;
    try {
      const parsed: Customer[] = JSON.parse(saved);
      if (parsed.some(c => c.name.includes('shibin') || c.name.includes('Pooja_5555'))) {
        localStorage.setItem('rd_customers', JSON.stringify(INITIAL_CUSTOMERS));
        return INITIAL_CUSTOMERS;
      }
      const missing = INITIAL_CUSTOMERS.filter(ic => !parsed.some(c => c.id === ic.id || c.phone === ic.phone));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  const [expenses, setExpenses] = useState<PettyExpense[]>(() => {
    const saved = localStorage.getItem('rd_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(() => {
    const saved = localStorage.getItem('rd_adjustments');
    return saved ? JSON.parse(saved) : INITIAL_STOCK_ADJUSTMENTS;
  });

  // Video 20 Feature 9: Multi-Customer Cart Hold & Unhold System (Frame 197)
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>(() => {
    const saved = localStorage.getItem('rd_held_carts');
    return saved ? JSON.parse(saved) : INITIAL_HELD_CARTS;
  });

  // Video 20 Feature 10: Dynamic Invoice Prefix & Suffix Code Configuration (Frame 221)
  const [prefixSuffixConfig, setPrefixSuffixConfig] = useState<PrefixSuffixConfig>(() => {
    const saved = localStorage.getItem('rd_prefix_suffix');
    return saved ? JSON.parse(saved) : DEFAULT_PREFIX_SUFFIX_CONFIG;
  });

  // Video 20 Feature 12: Integrated Banking Master (Frames 272, 278, 284)
  const [banks, setBanks] = useState<BankRecord[]>(() => {
    const saved = localStorage.getItem('rd_banks');
    return saved ? JSON.parse(saved) : INITIAL_BANKS;
  });

  const [branches, setBranches] = useState<BranchRecord[]>(() => {
    const saved = localStorage.getItem('rd_branches');
    return saved ? JSON.parse(saved) : INITIAL_BRANCHES;
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccountRecord[]>(() => {
    const saved = localStorage.getItem('rd_bank_accounts');
    return saved ? JSON.parse(saved) : INITIAL_BANK_ACCOUNTS;
  });

  // Video 20 Feature 13 & Video 18 Feature 1: Customer Ledger & Statement
  const [customerLedger, setCustomerLedger] = useState<CustomerLedgerEntry[]>(() => {
    const saved = localStorage.getItem('rd_customer_ledger');
    if (!saved) return INITIAL_CUSTOMER_LEDGER;
    try {
      const parsed: CustomerLedgerEntry[] = JSON.parse(saved);
      const missing = INITIAL_CUSTOMER_LEDGER.filter(il => !parsed.some(l => l.id === il.id));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return INITIAL_CUSTOMER_LEDGER;
    }
  });

  const [customerReceipts, setCustomerReceipts] = useState<CustomerReceiptEntry[]>(() => {
    const saved = localStorage.getItem('rd_customer_receipts');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMER_RECEIPTS;
  });

  // Video 20 Feature 8: Old Bill Manager & Edit System (Frames 093, 126, 128, 130)
  const [oldBills, setOldBills] = useState<OldBillRecord[]>(() => {
    const saved = localStorage.getItem('rd_old_bills');
    return saved ? JSON.parse(saved) : INITIAL_OLD_BILLS;
  });

  // Modals for Video 20
  const [showBankingMaster, setShowBankingMaster] = useState<boolean>(false);
  const [showPrefixSuffix, setShowPrefixSuffix] = useState<boolean>(false);
  const [showReceiptEntry, setShowReceiptEntry] = useState<boolean>(false);
  const [showOutstandingReport, setShowOutstandingReport] = useState<boolean>(false);

  // Video 19 Feature 17 & 18: Salesmen, Vouchers, Ledger, Stock Alert Config
  const [salesmen, setSalesmen] = useState<SalesmanRecord[]>(() => {
    const saved = localStorage.getItem('rd_salesmen');
    return saved ? JSON.parse(saved) : INITIAL_SALESMEN;
  });

  const [salesmanVouchers, setSalesmanVouchers] = useState<SalesmanPaymentVoucher[]>(() => {
    const saved = localStorage.getItem('rd_salesman_vouchers');
    return saved ? JSON.parse(saved) : INITIAL_SALESMAN_VOUCHERS;
  });

  const [salesmanLedger, setSalesmanLedger] = useState<SalesmanLedgerEntry[]>(() => {
    const saved = localStorage.getItem('rd_salesman_ledger');
    return saved ? JSON.parse(saved) : INITIAL_SALESMAN_LEDGER;
  });

  const [stockAlertConfig, setStockAlertConfig] = useState<StockAlertConfig>(() => {
    const saved = localStorage.getItem('rd_stock_alert_config');
    return saved ? JSON.parse(saved) : DEFAULT_STOCK_ALERT_CONFIG;
  });

  // Modals for Video 19
  const [showBulkEditor, setShowBulkEditor] = useState<boolean>(false);
  const [showPriceEditor, setShowPriceEditor] = useState<boolean>(false);
  const [showSalesmanPayment, setShowSalesmanPayment] = useState<boolean>(false);
  const [showSalesmanLedger, setShowSalesmanLedger] = useState<boolean>(false);

  // Video 17 Features: Terminal Hardware Config & Quotations (Frames 0065, 0160)
  const [terminalConfig, setTerminalConfig] = useState<TerminalConfig>(() => {
    const saved = localStorage.getItem('rd_terminal_config');
    return saved ? JSON.parse(saved) : DEFAULT_TERMINAL_CONFIG;
  });

  const [tills, setTills] = useState<TillRecord[]>(() => {
    const saved = localStorage.getItem('rd_tills');
    return saved ? JSON.parse(saved) : INITIAL_TILLS;
  });

  const [quotations, setQuotations] = useState<QuotationRecord[]>(() => {
    const saved = localStorage.getItem('rd_quotations');
    return saved ? JSON.parse(saved) : INITIAL_QUOTATIONS;
  });

  // Video 16 Features: Estimates, Product Serials, Sales Register Bills (Frames 0025, 0150, 0215, 0260)
  const [estimates, setEstimates] = useState<EstimateRecord[]>(() => {
    const saved = localStorage.getItem('rd_estimates');
    return saved ? JSON.parse(saved) : INITIAL_ESTIMATES;
  });

  const [productSerials, setProductSerials] = useState<ProductSerial[]>(() => {
    const saved = localStorage.getItem('rd_product_serials');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCT_SERIALS;
  });

  const [salesRegisterBills, setSalesRegisterBills] = useState<SalesRegisterBill[]>(() => {
    const saved = localStorage.getItem('rd_sales_register_bills');
    return saved ? JSON.parse(saved) : INITIAL_SALES_REGISTER_BILLS;
  });

  const [showTerminalSetting, setShowTerminalSetting] = useState<boolean>(false);

  // Video 11: Multi-Company, User Accounts, Permissions & Localization State
  const [companies, setCompanies] = useState<CompanyProfile[]>(() => {
    const saved = localStorage.getItem('rd_companies');
    return saved ? JSON.parse(saved) : INITIAL_COMPANIES;
  });

  const [currentCompany, setCurrentCompany] = useState<CompanyProfile>(() => {
    const saved = localStorage.getItem('rd_current_company');
    return saved ? JSON.parse(saved) : INITIAL_COMPANIES[0];
  });

  const [users, setUsers] = useState<UserRecord[]>(() => {
    const saved = localStorage.getItem('rd_users');
    if (!saved) return INITIAL_USERS;
    try {
      const parsed: UserRecord[] = JSON.parse(saved);
      const missing = INITIAL_USERS.filter(iu => !parsed.some(u => u.userId === iu.userId));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [userPermissions, setUserPermissions] = useState<Record<string, UserControlPermissions>>(() => {
    const saved = localStorage.getItem('rd_user_permissions');
    return saved ? JSON.parse(saved) : INITIAL_USER_PERMISSIONS;
  });

  const [currentUser, setCurrentUser] = useState<UserRecord>(() => {
    const saved = localStorage.getItem('rd_current_user');
    return saved ? JSON.parse(saved) : INITIAL_USERS[0];
  });

  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('rd_current_language');
    return saved ? JSON.parse(saved) : 'ENGLISH';
  });

  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [showUserRegistration, setShowUserRegistration] = useState<boolean>(false);
  const [showUserControl, setShowUserControl] = useState<boolean>(false);
  const [showChangePassword, setShowChangePassword] = useState<boolean>(false);
  const [showCreateCompany, setShowCreateCompany] = useState<boolean>(false);
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState<boolean>(false);
  const [activeVirtualKey, setActiveVirtualKey] = useState<{ char?: string; backspace?: boolean; clear?: boolean; enter?: boolean } | undefined>(undefined);

  // Video 07: Customer & Supplier Outstanding Balance, Product Records & Bulk Editor State
  const [customerOutstanding, setCustomerOutstanding] = useState<OutstandingRecord[]>(() => {
    const saved = localStorage.getItem('rd_customer_outstanding');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMER_OUTSTANDING;
  });

  const [supplierOutstanding, setSupplierOutstanding] = useState<OutstandingRecord[]>(() => {
    const saved = localStorage.getItem('rd_supplier_outstanding');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIER_OUTSTANDING;
  });

  const [productRecords, setProductRecords] = useState<ProductRecordItem[]>(() => {
    const saved = localStorage.getItem('rd_product_records');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCT_RECORDS;
  });

  const [showCustomerRecordsModal, setShowCustomerRecordsModal] = useState<boolean>(false);
  const [showSupplierRecordsModal, setShowSupplierRecordsModal] = useState<boolean>(false);
  const [showOutstandingAnalysisModal, setShowOutstandingAnalysisModal] = useState<boolean>(false);
  const [outstandingInitialEntity, setOutstandingInitialEntity] = useState<OutstandingEntity>('CUSTOMER');
  const [showSupplierPaymentModal, setShowSupplierPaymentModal] = useState<boolean>(false);
  const [supplierPaymentTargetId, setSupplierPaymentTargetId] = useState<string>('S-0004');
  const [showProductRecordsModal, setShowProductRecordsModal] = useState<boolean>(false);
  const [showExpiryProductRecordModal, setShowExpiryProductRecordModal] = useState<boolean>(false);
  const [showFullProductBulkEditorModal, setShowFullProductBulkEditorModal] = useState<boolean>(false);

  // Video 06: Purchase Dashboard State (Frames 0060, 0300, 0365)
  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecordItem[]>(() => {
    const saved = localStorage.getItem('rd_purchase_records');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_RECORDS;
  });
  const [showPurchaseDashboardModal, setShowPurchaseDashboardModal] = useState<boolean>(false);

  // Video 05: Account Heads, Expenses & Incomes, and Bank Statements
  const [accountHeads, setAccountHeads] = useState<AccountHeadItem[]>(() => {
    const saved = localStorage.getItem('rd_account_heads');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNT_HEADS;
  });

  const [expenseVouchers, setExpenseVouchers] = useState<ExpenseVoucher[]>(() => {
    const saved = localStorage.getItem('rd_expense_vouchers');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSE_VOUCHERS;
  });

  const [incomeVouchers, setIncomeVouchers] = useState<IncomeVoucher[]>(() => {
    const saved = localStorage.getItem('rd_income_vouchers');
    return saved ? JSON.parse(saved) : INITIAL_INCOME_VOUCHERS;
  });

  const [bankStatements, setBankStatements] = useState<BankStatementEntry[]>(() => {
    const saved = localStorage.getItem('rd_bank_statements');
    return saved ? JSON.parse(saved) : INITIAL_BANK_STATEMENT_ENTRIES;
  });

  const [showAccountHeadModal, setShowAccountHeadModal] = useState<boolean>(false);
  const [showExpenseVoucherModal, setShowExpenseVoucherModal] = useState<boolean>(false);
  const [showIncomeVoucherModal, setShowIncomeVoucherModal] = useState<boolean>(false);
  const [showExpensesDashboardModal, setShowExpensesDashboardModal] = useState<boolean>(false);
  const [showIncomeDashboardModal, setShowIncomeDashboardModal] = useState<boolean>(false);
  const [showBankStatementModal, setShowBankStatementModal] = useState<boolean>(false);

  // Video 04: Stock In Hand, Sales Return (Credit Note), Purchase Return (Debit Note)
  const [showStockInHandModal, setShowStockInHandModal] = useState<boolean>(false);
  const [showSalesReturnModal, setShowSalesReturnModal] = useState<boolean>(false);
  const [showPurchaseReturnModal, setShowPurchaseReturnModal] = useState<boolean>(false);

  // Video 03: Sales Return Dashboard & Purchase Return Dashboard (Frames 0045, 0450)
  const [salesReturnDashboardRecords, setSalesReturnDashboardRecords] = useState<SalesReturnDashboardItem[]>(() => {
    const saved = localStorage.getItem('rd_sales_return_dashboard_records');
    return saved ? JSON.parse(saved) : INITIAL_SALES_RETURN_RECORDS;
  });

  const [purchaseReturnDashboardRecords, setPurchaseReturnDashboardRecords] = useState<PurchaseReturnDashboardItem[]>(() => {
    const saved = localStorage.getItem('rd_purchase_return_dashboard_records');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_RETURN_RECORDS;
  });

  const [showSalesReturnDashboardModal, setShowSalesReturnDashboardModal] = useState<boolean>(false);
  const [showPurchaseReturnDashboardModal, setShowPurchaseReturnDashboardModal] = useState<boolean>(false);

  // Video 01: Stock Entry & Stock Adjustment & Records State (Frames 0035, 0070, 0270, 0330, 0515, 0650)
  const [stockEntryRecords, setStockEntryRecords] = useState<StockEntryItem[]>(() => {
    const saved = localStorage.getItem('rd_stock_entry_records');
    return saved ? JSON.parse(saved) : INITIAL_STOCK_ENTRY_RECORDS;
  });
  const [stockAdjustmentRecords, setStockAdjustmentRecords] = useState<StockAdjustmentRecordItem[]>(() => {
    const saved = localStorage.getItem('rd_stock_adjustment_records');
    return saved ? JSON.parse(saved) : INITIAL_STOCK_ADJUSTMENT_RECORDS;
  });
  const [purchaseListItems] = useState<PurchaseInvoiceListItem[]>(() => {
    const saved = localStorage.getItem('rd_purchase_list_items');
    return saved ? JSON.parse(saved) : INITIAL_PURCHASE_LIST_ITEMS;
  });

  const [showStockEntryModal, setShowStockEntryModal] = useState<boolean>(false);
  const [showStockEntryRecordModal, setShowStockEntryRecordModal] = useState<boolean>(false);
  const [showStockAdjustmentModal, setShowStockAdjustmentModal] = useState<boolean>(false);
  const [showStockAdjustmentRecordModal, setShowStockAdjustmentRecordModal] = useState<boolean>(false);
  const [showPurchaseRecordModal, setShowPurchaseRecordModal] = useState<boolean>(false);
  const [showPurchaseReturnRecordModal, setShowPurchaseReturnRecordModal] = useState<boolean>(false);

  const [activeStockEntryId, setActiveStockEntryId] = useState<string | undefined>(undefined);
  const [activeStockEntryItems, setActiveStockEntryItems] = useState<StockEntryItem[] | undefined>(undefined);
  const [activeStockAdjustmentRecord, setActiveStockAdjustmentRecord] = useState<StockAdjustmentRecordItem | null>(null);

  // Video 12: SMS & Email Configuration State
  const [smsConfig, setSmsConfig] = useState<SmsConfig>(() => {
    const saved = localStorage.getItem('rd_sms_config');
    return saved
      ? JSON.parse(saved)
      : {
          apiUrl: 'http://sms.raintechsoftware.com/api/send?user=demo&pass=1234&sender=RAINTE&dest={phone}&msg={msg}',
          isEnabled: true,
          isDefault: true,
          autoSmsEnabled: true,
          senderId: 'RAINTE'
        };
  });

  const [emailConfig, setEmailConfig] = useState<EmailConfig>(() => {
    const saved = localStorage.getItem('rd_email_config');
    return saved
      ? JSON.parse(saved)
      : {
          serverName: 'Gmail',
          smtpAddress: 'smtp.gmail.com',
          emailId: 'raintech7559059967@gmail.com',
          password: '••••••••••••',
          port: 587,
          tlsSslRequired: 'Yes',
          isDefault: true,
          isEnabled: true
        };
  });

  const [showSmsSettingModal, setShowSmsSettingModal] = useState<boolean>(false);
  const [showEmailSettingModal, setShowEmailSettingModal] = useState<boolean>(false);
  const [showRubicPosModal, setShowRubicPosModal] = useState<boolean>(false);

  // 2. Active Desktop Workspace
  const [initialScannedSku, setInitialScannedSku] = useState<string | undefined>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('sku') || urlParams.get('p') || urlParams.get('product') || urlParams.get('barcode') || undefined;
    } catch {
      return undefined;
    }
  });

  const [activeWorkspace, setActiveWorkspace] = useState<ActiveWorkspace>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const isPortal = urlParams.get('portal') === '1' || urlParams.get('scan') === '1' || Boolean(urlParams.get('sku') || urlParams.get('p') || urlParams.get('barcode'));
      if (isPortal) return 'CUSTOMER_PORTAL';
    } catch {}
    return 'PRODUCT_ADD_SMART';
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState<Product | undefined>(undefined);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('rd_customer_outstanding', JSON.stringify(customerOutstanding));
  }, [customerOutstanding]);

  useEffect(() => {
    localStorage.setItem('rd_supplier_outstanding', JSON.stringify(supplierOutstanding));
  }, [supplierOutstanding]);

  useEffect(() => {
    localStorage.setItem('rd_product_records', JSON.stringify(productRecords));
  }, [productRecords]);

  useEffect(() => {
    localStorage.setItem('rd_purchase_records', JSON.stringify(purchaseRecords));
  }, [purchaseRecords]);

  useEffect(() => {
    localStorage.setItem('rd_sales_return_dashboard_records', JSON.stringify(salesReturnDashboardRecords));
  }, [salesReturnDashboardRecords]);

  useEffect(() => {
    localStorage.setItem('rd_purchase_return_dashboard_records', JSON.stringify(purchaseReturnDashboardRecords));
  }, [purchaseReturnDashboardRecords]);

  useEffect(() => {
    localStorage.setItem('rd_companies', JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem('rd_current_company', JSON.stringify(currentCompany));
  }, [currentCompany]);

  useEffect(() => {
    localStorage.setItem('rd_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('rd_user_permissions', JSON.stringify(userPermissions));
  }, [userPermissions]);

  useEffect(() => {
    localStorage.setItem('rd_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Video 05 Syncing
  useEffect(() => {
    localStorage.setItem('rd_account_heads', JSON.stringify(accountHeads));
  }, [accountHeads]);

  useEffect(() => {
    localStorage.setItem('rd_expense_vouchers', JSON.stringify(expenseVouchers));
  }, [expenseVouchers]);

  useEffect(() => {
    localStorage.setItem('rd_income_vouchers', JSON.stringify(incomeVouchers));
  }, [incomeVouchers]);

  useEffect(() => {
    localStorage.setItem('rd_bank_statements', JSON.stringify(bankStatements));
  }, [bankStatements]);

  // Video 01 Syncing
  useEffect(() => {
    localStorage.setItem('rd_stock_entry_records', JSON.stringify(stockEntryRecords));
  }, [stockEntryRecords]);

  useEffect(() => {
    localStorage.setItem('rd_stock_adjustment_records', JSON.stringify(stockAdjustmentRecords));
  }, [stockAdjustmentRecords]);

  useEffect(() => {
    localStorage.setItem('rd_purchase_list_items', JSON.stringify(purchaseListItems));
  }, [purchaseListItems]);

  useEffect(() => {
    localStorage.setItem('rd_sms_config', JSON.stringify(smsConfig));
  }, [smsConfig]);

  useEffect(() => {
    localStorage.setItem('rd_email_config', JSON.stringify(emailConfig));
  }, [emailConfig]);

  // Video 05: Handle Save Expense Voucher with double-entry banking linkage
  const handleSaveExpenseVoucher = (voucher: ExpenseVoucher) => {
    setExpenseVouchers(prev => [voucher, ...prev]);

    // Video 05 Frame 0230 & 0280: If payment is Bank, automatically create statement debit
    if (voucher.paymentMode === 'Bank') {
      const newStmt: BankStatementEntry = {
        id: `bs-exp-${Date.now()}`,
        date: voucher.date,
        accountNo: voucher.bankAcNo || '99999999',
        receiptNo: voucher.voucherNo,
        description: 'Expenses-Bank',
        debit: voucher.grandTotal,
        credit: 0
      };
      setBankStatements(prev => [...prev, newStmt]);

      // Deduct bank account balance
      setBankAccounts(prev =>
        prev.map(b =>
          b.accountNo === (voucher.bankAcNo || '99999999')
            ? { ...b, balance: b.balance - voucher.grandTotal }
            : b
        )
      );
    }
  };

  // Video 05: Handle Save Income Voucher with double-entry banking linkage
  const handleSaveIncomeVoucher = (voucher: IncomeVoucher) => {
    setIncomeVouchers(prev => [voucher, ...prev]);

    // Video 05 Frame 0535 & 0600: If payment is Bank, automatically create statement credit
    if (voucher.paymentMode === 'Bank') {
      const newStmt: BankStatementEntry = {
        id: `bs-inc-${Date.now()}`,
        date: voucher.date,
        accountNo: voucher.bankAcNo || '99999999',
        receiptNo: voucher.voucherNo,
        description: 'Income-Bank',
        debit: 0,
        credit: voucher.grandTotal
      };
      setBankStatements(prev => [...prev, newStmt]);

      // Credit bank account balance
      setBankAccounts(prev =>
        prev.map(b =>
          b.accountNo === (voucher.bankAcNo || '99999999')
            ? { ...b, balance: b.balance + voucher.grandTotal }
            : b
        )
      );
    }
  };

  // Video 04: F1 global keyboard shortcut to toggle Stock In Hand (Frame 0030)
  useEffect(() => {
    const handleF1Key = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setShowStockInHandModal(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleF1Key);
    return () => window.removeEventListener('keydown', handleF1Key);
  }, []);

  // Video 04: Sales Return (Credit Note) - Frame 0105: Customer returns goods -> Restock inventory live
  const handleProcessSalesReturn = (returnDetails: {
    returnNo: string;
    invoiceNo: string;
    customerName: string;
    items: {
      productCode: string;
      productName: string;
      qtyReturned: number;
      price: number;
      total: number;
    }[];
    totalRefund: number;
    paymentMode: 'Cash' | 'Bank' | 'Credit';
  }) => {
    setProducts(prev =>
      prev.map(p => {
        const match = returnDetails.items.find(
          item => item.productCode === p.pCode || item.productName.toUpperCase() === p.name.toUpperCase()
        );
        return match ? { ...p, openingStock: p.openingStock + match.qtyReturned } : p;
      })
    );

    setProductRecords(prev =>
      prev.map(pr => {
        const match = returnDetails.items.find(
          item => item.productCode === pr.code || item.productName.toUpperCase() === pr.name.toUpperCase()
        );
        return match ? { ...pr, currentStock: pr.currentStock + match.qtyReturned } : pr;
      })
    );

    // Video 03: Live sync to Sales Return Dashboard (Frames 0045, 0155, 0410)
    const newSrdItems: SalesReturnDashboardItem[] = returnDetails.items.map((it, idx) => ({
      id: `srd-${Date.now()}-${idx}`,
      srNo: returnDetails.returnNo,
      srDate: new Date().toLocaleDateString('en-GB'),
      taxType: 'GST',
      salesInvoiceNo: returnDetails.invoiceNo,
      salesInvoiceDate: new Date().toLocaleDateString('en-GB'),
      customerName: returnDetails.customerName,
      state: 'Kerala',
      gstin: '',
      productCode: it.productCode,
      productName: it.productName,
      barcode: '65000' + (idx + 1),
      hsnCode: '80051',
      salesRate: it.price,
      returnQty: it.qtyReturned,
      discount: 0,
      cgstPercent: 6,
      cgstAmount: Number((it.total * 0.06).toFixed(2)),
      sgstPercent: 6,
      sgstAmount: Number((it.total * 0.06).toFixed(2)),
      totalRefundAmt: it.total
    }));
    setSalesReturnDashboardRecords(prev => [...newSrdItems, ...prev]);
  };

  // Video 04: Purchase Return (Debit Note) - Frame 0225: Return goods to vendor -> Deduct inventory & adjust supplier balance
  const handleProcessPurchaseReturn = (debitNote: PurchaseReturnDebitNote) => {
    setProducts(prev =>
      prev.map(p => {
        const match = debitNote.items.find(
          item => item.barcode === p.barcode || item.productName.toUpperCase() === p.name.toUpperCase()
        );
        return match ? { ...p, openingStock: Math.max(0, p.openingStock - match.qty) } : p;
      })
    );

    setProductRecords(prev =>
      prev.map(pr => {
        const match = debitNote.items.find(
          item => item.barcode === pr.barcode || item.productName.toUpperCase() === pr.name.toUpperCase()
        );
        return match ? { ...pr, currentStock: Math.max(0, pr.currentStock - match.qty) } : pr;
      })
    );

    setSupplierOutstanding(prev =>
      prev.map(s =>
        s.name.toLowerCase().includes(debitNote.supplierName.toLowerCase()) ||
        s.contactNo === debitNote.contactNo
          ? { ...s, balance: Math.max(0, s.balance - debitNote.grandTotal) }
          : s
      )
    );

    // Video 03: Live sync to Purchase Return Dashboard (Frames 0445, 0450)
    const newPrdItems: PurchaseReturnDashboardItem[] = debitNote.items.map((it, idx) => ({
      id: `prd-${Date.now()}-${idx}`,
      prNo: debitNote.prNo,
      prDate: debitNote.date,
      taxType: 'GST',
      purchaseInvoiceNo: debitNote.originalInvoiceNo,
      purchaseInvoiceDate: debitNote.date,
      supplierId: debitNote.supplierId,
      supplierName: debitNote.supplierName,
      contactNo: debitNote.contactNo,
      state: debitNote.state,
      gstin: '',
      productCode: it.barcode,
      productName: it.productName,
      barcode: it.barcode,
      hsnCode: '80051',
      purchaseRate: it.price,
      returnQty: it.qty,
      discount: it.discountAmt,
      cgstPercent: it.cgstPercent,
      cgstAmount: it.cgstAmt,
      sgstPercent: it.sgstPercent,
      sgstAmount: it.sgstAmt,
      totalDebitAmt: it.total
    }));
    setPurchaseReturnDashboardRecords(prev => [...newPrdItems, ...prev]);
  };

  useEffect(() => {
    localStorage.setItem('rd_current_language', JSON.stringify(currentLanguage));
  }, [currentLanguage]);

  // Video 10: Quantity-Based Auto Discount Rules (frmProductDiscount Frames 0071, 0090, 0100)
  const [quantityDiscountRules, setQuantityDiscountRules] = useState<ProductQuantityDiscountRule[]>(() => {
    const saved = localStorage.getItem('rd_quantity_discount_rules');
    if (!saved) return INITIAL_QUANTITY_DISCOUNT_RULES;
    try {
      return JSON.parse(saved);
    } catch (e) {
      return INITIAL_QUANTITY_DISCOUNT_RULES;
    }
  });

  const [isProductDiscountModalOpen, setIsProductDiscountModalOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('rd_quantity_discount_rules', JSON.stringify(quantityDiscountRules));
  }, [quantityDiscountRules]);

  const handleSaveQuantityDiscountRule = (rule: ProductQuantityDiscountRule) => {
    setQuantityDiscountRules(prev => {
      const existingIndex = prev.findIndex(r => r.id === rule.id || (r.barcode === rule.barcode && r.minQty === rule.minQty && r.maxQty === rule.maxQty));
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = rule;
        return updated;
      }
      return [...prev, rule];
    });
  };

  const handleRemoveQuantityDiscountRule = (ruleId: string) => {
    setQuantityDiscountRules(prev => prev.filter(r => r.id !== ruleId));
  };

  const handleDeleteAllRulesForProduct = (barcode: string) => {
    setQuantityDiscountRules(prev => prev.filter(r => r.barcode !== barcode));
  };

  // Video 08: Google Drive Cloud Backup & Auto Offline Backup State (Frames 0042, 0145, 0220)
  const [autoBackupConfig, setAutoBackupConfig] = useState<AutoBackupConfig>(() => {
    const saved = localStorage.getItem('rd_auto_backup_config');
    if (!saved) return DEFAULT_AUTO_BACKUP_CONFIG;
    try {
      return JSON.parse(saved);
    } catch {
      return DEFAULT_AUTO_BACKUP_CONFIG;
    }
  });

  const [showAutoBackupModal, setShowAutoBackupModal] = useState<boolean>(false);
  const [showDatabaseRestoreModal, setShowDatabaseRestoreModal] = useState<boolean>(false);
  const [showCloudBackupOverlay, setShowCloudBackupOverlay] = useState<boolean>(false);
  const [isPendingLogout, setIsPendingLogout] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('rd_auto_backup_config', JSON.stringify(autoBackupConfig));
  }, [autoBackupConfig]);

  const handleSaveAutoBackupConfig = (updated: AutoBackupConfig) => {
    setAutoBackupConfig(updated);
  };

  const handleTriggerManualBackup = () => {
    setShowCloudBackupOverlay(true);
  };

  const handleInitiateLogout = () => {
    if (
      autoBackupConfig.autoOfflineBackupStatus === 'Enable' ||
      autoBackupConfig.autoCloudBackupStatus === 'Enable'
    ) {
      setIsPendingLogout(true);
      setShowCloudBackupOverlay(true);
    } else {
      setShowLogoutConfirm(true);
    }
  };

  const handleCloudBackupComplete = () => {
    setShowCloudBackupOverlay(false);
    if (isPendingLogout) {
      setIsPendingLogout(false);
      setShowLogoutConfirm(true);
    }
  };

  const handleRestoreDatabase = (snapshot: Partial<DatabaseSnapshot>) => {
    if (snapshot.products && snapshot.products.length > 0) {
      setProducts(snapshot.products);
    }
    if (snapshot.categories && snapshot.categories.length > 0) {
      setCategories(snapshot.categories);
    }
    if (snapshot.subCategories && snapshot.subCategories.length > 0) {
      setSubCategories(snapshot.subCategories);
    }
    if (snapshot.customers && snapshot.customers.length > 0) {
      setCustomers(snapshot.customers);
    }
    if (snapshot.companyInfo) {
      setCompanyInfo(snapshot.companyInfo);
    }
    // As demonstrated in Video 08 Frame 0240: jumps right into Sale POS for instant billing!
    setActiveWorkspace('SALE_POS');
  };

  // Video 11: Company Switching with isolated database catalogue (Frames 0105 – 0160)
  const handleSelectCompany = (comp: CompanyProfile) => {
    setCurrentCompany(comp);
    setCompanyInfo(prev => ({
      ...prev,
      name: comp.name,
      address: comp.address,
      city: comp.city,
      state: comp.state,
      contactNo: comp.contactNo,
      email: comp.email,
      gstin: comp.gstin
    }));
    const savedCompProds = localStorage.getItem(`rd_products_${comp.id}`);
    if (savedCompProds) {
      setProducts(JSON.parse(savedCompProds));
    } else if (COMPANY_PRODUCTS_MAP[comp.name]) {
      setProducts(COMPANY_PRODUCTS_MAP[comp.name]);
    } else if (comp.id === 'comp-1' || comp.name.includes('VINAYAKA FURNITURES') || comp.name === 'OLIVE SHOP') {
      const savedMain = localStorage.getItem('rd_products');
      setProducts(savedMain ? JSON.parse(savedMain) : INITIAL_PRODUCTS);
    } else {
      setProducts([]);
    }
  };

  const handleSaveUser = (u: UserRecord) => {
    setUsers(prev => [u, ...prev]);
    setUserPermissions(prev => ({
      ...prev,
      [u.userId]: { ...DEFAULT_USER_PERMISSIONS_ALL }
    }));
  };

  const handleUpdateUser = (updated: UserRecord) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    if (currentUser.id === updated.id) {
      setCurrentUser(updated);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.userId !== userId));
  };

  const handleUpdatePermissions = (userId: string, perms: UserControlPermissions) => {
    setUserPermissions(prev => ({ ...prev, [userId]: perms }));
  };

  const handleUpdateUserPassword = (userId: string, newPass: string) => {
    setUsers(prev => prev.map(u => u.userId === userId ? { ...u, password: newPass } : u));
    if (currentUser.userId === userId) {
      setCurrentUser(prev => ({ ...prev, password: newPass }));
    }
  };

  const handleSaveNewCompany = (comp: CompanyProfile) => {
    setCompanies(prev => [...prev, comp]);
    handleSelectCompany(comp);
  };

  const handleLoginSuccess = (user: UserRecord) => {
    setCurrentUser(user);
    setIsAdmin(user.userType === 'Admin' || user.userType === 'SAdmin');
    setShowLoginModal(false);
  };

  useEffect(() => {
    localStorage.setItem('rd_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('rd_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('rd_subcategories', JSON.stringify(subCategories));
  }, [subCategories]);

  useEffect(() => {
    localStorage.setItem('rd_column_config', JSON.stringify(columnConfig));
  }, [columnConfig]);

  useEffect(() => {
    localStorage.setItem('rd_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('rd_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('rd_adjustments', JSON.stringify(adjustments));
  }, [adjustments]);

  useEffect(() => {
    localStorage.setItem('rd_company_info', JSON.stringify(companyInfo));
  }, [companyInfo]);

  useEffect(() => {
    localStorage.setItem('rd_d_sale_bills', JSON.stringify(dSaleBills));
  }, [dSaleBills]);

  useEffect(() => {
    localStorage.setItem('rd_bill_config', JSON.stringify(billConfig));
  }, [billConfig]);

  useEffect(() => {
    localStorage.setItem('rd_held_carts', JSON.stringify(heldCarts));
  }, [heldCarts]);

  useEffect(() => {
    localStorage.setItem('rd_prefix_suffix', JSON.stringify(prefixSuffixConfig));
  }, [prefixSuffixConfig]);

  useEffect(() => {
    localStorage.setItem('rd_banks', JSON.stringify(banks));
  }, [banks]);

  useEffect(() => {
    localStorage.setItem('rd_branches', JSON.stringify(branches));
  }, [branches]);

  useEffect(() => {
    localStorage.setItem('rd_bank_accounts', JSON.stringify(bankAccounts));
  }, [bankAccounts]);

  useEffect(() => {
    localStorage.setItem('rd_customer_ledger', JSON.stringify(customerLedger));
  }, [customerLedger]);

  useEffect(() => {
    localStorage.setItem('rd_customer_receipts', JSON.stringify(customerReceipts));
  }, [customerReceipts]);

  useEffect(() => {
    localStorage.setItem('rd_old_bills', JSON.stringify(oldBills));
  }, [oldBills]);

  // Video 19 Syncing
  useEffect(() => {
    localStorage.setItem('rd_salesmen', JSON.stringify(salesmen));
  }, [salesmen]);

  useEffect(() => {
    localStorage.setItem('rd_salesman_vouchers', JSON.stringify(salesmanVouchers));
  }, [salesmanVouchers]);

  useEffect(() => {
    localStorage.setItem('rd_salesman_ledger', JSON.stringify(salesmanLedger));
  }, [salesmanLedger]);

  useEffect(() => {
    localStorage.setItem('rd_stock_alert_config', JSON.stringify(stockAlertConfig));
  }, [stockAlertConfig]);

  // Video 17 Syncing
  useEffect(() => {
    localStorage.setItem('rd_terminal_config', JSON.stringify(terminalConfig));
  }, [terminalConfig]);

  useEffect(() => {
    localStorage.setItem('rd_tills', JSON.stringify(tills));
  }, [tills]);

  useEffect(() => {
    localStorage.setItem('rd_quotations', JSON.stringify(quotations));
  }, [quotations]);

  // Video 16 Syncing (Estimates, Product Serials, Sales Register Bills)
  useEffect(() => {
    localStorage.setItem('rd_estimates', JSON.stringify(estimates));
  }, [estimates]);

  useEffect(() => {
    localStorage.setItem('rd_product_serials', JSON.stringify(productSerials));
  }, [productSerials]);

  useEffect(() => {
    localStorage.setItem('rd_sales_register_bills', JSON.stringify(salesRegisterBills));
  }, [salesRegisterBills]);

  // Synchronize master data with backend API on mount
  useEffect(() => {
    let isMounted = true;
    const syncBackendData = async () => {
      try {
        const [backendProducts, backendCustomers, backendCompany] = await Promise.all([
          api.getProducts(),
          api.getCustomers(),
          api.getCompanyProfile()
        ]);

        if (!isMounted) return;

        if (Array.isArray(backendProducts) && backendProducts.length > 0) {
          const mappedProducts = backendProducts.map(mapBackendProductToFrontend);
          setProducts(prev => {
            const combined = [...prev];
            for (const bp of mappedProducts) {
              const idx = combined.findIndex(p => p.barcode === bp.barcode || p.pCode === bp.pCode);
              if (idx > -1) {
                combined[idx] = { ...combined[idx], ...bp };
              } else {
                combined.push(bp);
              }
            }
            return combined;
          });
        }

        if (Array.isArray(backendCustomers) && backendCustomers.length > 0) {
          const mappedCustomers = backendCustomers.map(mapBackendCustomerToFrontend);
          setCustomers(prev => {
            const combined = [...prev];
            for (const bc of mappedCustomers) {
              const idx = combined.findIndex(c => c.phone === bc.phone || c.id === bc.id);
              if (idx > -1) {
                combined[idx] = { ...combined[idx], ...bc };
              } else {
                combined.push(bc);
              }
            }
            return combined;
          });
        }

        if (backendCompany && backendCompany.company_name) {
          setCompanyInfo(prev => ({
            ...prev,
            name: backendCompany.company_name || prev.name,
            address: backendCompany.address || prev.address,
            phone: backendCompany.phone || prev.phone,
            gstin: backendCompany.gstin || prev.gstin,
            state: backendCompany.state || prev.state,
            bankName: backendCompany.bank_name || prev.bankName,
            accountNo: backendCompany.bank_ac_no || prev.accountNo,
            ifsc: backendCompany.bank_ifsc || prev.ifsc,
            branch: backendCompany.bank_branch || prev.branch
          }));
        }
      } catch (err) {
        console.warn("Backend sync offline / skipped:", err);
      }
    };

    syncBackendData();
    return () => { isMounted = false; };
  }, []);


  // Video 16 Feature: Handle Save Estimate (Frames 0025, 0035, 0050)
  const handleSaveEstimate = (est: EstimateRecord) => {
    setEstimates(prev => {
      const idx = prev.findIndex(e => e.id === est.id || e.estimateNo === est.estimateNo);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = est;
        return copy;
      }
      return [est, ...prev];
    });
  };

  // Video 16 Feature: Handle Inward & Update Product Serials (Frames 0215, 0230, 0260)
  const handleAddProductSerials = (newSerials: ProductSerial[]) => {
    setProductSerials(prev => {
      const filtered = prev.filter(p => !newSerials.some(n => n.serialNo === p.serialNo));
      return [...newSerials, ...filtered];
    });
  };

  const handleUpdateProductSerials = (serials: ProductSerial[]) => {
    setProductSerials(serials);
  };

  // Video 17 Feature: Handle Save/Delete Quotation (Frame 0160)
  const handleSaveQuotation = (quot: QuotationRecord) => {
    setQuotations(prev => {
      const idx = prev.findIndex(q => q.id === quot.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = quot;
        return copy;
      }
      return [quot, ...prev];
    });
  };

  const handleDeleteQuotation = (id: string) => {
    setQuotations(prev => prev.filter(q => q.id !== id));
  };

  // Video 19 Feature 17: Handle Save Salesman Payment
  const handleSaveSalesmanPayment = (voucher: SalesmanPaymentVoucher, ledgerEntry: SalesmanLedgerEntry) => {
    setSalesmanVouchers(prev => [voucher, ...prev]);
    setSalesmanLedger(prev => [ledgerEntry, ...prev]);
    setSalesmen(prev =>
      prev.map(s =>
        s.id === voucher.salesmanId
          ? { ...s, balance: Number(Math.max(0, s.balance - voucher.amount).toFixed(2)) }
          : s
      )
    );
  };

  const handleBulkUpdateProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
  };

  // Video 20 Feature 13 & Video 18 Feature 1: Handle Record Customer Receipt
  const handleRecordReceipt = (receipt: CustomerReceiptEntry, ledgerEntry: CustomerLedgerEntry) => {
    setCustomerReceipts(prev => [receipt, ...prev]);
    setCustomerLedger(prev => [ledgerEntry, ...prev]);
    setCustomers(prev =>
      prev.map(c =>
        c.id === receipt.customerId
          ? { ...c, balance: Number((c.balance - receipt.amount).toFixed(2)) }
          : c
      )
    );
  };

  // Video 18 Feature 1 & Video 16 Sales Register / Serial Number Sync: Handle Record Sale Invoice
  const handleRecordSaleInvoice = (completedBill: any) => {
    // 1. Credit Ledger Update
    if (completedBill.balanceDue > 0) {
      const custId = completedBill.customer?.id;
      if (custId) {
        const newLedger: CustomerLedgerEntry = {
          id: 'ledg-' + Date.now(),
          customerId: custId,
          date: completedBill.date || new Date().toLocaleDateString('en-GB'),
          voucherNo: completedBill.invoiceNo,
          particulars: 'Sales',
          debit: completedBill.balanceDue,
          credit: 0.0
        };
        setCustomerLedger(prev => [...prev, newLedger]);
        setCustomers(prev =>
          prev.map(c =>
            c.id === custId
              ? { ...c, balance: Number((c.balance + completedBill.balanceDue).toFixed(2)) }
              : c
          )
        );
      }
    }

    // 2. Video 16 Feature: Record into Sales Register (Bill Wise) [Frames 0150, 0155]
    const taxable = completedBill.taxableTotal ?? (completedBill.grandTotal ? completedBill.grandTotal * 0.82 : 0);
    const cgst = completedBill.cgstTotal ?? (taxable * 0.09);
    const sgst = completedBill.sgstTotal ?? (taxable * 0.09);
    const igst = completedBill.igstTotal ?? 0;
    const newRegBill: SalesRegisterBill = {
      id: 'reg-' + Date.now(),
      billNo: completedBill.invoiceNo || `SVF-${Date.now()}`,
      date: completedBill.date || new Date().toLocaleDateString('en-GB'),
      customerName: completedBill.customer?.name || 'Cash',
      gstin: completedBill.customer?.gstin || '0',
      billAmount: completedBill.grandTotal || completedBill.total || 0,
      taxableAmount: Number(taxable.toFixed(2)),
      cgstAmount: Number(cgst.toFixed(2)),
      sgstAmount: Number(sgst.toFixed(2)),
      igstAmount: Number(igst.toFixed(2)),
      cessAmount: 0,
      otherAmount: 0
    };
    setSalesRegisterBills(prev => [newRegBill, ...prev]);

    // 3. Video 16 Feature: Update Serial Numbers status to SOLD [Frame 0260, 0275]
    if (completedBill.items && Array.isArray(completedBill.items)) {
      const soldSerials: string[] = [];
      completedBill.items.forEach((it: any) => {
        if (it.serialNos && Array.isArray(it.serialNos)) {
          soldSerials.push(...it.serialNos);
        }
      });
      if (soldSerials.length > 0) {
        setProductSerials(prev =>
          prev.map(ps =>
            soldSerials.includes(ps.serialNo)
              ? { ...ps, status: 'Sold', saleInvoiceNo: completedBill.invoiceNo }
              : ps
          )
        );
      }
    }

    // 4. Asynchronously persist to backend database
    try {
      const invoicePayload = {
        invoice_no: completedBill.invoiceNo || `SVF-${Date.now()}`,
        invoice_date: completedBill.date || new Date().toISOString().split('T')[0],
        customer_id: completedBill.customer?.id ? parseInt(completedBill.customer.id, 10) || null : null,
        customer_name: completedBill.customer?.name || 'Walk-in Cash Customer',
        customer_phone: completedBill.customer?.phone || '',
        payment_mode: completedBill.paymentMode || 'Cash',
        gross_amount: completedBill.grossAmount || completedBill.total || 0,
        discount_amount: completedBill.discountAmount || 0,
        coupon_discount: completedBill.couponDiscount || 0,
        gift_voucher_discount: completedBill.giftVoucherDiscount || 0,
        taxable_amount: Number(taxable.toFixed(2)),
        cgst_amount: Number(cgst.toFixed(2)),
        sgst_amount: Number(sgst.toFixed(2)),
        igst_amount: Number(igst.toFixed(2)),
        round_off: completedBill.roundOff || 0,
        grand_total: completedBill.grandTotal || completedBill.total || 0,
        paid_amount: completedBill.paidAmount || completedBill.grandTotal || completedBill.total || 0,
        balance_due: completedBill.balanceDue || 0,
        salesman_code: completedBill.salesman?.code || null,
        items: (completedBill.items || []).map((it: any) => ({
          product_id: parseInt(it.product?.id || it.id, 10) || 1,
          barcode: it.barcode || '',
          product_name: it.product?.name || it.name || '',
          qty: it.qty || 1,
          rate: it.price || it.rate || 0,
          discount_amount: it.discount || 0,
          taxable_value: it.taxableValue || ((it.price || 0) * (it.qty || 1)),
          cgst_rate: it.cgst || 9,
          cgst_amount: it.cgstAmt || 0,
          sgst_rate: it.sgst || 9,
          sgst_amount: it.sgstAmt || 0,
          igst_rate: it.igst || 0,
          igst_amount: it.igstAmt || 0,
          net_amount: it.total || ((it.price || 0) * (it.qty || 1)),
          batch_no: it.batchNo || null,
          serial_no: Array.isArray(it.serialNos) && it.serialNos.length > 0 ? it.serialNos.join(',') : null
        }))
      };
      api.createSaleInvoice(invoicePayload).catch(err => {
        console.warn('Backend offline, bill kept in local state:', err);
      });
    } catch (e) {
      console.warn('Error queuing sale invoice sync:', e);
    }
  };


  const handleAddCustomer = (newCust: Customer) => {
    setCustomers(prev => prev.some(x => x.id === newCust.id || x.phone === newCust.phone) ? prev.map(x => (x.id === newCust.id || x.phone === newCust.phone) ? newCust : x) : [newCust, ...prev]);
    api.createCustomer({
      name: newCust.name,
      phone: newCust.phone,
      state: newCust.state || 'Kerala',
      address: newCust.address || '',
      city: newCust.city || '',
      gstin: newCust.gstin || '',
      opening_balance: newCust.openingBalance || 0,
      current_balance: newCust.balance || 0,
      credit_limit: newCust.creditLimit || 50000,
      loyalty_points: newCust.loyaltyPoints || 0,
      email: newCust.email || ''
    }).catch(err => console.warn('Backend offline, customer kept in local state:', err));
  };

  const handleUpdateCustomer = (updatedCust: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCust.id ? updatedCust : c));
    const numId = parseInt(updatedCust.id.replace(/\D/g, ''), 10) || 1;
    api.updateCustomer(numId, {
      name: updatedCust.name,
      phone: updatedCust.phone,
      state: updatedCust.state || 'Kerala',
      address: updatedCust.address || '',
      city: updatedCust.city || '',
      gstin: updatedCust.gstin || '',
      current_balance: updatedCust.balance || 0,
      credit_limit: updatedCust.creditLimit || 50000,
      loyalty_points: updatedCust.loyaltyPoints || 0,
      email: updatedCust.email || ''
    }).catch(err => console.warn('Backend offline, customer update kept locally:', err));
  };

  // Product Add / Update Callbacks
  const handleAddProduct = (newProd: Product) => {
    setProducts(prev => [newProd, ...prev]);
    api.createProduct({
      name: newProd.name,
      p_code: newProd.pCode,
      barcode: newProd.barcode,
      purchase_price: newProd.purchasePrice,
      retail_price: newProd.retailPrice,
      wholesale_price: newProd.wholesalePrice || newProd.retailPrice,
      mrp: newProd.mrp,
      opening_stock: newProd.openingStock,
      current_stock: newProd.openingStock,
      category_name: newProd.category,
      sub_category: newProd.subCategory,
      description: newProd.description,
      hsn_code: newProd.hsn,
      cgst: newProd.cgst,
      sgst: newProd.sgst,
      igst: newProd.igst,
      sales_unit: newProd.salesUnit,
      godown: newProd.godown,
      rack: newProd.rack
    }).catch(err => console.warn('Backend offline, product kept in local state:', err));
  };

  const handleUpdateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    const numId = parseInt(updated.id.replace(/\D/g, ''), 10) || 1;
    api.updateProduct(numId, {
      name: updated.name,
      p_code: updated.pCode,
      barcode: updated.barcode,
      purchase_price: updated.purchasePrice,
      retail_price: updated.retailPrice,
      wholesale_price: updated.wholesalePrice || updated.retailPrice,
      mrp: updated.mrp,
      current_stock: updated.openingStock,
      category_name: updated.category,
      sub_category: updated.subCategory,
      description: updated.description,
      hsn_code: updated.hsn,
      cgst: updated.cgst,
      sgst: updated.sgst,
      igst: updated.igst,
      sales_unit: updated.salesUnit,
      godown: updated.godown,
      rack: updated.rack
    }).catch(err => console.warn('Backend offline, product update kept locally:', err));
  };

  const handleAddCategory = (newCat: Category) => {
    setCategories(prev => [...prev, newCat]);
  };

  const handleAddSubCategory = (newSub: SubCategory) => {
    setSubCategories(prev => [...prev, newSub]);
  };

  // Stock deduction callback from POS sale (supports Video 23 fractional unit conversion)
  const handleStockDeduct = (barcode: string, qty: number) => {
    setProducts(prev =>
      prev.map(p =>
        p.barcode === barcode
          ? { ...p, openingStock: Math.max(0, Number((p.openingStock - qty).toFixed(3))) }
          : p
      )
    );
  };

  // Purchase inward callback
  const handleAddStockInward = (barcode: string, addQty: number, newPurchasePrice?: number) => {
    setProducts(prev =>
      prev.map(p =>
        p.barcode === barcode
          ? {
              ...p,
              openingStock: p.openingStock + addQty,
              purchasePrice: newPurchasePrice !== undefined ? newPurchasePrice : p.purchasePrice
            }
          : p
      )
    );
  };

  // Purchase inward record callback with backend persistence
  const handleSavePurchaseInvoiceRecord = (record: PurchaseRecordItem) => {
    setPurchaseRecords(prev => [record, ...prev]);

    const matchedProduct = products.find(p => p.barcode === record.barcode || p.pCode === record.productCode);
    const productId = matchedProduct ? parseInt(matchedProduct.id.replace(/\D/g, ''), 10) || null : null;

    try {
      const purchasePayload = {
        invoice_no: record.invoiceNo || `PUR-${Date.now()}`,
        date: record.invoiceDate || new Date().toISOString().split('T')[0],
        supplier_invoice_no: record.supplierInvoiceNo || null,
        supplier_invoice_date: record.supplierInvoiceDate || null,
        supplier_id: 1,
        supplier_name: record.supplierName || 'Century Ply & Godrej Interio Primary Supplier',
        gstin: record.gstin || '32AAACD1234F1Z5',
        state: record.state || 'Kerala',
        tax_type: record.taxType || 'GST',
        purchase_type: 'Credit',
        reverse_charges: 'No',
        sub_total: Number(record.taxableAmount || 0),
        cgst: Number(record.cgstAmount || 0),
        sgst: Number(record.sgstAmount || 0),
        igst: Number(record.igstAmount || 0),
        cess: Number(record.cessAmount || 0),
        round_off: 0,
        grand_total: Number(record.totalAmount || 0),
        items: [
          {
            product_id: productId,
            product_code: record.productCode,
            product_name: record.productName,
            barcode: record.barcode,
            hsn_code: record.hsnCode,
            qty: Number(record.qty || 1),
            unit: record.unit || 'PCS',
            purchase_price: Number(record.purchasePrice || 0),
            mrp: Number(record.mrp || 0),
            retail_price: Number(record.retailPrice || 0),
            wholesale_price: Number(record.wholesalePrice || 0),
            taxable_amount: Number(record.taxableAmount || 0),
            cgst_percent: Number(record.cgstPercent || 0),
            cgst_amount: Number(record.cgstAmount || 0),
            sgst_percent: Number(record.sgstPercent || 0),
            sgst_amount: Number(record.sgstAmount || 0),
            igst_percent: Number(record.igstPercent || 0),
            igst_amount: Number(record.igstAmount || 0),
            total_amount: Number(record.totalAmount || 0),
            colour: record.colour || null,
            size: record.size || null,
            batch_no: null
          }
        ]
      };
      api.createPurchase(purchasePayload).catch(err => {
        console.warn('Backend offline, purchase inward saved to local state:', err);
      });
    } catch (e) {
      console.warn('Error formatting purchase inward payload:', e);
    }
  };

  // Stock adjustment callback
  const handleApplyAdjustment = (adj: StockAdjustment) => {
    setAdjustments(prev => [adj, ...prev]);
    setProducts(prev =>
      prev.map(p =>
        p.barcode === adj.barcode
          ? { ...p, openingStock: adj.physicalStock }
          : p
      )
    );
  };

  // Customer debt payment callback
  const handleCollectCustomerPayment = (customerId: string, amount: number) => {
    setCustomers(prev =>
      prev.map(c =>
        c.id === customerId
          ? { ...c, balance: Math.max(0, c.balance - amount) }
          : c
      )
    );
  };

  // Quick Barcode Print jump
  const handlePrintBarcode = (prod: Product) => {
    setSelectedBarcodeProduct(prod);
    setActiveWorkspace('BARCODE_DESIGNER');
  };

  if (activeWorkspace === 'CUSTOMER_PORTAL') {
    return (
      <CustomerShowroomPortalView
        products={products}
        companyInfo={companyInfo}
        initialSku={initialScannedSku || selectedBarcodeProduct?.pCode}
        onExitToPos={() => setActiveWorkspace('DESKTOP_HOME')}
      />
    );
  }

  return (
    <div className="rd-desktop-container">
      {/* 1. TOP WINDOWS TITLEBAR, MENUBAR & QUICK RIBBON */}
      <DesktopHeader
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={setActiveWorkspace}
        isAdmin={isAdmin}
        onToggleAdmin={() => setIsAdmin(!isAdmin)}
        companyName={currentCompany.name}
        financialYear={currentCompany.financialYear}
        currentLanguage={currentLanguage}
        onSelectLanguage={setCurrentLanguage}
        currentUser={currentUser}
        userPermissions={userPermissions[currentUser.userId] || DEFAULT_USER_PERMISSIONS_ALL}
        onOpenCompanyMaster={() => setShowCompanyMaster(true)}
        onOpenBankingMaster={() => setShowBankingMaster(true)}
        onOpenPrefixSuffix={() => setShowPrefixSuffix(true)}
        onOpenReceiptEntry={() => setShowReceiptEntry(true)}
        onOpenOutstandingReport={() => setShowOutstandingReport(true)}
        onOpenProductBulkEditor={() => setShowBulkEditor(true)}
        onOpenSalePriceEditor={() => setShowPriceEditor(true)}
        onOpenSalesmanPayment={() => setShowSalesmanPayment(true)}
        onOpenSalesmanLedger={() => setShowSalesmanLedger(true)}
        onOpenTerminalSetting={() => setShowTerminalSetting(true)}
        onOpenUserRegistration={() => setShowUserRegistration(true)}
        onOpenUserControl={() => setShowUserControl(true)}
        onOpenChangePassword={() => setShowChangePassword(true)}
        onOpenCreateCompany={() => setShowCreateCompany(true)}
        onOpenVirtualKeyboard={() => setShowVirtualKeyboard(true)}
        onOpenProductDiscountSetting={() => setIsProductDiscountModalOpen(true)}
        onOpenAutoBackup={() => setShowAutoBackupModal(true)}
        onOpenDatabaseRestore={() => setShowDatabaseRestoreModal(true)}
        onTriggerManualBackup={handleTriggerManualBackup}
        onOpenCustomerRecords={() => setShowCustomerRecordsModal(true)}
        onOpenSupplierRecords={() => setShowSupplierRecordsModal(true)}
        onOpenCustomerOutstanding={() => {
          setOutstandingInitialEntity('CUSTOMER');
          setShowOutstandingAnalysisModal(true);
        }}
        onOpenSupplierOutstanding={() => {
          setOutstandingInitialEntity('SUPPLIER');
          setShowOutstandingAnalysisModal(true);
        }}
        onOpenProductRecords={() => setShowProductRecordsModal(true)}
        onOpenSupplierPaymentVoucher={() => {
          setSupplierPaymentTargetId('S-0004');
          setShowSupplierPaymentModal(true);
        }}
        onOpenPurchaseDashboard={() => setShowPurchaseDashboardModal(true)}
        onOpenAccountHead={() => setShowAccountHeadModal(true)}
        onOpenExpenseVoucher={() => setShowExpenseVoucherModal(true)}
        onOpenIncomeVoucher={() => setShowIncomeVoucherModal(true)}
        onOpenExpensesDashboard={() => setShowExpensesDashboardModal(true)}
        onOpenIncomeDashboard={() => setShowIncomeDashboardModal(true)}
        onOpenBankStatements={() => setShowBankStatementModal(true)}
        onOpenStockInHand={() => setShowStockInHandModal(true)}
        onOpenSalesReturn={() => setShowSalesReturnModal(true)}
        onOpenPurchaseReturn={() => setShowPurchaseReturnModal(true)}
        onOpenSalesReturnDashboard={() => setShowSalesReturnDashboardModal(true)}
        onOpenPurchaseReturnDashboard={() => setShowPurchaseReturnDashboardModal(true)}
        onOpenExpiryProductReport={() => setShowExpiryProductRecordModal(true)}
        onOpenStockEntry={() => {
          setActiveStockEntryId(undefined);
          setActiveStockEntryItems(undefined);
          setShowStockEntryModal(true);
        }}
        onOpenStockEntryRecords={() => setShowStockEntryRecordModal(true)}
        onOpenStockAdjustmentEntry={() => {
          setActiveStockAdjustmentRecord(null);
          setShowStockAdjustmentModal(true);
        }}
        onOpenStockAdjustmentRecords={() => setShowStockAdjustmentRecordModal(true)}
        onOpenPurchaseListRecords={() => setShowPurchaseRecordModal(true)}
        onOpenPurchaseReturnRecords={() => setShowPurchaseReturnRecordModal(true)}
        onOpenSmsSetting={() => setShowSmsSettingModal(true)}
        onOpenEmailSetting={() => setShowEmailSettingModal(true)}
        onLogout={handleInitiateLogout}
      />

      {/* 2. MAIN ACTIVE DESKTOP WORKSPACE CANVAS */}
      <div className="rd-canvas">
        {activeWorkspace === 'DESKTOP_HOME' && (
          <DesktopHomeView
            products={products}
            onOpenWorkspace={setActiveWorkspace}
          />
        )}

        {activeWorkspace === 'PRODUCT_ADD_SMART' && (
          <ProductAddSmartView
            products={products}
            categories={categories}
            subCategories={subCategories}
            columnConfig={columnConfig}
            companyInfo={companyInfo}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onAddCategory={handleAddCategory}
            onAddSubCategory={handleAddSubCategory}
            onUpdateColumnConfig={setColumnConfig}
            onPrintBarcode={handlePrintBarcode}
          />
        )}

        {activeWorkspace === 'SALE_POS' && (
          <SalePosView
            products={products}
            customers={customers}
            isAdmin={isAdmin}
            onStockDeduct={handleStockDeduct}
            onRecordSaleInvoice={handleRecordSaleInvoice}
            companyInfo={companyInfo}
            onUpdateCompanyInfo={setCompanyInfo}
            dSaleBills={dSaleBills}
            onRecordDSaleBill={b => setDSaleBills([b, ...dSaleBills])}
            billConfig={billConfig}
            onUpdateBillConfig={setBillConfig}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            heldCarts={heldCarts}
            onUpdateHeldCarts={setHeldCarts}
            prefixSuffixConfig={prefixSuffixConfig}
            bankAccounts={bankAccounts}
            ledgerEntries={customerLedger}
            onRecordReceipt={handleRecordReceipt}
            billsHistory={oldBills}
            onUpdateOldBill={(billId, updated) => setOldBills(prev => prev.map(b => b.id === billId ? updated : b))}
            onDeleteOldBill={(billId) => setOldBills(prev => prev.filter(b => b.id !== billId))}
            salesmen={salesmen}
            onUpdateSalesman={sm => setSalesmen(prev => prev.map(s => s.id === sm.id ? sm : s))}
            salesmanLedger={salesmanLedger}
            onSaveSalesmanPayment={handleSaveSalesmanPayment}
            stockAlertConfig={stockAlertConfig}
            onUpdateStockAlertConfig={setStockAlertConfig}
            onBulkUpdateProducts={handleBulkUpdateProducts}
            estimates={estimates}
            productSerials={productSerials}
            onUpdateProductSerials={handleUpdateProductSerials}
            quantityDiscountRules={quantityDiscountRules}
            onOpenProductDiscountSetting={() => setIsProductDiscountModalOpen(true)}
          />
        )}

        {activeWorkspace === 'RUBIC_POS' && (
          <SalePosView
            products={products}
            customers={customers}
            isAdmin={isAdmin}
            onStockDeduct={handleStockDeduct}
            onRecordSaleInvoice={handleRecordSaleInvoice}
            companyInfo={companyInfo}
            onUpdateCompanyInfo={setCompanyInfo}
            dSaleBills={dSaleBills}
            onRecordDSaleBill={b => setDSaleBills([b, ...dSaleBills])}
            billConfig={billConfig}
            onUpdateBillConfig={setBillConfig}
            onAddCustomer={c => setCustomers(prev => prev.some(x => x.id === c.id) ? prev.map(x => x.id === c.id ? c : x) : [c, ...prev])}
            onUpdateCustomer={handleUpdateCustomer}
            heldCarts={heldCarts}
            onUpdateHeldCarts={setHeldCarts}
            prefixSuffixConfig={prefixSuffixConfig}
            bankAccounts={bankAccounts}
            ledgerEntries={customerLedger}
            onRecordReceipt={handleRecordReceipt}
            billsHistory={oldBills}
            onUpdateOldBill={(billId, updated) => setOldBills(prev => prev.map(b => b.id === billId ? updated : b))}
            onDeleteOldBill={(billId) => setOldBills(prev => prev.filter(b => b.id !== billId))}
            salesmen={salesmen}
            onUpdateSalesman={sm => setSalesmen(prev => prev.map(s => s.id === sm.id ? sm : s))}
            salesmanLedger={salesmanLedger}
            onSaveSalesmanPayment={handleSaveSalesmanPayment}
            stockAlertConfig={stockAlertConfig}
            onUpdateStockAlertConfig={setStockAlertConfig}
            onBulkUpdateProducts={handleBulkUpdateProducts}
            estimates={estimates}
            productSerials={productSerials}
            onUpdateProductSerials={handleUpdateProductSerials}
            quantityDiscountRules={quantityDiscountRules}
            onOpenProductDiscountSetting={() => setIsProductDiscountModalOpen(true)}
          />
        )}

        {activeWorkspace === 'PURCHASE_INWARD' && (
          <PurchaseInwardView
            products={products}
            onAddStockInward={handleAddStockInward}
            productSerials={productSerials}
            onAddProductSerials={handleAddProductSerials}
            onOpenPurchaseDashboard={() => setShowPurchaseDashboardModal(true)}
            onSavePurchaseInvoice={handleSavePurchaseInvoiceRecord}
            onAddNewProduct={handleAddProduct}
          />
        )}

        {activeWorkspace === 'STOCK_IN_HAND' && (
          <StockInHandView products={products} onUpdateProducts={handleBulkUpdateProducts} />
        )}

        {activeWorkspace === 'STOCK_AUDIT' && (
          <StockAuditView
            products={products}
            adjustments={adjustments}
            onApplyAdjustment={handleApplyAdjustment}
          />
        )}

        {activeWorkspace === 'CUSTOMER_LEDGER' && (
          <CustomerLedgerView
            customers={customers}
            onCollectPayment={handleCollectCustomerPayment}
          />
        )}

        {activeWorkspace === 'PETTY_EXPENSES' && (
          <PettyExpensesView
            expenses={expenses}
            onAddExpense={exp => setExpenses([exp, ...expenses])}
          />
        )}

        {activeWorkspace === 'BARCODE_DESIGNER' && (
          <BarcodeDesignerView
            products={products}
            selectedProduct={selectedBarcodeProduct}
            onOpenMobilePortal={sku => {
              setInitialScannedSku(sku);
              setActiveWorkspace('CUSTOMER_PORTAL');
            }}
          />
        )}

        {activeWorkspace === 'EXPIRY_REPORT' && (
          <ExpiryProductReportView
            products={products}
            onClose={() => setActiveWorkspace('DESKTOP_HOME')}
            onWriteOffProduct={(prod, qty) => {
              const adj: StockAdjustment = {
                id: `adj-exp-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                productName: prod.name,
                barcode: prod.barcode,
                bookStock: prod.openingStock,
                physicalStock: Math.max(0, prod.openingStock - qty),
                adjustmentQty: -qty,
                reason: 'Expiry',
                approvedBy: 'Admin'
              };
              setAdjustments(prev => [adj, ...prev]);
              setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, openingStock: Math.max(0, p.openingStock - qty) } : p));
            }}
            onReturnToSupplier={() => {
              setActiveWorkspace('PURCHASE_INWARD');
            }}
          />
        )}

        {activeWorkspace === 'TAX_REPORT_GST' && (
          <TaxReportGstView customers={customers} />
        )}

        {activeWorkspace === 'SALES_INVOICE_REPORT' && (
          <SalesInvoiceReportView customers={customers} />
        )}

        {activeWorkspace === 'D_SALE_REPORT' && (
          <DSaleReportView
            dBills={dSaleBills}
            onClose={() => setActiveWorkspace('DESKTOP_HOME')}
          />
        )}

        {activeWorkspace === 'QUOTATION' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#e2e8f0', overflowY: 'auto' }}>
            <QuotationView
              products={products}
              customers={customers}
              companyInfo={companyInfo}
              quotations={quotations}
              onSaveQuotation={handleSaveQuotation}
              onDeleteQuotation={handleDeleteQuotation}
              onClose={() => setActiveWorkspace('DESKTOP_HOME')}
            />
          </div>
        )}

        {/* Video 16 Feature: Estimate / Delivery Note (Frames 0025, 0035, 0050) */}
        {activeWorkspace === 'ESTIMATE_DELIVERY' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#e2e8f0', overflowY: 'auto' }}>
            <EstimateDeliveryNoteView
              products={products}
              customers={customers}
              companyInfo={companyInfo}
              estimates={estimates}
              onSaveEstimate={handleSaveEstimate}
              onClose={() => setActiveWorkspace('DESKTOP_HOME')}
            />
          </div>
        )}

        {/* Video 16 Feature: Sales Register Bill Wise (Frames 0150, 0155) */}
        {activeWorkspace === 'SALES_REGISTER_BILL_WISE' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#e2e8f0', overflowY: 'auto' }}>
            <SalesRegisterBillWiseView
              bills={salesRegisterBills}
              onClose={() => setActiveWorkspace('DESKTOP_HOME')}
            />
          </div>
        )}
      </div>

      {/* 3. COMPANY MASTER MODAL (FRAME 240) */}
      <CompanyMasterModal
        isOpen={showCompanyMaster}
        onClose={() => setShowCompanyMaster(false)}
        companyInfo={companyInfo}
        onSave={setCompanyInfo}
      />

      {/* 4. BANKING MASTER MODAL (FRAMES 272, 278, 284) */}
      <BankingMasterModal
        isOpen={showBankingMaster}
        onClose={() => setShowBankingMaster(false)}
        banks={banks}
        branches={branches}
        accounts={bankAccounts}
        onSaveBank={(b: BankRecord) => setBanks(prev => prev.some(x => x.id === b.id) ? prev.map(x => x.id === b.id ? b : x) : [...prev, b])}
        onSaveBranch={(br: BranchRecord) => setBranches(prev => prev.some(x => x.id === br.id) ? prev.map(x => x.id === br.id ? br : x) : [...prev, br])}
        onSaveAccount={(acc: BankAccountRecord) => setBankAccounts(prev => prev.some(x => x.id === acc.id) ? prev.map(x => x.id === acc.id ? acc : x) : [...prev, acc])}
        onDeleteBank={id => setBanks(prev => prev.filter(b => b.id !== id))}
        onDeleteBranch={id => setBranches(prev => prev.filter(b => b.id !== id))}
        onDeleteAccount={id => setBankAccounts(prev => prev.filter(a => a.id !== id))}
      />

      {/* 5. PREFIX & SUFFIX SETTINGS MODAL (FRAME 221) */}
      <PrefixSuffixSettingsModal
        isOpen={showPrefixSuffix}
        onClose={() => setShowPrefixSuffix(false)}
        config={prefixSuffixConfig}
        onSave={setPrefixSuffixConfig}
      />

      {/* 6. CUSTOMER RECEIPT ENTRY MODAL (FRAME 331) */}
      <ReceiptEntryModal
        isOpen={showReceiptEntry}
        customers={customers}
        bankAccounts={bankAccounts}
        ledgerEntries={customerLedger}
        onSaveReceipt={handleRecordReceipt}
        onClose={() => setShowReceiptEntry(false)}
      />

      {/* 7. OUTSTANDING BALANCE REPORT MODAL (FRAME 362/364) */}
      <OutstandingBalanceReportModal
        isOpen={showOutstandingReport}
        customers={customers}
        ledgerEntries={customerLedger}
        onClose={() => setShowOutstandingReport(false)}
      />

      {/* 8. PRODUCT BULK EDITOR MODAL (VIDEO 19 FRAME 275) */}
      <ProductBulkEditorModal
        isOpen={showBulkEditor}
        products={products}
        onSaveProducts={(updated) => {
          handleBulkUpdateProducts(updated);
          setShowBulkEditor(false);
        }}
        onClose={() => setShowBulkEditor(false)}
      />

      {/* 9. SALE PRICE EDIT MODAL (VIDEO 19 FRAME 535) */}
      <SalePriceEditModal
        isOpen={showPriceEditor}
        products={products}
        onUpdatePrices={(barcode, prices) => {
          const updated = products.map(p => p.barcode === barcode ? {
            ...p,
            mrp: prices.mrp,
            retailPrice: prices.retailPrice,
            wholesalePrice: prices.wholesalePrice,
            purchasePrice: prices.purchasePrice ?? p.purchasePrice
          } : p);
          handleBulkUpdateProducts(updated);
          setShowPriceEditor(false);
        }}
        onClose={() => setShowPriceEditor(false)}
      />

      {/* 10. SALESMAN PAYMENT MODAL (VIDEO 19 FRAME 345) */}
      <SalesmanPaymentModal
        isOpen={showSalesmanPayment}
        salesmen={salesmen}
        ledgerEntries={salesmanLedger}
        onSavePayment={(voucher, ledgerEntry) => {
          handleSaveSalesmanPayment(voucher, ledgerEntry);
          setShowSalesmanPayment(false);
        }}
        onClose={() => setShowSalesmanPayment(false)}
      />

      {/* 11. SALESMAN LEDGER STATEMENT MODAL (VIDEO 19 FRAME 365) */}
      <SalesmanLedgerModal
        isOpen={showSalesmanLedger}
        salesmen={salesmen}
        ledgerEntries={salesmanLedger}
        onClose={() => setShowSalesmanLedger(false)}
      />

      {/* 12. TERMINAL SETTING MODAL (VIDEO 17 FRAME 0065) */}
      <TerminalSettingModal
        isOpen={showTerminalSetting}
        onClose={() => setShowTerminalSetting(false)}
        config={terminalConfig}
        onSaveConfig={setTerminalConfig}
        tills={tills}
        onSaveTill={till => {
          setTills(prev => {
            const idx = prev.findIndex(t => t.id === till.id || t.tillId === till.tillId);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = till;
              return copy;
            }
            return [...prev, till];
          });
        }}
        onDeleteTill={id => setTills(prev => prev.filter(t => t.id !== id))}
      />

      {/* 13. BOTTOM WINDOWS STATUS BAR */}
      <DesktopStatusBar
        isAdmin={isAdmin}
        onToggleAdmin={() => setIsAdmin(!isAdmin)}
        currentUser={currentUser}
        companyName={currentCompany.name}
        onOpenLoginModal={() => setShowLoginModal(true)}
      />

      {/* 14. LOGIN PANEL MODAL (VIDEO 11 FRAME 0015) */}
      <LoginModal
        isOpen={showLoginModal}
        companies={companies}
        currentCompany={currentCompany}
        onSelectCompany={handleSelectCompany}
        users={users}
        onLoginSuccess={handleLoginSuccess}
        currentLanguage={currentLanguage}
        onSelectLanguage={setCurrentLanguage}
        onOpenCreateCompany={() => setShowCreateCompany(true)}
        onOpenChangePassword={() => setShowChangePassword(true)}
        onOpenUserControl={() => setShowUserControl(true)}
        onOpenVirtualKeyboard={() => setShowVirtualKeyboard(true)}
        activeVirtualKey={activeVirtualKey}
        onClose={() => setShowLoginModal(false)}
      />

      {/* 15. LOGOUT CONFIRMATION DIALOG (VIDEO 11 FRAME 0200) */}
      {showLogoutConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999999
          }}
        >
          <div
            style={{
              width: '420px',
              backgroundColor: '#ffffff',
              border: '2px solid #0284c7',
              borderRadius: '4px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              fontFamily: 'Segoe UI, Tahoma, sans-serif'
            }}
          >
            <div
              style={{
                backgroundColor: '#0284c7',
                padding: '6px 12px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>Confirmation</span>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}
              >
                ?
              </div>
              <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 600 }}>
                Do you really want to logout from application?
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                padding: '10px 16px',
                backgroundColor: '#f1f5f9',
                borderTop: '1px solid #e2e8f0'
              }}
            >
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  setShowLoginModal(true);
                }}
                style={{
                  padding: '6px 20px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Yes
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  padding: '6px 20px',
                  backgroundColor: '#cbd5e1',
                  color: '#1e293b',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 16. USER REGISTRATION MASTER MODAL (VIDEO 11 FRAMES 0035 & 0045) */}
      <UserRegistrationModal
        isOpen={showUserRegistration}
        onClose={() => setShowUserRegistration(false)}
        users={users}
        onSaveUser={handleSaveUser}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
      />

      {/* 17. USER CONTROL 51 PERMISSION MODAL (VIDEO 11 FRAMES 0065 & 0075) */}
      <UserControlModal
        isOpen={showUserControl}
        onClose={() => setShowUserControl(false)}
        users={users}
        userPermissionsMap={userPermissions}
        onUpdatePermissions={handleUpdatePermissions}
      />

      {/* 18. CHANGE PASSWORD MODAL (VIDEO 11 FRAME 0290) */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        users={users}
        onUpdateUserPassword={handleUpdateUserPassword}
        currentUserId={currentUser.userId}
      />

      {/* 19. CREATE COMPANY MASTER MODAL (VIDEO 11 FRAME 0090) */}
      <CreateCompanyModal
        isOpen={showCreateCompany}
        onClose={() => setShowCreateCompany(false)}
        onSaveCompany={handleSaveNewCompany}
      />

      {/* 20. ON-SCREEN TOUCH VIRTUAL KEYBOARD (VIDEO 11 FRAME 0315) */}
      <VirtualKeyboard
        isOpen={showVirtualKeyboard}
        onClose={() => setShowVirtualKeyboard(false)}
        onKeyPress={(char) => setActiveVirtualKey({ char })}
        onBackspace={() => setActiveVirtualKey({ backspace: true })}
        onClear={() => setActiveVirtualKey({ clear: true })}
        onEnter={() => setActiveVirtualKey({ enter: true })}
      />

      {/* 21. PRODUCT QUANTITY BASED AUTO DISCOUNT MODAL (VIDEO 10 FRAMES 0071, 0090, 0100) */}
      <ProductDiscountSettingModal
        isOpen={isProductDiscountModalOpen}
        onClose={() => setIsProductDiscountModalOpen(false)}
        products={products}
        rules={quantityDiscountRules}
        onSaveRule={handleSaveQuantityDiscountRule}
        onRemoveRule={handleRemoveQuantityDiscountRule}
        onDeleteAllForProduct={handleDeleteAllRulesForProduct}
      />

      {/* 22. AUTO BACKUP CONFIGURATION MODAL (VIDEO 08 FRAME 0042 & 0125) */}
      <AutoBackupModal
        isOpen={showAutoBackupModal}
        config={autoBackupConfig}
        onSaveConfig={handleSaveAutoBackupConfig}
        onClose={() => setShowAutoBackupModal(false)}
      />

      {/* 23. AUTOMATED CLOUD & DRIVE BACKUP PROGRESS OVERLAY (VIDEO 08 FRAME 0145) */}
      <CloudBackupOverlay
        isOpen={showCloudBackupOverlay}
        config={autoBackupConfig}
        snapshotData={{
          version: '1.6',
          timestamp: new Date().toISOString(),
          companyInfo,
          products,
          categories,
          subCategories,
          customers,
          bills: salesRegisterBills,
          users
        }}
        onComplete={handleCloudBackupComplete}
      />

      {/* 24. DATABASE DISASTER RECOVERY & RESTORE MODAL (VIDEO 08 FRAME 0220 & 0240) */}
      <DatabaseRestoreModal
        isOpen={showDatabaseRestoreModal}
        onRestoreComplete={handleRestoreDatabase}
        onClose={() => setShowDatabaseRestoreModal(false)}
      />

      {/* 25. VIDEO 07: LIST OF CUSTOMERS MODAL (FRAME 0025) */}
      <CustomerRecordModal
        isOpen={showCustomerRecordsModal}
        customers={customers}
        onAddCustomer={newCust => {
          setCustomers(prev => [newCust, ...prev]);
          setCustomerOutstanding(prev => [
            {
              id: `c-out-${Date.now()}`,
              entityType: 'CUSTOMER',
              code: newCust.id,
              name: newCust.name,
              contactNo: newCust.phone,
              address: newCust.address,
              city: 'localcity',
              state: 'Kerala',
              totalCredit: 0,
              totalDebit: 0,
              balance: 0
            },
            ...prev
          ]);
        }}
        onSelectCustomer={() => {
          setShowCustomerRecordsModal(false);
          setActiveWorkspace('CUSTOMER_LEDGER');
        }}
        onClose={() => setShowCustomerRecordsModal(false)}
      />

      {/* 26. VIDEO 07: LIST OF SUPPLIERS MODAL (FRAME 0060) */}
      <SupplierRecordModal
        isOpen={showSupplierRecordsModal}
        suppliers={supplierOutstanding}
        onAddSupplier={newSupp => setSupplierOutstanding(prev => [newSupp, ...prev])}
        onOpenPayment={supplierId => {
          setShowSupplierRecordsModal(false);
          setSupplierPaymentTargetId(supplierId);
          setShowSupplierPaymentModal(true);
        }}
        onClose={() => setShowSupplierRecordsModal(false)}
      />

      {/* 27. VIDEO 07: OUTSTANDING ANALYSIS (CUSTOMER & SUPPLIER) MODAL (FRAMES 0105, 0110, 0205, 0330) */}
      <OutstandingAnalysisModal
        isOpen={showOutstandingAnalysisModal}
        initialEntity={outstandingInitialEntity}
        customerRecords={customerOutstanding}
        supplierRecords={supplierOutstanding}
        onUpdateRecord={updated => {
          if (updated.entityType === 'CUSTOMER') {
            setCustomerOutstanding(prev => prev.map(r => r.id === updated.id ? updated : r));
            setCustomers(prev => prev.map(c => c.id === updated.code ? { ...c, balance: updated.balance } : c));
          } else {
            setSupplierOutstanding(prev => prev.map(r => r.id === updated.id ? updated : r));
          }
        }}
        onOpenSupplierPayment={supplierId => {
          setSupplierPaymentTargetId(supplierId);
          setShowSupplierPaymentModal(true);
        }}
        onClose={() => setShowOutstandingAnalysisModal(false)}
      />

      {/* 28. VIDEO 07: SUPPLIER PAYMENT VOUCHER MODAL (FRAME 0350) */}
      <SupplierPaymentModal
        isOpen={showSupplierPaymentModal}
        suppliers={supplierOutstanding}
        initialSupplierId={supplierPaymentTargetId}
        onSavePayment={(supplierId, amount) => {
          setSupplierOutstanding(prev =>
            prev.map(s => {
              if (s.code === supplierId) {
                const newDebit = s.totalDebit + amount;
                const newBalance = s.totalCredit - newDebit;
                return {
                  ...s,
                  totalDebit: newDebit,
                  balance: newBalance
                };
              }
              return s;
            })
          );
        }}
        onClose={() => setShowSupplierPaymentModal(false)}
      />

      {/* 29. VIDEO 07: LIST OF PRODUCTS WITH 8 SEARCH FILTERS (FRAMES 0385, 0400) */}
      <ProductRecordModal
        isOpen={showProductRecordsModal}
        products={productRecords}
        onOpenBulkEditor={() => {
          setShowProductRecordsModal(false);
          setShowFullProductBulkEditorModal(true);
        }}
        onClose={() => setShowProductRecordsModal(false)}
      />

      {/* 30. VIDEO 07: PRODUCT BULK EDITOR WITH GODOWN, RACK & PART NO (FRAMES 0520, 0540) */}
      <FullProductBulkEditorModal
        isOpen={showFullProductBulkEditorModal}
        products={productRecords}
        onSaveBulkProducts={updatedList => {
          setProductRecords(updatedList);
          // Sync Rack & Godown back to main products
          setProducts(prev =>
            prev.map(p => {
              const match = updatedList.find(u => u.code === p.pCode || u.name === p.name);
              return match ? { ...p, godown: match.godown, rack: match.rack } : p;
            })
          );
        }}
        onClose={() => setShowFullProductBulkEditorModal(false)}
      />

      {/* 31. VIDEO 06: PURCHASE DASHBOARD MODAL (FRAMES 0060, 0300, 0365) */}
      <PurchaseDashboardModal
        isOpen={showPurchaseDashboardModal}
        purchaseRecords={purchaseRecords}
        onOpenPurchaseEntry={() => {
          setShowPurchaseDashboardModal(false);
          setActiveWorkspace('PURCHASE_INWARD');
        }}
        onClose={() => setShowPurchaseDashboardModal(false)}
      />

      {/* 32. VIDEO 05: ACCOUNT HEAD MASTER ENTRY (FRAMES 0475, 0650) */}
      <AccountHeadModal
        isOpen={showAccountHeadModal}
        onClose={() => setShowAccountHeadModal(false)}
        accountHeads={accountHeads}
        onSaveAccountHead={head => setAccountHeads(prev => [...prev, head])}
        onUpdateAccountHead={updated => setAccountHeads(prev => prev.map(h => h.id === updated.id ? updated : h))}
        onDeleteAccountHead={id => setAccountHeads(prev => prev.filter(h => h.id !== id))}
      />

      {/* 33. VIDEO 05: EXPENSE VOUCHER ENTRY (FRAMES 0125, 0145, 0230) */}
      <ExpenseVoucherModal
        isOpen={showExpenseVoucherModal}
        onClose={() => setShowExpenseVoucherModal(false)}
        accountHeads={accountHeads}
        expenseVouchers={expenseVouchers}
        onSaveExpenseVoucher={handleSaveExpenseVoucher}
      />

      {/* 34. VIDEO 05: INCOME VOUCHER ENTRY (FRAME 0535) */}
      <IncomeVoucherModal
        isOpen={showIncomeVoucherModal}
        onClose={() => setShowIncomeVoucherModal(false)}
        accountHeads={accountHeads}
        incomeVouchers={incomeVouchers}
        onSaveIncomeVoucher={handleSaveIncomeVoucher}
      />

      {/* 35. VIDEO 05: EXPENSES DASHBOARD (FRAME 0055) */}
      <ExpensesDashboardModal
        isOpen={showExpensesDashboardModal}
        onClose={() => setShowExpensesDashboardModal(false)}
        expenseVouchers={expenseVouchers}
        onOpenNewExpense={() => {
          setShowExpensesDashboardModal(false);
          setShowExpenseVoucherModal(true);
        }}
      />

      {/* 36. VIDEO 05: INCOME DASHBOARD (FRAME 0560) */}
      <IncomeDashboardModal
        isOpen={showIncomeDashboardModal}
        onClose={() => setShowIncomeDashboardModal(false)}
        incomeVouchers={incomeVouchers}
        onOpenNewIncome={() => {
          setShowIncomeDashboardModal(false);
          setShowIncomeVoucherModal(true);
        }}
      />

      {/* 37. VIDEO 05: BANK ACCOUNT STATEMENTS (FRAMES 0205, 0280, 0600) */}
      <BankStatementModal
        isOpen={showBankStatementModal}
        onClose={() => setShowBankStatementModal(false)}
        bankStatements={bankStatements}
      />

      {/* 38. VIDEO 04: STOCK IN HAND MODAL (FRAMES 0030, 0420) */}
      <StockInHandModal
        isOpen={showStockInHandModal}
        onClose={() => setShowStockInHandModal(false)}
        products={products}
        onOpenProductBulkEditor={() => setShowFullProductBulkEditorModal(true)}
        onUpdateProducts={handleBulkUpdateProducts}
      />

      {/* 39. VIDEO 04: SALE RETURN (CREDIT NOTE) MODAL (FRAMES 0105, 0125) */}
      <SalesReturnModal
        isOpen={showSalesReturnModal}
        onClose={() => setShowSalesReturnModal(false)}
        products={products}
        customers={customers}
        onProcessReturn={handleProcessSalesReturn}
      />

      {/* 40. VIDEO 04: PURCHASE RETURN (DEBIT NOTE) MODAL (FRAMES 0215, 0225) */}
      <PurchaseReturnModal
        isOpen={showPurchaseReturnModal}
        onClose={() => setShowPurchaseReturnModal(false)}
        products={products}
        onProcessPurchaseReturn={handleProcessPurchaseReturn}
      />

      {/* 41. VIDEO 03: SALES RETURN DASHBOARD (FRAMES 0045, 0155, 0185, 0410) */}
      <SalesReturnDashboardModal
        isOpen={showSalesReturnDashboardModal}
        onClose={() => setShowSalesReturnDashboardModal(false)}
        records={salesReturnDashboardRecords}
        onRefresh={() => {}}
      />

      {/* 42. VIDEO 03: PURCHASE RETURN DASHBOARD (FRAMES 0445, 0450) */}
      <PurchaseReturnDashboardModal
        isOpen={showPurchaseReturnDashboardModal}
        onClose={() => setShowPurchaseReturnDashboardModal(false)}
        records={purchaseReturnDashboardRecords}
        onRefresh={() => {}}
      />

      {/* 43. VIDEO 02: EXPIRY PRODUCT (ITEM AGING) RECORD MODAL (FRAMES 0055, 0065, 0215, 0230, 0270, 0375, 0430) */}
      <ExpiryProductRecordModal
        isOpen={showExpiryProductRecordModal}
        onClose={() => setShowExpiryProductRecordModal(false)}
        products={products}
        onWriteOffProduct={(prod, qty) => {
          const adj: StockAdjustment = {
            id: `adj-exp-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            productName: prod.name,
            barcode: prod.barcode,
            bookStock: prod.openingStock,
            physicalStock: Math.max(0, prod.openingStock - qty),
            adjustmentQty: -qty,
            reason: 'Expiry',
            approvedBy: 'Admin'
          };
          setAdjustments(prev => [adj, ...prev]);
          setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, openingStock: Math.max(0, p.openingStock - qty) } : p));
        }}
        onReturnToSupplier={() => {
          setShowExpiryProductRecordModal(false);
          setActiveWorkspace('PURCHASE_INWARD');
        }}
      />

      {/* 44. VIDEO 01: STOCK ENTRY (DIRECT INWARD) MODAL (FRAME 0070) */}
      <StockEntryModal
        isOpen={showStockEntryModal}
        onClose={() => setShowStockEntryModal(false)}
        products={products}
        initialStockId={activeStockEntryId}
        existingItems={activeStockEntryItems}
        onSaveStockEntry={(voucher) => {
          setStockEntryRecords(prev => [...voucher.items, ...prev]);
          setProducts(prev => {
            const updated = [...prev];
            voucher.items.forEach(it => {
              const idx = updated.findIndex(p => p.barcode === it.barcode || p.id === it.productId || p.pCode === it.productCode);
              if (idx !== -1) {
                const cur = updated[idx];
                const newQty = (cur.goodProductQty ?? cur.openingStock ?? 0) + it.qty;
                updated[idx] = {
                  ...cur,
                  goodProductQty: newQty,
                  openingStock: newQty
                };
              }
            });
            return updated;
          });
        }}
        onOpenStockEntryRecords={() => {
          setShowStockEntryModal(false);
          setShowStockEntryRecordModal(true);
        }}
      />

      {/* 45. VIDEO 01: LIST OF STOCK ENTRY RECORD MODAL (FRAME 0035) */}
      <StockEntryRecordModal
        isOpen={showStockEntryRecordModal}
        onClose={() => setShowStockEntryRecordModal(false)}
        stockEntryRecords={stockEntryRecords}
        onOpenStockEntry={(stockId, items) => {
          setActiveStockEntryId(stockId);
          setActiveStockEntryItems(items);
          setShowStockEntryRecordModal(false);
          setShowStockEntryModal(true);
        }}
      />

      {/* 46. VIDEO 01: STOCK ADJUSTMENT ENTRY MODAL (FRAME 0330) */}
      <StockAdjustmentEntryModal
        isOpen={showStockAdjustmentModal}
        onClose={() => setShowStockAdjustmentModal(false)}
        products={products}
        initialRecord={activeStockAdjustmentRecord}
        onApplyAdjustment={(adj) => {
          setStockAdjustmentRecords(prev => [adj, ...prev]);
          setProducts(prev =>
            prev.map(p => {
              if (p.barcode === adj.barcode || p.pCode === adj.productCode) {
                const curQty = p.goodProductQty ?? p.openingStock ?? 0;
                const delta = adj.adjustmentType === 'Plus' ? adj.qty : -adj.qty;
                const newQty = Math.max(0, curQty + delta);
                return {
                  ...p,
                  goodProductQty: newQty,
                  openingStock: newQty
                };
              }
              return p;
            })
          );
        }}
        onOpenStockAdjustmentRecords={() => {
          setShowStockAdjustmentModal(false);
          setShowStockAdjustmentRecordModal(true);
        }}
      />

      {/* 47. VIDEO 01: STOCK ADJUSTMENT RECORD MODAL (FRAME 0270) */}
      <StockAdjustmentRecordModal
        isOpen={showStockAdjustmentRecordModal}
        onClose={() => setShowStockAdjustmentRecordModal(false)}
        adjustmentRecords={stockAdjustmentRecords}
        onOpenStockAdjustmentEntry={(rec) => {
          setActiveStockAdjustmentRecord(rec || null);
          setShowStockAdjustmentRecordModal(false);
          setShowStockAdjustmentModal(true);
        }}
      />

      {/* 48. VIDEO 01: LIST OF PURCHASES MODAL (FRAME 0515) */}
      <PurchaseRecordModal
        isOpen={showPurchaseRecordModal}
        onClose={() => setShowPurchaseRecordModal(false)}
        purchaseInvoices={purchaseListItems}
        onOpenPurchaseEntry={(_invoiceNo) => {
          setShowPurchaseRecordModal(false);
          setActiveWorkspace('PURCHASE_INWARD');
        }}
      />

      {/* 49. VIDEO 01: PURCHASE RETURN RECORD MODAL (FRAME 0650) */}
      <PurchaseReturnRecordModal
        isOpen={showPurchaseReturnRecordModal}
        onClose={() => setShowPurchaseReturnRecordModal(false)}
        purchaseReturnRecords={purchaseReturnDashboardRecords}
        onOpenPurchaseReturnEntry={(_prNo) => {
          setShowPurchaseReturnRecordModal(false);
          setShowPurchaseReturnModal(true);
        }}
      />

      {/* 50. VIDEO 21: RUBIC TOUCH POS MODAL */}
      <RubicPosModal
        isOpen={showRubicPosModal || activeWorkspace === 'RUBIC_POS'}
        onClose={() => {
          setShowRubicPosModal(false);
          if (activeWorkspace === 'RUBIC_POS') {
            setActiveWorkspace('DESKTOP_HOME');
          }
        }}
        products={products}
        customers={customers}
        companyInfo={companyInfo}
        onCompleteBill={handleRecordSaleInvoice}
      />

      {/* 51. VIDEO 12: SMS GATEWAY SETTINGS MODAL */}
      <SmsSettingModal
        isOpen={showSmsSettingModal}
        onClose={() => setShowSmsSettingModal(false)}
        config={smsConfig}
        onSaveConfig={setSmsConfig}
      />

      {/* 52. VIDEO 12: EMAIL CONFIGURATION MODAL */}
      <EmailSettingModal
        isOpen={showEmailSettingModal}
        onClose={() => setShowEmailSettingModal(false)}
        config={emailConfig}
        onSaveConfig={setEmailConfig}
      />
    </div>
  );
}
