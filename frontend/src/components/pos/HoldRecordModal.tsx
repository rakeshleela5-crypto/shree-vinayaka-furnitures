import React, { useState } from 'react';
import type { HeldCart } from '../../types/retailDaddy';

interface HoldRecordModalProps {
  isOpen: boolean;
  heldCarts: HeldCart[];
  onRecallCart: (cart: HeldCart) => void;
  onDeleteCart: (cartId: string) => Promise<void> | void;
  onDeleteAllCarts: () => Promise<void> | void;
  onClose: () => void;
}

export const HoldRecordModal: React.FC<HoldRecordModalProps> = ({
  isOpen,
  heldCarts,
  onRecallCart,
  onDeleteCart,
  onDeleteAllCarts,
  onClose
}) => {
  const [selectedId, setSelectedId] = useState<string>(heldCarts[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const filteredCarts = heldCarts.filter(
    (c) =>
      c.holdNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.contactNo.includes(searchQuery)
  );

  const selectedCart = heldCarts.find((c) => c.id === selectedId) || filteredCarts[0];

  const handleDeleteSelected = async () => {
    if (!selectedCart || isDeleting) return;
    if (confirm(`Are you sure you want to delete hold record ${selectedCart.holdNo}?`)) {
      setIsDeleting(true);
      try {
        await onDeleteCart(selectedCart.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (heldCarts.length === 0 || isDeleting) return;
    if (confirm('Are you sure you want to delete all held cart records?')) {
      setIsDeleting(true);
      try {
        await onDeleteAllCarts();
      } finally {
        setIsDeleting(false);
      }
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
      {/* 1:1 Frame 197 Window Frame */}
      <div
        className="rd-dialog"
        style={{
          position: 'relative',
          width: isMaximized ? '100vw' : '920px',
          height: isMaximized ? '100vh' : 'auto',
          maxWidth: isMaximized ? '100vw' : '96vw',
          maxHeight: isMaximized ? '100vh' : '94vh',
          backgroundColor: '#f0f0f0',
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
        <div
          style={{ background: 'linear-gradient(90deg, #003366 0%, #004080 50%, #002244 100%)' }}
          className="text-white px-3 py-1 flex items-center justify-between text-xs font-bold"
        >
          <div className="flex items-center gap-2">
            <span className="text-yellow-300">📦</span>
            <span>Hold Record</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              title="Minimize"
              className="w-5 h-4 bg-gray-200 hover:bg-gray-300 text-black text-[10px] flex items-center justify-center rounded-xs"
            >
              _
            </button>
            <button
              type="button"
              onClick={() => setIsMaximized(prev => !prev)}
              title={isMaximized ? "Restore Window" : "Maximize Window"}
              className="w-5 h-4 bg-gray-200 hover:bg-gray-300 text-black text-[10px] flex items-center justify-center rounded-xs"
            >
              □
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-5 h-4 bg-red-600 hover:bg-red-700 text-white text-[10px] flex items-center justify-center rounded-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navy Header Banner */}
        <div className="bg-[#0b1a30] text-white py-2 text-center text-lg font-bold tracking-wider border-b border-[#23456c]">
          Hold Record
        </div>

        {/* Content Body: Table on Left + Action Toolbar on Right */}
        <div className="p-3 bg-[#e8ecef] flex gap-3">
          {/* Table Container */}
          <div className="flex-1 bg-white border border-[#005073] rounded-sm overflow-hidden flex flex-col h-[340px]">
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#005073] text-white font-bold sticky top-0 z-10">
                    <th className="py-2 px-2 w-10 text-center border-r border-[#003852]"></th>
                    <th className="py-2 px-3 border-r border-[#003852]">Hold No</th>
                    <th className="py-2 px-3 border-r border-[#003852]">Hold Date</th>
                    <th className="py-2 px-3 border-r border-[#003852]">Tax Type</th>
                    <th className="py-2 px-4 border-r border-[#003852]">Customer Name</th>
                    <th className="py-2 px-3">Contact No.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCarts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-600 font-medium italic">
                        No held carts currently parked.
                      </td>
                    </tr>
                  ) : (
                    filteredCarts.map((cart, idx) => {
                      const isSelected = (selectedCart?.id === cart.id);
                      return (
                        <tr
                          key={cart.id}
                          onClick={() => setSelectedId(cart.id)}
                          onDoubleClick={() => {
                            onRecallCart(cart);
                            onClose();
                          }}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#cfe2ff] font-semibold text-blue-900'
                              : idx % 2 === 0
                              ? 'bg-white hover:bg-yellow-50'
                              : 'bg-[#f8f9fa] hover:bg-yellow-50'
                          }`}
                        >
                          <td className="py-2 px-2 text-center text-blue-800 font-bold border-r border-gray-200">
                            {isSelected ? '▷' : idx + 1}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-900 border-r border-gray-200">
                            {cart.holdNo}
                          </td>
                          <td className="py-2 px-3 text-slate-800 font-medium border-r border-gray-200">
                            {cart.holdDate}
                          </td>
                          <td className="py-2 px-3 text-slate-800 font-medium border-r border-gray-200">
                            {cart.taxType}
                          </td>
                          <td className="py-2 px-4 text-gray-900 border-r border-gray-200">
                            <span className={isSelected ? 'bg-red-50 px-1 py-0.5 border border-red-300 rounded' : ''}>
                              {cart.customerName}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-gray-700 font-mono">
                            {cart.contactNo}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Scroll indicator strip */}
            <div className="bg-[#dcdcdc] border-t border-gray-300 h-4 flex items-center justify-between px-2 text-[10px] text-gray-600">
              <span>◄</span>
              <div className="h-2.5 w-48 bg-gray-400 rounded-sm"></div>
              <span>►</span>
            </div>
          </div>

          {/* Right Action Buttons Toolbar (1:1 Frame 197) */}
          <div className="w-28 flex flex-col gap-2 shrink-0">
            {/* Delete All */}
            <button
              type="button"
              onClick={handleDeleteAll}
              disabled={isDeleting || heldCarts.length === 0}
              style={{ background: 'linear-gradient(180deg, #1b3b6f 0%, #0a1c38 100%)' }}
              className="w-28 py-2 hover:brightness-110 disabled:opacity-50 text-white border border-[#2e5b9e] rounded text-xs font-bold flex flex-col items-center justify-center shadow active:scale-95 cursor-pointer"
            >
              <span className="text-base">🗑️</span>
              <span>{isDeleting ? 'Deleting...' : 'Delete All'}</span>
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={isDeleting || !selectedCart}
              style={{ background: 'linear-gradient(180deg, #b91c1c 0%, #7f1d1d 100%)' }}
              className="w-28 py-2 hover:brightness-110 disabled:opacity-50 text-white border border-red-400 rounded text-xs font-bold flex flex-col items-center justify-center shadow active:scale-95 cursor-pointer"
            >
              <span className="text-base text-red-200">❌</span>
              <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedId(heldCarts[0]?.id || '');
              }}
              style={{ background: 'linear-gradient(180deg, #15803d 0%, #14532d 100%)' }}
              className="w-28 py-2 hover:brightness-110 text-white border border-green-400 rounded text-xs font-bold flex flex-col items-center justify-center shadow active:scale-95 cursor-pointer"
            >
              <span className="text-base text-green-200">🔄</span>
              <span>Reset</span>
            </button>

            {/* All Filter & Search */}
            <div className="mt-2 bg-[#d1d5db] p-1.5 rounded border border-gray-300 flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-full py-1 bg-[#1e40af] text-white text-[11px] font-bold rounded shadow-xs"
              >
                All
              </button>
              <label className="text-[10px] text-gray-700 font-bold mt-1">
                Search No.
              </label>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-400 px-1.5 py-0.5 text-xs rounded text-slate-900 font-medium focus:outline-none focus:border-blue-600"
                style={{ color: '#0f172a' }}
              />
            </div>
          </div>
        </div>

        {/* Footer with Red Prompt Note (1:1 Frame 197) */}
        <div className="bg-[#f0f0f0] px-3 py-1.5 border-t border-gray-300 flex items-center justify-between">
          <div className="text-[11px] font-bold text-rose-700 tracking-wide">
            ( PS :- Double click on rows to retrieve data. )
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-900 text-xs font-bold rounded border border-slate-400 shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
