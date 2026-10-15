import type { ActiveWorkspace } from '../../types/retailDaddy';

interface DesktopHeaderProps {
  activeWorkspace: ActiveWorkspace;
  onSelectWorkspace: (ws: ActiveWorkspace) => void;
  isAdmin: boolean;
  onToggleAdmin: () => void;
}

export function DesktopHeader({
  activeWorkspace,
  onSelectWorkspace,
  isAdmin,
  onToggleAdmin
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
          className={`rd-menu-item ${activeWorkspace === 'SALE_POS' ? 'active' : ''}`}
          onClick={() => onSelectWorkspace('SALE_POS')}
        >
          Transaction
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
