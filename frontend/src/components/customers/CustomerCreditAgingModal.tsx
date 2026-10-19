import React, { useState, useEffect, useMemo } from 'react';
import type { CustomerCreditAgingSummary, CustomerAgingRow, CustomerInvoiceAgingItem } from '../../types/retailDaddy';
import {
  fetchCustomerCreditAging,
  fetchCustomerCreditAgingDetail,
  generateCustomerPaymentReminder
} from '../../api/client';

interface CustomerCreditAgingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCustomerLedger?: (customerId: number | string) => void;
}

export const CustomerCreditAgingModal: React.FC<CustomerCreditAgingModalProps> = ({
  isOpen,
  onClose,
  onOpenCustomerLedger
}) => {
  const [loading, setLoading] = useState(false);
  const [agingData, setAgingData] = useState<CustomerCreditAgingSummary | null>(null);
  const [filterMode, setFilterMode] = useState<'ALL' | 'OVERDUE' | 'HIGH_RISK'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  // Selected customer for detailed invoice drawer
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerAgingRow | null>(null);
  const [detailInvoices, setDetailInvoices] = useState<CustomerInvoiceAgingItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Sending reminder loading
  const [remindingId, setRemindingId] = useState<number | null>(null);

  // Load aging summary
  const loadAgingSummary = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomerCreditAging();
      setAgingData(data);
    } catch (e) {
      console.warn('Failed to load credit aging summary:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAgingSummary();
    }
  }, [isOpen]);

  // View Customer Aging Details
  const handleViewDetail = async (row: CustomerAgingRow) => {
    setSelectedCustomer(row);
    setDetailLoading(true);
    setDetailInvoices([]);
    try {
      const resp = await fetchCustomerCreditAgingDetail(row.customer_id);
      setDetailInvoices(resp.invoices || []);
    } catch (e) {
      console.warn('Failed to load aging detail:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  // 1-Click WhatsApp Payment Reminder Dispatch
  const handleSendReminder = async (row: CustomerAgingRow) => {
    setRemindingId(row.customer_id);
    try {
      const reminder = await generateCustomerPaymentReminder(row.customer_id);
      setActionNotice(`✓ Generated reminder for ${row.name}! Opening WhatsApp...`);
      window.open(reminder.whatsapp_url, '_blank');
    } catch (err: any) {
      setActionNotice(`⚠️ Failed to generate payment reminder: ${err.message || 'Error'}`);
    } finally {
      setRemindingId(null);
      setTimeout(() => setActionNotice(''), 4000);
    }
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!agingData?.rows) return [];
    return agingData.rows.filter(row => {
      if (filterMode === 'OVERDUE' && row.oldest_overdue_days <= 30) return false;
      if (filterMode === 'HIGH_RISK' && row.bucket_91_120 <= 0 && row.bucket_over_120 <= 0) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const mName = row.name.toLowerCase().includes(q);
        const mCode = row.code.toLowerCase().includes(q);
        const mPhone = row.phone.toLowerCase().includes(q);
        if (!mName && !mCode && !mPhone) return false;
      }
      return true;
    });
  }, [agingData, filterMode, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        backdropFilter: 'blur(5px)',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '1280px',
          maxWidth: '98vw',
          maxHeight: '94vh',
          backgroundColor: '#0f172a',
          borderRadius: '10px',
          border: '1px solid #1e293b',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          color: '#f8fafc'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f766e 0%, #0f172a 100%)',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #334155'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>📊</span>
            <div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                Customer Credit Aging & Khata Receivables Ledger
              </div>
              <div style={{ fontSize: '11px', color: '#ccfbf1' }}>
                Godrej Interio Showroom • 0–30, 31–60, 61–90, 91–120, &gt;120 Days Aging Buckets with 1-Click WhatsApp Reminders
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {actionNotice && (
              <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 600 }}>
                {actionNotice}
              </span>
            )}

            <button
              onClick={() => window.print()}
              style={{
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #475569',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🖨️ Print Report
            </button>

            <button
              onClick={loadAgingSummary}
              disabled={loading}
              style={{
                backgroundColor: '#0d9488',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              🔄 Refresh
            </button>

            <button
              onClick={onClose}
              style={{
                backgroundColor: '#334155',
                border: 'none',
                color: '#94a3b8',
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 6 Key Stat Cards Bar */}
        <div
          style={{
            backgroundColor: '#1e293b',
            padding: '12px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '12px',
            borderBottom: '1px solid #334155'
          }}
        >
          {/* Card 1: Total Receivables */}
          <div style={{ backgroundColor: '#0f172a', padding: '10px 14px', borderRadius: '6px', border: '1px solid #475569' }}>
            <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>Total Receivables</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
              ₹{(agingData?.total_receivables || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>
              {agingData?.total_customers_with_dues || 0} active customers
            </div>
          </div>

          {/* Card 2: 0-30 Days */}
          <div style={{ backgroundColor: '#064e3b33', padding: '10px 14px', borderRadius: '6px', border: '1px solid #05966977' }}>
            <div style={{ fontSize: '11px', color: '#6ee7b7', fontWeight: 700 }}>0 - 30 Days (Current)</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#6ee7b7', marginTop: '2px' }}>
              ₹{(agingData?.bucket_0_30_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '10px', color: '#a7f3d0', fontWeight: 500 }}>Standard Grace Period</div>
          </div>

          {/* Card 3: 31-60 Days */}
          <div style={{ backgroundColor: '#0369a133', padding: '10px 14px', borderRadius: '6px', border: '1px solid #0284c777' }}>
            <div style={{ fontSize: '11px', color: '#7dd3fc', fontWeight: 700 }}>31 - 60 Days (Notice)</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#7dd3fc', marginTop: '2px' }}>
              ₹{(agingData?.bucket_31_60_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '10px', color: '#bae6fd', fontWeight: 500 }}>1 Month Overdue</div>
          </div>

          {/* Card 4: 61-90 Days */}
          <div style={{ backgroundColor: '#78350f33', padding: '10px 14px', borderRadius: '6px', border: '1px solid #d9770677' }}>
            <div style={{ fontSize: '11px', color: '#fde047', fontWeight: 700 }}>61 - 90 Days (Warning)</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#fde047', marginTop: '2px' }}>
              ₹{(agingData?.bucket_61_90_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '10px', color: '#fef08a', fontWeight: 500 }}>2 Months Overdue</div>
          </div>

          {/* Card 5: 91-120 Days */}
          <div style={{ backgroundColor: '#83184333', padding: '10px 14px', borderRadius: '6px', border: '1px solid #db277777' }}>
            <div style={{ fontSize: '11px', color: '#f472b6', fontWeight: 700 }}>91 - 120 Days (Severe)</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#f472b6', marginTop: '2px' }}>
              ₹{(agingData?.bucket_91_120_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '10px', color: '#fbcfe8', fontWeight: 500 }}>3 Months Overdue</div>
          </div>

          {/* Card 6: >120 Days */}
          <div style={{ backgroundColor: '#7f1d1d33', padding: '10px 14px', borderRadius: '6px', border: '1px solid #dc262677' }}>
            <div style={{ fontSize: '11px', color: '#fca5a5', fontWeight: 700 }}>&gt; 120 Days (Critical)</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#fca5a5', marginTop: '2px' }}>
              ₹{(agingData?.bucket_over_120_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '10px', color: '#fecaca', fontWeight: 500 }}>High Risk / Bad Debt</div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div
          style={{
            padding: '10px 24px',
            backgroundColor: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderBottom: '1px solid #1e293b'
          }}
        >
          <input
            type="text"
            placeholder="🔍 Search customer name, code, or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '6px 12px',
              color: '#f8fafc',
              fontSize: '12px',
              outline: 'none'
            }}
          />

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setFilterMode('ALL')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                border: filterMode === 'ALL' ? '1px solid #14b8a6' : '1px solid #475569',
                backgroundColor: filterMode === 'ALL' ? '#0f766e' : '#1e293b',
                color: filterMode === 'ALL' ? '#ffffff' : '#e2e8f0',
                cursor: 'pointer'
              }}
            >
              All Customers ({agingData?.rows.length || 0})
            </button>
            <button
              onClick={() => setFilterMode('OVERDUE')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                border: filterMode === 'OVERDUE' ? '1px solid #facc15' : '1px solid #475569',
                backgroundColor: filterMode === 'OVERDUE' ? '#854d0e' : '#1e293b',
                color: filterMode === 'OVERDUE' ? '#ffffff' : '#e2e8f0',
                cursor: 'pointer'
              }}
            >
              Overdue (&gt;30 Days)
            </button>
            <button
              onClick={() => setFilterMode('HIGH_RISK')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                border: filterMode === 'HIGH_RISK' ? '1px solid #f87171' : '1px solid #475569',
                backgroundColor: filterMode === 'HIGH_RISK' ? '#991b1b' : '#1e293b',
                color: filterMode === 'HIGH_RISK' ? '#ffffff' : '#e2e8f0',
                cursor: 'pointer'
              }}
            >
              ⚠️ High Risk (&gt;90 Days)
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Customers Table Column */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e293b', color: '#f8fafc', fontWeight: 700, textAlign: 'left', position: 'sticky', top: 0, zIndex: 10, borderBottom: '2px solid #475569' }}>
                  <th style={{ padding: '10px 14px' }}>Customer / Party</th>
                  <th style={{ padding: '10px 14px', width: '130px', textAlign: 'right' }}>Total Due (₹)</th>
                  <th style={{ padding: '10px 14px', width: '90px', textAlign: 'right' }}>0-30 Days</th>
                  <th style={{ padding: '10px 14px', width: '90px', textAlign: 'right' }}>31-60 Days</th>
                  <th style={{ padding: '10px 14px', width: '90px', textAlign: 'right' }}>61-90 Days</th>
                  <th style={{ padding: '10px 14px', width: '90px', textAlign: 'right' }}>91-120 Days</th>
                  <th style={{ padding: '10px 14px', width: '90px', textAlign: 'right' }}>&gt;120 Days</th>
                  <th style={{ padding: '10px 14px', width: '100px', textAlign: 'center' }}>Oldest Age</th>
                  <th style={{ padding: '10px 14px', width: '90px', textAlign: 'center' }}>Risk Level</th>
                  <th style={{ padding: '10px 14px', width: '160px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                      {loading ? 'Calculating customer credit aging balances...' : 'No customers found with outstanding balances under this filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => {
                    const isSelected = selectedCustomer?.customer_id === row.customer_id;
                    const isReminding = remindingId === row.customer_id;

                    let riskBg = '#065f4633';
                    let riskColor = '#34d399';
                    if (row.risk_level === 'Critical') {
                      riskBg = '#7f1d1d44';
                      riskColor = '#f87171';
                    } else if (row.risk_level === 'Warning') {
                      riskBg = '#83184344';
                      riskColor = '#f472b6';
                    } else if (row.risk_level === 'Notice') {
                      riskBg = '#78350f44';
                      riskColor = '#fbbf24';
                    } else if (row.risk_level === 'Follow-up') {
                      riskBg = '#0369a144';
                      riskColor = '#38bdf8';
                    }

                    return (
                      <tr
                        key={row.customer_id}
                        style={{
                          borderBottom: '1px solid #334155',
                          backgroundColor: isSelected
                            ? '#0f766e33'
                            : idx % 2 === 0
                            ? '#0f172a'
                            : '#131d33',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        {/* Customer */}
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                            {row.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#cbd5e1', display: 'flex', gap: '8px', marginTop: '2px' }}>
                            <span>Code: <b style={{ color: '#ffffff' }}>{row.code}</b></span>
                            <span>•</span>
                            <span style={{ color: '#e2e8f0' }}>📞 {row.phone}</span>
                          </div>
                        </td>

                        {/* Total Due */}
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, fontSize: '13px', color: '#ffffff' }}>
                            ₹{row.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                            Limit: ₹{row.credit_limit.toLocaleString('en-IN')}
                          </div>
                        </td>

                        {/* 0-30 */}
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: row.bucket_0_30 > 0 ? '#6ee7b7' : '#64748b', fontWeight: row.bucket_0_30 > 0 ? 700 : 400 }}>
                          {row.bucket_0_30 > 0 ? `₹${row.bucket_0_30.toLocaleString('en-IN')}` : '-'}
                        </td>

                        {/* 31-60 */}
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: row.bucket_31_60 > 0 ? '#7dd3fc' : '#64748b', fontWeight: row.bucket_31_60 > 0 ? 700 : 400 }}>
                          {row.bucket_31_60 > 0 ? `₹${row.bucket_31_60.toLocaleString('en-IN')}` : '-'}
                        </td>

                        {/* 61-90 */}
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: row.bucket_61_90 > 0 ? '#fde047' : '#64748b', fontWeight: row.bucket_61_90 > 0 ? 700 : 400 }}>
                          {row.bucket_61_90 > 0 ? `₹${row.bucket_61_90.toLocaleString('en-IN')}` : '-'}
                        </td>

                        {/* 91-120 */}
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: row.bucket_91_120 > 0 ? '#f472b6' : '#64748b', fontWeight: row.bucket_91_120 > 0 ? 800 : 400 }}>
                          {row.bucket_91_120 > 0 ? `₹${row.bucket_91_120.toLocaleString('en-IN')}` : '-'}
                        </td>

                        {/* >120 */}
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: row.bucket_over_120 > 0 ? '#fca5a5' : '#64748b', fontWeight: row.bucket_over_120 > 0 ? 800 : 400 }}>
                          {row.bucket_over_120 > 0 ? `₹${row.bucket_over_120.toLocaleString('en-IN')}` : '-'}
                        </td>

                        {/* Oldest Age */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span
                            style={{
                              backgroundColor: row.oldest_overdue_days > 60 ? '#7f1d1d33' : '#1e293b',
                              color: row.oldest_overdue_days > 60 ? '#f87171' : '#cbd5e1',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 600,
                              fontSize: '11px'
                            }}
                          >
                            {row.oldest_overdue_days} days
                          </span>
                        </td>

                        {/* Risk */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span
                            style={{
                              backgroundColor: riskBg,
                              color: riskColor,
                              padding: '3px 8px',
                              borderRadius: '10px',
                              fontWeight: 700,
                              fontSize: '10.5px'
                            }}
                          >
                            {row.risk_level}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleSendReminder(row)}
                              disabled={isReminding}
                              style={{
                                backgroundColor: '#059669',
                                color: '#ffffff',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                              title="Send 1-Click WhatsApp reminder with bank details & UPI link"
                            >
                              💬 {isReminding ? '...' : 'WhatsApp'}
                            </button>

                            <button
                              onClick={() => handleViewDetail(row)}
                              style={{
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                color: '#94a3b8',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                              title="Inspect unpaid invoice breakdown"
                            >
                              📄 Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Customer Invoice Detail Drawer */}
          {selectedCustomer && (
            <div
              style={{
                width: '380px',
                backgroundColor: '#111827',
                borderLeft: '1px solid #1f2937',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto'
              }}
            >
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid #1f2937',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#1f2937'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#f9fafb' }}>
                    {selectedCustomer.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                    Code: {selectedCustomer.code} • Ph: {selectedCustomer.phone}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    fontSize: '15px'
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: '14px 18px', borderBottom: '1px solid #1f2937', backgroundColor: '#1e293b55' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: '#9ca3af' }}>Total Outstanding:</span>
                  <strong style={{ color: '#f87171', fontSize: '14px' }}>
                    ₹{selectedCustomer.current_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }}>
                  <span style={{ color: '#9ca3af' }}>Credit Limit:</span>
                  <span style={{ color: '#cbd5e1' }}>₹{selectedCustomer.credit_limit.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }}>
                  <span style={{ color: '#9ca3af' }}>Oldest Overdue:</span>
                  <span style={{ color: '#fcd34d', fontWeight: 600 }}>{selectedCustomer.oldest_overdue_days} Days</span>
                </div>

                <button
                  onClick={() => handleSendReminder(selectedCustomer)}
                  style={{
                    marginTop: '12px',
                    width: '100%',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  💬 Send WhatsApp Payment Reminder
                </button>

                {onOpenCustomerLedger && (
                  <button
                    onClick={() => onOpenCustomerLedger(selectedCustomer.customer_id)}
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      backgroundColor: '#1e293b',
                      border: '1px solid #3b82f6',
                      color: '#60a5fa',
                      padding: '7px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    📋 View Full Khata Ledger & Invoices
                  </button>
                )}
              </div>

              {/* Invoices List */}
              <div style={{ padding: '14px 18px', flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px', color: '#e5e7eb' }}>
                  Unpaid Invoices Breakdown ({detailInvoices.length})
                </div>

                {detailLoading ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
                    Loading invoices...
                  </div>
                ) : detailInvoices.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {detailInvoices.map(inv => (
                      <div
                        key={inv.invoice_id}
                        style={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '6px',
                          padding: '10px 12px',
                          fontSize: '11px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                          <span style={{ color: '#60a5fa' }}>#{inv.invoice_no}</span>
                          <span style={{ color: '#f87171' }}>Due: ₹{inv.balance_due.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af', marginTop: '3px' }}>
                          <span>Date: {inv.invoice_date}</span>
                          <span style={{ color: '#fcd34d', fontWeight: 600 }}>{inv.days_overdue} days ago</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280', marginTop: '2px' }}>
                          <span>Total: ₹{inv.grand_total.toLocaleString('en-IN')}</span>
                          <span>Paid: ₹{inv.paid_amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ marginTop: '6px' }}>
                          <span style={{ backgroundColor: '#374151', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', color: '#d1d5db' }}>
                            {inv.bucket}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '16px 0', color: '#9ca3af', fontSize: '12px' }}>
                    No specific unpaid invoice lines found. Outstanding amount is carried forward from opening/khata ledger.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
