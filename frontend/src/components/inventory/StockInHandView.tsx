import { useState } from 'react';
import type { Product } from '../../types/retailDaddy';

interface StockInHandViewProps {
  products: Product[];
}

export function StockInHandView({ products }: StockInHandViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNegativeOnly, setShowNegativeOnly] = useState(false);
  const [filterGodown, setFilterGodown] = useState('ALL');

  const filtered = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm) ||
      (p.rack && p.rack.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesGodown = filterGodown === 'ALL' || p.godown === filterGodown;
    const matchesNeg = showNegativeOnly ? p.openingStock <= 0 : true;
    return matchesSearch && matchesGodown && matchesNeg;
  });

  return (
    <div className="rd-window">
      {/* HEADER */}
      <div className="rd-window-header-green">
        <div className="rd-window-title">STOCK IN HAND REPORT (GODOWN & RACK AUDIT)</div>
        <div className="rd-window-actions">
          <button className="rd-btn-header export" onClick={() => window.print()}>
            <span>📊</span> EXPORT EXCEL
          </button>
        </div>
      </div>

      {/* FILTER STRIP (FRAME 245) */}
      <div className="rd-filter-bar">
        <div className="rd-filter-left">
          <input
            type="text"
            className="rd-filter-input"
            style={{ width: '260px', background: '#fef08a', fontWeight: 'bold' }}
            placeholder="Search by Product Name, Rack, Barcode..."
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
            <span>With -Ve Stock Qty Show</span>
          </label>
        </div>

        <div className="rd-filter-right">
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#15803d' }}>
            Total Items: {filtered.length} | Total Stock: {filtered.reduce((s, p) => s + p.openingStock, 0).toFixed(3)}
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
              <th className="th-green" style={{ width: '100px' }}>Barcode</th>
              <th className="th-green" style={{ width: '90px', textAlign: 'right' }}>Stock In Hand</th>
              <th className="th-green" style={{ width: '90px', textAlign: 'right' }}>Min Stock</th>
              <th className="th-green" style={{ width: '90px' }}>Sale Tax Type</th>
              <th className="th-green" style={{ width: '90px' }}>Godown</th>
              <th className="th-green" style={{ width: '80px' }}>Rack</th>
              <th className="th-green" style={{ width: '80px' }}>Batch</th>
              <th className="th-green" style={{ width: '90px' }}>Exp Date</th>
              <th className="th-green" style={{ width: '140px', textAlign: 'center' }}>Expiry Alert</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((prod, idx) => {
              const isExpired = prod.expDate && new Date(prod.expDate) < new Date();
              return (
                <tr key={prod.id}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ fontWeight: 'bold' }}>{prod.name}</td>
                  <td style={{ fontWeight: 'bold' }}>{prod.barcode}</td>
                  <td style={{ textAlign: 'right', fontWeight: '900', color: prod.openingStock < 5 ? '#dc2626' : '#15803d' }}>
                    {prod.openingStock.toFixed(3)}
                  </td>
                  <td style={{ textAlign: 'right' }}>{(prod.minStock || 0).toFixed(3)}</td>
                  <td>{prod.sTax || 'Inclusive'}</td>
                  <td style={{ fontWeight: 'bold', color: '#0369a1' }}>{prod.godown || 'Main Store'}</td>
                  <td style={{ fontWeight: 'bold', color: '#b45309' }}>{prod.rack || 'Floor'}</td>
                  <td>{prod.batch || '-'}</td>
                  <td>{prod.expDate || '-'}</td>
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
