import { useState, useEffect, lazy, Suspense } from 'react';
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
  EmailConfig,
  CrmLead,
  CrmLeadStatus,
  CustomerDeliveryReview
} from './types/retailDaddy';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_SUBCATEGORIES,
  INITIAL_CUSTOMERS,
  INITIAL_EXPENSES,
  DEFAULT_COLUMN_CONFIG,
  DEFAULT_COMPANY_INFO,
  INITIAL_D_SALE_BILLS,
  DEFAULT_BILL_CONFIG,
  DEFAULT_PREFIX_SUFFIX_CONFIG,
  INITIAL_BANKS,
  INITIAL_BRANCHES,
  INITIAL_BANK_ACCOUNTS,
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
  DEFAULT_AUTO_BACKUP_CONFIG,
  INITIAL_CUSTOMER_OUTSTANDING,
  INITIAL_SUPPLIER_OUTSTANDING,
  INITIAL_PRODUCT_RECORDS,
  INITIAL_PURCHASE_RECORDS,
  INITIAL_ACCOUNT_HEADS,
  INITIAL_EXPENSE_VOUCHERS,
  INITIAL_INCOME_VOUCHERS,
  INITIAL_CRM_LEADS,
  INITIAL_DELIVERY_REVIEWS
} from './data/retailDaddyData';
import {
  INITIAL_PURCHASE_LIST_ITEMS
} from './data/retailDaddyStockData';
import { ModuleLoadingSkeleton } from './components/common/ModuleLoadingSkeleton';

// --- Eager Primary Entry Components ---
import { DesktopHeader } from './components/desktop/DesktopHeader';
import { DesktopStatusBar } from './components/desktop/DesktopStatusBar';
import { DesktopHomeView } from './components/desktop/DesktopHomeView';
import { SalePosView } from './components/pos/SalePosView';
import { LoginModal } from './components/auth/LoginModal';
import { UserRegistrationModal } from './components/auth/UserRegistrationModal';
import { UserControlModal } from './components/auth/UserControlModal';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
import { CreateCompanyModal } from './components/auth/CreateCompanyModal';
import { VirtualKeyboard } from './components/common/VirtualKeyboard';
import { CloudBackupOverlay } from './components/common/CloudBackupOverlay';
import { CustomerFacingQrDisplay } from './components/hardware/CustomerFacingQrDisplay';
import { hardwareScanner } from './services/hardwareScannerService';
import type { BankingHubTab } from './components/banking/ShowroomBankingHubModal';

// --- Lazy-Loaded Secondary ERP Modules & Modals ---
// Barcode Studio & Hardware
const BarcodeDesignerView = lazy(() => import('./components/barcode/BarcodeDesignerView').then(m => ({ default: m.BarcodeDesignerView })));
const BarcodeHardwareHubModal = lazy(() => import('./components/hardware/BarcodeHardwareHubModal').then(m => ({ default: m.BarcodeHardwareHubModal })));
const ScannedProductActionModal = lazy(() => import('./components/hardware/ScannedProductActionModal').then(m => ({ default: m.ScannedProductActionModal })));
const DynamicQrDisplayModal = lazy(() => import('./components/hardware/DynamicQrDisplayModal').then(m => ({ default: m.DynamicQrDisplayModal })));
const OutwardExitScannerModal = lazy(() => import('./components/hardware/OutwardExitScannerModal').then(m => ({ default: m.OutwardExitScannerModal })));
const FurnitureAssemblyScannerModal = lazy(() => import('./components/inventory/FurnitureAssemblyScannerModal').then(m => ({ default: m.FurnitureAssemblyScannerModal })));

// Banking, Accounting & General Ledger
const ShowroomBankingHubModal = lazy(() => import('./components/banking/ShowroomBankingHubModal').then(m => ({ default: m.ShowroomBankingHubModal })));
const FinancialStatementsModal = lazy(() => import('./components/accounting/FinancialStatementsModal').then(m => ({ default: m.FinancialStatementsModal })));
const ExpenseVoucherModal = lazy(() => import('./components/accounting/ExpenseVoucherModal').then(m => ({ default: m.ExpenseVoucherModal })));
const IncomeVoucherModal = lazy(() => import('./components/accounting/IncomeVoucherModal').then(m => ({ default: m.IncomeVoucherModal })));
const ExpensesDashboardModal = lazy(() => import('./components/accounting/ExpensesDashboardModal').then(m => ({ default: m.ExpensesDashboardModal })));
const IncomeDashboardModal = lazy(() => import('./components/accounting/IncomeDashboardModal').then(m => ({ default: m.IncomeDashboardModal })));
const AccountHeadModal = lazy(() => import('./components/accounting/AccountHeadModal').then(m => ({ default: m.AccountHeadModal })));
const ContraTransferModal = lazy(() => import('./components/accounting/ContraTransferModal').then(m => ({ default: m.ContraTransferModal })));

// Reports & Analytics
const TaxReportGstView = lazy(() => import('./components/reports/TaxReportGstView').then(m => ({ default: m.TaxReportGstView })));
const SalesInvoiceReportView = lazy(() => import('./components/reports/SalesInvoiceReportView').then(m => ({ default: m.SalesInvoiceReportView })));
const DSaleReportView = lazy(() => import('./components/reports/DSaleReportView').then(m => ({ default: m.DSaleReportView })));
const ExpiryProductReportView = lazy(() => import('./components/reports/ExpiryProductReportView').then(m => ({ default: m.ExpiryProductReportView })));
const OutstandingBalanceReportModal = lazy(() => import('./components/reports/OutstandingBalanceReportModal').then(m => ({ default: m.OutstandingBalanceReportModal })));
const SalesRegisterBillWiseView = lazy(() => import('./components/reports/SalesRegisterBillWiseView').then(m => ({ default: m.SalesRegisterBillWiseView })));
const SalesmanLedgerModal = lazy(() => import('./components/reports/SalesmanLedgerModal').then(m => ({ default: m.SalesmanLedgerModal })));

// Secondary POS Views & Quotations
const QuotationView = lazy(() => import('./components/pos/QuotationView').then(m => ({ default: m.QuotationView })));
const EstimateDeliveryNoteView = lazy(() => import('./components/pos/EstimateDeliveryNoteView').then(m => ({ default: m.EstimateDeliveryNoteView })));
const RubicPosModal = lazy(() => import('./components/pos/RubicPosModal').then(m => ({ default: m.RubicPosModal })));
const DayEndClosingModal = lazy(() => import('./components/pos/DayEndClosingModal').then(m => ({ default: m.DayEndClosingModal })));
const SalesReturnModal = lazy(() => import('./components/sales/SalesReturnModal').then(m => ({ default: m.SalesReturnModal })));
const SalesReturnDashboardModal = lazy(() => import('./components/records/SalesReturnDashboardModal').then(m => ({ default: m.SalesReturnDashboardModal })));

// Inventory, Purchases & Logistics
const StockInHandView = lazy(() => import('./components/inventory/StockInHandView').then(m => ({ default: m.StockInHandView })));
const StockAuditView = lazy(() => import('./components/inventory/StockAuditView').then(m => ({ default: m.StockAuditView })));
const StockHedgingModal = lazy(() => import('./components/inventory/StockHedgingModal').then(m => ({ default: m.StockHedgingModal })));
const StockInHandModal = lazy(() => import('./components/inventory/StockInHandModal').then(m => ({ default: m.StockInHandModal })));
const StockEntryModal = lazy(() => import('./components/inventory/StockEntryModal').then(m => ({ default: m.StockEntryModal })));
const StockEntryRecordModal = lazy(() => import('./components/records/StockEntryRecordModal').then(m => ({ default: m.StockEntryRecordModal })));
const StockAdjustmentEntryModal = lazy(() => import('./components/inventory/StockAdjustmentEntryModal').then(m => ({ default: m.StockAdjustmentEntryModal })));
const StockAdjustmentRecordModal = lazy(() => import('./components/records/StockAdjustmentRecordModal').then(m => ({ default: m.StockAdjustmentRecordModal })));
const ProductDiscountSettingModal = lazy(() => import('./components/inventory/ProductDiscountSettingModal').then(m => ({ default: m.ProductDiscountSettingModal })));
const PurchaseInwardView = lazy(() => import('./components/purchase/PurchaseInwardView').then(m => ({ default: m.PurchaseInwardView })));
const PurchaseDashboardModal = lazy(() => import('./components/records/PurchaseDashboardModal').then(m => ({ default: m.PurchaseDashboardModal })));
const PurchaseRecordModal = lazy(() => import('./components/records/PurchaseRecordModal').then(m => ({ default: m.PurchaseRecordModal })));
const PurchaseReturnModal = lazy(() => import('./components/purchases/PurchaseReturnModal').then(m => ({ default: m.PurchaseReturnModal })));
const PurchaseReturnDashboardModal = lazy(() => import('./components/records/PurchaseReturnDashboardModal').then(m => ({ default: m.PurchaseReturnDashboardModal })));
const PurchaseReturnRecordModal = lazy(() => import('./components/records/PurchaseReturnRecordModal').then(m => ({ default: m.PurchaseReturnRecordModal })));
const DeliveryPipelineModal = lazy(() => import('./components/delivery/DeliveryPipelineModal').then(m => ({ default: m.DeliveryPipelineModal })));

// Customers, Suppliers & CRM
const CustomerLedgerView = lazy(() => import('./components/customers/CustomerLedgerView').then(m => ({ default: m.CustomerLedgerView })));
const CustomerLedgerModal = lazy(() => import('./components/customers/CustomerLedgerModal').then(m => ({ default: m.CustomerLedgerModal })));
const CustomerRecordModal = lazy(() => import('./components/records/CustomerRecordModal').then(m => ({ default: m.CustomerRecordModal })));
const CustomerCreditAgingModal = lazy(() => import('./components/customers/CustomerCreditAgingModal').then(m => ({ default: m.CustomerCreditAgingModal })));
const ReceiptEntryModal = lazy(() => import('./components/customers/ReceiptEntryModal').then(m => ({ default: m.ReceiptEntryModal })));
const SupplierRecordModal = lazy(() => import('./components/records/SupplierRecordModal').then(m => ({ default: m.SupplierRecordModal })));
const SupplierPaymentModal = lazy(() => import('./components/records/SupplierPaymentModal').then(m => ({ default: m.SupplierPaymentModal })));
const OutstandingAnalysisModal = lazy(() => import('./components/records/OutstandingAnalysisModal').then(m => ({ default: m.OutstandingAnalysisModal })));
const CrmLeadsFollowupModal = lazy(() => import('./components/crm/CrmLeadsFollowupModal').then(m => ({ default: m.CrmLeadsFollowupModal })));

// Products, Portfolios & Utilities
const ProductAddSmartView = lazy(() => import('./components/products/ProductAddSmartView').then(m => ({ default: m.ProductAddSmartView })));
const ProductBulkEditorModal = lazy(() => import('./components/products/ProductBulkEditorModal').then(m => ({ default: m.ProductBulkEditorModal })));
const FullProductBulkEditorModal = lazy(() => import('./components/utilities/ProductBulkEditorModal').then(m => ({ default: m.ProductBulkEditorModal })));
const SalePriceEditModal = lazy(() => import('./components/products/SalePriceEditModal').then(m => ({ default: m.SalePriceEditModal })));
const ProductRecordModal = lazy(() => import('./components/records/ProductRecordModal').then(m => ({ default: m.ProductRecordModal })));
const ExpiryProductRecordModal = lazy(() => import('./components/records/ExpiryProductRecordModal').then(m => ({ default: m.ExpiryProductRecordModal })));
const ProductImageUploadModal = lazy(() => import('./components/utilities/ProductImageUploadModal').then(m => ({ default: m.ProductImageUploadModal })));
const ProductCatalogueModal = lazy(() => import('./components/utilities/ProductCatalogueModal').then(m => ({ default: m.ProductCatalogueModal })));
const WhatsAppBulkSenderModal = lazy(() => import('./components/utilities/WhatsAppBulkSenderModal').then(m => ({ default: m.WhatsAppBulkSenderModal })));
const FurnitureProjectsGalleryView = lazy(() => import('./components/projects/FurnitureProjectsGalleryView').then(m => ({ default: m.FurnitureProjectsGalleryView })));
const CustomerShowroomPortalView = lazy(() => import('./components/portal/CustomerShowroomPortalView').then(m => ({ default: m.CustomerShowroomPortalView })));
const WorkshopJobCardModal = lazy(() => import('./components/workshop/WorkshopJobCardModal').then(m => ({ default: m.WorkshopJobCardModal })));
const PettyExpensesView = lazy(() => import('./components/expenses/PettyExpensesView').then(m => ({ default: m.PettyExpensesView })));

// Masters & Settings
const CompanyMasterModal = lazy(() => import('./components/master/CompanyMasterModal').then(m => ({ default: m.CompanyMasterModal })));
const SalesmanPaymentModal = lazy(() => import('./components/master/SalesmanPaymentModal').then(m => ({ default: m.SalesmanPaymentModal })));
const PrefixSuffixSettingsModal = lazy(() => import('./components/settings/PrefixSuffixSettingsModal').then(m => ({ default: m.PrefixSuffixSettingsModal })));
const TerminalSettingModal = lazy(() => import('./components/settings/TerminalSettingModal').then(m => ({ default: m.TerminalSettingModal })));
const SmsSettingModal = lazy(() => import('./components/settings/SmsSettingModal').then(m => ({ default: m.SmsSettingModal })));
const EmailSettingModal = lazy(() => import('./components/settings/EmailSettingModal').then(m => ({ default: m.EmailSettingModal })));
const AutoBackupModal = lazy(() => import('./components/settings/AutoBackupModal').then(m => ({ default: m.AutoBackupModal })));
const DatabaseRestoreModal = lazy(() => import('./components/database/DatabaseRestoreModal').then(m => ({ default: m.DatabaseRestoreModal })));
import {
  api,
  mapBackendProductToFrontend,
  mapBackendCustomerToFrontend,
  mapFrontendProductToBackend,
  mapBackendSupplierToFrontend,
  mapFrontendSupplierToBackend,
  saveProductBoxComponents
} from './api/client';
import { showroomRealtime, type StoreRealtimeEvent } from './api/realtime';
import { initTelemetryListeners } from './services/telemetry';

// Pure Cloud Architecture: One-time purge of legacy browser localStorage keys
if (typeof window !== 'undefined') {
  const legacyStorageKeys = [
    'rd_products', 'rd_categories', 'rd_subcategories', 'rd_customers',
    'rd_customer_outstanding', 'rd_supplier_outstanding', 'rd_product_records',
    'rd_purchase_records', 'rd_sales_return_dashboard_records',
    'rd_purchase_return_dashboard_records', 'rd_account_heads',
    'rd_expense_vouchers', 'rd_income_vouchers', 'rd_bank_statements',
    'rd_d_sale_bills', 'rd_offline_sync_queue', 'rd_last_sync_timestamp',
    'rd_backup_database_blob', 'rd_latest_backup_meta', 'rd_quotations',
    'rd_estimates', 'rd_sale_returns', 'rd_combo_packs', 'rd_eway_bills',
    'rd_stock_entry_records', 'rd_stock_adjustment_records', 'rd_customer_ledger',
    'rd_customer_receipts', 'rd_old_bills', 'rd_salesmen', 'rd_salesman_vouchers',
    'rd_salesman_ledger', 'rd_sales_register_bills', 'rd_purchase_list_items',
    'svf_held_carts', 'svf_stock_entry_records', 'svf_stock_adjustment_records'
  ];
  legacyStorageKeys.forEach(k => {
    try { localStorage.removeItem(k); } catch {}
  });
}

