import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import type {
  ActiveWorkspace,
  SupportedLanguage,
  UserControlPermissions,
  UserRecord,
  Product,
  Customer
} from '../../types/retailDaddy';
import { LANGUAGE_TRANSLATIONS } from '../../data/retailDaddyData';
import { OpenAnythingModal } from '../common/OpenAnythingModal';
import { SyncHealthIndicator } from '../common/SyncHealthIndicator';
const FinancialStatementsModal = lazy(() => import('../accounting/FinancialStatementsModal').then(m => ({ default: m.FinancialStatementsModal })));
import type { OldBillRecord } from '../pos/OldBillManagerModal';

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
  onOpenDecentroBanking?: (tab?: 'accounts' | 'banks' | 'branches' | 'qr' | 'payout' | 'kyb' | 'va' | 'ledger' | 'config' | 'master') => void;
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
  onOpenCustomerCreditAging?: () => void;
  onOpenStockHedging?: () => void;
  onOpenDeliveryPipeline?: () => void;
  onOpenSupplierOutstanding?: () => void;
  onOpenProductRecords?: () => void;
  onOpenSupplierPaymentVoucher?: () => void;
  onOpenPurchaseDashboard?: () => void;
  onOpenAccountHead?: () => void;
  onOpenExpenseVoucher?: () => void;
  onOpenIncomeVoucher?: () => void;
  onOpenContraVoucher?: () => void;
  onOpenExpensesDashboard?: () => void;
  onOpenIncomeDashboard?: () => void;
  onOpenBankStatements?: () => void;
  onOpenStockInHand?: () => void;
  onOpenSalesReturn?: () => void;
  onOpenPurchaseReturn?: () => void;
  onOpenSalesReturnDashboard?: () => void;
  onOpenPurchaseReturnDashboard?: () => void;
  onOpenExpiryProductReport?: () => void;
  onOpenStockEntry?: () => void;
  onOpenStockEntryRecords?: () => void;
  onOpenStockAdjustmentEntry?: () => void;
  onOpenStockAdjustmentRecords?: () => void;
  onOpenPurchaseListRecords?: () => void;
  onOpenPurchaseReturnRecords?: () => void;
  onOpenSmsSetting?: () => void;
  onOpenEmailSetting?: () => void;
  onOpenProductImageUpload?: () => void;
  onOpenProductCatalogue?: () => void;
  onOpenWhatsAppBulkSender?: () => void;
  onOpenCustomerLedger?: () => void;
  onOpenCrmLeads?: () => void;
  onOpenCustomerReviews?: () => void;
  onOpenFinancialStatements?: () => void;
  onOpenDayEndClosing?: () => void;
  onOpenTaxReport?: () => void;
  onOpenWorkshopJobCards?: () => void;
  onOpenHardwareHub?: () => void;
  onOpenDynamicQrModal?: () => void;
  onOpenOutwardExitScanner?: () => void;
  products?: Product[];
  customers?: Customer[];
  bills?: OldBillRecord[];
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
  onOpenDecentroBanking,
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
  onOpenCustomerCreditAging,
  onOpenStockHedging,
  onOpenDeliveryPipeline,
  onOpenSupplierOutstanding,
  onOpenProductRecords,
  onOpenSupplierPaymentVoucher,
  onOpenPurchaseDashboard,
  onOpenAccountHead,
  onOpenExpenseVoucher,
  onOpenIncomeVoucher,
  onOpenContraVoucher,
  onOpenExpensesDashboard,
  onOpenIncomeDashboard,
  onOpenBankStatements,
  onOpenStockInHand,
  onOpenSalesReturn,
  onOpenPurchaseReturn,
  onOpenSalesReturnDashboard,
  onOpenPurchaseReturnDashboard,
  onOpenExpiryProductReport,
  onOpenStockEntry,
  onOpenStockEntryRecords,
  onOpenStockAdjustmentEntry,
  onOpenStockAdjustmentRecords,
  onOpenPurchaseListRecords,
  onOpenPurchaseReturnRecords,
  onOpenSmsSetting,
  onOpenEmailSetting,
  onOpenProductImageUpload,
  onOpenProductCatalogue,
  onOpenWhatsAppBulkSender,
  onOpenCustomerLedger,
  onOpenCrmLeads,
  onOpenCustomerReviews,
  onOpenFinancialStatements,
  onOpenDayEndClosing,
  onOpenTaxReport,
  onOpenWorkshopJobCards,
  onOpenHardwareHub,
  onOpenDynamicQrModal,
  onOpenOutwardExitScanner,
  products = [],
  customers = [],
  bills = [],
  onLogout
}: DesktopHeaderProps) {
  const [isOpenAnythingModalOpen, setIsOpenAnythingModalOpen] = useState(false);
  const [isFinancialStatementsOpen, setIsFinancialStatementsOpen] = useState(false);

  useEffect(() => {
    const handleGlobalSearchKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F' || e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsOpenAnythingModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalSearchKey);
    return () => window.removeEventListener('keydown', handleGlobalSearchKey);
  }, []);

  const [isMasterMenuOpen, setIsMasterMenuOpen] = useState(false);
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
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [mobileDrawerSearch, setMobileDrawerSearch] = useState('');
  const [openMobileCategory, setOpenMobileCategory] = useState<string | null>('pos');

  const masterMenuRef = useRef<HTMLDivElement>(null);
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
      if (masterMenuRef.current && !masterMenuRef.current.contains(e.target as Node)) {
        setIsMasterMenuOpen(false);
      }
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
      {/* 💻 DESKTOP WINDOWS TITLEBAR, MENUBAR & RIBBON (Hidden on <= 768px) */}
      <div className="rd-desktop-header-wrap">
        {/* 1. TOP WINDOWS TITLEBAR (Video 11 Frame 0115) */}
        <div className="rd-titlebar">
        <div className="rd-titlebar-left">
          <div className="rd-titlebar-app-icon">RD</div>
          <span>
            POS | Shree Vinayaka Furnitures ERP | Enterprise Edition | Multiuser Mode | Valid Upto : 18-02-2028 | {companyName.toUpperCase()} | FY : {financialYear} |
          </span>
        </div>

        {/* Right side of Titlebar: Language quick switcher + Window controls */}
        <div className="rd-titlebar-controls" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SyncHealthIndicator />
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
            title="Switch Software UI Language"
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

          <button
            className="rd-titlebar-btn"
            title="Minimize Window"
            onClick={() => onSelectWorkspace('DESKTOP_HOME')}
          >
            _
          </button>
          <button
            className="rd-titlebar-btn"
            title="Toggle Fullscreen (Maximize)"
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen?.().catch(() => {});
              } else {
                document.exitFullscreen?.().catch(() => {});
              }
            }}
          >
            □
          </button>
          <button className="rd-titlebar-btn close" title="Close" onClick={() => onSelectWorkspace('DESKTOP_HOME')}>✕</button>
        </div>
      </div>

      {/* 2. TOP MDI MENU BAR (Video 11 Frame 0065 & 0115 Permission Aware & Localized) */}
      <div className="rd-menubar">
        {/* Master Entry Dropdown */}
        <div style={{ position: 'relative', display: 'inline-block' }} ref={masterMenuRef}>
          <span
            className={`rd-menu-item ${isMasterMenuOpen || activeWorkspace === 'PRODUCT_ADD_SMART' ? 'active' : ''}`}
            onClick={() => setIsMasterMenuOpen(!isMasterMenuOpen)}
            style={{
              backgroundColor: isMasterMenuOpen ? '#003366' : undefined,
              color: isMasterMenuOpen ? '#ffffff' : undefined,
              cursor: 'pointer'
            }}
            title="Master Entry Menu"
          >
            {t.masterEntry} {isMasterMenuOpen ? '▲' : '▼'}
          </span>

          {isMasterMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                width: '260px',
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
                { label: '📦 Product / Stock Entry', action: () => onSelectWorkspace('PRODUCT_ADD_SMART') },
                { label: '🏷️ Account Head (Income / Expense)', action: () => onOpenAccountHead && onOpenAccountHead() },
                { label: '🏛️ Company Master Profile', action: () => onOpenCompanyMaster && onOpenCompanyMaster() }
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setIsMasterMenuOpen(false);
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
                    borderBottom: idx === 3 ? 'none' : '1px solid #18181b'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#27272a';
                    e.currentTarget.style.color = '#38bdf8';
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
                      backgroundColor: '#38bdf8',
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
                  { label: '🛒 Point of Sale [F1]', action: () => onSelectWorkspace('SALE_POS') },
                  { label: '📝 Estimate / Delivery Note', action: () => onSelectWorkspace('ESTIMATE_DELIVERY') },
                  { label: '📋 Price Quotation', action: () => onSelectWorkspace('QUOTATION') },
                  { label: '🚚 Dispatch, Assembly & CSAT Pipeline', action: () => onOpenDeliveryPipeline && onOpenDeliveryPipeline() },
                  { label: '📥 Purchase Inward Entry', action: () => onSelectWorkspace('PURCHASE_INWARD') },
                  { label: '↩️ Sale Return (Cr. Note)', action: () => onOpenSalesReturn && onOpenSalesReturn() },
                  { label: '↩️ Purchase Return (Dr. Note)', action: () => onOpenPurchaseReturn && onOpenPurchaseReturn() },
                  { label: '🪙 Customer Receipt Voucher', action: () => onOpenReceiptEntry && onOpenReceiptEntry() },
                  { label: '💵 Supplier Payment Voucher', action: () => onOpenSupplierPaymentVoucher && onOpenSupplierPaymentVoucher() },
                  { label: '💸 Petty Expense Voucher', action: () => onOpenExpenseVoucher ? onOpenExpenseVoucher() : onSelectWorkspace('PETTY_EXPENSES') },
                  { label: '💰 Other Income Voucher', action: () => onOpenIncomeVoucher && onOpenIncomeVoucher() },
                  { label: '🔄 Contra Transfer (Cash/Bank Deposit)', action: () => onOpenContraVoucher ? onOpenContraVoucher() : window.dispatchEvent(new CustomEvent('svf-open-contra')) }
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
              title="Inventory Menu - Product Discount Setting, Audit, Stock"
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
                  { label: '⚡ Godrej Stock Hedging & Reorder Alerts', action: () => onOpenStockHedging && onOpenStockHedging() },
                  { label: '📥 Stock Entry (Direct Stock Inward)', action: () => onOpenStockEntry && onOpenStockEntry() },
                  { label: '⚖️ Stock Adjustment (Plus / Minus)', action: () => onOpenStockAdjustmentEntry && onOpenStockAdjustmentEntry() },
                  { label: '🏷️ Product Discount Setting (frmProductDiscount)', action: () => onOpenProductDiscountSetting && onOpenProductDiscountSetting() },
                  { label: `🔍 ${t.inventoryAudit}`, action: () => onSelectWorkspace('STOCK_AUDIT') },
                  { label: `📊 ${t.stockInHand}`, action: () => onOpenStockInHand ? onOpenStockInHand() : onSelectWorkspace('STOCK_IN_HAND') }
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
              title="Banking Master: List of Banks, Branch Entry, Bank Accounts Registration"
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
                  { label: '⚡ Unified Banking Hub (UPI QR, Payouts, KYB, Escrow)', action: () => onOpenDecentroBanking && onOpenDecentroBanking('qr') },
                  { label: '🏛️ Store Bank Accounts & Branches Master', action: () => onOpenBankingMaster && onOpenBankingMaster() },
                  { label: '🏦 Live Bank Statements & UTR Reconciliation', action: () => onOpenBankStatements && onOpenBankStatements() }
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
                      borderBottom: idx === 1 ? 'none' : '1px solid #1e293b'
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
              title="Payroll & Salesman Commission"
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
                  { label: '📜 Salesman Commission Ledger Report', action: () => onOpenSalesmanLedger && onOpenSalesmanLedger() }
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
            title="Records Menu: Purchase Dashboard, Customers, Suppliers, Outstanding, Products"
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
                { label: '👥 Customer Master Directory', action: () => onOpenCustomerRecords && onOpenCustomerRecords() },
                { label: '📑 Customer Ledger (Khata) & Statement', highlight: true, action: () => onOpenCustomerLedger && onOpenCustomerLedger() },
                { label: '🎯 CRM Leads Pipeline (Hot, Warm, Cold)', highlight: true, action: () => onOpenCrmLeads && onOpenCrmLeads() },
                { label: '⭐ Post-Delivery Customer Reviews & CSAT', highlight: true, action: () => onOpenCustomerReviews && onOpenCustomerReviews() },
                { label: '🏭 Supplier Directory', action: () => onOpenSupplierRecords && onOpenSupplierRecords() },
                {
                  label: '📈 Outstanding Analysis ➔',
                  hasSubmenu: true,
                  action: () => setIsOutstandingSubOpen(!isOutstandingSubOpen)
                },
                { label: '📦 Product Master Catalog Records', action: () => onOpenProductRecords && onOpenProductRecords() },
                {
                  label: '🛍️ Purchase Dashboard & Records',
                  highlight: true,
                  action: () => onOpenPurchaseListRecords ? onOpenPurchaseListRecords() : onOpenPurchaseDashboard && onOpenPurchaseDashboard()
                },
                {
                  label: '↩️ Sales Return Dashboard',
                  highlight: true,
                  action: () =>
                    onOpenSalesReturnDashboard
                      ? onOpenSalesReturnDashboard()
                      : onOpenSalesReturn
                      ? onOpenSalesReturn()
                      : onSelectWorkspace('SALE_POS')
                },
                {
                  label: '↩️ Purchase Return Dashboard',
                  highlight: true,
                  action: () =>
                    onOpenPurchaseReturnRecords
                      ? onOpenPurchaseReturnRecords()
                      : onOpenPurchaseReturnDashboard
                      ? onOpenPurchaseReturnDashboard()
                      : onOpenPurchaseReturn
                      ? onOpenPurchaseReturn()
                      : onSelectWorkspace('PURCHASE_INWARD')
                },
                { label: '💸 Showroom Expenses Register', action: () => onOpenExpensesDashboard ? onOpenExpensesDashboard() : onSelectWorkspace('PETTY_EXPENSES') },
                { label: '💰 Income Cash Register', action: () => onOpenIncomeDashboard ? onOpenIncomeDashboard() : onSelectWorkspace('PETTY_EXPENSES') },
                { label: '📦 Real-Time Stock in Hand', highlight: true, action: () => onOpenStockInHand ? onOpenStockInHand() : onSelectWorkspace('STOCK_IN_HAND') },
                { label: '📥 Stock Inward Entry Records', highlight: true, action: () => onOpenStockEntryRecords ? onOpenStockEntryRecords() : onSelectWorkspace('PRODUCT_ADD_SMART') },
                { label: '⚖️ Stock Adjustment Audit Records', highlight: true, action: () => onOpenStockAdjustmentRecords ? onOpenStockAdjustmentRecords() : onSelectWorkspace('STOCK_AUDIT') }
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
                          if (onOpenCustomerCreditAging) onOpenCustomerCreditAging();
                        }}
                        style={{
                          padding: '6px 12px',
                          color: '#34d399',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#a7f3d0')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#34d399')}
                      >
                        ⚡ Customer Credit Aging (0–120 Days & Reminders)
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
                { label: '🖼️ Product Image Upload & Search', action: () => onOpenProductImageUpload && onOpenProductImageUpload() },
                { label: '🛋️ Showroom Product Catalogue', action: () => onOpenProductCatalogue && onOpenProductCatalogue() },
                { label: '💬 WhatsApp Bulk Broadcaster', action: () => onOpenWhatsAppBulkSender && onOpenWhatsAppBulkSender() },
                { label: '📋 Product Bulk Editor (Godown/Rack/Part)', action: () => onOpenProductBulkEditor && onOpenProductBulkEditor() },
                { label: '💲 Sale Price & Margin Editor', action: () => onOpenSalePriceEditor && onOpenSalePriceEditor() },
                { label: '⚙️ Prefix & Suffix Invoice Code', action: () => onOpenPrefixSuffix && onOpenPrefixSuffix() },
                { label: '⚡ Retsol R220 & Brontix Hardware Hub', action: () => onOpenHardwareHub && onOpenHardwareHub() },
                { label: '📱 Dynamic QR Customer Display Stand', action: () => onOpenDynamicQrModal && onOpenDynamicQrModal() },
                { label: '🚪 Store Exit & Outward Gate Pass Scanner', action: () => onOpenOutwardExitScanner && onOpenOutwardExitScanner() },
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
                  { label: '📈 Profit & Loss and Balance Sheet', action: () => onOpenFinancialStatements ? onOpenFinancialStatements() : setIsFinancialStatementsOpen(true) },
                  { label: '📖 Day Book & Cash Closing Audit', action: () => onOpenDayEndClosing ? onOpenDayEndClosing() : onSelectWorkspace('SALE_POS') },
                  { label: '⚡ D-Sale Direct Billing Report', action: () => onSelectWorkspace('D_SALE_REPORT') },
                  { label: '📋 GST Tax Register', action: () => onSelectWorkspace('TAX_REPORT_GST') },
                  { label: '📈 Outstanding Analysis Report', action: () => onOpenOutstandingReport && onOpenOutstandingReport() },
                  { label: '📅 Expiry Product (Item Aging)', action: () => onOpenExpiryProductReport ? onOpenExpiryProductReport() : onSelectWorkspace('EXPIRY_REPORT') },
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
            title="Database Menu: Google Drive Cloud Backup & Disaster Recovery"
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
            title="Settings Menu: Auto Backup, Hardware, Company"
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
                { label: '🏢 Showroom Company Profile & Settings', action: () => onOpenCompanyMaster && onOpenCompanyMaster() },
                { label: '📱 SMS Gateway Configuration (frmSmsSetting)', action: () => onOpenSmsSetting && onOpenSmsSetting() },
                { label: '📧 Email Configuration (frmEmailSetting)', action: () => onOpenEmailSetting && onOpenEmailSetting() }
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
                    borderBottom: idx === 2 ? 'none' : '1px solid #1e293b'
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
                { label: '🏢 Create Company Database', action: () => onOpenCreateCompany && onOpenCreateCompany() }
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

          {/* Universal Spotlight Search Button (Vyapar Open Anything Ctrl+F) */}
          <button
            className="rd-ribbon-btn"
            style={{
              backgroundColor: '#eff6ff',
              borderColor: '#2563eb',
              color: '#1d4ed8',
              fontWeight: 'bold',
              boxShadow: '0 1px 3px rgba(37,99,235,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={() => setIsOpenAnythingModalOpen(true)}
            title="Open Anything (Ctrl + F / Ctrl + K) - Universal Spotlight Search"
          >
            <span style={{ fontSize: '13px' }}>🔍</span>
            <span>Open Anything</span>
            <span style={{
              fontSize: '9px',
              backgroundColor: '#dbeafe',
              color: '#1e40af',
              padding: '1px 4px',
              borderRadius: '3px',
              fontWeight: 'bold',
              border: '1px solid #bfdbfe'
            }}>
              Ctrl+F
            </span>
          </button>

          {userPermissions.estimate !== false && (
            <button
              className={`rd-ribbon-btn ${activeWorkspace === 'ESTIMATE_DELIVERY' ? 'active' : ''}`}
              style={{ borderColor: '#0d9488', color: '#0f766e', fontWeight: 'bold' }}
              onClick={() => onSelectWorkspace('ESTIMATE_DELIVERY')}
              title="Estimate / Delivery Note & WhatsApp Gateways"
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
              title="Sales Register (Bill Wise) & Backdated Invoices"
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
              title="Quotation Module with Product Images & GST Math"
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

          <button
            className="rd-ribbon-btn"
            style={{
              borderColor: '#0d9488',
              color: '#0f766e',
              fontWeight: 'bold',
              backgroundColor: '#f0fdfa'
            }}
            onClick={() => onOpenWorkshopJobCards && onOpenWorkshopJobCards()}
            title="Factory Workshop & Custom Made-to-Order Production (Job Cards)"
          >
            <span>🔨</span>
            <span>Workshop</span>
          </button>

          <button
            className={`rd-ribbon-btn ${activeWorkspace === 'BARCODE_DESIGNER' ? 'active' : ''}`}
            style={{ borderColor: '#059669', color: '#047857', fontWeight: 'bold' }}
            onClick={() => onSelectWorkspace('BARCODE_DESIGNER')}
            title="Furniture Showroom QR Code & Barcode Tag Designer"
          >
            <span>🏷️</span>
            <span>QR Designer</span>
          </button>

          <button
            className="rd-ribbon-btn"
            style={{
              borderColor: '#0284c7',
              color: '#0369a1',
              fontWeight: 900,
              backgroundColor: '#f0f9ff',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)'
            }}
            onClick={() => onOpenHardwareHub && onOpenHardwareHub()}
            title="Desktop Hardware Hub: Retsol R220 Printer & Brontix Barcode Scanner Integration"
          >
            <span style={{ fontSize: '15px' }}>⚡</span>
            <span>Hardware Hub</span>
          </button>

          <button
            className="rd-ribbon-btn"
            style={{
              borderColor: '#eab308',
              color: '#854d0e',
              fontWeight: 900,
              backgroundColor: '#fefce8',
              boxShadow: '0 2px 4px rgba(234, 179, 8, 0.25)'
            }}
            onClick={() => onOpenDynamicQrModal && onOpenDynamicQrModal()}
            title="Customer-Facing Dynamic QR Code (DQR) Display Stand Studio (IndiaMART ID: 2858609017388)"
          >
            <span style={{ fontSize: '15px' }}>📱</span>
            <span>DQR Stand</span>
          </button>

          <button
            className="rd-ribbon-btn"
            style={{
              borderColor: '#059669',
              color: '#065f46',
              fontWeight: 900,
              backgroundColor: '#ecfdf5',
              boxShadow: '0 2px 4px rgba(5, 150, 105, 0.25)'
            }}
            onClick={() => onOpenOutwardExitScanner && onOpenOutwardExitScanner()}
            title="Store Exit & Outward Gate Pass Verification Barcode Scanner (F8)"
          >
            <span style={{ fontSize: '15px' }}>🚪</span>
            <span>Exit Gatepass</span>
          </button>

          <button
            className="rd-ribbon-btn"
            style={{
              borderColor: '#10b981',
              color: '#065f46',
              fontWeight: 900,
              backgroundColor: '#ecfdf5',
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)'
            }}
            onClick={() => onOpenDecentroBanking && onOpenDecentroBanking('accounts')}
            title="Showroom Unified Banking Hub: Store Accounts, Dynamic UPI QR, KYB GSTIN, Virtual Accounts & Payouts"
          >
            <span style={{ fontSize: '15px' }}>⚡</span>
            <span>Banking Hub</span>
          </button>

          <button
            className={`rd-ribbon-btn ${activeWorkspace === 'CUSTOMER_PORTAL' ? 'active' : ''}`}
            style={{ borderColor: '#b91c1c', color: '#b91c1c', fontWeight: 'bold', background: '#fef2f2' }}
            onClick={() => onSelectWorkspace('CUSTOMER_PORTAL')}
            title="Customer Showroom Mobile Portal (Walk-in QR Scan View)"
          >
            <span>📱</span>
            <span>Mobile Portal</span>
          </button>

          <button
            className={`rd-ribbon-btn ${activeWorkspace === 'PROJECTS_GALLERY' ? 'active' : ''}`}
            style={{ borderColor: '#0284c7', color: '#0369a1', fontWeight: 'bold', background: '#f0f9ff' }}
            onClick={() => {
              if (typeof window !== 'undefined' && window.history) {
                window.history.pushState({}, '', '/project');
              }
              onSelectWorkspace('PROJECTS_GALLERY');
            }}
            title="Furniture Projects & Custom Interiors Showcase (Cloudflare R2 Object Storage)"
          >
            <span>☁️</span>
            <span>Projects (R2)</span>
          </button>

          {onOpenStockHedging && (
            <button
              className="rd-ribbon-btn"
              style={{ borderColor: '#10b981', color: '#047857', fontWeight: 'bold' }}
              onClick={onOpenStockHedging}
              title="Godrej Stock Hedging & Intelligent Reorder Alerts"
            >
              <span>⚡</span>
              <span>Stock Hedging</span>
            </button>
          )}

          {onOpenDeliveryPipeline && (
            <button
              className="rd-ribbon-btn"
              style={{ borderColor: '#3b82f6', color: '#1d4ed8', fontWeight: 'bold' }}
              onClick={onOpenDeliveryPipeline}
              title="Fulfillment: Dispatch, Assembly & CSAT Pipeline"
            >
              <span>🚚</span>
              <span>Delivery Pipeline</span>
            </button>
          )}

          {onOpenCrmLeads && (
            <button
              className="rd-ribbon-btn"
              style={{ borderColor: '#f59e0b', color: '#b45309', fontWeight: 'bold', backgroundColor: '#fffbeb' }}
              onClick={onOpenCrmLeads}
              title="Showroom CRM Leads & Customer Follow-up Pipeline"
            >
              <span>🎯</span>
              <span>CRM Leads</span>
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
              title="Backup Database to Google Drive & D:\ Drive"
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
              title="Database Restore (Disaster Recovery)"
            >
              <span>🔄</span>
              <span>Restore DB</span>
            </button>
          )}

          {activeWorkspace !== 'DESKTOP_HOME' && (
            <button
              className="rd-ribbon-btn"
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                borderColor: '#b91c1c',
                fontWeight: 900,
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.45)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              onClick={() => onSelectWorkspace('DESKTOP_HOME')}
              title="Close current tab and return to Desktop Home [Esc]"
            >
              <span style={{ fontSize: '13px', fontWeight: 900 }}>✕</span>
              <span>Exit Tab [Esc]</span>
            </button>
          )}

          <button
            className={`rd-ribbon-btn ${activeWorkspace === 'DESKTOP_HOME' ? 'active' : ''}`}
            style={{
              borderColor: activeWorkspace === 'DESKTOP_HOME' ? '#2563eb' : '#0284c7',
              backgroundColor: activeWorkspace === 'DESKTOP_HOME' ? '#eff6ff' : '#f0f9ff',
              color: activeWorkspace === 'DESKTOP_HOME' ? '#1d4ed8' : '#0369a1',
              fontWeight: 700
            }}
            onClick={() => onSelectWorkspace('DESKTOP_HOME')}
            title="Return to Desktop Home"
          >
            <span>🏠</span>
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
      </div>

      {/* 📱 MOBILE RESPONSIVE HEADER (< 768px: Mobile Topbar, Touch Ribbon, Navigation Drawer) */}
      <div className="rd-mobile-header-wrap">
        {/* 1. Mobile Topbar */}
        <div className="rd-mobile-topbar">
          <div
            className="rd-mobile-brand"
            onClick={() => onSelectWorkspace('DESKTOP_HOME')}
            title="Return to Desktop Home"
          >
            <div className="rd-mobile-logo-icon">🛋️</div>
            <div className="rd-mobile-brand-text">
              <span className="rd-mobile-brand-title">{companyName || 'Shree Vinayaka'}</span>
              <span className="rd-mobile-brand-sub">
                {activeWorkspace === 'DESKTOP_HOME' ? 'Home Dashboard' :
                 activeWorkspace === 'PRODUCT_ADD_SMART' ? 'Products' :
                 activeWorkspace === 'SALE_POS' ? 'POS Billing' :
                 activeWorkspace === 'PURCHASE_INWARD' ? 'Purchase' :
                 activeWorkspace === 'CUSTOMER_PORTAL' ? 'Customer Portal' :
                 activeWorkspace === 'BARCODE_DESIGNER' ? 'QR Designer' :
                 activeWorkspace === 'TAX_REPORT_GST' ? 'Tax GST' :
                 activeWorkspace === 'CUSTOMER_LEDGER' ? 'Ledger' : 'ERP 1.6'} • FY {financialYear}
              </span>
            </div>
          </div>

          <div className="rd-mobile-actions">
            {activeWorkspace !== 'DESKTOP_HOME' && (
              <button
                type="button"
                className="rd-mobile-btn-action exit-tab"
                onClick={() => onSelectWorkspace('DESKTOP_HOME')}
                title="Exit to Desktop Home"
              >
                <span>✕</span>
                <span>Exit</span>
              </button>
            )}

            <SyncHealthIndicator />
            <button
              type="button"
              className="rd-mobile-btn-action"
              onClick={() => setIsOpenAnythingModalOpen(true)}
              title="Search Any Feature"
            >
              🔍
            </button>

            <button
              type="button"
              className="rd-mobile-btn-action hamburger"
              onClick={() => setIsMobileDrawerOpen(true)}
              title="Open Navigation Drawer"
            >
              ☰
            </button>
          </div>
        </div>

        {/* 2. Mobile Swipeable Ribbon */}
        <div className="rd-mobile-ribbon-bar">
          <button
            type="button"
            className={`rd-mobile-pill-btn ${activeWorkspace === 'DESKTOP_HOME' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('DESKTOP_HOME')}
          >
            🏠 Desktop
          </button>
          <button
            type="button"
            className={`rd-mobile-pill-btn pos-btn ${activeWorkspace === 'SALE_POS' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('SALE_POS')}
          >
            🧾 POS Billing
          </button>
          <button
            type="button"
            className={`rd-mobile-pill-btn ${activeWorkspace === 'PRODUCT_ADD_SMART' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('PRODUCT_ADD_SMART')}
          >
            📦 Products
          </button>
          <button
            type="button"
            className={`rd-mobile-pill-btn purchase-btn ${activeWorkspace === 'PURCHASE_INWARD' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('PURCHASE_INWARD')}
          >
            🛍️ Purchase
          </button>
          <button
            type="button"
            className="rd-mobile-pill-btn banking-btn"
            onClick={() => onOpenDecentroBanking && onOpenDecentroBanking('accounts')}
          >
            ⚡ Banking Hub
          </button>
          <button
            type="button"
            className="rd-mobile-pill-btn delivery-btn"
            onClick={() => onOpenDeliveryPipeline && onOpenDeliveryPipeline()}
          >
            🚚 Delivery
          </button>
          <button
            type="button"
            className={`rd-mobile-pill-btn ${activeWorkspace === 'CUSTOMER_LEDGER' ? 'active' : ''}`}
            onClick={() => onOpenCustomerLedger ? onOpenCustomerLedger() : onSelectWorkspace('CUSTOMER_LEDGER')}
          >
            👥 Ledgers
          </button>
          <button
            type="button"
            className={`rd-mobile-pill-btn ${activeWorkspace === 'TAX_REPORT_GST' ? 'active' : ''}`}
            onClick={() => onOpenTaxReport ? onOpenTaxReport() : onSelectWorkspace('TAX_REPORT_GST')}
          >
            📊 Tax GST
          </button>
          <button
            type="button"
            className={`rd-mobile-pill-btn ${activeWorkspace === 'BARCODE_DESIGNER' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('BARCODE_DESIGNER')}
          >
            🏷️ Barcode QR
          </button>
          <button
            type="button"
            className={`rd-mobile-pill-btn ${activeWorkspace === 'QUOTATION' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('QUOTATION')}
          >
            📑 Quotation
          </button>
          <button
            type="button"
            className="rd-mobile-pill-btn"
            onClick={() => onOpenWorkshopJobCards && onOpenWorkshopJobCards()}
          >
            🔨 Workshop
          </button>
          <button
            type="button"
            className={`rd-mobile-pill-btn ${activeWorkspace === 'CUSTOMER_PORTAL' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('CUSTOMER_PORTAL')}
          >
            📱 Mobile Portal
          </button>
        </div>
      </div>

      {/* 3. Mobile Navigation Drawer Backdrop & Sliding Panel */}
      {isMobileDrawerOpen && (
        <div className="rd-drawer-backdrop" onClick={() => setIsMobileDrawerOpen(false)}>
          <div className="rd-drawer-panel" onClick={e => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="rd-drawer-header">
              <div className="rd-drawer-title-box">
                <span className="rd-drawer-title">Showroom ERP Navigation</span>
                <span className="rd-drawer-subtitle">{companyName}</span>
              </div>
              <button
                type="button"
                className="rd-drawer-close-btn"
                onClick={() => setIsMobileDrawerOpen(false)}
                title="Close Navigation Menu"
              >
                ✕
              </button>
            </div>

            {/* User Profile Card */}
            <div className="rd-drawer-user-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#facc15' }}>
                  👤 {currentUser ? `${currentUser.userType} : ${currentUser.userId}` : (isAdmin ? 'Admin' : 'Sales Person')}
                </span>
                <span style={{ fontSize: '10px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                  🟢 Online
                </span>
              </div>
              <div style={{ fontSize: '10px', color: '#93c5fd' }}>
                Shree Vinayaka Furnitures ERP 1.6 • FY: {financialYear}
              </div>
            </div>

            {/* Quick Search */}
            <div style={{ padding: '0 14px 10px 14px' }}>
              <input
                type="text"
                placeholder="🔍 Search any screen, report, master..."
                value={mobileDrawerSearch}
                onChange={e => setMobileDrawerSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Category Accordion / Search Results */}
            <div className="rd-drawer-accordion-group">
              {[
                {
                  id: 'pos',
                  title: '🛋️ POS & Billing',
                  color: '#ec4899',
                  items: [
                    { label: '🧾 Fast POS Walk-in Billing [F1]', action: () => onSelectWorkspace('SALE_POS') },
                    { label: '📋 Sales Register (Bill-Wise Invoices)', action: () => onSelectWorkspace('SALES_REGISTER_BILL_WISE') },
                    { label: '🧮 Estimate & Delivery Note Generation', action: () => onSelectWorkspace('ESTIMATE_DELIVERY') },
                    { label: '📑 Commercial Quotation Module', action: () => onSelectWorkspace('QUOTATION') },
                    { label: '💰 Customer Payment & Receipt Entry', action: () => onOpenReceiptEntry && onOpenReceiptEntry() },
                    { label: '↩️ Sale Return (Credit Note)', action: () => onOpenSalesReturn && onOpenSalesReturn() },
                    { label: '📊 Sales Return Dashboard', action: () => onOpenSalesReturnDashboard && onOpenSalesReturnDashboard() },
                    { label: '🌙 Day-End Cash Settlement & Audit', action: () => onOpenDayEndClosing && onOpenDayEndClosing() }
                  ]
                },
                {
                  id: 'products',
                  title: '📦 Products & Catalog',
                  color: '#10b981',
                  items: [
                    { label: '📋 Master List of Products (Smart Add)', action: () => onSelectWorkspace('PRODUCT_ADD_SMART') },
                    { label: '⚡ Godrej Auto-SKU & BOM Generator', action: () => onSelectWorkspace('PRODUCT_ADD_SMART') },
                    { label: '📊 Stock in Hand Live Warehouse Register', action: () => onOpenStockInHand ? onOpenStockInHand() : onSelectWorkspace('STOCK_IN_HAND') },
                    { label: '📥 Direct Stock Entry (Fast Inward)', action: () => onOpenStockEntry && onOpenStockEntry() },
                    { label: '⚖️ Physical Stock Adjustment (+ / -)', action: () => onOpenStockAdjustmentEntry && onOpenStockAdjustmentEntry() },
                    { label: '⚡ Godrej Stock Hedging & Reorders', action: () => onOpenStockHedging && onOpenStockHedging() },
                    { label: '🏷️ QR & Barcode Price Tag Designer', action: () => onSelectWorkspace('BARCODE_DESIGNER') },
                    { label: '📋 Product Bulk Editor (Godown/Rack)', action: () => onOpenProductBulkEditor && onOpenProductBulkEditor() },
                    { label: '💲 Sale Price & Profit Margin Editor', action: () => onOpenSalePriceEditor && onOpenSalePriceEditor() },
                    { label: '🖼️ Product Image Upload & Search', action: () => onOpenProductImageUpload && onOpenProductImageUpload() },
                    { label: '🛋️ Showroom Digital Product Catalogue', action: () => onOpenProductCatalogue && onOpenProductCatalogue() }
                  ]
                },
                {
                  id: 'purchases',
                  title: '🛍️ Purchases & Suppliers',
                  color: '#22c55e',
                  items: [
                    { label: '🛍️ Inward Purchase Entry [F2]', action: () => onSelectWorkspace('PURCHASE_INWARD') },
                    { label: '📊 Purchase Inward Dashboard', action: () => onOpenPurchaseDashboard && onOpenPurchaseDashboard() },
                    { label: '💸 Supplier Settlement Payment Voucher', action: () => onOpenSupplierPaymentVoucher && onOpenSupplierPaymentVoucher() },
                    { label: '🔄 Purchase Return (Debit Note)', action: () => onOpenPurchaseReturn && onOpenPurchaseReturn() },
                    { label: '📊 Purchase Return Dashboard', action: () => onOpenPurchaseReturnDashboard && onOpenPurchaseReturnDashboard() },
                    { label: '👥 Supplier Records & Contact Master', action: () => onOpenSupplierRecords && onOpenSupplierRecords() }
                  ]
                },
                {
                  id: 'banking',
                  title: '🏛️ Banking & Expenses',
                  color: '#06b6d4',
                  items: [
                    { label: '⚡ Unified Banking Hub (UPI QR, KYB, VA)', action: () => onOpenDecentroBanking && onOpenDecentroBanking('accounts') },
                    { label: '🔄 Contra Transfer (Cash Deposit & Withdrawal)', action: () => onOpenContraVoucher ? onOpenContraVoucher() : window.dispatchEvent(new CustomEvent('svf-open-contra')) },
                    { label: '📝 Daily Operating Expense Book Voucher', action: () => onOpenExpenseVoucher && onOpenExpenseVoucher() },
                    { label: '💵 Miscellaneous Income Voucher Entry', action: () => onOpenIncomeVoucher && onOpenIncomeVoucher() },
                    { label: '🏛️ Bank Statement & Passbook Reconciliation', action: () => onOpenBankStatements && onOpenBankStatements() },
                    { label: '📈 Financial Statements (P&L, Balance Sheet)', action: () => onOpenFinancialStatements && onOpenFinancialStatements() }
                  ]
                },
                {
                  id: 'logistics',
                  title: '🚚 Logistics & Workshop',
                  color: '#3b82f6',
                  items: [
                    { label: '🚚 Delivery & Assembly Dispatch Pipeline', action: () => onOpenDeliveryPipeline && onOpenDeliveryPipeline() },
                    { label: '🔨 Factory Workshop Made-to-Order Job Cards', action: () => onOpenWorkshopJobCards && onOpenWorkshopJobCards() },
                    { label: '📱 Customer Walk-in Showroom Mobile Portal', action: () => onSelectWorkspace('CUSTOMER_PORTAL') }
                  ]
                },
                {
                  id: 'reports',
                  title: '📊 GST & Ledgers',
                  color: '#8b5cf6',
                  items: [
                    { label: '📑 GST Tax Filing & Sales Tax Reports', action: () => onOpenTaxReport ? onOpenTaxReport() : onSelectWorkspace('TAX_REPORT_GST') },
                    { label: '👥 Customer Ledger Statements & Aging', action: () => onOpenCustomerLedger ? onOpenCustomerLedger() : onSelectWorkspace('CUSTOMER_LEDGER') },
                    { label: '💳 Customer Outstanding Balance Analysis', action: () => onOpenCustomerOutstanding && onOpenCustomerOutstanding() },
                    { label: '⏳ Customer Credit Aging Schedule', action: () => onOpenCustomerCreditAging && onOpenCustomerCreditAging() },
                    { label: '👤 Salesman Commission & Ledger', action: () => onOpenSalesmanLedger && onOpenSalesmanLedger() }
                  ]
                },
                {
                  id: 'settings',
                  title: '⚙️ Settings & System',
                  color: '#f59e0b',
                  items: [
                    { label: '🏢 Showroom Company Profile & Settings', action: () => onOpenCompanyMaster && onOpenCompanyMaster() },
                    { label: '💬 WhatsApp Bulk Marketing Broadcaster', action: () => onOpenWhatsAppBulkSender && onOpenWhatsAppBulkSender() },
                    { label: '☁️ Backup Database Now (Cloud & Local)', action: () => onTriggerManualBackup && onTriggerManualBackup() },
                    { label: '🔄 Database Restore (Disaster Recovery)', action: () => onOpenDatabaseRestore && onOpenDatabaseRestore() },
                    { label: '👥 User Accounts & 51 Permissions Master', action: () => onOpenUserRegistration && onOpenUserRegistration() }
                  ]
                }
              ]
                .filter(cat => {
                  if (!mobileDrawerSearch.trim()) return true;
                  const q = mobileDrawerSearch.toLowerCase();
                  return cat.title.toLowerCase().includes(q) || cat.items.some(i => i.label.toLowerCase().includes(q));
                })
                .map(cat => {
                  const filteredItems = !mobileDrawerSearch.trim()
                    ? cat.items
                    : cat.items.filter(i => i.label.toLowerCase().includes(mobileDrawerSearch.toLowerCase()));
                  const isOpen = Boolean(mobileDrawerSearch.trim()) || openMobileCategory === cat.id;

                  return (
                    <div key={cat.id} style={{ marginBottom: '4px' }}>
                      <button
                        type="button"
                        className={`rd-drawer-category-btn ${isOpen ? 'open' : ''}`}
                        onClick={() => setOpenMobileCategory(openMobileCategory === cat.id ? null : cat.id)}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cat.color }} />
                          <span>{cat.title}</span>
                        </span>
                        <span style={{ fontSize: '10px', color: isOpen ? '#ffffff' : '#94a3b8' }}>
                          {filteredItems.length} items {isOpen ? '▲' : '▼'}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="rd-drawer-subitems-wrap">
                          {filteredItems.map((item, idx) => (
                            <div
                              key={idx}
                              className="rd-drawer-subitem"
                              onClick={() => {
                                setIsMobileDrawerOpen(false);
                                item.action();
                              }}
                            >
                              <span style={{ color: '#22c55e', fontSize: '10px' }}>➔</span>
                              <span>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Footer with Language and Logout */}
            <div className="rd-drawer-footer">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>UI Language:</span>
                <select
                  value={currentLanguage}
                  onChange={e => onSelectLanguage(e.target.value as SupportedLanguage)}
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#ffffff',
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '11px'
                  }}
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
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  onLogout?.();
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>⏻</span>
                <span>Log Out of ERP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Spotlight Search / Open Anything (Ctrl + F / Ctrl + K) */}
      <OpenAnythingModal
        isOpen={isOpenAnythingModalOpen}
        onClose={() => setIsOpenAnythingModalOpen(false)}
        products={products}
        customers={customers}
        bills={bills}
        onOpenSalePos={() => onSelectWorkspace('SALE_POS')}
        onOpenOldBills={() => onSelectWorkspace('SALE_POS')}
        onOpenSaleReturn={onOpenSalesReturn}
        onOpenPurchaseReturn={onOpenPurchaseReturn}
        onOpenExpenseVoucher={onOpenExpenseVoucher}
        onOpenReceiptEntry={onOpenReceiptEntry}
        onOpenCustomerLedger={onOpenCustomerLedger}
        onOpenStockInHand={onOpenStockInHand}
        onOpenDayEndClosing={onOpenDayEndClosing}
        onOpenTaxReport={onOpenTaxReport ? onOpenTaxReport : () => onSelectWorkspace('TAX_REPORT_GST')}
        onOpenFinancialStatements={onOpenFinancialStatements ? onOpenFinancialStatements : () => setIsFinancialStatementsOpen(true)}
        onOpenBankingMaster={onOpenBankingMaster}
        onOpenCompanyMaster={onOpenCompanyMaster}
        onOpenDeliveryPipeline={onOpenDeliveryPipeline}
        onOpenCustomerOutstanding={onOpenCustomerOutstanding}
      />

      {/* Financial Statements Modal (Fallback if not handled by root App) */}
      {!onOpenFinancialStatements && (
        <Suspense fallback={null}>
          <FinancialStatementsModal
            isOpen={isFinancialStatementsOpen}
            onClose={() => setIsFinancialStatementsOpen(false)}
          />
        </Suspense>
      )}
    </>
  );
}
