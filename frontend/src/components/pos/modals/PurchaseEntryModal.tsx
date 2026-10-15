import React, { useState } from 'react';
import type { ProductItem } from '../../../types/pos';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  onAddStock: (productId: string, addedQty: number, purchaseRate: number) => void;
}

export const PurchaseEntryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  products,
  onAddStock
}) => {
  const [supplierName, setSupplierName] = useState('Mysore Teak Timber Mills Pvt Ltd');
  const [supplierGst, setSupplierGst] = useState('29AAACM4510B1ZT');
  const [purchaseBillNo, setPurchaseBillNo] = useState('PUR-2026-0891');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [purchaseQty, setPurchaseQty] = useState('10');
  const [purchaseRate, setPurchaseRate] = useState('28000');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSavePurchase = () => {
    const qty = parseFloat(purchaseQty) || 0;
    const rate = parseFloat(purchaseRate) || 0;
    if (qty <= 0) return;

    onAddStock(selectedProductId, qty, rate);
    setStatusMsg(`✓ Stock added successfully: +${qty} units!`);
    setTimeout(() => {
      setStatusMsg(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="rd-modal-backdrop">
      <div className="rd-form-window" style={{ width: '640px' }}>
        <div className="rd-form-titlebar" style={{ background: '#059669', color: '#fff' }}>
          <span>Purchase Invoice Entry & Stock Inward (F2)</span>
          <button className="rd-win-btn close" onClick={onClose} style={{ color: '#fff' }}>✕</button>
        </div>

        <div style={{ padding: '16px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Supplier Name:</label>
              <input 
                type="text" 
                value={supplierName} 
                onChange={e => setSupplierName(e.target.value)}
                style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', fontSize: '11px', marginTop: '3px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Supplier GSTIN:</label>
              <input 
                type="text" 
                value={supplierGst} 
                onChange={e => setSupplierGst(e.target.value)}
                style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', fontSize: '11px', marginTop: '3px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Supplier Invoice / Bill No:</label>
            <input 
              type="text" 
              value={purchaseBillNo} 
              onChange={e => setPurchaseBillNo(e.target.value)}
              className="rd-input-yellow"
              style={{ width: '100%', marginTop: '3px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Product to Restock:</label>
            <select 
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', fontSize: '11px', marginTop: '3px', background: '#fff' }}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.barcode} | {p.name} (Current Stock: {p.stock})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Inward Quantity:</label>
              <input 
                type="number" 
                value={purchaseQty} 
                onChange={e => setPurchaseQty(e.target.value)}
                className="rd-input-yellow"
                style={{ width: '100%', marginTop: '3px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>Purchase Rate Excl. GST (₹):</label>
              <input 
                type="number" 
                value={purchaseRate} 
                onChange={e => setPurchaseRate(e.target.value)}
                style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', fontSize: '11px', marginTop: '3px', textAlign: 'right' }}
              />
            </div>
          </div>

          {statusMsg && (
            <div style={{ background: '#dcfce7', border: '1px solid #86efac', padding: '8px', borderRadius: '4px', color: '#166534', fontWeight: 700, textAlign: 'center' }}>
              {statusMsg}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
            <button className="rd-classic-btn" onClick={onClose}>Cancel</button>
            <button 
              className="rd-classic-btn" 
              style={{ background: '#059669', color: '#fff', borderColor: '#047857', padding: '6px 18px' }}
              onClick={handleSavePurchase}
            >
              Post Purchase & Update Inventory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
