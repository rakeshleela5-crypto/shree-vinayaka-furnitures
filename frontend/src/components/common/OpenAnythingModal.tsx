import React, { useState, useEffect, useRef } from 'react';
import type { Product, Customer } from '../../types/retailDaddy';
import type { OldBillRecord } from '../pos/OldBillManagerModal';

export interface ActionItem {
  id: string;
  category: 'ACTION' | 'BILL' | 'PRODUCT' | 'CUSTOMER' | 'REPORT';
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  shortcut?: string;
  onExecute: () => void;
}

interface OpenAnythingModalProps {
  isOpen: boolean;
  onClose: () => void;
  products?: Product[];
  customers?: Customer[];
  bills?: OldBillRecord[];
  // Action triggers
  onOpenSalePos?: () => void;
  onOpenOldBills?: () => void;
  onOpenSaleReturn?: () => void;
  onOpenPurchaseReturn?: () => void;
  onOpenExpenseVoucher?: () => void;
  onOpenReceiptEntry?: () => void;
  onOpenCustomerLedger?: () => void;
  onOpenStockInHand?: () => void;
  onOpenDayEndClosing?: () => void;
  onOpenTaxReport?: () => void;
  onOpenFinancialStatements?: () => void;
  onOpenBankingMaster?: () => void;
  onOpenCompanyMaster?: () => void;
  onOpenDeliveryPipeline?: () => void;
  onOpenCustomerOutstanding?: () => void;
  onSelectBillToPos?: (bill: OldBillRecord) => void;
  onSelectCustomerToLedger?: (customer: Customer) => void;
}

