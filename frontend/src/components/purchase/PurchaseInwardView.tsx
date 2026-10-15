import { useState } from 'react';
import type { Product } from '../../types/retailDaddy';

interface PurchaseInwardViewProps {
  products: Product[];
  onAddStockInward: (barcode: string, addQty: number, newPurchasePrice?: number) => void;
}

export function PurchaseInwardView({ products, onAddStockInward }: PurchaseInwardViewProps) {
  const [supplierName, setSupplierName] = useState('Timber Mills Hub (Karnataka)');
  const [invoiceNo, setInvoiceNo] = useState(`PUR-${Math.floor(1000 + Math.random() * 9000)}`);
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0]);
  const [inwardQty, setInwardQty] = useState<number>(10);
  const [inwardRate, setInwardRate] = useState<number>(products[0]?.purchasePrice || 100);
  const [inwardLogs, setInwardLogs] = useState<any[]>([]);

  const handleInwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inwardQty <= 0) return;

    onAddStockInward(selectedProduct.barcode, inwardQty, inwardRate);

    const logEntry = {
      id: `inward-${Date.now()}`,
      invoiceNo,
      supplier: supplierName,
      date: new Date().toLocaleDateString('en-GB'),
      product: selectedProduct.name,
      barcode: selectedProduct.barcode,
      qty: inwardQty,
      rate: inwardRate,
      total: inwardQty * inwardRate
    };

    setInwardLogs([logEntry, ...inwardLogs]);
    alert(`✅ Inward stock recorded: +${inwardQty} units of ${selectedProduct.name} added to inventory.`);
  };

  return (
    <div className="rd-window">
      <div className="rd-window-header-green">
        <div className="rd-window-title">PURCHASE ENTRY & SUPPLIER INVOICE INWARD (F2 / TUT 06)</div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ width: '380px', background: '#f8fafc', borderRight: '1px solid #cbd5e1', padding: '16px' }}>
          <form onSubmit={handleInwardSubmit}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
              Supplier Name :
            </label>
            <input
              type="text"
              className="rd-pos-input"
              style={{ width: '100%', marginBottom: '12px' }}
              value={supplierName}
              onChange={e => setSupplierName(e.target.value)}
              required
            />

            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
              Supplier Invoice No :
            </label>
            <input
              type="text"
              className="rd-pos-input"
              style={{ width: '100%', marginBottom: '12px' }}
              value={invoiceNo}
              onChange={e => setInvoiceNo(e.target.value)}
              required
            />

            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
              Select Item :
            </label>
            <select
              className="rd-pos-input"
              style={{ width: '100%', marginBottom: '12px' }}
              value={selectedProduct.id}
              onChange={e => {
                const p = products.find(x => x.id === e.target.value);
                if (p) {
                  setSelectedProduct(p);
                  setInwardRate(p.purchasePrice);
                }
              }}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.barcode}]
                </option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                  Inward Qty :
                </label>
                <input
                  type="number"
                  step="0.001"
                  className="rd-pos-input"
                  style={{ width: '100%', background: '#fef08a', fontWeight: 'bold' }}
                  value={inwardQty}
                  onChange={e => setInwardQty(Number(e.target.value))}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>
                  Purchase Rate (₹) :
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="rd-pos-input"
                  style={{ width: '100%' }}
                  value={inwardRate}
                  onChange={e => setInwardRate(Number(e.target.value))}
                />
              </div>
            </div>

            <div style={{ background: '#dcfce7', padding: '10px', borderRadius: '4px', marginBottom: '16px', fontWeight: 'bold', fontSize: '13px', color: '#15803d' }}>
              Total Invoice Line: ₹ {(inwardQty * inwardRate).toFixed(2)}
            </div>

            <button
              type="submit"
              className="rd-grid-btn"
              style={{ width: '100%', background: '#16a34a', color: '#fff', padding: '8px', fontWeight: 'bold' }}
            >
              📥 Post Stock Inward
            </button>
          </form>
        </div>

        <div style={{ flex: 1, padding: '12px', overflow: 'auto' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
            Recent Stock Inward Records:
          </div>
          <table className="rd-data-table">
            <thead>
              <tr>
                <th className="th-green">Invoice No</th>
                <th className="th-green">Date</th>
                <th className="th-green">Supplier</th>
                <th className="th-green">Item</th>
                <th className="th-green" style={{ textAlign: 'right' }}>Qty</th>
                <th className="th-green" style={{ textAlign: 'right' }}>Rate</th>
                <th className="th-green" style={{ textAlign: 'right' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {inwardLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontWeight: 'bold' }}>{log.invoiceNo}</td>
                  <td>{log.date}</td>
                  <td>{log.supplier}</td>
                  <td style={{ fontWeight: 'bold' }}>{log.product}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#15803d' }}>+{log.qty}</td>
                  <td style={{ textAlign: 'right' }}>₹{log.rate.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{log.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