export default function App() {
  // Check if opened as dedicated Customer-Facing Dynamic QR Display (Secondary screen or counter tablet)
  const isCustomerDisplayMode = typeof window !== 'undefined' &&
    (window.location.search.includes('customer-display') || window.location.hash.includes('customer-display'));
  if (isCustomerDisplayMode) {
    return <CustomerFacingQrDisplay />;
  }

  // 1. In-Memory Master State (Single Source of Truth: Railway PostgreSQL with zero-latency localStorage cache)
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    try {
      const saved = localStorage.getItem('svf_company_info');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_COMPANY_INFO;
  });
  const [dSaleBills, setDSaleBills] = useState<DSaleBill[]>(INITIAL_D_SALE_BILLS);
  const [billConfig, setBillConfig] = useState<BillTemplateConfig>(() => {
    try {
      const saved = localStorage.getItem('svf_bill_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_BILL_CONFIG;
  });
  const [showCompanyMaster, setShowCompanyMaster] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [subCategories, setSubCategories] = useState<SubCategory[]>(INITIAL_SUBCATEGORIES);
  const [columnConfig, setColumnConfig] = useState<ColumnVisibilityConfig>(() => {
    try {
      const saved = localStorage.getItem('svf_column_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_COLUMN_CONFIG;
  });
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);

  const [expenses, setExpenses] = useState<PettyExpense[]>(INITIAL_EXPENSES);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);

  // Video 20 Feature 9: Multi-Customer Cart Hold & Unhold System (Frame 197)
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);

  // Video 20 Feature 10: Dynamic Invoice Prefix & Suffix Code Configuration (Frame 221)
  const [prefixSuffixConfig, setPrefixSuffixConfig] = useState<PrefixSuffixConfig>(() => {
    try {
      const saved = localStorage.getItem('svf_prefix_suffix_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PREFIX_SUFFIX_CONFIG;
  });

  // Video 20 Feature 12: Integrated Banking Master (Frames 272, 278, 284)
  const [banks, setBanks] = useState<BankRecord[]>(INITIAL_BANKS);
  const [branches, setBranches] = useState<BranchRecord[]>(INITIAL_BRANCHES);
  const [bankAccounts, setBankAccounts] = useState<BankAccountRecord[]>(INITIAL_BANK_ACCOUNTS);

  // Video 20 Feature 13 & Video 18 Feature 1: Customer Ledger & Statement
  const [customerLedger, setCustomerLedger] = useState<CustomerLedgerEntry[]>([]);
  const [customerReceipts, setCustomerReceipts] = useState<CustomerReceiptEntry[]>([]);

  // Video 20 Feature 8: Old Bill Manager & Edit System (Frames 093, 126, 128, 130)
  const [oldBills, setOldBills] = useState<OldBillRecord[]>([]);

  // Unified Showroom Banking Hub (Replaces separate Banking Master & Decentro Banking modals)
  const [showBankingHub, setShowBankingHub] = useState<boolean>(false);
  const [bankingHubTab, setBankingHubTab] = useState<BankingHubTab>('accounts');

  const handleOpenBankingHub = (tab: BankingHubTab | 'master' = 'accounts') => {
    setBankingHubTab(tab === 'master' ? 'accounts' : tab);
    setShowBankingHub(true);
  };
  const [showPrefixSuffix, setShowPrefixSuffix] = useState<boolean>(false);
  const [showReceiptEntry, setShowReceiptEntry] = useState<boolean>(false);
  const [showOutstandingReport, setShowOutstandingReport] = useState<boolean>(false);

  // Video 19 Feature 17 & 18: Salesmen, Vouchers, Ledger, Stock Alert Config
  const [salesmen, setSalesmen] = useState<SalesmanRecord[]>(INITIAL_SALESMEN);
  const [_salesmanVouchers, setSalesmanVouchers] = useState<SalesmanPaymentVoucher[]>(INITIAL_SALESMAN_VOUCHERS);
  const [salesmanLedger, setSalesmanLedger] = useState<SalesmanLedgerEntry[]>(INITIAL_SALESMAN_LEDGER);
  const [stockAlertConfig, setStockAlertConfig] = useState<StockAlertConfig>(() => {
    try {
      const saved = localStorage.getItem('svf_stock_alert_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_STOCK_ALERT_CONFIG;
  });

  // Modals for Video 19
  const [showBulkEditor, setShowBulkEditor] = useState<boolean>(false);
  const [showPriceEditor, setShowPriceEditor] = useState<boolean>(false);
  const [showSalesmanPayment, setShowSalesmanPayment] = useState<boolean>(false);
  const [showSalesmanLedger, setShowSalesmanLedger] = useState<boolean>(false);

  // Video 17 Features: Terminal Hardware Config & Quotations (Frames 0065, 0160)
  const [terminalConfig, setTerminalConfig] = useState<TerminalConfig>(() => {
    try {
      const saved = localStorage.getItem('svf_terminal_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_TERMINAL_CONFIG;
  });
  const [tills, setTills] = useState<TillRecord[]>(() => {
    try {
      const saved = localStorage.getItem('svf_tills');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_TILLS;
  });
  const [quotations, setQuotations] = useState<QuotationRecord[]>(INITIAL_QUOTATIONS);

  // Video 16 Features: Estimates, Product Serials, Sales Register Bills (Frames 0025, 0150, 0215, 0260)
  const [estimates, setEstimates] = useState<EstimateRecord[]>(INITIAL_ESTIMATES);
  const [productSerials, setProductSerials] = useState<ProductSerial[]>(() => {
    try {
      const saved = localStorage.getItem('svf_product_serials');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_PRODUCT_SERIALS;
  });
  const [salesRegisterBills, setSalesRegisterBills] = useState<SalesRegisterBill[]>(INITIAL_SALES_REGISTER_BILLS);

  const [showTerminalSetting, setShowTerminalSetting] = useState<boolean>(false);

  // Video 11: Multi-Company, User Accounts, Permissions & Localization State
  const [companies, setCompanies] = useState<CompanyProfile[]>(INITIAL_COMPANIES);
  const [currentCompany, setCurrentCompany] = useState<CompanyProfile>(INITIAL_COMPANIES[0]);
  const [users, setUsers] = useState<UserRecord[]>(INITIAL_USERS);
  const [userPermissions, setUserPermissions] = useState<Record<string, UserControlPermissions>>(() => {
    try {
      const saved = localStorage.getItem('svf_user_permissions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_USER_PERMISSIONS;
  });
  const [currentUser, setCurrentUser] = useState<UserRecord>(INITIAL_USERS[0]);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('rd_current_language');
      if (saved) return JSON.parse(saved);
    } catch {}
    return 'ENGLISH';
  });

  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showDayEndClosingModal, setShowDayEndClosingModal] = useState<boolean>(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [showUserRegistration, setShowUserRegistration] = useState<boolean>(false);
  const [showUserControl, setShowUserControl] = useState<boolean>(false);
  const [showChangePassword, setShowChangePassword] = useState<boolean>(false);
  const [showCreateCompany, setShowCreateCompany] = useState<boolean>(false);
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState<boolean>(false);
  const [activeVirtualKey, setActiveVirtualKey] = useState<{ char?: string; backspace?: boolean; clear?: boolean; enter?: boolean } | undefined>(undefined);

  // Video 07: Customer & Supplier Outstanding Balance, Product Records & Bulk Editor State
  const [customerOutstanding, setCustomerOutstanding] = useState<OutstandingRecord[]>(INITIAL_CUSTOMER_OUTSTANDING);
  const [supplierOutstanding, setSupplierOutstanding] = useState<OutstandingRecord[]>(INITIAL_SUPPLIER_OUTSTANDING);
  const [productRecords, setProductRecords] = useState<ProductRecordItem[]>(INITIAL_PRODUCT_RECORDS);

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
  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecordItem[]>(INITIAL_PURCHASE_RECORDS);
  const [showPurchaseDashboardModal, setShowPurchaseDashboardModal] = useState<boolean>(false);

  // Video 05: Account Heads, Expenses & Incomes, and Bank Statements
  const [accountHeads, setAccountHeads] = useState<AccountHeadItem[]>(INITIAL_ACCOUNT_HEADS);
  const [expenseVouchers, setExpenseVouchers] = useState<ExpenseVoucher[]>(INITIAL_EXPENSE_VOUCHERS);
  const [incomeVouchers, setIncomeVouchers] = useState<IncomeVoucher[]>(INITIAL_INCOME_VOUCHERS);
  const [, setBankStatements] = useState<BankStatementEntry[]>([]);

  const [showAccountHeadModal, setShowAccountHeadModal] = useState<boolean>(false);
  const [showExpenseVoucherModal, setShowExpenseVoucherModal] = useState<boolean>(false);
  const [showIncomeVoucherModal, setShowIncomeVoucherModal] = useState<boolean>(false);
  const [showExpensesDashboardModal, setShowExpensesDashboardModal] = useState<boolean>(false);
  const [showIncomeDashboardModal, setShowIncomeDashboardModal] = useState<boolean>(false);
  const [showCustomerCreditAgingModal, setShowCustomerCreditAgingModal] = useState<boolean>(false);
  const [showStockHedgingModal, setShowStockHedgingModal] = useState<boolean>(false);
  const [showDeliveryPipelineModal, setShowDeliveryPipelineModal] = useState<boolean>(false);
  const [showAssemblyScannerModal, setShowAssemblyScannerModal] = useState<boolean>(false);
  const [showFinancialStatementsModal, setShowFinancialStatementsModal] = useState<boolean>(false);
  const [showWorkshopJobCardModal, setShowWorkshopJobCardModal] = useState<boolean>(false);
  const [showContraModal, setShowContraModal] = useState<boolean>(false);

  // Global API Feedback Toasts
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);

  // Global RUM Telemetry & Unhandled Rejection Listeners
  useEffect(() => {
    const cleanup = initTelemetryListeners();
    return cleanup;
  }, []);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string; type?: 'success' | 'error' | 'info' }>;
      if (customEvent.detail && customEvent.detail.message) {
        const raw = customEvent.detail.message.trim();
        const bareClean = raw.replace(/^[\s❌✅✓⚠️ℹ️]+/, '').trim().toLowerCase();
        // Suppress unhelpful bare 404, 405, and int parsing schema mismatch alerts
        if (
          !bareClean ||
          bareClean === 'not found' ||
          bareClean === 'http 404: not found' ||
          bareClean === 'method not allowed' ||
          bareClean.includes('unable to parse string as an integer') ||
          bareClean.includes('input should be a valid integer')
        ) {
          return;
        }
        const cleanMessage = raw.replace(/^[\s❌✅✓⚠️ℹ️]+/, '').trim();
        const id = `${Date.now()}-${Math.random()}`;
        const newToast = {
          id,
          message: cleanMessage,
          type: customEvent.detail.type || 'info'
        };
        setToasts(prev => [...prev.slice(-4), newToast]);
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, 6000);
      }
    };

    const handleInvoiceSettled = (e: Event) => {
      const customEvent = e as CustomEvent<{ customerId: string | number; customerName?: string; amount: number; updatedBalance: number; invoiceRef?: string }>;
      if (customEvent.detail) {
        const { customerId, customerName, amount, invoiceRef, updatedBalance } = customEvent.detail;
        const custIdStr = String(customerId);
        setOldBills(prev => {
          let rem = amount;
          return prev.map(bill => {
            const billCustId = bill.customer?.id ? String(bill.customer.id) : '';
            const match = (invoiceRef && bill.invoiceNo === invoiceRef) ||
              (billCustId === custIdStr) ||
              (customerName && bill.customerName.toLowerCase() === customerName.toLowerCase());
            if (match && (bill.balanceDue ?? 0) > 0 && rem > 0) {
              const ded = Math.min(bill.balanceDue ?? 0, rem);
              rem -= ded;
              const newPaid = Number(((bill.paidAmount || 0) + ded).toFixed(2));
              const newDue = Number(((bill.balanceDue ?? 0) - ded).toFixed(2));
              return {
                ...bill,
                paidAmount: newPaid,
                balanceDue: newDue,
                status: newDue <= 0.01 ? 'PAID' : 'PARTIAL'
              };
            }
            return bill;
          });
        });

        // 🌟 SYNC SETTLEMENT TO CUSTOMER BALANCE AND OUTSTANDING RECORDS:
        setCustomers(prev => prev.map(c => {
          if (c.id === custIdStr || (customerName && c.name.toLowerCase() === customerName.toLowerCase())) {
            return { ...c, balance: Math.max(0, Number(((c.balance || 0) - amount).toFixed(2))) };
          }
          return c;
        }));
        setCustomerOutstanding(prev => prev.map(r => {
          if (r.code === custIdStr || (customerName && r.name.toLowerCase() === customerName.toLowerCase())) {
            return { ...r, balance: Math.max(0, Number(((r.balance || 0) - amount).toFixed(2))) };
          }
          return r;
        }));

        // 🌟 SYNC SETTLEMENT TO CUSTOMER LEDGER STATEMENT & POSTGRESQL:
        const newLedger: CustomerLedgerEntry = {
          id: 'ledg-set-' + Date.now(),
          customerId: custIdStr,
          date: new Date().toLocaleDateString('en-GB'),
          voucherNo: invoiceRef || `SET-${Date.now().toString().slice(-6)}`,
          particulars: `Bill Settlement Receipt: ${invoiceRef || 'Invoice'}`,
          debit: 0.0,
          credit: amount
        };
        setCustomerLedger(prev => [...prev, newLedger]);

        const numCustId = parseInt(custIdStr.replace(/\D/g, ''), 10);
        const targetCustId = numCustId || custIdStr;
        if (targetCustId) {
          api.updateCustomer(targetCustId, {
            current_balance: Math.max(0, Number(((updatedBalance ?? 0)).toFixed(2)))
          }).catch(console.warn);
        }
      }
    };

    const handleSupplierPaymentEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ supplierId: string | number; amount: number; paymentMode?: string; voucherNo?: string }>;
      if (customEvent.detail) {
        const { supplierId, amount, paymentMode, voucherNo } = customEvent.detail;
        const suppIdStr = String(supplierId);
        setSupplierOutstanding(prev => prev.map(s => {
          if (s.id === suppIdStr || s.code === suppIdStr || s.code === `S-000${suppIdStr}`) {
            const newDebit = Number(((s.totalDebit || 0) + amount).toFixed(2));
            return { ...s, totalDebit: newDebit, balance: Math.max(0, Number(((s.totalCredit || 0) - newDebit).toFixed(2))) };
          }
          return s;
        }));
        const isBankMode = paymentMode && (paymentMode.toLowerCase().includes('bank') || paymentMode.toLowerCase().includes('upi'));
        if (isBankMode) {
          setBankAccounts(prev => prev.map((b, idx) => idx === 0 ? { ...b, balance: Number((b.balance - amount).toFixed(2)) } : b));
          setBankStatements(prev => [{
            id: `bs-sup-${Date.now()}`,
            date: new Date().toLocaleDateString('en-GB'),
            accountNo: '50200012345678',
            receiptNo: voucherNo || `SUP-PAY-${Date.now()}`,
            description: `Supplier Payout (${paymentMode}): Supplier #${suppIdStr}`,
            debit: amount,
            credit: 0
          }, ...prev]);

          api.createBankStatement({
            entry_date: new Date().toISOString().split('T')[0],
            account_no: '50200012345678',
            receipt_no: voucherNo || `SUP-PAY-${Date.now()}`,
            description: `Supplier Payout (${paymentMode}): Supplier #${suppIdStr}`,
            debit: amount,
            credit: 0,
            balance: 0
          }).catch(console.warn);
        }
        setExpenseVouchers(prev => [{
          id: `exp-sup-${Date.now()}`,
          voucherNo: voucherNo || `SUP-PAY-${Date.now()}`,
          date: new Date().toLocaleDateString('en-GB'),
          name: `Supplier #${suppIdStr} Settlement`,
          details: `Direct payment to supplier #${suppIdStr}`,
          paymentMode: isBankMode ? 'Bank' : 'Cash',
          grandTotal: amount,
          items: [{
            id: `exp-it-${Date.now()}`,
            particulars: `Supplier Settlement: #${suppIdStr}`,
            amount,
            notes: ''
          }]
        }, ...prev]);

        api.createExpenseVoucher({
          voucher_no: voucherNo || `SUP-PAY-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          name: `Supplier #${suppIdStr} Settlement`,
          details: `Direct payment to supplier #${suppIdStr}`,
          payment_mode: isBankMode ? 'Bank' : 'Cash',
          grand_total: amount
        }).catch(console.warn);
      }
    };

    const handleDecentroCollectionEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ amount: number; customerName?: string; invoiceNo?: string; utr?: string }>;
      if (customEvent.detail) {
        const { amount, customerName, invoiceNo, utr } = customEvent.detail;
        setBankAccounts(prev => prev.map((b, idx) => idx === 0 ? { ...b, balance: Number((b.balance + amount).toFixed(2)) } : b));
        setBankStatements(prev => [{
          id: `bs-dec-${Date.now()}`,
          date: new Date().toLocaleDateString('en-GB'),
          accountNo: '50200012345678',
          receiptNo: invoiceNo || `UPI-${Date.now()}`,
          description: `Decentro Dynamic UPI QR (${utr || 'Instant'}): ${customerName || 'Customer'}`,
          debit: 0,
          credit: amount
        }, ...prev]);

        api.createBankStatement({
          entry_date: new Date().toISOString().split('T')[0],
          account_no: '50200012345678',
          receipt_no: invoiceNo || `UPI-${Date.now()}`,
          description: `Decentro Dynamic UPI QR (${utr || 'Instant'}): ${customerName || 'Customer'}`,
          debit: 0,
          credit: amount,
          balance: 0
        }).catch(console.warn);
      }
    };

    const handleDecentroPayoutEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ payeeType?: string; beneficiaryName?: string; amount: number; billRef?: string; utr?: string }>;
      if (customEvent.detail) {
        const { payeeType, beneficiaryName, amount, billRef, utr } = customEvent.detail;
        setBankAccounts(prev => prev.map((b, idx) => idx === 0 ? { ...b, balance: Number((b.balance - amount).toFixed(2)) } : b));
        setBankStatements(prev => [{
          id: `bs-payout-${Date.now()}`,
          date: new Date().toLocaleDateString('en-GB'),
          accountNo: '50200012345678',
          receiptNo: billRef || `PAY-${Date.now()}`,
          description: `Decentro Instant Payout [${payeeType || 'PARTY'}] (${utr || 'IMPS'}): ${beneficiaryName || 'Beneficiary'}`,
          debit: amount,
          credit: 0
        }, ...prev]);

        api.createBankStatement({
          entry_date: new Date().toISOString().split('T')[0],
          account_no: '50200012345678',
          receipt_no: billRef || `PAY-${Date.now()}`,
          description: `Decentro Instant Payout [${payeeType || 'PARTY'}] (${utr || 'IMPS'}): ${beneficiaryName || 'Beneficiary'}`,
          debit: amount,
          credit: 0,
          balance: 0
        }).catch(console.warn);
        if (payeeType === 'SUPPLIER' && beneficiaryName) {
          setSupplierOutstanding(prev => prev.map(s => {
            if (s.name.toLowerCase().includes(beneficiaryName.toLowerCase()) || beneficiaryName.toLowerCase().includes(s.name.toLowerCase())) {
              const newDebit = Number(((s.totalDebit || 0) + amount).toFixed(2));
              return { ...s, totalDebit: newDebit, balance: Math.max(0, Number(((s.totalCredit || 0) - newDebit).toFixed(2))) };
            }
            return s;
          }));
        }
        setExpenseVouchers(prev => [{
          id: `exp-dec-${Date.now()}`,
          voucherNo: billRef || `PAY-${Date.now()}`,
          date: new Date().toLocaleDateString('en-GB'),
          name: `${beneficiaryName || 'Beneficiary'} Payout`,
          details: `Decentro Payout to ${beneficiaryName || 'Beneficiary'} (${payeeType || 'VENDOR'})`,
          paymentMode: 'Bank',
          grandTotal: amount,
          items: [{
            id: `exp-it-${Date.now()}`,
            particulars: `Decentro Instant Payout (${utr || 'IMPS'})`,
            amount,
            notes: ''
          }]
        }, ...prev]);
      }
    };

    const handleOpenDecentroEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab?: BankingHubTab | 'master' }>;
      const tab = customEvent.detail?.tab || 'qr';
      handleOpenBankingHub(tab as any);
    };

    const handleOpenBankingMasterEvent = () => {
      handleOpenBankingHub('accounts');
    };

    // 🌟 REALTIME MULTI-TERMINAL SYNCHRONIZATION:
    // Seamlessly synchronizes inventory, POS bills, delivery stages, and customer balances
    const handleRealtimeStoreEvent = (e: Event) => {
      const customEvent = e as CustomEvent<StoreRealtimeEvent>;
      const ev = customEvent.detail;
      if (!ev) return;

      switch (ev.event) {
        case 'INVENTORY_UPDATED':
        case 'STOCK_TRANSFERRED':
          api.getProducts().then(fresh => {
            if (fresh && fresh.length > 0) {
              const mapped = fresh.map(mapBackendProductToFrontend).sort((a: any, b: any) => {
                const idA = parseInt(String(a.id).replace(/\D/g, ''), 10) || 0;
                const idB = parseInt(String(b.id).replace(/\D/g, ''), 10) || 0;
                return idB - idA;
              });
              setProducts(mapped);
            }
          }).catch(() => {});
          break;
        case 'SALE_CREATED':
        case 'INVOICE_VOIDED':
          api.getSalesInvoices(0, 100).then((freshSales: any[]) => {
            if (freshSales && freshSales.length > 0) {
              setOldBills(freshSales.map(bs => ({
                id: String(bs.id),
                invoiceNo: bs.invoice_no,
                date: bs.date || new Date().toLocaleDateString('en-GB'),
                customerName: bs.customer_name || 'Cash Customer',
                contactNo: bs.customer_phone || '',
                totalQty: 1,
                netPay: bs.grand_total || 0,
                paidAmount: bs.paid_amount ?? bs.grand_total ?? 0,
                balanceDue: bs.balance_due ?? 0,
                status: (bs.balance_due ?? 0) <= 0.01 ? 'PAID' : 'PARTIAL',
                paymentMode: bs.payment_mode || 'Cash',
                customer: {
                  id: bs.customer_id ? String(bs.customer_id) : '',
                  name: bs.customer_name,
                  phone: bs.customer_phone,
                  state: bs.customer_state || 'Kerala',
                  gstin: bs.customer_gstin || ''
                },
                items: []
              })));
            }
          }).catch(() => {});
          break;
        case 'DELIVERY_UPDATED':
          window.dispatchEvent(new CustomEvent('svf-delivery-pipeline-refresh'));
          break;
        case 'CUSTOMER_UPDATED':
        case 'LEDGER_UPDATED':
          api.getCustomers().then(fresh => {
            if (fresh && fresh.length > 0) {
              setCustomers(fresh.map(mapBackendCustomerToFrontend));
            }
          }).catch(() => {});
          break;
      }
    };

    window.addEventListener('svf-toast', handleToast);
    window.addEventListener('svf-invoice-settled', handleInvoiceSettled);
    window.addEventListener('svf-supplier-payment', handleSupplierPaymentEvent);
    window.addEventListener('svf-decentro-collection', handleDecentroCollectionEvent);
    window.addEventListener('svf-decentro-payout', handleDecentroPayoutEvent);
    window.addEventListener('svf-open-decentro-banking', handleOpenDecentroEvent);
    window.addEventListener('svf-open-banking-master', handleOpenBankingMasterEvent);
    window.addEventListener('rd-store-realtime-event', handleRealtimeStoreEvent);
    const handleOpenContraEvent = () => setShowContraModal(true);
    window.addEventListener('svf-open-contra', handleOpenContraEvent);
    return () => {
      window.removeEventListener('svf-toast', handleToast);
      window.removeEventListener('svf-invoice-settled', handleInvoiceSettled);
      window.removeEventListener('svf-supplier-payment', handleSupplierPaymentEvent);
      window.removeEventListener('svf-decentro-collection', handleDecentroCollectionEvent);
      window.removeEventListener('svf-decentro-payout', handleDecentroPayoutEvent);
      window.removeEventListener('svf-open-decentro-banking', handleOpenDecentroEvent);
      window.removeEventListener('svf-open-banking-master', handleOpenBankingMasterEvent);
      window.removeEventListener('svf-open-contra', handleOpenContraEvent);
      window.removeEventListener('rd-store-realtime-event', handleRealtimeStoreEvent);
    };
  }, []);

  // Video 04: Stock In Hand, Sales Return (Credit Note), Purchase Return (Debit Note)
  const [showStockInHandModal, setShowStockInHandModal] = useState<boolean>(false);
  const [showSalesReturnModal, setShowSalesReturnModal] = useState<boolean>(false);
  const [showPurchaseReturnModal, setShowPurchaseReturnModal] = useState<boolean>(false);
  const [initialPurchaseInvoiceForReturn, setInitialPurchaseInvoiceForReturn] = useState<any>(null);

  // Video 03: Sales Return Dashboard & Purchase Return Dashboard (Frames 0045, 0450)
  const [salesReturnDashboardRecords, setSalesReturnDashboardRecords] = useState<SalesReturnDashboardItem[]>([]);
  const [purchaseReturnDashboardRecords, setPurchaseReturnDashboardRecords] = useState<PurchaseReturnDashboardItem[]>([]);

  const [showSalesReturnDashboardModal, setShowSalesReturnDashboardModal] = useState<boolean>(false);
  const [showPurchaseReturnDashboardModal, setShowPurchaseReturnDashboardModal] = useState<boolean>(false);

  // Video 01: Stock Entry & Stock Adjustment & Records State (Frames 0035, 0070, 0270, 0330, 0515, 0650)
  const [stockEntryRecords, setStockEntryRecords] = useState<StockEntryItem[]>([]);
  const [stockAdjustmentRecords, setStockAdjustmentRecords] = useState<StockAdjustmentRecordItem[]>([]);
  const [purchaseListItems, setPurchaseListItems] = useState<PurchaseInvoiceListItem[]>(INITIAL_PURCHASE_LIST_ITEMS);

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
  const [smsConfig, setSmsConfig] = useState<SmsConfig>({
    apiUrl: 'https://api.sms-gateway.in/v2/send?user=svf_enterprise&sender=SVFURN&dest={phone}&msg={msg}',
    isEnabled: true,
    isDefault: true,
    autoSmsEnabled: true,
    senderId: 'SVFURN'
  });

  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    serverName: 'Gmail',
    smtpAddress: 'smtp.gmail.com',
    emailId: 'shreevinayakafurnitures@gmail.com',
    password: '',
    port: 587,
    tlsSslRequired: 'Yes',
    isDefault: true,
    isEnabled: true
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
      const path = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
      if (path === '/project' || path === '/projects' || path.startsWith('/project/') || path.startsWith('/projects/')) {
        return 'PROJECTS_GALLERY';
      }
      const urlParams = new URLSearchParams(window.location.search);
      const wsParam = urlParams.get('ws') || urlParams.get('tab') || urlParams.get('view');
      if (wsParam === 'PROJECTS' || wsParam === 'projects' || wsParam === 'PROJECTS_GALLERY') {
        return 'PROJECTS_GALLERY';
      }
      const isPortal = urlParams.get('portal') === '1' || urlParams.get('scan') === '1' || Boolean(urlParams.get('sku') || urlParams.get('p') || urlParams.get('barcode'));
      if (isPortal) return 'CUSTOMER_PORTAL';
      if (wsParam) return wsParam as ActiveWorkspace;
      if (typeof window !== 'undefined' && (window.location.hash === '#/project' || window.location.hash === '#projects')) {
        return 'PROJECTS_GALLERY';
      }
    } catch {}
    return 'DESKTOP_HOME';
  });

  // Listen to browser Back/Forward navigation for /project route
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/project' || path === '/projects' || path.startsWith('/project/')) {
        setActiveWorkspace('PROJECTS_GALLERY');
      } else if (activeWorkspace === 'PROJECTS_GALLERY') {
        setActiveWorkspace('DESKTOP_HOME');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeWorkspace]);

  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState<Product | undefined>(undefined);


  // Video 05: Handle Save Expense Voucher with double-entry banking linkage and Railway persistence
  // Video 05: Handle Save Expense Voucher with double-entry banking linkage and Railway persistence
  const handleSaveExpenseVoucher = async (voucher: ExpenseVoucher) => {
    await api.createExpenseVoucher({
      voucher_no: voucher.voucherNo || `EXP-${Date.now()}`,
      date: voucher.date || new Date().toISOString().split('T')[0],
      name: voucher.name || 'General Expense',
      details: voucher.details || null,
      payment_mode: voucher.paymentMode || 'Cash',
      bank_ac_no: voucher.bankAcNo || null,
      grand_total: voucher.grandTotal,
      items_json: JSON.stringify(voucher.items || [])
    });

    setExpenseVouchers(prev => {
      const idx = prev.findIndex(v => v.id === voucher.id || v.voucherNo === voucher.voucherNo);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = voucher;
        return copy;
      }
      return [voucher, ...prev];
    });

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

      // Persist bank statement debit to Railway backend
      api.createBankStatement({
        entry_date: newStmt.date,
        account_no: newStmt.accountNo,
        receipt_no: newStmt.receiptNo,
        description: newStmt.description,
        debit: newStmt.debit,
        credit: newStmt.credit,
        balance: 0
      }).catch(err => console.warn('Backend bank statement creation queued:', err));

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

  const handleDeleteExpenseVoucher = async (id: string) => {
    await api.deleteExpenseVoucher(id);
    const target = expenseVouchers.find(v => v.id === id || v.voucherNo === id);
    if (target && target.paymentMode === 'Bank') {
      const amt = target.grandTotal;
      const acNo = target.bankAcNo;
      setBankAccounts(prev => prev.map(b => (!acNo || b.accountNo === acNo) ? { ...b, balance: Number((b.balance + amt).toFixed(2)) } : b));
      setBankStatements(prev => prev.filter(s => s.receiptNo !== target.voucherNo));
    }
    setExpenseVouchers(prev => prev.filter(v => v.id !== id && v.voucherNo !== id));
  };

  // Video 05: Handle Save Income Voucher with double-entry banking linkage and Railway persistence
  const handleSaveIncomeVoucher = async (voucher: IncomeVoucher) => {
    await api.createIncomeVoucher({
      voucher_no: voucher.voucherNo || `INC-${Date.now()}`,
      date: voucher.date || new Date().toISOString().split('T')[0],
      name: voucher.name || 'General Income',
      details: voucher.details || null,
      payment_mode: voucher.paymentMode || 'Cash',
      bank_ac_no: voucher.bankAcNo || null,
      grand_total: voucher.grandTotal,
      items_json: JSON.stringify(voucher.items || [])
    });

    setIncomeVouchers(prev => {
      const idx = prev.findIndex(v => v.id === voucher.id || v.voucherNo === voucher.voucherNo);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = voucher;
        return copy;
      }
      return [voucher, ...prev];
    });

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

      // Persist bank statement credit to Railway backend
      api.createBankStatement({
        entry_date: newStmt.date,
        account_no: newStmt.accountNo,
        receipt_no: newStmt.receiptNo,
        description: newStmt.description,
        debit: newStmt.debit,
        credit: newStmt.credit,
        balance: 0
      }).catch(err => console.warn('Backend bank statement creation queued:', err));

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

  const handleDeleteIncomeVoucher = async (id: string) => {
    await api.deleteIncomeVoucher(id);
    const target = incomeVouchers.find(v => v.id === id || v.voucherNo === id);
    if (target && target.paymentMode === 'Bank') {
      const amt = target.grandTotal;
      const acNo = target.bankAcNo;
      setBankAccounts(prev => prev.map(b => (!acNo || b.accountNo === acNo) ? { ...b, balance: Math.max(0, Number((b.balance - amt).toFixed(2))) } : b));
      setBankStatements(prev => prev.filter(s => s.receiptNo !== target.voucherNo));
    }
    setIncomeVouchers(prev => prev.filter(v => v.id !== id && v.voucherNo !== id));
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

  // Video 04: Sales Return (Credit Note) - Frame 0105: Customer returns goods -> Restock inventory live & sync Railway
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
        if (!match) return p;
        const newStock = p.openingStock + match.qtyReturned;
        const newPhys = (p.physical_stock ?? p.openingStock) + match.qtyReturned;
        const res = p.reserved_stock ?? 0;
        return { ...p, openingStock: newStock, physical_stock: newPhys, available_to_sell: newPhys - res };
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

    // 🌟 SYNC SALES RETURN (CREDIT NOTE) TO CUSTOMER BALANCE, LEDGER & BANK ACCOUNTS:
    if (returnDetails.paymentMode === 'Credit') {
      let updatedBal = 0;
      setCustomers(prev => prev.map(c => {
        if (c.name.toLowerCase() === returnDetails.customerName.toLowerCase()) {
          updatedBal = Math.max(0, Number((c.balance - returnDetails.totalRefund).toFixed(2)));
          return { ...c, balance: updatedBal };
        }
        return c;
      }));
      setCustomerOutstanding(prev => prev.map(r =>
        r.name.toLowerCase() === returnDetails.customerName.toLowerCase()
          ? { ...r, balance: Math.max(0, Number(((r.balance || 0) - returnDetails.totalRefund).toFixed(2))) }
          : r
      ));
      const targetCust = customers.find(c => c.name.toLowerCase() === returnDetails.customerName.toLowerCase());
      if (targetCust) {
        setCustomerLedger(prev => [{
          id: `ledg-sr-${Date.now()}`,
          customerId: targetCust.id,
          date: new Date().toLocaleDateString('en-GB'),
          voucherNo: returnDetails.returnNo,
          particulars: `Sales Return (Credit Note): ${returnDetails.returnNo} for ${returnDetails.invoiceNo}`,
          debit: 0.0,
          credit: returnDetails.totalRefund
        }, ...prev]);

        const numCustId = parseInt(targetCust.id.replace(/\D/g, ''), 10) || 1;
        const targetCustId = targetCust.id || numCustId;
        api.updateCustomer(targetCustId, { current_balance: updatedBal }).catch(console.warn);
        api.addCustomerLedger(targetCustId, {
          date: new Date().toISOString().split('T')[0],
          voucher_no: returnDetails.returnNo,
          particulars: `Sales Return Credit Note: ${returnDetails.returnNo} (${returnDetails.invoiceNo})`,
          debit: 0.0,
          credit: returnDetails.totalRefund
        }).catch(console.warn);
      }
    } else if (returnDetails.paymentMode === 'Bank') {
      setBankAccounts(prev => prev.map((b, idx) => idx === 0 ? { ...b, balance: Number((b.balance - returnDetails.totalRefund).toFixed(2)) } : b));
      setBankStatements(prev => [{
        id: `bs-sr-${Date.now()}`,
        date: new Date().toLocaleDateString('en-GB'),
        accountNo: bankAccounts[0]?.accountNo || '50200012345678',
        receiptNo: returnDetails.returnNo,
        description: `Sales Return Refund (Bank): ${returnDetails.customerName} (${returnDetails.invoiceNo})`,
        debit: returnDetails.totalRefund,
        credit: 0
      }, ...prev]);

      api.createBankStatement({
        entry_date: new Date().toISOString().split('T')[0],
        account_no: bankAccounts[0]?.accountNo || '50200012345678',
        receipt_no: returnDetails.returnNo,
        description: `Sales Return Refund (Bank): ${returnDetails.customerName} (${returnDetails.invoiceNo})`,
        debit: returnDetails.totalRefund,
        credit: 0,
        balance: 0
      }).catch(console.warn);
    } else {
      setExpenseVouchers(prev => [{
        id: `exp-sr-${Date.now()}`,
        voucherNo: returnDetails.returnNo,
        date: new Date().toLocaleDateString('en-GB'),
        name: `Sales Return Refund: ${returnDetails.customerName}`,
        details: `Cash refund for returned items on invoice ${returnDetails.invoiceNo}`,
        paymentMode: 'Cash',
        grandTotal: returnDetails.totalRefund,
        items: [{
          id: `exp-it-${Date.now()}`,
          particulars: `Sales Return Cash Refund: ${returnDetails.returnNo}`,
          amount: returnDetails.totalRefund,
          notes: ''
        }]
      }, ...prev]);

      api.createExpenseVoucher({
        voucher_no: returnDetails.returnNo,
        date: new Date().toISOString().split('T')[0],
        name: `Sales Return Refund: ${returnDetails.customerName}`,
        details: `Cash refund for returned items on invoice ${returnDetails.invoiceNo}`,
        payment_mode: 'Cash',
        grand_total: returnDetails.totalRefund
      }).catch(console.warn);
    }

    // Asynchronously persist to Railway PostgreSQL database
    api.createSaleReturn({
      return_no: returnDetails.returnNo,
      date: new Date().toISOString().split('T')[0],
      tax_type: 'GST',
      original_invoice_no: returnDetails.invoiceNo,
      customer_name: returnDetails.customerName,
      total: returnDetails.totalRefund,
      grand_total: returnDetails.totalRefund,
      payment_mode: returnDetails.paymentMode,
      items: returnDetails.items.map(it => {
        const prod = products.find(p => p.pCode === it.productCode || p.name.toUpperCase() === it.productName.toUpperCase());
        const prodId = prod ? parseInt(prod.id.replace(/\D/g, ''), 10) || null : null;
        return {
          product_id: prodId,
          product_name: it.productName,
          p_code: it.productCode,
          barcode: prod?.barcode || null,
          qty: it.qtyReturned,
          sales_rate: it.price,
          taxable_amount: it.total,
          total: it.total
        };
      })
    }).catch(err => console.warn('Backend sales return sync queued:', err));
  };

  // Video 04: Purchase Return (Debit Note) - Frame 0225: Return goods to vendor -> Deduct inventory & adjust supplier balance in Railway
  const handleProcessPurchaseReturn = (debitNote: PurchaseReturnDebitNote) => {
    setProducts(prev =>
      prev.map(p => {
        const match = debitNote.items.find(
          item => item.barcode === p.barcode || item.productName.toUpperCase() === p.name.toUpperCase()
        );
        if (!match) return p;
        const newOpening = Math.max(0, p.openingStock - match.qty);
        const newGodown = Math.max(0, (p.godown_available_qty !== undefined ? p.godown_available_qty : p.openingStock) - match.qty);
        const newPhysical = Math.max(0, (p.physical_stock !== undefined ? p.physical_stock : p.openingStock) - match.qty);
        return {
          ...p,
          openingStock: newOpening,
          godown_available_qty: newGodown,
          physical_stock: newPhysical
        };
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

    if (debitNote.paymentMode === 'Bank') {
      setBankAccounts(prev => prev.map((b, idx) => idx === 0 ? { ...b, balance: Number((b.balance + debitNote.grandTotal).toFixed(2)) } : b));
      setBankStatements(prev => [{
        id: `bs-pr-${Date.now()}`,
        date: debitNote.date || new Date().toLocaleDateString('en-GB'),
        accountNo: bankAccounts[0]?.accountNo || '50200012345678',
        receiptNo: debitNote.prNo,
        description: `Purchase Return Debit Note Refund (Bank): ${debitNote.supplierName}`,
        debit: 0,
        credit: debitNote.grandTotal
      }, ...prev]);

      api.createBankStatement({
        entry_date: new Date().toISOString().split('T')[0],
        account_no: bankAccounts[0]?.accountNo || '50200012345678',
        receipt_no: debitNote.prNo,
        description: `Purchase Return Debit Note Refund (Bank): ${debitNote.supplierName}`,
        debit: 0,
        credit: debitNote.grandTotal,
        balance: 0
      }).catch(console.warn);
    } else {
      setIncomeVouchers(prev => [{
        id: `inc-pr-${Date.now()}`,
        voucherNo: debitNote.prNo,
        date: debitNote.date || new Date().toLocaleDateString('en-GB'),
        name: `Purchase Return Cash Refund: ${debitNote.supplierName}`,
        details: `Cash refund for purchase debit note ${debitNote.prNo} against ${debitNote.originalInvoiceNo}`,
        paymentMode: 'Cash',
        grandTotal: debitNote.grandTotal,
        items: [{
          id: `inc-it-${Date.now()}`,
          particulars: `Purchase Return Refund: ${debitNote.prNo}`,
          amount: debitNote.grandTotal,
          notes: ''
        }]
      }, ...prev]);

      api.createIncomeVoucher({
        voucher_no: debitNote.prNo,
        date: new Date().toISOString().split('T')[0],
        name: `Purchase Return Cash Refund: ${debitNote.supplierName}`,
        details: `Cash refund for purchase debit note ${debitNote.prNo}`,
        payment_mode: 'Cash',
        grand_total: debitNote.grandTotal
      }).catch(console.warn);
    }

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

    // Asynchronously persist to Railway PostgreSQL database
    api.createPurchaseReturn({
      return_no: debitNote.prNo,
      date: debitNote.date || new Date().toISOString().split('T')[0],
      tax_type: debitNote.taxType || 'GST',
      original_invoice_no: debitNote.originalInvoiceNo,
      supplier_name: debitNote.supplierName,
      total: debitNote.total,
      grand_total: debitNote.grandTotal,
      items: debitNote.items.map(it => {
        const prod = products.find(p => p.barcode === it.barcode || p.name.toUpperCase() === it.productName.toUpperCase());
        const prodId = prod ? parseInt(prod.id.replace(/\D/g, ''), 10) || null : null;
        return {
          product_id: prodId,
          product_name: it.productName,
          barcode: it.barcode,
          qty: it.qty,
          purchase_rate: it.price,
          total: it.total
        };
      })
    }).catch(err => console.warn('Backend purchase return sync queued:', err));
  };

  useEffect(() => {
    localStorage.setItem('rd_current_language', JSON.stringify(currentLanguage));
  }, [currentLanguage]);

  // Video 10: Quantity-Based Auto Discount Rules (frmProductDiscount Frames 0071, 0090, 0100)
  const [quantityDiscountRules, setQuantityDiscountRules] = useState<ProductQuantityDiscountRule[]>([]);

  const [isProductDiscountModalOpen, setIsProductDiscountModalOpen] = useState<boolean>(false);

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

    const matchedProd = products.find(p => p.barcode === rule.barcode || p.pCode === rule.barcode);
    const prodId = matchedProd ? (parseInt(matchedProd.id, 10) || undefined) : undefined;
    api.createQuantityDiscountRule({
      product_id: prodId,
      barcode: rule.barcode,
      product_name: rule.productName || matchedProd?.name || '',
      min_qty: rule.minQty,
      max_qty: rule.maxQty,
      discount_percent: rule.discountPercent,
      active: true
    }).then(res => {
      if (res && res.id) {
        setQuantityDiscountRules(prev => prev.map(r => (r.barcode === rule.barcode && r.minQty === rule.minQty && r.maxQty === rule.maxQty) ? { ...r, id: String(res.id) } : r));
      }
    }).catch(console.warn);
  };

  const handleRemoveQuantityDiscountRule = (ruleId: string) => {
    setQuantityDiscountRules(prev => prev.filter(r => r.id !== ruleId));
    const numId = Number(ruleId);
    if (!isNaN(numId) && numId > 0) {
      api.deleteQuantityDiscountRule(numId).catch(console.warn);
    }
  };

  const handleDeleteAllRulesForProduct = (barcode: string) => {
    const rulesToDelete = quantityDiscountRules.filter(r => r.barcode === barcode);
    rulesToDelete.forEach(r => {
      const numId = Number(r.id);
      if (!isNaN(numId) && numId > 0) {
        api.deleteQuantityDiscountRule(numId).catch(console.warn);
      }
    });
    setQuantityDiscountRules(prev => prev.filter(r => r.barcode !== barcode));
  };

  // Video 08: Google Drive Cloud Backup & Auto Cloud Backup State (Frames 0042, 0145, 0220)
  const [autoBackupConfig, setAutoBackupConfig] = useState<AutoBackupConfig>(() => {
    try {
      const saved = localStorage.getItem('svf_auto_backup_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_AUTO_BACKUP_CONFIG;
  });

  const [showAutoBackupModal, setShowAutoBackupModal] = useState<boolean>(false);
  const [showDatabaseRestoreModal, setShowDatabaseRestoreModal] = useState<boolean>(false);
  const [showCloudBackupOverlay, setShowCloudBackupOverlay] = useState<boolean>(false);
  const [isPendingLogout, setIsPendingLogout] = useState<boolean>(false);

  // Missing Furniture Tools (Video 4erO1QEh1dE)
  const [showProductImageUploadModal, setShowProductImageUploadModal] = useState<boolean>(false);
  const [showProductCatalogueModal, setShowProductCatalogueModal] = useState<boolean>(false);
  const [showWhatsAppBulkSenderModal, setShowWhatsAppBulkSenderModal] = useState<boolean>(false);

  // Desktop Hardware Hub (Retsol R220 Printer & Brontix Barcode Scanner)
  const [showHardwareHubModal, setShowHardwareHubModal] = useState<boolean>(false);
  const [hardwareHubProduct, setHardwareHubProduct] = useState<Product | null>(null);
  const [scannedActionProduct, setScannedActionProduct] = useState<Product | null>(null);
  const [showScannedActionModal, setShowScannedActionModal] = useState<boolean>(false);
  // Dynamic QR Code Display Stand (Eventum Testware / P2M BHIM UPI Display Stand)
  const [showDynamicQrModal, setShowDynamicQrModal] = useState<boolean>(false);
  // Store Exit & Outward Gate Pass Verification Barcode Scanner
  const [showOutwardExitModal, setShowOutwardExitModal] = useState<boolean>(false);

  // CRM Leads & Customer Reviews & Customer Ledger Standalone State
  const [showStandaloneCustomerLedger, setShowStandaloneCustomerLedger] = useState<boolean>(false);
  const [showCrmLeadsModal, setShowCrmLeadsModal] = useState<boolean>(false);
  const [crmLeadsInitialTab, setCrmLeadsInitialTab] = useState<'LEADS' | 'REVIEWS'>('LEADS');
  const [activeLeadForPOS, setActiveLeadForPOS] = useState<CrmLead | null>(null);
  const [crmLeads, setCrmLeads] = useState<CrmLead[]>(INITIAL_CRM_LEADS);

  // 🌟 PERSIST & LOAD DELIVERY REVIEWS
  const [deliveryReviews, setDeliveryReviews] = useState<CustomerDeliveryReview[]>(INITIAL_DELIVERY_REVIEWS);

  // Global Brontix Desktop Barcode Scanner Listener
  useEffect(() => {
    hardwareScanner.startGlobalListener();
    const handleGlobalScan = (e: any) => {
      const detail = e.detail;
      if (!detail?.barcode) return;

      // If user is currently in POS, POS's own listener handles immediate cart addition
      if (activeWorkspace === 'SALE_POS' || activeWorkspace === 'RUBIC_POS') {
        return;
      }

      const query = detail.barcode.trim();
      const matched = products.find(p =>
        p.barcode.toLowerCase() === query.toLowerCase() ||
        p.pCode.toLowerCase() === query.toLowerCase()
      );

      if (matched) {
        setScannedActionProduct(matched);
        setShowScannedActionModal(true);
      }
    };

    window.addEventListener('svf:barcode-scanned', handleGlobalScan);
    return () => {
      window.removeEventListener('svf:barcode-scanned', handleGlobalScan);
    };
  }, [activeWorkspace, products]);

  // 🌟 PERSIST MASTER & TRANSACTION STATE TO LOCALSTORAGE (PREVENT DATA LOSS ACROSS REFRESH)
  useEffect(() => {
    try { localStorage.setItem('svf_company_info', JSON.stringify(companyInfo)); } catch {}
  }, [companyInfo]);

  useEffect(() => {
    try { localStorage.setItem('svf_prefix_suffix_config', JSON.stringify(prefixSuffixConfig)); } catch {}
  }, [prefixSuffixConfig]);

  useEffect(() => {
    try { localStorage.setItem('svf_stock_alert_config', JSON.stringify(stockAlertConfig)); } catch {}
  }, [stockAlertConfig]);

  useEffect(() => {
    try { localStorage.setItem('svf_terminal_config', JSON.stringify(terminalConfig)); } catch {}
  }, [terminalConfig]);

  useEffect(() => {
    try { localStorage.setItem('svf_tills', JSON.stringify(tills)); } catch {}
  }, [tills]);

  useEffect(() => {
    try { localStorage.setItem('svf_user_permissions', JSON.stringify(userPermissions)); } catch {}
  }, [userPermissions]);

  useEffect(() => {
    try { localStorage.setItem('svf_auto_backup_config', JSON.stringify(autoBackupConfig)); } catch {}
  }, [autoBackupConfig]);

  useEffect(() => {
    try { localStorage.setItem('svf_bill_config', JSON.stringify(billConfig)); } catch {}
  }, [billConfig]);

  useEffect(() => {
    try { localStorage.setItem('svf_column_config', JSON.stringify(columnConfig)); } catch {}
  }, [columnConfig]);

  useEffect(() => {
    try { localStorage.setItem('svf_product_serials', JSON.stringify(productSerials)); } catch {}
  }, [productSerials]);

  // 🌟 SYNC ONLINE WEBSITE INQUIRIES INTO SHOWROOM CRM LEADS PIPELINE
  useEffect(() => {
    const fetchAndMergeInquiries = async () => {
      try {
        const baseUrl = api.getBaseUrl();
        const res = await fetch(`${baseUrl}/inquiries/`);
        if (res.ok) {
          const inqs = await res.json();
          if (Array.isArray(inqs) && inqs.length > 0) {
            setCrmLeads(prevLeads => {
              let added = false;
              const merged = [...prevLeads];
              inqs.forEach((inq: any) => {
                const cleanPhone = (inq.phone || '').replace(/\D/g, '');
                if (cleanPhone && !merged.some(l => l.phone.replace(/\D/g, '') === cleanPhone)) {
                  added = true;
                  const followUp = new Date();
                  followUp.setDate(followUp.getDate() + 2);
                  merged.push({
                    id: `lead-web-${inq.id || Date.now()}`,
                    customerName: inq.customer_name || 'Web Inquirer',
                    phone: inq.phone,
                    email: inq.email || '',
                    city: 'Kozhikode',
                    status: (inq.status === 'quoted' || inq.status === 'converted') ? 'CONVERTED' : (inq.status === 'in_progress' ? 'HOT' : 'WARM'),
                    furnitureInterest: inq.furniture_title || inq.message || 'Online Catalog Inquiry',
                    estimatedBudget: 50000,
                    assignedSalesman: salesmen[0]?.name || 'Arun Kumar (Senior Consultant)',
                    followUpDate: followUp.toISOString().split('T')[0],
                    notes: `Online Inquiry #${inq.id}: ${inq.message || ''}`,
                    source: 'WEBSITE_PORTAL',
                    createdAt: inq.created_at || new Date().toISOString()
                  });
                }
              });
              return added ? merged : prevLeads;
            });
          }
        }
      } catch (err) {
        console.warn('Could not auto-sync website inquiries:', err);
      }
    };

    fetchAndMergeInquiries();
  }, [salesmen]);

  const handleUpdateProductPhoto = (productId: string, photoUrl: string) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, photo: photoUrl } : p));
    api.updateProduct(productId, { photo: photoUrl } as any).catch(e => console.warn('Product photo sync queued:', e));
  };

  const handleSaveAutoBackupConfig = async (updated: AutoBackupConfig) => {
    await api.saveBackupConfig(updated);
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
    api.restoreBackup({ data: snapshot }).catch(e => console.warn('Backend database restore queued:', e));
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
    if (COMPANY_PRODUCTS_MAP[comp.name]) {
      setProducts(COMPANY_PRODUCTS_MAP[comp.name]);
    } else {
      api.getProducts().then(prods => {
        if (prods && prods.length > 0) {
          setProducts(prods.map(mapBackendProductToFrontend));
        } else {
          setProducts(INITIAL_PRODUCTS);
        }
      }).catch(() => setProducts(INITIAL_PRODUCTS));
    }
  };

  const handleSaveUser = (u: UserRecord) => {
    setUsers(prev => [u, ...prev]);
    setUserPermissions(prev => ({
      ...prev,
      [u.userId]: { ...DEFAULT_USER_PERMISSIONS_ALL }
    }));
    api.createUser({
      username: u.userId,
      full_name: u.name,
      password: u.password,
      user_type: u.userType,
      email: u.email || null,
      contact_no: u.contactNo || null,
      active: u.isActive
    }).catch(e => console.warn('Backend user creation queued:', e));
  };

  const handleUpdateUser = (updated: UserRecord) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    if (currentUser.id === updated.id) {
      setCurrentUser(updated);
    }
    api.createUser({
      username: updated.userId,
      full_name: updated.name,
      password: updated.password,
      user_type: updated.userType,
      email: updated.email || null,
      contact_no: updated.contactNo || null,
      active: updated.isActive
    }).catch(e => console.warn('Backend user update queued:', e));
  };

  const handleDeleteUser = async (userId: string) => {
    setUsers(prev => prev.filter(u => u.userId !== userId && u.id !== userId));
    try {
      await api.deleteUser(userId);
    } catch (err) {
      console.warn('Backend deleteUser error:', err);
    }
  };

  const handleDeleteSalesman = async (salesmanId: string) => {
    setSalesmen(prev => prev.filter(s => s.id !== salesmanId && s.code !== salesmanId));
    try {
      await api.deleteSalesman(salesmanId);
    } catch (err) {
      console.warn('Backend deleteSalesman error:', err);
    }
  };

  const handleUpdateSalesman = async (sm: SalesmanRecord) => {
    setSalesmen(prev => prev.map(s => s.id === sm.id ? sm : s));
    try {
      await api.createSalesman({
        salesman_code: sm.code,
        name: sm.name,
        contact_no: sm.phone || '',
        commission_percent: sm.commissionRate ?? 2.0,
        address: sm.address || ''
      });
    } catch (err) {
      console.warn('Backend createSalesman error:', err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const res = await api.deleteProduct(productId);
      setProducts(prev => prev.filter(p => String(p.id) !== String(productId) && p.pCode !== productId && p.barcode !== productId));
      setProductRecords(prev => prev.filter(p => String(p.id) !== String(productId) && p.code !== productId && p.barcode !== productId));
      return res;
    } catch (err: any) {
      console.warn('Backend deleteProduct error:', err);
      setProducts(prev => prev.filter(p => String(p.id) !== String(productId) && p.pCode !== productId && p.barcode !== productId));
      setProductRecords(prev => prev.filter(p => String(p.id) !== String(productId) && p.code !== productId && p.barcode !== productId));
      throw err;
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      await api.deleteCustomer(customerId);
      setCustomers(prev => prev.filter(c => c.id !== customerId && (c as any).code !== customerId && c.phone !== customerId));
      setCustomerOutstanding(prev => prev.filter(c => c.id !== customerId && c.code !== customerId));
    } catch (err) {
      console.warn('Backend deleteCustomer error:', err);
      throw err;
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    try {
      await api.deleteSupplier(supplierId);
      setSupplierOutstanding(prev => prev.filter(s => s.id !== supplierId && s.code !== supplierId));
    } catch (err) {
      console.warn('Backend deleteSupplier error:', err);
      throw err;
    }
  };

  const handleDeleteStockEntry = async (stockIdOrNo: string) => {
    try {
      await api.deleteStockEntry(stockIdOrNo);
      setStockEntryRecords(prev => prev.filter(r => r.stockId !== stockIdOrNo && r.id !== stockIdOrNo));
      const freshProducts = await api.getProducts();
      if (Array.isArray(freshProducts) && freshProducts.length > 0) {
        setProducts(freshProducts.map(mapBackendProductToFrontend));
      }
      setToasts(prev => [...prev, { id: String(Date.now()), message: `✓ Stock entry ${stockIdOrNo} deleted and inventory atomically reversed in PostgreSQL`, type: 'success' }]);
    } catch (err: any) {
      setToasts(prev => [...prev, { id: String(Date.now()), message: `Delete failed: ${err.message}`, type: 'error' }]);
      throw err;
    }
  };

  const handleDeleteStockAdjustment = async (adjIdOrNo: string) => {
    try {
      await api.deleteStockAdjustment(adjIdOrNo);
      setStockAdjustmentRecords(prev => prev.filter(r => r.adjustmentId !== adjIdOrNo && r.saCode !== adjIdOrNo && r.id !== adjIdOrNo));
      const freshProducts = await api.getProducts();
      if (Array.isArray(freshProducts) && freshProducts.length > 0) {
        setProducts(freshProducts.map(mapBackendProductToFrontend));
      }
      setToasts(prev => [...prev, { id: String(Date.now()), message: `✓ Stock adjustment ${adjIdOrNo} deleted and inventory atomically reverted in PostgreSQL`, type: 'success' }]);
    } catch (err: any) {
      setToasts(prev => [...prev, { id: String(Date.now()), message: `Delete failed: ${err.message}`, type: 'error' }]);
      throw err;
    }
  };

  const handleUpdatePermissions = async (userId: string, perms: UserControlPermissions) => {
    await api.updateUserPermissions(userId, perms);
    setUserPermissions(prev => ({ ...prev, [userId]: perms }));
  };

  const handleUpdateUserPassword = (userId: string, newPass: string) => {
    setUsers(prev => prev.map(u => u.userId === userId ? { ...u, password: newPass } : u));
    if (currentUser.userId === userId) {
      setCurrentUser(prev => ({ ...prev, password: newPass }));
    }
    api.changePassword(userId, newPass).catch(e => console.warn('Backend password update queued:', e));
  };

  const handleSaveNewCompany = (comp: CompanyProfile) => {
    setCompanies(prev => [...prev, comp]);
    handleSelectCompany(comp);
    api.createTenant({
      name: comp.name,
      code: comp.id,
      db_key: 'db_' + comp.id.replace(/\W/g, '_').toLowerCase(),
      address: comp.address || null,
      contact_no: comp.contactNo || null,
      email: comp.email || null,
      gstin: comp.gstin || null,
      state: comp.state || null
    }).catch(e => console.warn('Backend tenant creation queued:', e));
  };

  const handleUpdateCompanyInfo = (info: CompanyInfo) => {
    setCompanyInfo(info);
    api.updateCompanyProfile({
      company_name: info.name,
      address: info.address,
      phone: info.phone,
      gstin: info.gstin,
      state: info.state,
      bank_name: info.bankName,
      bank_ac_no: info.accountNo,
      bank_ifsc: info.ifsc,
      bank_branch: info.branch
    }).catch(e => console.warn('Backend company profile sync queued:', e));
  };

  const handleSaveBillConfig = (config: BillTemplateConfig) => {
    setBillConfig(config);
    api.saveSystemSetting('bill_config', config).catch(e => console.warn('Backend bill config sync queued:', e));
  };

  const handleSaveTerminalConfig = async (config: TerminalConfig) => {
    await api.saveSystemSetting('terminal_config', config);
    setTerminalConfig(config);
  };

  const handleSaveStockAlertConfig = (config: StockAlertConfig) => {
    setStockAlertConfig(config);
    api.saveSystemSetting('stock_alert_config', config).catch(e => console.warn('Backend stock alert config sync queued:', e));
  };

  const handleSaveColumnConfig = (config: ColumnVisibilityConfig) => {
    setColumnConfig(config);
    api.saveSystemSetting('column_config', config).catch(e => console.warn('Backend column config sync queued:', e));
  };

  const handleSaveTill = async (till: TillRecord) => {
    const idx = tills.findIndex(t => t.id === till.id || t.tillId === till.tillId);
    const updated = idx >= 0 ? tills.map((t, i) => i === idx ? till : t) : [...tills, till];
    await api.saveSystemSetting('tills', updated);
    setTills(updated);
  };

  const handleDeleteTill = async (id: string) => {
    const updated = tills.filter(t => t.id !== id && (t as any).tillId !== id);
    await api.saveSystemSetting('tills', updated);
    setTills(updated);
  };

  const handleSaveEmailConfig = async (config: EmailConfig) => {
    await api.saveEmailConfig(config);
    setEmailConfig(config);
  };

  const handleSaveSmsConfig = async (config: SmsConfig) => {
    await api.saveSmsConfig(config);
    setSmsConfig(config);
  };

  const handleLoginSuccess = (user: UserRecord) => {
    setCurrentUser(user);
    setIsAdmin(user.userType === 'Admin' || user.userType === 'SAdmin');
    setShowLoginModal(false);
  };



  // Synchronize master data with backend API on mount
  useEffect(() => {
    let isMounted = true;
    const syncBackendData = async () => {
      try {
        const [
          backendProducts,
          backendCustomers,
          backendCompany,
          backendSuppliers,
          backendUsers,
          backendSalesmen,
          backendAccountHeads,
          backendBankStmts,
          backendPrefixes,
          backendQuotations,
          backendDiscountRules,
          backendSalesInvoices,
          backendEstimates,
          backendExpenseVouchers,
          backendIncomeVouchers,
          backendPurchases,
          backendSaleReturns,
          backendPurchaseReturns,
          backendStockEntries,
          backendStockAdjustments,
          backendCustomerLedgers,
          backendInquiries,
          backendBankAccounts,
          backendBanks,
          backendBranches,
          backendProductSerials,
          backendHeldCarts,
          backendSmsConfig,
          backendEmailConfig,
          backendBackupConfig,
          backendCategories,
          backendSystemSettings,
          backendDSaleBills,
          backendCustomerReceipts,
          backendSalesmanVouchers,
          backendSalesmanLedger,
          backendCustomerReviews,
          backendCrmLeads
        ] = await Promise.all([
          api.getProducts(),
          api.getCustomers(),
          api.getCompanyProfile(),
          api.getSuppliers(),
          api.getUsers(),
          api.getSalesmen(),
          api.getAccountHeads(),
          api.getBankStatements(),
          api.getDocumentPrefixes(),
          api.getQuotations(),
          api.getQuantityDiscountRules(),
          api.getSalesInvoices(0, 5000),
          api.getEstimates(),
          api.getExpenseVouchers(),
          api.getIncomeVouchers(),
          api.getPurchases(),
          api.getSaleReturns(),
          api.getPurchaseReturns(),
          api.getStockEntries(),
          api.getStockAdjustments(),
          api.getAllCustomerLedgers(),
          api.getInquiries(),
          api.getBankAccounts(),
          api.getBanks(),
          api.getBranches(),
          api.getProductSerials(),
          api.getHeldCarts(),
          api.getSmsConfig(),
          api.getEmailConfig(),
          api.getBackupConfig(),
          api.getCategories(),
          api.getAllSystemSettings(),
          api.getDSaleBills(),
          api.getCustomerReceipts(),
          api.getSalesmanVouchers(),
          api.getSalesmanLedger(),
          api.getCustomerReviews(),
          api.getCrmLeads()
        ]);

        if (!isMounted) return;

        if (backendSystemSettings && typeof backendSystemSettings === 'object') {
          if (backendSystemSettings.bill_config) {
            setBillConfig(prev => ({ ...prev, ...backendSystemSettings.bill_config }));
          }
          if (backendSystemSettings.terminal_config) {
            setTerminalConfig(prev => ({ ...prev, ...backendSystemSettings.terminal_config }));
          }
          if (backendSystemSettings.stock_alert_config) {
            setStockAlertConfig(prev => ({ ...prev, ...backendSystemSettings.stock_alert_config }));
          }
          if (backendSystemSettings.column_config) {
            setColumnConfig(prev => ({ ...prev, ...backendSystemSettings.column_config }));
          }
          if (Array.isArray(backendSystemSettings.tills) && backendSystemSettings.tills.length > 0) {
            setTills(backendSystemSettings.tills);
          }
        }

        if (Array.isArray(backendCategories) && backendCategories.length > 0) {
          setCategories(prev => {
            const combined = [...prev];
            for (const bc of backendCategories) {
              const idx = combined.findIndex(c => c.name.toLowerCase() === bc.name.toLowerCase() || (bc.id && c.id === String(bc.id)));
              const mapped: Category = {
                id: String(bc.id || bc.name),
                name: bc.name,
                isDefault: false
              };
              if (idx > -1) {
                combined[idx] = { ...combined[idx], ...mapped };
              } else {
                combined.push(mapped);
              }
            }
            return combined;
          });
        }

        if (Array.isArray(backendBankAccounts) && backendBankAccounts.length > 0) {
          setBankAccounts(backendBankAccounts.map((b: any) => ({
            id: String(b.id),
            accountNo: b.account_no,
            accountName: b.account_holder || b.bank_name || 'Showroom Account',
            accountType: (b.account_type === 'Savings' ? 'Savings Account' : 'Current Account') as any,
            bankName: b.bank_name,
            branchName: b.branch_name || 'Main Branch',
            balance: Number(b.current_balance || 0)
          })));
        }

        if (Array.isArray(backendBanks) && backendBanks.length > 0) {
          setBanks(backendBanks.map((b: any) => ({
            id: String(b.id),
            name: b.bank_name || b.name,
            code: b.bank_code || b.code || ''
          })));
        }

        if (Array.isArray(backendBranches) && backendBranches.length > 0) {
          setBranches(backendBranches.map((br: any) => ({
            id: String(br.id),
            bankName: br.bank_name,
            branchName: br.branch_name,
            ifsc: br.ifsc,
            address: br.address || '',
            contactNo: br.contact_no || '',
            branchCode: br.branch_code || br.ifsc || 'BR-01'
          })));
        }

        if (Array.isArray(backendProducts) && backendProducts.length > 0) {
          const mappedProducts = backendProducts.map(mapBackendProductToFrontend).sort((a: any, b: any) => {
            const idA = parseInt(String(a.id).replace(/\D/g, ''), 10) || 0;
            const idB = parseInt(String(b.id).replace(/\D/g, ''), 10) || 0;
            return idB - idA;
          });
          setProducts(mappedProducts);
          setProductRecords(mappedProducts.map(p => ({
            id: p.id,
            code: p.pCode,
            name: p.name,
            category: p.category,
            subCategory: p.subCategory,
            barcode: p.barcode,
            hsnCode: p.hsn || '9403',
            partNo: p.pCode,
            godown: p.godown || 'Showroom Floor',
            rack: p.rack || 'A1',
            mrp: p.mrp,
            retailPrice: p.retailPrice,
            wholesalePrice: p.wholesalePrice || p.retailPrice,
            openingStock: p.openingStock,
            currentStock: p.openingStock,
            saleTaxType: 'Inclusive',
            purchaseTaxType: 'Inclusive',
            active: true,
            defaultSaleQty: 1
          })));
        }

        if (Array.isArray(backendCustomers) && backendCustomers.length > 0) {
          const mappedCustomers = backendCustomers.map(mapBackendCustomerToFrontend);
          setCustomers(mappedCustomers);
        }

        if (Array.isArray(backendSuppliers) && backendSuppliers.length > 0) {
          const mappedSuppliers = backendSuppliers.map(mapBackendSupplierToFrontend);
          setSupplierOutstanding(prev => {
            const combined = [...prev];
            for (const bs of mappedSuppliers) {
              const idx = combined.findIndex(s => s.code === bs.code || s.name === bs.name);
              if (idx > -1) {
                combined[idx] = { ...combined[idx], ...bs };
              } else {
                combined.push(bs);
              }
            }
            return combined;
          });
        }

        if (Array.isArray(backendUsers) && backendUsers.length > 0) {
          setUsers(prev => {
            const combined = [...prev];
            for (const bu of backendUsers) {
              const idx = combined.findIndex(u => u.userId.toLowerCase() === bu.username.toLowerCase());
              const mapped: UserRecord = {
                id: `u-${bu.id}`,
                userId: bu.username,
                userType: (bu.user_type as any) || 'Cashier',
                password: bu.password_hash || '1234',
                name: bu.full_name,
                email: bu.email || '',
                contactNo: bu.contact_no || '',
                isActive: bu.active,
                registeredDate: new Date().toLocaleDateString('en-GB')
              };
              if (idx > -1) {
                combined[idx] = { ...combined[idx], ...mapped };
              } else {
                combined.push(mapped);
              }
              if (bu.permissions) {
                setUserPermissions(prevPerms => ({
                  ...prevPerms,
                  [bu.username]: {
                    ...prevPerms[bu.username],
                    canEditSalePrice: bu.permissions.can_edit_sale_price ?? false,
                    canGiveDiscount: bu.permissions.can_give_discount ?? false,
                    canVoidBill: bu.permissions.can_void_bill ?? false,
                    canAccessRecords: bu.permissions.can_access_records ?? true,
                    canAccessReports: bu.permissions.can_access_reports ?? false,
                    canAccessMaster: bu.permissions.can_access_master ?? false,
                    canAccessSettings: bu.permissions.can_access_settings ?? false,
                    canAccessBackup: bu.permissions.can_access_backup ?? false
                  }
                }));
              }
            }
            return combined;
          });
        }

        if (Array.isArray(backendSalesmen) && backendSalesmen.length > 0) {
          setSalesmen(prev => {
            const combined = [...prev];
            for (const bsm of backendSalesmen) {
              const idx = combined.findIndex(s => s.code === bsm.code);
              const mapped: SalesmanRecord = {
                id: `sm-${bsm.id}`,
                code: bsm.code,
                name: bsm.name,
                phone: bsm.phone || '',
                address: bsm.address || '',
                city: bsm.city || '',
                state: bsm.state || 'Kerala',
                postalCode: bsm.postal_code || '',
                email: bsm.email || '',
                commissionRate: bsm.commission_rate || 2.0,
                balance: bsm.balance || 0.0,
                photo: '👤'
              };
              if (idx > -1) {
                combined[idx] = { ...combined[idx], ...mapped };
              } else {
                combined.push(mapped);
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

        if (Array.isArray(backendAccountHeads) && backendAccountHeads.length > 0) {
          setAccountHeads(prev => {
            const combined = [...prev];
            for (const bah of backendAccountHeads) {
              const idx = combined.findIndex(h => h.accountHead.toLowerCase() === bah.name.toLowerCase());
              const mapped: AccountHeadItem = {
                id: String(bah.id),
                accountHead: bah.name,
                underGroup: (bah.under_group as any) || 'Expenses (Direct/Indirect)'
              };
              if (idx > -1) {
                combined[idx] = { ...combined[idx], ...mapped };
              } else {
                combined.push(mapped);
              }
            }
            return combined;
          });
        }

        if (Array.isArray(backendBankStmts) && backendBankStmts.length > 0) {
          setBankStatements(prev => {
            const combined = [...prev];
            for (const bbs of backendBankStmts) {
              const idx = combined.findIndex(s => s.id === String(bbs.id) || (s.receiptNo === bbs.receipt_no && s.date === bbs.entry_date));
              const mapped: BankStatementEntry = {
                id: String(bbs.id),
                date: bbs.entry_date || new Date().toLocaleDateString('en-GB'),
                accountNo: bbs.account_no || '99999999',
                receiptNo: bbs.receipt_no || '',
                description: bbs.description || 'Bank Transaction',
                debit: Number(bbs.debit) || 0,
                credit: Number(bbs.credit) || 0
              };
              if (idx > -1) {
                combined[idx] = { ...combined[idx], ...mapped };
              } else {
                combined.push(mapped);
              }
            }
            return combined;
          });
        }

        if (backendPrefixes && typeof backendPrefixes === 'object' && Object.keys(backendPrefixes).length > 0) {
          setPrefixSuffixConfig(prev => ({
            ...prev,
            ...backendPrefixes
          }));
        }

        if (Array.isArray(backendQuotations) && backendQuotations.length > 0) {
          setQuotations(prev => {
            const combined = [...prev];
            for (const bq of backendQuotations) {
              const idx = combined.findIndex(q => q.quotationNo === bq.quotation_no || q.id === String(bq.id));
              let parsedItems = [];
              try {
                parsedItems = typeof bq.items_json === 'string' ? JSON.parse(bq.items_json) : (bq.items_json || []);
              } catch {
                parsedItems = [];
              }
              const mapped: QuotationRecord = {
                id: String(bq.id || bq.quotation_no),
                quotationNo: bq.quotation_no,
                date: bq.date,
                customerId: `c-${bq.id || Date.now()}`,
                customerName: bq.customer_name,
                contactNo: bq.customer_phone || '',
                state: 'Kerala',
                gstin: '',
                items: parsedItems,
                subTotal: bq.subtotal || 0,
                cgst: 0,
                sgst: 0,
                igst: 0,
                cess: 0,
                totalDiscount: bq.discount_total || 0,
                roundOff: 0,
                grandTotal: bq.grand_total || 0,
                remarks: bq.notes || ''
              };
              if (idx > -1) {
                combined[idx] = { ...combined[idx], ...mapped };
              } else {
                combined.push(mapped);
              }
            }
            return combined;
          });
        }

        if (Array.isArray(backendDiscountRules)) {
          setQuantityDiscountRules(backendDiscountRules.map((bdr: any) => ({
            id: String(bdr.id),
            pid: bdr.barcode || bdr.id,
            barcode: bdr.barcode,
            productName: bdr.product_name,
            minQty: bdr.min_qty,
            maxQty: bdr.max_qty,
            discountPercent: bdr.discount_percent
          })));
        }

        if (Array.isArray(backendSalesInvoices) && backendSalesInvoices.length > 0) {
          setSalesRegisterBills(prev => {
            const combined = [...prev];
            for (const bs of backendSalesInvoices) {
              if (!combined.some(b => b.billNo === bs.invoice_no)) {
                combined.push({
                  id: String(bs.id),
                  billNo: bs.invoice_no,
                  date: bs.date || new Date().toLocaleDateString('en-GB'),
                  customerName: bs.customer_name || 'Cash Customer',
                  gstin: bs.customer_gstin || '',
                  billAmount: bs.grand_total || 0,
                  taxableAmount: bs.sub_total || 0,
                  cgstAmount: bs.cgst_total || 0,
                  sgstAmount: bs.sgst_total || 0,
                  igstAmount: bs.igst_total || 0,
                  cessAmount: bs.cess_total || 0,
                  otherAmount: 0
                });
              }
            }
            return combined;
          });

          setOldBills(backendSalesInvoices.map((bs: any) => {
            let parsedItems = [];
            try {
              parsedItems = typeof bs.items === 'string' ? JSON.parse(bs.items) : (bs.items || []);
            } catch {
              parsedItems = [];
            }
            return {
              id: String(bs.id),
              invoiceNo: bs.invoice_no,
              date: bs.date || new Date().toLocaleDateString('en-GB'),
              customerName: bs.customer_name || 'Cash Customer',
              contactNo: bs.customer_phone || '',
              totalQty: parsedItems.reduce((acc: number, it: any) => acc + (it.qty || 1), 0) || 1,
              netPay: bs.grand_total || 0,
              items: parsedItems,
              paymentMode: bs.payment_mode || 'Cash',
              customer: {
                id: bs.customer_id ? String(bs.customer_id) : '',
                name: bs.customer_name,
                phone: bs.customer_phone,
                state: bs.customer_state || 'Kerala',
                gstin: bs.customer_gstin || ''
              },
              paidAmount: bs.paid_amount ?? bs.grand_total ?? 0,
              balanceDue: bs.balance_due ?? 0,
              status: (bs.balance_due ?? 0) <= 0.01 ? 'PAID' : 'PARTIAL'
            };
          }));
        }

        if (Array.isArray(backendEstimates) && backendEstimates.length > 0) {
          setEstimates(prev => {
            const combined = [...prev];
            for (const be of backendEstimates) {
              if (!combined.some(e => e.estimateNo === be.estimate_no || e.id === String(be.id))) {
                let parsedItems = [];
                try {
                  parsedItems = typeof be.items === 'string' ? JSON.parse(be.items) : (be.items || []);
                } catch {
                  parsedItems = [];
                }
                combined.push({
                  id: String(be.id),
                  estimateNo: be.estimate_no,
                  date: be.date,
                  customerId: String(be.customer_id || `cust-${be.id}`),
                  customerName: be.customer_name,
                  contactNo: be.customer_phone || '',
                  phone: be.customer_phone || '',
                  state: be.state || 'Kerala',
                  gstin: be.customer_gstin || '',
                  items: parsedItems,
                  subTotal: be.sub_total || 0,
                  totalDiscount: be.discount_total || 0,
                  roundOff: be.round_off || 0,
                  grandTotal: be.grand_total || 0
                });
              }
            }
            return combined;
          });
        }

        if (Array.isArray(backendExpenseVouchers) && backendExpenseVouchers.length > 0) {
          setExpenseVouchers(prev => {
            const combined = [...prev];
            for (const bev of backendExpenseVouchers) {
              const idx = combined.findIndex(v => v.voucherNo === bev.voucher_no || v.id === String(bev.id));
              let parsedItems = [];
              try {
                parsedItems = typeof bev.items_json === 'string' ? JSON.parse(bev.items_json) : (bev.items || []);
              } catch {
                parsedItems = [];
              }
              const mapped: ExpenseVoucher = {
                id: String(bev.id),
                voucherNo: bev.voucher_no,
                date: bev.date,
                name: bev.name || bev.paid_to || 'General Expense',
                details: bev.details || '',
                items: parsedItems,
                paymentMode: (bev.payment_mode === 'Bank' ? 'Bank' : 'Cash'),
                bankAcNo: bev.bank_ac_no,
                grandTotal: Number(bev.grand_total || 0)
              };
              if (idx > -1) {
                combined[idx] = mapped;
              } else {
                combined.unshift(mapped);
              }
            }
            return combined;
          });
        }

        if (Array.isArray(backendIncomeVouchers) && backendIncomeVouchers.length > 0) {
          setIncomeVouchers(prev => {
            const combined = [...prev];
            for (const biv of backendIncomeVouchers) {
              const idx = combined.findIndex(v => v.voucherNo === biv.voucher_no || v.id === String(biv.id));
              let parsedItems = [];
              try {
                parsedItems = typeof biv.items_json === 'string' ? JSON.parse(biv.items_json) : (biv.items || []);
              } catch {
                parsedItems = [];
              }
              const mapped: IncomeVoucher = {
                id: String(biv.id),
                voucherNo: biv.voucher_no,
                date: biv.date,
                name: biv.name || biv.received_from || 'General Income',
                details: biv.details || '',
                items: parsedItems,
                paymentMode: (biv.payment_mode === 'Bank' ? 'Bank' : 'Cash'),
                bankAcNo: biv.bank_ac_no,
                grandTotal: Number(biv.grand_total || 0)
              };
              if (idx > -1) {
                combined[idx] = mapped;
              } else {
                combined.unshift(mapped);
              }
            }
            return combined;
          });
        }

        if (Array.isArray(backendPurchases) && backendPurchases.length > 0) {
          setPurchaseRecords(prev => {
            const combined = [...prev];
            for (const bp of backendPurchases) {
              const pNo = bp.invoice_no || bp.purchase_no || `PUR-${bp.id}`;
              const idx = combined.findIndex(p => p.invoiceNo === pNo || p.id === String(bp.id));
              let parsedItems = [];
              try {
                parsedItems = typeof bp.items === 'string' ? JSON.parse(bp.items) : (bp.items || []);
              } catch {
                parsedItems = [];
              }
              const firstItem = parsedItems[0] || {};
              const purDate = bp.date || bp.invoice_date || new Date().toLocaleDateString('en-GB');
              const mapped: PurchaseRecordItem = {
                id: String(bp.id),
                invoiceNo: pNo,
                invoiceDate: purDate,
                taxType: (bp.tax_type as any) || 'GST',
                supplierInvoiceNo: bp.supplier_invoice_no || pNo,
                supplierInvoiceDate: purDate,
                supplierName: bp.supplier_name || 'Vendor Hub',
                state: bp.supplier_state || bp.state || 'Kerala',
                gstin: bp.supplier_gstin || bp.gstin || '32AAACD1234F1Z5',
                productCode: firstItem.product_code || firstItem.p_code || 'FURN',
                productName: firstItem.product_name || firstItem.name || 'Furniture Inward Item',
                hsnCode: firstItem.hsn_code || '9403',
                barcode: firstItem.barcode || '',
                qty: parsedItems.reduce((acc: number, it: any) => acc + (it.qty || 1), 0) || 1,
                unit: firstItem.unit || 'PCS',
                purchasePrice: Number(firstItem.purchase_price || firstItem.price || bp.grand_total || 0),
                mrp: Number(firstItem.mrp || (firstItem.purchase_price ? firstItem.purchase_price * 1.25 : bp.grand_total) || 0),
                retailPrice: Number(firstItem.retail_price || (firstItem.purchase_price ? firstItem.purchase_price * 1.15 : bp.grand_total) || 0),
                wholesalePrice: Number(firstItem.wholesale_price || (firstItem.purchase_price ? firstItem.purchase_price * 1.08 : bp.grand_total) || 0),
                taxableAmount: Number(bp.sub_total || bp.grand_total || 0),
                cgstPercent: Number(firstItem.cgst_percent || 9),
                cgstAmount: Number(bp.cgst || 0),
                sgstPercent: Number(firstItem.sgst_percent || 9),
                sgstAmount: Number(bp.sgst || 0),
                igstPercent: Number(bp.igst ? 18 : 0),
                igstAmount: Number(bp.igst || 0),
                cessPercent: 0,
                cessAmount: 0,
                totalAmount: Number(bp.grand_total || bp.total || 0)
              };
              if (idx > -1) {
                combined[idx] = mapped;
              } else {
                combined.unshift(mapped);
              }
            }
            return combined;
          });
        }

        if (Array.isArray(backendSaleReturns) && backendSaleReturns.length > 0) {
          setSalesReturnDashboardRecords(prev => {
            const combined = [...prev];
            for (const bsr of backendSaleReturns) {
              const retNo = bsr.return_no || bsr.credit_note_no || `SR-${bsr.id}`;
              const idx = combined.findIndex(r => r.srNo === retNo || r.id === String(bsr.id));
              let firstItem: any = {};
              if (bsr.items && Array.isArray(bsr.items) && bsr.items.length > 0) {
                firstItem = bsr.items[0];
              }
              const mapped: SalesReturnDashboardItem = {
                id: String(bsr.id),
                srNo: retNo,
                srDate: bsr.date || new Date().toLocaleDateString('en-GB'),
                taxType: 'GST',
                salesInvoiceNo: bsr.original_invoice_no || bsr.invoice_no || 'SVF-INV',
                salesInvoiceDate: bsr.date || new Date().toLocaleDateString('en-GB'),
                customerId: bsr.customer_id ? String(bsr.customer_id) : undefined,
                customerName: bsr.customer_name || 'Customer',
                contactNo: bsr.customer_phone || '',
                state: 'Kerala',
                productCode: firstItem.product_code || 'FURN',
                productName: firstItem.product_name || 'Furniture Item',
                barcode: firstItem.barcode || '',
                hsnCode: firstItem.hsn_code || '9403',
                salesRate: Number(firstItem.sales_rate || 0),
                returnQty: Number(firstItem.qty || 1),
                discount: 0,
                cgstPercent: Number(firstItem.cgst_percent || 9),
                cgstAmount: Number(firstItem.cgst_amount || 0),
                sgstPercent: Number(firstItem.sgst_percent || 9),
                sgstAmount: Number(firstItem.sgst_amount || 0),
                totalRefundAmt: Number(bsr.grand_total || bsr.total_refund || 0)
              };
              if (idx > -1) {
                combined[idx] = mapped;
              } else {
                combined.unshift(mapped);
              }
            }
            return combined;
          });
        }

        if (Array.isArray(backendPurchaseReturns) && backendPurchaseReturns.length > 0) {
          setPurchaseReturnDashboardRecords(prev => {
            const combined = [...prev];
            for (const bpr of backendPurchaseReturns) {
              const retNo = bpr.return_no || bpr.debit_note_no || `PR-${bpr.id}`;
              const idx = combined.findIndex(r => r.prNo === retNo || r.id === String(bpr.id));
              let firstItem: any = {};
              if (bpr.items && Array.isArray(bpr.items) && bpr.items.length > 0) {
                firstItem = bpr.items[0];
              }
              const mapped: PurchaseReturnDashboardItem = {
                id: String(bpr.id),
                prNo: retNo,
                prDate: bpr.date || new Date().toLocaleDateString('en-GB'),
                taxType: 'GST',
                purchaseInvoiceNo: bpr.original_purchase_no || bpr.purchase_invoice_no || 'PUR-INV',
                purchaseInvoiceDate: bpr.date || new Date().toLocaleDateString('en-GB'),
                supplierId: bpr.supplier_id ? String(bpr.supplier_id) : undefined,
                supplierName: bpr.supplier_name || 'Supplier',
                contactNo: bpr.supplier_phone || '',
                state: 'Kerala',
                productCode: firstItem.product_code || 'FURN',
                productName: firstItem.product_name || 'Material Item',
                barcode: firstItem.barcode || '',
                hsnCode: firstItem.hsn_code || '9403',
                purchaseRate: Number(firstItem.purchase_rate || 0),
                returnQty: Number(firstItem.qty || 1),
                discount: 0,
                cgstPercent: Number(firstItem.cgst_percent || 9),
                cgstAmount: Number(firstItem.cgst_amount || 0),
                sgstPercent: Number(firstItem.sgst_percent || 9),
                sgstAmount: Number(firstItem.sgst_amount || 0),
                totalDebitAmt: Number(bpr.grand_total || bpr.total_debit || 0)
              };
              if (idx > -1) {
                combined[idx] = mapped;
              } else {
                combined.unshift(mapped);
              }
            }
            return combined;
          });
        }

        if (Array.isArray(backendCustomerLedgers) && backendCustomerLedgers.length > 0) {
          setCustomerLedger(prev => {
            const combined = [...prev];
            for (const bcl of backendCustomerLedgers) {
              const idx = combined.findIndex(l => (bcl.voucher_no && l.voucherNo === bcl.voucher_no) || l.id === String(bcl.id));
              const mapped: CustomerLedgerEntry = {
                id: String(bcl.id),
                customerId: String(bcl.customer_id),
                date: bcl.date,
                voucherNo: bcl.voucher_no || `VCH-${bcl.id}`,
                particulars: bcl.particulars || 'Ledger Entry',
                debit: Number(bcl.debit || 0),
                credit: Number(bcl.credit || 0)
              };
              if (idx > -1) {
                combined[idx] = mapped;
              } else {
                combined.push(mapped);
              }
            }
            return combined;
          });
        }

        if (Array.isArray(backendStockEntries)) {
          setStockEntryRecords(backendStockEntries.map((bse: any) => ({
            id: String(bse.id),
            stockId: bse.entry_no || `SE-${bse.id}`,
            date: bse.date || new Date().toLocaleDateString('en-GB'),
            productId: String(bse.product_id || bse.id),
            productCode: bse.product_code || 'FURN',
            productName: bse.product_name,
            barcode: bse.barcode || '',
            qty: Number(bse.qty || 1),
            unit: bse.unit || 'PCS',
            remarks: bse.remarks || bse.godown || 'Showroom Inward'
          })));
        }

        if (Array.isArray(backendStockAdjustments)) {
          setStockAdjustmentRecords(backendStockAdjustments.map((bsa: any) => {
            const diffQty = Number(bsa.difference_qty ?? (bsa.physical_stock !== undefined && bsa.system_stock !== undefined ? bsa.physical_stock - bsa.system_stock : (bsa.qty || 0)));
            const adjType: 'Plus' | 'Minus' = diffQty >= 0 ? 'Plus' : 'Minus';
            return {
              id: String(bsa.id),
              adjustmentId: bsa.adjustment_no || `ADJ-${bsa.id}`,
              saCode: bsa.sa_code || `SA-${bsa.id}`,
              date: bsa.date || new Date().toLocaleDateString('en-GB'),
              productCode: bsa.product_code || 'FURN',
              productName: bsa.product_name || 'Furniture Item',
              barcode: bsa.barcode || '',
              adjustmentType: (bsa.adjustment_type as any) || adjType,
              qty: Math.abs(diffQty) || 1,
              reason: bsa.remarks || bsa.reason || 'Audit Adjustment'
            };
          }));
        }

        if (Array.isArray(backendInquiries) && backendInquiries.length > 0) {
          setCrmLeads(prev => {
            const combined = [...prev];
            for (const inq of backendInquiries) {
              const inqId = `inq-${inq.id}`;
              const idx = combined.findIndex(l => l.id === inqId || (inq.phone && l.phone.replace(/\D/g, '') === inq.phone.replace(/\D/g, '')));
              const inqStatus: CrmLeadStatus = (inq.status === 'quoted' || inq.status === 'contacted') ? 'WARM' : (inq.status === 'closed' ? 'CONVERTED' : 'HOT');
              const mapped: CrmLead = {
                id: inqId,
                customerName: inq.customer_name || 'Showroom Customer',
                phone: inq.phone || '',
                email: inq.email || '',
                city: 'Kozhikode',
                status: inqStatus,
                furnitureInterest: inq.furniture_title || inq.message || 'Showroom Inquiry',
                estimatedBudget: 50000,
                assignedSalesman: 'Arun Kumar (Senior Consultant)',
                followUpDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
                notes: inq.message || '',
                source: 'WEBSITE_PORTAL',
                createdAt: inq.created_at ? inq.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
              };
              if (idx > -1) {
                combined[idx] = { ...combined[idx], ...mapped };
              } else {
                combined.unshift(mapped);
              }
            }
            return combined;
          });
        }

        if (Array.isArray(backendProductSerials) && backendProductSerials.length > 0) {
          setProductSerials(prev => {
            const combined = [...prev];
            for (const bsn of backendProductSerials) {
              const idx = combined.findIndex(s => s.serialNo === bsn.serial_no || s.id === String(bsn.id));
              const matchProd = (backendProducts || []).find((p: any) => p.id === bsn.product_id || p.barcode === bsn.barcode);
              const mapped: ProductSerial = {
                id: String(bsn.id),
                productId: String(bsn.product_id),
                productCode: matchProd ? (matchProd.p_code || matchProd.code || 'FURN') : 'FURN',
                productName: matchProd ? matchProd.name : 'Furniture Item',
                barcode: bsn.barcode || (matchProd ? matchProd.barcode : ''),
                serialNo: bsn.serial_no,
                status: bsn.status || 'InStock',
                purchaseInvoiceNo: bsn.purchase_invoice_no,
                saleInvoiceNo: bsn.sale_invoice_no,
                supplierName: bsn.supplier_name
              };
              if (idx > -1) {
                combined[idx] = mapped;
              } else {
                combined.unshift(mapped);
              }
            }
            return combined;
          });
        }

        if (Array.isArray(backendHeldCarts)) {
          setHeldCarts(backendHeldCarts.map((bhc: any) => {
            const hId = bhc.hold_id || String(bhc.id);
            let parsedItems = [];
            try {
              parsedItems = typeof bhc.items_json === 'string' ? JSON.parse(bhc.items_json) : (bhc.items || []);
            } catch {
              parsedItems = [];
            }
            return {
              id: hId,
              holdNo: bhc.hold_no || hId,
              holdDate: bhc.date || new Date().toLocaleDateString('en-GB'),
              taxType: bhc.tax_type || 'GST',
              customerName: bhc.customer_name || 'Customer',
              contactNo: bhc.contact_no || '',
              items: parsedItems,
              totalAmount: Number(bhc.total_amount || 0),
              priceMode: (bhc.price_mode as any) || 'RETAIL'
            };
          }));
        }

        if (backendSmsConfig) {
          setSmsConfig(prev => ({
            ...prev,
            apiUrl: backendSmsConfig.apiUrl !== undefined ? backendSmsConfig.apiUrl : prev.apiUrl,
            isEnabled: backendSmsConfig.isEnabled !== undefined ? backendSmsConfig.isEnabled : prev.isEnabled,
            isDefault: backendSmsConfig.isDefault !== undefined ? backendSmsConfig.isDefault : prev.isDefault,
            autoSmsEnabled: backendSmsConfig.autoSmsEnabled !== undefined ? backendSmsConfig.autoSmsEnabled : prev.autoSmsEnabled,
            senderId: backendSmsConfig.senderId !== undefined ? backendSmsConfig.senderId : prev.senderId
          }));
        }

        if (backendEmailConfig) {
          setEmailConfig(prev => ({
            ...prev,
            serverName: backendEmailConfig.server_name || prev.serverName,
            smtpAddress: backendEmailConfig.smtp_address || prev.smtpAddress,
            emailId: backendEmailConfig.email_id || prev.emailId,
            port: backendEmailConfig.port || prev.port,
            tlsSslRequired: (backendEmailConfig.tls_ssl_required as any) || prev.tlsSslRequired,
            isDefault: backendEmailConfig.is_default !== undefined ? backendEmailConfig.is_default : prev.isDefault,
            isEnabled: backendEmailConfig.is_enabled !== undefined ? backendEmailConfig.is_enabled : prev.isEnabled
          }));
        }

        if (backendBackupConfig) {
          setAutoBackupConfig(prev => ({
            ...prev,
            destinationFolderPath: backendBackupConfig.destinationFolderPath || prev.destinationFolderPath,
            autoOfflineBackupStatus: (backendBackupConfig.autoOfflineBackupStatus as any) || prev.autoOfflineBackupStatus,
            autoCloudBackupStatus: (backendBackupConfig.autoCloudBackupStatus as any) || prev.autoCloudBackupStatus
          }));
        }

        if (Array.isArray(backendPurchases) && backendPurchases.length > 0) {
          setPurchaseListItems(prev => {
            const combined = [...prev];
            for (const bp of backendPurchases) {
              const pNo = bp.invoice_no || bp.purchase_no || `PUR-${bp.id}`;
              const idx = combined.findIndex(p => p.invoiceNo === pNo);
              const mapped: PurchaseInvoiceListItem = {
                id: String(bp.id),
                invoiceNo: pNo,
                date: bp.date || bp.invoice_date || new Date().toLocaleDateString('en-GB'),
                referenceNo: bp.reference_no || `REF-${bp.id}`,
                reverseCharges: 'No',
                purchaseType: (bp.payment_mode === 'Cash' || bp.purchase_type === 'Cash') ? 'Cash' : 'Credit',
                taxType: bp.tax_type || 'GST',
                supplierInvoiceNo: bp.supplier_invoice_no || pNo,
                supplierInvoiceDate: bp.supplier_invoice_date || bp.date,
                supplierId: String(bp.supplier_id || 'S-0001'),
                supplierName: bp.supplier_name || 'Vendor Hub',
                subTotal: Number(bp.subtotal || bp.sub_total || bp.grand_total || 0),
                cgst: Number(bp.cgst_total || 0),
                sgst: Number(bp.sgst_total || 0),
                igst: Number(bp.igst_total || 0),
                cess: Number(bp.cess_total || 0),
                roundOff: 0,
                grandTotal: Number(bp.grand_total || 0)
              };
              if (idx > -1) {
                combined[idx] = mapped;
              } else {
                combined.unshift(mapped);
              }
            }
            return combined;
          });
        }

        if (Array.isArray(backendDSaleBills) && backendDSaleBills.length > 0) {
          setDSaleBills(prev => {
            const combined = [...prev];
            for (const b of backendDSaleBills) {
              const idx = combined.findIndex(d => d.invoiceNo === b.invoice_no);
              let parsedItems = [];
              try {
                parsedItems = typeof b.items_json === 'string' ? JSON.parse(b.items_json) : (b.items || []);
              } catch {
                parsedItems = [];
              }
              const mapped: DSaleBill = {
                id: `dbill-${b.id}`,
                invoiceNo: b.invoice_no,
                date: b.date,
                customerName: b.customer_name || 'Cash',
                items: parsedItems,
                totalQty: b.total_qty || 1,
                grandTotal: Number(b.grand_total || 0),
                totalPaid: Number(b.total_paid || 0),
                balance: Number(b.balance || 0),
                paymentMode: b.payment_mode || 'CASH'
              };
              if (idx > -1) {
                combined[idx] = mapped;
              } else {
                combined.unshift(mapped);
              }
            }
            return combined;
          });
        }

        if (Array.isArray(backendCustomerReceipts) && backendCustomerReceipts.length > 0) {
          setCustomerReceipts(prev => {
            const combined = [...prev];
            for (const r of backendCustomerReceipts) {
              const idx = combined.findIndex(c => c.transactionNo === r.transaction_no);
              const mapped: CustomerReceiptEntry = {
                id: `rcpt-${r.id}`,
                transactionNo: r.transaction_no,
                transactionDate: r.transaction_date,
                customerId: String(r.customer_id),
                customerName: r.customer_name,
                paymentMode: (r.payment_mode || 'By Cash') as any,
                bankAccountId: r.bank_account_id,
                amount: Number(r.amount || 0),
                remarks: r.remarks || ''
              };
              if (idx > -1) {
                combined[idx] = mapped;
              } else {
                combined.unshift(mapped);
              }
            }
            return combined;
          });
        }

        if (Array.isArray(backendSalesmanVouchers) && backendSalesmanVouchers.length > 0) {
          setSalesmanVouchers(prev => {
            const combined = [...prev];
            for (const v of backendSalesmanVouchers) {
              const idx = combined.findIndex(sv => sv.voucherNo === v.voucher_no);
              const mapped: SalesmanPaymentVoucher = {
                id: `sm-vouch-${v.id}`,
                voucherNo: v.voucher_no,
                date: v.date,
                salesmanId: String(v.salesman_id),
                salesmanName: v.salesman_name,
                amount: Number(v.amount || 0),
                paymentMode: (v.payment_mode || 'By Cash') as any,
                referenceNo: v.ref_bill_no || '',
                remarks: v.remarks || ''
              };
              if (idx > -1) {
                combined[idx] = mapped;
              } else {
                combined.unshift(mapped);
              }
            }
            return combined;
          });
        }

        if (Array.isArray(backendSalesmanLedger) && backendSalesmanLedger.length > 0) {
          setSalesmanLedger(prev => {
            const combined = [...prev];
            for (const l of backendSalesmanLedger) {
              const idx = combined.findIndex(sl => sl.voucherNo === l.voucher_no && sl.date === l.date);
              const mapped: SalesmanLedgerEntry = {
                id: `sm-ledg-${l.id}`,
                salesmanId: String(l.salesman_id),
                date: l.date,
                account: l.account || 'Commission Ledger',
                voucherNo: l.voucher_no || '',
                voucherType: (l.voucher_type as any) || 'SalesMan_Payment',
                particulars: l.particulars || '',
                debit: Number(l.debit || 0),
                credit: Number(l.credit || 0),
                balance: Number(l.balance || 0)
              };
              if (idx > -1) {
                combined[idx] = mapped;
              } else {
                combined.unshift(mapped);
              }
            }
            return combined;
          });
        }

        if (Array.isArray(backendCustomerReviews) && backendCustomerReviews.length > 0) {
          setDeliveryReviews(prev => {
            const combined = [...prev];
            for (const rev of backendCustomerReviews) {
              const idx = combined.findIndex(r => r.deliveryNoteNo === rev.delivery_note_no);
              const mapped: CustomerDeliveryReview = {
                id: `rev-${rev.id}`,
                customerName: rev.customer_name || 'Customer',
                phone: rev.contact_no || '',
                deliveryNoteNo: rev.delivery_note_no,
                invoiceNo: rev.invoice_no || `INV-${rev.id}`,
                productName: 'Godrej Interio Furniture Suite',
                deliveryDate: rev.delivered_at ? rev.delivered_at.split('T')[0] : (rev.date || new Date().toISOString().split('T')[0]),
                technicianName: rev.technician_name || 'Assembly Team',
                rating: rev.csat_rating || 5,
                feedbackTags: [rev.csat_tags || 'On-time Delivery'],
                feedbackNotes: rev.csat_feedback || '',
                status: (rev.csat_rating && rev.csat_rating >= 4) ? 'SATISFIED' : 'PENDING'
              };
              if (idx > -1) {
                combined[idx] = mapped;
              } else {
                combined.unshift(mapped);
              }
            }
            return combined;
          });
        }

        if (Array.isArray(backendCrmLeads) && backendCrmLeads.length > 0) {
          setCrmLeads(prev => {
            const combined = [...prev];
            for (const inq of backendCrmLeads) {
              const inqId = `inq-${inq.id}`;
              const idx = combined.findIndex(l => l.id === inqId || (inq.phone && l.phone.replace(/\D/g, '') === inq.phone.replace(/\D/g, '')));
              const mapped: CrmLead = {
                id: inqId,
                customerName: inq.customer_name || 'Showroom Customer',
                phone: inq.phone || '',
                email: inq.email || '',
                city: inq.city || 'Kozhikode',
                status: (inq.lead_status as any) || ((inq.status === 'quoted' || inq.status === 'contacted') ? 'WARM' : (inq.status === 'closed' ? 'CONVERTED' : 'HOT')),
                furnitureInterest: inq.furniture_title || inq.message || 'Showroom Inquiry',
                estimatedBudget: Number(inq.estimated_budget) || 50000,
                assignedSalesman: inq.assigned_salesman || 'Arun Kumar (Senior Consultant)',
                followUpDate: inq.follow_up_date || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
                notes: inq.notes || inq.message || '',
                source: (inq.source as any) || 'WEBSITE_PORTAL',
                createdAt: inq.created_at ? inq.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
                lastContactedAt: inq.last_contacted_at
              };
              if (idx > -1) {
                combined[idx] = mapped;
              } else {
                combined.unshift(mapped);
              }
            }
            return combined;
          });
        }
      } catch (err) {
        console.warn("Backend sync offline / skipped:", err);
      }
    };

    // Showroom Realtime Multi-Terminal Event Listener (<200ms latency)
    const unsubscribeRealtime = showroomRealtime.subscribe(async (storeEvent: StoreRealtimeEvent) => {
      console.info('[Realtime] Showroom store event received:', storeEvent.event, storeEvent);

      if (storeEvent.event === 'INVENTORY_UPDATED' || storeEvent.event === 'STOCK_TRANSFERRED') {
        try {
          const fresh = await api.getProducts();
          if (Array.isArray(fresh) && fresh.length > 0) {
            const mapped = fresh.map(mapBackendProductToFrontend).sort((a: any, b: any) => {
              const idA = parseInt(String(a.id).replace(/\D/g, ''), 10) || 0;
              const idB = parseInt(String(b.id).replace(/\D/g, ''), 10) || 0;
              return idB - idA;
            });
            setProducts(mapped);
            setProductRecords(mapped.map(p => ({
              id: p.id,
              code: p.pCode,
              name: p.name,
              category: p.category,
              subCategory: p.subCategory,
              barcode: p.barcode,
              hsnCode: p.hsn || '9403',
              partNo: p.pCode,
              godown: p.godown || 'Showroom Floor',
              rack: p.rack || 'A1',
              mrp: p.mrp,
              retailPrice: p.retailPrice,
              wholesalePrice: p.wholesalePrice || p.retailPrice,
              openingStock: p.openingStock,
              currentStock: p.openingStock,
              saleTaxType: 'Inclusive',
              purchaseTaxType: 'Inclusive',
              active: true,
              defaultSaleQty: 1
            })));
          }
        } catch (e) {
          console.warn('[Realtime] Failed to sync products on INVENTORY_UPDATED:', e);
        }
      }

      if (storeEvent.event === 'SALE_CREATED' || storeEvent.event === 'INVOICE_VOIDED') {
        try {
          const freshSales = await api.getSalesInvoices(0, 100);
          if (Array.isArray(freshSales) && freshSales.length > 0) {
            setSalesRegisterBills(freshSales.map(bs => ({
              id: String(bs.id),
              billNo: bs.invoice_no,
              date: bs.date || new Date().toLocaleDateString('en-GB'),
              customerName: bs.customer_name || 'Cash Customer',
              gstin: bs.customer_gstin || '',
              billAmount: bs.grand_total || 0,
              taxableAmount: bs.sub_total || 0,
              cgstAmount: bs.cgst_total || 0,
              sgstAmount: bs.sgst_total || 0,
              igstAmount: bs.igst_total || 0,
              cessAmount: bs.cess_total || 0,
              otherAmount: 0
            })));
            setOldBills(freshSales.map(bs => {
              let parsedItems = [];
              try {
                parsedItems = typeof bs.items === 'string' ? JSON.parse(bs.items) : (bs.items || []);
              } catch {
                parsedItems = [];
              }
              return {
                id: String(bs.id),
                invoiceNo: bs.invoice_no,
                date: bs.date || new Date().toLocaleDateString('en-GB'),
                customerName: bs.customer_name || 'Cash Customer',
                contactNo: bs.customer_phone || '',
                totalQty: parsedItems.reduce((acc: number, it: any) => acc + (it.qty || 1), 0) || 1,
                netPay: bs.grand_total || 0,
                items: parsedItems,
                paymentMode: bs.payment_mode || 'Cash',
                customer: {
                  id: bs.customer_id ? String(bs.customer_id) : '',
                  name: bs.customer_name,
                  phone: bs.customer_phone,
                  state: bs.customer_state || 'Kerala',
                  gstin: bs.customer_gstin || ''
                },
                paidAmount: bs.paid_amount ?? bs.grand_total ?? 0,
                balanceDue: bs.balance_due ?? 0,
                status: (bs.balance_due ?? 0) <= 0.01 ? 'PAID' : 'PARTIAL'
              };
            }));
          }
        } catch (e) {
          console.warn('[Realtime] Failed to sync sales register and old bills:', e);
        }
      }

      if (storeEvent.event === 'CUSTOMER_UPDATED' || storeEvent.event === 'LEDGER_UPDATED') {
        try {
          const freshCusts = await api.getCustomers();
          if (Array.isArray(freshCusts) && freshCusts.length > 0) {
            setCustomers(freshCusts.map(mapBackendCustomerToFrontend));
          }
        } catch (e) {
          console.warn('[Realtime] Failed to sync customers on LEDGER_UPDATED:', e);
        }
      }

      if (storeEvent.event === 'DELIVERY_UPDATED') {
        window.dispatchEvent(new CustomEvent('svf-delivery-pipeline-refresh', { detail: storeEvent }));
      }
    });

    syncBackendData();
    return () => {
      isMounted = false;
      unsubscribeRealtime();
    };
  }, []);


  // Video 16 Feature: Handle Save Estimate (Frames 0025, 0035, 0050) with Railway persistence
  const handleSaveEstimate = async (est: EstimateRecord) => {
    try {
      await api.createEstimate({
        estimate_no: est.estimateNo,
        date: est.date || new Date().toISOString().split('T')[0],
        customer_name: est.customerName || 'Walk-in Customer',
        contact_no: est.contactNo || null,
        address: (est as any).address || null,
        sub_total: est.subTotal || 0,
        discount: (est as any).totalDiscount ?? (est as any).discount ?? 0,
        grand_total: est.grandTotal || 0,
        items_json: JSON.stringify(est.items || [])
      });

      setEstimates(prev => {
        const idx = prev.findIndex(e => e.id === est.id || e.estimateNo === est.estimateNo);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = est;
          return copy;
        }
        return [est, ...prev];
      });
    } catch (err) {
      console.warn('Backend estimate error:', err);
      throw err;
    }

    // 🌟 AUTO-ENROLL ESTIMATE CUSTOMER INTO DIRECTORY & CRM LEADS:
    if (est.customerName && est.customerName !== 'Walk-in Customer' && est.contactNo) {
      const cleanPhone = est.contactNo.replace(/\D/g, '');
      if (cleanPhone && cleanPhone.length >= 7 && cleanPhone !== '1234567890') {
        const exists = customers.some(c => c.phone.replace(/\D/g, '') === cleanPhone);
        if (!exists) {
          handleAddCustomer({
            id: `cust-${Date.now()}`,
            name: est.customerName,
            phone: est.contactNo,
            state: est.state || 'Kerala',
            address: (est as any).address || '',
            balance: 0,
            loyaltyPoints: 0,
            creditLimit: 50000
          });
        }
      }
    }
  };

  // Video 16 Feature: Handle Inward & Update Product Serials (Frames 0215, 0230, 0260)
  const handleAddProductSerials = (newSerials: ProductSerial[]) => {
    setProductSerials(prev => {
      const filtered = prev.filter(p => !newSerials.some(n => n.serialNo === p.serialNo));
      return [...newSerials, ...filtered];
    });

    // Group by product or barcode and persist to PostgreSQL
    const byProduct = new Map<number | string, any[]>();
    for (const sn of newSerials) {
      const matchProd = products.find(p => p.barcode === sn.barcode || p.pCode === sn.productCode || p.name === sn.productName);
      const prodId = matchProd ? (parseInt(matchProd.id, 10) || matchProd.id) : 1;
      const list = byProduct.get(prodId) || [];
      list.push({
        serial_no: sn.serialNo,
        barcode: sn.barcode,
        status: sn.status || 'InStock',
        purchase_invoice_no: sn.purchaseInvoiceNo,
        supplier_name: sn.supplierName
      });
      byProduct.set(prodId, list);
    }
    byProduct.forEach((serials, prodId) => {
      api.addProductSerials(prodId, serials).catch(e => console.warn('Product serials sync queued:', e));
    });
  };

  const handleDeleteProductSerial = (serialNoOrId: string) => {
    setProductSerials(prev => prev.filter(p => p.id !== serialNoOrId && p.serialNo !== serialNoOrId));
    api.deleteProductSerial(serialNoOrId).catch(e => console.warn('Delete product serial error:', e));
  };

  const handleUpdateProductSerials = (serials: ProductSerial[]) => {
    const removed = productSerials.filter(ps => !serials.some(s => s.id === ps.id || s.serialNo === ps.serialNo));
    for (const r of removed) {
      handleDeleteProductSerial(r.id || r.serialNo);
    }
    const added = serials.filter(s => !productSerials.some(ps => ps.id === s.id || ps.serialNo === s.serialNo));
    if (added.length > 0) {
      handleAddProductSerials(added);
    }
    setProductSerials(serials);
  };

  const handleUpdateHeldCarts = (newCarts: HeldCart[]) => {
    const added = newCarts.filter(nc => !heldCarts.some(oc => oc.id === nc.id || ((nc as any).holdNo && (oc as any).holdNo === (nc as any).holdNo)));
    const removed = heldCarts.filter(oc => !newCarts.some(nc => nc.id === oc.id || ((oc as any).holdNo && (nc as any).holdNo === (oc as any).holdNo)));

    setHeldCarts(newCarts);

    for (const hc of added) {
      const hId = (hc as any).holdNo || hc.id;
      api.holdCart({
        hold_id: hId,
        customer_name: hc.customerName || 'Walk-in Customer',
        contact_no: hc.contactNo || '',
        total_items: hc.items ? hc.items.length : 1,
        total_amount: hc.totalAmount || 0,
        items_json: JSON.stringify(hc.items || [])
      }).catch(e => console.warn('Hold cart backend sync queued:', e));
    }

    for (const hc of removed) {
      const hId = (hc as any).holdNo || hc.id;
      api.deleteHeldCart(hId).catch(e => console.warn('Delete held cart error:', e));
    }
  };

  const handleUpdateLeads = async (newLeads: CrmLead[]) => {
    const added = newLeads.filter(nl => !crmLeads.some(ol => ol.id === nl.id));
    const removed = crmLeads.filter(ol => !newLeads.some(nl => nl.id === ol.id));
    const updated = newLeads.filter(nl => {
      const match = crmLeads.find(ol => ol.id === nl.id);
      return match && JSON.stringify(match) !== JSON.stringify(nl);
    });

    setCrmLeads(newLeads);

    try {
      const promises: Promise<any>[] = [];
      for (const lead of added) {
        promises.push(
          api.createCrmLead({
            customer_name: lead.customerName,
            phone: lead.phone,
            email: lead.email || undefined,
            city: lead.city,
            lead_status: lead.status,
            furniture_interest: lead.furnitureInterest,
            estimated_budget: lead.estimatedBudget,
            assigned_salesman: lead.assignedSalesman,
            follow_up_date: lead.followUpDate,
            notes: lead.notes,
            source: lead.source
          }).then(res => {
            if (res && res.id) {
              setCrmLeads(prev => prev.map(l => l.id === lead.id ? { ...l, id: `inq-${res.id}` } : l));
            }
          })
        );
      }

      for (const lead of updated) {
        if (lead.id.startsWith('inq-')) {
          const rawId = parseInt(lead.id.replace('inq-', ''), 10);
          if (!isNaN(rawId)) {
            promises.push(
              api.updateCrmLead(rawId, {
                customer_name: lead.customerName,
                phone: lead.phone,
                email: lead.email || undefined,
                city: lead.city,
                lead_status: lead.status,
                furniture_interest: lead.furnitureInterest,
                estimated_budget: lead.estimatedBudget,
                assigned_salesman: lead.assignedSalesman,
                follow_up_date: lead.followUpDate,
                notes: lead.notes,
                last_contacted_at: lead.lastContactedAt,
                source: lead.source
              })
            );
          }
        }
      }

      for (const lead of removed) {
        if (lead.id.startsWith('inq-')) {
          const rawId = parseInt(lead.id.replace('inq-', ''), 10);
          if (!isNaN(rawId)) {
            promises.push(api.deleteInquiry(rawId));
          }
        }
      }

      await Promise.all(promises);
    } catch (e) {
      console.warn('Inquiry sync error:', e);
      throw e;
    }
  };

  const handleRecordDSaleBill = async (bill: DSaleBill) => {
    setDSaleBills(prev => [bill, ...prev]);
    try {
      await api.createDSaleBill({
        invoice_no: bill.invoiceNo,
        date: bill.date,
        customer_name: bill.customerName,
        items_json: JSON.stringify(bill.items),
        total_qty: bill.totalQty,
        grand_total: bill.grandTotal,
        total_paid: bill.totalPaid,
        balance: bill.balance,
        payment_mode: bill.paymentMode
      });
    } catch (err: any) {
      console.warn('Backend D-Sale bill persistence error:', err);
    }
  };

  const handleUpdateDeliveryReviews = (newReviews: CustomerDeliveryReview[]) => {
    setDeliveryReviews(newReviews);
    for (const rev of newReviews) {
      if (rev.rating && rev.deliveryNoteNo) {
        api.logDeliveryCsat(rev.deliveryNoteNo, {
          rating: rev.rating,
          tags: rev.status === 'SATISFIED' ? 'On-time, Good Assembly' : 'Follow-up Required',
          feedback: `Rating: ${rev.rating} Stars. Status: ${rev.status}`
        }).catch((e: any) => console.warn('CSAT sync error:', e));
      }
    }
  };

  // Video 17 Feature: Handle Save/Delete Quotation (Frame 0160)
  const handleSaveQuotation = async (quot: QuotationRecord) => {
    try {
      await api.createQuotation(quot);
      setQuotations(prev => {
        const idx = prev.findIndex(q => q.id === quot.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = quot;
          return copy;
        }
        return [quot, ...prev];
      });
    } catch (err) {
      console.warn('Backend quotation create error:', err);
      throw err;
    }

    // 🌟 AUTO-ENROLL QUOTATION CUSTOMER INTO DIRECTORY & CRM LEADS:
    if (quot.customerName && quot.customerName !== 'Walk-in Customer' && quot.contactNo) {
      const cleanPhone = quot.contactNo.replace(/\D/g, '');
      if (cleanPhone && cleanPhone.length >= 7 && cleanPhone !== '1234567890') {
        const exists = customers.some(c => c.phone.replace(/\D/g, '') === cleanPhone);
        if (!exists) {
          handleAddCustomer({
            id: `cust-${Date.now()}`,
            name: quot.customerName,
            phone: quot.contactNo,
            state: quot.state || 'Kerala',
            address: '',
            balance: 0,
            loyaltyPoints: 0,
            creditLimit: 50000
          });
        }
      }
    }
  };

  const handleDeleteQuotation = (id: string) => {
    setQuotations(prev => prev.filter(q => q.id !== id));
    api.deleteQuotation(id).catch(console.warn);
  };

  const handleDeleteEstimate = (idOrNo: string) => {
    setEstimates(prev => prev.filter(e => e.id !== idOrNo && e.estimateNo !== idOrNo));
    api.deleteEstimate(idOrNo).catch(console.warn);
  };

  const handleDeletePurchase = async (invoiceNo: string) => {
    try {
      await api.deletePurchase(invoiceNo);
      setPurchaseRecords(prev => prev.filter(p => p.invoiceNo !== invoiceNo && p.id !== invoiceNo));
      setPurchaseListItems(prev => prev.filter(p => p.invoiceNo !== invoiceNo && (p as any).id !== invoiceNo));
      const freshProducts = await api.getProducts();
      if (Array.isArray(freshProducts) && freshProducts.length > 0) {
        setProducts(freshProducts.map(mapBackendProductToFrontend));
      }
      setToasts(prev => [...prev, { id: String(Date.now()), message: `✓ Purchase invoice ${invoiceNo} deleted and stock/payable reversed in PostgreSQL`, type: 'success' }]);
    } catch (err: any) {
      setToasts(prev => [...prev, { id: String(Date.now()), message: `Delete failed: ${err.message}`, type: 'error' }]);
      throw err;
    }
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
    const numId = parseInt(String(voucher.salesmanId).replace(/\D/g, ''), 10) || 1;
    api.createSalesmanVoucher({
      salesman_id: numId,
      salesman_name: voucher.salesmanName,
      voucher_no: voucher.voucherNo || `SMP-${Date.now()}`,
      date: voucher.date || new Date().toISOString().split('T')[0],
      amount: voucher.amount,
      payment_mode: voucher.paymentMode || 'Cash',
      remarks: voucher.remarks || `Commission payout to ${voucher.salesmanName}`,
      ref_bill_no: voucher.referenceNo
    }).catch(e => console.warn('Backend salesman voucher sync queued:', e));

    api.payoutSalesman(numId, {
      amount: Number(voucher.amount),
      date: voucher.date || new Date().toISOString().split('T')[0],
      notes: voucher.remarks || `Commission payout to ${voucher.salesmanName}`
    }).catch(e => console.warn('Backend salesman payout sync queued:', e));

    api.createExpenseVoucher({
      voucher_no: voucher.voucherNo || `SMP-${Date.now()}`,
      date: voucher.date || new Date().toISOString().split('T')[0],
      account_head_id: 1,
      account_head_name: 'Salesman Commission',
      amount: voucher.amount,
      payment_mode: voucher.paymentMode || 'Cash',
      paid_to: voucher.salesmanName,
      particulars: `Commission payout to salesman ${voucher.salesmanName}`,
    }).catch(e => console.warn('Backend salesman expense voucher sync queued:', e));

    const isBankPayout = voucher.paymentMode === 'By Bank Transfer' || voucher.paymentMode === 'By UPI' || voucher.paymentMode === 'By Cheque';
    if (isBankPayout) {
      setBankAccounts(prev => prev.map((b, idx) => idx === 0 ? { ...b, balance: Number((b.balance - voucher.amount).toFixed(2)) } : b));
      setBankStatements(prev => [{
        id: `bs-smp-${Date.now()}`,
        date: voucher.date || new Date().toLocaleDateString('en-GB'),
        accountNo: bankAccounts[0]?.accountNo || '50200012345678',
        receiptNo: voucher.voucherNo || `SMP-${Date.now()}`,
        description: `Salesman Commission: ${voucher.salesmanName}`,
        debit: voucher.amount,
        credit: 0
      }, ...prev]);
    }

    setExpenseVouchers(prev => [{
      id: `exp-smp-${Date.now()}`,
      voucherNo: voucher.voucherNo || `SMP-${Date.now()}`,
      date: voucher.date || new Date().toLocaleDateString('en-GB'),
      name: `Salesman Commission: ${voucher.salesmanName}`,
      details: voucher.remarks || `Commission payout to ${voucher.salesmanName}`,
      paymentMode: isBankPayout ? 'Bank' : 'Cash',
      grandTotal: voucher.amount,
      items: [{
        id: `exp-it-${Date.now()}`,
        particulars: `Commission payout to ${voucher.salesmanName}`,
        amount: voucher.amount,
        notes: ''
      }]
    }, ...prev]);
  };

  const handleVoidSalesmanPayout = (entry: SalesmanLedgerEntry) => {
    setSalesmanLedger(prev => prev.filter(e => e.id !== entry.id && e.voucherNo !== entry.voucherNo));
    setSalesmanVouchers(prev => prev.filter(v => v.voucherNo !== entry.voucherNo));
    setSalesmen(prev => prev.map(s => s.id === entry.salesmanId ? { ...s, balance: Number((s.balance + entry.debit).toFixed(2)) } : s));
    setExpenseVouchers(prev => prev.filter(ev => ev.voucherNo !== entry.voucherNo));
    setBankStatements(prev => prev.filter(bs => bs.receiptNo !== entry.voucherNo));
    api.voidSalesmanPayout(entry.salesmanId, {
      amount: entry.debit,
      voucher_no: entry.voucherNo,
      remarks: `Void commission payout voucher ${entry.voucherNo}`
    }).catch(e => console.warn('Backend salesman payout void queued:', e));
    setToasts(prev => [...prev, { id: String(Date.now()), message: `✓ Payout ${entry.voucherNo} voided and commission balance restored`, type: 'success' }]);
  };

  const handleBulkUpdateProducts = async (updatedProducts: Product[]) => {
    // 1. Immediate optimistic update in UI cache for zero-latency POS scanning
    setProducts(updatedProducts);

    // 2. Persist to PostgreSQL database on Railway Cloud
    try {
      const backendPayloads = updatedProducts.map(mapFrontendProductToBackend);
      await api.bulkImportProducts(backendPayloads);

      // 3. Immediately pull fresh records from PostgreSQL so newly generated database IDs & timestamps sync
      const fresh = await api.getProducts();
      if (Array.isArray(fresh) && fresh.length > 0) {
        const mapped = fresh.map(mapBackendProductToFrontend).sort((a: any, b: any) => {
          const idA = parseInt(String(a.id).replace(/\D/g, ''), 10) || 0;
          const idB = parseInt(String(b.id).replace(/\D/g, ''), 10) || 0;
          return idB - idA;
        });
        setProducts(mapped);
        setProductRecords(mapped.map(p => ({
          id: p.id,
          code: p.pCode,
          name: p.name,
          category: p.category,
          subCategory: p.subCategory,
          barcode: p.barcode,
          hsnCode: p.hsn || '9403',
          partNo: p.pCode,
          godown: p.godown || 'Showroom Floor',
          rack: p.rack || 'A1',
          mrp: p.mrp,
          retailPrice: p.retailPrice,
          wholesalePrice: p.wholesalePrice || p.retailPrice,
          openingStock: p.openingStock,
          currentStock: p.physical_stock ?? p.openingStock,
          saleTaxType: 'Inclusive',
          purchaseTaxType: 'Inclusive',
          active: true,
          defaultSaleQty: 1
        })));
      }

      setToasts(prev => [
        ...prev,
        {
          id: String(Date.now()),
          message: `✓ ${updatedProducts.length} furniture products permanently committed to PostgreSQL database!`,
          type: 'success'
        }
      ]);
    } catch (e: any) {
      console.error("Backend bulk product sync error:", e);
      setToasts(prev => [
        ...prev,
        {
          id: String(Date.now()),
          message: `⚠️ Database sync issue: ${e?.message || 'Check network connection'}. Products held in local memory.`,
          type: 'error'
        }
      ]);
    }
  };

  // Video 20 Feature 13 & Video 18 Feature 1: Handle Record Customer Receipt
  const handleRecordReceipt = (receipt: CustomerReceiptEntry, ledgerEntry: CustomerLedgerEntry) => {
    setCustomerReceipts(prev => [receipt, ...prev]);
    setCustomerLedger(prev => [ledgerEntry, ...prev]);
    let updatedCust: Customer | null = null;
    setCustomers(prev =>
      prev.map(c => {
        if (c.id === receipt.customerId) {
          const newBal = Number(Math.max(0, c.balance - receipt.amount).toFixed(2));
          updatedCust = { ...c, balance: newBal };
          return updatedCust;
        }
        return c;
      })
    );
    // Update local open bills for this customer so UI reflects payment immediately
    setOldBills(prev => {
      let remainingPayment = receipt.amount;
      return prev.map(bill => {
        const billCustId = bill.customer?.id ? String(bill.customer.id) : '';
        const currentDue = bill.balanceDue ?? 0;
        if (billCustId === receipt.customerId && currentDue > 0 && remainingPayment > 0) {
          const deduction = Math.min(currentDue, remainingPayment);
          remainingPayment -= deduction;
          const newPaid = Number(((bill.paidAmount || 0) + deduction).toFixed(2));
          const newDue = Number((currentDue - deduction).toFixed(2));
          return {
            ...bill,
            paidAmount: newPaid,
            balanceDue: newDue,
            status: newDue <= 0 ? 'PAID' : 'PARTIAL'
          };
        }
        return bill;
      });
    });

    const numId = parseInt(receipt.customerId.replace(/\D/g, ''), 10) || 1;
    const targetCustId = receipt.customerId || numId;
    api.createCustomerReceipt({
      customer_id: numId,
      customer_name: receipt.customerName || 'Customer',
      transaction_no: receipt.transactionNo || `RCP-${Date.now()}`,
      transaction_date: receipt.transactionDate || new Date().toISOString().split('T')[0],
      amount: receipt.amount,
      payment_mode: receipt.paymentMode || 'Cash',
      bank_account_id: receipt.bankAccountId,
      remarks: receipt.remarks
    }).catch(e => console.warn('Customer receipt persistence error:', e));

    api.updateCustomer(targetCustId, {
      current_balance: updatedCust ? (updatedCust as Customer).balance : 0
    }).catch(e => console.warn('Backend customer balance update queued:', e));

    api.addCustomerLedger(targetCustId, {
      date: receipt.transactionDate || new Date().toISOString().split('T')[0],
      voucher_no: receipt.transactionNo || `RCP-${Date.now()}`,
      particulars: `Receipt (${receipt.paymentMode || 'Cash'}): ${receipt.remarks || 'Customer Payment'}`,
      debit: 0.0,
      credit: receipt.amount
    }).catch(e => console.warn('Customer ledger persistence error:', e));

    api.createIncomeVoucher({
      voucher_no: receipt.transactionNo || `RCP-${Date.now()}`,
      date: receipt.transactionDate || new Date().toISOString().split('T')[0],
      name: receipt.customerName || 'Customer Receipt',
      details: receipt.remarks || `Customer payment received for ${receipt.customerName}`,
      payment_mode: receipt.paymentMode || 'Cash',
      grand_total: receipt.amount,
      items_json: JSON.stringify([{ particulars: `Customer Receipt: ${receipt.customerName}`, amount: receipt.amount }])
    }).catch(e => console.warn('Backend customer receipt income voucher sync queued:', e));

    setCustomerOutstanding(prev => prev.map(r => {
      if (r.code === receipt.customerId || r.id === receipt.customerId) {
        return {
          ...r,
          balance: Math.max(0, Number(((r.balance || 0) - receipt.amount).toFixed(2)))
        };
      }
      return r;
    }));

    const isBankReceipt = receipt.paymentMode === 'By Bank Transfer' || receipt.paymentMode === 'By UPI' || receipt.paymentMode === 'By Cheque';
    if (isBankReceipt) {
      setBankAccounts(prev => prev.map((b, idx) => idx === 0 ? { ...b, balance: Number((b.balance + receipt.amount).toFixed(2)) } : b));
      setBankStatements(prev => [{
        id: `bs-rcp-${Date.now()}`,
        date: receipt.transactionDate || new Date().toLocaleDateString('en-GB'),
        accountNo: bankAccounts[0]?.accountNo || '50200012345678',
        receiptNo: receipt.transactionNo || `RCP-${Date.now()}`,
        description: `Customer Receipt (${receipt.paymentMode}): ${receipt.customerName}`,
        debit: 0,
        credit: receipt.amount
      }, ...prev]);
    }

    setIncomeVouchers(prev => [{
      id: `inc-rcp-${Date.now()}`,
      voucherNo: receipt.transactionNo || `RCP-${Date.now()}`,
      date: receipt.transactionDate || new Date().toISOString().split('T')[0],
      name: receipt.customerName || 'Customer Receipt',
      details: receipt.remarks || `Customer payment received for ${receipt.customerName}`,
      paymentMode: isBankReceipt ? 'Bank' : 'Cash',
      grandTotal: receipt.amount,
      items: [{
        id: `inc-it-${Date.now()}`,
        particulars: `Customer Receipt: ${receipt.customerName}`,
        amount: receipt.amount,
        notes: ''
      }]
    }, ...prev]);
  };

  const handleDeleteOldBill = async (billId: string) => {
    const targetBill = oldBills.find(b => b.id === billId);
    setOldBills(prev => prev.filter(b => b.id !== billId));
    if (targetBill) {
      setSalesRegisterBills(prev => prev.filter(b => b.billNo !== targetBill.invoiceNo && b.id !== billId));
      if ((targetBill.balanceDue ?? 0) > 0 && targetBill.customer?.id) {
        const due = targetBill.balanceDue ?? 0;
        let newCustBal = 0;
        setCustomers(prev => prev.map(c => {
          if (c.id === targetBill.customer?.id) {
            newCustBal = Math.max(0, Number((c.balance - due).toFixed(2)));
            return { ...c, balance: newCustBal };
          }
          return c;
        }));
        setCustomerOutstanding(prev => prev.map(r => r.code === targetBill.customer?.id ? { ...r, balance: Math.max(0, Number(((r.balance || 0) - due).toFixed(2))) } : r));
        const numCustId = parseInt(String(targetBill.customer.id).replace(/\D/g, ''), 10) || 1;
        const targetCustId = targetBill.customer.id || numCustId;
        api.updateCustomer(targetCustId, { current_balance: newCustBal }).catch(console.warn);
      }
    }
    try {
      await api.voidSaleInvoice(billId);
      const fresh = await api.getProducts();
      if (fresh && fresh.length > 0) {
        setProducts(fresh.map(mapBackendProductToFrontend));
      }
    } catch (err) {
      console.warn('Backend bill void error:', err);
    }
  };


  // Video 18 Feature 1 & Video 16 Sales Register / Serial Number Sync: Handle Record Sale Inv  // Video 18 Feature 1 & Video 16 Sales Register / Serial Number Sync: Handle Record Sale Invoice
  const handleRecordSaleInvoice = async (completedBill: any): Promise<any> => {
    // Exact rounded calculations
    const taxable = Number((completedBill.taxableTotal ?? (completedBill.grandTotal ? completedBill.grandTotal * 0.82 : 0)).toFixed(2));
    const cgst = Number((completedBill.cgstTotal ?? (taxable * 0.09)).toFixed(2));
    const sgst = Number((completedBill.sgstTotal ?? (taxable * 0.09)).toFixed(2));
    const igst = Number((completedBill.igstTotal ?? 0).toFixed(2));
    const grandTotal = Number((completedBill.grandTotal || completedBill.netPay || completedBill.total || 0).toFixed(2));
    const paidAmount = Number((completedBill.paidAmount !== undefined ? completedBill.paidAmount : grandTotal).toFixed(2));
    const balanceDue = Number(Math.max(0, grandTotal - paidAmount).toFixed(2));

    // 1. Credit Ledger & Customer Auto-Enrollment & Balance Sync
    if (completedBill.customer && completedBill.customer.name && completedBill.customer.name !== 'Cash' && completedBill.customer.name !== 'Walk-in Cash Customer') {
      const custPhone = (completedBill.customer.phone || '').replace(/\D/g, '');
      const custId = completedBill.customer.id || `cust-${Date.now()}`;

      // Auto-enroll customer in master directory if not existing
      setCustomers(prev => {
        const isExisting = prev.some(c => (completedBill.customer.id && c.id === completedBill.customer.id) || (custPhone && c.phone.replace(/\D/g, '') === custPhone));
        if (!isExisting) {
          const newCust: Customer = {
            id: custId,
            name: completedBill.customer.name,
            phone: completedBill.customer.phone || '',
            address: completedBill.customer.address || '',
            city: completedBill.customer.city || 'Kozhikode',
            state: completedBill.customer.state || 'Kerala',
            gstin: completedBill.customer.gstin || '',
            balance: balanceDue,
            creditLimit: 50000,
            loyaltyPoints: Math.floor(grandTotal / 100),
            openingBalance: 0
          };
          api.createCustomer({
            code: newCust.id || `CUST-${Date.now().toString().slice(-6)}`,
            name: newCust.name,
            phone: newCust.phone,
            state: newCust.state,
            address: newCust.address,
            city: newCust.city,
            gstin: newCust.gstin,
            current_balance: newCust.balance,
            opening_balance: 0,
            credit_limit: newCust.creditLimit,
            loyalty_points: newCust.loyaltyPoints
          }).catch(e => console.warn('Backend customer auto-registration error:', e));
          return [newCust, ...prev];
        } else {
          return prev.map(c => {
            const isMatch = (completedBill.customer.id && c.id === completedBill.customer.id) || (custPhone && c.phone.replace(/\D/g, '') === custPhone);
            if (isMatch) {
              const newBal = balanceDue > 0 ? Number(((c.balance || 0) + balanceDue).toFixed(2)) : c.balance;
              const newLoyalty = (c.loyaltyPoints || 0) + Math.floor(grandTotal / 100);
              return { ...c, balance: newBal, loyaltyPoints: newLoyalty };
            }
            return c;
          });
        }
      });

      if (balanceDue > 0) {
        const newLedger: CustomerLedgerEntry = {
          id: 'ledg-' + Date.now(),
          customerId: custId,
          date: completedBill.date || new Date().toLocaleDateString('en-GB'),
          voucherNo: completedBill.invoiceNo,
          particulars: completedBill.isAdvanceBooking ? 'Advance Booking Sale' : 'Sales',
          debit: balanceDue,
          credit: 0.0
        };
        setCustomerLedger(prev => [...prev, newLedger]);

        setCustomerOutstanding(prev => {
          const existingIdx = prev.findIndex(r => (custPhone && r.contactNo?.replace(/\D/g, '') === custPhone) || (custId && r.code === custId));
          if (existingIdx >= 0) {
            const copy = [...prev];
            const cur = copy[existingIdx];
            copy[existingIdx] = {
              ...cur,
              totalDebit: Number(((cur.totalDebit || 0) + balanceDue).toFixed(2)),
              balance: Number(((cur.balance || 0) + balanceDue).toFixed(2))
            };
            return copy;
          } else {
            const newOut: OutstandingRecord = {
              id: `c-out-${Date.now()}`,
              entityType: 'CUSTOMER',
              code: custId || `C-${Date.now().toString().slice(-4)}`,
              name: completedBill.customer?.name || 'Credit Client',
              contactNo: completedBill.customer?.phone || '',
              address: completedBill.customer?.address || '',
              city: completedBill.customer?.city || 'Kozhikode',
              state: completedBill.customer?.state || 'Kerala',
              totalCredit: 0,
              totalDebit: balanceDue,
              balance: balanceDue
            };
            return [newOut, ...prev];
          }
        });
      }
    }

    // 2. Video 16 Feature: Record into Sales Register (Bill Wise) [Frames 0150, 0155]
    const newRegBill: SalesRegisterBill = {
      id: 'reg-' + Date.now(),
      billNo: completedBill.invoiceNo || `SVF-${Date.now()}`,
      date: completedBill.date || new Date().toLocaleDateString('en-GB'),
      customerName: completedBill.customer?.name || 'Cash',
      gstin: completedBill.customer?.gstin || '0',
      billAmount: grandTotal,
      taxableAmount: taxable,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: igst,
      cessAmount: 0,
      otherAmount: 0
    };
    setSalesRegisterBills(prev => [newRegBill, ...prev]);

    // 3. Video 16 Feature: Update Serial Numbers status to SOLD
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

    // 4. Update local stock hedging if advance booking
    if (completedBill.isAdvanceBooking && completedBill.items && Array.isArray(completedBill.items)) {
      setProducts(prev => prev.map(p => {
        const it = completedBill.items.find((i: any) => (i.barcode && i.barcode === p.barcode) || (i.pCode && p.pCode === i.pCode) || p.name.toUpperCase() === (i.product?.name || i.name || '').toUpperCase());
        if (it) {
          const qty = it.qty || 1;
          const curPhys = p.physical_stock ?? p.openingStock ?? 0;
          const curRes = p.reserved_stock ?? 0;
          const newRes = curRes + qty;
          return {
            ...p,
            reserved_stock: newRes,
            available_to_sell: Math.max(0, curPhys - newRes)
          };
        }
        return p;
      }));
    }

    // 5. Structure Payments array for Split-Tender
    const splitPayments = (completedBill.paymentSplits || []).map((s: any) => ({
      payment_mode: s.mode || s.modeName || 'Cash',
      amount: Number((s.amount || 0).toFixed(2)),
      utr_number: s.utrNumber || completedBill.utrNumber || null,
      card_network: s.cardNetwork || null,
      card_last_four: s.cardLastFour || null,
      subvention_percent: s.subventionPercent || completedBill.subventionPercent || 0,
      subvention_fee: s.subventionFee || (s.subventionPercent ? Number(((s.amount * s.subventionPercent) / 100).toFixed(2)) : 0),
      bank_account_id: s.bankAccountId ? parseInt(String(s.bankAccountId), 10) || null : null,
      reference_no: s.referenceNo || s.utrNumber || null,
      status: 'Completed',
      notes: s.notes || null
    }));

    const finalPayments = splitPayments.length > 0 ? splitPayments : [
      {
        payment_mode: completedBill.paymentMode || 'Cash',
        amount: paidAmount,
        utr_number: completedBill.utrNumber || null,
        subvention_percent: completedBill.subventionPercent || 0,
        subvention_fee: 0,
        status: 'Completed'
      }
    ];

    const invoicePayload = {
      invoice_no: completedBill.invoiceNo || `SVF-${Date.now()}`,
      invoice_date: completedBill.date || new Date().toISOString().split('T')[0],
      customer_id: completedBill.customer?.id ? parseInt(completedBill.customer.id, 10) || null : null,
      customer_name: completedBill.customer?.name || 'Walk-in Cash Customer',
      customer_phone: completedBill.customer?.phone || '',
      payment_mode: completedBill.paymentMode || 'Cash',
      gross_amount: Number((completedBill.grossAmount || completedBill.total || grandTotal).toFixed(2)),
      discount_amount: Number((completedBill.discountAmount || completedBill.totalDisc || 0).toFixed(2)),
      coupon_code: completedBill.couponCode || null,
      coupon_discount: Number((completedBill.couponDiscount || 0).toFixed(2)),
      gift_voucher_discount: Number((completedBill.giftVoucherDiscount || 0).toFixed(2)),
      taxable_amount: taxable,
      cgst_amount: cgst,
      sgst_amount: sgst,
      igst_amount: igst,
      round_off: Number((completedBill.roundOff || 0).toFixed(2)),
      grand_total: grandTotal,
      paid_amount: paidAmount,
      balance_due: balanceDue,
      salesman_id: completedBill.salesmanId ? parseInt(String(completedBill.salesmanId), 10) || null : null,
      salesman_code: completedBill.salesmanCode || completedBill.salesman?.code || null,
      is_advance_booking: Boolean(completedBill.isAdvanceBooking),
      delivery_state: completedBill.isAdvanceBooking ? "BOOKED" : "DELIVERED",
      payment_splits_json: completedBill.paymentSplits ? JSON.stringify(completedBill.paymentSplits) : null,
      payments: finalPayments,
      utr_number: completedBill.utrNumber || null,
      subvention_percent: completedBill.subventionPercent || 0,
      sell_from_display: Boolean(completedBill.sellFromDisplay),
      items: (completedBill.items || []).map((it: any) => {
        const matchingProd = products.find(p => (it.barcode && p.barcode === it.barcode) || (it.pCode && p.pCode === it.pCode) || p.name.toUpperCase() === (it.product?.name || it.name || '').toUpperCase());
        const rawId = parseInt(String(matchingProd?.id || it.product?.id || it.id), 10);
        const validProdId = !isNaN(rawId) && rawId > 0 ? rawId : null;
        return {
          product_id: validProdId,
          barcode: it.barcode || matchingProd?.barcode || '',
          product_name: it.product?.name || it.name || matchingProd?.name || '',
          qty: Number(it.qty || 1),
          rate: Number((it.price || it.rate || 0).toFixed(2)),
          discount_amount: Number((it.discount || it.discAmt || 0).toFixed(2)),
          taxable_value: Number((it.taxable || it.taxableValue || ((it.price || 0) * (it.qty || 1))).toFixed(2)),
          cgst_rate: Number((it.cgstPercent || it.cgst || 0).toFixed(2)),
          cgst_amount: Number((it.cgstAmt || 0).toFixed(2)),
          sgst_rate: Number((it.sgstPercent || it.sgst || 0).toFixed(2)),
          sgst_amount: Number((it.sgstAmt || 0).toFixed(2)),
          igst_rate: Number((it.igstPercent || it.igst || 0).toFixed(2)),
          igst_amount: Number((it.igstAmt || 0).toFixed(2)),
          net_amount: Number((it.total || ((it.price || 0) * (it.qty || 1))).toFixed(2)),
          batch_no: it.batchNo || null,
          serial_no: Array.isArray(it.serialNos) && it.serialNos.length > 0 ? it.serialNos.join(',') : null
        };
      })
    };

    // 6. Persist to backend database via FastAPI and fail loudly if unreachable
    const idempotencyKey = completedBill.idempotencyKey || `svf-inv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const result = await api.createSaleInvoice(invoicePayload, idempotencyKey);

    // 7. Update oldBills immediately with correct status & paid amount
    const invNo = completedBill.invoiceNo || (result && (result.invoice_no || result.invoiceNo)) || `SVF-${Date.now()}`;
    const billDate = completedBill.date || new Date().toLocaleDateString('en-GB');

    setOldBills(prev => {
      const newOldBill: OldBillRecord = {
        id: completedBill.id || `bill-${Date.now()}`,
        invoiceNo: invNo,
        date: billDate,
        customerName: completedBill.customer?.name || 'Walk-in Cash Customer',
        contactNo: completedBill.customer?.phone || '',
        totalQty: completedBill.totalQty || (completedBill.items ? completedBill.items.length : 1),
        netPay: grandTotal,
        paidAmount,
        balanceDue,
        status: balanceDue > 0 ? (paidAmount > 0 ? 'PARTIAL' : 'CREDIT') : 'PAID',
        paymentMode: completedBill.paymentMode || 'Cash',
        customer: completedBill.customer,
        items: completedBill.items || []
      };
      return [newOldBill, ...prev.filter(b => b.invoiceNo !== invNo)];
    });

    // 🌟 AUTOMATIC CRM LEAD CONVERSION UPON SALE COMPLETION:
    const custPhone = (completedBill.customer?.phone || '').replace(/\D/g, '');
    if (custPhone && custPhone !== '1234567890') {
      setCrmLeads(prevLeads => {
        let changed = false;
        const updated = prevLeads.map(l => {
          if (l.phone.replace(/\D/g, '') === custPhone && l.status !== 'CONVERTED') {
            changed = true;
            if (l.id.startsWith('lead-web-')) {
              const inqId = l.id.replace('lead-web-', '');
              fetch(`${api.getBaseUrl()}/inquiries/${inqId}/status?new_status=converted`, { method: 'PATCH' }).catch(() => {});
            }
            return {
              ...l,
              status: 'CONVERTED' as const,
              lastContactedAt: new Date().toISOString(),
              notes: (l.notes ? l.notes + ' | ' : '') + `Converted to Sale: Inv #${completedBill.invoiceNo || 'PAID'} (₹${grandTotal.toFixed(0)})`
            };
          }
          return l;
        });
        if (changed) {
          window.dispatchEvent(new CustomEvent('svf-toast', {
            detail: {
              message: `🎯 CRM Showroom Lead for "${completedBill.customer?.name}" marked as CONVERTED!`,
              type: 'success'
            }
          }));
        }
        return updated;
      });
    }



    // 🌟 SYNC TO POST-DELIVERY CUSTOMER REVIEWS & CSAT PIPELINE:
    if (completedBill.customer?.phone && completedBill.customer.phone !== '1234567890') {
      const prodSummary = (completedBill.items || []).map((it: any) => it.product?.name || it.name).filter(Boolean).slice(0, 2).join(', ') || 'Showroom Furniture Suite';
      const invNo = completedBill.invoiceNo || (result && (result.invoice_no || result.invoiceNo)) || `SVF-${Date.now()}`;
      const newReview: CustomerDeliveryReview = {
        id: `rev-${Date.now()}`,
        deliveryNoteNo: invNo,
        invoiceNo: invNo,
        customerName: completedBill.customer.name,
        phone: completedBill.customer.phone,
        productName: prodSummary,
        deliveryDate: completedBill.date || new Date().toLocaleDateString('en-GB'),
        rating: 0,
        status: 'PENDING',
        feedbackTags: []
      };
      setDeliveryReviews(prev => [newReview, ...prev.filter(r => r.invoiceNo !== invNo)]);
    }

    // 🌟 SYNC BANKING / CARD / UPI SALES TO BANK ACCOUNTS & STATEMENTS:
    const bankModes = ['Bank', 'Card', 'UPI', 'By Bank', 'Net Banking', 'NEFT', 'RTGS', 'Cheque'];
    let bankAmountCollected = 0;
    if (completedBill.paymentSplits && Array.isArray(completedBill.paymentSplits)) {
      completedBill.paymentSplits.forEach((s: any) => {
        const m = s.mode || s.modeName || '';
        if (bankModes.some(bm => m.toLowerCase().includes(bm.toLowerCase()))) {
          bankAmountCollected += Number(s.amount || 0);
        }
      });
    } else {
      const pm = completedBill.paymentMode || 'Cash';
      if (bankModes.some(bm => pm.toLowerCase().includes(bm.toLowerCase()))) {
        bankAmountCollected = paidAmount;
      }
    }

    if (bankAmountCollected > 0) {
      setBankAccounts(prev => {
        if (prev.length === 0) return prev;
        const copy = [...prev];
        copy[0] = { ...copy[0], balance: Number((copy[0].balance + bankAmountCollected).toFixed(2)) };
        return copy;
      });

      const newStmt: BankStatementEntry = {
        id: `bs-sale-${Date.now()}`,
        date: completedBill.date || new Date().toLocaleDateString('en-GB'),
        accountNo: bankAccounts[0]?.accountNo || '50200012345678',
        receiptNo: completedBill.invoiceNo || `INV-${Date.now()}`,
        description: `POS Sale Receipt (${completedBill.paymentMode || 'Digital'}): ${completedBill.customer?.name || 'Customer'}`,
        debit: 0,
        credit: bankAmountCollected
      };
      setBankStatements(prev => [...prev, newStmt]);

      api.createBankStatement({
        entry_date: newStmt.date,
        account_no: newStmt.accountNo,
        receipt_no: newStmt.receiptNo,
        description: newStmt.description,
        debit: 0,
        credit: bankAmountCollected,
        balance: 0
      }).catch(err => console.warn('Backend bank statement creation queued:', err));
    }

    // 🌟 SYNC SALES COMMISSION TO SALESMAN LEDGER & SALESMAN BALANCE:
    const assignedSalesman = salesmen.find(s =>
      (completedBill.salesmanId && s.id === completedBill.salesmanId) ||
      (completedBill.salesmanCode && s.code === completedBill.salesmanCode) ||
      (completedBill.salesman && s.name.toLowerCase() === String(completedBill.salesman).toLowerCase())
    ) || salesmen[0];

    if (assignedSalesman && grandTotal > 0) {
      const commRate = assignedSalesman.commissionRate || 2.5;
      const commAmt = Number(((grandTotal * commRate) / 100).toFixed(2));
      const smLedgerEntry: SalesmanLedgerEntry = {
        id: `dyn-sm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        salesmanId: assignedSalesman.id,
        date: completedBill.date || new Date().toLocaleDateString('en-GB'),
        account: assignedSalesman.name,
        voucherNo: invNo,
        voucherType: 'Sales',
        particulars: `Sales Commission on Bill ${invNo}`,
        debit: 0,
        credit: commAmt,
        balance: commAmt
      };
      setSalesmanLedger(prev => [smLedgerEntry, ...prev]);
      setSalesmen(prev => prev.map(s => s.id === assignedSalesman.id ? {
        ...s,
        balance: Number(((s.balance || 0) + commAmt).toFixed(2))
      } : s));
    }

    return result;
  };


  const handleAddCustomer = async (newCust: Customer) => {
    setCustomers(prev => prev.some(x => x.id === newCust.id || x.phone === newCust.phone) ? prev.map(x => (x.id === newCust.id || x.phone === newCust.phone) ? newCust : x) : [newCust, ...prev]);

    // 🌟 SYNC TO SHOWROOM CRM LEADS: Whenever a new customer enters our project, connect them to CRM Leads!
    const cleanPhone = (newCust.phone || '').replace(/\D/g, '');
    if (cleanPhone && cleanPhone !== '1234567890' && cleanPhone !== '0000000000' && cleanPhone.length >= 7) {
      setCrmLeads(prevLeads => {
        const exists = prevLeads.some(l => l.phone.replace(/\D/g, '') === cleanPhone);
        if (!exists) {
          const followUp = new Date();
          followUp.setDate(followUp.getDate() + 2);
          const autoLead: CrmLead = {
            id: `lead-auto-${Date.now()}`,
            customerName: newCust.name || 'Walk-in Customer',
            phone: newCust.phone,
            email: newCust.email || '',
            city: newCust.city || 'Kozhikode',
            status: 'WARM',
            furnitureInterest: 'Showroom Walk-in Inquiry',
            estimatedBudget: Number(newCust.creditLimit) || 50000,
            assignedSalesman: salesmen[0]?.name || 'Arun Kumar (Senior Consultant)',
            followUpDate: followUp.toISOString().split('T')[0],
            notes: 'Auto-registered from Customer Intake / POS',
            source: 'WALK_IN',
            createdAt: new Date().toISOString()
          };
          return [autoLead, ...prevLeads];
        }
        return prevLeads;
      });
    }

    try {
      const res = await api.createCustomer({
        code: (newCust as any).code || newCust.id || `CUST-${Date.now().toString().slice(-6)}`,
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
      });
      if (res && res.id) {
        setCustomers(prev => prev.map(c => (c.phone === newCust.phone || c.id === newCust.id) ? { ...c, id: String(res.id) } : c));
      }
    } catch (err) {
      console.warn('Backend customer create error:', err);
      throw err;
    }
  };

  const handleUpdateCustomer = (updatedCust: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCust.id ? updatedCust : c));
    const numId = parseInt(updatedCust.id, 10);
    const targetId = (!isNaN(numId) && numId > 0)
      ? numId
      : (updatedCust.phone || (updatedCust as any).code || updatedCust.id);

    const payload = {
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
    };

    if (targetId) {
      api.updateCustomer(targetId, payload)
        .then(res => {
          if (res && res.id) {
            setCustomers(prev => prev.map(c => (c.phone === updatedCust.phone || c.id === updatedCust.id) ? { ...c, id: String(res.id) } : c));
          }
        })
        .catch(err => console.warn('Backend offline, customer update kept locally:', err));
    } else {
      api.createCustomer(payload)
        .then(res => {
          if (res && res.id) {
            setCustomers(prev => prev.map(c => (c.phone === updatedCust.phone || c.id === updatedCust.id) ? { ...c, id: String(res.id) } : c));
          }
        })
        .catch(err => console.warn('Backend offline, customer creation kept locally:', err));
    }
  };

  // Product Add / Update Callbacks
  const handleAddProduct = (newProd: Product) => {
    setProducts(prev => [newProd, ...prev]);
    const phys = newProd.physical_stock ?? newProd.openingStock ?? 0;
    const resv = newProd.reserved_stock ?? 0;
    api.createProduct({
      name: newProd.name,
      p_code: newProd.pCode,
      barcode: newProd.barcode,
      purchase_price: newProd.purchasePrice,
      retail_price: newProd.retailPrice,
      wholesale_price: newProd.wholesalePrice || newProd.retailPrice,
      mrp: newProd.mrp,
      opening_stock: newProd.openingStock,
      current_stock: phys,
      physical_stock: phys,
      reserved_stock: resv,
      available_to_sell: phys - resv,
      is_knockdown: Boolean(newProd.isKnockdown),
      total_boxes_count: newProd.totalBoxesCount || newProd.total_boxes || 1,
      total_boxes: newProd.total_boxes || newProd.totalBoxesCount || 1,
      category_name: newProd.category,
      sub_category: newProd.subCategory,
      description: newProd.description,
      hsn_code: newProd.hsn,
      cgst: newProd.cgst,
      sgst: newProd.sgst,
      igst: newProd.igst,
      sales_unit: newProd.salesUnit,
      godown: newProd.godown,
      rack: newProd.rack,
      brand: newProd.brand || 'Godrej Interio',
      material: newProd.material || '',
      dimensions: newProd.dimensions || '',
      color: newProd.colour || (newProd as any).color || '',
      warranty: newProd.warranty || '3 Years Comprehensive',
      box_components: newProd.boxComponents?.map(b => ({
        box_number: b.boxNumber,
        total_boxes: b.totalBoxes,
        component_name: b.componentName,
        box_barcode: b.boxBarcode,
        box_sku: b.boxSku || b.boxBarcode,
        dimensions: b.dimensions || '',
        weight_kg: Number(b.weightKg) || 0,
        godown: b.godown || newProd.godown || '',
        rack: b.rack || newProd.rack || '',
        status: b.status || 'InStock',
        notes: b.notes || ''
      })) || []
    }).then(res => {
      if (res && res.id) {
        setProducts(prev => prev.map(p => (p.barcode === newProd.barcode || p.pCode === newProd.pCode) ? { ...p, id: String(res.id) } : p));
        if (newProd.boxComponents && newProd.boxComponents.length > 0) {
          saveProductBoxComponents(res.id, newProd.boxComponents).catch(e => console.warn('Failed to save box components:', e));
        }
      }
    }).catch(err => console.warn('Backend offline, product kept in local state:', err));

    const newRecordItem: ProductRecordItem = {
      id: newProd.id,
      code: newProd.pCode,
      name: newProd.name,
      category: newProd.category,
      subCategory: newProd.subCategory || '',
      barcode: newProd.barcode,
      hsnCode: newProd.hsn || '9403',
      partNo: newProd.pCode,
      godown: newProd.godown || 'Showroom Floor',
      rack: newProd.rack || 'A1',
      mrp: newProd.mrp,
      retailPrice: newProd.retailPrice,
      wholesalePrice: newProd.wholesalePrice || newProd.retailPrice,
      openingStock: newProd.openingStock,
      currentStock: phys,
      saleTaxType: 'Inclusive',
      purchaseTaxType: 'Inclusive',
      active: true,
      defaultSaleQty: 1
    };
    setProductRecords(prev => [newRecordItem, ...prev.filter(r => r.code !== newProd.pCode && r.barcode !== newProd.barcode)]);
  };

  const handleUpdateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    const numId = parseInt(updated.id, 10);
    const targetId = !isNaN(numId) && numId > 0 ? numId : (updated.barcode || updated.pCode);
    const phys = updated.physical_stock ?? updated.openingStock ?? 0;
    const resv = updated.reserved_stock ?? 0;
    setProductRecords(prev => prev.map(r => (r.id === updated.id || r.code === updated.pCode || r.barcode === updated.barcode) ? {
      ...r,
      name: updated.name,
      mrp: updated.mrp,
      retailPrice: updated.retailPrice,
      wholesalePrice: updated.wholesalePrice || updated.retailPrice,
      openingStock: updated.openingStock,
      currentStock: phys,
      godown: updated.godown || r.godown,
      rack: updated.rack || r.rack
    } : r));
    api.updateProduct(targetId, {
      name: updated.name,
      p_code: updated.pCode,
      barcode: updated.barcode,
      purchase_price: updated.purchasePrice,
      retail_price: updated.retailPrice,
      wholesale_price: updated.wholesalePrice || updated.retailPrice,
      mrp: updated.mrp,
      current_stock: phys,
      physical_stock: phys,
      reserved_stock: resv,
      available_to_sell: phys - resv,
      is_knockdown: Boolean(updated.isKnockdown),
      total_boxes_count: updated.totalBoxesCount || updated.total_boxes || 1,
      total_boxes: updated.total_boxes || updated.totalBoxesCount || 1,
      category_name: updated.category,
      sub_category: updated.subCategory,
      description: updated.description,
      hsn_code: updated.hsn,
      cgst: updated.cgst,
      sgst: updated.sgst,
      igst: updated.igst,
      sales_unit: updated.salesUnit,
      godown: updated.godown,
      rack: updated.rack,
      brand: updated.brand || 'Godrej Interio',
      material: updated.material || '',
      dimensions: updated.dimensions || '',
      color: updated.colour || (updated as any).color || '',
      warranty: updated.warranty || '3 Years Comprehensive'
    }).catch(err => console.warn('Backend offline, product update kept locally:', err));

    if (updated.boxComponents && updated.boxComponents.length > 0) {
      saveProductBoxComponents(targetId, updated.boxComponents).catch(e => console.warn('Failed to update box components:', e));
    }
  };

  const handleAddCategory = (newCat: Category) => {
    setCategories(prev => [...prev, newCat]);
    api.createCategory({
      name: newCat.name,
      slug: newCat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: newCat.name,
      icon: 'Armchair',
      image_url: ''
    }).catch(e => console.warn('Category backend sync queued:', e));
  };

  const handleAddSubCategory = (newSub: SubCategory) => {
    setSubCategories(prev => [...prev, newSub]);
    api.createCategory({
      name: `${newSub.category} - ${newSub.name}`,
      slug: `${newSub.category}-${newSub.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: `Sub-category ${newSub.name} under ${newSub.category}`,
      icon: 'Tag',
      image_url: ''
    }).catch(e => console.warn('SubCategory backend sync queued:', e));
  };

  // Stock deduction callback from POS sale (supports Video 23 fractional unit conversion)
  const handleStockDeduct = (barcode: string, qty: number) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.barcode === barcode) {
          const phys = Math.max(0, Number(((p.physical_stock ?? p.openingStock) - qty).toFixed(3)));
          const res = p.reserved_stock ?? 0;
          return {
            ...p,
            currentStock: phys,
            physical_stock: phys,
            available_to_sell: Math.max(0, phys - res)
          };
        }
        return p;
      })
    );
  };

  // Stock reservation callback for advance bookings (hedged in reserved_stock)
  const handleStockReserve = (barcode: string, qty: number) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.barcode === barcode) {
          const phys = p.physical_stock ?? p.openingStock;
          const res = (p.reserved_stock ?? 0) + qty;
          return {
            ...p,
            reserved_stock: res,
            available_to_sell: Math.max(0, phys - res)
          };
        }
        return p;
      })
    );
  };

  // Purchase inward callback with 4-bucket damaged and physical stock split
  const handleAddStockInward = (barcode: string, addQty: number, newPurchasePrice?: number, damagedQty?: number) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.barcode === barcode || p.pCode === barcode || p.id === barcode) {
          const phys = (p.physical_stock ?? p.openingStock) + addQty;
          const dam = (p.damaged_stock ?? 0) + (damagedQty || 0);
          const res = p.reserved_stock ?? 0;
          return {
            ...p,
            openingStock: phys,
            currentStock: phys,
            physical_stock: phys,
            damaged_stock: dam,
            available_to_sell: Math.max(0, phys - res),
            purchasePrice: newPurchasePrice !== undefined ? newPurchasePrice : p.purchasePrice
          };
        }
        return p;
      })
    );

    setProductRecords(prev =>
      prev.map(pr => {
        if (pr.barcode === barcode || pr.code === barcode || pr.id === barcode) {
          return {
            ...pr,
            currentStock: (pr.currentStock || 0) + addQty
          };
        }
        return pr;
      })
    );

    const matched = products.find(p => p.barcode === barcode || p.pCode === barcode || p.id === barcode);
    const prodId = matched ? parseInt(matched.id.replace(/\D/g, ''), 10) || 1 : 1;

    api.createStockEntry({
      stock_code: `SE-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      remarks: `Stock inward: ${matched?.name || barcode} (+${addQty})`,
      items: [{
        product_id: prodId,
        qty: addQty,
        rate: newPurchasePrice !== undefined ? newPurchasePrice : (matched?.purchasePrice || 0)
      }]
    }).catch(err => console.warn('Backend stock entry sync queued:', err));
  };

  // Purchase inward record callback for dashboard tracking
  const handleSavePurchaseInvoiceRecord = (record: PurchaseRecordItem) => {
    setPurchaseRecords(prev => [record, ...prev]);

    // 🌟 SYNC TO SUPPLIER OUTSTANDING / PAYABLES:
    if (record.supplierName && record.totalAmount > 0) {
      setSupplierOutstanding(prev => {
        const suppIdx = prev.findIndex(s =>
          s.name.toLowerCase().includes(record.supplierName.toLowerCase()) ||
          record.supplierName.toLowerCase().includes(s.name.toLowerCase()) ||
          (record.gstin && s.address?.includes(record.gstin))
        );
        if (suppIdx >= 0) {
          const copy = [...prev];
          const cur = copy[suppIdx];
          const newCredit = Number(((cur.totalCredit || 0) + record.totalAmount).toFixed(2));
          const newBal = Number(((cur.balance || 0) + record.totalAmount).toFixed(2));
          copy[suppIdx] = {
            ...cur,
            totalCredit: newCredit,
            balance: newBal
          };
          return copy;
        } else {
          const newSupp: OutstandingRecord = {
            id: `s-out-${Date.now()}`,
            entityType: 'SUPPLIER',
            code: `S-${Date.now().toString().slice(-4)}`,
            name: record.supplierName,
            contactNo: '9876543210',
            address: record.gstin ? `GSTIN: ${record.gstin}` : 'Supplier Hub',
            city: 'Kozhikode',
            state: record.state || 'Kerala',
            totalCredit: record.totalAmount,
            totalDebit: 0,
            balance: record.totalAmount
          };
          return [newSupp, ...prev];
        }
      });
    }

    // Persist to Railway PostgreSQL database
    const matchedSupp = supplierOutstanding.find(s =>
      s.name.toLowerCase().includes(record.supplierName.toLowerCase()) ||
      record.supplierName.toLowerCase().includes(s.name.toLowerCase())
    );
    const suppId = matchedSupp ? parseInt(matchedSupp.id.replace(/\D/g, ''), 10) || 1 : 1;

    api.createPurchase({
      invoice_no: record.invoiceNo || `PUR-${Date.now()}`,
      purchase_type: 'Credit',
      supplier_id: suppId,
      supplier_name: record.supplierName,
      supplier_bill_no: record.supplierInvoiceNo || record.invoiceNo || null,
      date: record.invoiceDate || new Date().toISOString().split('T')[0],
      invoice_date: record.invoiceDate || new Date().toISOString().split('T')[0],
      sub_total: record.taxableAmount || (record.totalAmount - (record.cgstAmount || 0) - (record.sgstAmount || 0)),
      total_taxable: record.taxableAmount || (record.totalAmount - (record.cgstAmount || 0) - (record.sgstAmount || 0)),
      cgst_total: record.cgstAmount || 0,
      sgst_total: record.sgstAmount || 0,
      igst_total: record.igstAmount || 0,
      grand_total: record.totalAmount,
      paid_amount: 0,
      status: 'Received',
      payment_mode: 'Credit',
      items: [{
        product_code: record.productCode || null,
        product_name: record.productName || 'Furniture Item',
        barcode: record.barcode || null,
        description: record.productName || 'Furniture Item',
        qty: record.qty || 1,
        purchase_price: record.purchasePrice || 0,
        mrp: record.mrp || 0,
        retail_price: record.retailPrice || 0,
        tax_percent: (record.cgstPercent || 0) + (record.sgstPercent || 0) + (record.igstPercent || 0) || 12,
        tax_amount: (record.cgstAmount || 0) + (record.sgstAmount || 0) + (record.igstAmount || 0),
        total_amount: record.totalAmount || 0
      }]
    }).catch(err => console.warn('Backend purchase invoice sync queued:', err));
  };

  // Stock adjustment callback with Railway Cloud PostgreSQL synchronization
  const handleApplyAdjustment = (adj: any) => {
    setAdjustments(prev => [adj, ...prev]);
    setStockAdjustmentRecords(prev => [adj, ...prev]);
    const matched = products.find(p => p.barcode === adj.barcode || p.pCode === (adj.productCode || adj.pCode));
    const prodId = matched ? parseInt(matched.id.replace(/\D/g, ''), 10) || 1 : 1;

    setProducts(prev =>
      prev.map(p => {
        if (p.barcode === adj.barcode || (matched && p.id === matched.id)) {
          const newQty = adj.physicalStock !== undefined
            ? adj.physicalStock
            : (adj.adjustmentType || adj.type) === 'Plus'
            ? (p.physical_stock ?? p.openingStock) + adj.qty
            : Math.max(0, (p.physical_stock ?? p.openingStock) - adj.qty);
          const res = p.reserved_stock ?? 0;
          return {
            ...p,
            goodProductQty: newQty,
            openingStock: newQty,
            currentStock: newQty,
            physical_stock: newQty,
            available_to_sell: Math.max(0, newQty - res)
          };
        }
        return p;
      })
    );

    setProductRecords(prev =>
      prev.map(pr =>
        pr.barcode === adj.barcode || (matched && pr.code === matched.pCode)
          ? {
              ...pr,
              currentStock:
                adj.physicalStock !== undefined
                  ? adj.physicalStock
                  : (adj.adjustmentType || adj.type) === 'Plus'
                  ? pr.currentStock + adj.qty
                  : Math.max(0, pr.currentStock - adj.qty)
            }
          : pr
      )
    );

    api.createStockAdjustment({
      adjustment_code: adj.saCode || adj.adjustmentCode || `SA-${Date.now()}`,
      date: adj.date || new Date().toISOString().split('T')[0],
      product_id: prodId,
      product_code: adj.productCode || matched?.pCode || 'P-001',
      product_name: adj.productName || matched?.name || 'Adjusted Product',
      barcode: adj.barcode || matched?.barcode || '',
      adjustment_type: adj.adjustmentType || adj.type || 'Plus',
      qty: Number(adj.qty || 1),
      reason: adj.reason || 'Store inventory audit'
    }).catch(e => console.warn('Backend stock adjustment sync queued:', e));
  };

  // Stock entry callback with Railway Cloud PostgreSQL synchronization
  const handleSaveStockEntry = (voucher: { stockId: string; date: string; remarks?: string; items: any[] }) => {
    setStockEntryRecords(prev => [...voucher.items, ...prev]);
    setProducts(prev => {
      const updated = [...prev];
      voucher.items.forEach(it => {
        const idx = updated.findIndex(p => p.barcode === it.barcode || p.id === it.productId || p.pCode === it.productCode);
        if (idx !== -1) {
          const cur = updated[idx];
          const newQty = (cur.physical_stock ?? cur.openingStock ?? 0) + it.qty;
          const res = cur.reserved_stock ?? 0;
          updated[idx] = {
            ...cur,
            goodProductQty: newQty,
            openingStock: newQty,
            currentStock: newQty,
            physical_stock: newQty,
            available_to_sell: Math.max(0, newQty - res)
          };
        }
      });
      return updated;
    });

    setProductRecords(prev =>
      prev.map(pr => {
        const it = voucher.items.find(i => i.barcode === pr.barcode || i.productCode === pr.code);
        return it ? { ...pr, currentStock: (pr.currentStock || 0) + it.qty } : pr;
      })
    );

    try {
      api.createStockEntry({
        stock_code: voucher.stockId || `STK-${Date.now().toString().slice(-4)}`,
        date: voucher.date || new Date().toISOString().split('T')[0],
        remarks: voucher.remarks || 'Store stock entry',
        items: voucher.items.map(it => {
          const matched = products.find(p => p.barcode === it.barcode || p.pCode === it.productCode);
          const prodId = matched ? parseInt(matched.id.replace(/\D/g, ''), 10) || 1 : 1;
          return {
            product_id: prodId,
            product_code: it.productCode || matched?.pCode || 'P-001',
            product_name: it.productName || matched?.name || 'Inward Product',
            barcode: it.barcode || matched?.barcode || '',
            qty: Number(it.qty || 1),
            unit: it.unit || 'Pcs',
            remarks: it.remarks || null
          };
        })
      }).catch(e => console.warn('Backend stock entry queued:', e));
    } catch (e) {
      console.warn('Error formatting stock entry:', e);
    }
  };

  // Customer debt payment callback with Railway PostgreSQL synchronization
  const handleCollectCustomerPayment = async (customerId: string, amount: number, mode: 'CASH' | 'UPI' | 'BANK' = 'CASH') => {
    let updatedCust: Customer | null = null;
    const targetCust = customers.find(c => c.id === customerId);
    const newBal = targetCust ? Math.max(0, Number((targetCust.balance - amount).toFixed(2))) : 0;
    const vNo = `RCT-${Date.now().toString().slice(-6)}`;
    const numId = parseInt(customerId.replace(/\D/g, ''), 10) || 1;
    const targetCustId = customerId || numId;
    const isBank = mode === 'BANK' || mode === 'UPI';

    try {
      await Promise.all([
        api.updateCustomer(targetCustId, {
          current_balance: newBal
        }),
        api.addCustomerLedger(targetCustId, {
          date: new Date().toISOString().split('T')[0],
          voucher_no: vNo,
          particulars: `Customer Debt Collection (${mode})`,
          debit: 0.0,
          credit: amount
        }),
        ...(isBank ? [
          api.createBankStatement({
            entry_date: new Date().toISOString().split('T')[0],
            account_no: bankAccounts[0]?.accountNo || '50200012345678',
            receipt_no: vNo,
            description: `Customer Debt Collection (${mode}): ${targetCust ? targetCust.name : customerId}`,
            debit: 0,
            credit: amount,
            balance: 0
          })
        ] : []),
        api.createIncomeVoucher({
          voucher_no: vNo,
          date: new Date().toISOString().split('T')[0],
          name: targetCust ? targetCust.name : 'Customer Debt Collection',
          details: `Payment collected from customer ${targetCust ? targetCust.name : customerId} via ${mode}`,
          payment_mode: isBank ? 'Bank' : 'Cash',
          grand_total: amount
        })
      ]);
    } catch (err) {
      console.warn('Backend customer debt collection error:', err);
      throw err;
    }

    setCustomers(prev =>
      prev.map(c => {
        if (c.id === customerId) {
          updatedCust = { ...c, balance: newBal };
          return updatedCust;
        }
        return c;
      })
    );

    // 🌟 1. SYNC DEBT COLLECTION TO CUSTOMER OUTSTANDING ANALYSIS:
    setCustomerOutstanding(prev => prev.map(r => {
      if (r.code === customerId || r.id === customerId) {
        return {
          ...r,
          totalCredit: Number(((r.totalCredit || 0) + amount).toFixed(2)),
          balance: newBal
        };
      }
      return r;
    }));

    // 🌟 2. SYNC TO CUSTOMER LEDGER STATEMENT:
    const newLedger: CustomerLedgerEntry = {
      id: 'ledg-rcp-' + Date.now(),
      customerId: customerId,
      date: new Date().toLocaleDateString('en-GB'),
      voucherNo: vNo,
      particulars: `Customer Debt Collection (${mode})`,
      debit: 0.0,
      credit: amount
    };
    setCustomerLedger(prev => [...prev, newLedger]);

    if (isBank) {
      setBankAccounts(prev => prev.map((b, idx) => idx === 0 ? { ...b, balance: Number((b.balance + amount).toFixed(2)) } : b));
      setBankStatements(prev => [{
        id: `bs-col-${Date.now()}`,
        date: new Date().toLocaleDateString('en-GB'),
        accountNo: bankAccounts[0]?.accountNo || '50200012345678',
        receiptNo: vNo,
        description: `Customer Debt Collection (${mode}): ${targetCust ? targetCust.name : customerId}`,
        debit: 0,
        credit: amount
      }, ...prev]);
    }

    // 🌟 3. SYNC TO INCOME VOUCHERS:
    const newInc: IncomeVoucher = {
      id: `inc-rcp-${Date.now()}`,
      voucherNo: vNo,
      date: new Date().toLocaleDateString('en-GB'),
      name: targetCust ? targetCust.name : 'Customer Debt Collection',
      details: `Payment collected from customer ${targetCust ? targetCust.name : customerId} via ${mode}`,
      paymentMode: isBank ? 'Bank' : 'Cash',
      grandTotal: amount,
      items: [{
        id: `inc-it-${Date.now()}`,
        particulars: `Customer Debt Settlement: ${targetCust ? targetCust.name : customerId}`,
        amount: amount,
        notes: ''
      }]
    };
    setIncomeVouchers(prev => [newInc, ...prev]);

    // 🌟 4. DEDUCT FROM OPEN BILLS:
    setOldBills(prev => {
      let rem = amount;
      return prev.map(bill => {
        const billCustId = bill.customer?.id ? String(bill.customer.id) : '';
        if (billCustId === customerId && (bill.balanceDue ?? 0) > 0 && rem > 0) {
          const ded = Math.min(bill.balanceDue ?? 0, rem);
          rem -= ded;
          const newPaid = Number(((bill.paidAmount || 0) + ded).toFixed(2));
          const newDue = Number(((bill.balanceDue ?? 0) - ded).toFixed(2));
          return {
            ...bill,
            paidAmount: newPaid,
            balanceDue: newDue,
            status: newDue <= 0.01 ? 'PAID' : 'PARTIAL'
          };
        }
        return bill;
      });
    });
  };

  // Quick Barcode Print jump
  const handlePrintBarcode = (prod: Product) => {
    setSelectedBarcodeProduct(prod);
    setActiveWorkspace('BARCODE_DESIGNER');
  };

  // Universal [Esc] key handler: Return to Desktop Home if no modal is currently displayed
  useEffect(() => {
    const handleGlobalEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeWorkspace !== 'DESKTOP_HOME') {
        // If an open modal overlay exists in the DOM, let the modal close itself
        const modalOverlays = document.querySelectorAll('.rd-modal-overlay, .rd-dialog-backdrop, [role="dialog"]');
        if (modalOverlays.length > 0) {
          return;
        }
        setActiveWorkspace('DESKTOP_HOME');
      }
    };
    window.addEventListener('keydown', handleGlobalEscape);
    return () => window.removeEventListener('keydown', handleGlobalEscape);
  }, [activeWorkspace]);

  if (activeWorkspace === 'PROJECTS_GALLERY') {
    return (
      <Suspense fallback={<ModuleLoadingSkeleton moduleName="Projects Portfolio" />}>
        <FurnitureProjectsGalleryView
          onExitToPos={() => {
            if (typeof window !== 'undefined' && window.history && window.location.pathname.includes('/project')) {
              window.history.pushState({}, '', '/');
            }
            setActiveWorkspace('DESKTOP_HOME');
          }}
        />
      </Suspense>
    );
  }

  if (activeWorkspace === 'CUSTOMER_PORTAL') {
    return (
      <Suspense fallback={<ModuleLoadingSkeleton moduleName="Customer Portal" />}>
        <CustomerShowroomPortalView
          products={products}
          companyInfo={companyInfo}
          initialSku={initialScannedSku || selectedBarcodeProduct?.pCode}
          onExitToPos={() => setActiveWorkspace('DESKTOP_HOME')}
        />
      </Suspense>
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
        onOpenBankingMaster={() => handleOpenBankingHub('accounts')}
        onOpenDecentroBanking={(tab) => handleOpenBankingHub(tab || 'qr')}
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
        onOpenFinancialStatements={() => setShowFinancialStatementsModal(true)}
        onOpenAutoBackup={() => setShowAutoBackupModal(true)}
        onOpenDatabaseRestore={() => setShowDatabaseRestoreModal(true)}
        onTriggerManualBackup={handleTriggerManualBackup}
        onOpenCustomerRecords={() => setShowCustomerRecordsModal(true)}
        onOpenSupplierRecords={() => setShowSupplierRecordsModal(true)}
        onOpenCustomerOutstanding={() => {
          setOutstandingInitialEntity('CUSTOMER');
          setShowOutstandingAnalysisModal(true);
        }}
        onOpenCustomerCreditAging={() => setShowCustomerCreditAgingModal(true)}
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
        onOpenContraVoucher={() => setShowContraModal(true)}
        onOpenExpensesDashboard={() => setShowExpensesDashboardModal(true)}
        onOpenIncomeDashboard={() => setShowIncomeDashboardModal(true)}
        onOpenBankStatements={() => {
          setBankingHubTab('ledger');
          setShowBankingHub(true);
        }}
        onOpenStockHedging={() => setShowStockHedgingModal(true)}
        onOpenDeliveryPipeline={() => setShowDeliveryPipelineModal(true)}
        onOpenWorkshopJobCards={() => setShowWorkshopJobCardModal(true)}
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
        onOpenProductImageUpload={() => setShowProductImageUploadModal(true)}
        onOpenProductCatalogue={() => setShowProductCatalogueModal(true)}
        onOpenWhatsAppBulkSender={() => setShowWhatsAppBulkSenderModal(true)}
        onOpenCustomerLedger={() => setShowStandaloneCustomerLedger(true)}
        onOpenCrmLeads={() => {
          setCrmLeadsInitialTab('LEADS');
          setShowCrmLeadsModal(true);
        }}
        onOpenCustomerReviews={() => {
          setCrmLeadsInitialTab('REVIEWS');
          setShowCrmLeadsModal(true);
        }}
        products={products}
        customers={customers}
        bills={oldBills}
        onOpenTaxReport={() => setActiveWorkspace('TAX_REPORT_GST')}
        onOpenDayEndClosing={() => setShowDayEndClosingModal(true)}
        onOpenHardwareHub={() => setShowHardwareHubModal(true)}
        onOpenDynamicQrModal={() => setShowDynamicQrModal(true)}
        onOpenOutwardExitScanner={() => setShowOutwardExitModal(true)}
        onLogout={handleInitiateLogout}
      />

      {/* 2. MAIN ACTIVE DESKTOP WORKSPACE CANVAS */}
      <div className="rd-canvas">
        {activeWorkspace === 'DESKTOP_HOME' && (
          <DesktopHomeView
            products={products}
            onOpenWorkspace={setActiveWorkspace}
            onOpenProductImageUpload={() => setShowProductImageUploadModal(true)}
            onOpenProductCatalogue={() => setShowProductCatalogueModal(true)}
            onOpenWhatsAppBulkSender={() => setShowWhatsAppBulkSenderModal(true)}
            onOpenDecentroBanking={(tab) => handleOpenBankingHub(tab || 'qr')}
            onOpenFinancialStatements={() => setShowFinancialStatementsModal(true)}
            onOpenDayEndClosing={() => setShowDayEndClosingModal(true)}
            onOpenCrmLeads={() => {
              setCrmLeadsInitialTab('LEADS');
              setShowCrmLeadsModal(true);
            }}
            onOpenCustomerReviews={() => {
              setCrmLeadsInitialTab('REVIEWS');
              setShowCrmLeadsModal(true);
            }}
          />
        )}

        {activeWorkspace === 'PRODUCT_ADD_SMART' && (
          <Suspense fallback={<ModuleLoadingSkeleton moduleName="Smart Product Catalog" />}>
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
              onUpdateColumnConfig={handleSaveColumnConfig}
              onPrintBarcode={handlePrintBarcode}
              onBulkUpdateProducts={handleBulkUpdateProducts}
              onClose={() => setActiveWorkspace('DESKTOP_HOME')}
            />
          </Suspense>
        )}

        {activeWorkspace === 'SALE_POS' && (
          <SalePosView
            products={products}
            customers={customers}
            isAdmin={isAdmin}
            onStockDeduct={handleStockDeduct}
            onStockReserve={handleStockReserve}
            onRecordSaleInvoice={handleRecordSaleInvoice}
            companyInfo={companyInfo}
            onUpdateCompanyInfo={handleUpdateCompanyInfo}
            dSaleBills={dSaleBills}
            onRecordDSaleBill={handleRecordDSaleBill}
            billConfig={billConfig}
            onUpdateBillConfig={handleSaveBillConfig}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            heldCarts={heldCarts}
            onUpdateHeldCarts={handleUpdateHeldCarts}
            prefixSuffixConfig={prefixSuffixConfig}
            bankAccounts={bankAccounts}
            ledgerEntries={customerLedger}
            onRecordReceipt={handleRecordReceipt}
            billsHistory={oldBills}
            onUpdateOldBill={(billId, updated) => setOldBills(prev => prev.map(b => b.id === billId ? updated : b))}
            onDeleteOldBill={handleDeleteOldBill}
            salesmen={salesmen}
            onUpdateSalesman={handleUpdateSalesman}
            salesmanLedger={salesmanLedger}
            onSaveSalesmanPayment={handleSaveSalesmanPayment}
            stockAlertConfig={stockAlertConfig}
            onUpdateStockAlertConfig={handleSaveStockAlertConfig}
            onBulkUpdateProducts={handleBulkUpdateProducts}
            estimates={estimates}
            productSerials={productSerials}
            onUpdateProductSerials={handleUpdateProductSerials}
            quantityDiscountRules={quantityDiscountRules}
            onOpenProductDiscountSetting={() => setIsProductDiscountModalOpen(true)}
            onAddProduct={handleAddProduct}
            onAddCategory={handleAddCategory}
            onExitToDesktop={() => setActiveWorkspace('DESKTOP_HOME')}
            activeLead={activeLeadForPOS}
            onClearActiveLead={() => setActiveLeadForPOS(null)}
            onOpenCrmLeads={() => {
              setCrmLeadsInitialTab('LEADS');
              setShowCrmLeadsModal(true);
            }}
            onProcessSalesReturn={handleProcessSalesReturn}
            onOpenHardwareHub={(prod) => {
              setHardwareHubProduct(prod || null);
              setShowHardwareHubModal(true);
            }}
          />
        )}

        {activeWorkspace === 'RUBIC_POS' && (
          <SalePosView
            products={products}
            customers={customers}
            isAdmin={isAdmin}
            onStockDeduct={handleStockDeduct}
            onStockReserve={handleStockReserve}
            onRecordSaleInvoice={handleRecordSaleInvoice}
            companyInfo={companyInfo}
            onUpdateCompanyInfo={handleUpdateCompanyInfo}
            dSaleBills={dSaleBills}
            onRecordDSaleBill={handleRecordDSaleBill}
            billConfig={billConfig}
            onUpdateBillConfig={handleSaveBillConfig}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            heldCarts={heldCarts}
            onUpdateHeldCarts={handleUpdateHeldCarts}
            prefixSuffixConfig={prefixSuffixConfig}
            bankAccounts={bankAccounts}
            ledgerEntries={customerLedger}
            onRecordReceipt={handleRecordReceipt}
            billsHistory={oldBills}
            onUpdateOldBill={(billId, updated) => setOldBills(prev => prev.map(b => b.id === billId ? updated : b))}
            onDeleteOldBill={handleDeleteOldBill}
            salesmen={salesmen}
            onUpdateSalesman={handleUpdateSalesman}
            salesmanLedger={salesmanLedger}
            onSaveSalesmanPayment={handleSaveSalesmanPayment}
            stockAlertConfig={stockAlertConfig}
            onUpdateStockAlertConfig={handleSaveStockAlertConfig}
            onBulkUpdateProducts={handleBulkUpdateProducts}
            estimates={estimates}
            productSerials={productSerials}
            onUpdateProductSerials={handleUpdateProductSerials}
            quantityDiscountRules={quantityDiscountRules}
            onOpenProductDiscountSetting={() => setIsProductDiscountModalOpen(true)}
            onAddProduct={handleAddProduct}
            onAddCategory={handleAddCategory}
            onExitToDesktop={() => setActiveWorkspace('DESKTOP_HOME')}
            activeLead={activeLeadForPOS}
            onClearActiveLead={() => setActiveLeadForPOS(null)}
            onOpenCrmLeads={() => {
              setCrmLeadsInitialTab('LEADS');
              setShowCrmLeadsModal(true);
            }}
            onProcessSalesReturn={handleProcessSalesReturn}
            onOpenHardwareHub={(prod) => {
              setHardwareHubProduct(prod || null);
              setShowHardwareHubModal(true);
            }}
          />
        )}

        <Suspense fallback={<ModuleLoadingSkeleton moduleName="ERP Workspace" />}>
          {activeWorkspace === 'PURCHASE_INWARD' && (
          <PurchaseInwardView
            products={products}
            suppliers={supplierOutstanding}
            onAddStockInward={handleAddStockInward}
            productSerials={productSerials}
            onAddProductSerials={handleAddProductSerials}
            onOpenPurchaseDashboard={() => setShowPurchaseDashboardModal(true)}
            onSavePurchaseInvoice={handleSavePurchaseInvoiceRecord}
            onAddNewProduct={handleAddProduct}
            onOpenBarcodeStudio={(prod) => {
              if (prod) setSelectedBarcodeProduct(prod);
              setActiveWorkspace('BARCODE_DESIGNER');
            }}
            onDeletePurchase={handleDeletePurchase}
            onClose={() => setActiveWorkspace('DESKTOP_HOME')}
          />
        )}

        {activeWorkspace === 'STOCK_IN_HAND' && (
          <StockInHandView
            products={products}
            onUpdateProducts={handleBulkUpdateProducts}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onOpenBarcodeStudio={(prod) => {
              if (prod) setSelectedBarcodeProduct(prod);
              setActiveWorkspace('BARCODE_DESIGNER');
            }}
            onClose={() => setActiveWorkspace('DESKTOP_HOME')}
          />
        )}

        {activeWorkspace === 'STOCK_AUDIT' && (
          <StockAuditView
            products={products}
            adjustments={adjustments}
            onApplyAdjustment={handleApplyAdjustment}
            onClose={() => setActiveWorkspace('DESKTOP_HOME')}
          />
        )}

        {activeWorkspace === 'CUSTOMER_LEDGER' && (
          <CustomerLedgerView
            customers={customers}
            onCollectPayment={handleCollectCustomerPayment}
            onOpenCreditAging={() => setShowCustomerCreditAgingModal(true)}
            onClose={() => setActiveWorkspace('DESKTOP_HOME')}
          />
        )}

        {activeWorkspace === 'PETTY_EXPENSES' && (
          <PettyExpensesView
            expenses={expenses}
            onAddExpense={exp => {
              setExpenses([exp, ...expenses]);
              api.createExpenseVoucher({
                voucher_no: exp.voucherNo || `EXP-${Date.now()}`,
                date: exp.date || new Date().toISOString().split('T')[0],
                name: exp.paidTo || 'Petty Cash Expense',
                details: `${exp.category}: ${exp.remarks || ''}`,
                payment_mode: 'Cash',
                grand_total: exp.amount
              }).catch(e => console.warn('Backend petty expense sync queued:', e));
            }}
            onClose={() => setActiveWorkspace('DESKTOP_HOME')}
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
            onClose={() => setActiveWorkspace('DESKTOP_HOME')}
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
              const numId = parseInt(prod.id.replace(/\D/g, ''), 10) || 1;
              api.createStockAdjustment({
                adjustment_code: `SA-EXP-${Date.now().toString().slice(-6)}`,
                date: new Date().toISOString().split('T')[0],
                product_id: numId,
                product_code: prod.pCode || 'P-001',
                product_name: prod.name,
                barcode: prod.barcode,
                adjustment_type: 'Minus',
                qty: Number(qty),
                reason: 'Damaged / Expiry write-off'
              }).catch(e => console.warn('Backend stock adjustment for write-off queued:', e));
            }}
            onReturnToSupplier={() => {
              setActiveWorkspace('PURCHASE_INWARD');
            }}
          />
        )}

        {activeWorkspace === 'TAX_REPORT_GST' && (
          <TaxReportGstView invoices={oldBills} customers={customers} onClose={() => setActiveWorkspace('DESKTOP_HOME')} />
        )}

        {activeWorkspace === 'SALES_INVOICE_REPORT' && (
          <SalesInvoiceReportView invoices={oldBills} customers={customers} onClose={() => setActiveWorkspace('DESKTOP_HOME')} />
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
              onConvertToInvoice={handleRecordSaleInvoice}
              onClose={() => setActiveWorkspace('DESKTOP_HOME')}
              activeLead={activeLeadForPOS}
              onClearActiveLead={() => setActiveLeadForPOS(null)}
              onOpenCustomerModal={() => setShowCustomerRecordsModal(true)}
              onOpenProductModal={() => setShowProductRecordsModal(true)}
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
              onDeleteEstimate={handleDeleteEstimate}
              onClose={() => setActiveWorkspace('DESKTOP_HOME')}
              onConvertToInvoice={handleRecordSaleInvoice}
              onRecordDeliveryReview={(rev) => handleUpdateDeliveryReviews([rev])}
              onOpenCustomerModal={() => setShowCustomerRecordsModal(true)}
              onOpenProductModal={() => setShowProductRecordsModal(true)}
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
        </Suspense>
      </div>

      <Suspense fallback={<ModuleLoadingSkeleton isModal moduleName="ERP Module" />}>
      {/* 3. COMPANY MASTER MODAL (FRAME 240) */}
      <CompanyMasterModal
        isOpen={showCompanyMaster}
        onClose={() => setShowCompanyMaster(false)}
        companyInfo={companyInfo}
        onSave={handleUpdateCompanyInfo}
      />

      {/* 4. SHOWROOM UNIFIED BANKING & FINANCIAL HUB (ACCOUNTS MASTER + DECENTRO GATEWAY) */}
      <ShowroomBankingHubModal
        isOpen={showBankingHub}
        onClose={() => setShowBankingHub(false)}
        initialTab={bankingHubTab}
        banks={banks}
        branches={branches}
        accounts={bankAccounts}
        onSaveBank={async (b: BankRecord) => {
          await api.saveBank({ bank_code: b.code || b.name, bank_name: b.name, active: true });
          setBanks(prev => prev.some(x => x.id === b.id) ? prev.map(x => x.id === b.id ? b : x) : [...prev, b]);
        }}
        onSaveBranch={async (br: BranchRecord) => {
          await api.saveBranch({ bank_name: br.bankName, branch_name: br.branchName, ifsc: br.ifsc, address: br.address, contact_no: br.contactNo, active: true });
          setBranches(prev => prev.some(x => x.id === br.id) ? prev.map(x => x.id === br.id ? br : x) : [...prev, br]);
        }}
        onSaveAccount={async (acc: BankAccountRecord) => {
          await api.saveBankAccount({
            account_no: acc.accountNo,
            account_holder: acc.accountName,
            account_type: acc.accountType,
            bank_name: acc.bankName,
            branch_name: acc.branchName,
            ifsc_code: 'HDFC0001234',
            opening_balance: acc.balance,
            current_balance: acc.balance,
            active: true
          });
          setBankAccounts(prev => prev.some(x => x.id === acc.id) ? prev.map(x => x.id === acc.id ? acc : x) : [...prev, acc]);
        }}
        onDeleteBank={async id => {
          await api.deleteBank(id);
          setBanks(prev => prev.filter(b => b.id !== id));
        }}
        onDeleteBranch={async id => {
          await api.deleteBranch(id);
          setBranches(prev => prev.filter(b => b.id !== id));
        }}
        onDeleteAccount={async id => {
          await api.deleteBankAccount(id);
          setBankAccounts(prev => prev.filter(a => a.id !== id));
        }}
      />

      {/* 5. PREFIX & SUFFIX SETTINGS MODAL (FRAME 221) */}
      <PrefixSuffixSettingsModal
        isOpen={showPrefixSuffix}
        onClose={() => setShowPrefixSuffix(false)}
        config={prefixSuffixConfig}
        onSave={async (newConfig) => {
          await api.updateDocumentPrefixes(newConfig);
          setPrefixSuffixConfig(newConfig);
        }}
      />

      {/* 6. CUSTOMER RECEIPT ENTRY MODAL (FRAME 331) */}
      <ReceiptEntryModal
        isOpen={showReceiptEntry}
        customers={customers}
        bankAccounts={bankAccounts}
        ledgerEntries={customerLedger}
        onSaveReceipt={handleRecordReceipt}
        onDeleteReceipt={(voucherNo) => {
          const targetReceipt = customerReceipts.find(r => r.transactionNo === voucherNo);
          const targetLedger = customerLedger.find(l => l.voucherNo === voucherNo);
          const creditAmt = targetLedger ? targetLedger.credit : (targetReceipt ? targetReceipt.amount : 0);
          const custId = targetLedger ? targetLedger.customerId : (targetReceipt ? targetReceipt.customerId : '');
          
          if (custId && creditAmt > 0) {
            setCustomers(prev => prev.map(c => (c.id === custId || c.name.toLowerCase() === custId.toLowerCase()) ? { ...c, balance: Number((c.balance + creditAmt).toFixed(2)) } : c));
          }
          if (targetReceipt && (targetReceipt.paymentMode === 'By Bank Transfer' || targetReceipt.paymentMode === 'By UPI' || targetReceipt.paymentMode === 'By Cheque')) {
            const acId = targetReceipt.bankAccountId;
            setBankAccounts(prev => prev.map((b, idx) => (!acId ? idx === 0 : (b.id === acId || b.accountNo === acId)) ? { ...b, balance: Math.max(0, Number((b.balance - targetReceipt.amount).toFixed(2))) } : b));
            setBankStatements(prev => prev.filter(s => s.receiptNo !== voucherNo));
          }
          setCustomerReceipts(prev => prev.filter(r => r.transactionNo !== voucherNo));
          setCustomerLedger(prev => prev.filter(l => l.voucherNo !== voucherNo));
          api.deleteCustomerReceipt(voucherNo).catch(err => console.warn('Backend receipt deletion queued:', err));
        }}
        onClose={() => setShowReceiptEntry(false)}
      />

      {/* 6B. CONTRA VOUCHER ENTRY MODAL (INTER-BANK & CASH TRANSFERS) */}
      <ContraTransferModal
        isOpen={showContraModal}
        onClose={() => setShowContraModal(false)}
        bankAccounts={bankAccounts}
        onTransferCompleted={(transfer) => {
          if (transfer.transfer_type === 'CASH_DEPOSIT') {
            setBankAccounts(prev => prev.map(b => b.accountNo === transfer.to_account ? { ...b, balance: b.balance + transfer.amount } : b));
          } else if (transfer.transfer_type === 'CASH_WITHDRAWAL') {
            setBankAccounts(prev => prev.map(b => b.accountNo === transfer.from_account ? { ...b, balance: b.balance - transfer.amount } : b));
          } else if (transfer.transfer_type === 'BANK_TO_BANK') {
            setBankAccounts(prev => prev.map(b => {
              if (b.accountNo === transfer.from_account) return { ...b, balance: b.balance - transfer.amount };
              if (b.accountNo === transfer.to_account) return { ...b, balance: b.balance + transfer.amount };
              return b;
            }));
          }
        }}
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
        onDeleteSalesman={handleDeleteSalesman}
        onClose={() => setShowSalesmanPayment(false)}
      />

      {/* 11. SALESMAN LEDGER STATEMENT MODAL (VIDEO 19 FRAME 365) */}
      <SalesmanLedgerModal
        isOpen={showSalesmanLedger}
        salesmen={salesmen}
        ledgerEntries={salesmanLedger}
        onVoidPayout={handleVoidSalesmanPayout}
        onClose={() => setShowSalesmanLedger(false)}
      />

      {/* 12. TERMINAL SETTING MODAL (VIDEO 17 FRAME 0065) */}
      <TerminalSettingModal
        isOpen={showTerminalSetting}
        onClose={() => setShowTerminalSetting(false)}
        config={terminalConfig}
        onSaveConfig={handleSaveTerminalConfig}
        tills={tills}
        onSaveTill={handleSaveTill}
        onDeleteTill={handleDeleteTill}
        onOpenTemplateEditor={() => {
          setShowTerminalSetting(false);
          setActiveWorkspace('SALE_POS');
        }}
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
        onAddCustomer={async newCust => {
          await handleAddCustomer(newCust);
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
        onDeleteCustomer={handleDeleteCustomer}
        onClose={() => setShowCustomerRecordsModal(false)}
      />

      {/* 26. VIDEO 07: LIST OF SUPPLIERS MODAL (FRAME 0060) */}
      <SupplierRecordModal
        isOpen={showSupplierRecordsModal}
        suppliers={supplierOutstanding}
        onAddSupplier={async newSupp => {
          try {
            const res = await api.createSupplier(mapFrontendSupplierToBackend(newSupp));
            const persistedSupp = { ...newSupp, id: res && res.id ? String(res.id) : newSupp.id };
            setSupplierOutstanding(prev => [persistedSupp, ...prev]);
          } catch (err) {
            console.warn('Backend createSupplier error:', err);
            throw err;
          }
        }}
        onOpenPayment={supplierId => {
          setShowSupplierRecordsModal(false);
          setSupplierPaymentTargetId(supplierId);
          setShowSupplierPaymentModal(true);
        }}
        onDeleteSupplier={handleDeleteSupplier}
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
        onSavePayment={async (supplierCode, amount, paymentMode, transactionNo) => {
          const matchedSupp = supplierOutstanding.find(s => s.code === supplierCode);
          const suppId = matchedSupp ? parseInt(matchedSupp.id.replace(/\D/g, ''), 10) || 1 : 1;
          const isBank = paymentMode === 'By Bank' || paymentMode === 'Bank';
          const voucherNo = transactionNo || `PYMT-${Date.now()}`;
          const todayDate = new Date().toISOString().split('T')[0];

          try {
            await Promise.all([
              api.recordSupplierPayment({
                supplier_id: suppId,
                voucher_no: voucherNo,
                date: todayDate,
                amount: Number(amount),
                payment_mode: paymentMode || 'By Cash',
                details: `Payment to supplier ${matchedSupp?.name || supplierCode}`
              }),
              ...(isBank ? [
                api.createBankStatement({
                  entry_date: todayDate,
                  account_no: bankAccounts[0]?.accountNo || '50200012345678',
                  receipt_no: voucherNo,
                  description: `Supplier Payout: ${matchedSupp?.name || supplierCode}`,
                  debit: amount,
                  credit: 0,
                  balance: 0
                })
              ] : []),
              api.createExpenseVoucher({
                voucher_no: voucherNo,
                date: todayDate,
                name: matchedSupp?.name || 'Supplier Payment',
                details: `Settlement payment to supplier ${matchedSupp?.name || supplierCode}`,
                payment_mode: isBank ? 'Bank' : 'Cash',
                grand_total: Number(amount)
              })
            ]);
          } catch (err) {
            console.warn('Backend supplier payment sync error:', err);
            throw err;
          }

          setSupplierOutstanding(prev =>
            prev.map(s => {
              if (s.code === supplierCode) {
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

          if (isBank) {
            setBankAccounts(prev => prev.map((b, idx) => idx === 0 ? { ...b, balance: Number((b.balance - amount).toFixed(2)) } : b));
            const newStmt: BankStatementEntry = {
              id: `bs-sup-${Date.now()}`,
              date: new Date().toLocaleDateString('en-GB'),
              accountNo: bankAccounts[0]?.accountNo || '50200012345678',
              receiptNo: voucherNo,
              description: `Supplier Payout: ${matchedSupp?.name || supplierCode}`,
              debit: amount,
              credit: 0
            };
            setBankStatements(prev => [...prev, newStmt]);
          }

          const newExp: ExpenseVoucher = {
            id: `exp-sup-${Date.now()}`,
            voucherNo: voucherNo,
            date: new Date().toLocaleDateString('en-GB'),
            name: matchedSupp?.name || 'Supplier Payment',
            details: `Settlement payment to supplier ${matchedSupp?.name || supplierCode}`,
            paymentMode: isBank ? 'Bank' : 'Cash',
            grandTotal: Number(amount),
            items: [{
              id: `exp-item-${Date.now()}`,
              particulars: `Supplier Settlement: ${matchedSupp?.name || supplierCode}`,
              amount: Number(amount),
              notes: ''
            }]
          };
          setExpenseVouchers(prev => [newExp, ...prev]);
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
        onDeleteProduct={handleDeleteProduct}
        onClose={() => setShowProductRecordsModal(false)}
      />

      {/* 30. VIDEO 07: PRODUCT BULK EDITOR WITH GODOWN, RACK & PART NO (FRAMES 0520, 0540) */}
      <FullProductBulkEditorModal
        isOpen={showFullProductBulkEditorModal}
        products={productRecords}
        onSaveBulkProducts={updatedList => {
          setProductRecords(updatedList);
          // Sync Rack & Godown back to main products and persist to Railway PostgreSQL
          const syncedProducts = products.map(p => {
            const match = updatedList.find(u => u.code === p.pCode || u.name === p.name);
            return match ? { ...p, godown: match.godown, rack: match.rack } : p;
          });
          setProducts(syncedProducts);
          handleBulkUpdateProducts(syncedProducts);
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
        onDeletePurchase={handleDeletePurchase}
        onClose={() => setShowPurchaseDashboardModal(false)}
      />

      {/* 32. VIDEO 05: ACCOUNT HEAD MASTER ENTRY (FRAMES 0475, 0650) */}
      <AccountHeadModal
        isOpen={showAccountHeadModal}
        onClose={() => setShowAccountHeadModal(false)}
        accountHeads={accountHeads}
        onSaveAccountHead={async head => {
          await api.createAccountHead({
            name: head.accountHead,
            under_group: head.underGroup,
            active: true
          });
          setAccountHeads(prev => [...prev, head]);
        }}
        onUpdateAccountHead={async updated => {
          await api.createAccountHead({
            name: updated.accountHead,
            under_group: updated.underGroup,
            active: true
          });
          setAccountHeads(prev => prev.map(h => h.id === updated.id ? updated : h));
        }}
        onDeleteAccountHead={async id => {
          const numId = parseInt(id.replace(/\D/g, ''), 10);
          if (!isNaN(numId)) {
            await api.deleteAccountHead(numId);
          }
          setAccountHeads(prev => prev.filter(h => h.id !== id));
        }}
      />

      {/* 33. VIDEO 05: EXPENSE VOUCHER ENTRY (FRAMES 0125, 0145, 0230) */}
      <ExpenseVoucherModal
        isOpen={showExpenseVoucherModal}
        onClose={() => setShowExpenseVoucherModal(false)}
        accountHeads={accountHeads}
        expenseVouchers={expenseVouchers}
        onSaveExpenseVoucher={handleSaveExpenseVoucher}
        onDeleteExpenseVoucher={handleDeleteExpenseVoucher}
      />

      {/* 34. VIDEO 05: INCOME VOUCHER ENTRY (FRAME 0535) */}
      <IncomeVoucherModal
        isOpen={showIncomeVoucherModal}
        onClose={() => setShowIncomeVoucherModal(false)}
        accountHeads={accountHeads}
        incomeVouchers={incomeVouchers}
        onSaveIncomeVoucher={handleSaveIncomeVoucher}
        onDeleteIncomeVoucher={handleDeleteIncomeVoucher}
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
        onDeleteExpenseVoucher={handleDeleteExpenseVoucher}
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
        onDeleteIncomeVoucher={handleDeleteIncomeVoucher}
      />

      {/* 37. RETIRED: Legacy BankStatementModal consolidated into Unified Banking Hub (ShowroomBankingHubModal) */}

      {/* STEP 5: CUSTOMER CREDIT AGING & WHATSAPP REMINDERS MODAL */}
      <CustomerCreditAgingModal
        isOpen={showCustomerCreditAgingModal}
        onClose={() => setShowCustomerCreditAgingModal(false)}
        onOpenCustomerLedger={() => {
          setShowCustomerCreditAgingModal(false);
          setActiveWorkspace('CUSTOMER_LEDGER');
        }}
      />

      {/* GODREJ STOCK HEDGING & INTELLIGENT REORDER ENGINE */}
      <StockHedgingModal
        isOpen={showStockHedgingModal}
        onClose={() => setShowStockHedgingModal(false)}
        showToast={(msg, type) => window.dispatchEvent(new CustomEvent('svf-toast', { detail: { message: msg, type } }))}
      />

      {/* GODREJ DISPATCH, ASSEMBLY & CSAT PIPELINE */}
      <DeliveryPipelineModal
        isOpen={showDeliveryPipelineModal}
        onClose={() => setShowDeliveryPipelineModal(false)}
        showToast={(msg, type) => window.dispatchEvent(new CustomEvent('svf-toast', { detail: { message: msg, type } }))}
        onOpenAssemblyScanner={() => setShowAssemblyScannerModal(true)}
        onOrdersChanged={() => {
          api.getProducts().then(fresh => {
            if (fresh && fresh.length > 0) {
              setProducts(fresh.map(mapBackendProductToFrontend));
            }
          }).catch(console.warn);
        }}
      />

      {/* KNOCKDOWN ASSEMBLY BARCODE SCANNER MODAL */}
      <FurnitureAssemblyScannerModal
        isOpen={showAssemblyScannerModal}
        onClose={() => setShowAssemblyScannerModal(false)}
        products={products}
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
        bills={oldBills}
        onProcessReturn={handleProcessSalesReturn}
      />

      {/* 40. VIDEO 04: PURCHASE RETURN (DEBIT NOTE) MODAL (FRAMES 0215, 0225) */}
      <PurchaseReturnModal
        isOpen={showPurchaseReturnModal}
        onClose={() => {
          setShowPurchaseReturnModal(false);
          setInitialPurchaseInvoiceForReturn(null);
        }}
        products={products}
        purchaseRecords={purchaseRecords}
        onProcessPurchaseReturn={handleProcessPurchaseReturn}
        initialInvoice={initialPurchaseInvoiceForReturn}
      />

      {/* 41. VIDEO 03: SALES RETURN DASHBOARD (FRAMES 0045, 0155, 0185, 0410) */}
      <SalesReturnDashboardModal
        isOpen={showSalesReturnDashboardModal}
        onClose={() => setShowSalesReturnDashboardModal(false)}
        records={salesReturnDashboardRecords}
        onRefresh={() => {
          api.getSalesInvoices(0, 50).then(() => {
            setToasts(prev => [...prev, { id: String(Date.now()), message: '✓ Sales returns ledger synced with PostgreSQL', type: 'success' }]);
          }).catch((err: any) => {
            setToasts(prev => [...prev, { id: String(Date.now()), message: `Refresh error: ${err.message}`, type: 'error' }]);
          });
        }}
        onDeleteSaleReturn={async (srNo: string) => {
          await api.deleteSaleReturn(srNo);
          setSalesReturnDashboardRecords(prev => prev.filter(r => r.srNo !== srNo));
          const fresh = await api.getProducts();
          if (Array.isArray(fresh) && fresh.length > 0) setProducts(fresh.map(mapBackendProductToFrontend));
        }}
      />

      {/* 42. VIDEO 03: PURCHASE RETURN DASHBOARD (FRAMES 0445, 0450) */}
      <PurchaseReturnDashboardModal
        isOpen={showPurchaseReturnDashboardModal}
        onClose={() => setShowPurchaseReturnDashboardModal(false)}
        records={purchaseReturnDashboardRecords}
        onRefresh={() => {
          api.getPurchases(0, 50).then(() => {
            setToasts(prev => [...prev, { id: String(Date.now()), message: '✓ Purchase returns ledger synced with PostgreSQL', type: 'success' }]);
          }).catch((err: any) => {
            setToasts(prev => [...prev, { id: String(Date.now()), message: `Refresh error: ${err.message}`, type: 'error' }]);
          });
        }}
        onDeletePurchaseReturn={async (prNo) => {
          await api.deletePurchaseReturn(prNo);
          setPurchaseReturnDashboardRecords(prev => prev.filter(r => r.prNo !== prNo));
          const fresh = await api.getProducts();
          if (Array.isArray(fresh) && fresh.length > 0) setProducts(fresh.map(mapBackendProductToFrontend));
        }}
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
            reason: 'Damage',
            approvedBy: 'Admin'
          };
          setAdjustments(prev => [adj, ...prev]);
          setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, openingStock: Math.max(0, p.openingStock - qty) } : p));
          const numId = parseInt(prod.id.replace(/\D/g, ''), 10) || 1;
          api.createStockAdjustment({
            adjustment_code: `SA-EXP-${Date.now().toString().slice(-6)}`,
            date: new Date().toISOString().split('T')[0],
            product_id: numId,
            product_code: prod.pCode || 'P-001',
            product_name: prod.name,
            barcode: prod.barcode,
            adjustment_type: 'Minus',
            qty: Number(qty),
            reason: 'Damaged / Expiry write-off'
          }).catch(e => console.warn('Backend stock adjustment for write-off queued:', e));
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
        onSaveStockEntry={handleSaveStockEntry}
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
        onDeleteStockEntry={handleDeleteStockEntry}
      />

      {/* 46. VIDEO 01: STOCK ADJUSTMENT ENTRY MODAL (FRAME 0330) */}
      <StockAdjustmentEntryModal
        isOpen={showStockAdjustmentModal}
        onClose={() => setShowStockAdjustmentModal(false)}
        products={products}
        initialRecord={activeStockAdjustmentRecord}
        onApplyAdjustment={handleApplyAdjustment}
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
        onDeleteStockAdjustment={handleDeleteStockAdjustment}
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
        onConvertToDebitNote={(inv) => {
          setInitialPurchaseInvoiceForReturn(inv);
          setShowPurchaseRecordModal(false);
          setShowPurchaseReturnModal(true);
        }}
        onDeletePurchase={handleDeletePurchase}
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
        onQuickPayBill={handleRecordSaleInvoice}
        onCompleteBill={handleRecordSaleInvoice}
        onAddProduct={handleAddProduct}
        onAddCategory={handleAddCategory}
        onUpdateProductPhoto={handleUpdateProductPhoto}
      />

      {/* 51. VIDEO 12: SMS GATEWAY SETTINGS MODAL */}
      <SmsSettingModal
        isOpen={showSmsSettingModal}
        onClose={() => setShowSmsSettingModal(false)}
        config={smsConfig}
        onSaveConfig={handleSaveSmsConfig}
        onSave={handleSaveSmsConfig}
      />

      {/* 52. VIDEO 12: EMAIL CONFIGURATION MODAL */}
      <EmailSettingModal
        isOpen={showEmailSettingModal}
        onClose={() => setShowEmailSettingModal(false)}
        config={emailConfig}
        onSaveConfig={handleSaveEmailConfig}
        onSave={handleSaveEmailConfig}
      />

      {/* 53. FURNITURE TOOL 1: PRODUCT IMAGE UPLOAD & ONLINE SEARCH */}
      <ProductImageUploadModal
        isOpen={showProductImageUploadModal}
        onClose={() => setShowProductImageUploadModal(false)}
        products={products}
        onUpdateProductPhoto={handleUpdateProductPhoto}
      />

      {/* 54. FURNITURE TOOL 2: SHOWROOM PRODUCT CATALOGUE & BROCHURE GENERATOR */}
      <ProductCatalogueModal
        isOpen={showProductCatalogueModal}
        onClose={() => setShowProductCatalogueModal(false)}
        products={products}
        companyInfo={companyInfo}
      />

      {/* 55. FURNITURE TOOL 3: WHATSAPP BULK MARKETING & CATALOGUE BROADCASTER */}
      <WhatsAppBulkSenderModal
        isOpen={showWhatsAppBulkSenderModal}
        onClose={() => setShowWhatsAppBulkSenderModal(false)}
        customers={customers}
        companyInfo={companyInfo}
      />

      {/* 56. CUSTOMER LEDGER STATEMENT POPUP (MULTI-SEARCH & PDF/WHATSAPP) */}
      <CustomerLedgerModal
        isOpen={showStandaloneCustomerLedger}
        onClose={() => setShowStandaloneCustomerLedger(false)}
        customers={customers}
        ledgerEntries={customerLedger}
        onSelectCustomer={handleUpdateCustomer}
        onUpdateCustomer={handleUpdateCustomer}
        onRecordPayment={handleRecordReceipt}
      />

      {/* 57. CRM LEADS FOLLOWUP & POST-DELIVERY REVIEWS HUB */}
      <CrmLeadsFollowupModal
        isOpen={showCrmLeadsModal}
        onClose={() => setShowCrmLeadsModal(false)}
        leads={crmLeads}
        onUpdateLeads={handleUpdateLeads}
        reviews={deliveryReviews}
        onUpdateReviews={handleUpdateDeliveryReviews}
        salesmen={salesmen}
        customers={customers}
        initialTab={crmLeadsInitialTab}
        onAddCustomer={handleAddCustomer}
        onConvertToQuotation={(lead) => {
          setShowCrmLeadsModal(false);
          const existingCust = customers.find(c => c.phone.replace(/\D/g, '') === lead.phone.replace(/\D/g, ''));
          if (!existingCust) {
            handleAddCustomer({
              id: `cust-${Date.now()}`,
              name: lead.customerName,
              phone: lead.phone,
              email: lead.email,
              city: lead.city,
              state: 'Kerala',
              balance: 0,
              loyaltyPoints: 0,
              creditLimit: lead.estimatedBudget || 50000
            });
          }
          setActiveLeadForPOS(lead);
          setActiveWorkspace('QUOTATION');
        }}
        onConvertToSale={(lead) => {
          setShowCrmLeadsModal(false);
          const existingCust = customers.find(c => c.phone.replace(/\D/g, '') === lead.phone.replace(/\D/g, ''));
          if (!existingCust) {
            handleAddCustomer({
              id: `cust-${Date.now()}`,
              name: lead.customerName,
              phone: lead.phone,
              email: lead.email,
              city: lead.city,
              state: 'Kerala',
              balance: 0,
              loyaltyPoints: 0,
              creditLimit: lead.estimatedBudget || 50000
            });
          }
          setActiveLeadForPOS(lead);
          setActiveWorkspace('SALE_POS');
        }}
      />

      {/* 58. FINANCIAL STATEMENTS & DOUBLE-ENTRY LEDGERS MODAL */}
      <FinancialStatementsModal
        isOpen={showFinancialStatementsModal}
        onClose={() => setShowFinancialStatementsModal(false)}
        showToast={(msg, type) => window.dispatchEvent(new CustomEvent('svf-toast', { detail: { message: msg, type } }))}
        customers={customers}
        suppliers={supplierOutstanding}
        bankAccounts={bankAccounts}
      />

      {/* 59. WORKSHOP & MADE-TO-ORDER PRODUCTION JOB CARDS */}
      <WorkshopJobCardModal
        isOpen={showWorkshopJobCardModal}
        onClose={() => setShowWorkshopJobCardModal(false)}
        showToast={(msg, type) => window.dispatchEvent(new CustomEvent('svf-toast', { detail: { message: msg, type } }))}
        customers={customers}
        products={products}
      />

      {/* 60. DAY-END CLOSING & CASH SETTLEMENT AUDIT MODAL */}
      <DayEndClosingModal
        isOpen={showDayEndClosingModal}
        onClose={() => setShowDayEndClosingModal(false)}
        showToast={(msg, type) => window.dispatchEvent(new CustomEvent('svf-toast', { detail: { message: msg, type } }))}
      />

      {/* 61. RETSOL R220 PRINTER & BRONTIX SCANNER HARDWARE HUB */}
      <BarcodeHardwareHubModal
        isOpen={showHardwareHubModal}
        onClose={() => setShowHardwareHubModal(false)}
        products={products}
        initialProduct={hardwareHubProduct}
        onOpenPosWithProduct={(prod) => {
          setSelectedBarcodeProduct(prod);
          setActiveWorkspace('SALE_POS');
          setShowHardwareHubModal(false);
        }}
        onOpenBarcodeDesigner={(prod) => {
          if (prod) setSelectedBarcodeProduct(prod);
          setActiveWorkspace('BARCODE_DESIGNER');
          setShowHardwareHubModal(false);
        }}
      />

      {/* 62. INSTANT SCANNED PRODUCT ACTION MODAL */}
      <ScannedProductActionModal
        isOpen={showScannedActionModal}
        product={scannedActionProduct}
        onClose={() => setShowScannedActionModal(false)}
        onOpenPosWithProduct={(prod) => {
          setSelectedBarcodeProduct(prod);
          setActiveWorkspace('SALE_POS');
          setShowScannedActionModal(false);
        }}
        onOpenHardwareHub={(prod) => {
          setHardwareHubProduct(prod);
          setShowHardwareHubModal(true);
        }}
      />

      {/* 63. DYNAMIC QR CODE DISPLAY HARDWARE CONTROLLER (EVENTUM / P2M SOUNDBOX STAND) */}
      <DynamicQrDisplayModal
        isOpen={showDynamicQrModal}
        onClose={() => setShowDynamicQrModal(false)}
      />

      {/* 64. STORE EXIT & OUTWARD GATE PASS VERIFICATION BARCODE SCANNER */}
      <OutwardExitScannerModal
        isOpen={showOutwardExitModal}
        onClose={() => setShowOutwardExitModal(false)}
        bills={oldBills}
        products={products}
        companyInfo={companyInfo}
      />
      </Suspense>

      {/* GLOBAL TOAST NOTIFICATION CONTAINER (VANILLA CSS FIXED TOP-RIGHT) */}
      <div
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxWidth: '420px',
          width: 'calc(100vw - 32px)',
          pointerEvents: 'none'
        }}
      >
        {toasts.map(t => (
          <div
            key={t.id}
            role="alert"
            style={{
              pointerEvents: 'auto',
              padding: '10px 14px',
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
              border: t.type === 'error' ? '1px solid #f43f5e' : (t.type === 'success' ? '1px solid #10b981' : '1px solid #38bdf8'),
              backgroundColor: t.type === 'error' ? '#881337' : (t.type === 'success' ? '#064e3b' : '#0f172a'),
              color: '#ffffff',
              fontSize: '12.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            <span style={{ fontSize: '16px', lineHeight: 1, userSelect: 'none', marginTop: '1px' }}>
              {t.type === 'error' ? '❌' : t.type === 'success' ? '✅' : 'ℹ️'}
            </span>
            <div style={{ flex: 1, lineHeight: 1.4, wordBreak: 'break-word' }}>
              {t.message}
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
                padding: '0 4px',
                lineHeight: 1
              }}
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
