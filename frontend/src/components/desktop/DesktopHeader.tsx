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
  onLogout
}: DesktopHeaderProps) {
  const [isTransactionMenuOpen, setIsTransactionMenuOpen] = useState(false);
  const [isUsersMenuOpen, setIsUsersMenuOpen] = useState(false);
  const [isInventoryMenuOpen, setIsInventoryMenuOpen] = useState(false);
  const [isDatabaseMenuOpen, setIsDatabaseMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const usersMenuRef = useRef<HTMLDivElement>(null);
  const inventoryMenuRef = useRef<HTMLDivElement>(null);
  const databaseMenuRef = useRef<HTMLDivElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

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
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsTransactionMenuOpen(false);
        setIsUsersMenuOpen(false);
        setIsInventoryMenuOpen(false);
        setIsDatabaseMenuOpen(false);
        setIsSettingsMenuOpen(false);
      }
    };
    if (isTransactionMenuOpen || isUsersMenuOpen || isInventoryMenuOpen || isDatabaseMenuOpen || isSettingsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTransactionMenuOpen, isUsersMenuOpen, isInventoryMenuOpen, isDatabaseMenuOpen, isSettingsMenuOpen]);

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
      <div className="rd-menubar" style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
        {/* Master Entry */}
        <span
          className={`rd-menu-item ${activeWorkspace === 'PRODUCT_ADD_SMART' ? 'active' : ''}`}
          onClick={() => onSelectWorkspace('PRODUCT_ADD_SMART')}
        >
          {t.masterEntry}
        </span>

        {/* Company Info */}
        {userPermissions.companyInformation !== false && (
          <span
            className="rd-menu-item"
            onClick={onOpenCompanyMaster}
            title="Open Company Master Info [Frame 240]"
            style={{ color: '#0369a1', fontWeight: 'bold' }}
          >
            🏢 {t.companyInfo}
          </span>
        )}

        {/* Banking Master */}
        {userPermissions.banking !== false && (
          <span
            className="rd-menu-item"
            onClick={onOpenBankingMaster}
            title="List of Banks, Branch Entry, Bank Accounts Registration [Video 20 Frame 272]"
            style={{ color: '#15803d', fontWeight: 'bold' }}
          >
            🏛️ {t.banking}
          </span>
        )}

        {/* Prefix & Suffix Code */}
        {userPermissions.preSufInvoiceCode !== false && (
          <span
            className="rd-menu-item"
            onClick={onOpenPrefixSuffix}
            title="Configure Prefix and Suffix Invoice Code [Video 20 Frame 221]"
            style={{ color: '#4338ca', fontWeight: 'bold' }}
          >
            ⚙️ Prefix & Suffix
          </span>
        )}

        {/* Terminal Setting */}
        {userPermissions.setting !== false && (
          <span
            className="rd-menu-item"
            onClick={onOpenTerminalSetting}
            title="Hardware Terminal Settings, Printers & Secondary Displays [Video 17 Frame 0065]"
            style={{ color: '#0284c7', fontWeight: 'bold' }}
          >
            🖥️ Terminal
          </span>
        )}

        {/* Receipt Entry */}
        {userPermissions.receipt !== false && (
          <span
            className="rd-menu-item"
            onClick={onOpenReceiptEntry}
            title="Customer Receipt Entry Voucher [Video 20 Frame 331]"
            style={{ color: '#047857', fontWeight: 'bold' }}
          >
            🧾 Receipt
          </span>
        )}

        {/* Outstanding Report (Hidden if Reports disabled) */}
        {userPermissions.reports !== false && (
          <span
            className="rd-menu-item"
            onClick={onOpenOutstandingReport}
            title="Outstanding Balance Report [Video 20 Frame 362]"
            style={{ color: '#b91c1c', fontWeight: 'bold' }}
          >
            📊 Outstanding
          </span>
        )}

        {/* Bulk Editor */}
        {userPermissions.bulkEditor !== false && (
          <span
            className="rd-menu-item"
            onClick={onOpenProductBulkEditor}
            title="Product Bulk Editor (Salesman % & Loyalty Points) [Video 19 Frame 275]"
            style={{ color: '#0e7490', fontWeight: 'bold' }}
          >
            📋 Bulk Editor
          </span>
        )}

        {/* Price Edit */}
        {userPermissions.bulkEditor !== false && (
          <span
            className="rd-menu-item"
            onClick={onOpenSalePriceEditor}
            title="Sale Price & Margin Editor [Video 19 Frame 535]"
            style={{ color: '#7c3aed', fontWeight: 'bold' }}
          >
            💲 Price Edit
          </span>
        )}

        {/* Salesman Payout */}
        {userPermissions.salesManEntry !== false && (
          <span
            className="rd-menu-item"
            onClick={onOpenSalesmanPayment}
            title="Salesman Commission Payout Voucher [Video 19 Frame 345]"
            style={{ color: '#b45309', fontWeight: 'bold' }}
          >
            💵 Salesman Payout
          </span>
        )}

        {/* Salesman Ledger */}
        {userPermissions.salesManEntry !== false && (
          <span
            className="rd-menu-item"
            onClick={onOpenSalesmanLedger}
            title="Salesman Commission Ledger Report [Video 19 Frame 365]"
            style={{ color: '#047857', fontWeight: 'bold' }}
          >
            📜 Salesman Ledger
          </span>
        )}

        {/* Estimate Note */}
        {userPermissions.estimate !== false && (
          <span
            className={`rd-menu-item ${activeWorkspace === 'ESTIMATE_DELIVERY' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('ESTIMATE_DELIVERY')}
            style={{ color: '#0d9488', fontWeight: 'bold' }}
            title="Estimate / Delivery Note & WhatsApp Gateways [Video 16 Frames 0025 & 0035]"
          >
            🧮 {t.estimateNote}
          </span>
        )}

        {/* Sales Register (Hidden if Records disabled) */}
        {userPermissions.records !== false && (
          <span
            className={`rd-menu-item ${activeWorkspace === 'SALES_REGISTER_BILL_WISE' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('SALES_REGISTER_BILL_WISE')}
            style={{ color: '#2563eb', fontWeight: 'bold' }}
            title="Sales Register Bill Wise & Backdated Invoices [Video 16 Frames 0150 & 0155]"
          >
            📊 {t.salesRegister}
          </span>
        )}

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

        {/* D-Sale Report (Hidden if Reports disabled) */}
        {userPermissions.reports !== false && (
          <span
            className={`rd-menu-item ${activeWorkspace === 'D_SALE_REPORT' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('D_SALE_REPORT')}
            style={{ color: '#b45309', fontWeight: 'bold' }}
          >
            ⚡ D-Sale Report
          </span>
        )}

        {/* Item Aging (Expiry) (Hidden if Reports disabled) */}
        {userPermissions.reports !== false && (
          <span
            className={`rd-menu-item ${activeWorkspace === 'EXPIRY_REPORT' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('EXPIRY_REPORT')}
          >
            📅 Item Aging
          </span>
        )}

        {/* GST Tax Register (Hidden if Tax Report disabled) */}
        {userPermissions.taxReport !== false && (
          <span
            className={`rd-menu-item ${activeWorkspace === 'TAX_REPORT_GST' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('TAX_REPORT_GST')}
          >
            📋 {t.taxReport}
          </span>
        )}

        {/* Sales Invoices (Hidden if Reports disabled) */}
        {userPermissions.reports !== false && (
          <span
            className={`rd-menu-item ${activeWorkspace === 'SALES_INVOICE_REPORT' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('SALES_INVOICE_REPORT')}
          >
            🧾 {t.reports}
          </span>
        )}

        {/* Customer Outstanding (Hidden if Records disabled) */}
        {userPermissions.records !== false && (
          <span
            className={`rd-menu-item ${activeWorkspace === 'CUSTOMER_LEDGER' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('CUSTOMER_LEDGER')}
          >
            {t.customerOutstanding}
          </span>
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

        {/* Video 10 Direct Quick Button: Product Discount Setting */}
        {userPermissions.inventory !== false && onOpenProductDiscountSetting && (
          <span
            className="rd-menu-item"
            onClick={onOpenProductDiscountSetting}
            title="Item / Product Discount Setting (Video 10 Frame 0071 frmProductDiscount)"
            style={{ color: '#0284c7', fontWeight: 'bold' }}
          >
            🏷️ Vol Discount
          </span>
        )}

        {/* Expenses */}
        {userPermissions.expense !== false && (
          <span
            className={`rd-menu-item ${activeWorkspace === 'PETTY_EXPENSES' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('PETTY_EXPENSES')}
          >
            {t.expenses}
          </span>
        )}

        {/* Barcode */}
        {userPermissions.generalBarcode !== false && (
          <span
            className={`rd-menu-item ${activeWorkspace === 'BARCODE_DESIGNER' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('BARCODE_DESIGNER')}
          >
            {t.barcode}
          </span>
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
        <div className="rd-ribbon-left" style={{ overflowX: 'auto' }}>
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

          {userPermissions.bulkEditor !== false && (
            <button
              className="rd-ribbon-btn"
              style={{ borderColor: '#0e7490', color: '#0e7490' }}
              onClick={onOpenProductBulkEditor}
              title="Product Bulk Editor (Commission & Loyalty) [Video 19 Frame 275]"
            >
              <span>📋</span>
              <span>Bulk Editor</span>
            </button>
          )}

          {userPermissions.bulkEditor !== false && (
            <button
              className="rd-ribbon-btn"
              style={{ borderColor: '#7c3aed', color: '#7c3aed' }}
              onClick={onOpenSalePriceEditor}
              title="Sale Price & Margin Editor [Video 19 Frame 535]"
            >
              <span>💲</span>
              <span>Price Edit</span>
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

          {userPermissions.reports !== false && (
            <button
              className={`rd-ribbon-btn ${activeWorkspace === 'D_SALE_REPORT' ? 'active' : ''}`}
              style={{ borderColor: '#f59e0b', color: '#b45309' }}
              onClick={() => onSelectWorkspace('D_SALE_REPORT')}
              title="D-Sale Direct Billing Report [Frame 085]"
            >
              <span>⚡</span>
              <span>D-Sale Report</span>
            </button>
          )}

          {userPermissions.reports !== false && (
            <button
              className={`rd-ribbon-btn ${activeWorkspace === 'EXPIRY_REPORT' ? 'active' : ''}`}
              style={{ borderColor: '#ec4899', color: '#be185d' }}
              onClick={() => onSelectWorkspace('EXPIRY_REPORT')}
            >
              <span>📅</span>
              <span>Item Aging</span>
            </button>
          )}

          {userPermissions.taxReport !== false && (
            <button
              className={`rd-ribbon-btn ${activeWorkspace === 'TAX_REPORT_GST' ? 'active' : ''}`}
              style={{ borderColor: '#0284c7', color: '#0369a1' }}
              onClick={() => onSelectWorkspace('TAX_REPORT_GST')}
            >
              <span>📋</span>
              <span>{t.taxReport}</span>
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
        <div className="rd-ribbon-right" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
