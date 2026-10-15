import React, { useState } from 'react';
import type { Invoice } from '../../../types/pos';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  onSelectInvoice: (inv: Invoice) => void;
  onReprintInvoice: (inv: Invoice) => void;
  onDeleteInvoice?: (id: string) => void;
}

export const OldBillsSearchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  invoices,
  onSelectInvoice,
  onReprintInvoice,
  onDeleteInvoice
}) => {
  const [searchNo, setSearchNo] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [fromDate, setFromDate] = useState('2026-04-01');
  const [toDate, setToDate] = useState('2026-10-15');

  if (!isOpen) return null;

  const filtered = invoices.filter(inv => {
    if (searchNo && !inv.invoiceNo.toLowerCase().includes(searchNo.toLowerCase())) return false;
    if (searchCustomer && !inv.customer.name.toLowerCase().includes(searchCustomer.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="rd-modal-backdrop">
      <div className="rd-form-window" style={{ width: '920px', maxWidth: '96vw' }}>
        <div className="rd-form-titlebar" style={{ background: '#0284c7', color: '#fff' }}>
          <span>Search Old Bills / Sale Register (F5)</span>
          <button className="rd-win-btn close" onClick={onClose} style={{ color: '#fff' }}>✕</button>
        </div>

        <div style={{ padding: '12px', background: '#f8fafc' }}>
          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#f1f5f9', padding: '8px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', marginBottom: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 700, fontSize: '11px' }}>Search Bill No:</span>
              <input 
                type="text" 
                placeholder="GST-..." 
                value={searchNo} 
                onChange={e => setSearchNo(e.target.value)}
                style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #94a3b8', borderRadius: '2px', width: '120px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 700, fontSize: '11px' }}>Customer:</span>
              <input 
                type="text" 
                placeholder="Cash / Venkatesh..." 
                value={searchCustomer} 
                onChange={e => setSearchCustomer(e.target.value)}
                style={{ padding: '3px 6px', fontSize: '11px', border: '1px solid #94a3b8', borderRadius: '2px', width: '140px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 700, fontSize: '11px' }}>From:</span>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ padding: '2px 4px', fontSize: '11px' }} />
              <span style={{ fontWeight: 700, fontSize: '11px' }}>To:</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ padding: '2px 4px', fontSize: '11px' }} />
            </div>

            <button 
              className="rd-classic-btn"
              onClick={() => { setSearchNo(''); setSearchCustomer(''); }}
              style={{ marginLeft: 'auto' }}
            >
              Reset Filters
            </button>
          </div>

          {/* Table */}
          <div style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid #cbd5e1', background: '#fff' }}>
            <table className="rd-grid-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>Sr</th>
                  <th>Bill No</th>
                  <th>Date</th>
                  <th>Customer Name</th>
                  <th>Phone</th>
                  <th className="numeric">Items</th>
                  <th className="numeric">Total Qty</th>
                  <th className="numeric">Net Payable (₹)</th>
                  <th>Payment Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                      No bills found matching search filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((inv, idx) => (
                    <tr key={inv.id}>
                      <td>{idx + 1}</td>
                      <td style={{ fontWeight: 700, color: '#0284c7' }}>{inv.invoiceNo}</td>
                      <td>{inv.date}</td>
                      <td style={{ fontWeight: 600 }}>{inv.customer.name}</td>
                      <td>{inv.customer.contactNo}</td>
                      <td className="numeric">{inv.itemsCount}</td>
                      <td className="numeric">{inv.totalQty}</td>
                      <td className="numeric" style={{ fontWeight: 800, color: '#15803d' }}>₹ {inv.netPay.toFixed(2)}</td>
                      <td>
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: '3px', fontWeight: 700, fontSize: '10px' }}>
                          {inv.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button 
                            className="rd-classic-btn"
                            style={{ padding: '2px 6px', fontSize: '10px', background: '#e0f2fe', color: '#0369a1' }}
                            onClick={() => onSelectInvoice(inv)}
                            title="Load bill into POS"
                          >
                            Load
                          </button>
                          <button 
                            className="rd-classic-btn"
                            style={{ padding: '2px 6px', fontSize: '10px', background: '#fef3c7', color: '#b45309' }}
                            onClick={() => onReprintInvoice(inv)}
                            title="Reprint 3-inch thermal receipt"
                          >
                            Reprint
                          </button>
                          <button 
                            className="rd-classic-btn"
                            style={{ padding: '2px 6px', fontSize: '10px', background: '#fee2e2', color: '#b91c1c' }}
                            onClick={() => {
                              if (confirm(`Void / Delete invoice ${inv.invoiceNo}? This action is authorized for Admin.`)) {
                                onDeleteInvoice?.(inv.id);
                              }
                            }}
                            title="Void / Delete invoice (Feature 35)"
                          >
                            Void
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ padding: '8px 12px', background: '#e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #cbd5e1' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>
            Total Invoices: {filtered.length} | Total Net: ₹ {filtered.reduce((s, i) => s + i.netPay, 0).toLocaleString('en-IN')}.00
          </span>
          <button className="rd-classic-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
