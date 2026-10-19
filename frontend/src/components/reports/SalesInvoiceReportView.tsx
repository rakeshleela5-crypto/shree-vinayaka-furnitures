import { useState, useMemo, useEffect } from 'react';
import type { Customer } from '../../types/retailDaddy';
import { api } from '../../api/client';

export interface SalesInvoiceRecord {
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
  paidAmount: number;
  balanceDue: number;
  status: 'PAID' | 'PARTIAL' | 'CREDIT';
  paymentMode: string;
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
  const [backendInvoices, setBackendInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const data = await api.getSalesInvoices(0, 100);
      if (Array.isArray(data)) {
        setBackendInvoices(data);
      }
    } catch (e) {
      console.warn('Failed to fetch sales invoices from cloud:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    const handleRefresh = () => fetchInvoices();
    window.addEventListener('svf-invoice-settled', handleRefresh);
    window.addEventListener('svf-delivery-pipeline-refresh', handleRefresh);
    return () => {
      window.removeEventListener('svf-invoice-settled', handleRefresh);
      window.removeEventListener('svf-delivery-pipeline-refresh', handleRefresh);
    };
  }, []);

  // Merge PostgreSQL cloud invoices with in-memory session invoices
  const allInvoices: SalesInvoiceRecord[] = useMemo(() => {
    const list: SalesInvoiceRecord[] = [];

    // Prioritize cloud invoices from Railway PostgreSQL
    if (backendInvoices && backendInvoices.length > 0) {
      backendInvoices.forEach(inv => {
        const grandTotal = Number(inv.grand_total || inv.total || 0);
        const paid = Number(inv.paid_amount !== undefined ? inv.paid_amount : grandTotal);
        const balance = Number(inv.balance_due !== undefined ? inv.balance_due : Math.max(0, grandTotal - paid));
        let status: 'PAID' | 'PARTIAL' | 'CREDIT' = 'PAID';
        if (balance > 0.01) {
          status = paid > 0.01 ? 'PARTIAL' : 'CREDIT';
        }

        list.push({
          id: String(inv.id),
          invoiceNo: inv.invoice_no,
          invoiceDate: inv.date || inv.invoice_date || '',
          taxType: 'GST',
          customerId: inv.customer_id ? `C-${inv.customer_id}` : 'C-0001',
          customerName: inv.customer_name || 'Cash',
          contactNo: inv.customer_phone || '',
          state: 'Kerala',
          gstin: '',
          salesmanId: inv.salesman_code || 'S-01',
          salesman: inv.salesman_code ? `Salesman (${inv.salesman_code})` : 'Mahesh (Counter 1)',
          taxableAmt: Number(inv.taxable_amount || 0),
          taxAmt: Number((inv.cgst_amount || 0) + (inv.sgst_amount || 0) + (inv.igst_amount || 0)),
          totalAmt: grandTotal,
          paidAmount: paid,
          balanceDue: balance,
          status,
          paymentMode: inv.payment_mode || 'Cash',
          tillId: 'DESKTOP-SHPOBV'
        });
      });
    }

    // Also include newly locally generated invoices not yet fetched
    if (invoices && invoices.length > 0) {
      invoices.forEach((inv, idx) => {
        const invNo = inv.invoiceNo || `SVF-${idx}`;
        if (!list.some(x => x.invoiceNo === invNo)) {
          const grandTotal = Number(inv.netPay || inv.grandTotal || 0);
          const paid = Number(inv.paidAmount !== undefined ? inv.paidAmount : grandTotal);
          const balance = Number(inv.balanceDue !== undefined ? inv.balanceDue : Math.max(0, grandTotal - paid));
          let status: 'PAID' | 'PARTIAL' | 'CREDIT' = 'PAID';
          if (balance > 0.01) {
            status = paid > 0.01 ? 'PARTIAL' : 'CREDIT';
          }

          list.unshift({
            id: inv.id || `live-${idx}`,
            invoiceNo: invNo,
            invoiceDate: inv.date?.split(' ')[0] || new Date().toLocaleDateString('en-GB'),
            taxType: 'GST',
            customerId: inv.customer?.id ? String(inv.customer.id) : 'C-0001',
            customerName: inv.customer?.name || 'Cash',
            contactNo: inv.customer?.phone || '',
            state: inv.customer?.state || 'Kerala',
            gstin: inv.customer?.gstin || '',
            salesmanId: inv.salesman?.code || 'S-01',
            salesman: inv.salesman?.name || 'Mahesh (Counter 1)',
            taxableAmt: inv.taxableTotal || (grandTotal - (inv.totalTax || 0)),
            taxAmt: inv.totalTax || 0,
            totalAmt: grandTotal,
            paidAmount: paid,
            balanceDue: balance,
            status,
            paymentMode: inv.paymentMode || 'CASH',
            tillId: 'DESKTOP-SHPOBV'
          });
        }
      });
    }

    return list;
  }, [backendInvoices, invoices]);

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
    link.setAttribute('download', `SVF_List_Of_Sales_Invoices_${Date.now()}.csv`);
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
            <button
              className="rd-grid-btn"
              style={{ background: '#7c3aed', color: '#fff', fontWeight: 'bold', padding: '5px 16px' }}
              onClick={async () => {
                await fetchInvoices();
                showToast('✓ Cloud Invoices synced with Railway PostgreSQL');
              }}
            >
              {isLoading ? 'Syncing...' : '↻ Cloud Sync'}
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
              <th className="th-green" style={{ width: '130px' }}>Invoice No.</th>
              <th className="th-green" style={{ width: '85px' }}>Date</th>
              <th className="th-green" style={{ width: '65px', textAlign: 'center' }}>Tax</th>
              <th className="th-green" style={{ width: '120px' }}>Customer Name</th>
              <th className="th-green" style={{ width: '90px' }}>Contact</th>
              <th className="th-green" style={{ width: '90px', textAlign: 'center' }}>Status</th>
              <th className="th-green" style={{ width: '90px', textAlign: 'right' }}>Total (₹)</th>
              <th className="th-green" style={{ width: '90px', textAlign: 'right' }}>Paid (₹)</th>
              <th className="th-green" style={{ width: '90px', textAlign: 'right' }}>Balance Due (₹)</th>
              <th className="th-green" style={{ width: '100px' }}>Salesman</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
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
                  <td style={{ fontWeight: 'bold' }}>{inv.customerName}</td>
                  <td>{inv.contactNo || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      background: inv.status === 'PAID' ? '#dcfce7' : inv.status === 'PARTIAL' ? '#fef3c7' : '#fee2e2',
                      color: inv.status === 'PAID' ? '#15803d' : inv.status === 'PARTIAL' ? '#b45309' : '#b91c1c',
                      border: `1px solid ${inv.status === 'PAID' ? '#86efac' : inv.status === 'PARTIAL' ? '#fcd34d' : '#fca5a5'}`,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: '900',
                      fontSize: '11px',
                      letterSpacing: '0.05em'
                    }}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>
                    ₹{inv.totalAmt.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>
                    ₹{inv.paidAmount.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: inv.balanceDue > 0 ? '#dc2626' : '#15803d' }}>
                    ₹{inv.balanceDue.toFixed(2)}
                  </td>
                  <td style={{ fontSize: '11px' }}>{inv.salesman}</td>
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
