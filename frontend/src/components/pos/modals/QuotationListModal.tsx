import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import type { Quotation } from '../../../types/pos';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  quotations: Quotation[];
  onLoadQuotation: (quotation: Quotation) => void;
}

export const QuotationListModal: React.FC<Props> = ({
  isOpen,
  onClose,
  quotations,
  onLoadQuotation
}) => {
  const [fromDate, setFromDate] = useState('2026-04-01');
  const [toDate, setToDate] = useState('2026-10-15');
  const [searchNo, setSearchNo] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [searchSalesman, setSearchSalesman] = useState('');

  if (!isOpen) return null;

  const filtered = quotations.filter(q => {
    if (searchNo && !q.quotationNo.toLowerCase().includes(searchNo.toLowerCase())) return false;
    if (searchCustomer && !q.customer.name.toLowerCase().includes(searchCustomer.toLowerCase())) return false;
    if (searchSalesman && q.salesman && !q.salesman.toLowerCase().includes(searchSalesman.toLowerCase())) return false;
    return true;
  });

  const handleReset = () => {
    setSearchNo('');
    setSearchCustomer('');
    setSearchSalesman('');
  };

  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal-window" style={{ maxWidth: '980px', width: '96%' }}>
        <div
          className="pos-modal-header"
          style={{ background: '#1d4ed8', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>List of Quotations</h3>
          </div>
          <button className="pos-modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ padding: '16px', background: '#f8fafc' }}>
          {/* Search Filters Row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Search by Quotation Date</span>
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem' }}>From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  style={{ padding: '3px', fontSize: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                />
                <span style={{ fontSize: '0.75rem' }}>To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  style={{ padding: '3px', fontSize: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '3px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Search By Quotation No.</label>
              <input
                type="text"
                placeholder="e.g. GST-0001"
                value={searchNo}
                onChange={e => setSearchNo(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', marginTop: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Search By Customer Name</label>
              <input
                type="text"
                placeholder="Customer Name"
                value={searchCustomer}
                onChange={e => setSearchCustomer(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', marginTop: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end' }}>
              <button
                type="button"
                onClick={handleReset}
                style={{ padding: '7px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Table Grid matching frame 522 */}
          <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', maxHeight: '340px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#0284c7', color: '#fff', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px' }}>Quotation No.</th>
                  <th style={{ padding: '8px 10px' }}>Date</th>
                  <th style={{ padding: '8px 10px' }}>Customer ID</th>
                  <th style={{ padding: '8px 10px' }}>Customer Name</th>
                  <th style={{ padding: '8px 10px' }}>Contact No.</th>
                  <th style={{ padding: '8px 10px' }}>State</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Net Pay (₹)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                      No quotations found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((q, idx) => (
                    <tr
                      key={q.id}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        background: idx % 2 === 0 ? '#fff' : '#f8fafc'
                      }}
                    >
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#1d4ed8' }}>{q.quotationNo}</td>
                      <td style={{ padding: '8px 10px' }}>{q.date}</td>
                      <td style={{ padding: '8px 10px' }}>{q.customer.code}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{q.customer.name}</td>
                      <td style={{ padding: '8px 10px' }}>{q.customer.contactNo}</td>
                      <td style={{ padding: '8px 10px' }}>{q.customer.state}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                        ₹ {q.netPay.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            onLoadQuotation(q);
                            onClose();
                          }}
                          style={{
                            padding: '4px 12px',
                            background: '#16a34a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '3px',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Load into Invoice
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
