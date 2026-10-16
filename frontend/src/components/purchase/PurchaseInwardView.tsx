import { useState } from 'react';
import type {
  Product,
  ProductSerial,
  ProductColumnSettings,
  InlineNewProductData,
  PurchaseRecordItem
} from '../../types/retailDaddy';
import { DEFAULT_PRODUCT_COLUMN_SETTINGS } from '../../data/retailDaddyData';
import { SerialNoEntryModal } from './SerialNoEntryModal';
import { ProductColumnSettingModal } from './ProductColumnSettingModal';
import { InlineNewProductModal } from './InlineNewProductModal';

interface PurchaseInwardViewProps {
  products: Product[];
  onAddStockInward: (barcode: string, addQty: number, newPurchasePrice?: number) => void;
  productSerials?: ProductSerial[];
  onAddProductSerials?: (serials: ProductSerial[]) => void;
  onOpenPurchaseDashboard?: () => void;
  onSavePurchaseInvoice?: (invoiceItem: PurchaseRecordItem) => void;
  onAddNewProduct?: (prod: Product) => void;
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
  onAddProductSerials,
  onOpenPurchaseDashboard,
  onSavePurchaseInvoice,
  onAddNewProduct
}: PurchaseInwardViewProps) {
  // Top tab toggle (Frame 0035: Purchase Entry | Dashboard)
  const [activeTab, setActiveTab] = useState<'ENTRY' | 'DASHBOARD'>('ENTRY');

  const [invoiceNo, setInvoiceNo] = useState('SHIB-0011-2024/25');
  const [invoiceDate, setInvoiceDate] = useState('03/03/2025');
  const [supplierName, setSupplierName] = useState('Delco Engineering');
  const [supplierBalance, setSupplierBalance] = useState('14915.52 Cr');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('12345');

  // Dynamic Column Settings (Frame 0235 frmProductSetting)
  const [columnSettings, setColumnSettings] = useState<ProductColumnSettings>(DEFAULT_PRODUCT_COLUMN_SETTINGS);
  const [isColumnSettingModalOpen, setIsColumnSettingModalOpen] = useState(false);

  // In-line New Product Registration (Frame 0240)
  const [isInlineNewProductOpen, setIsInlineNewProductOpen] = useState(false);

  // Selected item entry state (matching Frame 0210/0215)
  const defaultProd = products.find(p => p.barcode === '650841') || products[0];
  const [selectedProduct, setSelectedProduct] = useState<Product>(defaultProd);
  const [entryQty, setEntryQty] = useState<number>(2);
  const [entryUnit, setEntryUnit] = useState<string>('PCS');
  const [entryPurchasePrice, setEntryPurchasePrice] = useState<number>(1692.00);
  const [entrySalePrice, setEntrySalePrice] = useState<number>(1693.00);
  const [entryWholesalePrice, setEntryWholesalePrice] = useState<number>(852.00);
  const [entryMrp, setEntryMrp] = useState<number>(1697.00);
  const [entryTaxPercent, setEntryTaxPercent] = useState<number>(12);
  const [entryCessPercent, setEntryCessPercent] = useState<number>(0);
  const [entryBarcode, setEntryBarcode] = useState<string>('650841');

  // Inward Purchase Lines
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemRow[]>([
    {
      id: 'pur-row-1',
      product: defaultProd,
      qty: 2,
      price: 1692.00,
      total: 3384.00,
      altUnit: '',
      variant: '',
      serialNos: ['12345', '123456']
    }
  ]);

  // Serial Number Modal State (Frame 0345)
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
    showToast(`✓ Registered ${serials.length} serial numbers for ${activeRow?.product.name} [Video 06 Frame 0345]`);
  };

  // Handle in-line new product inserted (Frame 0240)
  const handleInsertInlineProduct = (pData: InlineNewProductData) => {
    const newProd: Product = {
      id: `prod-${Date.now()}`,
      pCode: pData.pCode,
      name: pData.name,
      purchasePrice: pData.purchasePrice,
      cessPercent: pData.cessPercent,
      openingStock: pData.openingStock,
      barcode: pData.barcode,
      mrp: pData.mrp,
      retailPrice: pData.retailPrice,
      wholesalePrice: pData.retailPrice * 0.9,
      category: 'GENERAL',
      subCategory: 'OTHERS',
      size: pData.size,
      colour: pData.colour,
      cgst: 6,
      sgst: 6,
      igst: 0,
      sTax: 'Inclusive',
      pTax: 'Inclusive'
    };

    if (onAddNewProduct) {
      onAddNewProduct(newProd);
    }

    // Set as active selected product
    setSelectedProduct(newProd);
    setEntryPurchasePrice(pData.purchasePrice);
    setEntrySalePrice(pData.retailPrice);
    setEntryMrp(pData.mrp);
    setEntryQty(pData.openingStock > 0 ? pData.openingStock : 1);
    setEntryBarcode(pData.barcode);

    // Automatically add to purchase grid
    const total = (pData.openingStock > 0 ? pData.openingStock : 1) * pData.purchasePrice;
    setPurchaseItems(prev => [
      ...prev,
      {
        id: `pur-inline-${Date.now()}`,
        product: newProd,
        qty: pData.openingStock > 0 ? pData.openingStock : 1,
        price: pData.purchasePrice,
        total,
        altUnit: '',
        variant: pData.size || '',
        serialNos: []
      }
    ]);

    showToast(`✓ Inserted ${pData.name} (${pData.colour || ''} ${pData.size || ''}) directly to purchase grid!`);
  };

  const totalBillAmount = purchaseItems.reduce((sum, item) => sum + item.total, 0);
  const totalCgst = totalBillAmount * 0.06;
  const totalSgst = totalBillAmount * 0.06;
  const grandTotal = totalBillAmount + totalCgst + totalSgst;

  const handleSaveInvoice = () => {
    if (purchaseItems.length === 0) {
      alert('Cannot save empty purchase invoice. Please add items.');
      return;
    }

    if (onSavePurchaseInvoice) {
      purchaseItems.forEach((item, idx) => {
        const purRecord: PurchaseRecordItem = {
          id: `pur-save-${Date.now()}-${idx}`,
          invoiceNo,
          invoiceDate,
          taxType: 'GST',
          supplierInvoiceNo: supplierInvoiceNo || 'INV-001',
          supplierInvoiceDate: invoiceDate,
          supplierName,
          state: 'Kerala',
          gstin: '32AAACD1234F1Z5',
          productCode: item.product.pCode || `P-${idx}`,
          productName: item.product.name,
          hsnCode: item.product.hsn || '80051',
          barcode: item.product.barcode,
          qty: item.qty,
          unit: item.product.salesUnit || 'PCS',
          purchasePrice: item.price,
          mrp: item.product.mrp || item.price * 1.2,
          retailPrice: item.product.retailPrice || item.price * 1.1,
          wholesalePrice: item.product.wholesalePrice || item.price * 1.05,
          taxableAmount: item.total,
          cgstPercent: 6,
          cgstAmount: item.total * 0.06,
          sgstPercent: 6,
          sgstAmount: item.total * 0.06,
          igstPercent: 0,
          igstAmount: 0,
          cessPercent: 0,
          cessAmount: 0,
          totalAmount: item.total * 1.12,
          colour: item.product.colour,
          size: item.product.size,
          serialNumbers: item.serialNos
        };
        onSavePurchaseInvoice(purRecord);
      });
    }

    showToast(`✓ Purchase Invoice ${invoiceNo} saved successfully! Synced to Purchase Dashboard.`);
  };

  return (
    <div className="rd-window" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
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
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Frame 0035: Top Tab Bar (Purchase Entry | Dashboard) */}
      <div
        style={{
          background: '#cbd5e1',
          padding: '4px 8px 0 8px',
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid #94a3b8'
        }}
      >
        <button
          onClick={() => setActiveTab('ENTRY')}
          style={{
            padding: '4px 16px',
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: activeTab === 'ENTRY' ? '#ffffff' : '#e2e8f0',
            color: activeTab === 'ENTRY' ? '#1e3a8a' : '#64748b',
            borderTop: '2px solid #2563eb',
            borderLeft: '1px solid #94a3b8',
            borderRight: '1px solid #94a3b8',
            borderBottom: activeTab === 'ENTRY' ? '1px solid #ffffff' : 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer'
          }}
        >
          Purchase Entry
        </button>
        <button
          onClick={() => {
            if (onOpenPurchaseDashboard) {
              onOpenPurchaseDashboard();
            }
          }}
          style={{
            padding: '4px 16px',
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: '#e2e8f0',
            color: '#0369a1',
            borderTop: '2px solid transparent',
            borderLeft: '1px solid #94a3b8',
            borderRight: '1px solid #94a3b8',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer'
          }}
          title="Open Purchase Dashboard Analytics (Frame 0060)"
        >
          📊 Dashboard ➔
        </button>
      </div>

      {/* 1. GREEN HEADER BAR: PURCHASE GST INVOICE */}
      <div
        style={{
          background: 'linear-gradient(180deg, #15803d 0%, #166534 100%)',
          color: '#ffffff',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', letterSpacing: '0.5px' }}>PURCHASE GST INVOICE</span>
          <input
            type="text"
            value={invoiceNo}
            onChange={e => setInvoiceNo(e.target.value)}
            style={{
              background: '#22c55e',
              color: '#052e16',
              padding: '1px 8px',
              borderRadius: '3px',
              border: 'none',
              fontWeight: 'bold',
              width: '160px'
            }}
          />
          <span
            style={{
              background: '#0284c7',
              color: '#ffffff',
              padding: '1px 6px',
              borderRadius: '3px',
              fontSize: '10px'
            }}
          >
            System Serials: {productSerials.length}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Date :</span>
          <input
            type="text"
            value={invoiceDate}
            onChange={e => setInvoiceDate(e.target.value)}
            style={{
              width: '85px',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 'bold',
              padding: '2px',
              borderRadius: '2px',
              border: 'none'
            }}
          />
        </div>
      </div>

      {/* 2. SUPPLIER BAR (Frame 0035 & 0120) */}
      <div
        style={{
          background: '#e2e8f0',
          borderBottom: '1px solid #cbd5e1',
          padding: '6px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '11px',
          flexWrap: 'wrap'
        }}
      >
        <span style={{ fontWeight: 'bold' }}>👤 Supplier</span>
        <select
          value={supplierName}
          onChange={e => {
            setSupplierName(e.target.value);
            if (e.target.value === 'Delco Engineering') {
              setSupplierBalance('14915.52 Cr');
              setSupplierInvoiceNo('12345');
            } else if (e.target.value === 'Gindal supplier') {
              setSupplierBalance('0.00 Cr');
              setSupplierInvoiceNo('GS-771');
            } else if (e.target.value === 'abc') {
              setSupplierBalance('494152.32 Cr');
              setSupplierInvoiceNo('ABC-901');
            }
          }}
          style={{
            width: '180px',
            padding: '3px 6px',
            fontWeight: 'bold',
            border: '1px solid #94a3b8',
            borderRadius: '3px'
          }}
        >
          <option value="Delco Engineering">Delco Engineering</option>
          <option value="Gindal supplier">Gindal supplier</option>
          <option value="abc">abc supplier</option>
          <option value="National Timber Mart">National Timber Mart</option>
        </select>

        <div style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Balance :
          <input
            type="text"
            value={supplierBalance}
            onChange={e => setSupplierBalance(e.target.value)}
            style={{
              width: '110px',
              padding: '1px 4px',
              border: '1px solid #cbd5e1',
              borderRadius: '2px',
              color: '#dc2626',
              fontWeight: 'bold'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontWeight: 600, color: '#475569' }}>Invoice No:</span>
          <input
            type="text"
            value={supplierInvoiceNo}
            onChange={e => setSupplierInvoiceNo(e.target.value)}
            placeholder="12345"
            style={{
              width: '90px',
              padding: '2px 4px',
              border: '1px solid #94a3b8',
              borderRadius: '2px',
              fontWeight: 700
            }}
          />
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            type="button"
            className="rd-grid-btn"
            style={{ background: '#0284c7', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
            onClick={() => {
              if (onOpenPurchaseDashboard) {
                onOpenPurchaseDashboard();
              }
            }}
          >
            🛍️ Old Purchase
          </button>
          <button
            type="button"
            className="rd-grid-btn"
            style={{
              background: '#581c87',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 'bold',
              border: '1px solid #9333ea'
            }}
            onClick={() => setIsInlineNewProductOpen(true)}
            title="Fast In-line Product Registration (Video 06 Frame 0240)"
          >
            📦 New Product F2
          </button>
        </div>
      </div>

      {/* 3. PRODUCT INPUTS STRIP (MATCHING FRAME 0120 & 0215) */}
      <div
        style={{
          background: '#f8fafc',
          borderBottom: '1px solid #cbd5e1',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          fontSize: '11px'
        }}
      >
        <span style={{ fontWeight: 'bold' }}>SEARCH BY PRODUCT NAME :</span>
        <select
          value={selectedProduct.id}
          onChange={e => {
            const p = products.find(x => x.id === e.target.value);
            if (p) {
              setSelectedProduct(p);
              setEntryPurchasePrice(p.purchasePrice || 1692.00);
              setEntrySalePrice(p.retailPrice || 1693.00);
              setEntryWholesalePrice(p.wholesalePrice || 852.00);
              setEntryMrp(p.mrp || 1697.00);
              setEntryBarcode(p.barcode || '650841');
              setEntryUnit(p.salesUnit || 'PCS');
            }
          }}
          style={{ width: '180px', padding: '3px', fontWeight: 'bold', border: '1px solid #ca8a04', background: '#fef08a' }}
        >
          {products.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} {p.colour ? `(${p.colour} ${p.size || ''})` : ''}
            </option>
          ))}
        </select>

        <span style={{ fontWeight: 'bold' }}>BARCODE :</span>
        <input
          type="text"
          value={entryBarcode}
          onChange={e => setEntryBarcode(e.target.value)}
          style={{
            width: '80px',
            background: '#fef08a',
            fontWeight: 'bold',
            border: '1px solid #ca8a04',
            padding: '3px'
          }}
        />

        <span style={{ fontWeight: 'bold' }}>QTY :</span>
        <input
          type="number"
          value={entryQty}
          onChange={e => setEntryQty(Number(e.target.value))}
          style={{
            width: '50px',
            fontWeight: 'bold',
            background: '#fef08a',
            border: '1px solid #ca8a04',
            padding: '3px',
            textAlign: 'center'
          }}
        />

        <span style={{ fontWeight: 'bold' }}>UNIT :</span>
        <select
          value={entryUnit}
          onChange={e => setEntryUnit(e.target.value)}
          style={{ width: '65px', padding: '3px', border: '1px solid #94a3b8' }}
        >
          <option value="PCS">PCS</option>
          <option value="KGS">KGS</option>
          <option value="NOS">NOS</option>
          <option value="BOX">BOX</option>
          <option value="BTL">BTL</option>
        </select>

        <span style={{ fontWeight: 'bold' }}>PURCHASE PRICE :</span>
        <input
          type="number"
          value={entryPurchasePrice}
          onChange={e => setEntryPurchasePrice(Number(e.target.value))}
          style={{
            width: '75px',
            background: '#fef08a',
            fontWeight: 'bold',
            border: '1px solid #ca8a04',
            padding: '3px',
            textAlign: 'right'
          }}
        />

        <span style={{ fontWeight: 'bold' }}>SALE PRICE :</span>
        <input
          type="number"
          value={entrySalePrice}
          onChange={e => setEntrySalePrice(Number(e.target.value))}
          style={{
            width: '75px',
            background: '#fef08a',
            fontWeight: 'bold',
            border: '1px solid #ca8a04',
            padding: '3px',
            textAlign: 'right'
          }}
        />

        {columnSettings.wSalePrice && (
          <>
            <span style={{ fontWeight: 'bold' }}>WHOLESALE :</span>
            <input
              type="number"
              value={entryWholesalePrice}
              onChange={e => setEntryWholesalePrice(Number(e.target.value))}
              style={{ width: '65px', padding: '3px', textAlign: 'right', border: '1px solid #94a3b8' }}
            />
          </>
        )}

        {columnSettings.cgst && (
          <>
            <span style={{ fontWeight: 'bold' }}>TAX % :</span>
            <input
              type="number"
              value={entryTaxPercent}
              onChange={e => setEntryTaxPercent(Number(e.target.value))}
              style={{ width: '45px', padding: '3px', textAlign: 'right', border: '1px solid #94a3b8' }}
            />
            <span style={{ fontWeight: 'bold' }}>CESS % :</span>
            <input
              type="number"
              value={entryCessPercent}
              onChange={e => setEntryCessPercent(Number(e.target.value))}
              style={{ width: '45px', padding: '3px', textAlign: 'right', border: '1px solid #94a3b8' }}
            />
          </>
        )}

        <span style={{ fontWeight: 'bold' }}>MRP :</span>
        <input
          type="number"
          value={entryMrp}
          onChange={e => setEntryMrp(Number(e.target.value))}
          style={{
            width: '70px',
            background: '#fef08a',
            fontWeight: 'bold',
            border: '1px solid #ca8a04',
            padding: '3px',
            textAlign: 'right'
          }}
        />

        <button
          type="button"
          onClick={handleAddItemToPurchase}
          style={{
            background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '3px',
            padding: '4px 14px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          + Add Item
        </button>
      </div>

      {/* 4. MAIN PURCHASE TABLE WITH SERIAL NUMBER COLUMN (FRAME 0035, 0215, 0345) */}
      <div style={{ flex: 1, overflow: 'auto', background: '#e8ecef', padding: '8px' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11px',
            background: '#ffffff',
            border: '1px solid #94a3b8'
          }}
        >
          <thead>
            <tr
              style={{
                background: '#a3e635',
                color: '#166534',
                fontWeight: 'bold',
                borderBottom: '1px solid #84cc16'
              }}
            >
              <th style={{ width: '30px', padding: '6px 4px' }}></th>
              <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #84cc16' }}>Product</th>
              <th style={{ width: '60px', padding: '6px 4px', textAlign: 'center', borderRight: '1px solid #84cc16' }}>Qty</th>
              <th style={{ width: '80px', padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #84cc16' }}>Price</th>
              <th style={{ width: '90px', padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #84cc16' }}>Total</th>
              <th style={{ width: '70px', padding: '6px 4px', textAlign: 'center', borderRight: '1px solid #84cc16' }}>Alt Unit</th>
              {columnSettings.size && (
                <th style={{ width: '75px', padding: '6px 4px', textAlign: 'center', borderRight: '1px solid #84cc16' }}>Variant / Size</th>
              )}
              {columnSettings.colour && (
                <th style={{ width: '70px', padding: '6px 4px', textAlign: 'center', borderRight: '1px solid #84cc16' }}>Colour</th>
              )}
              <th style={{ padding: '6px 8px', textAlign: 'left', borderRight: '1px solid #84cc16' }}>serial_no</th>
              <th style={{ width: '100px', padding: '6px 4px', textAlign: 'center' }}>Serial</th>
            </tr>
          </thead>
          <tbody>
            {purchaseItems.map((row, idx) => (
              <tr
                key={row.id}
                style={{
                  borderBottom: '1px solid #cbd5e1',
                  background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                }}
              >
                <td style={{ textAlign: 'center', color: '#166534', fontWeight: 'bold' }}>▶</td>
                <td style={{ padding: '6px 8px', fontWeight: 'bold', borderRight: '1px solid #cbd5e1' }}>
                  {row.product.name}
                </td>
                <td style={{ textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #cbd5e1' }}>{row.qty}</td>
                <td style={{ textAlign: 'right', padding: '6px 4px', borderRight: '1px solid #cbd5e1' }}>₹{row.price.toFixed(2)}</td>
                <td style={{ textAlign: 'right', padding: '6px 4px', fontWeight: 'bold', borderRight: '1px solid #cbd5e1' }}>₹{row.total.toFixed(2)}</td>
                <td style={{ textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>{row.altUnit || '-'}</td>
                {columnSettings.size && (
                  <td style={{ textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                    {row.product.size || row.variant || '-'}
                  </td>
                )}
                {columnSettings.colour && (
                  <td style={{ textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                    {row.product.colour ? (
                      <span
                        style={{
                          backgroundColor:
                            row.product.colour.toUpperCase() === 'YELLOW' ? '#fef08a' : '#e2e8f0',
                          padding: '1px 6px',
                          borderRadius: '2px',
                          fontWeight: 700
                        }}
                      >
                        {row.product.colour}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                )}
                <td
                  style={{
                    padding: '6px 8px',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    color: '#4338ca',
                    fontWeight: 'bold',
                    borderRight: '1px solid #cbd5e1'
                  }}
                >
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
      <div
        style={{
          display: 'flex',
          gap: '16px',
          padding: '6px 12px',
          background: '#f1f5f9',
          borderTop: '1px solid #cbd5e1',
          fontSize: '11px',
          fontWeight: 'bold'
        }}
      >
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', padding: '4px 10px', borderRadius: '3px' }}>
          CGST: ₹ {totalCgst.toFixed(2)}
        </div>
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', padding: '4px 10px', borderRadius: '3px' }}>
          SGST: ₹ {totalSgst.toFixed(2)}
        </div>
        <div style={{ background: '#fef08a', border: '1px solid #eab308', padding: '4px 10px', borderRadius: '3px', color: '#854d0e' }}>
          Taxable Amt: ₹ {totalBillAmount.toFixed(2)}
        </div>
      </div>

      {/* 6. BOTTOM FINANCIAL SUMMARY & ACTION BUTTONS (FRAME 0035 & 0215) */}
      <div
        style={{
          background: '#e2e8f0',
          borderTop: '2px solid #cbd5e1',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        {/* Left Side: Frame 0035 Bottom-Left Buttons (Import, Product Setting, Purchase Order) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className="rd-grid-btn"
            style={{
              background: '#ffffff',
              color: '#15803d',
              border: '1px solid #86efac',
              fontWeight: 700,
              fontSize: '11px',
              padding: '4px 8px',
              cursor: 'pointer'
            }}
            onClick={() => showToast('Opening Excel Purchase Inward file import...')}
          >
            📑 Import
          </button>
          <button
            type="button"
            className="rd-grid-btn"
            style={{
              background: '#fef9c3',
              color: '#854d0e',
              border: '1px solid #facc15',
              fontWeight: 700,
              fontSize: '11px',
              padding: '4px 8px',
              cursor: 'pointer'
            }}
            onClick={() => setIsColumnSettingModalOpen(true)}
            title="Configure visible columns: Size, Colour, Batch, IMEI, Rack, Godown (Video 06 Frame 0235)"
          >
            ⚙️ Product Setting
          </button>
          <button
            type="button"
            className="rd-grid-btn"
            style={{
              background: '#ffffff',
              color: '#0369a1',
              border: '1px solid #7dd3fc',
              fontWeight: 700,
              fontSize: '11px',
              padding: '4px 8px',
              cursor: 'pointer'
            }}
            onClick={() => showToast('Loading pending Purchase Orders for Delco Engineering...')}
          >
            🛒 Purchase Order
          </button>
        </div>

        {/* Center: Financial Breakdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div>
            <span style={{ fontWeight: 'bold' }}>Bill Disc :</span>
            <input
              type="text"
              readOnly
              value="0.00"
              style={{ width: '45px', marginLeft: '4px', textAlign: 'right', padding: '2px' }}
            />
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Total Bill Amt :</span>
            <input
              type="text"
              readOnly
              value={grandTotal.toFixed(2)}
              style={{
                width: '75px',
                marginLeft: '4px',
                textAlign: 'right',
                fontWeight: 'bold',
                padding: '2px',
                color: '#0f172a'
              }}
            />
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Purchase Type :</span>
            <select style={{ marginLeft: '4px', padding: '2px' }}>
              <option value="Credit">Credit</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Balance :</span>
            <span style={{ marginLeft: '4px', color: '#dc2626', fontWeight: 'bold' }}>{supplierBalance}</span>
          </div>
        </div>

        {/* Right Side: Action Buttons (Frame 0035) */}
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
              if (confirm('Delete current purchase lines?')) {
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
            onClick={handleSaveInvoice}
          >
            💾 Save
          </button>
        </div>
      </div>

      {/* 7. SERIAL NUMBER ENTRY MODAL (VIDEO 06 FRAME 0345) */}
      <SerialNoEntryModal
        isOpen={isSerialModalOpen}
        onClose={() => setIsSerialModalOpen(false)}
        productCode={activeRow?.product.pCode || 'P-0842'}
        productName={activeRow?.product.name || 'SALAD CHIPS'}
        barcode={activeRow?.product.barcode || '650841'}
        quantity={activeRow?.qty || 5}
        existingSerials={activeRow?.serialNos || []}
        onSaveSerials={handleSaveSerials}
      />

      {/* 8. PRODUCT COLUMN SETTINGS MODAL (VIDEO 06 FRAME 0235) */}
      <ProductColumnSettingModal
        isOpen={isColumnSettingModalOpen}
        onClose={() => setIsColumnSettingModalOpen(false)}
        settings={columnSettings}
        onSaveSettings={newSettings => {
          setColumnSettings(newSettings);
          showToast('Updated visible purchase grid columns!');
        }}
      />

      {/* 9. IN-LINE NEW PRODUCT MODAL (VIDEO 06 FRAME 0240) */}
      <InlineNewProductModal
        isOpen={isInlineNewProductOpen}
        onClose={() => setIsInlineNewProductOpen(false)}
        onInsertProduct={handleInsertInlineProduct}
      />
    </div>
  );
}
