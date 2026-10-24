import React, { useState, useEffect } from 'react';
import type {
  SalesmanRecord,
  SalesmanPaymentVoucher,
  SalesmanLedgerEntry
} from '../../types/retailDaddy';

interface SalesmanPaymentModalProps {
  isOpen: boolean;
  salesmen: SalesmanRecord[];
  initialSalesmanId?: string;
  ledgerEntries: SalesmanLedgerEntry[];
  onSavePayment: (voucher: SalesmanPaymentVoucher, ledgerEntry: SalesmanLedgerEntry) => void;
  onDeleteSalesman?: (salesmanId: string) => void;
  onClose: () => void;
}

/**
 * Video 19 Feature 17: Sales Man Payment Entry Modal (1:1 Frame 345 - frmSalesManPayment)
 */
export const SalesmanPaymentModal: React.FC<SalesmanPaymentModalProps> = ({
  isOpen,
  salesmen,
  initialSalesmanId,
  ledgerEntries,
  onSavePayment,
  onDeleteSalesman,
  onClose
}) => {
  const [selectedSalesmanId, setSelectedSalesmanId] = useState<string>(
    initialSalesmanId || salesmen.find(s => s.code === 'SM-0003')?.id || salesmen[0]?.id || ''
  );
  const currentFY = () => {
    const d = new Date();
    const y = d.getFullYear();
    const shortY = String(y).slice(-2);
    const nextY = String(y + 1).slice(-2);
    return `${shortY}/${nextY}`;
  };
  const [transactionNo, setTransactionNo] = useState<string>(() => `RCPT-0001-${currentFY()}`);
  const [transactionDate, setTransactionDate] = useState<string>(() => new Date().toLocaleDateString('en-GB'));
  const [paymentMode, setPaymentMode] = useState<'By Cash' | 'By Cheque' | 'By Bank Transfer' | 'By UPI'>('By Cash');
  const [amount, setAmount] = useState<string>('');
  const [paymentDetails, setPaymentDetails] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('Advance commission payout');
  const [showSalesmanSearch, setShowSalesmanSearch] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    if (initialSalesmanId) {
      setSelectedSalesmanId(initialSalesmanId);
    }
  }, [initialSalesmanId]);

  if (!isOpen) return null;

  const currentSalesman = salesmen.find(s => s.id === selectedSalesmanId) || salesmen[0];

  // Filter ledger entries for selected salesman
  const salesmanLedger = ledgerEntries.filter(
    l => l.salesmanId === selectedSalesmanId || (currentSalesman && l.account.toLowerCase().includes(currentSalesman.name.toLowerCase()))
  );

  // Compute live running balance: Total Credit (commissions) - Total Debit (payouts)
  const totalCredit = salesmanLedger.reduce((sum, l) => sum + (l.credit || 0), 0);
  const totalDebit = salesmanLedger.reduce((sum, l) => sum + (l.debit || 0), 0);
  const runningBalance = totalCredit - totalDebit;

  // Number to Indian English Words
  const numberToWords = (numStr: string): string => {
    const val = parseFloat(numStr);
    if (isNaN(val) || val <= 0) return '';
    if (val === 1) return '(Rupees One Only)';
    if (val === 100) return '(Rupees One Hundred Only)';
    if (val === 500) return '(Rupees Five Hundred Only)';
    if (val === 1000) return '(Rupees One Thousand Only)';
    return `(Rupees ${val.toFixed(2)} Only)`;
  };

  const handleSave = () => {
    const payAmt = parseFloat(amount);
    if (isNaN(payAmt) || payAmt <= 0) {
      showToast('⚠️ Please enter a valid payout amount');
      return;
    }
    if (!currentSalesman) {
      showToast('⚠️ Please select a valid salesman');
      return;
    }

    const newVoucher: SalesmanPaymentVoucher = {
      id: 'sm-vouch-' + Date.now(),
      voucherNo: transactionNo,
      date: transactionDate,
      salesmanId: currentSalesman.id,
      salesmanName: currentSalesman.name,
      amount: payAmt,
      paymentMode,
      referenceNo: paymentDetails,
      remarks
    };

    const newLedger: SalesmanLedgerEntry = {
      id: 'sm-ledg-' + Date.now(),
      salesmanId: currentSalesman.id,
      date: transactionDate,
      account: 'Cash Account',
      voucherNo: transactionNo,
      voucherType: 'SalesMan_Payment',
      particulars: `SalesMan_Payment (${paymentMode.replace('By ', '')})`,
      debit: payAmt,
      credit: 0.0,
      balance: runningBalance - payAmt
    };

    onSavePayment(newVoucher, newLedger);
    showToast(`✓ Payout of ₹${payAmt.toFixed(2)} recorded for ${currentSalesman.name} and synced to accounting`);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
      }}
    >
      <div
        style={{
          width: '780px',
          backgroundColor: '#f1f5f9',
          border: '1.5px solid #0055aa',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar (1:1 Frame 345) */}
        <div
          style={{
            backgroundColor: '#0055aa',
            color: '#ffffff',
            padding: '4px 10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', background: '#ffffff', color: '#0055aa', padding: '1px 3px', borderRadius: '2px' }}>POS</span>
            <span>frmSalesManPayment</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                background: '#dc2626',
                border: '1px solid #ffffff',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '11px',
                cursor: 'pointer',
                padding: '1px 6px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {toastMsg && (
          <div
            style={{
              backgroundColor: '#eff6ff',
              color: '#1e40af',
              borderBottom: '1px solid #bfdbfe',
              padding: '5px 10px',
              fontSize: '12px',
              fontWeight: 'bold',
              textAlign: 'center'
            }}
          >
            {toastMsg}
          </div>
        )}

        {/* Big Blue Banner (1:1 Frame 345) */}
        <div
          style={{
            backgroundColor: '#002b80',
            color: '#ffffff',
            textAlign: 'center',
            padding: '6px',
            fontSize: '16px',
            fontWeight: 'bold',
            letterSpacing: '0.5px'
          }}
        >
          Sales Man Payment Entry
        </div>

        {/* Top Split Section (1:1 Frame 345) */}
        <div style={{ padding: '12px', display: 'flex', gap: '12px' }}>
          {/* Left: SalesMan Information Groupbox */}
          <fieldset
            style={{
              flex: 1.2,
              border: '1px solid #94a3b8',
              borderRadius: '3px',
              padding: '8px 12px',
              backgroundColor: '#f8fafc'
            }}
          >
            <legend style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: 'bold' }}>SalesMan Information</legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
              {/* SalesMan ID */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '90px' }}>SalesMan ID :</span>
                <input
                  type="text"
                  readOnly
                  value={currentSalesman?.code || 'SM-0003'}
                  style={{ width: '90px', background: '#e2e8f0', border: '1px solid #cbd5e1', padding: '2px 4px', fontWeight: 'bold' }}
                />
                <button
                  type="button"
                  onClick={() => setShowSalesmanSearch(!showSalesmanSearch)}
                  style={{
                    marginLeft: '4px',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '2px 6px',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                  title="Search Salesman"
                >
                  🔍
                </button>
                {onDeleteSalesman && currentSalesman && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete Salesman ${currentSalesman.name} (${currentSalesman.code}) from database?`)) {
                        onDeleteSalesman(currentSalesman.id);
                      }
                    }}
                    style={{
                      marginLeft: '4px',
                      backgroundColor: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      padding: '2px 6px',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                    title="Delete Salesman from Database"
                  >
                    🗑️
                  </button>
                )}
              </div>

              {/* Quick Dropdown Picker if clicked */}
              {showSalesmanSearch && (
                <div style={{ backgroundColor: '#fef08a', border: '1px solid #ca8a04', padding: '4px', borderRadius: '2px' }}>
                  <select
                    style={{ width: '100%', fontSize: '11px', padding: '2px' }}
                    value={selectedSalesmanId}
                    onChange={(e) => {
                      setSelectedSalesmanId(e.target.value);
                      setShowSalesmanSearch(false);
                    }}
                  >
                    {salesmen.map(s => (
                      <option key={s.id} value={s.id}>{s.code} - {s.name} ({s.phone})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Name */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '90px' }}>Name :</span>
                <input
                  type="text"
                  readOnly
                  value={currentSalesman?.name || 'sukumar'}
                  style={{ flex: 1, background: '#ffffff', border: '1px solid #cbd5e1', padding: '2px 4px' }}
                />
              </div>

              {/* Address */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '90px' }}>Address :</span>
                <input
                  type="text"
                  readOnly
                  value={currentSalesman?.address || 'ktm'}
                  style={{ flex: 1, background: '#ffffff', border: '1px solid #cbd5e1', padding: '2px 4px' }}
                />
              </div>

              {/* Contact No */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '90px' }}>Contact No. :</span>
                <input
                  type="text"
                  readOnly
                  value={currentSalesman?.phone || '99999'}
                  style={{ flex: 1, background: '#ffffff', border: '1px solid #cbd5e1', padding: '2px 4px' }}
                />
              </div>

              {/* A/c Balance in bold blue (Frame 345) */}
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ width: '90px', fontWeight: 'bold' }}>A/c Balance :</span>
                <span style={{ fontWeight: 'bold', color: '#1d4ed8', fontSize: '13px' }}>
                  {runningBalance.toFixed(2)} Cr
                </span>
              </div>
            </div>
          </fieldset>

          {/* Center: Remarks Box (1:1 Frame 345) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: '#334155', marginBottom: '4px' }}>Remarks :</span>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              style={{
                flex: 1,
                minHeight: '120px',
                backgroundColor: '#fef9c3',
                border: '1px solid #cbd5e1',
                padding: '6px',
                fontSize: '11px',
                resize: 'none'
              }}
            />
          </div>

          {/* Right Action Buttons (1:1 Frame 345) */}
          <div style={{ width: '120px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => {
                setAmount('1');
                setRemarks('');
              }}
              style={{
                background: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%)',
                color: '#ffffff',
                border: '1px solid #0f172a',
                padding: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              New
            </button>
            <button
              onClick={handleSave}
              style={{
                background: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%)',
                color: '#ffffff',
                border: '1px solid #0f172a',
                padding: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              Save
            </button>
            <button
              onClick={() => showToast('ℹ️ Salesman payment voucher updated')}
              style={{
                background: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%)',
                color: '#ffffff',
                border: '1px solid #0f172a',
                padding: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              Update
            </button>
            <button
              onClick={() => showToast('ℹ️ Salesman commission ledger reloaded')}
              style={{
                background: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%)',
                color: '#ffffff',
                border: '1px solid #0f172a',
                padding: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              Get Data
            </button>
            <button
              onClick={() => window.print()}
              style={{
                background: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%)',
                color: '#ffffff',
                border: '1px solid #0f172a',
                padding: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              Print
            </button>
          </div>
        </div>

        {/* Middle Transaction Info (1:1 Frame 345) */}
        <div style={{ padding: '0 12px 10px', fontSize: '11px', display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontWeight: 'bold', color: '#1e3a8a' }}>Transaction Info</div>
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '110px' }}>Transaction No. :</span>
              <input
                type="text"
                value={transactionNo}
                onChange={(e) => setTransactionNo(e.target.value)}
                style={{ width: '130px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '2px 4px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '110px' }}>Transaction Date :</span>
              <input
                type="text"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                style={{ width: '110px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '2px 4px' }}
              />
              <span style={{ marginLeft: '4px' }}>📅</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '110px' }}>Payment Mode :</span>
              <select
                value={paymentMode}
                onChange={(e: any) => setPaymentMode(e.target.value)}
                style={{ width: '130px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '2px 4px' }}
              >
                <option value="By Cash">By Cash</option>
                <option value="By Cheque">By Cheque</option>
                <option value="By Bank Transfer">By Bank Transfer</option>
                <option value="By UPI">By UPI</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '110px' }}>Amount :</span>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ width: '90px', background: '#fef08a', border: '1px solid #cbd5e1', padding: '2px 4px', fontWeight: 'bold' }}
              />
              <span style={{ marginLeft: '8px', color: '#1d4ed8', fontWeight: 'bold' }}>
                {numberToWords(amount)}
              </span>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ color: '#334155' }}>Payment Mode Details : (Transaction ID/ Cheque No.)</span>
            <input
              type="text"
              value={paymentDetails}
              onChange={(e) => setPaymentDetails(e.target.value)}
              placeholder="e.g. TXN-99881"
              style={{
                width: '100%',
                backgroundColor: '#fef08a',
                border: '1px solid #cbd5e1',
                padding: '4px',
                fontSize: '11px'
              }}
            />
          </div>
        </div>

        {/* Bottom Table: Customer Dashboard (1:1 Frame 345) */}
        <div style={{ padding: '0 12px 12px' }}>
          <div
            style={{
              backgroundColor: '#16a34a',
              color: '#ffffff',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '12px',
              padding: '3px'
            }}
          >
            Customer Dashboard
          </div>
          <div
            style={{
              maxHeight: '140px',
              overflowY: 'auto',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0284c7', color: '#ffffff' }}>
                  <th style={{ border: '1px solid #0369a1', padding: '4px', width: '30px' }}>▶</th>
                  <th style={{ border: '1px solid #0369a1', padding: '4px' }}>Date</th>
                  <th style={{ border: '1px solid #0369a1', padding: '4px' }}>Invoice/Voucher No.</th>
                  <th style={{ border: '1px solid #0369a1', padding: '4px' }}>Particulars</th>
                  <th style={{ border: '1px solid #0369a1', padding: '4px', textAlign: 'right' }}>Debit</th>
                  <th style={{ border: '1px solid #0369a1', padding: '4px', textAlign: 'right' }}>Credit</th>
                </tr>
              </thead>
              <tbody>
                {salesmanLedger.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                      No transactions recorded for this salesperson.
                    </td>
                  </tr>
                ) : (
                  salesmanLedger.map((row, idx) => (
                    <tr
                      key={row.id || idx}
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                        borderBottom: '1px solid #e2e8f0'
                      }}
                    >
                      <td style={{ textAlign: 'center', color: '#0284c7', fontWeight: 'bold' }}>{idx + 1}</td>
                      <td style={{ padding: '4px 6px' }}>{row.date}</td>
                      <td style={{ padding: '4px 6px', fontFamily: 'monospace' }}>{row.voucherNo}</td>
                      <td style={{ padding: '4px 6px' }}>{row.particulars}</td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: row.debit > 0 ? '#b91c1c' : '#000000', fontWeight: row.debit > 0 ? 'bold' : 'normal' }}>
                        {row.debit.toFixed(2)}
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', color: row.credit > 0 ? '#15803d' : '#000000', fontWeight: row.credit > 0 ? 'bold' : 'normal' }}>
                        {row.credit.toFixed(2)}
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
