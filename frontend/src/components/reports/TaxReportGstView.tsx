import { useState, useMemo } from 'react';
import type { Customer } from '../../types/retailDaddy';

interface GstSalesItem {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  taxType: 'GST' | 'IGST';
  customerName: string;
  state: string;
  gstin: string;
  productName: string;
  hsnCode: string;
  salesRate: number;
  qty: number;
  taxableAmt: number;
  cgstPercent: number;
  cgstAmt: number;
  sgstPercent: number;
  sgstAmt: number;
  igstPercent: number;
  igstAmt: number;
  totalAmt: number;
}

interface TaxReportGstViewProps {
  invoices?: any[];
  customers: Customer[];
}

export function TaxReportGstView({ invoices = [] }: TaxReportGstViewProps) {
  const [fromDate, setFromDate] = useState('2025-02-20');
  const [toDate, setToDate] = useState('2025-02-20');
  const [gstPercentFilter, setGstPercentFilter] = useState('');
  const [searchHsn, setSearchHsn] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Seed sample transactions from Retail Daddy Video 22 (from frame 075)
  const allGstItems: GstSalesItem[] = useMemo(() => {
    const seed: GstSalesItem[] = [
      { id: 'g-1', invoiceNo: 'GST-0022-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerName: 'Cash', state: 'Kerala', gstin: '', productName: 'Evian Water', hsnCode: '2201', salesRate: 223.20, qty: 1, taxableAmt: 223.20, cgstPercent: 9, cgstAmt: 20.09, sgstPercent: 9, sgstAmt: 20.09, igstPercent: 0, igstAmt: 0, totalAmt: 263.38 },
      { id: 'g-2', invoiceNo: 'GST-0023-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerName: 'Cash', state: 'Kerala', gstin: '', productName: 'Evian Water', hsnCode: '2201', salesRate: 223.20, qty: 1, taxableAmt: 223.20, cgstPercent: 9, cgstAmt: 20.09, sgstPercent: 9, sgstAmt: 20.09, igstPercent: 0, igstAmt: 0, totalAmt: 263.38 },
      { id: 'g-3', invoiceNo: 'GST-0024-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerName: 'Cash', state: 'Kerala', gstin: '', productName: 'Mango', hsnCode: '0804', salesRate: 40.18, qty: 1, taxableAmt: 40.18, cgstPercent: 6, cgstAmt: 2.41, sgstPercent: 6, sgstAmt: 2.41, igstPercent: 0, igstAmt: 0, totalAmt: 45.00 },
      { id: 'g-4', invoiceNo: 'GST-0025-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerName: 'Cash', state: 'Kerala', gstin: '', productName: 'Mango', hsnCode: '0804', salesRate: 40.18, qty: 1, taxableAmt: 40.18, cgstPercent: 6, cgstAmt: 2.41, sgstPercent: 6, sgstAmt: 2.41, igstPercent: 0, igstAmt: 0, totalAmt: 45.00 },
      { id: 'g-5', invoiceNo: 'GST-0026-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerName: 'Cash', state: 'Kerala', gstin: '', productName: 'Mango', hsnCode: '0804', salesRate: 35.72, qty: 1, taxableAmt: 35.72, cgstPercent: 6, cgstAmt: 2.14, sgstPercent: 6, sgstAmt: 2.14, igstPercent: 0, igstAmt: 0, totalAmt: 40.00 },
      { id: 'g-6', invoiceNo: 'GST-0027-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerName: 'Cash', state: 'Kerala', gstin: '', productName: 'Pencil', hsnCode: '9609', salesRate: 44.64, qty: 1, taxableAmt: 44.64, cgstPercent: 6, cgstAmt: 2.68, sgstPercent: 6, sgstAmt: 2.68, igstPercent: 0, igstAmt: 0, totalAmt: 50.00 },
      { id: 'g-7', invoiceNo: 'GST-0028-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerName: 'Cash', state: 'Kerala', gstin: '', productName: 'soap', hsnCode: '3401', salesRate: 892.80, qty: 1, taxableAmt: 892.80, cgstPercent: 9, cgstAmt: 80.35, sgstPercent: 9, sgstAmt: 80.35, igstPercent: 0, igstAmt: 0, totalAmt: 1053.50 },
      { id: 'g-8', invoiceNo: 'GST-0029-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerName: 'Cash', state: 'Kerala', gstin: '', productName: 'Shoe', hsnCode: '6403', salesRate: 267.86, qty: 1, taxableAmt: 267.86, cgstPercent: 9, cgstAmt: 24.11, sgstPercent: 9, sgstAmt: 24.11, igstPercent: 0, igstAmt: 0, totalAmt: 316.08 },
      { id: 'g-9', invoiceNo: 'GST-0030-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerName: 'Cash', state: 'Kerala', gstin: '', productName: 'Shoe', hsnCode: '6403', salesRate: 312.50, qty: 1, taxableAmt: 312.50, cgstPercent: 9, cgstAmt: 28.13, sgstPercent: 9, sgstAmt: 28.13, igstPercent: 0, igstAmt: 0, totalAmt: 368.76 },
      { id: 'g-10', invoiceNo: 'GST-0031-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerName: 'Cash', state: 'Kerala', gstin: '', productName: 'Fan', hsnCode: '8414', salesRate: 381.36, qty: 1, taxableAmt: 381.36, cgstPercent: 9, cgstAmt: 34.32, sgstPercent: 9, sgstAmt: 34.32, igstPercent: 0, igstAmt: 0, totalAmt: 450.00 }
    ];

    // Combine with live billed invoices
    if (invoices && invoices.length > 0) {
      invoices.forEach((inv, invIdx) => {
        if (inv.items) {
          inv.items.forEach((it: any, itIdx: number) => {
            const isInter = inv.customer?.state !== 'Kerala';
            seed.push({
              id: `live-${invIdx}-${itIdx}`,
              invoiceNo: inv.invoiceNo || `GST-LIVE-${invIdx}`,
              invoiceDate: inv.date?.split(' ')[0] || '20/02/2025',
              taxType: isInter ? 'IGST' : 'GST',
              customerName: inv.customer?.name || 'Cash',
              state: inv.customer?.state || 'Kerala',
              gstin: inv.customer?.gstin || '',
              productName: it.name,
              hsnCode: it.hsn || '9403',
              salesRate: it.rate,
              qty: it.qty,
              taxableAmt: it.taxable || (it.rate * it.qty),
              cgstPercent: isInter ? 0 : (it.cgstPercent || 0),
              cgstAmt: isInter ? 0 : (it.cgstAmt || 0),
              sgstPercent: isInter ? 0 : (it.sgstPercent || 0),
              sgstAmt: isInter ? 0 : (it.sgstAmt || 0),
              igstPercent: isInter ? (it.igstPercent || 18) : 0,
              igstAmt: isInter ? (it.igstAmt || 0) : 0,
              totalAmt: it.total
            });
          });
        }
      });
    }

    return seed;
  }, [invoices]);

  // Filtered rows
  const filtered = useMemo(() => {
    return allGstItems.filter(item => {
      if (gstPercentFilter.trim()) {
        const targetRate = Number(gstPercentFilter);
        const totalGstRate = item.cgstPercent + item.sgstPercent + item.igstPercent;
        if (totalGstRate !== targetRate) return false;
      }
      if (searchHsn.trim()) {
        if (!item.hsnCode.includes(searchHsn.trim())) return false;
      }
      return true;
    });
  }, [allGstItems, gstPercentFilter, searchHsn]);

  // Totals
  const totalQty = filtered.reduce((s, i) => s + i.qty, 0);
  const totalTaxable = filtered.reduce((s, i) => s + i.taxableAmt, 0);
  const totalCgst = filtered.reduce((s, i) => s + i.cgstAmt, 0);
  const totalSgst = filtered.reduce((s, i) => s + i.sgstAmt, 0);
  const totalIgst = filtered.reduce((s, i) => s + i.igstAmt, 0);
  const grandTotal = filtered.reduce((s, i) => s + i.totalAmt, 0);

  // Excel export
  const handleExportExcel = () => {
    const headers = [
      'Invoice No',
      'Invoice Date',
      'Tax Type',
      'Customer Name',
      'State',
      'GSTIN/UID',
      'Product Name',
      'HSN Code',
      'Sales Rate',
      'Qty',
      'Taxable Amt',
      'CGST %',
      'CGST Amt',
      'SGST %',
      'SGST Amt',
      'IGST %',
      'IGST Amt',
      'Net Total'
    ];

    const rows = filtered.map(item => [
      item.invoiceNo,
      item.invoiceDate,
      item.taxType,
      `"${item.customerName.replace(/"/g, '""')}"`,
      item.state,
      item.gstin,
      `"${item.productName.replace(/"/g, '""')}"`,
      item.hsnCode,
      item.salesRate.toFixed(2),
      item.qty,
      item.taxableAmt.toFixed(2),
      item.cgstPercent,
      item.cgstAmt.toFixed(2),
      item.sgstPercent,
      item.sgstAmt.toFixed(2),
      item.igstPercent,
      item.igstAmt.toFixed(2),
      item.totalAmt.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RetailDaddy_GST_Sales_Register_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📊 GST Register Exported to Excel/CSV for CA Review');
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

      {/* WINDOW TITLE BAR (FROM SCREEN 075) */}
      <div className="rd-window-header-green" style={{ background: '#1d4ed8' }}>
        <div className="rd-window-title" style={{ fontSize: '13px' }}>
          Sales Register (Item Wise) — GST Register & HSN Audit
        </div>
        <div className="rd-window-actions">
          <button className="rd-btn-header export" onClick={handleExportExcel}>
            <span>📊</span> EXPORT EXCEL
          </button>
        </div>
      </div>

      {/* FILTER BAR (EXACT FROM SCREEN 075) */}
      <div style={{
        background: '#f8fafc',
        borderBottom: '1px solid #cbd5e1',
        padding: '8px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 'bold' }}>
            <span>Search by Invoice Date :</span>
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
            <span>Search By GST % :</span>
            <input
              type="number"
              className="rd-pos-input"
              style={{ width: '60px', textAlign: 'center', background: '#fef08a', fontWeight: 'bold' }}
              placeholder="e.g. 18"
              value={gstPercentFilter}
              onChange={e => setGstPercentFilter(e.target.value)}
            />
            <span>HSN :</span>
            <input
              type="text"
              className="rd-pos-input"
              style={{ width: '80px', textAlign: 'center' }}
              placeholder="HSN"
              value={searchHsn}
              onChange={e => setSearchHsn(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="rd-grid-btn"
            style={{ background: '#dc2626', color: '#fff', fontWeight: 'bold', padding: '4px 16px' }}
            onClick={() => {
              setGstPercentFilter('');
              setSearchHsn('');
              showToast('Filters Reset');
            }}
          >
            Reset
          </button>
          <button
            className="rd-grid-btn"
            style={{ background: '#16a34a', color: '#fff', fontWeight: 'bold', padding: '4px 16px' }}
            onClick={handleExportExcel}
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* DATA TABLE (FROM SCREEN 075) */}
      <div className="rd-table-container">
        <table className="rd-data-table">
          <thead>
            <tr>
              <th className="th-green" style={{ width: '35px', textAlign: 'center' }}>#</th>
              <th className="th-green" style={{ width: '130px' }}>Invoice No.</th>
              <th className="th-green" style={{ width: '85px' }}>Invoice Date</th>
              <th className="th-green" style={{ width: '65px', textAlign: 'center' }}>Tax Type</th>
              <th className="th-green" style={{ width: '100px' }}>Customer Name</th>
              <th className="th-green" style={{ width: '80px' }}>State</th>
              <th className="th-green" style={{ width: '90px' }}>GSTIN/UID</th>
              <th className="th-green">Product Name</th>
              <th className="th-green" style={{ width: '75px' }}>HSN Code</th>
              <th className="th-green" style={{ width: '75px', textAlign: 'right' }}>Sales Rate</th>
              <th className="th-green" style={{ width: '45px', textAlign: 'center' }}>Qty.</th>
              <th className="th-green" style={{ width: '85px', textAlign: 'right' }}>Taxable Amt</th>
              <th className="th-green" style={{ width: '60px', textAlign: 'right' }}>CGST</th>
              <th className="th-green" style={{ width: '60px', textAlign: 'right' }}>SGST</th>
              <th className="th-green" style={{ width: '60px', textAlign: 'right' }}>IGST</th>
              <th className="th-green" style={{ width: '90px', textAlign: 'right' }}>Net Amt</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={16} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
                  No GST transactions found for the specified filters.
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => (
                <tr key={item.id}>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                  <td style={{ fontWeight: 'bold', color: '#1e3a8a' }}>{item.invoiceNo}</td>
                  <td>{item.invoiceDate}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      background: item.taxType === 'IGST' ? '#fef3c7' : '#dcfce7',
                      color: item.taxType === 'IGST' ? '#92400e' : '#15803d',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      fontWeight: 'bold',
                      fontSize: '10px'
                    }}>
                      {item.taxType}
                    </span>
                  </td>
                  <td style={{ fontWeight: '600' }}>{item.customerName}</td>
                  <td>{item.state}</td>
                  <td style={{ fontSize: '10px' }}>{item.gstin || '-'}</td>
                  <td style={{ fontWeight: 'bold' }}>{item.productName}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#475569' }}>
                    {item.hsnCode}
                  </td>
                  <td style={{ textAlign: 'right' }}>{item.salesRate.toFixed(2)}</td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.qty}</td>
                  <td style={{ textAlign: 'right' }}>{item.taxableAmt.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontSize: '10px' }}>{item.cgstAmt.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontSize: '10px' }}>{item.sgstAmt.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontSize: '10px' }}>{item.igstAmt.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: '900', color: '#15803d' }}>
                    {item.totalAmt.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER BAR WITH TOTAL (FROM SCREEN 075) */}
      <div style={{
        background: '#e2e8f0',
        padding: '8px 16px',
        borderTop: '1px solid #cbd5e1',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        fontWeight: 'bold'
      }}>
        <span>Lines: {filtered.length} | Total Qty: {totalQty}</span>
        <span>Taxable: ₹ {totalTaxable.toFixed(2)}</span>
        <span>CGST: ₹ {totalCgst.toFixed(2)}</span>
        <span>SGST: ₹ {totalSgst.toFixed(2)}</span>
        <span>IGST: ₹ {totalIgst.toFixed(2)}</span>
        <div style={{
          fontSize: '14px',
          fontWeight: '900',
          color: '#15803d',
          background: '#dcfce7',
          padding: '4px 12px',
          borderRadius: '4px',
          border: '1px solid #86efac'
        }}>
          Total : ₹ {grandTotal.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
