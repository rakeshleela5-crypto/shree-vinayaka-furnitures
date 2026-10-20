import React, { useState, useEffect } from 'react';
import { api, notifyApiSuccess, notifyApiError } from '../../api/client';

interface DayEndClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const DayEndClosingModal: React.FC<DayEndClosingModalProps> = ({
  isOpen,
  onClose,
  showToast
}) => {
  const [targetDate, setTargetDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [openingFloat, setOpeningFloat] = useState<string>('5000');
  const [countedCash, setCountedCash] = useState<string>('5000');
  const [cashierName, setCashierName] = useState<string>('Rakesh Leela');
  const [terminalId, setTerminalId] = useState<string>('POS-01 (Showroom Counter)');
  const [notes, setNotes] = useState<string>('9:00 PM Showroom Day-End Closing Settlement');

  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'SETTLEMENT' | 'DAY_BOOK'>('SETTLEMENT');
  const [dayBookSearch, setDayBookSearch] = useState<string>('');

  const fetchSummary = async (date: string) => {
    try {
      setLoading(true);
      const res = await api.getDayCloseSummary(date);
      setSummaryData(res);
      if (res) {
        const exp = (parseFloat(openingFloat) || 0) + (res.breakdown?.cash_sales || 0) + (res.cash_incomes || 0) - (res.cash_expenses || 0) - (res.cash_supplier_payments || 0) - (res.cash_sale_returns || 0);
        setCountedCash(String(Math.max(0, exp)));
      }
    } catch (err: any) {
      console.warn('Error fetching day close summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSummary(targetDate);
    }
  }, [isOpen, targetDate]);

  if (!isOpen) return null;

  const floatVal = parseFloat(openingFloat) || 0;
  const countedVal = parseFloat(countedCash) || 0;

  const cashSales = summaryData?.breakdown?.cash_sales || 0;
  const upiSales = summaryData?.breakdown?.upi_sales || 0;
  const cardSales = summaryData?.breakdown?.card_sales || 0;
  const creditSales = summaryData?.breakdown?.credit_sales || 0;
  const cashIncomes = summaryData?.cash_incomes || 0;
  const cashExpenses = summaryData?.cash_expenses || 0;
  const cashSupplierPayments = summaryData?.cash_supplier_payments || 0;
  const cashSaleReturns = summaryData?.cash_sale_returns || 0;
  const totalSales = summaryData?.total_sales_amount || 0;
  const billsCount = summaryData?.total_bills_count || 0;

  // Expected Cash calculation: Float + Cash Sales + Incomes - Expenses - Supplier Payouts - Sale Returns
  const expectedCash = (floatVal + cashSales + cashIncomes) - (cashExpenses + cashSupplierPayments + cashSaleReturns);
  const variance = countedVal - expectedCash;

  const handleSettleShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    const shiftCode = `SHIFT-${targetDate.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;

    const payload = {
      shift_code: shiftCode,
      date: targetDate,
      cashier_name: cashierName,
      terminal_id: terminalId,
      opening_cash: floatVal,
      total_sales_amount: totalSales,
      cash_sales: cashSales,
      card_sales: cardSales,
      upi_sales: upiSales,
      credit_sales: creditSales,
      cash_expenses: cashExpenses + cashSupplierPayments + cashSaleReturns,
      expected_drawer_cash: expectedCash,
      actual_physical_cash: countedVal,
      cash_difference: variance,
      total_bills_count: billsCount,
      status: 'Closed',
      notes: notes
    };

    try {
      await api.recordShiftSettlement(payload);
      notifyApiSuccess(`Shift ${shiftCode} successfully settled and locked in Railway PostgreSQL! Variance: ₹${variance.toFixed(2)}`);
      showToast?.(`✓ Day-End Till closed! Variance: ₹${variance >= 0 ? '+' : ''}${variance.toFixed(2)}`, variance === 0 ? 'success' : (variance > 0 ? 'info' : 'warning'));
      onClose();
    } catch (err: any) {
      notifyApiError('Failed to record shift settlement', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadZReport = () => {
    api.downloadDayClosePdf(targetDate);
    showToast?.('✓ Z-Report PDF print generated!', 'info');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
      <div
        style={{
          width: '94%',
          maxWidth: '850px',
          maxHeight: '94vh',
          backgroundColor: '#f8fafc',
          border: '2px solid #0f766e',
          borderRadius: '8px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            background: 'linear-gradient(180deg, #0f766e 0%, #115e59 100%)',
            color: '#ffffff',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #042f2e'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>🔐</span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                Day-End Cashier Closing & Day Book (Vyapar Audit)
              </div>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>
                Till Drawer Reconciliation • Chronological Cash Ledger • Locks Day's Books
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '3px', background: '#042f2e', padding: '3px', borderRadius: '5px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('SETTLEMENT')}
                style={{
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'SETTLEMENT' ? '#0f766e' : 'transparent',
                  color: '#ffffff',
                  boxShadow: activeTab === 'SETTLEMENT' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
                }}
              >
                📊 Till Settlement
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('DAY_BOOK')}
                style={{
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'DAY_BOOK' ? '#0f766e' : 'transparent',
                  color: '#ffffff',
                  boxShadow: activeTab === 'DAY_BOOK' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none'
                }}
              >
                📖 Day Book (Line Audit)
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#e11d48',
                border: '1px solid #ffffff',
                color: '#ffffff',
                width: '28px',
                height: '24px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {activeTab === 'DAY_BOOK' ? (
          <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Top Filter and Info Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>Date:</span>
                <input
                  type="date"
                  value={targetDate}
                  onChange={e => setTargetDate(e.target.value)}
                  style={{ height: '28px', border: '1px solid #94a3b8', borderRadius: '3px', padding: '0 6px', fontSize: '12px' }}
                />
                <input
                  type="text"
                  placeholder="🔍 Search Ref No / Party..."
                  value={dayBookSearch}
                  onChange={e => setDayBookSearch(e.target.value)}
                  style={{ height: '28px', width: '220px', border: '1px solid #94a3b8', borderRadius: '3px', padding: '0 8px', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    backgroundColor: '#0f766e',
                    color: '#ffffff',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>🖨️</span> Print Day Book
                </button>
              </div>
            </div>

            {/* Opening Cash Float Banner */}
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '8px 14px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <span style={{ fontWeight: 'bold', color: '#166534' }}>Opening Cash-in-Hand (Till Float):</span>
              <span style={{ fontWeight: '900', color: '#15803d', fontFamily: 'monospace', fontSize: '14px' }}>₹{floatVal.toFixed(2)}</span>
            </div>

            {/* Transactions Table */}
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#0f766e', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px' }}>TIME</th>
                    <th style={{ padding: '8px 10px' }}>REF NO.</th>
                    <th style={{ padding: '8px 10px' }}>PARTY / RECIPIENT</th>
                    <th style={{ padding: '8px 10px' }}>TYPE</th>
                    <th style={{ padding: '8px 10px' }}>MODE</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>CASH IN (+)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>CASH OUT (-)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>RUNNING CASH</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const txs = (summaryData?.day_book_transactions || []).filter((t: any) =>
                      !dayBookSearch ||
                      t.ref_no?.toLowerCase().includes(dayBookSearch.toLowerCase()) ||
                      t.party_name?.toLowerCase().includes(dayBookSearch.toLowerCase())
                    );
                    if (txs.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                            No cash transactions recorded for date {targetDate}.
                          </td>
                        </tr>
                      );
                    }
                    let runBal = floatVal;
                    return txs.map((tx: any, idx: number) => {
                      runBal += (tx.cash_in || 0) - (tx.cash_out || 0);
                      return (
                        <tr key={tx.id || idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                          <td style={{ padding: '7px 10px', color: '#64748b', fontFamily: 'monospace' }}>{tx.time}</td>
                          <td style={{ padding: '7px 10px', fontWeight: 'bold', color: '#0369a1', fontFamily: 'monospace' }}>{tx.ref_no}</td>
                          <td style={{ padding: '7px 10px', fontWeight: '600', color: '#1e293b' }}>{tx.party_name}</td>
                          <td style={{ padding: '7px 10px' }}>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 'bold',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              background: tx.type === 'Sale Invoice' ? '#dbeafe' : tx.type === 'Payment-In' ? '#dcfce7' : '#fee2e2',
                              color: tx.type === 'Sale Invoice' ? '#1d4ed8' : tx.type === 'Payment-In' ? '#15803d' : '#b91c1c'
                            }}>
                              {tx.type}
                            </span>
                          </td>
                          <td style={{ padding: '7px 10px', color: '#475569' }}>{tx.payment_mode}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 'bold', color: tx.cash_in > 0 ? '#15803d' : '#94a3b8', fontFamily: 'monospace' }}>
                            {tx.cash_in > 0 ? `₹${tx.cash_in.toFixed(2)}` : '-'}
                          </td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 'bold', color: tx.cash_out > 0 ? '#dc2626' : '#94a3b8', fontFamily: 'monospace' }}>
                            {tx.cash_out > 0 ? `₹${tx.cash_out.toFixed(2)}` : '-'}
                          </td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: '900', color: runBal >= 0 ? '#0f766e' : '#dc2626', fontFamily: 'monospace' }}>
                            ₹{runBal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f1f5f9', fontWeight: 'bold', borderTop: '2px solid #cbd5e1' }}>
                    <td colSpan={5} style={{ padding: '10px', textAlign: 'right', color: '#334155' }}>
                      TOTALS (Summary for {targetDate}):
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#15803d', fontFamily: 'monospace', fontWeight: '900' }}>
                      ₹{(cashSales + cashIncomes).toFixed(2)}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#dc2626', fontFamily: 'monospace', fontWeight: '900' }}>
                      ₹{(cashExpenses + cashSupplierPayments + cashSaleReturns).toFixed(2)}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'right', color: '#0f766e', fontFamily: 'monospace', fontWeight: '900', fontSize: '13px' }}>
                      ₹{(floatVal + expectedCash).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Closing Balance Strip */}
            <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', padding: '10px 14px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#065f46', fontWeight: 'bold' }}>CLOSING CASH-IN-HAND:</div>
                <div style={{ fontSize: '11px', color: '#047857' }}>Net drawer cash balance = Opening Float + Total Cash In - Total Cash Out</div>
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#047857', fontFamily: 'monospace' }}>
                ₹{(floatVal + expectedCash).toFixed(2)}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSettleShift} style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Top Control Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr', gap: '10px', background: '#ffffff', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
                Closing Date :
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                style={{ width: '100%', height: '28px', border: '1px solid #94a3b8', borderRadius: '3px', padding: '0 6px', fontSize: '12px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
                Cashier Name :
              </label>
              <input
                type="text"
                value={cashierName}
                onChange={e => setCashierName(e.target.value)}
                style={{ width: '100%', height: '28px', border: '1px solid #94a3b8', borderRadius: '3px', padding: '0 6px', fontSize: '12px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
                Counter Terminal :
              </label>
              <input
                type="text"
                value={terminalId}
                onChange={e => setTerminalId(e.target.value)}
                style={{ width: '100%', height: '28px', border: '1px solid #94a3b8', borderRadius: '3px', padding: '0 6px', fontSize: '12px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
                Opening Cash Float (₹) :
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={openingFloat}
                onChange={e => setOpeningFloat(e.target.value)}
                style={{ width: '100%', height: '28px', border: '1px solid #0f766e', borderRadius: '3px', padding: '0 6px', fontSize: '12px', textAlign: 'right', fontWeight: 'bold', color: '#0f766e' }}
              />
            </div>
          </div>

          {/* Live POS Summary Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: '6px', padding: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#065f46', textTransform: 'uppercase' }}>
                Total Revenue ({billsCount} Bills)
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#047857', marginTop: '4px' }}>
                ₹{totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '10px', color: '#047857', marginTop: '2px' }}>
                Non-voided customer sales
              </div>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '6px', padding: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase' }}>
                Cash Counter Inflow
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#1d4ed8', marginTop: '4px' }}>
                ₹{(cashSales + cashIncomes).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '10px', color: '#2563eb', marginTop: '2px' }}>
                Sales ₹{cashSales.toFixed(0)} + Khata ₹{cashIncomes.toFixed(0)}
              </div>
            </div>

            <div style={{ background: '#faf5ff', border: '1px solid #d8b4fe', borderRadius: '6px', padding: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#6b21a8', textTransform: 'uppercase' }}>
                UPI / Digital / Card
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#7e22ce', marginTop: '4px' }}>
                ₹{(upiSales + cardSales).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '10px', color: '#9333ea', marginTop: '2px' }}>
                UPI ₹{upiSales.toFixed(0)} | Card ₹{cardSales.toFixed(0)}
              </div>
            </div>

            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '6px', padding: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#9f1239', textTransform: 'uppercase' }}>
                Cash Outflows Paid
              </div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#be123c', marginTop: '4px' }}>
                ₹{(cashExpenses + cashSupplierPayments + cashSaleReturns).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '10px', color: '#e11d48', marginTop: '2px' }}>
                Petty ₹{cashExpenses.toFixed(0)} | Supp ₹{cashSupplierPayments.toFixed(0)} | Ret ₹{cashSaleReturns.toFixed(0)}
              </div>
            </div>
          </div>

          {/* Detailed Cash Reconciliation Calculation Box */}
          <div style={{ background: '#ffffff', border: '2px solid #0f766e', borderRadius: '6px', padding: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f766e', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Till Drawer Cash Math (Frame 11 Equation)</span>
              <span>{loading ? '⏳ Calculating from PostgreSQL...' : '✓ Synchronized'}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto repeat(4, 1fr)', gap: '6px', alignItems: 'center', textAlign: 'center', fontSize: '11px' }}>
              <div style={{ background: '#f1f5f9', padding: '6px', borderRadius: '4px' }}>
                <div style={{ color: '#64748b' }}>Float</div>
                <div style={{ fontWeight: 'bold', color: '#0f172a' }}>₹{floatVal.toFixed(0)}</div>
              </div>
              <div style={{ fontWeight: '900', color: '#16a34a' }}>+</div>
              <div style={{ background: '#f0fdf4', padding: '6px', borderRadius: '4px' }}>
                <div style={{ color: '#16a34a' }}>Cash Sales</div>
                <div style={{ fontWeight: 'bold', color: '#15803d' }}>₹{cashSales.toFixed(0)}</div>
              </div>
              <div style={{ fontWeight: '900', color: '#16a34a' }}>+</div>
              <div style={{ background: '#f0fdf4', padding: '6px', borderRadius: '4px' }}>
                <div style={{ color: '#16a34a' }}>Khata Inflow</div>
                <div style={{ fontWeight: 'bold', color: '#15803d' }}>₹{cashIncomes.toFixed(0)}</div>
              </div>
              <div style={{ fontWeight: '900', color: '#dc2626' }}>-</div>
              <div style={{ background: '#fef2f2', padding: '6px', borderRadius: '4px' }}>
                <div style={{ color: '#dc2626' }}>Petty Exp</div>
                <div style={{ fontWeight: 'bold', color: '#b91c1c' }}>₹{cashExpenses.toFixed(0)}</div>
              </div>
              <div style={{ fontWeight: '900', color: '#dc2626' }}>-</div>
              <div style={{ background: '#fef2f2', padding: '6px', borderRadius: '4px' }}>
                <div style={{ color: '#dc2626' }}>Supp Pay</div>
                <div style={{ fontWeight: 'bold', color: '#b91c1c' }}>₹{cashSupplierPayments.toFixed(0)}</div>
              </div>
              <div style={{ fontWeight: '900', color: '#dc2626' }}>-</div>
              <div style={{ background: '#fef2f2', padding: '6px', borderRadius: '4px' }}>
                <div style={{ color: '#dc2626' }}>Returns</div>
                <div style={{ fontWeight: 'bold', color: '#b91c1c' }}>₹{cashSaleReturns.toFixed(0)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', background: '#f8fafc', padding: '8px 12px', borderRadius: '4px', border: '1px dashed #cbd5e1' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>
                System Calculated Expected Cash in Drawer :
              </span>
              <span style={{ fontSize: '18px', fontWeight: '900', color: '#0f766e' }}>
                ₹{expectedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Cashier Count & Variance Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', alignItems: 'center', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>
                Physical Cash Counted in Till Drawer (₹) * :
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '7px', fontSize: '18px', fontWeight: 'bold', color: '#64748b' }}>₹</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={countedCash}
                  onChange={e => setCountedCash(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    border: '2px solid #0f766e',
                    borderRadius: '4px',
                    padding: '0 12px 0 30px',
                    fontSize: '20px',
                    fontWeight: '900',
                    color: '#0f172a',
                    textAlign: 'right'
                  }}
                />
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                Count and enter all notes & coins in the counter cash drawer.
              </div>
            </div>

            {/* Calculated Variance Card */}
            <div
              style={{
                borderRadius: '6px',
                padding: '12px',
                border: Math.abs(variance) < 0.01 ? '2px solid #16a34a' : (variance > 0 ? '2px solid #059669' : '2px solid #dc2626'),
                backgroundColor: Math.abs(variance) < 0.01 ? '#f0fdf4' : (variance > 0 ? '#ecfdf5' : '#fef2f2'),
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase' }}>
                Drawer Variance (Over / Short)
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: '900',
                  marginTop: '4px',
                  color: Math.abs(variance) < 0.01 ? '#15803d' : (variance > 0 ? '#047857' : '#b91c1c')
                }}
              >
                {variance >= 0 ? '+' : ''}₹{variance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '2px', color: Math.abs(variance) < 0.01 ? '#15803d' : (variance > 0 ? '#047857' : '#b91c1c') }}>
                {Math.abs(variance) < 0.01
                  ? '✓ PERFECT MATCH: No Till Discrepancy'
                  : (variance > 0
                    ? '▲ SURPLUS: Cash Excess in Drawer'
                    : '⚠️ SHORTAGE: Deficit / Cash Leak Detected!')}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>
              Shift Settlement / Manager Verification Notes :
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Verified by Store Manager Rakesh. Drawer locked for the night."
              style={{ width: '100%', border: '1px solid #94a3b8', borderRadius: '4px', padding: '6px 8px', fontSize: '12px' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #cbd5e1', paddingTop: '12px' }}>
            <button
              type="button"
              onClick={handleDownloadZReport}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>🖨️</span> Print Day-End Z-Report PDF
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #94a3b8',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  backgroundColor: '#0f766e',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 20px',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Locking Shift...' : '🔒 Lock & Settle Shift / Day-End Closing'}
              </button>
            </div>
          </div>
        </form>
      )}
      </div>
    </div>
  );
};
