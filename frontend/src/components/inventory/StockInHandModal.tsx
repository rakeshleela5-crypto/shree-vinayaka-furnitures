import React, { useState } from 'react';
import type { Product, StockSearchType } from '../../types/retailDaddy';
import { ExcelImportModal } from '../common/ExcelImportModal';

interface StockInHandModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onOpenProductBulkEditor?: () => void;
  onUpdateProducts?: (updated: Product[]) => void;
}

export const StockInHandModal: React.FC<StockInHandModalProps> = ({
  isOpen,
  onClose,
  products,
  onOpenProductBulkEditor,
  onUpdateProducts
}) => {
  // Frame 0420: 12 exact Search Types
  const [searchType, setSearchType] = useState<StockSearchType>('Product Name');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchByMfgDate, setSearchByMfgDate] = useState(false);
  const [searchByExpDate, setSearchByExpDate] = useState(false);
  const [fromDate, setFromDate] = useState('2025-03-03');
  const [toDate, setToDate] = useState('2025-03-03');
  const [showNegativeStock, setShowNegativeStock] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time filtering matching Frame 0030 & 0420
  const filteredProducts = products.filter(p => {
    // Negative stock filter
    if (!showNegativeStock && p.openingStock < 0) {
      return false;
    }

    // Search query filter across the selected Search Type
    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      switch (searchType) {
        case 'Product Name':
          if (!p.name.toLowerCase().includes(q)) return false;
          break;
        case 'Barcode':
          if (!p.barcode.toLowerCase().includes(q)) return false;
          break;
        case 'Category':
          if (!p.category.toLowerCase().includes(q)) return false;
          break;
        case 'Sub Category':
          if (!(p.subCategory || '').toLowerCase().includes(q)) return false;
          break;
        case 'Part/Group':
          if (!(p.partNo || '').toLowerCase().includes(q)) return false;
          break;
        case 'Godown':
          if (!(p.godown || '').toLowerCase().includes(q)) return false;
          break;
        case 'Rack':
          if (!(p.rack || '').toLowerCase().includes(q)) return false;
          break;
        case 'Batch':
          if (!(p.batch || '').toLowerCase().includes(q)) return false;
          break;
        case 'Size':
          if (!(p.size || '').toLowerCase().includes(q)) return false;
          break;
        case 'Colour':
          if (!(p.colour || '').toLowerCase().includes(q)) return false;
          break;
        case 'IMEI-1':
          if (!(p.imei1 || '').toLowerCase().includes(q)) return false;
          break;
        case 'IMEI-2':
          if (!(p.imei2 || '').toLowerCase().includes(q)) return false;
          break;
        default:
          if (!p.name.toLowerCase().includes(q)) return false;
      }
    }

    return true;
  });

  // Calculate live footer totals
  const totalQuantity = filteredProducts.reduce((sum, p) => sum + (p.openingStock || 0), 0);

  // Frame 0265: Export Excel / CSV with exact Retail Daddy stock layout
  const handleExportExcel = () => {
    const headers = [
      'Product Code',
      'Barcode',
      'Product Name',
      'HSN Code',
      'Part / Group',
      'Purchase Price',
      'Retail Price',
      'Wholesale Price',
      'Stock Quantity Available',
      'Unit'
    ];

    const rows = filteredProducts.map(p => [
      `"${p.pCode || ''}"`,
      `"${p.barcode || ''}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.hsn || '80051'}"`,
      `"${p.partNo || ''}"`,
      (p.purchasePrice || 0).toFixed(2),
      (p.retailPrice || 0).toFixed(2),
      (p.wholesalePrice || p.retailPrice || 0).toFixed(2),
      (p.openingStock || 0).toFixed(3),
      `"${p.salesUnit || 'PCS'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_In_Hand_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmImportStock = (rows: Record<string, string>[]) => {
    let updatedCount = 0;
    const newProducts = [...products];

    rows.forEach(row => {
      const barcode = row.barcode || row['Barcode'] || '';
      const pCode = row.productcode || row['Product Code'] || row.pcode || '';
      const rawQty = row.newstockqty || row['New Stock Qty'] || row.stock || row.qty || row['Current Stock'] || row['Quantity'] || row.openingstock;
      const rawPurchase = row.purchaseprice || row['Purchase Price'] || row.cost;
      const rawRetail = row.retailprice || row['Retail Price'] || row.rate;

      const idx = newProducts.findIndex(p => 
        (barcode && p.barcode === barcode) || 
        (pCode && p.pCode.toLowerCase() === pCode.toLowerCase())
      );

      if (idx !== -1) {
        const item = { ...newProducts[idx] };
        if (rawQty !== undefined && rawQty !== '' && !isNaN(Number(rawQty))) {
          item.openingStock = Number(rawQty);
        }
        if (rawPurchase !== undefined && rawPurchase !== '' && !isNaN(Number(rawPurchase))) {
          item.purchasePrice = Number(rawPurchase);
        }
        if (rawRetail !== undefined && rawRetail !== '' && !isNaN(Number(rawRetail))) {
          item.retailPrice = Number(rawRetail);
        }
        newProducts[idx] = item;
        updatedCount++;
      }
    });

    if (onUpdateProducts) {
      onUpdateProducts(newProducts);
    }
    setToastMessage(`✓ Successfully imported and updated stock for ${updatedCount} products!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleReset = () => {
    setSearchType('Product Name');
    setSearchQuery('');
    setSearchByMfgDate(false);
    setSearchByExpDate(false);
    setShowNegativeStock(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
      }}
    >
      <div
        style={{
          width: '96vw',
          maxWidth: '1280px',
          height: '92vh',
          backgroundColor: '#e2e8f0',
          borderRadius: '4px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #002b66',
          overflow: 'hidden'
        }}
      >
        {/* TOP TITLE BAR (Frame 0030) */}
        <div
          style={{
            background: 'linear-gradient(180deg, #0052cc 0%, #003366 100%)',
            color: '#ffffff',
            padding: '7px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #001f4d',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '15px' }}>
            <span>📦</span>
            <span>Stock In Hand</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => {
                if (onOpenProductBulkEditor) {
                  onClose();
                  onOpenProductBulkEditor();
                }
              }}
              style={{
                backgroundColor: '#f59e0b',
                color: '#000000',
                border: '1px solid #d97706',
                borderRadius: '3px',
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              title="Open Bulk Editor to edit Part/Group, Godown & Rack"
            >
              ✏️ Bulk Edit
            </button>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '3px',
                padding: '2px 9px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* TOP CONTROLS & FILTER BAR (Frame 0030 & 0420) */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '8px 12px',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px'
          }}
        >
          {/* Left search group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search Type (Frame 0420) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>Search Type</span>
              <select
                value={searchType}
                onChange={e => setSearchType(e.target.value as StockSearchType)}
                style={{
                  height: '28px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  border: '1px solid #94a3b8',
                  borderRadius: '3px',
                  backgroundColor: '#ffffff',
                  fontWeight: 'bold',
                  color: '#0f172a',
                  minWidth: '130px'
                }}
              >
                <option value="Product Name">Product Name</option>
                <option value="Barcode">Barcode</option>
                <option value="Category">Category</option>
                <option value="Sub Category">Sub Category</option>
                <option value="Part/Group">Part/Group</option>
                <option value="Godown">Godown</option>
                <option value="Rack">Rack</option>
                <option value="Batch">Batch</option>
                <option value="Size">Size</option>
                <option value="Colour">Colour</option>
                <option value="IMEI-1">IMEI-1</option>
                <option value="IMEI-2">IMEI-2</option>
              </select>
            </div>

            {/* Search Input Box */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '11px', color: '#475569', fontWeight: 'bold' }}>Search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Type ${searchType}...`}
                style={{
                  height: '28px',
                  width: '210px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  border: '1px solid #3b82f6',
                  borderRadius: '3px',
                  backgroundColor: '#fefce8', // Pale yellow highlight like in video
                  color: '#0f172a',
                  fontWeight: 'bold'
                }}
              />
            </div>

            {/* Date Filters (Frame 0030) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
              <button
                type="button"
                onClick={() => setSearchByMfgDate(!searchByMfgDate)}
                style={{
                  backgroundColor: searchByMfgDate ? '#16a34a' : '#e2e8f0',
                  color: searchByMfgDate ? '#ffffff' : '#334155',
                  border: '1px solid #94a3b8',
                  borderRadius: '3px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {searchByMfgDate ? '✓ ' : ''}Search By Mfg Date
              </button>

              <button
                type="button"
                onClick={() => setSearchByExpDate(!searchByExpDate)}
                style={{
                  backgroundColor: searchByExpDate ? '#16a34a' : '#e2e8f0',
                  color: searchByExpDate ? '#ffffff' : '#334155',
                  border: '1px solid #94a3b8',
                  borderRadius: '3px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {searchByExpDate ? '✓ ' : ''}Search By Exp Date
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                <span style={{ color: '#475569' }}>From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  style={{
                    height: '26px',
                    fontSize: '11px',
                    border: '1px solid #94a3b8',
                    borderRadius: '2px',
                    padding: '1px 4px'
                  }}
                />
                <span style={{ color: '#475569' }}>To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  style={{
                    height: '26px',
                    fontSize: '11px',
                    border: '1px solid #94a3b8',
                    borderRadius: '2px',
                    padding: '1px 4px'
                  }}
                />
              </div>
            </div>

            {/* Badges from Frame 0030 */}
            <div
              style={{
                backgroundColor: '#ec4899',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 'bold',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              Expiry Date Detected
            </div>

            <button
              type="button"
              onClick={() => setShowNegativeStock(!showNegativeStock)}
              style={{
                backgroundColor: showNegativeStock ? '#16a34a' : '#bbf7d0',
                color: showNegativeStock ? '#ffffff' : '#14532d',
                border: '1px solid #16a34a',
                borderRadius: '3px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {showNegativeStock ? '✓ ' : ''}With -Ve Stock Qty Show
            </button>
          </div>

          {/* Right Action Buttons (Frame 0030) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Reset */}
            <button
              type="button"
              onClick={handleReset}
              style={{
                backgroundColor: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '3px',
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
            >
              <span>🔄</span> Reset
            </button>

            {/* Export Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              style={{
                backgroundColor: '#15803d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '3px',
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
            >
              <span>📊</span> Export Excel
            </button>

            {/* Import Excel */}
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              style={{
                backgroundColor: '#4d7c0f',
                color: '#ffffff',
                border: 'none',
                borderRadius: '3px',
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer'
              }}
            >
              <span>📥</span> Import Excel
            </button>

            {/* Show All Stock - F1 */}
            <button
              type="button"
              onClick={handleReset}
              style={{
                backgroundColor: '#1d4ed8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '3px',
                padding: '5px 14px',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              <span>📦</span> Show All Stock - F1
            </button>
          </div>
        </div>

        {/* 13-COLUMN TABLE (Frame 0030) */}
        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#ffffff' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '11px',
              color: '#0f172a'
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: '#003366',
                  color: '#ffffff',
                  textAlign: 'left',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10
                }}
              >
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '85px' }}>Product Code</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af' }}>Product Name</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '65px' }}>HSN Code</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '75px' }}>Part / Group</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '85px' }}>Barcode</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '85px', textAlign: 'right' }}>Purchase Price</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '75px', textAlign: 'right' }}>Retail Price</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '55px', textAlign: 'right' }}>Discount</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '50px', textAlign: 'right' }}>CGST</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '50px', textAlign: 'right' }}>SGST</th>
                <th style={{ padding: '6px 8px', borderRight: '1px solid #1e40af', width: '50px', textAlign: 'right' }}>CESS</th>
                <th
                  style={{
                    padding: '6px 8px',
                    borderRight: '1px solid #1e40af',
                    width: '95px',
                    textAlign: 'right',
                    backgroundColor: '#0284c7' // Highlighted header for live stock
                  }}
                >
                  Qty Available
                </th>
                <th style={{ padding: '6px 8px', width: '65px', textAlign: 'center' }}>Main Unit</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={13} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No products found matching the current search criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, idx) => {
                  const isSelected = selectedProductId === p.id;
                  const isAdolExtra = p.name.toUpperCase().includes('ADOL EXTRA');
                  return (
                    <tr
                      key={p.id || idx}
                      onClick={() => setSelectedProductId(p.id)}
                      style={{
                        backgroundColor: isSelected
                          ? '#bfdbfe'
                          : isAdolExtra
                          ? '#fef9c3' // Soft yellow highlight for demonstration product
                          : idx % 2 === 0
                          ? '#ffffff'
                          : '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        cursor: 'pointer'
                      }}
                    >
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #f1f5f9', fontWeight: 'bold' }}>
                        {p.pCode || `P-${String(idx + 1).padStart(4, '0')}`}
                      </td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #f1f5f9', fontWeight: isAdolExtra ? 'bold' : 'normal' }}>
                        {p.name}
                        {p.godown && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#64748b' }}>[{p.godown}-{p.rack || ''}]</span>}
                      </td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #f1f5f9' }}>{p.hsn || '80051'}</td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #f1f5f9', color: '#475569' }}>
                        {p.partNo || '0'}
                      </td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #f1f5f9', fontFamily: 'monospace' }}>
                        {p.barcode}
                      </td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #f1f5f9', textAlign: 'right' }}>
                        {(p.purchasePrice || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #f1f5f9', textAlign: 'right' }}>
                        {(p.retailPrice || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #f1f5f9', textAlign: 'right' }}>
                        {(p.discount || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #f1f5f9', textAlign: 'right' }}>
                        {(p.cgst || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #f1f5f9', textAlign: 'right' }}>
                        {(p.sgst || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '5px 8px', borderRight: '1px solid #f1f5f9', textAlign: 'right' }}>
                        {(p.cessPercent || 0).toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: '5px 8px',
                          borderRight: '1px solid #f1f5f9',
                          textAlign: 'right',
                          fontWeight: 'bold',
                          color: p.openingStock <= 0 ? '#dc2626' : '#0369a1',
                          backgroundColor: isAdolExtra ? '#fef08a' : undefined
                        }}
                      >
                        {(p.openingStock || 0).toFixed(3)}
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'center', color: '#475569' }}>
                        {p.salesUnit || 'PCS'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* BOTTOM STATUS & TOTALS BAR (Frame 0030) */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderTop: '2px solid #cbd5e1',
            padding: '6px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#0f172a'
          }}
        >
          <div style={{ color: '#475569' }}>
            No.of Items : <span style={{ color: '#0f172a' }}>{filteredProducts.length}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Total Quantity :</span>
            <div
              style={{
                minWidth: '120px',
                textAlign: 'right',
                padding: '2px 8px',
                backgroundColor: '#f1f5f9',
                border: '1px solid #94a3b8',
                borderRadius: '3px',
                color: '#002b66',
                fontSize: '13px'
              }}
            >
              {totalQuantity.toFixed(3)}
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              bottom: '30px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              padding: '10px 22px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 'bold',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              zIndex: 100000,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>✨</span> {toastMessage}
          </div>
        )}

        {/* Excel Import Modal */}
        <ExcelImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          type="stock"
          onConfirmImport={handleConfirmImportStock}
        />
      </div>
    </div>
  );
};
