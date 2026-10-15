import { useState, useMemo } from 'react';
import type { Product } from '../../types/retailDaddy';

interface ExpiryProductReportViewProps {
  products: Product[];
}

export function ExpiryProductReportView({ products }: ExpiryProductReportViewProps) {
  const [fromDate, setFromDate] = useState('2025-02-20');
  const [toDate, setToDate] = useState('2025-12-31');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'NAME' | 'BARCODE' | 'HSN'>('NAME');
  const [activeFilterDays, setActiveFilterDays] = useState<number | 'EXPIRED' | 'ALL'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Products with expiry dates & days left calculation
  const reportItems = useMemo(() => {
    const today = new Date('2025-02-20'); // Video base date or live date

    return products
      .filter(p => !!p.expDate)
      .map(p => {
        const exp = new Date(p.expDate!);
        const diffTime = exp.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isExpired = daysLeft < 0;

        return {
          ...p,
          daysLeft,
          isExpired
        };
      });
  }, [products]);

  // Filtered rows
  const filtered = useMemo(() => {
    return reportItems.filter(item => {
      // Days filter
      if (activeFilterDays === 'EXPIRED') {
        if (!item.isExpired) return false;
      } else if (typeof activeFilterDays === 'number') {
        if (item.isExpired || item.daysLeft > activeFilterDays) return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      if (searchType === 'BARCODE') {
        return item.barcode.includes(q);
      } else if (searchType === 'HSN') {
        return (item.hsn || '').toLowerCase().includes(q);
      } else {
        return item.name.toLowerCase().includes(q);
      }
    });
  }, [reportItems, activeFilterDays, searchQuery, searchType]);

  // Counts for fast buttons
  const counts = useMemo(() => {
    return {
      expired: reportItems.filter(i => i.isExpired).length,
      days7: reportItems.filter(i => !i.isExpired && i.daysLeft <= 7).length,
      days15: reportItems.filter(i => !i.isExpired && i.daysLeft <= 15).length,
      days30: reportItems.filter(i => !i.isExpired && i.daysLeft <= 30).length,
      days90: reportItems.filter(i => !i.isExpired && i.daysLeft <= 90).length,
      days180: reportItems.filter(i => !i.isExpired && i.daysLeft <= 180).length,
      days365: reportItems.filter(i => !i.isExpired && i.daysLeft <= 365).length
    };
  }, [reportItems]);

  // Export to Excel / CSV
  const handleExportExcel = () => {
    const headers = [
      '#',
      'Product Name',
      'HSN Code',
      'Category',
      'Barcode',
      'Purchase Price',
      'Retail Price',
      'Discount',
      'CGST',
      'SGST',
      'CESS',
      'Qty Available',
      'Mfg Date',
      'Exp Date',
      'Days Left',
      'Aging Status'
    ];

    const rows = filtered.map((item, idx) => [
      idx + 1,
      `"${item.name.replace(/"/g, '""')}"`,
      item.hsn || '',
      item.category || '',
      item.barcode,
      item.purchasePrice.toFixed(2),
      item.retailPrice.toFixed(2),
      item.discount || 0,
      item.cgst || 0,
      item.sgst || 0,
      item.cessPercent || 0,
      item.openingStock.toFixed(3),
      item.mfgDate || '',
      item.expDate || '',
      item.daysLeft,
      item.isExpired ? 'ALREADY EXPIRED' : `${item.daysLeft} Days Left`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RetailDaddy_Expiry_Aging_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📊 Expiry Aging Report Exported to Excel Successfully!');
  };

  return (
    <div className="rd-window">
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'absolute',
          top: '45px',
          right: '20px',
          background: '#065f46',
          color: '#ffffff',
          padding: '8px 16px',
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          zIndex: 999
        }}>
          {toastMessage}
        </div>
      )}

      {/* WINDOW TITLE BAR (FROM SCREEN 025) */}
      <div className="rd-window-header-green" style={{ background: '#0284c7' }}>
        <div className="rd-window-title" style={{ fontSize: '13px' }}>
          Expiry Product (Item Aging) Record
        </div>
        <div className="rd-window-actions">
          <button className="rd-btn-header export" onClick={handleExportExcel}>
            <span>📊</span> EXPORT EXCEL
          </button>
        </div>
      </div>

      {/* FILTER PANEL (EXACT GEOMETRY FROM SCREEN 025) */}
      <div style={{
        background: '#f1f5f9',
        borderBottom: '1px solid #cbd5e1',
        padding: '10px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Left Form: Date Range & Search */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 'bold' }}>
            <span>From :</span>
            <input
              type="date"
              className="rd-pos-input"
              style={{ width: '130px' }}
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
            />
            <span>To :</span>
            <input
              type="date"
              className="rd-pos-input"
              style={{ width: '130px' }}
              value={toDate}
              onChange={e => setToDate(e.target.value)}
            />
            <button
              className="rd-grid-btn"
              style={{
                background: 'linear-gradient(180deg, #1d4ed8 0%, #1e3a8a 100%)',
                color: '#fff',
                fontWeight: 'bold',
                padding: '4px 14px'
              }}
              onClick={() => showToast('Date Range Filter Applied')}
            >
              Get Data
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 'bold' }}>
            <span>Search Type :</span>
            <select
              className="rd-pos-input"
              style={{ width: '110px' }}
              value={searchType}
              onChange={e => setSearchType(e.target.value as any)}
            >
              <option value="NAME">Product Name</option>
              <option value="BARCODE">Barcode</option>
              <option value="HSN">HSN Code</option>
            </select>

            <span>Search :</span>
            <input
              type="text"
              className="rd-pos-input"
              style={{ width: '160px', background: '#fef08a', fontWeight: 'bold' }}
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Right Panel: Expiring in Next (Video 22 frame 025 exact layout) */}
        <div style={{
          border: '1px solid #94a3b8',
          background: '#ffffff',
          borderRadius: '4px',
          padding: '6px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#475569' }}>
            Expiring in Next :
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
            <button
              className="rd-grid-btn"
              style={{
                background: activeFilterDays === 7 ? '#0284c7' : '#fed7aa',
                color: activeFilterDays === 7 ? '#fff' : '#7c2d12',
                fontWeight: 'bold',
                fontSize: '10px',
                padding: '2px 8px'
              }}
              onClick={() => setActiveFilterDays(activeFilterDays === 7 ? 'ALL' : 7)}
            >
              7 Days ({counts.days7})
            </button>
            <button
              className="rd-grid-btn"
              style={{
                background: activeFilterDays === 30 ? '#0284c7' : '#fed7aa',
                color: activeFilterDays === 30 ? '#fff' : '#7c2d12',
                fontWeight: 'bold',
                fontSize: '10px',
                padding: '2px 8px'
              }}
              onClick={() => setActiveFilterDays(activeFilterDays === 30 ? 'ALL' : 30)}
            >
              30 Days ({counts.days30})
            </button>
            <button
              className="rd-grid-btn"
              style={{
                background: activeFilterDays === 180 ? '#0284c7' : '#fed7aa',
                color: activeFilterDays === 180 ? '#fff' : '#7c2d12',
                fontWeight: 'bold',
                fontSize: '10px',
                padding: '2px 8px'
              }}
              onClick={() => setActiveFilterDays(activeFilterDays === 180 ? 'ALL' : 180)}
            >
              180 Days ({counts.days180})
            </button>

            <button
              className="rd-grid-btn"
              style={{
                background: activeFilterDays === 15 ? '#0284c7' : '#ffedd5',
                color: activeFilterDays === 15 ? '#fff' : '#7c2d12',
                fontWeight: 'bold',
                fontSize: '10px',
                padding: '2px 8px'
              }}
              onClick={() => setActiveFilterDays(activeFilterDays === 15 ? 'ALL' : 15)}
            >
              15 Days ({counts.days15})
            </button>
            <button
              className="rd-grid-btn"
              style={{
                background: activeFilterDays === 90 ? '#0284c7' : '#ffedd5',
                color: activeFilterDays === 90 ? '#fff' : '#7c2d12',
                fontWeight: 'bold',
                fontSize: '10px',
                padding: '2px 8px'
              }}
              onClick={() => setActiveFilterDays(activeFilterDays === 90 ? 'ALL' : 90)}
            >
              90 Days ({counts.days90})
            </button>
            <button
              className="rd-grid-btn"
              style={{
                background: activeFilterDays === 365 ? '#0284c7' : '#ffedd5',
                color: activeFilterDays === 365 ? '#fff' : '#7c2d12',
                fontWeight: 'bold',
                fontSize: '10px',
                padding: '2px 8px'
              }}
              onClick={() => setActiveFilterDays(activeFilterDays === 365 ? 'ALL' : 365)}
            >
              365 Days ({counts.days365})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px', gap: '6px' }}>
            <button
              className="rd-grid-btn"
              style={{
                background: '#ec4899',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '10px',
                padding: '3px 8px',
                flex: 1
              }}
              onClick={() => setActiveFilterDays(activeFilterDays === 'EXPIRED' ? 'ALL' : 'EXPIRED')}
            >
              Already Expired ({counts.expired})
            </button>
            <button
              className="rd-grid-btn"
              style={{ background: '#22c55e', color: '#fff', fontSize: '11px', padding: '3px 8px' }}
              onClick={handleExportExcel}
              title="Export to Excel"
            >
              📊 Excel
            </button>
            <button
              className="rd-grid-btn"
              style={{ background: '#64748b', color: '#fff', fontSize: '11px', padding: '3px 8px' }}
              onClick={() => { setActiveFilterDays('ALL'); setSearchQuery(''); showToast('Report Refreshed'); }}
              title="Refresh / Show All"
            >
              🔄
            </button>
          </div>
        </div>
      </div>

      {/* DATA TABLE (FROM SCREEN 025) */}
      <div className="rd-table-container">
        <table className="rd-data-table">
          <thead>
            <tr>
              <th className="th-green" style={{ width: '40px', textAlign: 'center' }}>#</th>
              <th className="th-green">Product Name</th>
              <th className="th-green" style={{ width: '80px' }}>HSN Code</th>
              <th className="th-green" style={{ width: '100px' }}>Part / Group</th>
              <th className="th-green" style={{ width: '100px' }}>Barcode</th>
              <th className="th-green" style={{ width: '85px', textAlign: 'right' }}>Purchase Price</th>
              <th className="th-green" style={{ width: '85px', textAlign: 'right' }}>Retail Price</th>
              <th className="th-green" style={{ width: '65px', textAlign: 'right' }}>Discount</th>
              <th className="th-green" style={{ width: '60px', textAlign: 'right' }}>CGST</th>
              <th className="th-green" style={{ width: '60px', textAlign: 'right' }}>SGST</th>
              <th className="th-green" style={{ width: '60px', textAlign: 'right' }}>CESS</th>
              <th className="th-green" style={{ width: '90px', textAlign: 'right' }}>Qty. Available</th>
              <th className="th-green" style={{ width: '85px', textAlign: 'center' }}>Mfg. Date</th>
              <th className="th-green" style={{ width: '85px', textAlign: 'center' }}>Exp. Date</th>
              <th className="th-green" style={{ width: '75px', textAlign: 'center' }}>Days Left</th>
              <th className="th-green" style={{ width: '110px', textAlign: 'center' }}>Aging Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={16} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
                  ✅ No products matching the selected expiry criteria.
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => (
                <tr
                  key={item.id}
                  style={{
                    background: item.isExpired ? '#fdf2f8' : (item.daysLeft <= 30 ? '#fefce8' : undefined)
                  }}
                >
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                  <td style={{ fontWeight: 'bold' }}>
                    {item.photo && <span style={{ marginRight: '6px' }}>{item.photo}</span>}
                    <span>{item.name}</span>
                  </td>
                  <td>{item.hsn || '-'}</td>
                  <td>{item.category}</td>
                  <td style={{ fontWeight: 'bold' }}>{item.barcode}</td>
                  <td style={{ textAlign: 'right' }}>{item.purchasePrice.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{item.retailPrice.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>{(item.discount || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>{(item.cgst || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>{(item.sgst || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>{(item.cessPercent || 0).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                    {item.openingStock.toFixed(3)}
                  </td>
                  <td style={{ textAlign: 'center' }}>{item.mfgDate || '-'}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: item.isExpired ? '#ec4899' : undefined }}>
                    {item.expDate}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                    <span style={{
                      color: item.isExpired ? '#ec4899' : (item.daysLeft <= 30 ? '#d97706' : '#15803d')
                    }}>
                      {item.daysLeft}d
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {item.isExpired ? (
                      <span style={{
                        background: '#fce7f3',
                        color: '#be185d',
                        border: '1px solid #ec4899',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        🚨 EXPIRED
                      </span>
                    ) : item.daysLeft <= 30 ? (
                      <span style={{
                        background: '#fef3c7',
                        color: '#b45309',
                        border: '1px solid #f59e0b',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        ⚠️ Expiring Soon
                      </span>
                    ) : (
                      <span style={{
                        background: '#dcfce7',
                        color: '#15803d',
                        border: '1px solid #22c55e',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        ✅ Fresh Stock
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER BAR */}
      <div style={{
        background: '#e2e8f0',
        padding: '6px 16px',
        borderTop: '1px solid #cbd5e1',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '11px',
        fontWeight: 'bold'
      }}>
        <span>Total Records Displayed: {filtered.length}</span>
        <span style={{ color: '#be185d' }}>Expired Items: {counts.expired}</span>
        <span style={{ color: '#b45309' }}>Expiring within 30 days: {counts.days30}</span>
        <span>Total Available Qty: {filtered.reduce((s, i) => s + i.openingStock, 0).toFixed(3)}</span>
      </div>
    </div>
  );
}
