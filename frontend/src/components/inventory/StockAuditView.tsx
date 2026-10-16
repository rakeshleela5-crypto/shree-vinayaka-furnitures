import { useState } from 'react';
import type { Product, StockAdjustment } from '../../types/retailDaddy';

interface StockAuditViewProps {
  products: Product[];
  adjustments: StockAdjustment[];
  onApplyAdjustment: (adj: StockAdjustment) => void;
}

export function StockAuditView({ products, adjustments, onApplyAdjustment }: StockAuditViewProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0]);
  const [physicalCount, setPhysicalCount] = useState<number>(products[0]?.openingStock || 0);
  const [reason, setReason] = useState<StockAdjustment['reason']>('Damage');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const diff = physicalCount - selectedProduct.openingStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (diff === 0) {
      showToast('ℹ️ Physical stock matches book stock. No adjustment needed.');
      return;
    }

    const adj: StockAdjustment = {
      id: `adj-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      productName: selectedProduct.name,
      barcode: selectedProduct.barcode,
      bookStock: selectedProduct.openingStock,
      physicalStock: physicalCount,
      adjustmentQty: diff,
      reason,
      approvedBy: 'Admin'
    };

    onApplyAdjustment(adj);
    showToast(`✅ Stock adjusted for ${selectedProduct.name} by ${diff > 0 ? '+' : ''}${diff.toFixed(3)} units.`);
  };

  return (
    <div className="rd-window">
      <div className="rd-window-header-green">
        <div className="rd-window-title">STOCK ENTRY & PHYSICAL STOCK AUDIT ADJUSTMENT (TUT 01)</div>
      </div>

      {toastMsg && (
        <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', borderBottom: '1px solid #a7f3d0', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' }}>
          {toastMsg}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Adjustment Form */}
        <div style={{ width: '380px', background: '#f8fafc', borderRight: '1px solid #cbd5e1', padding: '16px' }}>
          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
              Select Item to Audit :
            </label>
            <select
              className="rd-pos-input"
              style={{ width: '100%', marginBottom: '12px' }}
              value={selectedProduct.id}
              onChange={e => {
                const p = products.find(x => x.id === e.target.value);
                if (p) {
                  setSelectedProduct(p);
                  setPhysicalCount(p.openingStock);
                }
              }}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.barcode}]
                </option>
              ))}
            </select>

            <div style={{ background: '#e2e8f0', padding: '10px', borderRadius: '4px', marginBottom: '12px', fontSize: '12px' }}>
              <div>Current Book Stock: <strong>{selectedProduct.openingStock.toFixed(3)}</strong> units</div>
              <div>Godown: <strong>{selectedProduct.godown || 'Block 1'}</strong> | Rack: <strong>{selectedProduct.rack || 'Floor'}</strong></div>
            </div>

            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
              Physical Stock Counted :
            </label>
            <input
              type="number"
              step="0.001"
              className="rd-pos-input"
              style={{ width: '100%', marginBottom: '12px', background: '#fef08a', fontWeight: 'bold' }}
              value={physicalCount}
              onChange={e => setPhysicalCount(Number(e.target.value))}
            />

            <div style={{ marginBottom: '12px', fontSize: '12px', fontWeight: 'bold' }}>
              Adjustment Quantity :{' '}
              <span style={{ color: diff < 0 ? '#dc2626' : '#16a34a' }}>
                {diff > 0 ? `+${diff.toFixed(3)} (Surplus)` : diff < 0 ? `${diff.toFixed(3)} (Shortage)` : '0.000 (Matched)'}
              </span>
            </div>

            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
              Adjustment Reason :
            </label>
            <select
              className="rd-pos-input"
              style={{ width: '100%', marginBottom: '16px' }}
              value={reason}
              onChange={e => setReason(e.target.value as any)}
            >
              <option value="Damage">Damage</option>
              <option value="Shrinkage">Shrinkage / Theft</option>
              <option value="Expiry">Expiry Discard</option>
              <option value="Audit Discrepancy">Audit Discrepancy</option>
              <option value="Opening Balance Correction">Opening Balance Correction</option>
            </select>

            <button
              type="submit"
              className="rd-grid-btn"
              style={{ width: '100%', background: '#16a34a', color: '#fff', padding: '8px', fontWeight: 'bold' }}
            >
              Confirm & Post Stock Adjustment
            </button>
          </form>
        </div>

        {/* Audit Log Table */}
        <div style={{ flex: 1, padding: '12px', overflow: 'auto' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
            Historical Stock Adjustment Audit Trail:
          </div>
          <table className="rd-data-table">
            <thead>
              <tr>
                <th className="th-green">Date</th>
                <th className="th-green">Product Name</th>
                <th className="th-green">Barcode</th>
                <th className="th-green" style={{ textAlign: 'right' }}>Book Stock</th>
                <th className="th-green" style={{ textAlign: 'right' }}>Physical Count</th>
                <th className="th-green" style={{ textAlign: 'right' }}>Diff Qty</th>
                <th className="th-green">Reason</th>
                <th className="th-green">Approved By</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map(adj => (
                <tr key={adj.id}>
                  <td>{adj.date}</td>
                  <td style={{ fontWeight: 'bold' }}>{adj.productName}</td>
                  <td>{adj.barcode}</td>
                  <td style={{ textAlign: 'right' }}>{adj.bookStock.toFixed(3)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{adj.physicalStock.toFixed(3)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: adj.adjustmentQty < 0 ? '#dc2626' : '#16a34a' }}>
                    {adj.adjustmentQty > 0 ? `+${adj.adjustmentQty.toFixed(3)}` : adj.adjustmentQty.toFixed(3)}
                  </td>
                  <td>
                    <span style={{ background: '#fef3c7', padding: '1px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 'bold' }}>
                      {adj.reason}
                    </span>
                  </td>
                  <td>{adj.approvedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
