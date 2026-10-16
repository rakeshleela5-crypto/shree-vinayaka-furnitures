import { useState } from 'react';
import type { Product } from '../../types/retailDaddy';
import { ExcelImportModal } from '../common/ExcelImportModal';
import { exportToCsv } from '../../utils/csvImporter';

interface StockInHandViewProps {
  products: Product[];
  onUpdateProducts?: (products: Product[]) => void;
}

export function StockInHandView({ products, onUpdateProducts }: StockInHandViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNegativeOnly, setShowNegativeOnly] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [filterGodown, setFilterGodown] = useState('ALL');
  const [showImportModal, setShowImportModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filtered = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm) ||
      (p.rack && p.rack.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.size && p.size.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.colour && p.colour.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesGodown = filterGodown === 'ALL' || p.godown === filterGodown;
    const matchesNeg = showNegativeOnly ? p.openingStock <= 0 : true;
    const matchesLow = showLowStockOnly ? (p.minStock && p.openingStock <= p.minStock) : true;
    return matchesSearch && matchesGodown && matchesNeg && matchesLow;
  });

  const lowStockCount = products.filter(p => p.minStock && p.openingStock <= p.minStock).length;

  const handleExportCsv = () => {
    const headers = [
      'Product Code',
      'Barcode',
      'Product Name',
      'Category',
      'Sub Category',
      'Stock In Hand',
      'Min Stock',
      'Size',
      'Colour',
      'Godown',
      'Rack',
      'Purchase Price',
      'MRP',
      'Retail Price'
    ];
    const rows = filtered.map(p => [
      p.pCode,
      p.barcode,
      p.name,
      p.category,
      p.subCategory || '',
      p.openingStock,
      p.minStock || 0,
      p.size || '',
      p.colour || '',
      p.godown || '',
      p.rack || '',
      p.purchasePrice,
      p.mrp,
      p.retailPrice
    ]);
    exportToCsv('SVF_Stock_In_Hand_Report.csv', headers, rows);
  };

  const handleConfirmImport = (rows: Record<string, string>[]) => {
    let updatedCount = 0;
    const newProducts = [...products];

    rows.forEach(row => {
      const barcode = row.barcode || row['Barcode'] || '';
      const pCode = row.productcode || row['Product Code'] || row.pcode || '';
      const rawQty = row.newstockqty || row['New Stock Qty'] || row.stock || row.qty || row['Current Stock'] || row['Quantity'] || row.openingstock;
      const rawPurchase = row.purchaseprice || row['Purchase Price'] || row.cost;
      const rawRetail = row.retailprice || row['Retail Price'] || row.rate;
      const godown = row.godown || row['Godown'];
      const rack = row.rack || row['Rack'];

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
        if (godown) item.godown = godown;
        if (rack) item.rack = rack;
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

  return (
    <div className="rd-window">
      {/* HEADER */}
      <div className="rd-window-header-green">
        <div className="rd-window-title">STOCK IN HAND & LOW STOCK AUDIT REPORT (TUT 23 & 24)</div>
        <div className="rd-window-actions" style={{ display: 'flex', gap: '8px' }}>
          <button className="rd-btn-header export" onClick={handleExportCsv} title="Download CSV Spreadsheet">
            <span>📊</span> EXPORT EXCEL
          </button>
          <button
            className="rd-btn-header"
            onClick={() => setShowImportModal(true)}
            title="Import Excel or CSV to update stock"
            style={{
              backgroundColor: '#15803d',
              color: '#ffffff',
              border: 'none',
              padding: '4px 10px',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>📥</span> IMPORT EXCEL
          </button>
        </div>
      </div>

      {/* FILTER STRIP (FRAME 245 & TUT 23) */}
      <div className="rd-filter-bar">
        <div className="rd-filter-left">
          <input
            type="text"
            className="rd-filter-input"
            style={{ width: '260px', background: '#fef08a', fontWeight: 'bold' }}
            placeholder="Search by Product Name, Size, Colour, Rack..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />

          <select
            className="rd-filter-input"
            value={filterGodown}
            onChange={e => setFilterGodown(e.target.value)}
          >
            <option value="ALL">All Godowns</option>
            <option value="Block 1">Block 1</option>
            <option value="Block 2">Block 2</option>
            <option value="Block 3">Block 3</option>
            <option value="Block 5">Block 5</option>
            <option value="Main Showroom">Main Showroom</option>
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#bbf7d0', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
            <input
              type="checkbox"
              checked={showNegativeOnly}
              onChange={e => setShowNegativeOnly(e.target.checked)}
            />
            <span>With -Ve Stock</span>
          </label>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: showLowStockOnly ? '#f87171' : '#fef08a',
            color: showLowStockOnly ? '#fff' : '#000',
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={showLowStockOnly}
              onChange={e => setShowLowStockOnly(e.target.checked)}
            />
            <span>⚠️ Low Stock Alert Items ({lowStockCount})</span>
          </label>
        </div>

        <div className="rd-filter-right">
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#15803d' }}>
            Total Items: {filtered.length} | Stock: {filtered.reduce((s, p) => s + p.openingStock, 0).toFixed(3)}
          </span>
        </div>
      </div>

      {/* GRID */}
      <div className="rd-table-container">
        <table className="rd-data-table">
          <thead>
            <tr>
              <th className="th-green" style={{ width: '40px' }}>#</th>
              <th className="th-green">Product Name</th>
              <th className="th-green" style={{ width: '90px' }}>Barcode</th>
              <th className="th-green" style={{ width: '85px', textAlign: 'right' }}>Stock In Hand</th>
              <th className="th-green" style={{ width: '75px', textAlign: 'right' }}>Min Stock</th>
              <th className="th-green" style={{ width: '60px', textAlign: 'center' }}>Conv</th>
              <th className="th-green" style={{ width: '60px' }}>Size</th>
              <th className="th-green" style={{ width: '70px' }}>Colour</th>
              <th className="th-green" style={{ width: '80px' }}>Godown</th>
              <th className="th-green" style={{ width: '70px' }}>Rack</th>
              <th className="th-green" style={{ width: '120px', textAlign: 'center' }}>Stock Status</th>
              <th className="th-green" style={{ width: '130px', textAlign: 'center' }}>Expiry Alert</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((prod, idx) => {
              const isExpired = prod.expDate && new Date(prod.expDate) < new Date();
              const isLowStock = prod.minStock && prod.openingStock <= prod.minStock;

              return (
                <tr key={prod.id} style={{ background: isLowStock ? '#fef2f2' : undefined }}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ fontWeight: 'bold' }}>
                    {prod.photo && <span style={{ marginRight: '6px' }}>{prod.photo}</span>}
                    {prod.name}
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{prod.barcode}</td>
                  <td style={{
                    textAlign: 'right',
                    fontWeight: '900',
                    color: isLowStock ? '#dc2626' : '#15803d'
                  }}>
                    {prod.openingStock.toFixed(3)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#b45309' }}>
                    {(prod.minStock || 0).toFixed(3)}
                  </td>
                  <td style={{ textAlign: 'center', color: '#0369a1', fontWeight: 'bold' }}>
                    {prod.conv || 1}
                  </td>
                  <td>{prod.size || '-'}</td>
                  <td>{prod.colour || '-'}</td>
                  <td style={{ fontWeight: 'bold', color: '#0369a1' }}>{prod.godown || 'Main Store'}</td>
                  <td style={{ fontWeight: 'bold', color: '#b45309' }}>{prod.rack || 'Floor'}</td>
                  <td style={{ textAlign: 'center' }}>
                    {isLowStock ? (
                      <span style={{
                        background: '#dc2626',
                        color: '#ffffff',
                        fontWeight: 'bold',
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        ⚠️ REORDER NEEDED
                      </span>
                    ) : (
                      <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '11px' }}>
                        ✔ Sufficient
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {isExpired ? (
                      <span style={{
                        background: '#ec4899',
                        color: '#ffffff',
                        fontWeight: '900',
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}>
                        ⚠️ Expiry Date Detected
                      </span>
                    ) : (
                      <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '11px' }}>
                        ✔ Valid
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#16a34a',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 'bold',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            zIndex: 99999,
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
        onConfirmImport={handleConfirmImport}
      />
    </div>
  );
}
