import React, { useState } from 'react';
import type { PaymentSplitLine, BankAccountRecord } from '../../types/retailDaddy';

interface SettlementModalProps {
  isOpen: boolean;
  netPay: number;
  customerName: string;
  bankAccounts: BankAccountRecord[];
  onCompleteSettlement: (splitLines: PaymentSplitLine[], totalSettled: number, balanceDue: number) => void;
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
  
  // Split payment state
  const [mode, setMode] = useState<string>('Cash');
  const [bankAccountId, setBankAccountId] = useState<string>(bankAccounts[0]?.id || '');
  const [amount, setAmount] = useState<string>(String(netPay));
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

  if (!isOpen) return null;

  const totalSettled = splitLines.reduce((acc, l) => acc + l.amount, 0);
  const balanceDue = Math.max(0, netPay - totalSettled);

  // Video 14 Split Payment Modes (Frame 0410)
  const paymentModes = [
    { label: 'By Cash', value: 'Cash', type: 'CASH' },
    { label: 'By Credit Card', value: 'Credit Card', type: 'CARD' },
    { label: 'By Debit Card', value: 'Debit Card', type: 'CARD' },
    { label: 'PhonePe', value: 'PhonePe', type: 'UPI' },
    { label: 'Google Pay', value: 'Google Pay', type: 'UPI' },
    { label: 'Paytm', value: 'Paytm', type: 'UPI' },
    { label: 'E Wallet', value: 'E Wallet', type: 'WALLET' },
    { label: 'Credit / Udhaar', value: 'Credit / Udhaar', type: 'CREDIT', days: 30 },
    { label: 'By Cheque', value: 'Cheque', type: 'CHEQUE' },
    { label: 'By Bank Transfer', value: 'Bank Transfer', type: 'BANK_TRANSFER' },
    { label: 'Credit Terms - 7 days', value: 'Credit Terms - 7 days', type: 'CREDIT', days: 7 },
    { label: 'Credit Terms - 15 days', value: 'Credit Terms - 15 days', type: 'CREDIT', days: 15 },
    { label: 'Credit Terms - 30 days', value: 'Credit Terms - 30 days', type: 'CREDIT', days: 30 },
    { label: 'Credit Terms - Adjust', value: 'Credit Terms - Adjust', type: 'CREDIT', days: 0 }
  ];

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleAddSplitLine = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setValidationError('⚠️ Please enter a valid payment amount greater than zero');
      return;
    }
    setValidationError(null);

    const matchedMode = paymentModes.find((m) => m.value === mode);
    const selectedBank = bankAccounts.find((b) => b.id === bankAccountId);

    const newLine: PaymentSplitLine = {
      id: 'split-' + Date.now(),
      mode: (matchedMode?.type as any) || 'CASH',
      modeName: matchedMode?.label || mode,
      amount: numAmount,
      bankAccountId: mode === 'Cheque' || mode === 'Bank Transfer' ? bankAccountId : undefined,
      bankAccountName: mode === 'Cheque' || mode === 'Bank Transfer' ? selectedBank?.accountName : (matchedMode?.label || mode),
      creditDays: matchedMode?.days,
      date: paymentDate
    };

    setSplitLines((prev) => [...prev, newLine]);
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

  const handleCommit = () => {
    if (splitLines.length === 0) {
      setValidationError('⚠️ Please add at least one payment method or credit term.');
      return;
    }
    setValidationError(null);
    onCompleteSettlement(splitLines, totalSettled, balanceDue);
    onClose();
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
        backdropFilter: 'blur(1px)'
      }}
    >
      {/* 1:1 Frame 258/262 Window Frame */}
      <div
        className="rd-dialog"
        style={{
          position: 'relative',
          width: '780px',
          maxWidth: '96vw',
          maxHeight: '94vh',
          backgroundColor: '#ffffff',
          border: '2px solid #003366',
          borderRadius: '4px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontSize: '12px',
          userSelect: 'none'
        }}
      >
        {/* Title Bar */}
        <div className="bg-[#003366] text-white px-3 py-1 flex items-center justify-between font-bold">
          <div className="flex items-center gap-2">
            <span>💳</span>
            <span>Settlement & Payment Gateway - {customerName || 'Cash'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-4 h-4 bg-red-600 hover:bg-red-700 text-white text-[9px] flex items-center justify-center rounded-xs"
          >
            ✕
          </button>
        </div>

        {/* Tab Headers (1:1 Frame 258) */}
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
            SETTLEMENT
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
            UPI PAYMENT
          </button>
        </div>

        {validationError && (
          <div className="bg-red-100 text-red-700 px-3 py-1.5 text-xs font-bold border-b border-red-300 flex items-center justify-between">
            <span>{validationError}</span>
            <button onClick={() => setValidationError(null)} className="text-red-500 font-bold hover:text-red-800">✕</button>
          </div>
        )}

        {/* Tab 1: SETTLEMENT (1:1 Frame 258) */}
        {activeTab === 'SETTLEMENT' && (
          <div className="p-3 bg-[#f8fafc]">
            {/* Top Blue Container */}
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

                {/* [+ Add] Button (1:1 Frame 258) */}
                <div className="col-span-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddSplitLine}
                    style={{ background: 'linear-gradient(90deg, #16a34a 0%, #15803d 60%, #991b1b 100%)' }}
                    className="px-4 py-1.5 hover:brightness-110 text-white font-bold rounded shadow-md flex items-center gap-2 active:scale-95 transition-all text-sm cursor-pointer"
                  >
                    <span className="w-5 h-5 bg-green-400 rounded-full flex items-center justify-center text-black font-black text-xs">
                      +
                    </span>
                    <span>Add</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5 flex items-center gap-2">
                  <label className="text-[11px] font-bold text-gray-200 whitespace-nowrap">
                    Payment/Credit : <span className="text-red-400">*</span>
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
                      <th className="py-1 px-3">Bank A/c No</th>
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
                        <td className="py-1 px-3 text-gray-700">
                          {line.bankAccountName || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Toolbar on Right (1:1 Frame 258) */}
              <div className="flex flex-col gap-1 w-10">
                <button
                  type="button"
                  title="Remove selected line"
                  onClick={handleDeleteSplitLine}
                  className="w-10 h-9 bg-gray-300 hover:bg-red-500 hover:text-white rounded border border-gray-400 flex items-center justify-center text-sm font-bold shadow-xs active:scale-95"
                >
                  ➖
                </button>
                <button
                  type="button"
                  title="Edit selected line"
                  onClick={() => {
                    const sel = splitLines.find((l) => l.id === selectedSplitId);
                    if (sel) {
                      setAmount(String(sel.amount));
                    }
                  }}
                  className="w-10 h-9 bg-gray-300 hover:bg-blue-500 hover:text-white rounded border border-gray-400 flex items-center justify-center text-sm font-bold shadow-xs active:scale-95"
                >
                  📝
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
                  className="w-10 h-9 bg-gray-300 hover:bg-green-500 hover:text-white rounded border border-gray-400 flex items-center justify-center text-sm font-bold shadow-xs active:scale-95"
                >
                  🔄
                </button>
              </div>
            </div>

            {/* Bottom Summary Bar */}
            <div className="mt-3 bg-blue-50 p-2 rounded border border-blue-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-gray-600">Net Pay: </span>
                <span className="font-bold text-gray-900 text-sm">₹{netPay.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Settled: </span>
                <span className="font-bold text-green-700 text-sm">₹{totalSettled.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Balance / Credit Due: </span>
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
            <div className="w-80 bg-gray-50 border border-gray-300 p-4 rounded shadow-sm flex flex-col gap-3">
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
                  className="w-32 bg-[#ffffcc] border border-gray-400 px-2 py-1 text-right font-bold text-base text-gray-900 rounded focus:outline-none"
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
          <div className="p-6 bg-white flex flex-col items-center gap-4 text-center">
            <div className="font-bold text-sm text-gray-800">
              Scan & Pay via any UPI App (GPay, PhonePe, Paytm)
            </div>
            <div className="p-3 bg-white border-2 border-dashed border-[#003366] rounded-lg shadow-sm">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `upi://pay?pa=shreevinayaka@sbi&pn=SHREE%20VINAYAKA%20FURNITURES&am=${netPay}&cu=INR`
                )}`}
                alt="UPI Payment QR"
                className="w-44 h-44"
              />
            </div>
            <div className="font-bold text-blue-900 text-base">
              Amount to Pay: ₹{netPay.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              UPI ID: shreevinayaka@sbi
            </div>
          </div>
        )}

        {/* Footer (1:1 Frame 262) */}
        <div className="bg-[#e2e8f0] px-4 py-2 border-t border-gray-300 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded border border-gray-400 shadow-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCommit}
            style={{ background: 'linear-gradient(180deg, #16a34a 0%, #14532d 100%)' }}
            className="px-8 py-1.5 hover:brightness-110 border border-[#22c55e] text-white font-bold text-sm rounded shadow active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>✓</span>
            <span>Settle [F12]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
