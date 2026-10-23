import type { ActiveWorkspace, Product } from '../../types/retailDaddy';

interface DesktopHomeViewProps {
  products: Product[];
  onOpenWorkspace: (ws: ActiveWorkspace) => void;
  onOpenProductImageUpload?: () => void;
  onOpenProductCatalogue?: () => void;
  onOpenWhatsAppBulkSender?: () => void;
  onOpenDecentroBanking?: (tab?: 'accounts' | 'banks' | 'branches' | 'qr' | 'payout' | 'kyb' | 'va' | 'ledger' | 'config' | 'master') => void;
  onOpenCrmLeads?: () => void;
  onOpenCustomerReviews?: () => void;
  onOpenFinancialStatements?: () => void;
  onOpenDayEndClosing?: () => void;
}

export function DesktopHomeView({
  products,
  onOpenWorkspace,
  onOpenProductImageUpload,
  onOpenProductCatalogue,
  onOpenWhatsAppBulkSender,
  onOpenDecentroBanking,
  onOpenCrmLeads,
  onOpenCustomerReviews,
  onOpenFinancialStatements,
  onOpenDayEndClosing
}: DesktopHomeViewProps) {
  return (
    <div style={{
      flex: 1,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 'clamp(12px, 3vw, 24px)',
      background: 'radial-gradient(circle at 50% 30%, #a3e635 0%, #65a30d 100%)',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch'
    }}>
      {/* Central Branding (from frame 40/114) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '10px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ minWidth: '240px', flex: '1 1 300px' }}>
          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 56px)',
            fontWeight: '900',
            color: '#0f172a',
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            textShadow: '0 2px 4px rgba(255,255,255,0.4)'
          }}>
            Shree Vinayaka Furnitures
          </h1>
          <div style={{
            fontSize: 'clamp(14px, 2.5vw, 22px)',
            fontWeight: '800',
            color: '#1e293b',
            letterSpacing: '0.12em',
            marginTop: '4px'
          }}>
            ENTERPRISE ERP 1.6
          </div>
          <div style={{
            marginTop: '6px',
            fontSize: 'clamp(11px, 2vw, 14px)',
            fontWeight: '600',
            color: '#064e3b'
          }}>
            Godrej Interio Channel Partner • Fast POS & ERP Billing Solution
          </div>
        </div>

        {/* QR Code (from frame 40) */}
        <div
          onClick={() => onOpenWorkspace('CUSTOMER_PORTAL')}
          style={{
            background: '#ffffff',
            padding: '12px',
            borderRadius: '10px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
            textAlign: 'center',
            cursor: 'pointer',
            border: '2px solid #b91c1c',
            flexShrink: 0
          }}
          title="Click to Preview Customer Mobile Portal"
        >
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=https://srivinayakafurnitures.pages.dev/?portal=1"
            alt="Customer Mobile Showroom Portal QR"
            style={{ width: '90px', height: '90px', display: 'block' }}
          />
          <div style={{ fontSize: '10px', fontWeight: '900', marginTop: '4px', color: '#b91c1c' }}>
            📱 Customer Mobile Portal
          </div>
          <div style={{ fontSize: '9px', color: '#64748b' }}>
            Scan or Click to Preview
          </div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
        gap: '14px',
        margin: '24px 0'
      }}>
        {/* ⚡ Decentro Financial Engine Quick Launch Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
            border: '2px solid #10b981',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            boxShadow: '0 8px 16px rgba(0,0,0,0.25)',
            transition: 'transform 0.15s ease',
            color: '#ffffff'
          }}
          onClick={() => onOpenDecentroBanking && onOpenDecentroBanking('qr')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '28px' }}>⚡</div>
            <span style={{
              backgroundColor: '#10b981',
              color: '#022c22',
              fontSize: '10px',
              fontWeight: 900,
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              BANKING HUB
            </span>
          </div>
          <div style={{ fontWeight: '900', fontSize: '15px', color: '#ecfdf5' }}>Showroom Unified Banking Hub</div>
          <div style={{ fontSize: '11px', color: '#a7f3d0', marginTop: '4px' }}>
            Store bank accounts master, dynamic UPI collections, instant supplier payouts, KYB & virtual escrows.
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#34d399', marginTop: '8px' }}>
            Open Unified Banking Hub →
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #b91c1c',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease'
          }}
          onClick={() => onOpenWorkspace('CUSTOMER_PORTAL')}
        >
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>📱</div>
          <div style={{ fontWeight: '900', fontSize: '15px', color: '#b91c1c' }}>Customer Mobile Portal</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Walk-in QR scanning view with discounts, specifications, and full 65-item store catalog.
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#b91c1c', marginTop: '8px' }}>
            Launch Customer View ({products.length} Showroom Items) →
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
          <div style={{ fontWeight: '900', fontSize: '15px', color: '#0f172a' }}>Smart QR & Barcode Designer</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Print showroom 75x50mm QR display tags with MRP, discounts, and cashier barcodes.
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#7c3aed', marginTop: '8px' }}>
            Print Showroom Tags →
          </div>
        </div>

        {/* 1. Showroom Catalogue Generator Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #1e40af',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease'
          }}
          onClick={onOpenProductCatalogue}
        >
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🛋️</div>
          <div style={{ fontWeight: '900', fontSize: '15px', color: '#1e40af' }}>Showroom Catalogue</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Generate printable A4 brochures & WhatsApp product showcases with photos, MRP, and offer discounts.
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e40af', marginTop: '8px' }}>
            Open Catalogue Designer →
          </div>
        </div>

        {/* 2. Product Image Upload & Search Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #0284c7',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease'
          }}
          onClick={onOpenProductImageUpload}
        >
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🖼️</div>
          <div style={{ fontWeight: '900', fontSize: '15px', color: '#0369a1' }}>Product Image Manager</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Attach high-res photos via 1-click Google/online search or local disk upload for POS touch billing.
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0284c7', marginTop: '8px' }}>
            Manage Photos ({products.filter(p => p.photo).length}/{products.length}) →
          </div>
        </div>

        {/* 3. WhatsApp Bulk Broadcaster Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #16a34a',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease'
          }}
          onClick={onOpenWhatsAppBulkSender}
        >
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>💬</div>
          <div style={{ fontWeight: '900', fontSize: '15px', color: '#15803d' }}>WhatsApp Broadcaster</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Broadcast new furniture arrivals, festival offers, and payment statements to customer contacts.
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#16a34a', marginTop: '8px' }}>
            Launch Campaign Broadcaster →
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
            Real-time Godown & Rack storage balances with automated stock aging alerts.
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
            Comprehensive customer debt analysis and instant settlement payment vouchers.
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
            Daily petty cash vouchers (Fuel, Freight, Tea, Office & Showroom Maintenance).
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#dc2626', marginTop: '8px' }}>
            Log Expense →
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #ec4899',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease'
          }}
          onClick={() => onOpenWorkspace('EXPIRY_REPORT')}
        >
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>📅</div>
          <div style={{ fontWeight: '900', fontSize: '15px', color: '#0f172a' }}>Item Aging (Expiry)</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            7/15/30/90 days stock aging analysis and slow-moving inventory management.
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#be185d', marginTop: '8px' }}>
            Audit Expiry Dates →
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #0284c7',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease'
          }}
          onClick={() => onOpenWorkspace('TAX_REPORT_GST')}
        >
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>📋</div>
          <div style={{ fontWeight: '900', fontSize: '15px', color: '#0f172a' }}>GST Sales Register</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            HSN item-wise statutory tax audit (CGST/SGST/IGST) with Excel & GSTR-1 export.
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0369a1', marginTop: '8px' }}>
            Generate Tax Return →
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #7c3aed',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease'
          }}
          onClick={() => onOpenWorkspace('SALES_INVOICE_REPORT')}
        >
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🧾</div>
          <div style={{ fontWeight: '900', fontSize: '15px', color: '#0f172a' }}>List of Sales Invoices</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Consolidated bill register filterable by Counter/Terminal, Salesman & Tax mode.
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#6d28d9', marginTop: '8px' }}>
            Browse Invoices →
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #0d9488',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease'
          }}
          onClick={() => onOpenWorkspace('ESTIMATE_DELIVERY')}
        >
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🧮</div>
          <div style={{ fontWeight: '900', fontSize: '15px', color: '#0f172a' }}>Estimate / Delivery Note</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Customer quotation & delivery notes with instant POS bill conversion & WhatsApp dispatch.
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f766e', marginTop: '8px' }}>
            Open Estimates →
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #2563eb',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease'
          }}
          onClick={() => onOpenWorkspace('SALES_REGISTER_BILL_WISE')}
        >
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>📊</div>
          <div style={{ fontWeight: '900', fontSize: '15px', color: '#0f172a' }}>Sales Register (Bill Wise)</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Bill-wise GST breakdowns, date range reporting & automated Excel exports.
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1d4ed8', marginTop: '8px' }}>
            View Register →
          </div>
        </div>

        {/* 🌟 Showroom CRM Leads Pipeline Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease'
          }}
          onClick={onOpenCrmLeads}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '28px' }}>🎯</div>
            <span style={{
              backgroundColor: '#f59e0b',
              color: '#78350f',
              fontSize: '10px',
              fontWeight: 900,
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              SHOWROOM CRM
            </span>
          </div>
          <div style={{ fontWeight: '900', fontSize: '15px', color: '#92400e' }}>CRM Leads & Followups</div>
          <div style={{ fontSize: '11px', color: '#78350f', marginTop: '4px' }}>
            Walk-in & inquiry prospects. 1-Click convert directly into POS Sale Bills or formal Quotations.
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#b45309', marginTop: '8px' }}>
            Manage Showroom Pipeline →
          </div>
        </div>

        {/* 🌟 Post-Delivery Customer Reviews & CSAT Hub Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '2px solid #10b981',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease'
          }}
          onClick={onOpenCustomerReviews}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '28px' }}>⭐</div>
            <span style={{
              backgroundColor: '#10b981',
              color: '#064e3b',
              fontSize: '10px',
              fontWeight: 900,
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              CSAT HUB
            </span>
          </div>
          <div style={{ fontWeight: '900', fontSize: '15px', color: '#065f46' }}>Customer Reviews & CSAT</div>
          <div style={{ fontSize: '11px', color: '#047857', marginTop: '4px' }}>
            Post-delivery satisfaction ratings, assembly feedback tags, and automated customer followups.
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#059669', marginTop: '8px' }}>
            View Delivery Ratings →
          </div>
        </div>

        {/* 🌟 Day Book & Cash Closing Audit Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            border: '2px solid #ef4444',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease'
          }}
          onClick={onOpenDayEndClosing}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '28px' }}>📖</div>
            <span style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 900,
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              DAILY AUDIT
            </span>
          </div>
          <div style={{ fontWeight: '900', fontSize: '15px', color: '#991b1b' }}>Day Book & Cash Closing</div>
          <div style={{ fontSize: '11px', color: '#7f1d1d', marginTop: '4px' }}>
            Daily cash drawer float, counter collections, petty vouchers, and night settlement audit.
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#dc2626', marginTop: '8px' }}>
            Open Day End Closing →
          </div>
        </div>

        {/* 🌟 Financial Statements & Ledgers Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '2px solid #0284c7',
            borderRadius: '8px',
            padding: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s ease'
          }}
          onClick={onOpenFinancialStatements}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '28px' }}>🏛️</div>
            <span style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: 900,
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              ACCOUNTING
            </span>
          </div>
          <div style={{ fontWeight: '900', fontSize: '15px', color: '#0f172a' }}>Financial Statements & P&L</div>
          <div style={{ fontSize: '11px', color: '#334155', marginTop: '4px' }}>
            Real-time Profit & Loss statement, Balance Sheet, and Trial Balance double-entry reconciliation.
          </div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0284c7', marginTop: '8px' }}>
            View Financial Statements →
          </div>
        </div>
      </div>

      {/* Bottom Information Bar */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(4px)',
        padding: '8px 14px',
        borderRadius: '6px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#1e293b'
      }}>
        <div>
          🏢 Shree Vinayaka Furnitures | Handcrafted Teak & Solid Wood | GSTIN: 29AAAAA0000A1Z5
        </div>
        <div>
          Licensed to: Shree Vinayaka Furnitures • Enterprise Cloud & Offline Edition
        </div>
      </div>
    </div>
  );
}
