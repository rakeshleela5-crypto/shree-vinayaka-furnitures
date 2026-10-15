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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[1px]"
      onKeyDown={handleKeyDown}
    >
      {/* 1:1 Frame 034 Dark Modal Box */}
      <div className="relative w-[420px] bg-[#07152b] border border-[#23456c] rounded shadow-2xl p-6 text-white font-sans">
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
            className="px-8 py-1.5 bg-gradient-to-b from-[#1b3b6f] to-[#0d2243] hover:from-[#255096] hover:to-[#122e5a] border border-white text-white font-bold text-sm rounded shadow active:scale-95 transition-all"
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
