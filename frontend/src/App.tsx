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
  ActiveWorkspace
} from './types/retailDaddy';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_SUBCATEGORIES,
  INITIAL_CUSTOMERS,
  INITIAL_EXPENSES,
  INITIAL_STOCK_ADJUSTMENTS,
  DEFAULT_COLUMN_CONFIG
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

export default function App() {
  // 1. Persistent Master State
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('rd_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

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
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [expenses, setExpenses] = useState<PettyExpense[]>(() => {
    const saved = localStorage.getItem('rd_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(() => {
    const saved = localStorage.getItem('rd_adjustments');
    return saved ? JSON.parse(saved) : INITIAL_STOCK_ADJUSTMENTS;
  });

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
            onRecordSaleInvoice={() => {}}
          />
        )}

        {activeWorkspace === 'RUBIC_POS' && (
          <SalePosView
            products={products}
            customers={customers}
            isAdmin={isAdmin}
            onStockDeduct={handleStockDeduct}
            onRecordSaleInvoice={() => {}}
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
      </div>

      {/* 3. BOTTOM WINDOWS STATUS BAR */}
      <DesktopStatusBar
        isAdmin={isAdmin}
        onToggleAdmin={() => setIsAdmin(!isAdmin)}
      />
    </div>
  );
}
