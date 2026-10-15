import { useState } from 'react';
import type { Product, ProductSerial } from '../../types/retailDaddy';
import { SerialNumberInwardModal } from '../pos/SerialNumberInwardModal';

interface PurchaseInwardViewProps {
  products: Product[];
  onAddStockInward: (barcode: string, addQty: number, newPurchasePrice?: number) => void;
  productSerials?: ProductSerial[];
  onAddProductSerials?: (serials: ProductSerial[]) => void;
}

interface PurchaseItemRow {
  id: string;
  product: Product;
  qty: number;
  price: number;
  total: number;
  altUnit?: string;
  variant?: string;
  serialNos: string[];
}

export function PurchaseInwardView({
  products,
  onAddStockInward,
  productSerials = [],
  onAddProductSerials
}: PurchaseInwardViewProps) {
  const [invoiceNo, setInvoiceNo] = useState('SHIB-0008-2024/25');
  const [invoiceDate, setInvoiceDate] = useState('25/02/2025');
  const [supplierName, setSupplierName] = useState('abc');
  const [supplierBalance, setSupplierBalance] = useState('77139.52 Cr');

  // Selected item entry state (matching Frame 0210/0215)
  const defaultProd = products.find(p => p.barcode === '3467') || products[0];
  const [selectedProduct, setSelectedProduct] = useState<Product>(defaultProd);
  const [entryQty, setEntryQty] = useState<number>(2);
  const [entryUnit, setEntryUnit] = useState<string>('KGS');
  const [entryPurchasePrice, setEntryPurchasePrice] = useState<number>(500);
  const [entrySalePrice, setEntrySalePrice] = useState<number>(900);
  const [entryWholesalePrice, setEntryWholesalePrice] = useState<number>(0);
  const [entryMrp, setEntryMrp] = useState<number>(900);
  const [entryTaxPercent, setEntryTaxPercent] = useState<number>(18);

  // Inward Purchase Lines
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemRow[]>([
    {
      id: 'pur-row-1',
      product: defaultProd,
      qty: 2,
      price: 500,
      total: 1000,
      altUnit: '',
      variant: '',
      serialNos: ['241227-UE0024', '241227-UE0023']
    }
  ]);

  // Serial Number Inward Modal State
  const [isSerialModalOpen, setIsSerialModalOpen] = useState(false);
  const [activeSerialRowId, setActiveSerialRowId] = useState<string>('pur-row-1');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const activeRow = purchaseItems.find(r => r.id === activeSerialRowId) || purchaseItems[0];

  const handleAddItemToPurchase = () => {
    const total = entryQty * entryPurchasePrice;
    const newRow: PurchaseItemRow = {
      id: `pur-${Date.now()}`,
      product: selectedProduct,
      qty: entryQty,
      price: entryPurchasePrice,
      total,
      altUnit: selectedProduct.salesAltUnit || '',
      variant: selectedProduct.size || '',
      serialNos: []
    };

    setPurchaseItems([...purchaseItems, newRow]);
    onAddStockInward(selectedProduct.barcode, entryQty, entryPurchasePrice);
    showToast(`✓ Added ${entryQty} x ${selectedProduct.name} to Purchase Invoice`);
  };

  const handleOpenSerialModal = (rowId: string) => {
    setActiveSerialRowId(rowId);
    setIsSerialModalOpen(true);
  };

  const handleSaveSerials = (serials: string[]) => {
    setPurchaseItems(prev =>
      prev.map(row => (row.id === activeSerialRowId ? { ...row, serialNos: serials } : row))
    );

    if (activeRow && onAddProductSerials) {
      const newSerials: ProductSerial[] = serials.filter(Boolean).map(sn => ({
        id: `sn-${Date.now()}-${Math.random()}`,
        productId: activeRow.product.id || 'prod-auto',
        productCode: activeRow.product.pCode || 'P-1240',
        productName: activeRow.product.name,
        barcode: activeRow.product.barcode,
        serialNo: sn,
        purchaseDate: invoiceDate,
        supplierName,
        status: 'AVAILABLE'
      }));
      onAddProductSerials(newSerials);
    }

    setIsSerialModalOpen(false);
    showToast(`✓ Registered ${serials.length} serial numbers for ${activeRow?.product.name} [Video 16 Frame 0230]`);
  };

  const totalBillAmount = purchaseItems.reduce((sum, item) => sum + item.total, 0);
  const totalCgst = (totalBillAmount * 0.09);
  const totalSgst = (totalBillAmount * 0.09);
  const grandTotal = totalBillAmount;

  return (
    <div className="rd-window" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '45px',
          right: '20px',
          background: '#065f46',
          color: '#ffffff',
          padding: '8px 16px',
          borderRadius: '4px',
          fontWeight: 'bold',
          fontSize: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          zIndex: 9999
        }}>
          {toastMessage}
        </div>
      )}

      {/* 1. TOP HEADER BAR (Video 16 Frame 0210/0215) */}
      <div style={{
        background: 'linear-gradient(180deg, #166534 0%, #14532d 100%)',
        color: '#ffffff',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', letterSpacing: '0.5px' }}>PURCHASE GST INVOICE</span>
          <input
            type="text"
            value={invoiceNo}
            onChange={e => setInvoiceNo(e.target.value)}
            style={{ background: '#22c55e', color: '#052e16', padding: '1px 8px', borderRadius: '3px', border: 'none', fontWeight: 'bold', width: '150px' }}
          />
          <span style={{ background: '#0284c7', color: '#ffffff', padding: '1px 6px', borderRadius: '3px', fontSize: '10px' }}>
            System Serials: {productSerials.length}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Date :</span>
          <input
            type="text"
            value={invoiceDate}
            onChange={e => setInvoiceDate(e.target.value)}
            style={{ width: '85px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', padding: '2px', borderRadius: '2px', border: 'none' }}
          />
        </div>
      </div>

      {/* 2. SUPPLIER BAR */}
      <div style={{
        background: '#e2e8f0',
        borderBottom: '1px solid #cbd5e1',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '11px'
      }}>
        <span style={{ fontWeight: 'bold' }}>👤 Supplier</span>
        <button
          type="button"
          style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          +
        </button>
        <input
          type="text"
          value={supplierName}
          onChange={e => setSupplierName(e.target.value)}
          style={{ width: '220px', padding: '3px 6px', fontWeight: 'bold', border: '1px solid #94a3b8', borderRadius: '3px' }}
        />
        <div style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Balance :
          <input
            type="text"
            value={supplierBalance}
            onChange={e => setSupplierBalance(e.target.value)}
            style={{ width: '90px', padding: '1px 4px', border: '1px solid #cbd5e1', borderRadius: '2px', color: '#dc2626', fontWeight: 'bold' }}
          />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className="rd-grid-btn"
            style={{ background: '#0284c7', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
            onClick={() => showToast('Listing past supplier purchase records')}
          >
            🛍️ Old Purchase
          </button>
          <button
            type="button"
            className="rd-grid-btn"
            style={{ background: '#4338ca', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
            onClick={() => showToast('Opening Product Master Entry [F2]')}
          >
            📦 New Product F2
          </button>
        </div>
      </div>

      {/* 3. PRODUCT INPUTS STRIP (MATCHING FRAME 0215) */}
      <div style={{
        background: '#f8fafc',
        borderBottom: '1px solid #cbd5e1',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        fontSize: '11px'
      }}>
        <span style={{ fontWeight: 'bold' }}>SEARCH BY PRODUCT NAME :</span>
        <select
          value={selectedProduct.id}
          onChange={e => {
            const p = products.find(x => x.id === e.target.value);
            if (p) {
              setSelectedProduct(p);
              setEntryPurchasePrice(p.purchasePrice || 500);
              setEntrySalePrice(p.retailPrice || 900);
              setEntryMrp(p.mrp || 900);
            }
          }}
          style={{ width: '180px', padding: '3px', fontWeight: 'bold', background: '#fef08a', border: '1px solid #ca8a04' }}
        >
          {products.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <span style={{ fontWeight: 'bold' }}>BARCODE :</span>
        <input
          type="text"
          value={selectedProduct.barcode}
          readOnly
          style={{ width: '80px', background: '#fef08a', fontWeight: 'bold', border: '1px solid #ca8a04', padding: '3px' }}
        />

        <span style={{ fontWeight: 'bold' }}>QTY :</span>
        <input
          type="number"
          value={entryQty}
          onChange={e => setEntryQty(Number(e.target.value))}
          style={{ width: '50px', fontWeight: 'bold', background: '#fef08a', border: '1px solid #ca8a04', padding: '3px', textAlign: 'center' }}
        />

        <span style={{ fontWeight: 'bold' }}>UNIT :</span>
        <select
          value={entryUnit}
          onChange={e => setEntryUnit(e.target.value)}
          style={{ width: '65px', padding: '3px', border: '1px solid #94a3b8' }}
        >
          <option value="KGS">KGS</option>
          <option value="PCS">PCS</option>
          <option value="NOS">NOS</option>
          <option value="BOX">BOX</option>
        </select>

        <span style={{ fontWeight: 'bold' }}>PURCHASE PRICE :</span>
        <input
          type="number"
          value={entryPurchasePrice}
          onChange={e => setEntryPurchasePrice(Number(e.target.value))}
          style={{ width: '65px', background: '#fef08a', fontWeight: 'bold', border: '1px solid #ca8a04', padding: '3px', textAlign: 'right' }}
        />

        <span style={{ fontWeight: 'bold' }}>SALE PRICE :</span>
        <input
          type="number"
          value={entrySalePrice}
          onChange={e => setEntrySalePrice(Number(e.target.value))}
          style={{ width: '65px', background: '#fef08a', fontWeight: 'bold', border: '1px solid #ca8a04', padding: '3px', textAlign: 'right' }}
        />

        <span style={{ fontWeight: 'bold' }}>WHOLESALE PRICE :</span>
        <input
          type="number"
          value={entryWholesalePrice}
          onChange={e => setEntryWholesalePrice(Number(e.target.value))}
          style={{ width: '55px', padding: '3px', textAlign: 'right', border: '1px solid #94a3b8' }}
        />

        <span style={{ fontWeight: 'bold' }}>TAX % :</span>
        <input
          type="number"
          value={entryTaxPercent}
          onChange={e => setEntryTaxPercent(Number(e.target.value))}
          style={{ width: '45px', padding: '3px', textAlign: 'right', border: '1px solid #94a3b8' }}
        />

        <span style={{ fontWeight: 'bold' }}>MRP :</span>
        <input
          type="number"
          value={entryMrp}
          onChange={e => setEntryMrp(Number(e.target.value))}
          style={{ width: '65px', background: '#fef08a', fontWeight: 'bold', border: '1px solid #ca8a04', padding: '3px', textAlign: 'right' }}
        />

        <button
          type="button"
          onClick={handleAddItemToPurchase}
          style={{
            background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '3px',
            padding: '4px 12px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          + Add Item
        </button>
      </div>

      {/* 4. MAIN PURCHASE TABLE WITH SERIAL NUMBER COLUMN (FRAME 0215) */}
      <div style={{ flex: 1, overflow: 'auto', background: '#e8ecef', padding: '8px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', background: '#ffffff', border: '1px solid #94a3b8' }}>
          <thead>
            <tr style={{ background: '#a3e635', color: '#166534', fontWeight: 'bold', borderBottom: '1px solid #84cc16' }}>
              <th style={{ width: '30px', padding: '6px 4px' }}></th>
              <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #84cc16' }}>Product</th>
              <th style={{ width: '60px', padding: '6px 4px', textAlign: 'center', borderRight: '1px solid #84cc16' }}>Qty</th>
              <th style={{ width: '80px', padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #84cc16' }}>Price</th>
              <th style={{ width: '90px', padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #84cc16' }}>Total</th>
              <th style={{ width: '70px', padding: '6px 4px', textAlign: 'center', borderRight: '1px solid #84cc16' }}>Alt Unit</th>
              <th style={{ width: '70px', padding: '6px 4px', textAlign: 'center', borderRight: '1px solid #84cc16' }}>Variant</th>
              <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #84cc16' }}>serial_no</th>
              <th style={{ width: '90px', padding: '6px 4px', textAlign: 'center' }}>Serial</th>
            </tr>
          </thead>
          <tbody>
            {purchaseItems.map((row, idx) => (
              <tr key={row.id} style={{ borderBottom: '1px solid #cbd5e1', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                <td style={{ textAlign: 'center', color: '#166534', fontWeight: 'bold' }}>▶</td>
                <td style={{ padding: '6px 8px', fontWeight: 'bold', borderRight: '1px solid #cbd5e1' }}>
                  {row.product.name}
                </td>
                <td style={{ textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #cbd5e1' }}>{row.qty}</td>
                <td style={{ textAlign: 'right', padding: '6px 4px', borderRight: '1px solid #cbd5e1' }}>₹{row.price.toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '6px 4px', fontWeight: 'bold', borderRight: '1px solid #cbd5e1' }}>₹{row.total.toFixed(2)}</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>{row.altUnit || '-'}</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>{row.variant || '-'}</td>
                <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: '10px', color: '#4338ca', fontWeight: 'bold', borderRight: '1px solid #cbd5e1' }}>
                  {row.serialNos.length > 0 ? row.serialNos.join(', ') : 'Click [Serial] to add'}
                </td>
                <td style={{ textAlign: 'center', padding: '4px' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenSerialModal(row.id)}
                    style={{
                      background: row.serialNos.length > 0 ? '#16a34a' : '#d97706',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '3px',
                      padding: '3px 8px',
                      fontWeight: 'bold',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    {row.serialNos.length > 0 ? `✓ Serial (${row.serialNos.length})` : 'Serial ⚙️'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5. CGST / SGST FLOATING BOXES */}
      <div style={{ display: 'flex', gap: '16px', padding: '6px 12px', background: '#f1f5f9', borderTop: '1px solid #cbd5e1', fontSize: '11px', fontWeight: 'bold' }}>
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', padding: '4px 10px', borderRadius: '3px' }}>
          CGST: ₹ {totalCgst.toFixed(2)}
        </div>
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', padding: '4px 10px', borderRadius: '3px' }}>
          SGST: ₹ {totalSgst.toFixed(2)}
        </div>
      </div>

      {/* 6. BOTTOM FINANCIAL SUMMARY & ACTION BUTTONS (FRAME 0215) */}
      <div style={{
        background: '#e2e8f0',
        borderTop: '2px solid #cbd5e1',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '11px',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        {/* Left Side: Summary table */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, auto)', gap: '8px', alignItems: 'center' }}>
          <div>
            <span style={{ fontWeight: 'bold' }}>Bill Discount :</span>
            <input type="text" readOnly value="0.00" style={{ width: '60px', marginLeft: '4px', textAlign: 'right', padding: '2px' }} />
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Total Bill Amt :</span>
            <input type="text" readOnly value={grandTotal.toFixed(2)} style={{ width: '70px', marginLeft: '4px', textAlign: 'right', fontWeight: 'bold', padding: '2px' }} />
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Round Off :</span>
            <input type="text" readOnly value="0" style={{ width: '40px', marginLeft: '4px', textAlign: 'center', padding: '2px' }} />
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Purchase Type :</span>
            <select style={{ marginLeft: '4px', padding: '2px' }}>
              <option value="Credit">Credit</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Total Paid :</span>
            <input type="text" readOnly value="0.00" style={{ width: '60px', marginLeft: '4px', textAlign: 'right', padding: '2px' }} />
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Balance :</span>
            <span style={{ marginLeft: '4px', color: '#dc2626', fontWeight: 'bold' }}>78139.52</span>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className="rd-grid-btn"
            style={{ background: '#3b82f6', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
            onClick={() => {
              setPurchaseItems([]);
              showToast('Cleared purchase invoice form');
            }}
          >
            📄 New
          </button>
          <button
            type="button"
            className="rd-grid-btn"
            style={{ background: '#0284c7', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
            onClick={() => showToast('Invoice updated successfully [F3]')}
          >
            🔄 Update F3
          </button>
          <button
            type="button"
            className="rd-grid-btn"
            style={{ background: '#dc2626', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
            onClick={() => {
              if (confirm('Delete current purchase line?')) {
                setPurchaseItems([]);
                showToast('Deleted purchase line');
              }
            }}
          >
            🗑️ Delete
          </button>
          <button
            type="button"
            className="rd-grid-btn"
            style={{ background: '#4338ca', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
            onClick={() => showToast('Opening Barcode Print format for purchased stock')}
          >
            🏷️ Print Barcode
          </button>
          <button
            type="button"
            className="rd-grid-btn"
            style={{ background: '#1e293b', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
            onClick={() => window.print()}
          >
            🖨️ Print F6
          </button>
          <button
            type="button"
            className="rd-grid-btn"
            style={{ background: '#16a34a', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
            onClick={() => {
              showToast(`✓ Purchase Invoice ${invoiceNo} saved! Stock & Serials registered.`);
            }}
          >
            💾 Save
          </button>
        </div>
      </div>

      {/* 7. SERIAL NUMBER INWARD MODAL (VIDEO 16 FRAMES 0215 & 0230) */}
      <SerialNumberInwardModal
        isOpen={isSerialModalOpen}
        onClose={() => setIsSerialModalOpen(false)}
        productCode={activeRow?.product.pCode || 'P-1240'}
        productName={activeRow?.product.name || 'Retsol printer'}
        barcode={activeRow?.product.barcode || '3467'}
        quantity={activeRow?.qty || 2}
        existingSerials={activeRow?.serialNos || []}
        onSaveSerials={handleSaveSerials}
      />
    </div>
  );
}
