import React, { useState } from 'react';
import type { Customer, CustomerLedgerEntry } from '../../types/retailDaddy';
import { exportToExcel, exportToJson, exportToCsv } from '../../utils/csvImporter';

interface OutstandingBalanceReportModalProps {
  isOpen: boolean;
  customers: Customer[];
  ledgerEntries: CustomerLedgerEntry[];
  onClose: () => void;
}

export const OutstandingBalanceReportModal: React.FC<OutstandingBalanceReportModalProps> = ({
  isOpen,
  customers,
  ledgerEntries,
  onClose
}) => {
  const [fromDate, setFromDate] = useState('01/04/2024');
  const [toDate, setToDate] = useState('22/02/2025');
  const [viewingReport, setViewingReport] = useState<string | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Compute receivables from ledger per customer
  const customerBalances = customers
    .map((cust) => {
      const entries = ledgerEntries.filter((l) => l.customerId === cust.id);
      const totalDebit = entries.reduce((acc, l) => acc + l.debit, 0) || (cust.balance > 0 ? cust.balance : 0);
      const totalCredit = entries.reduce((acc, l) => acc + l.credit, 0);
      const balance = totalDebit - totalCredit;
      return {
        id: cust.id,
        name: cust.name,
        totalCredit,
        totalDebit,
        balance
      };
    })
    .filter((c) => (viewingReport === 'CUST_RECEIVABLE' ? c.balance > 0 : true));

  const filteredBalances = customerBalances.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.id.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
  });

  const totalOutstanding = filteredBalances.reduce((sum, c) => sum + Math.max(0, c.balance), 0);

  const handleExportExcel = () => {
    const headers = ['Customer ID', 'Customer Name', 'Total Credit (₹)', 'Total Debit (₹)', 'Outstanding Balance (₹)'];
    const rows = filteredBalances.map(c => [
      c.id,
      c.name,
      c.totalCredit,
      c.totalDebit,
      c.balance
    ]);
    exportToExcel(`Receivable_Report_${fromDate.replace(/\//g, '-')}_to_${toDate.replace(/\//g, '-')}.xlsx`, headers, rows, 'Receivables');
  };

  const handleExportJson = () => {
    exportToJson(`Receivable_Report_${fromDate.replace(/\//g, '-')}_to_${toDate.replace(/\//g, '-')}.json`, filteredBalances);
  };

  const handleExportCsv = () => {
    const headers = ['Customer ID', 'Customer Name', 'Total Credit (₹)', 'Total Debit (₹)', 'Outstanding Balance (₹)'];
    const rows = filteredBalances.map(c => [
      c.id,
      c.name,
      c.totalCredit,
      c.totalDebit,
      c.balance
    ]);
    exportToCsv(`Receivable_Report_${fromDate.replace(/\//g, '-')}_to_${toDate.replace(/\//g, '-')}.csv`, headers, rows);
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
      {/* 1:1 Frame 362 / 364 Window Frame */}
      <div
        className="rd-dialog"
        style={{
          position: 'relative',
          width: isMaximized ? '100vw' : '780px',
          height: isMaximized ? '100vh' : 'auto',
          maxWidth: isMaximized ? '100vw' : '96vw',
          maxHeight: isMaximized ? '100vh' : '94vh',
          backgroundColor: '#ffffff',
          border: isMaximized ? 'none' : '2px solid #1e40af',
          borderRadius: isMaximized ? '0' : '4px',
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
          <span className="text-sm">Outstanding Balance Report</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              title="Minimize"
              className="w-4 h-4 bg-gray-200 hover:bg-gray-300 text-black text-[9px] flex items-center justify-center rounded-xs"
            >
              _
            </button>
            <button
              type="button"
              onClick={() => setIsMaximized(prev => !prev)}
              title={isMaximized ? "Restore Window" : "Maximize Window"}
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

        {/* Top Filter Dialog (1:1 Frame 362) */}
        {!viewingReport ? (
          <div className="p-6 bg-[#f8fafc]">
            {/* Blue Banner */}
            <div className="bg-[#1d4ed8] text-white py-2 text-center text-sm font-bold tracking-wide rounded-t">
              Outstanding Balance Report
            </div>

            <div className="border border-t-0 border-gray-300 p-6 bg-white shadow-sm flex flex-col gap-6">
              {/* Date Filter Range */}
              <div className="flex justify-center items-center gap-8">
                <div className="flex items-center gap-2">
                  <label className="font-semibold text-gray-700">From :</label>
                  <input
                    type="text"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-28 bg-white border border-gray-400 px-2 py-0.5 rounded text-center"
                  />
                  <span>📅</span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="font-semibold text-gray-700">To :</label>
                  <input
                    type="text"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-28 bg-white border border-gray-400 px-2 py-0.5 rounded text-center"
                  />
                  <span>📅</span>
                </div>
              </div>

              {/* 3 Report Action Boxes (1:1 Frame 362) */}
              <div className="flex items-center justify-between gap-4 mt-2">
                {/* Customer Outstanding Report */}
                <fieldset className="border border-red-300 p-3 rounded flex-1">
                  <legend className="text-[11px] font-bold text-red-600 px-1">
                    Customer Outstanding Report
                  </legend>
                  <div className="flex gap-2 justify-center mt-1">
                    <button
                      type="button"
                      onClick={() => setViewingReport('CUST_RECEIVABLE')}
                      style={{ background: 'linear-gradient(180deg, #1b3b6f 0%, #0a1c38 100%)' }}
                      className="px-5 py-2 hover:brightness-110 text-white font-bold rounded shadow-xs active:scale-95 cursor-pointer"
                    >
                      Receivable
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewingReport('CUST_PAYABLE')}
                      style={{ background: 'linear-gradient(180deg, #1b3b6f 0%, #0a1c38 100%)' }}
                      className="px-5 py-2 hover:brightness-110 text-white font-bold rounded shadow-xs active:scale-95 cursor-pointer"
                    >
                      Payable
                    </button>
                  </div>
                </fieldset>

                {/* Reset Button (Red) */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setFromDate('01/04/2024');
                      setToDate('22/02/2025');
                    }}
                    className="px-6 py-2 bg-[#dc2626] hover:bg-red-700 text-white font-bold rounded shadow active:scale-95 text-xs cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                {/* Supplier Outstanding Report */}
                <fieldset className="border border-red-300 p-3 rounded flex-1">
                  <legend className="text-[11px] font-bold text-red-600 px-1">
                    Supplier Outstanding Report
                  </legend>
                  <div className="flex gap-2 justify-center mt-1">
                    <button
                      type="button"
                      onClick={() => setViewingReport('SUPP_PAYABLE')}
                      style={{ background: 'linear-gradient(180deg, #1b3b6f 0%, #0a1c38 100%)' }}
                      className="px-5 py-2 hover:brightness-110 text-white font-bold rounded shadow-xs active:scale-95 cursor-pointer"
                    >
                      Payable
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewingReport('SUPP_RECEIVABLE')}
                      style={{ background: 'linear-gradient(180deg, #1b3b6f 0%, #0a1c38 100%)' }}
                      className="px-5 py-2 hover:brightness-110 text-white font-bold rounded shadow-xs active:scale-95 cursor-pointer"
                    >
                      Receivable
                    </button>
                  </div>
                </fieldset>
              </div>
            </div>
          </div>
        ) : (
          /* Report View (1:1 Frame 364) */
          <div className="p-6 bg-white min-h-[420px] flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="text-center font-serif text-lg font-bold text-red-900 tracking-wide border-b border-gray-300 pb-2">
                Receivable From Customers
              </div>
              <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-gray-700 my-2">
                <div className="font-mono">From: {fromDate} To: {toDate}</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="🔍 Search Customer ID or Name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="px-2 py-0.5 border border-gray-400 rounded text-xs w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="px-2 py-0.5 bg-green-700 hover:bg-green-800 text-white font-bold rounded text-xs cursor-pointer"
                    title="Export to Excel (.xlsx)"
                  >
                    📊 .XLSX
                  </button>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="px-2 py-0.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded text-xs cursor-pointer"
                    title="Export to JSON (.json)"
                  >
                    📄 .JSON
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="px-2 py-0.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded text-xs cursor-pointer"
                    title="Export to CSV (.csv)"
                  >
                    📋 .CSV
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="mt-4 border-t-2 border-b-2 border-black max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-400 font-bold text-black sticky top-0 bg-white">
                      <th className="py-1 px-2">Customer ID</th>
                      <th className="py-1 px-2">Customer Name</th>
                      <th className="py-1 px-3 text-right">Total Credit</th>
                      <th className="py-1 px-3 text-right">Total Debit</th>
                      <th className="py-1 px-4 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredBalances.map((cust) => (
                      <tr key={cust.id} className="hover:bg-gray-50">
                        <td className="py-1 px-2 font-mono">{cust.id}</td>
                        <td className="py-1 px-2 font-medium">{cust.name}</td>
                        <td className="py-1 px-3 text-right font-mono">
                          {cust.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-1 px-3 text-right font-mono">
                          {cust.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-1 px-4 text-right font-mono font-bold text-black">
                          {cust.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Balance Summary Box (1:1 Frame 364) */}
              <div className="flex justify-end mt-4">
                <div className="w-48 text-right border-t-2 border-b-4 border-double border-black py-1 px-2">
                  <span className="font-mono font-black text-sm text-black">
                    {totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="flex justify-between items-center mt-6 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setViewingReport(null)}
                className="px-4 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded border border-gray-400 text-xs"
              >
                ◄ Back to Parameters
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-1 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded text-xs"
              >
                Print Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
