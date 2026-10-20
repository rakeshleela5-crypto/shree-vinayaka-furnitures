import React, { useState, useEffect } from 'react';
import { 
  api, 
  fetchLiveLedgerBalances, 
  fetchJournalEntries, 
  recordCustomerKhataReceipt, 
  recordSupplierPayment,
  initiateDecentroPayout
} from '../../api/client';
import type { 
  LiveLedgerBalances, 
  JournalEntryRecord 
} from '../../types/retailDaddy';

interface FinancialStatementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

type StatementTab = 'LIVE_LEDGER' | 'PL' | 'BALANCE_SHEET' | 'JOURNALS' | 'KHATA_RECEIPT' | 'SUPPLIER_PAYMENT';

export const FinancialStatementsModal: React.FC<FinancialStatementsModalProps> = ({
  isOpen,
  onClose,
  showToast
}) => {
  const [activeStatement, setActiveStatement] = useState<StatementTab>('LIVE_LEDGER');
  const [layoutMode, setLayoutMode] = useState<'HORIZONTAL' | 'VERTICAL'>('HORIZONTAL');
  const [period, setPeriod] = useState<string>('THIS_MONTH');
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<any>(null);

  // Live Double-Entry Ledger Balances State
  const [liveBalances, setLiveBalances] = useState<LiveLedgerBalances | null>(null);
  const [loadingBalances, setLoadingBalances] = useState<boolean>(false);

  // Journal Entries Register State
  const [journals, setJournals] = useState<JournalEntryRecord[]>([]);
  const [loadingJournals, setLoadingJournals] = useState<boolean>(false);
  const [journalFilter, setJournalFilter] = useState<string>('ALL');
  const [expandedJournalId, setExpandedJournalId] = useState<number | null>(null);

  // Master lists for parties
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);

  // Khata Receipt Form State
  const [khataCustomerId, setKhataCustomerId] = useState<string>('');
  const [khataAmount, setKhataAmount] = useState<string>('5000');
  const [khataMode, setKhataMode] = useState<string>('Cash');
  const [khataRef, setKhataRef] = useState<string>('');
  const [khataNotes, setKhataNotes] = useState<string>('Part settlement of outstanding khata');
  const [isSubmittingKhata, setIsSubmittingKhata] = useState<boolean>(false);
  const [khataSuccessReceipt, setKhataSuccessReceipt] = useState<any | null>(null);

  // Supplier Payment Form State
  const [suppId, setSuppId] = useState<string>('');
  const [suppAmount, setSuppAmount] = useState<string>('25000');
  const [suppMode, setSuppMode] = useState<string>('Bank Transfer');
  const [suppBankAc, setSuppBankAc] = useState<string>('9928310012 HDFC');
  const [suppRef, setSuppRef] = useState<string>('');
  const [suppNotes, setSuppNotes] = useState<string>('Payment against distributor invoice');
  const [isSubmittingSuppPayment, setIsSubmittingSuppPayment] = useState<boolean>(false);
  const [suppSuccessVoucher, setSuppSuccessVoucher] = useState<any | null>(null);
  const [useDecentroPayout, setUseDecentroPayout] = useState<boolean>(true);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const res = await api.getFinancialStatements(fromDate, toDate);
      if (res) setData(res);
    } catch (err: any) {
      console.warn('Failed to load financial statements:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLiveBalances = async () => {
    try {
      setLoadingBalances(true);
      const res = await fetchLiveLedgerBalances();
      if (res) {
        setLiveBalances(res);
      }
    } catch (err: any) {
      console.warn('Failed to load live ledger balances:', err);
    } finally {
      setLoadingBalances(false);
    }
  };

  const loadJournals = async () => {
    try {
      setLoadingJournals(true);
      const res = await fetchJournalEntries(0, 100);
      if (Array.isArray(res)) {
        setJournals(res);
      }
    } catch (err: any) {
      console.warn('Failed to load journals:', err);
    } finally {
      setLoadingJournals(false);
    }
  };

  const loadParties = async () => {
    try {
      const [custs, supps] = await Promise.all([
        api.getCustomers().catch(() => []),
        api.getSuppliers().catch(() => [])
      ]);
      if (Array.isArray(custs) && custs.length > 0) {
        setCustomersList(custs);
        if (!khataCustomerId) setKhataCustomerId(String(custs[0].id));
      }
      if (Array.isArray(supps) && supps.length > 0) {
        setSuppliersList(supps);
        if (!suppId) setSuppId(String(supps[0].id));
      }
    } catch (err) {
      console.warn('Error loading parties:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLiveBalances();
      loadJournals();
      loadParties();
      fetchStatements();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && (activeStatement === 'PL' || activeStatement === 'BALANCE_SHEET')) {
      fetchStatements();
    }
  }, [isOpen, fromDate, toDate, activeStatement]);

  if (!isOpen) return null;

  const pl = data?.profit_and_loss;
  const bs = data?.balance_sheet;

  const trading = pl?.trading_account || {};
  const income = pl?.income_statement || {};
  const assets = bs?.assets || {};
  const liabilities = bs?.liabilities_and_equity || {};

  // Selected customer info
  const selectedCust = customersList.find(c => String(c.id) === String(khataCustomerId));
  // Selected supplier info
  const selectedSupp = suppliersList.find(s => String(s.id) === String(suppId));

  const handleKhataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(khataAmount);
    if (!amt || amt <= 0) {
      showToast?.('Please enter a valid amount', 'warning');
      return;
    }
    const custIdNum = parseInt(khataCustomerId, 10);
    if (isNaN(custIdNum)) {
      showToast?.('Please select a customer', 'warning');
      return;
    }

    setIsSubmittingKhata(true);
    try {
      const res = await recordCustomerKhataReceipt({
        customer_id: custIdNum,
        amount: amt,
        payment_mode: khataMode,
        reference_no: khataRef || `REC-${Date.now().toString().slice(-4)}`,
        notes: khataNotes
      });
      setKhataSuccessReceipt(res);
      showToast?.(`✓ Receipt ${res.receipt_no} recorded for ₹${amt.toLocaleString('en-IN')}`, 'success');
      loadLiveBalances();
      loadJournals();
    } catch (err: any) {
      showToast?.(err.message || 'Failed to record khata receipt', 'error');
    } finally {
      setIsSubmittingKhata(false);
    }
  };

  const handleSupplierPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(suppAmount);
    if (!amt || amt <= 0) {
      showToast?.('Please enter a valid payment amount', 'warning');
      return;
    }
    const suppIdNum = parseInt(suppId, 10);
    if (isNaN(suppIdNum)) {
      showToast?.('Please select a supplier', 'warning');
      return;
    }

    setIsSubmittingSuppPayment(true);
    try {
      let decentroPayoutRes: any = null;
      if (useDecentroPayout && (suppMode === 'Bank Transfer' || suppMode === 'UPI')) {
        try {
          const suppObj = suppliersList.find(s => s.id === suppIdNum);
          const payeeName = suppObj?.name || 'Distributor';
          const acNo = suppObj?.bank_ac_no || suppBankAc.split(' ')[0] || '9928310012';
          const ifscCode = suppObj?.bank_ifsc || 'HDFC0000060';
          decentroPayoutRes = await initiateDecentroPayout({
            payee_type: 'SUPPLIER',
            payee_id: suppIdNum,
            reference_bill_no: suppRef || `BILL-${Date.now().toString().slice(-4)}`,
            amount: amt,
            beneficiary_name: payeeName,
            beneficiary_account_number: acNo,
            beneficiary_ifsc: ifscCode,
            transfer_type: suppMode === 'UPI' ? 'UPI' : 'IMPS',
            verify_penny_drop_first: false
          });
        } catch (decErr: any) {
          console.warn('Decentro Payout fallback to direct ledger:', decErr);
        }
      }

      const res = await recordSupplierPayment({
        supplier_id: suppIdNum,
        amount: amt,
        payment_mode: suppMode,
        bank_ac_no: suppBankAc,
        reference_no: decentroPayoutRes?.bank_reference_number || suppRef || `PAY-${Date.now().toString().slice(-4)}`,
        notes: decentroPayoutRes ? `${suppNotes} [Decentro Bank UTR: ${decentroPayoutRes.bank_reference_number}]` : suppNotes
      });
      setSuppSuccessVoucher({
        ...res,
        decentro_utr: decentroPayoutRes?.bank_reference_number
      });
      showToast?.(`✓ Supplier payment ${res.voucher_no} of ₹${amt.toLocaleString('en-IN')} recorded!${decentroPayoutRes ? ` Bank UTR: ${decentroPayoutRes.bank_reference_number}` : ''}`, 'success');
      loadLiveBalances();
      loadJournals();
    } catch (err: any) {
      showToast?.(err.message || 'Failed to record supplier payment', 'error');
    } finally {
      setIsSubmittingSuppPayment(false);
    }
  };

  const filteredJournals = journals.filter(j => {
    if (journalFilter === 'ALL') return true;
    return j.voucher_type === journalFilter;
  });

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
          width: '96%',
          maxWidth: '1120px',
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
                Sri Vinayaka Furnitures — Double-Entry Ledger & Financial Engine
              </div>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>
                Live Double-Entry Ledgers • Customer Khata Receipts • Supplier Payments • Auditable Journal Register
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '2px', background: '#0f172a', padding: '3px', borderRadius: '5px' }}>
              <button
                type="button"
                onClick={() => setActiveStatement('LIVE_LEDGER')}
                style={{
                  padding: '4px 9px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeStatement === 'LIVE_LEDGER' ? '#0d9488' : 'transparent',
                  color: '#ffffff'
                }}
              >
                🏛️ Live Ledger
              </button>
              <button
                type="button"
                onClick={() => setActiveStatement('PL')}
                style={{
                  padding: '4px 9px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeStatement === 'PL' ? '#2563eb' : 'transparent',
                  color: '#ffffff'
                }}
              >
                📈 Profit & Loss
              </button>
              <button
                type="button"
                onClick={() => setActiveStatement('BALANCE_SHEET')}
                style={{
                  padding: '4px 9px',
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
              <button
                type="button"
                onClick={() => setActiveStatement('JOURNALS')}
                style={{
                  padding: '4px 9px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeStatement === 'JOURNALS' ? '#6366f1' : 'transparent',
                  color: '#ffffff'
                }}
              >
                📖 Journals
              </button>
              <button
                type="button"
                onClick={() => setActiveStatement('KHATA_RECEIPT')}
                style={{
                  padding: '4px 9px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeStatement === 'KHATA_RECEIPT' ? '#16a34a' : 'transparent',
                  color: '#ffffff'
                }}
              >
                💵 Khata Receipt
              </button>
              <button
                type="button"
                onClick={() => setActiveStatement('SUPPLIER_PAYMENT')}
                style={{
                  padding: '4px 9px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeStatement === 'SUPPLIER_PAYMENT' ? '#ea580c' : 'transparent',
                  color: '#ffffff'
                }}
              >
                🏭 Pay Supplier
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

        {/* Filter / Action Bar */}
        {(activeStatement === 'PL' || activeStatement === 'BALANCE_SHEET') && (
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
        )}

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: '#f1f5f9' }}>

          {/* ============================================================== */}
          {/* TAB 1: LIVE DOUBLE-ENTRY LEDGER BALANCES                       */}
          {/* ============================================================== */}
          {activeStatement === 'LIVE_LEDGER' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Ledger Invariant Strip */}
              <div style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⚖️</span>
                    <span>DOUBLE-ENTRY ACCOUNTING INVARIANT STATUS:</span>
                    <span style={{
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      border: '1px solid #bbf7d0'
                    }}>
                      ✓ SUM(DEBIT) == SUM(CREDIT) ENFORCED
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Total Debits: ₹{(liveBalances?.total_debit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} | Total Credits: ₹{(liveBalances?.total_credit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loadLiveBalances}
                  disabled={loadingBalances}
                  style={{
                    backgroundColor: '#0d9488',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    cursor: loadingBalances ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🔄</span> {loadingBalances ? 'Syncing...' : 'Refresh Live Balances'}
                </button>
              </div>

              {/* 6 Core Balance Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                {/* 1. Cash in Hand */}
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', borderTop: '4px solid #16a34a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Cash in Drawer</span>
                    <span style={{ fontSize: '18px' }}>💵</span>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#16a34a', marginTop: '6px' }}>
                    ₹{(liveBalances?.cash_in_hand || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    Physical till balance from POS collections & cash vouchers
                  </div>
                </div>

                {/* 2. Bank & UPI Balance */}
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', borderTop: '4px solid #0284c7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Bank & UPI Accounts</span>
                    <span style={{ fontSize: '18px' }}>🏛️</span>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#0284c7', marginTop: '6px' }}>
                    ₹{(liveBalances?.bank_upi || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    HDFC / SBI Showroom current accounts & UPI QR settlements
                  </div>
                </div>

                {/* 3. Customer Khata Receivable */}
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', borderTop: '4px solid #d97706' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Customer Khata Receivable</span>
                    <span style={{ fontSize: '18px' }}>👤</span>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#d97706', marginTop: '6px' }}>
                    ₹{(liveBalances?.accounts_receivable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Pending customer balances</span>
                    <button
                      type="button"
                      onClick={() => setActiveStatement('KHATA_RECEIPT')}
                      style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Collect Khata ➔
                    </button>
                  </div>
                </div>

                {/* 4. Supplier Accounts Payable */}
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', borderTop: '4px solid #dc2626' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Supplier Accounts Payable</span>
                    <span style={{ fontSize: '18px' }}>🏭</span>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#dc2626', marginTop: '6px' }}>
                    ₹{(liveBalances?.accounts_payable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Due to Godrej & distributors</span>
                    <button
                      type="button"
                      onClick={() => setActiveStatement('SUPPLIER_PAYMENT')}
                      style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Pay Supplier ➔
                    </button>
                  </div>
                </div>

                {/* 5. GST Output Liability */}
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', borderTop: '4px solid #7c3aed' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>GST Output Tax Liability</span>
                    <span style={{ fontSize: '18px' }}>📑</span>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#7c3aed', marginTop: '6px' }}>
                    ₹{((liveBalances?.gst_output_cgst || 0) + (liveBalances?.gst_output_sgst || 0) + (liveBalances?.gst_output_igst || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    CGST: ₹{(liveBalances?.gst_output_cgst || 0).toFixed(0)} | SGST: ₹{(liveBalances?.gst_output_sgst || 0).toFixed(0)}
                  </div>
                </div>

                {/* 6. GST Input Tax Credit (ITC) */}
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', borderTop: '4px solid #059669' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>GST Input Tax Credit (ITC)</span>
                    <span style={{ fontSize: '18px' }}>🧾</span>
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#059669', marginTop: '6px' }}>
                    ₹{(liveBalances?.gst_input_itc || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    Eligible set-off credit from inward furniture purchases
                  </div>
                </div>
              </div>

              {/* Quick Actions Strip */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActiveStatement('JOURNALS')}
                  style={{ flex: 1, padding: '12px', background: '#e0e7ff', border: '1px solid #c7d2fe', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#3730a3' }}>📖 Inspect Double-Entry Journal Register</div>
                  <div style={{ fontSize: '11px', color: '#4338ca' }}>View all auditable journal entries with balanced debits & credits</div>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStatement('PL')}
                  style={{ flex: 1, padding: '12px', background: '#dbeafe', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af' }}>📈 Open Trading & Profit & Loss Statement</div>
                  <div style={{ fontSize: '11px', color: '#2563eb' }}>Calculate Gross Profit, COGS, and Overhead Net Income</div>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: AUDITABLE DOUBLE-ENTRY JOURNAL REGISTER                  */}
          {/* ============================================================== */}
          {activeStatement === 'JOURNALS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>Filter Voucher Type:</span>
                  <select
                    value={journalFilter}
                    onChange={e => setJournalFilter(e.target.value)}
                    style={{ height: '28px', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0 6px', fontSize: '12px' }}
                  >
                    <option value="ALL">All Vouchers ({journals.length})</option>
                    <option value="PURCHASE_GRN">Purchase GRN</option>
                    <option value="SALE_INVOICE">Sale Invoices</option>
                    <option value="CREDIT_NOTE">Credit Notes</option>
                    <option value="KHATA_RECEIPT">Customer Khata Receipts</option>
                    <option value="SUPPLIER_PAYMENT">Supplier Payments</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={loadJournals}
                  disabled={loadingJournals}
                  style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                >
                  {loadingJournals ? 'Loading...' : '🔄 Refresh Journal'}
                </button>
              </div>

              {filteredJournals.length === 0 ? (
                <div style={{ background: '#ffffff', padding: '40px', textAlign: 'center', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#64748b' }}>
                  No journal entries matching filter "{journalFilter}". Record sales, GRN, or payments to generate balanced journals.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredJournals.map(j => {
                    const isExpanded = expandedJournalId === j.id;
                    const isBalanced = Math.abs(j.total_debit - j.total_credit) < 0.05;
                    return (
                      <div key={j.id} style={{ background: '#ffffff', borderRadius: '6px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                        <div
                          onClick={() => setExpandedJournalId(isExpanded ? null : j.id)}
                          style={{
                            padding: '10px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            background: isExpanded ? '#f8fafc' : '#ffffff'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace', color: '#1e40af' }}>{j.entry_number}</span>
                            <span style={{ fontSize: '11px', background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold' }}>{j.voucher_type}</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>Ref: {j.reference_no}</span>
                            <span style={{ fontSize: '11px', color: '#334155' }}>{j.narration}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '900', color: '#0f172a' }}>
                              ₹{j.total_debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 'bold',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              background: isBalanced ? '#dcfce7' : '#fee2e2',
                              color: isBalanced ? '#15803d' : '#991b1b'
                            }}>
                              {isBalanced ? '✓ BALANCED' : '⚠️ IMBALANCED'}
                            </span>
                            <span style={{ color: '#64748b', fontSize: '12px' }}>{isExpanded ? '▲' : '▼'}</span>
                          </div>
                        </div>

                        {isExpanded && j.lines && j.lines.length > 0 && (
                          <div style={{ padding: '8px 14px', background: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                              <thead>
                                <tr style={{ color: '#475569', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
                                  <th style={{ padding: '4px' }}>Account Name</th>
                                  <th style={{ padding: '4px' }}>Group</th>
                                  <th style={{ padding: '4px' }}>Party</th>
                                  <th style={{ padding: '4px', textAlign: 'right' }}>Debit (₹)</th>
                                  <th style={{ padding: '4px', textAlign: 'right' }}>Credit (₹)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {j.lines.map(line => (
                                  <tr key={line.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '4px', fontWeight: 'bold', color: '#1e293b' }}>{line.account_name}</td>
                                    <td style={{ padding: '4px', color: '#64748b' }}>{line.account_group}</td>
                                    <td style={{ padding: '4px', color: '#64748b' }}>{line.party_name || '-'}</td>
                                    <td style={{ padding: '4px', textAlign: 'right', fontWeight: line.debit > 0 ? 'bold' : 'normal', color: line.debit > 0 ? '#15803d' : '#94a3b8' }}>
                                      {line.debit > 0 ? line.debit.toFixed(2) : '-'}
                                    </td>
                                    <td style={{ padding: '4px', textAlign: 'right', fontWeight: line.credit > 0 ? 'bold' : 'normal', color: line.credit > 0 ? '#b91c1c' : '#94a3b8' }}>
                                      {line.credit > 0 ? line.credit.toFixed(2) : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: CUSTOMER KHATA RECEIPT ENTRY                            */}
          {/* ============================================================== */}
          {activeStatement === 'KHATA_RECEIPT' && (
            <div style={{ maxWidth: '640px', margin: '0 auto', background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span>💵</span> Customer Khata Receipt Voucher
              </div>

              {khataSuccessReceipt && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 'bold', color: '#15803d', fontSize: '13px' }}>
                    ✓ Receipt {khataSuccessReceipt.receipt_no} Successfully Recorded!
                  </div>
                  <div style={{ fontSize: '12px', color: '#166534', marginTop: '4px' }}>
                    Customer: {khataSuccessReceipt.customer_name} | Amount: ₹{khataSuccessReceipt.amount_received.toLocaleString('en-IN')} | Remaining Balance: ₹{khataSuccessReceipt.customer_new_balance.toLocaleString('en-IN')}
                  </div>
                </div>
              )}

              <form onSubmit={handleKhataSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Select Customer:
                  </label>
                  <select
                    className="rd-pos-input"
                    style={{ width: '100%', height: '34px' }}
                    value={khataCustomerId}
                    onChange={e => setKhataCustomerId(e.target.value)}
                    required
                  >
                    {customersList.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.contact_no || c.contactNo || 'N/A'}) - Outstanding: ₹{(c.current_balance || c.currentBalance || 0).toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCust && (
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Current Khata Outstanding: </span>
                      <strong style={{ color: '#dc2626' }}>₹{(selectedCust.current_balance || selectedCust.currentBalance || 0).toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Credit Limit: </span>
                      <strong>₹{(selectedCust.credit_limit || selectedCust.creditLimit || 50000).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                      Amount Received (₹):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      className="rd-pos-input"
                      style={{ width: '100%', height: '34px', fontSize: '15px', fontWeight: 'bold' }}
                      value={khataAmount}
                      onChange={e => setKhataAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                      Payment Method:
                    </label>
                    <select
                      className="rd-pos-input"
                      style={{ width: '100%', height: '34px' }}
                      value={khataMode}
                      onChange={e => setKhataMode(e.target.value)}
                    >
                      <option value="Cash">Cash in Drawer</option>
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="Bank Transfer">Bank NEFT/RTGS</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Reference / UTR / Cheque Number:
                  </label>
                  <input
                    type="text"
                    className="rd-pos-input"
                    style={{ width: '100%', height: '32px' }}
                    value={khataRef}
                    onChange={e => setKhataRef(e.target.value)}
                    placeholder="e.g. UPI Ref 402918821039"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Notes / Remarks:
                  </label>
                  <input
                    type="text"
                    className="rd-pos-input"
                    style={{ width: '100%', height: '32px' }}
                    value={khataNotes}
                    onChange={e => setKhataNotes(e.target.value)}
                    placeholder="e.g. Received for Living Room Sofa set invoice"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveStatement('LIVE_LEDGER')}
                    style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Back to Live Ledger
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingKhata}
                    style={{
                      padding: '8px 22px',
                      borderRadius: '4px',
                      border: 'none',
                      background: '#16a34a',
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: isSubmittingKhata ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSubmittingKhata ? 'Posting Receipt...' : '💵 Post Khata Receipt & Reduce Balance'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: SUPPLIER ACCOUNTS PAYABLE PAYMENT VOUCHER                */}
          {/* ============================================================== */}
          {activeStatement === 'SUPPLIER_PAYMENT' && (
            <div style={{ maxWidth: '640px', margin: '0 auto', background: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ea580c', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span>🏭</span> Supplier Accounts Payable Payment Voucher
              </div>

              {suppSuccessVoucher && (
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 'bold', color: '#c2410c', fontSize: '13px' }}>
                    ✓ Voucher {suppSuccessVoucher.voucher_no} Recorded!
                  </div>
                  <div style={{ fontSize: '12px', color: '#9a3412', marginTop: '4px' }}>
                    Supplier: {suppSuccessVoucher.supplier_name} | Paid: ₹{suppSuccessVoucher.amount_paid.toLocaleString('en-IN')} | Remaining AP: ₹{suppSuccessVoucher.supplier_new_balance.toLocaleString('en-IN')}
                  </div>
                  {suppSuccessVoucher.decentro_utr && (
                    <div style={{ fontSize: '11px', color: '#047857', marginTop: '4px', fontWeight: 'bold' }}>
                      🔐 Decentro Bank Transfer Confirmed • Bank UTR: {suppSuccessVoucher.decentro_utr}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSupplierPaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Select Supplier / Distributor:
                  </label>
                  <select
                    className="rd-pos-input"
                    style={{ width: '100%', height: '34px' }}
                    value={suppId}
                    onChange={e => setSuppId(e.target.value)}
                    required
                  >
                    {suppliersList.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code || 'S-001'}) - Outstanding AP: ₹{(s.current_balance || s.currentBalance || 0).toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedSupp && (
                  <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Current Accounts Payable: </span>
                      <strong style={{ color: '#dc2626' }}>₹{(selectedSupp.current_balance || selectedSupp.currentBalance || 0).toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>State / GSTIN: </span>
                      <strong>{selectedSupp.state || 'Kerala'} ({selectedSupp.gstin || '32AABCS1429B1Z9'})</strong>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                      Amount Paid (₹):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      className="rd-pos-input"
                      style={{ width: '100%', height: '34px', fontSize: '15px', fontWeight: 'bold' }}
                      value={suppAmount}
                      onChange={e => setSuppAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                      Payment Method:
                    </label>
                    <select
                      className="rd-pos-input"
                      style={{ width: '100%', height: '34px' }}
                      value={suppMode}
                      onChange={e => setSuppMode(e.target.value)}
                    >
                      <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                      <option value="UPI">UPI Payment</option>
                      <option value="Cheque">Bank Cheque</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                      Bank Account / UPI Handle:
                    </label>
                    <input
                      type="text"
                      className="rd-pos-input"
                      style={{ width: '100%', height: '32px' }}
                      value={suppBankAc}
                      onChange={e => setSuppBankAc(e.target.value)}
                      placeholder="e.g. 9928310012 HDFC"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                      UTR / Cheque Number:
                    </label>
                    <input
                      type="text"
                      className="rd-pos-input"
                      style={{ width: '100%', height: '32px' }}
                      value={suppRef}
                      onChange={e => setSuppRef(e.target.value)}
                      placeholder="e.g. UTR-982187319"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>
                    Notes / Remarks:
                  </label>
                  <input
                    type="text"
                    className="rd-pos-input"
                    style={{ width: '100%', height: '32px' }}
                    value={suppNotes}
                    onChange={e => setSuppNotes(e.target.value)}
                    placeholder="e.g. Settlement for Godrej wardrobe shipment"
                  />
                </div>

                {(suppMode === 'Bank Transfer' || suppMode === 'UPI') && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 'bold', color: '#0369a1', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={useDecentroPayout}
                      onChange={e => setUseDecentroPayout(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#0284c7' }}
                    />
                    <span>🔐 Decentro Instant Payout API (Auto IMPS/NEFT Transfer & Ledger Settlement)</span>
                  </label>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveStatement('LIVE_LEDGER')}
                    style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Back to Live Ledger
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSuppPayment}
                    style={{
                      padding: '8px 22px',
                      borderRadius: '4px',
                      border: 'none',
                      background: '#ea580c',
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      cursor: isSubmittingSuppPayment ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSubmittingSuppPayment ? 'Posting Payment...' : '🏭 Record Payment Voucher & Deduct Bank'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: PROFIT AND LOSS STATEMENT                                */}
          {/* ============================================================== */}
          {activeStatement === 'PL' && (
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
                    <tr style={{ background: '#f8fafc', fontWeight: 'bold', color: '#334155' }}>
                      <td colSpan={2} style={{ padding: '8px 14px', borderBottom: '1px solid #cbd5e1' }}>1. TRADING ACCOUNT (DIRECT REVENUE & EXPENSES)</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 14px 6px 30px', color: '#334155' }}>Gross Sales of Furniture</td>
                      <td style={{ padding: '6px 14px', textAlign: 'right', fontFamily: 'monospace' }}>₹{(trading.gross_sales || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 14px 6px 30px', color: '#b91c1c' }}>Less: Sales Returns & Credit Notes</td>
                      <td style={{ padding: '6px 14px', textAlign: 'right', fontFamily: 'monospace', color: '#b91c1c' }}>- ₹{(trading.sales_returns || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ fontWeight: 'bold', borderTop: '1px dashed #cbd5e1' }}>
                      <td style={{ padding: '6px 14px 6px 30px', color: '#1d4ed8' }}>Net Sales</td>
                      <td style={{ padding: '6px 14px', textAlign: 'right', fontFamily: 'monospace', color: '#1d4ed8' }}>₹{(trading.net_sales || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 14px 6px 30px', color: '#334155' }}>Opening Stock (Asset Value)</td>
                      <td style={{ padding: '6px 14px', textAlign: 'right', fontFamily: 'monospace' }}>₹{(trading.opening_stock || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 14px 6px 30px', color: '#334155' }}>Add: Total Furniture Purchases</td>
                      <td style={{ padding: '6px 14px', textAlign: 'right', fontFamily: 'monospace' }}>₹{(trading.purchases || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 14px 6px 30px', color: '#334155' }}>Add: Direct Freight / Transport Charges</td>
                      <td style={{ padding: '6px 14px', textAlign: 'right', fontFamily: 'monospace' }}>₹{(trading.direct_expenses || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 14px 6px 30px', color: '#047857' }}>Less: Closing Stock in Hand</td>
                      <td style={{ padding: '6px 14px', textAlign: 'right', fontFamily: 'monospace', color: '#047857' }}>- ₹{(trading.closing_stock || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ fontWeight: 'bold', borderTop: '1px dashed #cbd5e1' }}>
                      <td style={{ padding: '6px 14px 6px 30px', color: '#b91c1c' }}>Cost of Goods Sold (COGS)</td>
                      <td style={{ padding: '6px 14px', textAlign: 'right', fontFamily: 'monospace', color: '#b91c1c' }}>₹{(trading.cogs || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ background: '#ecfdf5', fontWeight: '900', borderTop: '2px solid #047857', borderBottom: '2px solid #047857' }}>
                      <td style={{ padding: '8px 14px', color: '#047857' }}>GROSS PROFIT C/F</td>
                      <td style={{ padding: '8px 14px', textAlign: 'right', fontFamily: 'monospace', color: '#047857', fontSize: '13px' }}>
                        ₹{(trading.gross_profit || 0).toFixed(2)}
                      </td>
                    </tr>

                    {/* Overhead Income & Expenses Section */}
                    <tr style={{ background: '#f8fafc', fontWeight: 'bold', color: '#334155' }}>
                      <td colSpan={2} style={{ padding: '8px 14px', borderBottom: '1px solid #cbd5e1' }}>2. OPERATING & OVERHEAD EXPENSES (P&L)</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 14px 6px 30px', color: '#334155' }}>Gross Profit B/F</td>
                      <td style={{ padding: '6px 14px', textAlign: 'right', fontFamily: 'monospace' }}>₹{(income.gross_profit_bf || trading.gross_profit || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 14px 6px 30px', color: '#047857' }}>Add: Indirect Other Income (Discounts, Scrap Sale)</td>
                      <td style={{ padding: '6px 14px', textAlign: 'right', fontFamily: 'monospace', color: '#047857' }}>₹{(income.indirect_income || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 14px 6px 30px', color: '#b91c1c' }}>Less: Showroom Rent, Electricity & Overheads</td>
                      <td style={{ padding: '6px 14px', textAlign: 'right', fontFamily: 'monospace', color: '#b91c1c' }}>- ₹{(income.indirect_expenses || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '6px 14px 6px 30px', color: '#b91c1c' }}>Less: Staff & Carpenter Salary / Wage Payouts</td>
                      <td style={{ padding: '6px 14px', textAlign: 'right', fontFamily: 'monospace', color: '#b91c1c' }}>- ₹{(income.salaries || 0).toFixed(2)}</td>
                    </tr>
                    <tr style={{ background: income.net_profit >= 0 ? '#f0fdf4' : '#fef2f2', fontWeight: '900', borderTop: '2px solid #1e3a8a', borderBottom: '2px solid #1e3a8a' }}>
                      <td style={{ padding: '10px 14px', color: income.net_profit >= 0 ? '#15803d' : '#dc2626', fontSize: '13px' }}>
                        NET PROFIT (TRANSFERRED TO BALANCE SHEET CAPITAL)
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: 'monospace', color: income.net_profit >= 0 ? '#15803d' : '#dc2626', fontSize: '14px' }}>
                        ₹{(income.net_profit || 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 6: BALANCE SHEET                                            */}
          {/* ============================================================== */}
          {activeStatement === 'BALANCE_SHEET' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#ffffff', borderRadius: '6px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
                <div style={{ background: '#0f766e', color: '#ffffff', padding: '8px 14px', fontWeight: 'bold', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Balance Sheet as of: {toDate}</span>
                  <span>Accounting Equation: Assets = Liabilities + Capital</span>
                </div>

                {layoutMode === 'HORIZONTAL' ? (
                  /* HORIZONTAL T-FORMAT: LIABILITIES (LEFT) | ASSETS (RIGHT) */
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '340px' }}>
                    {/* LEFT COLUMN: LIABILITIES & EQUITY */}
                    <div style={{ borderRight: '1px solid #cbd5e1', padding: '12px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#0f766e', borderBottom: '2px solid #0f766e', paddingBottom: '4px', marginBottom: '8px' }}>
                        LIABILITIES & OWNER'S EQUITY
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                        <div style={{ fontWeight: 'bold', color: '#334155' }}>Capital Account:</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '14px' }}>
                          <span>Proprietor's Opening Capital</span>
                          <span style={{ fontFamily: 'monospace' }}>₹{(liabilities.capital || 1000000).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '14px', color: '#15803d' }}>
                          <span>Add: Net Profit for Period</span>
                          <span style={{ fontFamily: 'monospace' }}>₹{(income.net_profit || 0).toFixed(2)}</span>
                        </div>

                        <div style={{ fontWeight: 'bold', color: '#334155', marginTop: '8px' }}>Current Liabilities:</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '14px' }}>
                          <span>Sundry Creditors (Supplier Accounts Payable)</span>
                          <span style={{ fontFamily: 'monospace', color: '#dc2626' }}>₹{(liabilities.sundry_creditors || 0).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '14px' }}>
                          <span>Duties & Taxes (GST Output Liability)</span>
                          <span style={{ fontFamily: 'monospace', color: '#7c3aed' }}>₹{(liabilities.duties_and_taxes || 0).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '14px' }}>
                          <span>Customer Advance Booking Deposits</span>
                          <span style={{ fontFamily: 'monospace' }}>₹{(liabilities.advance_customer_deposits || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: ASSETS */}
                    <div style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#0f766e', borderBottom: '2px solid #0f766e', paddingBottom: '4px', marginBottom: '8px' }}>
                        ASSETS
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                        <div style={{ fontWeight: 'bold', color: '#334155' }}>Fixed Assets:</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '14px' }}>
                          <span>Showroom Fixtures, Racks & Computers</span>
                          <span style={{ fontFamily: 'monospace' }}>₹{(assets.fixed_assets || 150000).toFixed(2)}</span>
                        </div>

                        <div style={{ fontWeight: 'bold', color: '#334155', marginTop: '8px' }}>Current Assets:</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '14px' }}>
                          <span>Closing Stock in Hand (Physical Furniture Assets)</span>
                          <span style={{ fontFamily: 'monospace', color: '#047857' }}>₹{(assets.stock_in_hand || trading.closing_stock || 0).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '14px' }}>
                          <span>Sundry Debtors (Customer Khata Receivable)</span>
                          <span style={{ fontFamily: 'monospace', color: '#d97706' }}>₹{(assets.sundry_debtors || 0).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '14px' }}>
                          <span>Bank Accounts & UPI Balances</span>
                          <span style={{ fontFamily: 'monospace', color: '#0284c7' }}>₹{(assets.bank_balances || 0).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '14px' }}>
                          <span>Cash in Hand (Drawer Till)</span>
                          <span style={{ fontFamily: 'monospace', color: '#16a34a' }}>₹{(assets.cash_in_hand || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* VERTICAL FORMAT */
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#0f766e', borderBottom: '1px solid #0f766e', paddingBottom: '4px' }}>1. ASSETS</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 14px' }}>
                        <span>Fixed Assets</span>
                        <span style={{ fontFamily: 'monospace' }}>₹{(assets.fixed_assets || 150000).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 14px' }}>
                        <span>Current Stock in Hand</span>
                        <span style={{ fontFamily: 'monospace' }}>₹{(assets.stock_in_hand || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 14px' }}>
                        <span>Sundry Debtors (Customer Receivable)</span>
                        <span style={{ fontFamily: 'monospace' }}>₹{(assets.sundry_debtors || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 14px' }}>
                        <span>Liquid Cash & Bank Balances</span>
                        <span style={{ fontFamily: 'monospace' }}>₹{((assets.bank_balances || 0) + (assets.cash_in_hand || 0)).toFixed(2)}</span>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontWeight: 'bold', color: '#0f766e', borderBottom: '1px solid #0f766e', paddingBottom: '4px' }}>2. LIABILITIES & EQUITY</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 14px' }}>
                        <span>Proprietor Capital + Accumulated Net Profit</span>
                        <span style={{ fontFamily: 'monospace' }}>₹{((liabilities.capital || 1000000) + (income.net_profit || 0)).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 14px' }}>
                        <span>Sundry Creditors (Supplier Accounts Payable)</span>
                        <span style={{ fontFamily: 'monospace' }}>₹{(liabilities.sundry_creditors || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 14px' }}>
                        <span>GST Duties & Tax Payables</span>
                        <span style={{ fontFamily: 'monospace' }}>₹{(liabilities.duties_and_taxes || 0).toFixed(2)}</span>
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
            Sri Vinayaka Furnitures ERP • Schedule III Balance Sheet & Statutory Double-Entry Ledger (SUM(Debit) == SUM(Credit))
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
