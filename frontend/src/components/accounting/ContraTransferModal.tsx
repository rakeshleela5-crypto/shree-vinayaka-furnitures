import React, { useState, useEffect, useMemo } from 'react';
import type { BankAccountRecord } from '../../types/retailDaddy';
import { api } from '../../api/client';

export interface ContraTransferItem {
  id: number;
  voucher_no: string;
  date: string;
  transfer_type: 'CASH_DEPOSIT' | 'CASH_WITHDRAWAL' | 'BANK_TO_BANK';
  from_account: string;
  to_account: string;
  amount: number;
  narration?: string;
  performed_by?: string;
  status: string;
  created_at?: string;
}

interface ContraTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankAccounts: BankAccountRecord[];
  onTransferCompleted?: (transfer: ContraTransferItem) => void;
}

function numberToWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return '';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  };

  const integerPart = Math.floor(num);
  return `(Rupees ${inWords(integerPart)} Only)`;
}

export const ContraTransferModal: React.FC<ContraTransferModalProps> = ({
  isOpen,
  onClose,
  bankAccounts,
  onTransferCompleted
}) => {
  const [transferType, setTransferType] = useState<'CASH_DEPOSIT' | 'CASH_WITHDRAWAL' | 'BANK_TO_BANK'>('CASH_DEPOSIT');
  const [transfersHistory, setTransfersHistory] = useState<ContraTransferItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voidingId, setVoidingId] = useState<number | null>(null);

  // Form Fields
  const [voucherNo, setVoucherNo] = useState(`CNTR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`);
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBankAcc, setSelectedBankAcc] = useState(bankAccounts[0]?.accountNo || '50200012345678');
  const [destBankAcc, setDestBankAcc] = useState(bankAccounts[1]?.accountNo || bankAccounts[0]?.accountNo || '');
  const [amount, setAmount] = useState<string>('25000');
  const [narration, setNarration] = useState<string>('Showroom Cash Collection deposited into HDFC Current Account');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Search & Filter in history
  const [filterQuery, setFilterQuery] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch live Contra Transfers from PostgreSQL on mount / open
  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await api.getContraTransfers();
      setTransfersHistory(data);
    } catch {
      // Fallback
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      setVoucherNo(`CNTR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`);
    }
  }, [isOpen]);

  // Adjust defaults when type changes
  useEffect(() => {
    if (transferType === 'CASH_DEPOSIT') {
      setNarration('Showroom cash drawer collection deposited into Bank Account');
    } else if (transferType === 'CASH_WITHDRAWAL') {
      setNarration('Cash withdrawn from bank for showroom daily operational expenses');
    } else {
      setNarration('Inter-bank funds transfer between showroom accounts');
    }
  }, [transferType]);

  const numAmount = parseFloat(amount) || 0;
  const wordsRepresentation = numberToWords(numAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numAmount || numAmount <= 0) {
      showToast('⚠️ Please enter a valid transfer amount greater than zero.');
      return;
    }

    let fromAcc = 'Cash Drawer';
    let toAcc = selectedBankAcc;

    if (transferType === 'CASH_WITHDRAWAL') {
      fromAcc = selectedBankAcc;
      toAcc = 'Cash Drawer';
    } else if (transferType === 'BANK_TO_BANK') {
      fromAcc = selectedBankAcc;
      toAcc = destBankAcc;
      if (fromAcc === toAcc) {
        showToast('⚠️ Source and destination bank accounts must be different!');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        voucher_no: voucherNo,
        date: transferDate,
        transfer_type: transferType,
        from_account: fromAcc,
        to_account: toAcc,
        amount: numAmount,
        narration: narration || `Contra ${voucherNo}`,
        performed_by: 'Showroom Manager'
      };

      const result = await api.createContraTransfer(payload);
      showToast(`✓ Contra Voucher ${result.voucher_no} recorded in PostgreSQL!`);
      setTransfersHistory(prev => [result, ...prev]);

      if (onTransferCompleted) {
        onTransferCompleted(result);
      }

      // Reset voucher number for next entry
      setVoucherNo(`CNTR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`);
      setAmount('');
    } catch (err: any) {
      showToast(`❌ Error recording contra transfer: ${err.message || 'Offline'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoidTransfer = async (item: ContraTransferItem) => {
    if (item.status === 'Voided') {
      showToast('ℹ️ This contra transfer is already voided.');
      return;
    }
    const pin = window.prompt(`🔒 Manager Authorization Required\nEnter Manager PIN to void Contra Voucher ${item.voucher_no}:`);
    if (pin !== '1234') {
      alert('❌ Invalid Manager PIN. Reversal cancelled.');
      return;
    }

    setVoidingId(item.id);
    try {
      await api.deleteContraTransfer(item.id);
      showToast(`✓ Contra Voucher ${item.voucher_no} voided and balances reversed in PostgreSQL!`);
      setTransfersHistory(prev => prev.map(t => t.id === item.id ? { ...t, status: 'Voided' } : t));
    } catch (err: any) {
      showToast(`❌ Failed to void transfer: ${err.message}`);
    } finally {
      setVoidingId(null);
    }
  };

  const handleExportCsv = () => {
    if (transfersHistory.length === 0) {
      showToast('⚠️ No contra transfers to export.');
      return;
    }
    const headers = 'Voucher No,Date,Type,From Account,To Account,Amount,Narration,Status\n';
    const rows = transfersHistory.map(t => 
      `"${t.voucher_no}","${t.date}","${t.transfer_type}","${t.from_account}","${t.to_account}",${t.amount},"${(t.narration || '').replace(/"/g, '""')}","${t.status}"`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Contra_Transfers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 Downloaded Contra Transfers CSV!');
  };

  const filteredHistory = useMemo(() => {
    if (!filterQuery) return transfersHistory;
    const q = filterQuery.toLowerCase();
    return transfersHistory.filter(t => 
      t.voucher_no.toLowerCase().includes(q) ||
      t.from_account.toLowerCase().includes(q) ||
      t.to_account.toLowerCase().includes(q) ||
      (t.narration && t.narration.toLowerCase().includes(q))
    );
  }, [transfersHistory, filterQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="rd-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
    >
      <div
        className="rd-modal-content"
        style={{
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          width: '95%',
          maxWidth: '1150px',
          maxHeight: '92vh',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#1e293b',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🔄</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
                Contra Voucher Entry & Inter-Bank Transfers
              </h2>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                Double-Entry Cash Deposits, Withdrawals & Bank-to-Bank Transits with ACID PostgreSQL Balance Updates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Transfer Type Tabs */}
        <div style={{ display: 'flex', backgroundColor: '#0f172a', borderBottom: '1px solid #334155', padding: '0 16px' }}>
          {[
            { id: 'CASH_DEPOSIT', label: '💵 Cash Deposit (Cash Drawer ➔ Bank)', desc: 'Deposit showroom cash into HDFC/SBI' },
            { id: 'CASH_WITHDRAWAL', label: '🏧 Cash Withdrawal (Bank ➔ Cash Drawer)', desc: 'Withdraw petty cash from bank' },
            { id: 'BANK_TO_BANK', label: '🏛️ Inter-Bank Transfer (Bank A ➔ Bank B)', desc: 'Transfer funds between accounts' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTransferType(tab.id as any)}
              style={{
                padding: '12px 18px',
                border: 'none',
                background: 'transparent',
                color: transferType === tab.id ? '#38bdf8' : '#94a3b8',
                fontWeight: transferType === tab.id ? 800 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                borderBottom: transferType === tab.id ? '3px solid #38bdf8' : '3px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', flex: 1, overflow: 'hidden' }}>
          {/* Left Panel: Entry Form */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '20px',
              borderRight: '1px solid #334155',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                  Voucher Number
                </label>
                <input
                  type="text"
                  value={voucherNo}
                  onChange={e => setVoucherNo(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: '#f8fafc',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={e => setTransferDate(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }}
                  required
                />
              </div>
            </div>

            {/* From Account & To Account */}
            <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8', marginBottom: '10px' }}>
                Account Transit Route:
              </div>

              {transferType === 'CASH_DEPOSIT' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Source Account (Credit):</span>
                    <div style={{ fontWeight: 700, color: '#10b981', padding: '6px 8px', backgroundColor: '#0f172a', borderRadius: '4px', marginTop: '2px' }}>
                      💵 Showroom Cash Drawer (Cash in Hand)
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                      Destination Bank Account (Debit):
                    </label>
                    <select
                      value={selectedBankAcc}
                      onChange={e => setSelectedBankAcc(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid #38bdf8',
                        borderRadius: '6px',
                        padding: '8px',
                        color: '#f8fafc',
                        fontSize: '12px'
                      }}
                    >
                      {bankAccounts.map(b => (
                        <option key={b.id || b.accountNo} value={b.accountNo}>
                          {b.bankName} - {b.accountNo} ({b.accountName}) [Bal: ₹{(b.balance || 0).toLocaleString('en-IN')}]
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {transferType === 'CASH_WITHDRAWAL' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                      Source Bank Account (Credit):
                    </label>
                    <select
                      value={selectedBankAcc}
                      onChange={e => setSelectedBankAcc(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid #f59e0b',
                        borderRadius: '6px',
                        padding: '8px',
                        color: '#f8fafc',
                        fontSize: '12px'
                      }}
                    >
                      {bankAccounts.map(b => (
                        <option key={b.id || b.accountNo} value={b.accountNo}>
                          {b.bankName} - {b.accountNo} [Bal: ₹{(b.balance || 0).toLocaleString('en-IN')}]
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Destination Account (Debit):</span>
                    <div style={{ fontWeight: 700, color: '#38bdf8', padding: '6px 8px', backgroundColor: '#0f172a', borderRadius: '4px', marginTop: '2px' }}>
                      💵 Showroom Cash Drawer (Cash in Hand)
                    </div>
                  </div>
                </div>
              )}

              {transferType === 'BANK_TO_BANK' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                      Source Bank Account (Credit):
                    </label>
                    <select
                      value={selectedBankAcc}
                      onChange={e => setSelectedBankAcc(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '8px',
                        color: '#f8fafc',
                        fontSize: '12px'
                      }}
                    >
                      {bankAccounts.map(b => (
                        <option key={b.id || b.accountNo} value={b.accountNo}>
                          {b.bankName} - {b.accountNo} [Bal: ₹{(b.balance || 0).toLocaleString('en-IN')}]
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                      Destination Bank Account (Debit):
                    </label>
                    <select
                      value={destBankAcc}
                      onChange={e => setDestBankAcc(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        padding: '8px',
                        color: '#f8fafc',
                        fontSize: '12px'
                      }}
                    >
                      {bankAccounts.map(b => (
                        <option key={b.id || b.accountNo} value={b.accountNo}>
                          {b.bankName} - {b.accountNo} [Bal: ₹{(b.balance || 0).toLocaleString('en-IN')}]
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                Transfer Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Enter amount (e.g. 25000)"
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '2px solid #10b981',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  color: '#10b981',
                  fontSize: '18px',
                  fontWeight: 800,
                  fontFamily: 'monospace'
                }}
                required
              />
              {wordsRepresentation && (
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#cbd5e1', fontStyle: 'italic' }}>
                  {wordsRepresentation}
                </div>
              )}
            </div>

            {/* Narration */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
                Narration / Transit Remarks
              </label>
              <textarea
                value={narration}
                onChange={e => setNarration(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  resize: 'none'
                }}
              />
            </div>

            {/* Double-entry preview note */}
            <div style={{ backgroundColor: '#1e293b', padding: '10px 12px', borderRadius: '6px', fontSize: '11px', color: '#94a3b8', borderLeft: '3px solid #38bdf8' }}>
              ⚖️ <strong>Double-Entry Guarantee:</strong> Submitting this Contra voucher writes immutable journal lines in PostgreSQL and updates the Bank Statement ledger automatically.
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: 'auto',
                padding: '12px',
                backgroundColor: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '14px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isSubmitting ? 'Posting Contra Voucher...' : '✓ Record Contra Transfer & Post Journal'}
            </button>
          </form>

          {/* Right Panel: Recent Contra Transfers Table */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>
                  Recent Contra Transfers Ledger
                </h3>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {transfersHistory.length} total entries recorded in PostgreSQL
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={loadHistory}
                  disabled={isLoadingHistory}
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    color: '#94a3b8',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  🔄 Refresh
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #10b981',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    color: '#10b981',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  📥 Export CSV
                </button>
              </div>
            </div>

            {/* Filter Input */}
            <div>
              <input
                type="text"
                placeholder="Search by voucher no, account or narration..."
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: '#f8fafc',
                  fontSize: '12px'
                }}
              />
            </div>

            {/* History Table */}
            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #334155', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#1e293b', position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr>
                    <th style={{ padding: '8px', color: '#94a3b8' }}>Voucher No</th>
                    <th style={{ padding: '8px', color: '#94a3b8' }}>Date</th>
                    <th style={{ padding: '8px', color: '#94a3b8' }}>Type</th>
                    <th style={{ padding: '8px', color: '#94a3b8' }}>Transit Route</th>
                    <th style={{ padding: '8px', color: '#94a3b8', textAlign: 'right' }}>Amount (₹)</th>
                    <th style={{ padding: '8px', color: '#94a3b8', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '8px', color: '#94a3b8', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                        {isLoadingHistory ? 'Loading contra transfers from PostgreSQL...' : 'No contra transfers found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map(item => (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #334155',
                          backgroundColor: item.status === 'Voided' ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                          opacity: item.status === 'Voided' ? 0.6 : 1
                        }}
                      >
                        <td style={{ padding: '8px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                          {item.voucher_no}
                        </td>
                        <td style={{ padding: '8px', color: '#cbd5e1' }}>{item.date}</td>
                        <td style={{ padding: '8px' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '9px',
                              fontWeight: 700,
                              backgroundColor:
                                item.transfer_type === 'CASH_DEPOSIT' ? 'rgba(16, 185, 129, 0.2)' :
                                item.transfer_type === 'CASH_WITHDRAWAL' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                              color:
                                item.transfer_type === 'CASH_DEPOSIT' ? '#10b981' :
                                item.transfer_type === 'CASH_WITHDRAWAL' ? '#f59e0b' : '#38bdf8'
                            }}
                          >
                            {item.transfer_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '8px', color: '#e2e8f0' }}>
                          <div style={{ fontSize: '10px', color: '#94a3b8' }}>From: {item.from_account}</div>
                          <div style={{ fontSize: '10px', color: '#38bdf8' }}>To: {item.to_account}</div>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace' }}>
                          ₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '9px',
                              fontWeight: 700,
                              backgroundColor: item.status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                              color: item.status === 'Active' ? '#10b981' : '#f87171'
                            }}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          {item.status === 'Active' ? (
                            <button
                              type="button"
                              disabled={voidingId === item.id}
                              onClick={() => handleVoidTransfer(item)}
                              title="Void transfer & revert bank balance (Manager PIN)"
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                border: '1px solid #ef4444',
                                borderRadius: '4px',
                                color: '#f87171',
                                padding: '2px 6px',
                                fontSize: '10px',
                                fontWeight: 700,
                                cursor: voidingId === item.id ? 'not-allowed' : 'pointer',
                                opacity: voidingId === item.id ? 0.6 : 1
                              }}
                            >
                              {voidingId === item.id ? '⏳ Voiding...' : '🗑️ Void'}
                            </button>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '10px' }}>Reversed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Toast */}
        {toastMsg && (
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #38bdf8',
              padding: '10px 16px',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
              fontSize: '12px',
              fontWeight: 700,
              zIndex: 10000
            }}
          >
            {toastMsg}
          </div>
        )}
      </div>
    </div>
  );
};
