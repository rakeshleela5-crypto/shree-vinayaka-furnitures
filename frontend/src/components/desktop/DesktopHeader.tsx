import { useState, useRef, useEffect } from 'react';
import type {
  ActiveWorkspace,
  SupportedLanguage,
  UserControlPermissions,
  UserRecord
} from '../../types/retailDaddy';
import { LANGUAGE_TRANSLATIONS } from '../../data/retailDaddyData';

interface DesktopHeaderProps {
  activeWorkspace: ActiveWorkspace;
  onSelectWorkspace: (ws: ActiveWorkspace) => void;
  isAdmin: boolean;
  onToggleAdmin: () => void;
  companyName: string;
  financialYear: string;
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  currentUser: UserRecord;
  userPermissions: UserControlPermissions;
  onOpenCompanyMaster?: () => void;
  onOpenBankingMaster?: () => void;
  onOpenPrefixSuffix?: () => void;
  onOpenOutstandingReport?: () => void;
  onOpenReceiptEntry?: () => void;
  onOpenProductBulkEditor?: () => void;
  onOpenSalePriceEditor?: () => void;
  onOpenSalesmanPayment?: () => void;
  onOpenSalesmanLedger?: () => void;
  onOpenTerminalSetting?: () => void;
  onOpenUserRegistration?: () => void;
  onOpenUserControl?: () => void;
  onOpenChangePassword?: () => void;
  onOpenCreateCompany?: () => void;
  onOpenVirtualKeyboard?: () => void;
  onOpenProductDiscountSetting?: () => void;
  onOpenAutoBackup?: () => void;
  onOpenDatabaseRestore?: () => void;
  onTriggerManualBackup?: () => void;
  onOpenCustomerRecords?: () => void;
  onOpenSupplierRecords?: () => void;
  onOpenCustomerOutstanding?: () => void;
  onOpenSupplierOutstanding?: () => void;
  onOpenProductRecords?: () => void;
  onOpenSupplierPaymentVoucher?: () => void;
  onOpenPurchaseDashboard?: () => void;
  onLogout?: () => void;
}

