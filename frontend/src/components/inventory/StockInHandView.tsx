import { useState } from 'react';
import type { Product } from '../../types/retailDaddy';

interface StockInHandViewProps {
  products: Product[];
}

export function StockInHandView({ products }: StockInHandViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNegativeOnly, setShowNegativeOnly] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [filterGodown, setFilterGodown] = useState('ALL');

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

  return (
    <div className="rd-window">
      {/* HEADER */}
      <div className="rd-window-header-green">
        <div className="rd-window-title">STOCK IN HAND & LOW STOCK AUDIT REPORT (TUT 23 & 24)</div>
        <div className="rd-window-actions">
          <button className="rd-btn-header export" onClick={() => window.print()}>
            <span>📊</span> EXPORT EXCEL
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
    </div>
  );
}