export const OpenAnythingModal: React.FC<OpenAnythingModalProps> = ({
  isOpen,
  onClose,
  products = [],
  customers = [],
  bills = [],
  onOpenSalePos,
  onOpenOldBills,
  onOpenSaleReturn,
  onOpenPurchaseReturn,
  onOpenExpenseVoucher,
  onOpenReceiptEntry,
  onOpenCustomerLedger,
  onOpenStockInHand,
  onOpenDayEndClosing,
  onOpenTaxReport,
  onOpenFinancialStatements,
  onOpenBankingMaster,
  onOpenCompanyMaster,
  onOpenDeliveryPipeline,
  onOpenCustomerOutstanding,
  onSelectBillToPos,
  onSelectCustomerToLedger
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'ACTION' | 'BILL' | 'PRODUCT' | 'CUSTOMER' | 'REPORT'>('ALL');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard shortcut listener inside modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].onExecute();
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex]);

  // Construct Action Registry
  const coreActions: ActionItem[] = [
    {
      id: 'act-pos',
      category: 'ACTION',
      title: 'POS Retail & Wholesale Billing Counter',
      subtitle: 'Create Sales Invoices, Estimates, Quotations & Barcode Scans',
      badge: 'F1 Billing',
      badgeColor: '#1d4ed8',
      shortcut: 'F1',
      onExecute: () => onOpenSalePos?.()
    },
    {
      id: 'act-old-bills',
      category: 'ACTION',
      title: 'Old Bill Manager & Invoice Register',
      subtitle: 'Search, Reprint, Edit, or Convert Invoices to Returns',
      badge: 'F4 Invoices',
      badgeColor: '#0369a1',
      shortcut: 'F4',
      onExecute: () => onOpenOldBills?.()
    },
    {
      id: 'act-sale-return',
      category: 'ACTION',
      title: 'Sale Return / Credit Note (Voucher)',
      subtitle: 'Accept customer returns, restock inventory, and issue Credit Notes',
      badge: 'Credit Note',
      badgeColor: '#c2410c',
      shortcut: 'Alt+R',
      onExecute: () => onOpenSaleReturn?.()
    },
    {
      id: 'act-purchase-return',
      category: 'ACTION',
      title: 'Purchase Return / Debit Note (Voucher)',
      subtitle: 'Return damaged or surplus items to vendor, deduct stock, and adjust supplier payables',
      badge: 'Debit Note',
      badgeColor: '#b45309',
      shortcut: 'Alt+D',
      onExecute: () => onOpenPurchaseReturn?.()
    },
    {
      id: 'act-expense',
      category: 'ACTION',
      title: 'Expense Voucher & Categorization',
      subtitle: 'Record Direct / Indirect expenses: Shop Rent, Salary, Tea, Petrol, Freight',
      badge: 'F7 Expense',
      badgeColor: '#b91c1c',
      shortcut: 'F7',
      onExecute: () => onOpenExpenseVoucher?.()
    },
    {
      id: 'act-receipt',
      category: 'ACTION',
      title: 'Payment-In (Customer Receipt Entry)',
      subtitle: 'Collect payment from Debtors/Customers in Cash or Bank Account',
      badge: 'Payment-In',
      badgeColor: '#15803d',
      shortcut: 'Alt+I',
      onExecute: () => onOpenReceiptEntry?.()
    },
    {
      id: 'act-day-book',
      category: 'REPORT',
      title: 'Day Book & Daily Cash Closing Settlement',
      subtitle: 'Opening float, Cash In, Cash Out, Running Cash Balance & Z-Report',
      badge: 'Day Book',
      badgeColor: '#4f46e5',
      shortcut: 'F10',
      onExecute: () => onOpenDayEndClosing?.()
    },
    {
      id: 'act-financials',
      category: 'REPORT',
      title: 'Financial Statements: Profit & Loss and Balance Sheet',
      subtitle: 'Gross Profit, Net Income, Assets, Liabilities, and Equity summary',
      badge: 'P&L / Balance Sheet',
      badgeColor: '#059669',
      shortcut: 'Ctrl+P',
      onExecute: () => onOpenFinancialStatements?.()
    },
    {
      id: 'act-tax',
      category: 'REPORT',
      title: 'GST Tax Reports (GSTR-1, GSTR-2, GSTR-3B, Table 12 HSN)',
      subtitle: 'B2B/B2C Outward Supplies, SAC Services, and monthly tax liability',
      badge: 'GST Reports',
      badgeColor: '#0284c7',
      shortcut: 'Alt+G',
      onExecute: () => onOpenTaxReport?.()
    },
    {
      id: 'act-stock-in-hand',
      category: 'PRODUCT',
      title: 'Stock In Hand, Valuation & Item Catalog',
      subtitle: 'Physical vs hedged stock, wholesale pricing tiers, HSN & SAC codes',
      badge: 'Stock Master',
      badgeColor: '#7c3aed',
      shortcut: 'F8',
      onExecute: () => onOpenStockInHand?.()
    },
    {
      id: 'act-cust-ledger',
      category: 'CUSTOMER',
      title: 'Customer Khata Ledger & Party Statement',
      subtitle: 'Track debit, credit, opening balance, and WhatsApp payment reminders',
      badge: 'Ledger',
      badgeColor: '#d97706',
      shortcut: 'Alt+L',
      onExecute: () => onOpenCustomerLedger?.()
    },
    {
      id: 'act-cust-outstanding',
      category: 'CUSTOMER',
      title: 'Customer Outstanding Receivables & Aging',
      subtitle: 'Sundry Debtors credit aging, overdue alerts, and collection pipeline',
      badge: 'Receivables',
      badgeColor: '#ea580c',
      onExecute: () => onOpenCustomerOutstanding?.()
    },
    {
      id: 'act-delivery',
      category: 'ACTION',
      title: 'Showroom Delivery Pipeline & Dispatch',
      subtitle: 'Manage pending furniture deliveries, tempo assignments, and driver receipts',
      badge: 'Logistics',
      badgeColor: '#0891b2',
      onExecute: () => onOpenDeliveryPipeline?.()
    },
    {
      id: 'act-banking',
      category: 'ACTION',
      title: 'Banking Master & Automated Statement Reconciliation',
      subtitle: 'Manage HDFC/SBI bank ledgers and match bank transactions with vouchers',
      badge: 'Bank Sync',
      badgeColor: '#4338ca',
      onExecute: () => onOpenBankingMaster?.()
    },
    {
      id: 'act-company',
      category: 'ACTION',
      title: 'Company Profile, GSTIN & Authorized Signatory Settings',
      subtitle: 'Upload signature image, configure invoice header, bank details, and logo',
      badge: 'Company Master',
      badgeColor: '#475569',
      onExecute: () => onOpenCompanyMaster?.()
    }
  ];

  // Dynamic Bills Index
  const billActions: ActionItem[] = bills.slice(0, 15).map(b => ({
    id: `bill-${b.id || b.invoiceNo}`,
    category: 'BILL',
    title: `Invoice ${b.invoiceNo} — ${b.customerName}`,
    subtitle: `Date: ${b.date} | Amount: ₹${b.netPay.toFixed(2)} | Balance Due: ₹${(b.balanceDue || 0).toFixed(2)}`,
    badge: (b.balanceDue || 0) > 0 ? 'UNPAID' : 'PAID',
    badgeColor: (b.balanceDue || 0) > 0 ? '#dc2626' : '#16a34a',
    onExecute: () => {
      if (onSelectBillToPos) onSelectBillToPos(b);
      else onOpenOldBills?.();
    }
  }));

  // Dynamic Products Index
  const productActions: ActionItem[] = products.slice(0, 20).map(p => ({
    id: `prod-${p.id || p.barcode}`,
    category: 'PRODUCT',
    title: `${p.name} [${p.pCode || p.barcode}]`,
    subtitle: `Stock: ${p.physical_stock ?? p.openingStock ?? 0} ${p.salesUnit || 'Nos'} | MRP: ₹${p.mrp || p.retailPrice} | Retail: ₹${p.retailPrice || 0}${p.wholesalePrice ? ` | Wholesale: ₹${p.wholesalePrice}` : ''}`,
    badge: p.itemType === 'SERVICE' ? 'SERVICE' : 'FURNITURE',
    badgeColor: p.itemType === 'SERVICE' ? '#d97706' : '#2563eb',
    onExecute: () => onOpenStockInHand?.()
  }));

  // Dynamic Customers Index
  const customerActions: ActionItem[] = customers.slice(0, 15).map(c => ({
    id: `cust-${c.id}`,
    category: 'CUSTOMER',
    title: `${c.name} (${c.phone})`,
    subtitle: `City: ${c.city || 'Local'} | Balance: ₹${(c.balance || 0).toFixed(2)} | GSTIN: ${c.gstin || 'Unregistered'}`,
    badge: (c.balance || 0) > 0 ? 'DUE' : 'CLEAR',
    badgeColor: (c.balance || 0) > 0 ? '#ea580c' : '#059669',
    onExecute: () => {
      if (onSelectCustomerToLedger) onSelectCustomerToLedger(c);
      else onOpenCustomerLedger?.();
    }
  }));

  const allItems: ActionItem[] = [
    ...coreActions,
    ...billActions,
    ...productActions,
    ...customerActions
  ];

  const filteredItems = allItems.filter(item => {
    if (activeCategory !== 'ALL' && item.category !== activeCategory) {
      return false;
    }
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      (item.badge && item.badge.toLowerCase().includes(q)) ||
      (item.shortcut && item.shortcut.toLowerCase().includes(q))
    );
  });

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '60px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '720px',
          maxWidth: '94vw',
          maxHeight: '85vh',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'scaleIn 0.15s ease-out'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: '#f8fafc'
        }}>
          <span style={{ fontSize: '20px' }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Open Anything... Type bill #, customer name, product, expense, or report (↑↓ to select, Enter to open)"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              fontWeight: 600,
              color: '#0f172a',
              backgroundColor: 'transparent'
            }}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              style={{
                background: '#e2e8f0',
                border: 'none',
                borderRadius: '50%',
                width: '22px',
                height: '22px',
                fontSize: '11px',
                cursor: 'pointer',
                color: '#475569'
              }}
            >
              ✕
            </button>
          )}
          <div style={{
            fontSize: '11px',
            background: '#e2e8f0',
            color: '#475569',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontFamily: 'monospace'
          }}>
            ESC to Close
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '8px 20px',
          backgroundColor: '#f1f5f9',
          borderBottom: '1px solid #e2e8f0',
          overflowX: 'auto'
        }}>
          {[
            { id: 'ALL', label: '🌟 All' },
            { id: 'ACTION', label: '⚡ Quick Actions' },
            { id: 'BILL', label: '📄 Invoices & Bills' },
            { id: 'PRODUCT', label: '🪑 Furniture & Stock' },
            { id: 'CUSTOMER', label: '👥 Customers & Debtors' },
            { id: 'REPORT', label: '📊 Financial Reports' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveCategory(tab.id as any);
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: activeCategory === tab.id ? 'bold' : 'normal',
                backgroundColor: activeCategory === tab.id ? '#1e40af' : '#ffffff',
                color: activeCategory === tab.id ? '#ffffff' : '#475569',
                border: activeCategory === tab.id ? '1px solid #1e40af' : '1px solid #cbd5e1',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            maxHeight: '420px',
            padding: '8px 12px'
          }}
        >
          {filteredItems.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '13px'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
              No matching bills, products, customers, or reports found for "<strong>{query}</strong>".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.onExecute();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                    borderLeft: isSelected ? '4px solid #2563eb' : '4px solid transparent',
                    cursor: 'pointer',
                    marginBottom: '2px',
                    transition: 'all 0.1s ease'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 'bold',
                        color: isSelected ? '#1e40af' : '#0f172a'
                      }}>
                        {item.title}
                      </span>
                      {item.badge && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 'bold',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          color: '#ffffff',
                          backgroundColor: item.badgeColor || '#64748b'
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: isSelected ? '#1e3a8a' : '#64748b',
                      marginTop: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.subtitle}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.shortcut && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        color: '#64748b',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        padding: '1px 5px',
                        borderRadius: '3px'
                      }}>
                        {item.shortcut}
                      </span>
                    )}
                    <span style={{
                      fontSize: '14px',
                      color: isSelected ? '#2563eb' : '#94a3b8'
                    }}>
                      ↵
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div style={{
          padding: '8px 20px',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span><kbd style={{ background: '#e2e8f0', padding: '1px 4px', borderRadius: '3px' }}>↑</kbd> <kbd style={{ background: '#e2e8f0', padding: '1px 4px', borderRadius: '3px' }}>↓</kbd> Navigate</span>
            <span><kbd style={{ background: '#e2e8f0', padding: '1px 4px', borderRadius: '3px' }}>Enter</kbd> Open Item</span>
            <span><kbd style={{ background: '#e2e8f0', padding: '1px 4px', borderRadius: '3px' }}>Esc</kbd> Close</span>
          </div>
          <div>
            <strong>Shree Vinayaka Furnitures</strong> • Spotlight Universal Search
          </div>
        </div>
      </div>
    </div>
  );
};
