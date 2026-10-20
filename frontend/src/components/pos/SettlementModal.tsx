import React, { useState } from 'react';
import type { PaymentSplitLine, BankAccountRecord } from '../../types/retailDaddy';
import { UpiQrCode } from '../common/UpiQrCode';

export interface SettlementMeta {
  isAdvanceBooking: boolean;
  utrNumber?: string;
  subventionPercent?: number;
  idempotencyKey?: string;
}

interface SettlementModalProps {
  isOpen: boolean;
  netPay: number;
  customerName: string;
  bankAccounts: BankAccountRecord[];
  onCompleteSettlement: (
    splitLines: PaymentSplitLine[],
    totalSettled: number,
    balanceDue: number,
    meta?: SettlementMeta
  ) => Promise<void> | void;
  onClose: () => void;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  isOpen,
  netPay,
  customerName,
  bankAccounts,
  onCompleteSettlement,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'SETTLEMENT' | 'CASH TENDER' | 'UPI PAYMENT'>('SETTLEMENT');
  
  // Advance Booking toggle
  const [isAdvanceBooking, setIsAdvanceBooking] = useState<boolean>(false);

  // Split payment state
  const [mode, setMode] = useState<string>('Cash');
  const [bankAccountId, setBankAccountId] = useState<string>(bankAccounts[0]?.id || '');
  const [amount, setAmount] = useState<string>(String(netPay));
  const [lineUtr, setLineUtr] = useState<string>('');
  const [lineSubvention, setLineSubvention] = useState<string>('0');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [splitLines, setSplitLines] = useState<PaymentSplitLine[]>([
    {
      id: 'split-1',
      mode: 'CASH',
      modeName: 'By Cash',
      amount: netPay,
      date: new Date().toISOString().split('T')[0]
    }
  ]);
  const [selectedSplitId, setSelectedSplitId] = useState<string>('');

  // Cash Tender Tab
  const [tenderCashPaid, setTenderCashPaid] = useState<string>(String(netPay));

  // Submitting state to prevent double-click / ghost invoices
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset form when modal closes or opens
  const resetForm = () => {
    setIsAdvanceBooking(false);
    setMode('Cash');
    setBankAccountId(bankAccounts[0]?.id || '');
    setAmount(String(netPay));
    setLineUtr('');
    setLineSubvention('0');
    setSplitLines([
      {
        id: 'split-1',
        mode: 'CASH',
        modeName: 'By Cash',
        amount: netPay,
        date: new Date().toISOString().split('T')[0]
      }
    ]);
    setSelectedSplitId('');
    setTenderCashPaid(String(netPay));
    setIsSubmitting(false);
    setValidationError(null);
  };

  const handleModalClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const totalSettled = splitLines.reduce((acc, l) => acc + l.amount, 0);
  const balanceDue = Math.max(0, netPay - totalSettled);

  // Multi-tender split payment modes (Tailored for high-ticket furniture bank-to-bank & 1-3 month credit)
  const paymentModes = [
    { label: 'By Cash', value: 'Cash', type: 'CASH' },
    { label: 'Bank Transfer (NEFT/RTGS to Store A/c)', value: 'Bank Transfer', type: 'BANK_TRANSFER' },
    { label: 'Credit (1 Month / Net 30 Days)', value: 'Credit - 30 days', type: 'CREDIT', days: 30 },
    { label: 'Credit (2 Months / Net 60 Days)', value: 'Credit - 60 days', type: 'CREDIT', days: 60 },
    { label: 'Credit (3 Months / Net 90 Days)', value: 'Credit - 90 days', type: 'CREDIT', days: 90 },
    { label: 'By Cheque / PDC (Post Dated Cheque)', value: 'Cheque', type: 'CHEQUE' },
    { label: 'By Credit Card', value: 'Credit Card', type: 'CARD' },
    { label: 'By Debit Card', value: 'Debit Card', type: 'CARD' },
    { label: 'PhonePe', value: 'PhonePe', type: 'UPI' },
    { label: 'Google Pay', value: 'Google Pay', type: 'UPI' },
    { label: 'Paytm', value: 'Paytm', type: 'UPI' },
    { label: 'UPI - Direct UTR', value: 'UPI UTR', type: 'UPI' },
    { label: 'Bajaj Finance / EMI', value: 'Bajaj Finance', type: 'FINANCE' },
    { label: 'Credit Terms - 7 days', value: 'Credit Terms - 7 days', type: 'CREDIT', days: 7 },
    { label: 'Credit Terms - 15 days', value: 'Credit Terms - 15 days', type: 'CREDIT', days: 15 },
    { label: 'Credit Terms - Adjust', value: 'Credit Terms - Adjust', type: 'CREDIT', days: 0 }
  ];

