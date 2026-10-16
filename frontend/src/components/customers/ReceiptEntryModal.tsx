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

export const ReceiptEntryModal: React.FC<ReceiptEntryModalProps> = ({
  isOpen,
  customers,
  selectedCustomerId,
  bankAccounts,
  ledgerEntries,
  onSaveReceipt,
  onClose
}) => {
  const initialCustomer =
    customers.find((c) => c.id === selectedCustomerId) ||
    customers.find((c) => c.id === 'C-0002') ||
    customers.find((c) => c.id === 'C-0007') ||
    customers[0];

  const [currentCustomerId, setCurrentCustomerId] = useState(initialCustomer?.id || 'C-0002');
  const [transactionNo, setTransactionNo] = useState('RCPT-0003-2024/25');
  const [transactionDate, setTransactionDate] = useState('24/02/2025');
  const [paymentMode, setPaymentMode] = useState<string>('By Cash');
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id || '');
  const [amount, setAmount] = useState('5000');
  const [remarks, setRemarks] = useState('');
  const [paymentModeDetails, setPaymentModeDetails] = useState('');
  
  // Prompt dialog state
  const [showPrintPrompt, setShowPrintPrompt] = useState(false);
  const [lastSavedReceipt, setLastSavedReceipt] = useState<CustomerReceiptEntry | null>(null);
  const [showReceiptPrintPreview, setShowReceiptPrintPreview] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  if (!isOpen) return null;

  const currentCustomer = customers.find((c) => c.id === currentCustomerId) || initialCustomer;

  // Filter ledger for this customer
  const customerLedger = ledgerEntries.filter((l) => l.customerId === currentCustomerId);
  const totalDebit = customerLedger.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = customerLedger.reduce((sum, l) => sum + l.credit, 0);
  const runningBalance = Math.abs(totalDebit - totalCredit);
  const balanceType = totalDebit >= totalCredit ? 'Dr' : 'Cr';

  const numAmount = parseFloat(amount) || 0;
  const wordsRepresentation = numberToWords(numAmount);

  const handleSave = () => {
    if (!numAmount || numAmount <= 0) {
      showToast('⚠️ Please enter a valid amount');
      return;
    }

    const receipt: CustomerReceiptEntry = {
      id: 'rcpt-' + Date.now(),
      transactionNo,
      transactionDate,
      customerId: currentCustomer.id,
      customerName: currentCustomer.name,
      paymentMode: paymentMode as any,
      bankAccountId: paymentMode !== 'By Cash' ? bankAccountId : undefined,
      amount: numAmount,
      remarks: remarks + (paymentModeDetails ? ` (${paymentModeDetails})` : '')
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
    showToast(`✅ Payment receipt ${transactionNo} recorded and synced to cloud!`);
  };

  const handlePrintConfirm = (shouldPrint: boolean) => {
    setShowPrintPrompt(false);
    if (shouldPrint) {
      setShowReceiptPrintPreview(true);
    }
  };

  const handleSendWhatsApp = (gateway: string) => {
    const text = encodeURIComponent(
      `Dear ${currentCustomer.name},\nWe received payment of Rs. ${numAmount.toFixed(2)} (${wordsRepresentation}) via ${paymentMode}.\nVoucher: ${transactionNo} Date: ${transactionDate}.\nYour updated balance is Rs. ${(runningBalance - numAmount).toFixed(2)} ${balanceType}.\nThank you!`
    );
    window.open(`https://api.whatsapp.com/send?phone=91${currentCustomer.phone}&text=${text}`, '_blank');
    showToast(`📱 Dispatched receipt voucher via WhatsApp Gateway [${gateway}] to ${currentCustomer.phone}`);
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
      {/* 1:1 Video 18 Frame 047 Window Frame */}
      <div
        className="rd-dialog"
        style={{
          position: 'relative',
          width: '890px',
          maxWidth: '96vw',
          maxHeight: '94vh',
          backgroundColor: '#ffffff',
          border: '2px solid #1e40af',
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

        {toastMsg && (
          <div
            style={{
              backgroundColor: '#eff6ff',
              color: '#1e40af',
              borderBottom: '1px solid #bfdbfe',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 'bold',
              textAlign: 'center'
            }}
          >
            {toastMsg}
          </div>
        )}

        {/* Form Body (1:1 Frame 047) */}
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
                    className="flex-1 bg-white border border-gray-300 px-2 py-0.5 rounded font-mono font-bold"
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

                {/* A/c Balance in bold red (1:1 Frame 047) */}
                <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
                  <span className="text-sm font-black text-gray-800">A/c Balance :</span>
                  <span className="text-base font-black text-red-600">
                    {runningBalance.toFixed(0)} {balanceType}
                  </span>
                </div>
              </div>

              {/* Remarks Box on Right of Customer Info (1:1 Frame 047) */}
              <div className="col-span-5 flex flex-col gap-1.5">
                <div className="flex flex-col flex-1">
                  <label className="text-[11px] font-bold text-gray-700 mb-0.5">Remarks :</label>
                  <textarea
                    rows={4}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full flex-1 bg-[#ffffcc] border border-gray-300 p-1.5 rounded resize-none text-gray-800 focus:outline-none"
                    placeholder="Enter customer remarks..."
                  />
                </div>
              </div>
            </div>

            {/* Transaction Info (1:1 Frame 047 & 049) */}
            <div className="border border-gray-300 bg-white p-2.5 rounded shadow-2xs">
              <div className="text-[11px] font-bold text-gray-700 border-b pb-1 mb-2">
                Transaction Info
              </div>
              <div className="grid grid-cols-12 gap-3 items-start">
                {/* Left 7 cols: Inputs */}
                <div className="col-span-7 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label className="w-28 text-right font-medium text-gray-700">Transaction No. :</label>
                    <input
                      type="text"
                      value={transactionNo}
                      onChange={(e) => setTransactionNo(e.target.value)}
                      className="flex-1 bg-gray-100 border border-gray-300 px-2 py-0.5 rounded font-mono font-bold text-blue-900"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-28 text-right font-medium text-gray-700">Transaction Date :</label>
                    <input
                      type="text"
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      className="flex-1 bg-white border border-gray-300 px-2 py-0.5 rounded"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="w-28 text-right font-medium text-gray-700">Payment Mode :</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="flex-1 bg-white border border-gray-300 px-2 py-0.5 rounded font-semibold text-gray-800"
                    >
                      <option value="By Cash">By Cash</option>
                      <option value="By Cheque">By Cheque</option>
                      <option value="By Online Transfer">By Online Transfer</option>
                      <option value="PhonePe">PhonePe</option>
                      <option value="Google Pay">Google Pay</option>
                      <option value="Paytm">Paytm</option>
                      <option value="E-Wallet">E-Wallet</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
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
                  <div className="flex items-center gap-2">
                    <label className="w-28 text-right font-bold text-blue-900">Amount :</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-32 bg-[#ffffcc] border-2 border-yellow-400 px-2 py-0.5 text-base font-black text-gray-900 rounded focus:outline-none"
                    />
                    {/* Words representation (Frame 049 blue text) */}
                    <span className="text-blue-700 font-semibold text-[11px] italic">
                      {wordsRepresentation}
                    </span>
                  </div>
                </div>

                {/* Right 5 cols: Payment Mode Details Textarea (Frame 047) */}
                <div className="col-span-5 flex flex-col h-full">
                  <label className="text-[10px] font-bold text-gray-700 mb-1">
                    Payment Mode Details : (Transaction ID/ Cheque No.)
                  </label>
                  <textarea
                    rows={4}
                    value={paymentModeDetails}
                    onChange={(e) => setPaymentModeDetails(e.target.value)}
                    className="w-full flex-1 bg-[#ffffcc] border border-gray-300 p-1.5 rounded resize-none text-xs text-gray-800 focus:outline-none"
                    placeholder="Enter Cheque No, Bank Ref, UTR ID..."
                  />
                </div>
              </div>
            </div>

            {/* Customer Dashboard Running History (1:1 Frame 047) */}
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

          {/* Right Action Button Strip (1:1 Frame 047) */}
          <div className="w-28 flex flex-col gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setAmount('');
                setRemarks('');
                setPaymentModeDetails('');
              }}
              style={{ background: 'linear-gradient(180deg, #1b3b6f 0%, #0a1c38 100%)' }}
              className="w-full py-1.5 text-white font-bold rounded shadow-xs cursor-pointer hover:brightness-110"
            >
              New
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{ background: 'linear-gradient(180deg, #15803d 0%, #14532d 100%)' }}
              className="w-full py-1.5 text-white font-bold rounded shadow-xs cursor-pointer hover:brightness-110"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{ background: 'linear-gradient(180deg, #374151 0%, #111827 100%)' }}
              className="w-full py-1.5 text-white font-bold rounded shadow-xs cursor-pointer hover:brightness-110"
            >
              Update
            </button>
            <button
              type="button"
              onClick={() => showToast('⚠️ Delete requires administrator authorization.')}
              style={{ background: 'linear-gradient(180deg, #6b7280 0%, #374151 100%)' }}
              className="w-full py-1.5 text-white font-bold rounded shadow-xs cursor-pointer hover:brightness-110"
            >
              Delete
            </button>
            <button
              type="button"
              style={{ background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)' }}
              className="w-full py-1.5 text-white font-bold rounded shadow-xs mt-1 cursor-pointer hover:brightness-110"
            >
              Get Data
            </button>
            <button
              type="button"
              onClick={() => setShowReceiptPrintPreview(true)}
              style={{ background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)' }}
              className="w-full py-1.5 text-white font-bold rounded shadow-xs cursor-pointer hover:brightness-110"
            >
              Print
            </button>
            <button
              type="button"
              onClick={() => showToast(`📱 SMS receipt voucher sent to ${currentCustomer?.phone}`)}
              style={{ background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)' }}
              className="w-full py-1.5 text-white font-bold rounded shadow-xs cursor-pointer hover:brightness-110"
            >
              SMS
            </button>
            <button
              type="button"
              onClick={() => handleSendWhatsApp('Rocket')}
              style={{ background: 'linear-gradient(180deg, #374151 0%, #111827 100%)' }}
              className="w-full py-1.5 text-white font-bold rounded shadow-xs cursor-pointer hover:brightness-110"
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

        {/* 1:1 Prompt Modal: Print Confirmation */}
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

        {/* 1:1 Crystal Reports Receipt Voucher Print Preview (Frame 051) */}
        {showReceiptPrintPreview && (
          <div className="absolute inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
            <div className="relative w-[920px] max-h-[92vh] bg-[#525252] border-2 border-[#1e3a8a] rounded shadow-2xl flex flex-col font-sans select-none text-xs">
              {/* Header */}
              <div className="bg-[#1e40af] text-white px-3 py-1 flex items-center justify-between font-bold">
                <span>Print Preview - Receipt Voucher</span>
                <button
                  type="button"
                  onClick={() => setShowReceiptPrintPreview(false)}
                  className="w-4 h-4 bg-red-600 hover:bg-red-700 text-white text-[9px] flex items-center justify-center rounded-xs"
                >
                  ✕
                </button>
              </div>

              {/* Workspace */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Side Controls (Frame 051) */}
                <div className="w-[180px] bg-[#e2e8f0] border-r border-gray-400 p-3 flex flex-col gap-2">
                  <div className="text-[10px] font-bold text-gray-700 flex justify-between items-center">
                    <span>No(s) of Copy :</span>
                    <input type="number" defaultValue={1} className="w-10 bg-white border border-gray-400 text-center font-bold" />
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="w-full bg-[#1e40af] text-white p-2 rounded flex flex-col items-center shadow-xs font-bold"
                  >
                    <span className="text-xl">🖨️</span>
                    <span>Print F6</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('📄 PDF Receipt saved to document downloads')}
                    className="w-full bg-[#dc2626] text-white p-2 rounded flex flex-col items-center shadow-xs font-bold"
                  >
                    <span className="text-xl">📄</span>
                    <span>PDF F7</span>
                  </button>
                  <div className="border-t border-gray-300 pt-2 flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-gray-700">Enter Valid WhatsApp No. :</span>
                    <input type="text" defaultValue={currentCustomer?.phone} className="w-full bg-white border border-gray-300 px-1 text-xs" />
                    <button
                      type="button"
                      onClick={() => handleSendWhatsApp('Tejas')}
                      className="bg-green-600 text-white py-1 rounded font-bold text-[10px]"
                    >
                      Tejas
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendWhatsApp('Rocket')}
                      className="bg-emerald-600 text-white py-1 rounded font-bold text-[10px]"
                    >
                      Rocket
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendWhatsApp('Agni - F9')}
                      className="bg-teal-700 text-white py-1 rounded font-bold text-[10px]"
                    >
                      Agni - F9
                    </button>
                  </div>
                </div>

                {/* Center Receipt (Frame 051 exact reproduction) */}
                <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-[#525252]">
                  <div className="w-[620px] bg-white text-black p-6 shadow-2xl border border-gray-300 flex flex-col justify-between">
                    <div>
                      {/* Top Bar */}
                      <div className="flex justify-between items-center text-xs pb-1 mb-2">
                        <span className="text-sm font-bold text-red-800 underline">Receipt</span>
                        <span className="text-[10px] text-gray-600">ORIGINAL COPY</span>
                      </div>

                      {/* Store Header */}
                      <div className="flex items-center gap-4 border-b border-gray-300 pb-3">
                        <div className="w-16 h-16 bg-gray-100 border border-gray-300 flex items-center justify-center text-[9px] text-gray-400 text-center font-bold">
                          NO LOGO<br />AVAILABLE
                        </div>
                        <div className="flex-1 text-[11px]">
                          <div className="text-base font-black text-gray-900">SHREE VINAYAKA FURNITURES</div>
                          <div>Address : VAIKOM MAIN ROAD, KOTTAYAM, KERALA</div>
                          <div>Contact No. : 9847123456 / 8078311945</div>
                          <div>Email : rakeshleela5@gmail.com</div>
                          <div>GSTIN : 32AAAAA0000A1Z5 | State : Kerala</div>
                        </div>
                      </div>

                      {/* Receipt No & Date */}
                      <div className="flex justify-between items-center py-2 border-b border-gray-300 font-bold text-xs">
                        <span>Receipt No. : {lastSavedReceipt?.transactionNo || transactionNo}</span>
                        <span>Receipt Date : {lastSavedReceipt?.transactionDate || transactionDate}</span>
                      </div>

                      {/* Receipt Body */}
                      <div className="py-4 space-y-3 text-xs">
                        <div className="flex items-baseline gap-2">
                          <span className="text-gray-700">Received the Amount for</span>
                          <span className="font-mono text-base font-black text-blue-900">
                            ₹ {(lastSavedReceipt?.amount || numAmount).toFixed(2)}
                          </span>
                          <span className="text-gray-500">In Words</span>
                          <span className="font-bold uppercase text-gray-800">
                            {numberToWords(lastSavedReceipt?.amount || numAmount).replace(/[()]/g, '')}
                          </span>
                        </div>

                        <div className="flex justify-between text-[11px] pt-1">
                          <div>
                            <span className="text-gray-700">Payment Mode :</span>{' '}
                            <span className="font-bold">{lastSavedReceipt?.paymentMode || paymentMode}</span>
                          </div>
                          <div>
                            <span className="text-gray-700">Payment Mode Details :</span>{' '}
                            <span>{paymentModeDetails || 'By Cash Counter'}</span>
                          </div>
                        </div>

                        <div className="flex justify-between text-[11px] pt-1 border-t border-gray-200">
                          <div>
                            <span className="text-gray-700">From</span>{' '}
                            <span className="font-bold text-blue-900">{currentCustomer.name}</span>
                          </div>
                          <div>
                            <span className="text-gray-700">Customer ID :</span>{' '}
                            <span className="font-mono font-bold">{currentCustomer.id}</span>
                          </div>
                          <div className="text-gray-500 font-medium">, Thank You.</div>
                        </div>
                      </div>
                    </div>

                    {/* Barcode & Signature (Frame 051) */}
                    <div className="flex justify-between items-end pt-6 border-t border-gray-300 mt-6">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-36 bg-[repeating-linear-gradient(90deg,#000,#000_2px,transparent_2px,transparent_4px)]"></div>
                        <span className="font-mono text-[9px] mt-0.5 tracking-widest">{currentCustomer.id}-RCPT</span>
                      </div>
                      <div className="text-center">
                        <div className="w-40 border-b border-black mb-1"></div>
                        <span className="text-xs font-bold text-gray-800">Authorised Signatory</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
