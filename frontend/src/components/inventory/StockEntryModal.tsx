import React, { useState, useEffect } from 'react';
import type { Product, StockEntryItem } from '../../types/retailDaddy';

interface StockEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSaveStockEntry: (voucher: { stockId: string; date: string; remarks: string; items: StockEntryItem[] }) => void;
  onOpenStockEntryRecords?: () => void;
  initialStockId?: string;
  existingItems?: StockEntryItem[];
}

export const StockEntryModal: React.FC<StockEntryModalProps> = ({
  isOpen,
  onClose,
  products,
  onSaveStockEntry,
  onOpenStockEntryRecords,
  initialStockId,
  existingItems
}) => {
  const [stockId, setStockId] = useState<string>('0003');
  const [entryDate, setEntryDate] = useState<string>('2025-03-04');
  const [remarks, setRemarks] = useState<string>('');

  // Product Info inputs
  const [selectedBarcode, setSelectedBarcode] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1.000');
  const [unit, setUnit] = useState<string>('Pcs');

  // Table items
  const [items, setItems] = useState<StockEntryItem[]>([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialStockId) {
        setStockId(initialStockId);
      } else {
        const nextId = Math.floor(1000 + Math.random() * 9000).toString();
        setStockId(nextId);
      }
      if (existingItems && existingItems.length > 0) {
        setItems(existingItems);
        setRemarks(existingItems[0]?.remarks || '');
      } else {
        setItems([]);
        setRemarks('');
      }
      setSelectedBarcode('');
      setProductName('');
      setSelectedProductId('');
      setQuantity('1.000');
      setSelectedRowIndex(null);
    }
  }, [isOpen, initialStockId, existingItems]);

  if (!isOpen) return null;

  // Handle Barcode Selection or Typing
  const handleBarcodeChange = (val: string) => {
    setSelectedBarcode(val);
    const matched = products.find(
      p => p.barcode === val || p.pCode.toLowerCase() === val.toLowerCase() || p.id === val
    );
    if (matched) {
      setSelectedProductId(matched.id);
      setProductName(matched.name);
      setUnit(matched.salesUnit || 'Pcs');
    }
  };

  const handleProductSelect = (p: Product) => {
    setSelectedBarcode(p.barcode);
    setSelectedProductId(p.id);
    setProductName(p.name);
    setUnit(p.salesUnit || 'Pcs');
  };

  const handleAddItem = () => {
    const qtyNum = parseFloat(quantity);
    if (!productName || isNaN(qtyNum) || qtyNum <= 0) {
      alert('Please select a valid product and enter a positive quantity.');
      return;
    }

    const newItem: StockEntryItem = {
      id: `ste-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      stockId,
      date: entryDate,
      productId: selectedProductId || '1',
      productCode: products.find(p => p.id === selectedProductId)?.pCode || 'P-0001',
      productName,
      barcode: selectedBarcode || '650000',
      qty: qtyNum,
      unit: unit || 'Pcs',
      remarks
    };

    setItems(prev => [...prev, newItem]);
    // Reset product line
    setSelectedBarcode('');
    setProductName('');
    setSelectedProductId('');
    setQuantity('1.000');
  };

  const handleRemoveItem = () => {
    if (selectedRowIndex === null || !items[selectedRowIndex]) {
      alert('Please select an item in the table to remove.');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== selectedRowIndex));
    setSelectedRowIndex(null);
  };

  const handleNew = () => {
    const nextId = (parseInt(stockId, 10) + 1).toString().padStart(4, '0');
    setStockId(nextId);
    setItems([]);
    setRemarks('');
    setSelectedBarcode('');
    setProductName('');
    setQuantity('1.000');
    setSelectedRowIndex(null);
  };

  const handleSave = () => {
    if (items.length === 0) {
      alert('Please add at least one product to the Stock Entry table before saving.');
      return;
    }

    onSaveStockEntry({
      stockId,
      date: entryDate,
      remarks,
      items
    });

    alert(`✅ Stock Entry [ID: ${stockId}] saved successfully! Stock quantities have been updated.`);
    handleNew();
  };

  const handleDelete = () => {
    if (items.length === 0) return;
    if (confirm(`Are you sure you want to delete all entries for Stock ID ${stockId}?`)) {
      setItems([]);
      alert(`Stock Entry ${stockId} cleared.`);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          width: '760px',
          maxWidth: '96vw',
          backgroundColor: '#f8fafc',
          border: '2px solid #003399',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        }}
      >
        {/* Windows Header Bar (Frame 0070) */}
        <div
          style={{
            background: 'linear-gradient(180deg, #004b99 0%, #002266 100%)',
            color: '#ffffff',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '14px' }}>
            <span>📦</span>
            <span>Stock Entry</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => {}}
              style={{
                width: '22px',
                height: '20px',
                background: '#003366',
                border: '1px solid #6699cc',
                color: '#ffffff',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              _
            </button>
            <button
              onClick={() => {}}
              style={{
                width: '22px',
                height: '20px',
                background: '#003366',
                border: '1px solid #6699cc',
                color: '#ffffff',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              □
            </button>
            <button
              onClick={onClose}
              style={{
                width: '24px',
                height: '20px',
                background: '#cc0000',
                border: '1px solid #ff6666',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Top Section: Invoice Information & Right Action Buttons */}
          <div style={{ display: 'flex', gap: '14px' }}>
            {/* Fieldset: Invoice Information */}
            <fieldset
              style={{
                flex: 1,
                border: '1px solid #cbd5e1',
                padding: '10px 14px',
                margin: 0,
                backgroundColor: '#ffffff'
              }}
            >
              <legend style={{ fontSize: '11px', fontWeight: 600, color: '#334155', padding: '0 4px' }}>
                Invoice Information
              </legend>

              <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: '8px', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>Stock ID :</label>
                <div>
                  <input
                    type="text"
                    value={stockId}
                    readOnly
                    style={{
                      width: '120px',
                      padding: '3px 6px',
                      fontSize: '12px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #94a3b8',
                      color: '#0f172a',
                      fontWeight: 'bold'
                    }}
                  />
                </div>

                <label style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>Date :</label>
                <div>
                  <input
                    type="date"
                    value={entryDate}
                    onChange={e => setEntryDate(e.target.value)}
                    style={{
                      width: '160px',
                      padding: '3px 6px',
                      fontSize: '12px',
                      border: '1px solid #94a3b8',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>

                <label style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b', alignSelf: 'flex-start', marginTop: '4px' }}>
                  Remarks :
                </label>
                <div>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="Enter stock entry remarks or inward purpose..."
                    style={{
                      width: '100%',
                      padding: '6px',
                      fontSize: '12px',
                      backgroundColor: '#ffffcc', // Authentic yellow background from Frame 0070
                      border: '1px solid #d97706',
                      color: '#1e293b',
                      resize: 'none',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </fieldset>

            {/* Right Action Buttons Toolbar (Frame 0070) */}
            <div style={{ width: '110px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                onClick={handleNew}
                style={{
                  padding: '7px 0',
                  background: 'linear-gradient(180deg, #1d4ed8 0%, #1e3a8a 100%)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  border: '1px solid #1e40af',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
                }}
              >
                New
              </button>

              <button
                onClick={handleSave}
                style={{
                  padding: '7px 0',
                  background: 'linear-gradient(180deg, #16a34a 0%, #14532d 100%)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  border: '1px solid #15803d',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
                }}
              >
                Save
              </button>

              <button
                onClick={handleDelete}
                style={{
                  padding: '7px 0',
                  background: 'linear-gradient(180deg, #64748b 0%, #334155 100%)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  border: '1px solid #475569',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
                }}
              >
                Delete
              </button>

              <button
                onClick={() => {
                  if (onOpenStockEntryRecords) {
                    onOpenStockEntryRecords();
                  } else {
                    alert('Records ➔ Stock Entry list will open.');
                  }
                }}
                style={{
                  padding: '7px 0',
                  background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  border: '1px solid #0284c7',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)'
                }}
              >
                Get Data
              </button>
            </div>
          </div>

          {/* Section 2: Product Info & Add/Remove (Frame 0070) */}
          <fieldset
            style={{
              border: '1px solid #cbd5e1',
              padding: '10px 14px',
              margin: 0,
              backgroundColor: '#ffffff'
            }}
          >
            <legend style={{ fontSize: '11px', fontWeight: 600, color: '#334155', padding: '0 4px' }}>
              Product Info
            </legend>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '95px 1fr', rowGap: '7px', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>Barcode :</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={selectedBarcode}
                    onChange={e => handleBarcodeChange(e.target.value)}
                    placeholder="Scan Barcode or type code..."
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      fontSize: '12px',
                      backgroundColor: '#ffffcc', // Pale yellow input
                      border: '1px solid #ca8a04',
                      fontWeight: 600
                    }}
                  />
                  <select
                    onChange={e => {
                      const p = products.find(prod => prod.id === e.target.value);
                      if (p) handleProductSelect(p);
                    }}
                    value={selectedProductId}
                    style={{
                      width: '180px',
                      padding: '4px 6px',
                      fontSize: '11px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #94a3b8'
                    }}
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.barcode || p.pCode})
                      </option>
                    ))}
                  </select>
                </div>

                <label style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>Product Name :</label>
                <div>
                  <input
                    type="text"
                    value={productName}
                    readOnly
                    placeholder="Auto-filled product name"
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      fontSize: '12px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      fontWeight: 600,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <label style={{ fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>Quantity :</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    style={{
                      width: '110px',
                      padding: '4px 8px',
                      fontSize: '12px',
                      backgroundColor: '#ffffcc', // Pale yellow
                      border: '1px solid #ca8a04',
                      fontWeight: 'bold',
                      textAlign: 'right'
                    }}
                  />
                  <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>{unit}</span>
                </div>
              </div>

              {/* Add / Remove Buttons (Frame 0070) */}
              <div style={{ width: '110px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  onClick={handleAddItem}
                  style={{
                    padding: '7px 0',
                    background: 'linear-gradient(180deg, #1d4ed8 0%, #1e3a8a 100%)',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    border: '1px solid #1e40af',
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}
                >
                  Add
                </button>
                <button
                  onClick={handleRemoveItem}
                  disabled={selectedRowIndex === null}
                  style={{
                    padding: '7px 0',
                    background: selectedRowIndex !== null ? 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)' : '#e2e8f0',
                    color: selectedRowIndex !== null ? '#ffffff' : '#94a3b8',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '2px',
                    cursor: selectedRowIndex !== null ? 'pointer' : 'not-allowed'
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </fieldset>

          {/* Section 3: Data Table (Frame 0070) */}
          <div
            style={{
              height: '210px',
              border: '1px solid #94a3b8',
              backgroundColor: '#ffffff',
              overflowY: 'auto'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#004d80', color: '#ffffff', textAlign: 'left', position: 'sticky', top: 0 }}>
                  <th style={{ width: '30px', padding: '6px 4px', borderRight: '1px solid #003366', textAlign: 'center' }}></th>
                  <th style={{ width: '100px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Product ID</th>
                  <th style={{ padding: '6px 8px', borderRight: '1px solid #003366' }}>Product Name</th>
                  <th style={{ width: '140px', padding: '6px 8px', borderRight: '1px solid #003366' }}>Barcode</th>
                  <th style={{ width: '90px', padding: '6px 8px', textAlign: 'right' }}>Qty.</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                      No items added yet. Scan a barcode or choose a product and click [ Add ].
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => {
                    const isSelected = selectedRowIndex === idx;
                    return (
                      <tr
                        key={it.id || idx}
                        onClick={() => setSelectedRowIndex(idx)}
                        style={{
                          backgroundColor: isSelected ? '#fed7aa' : idx % 2 === 1 ? '#f8fafc' : '#ffffff',
                          cursor: 'pointer',
                          borderBottom: '1px solid #e2e8f0'
                        }}
                      >
                        <td style={{ textAlign: 'center', color: '#1d4ed8', fontWeight: 'bold' }}>
                          {isSelected ? '▶' : ''}
                        </td>
                        <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 600 }}>
                          {it.productCode || it.productId}
                        </td>
                        <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>{it.productName}</td>
                        <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>{it.barcode}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                          {it.qty.toFixed(3)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom helper info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
            <span>Total Items in Voucher: <strong>{items.length}</strong></span>
            <span>Total Qty: <strong>{items.reduce((acc, cur) => acc + cur.qty, 0).toFixed(3)}</strong></span>
          </div>

        </div>
      </div>
    </div>
  );
};
