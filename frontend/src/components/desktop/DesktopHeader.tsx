import type { ActiveWorkspace } from '../../types/retailDaddy';

interface DesktopHeaderProps {
  activeWorkspace: ActiveWorkspace;
  onSelectWorkspace: (ws: ActiveWorkspace) => void;
  isAdmin: boolean;
  onToggleAdmin: () => void;
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
}

export function DesktopHeader({
  activeWorkspace,
  onSelectWorkspace,
  isAdmin,
  onToggleAdmin,
  onOpenCompanyMaster,
  onOpenBankingMaster,
  onOpenPrefixSuffix,
  onOpenOutstandingReport,
  onOpenReceiptEntry,
  onOpenProductBulkEditor,
  onOpenSalePriceEditor,
  onOpenSalesmanPayment,
  onOpenSalesmanLedger,
  onOpenTerminalSetting
}: DesktopHeaderProps) {
  return (
    <>
      {/* 1. TOP WINDOWS TITLEBAR */}
      <div className="rd-titlebar">
        <div className="rd-titlebar-left">
          <div className="rd-titlebar-app-icon">RD</div>
          <span>
            POS | Raintech Software Limited | Rel 1.6 | Enterprise Edition | Multiuser Mode | Valid Upto : 18-02-2026 | SHREE VINAYAKA FURNITURES | FY : 01-04-2024 - 31-03-2025 |
          </span>
        </div>
        <div className="rd-titlebar-controls">
          <button className="rd-titlebar-btn" title="Minimize">_</button>
          <button className="rd-titlebar-btn" title="Maximize">□</button>
          <button className="rd-titlebar-btn close" title="Close" onClick={() => onSelectWorkspace('DESKTOP_HOME')}>✕</button>
        </div>
      </div>

      {/* 2. TOP MDI MENU BAR */}
      <div className="rd-menubar">
        <span
          className={`rd-menu-item ${activeWorkspace === 'PRODUCT_ADD_SMART' ? 'active' : ''}`}
          onClick={() => onSelectWorkspace('PRODUCT_ADD_SMART')}
        >
          Master Entry
        </span>
        <span
          className="rd-menu-item"
          onClick={onOpenCompanyMaster}
          title="Open Company Master Info [Frame 240]"
          style={{ color: '#0369a1', fontWeight: 'bold' }}
        >
          🏢 Company Info
        </span>
        <span
          className="rd-menu-item"
          onClick={onOpenBankingMaster}
          title="List of Banks, Branch Entry, Bank Accounts Registration [Video 20 Frame 272]"
          style={{ color: '#15803d', fontWeight: 'bold' }}
        >
          🏛️ Banking
        </span>
        <span
          className="rd-menu-item"
          onClick={onOpenPrefixSuffix}
          title="Configure Prefix and Suffix Invoice Code [Video 20 Frame 221]"
          style={{ color: '#4338ca', fontWeight: 'bold' }}
        >
          ⚙️ Prefix & Suffix Code
        </span>
        <span
          className="rd-menu-item"
          onClick={onOpenTerminalSetting}
          title="Hardware Terminal Settings, Printers & Secondary Displays [Video 17 Frame 0065]"
          style={{ color: '#0284c7', fontWeight: 'bold' }}
        >
          🖥️ Terminal Setting
        </span>
        <span
          className="rd-menu-item"
          onClick={onOpenReceiptEntry}
          title="Customer Receipt Entry Voucher [Video 20 Frame 331]"
          style={{ color: '#047857', fontWeight: 'bold' }}
        >
          🧾 Receipt Entry
        </span>
        <span
          className="rd-menu-item"
          onClick={onOpenOutstandingReport}
          title="Outstanding Balance Report [Video 20 Frame 362]"
          style={{ color: '#b91c1c', fontWeight: 'bold' }}
        >
          📊 Outstanding Report
        </span>
        <span
          className="rd-menu-item"
          onClick={onOpenProductBulkEditor}
          title="Product Bulk Editor (Salesman % & Loyalty Points) [Video 19 Frame 275]"
          style={{ color: '#0e7490', fontWeight: 'bold' }}
        >
          📋 Bulk Editor
        </span>
        <span
          className="rd-menu-item"
          onClick={onOpenSalePriceEditor}
          title="Sale Price & Margin Editor [Video 19 Frame 535]"
          style={{ color: '#7c3aed', fontWeight: 'bold' }}
        >
          💲 Price Edit
        </span>
        <span
          className="rd-menu-item"
          onClick={onOpenSalesmanPayment}
          title="Salesman Commission Payout Voucher [Video 19 Frame 345]"
          style={{ color: '#b45309', fontWeight: 'bold' }}
        >
          💵 Salesman Payout
        </span>
        <span
          className="rd-menu-item"
          onClick={onOpenSalesmanLedger}
          title="Salesman Commission Ledger Report [Video 19 Frame 365]"
          style={{ color: '#047857', fontWeight: 'bold' }}
        >
          📜 Salesman Ledger
        </span>
        <span
          className={`rd-menu-item ${activeWorkspace === 'SALE_POS' ? 'active' : ''}`}
          onClick={() => onSelectWorkspace('SALE_POS')}
        >
          Transaction
        </span>
        <span
          className={`rd-menu-item ${activeWorkspace === 'D_SALE_REPORT' ? 'active' : ''}`}
          onClick={() => onSelectWorkspace('D_SALE_REPORT')}
          style={{ color: '#b45309', fontWeight: 'bold' }}
        >
          ⚡ D-Sale Report
        </span>
        <span
          className={`rd-menu-item ${activeWorkspace === 'EXPIRY_REPORT' ? 'active' : ''}`}
          onClick={() => onSelectWorkspace('EXPIRY_REPORT')}
        >
          📅 Item Aging (Expiry)
        </span>
        <span
          className={`rd-menu-item ${activeWorkspace === 'TAX_REPORT_GST' ? 'active' : ''}`}
          onClick={() => onSelectWorkspace('TAX_REPORT_GST')}
        >
          📋 GST Tax Register
        </span>
        <span
          className={`rd-menu-item ${activeWorkspace === 'SALES_INVOICE_REPORT' ? 'active' : ''}`}
          onClick={() => onSelectWorkspace('SALES_INVOICE_REPORT')}
        >
          🧾 Sales Invoices
        </span>
        <span
          className={`rd-menu-item ${activeWorkspace === 'CUSTOMER_LEDGER' ? 'active' : ''}`}
          onClick={() => onSelectWorkspace('CUSTOMER_LEDGER')}
        >
          Customer Outstanding
        </span>
        <span
          className={`rd-menu-item ${activeWorkspace === 'STOCK_AUDIT' ? 'active' : ''}`}
          onClick={() => onSelectWorkspace('STOCK_AUDIT')}
        >
          Inventory Audit
        </span>
        <span
          className={`rd-menu-item ${activeWorkspace === 'STOCK_IN_HAND' ? 'active' : ''}`}
          onClick={() => onSelectWorkspace('STOCK_IN_HAND')}
        >
          Stock In Hand
        </span>
        <span
          className={`rd-menu-item ${activeWorkspace === 'PETTY_EXPENSES' ? 'active' : ''}`}
          onClick={() => onSelectWorkspace('PETTY_EXPENSES')}
        >
          Expenses
        </span>
        <span
          className={`rd-menu-item ${activeWorkspace === 'BARCODE_DESIGNER' ? 'active' : ''}`}
          onClick={() => onSelectWorkspace('BARCODE_DESIGNER')}
        >
          Barcode
        </span>
        <span className="rd-menu-item" onClick={onToggleAdmin}>
          Role: {isAdmin ? 'Admin (Full)' : 'Cashier (Restricted)'}
        </span>
      </div>

      {/* 3. QUICK ACTION RIBBON */}
      <div className="rd-ribbon">
        <div className="rd-ribbon-left">
          <button
            className={`rd-ribbon-btn gorilla ${activeWorkspace === 'RUBIC_POS' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('RUBIC_POS')}
          >
            <span>🦍</span>
            <span>Gorilla Touch POS</span>
          </button>

          <button
            className={`rd-ribbon-btn ${activeWorkspace === 'PRODUCT_ADD_SMART' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('PRODUCT_ADD_SMART')}
          >
            <span style={{ color: '#16a34a', fontWeight: 'bold' }}>+</span>
            <span>Add Product [Smart]</span>
          </button>

          <button
            className={`rd-ribbon-btn sale-pos ${activeWorkspace === 'SALE_POS' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('SALE_POS')}
          >
            <span>🛒</span>
            <span>Sale POS [F1]</span>
          </button>

          <button
            className="rd-ribbon-btn"
            style={{ borderColor: '#0e7490', color: '#0e7490' }}
            onClick={onOpenProductBulkEditor}
            title="Product Bulk Editor (Commission & Loyalty) [Video 19 Frame 275]"
          >
            <span>📋</span>
            <span>Bulk Editor</span>
          </button>

          <button
            className="rd-ribbon-btn"
            style={{ borderColor: '#7c3aed', color: '#7c3aed' }}
            onClick={onOpenSalePriceEditor}
            title="Sale Price & Margin Editor [Video 19 Frame 535]"
          >
            <span>💲</span>
            <span>Price Edit</span>
          </button>

          <button
            className={`rd-ribbon-btn ${activeWorkspace === 'QUOTATION' ? 'active' : ''}`}
            style={{ borderColor: '#e11d48', color: '#be123c' }}
            onClick={() => onSelectWorkspace('QUOTATION')}
            title="Quotation Module with Product Images & GST Math [Video 17 Frame 0160]"
          >
            <span>📑</span>
            <span>Quotation</span>
          </button>

          <button
            className={`rd-ribbon-btn ${activeWorkspace === 'D_SALE_REPORT' ? 'active' : ''}`}
            style={{ borderColor: '#f59e0b', color: '#b45309' }}
            onClick={() => onSelectWorkspace('D_SALE_REPORT')}
            title="D-Sale Direct Billing Report [Frame 085]"
          >
            <span>⚡</span>
            <span>D-Sale Report</span>
          </button>

          <button
            className={`rd-ribbon-btn ${activeWorkspace === 'EXPIRY_REPORT' ? 'active' : ''}`}
            style={{ borderColor: '#ec4899', color: '#be185d' }}
            onClick={() => onSelectWorkspace('EXPIRY_REPORT')}
          >
            <span>📅</span>
            <span>Item Aging (Expiry)</span>
          </button>

          <button
            className={`rd-ribbon-btn ${activeWorkspace === 'TAX_REPORT_GST' ? 'active' : ''}`}
            style={{ borderColor: '#0284c7', color: '#0369a1' }}
            onClick={() => onSelectWorkspace('TAX_REPORT_GST')}
          >
            <span>📋</span>
            <span>GST Register</span>
          </button>

          <button
            className={`rd-ribbon-btn ${activeWorkspace === 'SALES_INVOICE_REPORT' ? 'active' : ''}`}
            style={{ borderColor: '#7c3aed', color: '#6d28d9' }}
            onClick={() => onSelectWorkspace('SALES_INVOICE_REPORT')}
          >
            <span>🧾</span>
            <span>Invoices</span>
          </button>

          <button
            className={`rd-ribbon-btn rubic ${activeWorkspace === 'RUBIC_POS' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('RUBIC_POS')}
          >
            <span>🎲</span>
            <span>Rubic POS</span>
          </button>

          <button
            className={`rd-ribbon-btn purchase ${activeWorkspace === 'PURCHASE_INWARD' ? 'active' : ''}`}
            onClick={() => onSelectWorkspace('PURCHASE_INWARD')}
          >
            <span>🛍️</span>
            <span>+ Purchase [F2]</span>
          </button>
        </div>

        <div className="rd-ribbon-right">
          <button
            className="rd-ribbon-btn logout"
            onClick={() => onSelectWorkspace('DESKTOP_HOME')}
          >
            <span>⏻</span>
            <span>Desktop</span>
          </button>
        </div>
      </div>
    </>
  );
}
