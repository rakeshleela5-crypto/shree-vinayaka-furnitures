import React, { useState } from 'react';
import type { ProductRecordItem } from '../../types/retailDaddy';

interface ProductBulkEditorModalProps {
  isOpen: boolean;
  products: ProductRecordItem[];
  onSaveBulkProducts: (updatedList: ProductRecordItem[]) => void;
  onClose: () => void;
}

export const ProductBulkEditorModal: React.FC<ProductBulkEditorModalProps> = ({
  isOpen,
  products,
  onSaveBulkProducts,
  onClose
}) => {
  const [editedProducts, setEditedProducts] = useState<ProductRecordItem[]>(products);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(products.map(p => p.id)));
  const [searchName, setSearchName] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === editedProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(editedProducts.map(p => p.id)));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleFieldChange = (id: string, field: keyof ProductRecordItem, value: any) => {
    setEditedProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSave = () => {
    onSaveBulkProducts(editedProducts);
    showToast(`✓ Bulk saved ${selectedIds.size} products! Part No, Godown & Rack updated.`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const filteredProducts = editedProducts.filter(p => {
    const matchName = searchName ? p.name.toLowerCase().includes(searchName.toLowerCase()) : true;
    const matchBarcode = searchBarcode ? p.barcode.includes(searchBarcode) : true;
    return matchName && matchBarcode;
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
      {/* Window Frame (Video 07 Frame 0540: Product Bulk Editor) */}
      <div
        style={{
          width: '98%',
          maxWidth: '1300px',
          height: '94vh',
          maxHeight: '740px',
          backgroundColor: '#00b4d8', // Cyan/sky blue border theme matching Frame 0540
          border: '3px solid #0096c7',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          overflow: 'hidden'
        }}
      >
        {/* Title Bar Banner */}
        <div
          style={{
            background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #0096c7',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>⚡</span>
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Product Bulk Editor [Video 07 Frame 0540]</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#e11d48',
              border: '1px solid #ffffff',
              color: '#ffffff',
              width: '24px',
              height: '20px',
              fontWeight: 'bold',
              fontSize: '11px',
              cursor: 'pointer',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Top Control Bar (Frame 0540: Top 50, Select All, Search inputs, Ribbon buttons) */}
        <div
          style={{
            background: '#ffffff',
            padding: '6px 12px',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}
        >
          {/* Left Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Top 50 Badge */}
            <span style={{ backgroundColor: '#dc2626', color: '#ffffff', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold', borderRadius: '3px' }}>
              Top 50 Records
            </span>

            {/* Select All Button (Frame 0540: Red button) */}
            <button
              type="button"
              onClick={handleToggleSelectAll}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '3px',
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {selectedIds.size === editedProducts.length ? 'Deselect All' : 'Select All'}
            </button>

            {/* Search by Product Name */}
            <input
              type="text"
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              placeholder="Search By Product Name..."
              style={{ width: '170px', height: '24px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '0 6px', fontSize: '11px' }}
            />

            {/* Search by Barcode */}
            <input
              type="text"
              value={searchBarcode}
              onChange={e => setSearchBarcode(e.target.value)}
              placeholder="Search By Barcode..."
              style={{ width: '130px', height: '24px', border: '1px solid #94a3b8', borderRadius: '2px', padding: '0 6px', fontSize: '11px' }}
            />
          </div>

          {/* Right Ribbon Buttons (Frame 0540: Change Barcode, Set Default, Save, Reset) */}
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              type="button"
              onClick={() => showToast('🏷️ Barcode generation tool active.')}
              style={{ padding: '3px 10px', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '2px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Change Barcode
            </button>
            <button
              type="button"
              onClick={() => showToast('⚙️ Product settings loaded.')}
              style={{ padding: '3px 10px', backgroundColor: '#f97316', color: '#ffffff', border: 'none', borderRadius: '2px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Product Setting
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{ padding: '3px 16px', backgroundColor: '#16a34a', color: '#ffffff', border: '1px solid #15803d', borderRadius: '2px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
            >
              Save (F10)
            </button>
            <button
              type="button"
              onClick={() => setEditedProducts(products)}
              style={{ padding: '3px 10px', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '2px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Main Bulk Editable Table Grid (Frame 0540: Yellow rows `#fef08a`) */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#ffffff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: '#0284c7', color: '#ffffff', textAlign: 'left', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '5px 6px', width: '30px', textAlign: 'center', borderRight: '1px solid #38bdf8' }}>✓</th>
                <th style={{ padding: '5px 6px', width: '40px', borderRight: '1px solid #38bdf8' }}>ID</th>
                <th style={{ padding: '5px 6px', width: '75px', borderRight: '1px solid #38bdf8' }}>Product Code</th>
                <th style={{ padding: '5px 6px', width: '70px', borderRight: '1px solid #38bdf8' }}>Barcode</th>
                <th style={{ padding: '5px 6px', minWidth: '170px', borderRight: '1px solid #38bdf8' }}>Product Name</th>
                <th style={{ padding: '5px 6px', width: '60px', borderRight: '1px solid #38bdf8' }}>HSNC</th>
                <th style={{ padding: '5px 6px', width: '90px', borderRight: '1px solid #38bdf8', backgroundColor: '#1e40af' }}>Part / Group</th>
                <th style={{ padding: '5px 6px', width: '80px', borderRight: '1px solid #38bdf8', backgroundColor: '#15803d' }}>Godown</th>
                <th style={{ padding: '5px 6px', width: '80px', borderRight: '1px solid #38bdf8', backgroundColor: '#c2410c' }}>Rack</th>
                <th style={{ padding: '5px 6px', width: '65px', textAlign: 'right', borderRight: '1px solid #38bdf8' }}>MRP</th>
                <th style={{ padding: '5px 6px', width: '70px', borderRight: '1px solid #38bdf8' }}>Colour</th>
                <th style={{ padding: '5px 6px', width: '70px', textAlign: 'right', borderRight: '1px solid #38bdf8' }}>Salesman%</th>
                <th style={{ padding: '5px 6px', width: '80px', textAlign: 'right' }}>Loyalty Pts</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p, idx) => {
                const isChecked = selectedIds.has(p.id);
                return (
                  <tr
                    key={p.id}
                    style={{
                      backgroundColor: isChecked ? '#fef9c3' : '#ffffff', // Yellow background matching Frame 0540
                      borderBottom: '1px solid #e2e8f0',
                      color: '#0f172a'
                    }}
                  >
                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelectRow(p.id)}
                      />
                    </td>
                    <td style={{ padding: '4px 6px', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ padding: '4px 6px', fontWeight: 'bold', color: '#1e40af' }}>{p.code}</td>
                    <td style={{ padding: '4px 6px', color: '#475569' }}>{p.barcode}</td>
                    <td style={{ padding: '4px 6px', fontWeight: 'bold' }}>{p.name}</td>
                    <td style={{ padding: '4px 6px', color: '#64748b' }}>{p.hsnCode}</td>

                    {/* Editable Part/Group Input (Video 07 Frames 0325, 0540) */}
                    <td style={{ padding: '2px 4px', backgroundColor: '#eff6ff' }}>
                      <input
                        type="text"
                        value={p.partNo}
                        onChange={e => handleFieldChange(p.id, 'partNo', e.target.value)}
                        placeholder="1234, 555"
                        style={{
                          width: '100%',
                          height: '22px',
                          border: '1px solid #93c5fd',
                          borderRadius: '2px',
                          padding: '0 4px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: '#1e40af',
                          backgroundColor: '#ffffff'
                        }}
                      />
                    </td>

                    {/* Editable Godown Input (Video 07 Frames 0540: A1, B1, C) */}
                    <td style={{ padding: '2px 4px', backgroundColor: '#f0fdf4' }}>
                      <input
                        type="text"
                        value={p.godown}
                        onChange={e => handleFieldChange(p.id, 'godown', e.target.value)}
                        placeholder="A1, B1, C"
                        style={{
                          width: '100%',
                          height: '22px',
                          border: '1px solid #86efac',
                          borderRadius: '2px',
                          padding: '0 4px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: '#15803d',
                          backgroundColor: '#ffffff'
                        }}
                      />
                    </td>

                    {/* Editable Rack Input (Video 07 Frames 0540: B, C, A1) */}
                    <td style={{ padding: '2px 4px', backgroundColor: '#fff7ed' }}>
                      <input
                        type="text"
                        value={p.rack}
                        onChange={e => handleFieldChange(p.id, 'rack', e.target.value)}
                        placeholder="B, C, A1"
                        style={{
                          width: '100%',
                          height: '22px',
                          border: '1px solid #fdba74',
                          borderRadius: '2px',
                          padding: '0 4px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: '#c2410c',
                          backgroundColor: '#ffffff'
                        }}
                      />
                    </td>

                    <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold' }}>₹{p.mrp.toFixed(2)}</td>
                    <td style={{ padding: '4px 6px', color: '#64748b' }}>{p.colour || '-'}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right' }}>{(p.salesmanPercent || 0).toFixed(2)}%</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold', color: '#16a34a' }}>
                      {(p.loyaltyPoints || 0).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Bar */}
        <div
          style={{
            background: '#e2e8f0',
            borderTop: '1px solid #cbd5e1',
            padding: '4px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#475569'
          }}
        >
          <div>
            Selected: <strong>{selectedIds.size}</strong> of {filteredProducts.length} items to update
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleSave}
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: '1px solid #15803d',
                borderRadius: '2px',
                padding: '2px 14px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #94a3b8',
                borderRadius: '2px',
                padding: '2px 10px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10001
          }}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
};
