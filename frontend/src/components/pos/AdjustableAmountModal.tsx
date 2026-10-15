import React, { useState, useEffect, useRef } from 'react';

interface AdjustableAmountModalProps {
  isOpen: boolean;
  productName: string;
  rate: number;
  initialAmount?: number;
  onApply: (calculatedQty: number, targetAmount: number) => void;
  onClose: () => void;
}

export const AdjustableAmountModal: React.FC<AdjustableAmountModalProps> = ({
  isOpen,
  productName,
  rate,
  initialAmount,
  onApply,
  onClose
}) => {
  const [targetAmount, setTargetAmount] = useState<string>(
    initialAmount ? String(initialAmount) : rate ? String(rate) : '0'
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTargetAmount(initialAmount ? String(initialAmount) : rate ? String(rate) : '0');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, initialAmount, rate]);

  if (!isOpen) return null;

  const numAmount = parseFloat(targetAmount) || 0;
  const calculatedQty = rate > 0 ? parseFloat((numAmount / rate).toFixed(3)) : 0;

  const handleConfirm = () => {
    if (numAmount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }
    onApply(calculatedQty, numAmount);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
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
      onKeyDown={handleKeyDown}
    >
      {/* 1:1 Frame 034 Dark Modal Box */}
      <div
        className="rd-dialog"
        style={{
          position: 'relative',
          width: '420px',
          maxWidth: '96vw',
          backgroundColor: '#07152b',
          border: '1px solid #23456c',
          borderRadius: '4px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          padding: '24px',
          color: '#ffffff',
          fontFamily: 'sans-serif'
        }}
      >
        <div className="text-center font-bold text-sm text-cyan-300 mb-3 tracking-wide truncate">
          {productName ? `Item: ${productName} (@ ₹${rate.toFixed(2)})` : "Item's Adjustable Amount"}
        </div>

        <div className="flex items-center justify-between gap-4 my-4">
          <label className="text-[17px] font-bold text-white whitespace-nowrap">
            Item's Adjustable
            <br />
            Amount :
          </label>
          <input
            ref={inputRef}
            type="number"
            step="any"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            className="w-44 bg-white text-[#004aad] text-2xl font-black px-3 py-1.5 text-right rounded-sm border-2 border-[#1e40af] focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        {/* Live calculated weight preview */}
        <div className="bg-[#0b203e] border border-[#1b3d68] rounded px-3 py-1.5 mb-4 text-xs flex justify-between items-center text-gray-200">
          <span>Resulting Qty (Wt):</span>
          <span className="font-bold text-yellow-300 text-sm">
            {calculatedQty} {calculatedQty < 1 ? `(${Math.round(calculatedQty * 1000)} g)` : 'Unit/Kg'}
          </span>
        </div>

        <div className="flex justify-center mt-2">
          <button
            type="button"
            onClick={handleConfirm}
            style={{ background: 'linear-gradient(180deg, #1b3b6f 0%, #0d2243 100%)' }}
            className="px-8 py-1.5 hover:brightness-110 border border-white text-white font-bold text-sm rounded shadow active:scale-95 transition-all cursor-pointer"
          >
            OK
          </button>
        </div>

        <div className="text-center mt-4 text-[11px] text-gray-400 font-mono tracking-wider">
          ESC to CLOSE
        </div>
      </div>
    </div>
  );
};
