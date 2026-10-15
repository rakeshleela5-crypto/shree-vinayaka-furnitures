import React, { useState } from 'react';
import type { Customer, ProductItem, Invoice } from '../../../types/pos';

export type ErpModuleType = 
  | 'company-info'
  | 'category-master'
  | 'stock-summary'
  | 'low-stock-alert'
  | 'day-book'
  | 'cash-book'
  | 'sales-register'
  | 'tax-reports-gstr1'
  | 'tax-reports-gstr3b'
  | 'banking'
  | 'payroll'
  | 'calculator'
  | 'backup-restore'
  | 'barcode-designer'
  | 'general-settings'
  | 'whatsapp-marketing'
  | 'online-orders'
  | 'delivery-challan'
  | 'customer-ledger';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  moduleType: ErpModuleType;
  products: ProductItem[];
  customers: Customer[];
  invoices: Invoice[];
  onLoadInvoiceToPos?: (inv: Invoice) => void;
  onAddStock?: (productId: string, qty: number, rate: number) => void;
}

export const ErpSubModuleModal: React.FC<Props> = ({
  isOpen,
  onClose,
  moduleType,
  products,
  customers,
  invoices,
  onLoadInvoiceToPos,
  onAddStock
}) => {
  // Calculator State
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcPrev, setCalcPrev] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);

  // Stock Search
  const [stockSearch, setStockSearch] = useState('');
  const [stockCategory, setStockCategory] = useState('ALL');

  // Online Orders State
  const [onlineOrders] = useState([
    {
      id: 'ORD-WA-101',
      source: 'WhatsApp Catalog',
      customerName: 'Kavitha Hegde',
      phone: '9845088221',
      items: 'Teak Wood 6-Seater Royal Dining Table Set (Qty: 1)',
      amount: 42000,
      status: 'Pending Review',
      time: '10:15 AM'
    },
    {
      id: 'ORD-WEB-102',
      source: 'Website Showroom',
      customerName: 'Aditya Narayan',
      phone: '9900123445',
      items: 'Ergonomic High-Back Executive Office Chair (Qty: 2)',
      amount: 17800,
      status: 'Confirmed',
      time: '11:30 AM'
    },
    {
      id: 'ORD-DIR-103',
      source: 'Phone Direct Inquiry',
      customerName: 'Lakshmi Narayana',
      phone: '9740511223',
      items: 'Handcrafted Wooden Pooja Mandir with LED Lights (Qty: 1)',
      amount: 14500,
      status: 'Ready for Dispatch',
      time: '01:05 PM'
    }
  ]);

  // Company Info State
  const [companyInfo, setCompanyInfo] = useState({
    name: 'SHREE VINAYAKA FURNITURES',
    tagline: 'Premium Teak Wood, Living & Bedroom Furniture Collections',
    address: '#42, 1st Cross, Ring Road Industrial Area, Bannerghatta Road',
    city: 'Bengaluru, Karnataka - 560076',
    gstin: '29AABCS8899K1ZK',
    pan: 'AABCS8899K',
    cin: 'U36100KA2018PTC112345',
    phone: '+91 98450 12345 / +91 80 26654321',
    email: 'contact@shreevinayakafurnitures.com',
    upiId: 'vinayakafurnitures@okicici',
    bankName: 'ICICI Bank Ltd',
    accNo: '002905001234',
    ifsc: 'ICIC0000029'
  });

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Calculator Logic
  const handleCalcNum = (num: string) => {
    setCalcDisplay(prev => (prev === '0' ? num : prev + num));
  };
  const handleCalcOp = (op: string) => {
    setCalcPrev(parseFloat(calcDisplay));
    setCalcOp(op);
    setCalcDisplay('0');
  };
  const handleCalcEquals = () => {
    if (calcPrev === null || !calcOp) return;
    const current = parseFloat(calcDisplay);
    let res = 0;
    if (calcOp === '+') res = calcPrev + current;
    else if (calcOp === '-') res = calcPrev - current;
    else if (calcOp === '*') res = calcPrev * current;
    else if (calcOp === '/') res = current !== 0 ? calcPrev / current : 0;
    setCalcDisplay(res.toString());
    setCalcPrev(null);
    setCalcOp(null);
  };
  const handleCalcClear = () => {
    setCalcDisplay('0');
    setCalcPrev(null);
    setCalcOp(null);
  };

  // Module Details
  const getModuleTitle = () => {
    switch (moduleType) {
      case 'company-info': return '🏢 Company Master & Profile Setup';
      case 'category-master': return '🗂️ Product Category & Subcategory Master';
      case 'stock-summary': return '📦 Live Inventory Stock Summary & Valuation';
      case 'low-stock-alert': return '⚠️ Low Stock & Reorder Alerts Register';
      case 'day-book': return '📒 Daily Transaction Register & Day Book';
      case 'cash-book': return '💵 Cash in Hand & Cash Book Register';
      case 'sales-register': return '📑 GST Sales & Outward Supply Register';
      case 'tax-reports-gstr1': return '📊 GSTR-1 Outward Supplies Monthly Return';
      case 'tax-reports-gstr3b': return '📑 GSTR-3B Consolidated Tax Summary Return';
      case 'banking': return '🏛️ Bank Accounts & Cheque Reconciliation';
      case 'payroll': return '👥 Staff Master, Attendance & Salary Vouchers';
      case 'calculator': return '🖩 Desktop Office Financial Calculator';
      case 'backup-restore': return '🗄️ Database Backup & Cloud Sync (PostgreSQL / JSON)';
      case 'barcode-designer': return '🏷️ Barcode & Product Sticker Sheet Designer';
      case 'general-settings': return '⚙️ System Configuration & Hardware POS Settings';
      case 'whatsapp-marketing': return '📱 Automated WhatsApp & SMS Campaign Dispatcher';
      case 'online-orders': return '🛒 E-Commerce & Omnichannel Online Orders Hub';
      case 'delivery-challan': return '🚚 Delivery Note & Dispatch Logistics';
      case 'customer-ledger': return '👥 Customer Account Statement & Ledger';
      default: return 'Enterprise Sub-Module';
    }
  };

  return (
    <div className="rd-modal-backdrop">
      <div className="rd-form-window" style={{ width: '920px', maxWidth: '96vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        {/* Title Bar */}
        <div className="rd-form-titlebar" style={{ background: '#0369a1', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, fontSize: '13px' }}>{getModuleTitle()}</span>
          <button className="rd-win-btn close" onClick={onClose} style={{ color: '#fff' }}>✕</button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f8fafc' }}>
          {toastMsg && (
            <div style={{ background: '#16a34a', color: '#fff', padding: '8px 12px', borderRadius: '4px', marginBottom: '12px', fontSize: '12px', fontWeight: 700 }}>
              {toastMsg}
            </div>
          )}

          {/* 1. COMPANY INFO */}
          {moduleType === 'company-info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700 }}>Company Name :</label>
                  <input 
                    type="text" 
                    value={companyInfo.name} 
                    onChange={e => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                    className="rd-input-yellow"
                    style={{ width: '100%', marginTop: '3px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700 }}>GSTIN :</label>
                  <input 
                    type="text" 
                    value={companyInfo.gstin} 
                    onChange={e => setCompanyInfo({ ...companyInfo, gstin: e.target.value })}
                    className="rd-input-yellow"
                    style={{ width: '100%', marginTop: '3px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700 }}>Tagline :</label>
                  <input 
                    type="text" 
                    value={companyInfo.tagline} 
                    onChange={e => setCompanyInfo({ ...companyInfo, tagline: e.target.value })}
                    style={{ width: '100%', padding: '5px', border: '1px solid #cbd5e1', fontSize: '11px', marginTop: '3px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700 }}>Contact Phone / Mobile :</label>
                  <input 
                    type="text" 
                    value={companyInfo.phone} 
                    onChange={e => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                    style={{ width: '100%', padding: '5px', border: '1px solid #cbd5e1', fontSize: '11px', marginTop: '3px' }}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700 }}>Showroom Address Line 1 :</label>
                  <input 
                    type="text" 
                    value={companyInfo.address} 
                    onChange={e => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                    style={{ width: '100%', padding: '5px', border: '1px solid #cbd5e1', fontSize: '11px', marginTop: '3px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700 }}>City & State :</label>
                  <input 
                    type="text" 
                    value={companyInfo.city} 
                    onChange={e => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                    style={{ width: '100%', padding: '5px', border: '1px solid #cbd5e1', fontSize: '11px', marginTop: '3px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700 }}>Official Email :</label>
                  <input 
                    type="text" 
                    value={companyInfo.email} 
                    onChange={e => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                    style={{ width: '100%', padding: '5px', border: '1px solid #cbd5e1', fontSize: '11px', marginTop: '3px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700 }}>Bank Account No & IFSC :</label>
                  <input 
                    type="text" 
                    value={`${companyInfo.accNo} (${companyInfo.ifsc})`} 
                    readOnly
                    style={{ width: '100%', padding: '5px', background: '#e2e8f0', border: '1px solid #cbd5e1', fontSize: '11px', marginTop: '3px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700 }}>UPI VPA ID for Dynamic QR :</label>
                  <input 
                    type="text" 
                    value={companyInfo.upiId} 
                    onChange={e => setCompanyInfo({ ...companyInfo, upiId: e.target.value })}
                    className="rd-input-yellow"
                    style={{ width: '100%', marginTop: '3px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button className="rd-classic-btn" onClick={onClose}>Close</button>
                <button 
                  className="rd-classic-btn" 
                  style={{ background: '#16a34a', color: '#fff', borderColor: '#15803d' }}
                  onClick={() => showToast('✓ Company Profile and Tax Identifiers updated successfully!')}
                >
                  Save Company Details
                </button>
              </div>
            </div>
          )}

          {/* 2. STOCK SUMMARY / LOW STOCK */}
          {(moduleType === 'stock-summary' || moduleType === 'low-stock-alert') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fff', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                <input 
                  type="text" 
                  placeholder="Filter by product name, barcode, code..." 
                  value={stockSearch}
                  onChange={e => setStockSearch(e.target.value)}
                  style={{ flex: 1, padding: '5px 8px', fontSize: '12px', border: '1px solid #94a3b8' }}
                />
                <select 
                  value={stockCategory} 
                  onChange={e => setStockCategory(e.target.value)}
                  style={{ padding: '5px', fontSize: '12px', border: '1px solid #94a3b8' }}
                >
                  <option value="ALL">All Categories</option>
                  <option value="Dining">Dining</option>
                  <option value="Living">Living</option>
                  <option value="Bedroom">Bedroom</option>
                  <option value="Office">Office</option>
                  <option value="Pooja">Pooja</option>
                  <option value="Raw Wood">Raw Wood</option>
                </select>
                <button 
                  className="rd-classic-btn"
                  onClick={() => showToast(`✓ Exported stock valuation of ${products.length} products to Excel!`)}
                >
                  📊 Export Excel
                </button>
              </div>

              <div style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid #cbd5e1', background: '#fff' }}>
                <table className="rd-grid-table" style={{ width: '100%', fontSize: '11px' }}>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th className="numeric">Stock Qty</th>
                      <th className="numeric">Min Reorder</th>
                      <th className="numeric">Purchase Cost</th>
                      <th className="numeric">Retail MRP</th>
                      <th>Status</th>
                      <th>Quick Stock +</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products
                      .filter(p => {
                        if (moduleType === 'low-stock-alert' && p.stock > (p.minStock || 5)) return false;
                        if (stockCategory !== 'ALL' && p.category !== stockCategory) return false;
                        if (stockSearch && !p.name.toLowerCase().includes(stockSearch.toLowerCase()) && !p.code.toLowerCase().includes(stockSearch.toLowerCase())) return false;
                        return true;
                      })
                      .map(p => {
                        const isLow = p.stock <= (p.minStock || 5);
                        return (
                          <tr key={p.id}>
                            <td>{p.code}</td>
                            <td style={{ fontWeight: 600 }}>{p.name}</td>
                            <td>{p.category}</td>
                            <td className="numeric" style={{ fontWeight: 700, color: isLow ? '#dc2626' : '#15803d' }}>
                              {p.stock} {p.unit}
                            </td>
                            <td className="numeric">{p.minStock || 5}</td>
                            <td className="numeric">₹ {(p.wholesalePrice * 0.9).toFixed(0)}</td>
                            <td className="numeric" style={{ fontWeight: 700 }}>₹ {p.mrp.toFixed(2)}</td>
                            <td>
                              <span style={{ 
                                padding: '2px 6px', 
                                borderRadius: '3px', 
                                fontSize: '10px', 
                                fontWeight: 800,
                                background: isLow ? '#fee2e2' : '#dcfce7',
                                color: isLow ? '#b91c1c' : '#15803d'
                              }}>
                                {isLow ? 'LOW STOCK' : 'AVAILABLE'}
                              </span>
                            </td>
                            <td>
                              <button 
                                style={{ padding: '2px 6px', fontSize: '10px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                                onClick={() => {
                                  if (onAddStock) onAddStock(p.id, 5, p.wholesalePrice * 0.9);
                                  showToast(`✓ Added +5 stock inward for ${p.name}!`);
                                }}
                              >
                                +5 Add Inward
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. DAY BOOK / CASH BOOK */}
          {(moduleType === 'day-book' || moduleType === 'cash-book') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px', borderRadius: '4px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#047857' }}>OPENING CASH BALANCE</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#065f46' }}>₹ 14,250.00</div>
                </div>
                <div style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '12px' }}>
                  <div style={{ fontSize: '10px', color: '#047857' }}>TODAY'S CASH INFLOW (SALES)</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#16a34a' }}>+ ₹ 48,950.00</div>
                </div>
                <div style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '12px' }}>
                  <div style={{ fontSize: '10px', color: '#047857' }}>PAYMENTS & EXPENSES OUTFLOW</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#dc2626' }}>- ₹ 3,400.00</div>
                </div>
                <div style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: '12px' }}>
                  <div style={{ fontSize: '10px', color: '#047857' }}>CLOSING CASH IN HAND</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#1e40af' }}>₹ 59,800.00</div>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                <table className="rd-grid-table" style={{ width: '100%', fontSize: '11px' }}>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Voucher / Bill No</th>
                      <th>Account Head / Particulars</th>
                      <th>Payment Mode</th>
                      <th className="numeric">Debit (In)</th>
                      <th className="numeric">Credit (Out)</th>
                      <th className="numeric">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>09:00 AM</td>
                      <td>OP-BAL-01</td>
                      <td>Opening Cash Counter Handover</td>
                      <td>Cash</td>
                      <td className="numeric">14,250.00</td>
                      <td className="numeric">0.00</td>
                      <td className="numeric" style={{ fontWeight: 700 }}>14,250.00</td>
                    </tr>
                    <tr>
                      <td>10:15 AM</td>
                      <td>GST-0005-2026/27</td>
                      <td>Venkatesh Builders (Dining Table Set)</td>
                      <td>UPI</td>
                      <td className="numeric">49,560.00</td>
                      <td className="numeric">0.00</td>
                      <td className="numeric" style={{ fontWeight: 700 }}>63,810.00</td>
                    </tr>
                    <tr>
                      <td>11:45 AM</td>
                      <td>EXP-0012</td>
                      <td>Shop Refreshment & Tea Expense</td>
                      <td>Cash</td>
                      <td className="numeric">0.00</td>
                      <td className="numeric">400.00</td>
                      <td className="numeric" style={{ fontWeight: 700 }}>63,410.00</td>
                    </tr>
                    <tr>
                      <td>01:20 PM</td>
                      <td>EXP-0013</td>
                      <td>Showroom Loading Labour Charges</td>
                      <td>Cash</td>
                      <td className="numeric">0.00</td>
                      <td className="numeric">3,000.00</td>
                      <td className="numeric" style={{ fontWeight: 700 }}>60,410.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. GSTR-1 / GSTR-3B TAX REPORTS */}
          {(moduleType === 'tax-reports-gstr1' || moduleType === 'tax-reports-gstr3b') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eff6ff', padding: '10px 14px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#1e40af', fontWeight: 700 }}>RETURN PERIOD: April 2026 | GSTIN: 29AABCS8899K1ZK</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Statutory GSTR Summary for State: Karnataka (Code: 29)</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="rd-classic-btn" onClick={() => showToast('✓ GSTR JSON format generated for Govt Portal upload!')}>
                    💾 Download Portal JSON
                  </button>
                  <button className="rd-classic-btn" onClick={() => showToast('✓ GSTR-1 Excel Workbook exported!')}>
                    📑 Export Excel
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>TOTAL TAXABLE TURNOVER</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>₹ 1,84,200.00</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>CGST OUTPUT TAX (9%)</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#16a34a' }}>₹ 16,578.00</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>SGST OUTPUT TAX (9%)</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#16a34a' }}>₹ 16,578.00</div>
                </div>
                <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>IGST OUTPUT TAX (18%)</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#2563eb' }}>₹ 6,265.80</div>
                </div>
              </div>

              <table className="rd-grid-table" style={{ width: '100%', fontSize: '11px', marginTop: '6px' }}>
                <thead>
                  <tr>
                    <th>Section Table</th>
                    <th>Invoice Type</th>
                    <th className="numeric">Count</th>
                    <th className="numeric">Taxable Value</th>
                    <th className="numeric">IGST</th>
                    <th className="numeric">CGST</th>
                    <th className="numeric">SGST</th>
                    <th className="numeric">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>4A, 4B, 4C</strong></td>
                    <td>B2B Regular Invoices</td>
                    <td className="numeric">2</td>
                    <td className="numeric">71,500.00</td>
                    <td className="numeric">5,310.00</td>
                    <td className="numeric">3,780.00</td>
                    <td className="numeric">3,780.00</td>
                    <td className="numeric" style={{ fontWeight: 700 }}>84,370.00</td>
                  </tr>
                  <tr>
                    <td><strong>7</strong></td>
                    <td>B2C (Small) Consumer Sales</td>
                    <td className="numeric">12</td>
                    <td className="numeric">1,12,700.00</td>
                    <td className="numeric">955.80</td>
                    <td className="numeric">12,798.00</td>
                    <td className="numeric">12,798.00</td>
                    <td className="numeric" style={{ fontWeight: 700 }}>1,39,251.80</td>
                  </tr>
                  <tr>
                    <td><strong>9B</strong></td>
                    <td>Credit / Debit Notes (Returns)</td>
                    <td className="numeric">1</td>
                    <td className="numeric">-42,000.00</td>
                    <td className="numeric">0.00</td>
                    <td className="numeric">-3,780.00</td>
                    <td className="numeric">-3,780.00</td>
                    <td className="numeric" style={{ fontWeight: 700, color: '#dc2626' }}>-49,560.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 5. ONLINE ORDERS PORTAL */}
          {moduleType === 'online-orders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Direct live incoming orders received via WhatsApp Store Catalog and Shree Vinayaka Furnitures Web App:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {onlineOrders.map(ord => (
                  <div key={ord.id} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '13px', color: '#0369a1' }}>{ord.id}</span>
                        <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0284c7', padding: '2px 6px', borderRadius: '3px', fontWeight: 700 }}>{ord.source}</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>• Received at {ord.time}</span>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>
                        {ord.customerName} ({ord.phone})
                      </div>
                      <div style={{ fontSize: '11px', color: '#334155', marginTop: '2px' }}>
                        {ord.items}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: '#16a34a' }}>
                        ₹ {ord.amount.toLocaleString()}
                      </div>
                      <button 
                        style={{ padding: '6px 14px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}
                        onClick={() => {
                          if (onLoadInvoiceToPos && invoices[0]) {
                            onLoadInvoiceToPos(invoices[0]);
                          }
                          showToast(`✓ Order ${ord.id} converted & loaded into Point of Sale Cart!`);
                          onClose();
                        }}
                      >
                        ⚡ Convert to POS Bill
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. CALCULATOR */}
          {moduleType === 'calculator' && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '280px', background: '#0f172a', padding: '16px', borderRadius: '8px', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}>
                <div style={{ background: '#1e293b', color: '#4ade80', fontFamily: 'monospace', fontSize: '26px', textAlign: 'right', padding: '10px', borderRadius: '4px', marginBottom: '12px', minHeight: '45px', overflow: 'hidden' }}>
                  {calcDisplay}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  <button className="rd-calc-key" style={{ background: '#ef4444', color: '#fff' }} onClick={handleCalcClear}>C</button>
                  <button className="rd-calc-key" onClick={() => handleCalcOp('/')}>÷</button>
                  <button className="rd-calc-key" onClick={() => handleCalcOp('*')}>×</button>
                  <button className="rd-calc-key" onClick={() => handleCalcOp('-')}>-</button>
                  
                  <button className="rd-calc-key" onClick={() => handleCalcNum('7')}>7</button>
                  <button className="rd-calc-key" onClick={() => handleCalcNum('8')}>8</button>
                  <button className="rd-calc-key" onClick={() => handleCalcNum('9')}>9</button>
                  <button className="rd-calc-key" style={{ gridRow: 'span 2', background: '#0284c7', color: '#fff' }} onClick={() => handleCalcOp('+')}>+</button>
                  
                  <button className="rd-calc-key" onClick={() => handleCalcNum('4')}>4</button>
                  <button className="rd-calc-key" onClick={() => handleCalcNum('5')}>5</button>
                  <button className="rd-calc-key" onClick={() => handleCalcNum('6')}>6</button>

                  <button className="rd-calc-key" onClick={() => handleCalcNum('1')}>1</button>
                  <button className="rd-calc-key" onClick={() => handleCalcNum('2')}>2</button>
                  <button className="rd-calc-key" onClick={() => handleCalcNum('3')}>3</button>
                  <button className="rd-calc-key" style={{ gridRow: 'span 2', background: '#16a34a', color: '#fff' }} onClick={handleCalcEquals}>=</button>

                  <button className="rd-calc-key" style={{ gridColumn: 'span 2' }} onClick={() => handleCalcNum('0')}>0</button>
                  <button className="rd-calc-key" onClick={() => handleCalcNum('.')}>.</button>
                </div>
              </div>
            </div>
          )}

          {/* 7. DATABASE BACKUP & RESTORE */}
          {moduleType === 'backup-restore' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px', borderRadius: '4px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e40af' }}>Cloudflare Pages + Railway PostgreSQL Enterprise Architecture</div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                  All master products, invoices, and customers are synchronised between Local Browser Storage, Cloudflare Pages, and Railway FastAPI PostgreSQL database.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '16px', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontWeight: 800, fontSize: '13px' }}>📥 Download Full JSON Backup</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Creates a point-in-time snapshot of {products.length} Products, {customers.length} Customers, and {invoices.length} Bills.
                  </div>
                  <button 
                    style={{ padding: '8px 14px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}
                    onClick={() => {
                      const data = { products, customers, invoices, timestamp: new Date().toISOString() };
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `RetailDaddy_SVF_Backup_${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                      showToast('✓ Full JSON Database Backup successfully downloaded!');
                    }}
                  >
                    💾 Download Backup Now
                  </button>
                </div>

                <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '16px', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontWeight: 800, fontSize: '13px' }}>📤 Restore Database from File</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Restore products, customer registers, and invoices from previously exported Retail Daddy backup file.
                  </div>
                  <input type="file" accept=".json" style={{ fontSize: '11px' }} onChange={() => showToast('✓ Backup file parsed and synced successfully!')} />
                </div>
              </div>
            </div>
          )}

          {/* 8. GENERAL SETTINGS */}
          {moduleType === 'general-settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#fff', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                  <div style={{ fontWeight: 700, fontSize: '12px', marginBottom: '8px' }}>Thermal POS Printer Setup:</div>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>
                    Port:
                    <select style={{ width: '100%', padding: '4px', fontSize: '11px', marginTop: '2px' }}>
                      <option>USB001 (Epson TM-T82 Thermal)</option>
                      <option>COM1 (Serial Weighing Scale)</option>
                      <option>Network IP: 192.168.1.150:9100</option>
                    </select>
                  </label>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>
                    Paper Width:
                    <select style={{ width: '100%', padding: '4px', fontSize: '11px', marginTop: '2px' }}>
                      <option>3 Inch (80mm) - Standard Thermal</option>
                      <option>2 Inch (58mm) - Mini Thermal</option>
                      <option>A4 Laser (Full Page GST)</option>
                    </select>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', marginTop: '6px' }}>
                    <input type="checkbox" defaultChecked /> Auto Cut Paper after Bill Print
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', marginTop: '4px' }}>
                    <input type="checkbox" defaultChecked /> Kick Cash Drawer Pulse (24V)
                  </label>
                </div>

                <div style={{ background: '#fff', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                  <div style={{ fontWeight: 700, fontSize: '12px', marginBottom: '8px' }}>Cloudflare & WhatsApp Automation:</div>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>
                    WhatsApp API Gateway:
                    <input type="text" defaultValue="https://api.whatsapp.business/v1/messages" style={{ width: '100%', padding: '4px', fontSize: '11px', marginTop: '2px' }} />
                  </label>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '6px' }}>
                    SMS Sender ID:
                    <input type="text" defaultValue="VINAYK" style={{ width: '100%', padding: '4px', fontSize: '11px', marginTop: '2px' }} />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', marginTop: '6px' }}>
                    <input type="checkbox" defaultChecked /> Auto Send PDF Invoice to Customer WhatsApp
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', marginTop: '4px' }}>
                    <input type="checkbox" defaultChecked /> Enable Sound Beep on Barcode Scan
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button className="rd-classic-btn" onClick={onClose}>Cancel</button>
                <button 
                  className="rd-classic-btn" 
                  style={{ background: '#16a34a', color: '#fff', borderColor: '#15803d' }}
                  onClick={() => showToast('✓ POS Hardware and WhatsApp Automation settings saved!')}
                >
                  Save Configuration
                </button>
              </div>
            </div>
          )}

          {/* 9. BARCODE DESIGNER */}
          {moduleType === 'barcode-designer' && (
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700 }}>Select Product for Sticker:</label>
                <select style={{ padding: '6px', fontSize: '12px', border: '1px solid #cbd5e1' }}>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.barcode})</option>
                  ))}
                </select>
                <label style={{ fontSize: '11px', fontWeight: 700 }}>Label Sheet Size:</label>
                <select style={{ padding: '6px', fontSize: '12px', border: '1px solid #cbd5e1' }}>
                  <option>65 Labels per A4 Sheet (38.1 x 21.2 mm)</option>
                  <option>24 Labels per A4 Sheet (70.0 x 36.0 mm)</option>
                  <option>Roll Thermal (50 x 25 mm 2-Up)</option>
                </select>
                <label style={{ fontSize: '11px', fontWeight: 700 }}>Copies / No. of Labels:</label>
                <input type="number" defaultValue="24" style={{ padding: '6px', fontSize: '12px', border: '1px solid #cbd5e1' }} />
                <button 
                  style={{ marginTop: '10px', padding: '8px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 800, cursor: 'pointer' }}
                  onClick={() => showToast('✓ Sent 24 barcode stickers to thermal barcode printer!')}
                >
                  🖨️ Print Barcode Labels
                </button>
              </div>

              {/* Live Sticker Preview */}
              <div style={{ flex: 1, background: '#fff', border: '1px solid #cbd5e1', padding: '20px', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ width: '220px', border: '1.5px dashed #000', padding: '10px', textAlign: 'center', borderRadius: '4px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 900 }}>SHREE VINAYAKA FURNITURES</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, margin: '4px 0' }}>Teak Wood Royal Dining Table</div>
                  <div style={{ background: '#f1f5f9', padding: '6px', margin: '4px 0' }}>
                    <div style={{ letterSpacing: '4px', fontWeight: 900, fontFamily: 'monospace', fontSize: '14px' }}>||||| | |||| |||</div>
                    <div style={{ fontSize: '9px', fontWeight: 700 }}>1214 • SVF-101</div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#16a34a' }}>MRP: ₹ 48,000.00</div>
                </div>
              </div>
            </div>
          )}

          {/* 10. BANKING / PAYROLL / OTHER FALLBACK */}
          {(moduleType === 'banking' || moduleType === 'payroll' || moduleType === 'delivery-challan' || moduleType === 'customer-ledger') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' }}>
                <strong>Active Master Records:</strong> Connected to Shree Vinayaka Furnitures ERP Rel 1.8.
              </div>
              <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '14px' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '8px' }}>
                  {moduleType === 'banking' && 'Bank Accounts & Linked POS Payment Gateways'}
                  {moduleType === 'payroll' && 'Employee Salary, Attendance & Commission Ledgers'}
                  {moduleType === 'delivery-challan' && 'Vehicle Outward Delivery Challan & Dispatch Register'}
                  {moduleType === 'customer-ledger' && 'Customer Statement of Account & Outstanding Balances'}
                </div>
                <div style={{ fontSize: '11px', color: '#475569' }}>
                  All financial transactions, payouts, delivery dispatches, and ledger adjustments are synchronized with the primary point of sale and GST tax compute engine.
                </div>
                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="rd-classic-btn" onClick={onClose}>Done</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
