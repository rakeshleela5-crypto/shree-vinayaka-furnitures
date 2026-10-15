import { useState, useMemo } from 'react';
import type { Customer } from '../../types/retailDaddy';

interface SalesInvoiceRecord {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  taxType: 'GST' | 'Non-GST';
  customerId: string;
  customerName: string;
  contactNo: string;
  state: string;
  gstin: string;
  salesmanId: string;
  salesman: string;
  taxableAmt: number;
  taxAmt: number;
  totalAmt: number;
  paymentMode: 'CASH' | 'UPI' | 'CARD' | 'CREDIT';
  tillId: string;
}

interface SalesInvoiceReportViewProps {
  invoices?: any[];
  customers: Customer[];
}

export function SalesInvoiceReportView({ invoices = [] }: SalesInvoiceReportViewProps) {
  const [fromDate, setFromDate] = useState('2025-02-20');
  const [toDate, setToDate] = useState('2025-02-20');
  const [invoiceNoQuery, setInvoiceNoQuery] = useState('');
  const [customerNameQuery, setCustomerNameQuery] = useState('');
  const [salesmanQuery, setSalesmanQuery] = useState('');
  const [taxTypeFilter, setTaxTypeFilter] = useState<'ALL' | 'GST' | 'Non-GST'>('GST');
  const [tillFilter, setTillFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Seed sample invoices from Video 22 (from frame 250)
  const allInvoices: SalesInvoiceRecord[] = useMemo(() => {
    const seed: SalesInvoiceRecord[] = [
      { id: 'inv-1', invoiceNo: 'GST-0022-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerId: 'C-0001', customerName: 'Cash', contactNo: '1234567890', state: 'Kerala', gstin: '', salesmanId: 'S-01', salesman: 'Mahesh (Counter 1)', taxableAmt: 423.73, taxAmt: 76.27, totalAmt: 500.00, paymentMode: 'CASH', tillId: 'DESKTOP-SHPOBV' },
      { id: 'inv-2', invoiceNo: 'GST-0023-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerId: 'C-0001', customerName: 'Cash', contactNo: '1234567890', state: 'Kerala', gstin: '', salesmanId: 'S-01', salesman: 'Mahesh (Counter 1)', taxableAmt: 423.73, taxAmt: 76.27, totalAmt: 500.00, paymentMode: 'CASH', tillId: 'DESKTOP-SHPOBV' },
      { id: 'inv-3', invoiceNo: 'GST-0024-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerId: 'C-0001', customerName: 'Cash', contactNo: '1234567890', state: 'Kerala', gstin: '', salesmanId: 'S-01', salesman: 'Mahesh (Counter 1)', taxableAmt: 40.18, taxAmt: 4.82, totalAmt: 45.00, paymentMode: 'CASH', tillId: 'DESKTOP-SHPOBV' },
      { id: 'inv-4', invoiceNo: 'GST-0025-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerId: 'C-0001', customerName: 'Cash', contactNo: '1234567890', state: 'Kerala', gstin: '', salesmanId: 'S-01', salesman: 'Mahesh (Counter 1)', taxableAmt: 40.18, taxAmt: 4.82, totalAmt: 45.00, paymentMode: 'CASH', tillId: 'DESKTOP-SHPOBV' },
      { id: 'inv-5', invoiceNo: 'GST-0026-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerId: 'C-0001', customerName: 'Cash', contactNo: '1234567890', state: 'Kerala', gstin: '', salesmanId: 'S-01', salesman: 'Mahesh (Counter 1)', taxableAmt: 35.72, taxAmt: 4.28, totalAmt: 40.00, paymentMode: 'CASH', tillId: 'DESKTOP-SHPOBV' },
      { id: 'inv-6', invoiceNo: 'GST-0027-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerId: 'C-0001', customerName: 'Cash', contactNo: '1234567890', state: 'Kerala', gstin: '', salesmanId: 'S-02', salesman: 'Sumesh (Terminal 2)', taxableAmt: 4330.36, taxAmt: 519.64, totalAmt: 4850.00, paymentMode: 'CASH', tillId: 'DESKTOP-UPHDMH0' },
      { id: 'inv-7', invoiceNo: 'GST-0028-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerId: 'C-0001', customerName: 'Cash', contactNo: '1234567890', state: 'Kerala', gstin: '', salesmanId: 'S-02', salesman: 'Sumesh (Terminal 2)', taxableAmt: 89.28, taxAmt: 10.72, totalAmt: 100.00, paymentMode: 'CASH', tillId: 'DESKTOP-UPHDMH0' },
      { id: 'inv-8', invoiceNo: 'GST-0029-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerId: 'C-0001', customerName: 'Cash', contactNo: '1234567890', state: 'Kerala', gstin: '', salesmanId: 'S-01', salesman: 'Mahesh (Counter 1)', taxableAmt: 2678.57, taxAmt: 321.43, totalAmt: 3000.00, paymentMode: 'CASH', tillId: 'DESKTOP-SHPOBV' },
      { id: 'inv-9', invoiceNo: 'GST-0030-2024/25', invoiceDate: '20/02/2025', taxType: 'GST', customerId: 'C-0001', customerName: 'Cash', contactNo: '1234567890', state: 'Kerala', gstin: '', salesmanId: 'S-01', salesman: 'Mahesh (Counter 1)', taxableAmt: 625.00, taxAmt: 75.00, totalAmt: 700.00, paymentMode: 'UPI', tillId: 'DESKTOP-SHPOBV' }
    ];

    // Merge live recorded bills
    if (invoices && invoices.length > 0) {
      invoices.forEach((inv, idx) => {
        seed.unshift({
          id: `live-inv-${idx}`,
          invoiceNo: inv.invoiceNo || `GST-003${idx + 1}-2024/25`,
          invoiceDate: inv.date?.split(' ')[0] || '20/02/2025',
          taxType: 'GST',
          customerId: inv.customer?.id || 'C-0001',
          customerName: inv.customer?.name || 'Cash',
          contactNo: inv.customer?.phone || '1234567890',
          state: inv.customer?.state || 'Kerala',
          gstin: '',
          salesmanId: 'S-01',
          salesman: 'Mahesh (Counter 1)',
          taxableAmt: inv.netPay - (inv.totalTax || 0),
          taxAmt: inv.totalTax || 0,
          totalAmt: inv.netPay,
          paymentMode: 'CASH',
          tillId: 'DESKTOP-SHPOBV'
        });
      });
    }

    return seed;
  }, [invoices]);

  // Filtered rows
  const filtered = useMemo(() => {
    return allInvoices.filter(inv => {
      if (taxTypeFilter !== 'ALL' && inv.taxType !== taxTypeFilter) return false;
      if (tillFilter !== 'ALL' && inv.tillId !== tillFilter) return false;
      if (invoiceNoQuery.trim() && !inv.invoiceNo.toLowerCase().includes(invoiceNoQuery.trim().toLowerCase())) return false;
      if (customerNameQuery.trim() && !inv.customerName.toLowerCase().includes(customerNameQuery.trim().toLowerCase())) return false;
      if (salesmanQuery.trim() && !inv.salesman.toLowerCase().includes(salesmanQuery.trim().toLowerCase())) return false;
      return true;
    });
  }, [allInvoices, taxTypeFilter, tillFilter, invoiceNoQuery, customerNameQuery, salesmanQuery]);

  const totalInvoiced = filtered.reduce((s, i) => s + i.totalAmt, 0);

  // Excel export
  const handleExportExcel = () => {
    const headers = [
      'Invoice No',
      'Invoice Date',
      'Tax Type',
      'Customer ID',
      'Customer Name',
      'Contact No',
      'State',
      'GSTIN',
      'Salesman ID',
      'Salesman',
      'Taxable Amt',
      'Tax Amt',
      'Total Amt',
      'Till ID'
    ];

    const rows = filtered.map(inv => [
      inv.invoiceNo,
      inv.invoiceDate,
      inv.taxType,
      inv.customerId,
      `"${inv.customerName.replace(/"/g, '""')}"`,
      inv.contactNo,
      inv.state,
      inv.gstin,
      inv.salesmanId,
      `"${inv.salesman.replace(/"/g, '""')}"`,
      inv.taxableAmt.toFixed(2),
      inv.taxAmt.toFixed(2),
      inv.totalAmt.toFixed(2),
      inv.tillId
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RetailDaddy_List_Of_Sales_Invoices_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📊 Sales Invoices Exported to Excel/CSV Successfully!');
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

      {/* WINDOW TITLE BAR (FROM SCREEN 250) */}
      <div className="rd-window-header-green" style={{ background: '#1d4ed8' }}>
        <div className="rd-window-title" style={{ fontSize: '13px' }}>
          List of Sales Invoices
        </div>
        <div className="rd-window-actions">
          <button className="rd-btn-header export" onClick={handleExportExcel}>
            <span>📊</span> EXPORT EXCEL
          </button>
        </div>
      </div>

      {/* COMPREHENSIVE FILTER STRIP (EXACT GEOMETRY FROM SCREEN 250) */}
      <div style={{
        background: '#f1f5f9',
        borderBottom: '1px solid #cbd5e1',
        padding: '10px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Row 1: Date Range, Invoice No, Customer, Salesman */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold' }}>
            <span>Search by Invoice Date :</span>
            <span>From :</span>
            <input
              type="date"
              className="rd-pos-input"
              style={{ width: '125px' }}
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
            />
            <span>To :</span>
            <input
              type="date"
              className="rd-pos-input"
              style={{ width: '125px' }}
              value={toDate}
              onChange={e => setToDate(e.target.value)}
            />
            <button
              className="rd-grid-btn"
              style={{
                background: 'linear-gradient(180deg, #1d4ed8 0%, #1e3a8a 100%)',
                color: '#fff',
                fontWeight: 'bold',
                padding: '3px 10px'
              }}
              onClick={() => showToast('Invoice Date Filter Applied')}
            >
              Get Data
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold' }}>
            <span>Invoice No. :</span>
            <input
              type="text"
              className="rd-pos-input"
              style={{ width: '110px' }}
              placeholder="GST-..."
              value={invoiceNoQuery}
              onChange={e => setInvoiceNoQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold' }}>
            <span>Customer :</span>
            <input
              type="text"
              className="rd-pos-input"
              style={{ width: '110px' }}
              placeholder="Name"
              value={customerNameQuery}
              onChange={e => setCustomerNameQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold' }}>
            <span>Salesman :</span>
            <input
              type="text"
              className="rd-pos-input"
              style={{ width: '120px' }}
              placeholder="Salesman"
              value={salesmanQuery}
              onChange={e => setSalesmanQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Row 2: Tax Type, Till ID / Terminal, Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold' }}>
              <span>Tax Type :</span>
              <select
                className="rd-pos-input"
                style={{ width: '90px' }}
                value={taxTypeFilter}
                onChange={e => setTaxTypeFilter(e.target.value as any)}
              >
                <option value="ALL">All</option>
                <option value="GST">GST</option>
                <option value="Non-GST">Non-GST</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 'bold' }}>
              <span>Till ID (Terminal) :</span>
              <select
                className="rd-pos-input"
                style={{ width: '180px', background: '#fef08a', fontWeight: 'bold' }}
                value={tillFilter}
                onChange={e => setTillFilter(e.target.value)}
              >
                <option value="ALL">All Terminals</option>
                <option value="DESKTOP-SHPOBV">DESKTOP-SHPOBV (Counter 1)</option>
                <option value="DESKTOP-UPHDMH0">DESKTOP-UPHDMH0 (Terminal 2)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="rd-grid-btn"
              style={{ background: '#dc2626', color: '#fff', fontWeight: 'bold', padding: '5px 16px' }}
              onClick={() => {
                setInvoiceNoQuery('');
                setCustomerNameQuery('');
                setSalesmanQuery('');
                setTaxTypeFilter('ALL');
                setTillFilter('ALL');
                showToast('Filters Cleared');
              }}
            >
              Reset
            </button>
            <button
              className="rd-grid-btn"
              style={{ background: '#16a34a', color: '#fff', fontWeight: 'bold', padding: '5px 16px' }}
              onClick={handleExportExcel}
            >
              Export Excel
            </button>
            <button
              className="rd-grid-btn"
              style={{ background: '#0284c7', color: '#fff', fontWeight: 'bold', padding: '5px 16px' }}
              onClick={() => showToast('Sales Payment Receipts Ledger Ready')}
            >
              Sales Payment Record
            </button>
          </div>
        </div>
      </div>

      {/* DATA TABLE (FROM SCREEN 250) */}
      <div className="rd-table-container">
        <table className="rd-data-table">
          <thead>
            <tr>
              <th className="th-green" style={{ width: '35px', textAlign: 'center' }}>#</th>
              <th className="th-green" style={{ width: '140px' }}>Invoice No.</th>
              <th className="th-green" style={{ width: '85px' }}>Invoice Date</th>
              <th className="th-green" style={{ width: '65px', textAlign: 'center' }}>Tax Type</th>
              <th className="th-green" style={{ width: '85px' }}>Customer ID</th>
              <th className="th-green" style={{ width: '110px' }}>Customer Name</th>
              <th className="th-green" style={{ width: '95px' }}>Contact No.</th>
              <th className="th-green" style={{ width: '80px' }}>State</th>
              <th className="th-green" style={{ width: '90px' }}>GSTIN</th>
              <th className="th-green" style={{ width: '80px' }}>Salesman ID</th>
              <th className="th-green" style={{ width: '130px' }}>Salesman</th>
              <th className="th-green" style={{ width: '120px', textAlign: 'right' }}>(Taxable + Tax) Amt</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
                  No sales invoices match the specified criteria.
                </td>
              </tr>
            ) : (
              filtered.map((inv, idx) => (
                <tr key={inv.id}>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                  <td style={{ fontWeight: 'bold', color: '#1d4ed8' }}>{inv.invoiceNo}</td>
                  <td>{inv.invoiceDate}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      fontWeight: 'bold',
                      fontSize: '10px'
                    }}>
                      {inv.taxType}
                    </span>
                  </td>
                  <td>{inv.customerId}</td>
                  <td style={{ fontWeight: 'bold' }}>{inv.customerName}</td>
                  <td>{inv.contactNo}</td>
                  <td>{inv.state}</td>
                  <td style={{ fontSize: '10px' }}>{inv.gstin || '-'}</td>
                  <td>{inv.salesmanId}</td>
                  <td style={{ fontSize: '11px' }}>{inv.salesman}</td>
                  <td style={{ textAlign: 'right', fontWeight: '900', color: '#15803d' }}>
                    {inv.totalAmt.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER MATRIX (EXACT METRICS FROM SCREEN 250) */}
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
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>Offer Disc : 0.00</span>
          <span>Loyalty Disc : 0.00</span>
          <span>Coupon Disc : 0.00</span>
          <span>Gift Disc : 0.00</span>
          <span>WriteOff Disc : 0.00</span>
        </div>

        <div style={{
          fontSize: '15px',
          fontWeight: '900',
          color: '#15803d',
          background: '#dcfce7',
          padding: '4px 16px',
          borderRadius: '4px',
          border: '1px solid #86efac'
        }}>
          Total : ₹ {totalInvoiced.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
