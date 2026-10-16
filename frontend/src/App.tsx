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
  ProductQuantityDiscountRule
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
  INITIAL_QUANTITY_DISCOUNT_RULES
} from './data/retailDaddyData';

import { DesktopHeader } from './components/desktop/DesktopHeader';
import { DesktopStatusBar } from './components/desktop/DesktopStatusBar';
import { DesktopHomeView } from './components/desktop/DesktopHomeView';
import { ProductAddSmartView } from './components/products/ProductAddSmartView';
import { SalePosView } from './components/pos/SalePosView';
import { BarcodeDesignerView } from './components/barcode/BarcodeDesignerView';
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

export default function App() {
  // 1. Persistent Master State
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('rd_products');
    if (!saved) return INITIAL_PRODUCTS;
    try {
      const parsed: Product[] = JSON.parse(saved);
      const missing = INITIAL_PRODUCTS.filter(ip => !parsed.some(p => p.id === ip.id || p.barcode === ip.barcode));
      return missing.length > 0 ? [...parsed, ...missing] : parsed;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    const saved = localStorage.getItem('rd_company_info');
    return saved ? JSON.parse(saved) : DEFAULT_COMPANY_INFO;
  });

  const [dSaleBills, setDSaleBills] = useState<DSaleBill[]>(() => {
    const saved = localStorage.getItem('rd_d_sale_bills');
    return saved ? JSON.parse(saved) : INITIAL_D_SALE_BILLS;
  });

  const [billConfig, setBillConfig] = useState<BillTemplateConfig>(() => {
    const saved = localStorage.getItem('rd_bill_config');
    return saved ? JSON.parse(saved) : DEFAULT_BILL_CONFIG;
  });

  const [showCompanyMaster, setShowCompanyMaster] = useState<boolean>(false);

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('rd_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [subCategories, setSubCategories] = useState<SubCategory[]>(() => {
    const saved = localStorage.getItem('rd_subcategories');
    return saved ? JSON.parse(saved) : INITIAL_SUBCATEGORIES;
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

  // 2. Active Desktop Workspace
  const [activeWorkspace, setActiveWorkspace] = useState<ActiveWorkspace>('PRODUCT_ADD_SMART');
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState<Product | undefined>(undefined);

  // Sync to localStorage
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
    } else if (comp.id === 'comp-1' || comp.name === 'OLIVE SHOP') {
      const savedOlive = localStorage.getItem('rd_products');
      setProducts(savedOlive ? JSON.parse(savedOlive) : INITIAL_PRODUCTS);
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
  };

  const handleUpdateCustomer = (updatedCust: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCust.id ? updatedCust : c));
  };

  // Product Add / Update Callbacks
  const handleAddProduct = (newProd: Product) => {
    setProducts(prev => [newProd, ...prev]);
  };

  const handleUpdateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
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
        onLogout={() => setShowLogoutConfirm(true)}
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
          />
        )}

        {activeWorkspace === 'STOCK_IN_HAND' && (
          <StockInHandView products={products} />
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
          />
        )}

        {activeWorkspace === 'EXPIRY_REPORT' && (
          <ExpiryProductReportView products={products} />
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
    </div>
  );
}
