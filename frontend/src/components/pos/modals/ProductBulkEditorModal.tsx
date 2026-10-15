import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import type { ProductItem } from '../../../types/pos';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  onSaveProducts: (products: ProductItem[]) => void;
}

export const ProductBulkEditorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  products,
  onSaveProducts
}) => {
  const [items, setItems] = useState<ProductItem[]>(products);
  const [searchName, setSearchName] = useState('');
  const [searchBarcode, setSearchBarcode] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeLang, setActiveLang] = useState<'EN' | 'HI'>('EN');

  if (!isOpen) return null;

  const filtered = items.filter(it => {
    if (searchName && !it.name.toLowerCase().includes(searchName.toLowerCase())) return false;
    if (searchBarcode && !it.barcode.includes(searchBarcode)) return false;
    if (searchCategory && !it.category.toLowerCase().includes(searchCategory.toLowerCase())) return false;
    return true;
  });

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(it => it.id));
    }
  };

  const handlePriceChange = (id: string, field: 'retailPrice' | 'wholesalePrice' | 'mrp', val: number) => {
    setItems(prev =>
      prev.map(it => (it.id === id ? { ...it, [field]: val } : it))
    );
  };

  const handleSave = () => {
    onSaveProducts(items);
    alert('✓ Product changes saved successfully in bulk!');
    onClose();
  };

  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal-window" style={{ maxWidth: '980px', width: '96%' }}>
        {/* Top cyan bar matching Screen 556 */}
        <div
          className="pos-modal-header"
          style={{ background: '#0284c7', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Product Bulk Editor</h3>
          </div>
          <button className="pos-modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ padding: '16px', background: '#f0f9ff' }}>
          {/* Header Controls matching frame 556 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '12px', fontSize: '0.8rem' }}>
            <span style={{ background: '#dc2626', color: '#fff', padding: '3px 8px', borderRadius: '3px', fontWeight: 700 }}>
              Top 50 Records Active
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '3px', fontWeight: 700, cursor: 'pointer' }}
            >
              Select All
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Search By Name:</span>
              <input
                type="text"
                value={searchName}
                onChange={e => setSearchName(e.target.value)}
                style={{ padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', width: '130px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Search Barcode:</span>
              <input
                type="text"
                value={searchBarcode}
                onChange={e => setSearchBarcode(e.target.value)}
                style={{ padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', width: '90px' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Category:</span>
              <input
                type="text"
                value={searchCategory}
                onChange={e => setSearchCategory(e.target.value)}
                style={{ padding: '3px 6px', border: '1px solid #cbd5e1', borderRadius: '3px', width: '90px' }}
              />
            </div>

            {/* Action buttons on right matching frame 556 */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setActiveLang(activeLang === 'EN' ? 'HI' : 'EN')}
                style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '3px', fontWeight: 600, cursor: 'pointer' }}
              >
                2nd Lang ({activeLang})
              </button>
              <button
                type="button"
                onClick={handleSave}
                style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '4px 14px', borderRadius: '3px', fontWeight: 700, cursor: 'pointer' }}
              >
                <Save size={13} style={{ display: 'inline', marginRight: '4px' }} /> Save
              </button>
            </div>
          </div>

          {/* Yellow Grid matching frame 556 */}
          <div style={{ background: '#fef08a', border: '1px solid #facc15', borderRadius: '4px', maxHeight: '380px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#fde047', color: '#000', borderBottom: '1px solid #eab308', textAlign: 'left' }}>
                  <th style={{ padding: '6px 8px', width: '30px' }}>Select</th>
                  <th style={{ padding: '6px 8px', width: '70px' }}>Code</th>
                  <th style={{ padding: '6px 8px', width: '70px' }}>Barcode</th>
                  <th style={{ padding: '6px 8px' }}>Product Name</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: '90px' }}>MRP (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: '95px' }}>Retail (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', width: '95px' }}>Wholesale (₹)</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', width: '60px' }}>Stock</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', width: '60px' }}>Tax%</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(it => {
                  const isChecked = selectedIds.includes(it.id);
                  return (
                    <tr
                      key={it.id}
                      style={{
                        borderBottom: '1px solid #fef9c3',
                        background: isChecked ? '#fef9c3' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) setSelectedIds([...selectedIds, it.id]);
                            else setSelectedIds(selectedIds.filter(id => id !== it.id));
                          }}
                        />
                      </td>
                      <td style={{ padding: '4px 8px', fontWeight: 600 }}>{it.code}</td>
                      <td style={{ padding: '4px 8px' }}>{it.barcode}</td>
                      <td style={{ padding: '4px 8px', fontWeight: 600 }}>
                        {activeLang === 'HI' && it.regionalName ? it.regionalName : it.name}
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                        <input
                          type="number"
                          value={it.mrp}
                          onChange={e => handlePriceChange(it.id, 'mrp', parseFloat(e.target.value) || 0)}
                          style={{ width: '80px', padding: '2px 4px', textAlign: 'right', border: '1px solid #ca8a04', borderRadius: '2px', background: '#fff' }}
                        />
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                        <input
                          type="number"
                          value={it.retailPrice}
                          onChange={e => handlePriceChange(it.id, 'retailPrice', parseFloat(e.target.value) || 0)}
                          style={{ width: '85px', padding: '2px 4px', textAlign: 'right', border: '1px solid #ca8a04', borderRadius: '2px', background: '#fff', fontWeight: 700 }}
                        />
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'right' }}>
                        <input
                          type="number"
                          value={it.wholesalePrice}
                          onChange={e => handlePriceChange(it.id, 'wholesalePrice', parseFloat(e.target.value) || 0)}
                          style={{ width: '85px', padding: '2px 4px', textAlign: 'right', border: '1px solid #ca8a04', borderRadius: '2px', background: '#fff' }}
                        />
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 700, color: it.stock < 5 ? '#dc2626' : '#15803d' }}>
                        {it.stock} {it.unit}
                      </td>
                      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                        {it.taxRate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
