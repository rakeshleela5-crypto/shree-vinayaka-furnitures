import React, { useState } from 'react';
import type { ProductItem } from '../../../types/pos';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  onSelectProduct: (p: ProductItem) => void;
}

export const ProductSearchPickerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct
}) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');

  if (!isOpen) return null;

  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];

  const filtered = products.filter(p => {
    if (selectedCat !== 'ALL' && p.category !== selectedCat) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.barcode.includes(search) && !p.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="rd-modal-backdrop">
      <div className="rd-form-window" style={{ width: '840px', maxWidth: '96vw' }}>
        <div className="rd-form-titlebar" style={{ background: '#15803d', color: '#fff' }}>
          <span>Product Item Search & Selection (F3 / Product ▾)</span>
          <button className="rd-win-btn close" onClick={onClose} style={{ color: '#fff' }}>✕</button>
        </div>

        <div style={{ padding: '12px', background: '#f8fafc' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
            <input 
              type="text" 
              placeholder="Search product by name, barcode, code..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="rd-input-yellow"
              style={{ flex: 1, padding: '6px 10px', fontSize: '13px' }}
              autoFocus
            />

            <select 
              value={selectedCat} 
              onChange={e => setSelectedCat(e.target.value)}
              style={{ padding: '6px', border: '1px solid #94a3b8', borderRadius: '3px', fontSize: '12px' }}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid #cbd5e1', background: '#fff' }}>
            <table className="rd-grid-table">
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>Barcode</th>
                  <th style={{ width: '80px' }}>Code</th>
                  <th>Product Description</th>
                  <th style={{ width: '80px' }}>Category</th>
                  <th className="numeric" style={{ width: '70px' }}>MRP (₹)</th>
                  <th className="numeric" style={{ width: '75px' }}>Retail (₹)</th>
                  <th className="numeric" style={{ width: '80px' }}>Wholesale (₹)</th>
                  <th className="numeric" style={{ width: '55px' }}>Stock</th>
                  <th style={{ width: '50px', textAlign: 'center' }}>Tax%</th>
                  <th style={{ width: '60px', textAlign: 'center' }}>Select</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} onDoubleClick={() => { onSelectProduct(p); onClose(); }}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.barcode}</td>
                    <td>{p.code}</td>
                    <td style={{ fontWeight: 700 }}>
                      {p.name}
                      {p.regionalName && <div style={{ fontSize: '10px', color: '#64748b' }}>{p.regionalName}</div>}
                    </td>
                    <td>{p.category}</td>
                    <td className="numeric">{p.mrp.toFixed(2)}</td>
                    <td className="numeric" style={{ fontWeight: 700, color: '#15803d' }}>{p.retailPrice.toFixed(2)}</td>
                    <td className="numeric">{p.wholesalePrice.toFixed(2)}</td>
                    <td className="numeric">
                      <span style={{ fontWeight: 800, color: p.stock > 5 ? '#15803d' : '#dc2626' }}>
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{p.taxRate}%</td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="rd-classic-btn"
                        style={{ padding: '2px 8px', fontSize: '10px', background: '#dcfce7', color: '#166534', borderColor: '#86efac' }}
                        onClick={() => { onSelectProduct(p); onClose(); }}
                      >
                        Pick
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ padding: '8px 12px', background: '#e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#475569' }}>
            Tip: Double-click any row to instantly pick the item into the bill.
          </span>
          <button className="rd-classic-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
