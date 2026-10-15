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
  QuotationRecord
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
  INITIAL_QUOTATIONS
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

  const [showTerminalSetting, setShowTerminalSetting] = useState<boolean>(false);

  // 2. Active Desktop Workspace
  const [activeWorkspace, setActiveWorkspace] = useState<ActiveWorkspace>('PRODUCT_ADD_SMART');
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState<Product | undefined>(undefined);

  // Sync to localStorage
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

  // Video 18 Feature 1: Handle Record Sale Invoice with Credit Ledger Update
  const handleRecordSaleInvoice = (completedBill: any) => {
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
          />
        )}

        {activeWorkspace === 'PURCHASE_INWARD' && (
          <PurchaseInwardView
            products={products}
            onAddStockInward={handleAddStockInward}
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
      />
    </div>
  );
}
