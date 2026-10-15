import React, { useState, useEffect } from 'react';
import type { ProductBatch } from '../../types/retailDaddy';

interface ProductParameterModalProps {
  isOpen: boolean;
  productName: string;
  productBarcode: string;
  batches: ProductBatch[];
  onSelectBatch: (batch: ProductBatch) => void;
  onClose: () => void;
}

export const ProductParameterModal: React.FC<ProductParameterModalProps> = ({
  isOpen,
  productName,
  productBarcode,
  batches,
  onSelectBatch,
  onClose
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');
  const [topRecords, setTopRecords] = useState(5);

  useEffect(() => {
    setSelectedIndex(0);
    setSearchFilter('');
  }, [isOpen, productName]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredBatches.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredBatches[selectedIndex]) {
          onSelectBatch(filteredBatches[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, batches, searchFilter]);

  if (!isOpen) return null;

  const filteredBatches = batches.filter(
    (b) =>
      b.barcode.includes(searchFilter) ||
      String(b.mrp).includes(searchFilter) ||
      String(b.retailSaleRate).includes(searchFilter) ||
      (b.info && b.info.toLowerCase().includes(searchFilter.toLowerCase()))
  ).slice(0, topRecords);

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
      {/* 1:1 Video 18 Frame 096 & 234 Window Frame */}
      <div
        className="rd-dialog"
        style={{
          position: 'relative',
          width: '780px',
          maxWidth: '96vw',
          maxHeight: '94vh',
          backgroundColor: '#ffffff',
          border: '2px solid #16a34a',
          borderRadius: '4px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontSize: '12px',
          userSelect: 'none'
        }}
      >
        {/* Top Header Bar: Light Green (Frame 096/234) */}
        <div className="bg-[#22c55e] text-black px-3 py-1.5 flex items-center justify-between font-black text-sm tracking-wide">
          <div className="flex items-center gap-2">
            <span>📦</span>
            <span>Product Parameter</span>
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

        {/* Red Product Name Strip (Frame 096/234) */}
        <div className="bg-[#dc2626] text-white px-3 py-1 flex items-center justify-between font-bold text-xs">
          <span>Product Name :</span>
          <span className="font-mono text-sm tracking-wider">{productBarcode || productName}</span>
          <span className="text-[11px] font-normal opacity-90">{productName}</span>
        </div>

        {/* Table Body (Deep Blue Header 1:1 Frame 234) */}
        <div className="max-h-[300px] overflow-x-auto overflow-y-auto bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#002244] text-white font-bold sticky top-0 border-b border-[#001122]">
              <tr>
                <th className="py-1 px-2 border-r border-[#003366] w-8 text-center"></th>
                <th className="py-1 px-3 border-r border-[#003366] text-right">MRP</th>
                <th className="py-1 px-3 border-r border-[#003366] text-right">Retail Sale Rate</th>
                <th className="py-1 px-3 border-r border-[#003366] text-right">Wholesale Sale Rate</th>
                <th className="py-1 px-3 border-r border-[#003366] text-right">Purchase Rate</th>
                <th className="py-1 px-3 border-r border-[#003366] text-right">Purchase Rate + GST</th>
                <th className="py-1 px-3 border-r border-[#003366]">Barcode</th>
                <th className="py-1 px-2 border-r border-[#003366]">Colour</th>
                <th className="py-1 px-2 border-r border-[#003366]">Size</th>
                <th className="py-1 px-3">Info</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((batch, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <tr
                    key={batch.id || idx}
                    onClick={() => {
                      setSelectedIndex(idx);
                      onSelectBatch(batch);
                    }}
                    onDoubleClick={() => onSelectBatch(batch)}
                    className={`cursor-pointer transition-colors border-b border-gray-200 ${
                      isSelected
                        ? 'bg-[#1e40af] text-white font-bold'
                        : idx % 2 === 0
                        ? 'bg-white hover:bg-blue-50 text-gray-900'
                        : 'bg-[#f8fafc] hover:bg-blue-50 text-gray-900'
                    }`}
                  >
                    <td className="py-1.5 px-2 text-center border-r border-gray-200 font-mono text-[11px]">
                      {isSelected ? '▶' : `${idx + 1}`}
                    </td>
                    <td className="py-1.5 px-3 text-right border-r border-gray-200 font-mono font-bold">
                      {batch.mrp.toFixed(2)}
                    </td>
                    <td className="py-1.5 px-3 text-right border-r border-gray-200 font-mono font-bold text-green-700">
                      <span className={isSelected ? 'text-green-300' : 'text-green-700'}>
                        {batch.retailSaleRate.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-right border-r border-gray-200 font-mono">
                      {batch.wholesaleSaleRate.toFixed(2)}
                    </td>
                    <td className="py-1.5 px-3 text-right border-r border-gray-200 font-mono">
                      {batch.purchaseRate.toFixed(2)}
                    </td>
                    <td className="py-1.5 px-3 text-right border-r border-gray-200 font-mono text-gray-600">
                      <span className={isSelected ? 'text-gray-200' : 'text-gray-600'}>
                        {batch.purchaseRateGst.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 border-r border-gray-200 font-mono">
                      {batch.barcode}
                    </td>
                    <td className="py-1.5 px-2 border-r border-gray-200 text-center">
                      {batch.colour || '-'}
                    </td>
                    <td className="py-1.5 px-2 border-r border-gray-200 text-center">
                      {batch.size || '-'}
                    </td>
                    <td className="py-1.5 px-3 text-gray-600 text-[11px]">
                      <span className={isSelected ? 'text-gray-200' : 'text-gray-600'}>
                        {batch.info || `Stock: ${batch.availableQty}`}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredBatches.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-gray-400 italic">
                    No matching stock parameters or batches found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Red Bar (Frame 234) */}
        <div className="bg-[#dc2626] text-white px-3 py-1.5 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span>( Top</span>
            <input
              type="number"
              min="1"
              max="50"
              value={topRecords}
              onChange={(e) => setTopRecords(parseInt(e.target.value) || 5)}
              className="w-10 bg-white text-black px-1 py-0.5 rounded text-center text-xs font-bold"
            />
            <span>Records )</span>
            <button
              type="button"
              onClick={() => setSearchFilter('')}
              title="Refresh / Reset"
              className="ml-2 w-5 h-5 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-full flex items-center justify-center font-bold text-xs"
            >
              🔄
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px]">Search :</span>
            <select className="bg-white text-black text-[11px] px-1 py-0.5 rounded">
              <option>All Fields</option>
              <option>Barcode</option>
              <option>MRP</option>
              <option>Sale Rate</option>
            </select>
            <input
              type="text"
              placeholder="Filter batches..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-white text-black px-2 py-0.5 rounded text-xs w-32 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (filteredBatches[selectedIndex]) {
                  onSelectBatch(filteredBatches[selectedIndex]);
                }
              }}
              className="bg-white text-[#dc2626] hover:bg-gray-100 px-3 py-0.5 rounded font-black text-xs shadow-xs"
            >
              Select (Enter)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
