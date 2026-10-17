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
      { id: 'g-1', invoiceNo: 'GST-0022-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerName: 'Cash', state: 'Kerala', gstin: '', productName: 'Godrej Interio Slimline 3-Door Almirah', hsnCode: '94031010', salesRate: 31500.00, qty: 1, taxableAmt: 26694.92, cgstPercent: 9, cgstAmt: 2402.54, sgstPercent: 9, sgstAmt: 2402.54, igstPercent: 0, igstAmt: 0, totalAmt: 31500.00 },
      { id: 'g-2', invoiceNo: 'GST-0023-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerName: 'Cash', state: 'Kerala', gstin: '', productName: 'Godrej Interio Storwel Classic Plain', hsnCode: '94031010', salesRate: 19500.00, qty: 1, taxableAmt: 16525.42, cgstPercent: 9, cgstAmt: 1487.29, sgstPercent: 9, sgstAmt: 1487.29, igstPercent: 0, igstAmt: 0, totalAmt: 19500.00 },
      { id: 'g-3', invoiceNo: 'GST-0024-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerName: 'Cash', state: 'Kerala', gstin: '', productName: 'Godrej Interio Motion High-Back Chair', hsnCode: '94013000', salesRate: 14200.00, qty: 1, taxableAmt: 12033.90, cgstPercent: 9, cgstAmt: 1083.05, sgstPercent: 9, sgstAmt: 1083.05, igstPercent: 0, igstAmt: 0, totalAmt: 14200.00 },
      { id: 'g-4', invoiceNo: 'GST-0025-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerName: 'Cash', state: 'Kerala', gstin: '', productName: 'Godrej Centurion High-Security Safe 40L', hsnCode: '83030000', salesRate: 14800.00, qty: 1, taxableAmt: 12542.37, cgstPercent: 9, cgstAmt: 1128.81, sgstPercent: 9, sgstAmt: 1128.81, igstPercent: 0, igstAmt: 0, totalAmt: 14800.00 },
      { id: 'g-5', invoiceNo: 'GST-0026-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerName: 'Cash', state: 'Kerala', gstin: '', productName: 'Godrej Posture Support Mattress (Queen)', hsnCode: '94042990', salesRate: 18500.00, qty: 1, taxableAmt: 15677.97, cgstPercent: 9, cgstAmt: 1411.02, sgstPercent: 9, sgstAmt: 1411.02, igstPercent: 0, igstAmt: 0, totalAmt: 18500.00 },
      { id: 'g-6', invoiceNo: 'GST-0027-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerName: 'Cash', state: 'Kerala', gstin: '', productName: 'Nilambur Solid Teak Wood Dining Chair', hsnCode: '94036000', salesRate: 5500.00, qty: 1, taxableAmt: 4661.02, cgstPercent: 9, cgstAmt: 419.49, sgstPercent: 9, sgstAmt: 419.49, igstPercent: 0, igstAmt: 0, totalAmt: 5500.00 },
      { id: 'g-7', invoiceNo: 'GST-0028-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerName: 'Cash', state: 'Kerala', gstin: '', productName: 'Godrej Interio Entica 3-Seater Sofa', hsnCode: '94016100', salesRate: 32000.00, qty: 1, taxableAmt: 27118.64, cgstPercent: 9, cgstAmt: 2440.68, sgstPercent: 9, sgstAmt: 2440.68, igstPercent: 0, igstAmt: 0, totalAmt: 32000.00 },
      { id: 'g-8', invoiceNo: 'GST-0029-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerName: 'Cash', state: 'Kerala', gstin: '', productName: 'Godrej Rhino Digital Home Safe 30L', hsnCode: '83030000', salesRate: 13500.00, qty: 1, taxableAmt: 11440.68, cgstPercent: 9, cgstAmt: 1029.66, sgstPercent: 9, sgstAmt: 1029.66, igstPercent: 0, igstAmt: 0, totalAmt: 13500.00 },
      { id: 'g-9', invoiceNo: 'GST-0030-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerName: 'Cash', state: 'Kerala', gstin: '', productName: 'Godrej Interio Slimline 2-Door Almirah', hsnCode: '94031010', salesRate: 24200.00, qty: 1, taxableAmt: 20508.47, cgstPercent: 9, cgstAmt: 1845.76, sgstPercent: 9, sgstAmt: 1845.76, igstPercent: 0, igstAmt: 0, totalAmt: 24200.00 },
      { id: 'g-10', invoiceNo: 'GST-0031-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerName: 'Cash', state: 'Kerala', gstin: '', productName: 'Godrej Maestro Center Coffee Table', hsnCode: '94033000', salesRate: 8200.00, qty: 1, taxableAmt: 6949.15, cgstPercent: 9, cgstAmt: 625.42, sgstPercent: 9, sgstAmt: 625.42, igstPercent: 0, igstAmt: 0, totalAmt: 8200.00 }
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

  const [activeTab, setActiveTab] = useState<'REGISTER' | 'GSTR1_TABLE12'>('REGISTER');

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

  // GSTR-1 Table 12 Aggregates
  const hsnSummaries = useMemo(() => {
    const map: Record<string, {
      hsnCode: string;
      desc: string;
      uqc: string;
      totalQty: number;
      totalValue: number;
      taxableValue: number;
      igstAmt: number;
      cgstAmt: number;
      sgstAmt: number;
      cessAmt: number;
    }> = {};

    filtered.forEach(it => {
      const hsn = it.hsnCode || '9403';
      if (!map[hsn]) {
        let desc = 'Wooden/Metal Furniture & Showroom Units';
        if (hsn.startsWith('9401')) desc = 'Seats & Sofas (Chairs & Couches)';
        else if (hsn.startsWith('9404')) desc = 'Mattresses & Bedding Supports';
        else if (hsn.startsWith('8303')) desc = 'Armoured Safes & Strongboxes';
        else if (hsn.startsWith('9403')) desc = 'Wood & Metal Furniture & Almirahs';

        map[hsn] = {
          hsnCode: hsn,
          desc,
          uqc: 'NOS',
          totalQty: 0,
          totalValue: 0,
          taxableValue: 0,
          igstAmt: 0,
          cgstAmt: 0,
          sgstAmt: 0,
          cessAmt: 0
        };
      }
      map[hsn].totalQty += it.qty;
      map[hsn].totalValue += it.totalAmt;
      map[hsn].taxableValue += it.taxableAmt;
      map[hsn].igstAmt += it.igstAmt;
      map[hsn].cgstAmt += it.cgstAmt;
      map[hsn].sgstAmt += it.sgstAmt;
    });

    return Object.values(map).sort((a, b) => a.hsnCode.localeCompare(b.hsnCode));
  }, [filtered]);

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

  const handleExportGstr1Table12 = () => {
    const headers = [
      'HSN',
      'Description',
      'UQC',
      'Total Quantity',
      'Total Value (₹)',
      'Taxable Value (₹)',
      'Integrated Tax Amount (₹)',
      'Central Tax Amount (₹)',
      'State/UT Tax Amount (₹)',
      'Cess Amount (₹)'
    ];
    const rows = hsnSummaries.map(s => [
      s.hsnCode,
      `"${s.desc.replace(/"/g, '""')}"`,
      s.uqc,
      s.totalQty,
      s.totalValue.toFixed(2),
      s.taxableValue.toFixed(2),
      s.igstAmt.toFixed(2),
      s.cgstAmt.toFixed(2),
      s.sgstAmt.toFixed(2),
      s.cessAmt.toFixed(2)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `GSTR1_Table12_HSN_Summary_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📑 GSTR-1 Table 12 HSN Summary CSV exported for GST Portal!');
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
          Sales Register — Statutory GST & GSTR-1 HSN Table 12 Compliance
        </div>
        <div className="rd-window-actions" style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="rd-btn-header" 
            style={{ 
              background: activeTab === 'REGISTER' ? '#2563eb' : '#1e3a8a',
              border: activeTab === 'REGISTER' ? '2px solid #fff' : '1px solid rgba(255,255,255,0.4)',
              fontWeight: 'bold',
              fontSize: '11px',
              padding: '2px 10px',
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab('REGISTER')}
          >
            📋 Line Items Register
          </button>
          <button 
            className="rd-btn-header" 
            style={{ 
              background: activeTab === 'GSTR1_TABLE12' ? '#2563eb' : '#1e3a8a',
              border: activeTab === 'GSTR1_TABLE12' ? '2px solid #fff' : '1px solid rgba(255,255,255,0.4)',
              fontWeight: 'bold',
              fontSize: '11px',
              padding: '2px 10px',
              cursor: 'pointer'
            }}
            onClick={() => setActiveTab('GSTR1_TABLE12')}
          >
            📑 GSTR-1 Table 12 (HSN Summary)
          </button>
          <button className="rd-btn-header export" onClick={activeTab === 'GSTR1_TABLE12' ? handleExportGstr1Table12 : handleExportExcel}>
            <span>📊</span> {activeTab === 'GSTR1_TABLE12' ? 'EXPORT TABLE 12 CSV' : 'EXPORT EXCEL'}
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
            onClick={activeTab === 'GSTR1_TABLE12' ? handleExportGstr1Table12 : handleExportExcel}
          >
            {activeTab === 'GSTR1_TABLE12' ? 'Export Table 12' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* DATA TABLE (FROM SCREEN 075 OR GSTR-1 TABLE 12) */}
      <div className="rd-table-container">
        {activeTab === 'GSTR1_TABLE12' ? (
          <table className="rd-data-table">
            <thead>
              <tr>
                <th className="th-green" style={{ width: '35px', textAlign: 'center', background: '#1e3a8a' }}>#</th>
                <th className="th-green" style={{ width: '90px', textAlign: 'center', background: '#1e3a8a' }}>HSN Code</th>
                <th className="th-green" style={{ background: '#1e3a8a' }}>Description of Goods (Furniture)</th>
                <th className="th-green" style={{ width: '60px', textAlign: 'center', background: '#1e3a8a' }}>UQC</th>
                <th className="th-green" style={{ width: '70px', textAlign: 'center', background: '#1e3a8a' }}>Total Qty</th>
                <th className="th-green" style={{ width: '100px', textAlign: 'right', background: '#1e3a8a' }}>Total Value (₹)</th>
                <th className="th-green" style={{ width: '100px', textAlign: 'right', background: '#1e3a8a' }}>Taxable Value (₹)</th>
                <th className="th-green" style={{ width: '80px', textAlign: 'right', background: '#1e3a8a' }}>Integrated Tax (₹)</th>
                <th className="th-green" style={{ width: '80px', textAlign: 'right', background: '#1e3a8a' }}>Central Tax (₹)</th>
                <th className="th-green" style={{ width: '80px', textAlign: 'right', background: '#1e3a8a' }}>State/UT Tax (₹)</th>
                <th className="th-green" style={{ width: '70px', textAlign: 'right', background: '#1e3a8a' }}>Cess (₹)</th>
              </tr>
            </thead>
            <tbody>
              {hsnSummaries.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
                    No HSN summary data available.
                  </td>
                </tr>
              ) : (
                hsnSummaries.map((hsn, idx) => (
                  <tr key={hsn.hsnCode} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#1d4ed8', fontSize: '12px' }}>
                      {hsn.hsnCode}
                    </td>
                    <td style={{ fontWeight: '600' }}>{hsn.desc}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>{hsn.uqc}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{hsn.totalQty}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{hsn.totalValue.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{hsn.taxableValue.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: '#b45309' }}>{hsn.igstAmt.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: '#0f766e' }}>{hsn.cgstAmt.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: '#0f766e' }}>{hsn.sgstAmt.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: '#64748b' }}>{hsn.cessAmt.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
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
        )}
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
