import React, { useState } from 'react';
import type { Customer, CustomerReceiptEntry, CustomerLedgerEntry, BankAccountRecord } from '../../types/retailDaddy';

interface ReceiptEntryModalProps {
  isOpen: boolean;
  customers: Customer[];
  selectedCustomerId?: string;
  bankAccounts: BankAccountRecord[];
  ledgerEntries: CustomerLedgerEntry[];
  onSaveReceipt: (receipt: CustomerReceiptEntry, ledgerEntry: CustomerLedgerEntry) => void;
  onClose: () => void;
}

export const ReceiptEntryModal: React.FC<ReceiptEntryModalProps> = ({
  isOpen,
  customers,
  selectedCustomerId,
  bankAccounts,
  ledgerEntries,
  onSaveReceipt,
  onClose
}) => {
  const initialCustomer = customers.find((c) => c.id === selectedCustomerId) || customers.find((c) => c.id === 'C-0007') || customers[0];

  const [currentCustomerId, setCurrentCustomerId] = useState(initialCustomer?.id || 'C-0007');
  const [transactionNo, setTransactionNo] = useState('RCPT-0002-2024/25');
  const [transactionDate, setTransactionDate] = useState('22/02/2025');
  const [paymentMode, setPaymentMode] = useState<'By Cash' | 'By Cheque' | 'By Bank Transfer' | 'By UPI'>('By Cash');
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [amount, setAmount] = useState('3000');
  const [remarks, setRemarks] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  
  // Prompt dialog state
  const [showPrintPrompt, setShowPrintPrompt] = useState(false);
  const [lastSavedReceipt, setLastSavedReceipt] = useState<CustomerReceiptEntry | null>(null);
  const [showReceiptPrintPreview, setShowReceiptPrintPreview] = useState(false);

  if (!isOpen) return null;

  const currentCustomer = customers.find((c) => c.id === currentCustomerId) || initialCustomer;

  // Filter ledger for this customer
  const customerLedger = ledgerEntries.filter((l) => l.customerId === currentCustomerId);
  const totalDebit = customerLedger.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = customerLedger.reduce((sum, l) => sum + l.credit, 0);
  const runningBalance = Math.abs(totalDebit - totalCredit);
  const balanceType = totalDebit >= totalCredit ? 'Dr' : 'Cr';

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const receipt: CustomerReceiptEntry = {
      id: 'rcpt-' + Date.now(),
      transactionNo,
      transactionDate,
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      paymentMode,
      bankAccountId: paymentMode !== 'By Cash' ? bankAccountId : undefined,
      amount: numAmount,
      remarks: remarks + (chequeNo ? ` (Ref/Cheque: ${chequeNo})` : '')
    };

    const ledger: CustomerLedgerEntry = {
      id: 'ledg-' + Date.now(),
      customerId: currentCustomer.id,
      date: transactionDate,
      voucherNo: transactionNo,
      particulars: 'Receipt',
      debit: 0.0,
      credit: numAmount
    };

    onSaveReceipt(receipt, ledger);
    setLastSavedReceipt(receipt);
    setShowPrintPrompt(true);
  };

  const handlePrintConfirm = (shouldPrint: boolean) => {
    setShowPrintPrompt(false);
    if (shouldPrint) {
      setShowReceiptPrintPreview(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
      {/* 1:1 Frame 331 Window Frame */}
      <div className="relative w-[880px] bg-white border-2 border-[#1e40af] rounded shadow-2xl overflow-hidden font-sans select-none text-xs">
        {/* Title Bar */}
        <div className="bg-[#1e40af] text-white px-3 py-1 flex items-center justify-between font-bold">
          <span className="text-sm">Receipt Entry</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-[11px] shadow-xs"
            >
              UPI PAY
            </button>
            <span className="cursor-pointer text-sm">🔔</span>
            <div className="flex items-center gap-1 ml-2">
              <button
                type="button"
                className="w-4 h-4 bg-gray-200 hover:bg-gray-300 text-black text-[9px] flex items-center justify-center rounded-xs"
              >
                _
              </button>
              <button
                type="button"
                className="w-4 h-4 bg-gray-200 hover:bg-gray-300 text-black text-[9px] flex items-center justify-center rounded-xs"
              >
                □
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-4 h-4 bg-red-600 hover:bg-red-700 text-white text-[9px] flex items-center justify-center rounded-xs"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Form Body (1:1 Frame 331) */}
        <div className="p-3 bg-[#f8fafc] flex gap-3">
          {/* Main Left Content */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="grid grid-cols-12 gap-3">
              {/* Credit Customer Information */}
              <div className="col-span-7 border border-gray-300 bg-white p-2.5 rounded flex flex-col gap-1.5 shadow-2xs">
                <div className="text-[11px] font-bold text-gray-700 border-b pb-1">
                  Credit Customer Information
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right font-medium text-gray-700">Customer ID :</label>
                  <select
                    value={currentCustomerId}
                    onChange={(e) => setCurrentCustomerId(e.target.value)}
                    className="flex-1 bg-white border border-gray-300 px-2 py-0.5 rounded font-mono"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.id} - {c.name}
                      </option>
                    ))}
                  </select>
                  <span className="w-4 h-4 bg-green-500 rounded-xs"></span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right font-medium text-gray-700">Name :</label>
                  <input
                    type="text"
                    readOnly
                    value={currentCustomer?.name || ''}
                    className="flex-1 bg-gray-100 border border-gray-300 px-2 py-0.5 rounded text-gray-900 font-semibold"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right font-medium text-gray-700">Address :</label>
                  <input
                    type="text"
                    readOnly
                    value={currentCustomer?.address || 'local'}
                    className="flex-1 bg-gray-100 border border-gray-300 px-2 py-0.5 rounded text-gray-900"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right font-medium text-gray-700">Contact No. :</label>
                  <input
                    type="text"
                    readOnly
                    value={currentCustomer?.phone || ''}
                    className="flex-1 bg-gray-100 border border-gray-300 px-2 py-0.5 rounded text-gray-900 font-mono"
                  />
                </div>

                {/* A/c Balance in bold red (1:1 Frame 331) */}
                <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
                  <span className="text-sm font-black text-gray-800">A/c Balance :</span>
                  <span className="text-base font-black text-red-600">
                    {runningBalance.toFixed(0)} {balanceType}
                  </span>
                </div>
              </div>

              {/* Remarks Box on Right of Customer Info (1:1 Frame 331) */}
              <div className="col-span-5 flex flex-col gap-1.5">
                <div className="flex flex-col flex-1">
                  <label className="text-[11px] font-bold text-gray-700 mb-0.5">Remarks :</label>
                  <textarea
                    rows={4}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full flex-1 bg-[#ffffcc] border border-gray-300 p-1.5 rounded resize-none text-gray-800 focus:outline-none"
                    placeholder="Enter receipt notes..."
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-600 font-semibold">Ref / Cheque No :</label>
                  <input
                    type="text"
                    value={chequeNo}
                    onChange={(e) => setChequeNo(e.target.value)}
                    className="w-full bg-[#ffffcc] border border-gray-300 px-2 py-0.5 rounded text-xs"
                    placeholder="ID / Cheque No."
                  />
                </div>
              </div>
            </div>

            {/* Transaction Info (1:1 Frame 331) */}
            <div className="border border-gray-300 bg-white p-2.5 rounded shadow-2xs">
              <div className="text-[11px] font-bold text-gray-700 border-b pb-1 mb-2">
                Transaction Info
              </div>
              <div className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-4 flex items-center gap-2">
                  <label className="w-28 text-right font-medium text-gray-700">Transaction No. :</label>
                  <input
                    type="text"
                    value={transactionNo}
                    onChange={(e) => setTransactionNo(e.target.value)}
                    className="flex-1 bg-gray-100 border border-gray-300 px-2 py-0.5 rounded font-mono font-bold text-blue-900"
                  />
                </div>
                <div className="col-span-4 flex items-center gap-2">
                  <label className="w-28 text-right font-medium text-gray-700">Transaction Date :</label>
                  <input
                    type="text"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="flex-1 bg-white border border-gray-300 px-2 py-0.5 rounded"
                  />
                </div>
                <div className="col-span-4 flex items-center gap-2">
                  <label className="w-28 text-right font-medium text-gray-700">Payment Mode :</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="flex-1 bg-white border border-gray-300 px-2 py-0.5 rounded"
                  >
                    <option value="By Cash">By Cash</option>
                    <option value="By Cheque">By Cheque</option>
                    <option value="By Bank Transfer">By Bank Transfer</option>
                    <option value="By UPI">By UPI</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-3 items-center mt-2">
                <div className="col-span-4 flex items-center gap-2">
                  <label className="w-28 text-right font-medium text-gray-700">Bank A/c No :</label>
                  <select
                    value={bankAccountId}
                    onChange={(e) => setBankAccountId(e.target.value)}
                    disabled={paymentMode === 'By Cash'}
                    className="flex-1 bg-white disabled:bg-gray-100 border border-gray-300 px-2 py-0.5 rounded"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} - {b.accountNo}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-4 flex items-center gap-2">
                  <label className="w-28 text-right font-bold text-blue-900">Amount :</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1 bg-[#ffffcc] border-2 border-yellow-400 px-2 py-0.5 text-base font-black text-gray-900 rounded focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Customer Dashboard Running History (1:1 Frame 331) */}
            <div className="bg-white border border-green-600 rounded overflow-hidden flex flex-col h-[180px]">
              <div className="bg-[#15803d] text-white font-bold px-3 py-1 text-center text-xs tracking-wider">
                Customer Dashboard
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#005073] text-white font-bold sticky top-0">
                    <tr>
                      <th className="py-1 px-2 border-r border-[#003852] w-8 text-center"></th>
                      <th className="py-1 px-3 border-r border-[#003852]">Date</th>
                      <th className="py-1 px-3 border-r border-[#003852]">Invoice/Voucher No.</th>
                      <th className="py-1 px-3 border-r border-[#003852]">Particulars</th>
                      <th className="py-1 px-3 border-r border-[#003852] text-right">Debit</th>
                      <th className="py-1 px-3 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {customerLedger.map((row, idx) => (
                      <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="py-1 px-2 text-center border-r border-gray-200 text-blue-800">
                          {idx === 0 ? '▷ 1' : idx + 1}
                        </td>
                        <td className="py-1 px-3 border-r border-gray-200">{row.date}</td>
                        <td className="py-1 px-3 border-r border-gray-200 font-mono font-medium">{row.voucherNo}</td>
                        <td className="py-1 px-3 border-r border-gray-200">{row.particulars}</td>
                        <td className="py-1 px-3 border-r border-gray-200 text-right font-mono font-bold text-red-600">
                          {row.debit > 0 ? row.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                        </td>
                        <td className="py-1 px-3 text-right font-mono font-bold text-green-700">
                          {row.credit > 0 ? row.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Action Button Strip (1:1 Frame 331) */}
          <div className="w-28 flex flex-col gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setAmount('');
                setRemarks('');
                setChequeNo('');
              }}
              className="w-full py-1.5 bg-gradient-to-b from-[#1b3b6f] to-[#0a1c38] text-white font-bold rounded shadow-xs"
            >
              New
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="w-full py-1.5 bg-gradient-to-b from-[#15803d] to-[#14532d] text-white font-bold rounded shadow-xs"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="w-full py-1.5 bg-gradient-to-b from-gray-700 to-gray-900 text-white font-bold rounded shadow-xs"
            >
              Update
            </button>
            <button
              type="button"
              onClick={() => alert('Delete requires administrator authorization.')}
              className="w-full py-1.5 bg-gradient-to-b from-gray-500 to-gray-700 text-white font-bold rounded shadow-xs"
            >
              Delete
            </button>
            <button
              type="button"
              className="w-full py-1.5 bg-gradient-to-b from-[#0284c7] to-[#0369a1] text-white font-bold rounded shadow-xs mt-1"
            >
              Get Data
            </button>
            <button
              type="button"
              onClick={() => setShowReceiptPrintPreview(true)}
              className="w-full py-1.5 bg-gradient-to-b from-[#0284c7] to-[#0369a1] text-white font-bold rounded shadow-xs"
            >
              Print
            </button>
            <button
              type="button"
              onClick={() => alert(`SMS receipt voucher sent to ${currentCustomer?.phone}`)}
              className="w-full py-1.5 bg-gradient-to-b from-[#0284c7] to-[#0369a1] text-white font-bold rounded shadow-xs"
            >
              SMS
            </button>
            <button
              type="button"
              onClick={() => alert(`WhatsApp receipt PDF sent to ${currentCustomer?.phone}`)}
              className="w-full py-1.5 bg-gradient-to-b from-gray-700 to-gray-900 text-white font-bold rounded shadow-xs"
            >
              WhatsApp
            </button>
            <select className="w-full bg-white border border-gray-400 py-0.5 px-1 text-[10px] rounded text-gray-700 mt-1">
              <option>ORIGINAL COP</option>
              <option>DUPLICATE COP</option>
            </select>
            <button
              type="button"
              className="w-full py-1 bg-[#1e40af] hover:bg-[#1d4ed8] text-white font-bold rounded text-[10px] shadow-xs mt-1"
            >
              QR Code Scan To Pay
            </button>
          </div>
        </div>

        {/* 1:1 Frame 331 Prompt Modal: Print Confirmation */}
        {showPrintPrompt && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="w-80 bg-white border border-gray-400 shadow-2xl rounded p-4 font-sans select-none">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-black text-xl flex items-center justify-center shrink-0">
                  ?
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-xs">Successfully Saved</div>
                  <div className="text-gray-700 text-xs mt-1">Do You Want to Print the Receipt ?</div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => handlePrintConfirm(true)}
                  className="px-5 py-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 text-gray-900 font-bold rounded text-xs"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintConfirm(false)}
                  className="px-5 py-1 bg-gray-200 hover:bg-gray-300 border border-gray-400 text-gray-900 font-bold rounded text-xs"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Voucher Print Preview Modal */}
        {showReceiptPrintPreview && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="w-[480px] bg-white border-2 border-gray-800 p-6 rounded shadow-2xl text-black font-sans">
              <div className="text-center border-b pb-2">
                <div className="text-lg font-black tracking-wider">SHREE VINAYAKA FURNITURES</div>
                <div className="text-[11px] text-gray-600">VAIKOM MAIN ROAD, KOTTAYAM, KERALA</div>
                <div className="text-xs font-bold mt-1 uppercase text-blue-900 bg-gray-100 py-0.5">
                  CASH / PAYMENT RECEIPT VOUCHER
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs my-3">
                <div>
                  <span className="font-bold">Voucher No:</span> {lastSavedReceipt?.transactionNo || transactionNo}
                </div>
                <div className="text-right">
                  <span className="font-bold">Date:</span> {lastSavedReceipt?.transactionDate || transactionDate}
                </div>
                <div>
                  <span className="font-bold">Received From:</span> {currentCustomer?.name}
                </div>
                <div className="text-right">
                  <span className="font-bold">Contact:</span> {currentCustomer?.phone}
                </div>
                <div>
                  <span className="font-bold">Payment Mode:</span> {lastSavedReceipt?.paymentMode || paymentMode}
                </div>
                <div className="text-right">
                  <span className="font-bold">Remaining Due:</span> ₹{runningBalance.toFixed(2)}
                </div>
              </div>

              <div className="my-4 p-3 bg-gray-50 border border-gray-300 text-center">
                <div className="text-xs text-gray-500 uppercase">Amount Received</div>
                <div className="text-2xl font-black text-green-700">
                  ₹{(lastSavedReceipt?.amount || parseFloat(amount) || 0).toFixed(2)}
                </div>
              </div>

              <div className="flex justify-between items-end text-xs mt-6 pt-4 border-t border-dashed">
                <div>Customer Signature</div>
                <div>Authorized Signatory</div>
              </div>

              <div className="flex justify-end gap-2 mt-4 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1 bg-blue-700 text-white font-bold rounded text-xs"
                >
                  Print
                </button>
                <button
                  type="button"
                  onClick={() => setShowReceiptPrintPreview(false)}
                  className="px-4 py-1 bg-gray-300 text-black font-bold rounded text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
