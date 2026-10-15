import React, { useState } from 'react';
import type { CartItem } from '../../types/retailDaddy';

export interface OldBillRecord {
  id: string;
  invoiceNo: string;
  date: string;
  customerName: string;
  contactNo: string;
  totalQty: number;
  netPay: number;
  items: CartItem[];
  paymentMode?: string;
}

interface OldBillManagerModalProps {
  isOpen: boolean;
  bills: OldBillRecord[];
  onSelectBill: (bill: OldBillRecord) => void;
  onDeleteBill: (billId: string) => void;
  onClose: () => void;
}

export const OldBillManagerModal: React.FC<OldBillManagerModalProps> = ({
  isOpen,
  bills,
  onSelectBill,
  onDeleteBill,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(bills[0]?.id || '');

  if (!isOpen) return null;

  const filteredBills = bills.filter(
    (b) =>
      b.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.contactNo.includes(searchQuery)
  );

  const selectedBill = bills.find((b) => b.id === selectedId) || filteredBills[0];

  const handleConfirmSelect = () => {
    if (!selectedBill) return;
    onSelectBill(selectedBill);
    onClose();
  };

  const handleDelete = () => {
    if (!selectedBill) return;
    if (confirm(`Are you sure you want to permanently delete Invoice ${selectedBill.invoiceNo}?`)) {
      onDeleteBill(selectedBill.id);
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
        backdropFilter: 'blur(1px)'
      }}
    >
      {/* 1:1 Windows Frame Modal */}
      <div
        className="rd-dialog"
        style={{
          position: 'relative',
          width: '850px',
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
        <div className="bg-[#003366] text-white px-3 py-1 flex items-center justify-between font-bold">
          <div className="flex items-center gap-2">
            <span>📑</span>
            <span>Old Bill Search & Edit Manager [F5]</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-4 h-4 bg-red-600 hover:bg-red-700 text-white text-[9px] flex items-center justify-center rounded-xs"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3 bg-[#f8fafc]">
          {/* Top Search Toolbar */}
          <div className="flex items-center justify-between mb-3 bg-[#e2e8f0] p-2 rounded border border-gray-300">
            <div className="flex items-center gap-2">
              <label className="font-bold text-gray-700">Search Bill / Customer / Phone :</label>
              <input
                type="text"
                placeholder="e.g. SINV-0019, 1234567890..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 bg-white border border-gray-400 px-2 py-1 rounded text-xs text-gray-900 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="text-gray-500 font-semibold text-[11px]">
              Found: {filteredBills.length} Invoices
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-[#004080] rounded overflow-hidden h-[280px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#004080] text-white font-bold sticky top-0">
                <tr>
                  <th className="py-1 px-2 border-r border-[#002b55] w-8 text-center">#</th>
                  <th className="py-1 px-3 border-r border-[#002b55]">Invoice No</th>
                  <th className="py-1 px-3 border-r border-[#002b55]">Date</th>
                  <th className="py-1 px-3 border-r border-[#002b55]">Customer</th>
                  <th className="py-1 px-3 border-r border-[#002b55]">Contact No</th>
                  <th className="py-1 px-3 border-r border-[#002b55] text-center">Items</th>
                  <th className="py-1 px-3 text-right">Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 italic">
                      No invoices found matching search.
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((b, idx) => {
                    const isSelected = selectedBill?.id === b.id;
                    return (
                      <tr
                        key={b.id}
                        onClick={() => setSelectedId(b.id)}
                        onDoubleClick={handleConfirmSelect}
                        className={`cursor-pointer ${
                          isSelected
                            ? 'bg-blue-100 font-bold text-blue-900'
                            : idx % 2 === 0
                            ? 'bg-white hover:bg-yellow-50'
                            : 'bg-gray-50 hover:bg-yellow-50'
                        }`}
                      >
                        <td className="py-1.5 px-2 text-center border-r border-gray-200 text-blue-800">
                          {isSelected ? '▷' : idx + 1}
                        </td>
                        <td className="py-1.5 px-3 font-mono font-bold text-blue-900 border-r border-gray-200">
                          {b.invoiceNo}
                        </td>
                        <td className="py-1.5 px-3 text-gray-700 border-r border-gray-200">
                          {b.date}
                        </td>
                        <td className="py-1.5 px-3 text-gray-900 border-r border-gray-200">
                          {b.customerName}
                        </td>
                        <td className="py-1.5 px-3 text-gray-700 font-mono border-r border-gray-200">
                          {b.contactNo}
                        </td>
                        <td className="py-1.5 px-3 text-center text-gray-800 border-r border-gray-200">
                          {b.items.length} ({b.totalQty} qty)
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-bold text-green-700">
                          ₹{b.netPay.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-2 text-[11px] text-red-600 font-bold">
            ( Double click on an invoice to load into POS for Editing or Reprinting )
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="bg-[#e2e8f0] px-4 py-2 border-t border-gray-300 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!selectedBill}
              className="px-4 py-1.5 bg-[#b91c1c] hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded text-xs shadow-xs"
            >
              Delete Selected
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded text-xs border border-gray-400"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleConfirmSelect}
              disabled={!selectedBill}
              className="px-6 py-1.5 bg-[#1d4ed8] hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded text-xs shadow active:scale-95"
            >
              Load Bill to POS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
