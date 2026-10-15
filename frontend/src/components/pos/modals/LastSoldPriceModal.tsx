import React, { useState } from 'react';
import type { Customer, ProductItem } from '../../../types/pos';

interface HistoryRecord {
  id: string;
  invoiceNo: string;
  date: string;
  productName: string;
  barcode: string;
  qty: number;
  rate: number;
  discountAmt: number;
  netRate: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  currentProduct?: ProductItem | null;
  onApplyPrice: (price: number) => void;
}

export const LastSoldPriceModal: React.FC<Props> = ({
  isOpen,
  onClose,
  customer,
  currentProduct,
  onApplyPrice
}) => {
  const [searchTerm, setSearchTerm] = useState(currentProduct?.name || '');

  if (!isOpen) return null;

  // Realistic historical sales for the customer
  const mockHistory: HistoryRecord[] = [
    {
      id: 'h-1',
      invoiceNo: 'GST-0002-2026/27',
      date: '28/03/2026',
      productName: 'Teak Wood 6-Seater Royal Dining Table Set',
      barcode: '1214',
      qty: 1,
      rate: 42000,
      discountAmt: 1000,
      netRate: 41000
    },
    {
      id: 'h-2',
      invoiceNo: 'GST-0005-2026/27',
      date: '10/04/2026',
      productName: 'Teak Wood 6-Seater Royal Dining Table Set',
      barcode: '1214',
      qty: 2,
      rate: 42000,
      discountAmt: 2000,
      netRate: 40000
    },
    {
      id: 'h-3',
      invoiceNo: 'GST-0001-2026/27',
      date: '15/02/2026',
      productName: 'Ergonomic High-Back Executive Mesh Office Chair',
      barcode: '1228',
      qty: 4,
      rate: 8900,
      discountAmt: 400,
      netRate: 8500
    },
    {
      id: 'h-4',
      invoiceNo: 'GST-0004-2026/27',
      date: '02/04/2026',
      productName: 'Solid Teak Wood Timber / Planks (Per Kg / CFT)',
      barcode: '1240',
      qty: 25,
      rate: 3000,
      discountAmt: 200,
      netRate: 2800
    }
  ];

  const filtered = mockHistory.filter(h => 
    !searchTerm || h.productName.toLowerCase().includes(searchTerm.toLowerCase()) || h.barcode.includes(searchTerm)
  );

  return (
    <div className="rd-modal-backdrop">
      <div className="rd-form-window" style={{ width: '780px', maxWidth: '96vw' }}>
        <div className="rd-form-titlebar" style={{ background: '#0284c7', color: '#fff' }}>
          <span>Customer Last Sold Price History (Ctrl+H)</span>
          <button className="rd-win-btn close" onClick={onClose} style={{ color: '#fff' }}>✕</button>
        </div>

        <div style={{ padding: '14px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '8px 12px', borderRadius: '4px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span>Customer: <strong>{customer.name}</strong> ({customer.contactNo})</span>
              <span style={{ marginLeft: '12px', color: '#64748b' }}>Account: {customer.code} • Bal: ₹{customer.currentBalance} {customer.balanceType}</span>
            </div>
            <div style={{ fontSize: '10px', color: '#0369a1', fontWeight: 700 }}>
              ShortCut: Ctrl + H
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700 }}>Search Past Item:</span>
            <input 
              type="text" 
              placeholder="Search product name or barcode..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="rd-input-yellow"
              style={{ flex: 1, padding: '4px 8px', fontSize: '12px' }}
            />
          </div>

          <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid #cbd5e1', background: '#fff' }}>
            <table className="rd-grid-table" style={{ width: '100%', fontSize: '11px' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Bill No</th>
                  <th>Product Name</th>
                  <th className="numeric">Qty</th>
                  <th className="numeric">Billed Rate</th>
                  <th className="numeric">Discount</th>
                  <th className="numeric">Net Rate</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id}>
                    <td>{row.date}</td>
                    <td style={{ fontWeight: 600 }}>{row.invoiceNo}</td>
                    <td>{row.productName}</td>
                    <td className="numeric">{row.qty}</td>
                    <td className="numeric">₹ {row.rate}</td>
                    <td className="numeric">₹ {row.discountAmt}</td>
                    <td className="numeric" style={{ fontWeight: 800, color: '#16a34a' }}>₹ {row.netRate}</td>
                    <td>
                      <button 
                        style={{ padding: '2px 8px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '3px', fontWeight: 700, fontSize: '10px', cursor: 'pointer' }}
                        onClick={() => {
                          onApplyPrice(row.netRate);
                          onClose();
                        }}
                      >
                        Apply ₹{row.netRate}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                      No prior sales recorded for this customer matching "{searchTerm}".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button className="rd-classic-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};
