import type { ActiveWorkspace, Product } from '../../types/retailDaddy';

interface DesktopHomeViewProps {
  products: Product[];
  onOpenWorkspace: (ws: ActiveWorkspace) => void;
}

export function DesktopHomeView({ products, onOpenWorkspace }: DesktopHomeViewProps) {
  return (
    <div style={{
      flex: 1,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px',
      background: 'radial-gradient(circle at 50% 30%, #a3e635 0%, #65a30d 100%)',
      overflow: 'hidden'
    }}>
      {/* Central Branding (from frame 40/114) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '20px'
      }}>
        <div>
          <h1 style={{
            fontSize: '56px',
            fontWeight: '900',
            color: '#0f172a',
            margin: 0,
            letterSpacing: '-0.02em',
            textShadow: '0 2px 4px rgba(255,255,255,0.4)'
          }}>
            Retail Daddy
          </h1>
          <div style={{
            fontSize: '24px',
            fontWeight: '800',
            color: '#1e293b',
            letterSpacing: '0.15em'
          }}>
            VERSION 1.6 ENTERPRISE
          </div>
          <div style={{
            marginTop: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#064e3b'
          }}>
            Shree Vinayaka Furnitures • Fast POS & ERP Billing Solution
          </div>
        </div>

        {/* QR Code (from frame 40) */}
        <div style={{
          background: '#ffffff',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
          textAlign: 'center'
        }}>
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=https://srivinayakafurnitures.pages.dev"
            alt="Mobile Reporting App QR"
            style={{ width: '100px', height: '100px', display: 'block' }}
          />
          <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '4px', color: '#0f172a' }}>
            Mobile Reporting Sync
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        margin: '40px 0'
      }}>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #22c55e',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease'
          }}
          onClick={() => onOpenWorkspace('PRODUCT_ADD_SMART')}
        >
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>📦</div>
          <div style={{ fontWeight: '900', fontSize: '15px', color: '#0f172a' }}>Product Add Smart</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Video 24 rapid keyboard catalog entry & 25-column manager.
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#16a34a', marginTop: '8px' }}>
            {products.length} Products Loaded →
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #f472b6',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease'
          }}
          onClick={() => onOpenWorkspace('SALE_POS')}
        >
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🛒</div>
          <div style={{ fontWeight: '900', fontSize: '15px', color: '#0f172a' }}>Sale POS [F1]</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Wholesale/Retail modes (Ctrl+S), Net Pay, Quick Pay [F4].
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#db2777', marginTop: '8px' }}>
            Open Point of Sale →
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #38bdf8',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease'
          }}
          onClick={() => onOpenWorkspace('STOCK_IN_HAND')}
        >
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>📋</div>
          <div style={{ fontWeight: '900', fontSize: '15px', color: '#0f172a' }}>Stock in Hand</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Video 24 Frame 245: Godown & Rack storage with pink expiry alerts.
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0284c7', marginTop: '8px' }}>
            View Stock Ledger →
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #ca8a04',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease'
          }}
          onClick={() => onOpenWorkspace('CUSTOMER_LEDGER')}
        >
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>👥</div>
          <div style={{ fontWeight: '900', fontSize: '15px', color: '#0f172a' }}>Customer Outstanding</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Video 07 customer debt analysis and 1-click payment vouchers.
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#a16207', marginTop: '8px' }}>
            Manage Receivables →
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #8b5cf6',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease'
          }}
          onClick={() => onOpenWorkspace('BARCODE_DESIGNER')}
        >
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏷️</div>
          <div style={{ fontWeight: '900', fontSize: '15px', color: '#0f172a' }}>Barcode Label Printer</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Thermal sticker templates (50x25mm) and batch copy printing.
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#7c3aed', marginTop: '8px' }}>
            Design Stickers →
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #ef4444',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease'
          }}
          onClick={() => onOpenWorkspace('PETTY_EXPENSES')}
        >
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>💸</div>
          <div style={{ fontWeight: '900', fontSize: '15px', color: '#0f172a' }}>Petty Expenses</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Video 05 daily petty cash vouchers (Fuel, Freight, Tea).
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#dc2626', marginTop: '8px' }}>
            Log Expense →
          </div>
        </div>
      </div>

      {/* Bottom Information Bar */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(4px)',
        padding: '8px 16px',
        borderRadius: '6px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#1e293b'
      }}>
        <div>
          🏢 Shree Vinayaka Furnitures | Handcrafted Teak & Solid Wood | GSTIN: 29AAAAA0000A1Z5
        </div>
        <div>
          Licensed to: Raintech Software Limited • 100% Offline-Capable Progressive Web App
        </div>
      </div>
    </div>
  );
}
