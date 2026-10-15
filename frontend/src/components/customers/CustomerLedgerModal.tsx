import React, { useState } from 'react';
import type { Customer, CustomerLedgerEntry } from '../../types/retailDaddy';

interface CustomerLedgerModalProps {
  isOpen: boolean;
  customer: Customer;
  ledgerEntries: CustomerLedgerEntry[];
  onClose: () => void;
}

export const CustomerLedgerModal: React.FC<CustomerLedgerModalProps> = ({
  isOpen,
  customer,
  ledgerEntries,
  onClose
}) => {
  const [fromDate, setFromDate] = useState('01/04/2024');
  const [toDate, setToDate] = useState('24/02/2025');
  const [zoomFactor, setZoomFactor] = useState('100%');
  const [showZoomMenu, setShowZoomMenu] = useState(false);

  if (!isOpen) return null;

  // Filter entries for this customer
  const customerEntries = ledgerEntries.filter((l) => l.customerId === customer.id);
  const totalDebit = customerEntries.reduce((sum, l) => sum + l.debit, 0);
  const totalCredit = customerEntries.reduce((sum, l) => sum + l.credit, 0);
  const closingBalance = Math.abs(totalDebit - totalCredit);
  const balanceType = totalDebit >= totalCredit ? 'Dr' : 'Cr';

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    alert(`Downloading PDF Statement for ${customer.name} (Balance: ₹${closingBalance.toFixed(2)} ${balanceType})`);
  };

  const handleSendWhatsApp = (gateway: string) => {
    const text = encodeURIComponent(
      `Dear ${customer.name},\nYour account statement balance as of ${toDate} is Rs. ${closingBalance.toFixed(2)} ${balanceType}.\nTotal Debits: Rs. ${totalDebit.toFixed(2)}\nTotal Payments: Rs. ${totalCredit.toFixed(2)}\nThank you for shopping with us!`
    );
    window.open(`https://api.whatsapp.com/send?phone=91${customer.phone}&text=${text}`, '_blank');
    alert(`Dispatched statement via WhatsApp Gateway [${gateway}] to ${customer.phone}`);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-[2px]">
      {/* 1:1 Crystal Reports Print Preview Window (Video 18 Frame 064) */}
      <div className="relative w-[1040px] h-[92vh] max-h-[860px] bg-[#666666] border-2 border-[#1e3a8a] rounded shadow-2xl flex flex-col font-sans select-none text-xs">
        {/* Top Window Bar */}
        <div className="bg-[#1e40af] text-white px-3 py-1.5 flex items-center justify-between font-bold text-xs">
          <div className="flex items-center gap-2">
            <span>📑</span>
            <span>Print Preview - Customer Ledger Statement</span>
          </div>
          <div className="flex items-center gap-1">
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
              className="w-4 h-4 bg-red-600 hover:bg-red-700 text-white text-[9px] flex items-center justify-center rounded-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Crystal Reports Toolbar (Frame 064) */}
        <div className="bg-[#e2e8f0] border-b border-gray-400 px-3 py-1 flex items-center gap-3 text-gray-700 text-xs">
          <button
            type="button"
            className="px-2 py-0.5 bg-white border border-gray-300 rounded font-bold text-gray-800 shadow-2xs"
          >
            Main Report
          </button>
          <div className="h-4 w-[1px] bg-gray-400" />
          <button type="button" onClick={handlePrint} className="hover:text-blue-700" title="Print">
            🖨️
          </button>
          <button type="button" onClick={handleExportPDF} className="hover:text-blue-700" title="Export">
            💾
          </button>
          <div className="h-4 w-[1px] bg-gray-400" />
          <button type="button" className="hover:text-blue-700" title="First Page">⏮</button>
          <button type="button" className="hover:text-blue-700" title="Prev Page">◀</button>
          <span className="font-mono text-[11px]">1 / 1</span>
          <button type="button" className="hover:text-blue-700" title="Next Page">▶</button>
          <button type="button" className="hover:text-blue-700" title="Last Page">⏭</button>
          <div className="h-4 w-[1px] bg-gray-400" />
          
          {/* Zoom Dropdown (Frame 064) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowZoomMenu(!showZoomMenu)}
              className="px-2 py-0.5 bg-white border border-gray-300 rounded flex items-center gap-1 font-semibold"
            >
              <span>🔍 {zoomFactor}</span>
              <span>▾</span>
            </button>
            {showZoomMenu && (
              <div className="absolute left-0 top-full mt-1 w-28 bg-white border border-gray-400 shadow-xl rounded z-50 py-1">
                {['Page Width', 'Whole Page', '400%', '300%', '200%', '150%', '100%', '75%', '50%'].map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => {
                      setZoomFactor(z.includes('%') ? z : '100%');
                      setShowZoomMenu(false);
                    }}
                    className="w-full text-left px-3 py-1 hover:bg-blue-600 hover:text-white text-xs"
                  >
                    {z}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Workspace: Left Toolbar + Center Crystal Reports Sheet */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar (Frame 064: Print, PDF, Email, 3 WhatsApp Gateways) */}
          <div className="w-[190px] bg-[#e2e8f0] border-r border-gray-400 p-2.5 flex flex-col gap-2 overflow-y-auto">
            <div className="text-[10px] font-bold text-gray-700 flex items-center justify-between">
              <span>No(s) of Copy :</span>
              <input
                type="number"
                defaultValue={1}
                min={1}
                className="w-12 bg-white border border-gray-400 px-1 py-0.5 rounded text-center font-bold"
              />
            </div>

            {/* Date Range Filters (Video 18 Frame 064) */}
            <div className="flex flex-col gap-1 border-t border-gray-300 pt-2 text-[10px]">
              <span className="font-bold text-gray-700">Period:</span>
              <div className="flex items-center justify-between gap-1">
                <span className="text-gray-500">From:</span>
                <input
                  type="text"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-24 bg-white border border-gray-400 px-1 py-0.5 rounded text-[10px] text-center font-mono"
                />
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-gray-500">To:</span>
                <input
                  type="text"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-24 bg-white border border-gray-400 px-1 py-0.5 rounded text-[10px] text-center font-mono"
                />
              </div>
            </div>

            {/* Print F6 Blue Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="w-full bg-[#1e40af] hover:bg-[#1d4ed8] text-white p-2 rounded flex flex-col items-center justify-center gap-1 shadow-sm font-black"
            >
              <span className="text-xl">🖨️</span>
              <span className="text-xs">Print F6</span>
            </button>

            {/* PDF F7 Red Button */}
            <button
              type="button"
              onClick={handleExportPDF}
              className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white p-2 rounded flex flex-col items-center justify-center gap-1 shadow-sm font-black"
            >
              <span className="text-xl">📄</span>
              <span className="text-xs">PDF F7</span>
            </button>

            {/* Email F8 Orange Button */}
            <div className="flex flex-col gap-1 border-t border-gray-300 pt-2">
              <span className="text-[10px] font-bold text-gray-700">Enter Valid Email ID :</span>
              <input
                type="email"
                defaultValue={customer.email || 'customer@gmail.com'}
                className="w-full bg-white border border-gray-300 px-1.5 py-0.5 text-xs rounded"
              />
              <button
                type="button"
                onClick={() => alert(`Emailing statement to ${customer.email || 'customer@gmail.com'}`)}
                className="w-full bg-[#ea580c] hover:bg-[#c2410c] text-white py-1 rounded font-bold text-xs shadow-xs flex items-center justify-center gap-1"
              >
                <span>✉️</span>
                <span>Email F8</span>
              </button>
            </div>

            {/* WhatsApp Gateways (Frame 064: Tejas, Rocket, Agni - F9) */}
            <div className="flex flex-col gap-1.5 border-t border-gray-300 pt-2">
              <span className="text-[10px] font-bold text-gray-700">Enter Valid WhatsApp No. :</span>
              <input
                type="text"
                defaultValue={customer.phone}
                className="w-full bg-white border border-gray-300 px-1.5 py-0.5 text-xs rounded font-mono font-bold"
              />
              <span className="text-[9px] text-gray-500">Gateway Options:</span>
              <button
                type="button"
                onClick={() => handleSendWhatsApp('Tejas')}
                className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white py-1 rounded font-bold text-xs shadow-xs flex items-center justify-center gap-1"
              >
                <span>💬</span>
                <span>Tejas</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendWhatsApp('Rocket')}
                className="w-full bg-[#059669] hover:bg-[#047857] text-white py-1 rounded font-bold text-xs shadow-xs flex items-center justify-center gap-1"
              >
                <span>🚀</span>
                <span>Rocket</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendWhatsApp('Agni - F9')}
                className="w-full bg-[#047857] hover:bg-[#065f46] text-white py-1 rounded font-bold text-xs shadow-xs flex items-center justify-center gap-1"
              >
                <span>🔥</span>
                <span>Agni - F9</span>
              </button>
            </div>
          </div>

          {/* Center Document Sheet (1:1 Frame 064) */}
          <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-[#525252]">
            <div className="w-[720px] min-h-[780px] bg-white text-black p-8 shadow-2xl flex flex-col justify-between text-xs">
              <div>
                {/* Document Header */}
                <div className="text-center mb-4">
                  <h1 className="text-xl font-black text-[#1e3a8a] tracking-wide">
                    Customer Ledger Loyalty
                  </h1>
                  <p className="text-xs text-gray-600 font-semibold mt-0.5">
                    ( From {fromDate} To : {toDate} )
                  </p>
                  <p className="text-[10px] text-gray-400 text-right mt-1">
                    {toDate} {new Date().toLocaleTimeString()}
                  </p>
                </div>

                {/* Customer Details Box (Frame 064) */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 border border-gray-300 p-3 rounded mb-4 bg-gray-50/50 text-[11px]">
                  <div>
                    <span className="font-bold text-gray-700">Customer ID :</span>{' '}
                    <span className="font-mono font-semibold">{customer.id}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">City :</span>{' '}
                    <span>{customer.city || 'localcity'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">Customer Name :</span>{' '}
                    <span className="font-bold text-blue-900">{customer.name}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">Contact No. :</span>{' '}
                    <span className="font-mono">{customer.phone}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">Address :</span>{' '}
                    <span>{customer.address || 'local'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-gray-700">State :</span>{' '}
                    <span>{customer.state || 'Kerala'}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-gray-200 mt-1 flex items-center justify-between">
                    <span className="font-bold text-gray-800 text-xs">Current Balance :</span>
                    <span className="font-black text-red-600 text-sm">
                      {closingBalance.toFixed(2)} {balanceType}
                    </span>
                  </div>
                </div>

                {/* Statement Table (Frame 064) */}
                <table className="w-full text-left border-collapse border border-gray-300 text-[11px]">
                  <thead className="bg-[#f1f5f9] font-bold border-b-2 border-gray-400">
                    <tr>
                      <th className="py-1 px-2 border-r border-gray-300">Date</th>
                      <th className="py-1 px-2 border-r border-gray-300">Account</th>
                      <th className="py-1 px-2 border-r border-gray-300">Voucher / Invoice No.</th>
                      <th className="py-1 px-2 border-r border-gray-300">Voucher Type</th>
                      <th className="py-1 px-2 border-r border-gray-300">Remarks</th>
                      <th className="py-1 px-2 border-r border-gray-300 text-right text-red-700">Debit Point</th>
                      <th className="py-1 px-2 text-right text-green-700">Credit Point</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerEntries.map((e, idx) => (
                      <tr key={e.id || idx} className="border-b border-gray-200 hover:bg-yellow-50">
                        <td className="py-1 px-2 border-r border-gray-200 font-mono text-[10px]">{e.date}</td>
                        <td className="py-1 px-2 border-r border-gray-200 font-medium">{customer.name}</td>
                        <td className="py-1 px-2 border-r border-gray-200 font-mono text-[10px]">{e.voucherNo}</td>
                        <td className="py-1 px-2 border-r border-gray-200">{e.particulars}</td>
                        <td className="py-1 px-2 border-r border-gray-200 text-gray-500 text-[10px]">-</td>
                        <td className="py-1 px-2 border-r border-gray-200 text-right font-mono font-semibold">
                          {e.debit > 0 ? e.debit.toFixed(2) : ''}
                        </td>
                        <td className="py-1 px-2 text-right font-mono font-semibold text-green-700">
                          {e.credit > 0 ? e.credit.toFixed(2) : ''}
                        </td>
                      </tr>
                    ))}
                    {customerEntries.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-gray-400 italic">
                          No transaction records found for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Running Totals & Closing Balance (Frame 064 exact red bold footer) */}
              <div className="border-t-2 border-gray-800 pt-3 mt-4">
                <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-1">
                  <span>Current Balance :</span>
                  <div className="flex gap-8 font-mono">
                    <span className="text-blue-900">Debit: ₹ {totalDebit.toFixed(2)}</span>
                    <span className="text-green-800">Credit: ₹ {totalCredit.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm font-black border-t border-gray-300 pt-1.5">
                  <span className="text-gray-900">Closing Balance :</span>
                  <span className="text-red-600 font-mono text-base tracking-wide">
                    ₹ {closingBalance.toFixed(2)} {balanceType}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Window Footer */}
        <div className="bg-[#1e293b] text-gray-300 px-3 py-1 flex items-center justify-between text-[11px]">
          <span>Current Page No.: 1 | Total Page No.: 1</span>
          <span>Zoom Factor: {zoomFactor}</span>
        </div>
      </div>
    </div>
  );
};
