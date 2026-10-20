import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

interface FinancialStatementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export const FinancialStatementsModal: React.FC<FinancialStatementsModalProps> = ({
  isOpen,
  onClose,
  showToast
}) => {
  const [activeStatement, setActiveStatement] = useState<'PL' | 'BALANCE_SHEET'>('PL');
  const [layoutMode, setLayoutMode] = useState<'HORIZONTAL' | 'VERTICAL'>('HORIZONTAL');
  const [period, setPeriod] = useState<string>('THIS_MONTH');
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const res = await api.getFinancialStatements(fromDate, toDate);
      if (res) setData(res);
    } catch (err: any) {
      console.warn('Failed to load financial statements:', err);
      showToast?.('Failed to load financial statements', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatements();
    }
  }, [isOpen, fromDate, toDate]);

  if (!isOpen) return null;

  const pl = data?.profit_and_loss;
  const bs = data?.balance_sheet;

  const trading = pl?.trading_account || {};
  const income = pl?.income_statement || {};
  const assets = bs?.assets || {};
  const liabilities = bs?.liabilities_and_equity || {};

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '95%',
          maxWidth: '1050px',
          maxHeight: '94vh',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div style={{
          background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)',
          color: '#ffffff',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid #172554'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>📊</span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 'bold' }}>
                Vyapar Financial Statements & Accounting Reports
              </div>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>
                Profit & Loss Statement (Trading & Income) • Balance Sheet (Assets vs Liabilities)
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Statement Toggle */}
            <div style={{ display: 'flex', gap: '2px', background: '#0f172a', padding: '3px', borderRadius: '5px' }}>
              <button
                type="button"
                onClick={() => setActiveStatement('PL')}
                style={{
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeStatement === 'PL' ? '#2563eb' : 'transparent',
                  color: '#ffffff'
                }}
              >
                📈 Profit and Loss
              </button>
              <button
                type="button"
                onClick={() => setActiveStatement('BALANCE_SHEET')}
                style={{
                  padding: '4px 12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeStatement === 'BALANCE_SHEET' ? '#2563eb' : 'transparent',
                  color: '#ffffff'
                }}
              >
                ⚖️ Balance Sheet
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#e11d48',
                border: '1px solid #ffffff',
                color: '#ffffff',
                width: '26px',
                height: '24px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div style={{
          padding: '8px 16px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 'bold', color: '#475569' }}>Period:</span>
            <select
              value={period}
              onChange={e => {
                const val = e.target.value;
                setPeriod(val);
                const now = new Date();
                if (val === 'THIS_MONTH') {
                  setFromDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
                  setToDate(now.toISOString().split('T')[0]);
                } else if (val === 'THIS_FY') {
                  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
                  setFromDate(`${startYear}-04-01`);
                  setToDate(now.toISOString().split('T')[0]);
                }
              }}
              style={{ height: '26px', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0 6px', fontSize: '11px', fontWeight: 'bold' }}
            >
              <option value="THIS_MONTH">This Month</option>
              <option value="THIS_FY">This Financial Year (FY 2025-26)</option>
              <option value="CUSTOM">Custom Date Range</option>
            </select>

            <span style={{ color: '#64748b' }}>From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={e => {
                setFromDate(e.target.value);
                setPeriod('CUSTOM');
              }}
              style={{ height: '26px', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0 4px', fontSize: '11px' }}
            />

            <span style={{ color: '#64748b' }}>To:</span>
            <input
              type="date"
              value={toDate}
              onChange={e => {
                setToDate(e.target.value);
                setPeriod('CUSTOM');
              }}
              style={{ height: '26px', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0 4px', fontSize: '11px' }}
            />

            {loading && <span style={{ color: '#2563eb', fontWeight: 'bold' }}>⏳ Recalculating...</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeStatement === 'BALANCE_SHEET' && (
              <div style={{ display: 'flex', gap: '2px', background: '#e2e8f0', padding: '2px', borderRadius: '4px' }}>
                <button
                  type="button"
                  onClick={() => setLayoutMode('HORIZONTAL')}
                  style={{
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: layoutMode === 'HORIZONTAL' ? 'bold' : 'normal',
                    backgroundColor: layoutMode === 'HORIZONTAL' ? '#ffffff' : 'transparent',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Horizontal (T-Format)
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('VERTICAL')}
                  style={{
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: layoutMode === 'VERTICAL' ? 'bold' : 'normal',
                    backgroundColor: layoutMode === 'VERTICAL' ? '#ffffff' : 'transparent',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Vertical
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              style={{
                backgroundColor: '#1e40af',
                color: '#ffffff',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span>🖨️</span> Print / Export PDF
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: '#f1f5f9' }}>
          {activeStatement === 'PL' ? (
            /* ============================================================== */
            /* PROFIT AND LOSS STATEMENT                                       */
            /* ============================================================== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Top Highlights */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div style={{ background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>NET SALES REVENUE</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#1d4ed8', marginTop: '2px' }}>
                    ₹{(trading.net_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Gross: ₹{(trading.gross_sales || 0).toFixed(0)} - Ret: ₹{(trading.sales_returns || 0).toFixed(0)}</div>
                </div>

                <div style={{ background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>COST OF GOODS SOLD (COGS)</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#b91c1c', marginTop: '2px' }}>
                    ₹{(trading.cogs || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Purchases + Direct Transport/Freight</div>
                </div>

                <div style={{ background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>GROSS PROFIT</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#047857', marginTop: '2px' }}>
                    ₹{(trading.gross_profit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '10px', color: '#047857' }}>Margin: {trading.net_sales > 0 ? ((trading.gross_profit / trading.net_sales) * 100).toFixed(1) : '0'}%</div>
                </div>

                <div style={{ background: '#ffffff', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>NET PROFIT (NET INCOME)</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: income.net_profit >= 0 ? '#15803d' : '#dc2626', marginTop: '2px' }}>
                    ₹{(income.net_profit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '10px', color: income.net_profit >= 0 ? '#15803d' : '#dc2626' }}>
                    After Overhead Expenses (Rent, Salary, Tea)
                  </div>
                </div>
              </div>

              {/* Trading & Profit & Loss Statement Table */}
              <div style={{ background: '#ffffff', borderRadius: '6px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                <div style={{ background: '#1e40af', color: '#ffffff', padding: '8px 14px', fontWeight: 'bold', fontSize: '13px' }}>
                  Detailed Trading & Profit & Loss Statement for Period: {fromDate} to {toDate}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <tbody>
                    {/* Trading Section */}
                    <tr style={{ background: '#f8fafc', fontWeight: 'bold', color: '#1e3a8a' }}>
                      <td colSpan={2} style={{ padding: '8px 14px', borderBottom: '1px solid #cbd5e1' }}>1. TRADING ACCOUNT (Direct Operations)</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 20px', color: '#334155' }}>Gross Sales of Furniture</td>
                      <td style={{ padding: '6px 20px', textAlign: 'right', fontFamily: 'monospace' }}>₹{(trading.gross_sales || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 20px', color: '#64748b' }}>Less: Sales Returns / Credit Notes Issued</td>
                      <td style={{ padding: '6px 20px', textAlign: 'right', fontFamily: 'monospace', color: '#b91c1c' }}>- ₹{(trading.sales_returns || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#eff6ff', fontWeight: 'bold' }}>
                      <td style={{ padding: '6px 20px', color: '#1e40af' }}>Net Sales (A)</td>
                      <td style={{ padding: '6px 20px', textAlign: 'right', fontFamily: 'monospace', color: '#1e40af' }}>₹{(trading.net_sales || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 20px', color: '#334155' }}>Cost of Materials / Furniture Purchases</td>
                      <td style={{ padding: '6px 20px', textAlign: 'right', fontFamily: 'monospace' }}>₹{(trading.purchases || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 20px', color: '#334155' }}>Direct Expenses (Tempo Freight, Unloading, Carpentry Assembly)</td>
                      <td style={{ padding: '6px 20px', textAlign: 'right', fontFamily: 'monospace' }}>₹{(trading.direct_expenses || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#fef2f2', fontWeight: 'bold' }}>
                      <td style={{ padding: '6px 20px', color: '#991b1b' }}>Total Cost of Goods Sold - COGS (B)</td>
                      <td style={{ padding: '6px 20px', textAlign: 'right', fontFamily: 'monospace', color: '#991b1b' }}>₹{(trading.cogs || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderBottom: '2px solid #cbd5e1', background: '#ecfdf5', fontWeight: '900', fontSize: '13px' }}>
                      <td style={{ padding: '8px 20px', color: '#065f46' }}>GROSS PROFIT (A - B)</td>
                      <td style={{ padding: '8px 20px', textAlign: 'right', fontFamily: 'monospace', color: '#047857' }}>₹{(trading.gross_profit || 0).toFixed(2)}</td>
                    </tr>

                    {/* Operating Overheads Section */}
                    <tr style={{ background: '#f8fafc', fontWeight: 'bold', color: '#1e3a8a' }}>
                      <td colSpan={2} style={{ padding: '8px 14px', borderBottom: '1px solid #cbd5e1', borderTop: '2px solid #cbd5e1' }}>2. OPERATING OVERHEAD EXPENSES & OTHER INCOMES</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '6px 20px', color: '#334155' }}>Other Operating Incomes (Cash Receipts, Discounts Received)</td>
                      <td style={{ padding: '6px 20px', textAlign: 'right', fontFamily: 'monospace', color: '#15803d' }}>+ ₹{(income.indirect_incomes || 0).toFixed(2)}</td>
                    </tr>
                    {(income.indirect_expense_items || []).map((exp: any, i: number) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                        <td style={{ padding: '5px 24px', color: '#475569', fontSize: '11px' }}>
                          • {exp.title} ({exp.voucher_no})
                        </td>
                        <td style={{ padding: '5px 20px', textAlign: 'right', fontFamily: 'monospace', color: '#b91c1c' }}>
                          ₹{exp.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#fef2f2', fontWeight: 'bold' }}>
                      <td style={{ padding: '6px 20px', color: '#991b1b' }}>Total Indirect Operating Expenses</td>
                      <td style={{ padding: '6px 20px', textAlign: 'right', fontFamily: 'monospace', color: '#991b1b' }}>₹{(income.indirect_expenses || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ background: income.net_profit >= 0 ? '#dcfce7' : '#fee2e2', fontWeight: '900', fontSize: '14px', borderTop: '2px solid #1e40af' }}>
                      <td style={{ padding: '10px 20px', color: income.net_profit >= 0 ? '#14532d' : '#7f1d1d' }}>
                        NET PROFIT (NET INCOME FOR PERIOD)
                      </td>
                      <td style={{ padding: '10px 20px', textAlign: 'right', fontFamily: 'monospace', color: income.net_profit >= 0 ? '#15803d' : '#b91c1c' }}>
                        ₹{(income.net_profit || 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* BALANCE SHEET STATEMENT                                         */
            /* ============================================================== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#ffffff', borderRadius: '6px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                <div style={{ background: '#0f766e', color: '#ffffff', padding: '8px 14px', fontWeight: 'bold', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Balance Sheet as on {data?.as_of_date || toDate}</span>
                  <span>Shree Vinayaka Furnitures (SVF ERP)</span>
                </div>

                {layoutMode === 'HORIZONTAL' ? (
                  /* Horizontal / T-Format: Liabilities on Left, Assets on Right (Indian Format) */
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #cbd5e1' }}>
                    {/* Left: Equities & Liabilities */}
                    <div style={{ borderRight: '1px solid #cbd5e1' }}>
                      <div style={{ background: '#f8fafc', padding: '8px 14px', fontWeight: 'bold', color: '#0f766e', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
                        <span>EQUITIES & LIABILITIES</span>
                        <span>AMOUNT (₹)</span>
                      </div>
                      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                        <div style={{ fontWeight: 'bold', color: '#1e293b' }}>1. Capital & Reserves:</div>
                        {(liabilities.equities || []).map((eq: any, i: number) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                            <span style={{ color: '#475569' }}>{eq.name}</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>₹{eq.amount.toFixed(2)}</span>
                          </div>
                        ))}

                        <div style={{ fontWeight: 'bold', color: '#1e293b', marginTop: '12px' }}>2. Current Liabilities:</div>
                        {(liabilities.current_liabilities || []).map((cl: any, i: number) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                            <span style={{ color: '#475569' }}>{cl.name}</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>₹{cl.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Assets */}
                    <div>
                      <div style={{ background: '#f8fafc', padding: '8px 14px', fontWeight: 'bold', color: '#0f766e', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
                        <span>ASSETS & INVENTORY</span>
                        <span>AMOUNT (₹)</span>
                      </div>
                      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                        <div style={{ fontWeight: 'bold', color: '#1e293b' }}>1. Fixed Assets:</div>
                        {(assets.fixed_assets || []).map((fa: any, i: number) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                            <span style={{ color: '#475569' }}>{fa.name}</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>₹{fa.amount.toFixed(2)}</span>
                          </div>
                        ))}

                        <div style={{ fontWeight: 'bold', color: '#1e293b', marginTop: '12px' }}>2. Current Assets:</div>
                        {(assets.current_assets || []).map((ca: any, i: number) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '12px' }}>
                            <span style={{ color: '#475569' }}>{ca.name}</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>₹{ca.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Vertical Format */
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#0f766e', fontSize: '13px', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>A. ASSETS</div>
                      <div style={{ padding: '6px 12px' }}>
                        <div style={{ fontWeight: 'bold', color: '#334155' }}>Fixed Assets: ₹{(assets.fixed_assets_total || 0).toFixed(2)}</div>
                        <div style={{ fontWeight: 'bold', color: '#334155', marginTop: '4px' }}>Current Assets: ₹{(assets.current_assets_total || 0).toFixed(2)}</div>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontWeight: 'bold', color: '#0f766e', fontSize: '13px', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>B. EQUITIES & LIABILITIES</div>
                      <div style={{ padding: '6px 12px' }}>
                        <div style={{ fontWeight: 'bold', color: '#334155' }}>Owner's Equities: ₹{(liabilities.equities_total || 0).toFixed(2)}</div>
                        <div style={{ fontWeight: 'bold', color: '#334155', marginTop: '4px' }}>Current Liabilities: ₹{(liabilities.current_liabilities_total || 0).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Totals (Must Balance) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  background: '#f0fdf4',
                  borderTop: '2px solid #0f766e',
                  fontWeight: '900',
                  fontSize: '13px',
                  padding: '10px 14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingRight: '20px' }}>
                    <span style={{ color: '#166534' }}>TOTAL EQUITIES & LIABILITIES:</span>
                    <span style={{ color: '#15803d', fontFamily: 'monospace' }}>₹{(liabilities.total_equities_and_liabilities || assets.total_assets || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '20px', borderLeft: '1px solid #cbd5e1' }}>
                    <span style={{ color: '#166534' }}>TOTAL ASSETS:</span>
                    <span style={{ color: '#15803d', fontFamily: 'monospace' }}>₹{(assets.total_assets || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '10px 16px',
          backgroundColor: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px'
        }}>
          <div style={{ color: '#64748b' }}>
            Accounting Standard: Schedule III / Double-entry reconciliation matching Vyapar Billing Engine
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 18px',
              backgroundColor: '#475569',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