export function DesktopHeader({
  activeWorkspace,
  onSelectWorkspace,
  isAdmin,
  onToggleAdmin,
  companyName,
  financialYear,
  currentLanguage,
  onSelectLanguage,
  currentUser,
  userPermissions,
  onOpenCompanyMaster,
  onOpenBankingMaster,
  onOpenPrefixSuffix,
  onOpenOutstandingReport,
  onOpenReceiptEntry,
  onOpenProductBulkEditor,
  onOpenSalePriceEditor,
  onOpenSalesmanPayment,
  onOpenSalesmanLedger,
  onOpenTerminalSetting,
  onOpenUserRegistration,
  onOpenUserControl,
  onOpenChangePassword,
  onOpenCreateCompany,
  onOpenVirtualKeyboard,
  onOpenProductDiscountSetting,
  onOpenAutoBackup,
  onOpenDatabaseRestore,
  onTriggerManualBackup,
  onOpenCustomerRecords,
  onOpenSupplierRecords,
  onOpenCustomerOutstanding,
  onOpenSupplierOutstanding,
  onOpenProductRecords,
  onOpenSupplierPaymentVoucher,
  onOpenPurchaseDashboard,
  onLogout
}: DesktopHeaderProps) {
  const [isTransactionMenuOpen, setIsTransactionMenuOpen] = useState(false);
  const [isUsersMenuOpen, setIsUsersMenuOpen] = useState(false);
  const [isInventoryMenuOpen, setIsInventoryMenuOpen] = useState(false);
  const [isDatabaseMenuOpen, setIsDatabaseMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isRecordsMenuOpen, setIsRecordsMenuOpen] = useState(false);
  const [isOutstandingSubOpen, setIsOutstandingSubOpen] = useState(false);
  const [isBankingMenuOpen, setIsBankingMenuOpen] = useState(false);
  const [isPayrollMenuOpen, setIsPayrollMenuOpen] = useState(false);
  const [isUtilitiesMenuOpen, setIsUtilitiesMenuOpen] = useState(false);
  const [isReportsMenuOpen, setIsReportsMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const usersMenuRef = useRef<HTMLDivElement>(null);
  const inventoryMenuRef = useRef<HTMLDivElement>(null);
  const databaseMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const recordsMenuRef = useRef<HTMLDivElement>(null);
  const bankingMenuRef = useRef<HTMLDivElement>(null);
  const payrollMenuRef = useRef<HTMLDivElement>(null);
  const utilitiesMenuRef = useRef<HTMLDivElement>(null);
  const reportsMenuRef = useRef<HTMLDivElement>(null);

  const t = LANGUAGE_TRANSLATIONS[currentLanguage] || LANGUAGE_TRANSLATIONS.ENGLISH;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsTransactionMenuOpen(false);
      }
      if (usersMenuRef.current && !usersMenuRef.current.contains(e.target as Node)) {
        setIsUsersMenuOpen(false);
      }
      if (inventoryMenuRef.current && !inventoryMenuRef.current.contains(e.target as Node)) {
        setIsInventoryMenuOpen(false);
      }
      if (databaseMenuRef.current && !databaseMenuRef.current.contains(e.target as Node)) {
        setIsDatabaseMenuOpen(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(e.target as Node)) {
        setIsSettingsMenuOpen(false);
      }
      if (recordsMenuRef.current && !recordsMenuRef.current.contains(e.target as Node)) {
        setIsRecordsMenuOpen(false);
        setIsOutstandingSubOpen(false);
      }
      if (bankingMenuRef.current && !bankingMenuRef.current.contains(e.target as Node)) {
        setIsBankingMenuOpen(false);
      }
      if (payrollMenuRef.current && !payrollMenuRef.current.contains(e.target as Node)) {
        setIsPayrollMenuOpen(false);
      }
      if (utilitiesMenuRef.current && !utilitiesMenuRef.current.contains(e.target as Node)) {
        setIsUtilitiesMenuOpen(false);
      }
      if (reportsMenuRef.current && !reportsMenuRef.current.contains(e.target as Node)) {
        setIsReportsMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsTransactionMenuOpen(false);
        setIsUsersMenuOpen(false);
        setIsInventoryMenuOpen(false);
        setIsDatabaseMenuOpen(false);
        setIsSettingsMenuOpen(false);
        setIsRecordsMenuOpen(false);
        setIsOutstandingSubOpen(false);
        setIsBankingMenuOpen(false);
        setIsPayrollMenuOpen(false);
        setIsUtilitiesMenuOpen(false);
        setIsReportsMenuOpen(false);
      }
    };
    if (
      isTransactionMenuOpen ||
      isUsersMenuOpen ||
      isInventoryMenuOpen ||
      isDatabaseMenuOpen ||
      isSettingsMenuOpen ||
      isRecordsMenuOpen ||
      isBankingMenuOpen ||
      isPayrollMenuOpen ||
      isUtilitiesMenuOpen ||
      isReportsMenuOpen
    ) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isTransactionMenuOpen,
    isUsersMenuOpen,
    isInventoryMenuOpen,
    isDatabaseMenuOpen,
    isSettingsMenuOpen,
    isRecordsMenuOpen,
    isBankingMenuOpen,
    isPayrollMenuOpen,
    isUtilitiesMenuOpen,
    isReportsMenuOpen
  ]);

  return (
    <>
      {/* 1. TOP WINDOWS TITLEBAR (Video 11 Frame 0115) */}
      <div className="rd-titlebar">
        <div className="rd-titlebar-left">
          <div className="rd-titlebar-app-icon">RD</div>
          <span>
            POS | Raintech Software Limited | Rel 1.6 | Enterprise Edition | Multiuser Mode | Valid Upto : 18-02-2026 | {companyName.toUpperCase()} | FY : {financialYear} |
          </span>
        </div>

        {/* Right side of Titlebar: Language quick switcher + Window controls */}
        <div className="rd-titlebar-controls" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <select
            value={currentLanguage}
            onChange={e => onSelectLanguage(e.target.value as SupportedLanguage)}
            style={{
              padding: '2px 6px',
              fontSize: '11px',
              fontWeight: 'bold',
              backgroundColor: '#0369a1',
              color: '#ffffff',
              border: '1px solid #38bdf8',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
            title="Switch Software UI Language [Video 11 Frame 0215]"
          >
            <option value="ENGLISH">ENGLISH</option>
            <option value="Bangla">Bangla</option>
            <option value="Gujarati">Gujarati</option>
            <option value="Hindi">Hindi</option>
            <option value="Kannada">Kannada</option>
            <option value="Malayalam">Malayalam</option>
            <option value="Marathi">Marathi</option>
            <option value="Oriya">Oriya</option>
            <option value="Punjabi">Punjabi</option>
            <option value="Tamil">Tamil</option>
            <option value="Telugu">Telugu</option>
            <option value="Urdu">Urdu</option>
          </select>

          <button className="rd-titlebar-btn" title="Minimize">_</button>
          <button className="rd-titlebar-btn" title="Maximize">□</button>
          <button className="rd-titlebar-btn close" title="Close" onClick={() => onSelectWorkspace('DESKTOP_HOME')}>✕</button>
        </div>
      </div>

      {/* 2. TOP MDI MENU BAR (Video 11 Frame 0065 & 0115 Permission Aware & Localized) */}
      <div className="rd-menubar">
        {/* Master Entry */}
        <span
          className={`rd-menu-item ${activeWorkspace === 'PRODUCT_ADD_SMART' ? 'active' : ''}`}
          onClick={() => onSelectWorkspace('PRODUCT_ADD_SMART')}
        >
          {t.masterEntry}
        </span>

        {/* Transaction Dropdown (Video 16 Frame 0020) */}
        {userPermissions.saleEntry !== false && (
          <div style={{ position: 'relative', display: 'inline-block' }} ref={menuRef}>
            <span
              className={`rd-menu-item ${isTransactionMenuOpen || activeWorkspace === 'SALE_POS' ? 'active' : ''}`}
              onClick={() => setIsTransactionMenuOpen(!isTransactionMenuOpen)}
              style={{
                backgroundColor: isTransactionMenuOpen ? '#eab308' : undefined,
                color: isTransactionMenuOpen ? '#000000' : undefined,
                fontWeight: isTransactionMenuOpen ? 'bold' : undefined,
                cursor: 'pointer'
              }}
              title="Transaction Dropdown Menu"
            >
              {t.transaction} {isTransactionMenuOpen ? '▲' : '▼'}
            </span>

            {isTransactionMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '240px',
                  backgroundColor: '#000000',
                  border: '1px solid #3f3f46',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.75)',
                  zIndex: 99999,
                  padding: '4px 0',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {[
                  { label: 'Point of Sale', action: () => onSelectWorkspace('SALE_POS') },
                  { label: 'Estimate / Delivery Note', action: () => onSelectWorkspace('ESTIMATE_DELIVERY') },
                  { label: 'Sale Return (Cr.Note)', action: () => alert('Sale Return (Credit Note) - Select invoice to return goods.') },
                  { label: 'Quotation', action: () => onSelectWorkspace('QUOTATION') },
                  { label: 'Purchase Entry', action: () => onSelectWorkspace('PURCHASE_INWARD') },
                  { label: 'Purchase Return (Dr.Note)', action: () => alert('Purchase Return (Debit Note) - Adjust outward supplier returns.') },
                  { label: 'Purchase Order', action: () => alert('Purchase Order - Vendor procurement tracking.') },
                  { label: 'Receipt (From Customer)', action: () => onOpenReceiptEntry ? onOpenReceiptEntry() : alert('Receipt Entry') },
                  { label: 'Payment (To Supplier)', action: () => alert('Payment Entry - Record outward payment to supplier.') },
                  { label: 'Income Voucher', action: () => alert('Income Voucher - Direct non-operating cash/bank income.') },
                  { label: 'Expense Voucher', action: () => onSelectWorkspace('PETTY_EXPENSES') },
                  { label: 'Contra Voucher', action: () => alert('Contra Voucher - Cash deposit/withdrawal between bank and cash till.') },
                  { label: 'Journal Voucher', action: () => alert('Journal Voucher - Double-entry manual adjustment voucher.') }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setIsTransactionMenuOpen(false);
                      item.action();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '6px 12px',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      userSelect: 'none',
                      borderBottom: idx === 12 ? 'none' : '1px solid #18181b'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#27272a';
                      e.currentTarget.style.color = '#a3e635';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: '#22c55e',
                        color: '#000000',
                        fontSize: '10px',
                        fontWeight: '900',
                        flexShrink: 0
                      }}
                    >
                      ➔
                    </span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Video 10 Inventory Menu Dropdown (Frame 0063) */}
        {userPermissions.inventory !== false && (
          <div style={{ position: 'relative', display: 'inline-block' }} ref={inventoryMenuRef}>
            <span
              className={`rd-menu-item ${isInventoryMenuOpen ? 'active' : ''}`}
              onClick={() => setIsInventoryMenuOpen(!isInventoryMenuOpen)}
              style={{
                backgroundColor: isInventoryMenuOpen ? '#059669' : undefined,
                color: isInventoryMenuOpen ? '#ffffff' : '#059669',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              title="Inventory Menu - Product Discount Setting, Audit, Stock [Video 10]"
            >
              📦 {t.inventory || 'Inventory'} {isInventoryMenuOpen ? '▲' : '▼'}
            </span>

            {isInventoryMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '260px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #10b981',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.8)',
                  zIndex: 99999,
                  padding: '4px 0',
                  borderRadius: '4px'
                }}
              >
                {[
                  { label: '🏷️ Product Discount Setting (frmProductDiscount)', action: () => onOpenProductDiscountSetting && onOpenProductDiscountSetting() },
                  { label: `🔍 ${t.inventoryAudit}`, action: () => onSelectWorkspace('STOCK_AUDIT') },
                  { label: `📊 ${t.stockInHand}`, action: () => onSelectWorkspace('STOCK_IN_HAND') }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setIsInventoryMenuOpen(false);
                      item.action();
                    }}
                    style={{
                      padding: '8px 14px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      borderBottom: idx === 2 ? 'none' : '1px solid #1e293b'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#1e293b';
                      e.currentTarget.style.color = '#34d399';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#f8fafc';
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Banking Menu Dropdown */}
        {userPermissions.banking !== false && (
          <div style={{ position: 'relative', display: 'inline-block' }} ref={bankingMenuRef}>
            <span
              className={`rd-menu-item ${isBankingMenuOpen ? 'active' : ''}`}
              onClick={() => setIsBankingMenuOpen(!isBankingMenuOpen)}
              style={{
                backgroundColor: isBankingMenuOpen ? '#15803d' : undefined,
                color: isBankingMenuOpen ? '#ffffff' : '#15803d',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              title="Banking Master: List of Banks, Branch Entry, Bank Accounts Registration [Video 20 Frame 272]"
            >
              🏛️ {t.banking || 'Banking'} {isBankingMenuOpen ? '▲' : '▼'}
            </span>

            {isBankingMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '260px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #22c55e',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.85)',
                  zIndex: 99999,
                  padding: '4px 0',
                  borderRadius: '4px'
                }}
              >
                {[
                  { label: '🏛️ Bank Accounts Registration', action: () => onOpenBankingMaster && onOpenBankingMaster() },
                  { label: '🏢 Branch Entry', action: () => onOpenBankingMaster && onOpenBankingMaster() },
                  { label: '📋 List of Banks', action: () => onOpenBankingMaster && onOpenBankingMaster() }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setIsBankingMenuOpen(false);
                      item.action();
                    }}
                    style={{
                      padding: '8px 14px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderBottom: idx === 2 ? 'none' : '1px solid #1e293b'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#14532d';
                      e.currentTarget.style.color = '#86efac';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#f8fafc';
                    }}
                  >
                    <span style={{ color: '#22c55e', fontSize: '10px' }}>➔</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payroll Menu Dropdown */}
        {userPermissions.salesManEntry !== false && (
          <div style={{ position: 'relative', display: 'inline-block' }} ref={payrollMenuRef}>
            <span
              className={`rd-menu-item ${isPayrollMenuOpen ? 'active' : ''}`}
              onClick={() => setIsPayrollMenuOpen(!isPayrollMenuOpen)}
              style={{
                backgroundColor: isPayrollMenuOpen ? '#b45309' : undefined,
                color: isPayrollMenuOpen ? '#ffffff' : '#b45309',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              title="Payroll & Salesman Commission [Video 19]"
            >
              💼 Payroll {isPayrollMenuOpen ? '▲' : '▼'}
            </span>

            {isPayrollMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '270px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #f59e0b',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.85)',
                  zIndex: 99999,
                  padding: '4px 0',
                  borderRadius: '4px'
                }}
              >
                {[
                  { label: '💵 Salesman Commission Payout Voucher', action: () => onOpenSalesmanPayment && onOpenSalesmanPayment() },
                  { label: '📜 Salesman Commission Ledger Report', action: () => onOpenSalesmanLedger && onOpenSalesmanLedger() },
                  { label: '👤 Salesman Master Entry', action: () => onOpenSalesmanPayment && onOpenSalesmanPayment() }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setIsPayrollMenuOpen(false);
                      item.action();
                    }}
                    style={{
                      padding: '8px 14px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderBottom: idx === 2 ? 'none' : '1px solid #1e293b'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#78350f';
                      e.currentTarget.style.color = '#fde68a';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#f8fafc';
                    }}
                  >
                    <span style={{ color: '#22c55e', fontSize: '10px' }}>➔</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Video 06 & Video 07: Records Menu Dropdown (Frame 0018 & Frame 0085) */}
        {userPermissions.records !== false && (
          <div style={{ position: 'relative', display: 'inline-block' }} ref={recordsMenuRef}>
          <span
            className={`rd-menu-item ${isRecordsMenuOpen ? 'active' : ''}`}
            onClick={() => setIsRecordsMenuOpen(!isRecordsMenuOpen)}
            style={{
              backgroundColor: isRecordsMenuOpen ? '#0284c7' : undefined,
              color: isRecordsMenuOpen ? '#ffffff' : '#0369a1',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            title="Records Menu: Purchase Dashboard, Customers, Suppliers, Outstanding, Products [Video 06 Frame 0018]"
          >
            📋 Records {isRecordsMenuOpen ? '▲' : '▼'}
          </span>

          {isRecordsMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                width: '280px',
                backgroundColor: '#0f172a',
                border: '1px solid #38bdf8',
                boxShadow: '0 12px 28px rgba(0,0,0,0.85)',
                zIndex: 99999,
                padding: '4px 0',
                borderRadius: '4px',
                maxHeight: '85vh',
                overflowY: 'auto'
              }}
            >
              {[
                { label: '👥 Customer', action: () => onOpenCustomerRecords && onOpenCustomerRecords() },
                { label: '🏭 Suppliers', action: () => onOpenSupplierRecords && onOpenSupplierRecords() },
                {
                  label: '📈 Outstanding Analysis ➔',
                  hasSubmenu: true,
                  action: () => setIsOutstandingSubOpen(!isOutstandingSubOpen)
                },
                { label: '💼 Salesman', action: () => onOpenSalesmanPayment && onOpenSalesmanPayment() },
                { label: '📦 Products', action: () => onOpenProductRecords && onOpenProductRecords() },
                { label: '📊 Sales Dashboard', action: () => onSelectWorkspace('SALES_REGISTER_BILL_WISE') },
                {
                  label: '🛍️ Purchase Dashboard',
                  highlight: true,
                  action: () => onOpenPurchaseDashboard && onOpenPurchaseDashboard()
                },
                { label: '↩️ Sales Return Dashboard', action: () => onSelectWorkspace('SALE_POS') },
                { label: '↩️ Purchase Return Dashboard', action: () => onSelectWorkspace('PURCHASE_INWARD') },
                { label: '💸 Expenses Dashboard', action: () => onSelectWorkspace('PETTY_EXPENSES') },
                { label: '💰 Income Dashboard', action: () => onSelectWorkspace('PETTY_EXPENSES') },
                { label: '📦 Stock In Hand', action: () => onSelectWorkspace('STOCK_IN_HAND') },
                { label: '📅 Expiry Product (Item Aging)', action: () => onSelectWorkspace('EXPIRY_REPORT') },
                { label: '📥 Stock Entry', action: () => onSelectWorkspace('PRODUCT_ADD_SMART') },
                { label: '⚖️ Stock Adjustment', action: () => onSelectWorkspace('STOCK_AUDIT') },
                { label: '🛒 Purchase', action: () => onSelectWorkspace('PURCHASE_INWARD') },
                { label: '↩️ Purchase Return', action: () => onSelectWorkspace('PURCHASE_INWARD') },
                { label: '📑 Purchase Order', action: () => onSelectWorkspace('PURCHASE_INWARD') },
                { label: '💳 Sales', action: () => onSelectWorkspace('SALE_POS') },
                { label: '↩️ Sales Return', action: () => onSelectWorkspace('SALE_POS') },
                { label: '📋 Quotations', action: () => onSelectWorkspace('QUOTATION') },
                { label: '📝 Estimates', action: () => onSelectWorkspace('ESTIMATE_DELIVERY') },
                { label: '💸 Expenses', action: () => onSelectWorkspace('PETTY_EXPENSES') },
                { label: '💰 Income', action: () => onSelectWorkspace('PETTY_EXPENSES') },
                { label: '🔧 Services', action: () => onSelectWorkspace('SALE_POS') },
                { label: '🧾 Service Billing', action: () => onSelectWorkspace('SALE_POS') },
                { label: '💵 Payment (To Supplier)', action: () => onOpenSupplierPaymentVoucher && onOpenSupplierPaymentVoucher() },
                { label: '🪙 Receipt (From Customer)', action: () => onOpenReceiptEntry && onOpenReceiptEntry() },
                { label: '📱 SMS', action: () => onSelectWorkspace('DESKTOP_HOME') }
              ].map((item, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <div
                    onClick={() => {
                      if (!item.hasSubmenu) {
                        setIsRecordsMenuOpen(false);
                        setIsOutstandingSubOpen(false);
                      }
                      item.action();
                    }}
                    style={{
                      padding: '7px 14px',
                      color: item.highlight ? '#38bdf8' : '#f8fafc',
                      backgroundColor: item.highlight ? '#082f49' : 'transparent',
                      fontSize: '12px',
                      fontWeight: item.highlight ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderBottom: '1px solid #1e293b'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#1e3a8a';
                      e.currentTarget.style.color = '#93c5fd';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = item.highlight ? '#082f49' : 'transparent';
                      e.currentTarget.style.color = item.highlight ? '#38bdf8' : '#f8fafc';
                    }}
                  >
                    <span style={{ color: '#22c55e', fontSize: '10px' }}>➔</span>
                    <span>{item.label}</span>
                  </div>

                  {/* Outstanding Analysis Submenu (Frame 0095) */}
                  {item.hasSubmenu && isOutstandingSubOpen && (
                    <div
                      style={{
                        backgroundColor: '#020617',
                        borderLeft: '2px solid #38bdf8',
                        padding: '2px 0 2px 24px'
                      }}
                    >
                      <div
                        onClick={() => {
                          setIsRecordsMenuOpen(false);
                          setIsOutstandingSubOpen(false);
                          if (onOpenCustomerOutstanding) onOpenCustomerOutstanding();
                        }}
                        style={{
                          padding: '6px 12px',
                          color: '#bae6fd',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#38bdf8')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#bae6fd')}
                      >
                        🔴 Customer Outstanding Balance
                      </div>
                      <div
                        onClick={() => {
                          setIsRecordsMenuOpen(false);
                          setIsOutstandingSubOpen(false);
                          if (onOpenSupplierOutstanding) onOpenSupplierOutstanding();
                        }}
                        style={{
                          padding: '6px 12px',
                          color: '#bae6fd',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#38bdf8')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#bae6fd')}
                      >
                        🔵 Supplier Outstanding Balance
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Utilities Menu Dropdown */}
        <div style={{ position: 'relative', display: 'inline-block' }} ref={utilitiesMenuRef}>
          <span
            className={`rd-menu-item ${isUtilitiesMenuOpen ? 'active' : ''}`}
            onClick={() => setIsUtilitiesMenuOpen(!isUtilitiesMenuOpen)}
            style={{
              backgroundColor: isUtilitiesMenuOpen ? '#0891b2' : undefined,
              color: isUtilitiesMenuOpen ? '#ffffff' : '#0e7490',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            title="Utilities: Bulk Editor, Price Edit, Prefix & Suffix, Terminal Settings"
          >
            🛠️ Utilities {isUtilitiesMenuOpen ? '▲' : '▼'}
          </span>

          {isUtilitiesMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                width: '280px',
                backgroundColor: '#0f172a',
                border: '1px solid #06b6d4',
                boxShadow: '0 12px 28px rgba(0,0,0,0.85)',
                zIndex: 99999,
                padding: '4px 0',
                borderRadius: '4px'
              }}
            >
              {[
                { label: '📋 Product Bulk Editor (Godown/Rack/Part)', action: () => onOpenProductBulkEditor && onOpenProductBulkEditor() },
                { label: '💲 Sale Price & Margin Editor', action: () => onOpenSalePriceEditor && onOpenSalePriceEditor() },
                { label: '⚙️ Prefix & Suffix Invoice Code', action: () => onOpenPrefixSuffix && onOpenPrefixSuffix() },
                { label: '🖥️ Hardware Terminal Settings', action: () => onOpenTerminalSetting && onOpenTerminalSetting() },
                { label: '🏷️ Barcode Designer / Label Printing', action: () => onSelectWorkspace('BARCODE_DESIGNER') },
                { label: '⌨️ On-Screen Touch Keyboard', action: () => onOpenVirtualKeyboard && onOpenVirtualKeyboard() }
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setIsUtilitiesMenuOpen(false);
                    item.action();
                  }}
                  style={{
                    padding: '8px 14px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderBottom: idx === 5 ? 'none' : '1px solid #1e293b'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#164e63';
                    e.currentTarget.style.color = '#22d3ee';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#f8fafc';
                  }}
                >
                  <span style={{ color: '#22c55e', fontSize: '10px' }}>➔</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reports Menu Dropdown */}
        {userPermissions.reports !== false && (
          <div style={{ position: 'relative', display: 'inline-block' }} ref={reportsMenuRef}>
            <span
              className={`rd-menu-item ${isReportsMenuOpen ? 'active' : ''}`}
              onClick={() => setIsReportsMenuOpen(!isReportsMenuOpen)}
              style={{
                backgroundColor: isReportsMenuOpen ? '#2563eb' : undefined,
                color: isReportsMenuOpen ? '#ffffff' : '#1d4ed8',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              title="Reports & Financial Registers"
            >
              📊 Reports {isReportsMenuOpen ? '▲' : '▼'}
            </span>

            {isReportsMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '260px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #3b82f6',
                  boxShadow: '0 12px 28px rgba(0,0,0,0.85)',
                  zIndex: 99999,
                  padding: '4px 0',
                  borderRadius: '4px'
                }}
              >
                {[
                  { label: '📊 Sales Register (Bill Wise)', action: () => onSelectWorkspace('SALES_REGISTER_BILL_WISE') },
                  { label: '⚡ D-Sale Direct Billing Report', action: () => onSelectWorkspace('D_SALE_REPORT') },
                  { label: '📋 GST Tax Register', action: () => onSelectWorkspace('TAX_REPORT_GST') },
                  { label: '📈 Outstanding Analysis Report', action: () => onOpenOutstandingReport && onOpenOutstandingReport() },
                  { label: '📅 Expiry Product (Item Aging)', action: () => onSelectWorkspace('EXPIRY_REPORT') },
                  { label: '🧾 Sales Invoices History', action: () => onSelectWorkspace('SALES_INVOICE_REPORT') }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setIsReportsMenuOpen(false);
                      item.action();
                    }}
                    style={{
                      padding: '8px 14px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderBottom: idx === 5 ? 'none' : '1px solid #1e293b'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = '#1e3a8a';
                      e.currentTarget.style.color = '#93c5fd';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#f8fafc';
                    }}
                  >
                    <span style={{ color: '#22c55e', fontSize: '10px' }}>➔</span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Video 08 Database Menu Dropdown (Frames 0042 & 0220) */}
        <div style={{ position: 'relative', display: 'inline-block' }} ref={databaseMenuRef}>
          <span
            className={`rd-menu-item ${isDatabaseMenuOpen ? 'active' : ''}`}
            onClick={() => setIsDatabaseMenuOpen(!isDatabaseMenuOpen)}
            style={{
              backgroundColor: isDatabaseMenuOpen ? '#2563eb' : undefined,
              color: isDatabaseMenuOpen ? '#ffffff' : '#38bdf8',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            title="Database Menu: Google Drive Cloud Backup & Disaster Recovery [Video 08]"
          >
            🗄️ Database {isDatabaseMenuOpen ? '▲' : '▼'}
          </span>

          {isDatabaseMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                width: '270px',
                backgroundColor: '#0f172a',
                border: '1px solid #38bdf8',
                boxShadow: '0 12px 28px rgba(0,0,0,0.8)',
                zIndex: 99999,
                padding: '4px 0',
                borderRadius: '4px'
              }}
            >
              {[
                { label: '🔄 Database Restore (frmDatabaseRestore)', action: () => onOpenDatabaseRestore && onOpenDatabaseRestore() },
                { label: '☁️ Backup Database Now (Cloud & D:\\)', action: () => onTriggerManualBackup && onTriggerManualBackup() },
                { label: '⚙️ Auto Backup Configuration (frmAutoBackup)', action: () => onOpenAutoBackup && onOpenAutoBackup() }
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setIsDatabaseMenuOpen(false);
                    item.action();
                  }}
                  style={{
                    padding: '8px 14px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    borderBottom: idx === 2 ? 'none' : '1px solid #1e293b'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#1e293b';
                    e.currentTarget.style.color = '#38bdf8';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#f8fafc';
                  }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Video 08 Settings Menu Dropdown (Frame 0042) */}
        <div style={{ position: 'relative', display: 'inline-block' }} ref={settingsMenuRef}>
          <span
            className={`rd-menu-item ${isSettingsMenuOpen ? 'active' : ''}`}
            onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
            style={{
              backgroundColor: isSettingsMenuOpen ? '#7c3aed' : undefined,
              color: isSettingsMenuOpen ? '#ffffff' : '#a855f7',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            title="Settings Menu: Auto Backup, Hardware, Company [Video 08 Frame 0042]"
          >
            ⚙️ Settings {isSettingsMenuOpen ? '▲' : '▼'}
          </span>

          {isSettingsMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                width: '260px',
                backgroundColor: '#0f172a',
                border: '1px solid #a855f7',
                boxShadow: '0 12px 28px rgba(0,0,0,0.8)',
                zIndex: 99999,
                padding: '4px 0',
                borderRadius: '4px'
              }}
            >
              {[
                { label: '💾 Auto Backup (Google Drive & D:\\)', action: () => onOpenAutoBackup && onOpenAutoBackup() },
                { label: '🏢 Company Master Settings', action: () => onOpenCompanyMaster && onOpenCompanyMaster() },
                { label: '🖥️ Hardware Terminal Settings', action: () => onOpenTerminalSetting && onOpenTerminalSetting() },
                { label: '🏷️ Prefix / Suffix Configuration', action: () => onOpenPrefixSuffix && onOpenPrefixSuffix() }
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setIsSettingsMenuOpen(false);
                    item.action();
                  }}
                  style={{
                    padding: '8px 14px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    borderBottom: idx === 3 ? 'none' : '1px solid #1e293b'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#1e293b';
                    e.currentTarget.style.color = '#c084fc';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#f8fafc';
                  }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Video 11 Users & Security Management Dropdown */}
        <div style={{ position: 'relative', display: 'inline-block' }} ref={usersMenuRef}>
          <span
            className="rd-menu-item"
            onClick={() => setIsUsersMenuOpen(!isUsersMenuOpen)}
            style={{
              backgroundColor: isUsersMenuOpen ? '#3b82f6' : undefined,
              color: isUsersMenuOpen ? '#ffffff' : '#0284c7',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
            title="Video 11 User Registration, User Control 51 Permissions & Security"
          >
            👥 Security & Users {isUsersMenuOpen ? '▲' : '▼'}
          </span>

          {isUsersMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                width: '260px',
                backgroundColor: '#0f172a',
                border: '1px solid #38bdf8',
                boxShadow: '0 12px 28px rgba(0,0,0,0.8)',
                zIndex: 99999,
                padding: '4px 0',
                borderRadius: '4px'
              }}
            >
              {[
                { label: '👤 List of Registered Users', action: () => onOpenUserRegistration && onOpenUserRegistration() },
                { label: '🔒 User Control & 51 Permissions', action: () => onOpenUserControl && onOpenUserControl() },
                { label: '🔑 Change Password', action: () => onOpenChangePassword && onOpenChangePassword() },
                { label: '🏢 Create Company Database', action: () => onOpenCreateCompany && onOpenCreateCompany() },
                { label: '⌨️ On-Screen Touch Keyboard', action: () => onOpenVirtualKeyboard && onOpenVirtualKeyboard() }
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setIsUsersMenuOpen(false);
                    item.action();
                  }}
                  style={{
                    padding: '8px 14px',
                    color: '#f8fafc',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    borderBottom: idx === 4 ? 'none' : '1px solid #1e293b'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#1e293b';
                    e.currentTarget.style.color = '#38bdf8';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#f8fafc';
                  }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current User Badge */}
        <span
          className="rd-menu-item"
          onClick={onToggleAdmin}
          style={{ color: '#0284c7', fontWeight: 'bold' }}
        >
          👤 {currentUser.name} ({currentUser.userType}{isAdmin ? ' • Full' : ''})
        </span>
      </div>

      {/* 3. QUICK ACTION RIBBON (Video 11 Frame 0035 & Frame 0115 Localized) */}
      <div className="rd-ribbon">
        <div className="rd-ribbon-left">
          <button
            className={`rd-ribbon-btn gorilla ${activeWorkspace === 'RUBIC_POS' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('RUBIC_POS')}
          >
            <span>🦍</span>
            <span>{t.rubicPos}</span>
          </button>

          <button
            className={`rd-ribbon-btn ${activeWorkspace === 'PRODUCT_ADD_SMART' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('PRODUCT_ADD_SMART')}
          >
            <span style={{ color: '#16a34a', fontWeight: 'bold' }}>+</span>
            <span>{t.addProduct}</span>
          </button>

          <button
            className={`rd-ribbon-btn sale-pos ${activeWorkspace === 'SALE_POS' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('SALE_POS')}
          >
            <span>🛒</span>
            <span>{t.salePos} [F1]</span>
          </button>

          {userPermissions.estimate !== false && (
            <button
              className={`rd-ribbon-btn ${activeWorkspace === 'ESTIMATE_DELIVERY' ? 'active' : ''}`}
              style={{ borderColor: '#0d9488', color: '#0f766e', fontWeight: 'bold' }}
              onClick={() => onSelectWorkspace('ESTIMATE_DELIVERY')}
              title="Estimate / Delivery Note & WhatsApp Gateways [Video 16 Frames 0025 & 0035]"
            >
              <span>🧮</span>
              <span>{t.estimateNote}</span>
            </button>
          )}

          {userPermissions.records !== false && (
            <button
              className={`rd-ribbon-btn ${activeWorkspace === 'SALES_REGISTER_BILL_WISE' ? 'active' : ''}`}
              style={{ borderColor: '#2563eb', color: '#1d4ed8', fontWeight: 'bold' }}
              onClick={() => onSelectWorkspace('SALES_REGISTER_BILL_WISE')}
              title="Sales Register (Bill Wise) & Backdated Invoices [Video 16 Frames 0150 & 0155]"
            >
              <span>📊</span>
              <span>{t.salesRegister}</span>
            </button>
          )}

          {userPermissions.quotation !== false && (
            <button
              className={`rd-ribbon-btn ${activeWorkspace === 'QUOTATION' ? 'active' : ''}`}
              style={{ borderColor: '#e11d48', color: '#be123c' }}
              onClick={() => onSelectWorkspace('QUOTATION')}
              title="Quotation Module with Product Images & GST Math [Video 17 Frame 0160]"
            >
              <span>📑</span>
              <span>Quotation</span>
            </button>
          )}

          {userPermissions.purchaseEntry !== false && (
            <button
              className={`rd-ribbon-btn purchase ${activeWorkspace === 'PURCHASE_INWARD' ? 'active' : ''}`}
              onClick={() => onSelectWorkspace('PURCHASE_INWARD')}
            >
              <span>🛍️</span>
              <span>+ {t.purchase} [F2]</span>
            </button>
          )}
        </div>

        {/* Right Ribbon: Desktop Home + Video 08 Backup & Restore + Video 11 Red LogOut Button */}
        <div className="rd-ribbon-right">
          {onTriggerManualBackup && (
            <button
              className="rd-ribbon-btn"
              style={{ borderColor: '#8b5cf6', color: '#6d28d9', fontWeight: 'bold' }}
              onClick={onTriggerManualBackup}
              title="Backup Database to Google Drive & D:\ Drive [Video 08 Frame 0145]"
            >
              <span>☁️</span>
              <span>Backup</span>
            </button>
          )}

          {onOpenDatabaseRestore && (
            <button
              className="rd-ribbon-btn"
              style={{ borderColor: '#0284c7', color: '#0369a1', fontWeight: 'bold' }}
              onClick={onOpenDatabaseRestore}
              title="Database Restore (Disaster Recovery) [Video 08 Frame 0220]"
            >
              <span>🔄</span>
              <span>Restore DB</span>
            </button>
          )}

          <button
            className="rd-ribbon-btn"
            style={{ borderColor: '#64748b', color: '#334155' }}
            onClick={() => onSelectWorkspace('DESKTOP_HOME')}
            title="Return to Desktop Home"
          >
            <span>⏻</span>
            <span>Desktop</span>
          </button>

          <button
            className="rd-ribbon-btn logout"
            onClick={onLogout}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              borderColor: '#b91c1c',
              fontWeight: '900',
              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.4)'
            }}
            title="Video 11 LogOut from Application [Frame 0035 & 0200]"
          >
            <span>⏻</span>
            <span>{t.logout}</span>
          </button>
        </div>
      </div>
    </>
  );
}