  const handleAddSplitLine = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setValidationError('⚠️ Please enter a valid payment amount greater than zero');
      return;
    }

    const matchedMode = paymentModes.find((m) => m.value === mode);
    const selectedBank = bankAccounts.find((b) => b.id === bankAccountId);
    const modeType = (matchedMode?.type as any) || 'CASH';

    const isUpi = modeType === 'UPI' || mode.includes('UPI') || mode === 'PhonePe' || mode === 'Google Pay' || mode === 'Paytm';
    if (isUpi && !lineUtr.trim()) {
      setValidationError('⚠️ UTR / Transaction Reference is mandatory for all UPI payment modes (PhonePe, Google Pay, Paytm, UPI)!');
      return;
    }

    setValidationError(null);

    const newLine: PaymentSplitLine = {
      id: 'split-' + Date.now(),
      mode: modeType,
      modeName: matchedMode?.label || mode,
      amount: numAmount,
      bankAccountId: mode === 'Cheque' || mode === 'Bank Transfer' ? bankAccountId : undefined,
      bankAccountName: mode === 'Cheque' || mode === 'Bank Transfer' ? selectedBank?.accountName : (matchedMode?.label || mode),
      creditDays: matchedMode?.days,
      date: paymentDate,
      utrNumber: (isUpi || modeType === 'BANK_TRANSFER' || modeType === 'FINANCE') && lineUtr ? lineUtr.trim() : undefined,
      subventionPercent: modeType === 'FINANCE' && lineSubvention ? parseFloat(lineSubvention) || 0 : undefined
    };

    setSplitLines((prev) => [...prev, newLine]);
    setLineUtr('');
    setLineSubvention('0');
    // Auto-calculate remaining amount for next entry
    const newTotal = totalSettled + numAmount;
    const remaining = Math.max(0, netPay - newTotal);
    setAmount(remaining > 0 ? String(remaining) : '0');
  };

  const handleDeleteSplitLine = () => {
    if (!selectedSplitId) {
      if (splitLines.length > 0) {
        setSplitLines((prev) => prev.slice(0, -1));
      }
      return;
    }
    setSplitLines((prev) => prev.filter((l) => l.id !== selectedSplitId));
    setSelectedSplitId('');
  };

  const handleCommit = async () => {
    if (isSubmitting) return;

    let finalSplitLines = [...splitLines];
    if (activeTab === 'CASH TENDER') {
      const cashReceived = parseFloat(tenderCashPaid) || netPay;
      const actualPaid = Math.min(netPay, cashReceived);
      finalSplitLines = [{
        id: 'split-cash-tender',
        mode: 'CASH',
        modeName: 'By Cash',
        amount: actualPaid,
        date: new Date().toISOString().split('T')[0]
      }];
    } else if (activeTab === 'UPI PAYMENT') {
      if (!lineUtr.trim()) {
        setValidationError('⚠️ UTR Reference is required to verify UPI payment.');
        return;
      }
      finalSplitLines = [{
        id: 'split-upi',
        mode: 'UPI',
        modeName: 'UPI (QR Code)',
        amount: netPay,
        date: new Date().toISOString().split('T')[0],
        utrNumber: lineUtr.trim() || undefined
      }];
    }

    if (finalSplitLines.length === 0) {
      setValidationError('⚠️ Please add at least one payment method or credit term.');
      return;
    }

    for (const line of finalSplitLines) {
      if (line.mode === 'UPI' && !line.utrNumber) {
        setValidationError('⚠️ 12-digit UTR reference number is required for all UPI split payments.');
        return;
      }
    }

    setValidationError(null);
    setIsSubmitting(true);

    const finalSettled = finalSplitLines.reduce((acc, l) => acc + l.amount, 0);
    const finalBalance = Math.max(0, netPay - finalSettled);
    const effectiveAdvanceBooking = isAdvanceBooking || finalBalance > 0;

    // Extract primary UTR and subvention for top-level sale attributes
    const primaryUtr = finalSplitLines.find(l => l.utrNumber)?.utrNumber || lineUtr.trim() || undefined;
    const financeLine = finalSplitLines.find(l => l.mode === 'FINANCE');
    const primarySubvention = financeLine?.subventionPercent || (parseFloat(lineSubvention) || 0);
    const key = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `svf-inv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      await onCompleteSettlement(finalSplitLines, finalSettled, finalBalance, {
        isAdvanceBooking: effectiveAdvanceBooking,
        utrNumber: primaryUtr,
        subventionPercent: primarySubvention,
        idempotencyKey: key
      });
      resetForm();
      onClose();
    } catch (e: any) {
      setIsSubmitting(false);
      setValidationError('⚠️ Failed to settle invoice: ' + (e?.message || String(e)));
    }
  };

  return (
    <div
      className="rd-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(2px)'
      }}
    >
      <div
        className="rd-dialog"
        style={{
          position: 'relative',
          width: '820px',
          maxWidth: '96vw',
          maxHeight: '94vh',
          backgroundColor: '#ffffff',
          border: '2px solid #003366',
          borderRadius: '6px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontSize: '12px',
          userSelect: 'none'
        }}
      >
        {/* Title Bar */}
        <div className="bg-[#003366] text-white px-3 py-1.5 flex items-center justify-between font-bold">
          <div className="flex items-center gap-2">
            <span>💳</span>
            <span>Settlement & Payment Gateway - {customerName || 'Cash'}</span>
            {isAdvanceBooking && (
              <span className="bg-amber-500 text-black px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                Advance Booking
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            disabled={isSubmitting}
            className="w-5 h-5 bg-red-600 hover:bg-red-700 text-white text-[10px] flex items-center justify-center rounded cursor-pointer disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Tab Headers */}
        <div className="flex bg-[#e2e8f0] border-b border-gray-300">
          <button
            type="button"
            onClick={() => setActiveTab('SETTLEMENT')}
            className={`py-1.5 px-4 font-bold text-xs uppercase tracking-wider border-r border-gray-300 transition-colors ${
              activeTab === 'SETTLEMENT'
                ? 'bg-[#004080] text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            MULTI-TENDER SETTLEMENT
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CASH TENDER')}
            className={`py-1.5 px-4 font-bold text-xs uppercase tracking-wider border-r border-gray-300 transition-colors ${
              activeTab === 'CASH TENDER'
                ? 'bg-[#004080] text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            CASH TENDER
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('UPI PAYMENT')}
            className={`py-1.5 px-4 font-bold text-xs uppercase tracking-wider transition-colors ${
              activeTab === 'UPI PAYMENT'
                ? 'bg-[#004080] text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            UPI SCAN & PAY
          </button>
        </div>

        {/* Advance Booking Option Banner */}
        <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900 text-xs">
            <input
              type="checkbox"
              id="advance-booking-checkbox"
              checked={isAdvanceBooking}
              onChange={(e) => setIsAdvanceBooking(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
            <span>📦 Advance Booking Order (Future Delivery — Lock Stock in Warehouse as Reserved Stock)</span>
          </label>
          {isAdvanceBooking && (
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
              Stock will be hedged in <strong>reserved_stock</strong> bucket
            </span>
          )}
        </div>

        {validationError && (
          <div className="bg-red-100 text-red-700 px-3 py-1.5 text-xs font-bold border-b border-red-300 flex items-center justify-between">
            <span>{validationError}</span>
            <button onClick={() => setValidationError(null)} className="text-red-500 font-bold hover:text-red-800">✕</button>
          </div>
        )}

        {/* Tab 1: SETTLEMENT */}
        {activeTab === 'SETTLEMENT' && (
          <div className="p-3 bg-[#f8fafc] flex-1 overflow-y-auto">
            {/* Top Container */}
            <div
              className="p-3 rounded text-white flex flex-col gap-2 shadow-md"
              style={{ background: 'linear-gradient(90deg, #003366 0%, #004080 50%, #002244 100%)' }}
            >
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5 flex items-center gap-2">
                  <label className="text-[11px] font-bold text-gray-200 whitespace-nowrap">
                    Payment Mode : <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="flex-1 bg-white text-black font-semibold px-2 py-1 rounded text-xs border border-gray-300 focus:outline-none"
                  >
                    {paymentModes.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-4 flex items-center gap-2">
                  <label className="text-[11px] font-bold text-gray-200 whitespace-nowrap">
                    Bank A/c No :
                  </label>
                  <select
                    value={bankAccountId}
                    onChange={(e) => setBankAccountId(e.target.value)}
                    disabled={mode !== 'Cheque' && mode !== 'Bank Transfer'}
                    className="flex-1 bg-white disabled:bg-gray-200 text-black px-2 py-1 rounded text-xs border border-gray-300 focus:outline-none"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - {b.accountNo}
                      </option>
                    ))}
                  </select>
                </div>

                {/* [+ Add] Button */}
                <div className="col-span-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddSplitLine}
                    style={{ background: 'linear-gradient(90deg, #16a34a 0%, #15803d 60%, #991b1b 100%)' }}
                    className="px-4 py-1.5 hover:brightness-110 text-white font-bold rounded shadow-md flex items-center gap-2 active:scale-95 transition-all text-xs cursor-pointer"
                  >
                    <span className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center text-black font-black text-xs">
                      +
                    </span>
                    <span>Add Split Line</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5 flex items-center gap-2">
                  <label className="text-[11px] font-bold text-gray-200 whitespace-nowrap">
                    Amount (₹) : <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 bg-[#ffffcc] text-blue-900 font-bold px-2 py-1 rounded text-xs border border-yellow-300 focus:outline-none"
                  />
                </div>

                <div className="col-span-4 flex items-center gap-2">
                  <label className="text-[11px] font-bold text-gray-200 whitespace-nowrap">
                    Payment Date :
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="flex-1 bg-white text-black px-2 py-1 rounded text-xs border border-gray-300 focus:outline-none"
                  />
                </div>
              </div>

              {/* UTR Reference & Finance Subvention fields */}
              {(mode.includes('UPI') || mode === 'PhonePe' || mode === 'Google Pay' || mode === 'Paytm' || mode === 'Bank Transfer' || mode.includes('Finance') || paymentModes.find(m => m.value === mode)?.type === 'UPI') && (
                <div className="grid grid-cols-12 gap-2 items-center pt-1 border-t border-blue-800">
                  <div className="col-span-6 flex items-center gap-2">
                    <label className="text-[11px] font-bold text-yellow-300 whitespace-nowrap">
                      UTR / Txn Ref : <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 629182736192 (12-digit UTR)"
                      value={lineUtr}
                      onChange={(e) => setLineUtr(e.target.value)}
                      className="flex-1 bg-white text-black px-2 py-1 rounded text-xs font-mono font-bold border border-yellow-400 focus:outline-none"
                    />
                  </div>

                  {mode.includes('Finance') && (
                    <div className="col-span-6 flex items-center gap-2">
                      <label className="text-[11px] font-bold text-yellow-300 whitespace-nowrap">
                        DBD Subvention % :
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 1.5"
                        value={lineSubvention}
                        onChange={(e) => setLineSubvention(e.target.value)}
                        className="w-20 bg-white text-black px-2 py-1 rounded text-xs font-bold text-right border border-gray-300 focus:outline-none"
                      />
                      <span className="text-[10px] text-gray-300">
                        Ded: ₹{((parseFloat(amount) || 0) * (parseFloat(lineSubvention) || 0) / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Middle Grid & Toolbar */}
            <div className="mt-3 flex gap-2">
              <div className="flex-1 bg-white border border-[#004080] rounded overflow-hidden h-[180px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#004080] text-white font-bold sticky top-0">
                    <tr>
                      <th className="py-1 px-3 border-r border-[#002b55]">Payment Mode</th>
                      <th className="py-1 px-3 border-r border-[#002b55] text-right">Payment / Credit</th>
                      <th className="py-1 px-3 border-r border-[#002b55]">Payment Date</th>
                      <th className="py-1 px-3 border-r border-[#002b55]">UTR / Ref No</th>
                      <th className="py-1 px-3">Bank / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {splitLines.map((line, idx) => (
                      <tr
                        key={line.id}
                        onClick={() => setSelectedSplitId(line.id)}
                        className={`cursor-pointer ${
                          selectedSplitId === line.id
                            ? 'bg-blue-100 font-bold'
                            : idx % 2 === 0
                            ? 'bg-white'
                            : 'bg-gray-50'
                        }`}
                      >
                        <td className="py-1 px-3 text-gray-800 border-r border-gray-200">
                          {line.modeName || (line.mode === 'CREDIT' ? `Credit (${line.creditDays} days)` : line.mode)}
                        </td>
                        <td className="py-1 px-3 text-right font-mono text-blue-900 font-bold border-r border-gray-200">
                          ₹{line.amount.toFixed(2)}
                        </td>
                        <td className="py-1 px-3 text-gray-600 border-r border-gray-200">
                          {line.date}
                        </td>
                        <td className="py-1 px-3 font-mono text-gray-700 border-r border-gray-200">
                          {line.utrNumber || '-'}
                        </td>
                        <td className="py-1 px-3 text-gray-700">
                          {line.bankAccountName || (line.subventionPercent ? `Subvention: ${line.subventionPercent}%` : '-')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Toolbar on Right */}
              <div className="flex flex-col gap-1 w-10">
                <button
                  type="button"
                  title="Remove selected line"
                  onClick={handleDeleteSplitLine}
                  className="w-10 h-9 bg-gray-300 hover:bg-red-500 hover:text-white rounded border border-gray-400 flex items-center justify-center text-sm font-bold shadow-xs active:scale-95 cursor-pointer"
                >
                  ➖
                </button>
                <button
                  type="button"
                  title="Reset split"
                  onClick={() => {
                    setSplitLines([
                      {
                        id: 'split-1',
                        mode: 'CASH',
                        amount: netPay,
                        date: new Date().toISOString().split('T')[0]
                      }
                    ]);
                    setAmount('0');
                  }}
                  className="w-10 h-9 bg-gray-300 hover:bg-green-500 hover:text-white rounded border border-gray-400 flex items-center justify-center text-sm font-bold shadow-xs active:scale-95 cursor-pointer"
                >
                  🔄
                </button>
              </div>
            </div>

            {/* Bottom Summary Bar */}
            <div className="mt-3 bg-blue-50 p-2.5 rounded border border-blue-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-gray-600 font-medium">Consignment Value: </span>
                <span className="font-bold text-gray-900 text-sm">₹{netPay.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Total Received Now: </span>
                <span className="font-bold text-green-700 text-sm">₹{totalSettled.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Balance Due Before Delivery: </span>
                <span className={`font-bold text-sm ${balanceDue > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                  ₹{balanceDue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: CASH TENDER */}
        {activeTab === 'CASH TENDER' && (
          <div className="p-6 bg-white flex flex-col items-center gap-4">
            <div className="w-88 bg-gray-50 border border-gray-300 p-4 rounded shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-gray-700">Bill Net Amount:</span>
                <span className="font-black text-blue-900 text-base">₹{netPay.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-gray-700">Cash Received:</span>
                <input
                  type="number"
                  value={tenderCashPaid}
                  onChange={(e) => setTenderCashPaid(e.target.value)}
                  className="w-36 bg-[#ffffcc] border border-gray-400 px-2 py-1 text-right font-bold text-base text-gray-900 rounded focus:outline-none"
                />
              </div>
              <hr />
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-gray-700">Cash Change to Return:</span>
                <span className="font-black text-green-700 text-lg">
                  ₹{Math.max(0, (parseFloat(tenderCashPaid) || 0) - netPay).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: UPI PAYMENT */}
        {activeTab === 'UPI PAYMENT' && (
          <div className="p-6 bg-white flex flex-col items-center gap-3 text-center">
            <div className="font-bold text-sm text-gray-800">
              Scan & Pay via any UPI App (GPay, PhonePe, Paytm)
            </div>
            <div className="p-3 bg-white border-2 border-dashed border-[#003366] rounded-lg shadow-sm">
              <UpiQrCode
                upiId="shreevinayaka@icici"
                payeeName="SHREE VINAYAKA FURNITURES"
                amount={netPay}
                size={176}
                className="w-44 h-44"
              />
            </div>
            <div className="font-bold text-blue-900 text-base">
              Amount to Pay: ₹{netPay.toFixed(2)}
            </div>
            <div className="w-72 flex items-center gap-2 mt-1">
              <label className="text-xs font-bold text-gray-700 whitespace-nowrap">Bank UTR:</label>
              <input
                type="text"
                placeholder="12-digit UTR reference"
                value={lineUtr}
                onChange={(e) => setLineUtr(e.target.value)}
                className="flex-1 bg-yellow-50 border border-yellow-400 rounded px-2 py-1 text-xs font-mono font-bold text-gray-900"
              />
            </div>
            <div className="text-xs text-slate-700 font-semibold">
              UPI ID: shreevinayaka@icici • Verified Showroom Account
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-[#e2e8f0] px-4 py-2 border-t border-gray-300 flex items-center justify-between">
          <button
            type="button"
            onClick={handleModalClose}
            disabled={isSubmitting}
            className="px-5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold rounded border border-slate-400 shadow-xs cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            id="settle-invoice-submit-btn"
            type="button"
            disabled={isSubmitting}
            onClick={handleCommit}
            style={{ background: isSubmitting ? '#94a3b8' : 'linear-gradient(180deg, #16a34a 0%, #14532d 100%)' }}
            className="px-8 py-1.5 hover:brightness-110 border border-[#22c55e] text-white font-bold text-sm rounded shadow active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>✓</span>
                <span>{isAdvanceBooking || balanceDue > 0 ? 'Confirm Advance Booking' : 'Settle Invoice [F12]'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

